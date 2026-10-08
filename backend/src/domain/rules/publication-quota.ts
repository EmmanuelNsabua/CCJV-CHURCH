import type { PublicationLifecycleState } from "@/domain/entities";

/**
 * Règle des 3 — **décision finale de `docs/035`**.
 *
 * ```text
 * PUBLISHED ≤ 3        toutes catégories et tous départements confondus
 * ```
 *
 * ### Ce que la règle est devenue, et pourquoi ce fichier existe
 *
 * `docs/028` D-18 disait « maximum 3 `PUBLISHED` **par département** ». `docs/035`
 * a tranché l'inverse : le plafond est **global**, « le site ne peut afficher que
 * trois publications `PUBLISHED` simultanément — et non trois par département ».
 * La conséquence est directe et sévère : sur les 10 publications existantes, **7
 * doivent être archivées** définitivement (É24 de `docs/033`), sans porte de
 * sortie.
 *
 * Le calcul est donc isolé ici, en **fonction pure**, pour trois raisons :
 *
 * 1. **il décide d'une opération irréversible.** Une règle qui archive ne se
 *    relit pas comme un filtre d'affichage : elle doit être testable
 *    exhaustivement, cas par cas, sans base de données ;
 * 2. **il est concurrent.** Deux publications simultanées ne doivent pas archiver
 *    deux lignes pour une seule place. La sérialisation appartient au service
 *    (transaction + verrou), mais le **plan** — qui archiver, combien restera-t-il
 *    de places — doit être calculable une fois sous verrou, à partir d'un état
 *    figé ;
 * 3. **la mécanique de départage est une décision, pas un détail.** `docs/035`
 *    §1 fixe `ORDER BY published_at ASC, id ASC` : `published_at` étant une
 *    **date** (et non un horodatage), les égalités sont fréquentes — dix
 *    publications saisies le même jour sont un cas réel. Sans le départage par
 *    `id`, l'ordre d'archivage dépendrait du plan d'exécution de PostgreSQL, donc
 *    changerait d'une exécution à l'autre.
 *
 * ### Ce que cette règle ne fait pas
 *
 * Elle ne connaît ni la base, ni les transactions, ni le verrou. Elle reçoit un
 * **état figé** et rend un **plan**. Les trois autres responsabilités restent
 * ailleurs, et c'est voulu :
 *
 * - la **décision d'autorisation** appartient à `PublicationPolicy` (D-06, D-18) ;
 * - la **sérialisation** (transaction, verrou d'avis) appartient au service ;
 * - l'**écriture** (`ARCHIVED`, `archived_at`) appartient au repository.
 */

/** Plafond global de publications simultanément publiées (`docs/035` §1). */
export const PUBLICATION_QUOTA = 3;

/**
 * Vue minimale d'une publication pour la règle.
 *
 * Volontairement structurelle : la règle n'a besoin ni du titre, ni du corps, ni
 * du département. Elle n'agirait pas différemment selon eux — et le jour où
 * `docs/032` fait porter la contrainte sur un « créneau global » plutôt que sur
 * `(department_id, published_slot)` (`docs/035` §2), c'est bien la preuve que le
 * département n'entre pas dans ce calcul.
 */
export interface QuotaCandidate {
  id: string;
  status: PublicationLifecycleState;
  /** Date ISO `YYYY-MM-DD` — jamais un objet `Date` (pas de décalage de fuseau). */
  publishedAt: string;
}

/** Ce qu'il faut faire avant d'écrire, pour respecter le plafond. */
export interface PublicationPlan {
  /**
   * La publication à archiver, ou `null` si une place est libre.
   *
   * Au plus **une** : `docs/035` §1 n'archives qu'« une » publication par
   * publication nouvelle. Une publication à la fois, une place à la fois — un plan
   * qui en archiverait plusieurs signalerait un état déjà hors plafond, qu'il ne
   * faut pas masquer en le résorbant d'un coup (voir `quotaExceeded`).
   */
  toArchive: QuotaCandidate | null;
  /** Nombre de `PUBLISHED` après application du plan. */
  publishedAfter: number;
}

