import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import type { AdminProfile, AdminRole, AdminScope } from "@/domain/entities";
import { DEPARTMENT_CAPABILITIES } from "@/domain/departments/capabilities";
import {
  AuditPolicy,
  DepartmentPolicy,
  EditorialEntityPolicy,
  EventPolicy,
  MediaAccessPolicy,
  MediaPolicy,
  NotificationPolicy,
  PagePolicy,
  POLICY_CATALOGUE,
  PrayerPolicy,
  PublicationPolicy,
  SchedulePolicy,
  ScripturePolicy,
  SiteSettingsPolicy,
  UserPolicy,
  assertDepartmentRequired,
  evaluate,
  listScopeFor,
  sweep,
  type PolicyAction,
} from "@/presentation/policies";

/**
 * Matrice RBAC — le catalogue de policies, éprouvé par ses **refus**.
 *
 * `docs/029` §3 est sans ambiguïté sur la méthode : « un RBAC se juge sur ses
 * refus ». Un test qui vérifie qu'un `ADMIN` *peut* publier ne prouve presque
 * rien ; celui qui vérifie qu'un responsable d'un département ne peut pas
 * toucher au contenu d'un autre prouve la règle. L'ordre des sections ci-dessous
 * suit donc celui de `docs/029` §6.2 : **les cas négatifs d'abord**.
 *
 * Le canal employé est celui que `docs/029` §6.1 désigne comme « le canal
 * privilégié du RBAC aujourd'hui » : l'appel **direct** de la policy. Un `403`
 * HTTP exigerait un jeton réel, et il est **impossible d'en forger un** — les
 * jetons Supabase sont vérifiés par JWKS. Le canal policy couvre en revanche
 * « toute la matrice §2, y compris les cas qu'aucune route n'expose ».
 */

/* -------------------------------------------------------------------------- */
/*  Fabriques d'acteurs                                                       */
/* -------------------------------------------------------------------------- */

const DEPARTMENT_A = "11111111-1111-4111-8111-111111111111";
const DEPARTMENT_B = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";

