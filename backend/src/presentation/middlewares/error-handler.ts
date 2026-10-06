import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "@/infrastructure/logger";
import { isProduction } from "@/config/env";
import { AppError, InternalError } from "@/shared/errors/app-error";
import { sendError } from "@/shared/http/respond";

/**
 * Traducteur unique erreur → réponse HTTP.
 *
 * Placé en fin de pipeline, il garantit que **toutes** les erreurs sortent au
 * même format. Un controller ne construit jamais une réponse d'erreur lui-même.
 *
 * Sécurité (cahier §16) : en production, une erreur non maîtrisée ne révèle ni
 * stack trace, ni message interne, ni détail d'infrastructure. Le détail
 * complet reste dans les journaux serveur, corrélé par `requestId`.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  // Erreur de validation Zod non interceptée par le middleware dédié.
  if (error instanceof ZodError) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Données invalides",
      error.issues.map((issue) => ({
        champ: issue.path.join(".") || "(racine)",
        message: issue.message,
      })),
    );
    return;
  }

  if (error instanceof AppError) {
    const logPayload = {
      code: error.code,
      statusCode: error.statusCode,
      method: req.method,
      url: req.originalUrl,
      err: error.cause ?? error,
    };

    if (error.statusCode >= 500) {
      logger.error(logPayload, "Erreur applicative");
    } else {
      logger.warn(
        { code: error.code, statusCode: error.statusCode, url: req.originalUrl },
        error.message,
      );
    }

    sendError(
      res,
      error.statusCode,
      error.code,
      // Un message non exposable est remplacé en production.
      error.isExposable || !isProduction
        ? error.message
        : "Une erreur interne est survenue",
      error.details,
    );
    return;
  }

  // Erreur inattendue : jamais renvoyée telle quelle.
  const internal =
    error instanceof Error ? error : new InternalError("Erreur inconnue", error);

  logger.error(
    { method: req.method, url: req.originalUrl, err: internal },
    "Erreur non maîtrisée",
  );

  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    isProduction
      ? "Une erreur interne est survenue"
      : internal.message,
  );
}

/** Route inconnue sous `/api`. */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    404,
    "NOT_FOUND",
    `Aucune route ne correspond à ${req.method} ${req.originalUrl}`,
  );
}
