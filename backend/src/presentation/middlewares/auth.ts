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
 * En V1, `ROLE_ADMIN` est le seul rôle : cette fabrique existe pour que
 * l'ajout d'un rôle de département ne demande pas de réécrire les routes
 * (`docs/004` §24, `docs/001` §3).
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

/** Administrateur actif, tous rôles applicatifs confondus. */
export function requireAnyAdmin(
  deps: AuthDependencies,
  ...roles: readonly AdminRole[]
): RequestHandler[] {
  return [authenticate(), requireAdmin(deps), requireRole(...roles)];
}
