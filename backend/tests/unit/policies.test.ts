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

  it("D-16 — aucune purge automatique, aucune suppression : la durée de conservation n'est pas arbitrée", () => {
    expect(evaluate(PrayerPolicy, admin, "DELETE").allowed).toBe(false);
    expect(evaluate(PrayerPolicy, admin, "ARCHIVE").allowed).toBe(false);
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
});

/* -------------------------------------------------------------------------- */
/*  N-11 → N-13 — Profils : la hiérarchie qui n'en est pas une (D-03, D-04)   */
/* -------------------------------------------------------------------------- */

describe("Profils — D-04 : l'ADMIN n'est pas inférieur, il est différent", () => {
  const target = (role: AdminRole) =>
    role === "DEPARTMENT_MANAGER"
      ? { id: "t", role, scope: "DEPARTMENT" as AdminScope, departmentId: DEPARTMENT_A }
      : { id: "t", role, scope: "GLOBAL" as AdminScope, departmentId: null };

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

  it("D-04 — l'ADMIN crée un responsable : c'est SA capacité propre", () => {
    expect(evaluate(UserPolicy, admin, "CREATE", target("DEPARTMENT_MANAGER")).allowed).toBe(true);
  });

  it("D-02 — un responsable sans département est refusé avant toute écriture", () => {
    const incoherent = { id: "t", role: "DEPARTMENT_MANAGER" as AdminRole, scope: "DEPARTMENT" as AdminScope, departmentId: null };
    expect(evaluate(UserPolicy, superAdmin, "CREATE", incoherent).allowed).toBe(false);
    // Un rôle système porteur d'un département est tout aussi incohérent.
    const wrongScope = { id: "t", role: "ADMIN" as AdminRole, scope: "DEPARTMENT" as AdminScope, departmentId: DEPARTMENT_A };
    expect(evaluate(UserPolicy, superAdmin, "CREATE_ADMIN", wrongScope).allowed).toBe(false);
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

  it("D-23 — l'édition du CONTENU reste ouverte : le refus porte sur la structure, pas sur l'éditorial", () => {
    expect(evaluate(PagePolicy, admin, "UPDATE", { pageKey: "accueil" }).allowed).toBe(true);
  });

  it("X25 — les paramètres ne sont jamais exposés à un responsable de département", () => {
    expect(evaluate(SiteSettingsPolicy, managerA, "READ").allowed).toBe(false);
    expect(evaluate(SiteSettingsPolicy, managerA, "UPDATE").allowed).toBe(false);
    // Et l'ADMIN n'y accède pas davantage : Q-13 n'est pas arbitrée.
    expect(evaluate(SiteSettingsPolicy, admin, "UPDATE").allowed).toBe(false);
  });

  it("Q-06 — modifier les capacités d'un département est refusé : c'est le vecteur d'escalade le plus direct", () => {
    for (const who of [superAdmin, admin, managerA]) {
      expect(evaluate(DepartmentPolicy, who, "EDIT_CAPABILITIES", { id: DEPARTMENT_A }).allowed).toBe(false);
    }
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
  it("N-04 — aucune notification de prière n'atteint le SUPER_ADMIN", () => {
    const decision = evaluate(NotificationPolicy, superAdmin, "READ", {
      recipientUserId: ADMIN_ID,
      type: "PRAYER_REQUEST_RECEIVED",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("D-10");
  });

  it("D-10 ne prive pas le SUPER_ADMIN des notifications de sécurité (docs/030 §4.7)", () => {
    const decision = evaluate(NotificationPolicy, superAdmin, "READ", {
      recipientUserId: superAdmin.id,
      type: "KEY_REVOKED",
    });
    expect(decision.allowed).toBe(true);
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
    expect(POLICY_CATALOGUE).toHaveLength(14);
    const names = POLICY_CATALOGUE.map((p) => p.name);
    expect(new Set(names).size).toBe(14);
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
  it("P-10 à P-14 refusent en nommant la question ouverte", () => {
    const pending = [
      evaluate(AuditPolicy, superAdmin, "READ"),
      evaluate(EditorialEntityPolicy, admin, "UPDATE"),
      evaluate(ScripturePolicy, admin, "UPDATE"),
      evaluate(SchedulePolicy, admin, "UPDATE"),
      evaluate(SiteSettingsPolicy, admin, "UPDATE"),
    ];
    for (const decision of pending) {
      expect(decision.allowed).toBe(false);
      // La référence de la question est **portée par la décision**, pas
      // seulement par un commentaire : c'est ce qui permet de lister les
      // arbitrages manquants sans relire le code.
      expect(decision.pending).toMatch(/Q-\d/);
    }
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
