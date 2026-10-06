import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Configuration de drizzle-kit : génération des migrations SQL versionnées.
 *
 * La génération (`db:generate`) est purement locale — elle compare le schéma
 * TypeScript à l'historique des migrations et n'a besoin d'aucune connexion.
 * L'application (`db:migrate`) passe par le script dédié, qui utilise le pooler.
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est requis pour drizzle-kit. Copiez backend/.env.example en backend/.env.",
  );
}

export default defineConfig({
  schema: "./src/infrastructure/database/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
  // Les tables du schéma `auth` appartiennent à Supabase : on ne les gère pas.
  schemaFilter: ["public"],
});
