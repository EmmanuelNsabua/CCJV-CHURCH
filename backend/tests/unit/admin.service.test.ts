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
function fakeIdentities(options: { failOnCreate?: boolean } = {}) {
  const created: string[] = [];
  const deleted: string[] = [];
  const activations: { id: string; isActive: boolean }[] = [];

  const provider: AdminIdentityProvider = {
    async createUser(): Promise<CreatedIdentity> {
      if (options.failOnCreate) {
        throw new Error("fournisseur indisponible");
      }
      return { id: MANAGER_ID };
    },
    async setActive(id, isActive) {
      activations.push({ id, isActive });
    },
    async deleteUser(id) {
      deleted.push(id);
    },
  };

  return { provider, created, deleted, activations };
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
/*  Habilitation                                                              */
/* -------------------------------------------------------------------------- */

describe("AdminService — modification d'habilitation (cellule 1.5, Q-02)", () => {
  it("un ADMIN ne modifie pas l'habilitation d'un responsable : Q-02 n'est pas tranchée", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const { service: adminService } = service(repository);

    const body: UpdateAdminAuthorizationBody = {
      role: "DEPARTMENT_MANAGER",
      departmentId: OTHER_DEPARTMENT_ID,
    };

    const error = await capture(adminService.updateAuthorization(admin, MANAGER_ID, body));

    expectAppError(error, "FORBIDDEN", 403);
    expect(store.get(MANAGER_ID)?.departmentId).toBe(DEPARTMENT_ID);
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

  it("un ADMIN ne désactive pas un compte : Q-A4 n'est pas tranchée", async () => {
    const target = actor("DEPARTMENT_MANAGER", { id: MANAGER_ID });
    const { repository, store } = fakeAdminProfiles([target]);
    const { service: adminService, identities } = service(repository);

    const error = await capture(adminService.setActivation(admin, MANAGER_ID, body));

    expectAppError(error, "FORBIDDEN", 403);
    // Le refus est **total** : ni le profil, ni le compte d'authentification ne
    // sont touchés. Un refus à moitié appliqué laisserait un état incohérent.
    expect(store.get(MANAGER_ID)?.isActive).toBe(true);
    expect(identities.activations).toHaveLength(0);
  });

  it("un ADMIN ne désactive pas un SUPER_ADMIN (XD-03)", async () => {
    const { repository } = fakeAdminProfiles([superAdmin]);
    const { service: adminService } = service(repository);

    const error = await capture(adminService.setActivation(admin, superAdmin.id, body));

    expectAppError(error, "FORBIDDEN", 403);
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
