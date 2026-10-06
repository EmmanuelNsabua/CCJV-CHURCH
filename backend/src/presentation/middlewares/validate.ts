import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "@/shared/errors/app-error";

/**
 * Validation des entrées par Zod.
 *
 * Trois sources distinctes, validées séparément car elles n'ont pas la même
 * nature : le corps est arbitraire, les paramètres d'URL sont courts et
 * contraints, la *query* est toujours composée de chaînes.
 *
 * Toute donnée validée **remplace** la donnée brute sur la requête : un
 * controller ne peut donc pas, par inadvertance, lire un champ non validé.
 */

export interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Traduit les problèmes Zod au format `{ champ, message }` de l'API.
 *
 * Cas particulier des **clés inconnues** (objets stricts) : Zod produit un
 * problème unique, de `path` vide, dont la liste `keys` porte les clés fautives.
 * Les déclarer une par une donne un `details` exploitable — le client lit
 * `champ: "nimportequoi"` et corrige sa faute de frappe, au lieu d'un
 * `champ: "(racine)"` qui ne désigne rien.
 */
function formatIssues(error: unknown): { champ: string; message: string }[] {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    return (
      error as {
        issues: { path: PropertyKey[]; message: string; keys?: PropertyKey[] }[];
      }
    ).issues.flatMap((issue) => {
      if (Array.isArray(issue.keys) && issue.keys.length > 0) {
        return issue.keys.map((key) => ({
          champ: String(key),
          message: `Champ non reconnu : « ${String(key)} »`,
        }));
      }

      return [
        {
          champ: issue.path.map(String).join(".") || "(racine)",
          message: issue.message,
        },
      ];
    });
  }
  return [];
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const collected: { champ: string; message: string }[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      } else {
        collected.push(...formatIssues(result.error));
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        // `req.params` est en lecture seule selon les types Express : on
        // conserve les valeurs validées dans `res.locals` via `req.validated`.
        validated(req).params = result.data as Record<string, string>;
      } else {
        collected.push(...formatIssues(result.error));
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        validated(req).query = result.data;
      } else {
        collected.push(...formatIssues(result.error));
      }
    }

    if (collected.length > 0) {
      next(new ValidationError("Données invalides", collected));
      return;
    }

    next();
  };
}

/**
 * Conteneur des données validées, attaché à la requête.
 * Évite de muter `req.params` / `req.query`, qui sont typés en lecture seule.
 */
export interface ValidatedRequest {
  params: Record<string, string>;
  query: unknown;
}

const VALIDATED = Symbol("ccjv.validated");

interface RequestWithValidated extends Request {
  [VALIDATED]?: ValidatedRequest;
}

export function validated(req: Request): ValidatedRequest {
  const target = req as RequestWithValidated;
  target[VALIDATED] ??= { params: {}, query: {} };
  return target[VALIDATED];
}

/** Paramètres d'URL validés, typés par l'appelant. */
export function validatedParams<T>(req: Request): T {
  return validated(req).params as T;
}

/** *Query* validée, typée par l'appelant. */
export function validatedQuery<T>(req: Request): T {
  return validated(req).query as T;
}
