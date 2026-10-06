import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/infrastructure/logger";
import { closeDatabase, sql } from "@/infrastructure/database/client";

/**
 * Point d'entrée du processus.
 *
 * Le serveur vérifie la base **avant** d'accepter du trafic : mieux vaut un
 * échec de démarrage explicite qu'une instance qui répond 500 à chaque requête
 * et que Railway garde en rotation.
 */
async function main(): Promise<void> {
  try {
    await sql`select 1`;
    logger.info("Connexion PostgreSQL établie");
  } catch (error) {
    logger.fatal(
      { err: error },
      "Base de données injoignable : démarrage interrompu",
    );
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, api: `/api/${env.API_VERSION}` },
      "API CCJV démarrée",
    );
  });

  /**
   * Arrêt propre. Railway envoie `SIGTERM` avant de retirer l'instance :
   * on cesse d'accepter de nouvelles connexions, on laisse les requêtes en
   * cours se terminer, puis on ferme le pool. Sans cela, des requêtes en vol
   * seraient coupées et le pool resterait ouvert côté Supabase.
   */
  let shuttingDown = false;

  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Arrêt en cours…");

    const forceExit = setTimeout(() => {
      logger.error("Arrêt forcé : des connexions ne se sont pas terminées");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, "Erreur lors de la fermeture du serveur");
      }
      try {
        await closeDatabase();
        logger.info("Arrêt terminé proprement");
        process.exit(0);
      } catch (closeError) {
        logger.error({ err: closeError }, "Erreur lors de la fermeture du pool");
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Promesse rejetée non gérée");
  });

  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Exception non capturée : arrêt du processus");
    shutdown("uncaughtException");
  });
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, "Échec du démarrage de l'application");
  process.exit(1);
});
