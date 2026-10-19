import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, jest } from "@jest/globals";
import type { AdminProfile, AdminRole } from "@/domain/entities";
import type { AdminProfileRepository } from "@/domain/repositories";
import type { AuthenticatedUser } from "@/infrastructure/supabase/auth";
import {
  authenticate,
  requireAdmin,
  requireAnyAdmin,
  requireAuthenticatedAdmin,
  requireRole,
} from "@/presentation/middlewares/auth";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Autorisation, testée **sans serveur ni base de données**.
 *
 * Les middlewares sont appelés directement avec des objets `req`/`res`/`next`
 * simulés : c'est la contrepartie du découplage `AuthDependencies` (injection du
 * repository). Le profil administratif provient d'un double, jamais de
 * PostgreSQL.
 *
 * Remarque sur les jetons : aucun jeton n'est forgé ici. Une vérification
 * réussie exige les clés publiques JWKS du projet Supabase, donc le réseau ;
 * l'identité vérifiée est donc posée directement sur `req.auth`, exactement
 * comme le ferait `authenticate()`. Les cas d'échec ci-dessous sont, eux,
 * entièrement hors ligne : `jose` refuse un jeton malformé avant toute
 * résolution de clé.
 */

const ADMIN_ID = "3f1a0c62-8f2a-4a5f-9b0e-7c1d2e3f4a5b";

function adminProfile(overrides: Partial<AdminProfile> = {}): AdminProfile {
  return {
    id: ADMIN_ID,
    username: "pasteur",
    displayName: "Pasteur responsable",
    // Le compte administratif de production est un `ADMIN` (D-05). `ROLE_ADMIN`
    // n'existe plus : ni ici, ni dans l'énumération PostgreSQL `admin_role`.
    role: "ADMIN",
    // Rôle système : périmètre global et aucun rattachement départemental —
    // exactement ce qu'exige `admin_profiles_scope_coherence` (`docs/032` §3.1).
    scope: "GLOBAL",
    departmentId: null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function authenticatedUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    userId: ADMIN_ID,
    email: "pasteur@ccjv.org",
    tokenRole: "authenticated",
    ...overrides,
  };
}

/** Double du contrat `AdminProfileRepository` — seul `findById` est sollicité. */
function fakeAdminProfiles(
  profile: AdminProfile | null,
  failure?: Error,
): AdminProfileRepository {
  return {
    async findById(id: string) {
      if (failure) throw failure;
      return profile && profile.id === id ? profile : null;
    },
    async findByUsername() {
      return null;
    },
    async upsert() {
      throw new Error("upsert ne doit pas être appelé par les middlewares");
    },
    async list() {
      return [];
    },
    async updateAuthorization() {
      throw new Error(
        "updateAuthorization ne doit pas être appelé par les middlewares",
      );
    },
    async setActive() {
      throw new Error("setActive ne doit pas être appelé par les middlewares");
    },
    async updateProfile() {
      throw new Error(
        "updateProfile ne doit pas être appelé par les middlewares",
      );
    },
    async remove() {
      throw new Error("remove ne doit pas être appelé par les middlewares");
    },
  };
}

interface Mocks {
  req: Request;
  res: Response;
  next: jest.Mock;
}

function createMocks(init: { headers?: Record<string, string>; auth?: AuthenticatedUser } = {}): Mocks {
  const req = {
    headers: init.headers ?? {},
    auth: init.auth,
  } as unknown as Request;

  return {
    req,
    res: {} as Response,
    next: jest.fn(),
  };
}

function firstError(next: jest.Mock): unknown {
  return next.mock.calls[0]?.[0];
}

function expectAppError(
  received: unknown,
  code: AppError["code"],
  statusCode: number,
): AppError {
  expect(isAppError(received)).toBe(true);
  const error = received as AppError;
  expect(error.code).toBe(code);
  expect(error.statusCode).toBe(statusCode);
  return error;
}

/* -------------------------------------------------------------------------- */
/*  authenticate                                                              */
/* -------------------------------------------------------------------------- */

