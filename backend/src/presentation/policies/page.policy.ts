import { createPolicy } from "./policy-kit";

/**
 * `PagePolicy` — P-05 de `docs/029` §4.1.
 *
 * **D-23 en une phrase** : « Contrat de contenu par template, **jamais de page
 * builder** ». Ce que cela change pour cette policy est radical, et c'est le
 * point le plus facile à manquer : les quatre actions qui, ailleurs, seraient
 * les plus naturelles du monde — créer une page, la supprimer, modifier sa
 * structure, ajouter une section — ne sont **pas** des permissions à doser
 * selon le rôle. Elles sont **refusées à tout le monde**, y compris au
 * `SUPER_ADMIN`.
 *
 * La raison n'est pas la prudence mais la **cohérence du produit**. Une page du
 * site est un **composant** : `HeroManifesto`, `OrganisationExplorer`, la page
 * de contact. Sa structure est du code ; son contenu est une donnée
 * (`docs/031`, 238 champs répartis sur 8 pages). Si le back-office pouvait créer
 * une section, le frontend devrait savoir rendre une section qu'il ne connaît
 * pas — et il n'y aurait plus de contrat, seulement une convention. C'est
 * exactement ce que D-23 refuse, et c'est aussi pourquoi la règle est la même
 * pour tous les rôles : il n'existe pas de degré de confiance qui rende une
 * structure arbitraire affichable.
 *
 * **Ce que cette policy ne fait pas.** `assertTemplateContract` — la validation
 * du contenu contre le template — appartient au **domaine**
 * (`domain/content/page-content.ts`, Lot 3) : c'est une règle de forme, pas une
 * décision d'autorisation, et elle doit s'appliquer même quand l'appelant est le
 * `SUPER_ADMIN`. La dupliquer ici la rendrait contournable par tout chemin qui
 * n'appelle pas la policy — l'inverse de ce que `docs/029` §4.2 exige
 * (« aucune règle recopiée »).
 */

/** Vue d'une page statique telle que la policy a besoin de la connaître. */
export interface PagePolicyResource {
  /** Clé de template (`docs/031`) — l'identité éditoriale de la page. */
  pageKey: string;
}

export const PagePolicy = createPolicy<PagePolicyResource>("PagePolicy", {
  /**
   * `canRead` — `SUPER_ADMIN` · `ADMIN` ; **`MANAGER` : `?` Q-05** → refus
   * (cellule 7.2).
   *
   * Une page du site est **globale** : elle n'appartient à aucun département, et
   * il n'y a donc aucune clause départementale à appliquer. Une page
   * départementale, si elle existait un jour, serait portée par une autre entité
   * — la `StaticPage` du schéma `docs/032` §3.6 n'a pas de `department_id`, et en
   * ajouter un ici serait trancher une question que personne n'a posée.
   */
  READ: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    pending: "docs/029 Q-05 (lecture du back-office par un responsable)",
  },

  /**
   * `canUpdateContent` — `SUPER_ADMIN` · `ADMIN` ; **`MANAGER` : `?` Q-05**
   * (cellule 7.3) → refus.
   *
   * La cellule 7.3 dit pourquoi le `?` ne se comble pas tout seul : la ligne
   * `[Département]` du schéma de contenu est déclarée « Éditable » **sans nommer
   * le rôle**. Éditable par le responsable de ce département ? par l'`ADMIN` ?
   * `docs/031` ne le dit pas, et `docs/029` §4.3 en tire le refus par défaut.
   *
   * **L'édition porte sur les champs, jamais sur les clés.** Le contenu est un
   * `Record<string, unknown>` validé contre le template au Lot 3 ; ajouter une
   * clé inconnue doit être refusé par le validateur, non par cette policy. La
   * séparation est volontaire : une policy ne connaît pas les 238 champs de
   * `docs/031`, et il serait faux qu'elle les connaisse — `docs/031` évolue avec
   * le frontend, le RBAC non.
   */
  UPDATE: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    pending: "docs/029 Q-05 · docs/031 (page [Département] éditable, rôle non nommé)",
  },

  /**
   * `canCreatePage` — **`false` pour tout le monde** (D-23, X26).
   *
   * Le titre même de D-23 est « Contrat de contenu par template, **jamais de page
   * builder** » ; 021 §2.1 ajoute « Il n'existe donc **pas** de page builder
   * générique ». Rouvrir cette ligne — même au `SUPER_ADMIN` — reviendrait à
   * réintroduire un page builder par la bande, puisque rien d'autre dans
   * l'application ne validerait la structure d'une page créée à la volée.
   */
  CREATE: { roles: [], pending: "docs/028 D-23 — refus structurel, non une question ouverte" },

  /** `canDeletePage` — **`false` pour tout le monde** (D-23). */
  DELETE: { roles: [], pending: "docs/028 D-23 — refus structurel" },

  /**
   * `canModifyStructure` — **`false` pour tout le monde** (D-23, X22).
   *
   * La règle X22 est explicite : « Le back-office ne peut pas créer
   * arbitrairement des sections ou modifier la structure visuelle. » Les cellules
   * 7.4, 7.5 et 7.6 de la matrice portent ce refus pour **tous** les rôles sans
   * exception — d'où une ligne sans rôle, et non une ligne restreinte.
   */
  MODIFY_STRUCTURE: { roles: [], pending: "docs/028 D-23 · 021 §17 I11 — refus structurel" },

  /** `canCreateSection` — **`false` pour tout le monde** (D-23). */
  CREATE_SECTION: { roles: [], pending: "docs/028 D-23 — refus structurel" },
});
