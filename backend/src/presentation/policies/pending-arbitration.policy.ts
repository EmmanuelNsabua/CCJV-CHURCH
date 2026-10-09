import { createPolicy } from "./policy-kit";

/**
 * Policies **P-10 à P-14** de `docs/029` §4.6 — les ressources que la matrice
 * exige et qu'aucune décision de `docs/028` n'arbitrait.
 *
 * ### Elles ne refusent plus : l'arbitrage est intervenu
 *
 * Ce fichier s'appelait d'abord « refus par défaut » : `docs/029` §4.3 pose le
 * défaut `✘`, et accorder « en attendant » une permission non décidée aurait été
 * pire que refuser — une permission provisoire devient permanente par oubli.
 * C'était la bonne position tant que la question était ouverte, et elle a produit
 * exactement l'effet attendu : les modules concernés répondaient `403`, et
 * l'arbitrage manquant s'est **manifesté** au lieu de dormir.
 *
 * Le commanditaire a tranché :
 *
 * > « C'est l'admin qui fait ces configurations. »
 *
 * Les quatre policies ci-dessous accordent donc à l'`ADMIN` — et au
 * `SUPER_ADMIN`, à qui `docs/028` D-03 attribue « tous les pouvoirs du système »,
 * la seule exception étant le domaine des prières (D-10).
 *
 * ### Ce qui reste refusé, et pourquoi
 *
 * - `AuditPolicy` — le commanditaire n'a pas tranché la **lecture du journal
 *   d'audit** (Q-16/17/18), qui n'est pas une « configuration ». Le refus
 *   demeure, et il est motivé.
 * - Le `DEPARTMENT_MANAGER` n'obtient rien de ces policies : X25 est définitif
 *   (« cette catégorie ne doit pas être exposée aux responsables »), et les
 *   entités éditoriales ne sont pas départementales.
 *
 * ### Ce qui n'est PAS reporté
 *
 * Une distinction stricte sépare ces lignes des refus **structurels** du
 * catalogue : `PagePolicy.canCreatePage` (`roles: []`) n'est pas une question
 * ouverte — c'est D-23, définitivement tranché, et cela ne change pas.
 */

/** Rôles qui configurent les contenus institutionnels (réponse du commanditaire). */
const CONFIGURATION_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

/* -------------------------------------------------------------------------- */
/*  P-10 — AuditPolicy                                                        */
/* -------------------------------------------------------------------------- */

/** Vue d'une entrée `audit_log` (`docs/032` §3.3). */
export interface AuditPolicyResource {
  /** `audit_log.action` — vocabulaire fermé, sans aucune valeur `PRAYER_*`. */
  action: string;
}

/**
 * `AuditPolicy` — lecture des journaux d'audit (`docs/029` Q-16, Q-17, Q-18).
 *
 * Le refus de lecture est **temporaire** et n'a rien de commun avec le refus
 * cryptographique des prières : `docs/028` D-03 attribue au `SUPER_ADMIN` « les
 * journaux d'audit complets », tandis que `020` §18 et `021` §7 laissent
 * l'`ADMIN` à « selon politique / selon périmètre » — une politique qui n'existe
 * pas. Tant qu'elle n'existe pas, la lecture reste fermée.
 *
 * **Invariant non négociable, indépendant de l'arbitrage :** `docs/030` A11 et
 * l'écart E2 excluent **tout** événement `PRAYER_*` de `public.audit_log`, dont
 * la lecture est ouverte au `SUPER_ADMIN`. Le registre des prières est
 * `prayer_private.prayer_audit_event`, disjoint. Cette policy ne peut donc
 * jamais accorder la lecture d'un événement de prière, quel que soit le rôle —
 * et l'exclusion ci-dessous le garantit même si Q-16 était un jour tranchée en
 * faveur d'une lecture large.
 */
export const AuditPolicy = createPolicy<AuditPolicyResource>(
  "AuditPolicy",
  {
    READ: {
      roles: [],
      pending: "docs/029 Q-16 (qui lit le journal d'audit) · Q-17 (rétention) · Q-18 (périmètre)",
    },
  },
  (admin, resource) =>
    admin.role === "SUPER_ADMIN" && resource?.action.startsWith("PRAYER_")
      ? "docs/030 A11, écart E2 : aucun événement de prière ne figure dans public.audit_log, et aucun ne peut y être lu (registre disjoint : prayer_private.prayer_audit_event)"
      : null,
);

/* -------------------------------------------------------------------------- */
/*  P-11 — EditorialEntityPolicy                                              */
/* -------------------------------------------------------------------------- */

/** Entités éditoriales déclarées persistantes par `docs/028` D-24. */
export type EditorialEntityKind = "LEADER" | "TESTIMONY" | "COMMUNITY_FACE";

/** Vue d'une entité éditoriale telle que la policy a besoin de la connaître. */
export interface EditorialEntityPolicyResource {
  kind: EditorialEntityKind;
  /** `departmentId` pour un responsable : les responsables sont rattachables. */
  departmentId?: string | null;
}