describe("authenticate", () => {
  it("refuse une requête sans en-tête Authorization", async () => {
    const { req, res, next } = createMocks();

    await authenticate()(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "AUTH_REQUIRED", 401);
    expect(req.auth).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("refuse un en-tête au mauvais schéma (Basic)", async () => {
    const { req, res, next } = createMocks({
      headers: { authorization: "Basic dXNlcjpwYXNz" },
    });

    await authenticate()(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "AUTH_REQUIRED", 401);
  });

  it("refuse un schéma « Bearer » sans jeton", async () => {
    for (const entete of ["Bearer", "Bearer ", "Bearer   ", "Bearer .", ""]) {
      const { req, res, next } = createMocks({ headers: { authorization: entete } });

      await authenticate()(req, res, next as unknown as NextFunction);

      expectAppError(firstError(next), "AUTH_REQUIRED", 401);
    }
  });

  it("refuse un schéma inconnu portant un jeton", async () => {
    const { req, res, next } = createMocks({
      headers: { authorization: "Token abc.def.ghi" },
    });

    await authenticate()(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "AUTH_REQUIRED", 401);
  });

  it("refuse un jeton malformé sans consulter la base", async () => {
    // Un seul segment : `jose` rejette le JWS compact avant toute résolution de
    // clé — le test reste donc valable hors ligne.
    const { req, res, next } = createMocks({
      headers: { authorization: "Bearer pas-un-jeton" },
    });

    await authenticate()(req, res, next as unknown as NextFunction);

    const error = expectAppError(firstError(next), "AUTH_REQUIRED", 401);
    expect(error.message).toMatch(/invalide/i);
    expect(req.auth).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

/* -------------------------------------------------------------------------- */
/*  requireAdmin                                                              */
/* -------------------------------------------------------------------------- */

describe("requireAdmin", () => {
  it("refuse une requête non authentifiée", async () => {
    const deps = { adminProfiles: fakeAdminProfiles(adminProfile()) };
    const { req, res, next } = createMocks();

    await requireAdmin(deps)(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "AUTH_REQUIRED", 401);
  });

  it("refuse un utilisateur authentifié sans profil administratif", async () => {
    const deps = { adminProfiles: fakeAdminProfiles(null) };
    const { req, res, next } = createMocks({ auth: authenticatedUser() });

    await requireAdmin(deps)(req, res, next as unknown as NextFunction);

    // Être authentifié auprès de Supabase ne confère aucun droit : sans ligne
    // dans `admin_profiles`, la réponse est 403, pas 401.
    expectAppError(firstError(next), "FORBIDDEN", 403);
    expect(req.admin).toBeUndefined();
  });

  it("refuse un profil administratif désactivé", async () => {
    const deps = { adminProfiles: fakeAdminProfiles(adminProfile({ isActive: false })) };
    const { req, res, next } = createMocks({ auth: authenticatedUser() });

    await requireAdmin(deps)(req, res, next as unknown as NextFunction);

    const error = expectAppError(firstError(next), "FORBIDDEN", 403);
    expect(error.message).toMatch(/désactivé/i);
    expect(req.admin).toBeUndefined();
  });

  it("refuse un profil trouvé sous un autre identifiant", async () => {
    const deps = {
      adminProfiles: fakeAdminProfiles(adminProfile({ id: "autre-identifiant" })),
    };
    const { req, res, next } = createMocks({ auth: authenticatedUser() });

    await requireAdmin(deps)(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "FORBIDDEN", 403);
    expect(req.admin).toBeUndefined();
  });

  it("laisse passer un administrateur actif et renseigne req.admin", async () => {
    const profile = adminProfile();
    const deps = { adminProfiles: fakeAdminProfiles(profile) };
    const { req, res, next } = createMocks({ auth: authenticatedUser() });

    await requireAdmin(deps)(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    // Aucun argument : `next()` sans erreur, et non `next(undefined)`.
    expect(next).toHaveBeenCalledWith();
    expect(req.admin).toBe(profile);
    expect(req.auth?.userId).toBe(ADMIN_ID);
  });

  it("interroge le repository avec l'identifiant porté par le jeton", async () => {
    const repository = fakeAdminProfiles(adminProfile());
    const findById = jest.spyOn(repository, "findById");
    const { req, res, next } = createMocks({ auth: authenticatedUser() });

    await requireAdmin({ adminProfiles: repository })(
      req,
      res,
      next as unknown as NextFunction,
    );

    expect(findById).toHaveBeenCalledWith(ADMIN_ID);
  });

  it("propage une panne du repository sans accorder l'accès", async () => {
    const failure = new Error("base injoignable");
    const deps = { adminProfiles: fakeAdminProfiles(adminProfile(), failure) };
    const { req, res, next } = createMocks({ auth: authenticatedUser() });

    await requireAdmin(deps)(req, res, next as unknown as NextFunction);

    expect(firstError(next)).toBe(failure);
    expect(req.admin).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/*  requireRole                                                               */
/* -------------------------------------------------------------------------- */

/**
 * `requireRole` survit au Lot 1c, mais **plus aucune route ne la monte**.
 *
 * Depuis la disparition de `ROLE_ADMIN`, la décision de rôle appartient aux
 * policies (`docs/029` §4.2 range « un `if (req.admin.role === …)` » parmi les
 * interdits, et un `requireRole` monté sur une route est exactement cela,
 * dispersé dans la chaîne de middlewares). Le rôle seul ne suffit d'ailleurs
 * plus : une décision dépend du rôle, du **scope**, de l'**égalité
 * départementale** et de la **ressource** (`docs/029` §4.3).
 *
 * Les tests ci-dessous portent donc sur le **contrat de middleware** — ordre,
 * codes, non-fuite du motif — et non sur une règle métier.
 */
describe("requireRole", () => {
  it("laisse passer un administrateur portant le rôle exigé", () => {
    const { req, res, next } = createMocks();
    req.admin = adminProfile({ role: "ADMIN" });

    requireRole("ADMIN")(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("refuse un rôle différent du rôle exigé", () => {
    const { req, res, next } = createMocks();
    // Un responsable de département n'est pas « un ADMIN en moins » : D-04 en
    // fait un rôle **différent**, aux pouvoirs disjoints.
    req.admin = adminProfile({
      role: "DEPARTMENT_MANAGER",
      scope: "DEPARTMENT",
      departmentId: "8f2c1d34-5b6e-4f70-9a11-2c3d4e5f6a7b",
    });

    requireRole("ADMIN")(req, res, next as unknown as NextFunction);

    const error = expectAppError(firstError(next), "FORBIDDEN", 403);
    expect(error.message).toMatch(/rôle/i);
  });

  it("refuse tout rôle quand la route n'en autorise aucun", () => {
    const { req, res, next } = createMocks();
    req.admin = adminProfile();

    requireRole()(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "FORBIDDEN", 403);
  });

  it("exige une authentification préalable", () => {
    const { req, res, next } = createMocks();

    requireRole("ADMIN")(req, res, next as unknown as NextFunction);

    expectAppError(firstError(next), "AUTH_REQUIRED", 401);
  });
});

/* -------------------------------------------------------------------------- */
/*  requireAuthenticatedAdmin                                                  */
/* -------------------------------------------------------------------------- */

describe("requireAuthenticatedAdmin", () => {
  /**
   * C'est la chaîne que monte **toute** route protégée depuis le Lot 1c :
   * `authenticate` → `requireAdmin`, puis la policy de la ressource décide.
   */
  it("assemble authentification et profil actif, dans cet ordre", async () => {
    const deps = { adminProfiles: fakeAdminProfiles(adminProfile()) };
    const chain = requireAuthenticatedAdmin(deps);

    // Deux middlewares, et pas trois : l'absence de `requireRole` est le point
    // du lot. La décision de rôle a quitté la chaîne pour la policy.
    expect(chain).toHaveLength(2);

    // 1. Sans en-tête : refus immédiat à l'authentification (401, jamais 403).
    const sansEntete = createMocks();
    await chain[0]?.(sansEntete.req, sansEntete.res, sansEntete.next as unknown as NextFunction);
    expectAppError(firstError(sansEntete.next), "AUTH_REQUIRED", 401);

    // 2. Avec une identité vérifiée : le profil actif est chargé et attaché.
    const authentifie = createMocks({ auth: authenticatedUser() });
    await chain[1]?.(
      authentifie.req,
      authentifie.res,
      authentifie.next as unknown as NextFunction,
    );
    expect(authentifie.next).toHaveBeenCalledWith();
    expect(authentifie.req.admin).toBeDefined();
  });

  it("accepte les trois rôles de D-01 : aucun n'est filtré par la chaîne", async () => {
    for (const role of ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] as const) {
      const profil =
        role === "DEPARTMENT_MANAGER"
          ? adminProfile({
              role,
              scope: "DEPARTMENT",
              departmentId: "8f2c1d34-5b6e-4f70-9a11-2c3d4e5f6a7b",
            })
          : adminProfile({ role, scope: "GLOBAL", departmentId: null });

      const deps = { adminProfiles: fakeAdminProfiles(profil) };
      const chain = requireAuthenticatedAdmin(deps);
      const mocks = createMocks({ auth: authenticatedUser() });

      await chain[1]?.(mocks.req, mocks.res, mocks.next as unknown as NextFunction);

      // Le refus éventuel appartient à la policy, jamais à cette chaîne : un
      // `SUPER_ADMIN` doit pouvoir atteindre la policy qui le refuse (D-10),
      // sinon le refus serait un 401/403 de middleware, pas une décision tracée.
      expect(mocks.next).toHaveBeenCalledWith();
      expect(mocks.req.admin?.role).toBe(role);
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  requireAnyAdmin                                                           */
/* -------------------------------------------------------------------------- */

describe("requireAnyAdmin", () => {
  it("assemble authentification, profil actif et rôle, dans cet ordre", async () => {
    const deps = { adminProfiles: fakeAdminProfiles(adminProfile()) };
    const chain = requireAnyAdmin(deps, "ADMIN");

    expect(chain).toHaveLength(3);

    // 1. Sans en-tête : refus immédiat à l'authentification.
    const sansEntete = createMocks();
    await chain[0]?.(sansEntete.req, sansEntete.res, sansEntete.next as unknown as NextFunction);
    expectAppError(firstError(sansEntete.next), "AUTH_REQUIRED", 401);

    // 2. Avec une identité vérifiée : le profil actif est chargé.
    const authentifie = createMocks({ auth: authenticatedUser() });
    await chain[1]?.(
      authentifie.req,
      authentifie.res,
      authentifie.next as unknown as NextFunction,
    );
    expect(authentifie.next).toHaveBeenCalledWith();
    expect(authentifie.req.admin).toBeDefined();

    // 3. Le rôle attendu est bien celui du profil.
    await chain[2]?.(
      authentifie.req,
      authentifie.res,
      authentifie.next as unknown as NextFunction,
    );
    expect(authentifie.next).toHaveBeenCalledTimes(2);
  });
});
