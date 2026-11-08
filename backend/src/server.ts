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

    // Assurer l'existence des départements de référence et colonnes nécessaires (idempotent)
    const ddlStatements = [
      `INSERT INTO "departments" ("id", "name", "slug", "position") VALUES ('d0000000-0000-4000-8000-000000000004', 'Ecodim', 'ecodume', 4) ON CONFLICT ("id") DO UPDATE SET "name" = 'Ecodim'`,
      `UPDATE "departments" SET "name" = 'Ecodim' WHERE "id" = 'd0000000-0000-4000-8000-000000000004'`,
      `INSERT INTO "departments" ("id", "name", "slug", "position") VALUES ('d0000000-0000-4000-8000-00000000000a', 'Presse', 'presse', 10) ON CONFLICT ("id") DO NOTHING`,
      `UPDATE "site_settings" SET "value" = 'Dimanche · 08h30 – 11h30' WHERE "key" = 'site.scheduleAdults'`,
      `UPDATE "site_settings" SET "value" = 'Dimanche · 08h30 – 11h30 (Ecodim, pendant le culte)' WHERE "key" = 'site.scheduleChildren'`,
      `UPDATE "schedule_entries" SET "time_label" = '08h30 – 11h30', "is_confirmed" = true WHERE "day" = 'Dimanche'`,
      `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL`,
      `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL`,
      `CREATE INDEX IF NOT EXISTS "resources_department_idx" ON "resources" ("department_id")`,
      `CREATE INDEX IF NOT EXISTS "resources_is_archived_idx" ON "resources" ("is_archived")`,
      `ALTER TABLE "teachings" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL`,
      `CREATE INDEX IF NOT EXISTS "teachings_department_idx" ON "teachings" ("department_id")`,
      `UPDATE "teachings" SET "department_id" = 'd0000000-0000-4000-8000-000000000004' WHERE "scope" = 'ECODIM' AND ("department_id" IS NULL OR "department_id" != 'd0000000-0000-4000-8000-000000000004')`,
      `UPDATE "teachings" SET "scope" = 'ECODIM' WHERE "department_id" = 'd0000000-0000-4000-8000-000000000004' AND "scope" != 'ECODIM'`,
      `UPDATE "teachings" SET "department_id" = 'd0000000-0000-4000-8000-000000000004', "scope" = 'ECODIM' WHERE ("title" ILIKE '%ecodim%' OR "title" ILIKE '%enfant%')`,
      `UPDATE "publications" SET "scope" = 'ECODIM' WHERE "department_id" = 'd0000000-0000-4000-8000-000000000004' AND "scope" != 'ECODIM'`,
      `UPDATE "publications" SET "department_id" = 'd0000000-0000-4000-8000-000000000004', "scope" = 'ECODIM' WHERE "title" ILIKE '%ecodim%'`,
      `UPDATE "publications" SET "status" = 'PUBLISHED' WHERE "status" = 'ARCHIVED'`,
      `UPDATE "publications" SET "category" = 'ACTUALITE' WHERE "title" ILIKE '%jeunes%' OR "title" ILIKE '%annonce%' OR "title" ILIKE '%saison%'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description") VALUES ('c0000000-0000-4000-8000-000000000001', 'Célébration dominicale et sainte cène au temple principal', 'celebration-dominicale-et-sainte-cene-au-temple-principal', 'TEXTE', 'ACTUALITE', 'CCJV', 'd0000000-0000-4000-8000-00000000000a', 'PUBLISHED', '2026-11-01', 'Nous vous convions ce dimanche à notre grand culte de communion fraternelle et d''édification dans la présence du Seigneur à Lubumbashi.') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'CCJV'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description") VALUES ('c0000000-0000-4000-8000-000000000002', 'Nouvelle saison des groupes de maison dans vos quartiers', 'nouvelle-saison-des-groupes-de-maison', 'TEXTE', 'ACTUALITE', 'CCJV', 'd0000000-0000-4000-8000-00000000000a', 'PUBLISHED', '2026-10-28', 'Les cellules de prière et d''édification reprennent dans les différents quartiers de la ville de Lubumbashi.') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'CCJV'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description") VALUES ('c0000000-0000-4000-8000-000000000003', 'Rentrée spirituelle de l''Ecodim pour tous les enfants', 'rentree-spirituelle-de-l-ecodim', 'TEXTE', 'ACTUALITE', 'ECODIM', 'd0000000-0000-4000-8000-000000000004', 'PUBLISHED', '2026-10-25', 'Le département des enfants (Ecodim) reprend son cycle d''enseignements adaptés, de louanges et d''ateliers bibliques.') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'ECODIM'`,
      `UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000004' WHERE ("title" ILIKE '%ecodim%' OR "title" ILIKE '%enfants%') AND ("department_id" IS NULL OR "department_id" != 'd0000000-0000-4000-8000-000000000004')`,
    ];

    for (const stmt of ddlStatements) {
      try {
        await sql.unsafe(stmt);
      } catch (ddlErr) {
        logger.warn({ err: ddlErr, stmt }, "Avertissement lors de l'exécution DDL");
      }
    }
    logger.info("Schéma des ressources et départements vérifié et synchronisé");
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
