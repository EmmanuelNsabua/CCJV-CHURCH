import express, { type Express, type Request, type Response } from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { apiBasePath, corsOrigins, env, isProduction, isTest } from "@/config/env";
import { logger } from "@/infrastructure/logger";
import { sql } from "@/infrastructure/database/client";
import { createContainer, createRouters, type AppDependencies } from "@/container";
import {
  errorHandler,
  notFoundHandler,
} from "@/presentation/middlewares/error-handler";
import { sendError } from "@/shared/http/respond";

/**
 * Composition de l'application Express.
 *
 * L'ordre des middlewares suit exactement le pipeline de `docs/004` §25 :
 * CORS → Rate Limiting → (authentification et validation, par route) →
 * Controller → Service. Les middlewares transverses sont ici ; ceux qui
 * dépendent d'un rôle ou d'un schéma sont déclarés au niveau de chaque route,
 * pour qu'aucune route ne puisse hériter par accident d'une protection qu'elle
 * n'a pas demandée.
 */

function buildCorsOptions(): cors.CorsOptions {
  // `*` est accepté explicitement : utile pour tester l'API depuis un outil
  // externe. En production, `CORS_ORIGIN` doit lister les origines réelles.
  const allowAll = corsOrigins.includes("*");

  return {
    origin: allowAll ? true : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    // Aucun cookie n'est utilisé : l'authentification passe par un jeton porteur.
    credentials: false,
    maxAge: 86_400,
  };
}

/**
 * Vérification de santé destinée à Railway (`docs/004` §22).
 *
 * Elle interroge réellement la base : un conteneur qui répond « ok » alors que
 * PostgreSQL est injoignable serait un faux positif, et Railway le garderait
 * en rotation à tort.
 */
async function healthHandler(_req: Request, res: Response): Promise<void> {
  try {
    await sql`select 1`;
    res.status(200).json({
      status: "ok",
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      database: "up",
    });
  } catch (error) {
    logger.error({ err: error }, "Échec du contrôle de santé : base injoignable");
    res.status(503).json({
      status: "error",
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      database: "down",
    });
  }
}

export function createApp(deps: AppDependencies = createContainer()): Express {
  const app = express();

  // Railway place l'instance derrière un proxy : sans cela, `req.ip` serait
  // toujours l'adresse du proxy et le rate limiting global serait inopérant.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // API JSON consommée par le frontend : la CSP est gérée par le frontend.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(buildCorsOptions()));
  app.use(compression());

  // Limites de corps raisonnables : les images passent par `multipart/form-data`
  // (multer), pas par ce parseur. Un corps JSON de plus de 1 Mo est une anomalie.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        // On ne journalise pas les requêtes de succès bruyantes en production.
        customLogLevel: (_req, res, error) => {
          if (error || res.statusCode >= 500) return "error";
          if (res.statusCode >= 400) return "warn";
          return isProduction ? "debug" : "info";
        },
        autoLogging: {
          ignore: (req) => req.url === `${apiBasePath}/health`,
        },
      }),
    );
  }

  // --- Santé (hors rate limiting : Railway interroge souvent) ---------------
  app.get(`${apiBasePath}/health`, healthHandler);

  // --- Rate limiting global -------------------------------------------------
  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      sendError(
        res,
        429,
        "RATE_LIMITED",
        "Trop de requêtes, veuillez réessayer dans un instant",
      );
    },
  });
  app.use(apiBasePath, globalLimiter);

  // --- Routes métier --------------------------------------------------------
  const routers = createRouters(deps);

  app.use(`${apiBasePath}/departments`, routers.departments);
  app.use(`${apiBasePath}/events`, routers.events);
  app.use(`${apiBasePath}/publications`, routers.publications);
  app.use(`${apiBasePath}/leaders`, routers.leaders);
  app.use(`${apiBasePath}/testimonies`, routers.testimonies);
  app.use(`${apiBasePath}/community-faces`, routers.communityFaces);
  app.use(`${apiBasePath}/scriptures`, routers.scriptures);
  app.use(`${apiBasePath}/schedule`, routers.schedule);
  app.use(`${apiBasePath}/social-links`, routers.socialLinks);
  app.use(`${apiBasePath}/settings`, routers.settings);
  app.use(`${apiBasePath}/pages`, routers.staticPages);
  app.use(`${apiBasePath}/media`, routers.media);
  app.use(`${apiBasePath}/prayer-requests`, routers.prayerRequests);
  app.use(`${apiBasePath}/admin`, routers.admin);
  app.use(`${apiBasePath}/notifications`, routers.notifications);
  app.use(`${apiBasePath}/enseignements`, routers.teachings);
  app.use(`${apiBasePath}/teachings`, routers.teachings);
  app.use(`${apiBasePath}/resources`, routers.resources);
  app.use(`${apiBasePath}/ressources`, routers.resources);

  // --- Gestion des erreurs (toujours en dernier) ---------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
