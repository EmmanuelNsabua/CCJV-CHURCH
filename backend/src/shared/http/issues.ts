/**
 * Traduction des problèmes Zod au format `{ champ, message }` de l'API.
 *
 * Ce module vit dans `shared/` et non dans le middleware de validation, pour une
 * raison de **sens de dépendance**. Le format est produit à deux endroits :
 *
 * - le middleware `validate`, pour la forme générale d'une requête (corps,
 *   paramètres, *query*) ;
 * - le service des pages, pour le **contenu**, dont le schéma dépend de la
 *   `pageKey` et n'est donc connu qu'à l'exécution (`domain/content/page-content.ts`).
 *
 * Laisser la fonction dans la couche présentation aurait obligé le service — une
 * couche applicative — à importer depuis `presentation/`, c'est-à-dire à dépendre
 * d'une couche qui dépend d'elle. `docs/004` §9 inverse explicitement ce sens.
 *
 * **Le format est unique, et c'est le point.** `docs/031` §3.4 exige que
 * `details` **nomme** la clé fautive — `sections`, ou une faute de frappe comme
 * `heroTittle`. Deux implémentations divergeraient, et le client lirait
 * `champ: "(racine)"` selon l'endroit où sa requête a échoué.
 */

/** Problème de validation tel que l'API le publie. */
export interface FieldIssue {
  champ: string;
  message: string;
}

/**
 * Cas particulier des **clés inconnues** (objets stricts) : Zod produit un
 * problème unique, de `path` vide, dont la liste `keys` porte les clés fautives.
 * Les déclarer une par une donne un `details` exploitable — le client lit
 * `champ: "nimportequoi"` et corrige sa faute de frappe, au lieu d'un
 * `champ: "(racine)"` qui ne désigne rien.
 */
export function formatIssues(error: unknown): FieldIssue[] {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    return (
      error as {
        issues: { path: PropertyKey[]; message: string; keys?: PropertyKey[] }[];
      }
    ).issues.flatMap((issue) => {
      if (Array.isArray(issue.keys) && issue.keys.length > 0) {
        return issue.keys.map((key) => ({
          champ: String(key),
          message: `Champ non reconnu : « ${String(key)} »`,
        }));
      }

      return [
        {
          champ: issue.path.map(String).join(".") || "(racine)",
          message: issue.message,
        },
      ];
    });
  }

  return [];
}
