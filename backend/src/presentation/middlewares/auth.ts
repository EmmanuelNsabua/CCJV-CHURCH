import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AdminProfile, AdminRole } from "@/domain/entities";
import type { AdminProfileRepository } from "@/domain/repositories";
import {
  AuthRequiredError,
  ForbiddenError,
} from "@/shared/errors/app-error";
import {
  extractBearerToken,
  verifyAccessToken,
} from "@/infrastructure/supabase/auth";
import { logger } from "@/infrastructure/logger";

/**
 * Authentification ET autorisation, volontairement séparées (cahier §7,
 * `docs/004` §24).
 *
 * - `authenticate` : le jeton est-il valide ? Sinon 401 `AUTH_REQUIRED`.
 * - `requireAdmin` : l'utilisateur est-il un administrateur **actif** ?
 *   Sinon 403 `FORBIDDEN` / `UNAUTHENTICATED_ADMIN`.
 *
 * Le contrôle est centralisé : aucun controller ne teste un rôle lui-même.
 */

export interface AuthDependencies {
  adminProfiles: AdminProfileRepository;
}

/** Vérifie le jeton et attache l'identité. Ne consulte pas la base. */
export function authenticate(): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) {
        throw new AuthRequiredError();
      }
      req.auth = await verifyAccessToken(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Charge le profil applicatif et exige un administrateur actif.
 *
 * Un utilisateur authentifié auprès de Supabase mais absent de
 * `admin_profiles`, ou désactivé, n'a **aucun** droit : l'authentification
 * auprès du fournisseur d'identité ne confère pas de permission.
 */
export function requireAdmin(deps: AuthDependencies): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new AuthRequiredError();
      }

      const profile = await deps.adminProfiles.findById(req.auth.userId);

      if (!profile) {
        logger.warn(
          { userId: req.auth.userId },
          "Accès refusé : utilisateur authentifié sans profil administratif",
        );
        throw new ForbiddenError(
          "Ce compte n'est pas autorisé à administrer le site",
        );
      }

      if (!profile.isActive) {
        logger.warn(
          { userId: req.auth.userId },
          "Accès refusé : compte administratif désactivé",
        );
        throw new ForbiddenError("Ce compte administrateur est désactivé");
      }

      req.admin = profile;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Exige un rôle parmi ceux autorisés.
 *
 * ⚠️ **Aucune route ne doit plus l'utiliser.** Depuis le Lot 1c, la décision de
 * rôle appartient aux **policies** (`presentation/policies`, `docs/029` §4.1) :
 * `docs/029` §4.2 range explicitement « un `if (req.admin.role === …)` » parmi
 * les interdits, et un `requireRole` monté sur une route est exactement cela,
 * réparti dans la chaîne de middlewares. Le rôle seul ne suffit d'ailleurs plus
 * à décider : une même action dépend du rôle, du **scope**, de l'**égalité
 * départementale** et de la **ressource** (`docs/029` §4.3) — quatre clauses
 * qu'un prédicat de rôle ne peut pas porter.
 *
 * La fabrique survit parce que le contrat de middleware est testé
 * (`tests/unit/auth-middleware.test.ts`) et parce que `ROLE_ADMIN` ayant
 * disparu de l'énumération PostgreSQL (Lot 1a), la fonction reste le point où
 * cette disparition est vérifiable. Les routes, elles, montent
 * `requireAuthenticatedAdmin` puis `authorize`.
 */
export function requireRole(...roles: readonly AdminRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      next(new AuthRequiredError());
      return;
    }
    if (!roles.includes(req.admin.role)) {
      logger.warn(
        { userId: req.admin.id, role: req.admin.role, required: roles },
        "Accès refusé : rôle insuffisant",
      );
      next(new ForbiddenError("Votre rôle ne permet pas cette opération"));
      return;
    }
    next();
  };
}

/**
 * Chaîne d'accès administratif **sans prédicat de rôle**.
 *
 * C'est la chaîne que monte une route protégée depuis le Lot 1c :
 *
 * ```text
 * authenticate()  → 401 AUTH_REQUIRED   (qui parle ?)
 * requireAdmin()  → 403 FORBIDDEN       (est-il administrateur actif ?)
 * authorize(Policy, ACTION)             (a-t-il le droit ? — point unique)
 * validate({ … }) → 400 VALIDATION_ERROR (la demande est-elle bien formée ?)
 * ```
 *
 * **Pourquoi pas de rôle ici.** Il n'existe plus de rôle « passe-partout » : les
 * trois rôles de D-01 ont des pouvoirs **disjoints** (D-04 : « l'`ADMIN` n'est
 * pas *inférieur*, il est **différent** »), et le `SUPER_ADMIN` lui-même est
 * exclu de certains domaines (D-10). Un filtre de rôle placé ici serait donc à
 * la fois trop large — il laisserait passer un rôle que la policy refuse — et
 * trop étroit — il refuserait un rôle que la policy autorise, comme un
 * responsable sur son propre département. Le nom de la fabrique dit ce qu'elle
 * fait : *authentifier un administrateur*, pas *autoriser une action*.
 */
export function requireAuthenticatedAdmin(deps: AuthDependencies): RequestHandler[] {
  return [authenticate(), requireAdmin(deps)];
}

/**
 * Administrateur actif **portant l'un des rôles indiqués**.
 *
 * Conservée pour les routes qui, à titre exceptionnel, exigent un rôle
 * **structurel** indépendant de toute ressource — il n'en reste aucune aujourd'hui,
 * et c'est volontaire : une route qui n'a pas de ressource à juger (par exemple
 * « lire mon propre profil ») reste protégée par `requireAuthenticatedAdmin`, et
 * toute action sur une ressource passe par une policy.
 */
export function requireAnyAdmin(
  deps: AuthDependencies,
  ...roles: readonly AdminRole[]
): RequestHandler[] {
  return [...requireAuthenticatedAdmin(deps), requireRole(...roles)];
}
