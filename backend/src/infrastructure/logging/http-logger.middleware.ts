import type { Request, Response, NextFunction } from "express";
import { logStore, type LogLevel } from "./log-store";

/**
 * Vérifie si une requête GET correspond à un endpoint technique ou de polling à haute fréquence
 * qui ne doit pas encombrer le journal d'audit du Super Admin ("GET /admin/logs", "/admin/me", "/ping", "/health").
 */
function isExcludedRoutineEndpoint(method: string, path: string): boolean {
  if (method !== "GET") return false;
  const p = path.toLowerCase();
  return (
    p === "/" ||
    p === "/ping" ||
    p === "/health" ||
    p === "/api/v1" ||
    p === "/api/v1/" ||
    p.endsWith("/ping") ||
    p.endsWith("/health") ||
    p.includes("/admin/logs") ||
    p.includes("/admin/me")
  );
}

/**
 * Middleware de capture des événements d'audit en temps réel pour le Super Admin.
 * Enregistre les requêtes importantes, les mutations, et toutes les erreurs (4xx, 5xx).
 */
export function auditHttpLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.originalUrl?.split("?")[0] || req.url;

    const startTime = Date.now();

    // Capturer la fin de la réponse
    res.on("finish", () => {
      const statusCode = res.statusCode;

      // Ignorer impérativement les requêtes de routine et de polling réussies (< 400)
      if (isExcludedRoutineEndpoint(req.method, path) && statusCode < 400) {
        return;
      }

      const durationMs = Date.now() - startTime;

      let level: LogLevel = "info";
      if (statusCode >= 500) {
        level = "error";
      } else if (statusCode >= 400) {
        level = "warn";
      }

      // Si c'est un GET réussi hors mutations et qu'il n'y a pas d'erreur,
      // on n'enregistre que les endpoints administratifs importants pour garder une vue nette
      const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
      const isError = statusCode >= 400;
      const isAdminRoute = path.includes("/admin");

      if (!isMutation && !isError && !isAdminRoute) {
        return;
      }

      // Identifier l'acteur si authentifié
      const actor = req.admin
        ? {
            id: req.admin.id,
            name: req.admin.displayName || req.admin.username,
            role: req.admin.role,
            scope: req.admin.scope,
          }
        : req.auth
          ? {
              id: req.auth.userId,
              name: req.auth.email || "Utilisateur authentifié",
              role: req.auth.tokenRole ?? "AUTHENTICATED",
            }
          : null;

      // Message descriptif de l'événement
      let message = `${req.method} ${path} -> ${statusCode}`;
      if (statusCode === 401) {
        message = `Tentative d'accès non authentifié sur ${path}`;
      } else if (statusCode === 403) {
        message = `Refus d'accès (permissions insuffisantes) sur ${path}`;
      } else if (statusCode === 404) {
        message = `Ressource non trouvée : ${req.method} ${path}`;
      } else if (statusCode === 400 || statusCode === 422) {
        message = `Échec de validation des données sur ${path}`;
      } else if (statusCode >= 500) {
        message = `Erreur interne du serveur lors de l'exécution de ${req.method} ${path}`;
      } else if (isMutation) {
        message = `Action administrative exécutée : ${req.method} ${path}`;
      }

      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress;

      logStore.addLog({
        level,
        source: "http",
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode,
        durationMs,
        message,
        actor,
        ip: clientIp,
        userAgent: req.headers["user-agent"],
        metadata: {
          query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
          params: Object.keys(req.params || {}).length > 0 ? req.params : undefined,
        },
      });
    });

    next();
  };
}
