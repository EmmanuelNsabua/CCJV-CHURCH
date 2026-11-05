import { Router, type Request, type Response } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, AuditPolicy } from "@/presentation/policies";
import { logStore, type LogLevel } from "@/infrastructure/logging/log-store";
import { logger } from "@/infrastructure/logger";

export interface LogsRouterDeps {
  authDeps: AuthDependencies;
}

export function createLogsRouter(deps: LogsRouterDeps): Router {
  const router = Router();
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  /**
   * GET /api/v1/admin/logs
   * Lecture des événements et logs applicatifs en temps réel.
   * Règle RBAC : réservée exclusivement au SUPER_ADMIN via AuditPolicy.
   */
  router.get(
    "/",
    ...admin,
    authorize(AuditPolicy, "READ"),
    (req: Request, res: Response) => {
      const level = req.query.level as LogLevel | "ALL" | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit
        ? Number.parseInt(String(req.query.limit), 10)
        : 100;
      const since = req.query.since as string | undefined;

      const result = logStore.getLogs({
        level,
        search,
        limit,
        since,
      });

      res.status(200).json(result);
    },
  );

  /**
   * POST /api/v1/admin/logs/clear
   * Réinitialisation du journal d'audit en temps réel (SUPER_ADMIN uniquement).
   */
  router.post(
    "/clear",
    ...admin,
    authorize(AuditPolicy, "CLEAR"),
    (req: Request, res: Response) => {
      logStore.clearLogs();
      logger.info(
        { actorId: req.admin?.id, username: req.admin?.username },
        "Journal des logs réinitialisé par le Super Administrateur",
      );
      res.status(200).json({
        status: "ok",
        message: "Journal des logs réinitialisé avec succès.",
        meta: logStore.getStats(),
      });
    },
  );

  return router;
}
