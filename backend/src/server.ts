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
      `UPDATE "publications" SET "category" = 'ACTUALITE' WHERE "title" ILIKE '%jeunes%' OR "title" ILIKE '%annonce%' OR "title" ILIKE '%saison%' OR "title" ILIKE '%célébration%' OR "title" ILIKE '%enseignement%'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description", "content_url") VALUES ('c0000000-0000-4000-8000-000000000001', 'Célébration dominicale et sainte cène au temple principal', 'celebration-dominicale-et-sainte-cene-au-temple-principal', 'TEXTE', 'ACTUALITE', 'CCJV', 'd0000000-0000-4000-8000-00000000000a', 'PUBLISHED', '2026-11-01', 'Nous vous convions ce dimanche à notre grand culte de communion fraternelle et d''édification dans la présence du Seigneur à Lubumbashi.', 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/23ec1d87-668f-4b03-8305-42a47ceabad5.jpg') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'CCJV', "published_at" = '2026-11-01', "content_url" = 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/23ec1d87-668f-4b03-8305-42a47ceabad5.jpg'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description", "content_url") VALUES ('c0000000-0000-4000-8000-000000000002', 'Nouvelle saison des groupes de maison dans vos quartiers', 'nouvelle-saison-des-groupes-de-maison', 'TEXTE', 'ACTUALITE', 'CCJV', 'd0000000-0000-4000-8000-00000000000a', 'PUBLISHED', '2026-10-28', 'Les cellules de prière et d''édification reprennent dans les différents quartiers de la ville de Lubumbashi.', 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/aea87014-f8ca-4687-87d1-fdf66d7e99ef.jpg') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'CCJV', "content_url" = 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/aea87014-f8ca-4687-87d1-fdf66d7e99ef.jpg'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description", "content_url") VALUES ('c0000000-0000-4000-8000-000000000003', 'Rentrée spirituelle de l''Ecodim pour tous les enfants', 'rentree-spirituelle-de-l-ecodim', 'TEXTE', 'ACTUALITE', 'ECODIM', 'd0000000-0000-4000-8000-000000000004', 'PUBLISHED', '2026-10-25', 'Le département des enfants (Ecodim) reprend son cycle d''enseignements adaptés, de louanges et d''ateliers bibliques.', 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/3ac64c4e-feb1-41f3-8ca9-4a7a35fd1915.jpg') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'ECODIM', "content_url" = 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/3ac64c4e-feb1-41f3-8ca9-4a7a35fd1915.jpg'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description", "content_url") VALUES ('c0000000-0000-4000-8000-000000000004', 'Réunion de la jeunesse et communion fraternelle', 'reunion-de-la-jeunesse-et-communion-fraternelle', 'TEXTE', 'ACTUALITE', 'CCJV', 'd0000000-0000-4000-8000-00000000000a', 'PUBLISHED', '2026-10-22', 'Rassemblement spécial des jeunes ce samedi pour un temps de partage, de réflexion biblique et de louange.', 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/7028662f-97ac-4941-ad7e-daac3e636bb9.jpg') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'CCJV', "content_url" = 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/7028662f-97ac-4941-ad7e-daac3e636bb9.jpg'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description", "content_url") VALUES ('c0000000-0000-4000-8000-000000000005', 'Atelier biblique et créatif pour les enfants', 'atelier-biblique-et-creatif-pour-les-enfants', 'TEXTE', 'ACTUALITE', 'ECODIM', 'd0000000-0000-4000-8000-000000000004', 'PUBLISHED', '2026-10-18', 'Activités manuelles et mémorisation de versets pour accompagner les enfants dans leur marche avec Dieu.', 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/64cefa2b-a0b3-468c-b8a5-bf243ed3aaa1.jpg') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'ECODIM', "content_url" = 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/64cefa2b-a0b3-468c-b8a5-bf243ed3aaa1.jpg'`,
      `INSERT INTO "publications" ("id", "title", "slug", "type", "category", "scope", "department_id", "status", "published_at", "description", "content_url") VALUES ('c0000000-0000-4000-8000-000000000006', 'Séminaire sur la vie de prière et le jeûne', 'seminaire-sur-la-vie-de-priere-et-le-jeune', 'TEXTE', 'ACTUALITE', 'CCJV', 'd0000000-0000-4000-8000-00000000000a', 'PUBLISHED', '2026-10-12', 'Trois jours d''enseignements profonds pour approfondir son intimité avec le Seigneur et grandir dans la consécration.', 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/e8c98f72-6625-420e-ab54-5de5c4c0f665.jpg') ON CONFLICT ("id") DO UPDATE SET "category" = 'ACTUALITE', "status" = 'PUBLISHED', "scope" = 'CCJV', "content_url" = 'https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/e8c98f72-6625-420e-ab54-5de5c4c0f665.jpg'`,
      `UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000004' WHERE ("title" ILIKE '%ecodim%' OR "title" ILIKE '%enfants%') AND ("department_id" IS NULL OR "department_id" != 'd0000000-0000-4000-8000-000000000004')`,
      `INSERT INTO "events" ("id", "title", "slug", "description", "excerpt", "event_date", "event_time", "location", "status", "visibility_scope", "department_id") VALUES ('e0000000-0000-4000-8000-000000000001', 'Grande veillée de prière et d''intercession', 'grande-veillee-de-priere-et-d-intercession', 'Une nuit entière consacrée à la prière, à l''intercession pour les familles et la nation.', 'Une nuit entière dans la présence du Seigneur à Lubumbashi.', '2026-11-20', '20:00:00', 'Temple Principal CCJV', 'PUBLISHED', 'GLOBAL', 'd0000000-0000-4000-8000-00000000000a') ON CONFLICT ("id") DO NOTHING`,
      `INSERT INTO "events" ("id", "title", "slug", "description", "excerpt", "event_date", "event_time", "location", "status", "visibility_scope", "department_id") VALUES ('e0000000-0000-4000-8000-000000000002', 'Culte spécial d''actions de grâce', 'culte-special-d-actions-de-grace', 'Rassemblement dominical de louange et de témoignages vivants pour la gloire de Dieu.', 'Venez célébrer les bienfaits de Dieu dans votre vie.', '2026-11-22', '08:30:00', 'Temple Principal CCJV', 'PUBLISHED', 'GLOBAL', 'd0000000-0000-4000-8000-00000000000a') ON CONFLICT ("id") DO NOTHING`,
      `INSERT INTO "events" ("id", "title", "slug", "description", "excerpt", "event_date", "event_time", "location", "status", "visibility_scope", "department_id") VALUES ('e0000000-0000-4000-8000-000000000003', 'Festival biblique et louange des enfants', 'festival-biblique-et-louange-des-enfants', 'Programme festif et édifiant organisé par les moniteurs pour tous les enfants.', 'Journée récréative et spirituelle de l''Ecodim.', '2026-11-29', '09:00:00', 'Espace Ecodim CCJV', 'PUBLISHED', 'GLOBAL', 'd0000000-0000-4000-8000-000000000004') ON CONFLICT ("id") DO NOTHING`,
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
