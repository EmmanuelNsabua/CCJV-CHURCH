import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env, isProduction, isTest } from "@/config/env";
import * as schema from "./schema";

/**
 * Client PostgreSQL partagé.
 *
 * `prepare: false` est **obligatoire** : la connexion passe par le pooler
 * Supabase en mode transaction/session, qui ne supporte pas les requêtes
 * préparées nommées de `postgres.js`.
 *
 * La taille du pool est volontairement modeste : l'hébergement Railway et le
 * pooler Supabase imposent une limite de connexions, et un pool trop large
 * provoque des erreurs de saturation sous charge — l'inverse du but recherché.
 */
const poolSize = isTest ? 2 : isProduction ? 10 : 5;

export const sql = postgres(env.DATABASE_URL, {
  max: poolSize,
  idle_timeout: 20,
  connect_timeout: 20,
  prepare: false,
  // Les colonnes `date`/`time` restent des chaînes : le domaine manipule des
  // dates ISO, jamais des objets `Date` sujets aux décalages de fuseau horaire.
  types: {
    date: {
      to: 1184,
      from: [1082],
      serialize: (value: string) => value,
      parse: (value: string) => value,
    },
  },
});

export const db = drizzle(sql, { schema, logger: false });

export type Database = typeof db;

/** Ferme proprement le pool — utilisé à l'arrêt du serveur et en fin de tests. */
export async function closeDatabase(): Promise<void> {
  await sql.end({ timeout: 5 });
}