/**
 * Ordre d'archivage : `published_at ASC, id ASC` (`docs/035` §1, D-19).
 *
 * Comparaison **littérale** de chaînes : `published_at` est une date ISO
 * `YYYY-MM-DD`, dont l'ordre lexicographique est l'ordre chronologique. Convertir
 * en `Date` ouvrirait un décalage de fuseau pour aucun gain — la même raison qui
 * fait que l'entité `Event` porte `eventDate` en chaîne.
 */
export function compareArchiveOrder(a: QuotaCandidate, b: QuotaCandidate): number {
  if (a.publishedAt !== b.publishedAt) {
    return a.publishedAt < b.publishedAt ? -1 : 1;
  }
  // Départage par `id` : sans lui, l'ordre dépendrait du plan d'exécution.
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * La plus ancienne des publications **publiées**, `id` départageant les égalités.
 *
 * @param candidates Toutes les publications connues, quel que soit leur état.
 * @param exceptId La publication qui va être publiée : elle ne peut pas
 *                 s'archiver elle-même. C'est le cas d'une republication d'une
 *                 ligne déjà `PUBLISHED`, qui ne consomme **aucune** place.
 */
export function oldestPublished(
  candidates: readonly QuotaCandidate[],
  exceptId?: string,
): QuotaCandidate | null {
  const published = candidates
    .filter((item) => item.status === "PUBLISHED" && item.id !== exceptId)
    .sort(compareArchiveOrder);

  return published[0] ?? null;
}

/**
 * Plan à appliquer pour publier `incomingId` sans dépasser le plafond.
 *
 * Trois cas, et le troisième est celui qu'on oublie :
 *
 * 1. il reste de la place → rien à archiver ;
 * 2. le plafond est atteint → la plus ancienne est archivée, la nouvelle prend sa
 *    place ;
 * 3. il est **déjà dépassé** (5 `PUBLISHED` en base, par exemple parce que la
 *    règle n'était pas encore appliquée) → une seule archival est planifiée, et
 *    `publishedAfter` le dit. C'est délibéré : la règle ne « rattrape » pas un
 *    dépassement en archivant plusieurs lignes d'un coup, parce que l'archivage
 *    est **irréversible** (D-18) et qu'aucune décision n'autorise à choisir sept
 *    contenus à effacer au détour d'une publication. Le dépassement se traite par
 *    une opération explicite, décidée et relue — c'est exactement ce qu'É24 de
 *    `docs/033` organise pour les 10 publications existantes.
 */
export function planPublication(
  candidates: readonly QuotaCandidate[],
  incomingId: string,
): PublicationPlan {
  const others = candidates.filter(
    (item) => item.status === "PUBLISHED" && item.id !== incomingId,
  );

  if (others.length < PUBLICATION_QUOTA) {
    return { toArchive: null, publishedAfter: others.length + 1 };
  }

  return {
    toArchive: oldestPublished(candidates, incomingId),
    publishedAfter: PUBLICATION_QUOTA,
  };
}

/**
 * Nombre de `PUBLISHED` à archiver pour rentrer dans le plafond.
 *
 * Sert à **constater** un dépassement, jamais à le résorber silencieusement :
 * l'appelant en fait une opération explicite (É24 de `docs/033`), ou un refus.
 * `docs/035` §2 chiffre le cas réel — « 10 publications existantes pour 3
 * places » — soit 7 archivages, étape « irréversible, sans porte de sortie ».
 */
export function quotaExceeded(candidates: readonly QuotaCandidate[]): number {
  const published = candidates.filter((item) => item.status === "PUBLISHED").length;
  return Math.max(0, published - PUBLICATION_QUOTA);
}

/**
 * Les publications qu'une publication nouvelle ferait archiver, dans l'ordre.
 *
 * Rend la **suite** des archivages qu'impliquerait un rattrapage — sert à
 * préparer et à relire l'opération irréversible (É24) avant de l'exécuter, et
 * jamais à l'exécuter à l'insu de personne. Le premier élément est celui que la
 * règle archive en fonctionnement normal ; les suivants n'existent que si la base
 * est déjà hors plafond.
 */
export function archiveSequence(candidates: readonly QuotaCandidate[]): QuotaCandidate[] {
  return candidates
    .filter((item) => item.status === "PUBLISHED")
    .sort(compareArchiveOrder)
    .slice(0, quotaExceeded(candidates));
}
