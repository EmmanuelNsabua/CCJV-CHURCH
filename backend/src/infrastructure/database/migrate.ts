import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDatabase, db, sql } from "./client";
import { logger } from "@/infrastructure/logger";

/**
 * Application des migrations versionnées.
 *
 * Volontairement exécuté par un script explicite plutôt qu'automatiquement au
 * démarrage du serveur : une migration est une opération sensible qui doit être
 * déclenchée volontairement (cahier §28, « migrations contrôlées »), et non
 * subie par chaque instance Railway qui redémarre.
 *
 * Drizzle journalise les migrations appliquées dans `drizzle.__drizzle_migrations`
 * et rend l'opération idempotente.
 */
async function main(): Promise<void> {
  logger.info("Application des migrations en cours…");

  // Verrou consultatif : deux instances qui démarreraient en parallèle ne
  // peuvent pas appliquer la même migration simultanément.
  await sql`select pg_advisory_lock(hashtext('ccjv_migrations'))`;

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    logger.info("Migrations appliquées avec succès.");
  } finally {
    await sql`select pg_advisory_unlock(hashtext('ccjv_migrations'))`;
    await closeDatabase();
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Échec de l'application des migrations");
  process.exitCode = 1;
});