/**
 * `EditorialEntityPolicy` — `Leader`, `Testimony`, `CommunityFace`
 * (`docs/029` Q-14).
 *
 * D-24 les déclare **persistantes** — ce ne sont plus des mocks du frontend —
 * mais **aucun rôle d'administration n'est nommé**. La distinction n'est pas
 * anodine pour `Testimony` : `docs/032` §3.2 lui donne un statut de modération
 * (`DRAFT`, `PENDING`, `PUBLISHED`) « nécessaire **avant** toute exposition
 * publique » (`028/Q-PR9`). Une publication de témoignage engage la parole d'un
 * tiers ; l'absence de titulaire nommé n'est donc pas un détail à combler au
 * jugé.
 */
export const EditorialEntityPolicy = createPolicy<EditorialEntityPolicyResource>("EditorialEntityPolicy", {
  READ: { roles: CONFIGURATION_ROLES },
  CREATE: { roles: CONFIGURATION_ROLES },
  UPDATE: { roles: CONFIGURATION_ROLES },
  DELETE: { roles: CONFIGURATION_ROLES },
});

/* -------------------------------------------------------------------------- */
/*  P-12 — ScripturePolicy                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `ScripturePolicy` — versets et textes bibliques (`docs/029` Q-12,
 * `028/Q-PG2`).
 *
 * `028/Q-PG2` pose la question sans détour : « Les versets sont-ils éditables
 * par le back-office ? » Tant qu'elle est ouverte, **ils ne le sont pas**.
 *
 * Le refus de lecture mérite une justification, puisqu'un verset n'a rien de
 * confidentiel. Il tient à la séparation des plans : la **lecture publique** des
 * versets est un service rendu au visiteur, qui n'appelle aucune policy
 * administrative — c'est la route ouverte du frontend. Cette table ne gouverne
 * que l'**administration** des versets, et c'est celle-là qui n'a pas de
 * titulaire. Refuser ici ne prive donc personne du texte : cela prive seulement
 * un rôle d'un droit d'écriture non arbitré.
 */
export const ScripturePolicy = createPolicy("ScripturePolicy", {
  READ: { roles: CONFIGURATION_ROLES },
  UPDATE: { roles: CONFIGURATION_ROLES },
  CREATE: { roles: CONFIGURATION_ROLES },
  DELETE: { roles: CONFIGURATION_ROLES },
});

/* -------------------------------------------------------------------------- */
/*  P-13 — SchedulePolicy                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `SchedulePolicy` — rythme de rencontre (`docs/029` Q-15, D-24).
 *
 * D-24 conserve l'entité `ScheduleEntry` sans nommer de rôle. Le champ est
 * **éditorial et public** — c'est l'horaire affiché aux visiteurs — et il est
 * aujourd'hui écrit **quatre fois** avec des valeurs divergentes (`docs/031` :
 * « chorale lundi/samedi » contre « lundi/mercredi/samedi »). Ce constat rend
 * l'arbitrage plus urgent qu'il n'y paraît : la divergence ne se corrige pas par
 * une permission, mais il faut un titulaire pour la corriger.
 */
export const SchedulePolicy = createPolicy("SchedulePolicy", {
  READ: { roles: CONFIGURATION_ROLES },
  UPDATE: { roles: CONFIGURATION_ROLES },
  CREATE: { roles: CONFIGURATION_ROLES },
  DELETE: { roles: CONFIGURATION_ROLES },
});

/* -------------------------------------------------------------------------- */
/*  P-14 — SiteSettingsPolicy                                                 */
/* -------------------------------------------------------------------------- */

/**
 * `SiteSettingsPolicy` — paramètres du site et liens sociaux (`docs/029` Q-13,
 * Q-28, D-03, D-24, X25).
 *
 * **Un point est tranché, et un seul** : X25 — « Cette catégorie ne doit pas
 * être exposée aux responsables de département. » Le refus du
 * `DEPARTMENT_MANAGER` est donc **définitif**, et il est exprimé par une
 * exclusion plutôt que par une ligne de table, pour la même raison que partout
 * ailleurs dans ce catalogue : un refus de fond ne doit pas pouvoir être défait
 * par un élargissement de la table.
 *
 * Ce qui reste ouvert est le périmètre de l'`ADMIN`, que D-04 ne mentionne pas
 * (Q-13), et le sort des paramètres « globaux » au sens de D-24 (Q-28). Les deux
 * refus sont distincts dans leur cause : l'un est une décision, l'autre une
 * lacune. Les confondre dans un même `403` serait exact — les deux refusent —
 * mais ferait perdre l'information qui compte au moment de l'arbitrage.
 */
export const SiteSettingsPolicy = createPolicy(
  "SiteSettingsPolicy",
  {
    READ: { roles: CONFIGURATION_ROLES },
    UPDATE: { roles: CONFIGURATION_ROLES },
  },
  (admin) =>
    admin.role === "DEPARTMENT_MANAGER"
      ? "X25 / 020 §14 : cette catégorie n'est pas exposée aux responsables de département — refus définitif (docs/028 D-24, D-03)"
      : null,
);