function actor(role: AdminRole, overrides: Partial<AdminProfile> = {}): AdminProfile {
  // Cohérence rôle ↔ scope ↔ département : c'est celle qu'impose
  // `admin_profiles_scope_coherence` (`docs/032` §3.1). Un profil incohérent
  // n'existe pas en base, et le simuler ici donnerait des refus dont on ne
  // saurait plus s'ils viennent de la policy ou du profil.
  const scope: AdminScope = role === "DEPARTMENT_MANAGER" ? "DEPARTMENT" : "GLOBAL";
  return {
    id: ADMIN_ID,
    username: role.toLowerCase(),
    displayName: null,
    role,
    scope,
    departmentId: role === "DEPARTMENT_MANAGER" ? DEPARTMENT_A : null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const superAdmin = actor("SUPER_ADMIN");
const admin = actor("ADMIN");
const managerA = actor("DEPARTMENT_MANAGER");
const managerB = actor("DEPARTMENT_MANAGER", { departmentId: DEPARTMENT_B });

/* -------------------------------------------------------------------------- */
/*  N-01 → N-07 — Demandes de prière (D-03, D-10, D-11)                       */
/* -------------------------------------------------------------------------- */

describe("PrayerRequest — le domaine est inexistant pour le SUPER_ADMIN (D-10)", () => {
  const envelope = { envelopeRecipientIds: [ADMIN_ID] };

  /**
   * N-01 / N-02 / N-03 / N-04 — le refus couvre **toutes** les actions, y
   * compris l'agrégat.
   *
   * Le parcours exhaustif de la table (`sweep`) est le point important : il ne
   * se contente pas de tester les actions auxquelles on pense. Si une action
   * était ajoutée demain à `PrayerPolicy`, ce test la refuserait au
   * `SUPER_ADMIN` **sans qu'on ait à y penser** — c'est exactement la propriété
   * que D-10 exige d'un refus de fond.
   */
  it("N-01/02/03/04 — refuse TOUTES les actions, présentes et futures", () => {
    const results = sweep(PrayerPolicy, superAdmin, envelope);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => !r.allowed)).toBe(true);
  });

  it("N-02 — le refus est motivé par D-10, pas par un rôle insuffisant", () => {
    const decision = evaluate(PrayerPolicy, superAdmin, "READ", envelope);
    expect(decision.allowed).toBe(false);
    // Le motif n'est jamais exposé au client (docs/029 §4.5) ; il est en revanche
    // journalisé et testé ici, pour qu'une régression de la règle soit lisible.
    expect(decision.reason).toContain("D-10");
  });

  it("N-06 — un DEPARTMENT_MANAGER n'a aucun accès : une prière n'appartient à aucun département", () => {
    expect(evaluate(PrayerPolicy, managerA, "READ").allowed).toBe(false);
    expect(evaluate(PrayerPolicy, managerA, "READ_AGGREGATE").allowed).toBe(false);
  });

  it("N-07 — la soumission est réservée au visiteur : aucun rôle administratif ne la détient", () => {
    for (const who of [superAdmin, admin, managerA]) {
      expect(evaluate(PrayerPolicy, who, "SUBMIT").allowed).toBe(false);
    }
  });

  it("l'ADMIN lit, mais ne déchiffre que s'il porte une clé enveloppée (D-11)", () => {
    expect(evaluate(PrayerPolicy, admin, "READ").allowed).toBe(true);
    expect(evaluate(PrayerPolicy, admin, "READ_AGGREGATE").allowed).toBe(true);

    // Sans enveloppe : refus. C'est la différence entre « avoir le rôle » et
    // « avoir la clé » — le déchiffrement n'est pas un attribut du rôle.
    expect(evaluate(PrayerPolicy, admin, "DECRYPT", { envelopeRecipientIds: [] }).allowed).toBe(false);
    expect(evaluate(PrayerPolicy, admin, "DECRYPT", envelope).allowed).toBe(true);
  });

  it("D-16 / cellule 8.6 — la purge automatique est refusée à tout le monde, l'archivage manuel reste à l'ADMIN", () => {
    for (const who of [superAdmin, admin, managerA]) {
      expect(evaluate(PrayerPolicy, who, "PURGE").allowed).toBe(false);
    }
    // Cellule 8.4 : « VALIDATE / ARCHIVE » sont des actes manuels de traitement,
    // réservés à l'ADMIN — et refusés au SUPER_ADMIN par l'exclusion D-10.
    expect(evaluate(PrayerPolicy, admin, "ARCHIVE").allowed).toBe(true);
    expect(evaluate(PrayerPolicy, superAdmin, "ARCHIVE").allowed).toBe(false);
    // Cellule 8.5 : la suppression manuelle n'est pas tranchée (Q-19) → refus.
    expect(evaluate(PrayerPolicy, admin, "DELETE").allowed).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  N-08 → N-10 — Publications : le département est une donnée                */
/* -------------------------------------------------------------------------- */

describe("Publication — périmètre départemental et règle des 3 (D-06, D-18)", () => {
  const published = (departmentId: string | null) =>
    ({ departmentId, status: "PUBLISHED" }) as const;

  it("N-08/N-09 — un responsable n'agit jamais sur le département d'un autre", () => {
    expect(evaluate(PublicationPolicy, managerA, "UPDATE", published(DEPARTMENT_B)).allowed).toBe(false);
    expect(evaluate(PublicationPolicy, managerB, "UPDATE", published(DEPARTMENT_A)).allowed).toBe(false);
    // Le pendant positif, indispensable : le refus croisé ne doit pas venir d'un
    // refus général. Sans cette assertion, deux refus symétriques pourraient
    // n'être que l'absence de tout droit.
    expect(evaluate(PublicationPolicy, managerA, "UPDATE", published(DEPARTMENT_A)).allowed).toBe(true);
  });

  it("N-10 — le département vient du profil : une cible étrangère est refusée même à la création", () => {
    expect(evaluate(PublicationPolicy, managerA, "CREATE", { departmentId: DEPARTMENT_B }).allowed).toBe(false);
    // Cible absente : admise, car le département sera **forcé** depuis le profil
    // par la couche applicative (docs/029 P-01, « département forcé »).
    expect(evaluate(PublicationPolicy, managerA, "CREATE").allowed).toBe(true);
  });

  it("une publication sans département vaut refus en mode « equality » (docs/029 §4.3)", () => {
    expect(evaluate(PublicationPolicy, managerA, "UPDATE", { departmentId: null }).allowed).toBe(false);
  });

  it("D-18/XD-14 — UNARCHIVE est refusé à tout le monde, y compris au SUPER_ADMIN", () => {
    for (const who of [superAdmin, admin, managerA]) {
      expect(evaluate(PublicationPolicy, who, "UNARCHIVE", published(DEPARTMENT_A)).allowed).toBe(false);
    }
  });

  it("D-18/D-20 — une publication ARCHIVED n'est ni modifiable, ni supprimable, ni republiable", () => {
    const archived = { departmentId: DEPARTMENT_A, status: "ARCHIVED" } as const;
    expect(evaluate(PublicationPolicy, managerA, "UPDATE", archived).allowed).toBe(false);
    expect(evaluate(PublicationPolicy, admin, "DELETE", archived).allowed).toBe(false);
    expect(evaluate(PublicationPolicy, admin, "PUBLISH", archived).allowed).toBe(false);
  });

  it("D-18 — seule une publication PUBLISHED s'archive : la transition DRAFT → ARCHIVED n'existe pas", () => {
    const draft = { departmentId: DEPARTMENT_A, status: "DRAFT" } as const;
    expect(evaluate(PublicationPolicy, admin, "ARCHIVE", draft).allowed).toBe(false);
    expect(evaluate(PublicationPolicy, admin, "ARCHIVE", published(DEPARTMENT_A)).allowed).toBe(true);
  });

  it("D-06 — le responsable publie SANS validation préalable", () => {
    expect(evaluate(PublicationPolicy, managerA, "PUBLISH", published(DEPARTMENT_A)).allowed).toBe(true);
  });

  it("Q-07 — la suppression par un responsable n'est pas tranchée, donc refusée (défaut ✘)", () => {
    expect(evaluate(PublicationPolicy, managerA, "DELETE", published(DEPARTMENT_A)).allowed).toBe(false);
    expect(evaluate(PublicationPolicy, admin, "DELETE", published(DEPARTMENT_A)).allowed).toBe(true);
  });

  it("la lecture de collection d'un responsable est bornée en requête (jamais filtrée après coup)", () => {
    expect(listScopeFor(managerA)).toEqual({ departmentId: DEPARTMENT_A });
    expect(listScopeFor(managerB)).toEqual({ departmentId: DEPARTMENT_B });
    // Scope GLOBAL : la clause départementale de §4.3 est vraie par construction.
    expect(listScopeFor(admin)).toBeNull();
    expect(listScopeFor(superAdmin)).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  N-14 → N-18 — Médias : trois droits, aucune déduction (D-21, D-22)        */
/* -------------------------------------------------------------------------- */

describe("Média — aucun partage par défaut, aucune hiérarchie entre les droits", () => {
  const both = { canUse: true, canManage: true, canDelete: true };

  it("XD-07 — un DEPARTMENT_MANAGER ne peut JAMAIS supprimer un média", () => {
    expect(evaluate(MediaPolicy, managerA, "DELETE").allowed).toBe(false);
    // Même avec un droit maximal accordé : la donnée ne peut pas le lui donner,
    // et la base l'interdit aussi (media_access_department_no_delete).
    expect(
      evaluate(MediaPolicy, managerA, "DELETE", { departmentAccess: both }).allowed,
    ).toBe(false);
  });

  it("N-15 / D-22 — un responsable n'accorde jamais d'accès, même pour son propre département", () => {
    const decision = evaluate(MediaAccessPolicy, managerA, "GRANT_ACCESS", {
      granteeType: "DEPARTMENT",
      granteeId: DEPARTMENT_A,
      ...both,
    });
    expect(decision.allowed).toBe(false);
  });

  it("N-14 / XD-08 — l'auto-attribution est refusée quelle que soit la charge utile", () => {
    for (const rights of [{ canUse: true, canManage: false, canDelete: false }, both]) {
      const decision = evaluate(MediaAccessPolicy, managerA, "GRANT_ACCESS", {
        granteeType: "ADMIN_PROFILE",
        granteeId: ADMIN_ID,
        ...rights,
      });
      expect(decision.allowed).toBe(false);
    }
  });

  it("N-17 / XD-09 — sans MediaAccess USE, un média reste inaccessible au département", () => {
    expect(evaluate(MediaPolicy, managerA, "USE").allowed).toBe(false);
    expect(evaluate(MediaPolicy, managerA, "USE", { departmentAccess: { canUse: false, canManage: true, canDelete: false } }).allowed).toBe(false);
    expect(evaluate(MediaPolicy, managerA, "USE", { departmentAccess: { canUse: true, canManage: false, canDelete: false } }).allowed).toBe(true);
  });

  it("N-18 / D-21 — MANAGE ne se déduit pas de USE, et réciproquement", () => {
    const useOnly = { canUse: true, canManage: false, canDelete: false };
    const manageOnly = { canUse: false, canManage: true, canDelete: false };
    expect(evaluate(MediaPolicy, managerA, "MANAGE", { departmentAccess: useOnly }).allowed).toBe(false);
    expect(evaluate(MediaPolicy, managerA, "USE", { departmentAccess: manageOnly }).allowed).toBe(false);
    expect(evaluate(MediaPolicy, managerA, "MANAGE", { departmentAccess: manageOnly }).allowed).toBe(true);
  });

  it("D-22 / docs/032 §3.4 — un grant qui n'accorde rien n'est pas une autorisation", () => {
    const decision = evaluate(MediaPolicy, admin, "GRANT_ACCESS", {
      grantTarget: {
        granteeType: "DEPARTMENT",
        granteeId: DEPARTMENT_A,
        rights: { canUse: false, canManage: false, canDelete: false },
      },
    });
    expect(decision.allowed).toBe(false);
  });

  it("XD-07 — un grant à un département ne peut jamais porter DELETE", () => {
    const decision = evaluate(MediaPolicy, admin, "GRANT_ACCESS", {
      grantTarget: {
        granteeType: "DEPARTMENT",
        granteeId: DEPARTMENT_A,
        rights: { canUse: true, canManage: false, canDelete: true },
      },
    });
    expect(decision.allowed).toBe(false);
  });

  it("Q-10 — le remplacement d'un média n'est pas tranché, donc refusé", () => {
    expect(evaluate(MediaPolicy, admin, "REPLACE").allowed).toBe(false);
    expect(evaluate(MediaPolicy, superAdmin, "REPLACE").allowed).toBe(false);
  });

  /**
   * Cellule 5.2 — le registre n'est pas public, et un responsable n'y voit que
   * les médias pour lesquels un droit existe.
   *
   * `docs/029` §4.3 exige un refus sur une ressource « sans département ». Un
   * média n'en a **jamais** (X27) : c'est donc le droit explicite qui tient lieu
   * de rattachement, et son absence vaut invisibilité.
   */
  it("cellule 5.2 — un responsable ne voit que les médias autorisés pour son département", () => {
    expect(evaluate(MediaPolicy, managerA, "READ", {}).allowed).toBe(false);
    expect(
      evaluate(MediaPolicy, managerA, "READ", {
        departmentAccess: { canUse: true, canManage: false, canDelete: false },
      }).allowed,
    ).toBe(true);
    // ADMIN et SUPER_ADMIN voient la bibliothèque centrale entière (D-22).
    expect(evaluate(MediaPolicy, admin, "READ", {}).allowed).toBe(true);
  });

  it("cellule 6.1 / Q-11 — un responsable ne lit pas la table des autorisations", () => {
    expect(evaluate(MediaAccessPolicy, managerA, "READ").allowed).toBe(false);
    expect(evaluate(MediaAccessPolicy, admin, "READ").allowed).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/*  N-11 → N-13 — Profils : la hiérarchie qui n'en est pas une (D-03, D-04)   */
/* -------------------------------------------------------------------------- */

describe("Profils — D-04 : l'ADMIN n'est pas inférieur, il est différent", () => {
  /**
   * Une cible de policy porte **deux** états : celui du compte aujourd'hui
   * (`current`) et celui qu'on veut écrire (`requested`). Les confondre est le
   * défaut que la séparation ferme : une requête qui réécrit un `SUPER_ADMIN` en
   * `ADMIN` présenterait un rôle ordinaire, et l'exclusion XD-03 ne se
   * déclencherait pas.
   */
  const state = (role: AdminRole) =>
    role === "DEPARTMENT_MANAGER"
      ? { role, scope: "DEPARTMENT" as AdminScope, departmentId: DEPARTMENT_A }
      : { role, scope: "GLOBAL" as AdminScope, departmentId: null };

  const target = (role: AdminRole) => ({ id: "t", current: state(role) });

  it("N-13 — un ADMIN ne crée pas un ADMIN (D-03)", () => {
    expect(evaluate(UserPolicy, admin, "CREATE_ADMIN", target("ADMIN")).allowed).toBe(false);
    expect(evaluate(UserPolicy, superAdmin, "CREATE_ADMIN", target("ADMIN")).allowed).toBe(true);
  });

  it("N-11 — un ADMIN ne crée pas un SUPER_ADMIN (D-04)", () => {
    expect(evaluate(UserPolicy, admin, "CREATE_SUPER_ADMIN", target("SUPER_ADMIN")).allowed).toBe(false);
  });

  it("N-12 / XD-03 — un ADMIN n'administre jamais un compte SUPER_ADMIN, quelle que soit l'action", () => {
    const results = sweep(UserPolicy, admin, target("SUPER_ADMIN"));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => !r.allowed)).toBe(true);
  });

  /**
   * Le cas serré : le compte administré **est** un `SUPER_ADMIN`, et la requête
   * prétend lui écrire un rôle ordinaire. L'exclusion doit se déclencher sur
   * `current`, pas sur `requested` — sinon il suffirait de rétrograder le compte
   * dans la même requête pour pouvoir l'administrer.
   */
  it("XD-03 ne se contourne pas en réécrivant le rôle dans la même requête", () => {
    const disguised = {
      id: "t",
      current: state("SUPER_ADMIN"),
      requested: state("ADMIN"),
    };

    expect(evaluate(UserPolicy, admin, "UPDATE_ROLE_SCOPE", disguised).allowed).toBe(false);
  });

  it("Q-03 — un SUPER_ADMIN n'administre pas non plus un compte SUPER_ADMIN", () => {
    const other = { id: "t", current: state("SUPER_ADMIN"), requested: state("ADMIN") };
    expect(evaluate(UserPolicy, superAdmin, "UPDATE_ROLE_SCOPE", other).allowed).toBe(false);
    expect(evaluate(UserPolicy, superAdmin, "DEACTIVATE", other).allowed).toBe(false);
  });

  it("D-04 — l'ADMIN crée un responsable : c'est SA capacité propre", () => {
    expect(evaluate(UserPolicy, admin, "CREATE", target("DEPARTMENT_MANAGER")).allowed).toBe(true);
  });

  it("D-02 — un responsable sans département est refusé avant toute écriture", () => {
    const incoherent = { id: "t", current: { role: "DEPARTMENT_MANAGER" as AdminRole, scope: "DEPARTMENT" as AdminScope, departmentId: null } };
    expect(evaluate(UserPolicy, superAdmin, "CREATE", incoherent).allowed).toBe(false);
    // Un rôle système porteur d'un département est tout aussi incohérent.
    const wrongScope = { id: "t", current: { role: "ADMIN" as AdminRole, scope: "DEPARTMENT" as AdminScope, departmentId: DEPARTMENT_A } };
    expect(evaluate(UserPolicy, superAdmin, "CREATE_ADMIN", wrongScope).allowed).toBe(false);
  });

  it("la cohérence est vérifiée sur l'état DEMANDÉ, pas sur l'ancien", () => {
    // Le compte est un responsable cohérent ; la requête demande un état
    // incohérent (un rôle système **avec** un département). Vérifier `current`
    // laisserait passer cette écriture.
    const account = { id: "t", current: state("DEPARTMENT_MANAGER") };
    const incoherentWrite = {
      ...account,
      requested: {
        role: "ADMIN" as AdminRole,
        scope: "GLOBAL" as AdminScope,
        departmentId: DEPARTMENT_A,
      },
    };

    expect(evaluate(UserPolicy, superAdmin, "UPDATE_ROLE_SCOPE", incoherentWrite).allowed).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  D-25 / D-26 — Événements : une capacité, jamais un nom de département      */
/* -------------------------------------------------------------------------- */

describe("Événement — la portée globale vient d'une capacité de département (D-25)", () => {
  const scoped = { departmentId: DEPARTMENT_A, visibilityScope: "DEPARTMENT" } as const;

  it("un département SANS la capacité ne publie pas à portée globale", () => {
    const decision = evaluate(EventPolicy, managerA, "CREATE", {
      ...scoped,
      visibilityScope: "GLOBAL",
      actorDepartmentCapabilities: [],
    });
    expect(decision.allowed).toBe(false);
  });

  it("un département AVEC la capacité le peut — sans qu'aucun nom n'apparaisse dans le code", () => {
    const decision = evaluate(EventPolicy, managerA, "CREATE", {
      ...scoped,
      visibilityScope: "GLOBAL",
      actorDepartmentCapabilities: [DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL],
    });
    expect(decision.allowed).toBe(true);
  });

  it("un ADMIN n'a pas besoin de capacité : son périmètre est global", () => {
    expect(
      evaluate(EventPolicy, admin, "CREATE", { ...scoped, visibilityScope: "GLOBAL" }).allowed,
    ).toBe(true);
  });

  it("Q-08 — la suppression par un responsable n'est pas tranchée, donc refusée", () => {
    expect(evaluate(EventPolicy, managerA, "DELETE", scoped).allowed).toBe(false);
    expect(evaluate(EventPolicy, admin, "DELETE", scoped).allowed).toBe(true);
  });

  it("D-26 — un événement sans département responsable n'existe pas", () => {
    // La règle vit d'abord dans la base (`department_id NOT NULL`) ; elle est
    // aussi rendue lisible côté couche d'autorisation, comme `docs/029` §4.1
    // l'inscrit (`assertDepartmentRequired`).
    expect(() => assertDepartmentRequired({ departmentId: null })).toThrow(/D-26/);
    expect(() => assertDepartmentRequired({ departmentId: DEPARTMENT_A })).not.toThrow();

    // Et une instance sans département est refusée, comme partout en mode
    // « equality » (docs/029 §4.3).
    expect(evaluate(EventPolicy, managerA, "UPDATE", { departmentId: null, visibilityScope: "DEPARTMENT" }).allowed).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  D-23 — Pages : les refus structurels valent pour TOUS les rôles            */
/* -------------------------------------------------------------------------- */

describe("Pages et paramètres — des refus qui ne dépendent d'aucun rôle", () => {
  it("D-23 — créer, supprimer, restructurer une page ou ajouter une section est refusé à tout le monde", () => {
    const structural: PolicyAction[] = ["CREATE", "DELETE", "MODIFY_STRUCTURE", "CREATE_SECTION"];
    for (const who of [superAdmin, admin, managerA]) {
      for (const action of structural) {
        expect(evaluate(PagePolicy, who, action, { pageKey: "accueil" }).allowed).toBe(false);
      }
    }
  });

  it("D-23 — l'édition du CONTENU reste ouverte à l'ADMIN : le refus porte sur la structure, pas sur l'éditorial", () => {
    expect(evaluate(PagePolicy, admin, "UPDATE", { pageKey: "accueil" }).allowed).toBe(true);
    // Cellule 7.3 : le rôle qui édite la page [Département] n'est nommé nulle
    // part (Q-05) → refus par défaut pour le responsable.
    expect(evaluate(PagePolicy, managerA, "UPDATE", { pageKey: "departement" }).allowed).toBe(false);
  });

  it("cellule 4.6 — re-scoper un événement n'est autorisé à personne : Q-06 n'est pas tranchée", () => {
    for (const who of [superAdmin, admin, managerA]) {
      expect(
        evaluate(EventPolicy, who, "SET_VISIBILITY_SCOPE", {
          departmentId: DEPARTMENT_A,
          visibilityScope: "GLOBAL",
          actorDepartmentCapabilities: [DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL],
        }).allowed,
      ).toBe(false);
    }
  });

  it("cellule 2.3 — modifier les informations d'un département n'est pas attribué à son responsable", () => {
    expect(evaluate(DepartmentPolicy, managerA, "UPDATE", { id: DEPARTMENT_A }).allowed).toBe(false);
    expect(evaluate(DepartmentPolicy, admin, "UPDATE", { id: DEPARTMENT_A }).allowed).toBe(true);
  });

  it("cellule 1.7 / Q-03 — un SUPER_ADMIN n'administre pas un autre SUPER_ADMIN depuis l'application", () => {
    const other = {
      id: "autre",
      current: { role: "SUPER_ADMIN" as AdminRole, scope: "GLOBAL" as AdminScope, departmentId: null },
    };
    expect(evaluate(UserPolicy, superAdmin, "UPDATE_ROLE_SCOPE", other).allowed).toBe(false);
    expect(evaluate(UserPolicy, superAdmin, "DEACTIVATE", other).allowed).toBe(false);
  });

  it("X25 — les paramètres ne sont jamais exposés à un responsable de département", () => {
    // X25 est **définitif** : « cette catégorie ne doit pas être exposée aux
    // responsables de département ». Aucun arbitrage ne l'a rouvert.
    expect(evaluate(SiteSettingsPolicy, managerA, "READ").allowed).toBe(false);
    expect(evaluate(SiteSettingsPolicy, managerA, "UPDATE").allowed).toBe(false);

    // L'`ADMIN` configure les paramètres — arbitrage du commanditaire :
    // « C'est l'admin qui fait ces configurations » (Q-13, Q-28).
    expect(evaluate(SiteSettingsPolicy, admin, "UPDATE").allowed).toBe(true);
  });

  it("Q-06 — modifier les capacités d'un département est réservé aux rôles globaux", () => {
    // Le vecteur d'escalade signalé par `docs/029` §5.3 était un **responsable**
    // modifiant les capacités de son propre département. L'arbitrage désigne les
    // rôles globaux : le responsable reste dehors, définitivement.
    expect(evaluate(DepartmentPolicy, managerA, "EDIT_CAPABILITIES", { id: DEPARTMENT_A }).allowed).toBe(false);
    expect(evaluate(DepartmentPolicy, admin, "EDIT_CAPABILITIES", { id: DEPARTMENT_A }).allowed).toBe(true);
    expect(evaluate(DepartmentPolicy, superAdmin, "EDIT_CAPABILITIES", { id: DEPARTMENT_A }).allowed).toBe(true);
  });

  it("020 §11 — un responsable n'édite pas les propriétés structurelles de son département", () => {
    expect(evaluate(DepartmentPolicy, managerA, "UPDATE_STRUCTURE", { id: DEPARTMENT_A }).allowed).toBe(false);
    expect(evaluate(DepartmentPolicy, admin, "UPDATE_STRUCTURE", { id: DEPARTMENT_A }).allowed).toBe(true);
  });

  it("D-02 — un responsable ne lit que SON département", () => {
    expect(evaluate(DepartmentPolicy, managerA, "READ", { id: DEPARTMENT_A }).allowed).toBe(true);
    expect(evaluate(DepartmentPolicy, managerA, "READ", { id: DEPARTMENT_B }).allowed).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  D-10 — Notifications : une fuite par un autre chemin                      */
/* -------------------------------------------------------------------------- */

describe("Notifications — D-10 ferme la voie indirecte", () => {
  it("N-04 — aucune notification du domaine des prières n'atteint le SUPER_ADMIN", () => {
    const decision = evaluate(NotificationPolicy, superAdmin, "READ", {
      recipientUserId: ADMIN_ID,
      type: "PRAYER_REQUEST_RECEIVED",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("D-10");
  });

  /**
   * **Correction d'une lecture antérieure.**
   *
   * Ce test affirmait d'abord l'inverse — que D-10 ne privait pas le
   * `SUPER_ADMIN` des notifications de **sécurité des clés**, au motif qu'il
   * devait pouvoir constater la révocation d'une clé. C'était une déduction, et
   * elle contredisait le texte : `docs/032` §3.3, qui transcrit le trigger
   * `notifications_check_recipient_role`, écrit que ces notifications vont « à
   * TOUS les Admins et **JAMAIS** au `SUPER_ADMIN` » (`docs/030` §4.7 et §6.2).
   *
   * Le cycle de vie des clés de prière appartient au **domaine des prières** :
   * D-10 le ferme entièrement au `SUPER_ADMIN`, comme le reste.
   */
  it("D-10 ferme aussi au SUPER_ADMIN les notifications de sécurité des clés (docs/030 §4.7)", () => {
    for (const type of ["KEY_REGISTERED", "KEY_REVOKED", "RECOVERY_KEY_CHANGED"] as const) {
      const decision = evaluate(NotificationPolicy, superAdmin, "READ", {
        recipientUserId: superAdmin.id,
        type,
      });

      expect({ type, allowed: decision.allowed }).toEqual({ type, allowed: false });
      expect(decision.reason).toContain("D-10");
    }
  });

  it("un DEPARTMENT_MANAGER n'a aucune part au domaine des prières", () => {
    const decision = evaluate(NotificationPolicy, managerA, "READ", {
      recipientUserId: managerA.id,
      type: "PRAYER_REQUEST_RECEIVED",
    });

    expect(decision.allowed).toBe(false);
  });

  it("l'ADMIN, lui, reçoit les notifications du domaine", () => {
    for (const type of ["PRAYER_REQUEST_RECEIVED", "KEY_REVOKED"] as const) {
      expect(
        evaluate(NotificationPolicy, admin, "READ", { recipientUserId: ADMIN_ID, type }).allowed,
      ).toBe(true);
    }
  });

  it("une notification se lit par identité, jamais par rôle", () => {
    expect(
      evaluate(NotificationPolicy, admin, "READ", {
        recipientUserId: "quelqu-un-dautre",
        type: "KEY_REGISTERED",
      }).allowed,
    ).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  Exhaustivité et invariants statiques                                      */
/* -------------------------------------------------------------------------- */

describe("Catalogue — exhaustivité et invariants statiques (docs/029 §5, §6.1)", () => {
  it("les 14 policies de docs/029 §4.1 et §4.6 sont présentes", () => {
    expect(POLICY_CATALOGUE).toHaveLength(16);
    const names = POLICY_CATALOGUE.map((p) => p.name);
    expect(new Set(names).size).toBe(16);
    for (const expected of [
      "PublicationPolicy",
      "MediaPolicy",
      "EventPolicy",
      "DepartmentPolicy",
      "PagePolicy",
      "PrayerPolicy",
      "UserPolicy",
      "MediaAccessPolicy",
      "NotificationPolicy",
      "AuditPolicy",
      "EditorialEntityPolicy",
      "ScripturePolicy",
      "SchedulePolicy",
      "SiteSettingsPolicy",
      "TeachingPolicy",
      "ResourcePolicy",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("chaque policy déclare au moins une action, et un refus ne lève jamais d'exception", () => {
    for (const policy of POLICY_CATALOGUE) {
      expect(policy.actions.length).toBeGreaterThan(0);
      for (const action of policy.actions) {
        for (const who of [superAdmin, admin, managerA]) {
          // Un refus doit être **rendu**, jamais levé : docs/029 §4.5 règle 2,
          // « un refus ne doit jamais être rendu par une erreur 500 ».
          expect(() => evaluate(policy as never, who, action)).not.toThrow();
        }
      }
    }
  });

  /**
   * Les cinq policies non arbitrées refusent, et leur refus **nomme la
   * question**.
   *
   * C'est ce qui distingue un refus provisoire d'un refus structurel : sans
   * cette assertion, une question ouverte et une décision définitive
   * produiraient le même `403` muet, et personne ne saurait qu'un arbitrage
   * manque.
   */
  /**
   * **Arbitrage du commanditaire : « C'est l'admin qui fait ces configurations. »**
   *
   * Ces cinq policies refusaient tout le monde tant que la question était
   * ouverte — c'était le défaut `✘` de `docs/029` §4.3, et il a produit son
   * effet : les modules concernés répondaient `403`, ce qui a **manifesté**
   * l'arbitrage manquant au lieu de le laisser dormir. L'arbitrage est
   * intervenu ; ce test fixe ce qu'il a changé, et ce qu'il n'a pas changé.
   */
  it("les configurations institutionnelles reviennent à l'ADMIN et au SUPER_ADMIN", () => {
    const configurations = [
      evaluate(EditorialEntityPolicy, admin, "UPDATE"),
      evaluate(ScripturePolicy, admin, "UPDATE"),
      evaluate(SchedulePolicy, admin, "UPDATE"),
      evaluate(SiteSettingsPolicy, admin, "UPDATE"),
      evaluate(DepartmentPolicy, admin, "EDIT_CAPABILITIES", { id: DEPARTMENT_A }),
    ];

    for (const decision of configurations) {
      expect(decision.allowed).toBe(true);
      // Plus aucune question ouverte : ces lignes n'ont plus à porter de `pending`.
      expect(decision.pending).toBeUndefined();
    }

    // Et le SUPER_ADMIN, à qui D-03 attribue « tous les pouvoirs du système ».
    for (const who of [superAdmin]) {
      expect(evaluate(ScripturePolicy, who, "UPDATE").allowed).toBe(true);
      expect(evaluate(SchedulePolicy, who, "UPDATE").allowed).toBe(true);
      expect(evaluate(EditorialEntityPolicy, who, "UPDATE").allowed).toBe(true);
    }
  });

  it("le responsable départemental ne configure rien de tout cela", () => {
    // Ni les entités éditoriales ni le rythme ne sont départementaux, et X25
    // ferme les paramètres de façon définitive.
    for (const decision of [
      evaluate(EditorialEntityPolicy, managerA, "UPDATE"),
      evaluate(ScripturePolicy, managerA, "UPDATE"),
      evaluate(SchedulePolicy, managerA, "UPDATE"),
      evaluate(SiteSettingsPolicy, managerA, "UPDATE"),
    ]) {
      expect(decision.allowed).toBe(false);
    }
  });

  it("la lecture du journal d'audit reste refusée : ce n'est pas une configuration", () => {
    // L'arbitrage portait sur les **configurations**. La lecture d'`audit_log`
    // (Q-16, Q-17, Q-18) n'en est pas une, et le refus par défaut continue de
    // s'appliquer — avec sa référence de question, pour qu'elle reste visible.
    const decision = evaluate(AuditPolicy, superAdmin, "READ");

    expect(decision.allowed).toBe(false);
    expect(decision.pending).toMatch(/Q-\d/);
  });

  it("une ligne accordée sous réserve porte aussi sa question ouverte", () => {
    // Q-P4 (lecture du responsable) et Q-05 (pages) sont ouvertes : la ligne
    // accorde **et** signale, sans quoi l'arbitrage ne porterait que sur les
    // refus — la moitié du problème.
    const granted = evaluate(PublicationPolicy, admin, "READ", { departmentId: DEPARTMENT_A, status: "PUBLISHED" });
    expect(granted.allowed).toBe(true);
    expect(granted.pending).toBe("docs/028 Q-P4");
  });

  /**
   * **D-09, D-25, XD-06, I12 — le nom d'un département n'entre jamais dans une
   * condition d'autorisation.**
   *
   * Le contrôle est **lexical et automatisé**, conformément au canal
   * « Statique » de `docs/029` §6.1. Une revue humaine ne tient pas cette
   * promesse : la forme interdite (`if (department.code === "…")`) est si
   * naturelle à écrire qu'elle reviendra un jour sans qu'on s'en aperçoive. Le
   * test lit donc la source, **commentaires retirés** — les commentaires citent
   * légitimement l'anti-pattern pour l'expliquer, et les confondre avec du code
   * rendrait le test impossible à satisfaire.
   */
  it("aucun nom de département, aucun accès à `slug`/`code` dans la couche d'autorisation", () => {
    const sources = [
      ...collectSources("src/presentation/policies"),
      ...collectSources("src/domain/departments"),
    ];
    expect(sources.length).toBeGreaterThan(0);

    // Noms des départements du référentiel (docs/036 : seuls deux publient) —
    // et non une liste de convenance : ce sont ceux dont on veut garantir qu'ils
    // n'apparaissent jamais dans une condition d'autorisation.
    const forbiddenNames = ["presse", "ecodume"];

    for (const { path, source } of sources) {
      const code = stripComments(source).toLowerCase();
      for (const name of forbiddenNames) {
        expect(`${path}:${code.includes(name)}`).toBe(`${path}:false`);
      }
      expect(`${path}:${/\.(slug|code)\b/.test(code)}`).toBe(`${path}:false`);
    }
  });
  /**
   * **Lot 1c — plus aucune route ne décide d'une autorisation par un rôle.**
   *
   * `docs/029` §4.2 range « un `if (req.admin.role === …)` dans un controller »
   * et « une décision d'autorisation prise dans le frontend » parmi les
   * interdits, et exige à la place « une policy, appelée par **un** garde
   * d'autorisation monté dans la chaîne de middlewares ». Ce contrôle est la
   * traduction exécutable de cette exigence, sur les 14 fichiers de routes.
   *
   * Il vérifie trois choses, et la troisième est la plus importante :
   *
   * 1. aucun fichier de routes ne monte `requireRole` ni ne nomme l'ancienne
   *    valeur `ROLE_ADMIN` — la décision de rôle a quitté la chaîne ;
   * 2. aucun fichier de routes ne compare un rôle à la main ;
   * 3. **chaque route d'écriture protégée porte un `authorize`**. C'est le point
   *    de non-régression réel : un `requireRole` oublié se voit à la compilation,
   *    mais **un `authorize` oublié, non** — la route resterait simplement
   *    ouverte à tout administrateur actif, et rien ne le signalerait. C'est
   *    pourquoi le test compte les deux.
   */
  it("aucune route ne décide par un rôle, et toute écriture protégée passe par une policy", () => {
    const routes = collectRouteSources();
    expect(routes.length).toBeGreaterThanOrEqual(14);

    for (const { path, source } of routes) {
      const code = stripComments(source);

      expect(`${path}:requirerole=${/requireRole\s*\(/.test(code)}`).toBe(`${path}:requirerole=false`);
      expect(`${path}:roleadmin=${/ROLE_ADMIN/.test(code)}`).toBe(`${path}:roleadmin=false`);
      // Une comparaison de rôle écrite à la main dans une route : exactement ce
      // que §4.2 interdit, quelle qu'en soit la formulation.
      expect(`${path}:rolecompare=${/\.role\s*===?/.test(code)}`).toBe(`${path}:rolecompare=false`);

      // Toute route d'écriture porte une décision. Une écriture **publique**
      // n'en porte pas (le formulaire de prière) : le compte des décisions peut
      // donc dépasser celui des écritures, jamais l'inverse — une écriture sans
      // décision signifierait qu'un `authorize` a été oublié quelque part.
      const writeRoutes = code.match(/router\.(post|patch|delete|put)\s*\(/g) ?? [];
      const authorizeCalls = code.match(/authorize\s*\(/g) ?? [];
      expect(`${path}:${authorizeCalls.length >= writeRoutes.length}`).toBe(`${path}:true`);
    }

    // Le contrôle agrégé : sur l'ensemble des fichiers de routes, il y a au
    // moins autant de décisions d'autorisation que de routes d'écriture.
    const totalWrites = routes.reduce(
      (sum, { source }) => sum + (stripComments(source).match(/router\.(post|patch|delete|put)\s*\(/g) ?? []).length,
      0,
    );
    const totalAuthorize = routes.reduce(
      (sum, { source }) => sum + (stripComments(source).match(/authorize\s*\(/g) ?? []).length,
      0,
    );
    expect(totalAuthorize).toBeGreaterThanOrEqual(totalWrites);
  });
});

/* -------------------------------------------------------------------------- */
/*  Utilitaires                                                               */
/* -------------------------------------------------------------------------- */

/** Tous les fichiers `.ts` d'un répertoire source, avec leur contenu. */
function collectSources(relativeDir: string): { path: string; source: string }[] {
  const absolute = join(process.cwd(), relativeDir);
  return readdirSync(absolute)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => ({
      path: `${relativeDir}/${name}`,
      source: readFileSync(join(absolute, name), "utf8"),
    }));
}

/** Les 14 fichiers de routes des modules, avec leur contenu. */
function collectRouteSources(): { path: string; source: string }[] {
  const modulesDir = join(process.cwd(), "src/modules");
  return readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      collectSources(`src/modules/${entry.name}`).filter((file) => file.path.endsWith(".routes.ts")),
    );
}

/**
 * Retire commentaires de bloc et de ligne.
 *
 * Volontairement approximatif : le `(^|[^:])` évite de traiter le `//` d'une URL
 * comme un commentaire. Le seul risque est de *conserver* un fragment de
 * commentaire — donc d'être **plus** strict, jamais plus permissif, ce qui est
 * le bon sens de l'erreur pour un test de non-régression lexicale.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
