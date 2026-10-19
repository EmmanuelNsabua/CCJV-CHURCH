import { describe, expect, it, jest } from "@jest/globals";
import type { AdminProfile } from "@/domain/entities";
import type {
  AdminIdentityProvider,
  CreatedIdentity,
} from "@/domain/identity/admin-identity-provider";
import type {
  AdminProfileRepository,
  DepartmentRepository,
} from "@/domain/repositories";
import { AdminService } from "@/modules/admin/admin.service";
import type {
  CreateAdminUserBody,
  SetAdminActivationBody,
  UpdateAdminAuthorizationBody,
} from "@/modules/admin/admin.schema";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Gestion des comptes d'administration, testée **sans base ni réseau**.
 *
 * `docs/026` §Lot 2 fixe les critères de ce volet, et ce sont exactement les cas
 * ci-dessous :
 *
 * - un `ADMIN` **crée** un responsable de département ;
 * - un `ADMIN` **ne peut pas** créer un `SUPER_ADMIN` ;
 * - un `ADMIN` **ne peut pas** créer un pair (`ADMIN`) ;
 * - un `ADMIN` **ne peut pas** administrer un compte `SUPER_ADMIN` existant ;
 * - un responsable ne peut rien administrer du tout.
 *
 * Le canal est celui de `docs/029` §6.1 : appel direct du service, avec un port
 * d'identité doublé. Un `403` HTTP exigerait un jeton réel — impossible à forger,
 * les jetons Supabase étant vérifiés par JWKS — et n'ajouterait rien : la
 * décision est prise par la policy, ici.
 */

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const MANAGER_ID = "22222222-2222-4222-8222-222222222222";
const DEPARTMENT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_DEPARTMENT_ID = "44444444-4444-4444-8444-444444444444";

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
/* -------------------------------------------------------------------------- */

