/**
 * Vocabulaire des **capacités de département** (`docs/028` D-25, `docs/032` §3.5).
 *
 * Une capacité dit ce qu'un département peut faire **en tant que département**,
 * indépendamment de tout rôle. C'est la réponse retenue par D-25 à un problème
 * précis : « comment un département publie-t-il un événement à l'échelle de
 * toute l'église, sans que le code nomme ce département ? »
 *
 * **La forme interdite**, citée littéralement par `docs/028` D-25 :
 *
 * ```ts
 * if (department.code === "PRESSE") { … }   // ❌
 * ```
 *
 * Elle a deux défauts, et le second est le plus grave. Le premier est qu'elle
 * code en dur un référentiel **mouvant** : renommer un département casse une
 * autorisation. Le second est qu'elle rend la règle **invisible** — personne ne
 * peut répondre à « quels départements publient globalement ? » sans lire tout
 * le code. Une capacité, elle, se **liste en base** : `SELECT department_id FROM
 * department_capabilities WHERE capability = 'EVENT_SCOPE_GLOBAL'`.
 *
 * `docs/032` §3.5 ferme volontairement la liste (`CHECK (capability IN
 * ('EVENT_SCOPE_GLOBAL'))`) : une liste ouverte de capacités serait un RBAC
 * parallèle, non arbitré. Ajouter une capacité est donc une décision, pas une
 * écriture.
 *
 * ⚠️ **Qui écrit dans cette table reste non tranché** (`docs/029` Q-06,
 * `docs/032` Q-S6) : un responsable qui pourrait modifier les capacités de son
 * propre département s'attribuerait la portée globale — c'est le vecteur
 * d'escalade le plus direct du modèle. `DepartmentPolicy.canEditCapabilities`
 * refuse donc aujourd'hui **tout le monde**, et ce n'est pas un oubli : c'est
 * la seule décision compatible avec une question ouverte.
 */
export const DEPARTMENT_CAPABILITIES = {
  /**
   * Le département peut publier des événements à portée **globale** (D-25).
   *
   * Conséquence visible : `Event.visibility_scope` peut valoir `GLOBAL` pour un
   * événement dont ce département est responsable (`docs/028` D-26). La règle est
   * vérifiée **deux fois** — par `EventPolicy` et par un trigger PostgreSQL
   * (`docs/032` §3.6) : une policy contournée par un script d'administration ne
   * doit pas suffire à publier à l'échelle de l'église.
   */
  EVENT_SCOPE_GLOBAL: "EVENT_SCOPE_GLOBAL",

  /**
   * Le département **entre dans le périmètre des publications** (`docs/035` §3.2).
   *
   * ### Pourquoi cette capacité existe
   *
   * `docs/035` §1 précise que « les Affaires Sociales n'entrent pas dans le
   * périmètre des publications ». Cette exclusion n'était exprimée **nulle part**
   * — ni en base, ni dans le code — et `docs/035` §3.2 laisse trois façons de
   * l'exprimer avant de recommander explicitement la seconde :
   *
   * > « **Recommandation :** la **capacité de département** (option 2) — elle
   * > applique au périmètre des publications le même mécanisme que celui retenu
   * > pour la portée événementielle, et évite de figer dans une contrainte une
   * > règle qu'un département pourrait devoir intégrer plus tard. »
   *
   * L'exclusion est donc portée par la **présence** de cette capacité, et non par
   * un booléen : `docs/032` §3.5 fait déjà de la présence d'une ligne
   * l'expression d'un droit, et un second mécanisme pour dire la même chose
   * créerait deux vérités. Un département sans cette capacité **ne publie pas** —
   * c'est un refus par défaut, cohérent avec tout le reste du modèle.
   *
   * ⚠️ **Point d'interprétation, signalé comme tel.** `docs/035` §3.2 écrit le nom
   * `publication_scope = false` à titre d'exemple, sans figer de code de
   * capacité ; `docs/032` §3.5 n'en connaît qu'un (`EVENT_SCOPE_GLOBAL`) et
   * précise que la liste « est élargie par **décision explicite**, jamais par
   * commodité ». Le code retenu ici — `PUBLICATION_SCOPE` — suit la convention du
   * premier (`<DOMAINE>_SCOPE_<PORTÉE>`), et l'ajout au `CHECK` s'appuie sur la
   * recommandation de `docs/035`, pas sur une commodité d'implémentation. Si
   * l'organisation préfère un autre nom, ou veut que l'exclusion soit portée
   * autrement, c'est le point à corriger — et il ne coûte qu'une valeur de
   * vocabulaire.
   */
  PUBLICATION_SCOPE: "PUBLICATION_SCOPE",
} as const;

