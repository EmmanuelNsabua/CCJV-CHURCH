/**
 * Règle de récence éditoriale d'un enseignement.
 *
 * Module **pur et sans dépendance** (aucun import) : il peut être vérifié
 * isolément, et il ne dépend ni du transport HTTP ni du rendu.
 *
 * Le critère est la **date de publication** (`publishedAt`) — jamais :
 * - `preachedAt` (date de prédication, qui peut être bien antérieure) ;
 * - `createdAt` (date de création de l'enregistrement) ;
 * - `updatedAt` (date de dernière modification).
 *
 * En cas d'égalité, un départage **stable** est appliqué (date de prédication,
 * puis identifiant) : deux lectures successives donnent le même résultat, ce qui
 * évite qu'une page bascule d'un message à l'autre sans raison.
 */

/** Ce dont la règle a besoin : aucun autre champ n'est lu. */
export interface RecencyRanked {
  readonly id: string;
  /** Date de publication ISO 8601, `null` si l'enseignement n'a jamais été publié. */
  readonly publishedAt: string | null;
  /** Date de prédication (`AAAA-MM-JJ`), utilisée seulement en départage. */
  readonly preachedAt: string;
}

/**
 * `true` si `candidate` est un enseignement plus récemment publié que `current`.
 *
 * Une date de publication connue prime toujours sur une date absente : un
 * enseignement effectivement publié est plus « récent » qu'un enregistrement
 * dont la date de publication manque.
 */
export function isMoreRecentlyPublished<T extends RecencyRanked>(
  candidate: T,
  current: T | null,
): boolean {
  if (!current) return true;

  const candidateDate = candidate.publishedAt;
  const currentDate = current.publishedAt;

  if (candidateDate && !currentDate) return true;
  if (!candidateDate && currentDate) return false;

  if (candidateDate && currentDate && candidateDate !== currentDate) {
    // Dates ISO 8601 UTC : l'ordre lexical est l'ordre chronologique.
    return candidateDate > currentDate;
  }

  // Égalité de date de publication : départage stable.
  if (candidate.preachedAt !== current.preachedAt) {
    return candidate.preachedAt > current.preachedAt;
  }
  return candidate.id > current.id;
}

/**
 * Enseignement le plus récemment publié d'une collection, ou `null` si elle est
 * vide.
 *
 * La fonction ne fait aucune hypothèse sur l'ordre de la collection reçue.
 */
export function pickMostRecentlyPublished<T extends RecencyRanked>(
  items: readonly T[],
): T | null {
  let latest: T | null = null;

  for (const item of items) {
    if (isMoreRecentlyPublished(item, latest)) latest = item;
  }

  return latest;
}