function actor(role: AdminProfile["role"], overrides: Partial<AdminProfile> = {}): AdminProfile {
  const isManager = role === "DEPARTMENT_MANAGER";
  return {
    id: role === "SUPER_ADMIN" ? "99999999-9999-4999-8999-999999999999" : ADMIN_ID,
    username: role.toLowerCase(),
    displayName: null,
    role,
    scope: isManager ? "DEPARTMENT" : "GLOBAL",
    departmentId: isManager ? DEPARTMENT_ID : null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const superAdmin = actor("SUPER_ADMIN");
const admin = actor("ADMIN");
const manager = actor("DEPARTMENT_MANAGER");

/** Double du contrat `AdminProfileRepository`. */
function fakeAdminProfiles(seed: readonly AdminProfile[] = []) {
  const store = new Map<string, AdminProfile>(seed.map((item) => [item.id, item]));

  const repository: AdminProfileRepository = {
    async findById(id) {
      return store.get(id) ?? null;
    },
    async findByUsername() {
      return null;
    },
    async upsert(data) {
      const created: AdminProfile = {
        id: data.id,
        username: data.username,
        displayName: data.displayName ?? null,
        role: data.role,
        scope: data.scope,
        departmentId: data.departmentId ?? null,
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };
      store.set(created.id, created);
      return created;
    },
    async list() {
      return [...store.values()];
    },
    async updateAuthorization(id, data) {
      const existing = store.get(id);
      if (existing === undefined) return null;
      const updated: AdminProfile = {
        ...existing,
        role: data.role,
        scope: data.scope,
        departmentId: data.departmentId ?? null,
      };
      store.set(id, updated);
      return updated;
    },
    async setActive(id, isActive) {
      const existing = store.get(id);
      if (existing === undefined) return null;
      const updated: AdminProfile = { ...existing, isActive };
      store.set(id, updated);
      return updated;
    },
    async updateProfile(id, data) {
      const existing = store.get(id);
      if (existing === undefined) return null;
      const updated: AdminProfile = {
        ...existing,
        username: data.username !== undefined ? data.username.trim() : existing.username,
        displayName:
          data.displayName !== undefined ? data.displayName : existing.displayName,
      };
      store.set(id, updated);
      return updated;
    },
    async remove(id) {
      return store.delete(id);
    },
  };

  return { repository, store };
}

function fakeDepartments(known: readonly string[] = [DEPARTMENT_ID]) {
  const repository = {
    exists: jest.fn(async (id: string) => known.includes(id)),
  } as unknown as DepartmentRepository;

  return repository;
}

/** Double du port d'identité — aucun appel réseau, aucune écriture. */
function fakeIdentities(options: { failOnCreate?: boolean; failOnEmail?: boolean } = {}) {
  const created: string[] = [];
  const deleted: string[] = [];
  const activations: { id: string; isActive: boolean }[] = [];
  const emails: { id: string; email: string }[] = [];
  const passwords: { id: string; password: string }[] = [];
  const directory = new Map<string, string>([
    [MANAGER_ID, "responsable@ccjv.org"],
    [ADMIN_ID, "admin@ccjv.org"],
  ]);

  const provider: AdminIdentityProvider = {
    async createUser(): Promise<CreatedIdentity> {
      if (options.failOnCreate) {
        throw new Error("fournisseur indisponible");
      }
      return { id: MANAGER_ID };
    },
    async updateEmail(id, email) {
      if (options.failOnEmail) {
        throw new Error("adresse déjà prise");
      }
      emails.push({ id, email });
    },
    async updatePassword(id, password) {
      passwords.push({ id, password });
    },
    async findEmails(ids) {
      const found = new Map<string, string>();
      for (const id of ids) {
        const email = directory.get(id);
        if (email !== undefined) found.set(id, email);
      }
      return found;
    },
    async setActive(id, isActive) {
      activations.push({ id, isActive });
    },
    async deleteUser(id) {
      deleted.push(id);
    },
  };

  return { provider, created, deleted, activations, emails, passwords };
}

function service(
  profiles: AdminProfileRepository,
  departments = fakeDepartments(),
  identities = fakeIdentities(),
) {
  return {
    service: new AdminService(profiles, departments, identities.provider),
    identities,
  };
}

function managerBody(overrides: Partial<CreateAdminUserBody> = {}): CreateAdminUserBody {
  return {
    email: "responsable@ccjv.org",
    username: "responsable",
    role: "DEPARTMENT_MANAGER",
    departmentId: DEPARTMENT_ID,
    ...overrides,
  };
}

function expectAppError(received: unknown, code: AppError["code"], statusCode: number): AppError {
  expect(isAppError(received)).toBe(true);
  const error = received as AppError;
  expect(error.code).toBe(code);
  expect(error.statusCode).toBe(statusCode);
  return error;
}

async function capture(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

/* -------------------------------------------------------------------------- */
/*  Création — le critère central du Lot 2                                    */
/* -------------------------------------------------------------------------- */

describe("AdminService — création de comptes (D-03, D-04)", () => {
  it("un ADMIN crée un responsable de département", async () => {
    const { repository, store } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const created = await adminService.createUser(admin, managerBody());

    expect(created.role).toBe("DEPARTMENT_MANAGER");
    expect(created.scope).toBe("DEPARTMENT");
    expect(created.departmentId).toBe(DEPARTMENT_ID);
    expect(store.size).toBe(1);
  });

  it("un ADMIN ne peut PAS créer un SUPER_ADMIN — c'est la règle de docs/023 §6", async () => {
    const { repository, store } = fakeAdminProfiles();
    const { service: adminService, identities } = service(repository);

    const error = await capture(
      adminService.createUser(admin, {
        email: "chef@ccjv.org",
        username: "chef",
        role: "SUPER_ADMIN",
      }),
    );

    expectAppError(error, "FORBIDDEN", 403);
    // Et **rien** n'a été créé : ni profil, ni compte d'authentification. Un
    // refus qui laisserait un compte orphelin derrière lui serait pire qu'un
    // refus tardif.
    expect(store.size).toBe(0);
    expect(identities.deleted).toHaveLength(0);
  });

  it("un ADMIN ne peut PAS créer un pair (D-03 : la création d'un ADMIN est réservée au SUPER_ADMIN)", async () => {
    const { repository, store } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.createUser(admin, {
        email: "pair@ccjv.org",
        username: "pair",
        role: "ADMIN",
      }),
    );

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.size).toBe(0);
  });

  it("un SUPER_ADMIN peut créer les trois rôles — la policy est la même, la cible change", async () => {
    for (const role of ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] as const) {
      const { repository } = fakeAdminProfiles();
      const { service: adminService } = service(repository);

      const created = await adminService.createUser(
        superAdmin,
        role === "DEPARTMENT_MANAGER"
          ? managerBody()
          : { email: "x@ccjv.org", username: "x", role },
      );

      expect(created.role).toBe(role);
    }
  });

  it("un responsable ne crée aucun compte : il n'a rien dans ce domaine", async () => {
    const { repository } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(adminService.createUser(manager, managerBody()));

    expectAppError(error, "FORBIDDEN", 403);
  });

  /**
   * Le département de rattachement est vérifié **avant** toute écriture : inutile
   * de créer un compte d'authentification pour découvrir ensuite que le
   * département n'existe pas.
   */
  it("refuse un département inexistant avant de créer quoi que ce soit", async () => {
    const { repository, store } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.createUser(admin, managerBody({ departmentId: OTHER_DEPARTMENT_ID })),
    );

    expectAppError(error, "VALIDATION_ERROR", 400);
    expect(store.size).toBe(0);
  });

  /**
   * Compensation : un échec d'écriture du profil ne doit pas laisser un compte
   * capable de s'authentifier et dépourvu de tout droit.
   */
  it("supprime le compte d'authentification si le profil n'a pas pu être écrit", async () => {
    const { repository } = fakeAdminProfiles();
    jest
      .spyOn(repository, "upsert")
      .mockRejectedValue(new Error("écriture impossible"));
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.createUser(admin, managerBody()));

    expect((error as Error).message).toBe("écriture impossible");
    expect(identities.deleted).toEqual([MANAGER_ID]);
  });

  it("ne renvoie jamais le mot de passe, ni celui fourni ni celui généré", async () => {
    const { repository } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const created = await adminService.createUser(
      admin,
      managerBody({ password: "motdepasseprovisoire" }),
    );

    // Le DTO de profil ne porte aucun secret : la vérification porte sur l'objet
    // entier, pour qu'un champ ajouté plus tard ne passe pas inaperçu.
    expect(JSON.stringify(created)).not.toMatch(/motdepasseprovisoire|password/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  Identité du compte                                                        */
/* -------------------------------------------------------------------------- */

describe("AdminService — identité du compte (nom, adresse de connexion)", () => {
  const target = () => actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });

  it("un ADMIN ne corrige pas l'identité d'un compte : hypothèse alignée sur 1.5", async () => {
    const { repository, store } = fakeAdminProfiles([target()]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(
      adminService.updateIdentity(admin, MANAGER_ID, { username: "nouveau" }),
    );

    expectAppError(error, "FORBIDDEN", 403);
    // Refus **total** : ni le profil, ni le fournisseur d'identité.
    expect(store.get(MANAGER_ID)?.username).toBe("department_manager");
    expect(identities.emails).toHaveLength(0);
  });

  it("un SUPER_ADMIN corrige le nom, le nom affiché et l'adresse", async () => {
    const { repository, store } = fakeAdminProfiles([target()]);
    const { service: adminService, identities } = service(repository);

    const updated = await adminService.updateIdentity(superAdmin, MANAGER_ID, {
      username: "responsable-social",
      displayName: "Responsable des affaires sociales",
      email: "social@ccjv.org",
    });

    expect(updated.username).toBe("responsable-social");
    expect(updated.displayName).toBe("Responsable des affaires sociales");
    expect(store.get(MANAGER_ID)?.username).toBe("responsable-social");
    // L'adresse ne vit pas dans `admin_profiles` : elle part chez le fournisseur.
    expect(identities.emails).toEqual([
      { id: MANAGER_ID, email: "social@ccjv.org" },
    ]);
    expect(JSON.stringify(updated)).not.toMatch(/social@ccjv\.org/);
  });

  it("refuse de toucher au compte SUPER_ADMIN d'un pair : Q-03 non tranchée", async () => {
    const { repository } = fakeAdminProfiles([superAdmin]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(
      adminService.updateIdentity(superAdmin, superAdmin.id, {
        displayName: "moi-même",
      }),
    );

    expectAppError(error, "FORBIDDEN", 403);
    expect(identities.emails).toHaveLength(0);
  });

  /**
   * L'adresse est écrite **avant** l'identité applicative : le fournisseur est
   * le seul à pouvoir refuser pour un motif métier (adresse déjà prise), et le
   * tenter en premier évite de corriger un nom pour échouer ensuite.
   */
  it("un refus du fournisseur n'écrit rien côté profil", async () => {
    const { repository, store } = fakeAdminProfiles([target()]);
    const identities = fakeIdentities({ failOnEmail: true });
    const adminService = new AdminService(
      repository,
      fakeDepartments(),
      identities.provider,
    );

    const error = await capture(
      adminService.updateIdentity(superAdmin, MANAGER_ID, {
        username: "nouveau",
        email: "pris@ccjv.org",
      }),
    );

    expect((error as Error).message).toBe("adresse déjà prise");
    expect(store.get(MANAGER_ID)?.username).toBe("department_manager");
  });

  /**
   * Échec partiel : deux systèmes, aucune transaction commune. La réponse doit
   * dire ce qui a réellement eu lieu — jamais un succès silencieux, jamais un
   * « rien n'a changé » mensonger.
   */
  it("signale explicitement une adresse changée sans écriture du profil", async () => {
    const { repository } = fakeAdminProfiles([target()]);
    jest
      .spyOn(repository, "updateProfile")
      .mockRejectedValue(new Error("nom d'utilisateur déjà pris"));
    const { service: adminService, identities } = service(repository);

    const error = await capture(
      adminService.updateIdentity(superAdmin, MANAGER_ID, {
        username: "deja-pris",
        email: "nouvelle@ccjv.org",
      }),
    );

    const appError = expectAppError(error, "VALIDATION_ERROR", 400);
    expect(appError.message).toMatch(/adresse de connexion a été modifiée/i);
    expect(identities.emails).toEqual([
      { id: MANAGER_ID, email: "nouvelle@ccjv.org" },
    ]);
  });

  it("répond 404 sur un profil inconnu", async () => {
    const { repository } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.updateIdentity(superAdmin, MANAGER_ID, { username: "x" }),
    );

    expectAppError(error, "PROFILE_NOT_FOUND", 404);
  });
});

/* -------------------------------------------------------------------------- */
/*  Mot de passe                                                              */
/* -------------------------------------------------------------------------- */

describe("AdminService — mot de passe (aucun hachage maison)", () => {
  const target = () => actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
  const NEW_PASSWORD = "un-mot-de-passe-de-12-caracteres";

  it("un ADMIN ne réinitialise pas le mot de passe d'un autre compte", async () => {
    const { repository } = fakeAdminProfiles([target()]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(
      adminService.setPassword(admin, MANAGER_ID, { password: NEW_PASSWORD }),
    );

    expectAppError(error, "FORBIDDEN", 403);
    expect(identities.passwords).toHaveLength(0);
  });

  it("un SUPER_ADMIN le fait, et le service ne renvoie ni ne conserve le secret", async () => {
    const { repository } = fakeAdminProfiles([target()]);
    const { service: adminService, identities } = service(repository);

    const result = await adminService.setPassword(superAdmin, MANAGER_ID, {
      password: NEW_PASSWORD,
    });

    // Aucune valeur de retour : il n'y a rien à fuiter.
    expect(result).toBeUndefined();
    // Le secret part **tel quel** au fournisseur, qui l'empreint lui-même.
    expect(identities.passwords).toEqual([
      { id: MANAGER_ID, password: NEW_PASSWORD },
    ]);
  });

  it("un SUPER_ADMIN ne réinitialise pas le mot de passe d'un pair (Q-03)", async () => {
    const { repository } = fakeAdminProfiles([superAdmin]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(
      adminService.setPassword(superAdmin, superAdmin.id, {
        password: NEW_PASSWORD,
      }),
    );

    expectAppError(error, "FORBIDDEN", 403);
    expect(identities.passwords).toHaveLength(0);
  });

  it("répond 404 sur un profil inconnu", async () => {
    const { repository } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.setPassword(superAdmin, MANAGER_ID, { password: NEW_PASSWORD }),
    );

    expectAppError(error, "PROFILE_NOT_FOUND", 404);
  });

  /**
   * Le changement de **son propre** mot de passe est hors policy : sinon Q-03
   * rendrait le dernier `SUPER_ADMIN` incapable de faire tourner son secret.
   * La cible est alors l'identité du jeton, jamais un identifiant reçu.
   */
  it("chacun change son propre mot de passe, sans permission supplémentaire", async () => {
    for (const who of [superAdmin, admin, manager]) {
      const { repository } = fakeAdminProfiles([who]);
      const { service: adminService, identities } = service(repository);

      await adminService.changeOwnPassword(who, { password: NEW_PASSWORD });

      expect(identities.passwords).toEqual([
        { id: who.id, password: NEW_PASSWORD },
      ]);
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Annuaire                                                                  */
/* -------------------------------------------------------------------------- */

describe("AdminService — annuaire et adresses de connexion", () => {
  it("résout l'adresse de chaque profil, et rien de plus", async () => {
    const { repository } = fakeAdminProfiles([
      actor("DEPARTMENT_MANAGER", { id: MANAGER_ID }),
    ]);
    const { service: adminService } = service(repository);

    const { items } = await adminService.listProfiles({ page: 1, limit: 20 });
    const emails = await adminService.findEmails(items);

    expect(emails.get(MANAGER_ID)).toBe("responsable@ccjv.org");
    // Un profil sans adresse connue reste absent de la table : l'interface
    // affichera une valeur vide plutôt qu'une adresse inventée.
    expect(emails.size).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/*  Habilitation                                                              */
/* -------------------------------------------------------------------------- */

describe("AdminService — modification d'habilitation (cellule 1.5, arbitrée pour l'ADMIN)", () => {
  /**
   * Q-02 a été **tranchée par le commanditaire en faveur de l'`ADMIN`** : il
   * administre les responsables de département. Le test vérifie l'ouverture
   * *et* ses bornes — c'est la borne qui empêche l'auto-promotion.
   */
  it("un ADMIN déplace un responsable d'un département à un autre", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const departments = fakeDepartments([DEPARTMENT_ID, OTHER_DEPARTMENT_ID]);
    const { service: adminService } = service(repository, departments);

    const body: UpdateAdminAuthorizationBody = {
      role: "DEPARTMENT_MANAGER",
      departmentId: OTHER_DEPARTMENT_ID,
    };

    const updated = await adminService.updateAuthorization(admin, MANAGER_ID, body);

    expect(updated.departmentId).toBe(OTHER_DEPARTMENT_ID);
    expect(store.get(MANAGER_ID)?.departmentId).toBe(OTHER_DEPARTMENT_ID);
  });

  it("un ADMIN ne peut PAS promouvoir un responsable en ADMIN (D-03, D-04)", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.updateAuthorization(admin, MANAGER_ID, {
        role: "ADMIN",
        departmentId: null,
      }),
    );

    // S'attribuer un pouvoir par personne interposée est refusé : le rôle écrit
    // doit rester celui que l'ADMIN détient déjà, c'est-à-dire aucun rôle système.
    expectAppError(error, "FORBIDDEN", 403);
    expect(store.get(MANAGER_ID)?.role).toBe("DEPARTMENT_MANAGER");
  });

  it("un ADMIN n'administre pas un pair ADMIN", async () => {
    const peer = actor("ADMIN", { id: MANAGER_ID, username: "pair" });
    const { repository } = fakeAdminProfiles([peer]);
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.updateAuthorization(admin, MANAGER_ID, {
        role: "ADMIN",
        departmentId: null,
      }),
    );

    expectAppError(error, "FORBIDDEN", 403);
  });

  it("un SUPER_ADMIN le peut, et le périmètre suit le rôle", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository } = fakeAdminProfiles([target]);
    const { service: adminService } = service(repository);

    const promoted = await adminService.updateAuthorization(superAdmin, MANAGER_ID, {
      role: "ADMIN",
      departmentId: null,
    });

    expect(promoted.role).toBe("ADMIN");
    // Le scope n'est pas une entrée : il **découle** du rôle (D-02). Un ADMIN
    // promu depuis un poste de responsable ne peut pas garder son rattachement.
    expect(promoted.scope).toBe("GLOBAL");
    expect(promoted.departmentId).toBeNull();
  });

  it("refuse de modifier son propre compte SUPER_ADMIN : Q-03 n'est pas tranchée", async () => {
    const { repository } = fakeAdminProfiles([superAdmin]);
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.updateAuthorization(superAdmin, superAdmin.id, {
        role: "ADMIN",
        departmentId: null,
      }),
    );

    expectAppError(error, "FORBIDDEN", 403);
  });

  it("répond 404 sur un profil inconnu, jamais une panne", async () => {
    const { repository } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(
      adminService.updateAuthorization(superAdmin, MANAGER_ID, {
        role: "ADMIN",
        departmentId: null,
      }),
    );

    expectAppError(error, "PROFILE_NOT_FOUND", 404);
  });
});

/* -------------------------------------------------------------------------- */
/*  Activation                                                                */
/* -------------------------------------------------------------------------- */

describe("AdminService — activation et désactivation (cellule 1.6)", () => {
  const body: SetAdminActivationBody = { isActive: false };

  /**
   * Q-A4 a été **tranchée en faveur de l'`ADMIN`** : il suspend et réactive les
   * responsables de département. Révoquer un accès reste une opération sensible,
   * mais elle n'est plus réservée au compte suprême.
   */
  it("un ADMIN désactive puis réactive un responsable", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const { service: adminService, identities } = service(repository);

    const disabled = await adminService.setActivation(admin, MANAGER_ID, body);

    expect(disabled.isActive).toBe(false);
    expect(store.get(MANAGER_ID)?.isActive).toBe(false);
    // Le fournisseur est prévenu : les nouvelles authentifications sont refusées.
    expect(identities.activations).toEqual([{ id: MANAGER_ID, isActive: false }]);

    const enabled = await adminService.setActivation(admin, MANAGER_ID, { isActive: true });
    expect(enabled.isActive).toBe(true);
  });

  it("un ADMIN ne désactive pas un pair ADMIN (D-04 : il est différent, pas inférieur)", async () => {
    const peer = actor("ADMIN", { id: MANAGER_ID, username: "pair" });
    const { repository, store } = fakeAdminProfiles([peer]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.setActivation(admin, MANAGER_ID, body));

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.get(MANAGER_ID)?.isActive).toBe(true);
    expect(identities.activations).toHaveLength(0);
  });

  it("personne ne désactive son propre compte — ce serait un verrouillage", async () => {
    const { repository, store } = fakeAdminProfiles([admin]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.setActivation(admin, admin.id, body));

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.get(admin.id)?.isActive).toBe(true);
    expect(identities.activations).toHaveLength(0);
  });

  it("un ADMIN ne désactive pas un SUPER_ADMIN (XD-03)", async () => {
    const { repository } = fakeAdminProfiles([superAdmin]);
    const { service: adminService } = service(repository);

    const error = await capture(adminService.setActivation(admin, superAdmin.id, body));

    expectAppError(error, "FORBIDDEN", 403);
  });

  /**
   * Verrouillage administratif : Q-03 refuse à **tout** `SUPER_ADMIN`
   * d'administrer un compte `SUPER_ADMIN`, y compris le sien. Conséquence
   * directe et heureuse — le dernier compte suprême ne peut être ni désactivé,
   * ni rétrogradé par cette API : personne ne peut se couper l'administration à
   * lui-même, et aucune protection supplémentaire n'a été inventée.
   */
  it("protège le dernier SUPER_ADMIN : aucun SUPER_ADMIN ne peut le désactiver", async () => {
    const other = actor("SUPER_ADMIN", {
      id: "88888888-8888-4888-8888-888888888888",
      username: "autre-super-admin",
    });
    const { repository, store } = fakeAdminProfiles([superAdmin, other]);
    const { service: adminService, identities } = service(repository);

    for (const author of [superAdmin, other]) {
      const error = await capture(
        adminService.setActivation(author, superAdmin.id, body),
      );
      expectAppError(error, "FORBIDDEN", 403);
    }

    // Aucun des deux comptes n'a bougé, et le fournisseur n'a pas été prévenu.
    expect(store.get(superAdmin.id)?.isActive).toBe(true);
    expect(identities.activations).toHaveLength(0);
  });

  it("un SUPER_ADMIN désactive : le profil d'abord, le fournisseur ensuite", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository } = fakeAdminProfiles([target]);
    const orders: string[] = [];
    const { service: adminService, identities } = service(repository);

    jest.spyOn(repository, "setActive").mockImplementation(async (id, isActive) => {
      orders.push("profil");
      return { ...target, id, isActive };
    });
    jest.spyOn(identities.provider, "setActive").mockImplementation(async () => {
      orders.push("fournisseur");
    });

    const updated = await adminService.setActivation(superAdmin, MANAGER_ID, body);

    expect(updated.isActive).toBe(false);
    // L'ordre est contractuel : `is_active` est ce que `requireAdmin` relit à
    // chaque requête, donc ce qui révoque réellement les jetons déjà émis
    // (D-14 étape 1). Inverser laisserait une fenêtre d'accès résiduel.
    expect(orders).toEqual(["profil", "fournisseur"]);
  });

  it("la désactivation ne touche pas au rôle : réactiver doit rendre le compte tel qu'il était", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository } = fakeAdminProfiles([target]);
    const { service: adminService } = service(repository);

    const disabled = await adminService.setActivation(superAdmin, MANAGER_ID, {
      isActive: false,
    });
    const enabled = await adminService.setActivation(superAdmin, MANAGER_ID, {
      isActive: true,
    });

    expect(disabled.role).toBe("DEPARTMENT_MANAGER");
    expect(disabled.departmentId).toBe(DEPARTMENT_ID);
    expect(enabled.isActive).toBe(true);
    expect(enabled.role).toBe("DEPARTMENT_MANAGER");
  });
});