/** Capacité de département, valeurs de la liste fermée (`docs/032` §3.5). */
export type DepartmentCapability =
  (typeof DEPARTMENT_CAPABILITIES)[keyof typeof DEPARTMENT_CAPABILITIES];

/**
 * Liste fermée, dans l'ordre de `docs/032` §3.5.
 *
 * Elle est le pendant applicatif du `CHECK
 * department_capabilities_known_capability`. Les deux existent, et ce n'est pas
 * une redondance : le `CHECK` protège la **donnée** — y compris d'une écriture
 * SQL directe ou d'un script d'exploitation — tandis que cette liste protège le
 * **code** : elle est ce qui permet de refuser une capacité inconnue **avant**
 * d'atteindre la base, avec un message qui dit quoi faire, plutôt qu'une erreur
 * de contrainte PostgreSQL à traduire après coup.
 */
export const KNOWN_DEPARTMENT_CAPABILITIES: readonly DepartmentCapability[] =
  Object.values(DEPARTMENT_CAPABILITIES);

/**
 * La colonne `department_capabilities.capability` est un `varchar(60)`.
 *
 * Le typage du domaine est donc une **affirmation** que la base ne peut pas
 * garantir au compilateur : `docs/032` §3.5 la borne par un `CHECK`, mais
 * TypeScript lit une chaîne. Cette fonction est le seul endroit où la
 * conversion a lieu, et elle **refuse** au lieu de caster : une valeur inconnue
 * n'est pas une capacité, c'est une ligne qu'on ne sait pas interpréter.
 *
 * La distinction n'est pas théorique. Une capacité inconnue interprétée comme
 * « pas de capacité » donnerait un refus silencieux (un département privé d'une
 * portée qu'il détient) ; l'inverse — supposer `EVENT_SCOPE_GLOBAL` — ouvrirait
 * la publication à l'échelle de l'église. Refuser de lire est la seule issue
 * qui ne décide rien à la place de l'exploitant : l'appelant voit une ligne
 * qu'il ignore, au lieu d'une autorisation devinée.
 */
export function isDepartmentCapability(
  value: string,
): value is DepartmentCapability {
  return (KNOWN_DEPARTMENT_CAPABILITIES as readonly string[]).includes(value);
}

/** Portée publique d'un événement — déclarée avec l'entité qu'elle qualifie. */
export type { EventVisibilityScope } from "@/domain/entities";

/**
 * Le département entre-t-il dans le périmètre des publications ?
 *
 * `docs/035` §1 exclut les Affaires Sociales du périmètre des publications, et
 * §3.2 confie l'expression de cette exclusion à une capacité de département. La
 * question posée ici est donc « ce département peut-il publier ? », jamais « quel
 * est son nom ? » — c'est l'invariant D-09 : le nom d'un département n'entre
 * jamais dans une condition d'autorisation.
 *
 * L'absence de capacité vaut refus : aucun département ne publie par défaut.
 */
export function isInPublicationScope(
  capabilities: readonly DepartmentCapability[],
): boolean {
  return capabilities.includes(DEPARTMENT_CAPABILITIES.PUBLICATION_SCOPE);
}
