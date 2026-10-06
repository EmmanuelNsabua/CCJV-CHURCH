import { count, desc, eq } from "drizzle-orm";
import type { PrayerRequest } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  PrayerRequestInput,
  PrayerRequestRepository,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import type { PrayerRequestRow } from "@/infrastructure/database/schema/prayer-requests";
import { prayerRequests } from "@/infrastructure/database/schema/prayer-requests";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des demandes de prière (Drizzle / PostgreSQL).
 *
 * Deux propriétés tiennent à cette couche :
 * 1. **Aucune lecture publique.** Le contrat n'expose aucune méthode de
 *    recherche par critère libre : on ne peut lire que par identifiant ou par
 *    collection, et seuls les routers administratifs appellent ces méthodes.
 * 2. **Aucune journalisation de contenu.** Les valeurs `requestText`,
 *    `requesterName` et `requesterContact` ne quittent jamais cette couche
 *    autrement que vers une réponse destinée à l'administration (cahier §19).
 */
export class DrizzlePrayerRequestRepository implements PrayerRequestRepository {
  constructor(private readonly db: Database) {}

  async list(
    options: ListOptions,
    filters: { status?: "NEW" | "PRAYED" },
  ): Promise<ListResult<PrayerRequest>> {
    // Le tri est fixé par le serveur : « la plus récente d'abord ». Aucun nom de
    // colonne ne vient du client (`IMPLEMENTATION_SPEC` §8).
    const where = filters.status
      ? eq(prayerRequests.status, filters.status)
      : undefined;

    const rows = await this.db
      .select()
      .from(prayerRequests)
      .where(where)
      .orderBy(desc(prayerRequests.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    // `count()` séparé, avec le même filtre : jamais un décompte implicite.
    const [totalRow] = await this.db
      .select({ value: count() })
      .from(prayerRequests)
      .where(where);

    return { items: rows.map(toEntity), total: totalRow?.value ?? 0 };
  }

  async findById(id: string): Promise<PrayerRequest | null> {
    const [row] = await this.db
      .select()
      .from(prayerRequests)
      .where(eq(prayerRequests.id, id))
      .limit(1);

    return row ? toEntity(row) : null;
  }

  async create(data: PrayerRequestInput): Promise<PrayerRequest> {
    const [row] = await this.db
      .insert(prayerRequests)
      .values({
        requestText: data.requestText,
        // Un champ facultatif absent est stocké `null`, jamais `""` : la base
        // distingue « non renseigné » de « renseigné vide ».
        requesterName: data.requesterName ?? null,
        requesterContact: data.requesterContact ?? null,
        confidentiality: data.confidentiality ?? "private",
      })
      .returning();

    if (!row) {
      throw new InternalError("La demande de prière n'a pas pu être enregistrée");
    }

    return toEntity(row);
  }

  /**
   * Marque la demande comme portée et horodate la prise en charge.
   * `null` si la ligne n'existe pas : c'est le service qui en déduit un 404.
   */
  async markHandled(id: string): Promise<PrayerRequest | null> {
    const [row] = await this.db
      .update(prayerRequests)
      .set({ status: "PRAYED", handledAt: new Date() })
      .where(eq(prayerRequests.id, id))
      .returning();

    return row ? toEntity(row) : null;
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.db
      .delete(prayerRequests)
      .where(eq(prayerRequests.id, id))
      .returning({ id: prayerRequests.id });

    return removed.length > 0;
  }
}

function toEntity(row: PrayerRequestRow): PrayerRequest {
  return {
    id: row.id,
    requestText: row.requestText,
    requesterName: row.requesterName,
    requesterContact: row.requesterContact,
    confidentiality: row.confidentiality,
    status: row.status,
    handledAt: row.handledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