/* -------------------------------------------------------------------------- */
/*  Suppression (cellule 1.8, arbitrée : SUPER_ADMIN seul)                    */
/* -------------------------------------------------------------------------- */

describe("AdminService — suppression définitive d'un compte", () => {
  it("un SUPER_ADMIN supprime un responsable : profil puis compte d'authentification", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const orders: string[] = [];
    const { service: adminService, identities } = service(repository);

    jest.spyOn(repository, "remove").mockImplementation(async (id) => {
      orders.push("profil");
      store.delete(id);
      return true;
    });
    jest.spyOn(identities.provider, "deleteUser").mockImplementation(async () => {
      orders.push("fournisseur");
    });

    await adminService.deleteUser(superAdmin, MANAGER_ID);

    expect(store.has(MANAGER_ID)).toBe(false);
    // Ordre inversé par rapport à la création : supprimer le profil d'abord
    // évite d'effacer l'authentification d'un compte dont le profil, retenu par
    // une référence `RESTRICT`, subsisterait avec ses droits.
    expect(orders).toEqual(["profil", "fournisseur"]);
  });

  it("un ADMIN ne supprime aucun compte : la cellule est réservée au SUPER_ADMIN", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.deleteUser(admin, MANAGER_ID));

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.has(MANAGER_ID)).toBe(true);
    expect(identities.deleted).toHaveLength(0);
  });

  it("refuse de supprimer son propre compte", async () => {
    const { repository, store } = fakeAdminProfiles([superAdmin]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.deleteUser(superAdmin, superAdmin.id));

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.has(superAdmin.id)).toBe(true);
    expect(identities.deleted).toHaveLength(0);
  });

  it("refuse de supprimer un compte SUPER_ADMIN : Q-03 protège le dernier accès", async () => {
    const other = actor("SUPER_ADMIN", {
      id: "88888888-8888-4888-8888-888888888888",
      username: "autre-super-admin",
    });
    const { repository, store } = fakeAdminProfiles([superAdmin, other]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.deleteUser(superAdmin, other.id));

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.has(other.id)).toBe(true);
    expect(identities.deleted).toHaveLength(0);
  });

  it("répond 404 sur un profil inconnu", async () => {
    const { repository } = fakeAdminProfiles();
    const { service: adminService } = service(repository);

    const error = await capture(adminService.deleteUser(superAdmin, MANAGER_ID));

    expectAppError(error, "PROFILE_NOT_FOUND", 404);
  });

  /**
   * Échec partiel assumé : le profil est parti, le compte d'authentification
   * subsiste. La réponse doit **le dire** — un « échec » générique laisserait
   * croire que rien n'a bougé, un « succès » masquerait un compte orphelin.
   */
  it("signale un compte d'authentification subsistant après suppression du profil", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository } = fakeAdminProfiles([target]);
    const { service: adminService, identities } = service(repository);

    jest
      .spyOn(identities.provider, "deleteUser")
      .mockRejectedValue(new Error("fournisseur indisponible"));

    const error = await capture(adminService.deleteUser(superAdmin, MANAGER_ID));

    const appError = expectAppError(error, "INTERNAL_ERROR", 500);
    expect(appError.message).toMatch(/profil a été supprimé/i);
  });
});
