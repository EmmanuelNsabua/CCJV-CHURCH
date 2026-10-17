import { and, asc, count, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Publication } from "@/domain/entities";
import { planPublication } from "@/domain/rules/publication-quota";
import type {
  ListOptions,
  ListResult,
  PublicationFilters,
  PublicationInput,
  PublicationRepository,
  PublicationSortColumn,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import {
  media,
  publications,
} from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Implémentation Drizzle du contrat `PublicationRepository`.
 *
 * Deux points de vigilance :
 *
 * 1. La **visibilité** est explicite : `findByIdOrSlug(value, includeDrafts)`
 *    refuse les brouillons quand `includeDrafts` vaut `false`. Une lecture
 *    publique ne peut donc pas exposer un contenu dépublié, même si l'appelant
 *    se trompe de filtre (`status` est un filtre de liste, pas une garde).
 * 2. `published_at` est une colonne `date` : elle reste une chaîne
 *    `YYYY-MM-DD`, jamais un objet `Date` (pas de décalage de fuseau).
 */

type PublicationRow = typeof publications.$inferSelect;
type PublicationPatch = Partial<typeof publications.$inferInsert>;

interface PublicationSort {
  column: PublicationSortColumn;
  direction: "asc" | "desc";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** URL publiques des médias demandés — une requête, jamais une par ligne. */
async function loadMediaUrls(
  db: Database,
  mediaIds: readonly string[],
): Promise<Map<string, string>> {
  if (mediaIds.length === 0) return new Map();

  const rows = await db
    .select({ id: media.id, publicUrl: media.publicUrl })
    .from(media)
    .where(inArray(media.id, [...mediaIds]));

  return new Map(rows.map((row) => [row.id, row.publicUrl] as const));
}

export class DrizzlePublicationRepository implements PublicationRepository {
  constructor(private readonly db: Database) {}

  async list(
    options: ListOptions,
    filters: PublicationFilters,
    sort: PublicationSort,
  ): Promise<ListResult<Publication>> {
    const where = this.buildFilters(filters);

    const rows = await this.db
      .select()
      .from(publications)
      .where(where)
      .orderBy(...this.buildOrder(sort))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db
      .select({ value: count() })
      .from(publications)
      .where(where);

    return { items: await this.hydrate(rows), total: totals?.value ?? 0 };
  }

  async findById(id: string): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const rows = await this.db
      .select()
      .from(publications)
      .where(eq(publications.id, id))
      .limit(1);

    const [publication] = await this.hydrate(rows);
    return publication ?? null;
  }

  async findByIdOrSlug(
    value: string,
    includeDrafts: boolean,
  ): Promise<Publication | null> {
    const identity = isUuid(value)
      ? eq(publications.id, value)
      : eq(publications.slug, value);

    // Un brouillon n'est jamais renvoyé à une lecture publique : la garde est
    // ici, au plus près de la base, et non dans un contrôleur.
    const where = includeDrafts
      ? identity
      : and(identity, eq(publications.status, "PUBLISHED"));

    const rows = await this.db
      .select()
      .from(publications)
      .where(where)
      .limit(1);

    const [publication] = await this.hydrate(rows);
    return publication ?? null;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const condition =
      exceptId === undefined
        ? eq(publications.slug, slug)
        : and(eq(publications.slug, slug), ne(publications.id, exceptId));

    const rows = await this.db
      .select({ id: publications.id })
      .from(publications)
      .where(condition)
      .limit(1);

    return rows.length > 0;
  }

  async create(data: PublicationInput, slug: string): Promise<Publication> {
    const [row] = await this.db
      .insert(publications)
      .values({
        title: data.title,
        slug,
        type: data.type,
        category: data.category,
        status: data.status ?? "PUBLISHED",
        contentUrl: data.contentUrl ?? null,
        coverMediaId: data.coverMediaId ?? null,
        description: data.description ?? null,
        body: data.body ?? null,
        author: data.author ?? null,
        publishedAt: data.publishedAt,
        // Département **responsable** : obligatoire (D-02, D-06). Il est transmis
        // tel quel — jamais converti en `NULL` à l'aveugle : une omission doit
        // échouer explicitement plutôt que produire une publication sans
        // responsable, état que la base refuse.
        departmentId: data.departmentId,
        archivedAt: data.archivedAt ?? null,
      })
      .returning();

    if (row === undefined) {
      throw new InternalError("La publication n'a pas pu être créée");
    }

    const created = await this.findById(row.id);
    if (created === null) {
      throw new InternalError("La publication créée est introuvable");
    }

    return created;
  }

  async update(
    id: string,
    data: Partial<PublicationInput>,
  ): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const patch: PublicationPatch = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.type !== undefined) patch.type = data.type;
    if (data.category !== undefined) patch.category = data.category;
    if (data.status !== undefined) patch.status = data.status;
    if (data.contentUrl !== undefined) patch.contentUrl = data.contentUrl;
    if (data.coverMediaId !== undefined) patch.coverMediaId = data.coverMediaId;
    if (data.description !== undefined) patch.description = data.description;
    if (data.body !== undefined) patch.body = data.body;
    if (data.author !== undefined) patch.author = data.author;
    if (data.publishedAt !== undefined) patch.publishedAt = data.publishedAt;

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(publications)
        .set(patch)
        .where(eq(publications.id, id));
    }

    return this.findById(id);
  }

  /**
   * Publie ou archive une publication — écriture **d'attente**, jamais une saisie.
   *
   * `archivedAt` est posé **en même temps** que le statut : une publication
   * `ARCHIVED` sans date serait un état incohérent, et la date est ce qui permet
   * de distinguer un archivage volontaire d'un archivage par quota.
   * L'irréversibilité (D-18) n'est pas vérifiée ici : elle l'est par
   * `PublicationPolicy`, qui refuse toute action sur une archive, et par le refus
   * d'un `UNARCHIVE` pour tout le monde.
   */
  async applyLifecycle(
    id: string,
    change: { status: "PUBLISHED" | "ARCHIVED"; at: Date },
  ): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const [row] = await this.db
      .update(publications)
      .set({
        status: change.status,
        archivedAt: change.status === "ARCHIVED" ? change.at : null,
        updatedAt: change.at,
      })
      .where(eq(publications.id, id))
      .returning();

    return row === undefined ? null : this.findById(row.id);
  }

  /**
   * Publie **en appliquant la règle globale des 3** (`docs/035` §1).
   *
   * Trois mécanismes, et aucun n'est décoratif :
   *
   * 1. **transaction** — la place libérée et la publication prennent effet
   *    ensemble. Un échec au milieu laisserait sinon le site à deux publications
   *    en ligne sans que la troisième soit arrivée ;
   * 2. **verrou d'avis** (`pg_advisory_xact_lock`) — sérialise les publications
   *    concurrentes. Sans lui, deux requêtes simultanées liraient le même compte
   *    et concluraient chacune qu'il reste une place : quatre publications en
   *    ligne, exactement ce que la règle interdit. Un verrou de ligne ne suffit
   *    pas — la règle porte sur l'**ensemble** de la table, pas sur une ligne ;
   * 3. **plan issu du domaine** — `planPublication` est pur et éprouvé cas par
   *    cas (départage par `id`, brouillons non comptés, republication sans coût).
   *    Le repository **exécute**, il ne décide pas.
   *
   * Le verrou est libéré avec la transaction, quelle qu'en soit l'issue : un échec
   * ne laisse pas le quota verrouillé.
   *
   * La publication rendue est **relue dans la transaction** (voir le commentaire
   * en fin de méthode) : une relecture par `this.findById` passerait par une autre
   * connexion du pool et rendrait l'état d'avant l'écriture.
   */
  async publishWithQuota(id: string, publishedAt: string): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    return this.db.transaction(async (tx) => {
      // Verrou d'avis **de transaction** : libéré automatiquement, y compris en
      // cas de rejet, là où un `pg_advisory_lock` manuel fuirait sur exception.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('publications.quota'))`);

      const published = await tx
        .select({
          id: publications.id,
          status: publications.status,
          publishedAt: publications.publishedAt,
        })
        .from(publications)
        .where(eq(publications.status, "PUBLISHED"));

      const plan = planPublication(published, id);

      if (plan.toArchive !== null) {
        await tx
          .update(publications)
          .set({ status: "ARCHIVED", archivedAt: new Date(), updatedAt: new Date() })
          .where(eq(publications.id, plan.toArchive.id));
      }

      await tx
        .update(publications)
        .set({ status: "PUBLISHED", publishedAt, updatedAt: new Date() })
        .where(eq(publications.id, id));

      /**
       * La ligne est relue **dans la transaction**, et non par `this.findById(id)`.
       *
       * `this.findById` interroge `this.db`, c'est-à-dire le **pool** : la lecture
       * part sur une autre connexion, qui ne voit pas les écritures non validées
       * de cette transaction. Elle rendait donc la ligne dans son état d'**avant** —
       * un `DRAFT` pour une publication qui vient d'être mise en ligne. Le service
       * relayant cette valeur telle quelle (`PublicationService.create` et
       * `.update`), l'API répondait `DRAFT` pour une publication publiée : c'est
       * le défaut I8 de `docs/039`, mesuré et reproduit par
       * `tests/integration/publication-quota.test.ts`.
       *
       * `hydrate` est réutilisé **tel quel** : c'est lui qui résout la couverture
       * (`coverImageUrl`) et qui garantit que la forme rendue reste exactement
       * celle du contrat du repository — identique à celle de `findById`.
       */
      const [row] = await tx
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);

      return row === undefined ? null : ((await this.hydrate([row]))[0] ?? null);
    });
  }

  async publish(id: string, publishedAt?: string): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const dateToSet = publishedAt ?? new Date().toISOString().slice(0, 10);

    const [updated] = await this.db
      .update(publications)
      .set({
        status: "PUBLISHED",
        publishedAt: dateToSet,
        updatedAt: new Date(),
      })
      .where(eq(publications.id, id))
      .returning();

    return updated ? this.findById(id) : null;
  }

  async revertToDraft(id: string): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const [updated] = await this.db
      .update(publications)
      .set({
        status: "DRAFT",
        updatedAt: new Date(),
      })
      .where(eq(publications.id, id))
      .returning();

    return updated ? this.findById(id) : null;
  }

  /**
   * Les 3 publications publiées les plus récentes (mise en avant).
   * Tri déterministe par publishedAt DESC, id DESC.
   */
  async listFeatured(limit: number = 3): Promise<Publication[]> {
    const rows = await this.db
      .select()
      .from(publications)
      .where(eq(publications.status, "PUBLISHED"))
      .orderBy(desc(publications.publishedAt), desc(publications.id))
      .limit(limit);

    return this.hydrate(rows);
  }

  /**
   * Archives des publications (toutes les publications publiées après les 3 premières).
   */
  async listArchives(options: ListOptions): Promise<ListResult<Publication>> {
    const where = eq(publications.status, "PUBLISHED");

    // Décalage de 3 pour les archives publiques si offset = 0
    const effectiveOffset = (options.offset ?? 0) + 3;

    const rows = await this.db
      .select()
      .from(publications)
      .where(where)
      .orderBy(desc(publications.publishedAt), desc(publications.id))
      .limit(options.limit)
      .offset(effectiveOffset);

    const [totals] = await this.db
      .select({ value: count() })
      .from(publications)
      .where(where);

    const rawTotal = totals?.value ?? 0;
    const archiveTotal = Math.max(0, rawTotal - 3);

    return {
      items: await this.hydrate(rows),
      total: archiveTotal,
    };
  }

  async remove(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;

    const rows = await this.db
      .delete(publications)
      .where(eq(publications.id, id))
      .returning({ id: publications.id });

    return rows.length > 0;
  }

  /** Filtres de liste, en liste blanche ; `status` inclus. */
  private buildFilters(filters: PublicationFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters.type !== undefined) {
      conditions.push(eq(publications.type, filters.type));
    }
    if (filters.category !== undefined) {
      conditions.push(eq(publications.category, filters.category));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(publications.status, filters.status));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  private buildOrder(sort: PublicationSort): SQL[] {
    const column =
      sort.column === "created_at"
        ? publications.createdAt
        : publications.publishedAt;
    const primary = sort.direction === "desc" ? desc(column) : asc(column);

    // Départage déterministe : plusieurs publications peuvent partager la même
    // date ; sans cela, deux pages consécutives peuvent montrer deux fois le
    // même élément.
    return [primary, asc(publications.id)];
  }

  /** Résout l'URL de couverture — une seule requête pour toute la page. */
  private async hydrate(rows: PublicationRow[]): Promise<Publication[]> {
    if (rows.length === 0) return [];

    const mediaIds = new Set<string>();
    for (const row of rows) {
      if (row.coverMediaId !== null) mediaIds.add(row.coverMediaId);
    }

    const urls = await loadMediaUrls(this.db, [...mediaIds]);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: row.type,
      category: row.category,
      status: row.status,
      contentUrl: row.contentUrl,
      coverMediaId: row.coverMediaId,
      coverImageUrl:
        row.coverMediaId === null
          ? null
          : (urls.get(row.coverMediaId) ?? null),
      description: row.description,
      body: row.body,
      author: row.author,
      publishedAt: row.publishedAt,
      departmentId: row.departmentId,
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
