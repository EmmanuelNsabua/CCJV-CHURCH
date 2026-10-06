/**
 * Génération de slug — règle métier de `docs/005` §4 et `docs/006` §21 :
 * minuscules, sans accents, séparateur `-`, utilisé pour des URL propres.
 *
 * Aucune dépendance externe : la transformation est explicite et testable.
 */

const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "") // retire les accents
    .toLowerCase()
    .replace(/['’]/g, "-") // apostrophes typographiques et droites
    .replace(/[^a-z0-9]+/g, "-") // tout le reste devient un séparateur
    .replace(/^-+|-+$/g, "") // ni en tête ni en queue
    .replace(/-{2,}/g, "-") // pas de séparateur doublé
    .slice(0, 160);
}

/**
 * Ajoute un suffixe numérique jusqu'à obtenir un slug libre.
 * `exists` doit interroger la base — jamais un tableau en mémoire, qui
 * provoquerait des collisions entre instances.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "sans-titre";
  let candidate = root;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
    if (suffix > 100) {
      // Garde-fou : au-delà, on laisse la contrainte d'unicité trancher.
      throw new Error(`Impossible de générer un slug unique pour « ${base} »`);
    }
  }

  return candidate;
}
