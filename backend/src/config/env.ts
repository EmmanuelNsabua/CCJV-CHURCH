import "dotenv/config";
import { z } from "zod";

/**
 * Configuration centralisée et validée au démarrage.
 *
 * Aucune variable n'est lue ailleurs dans le code : tout passe par `env`.
 * Le processus refuse de démarrer si la configuration est invalide — mieux vaut
 * un échec immédiat et lisible qu'une erreur obscure à la première requête.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),

  SUPABASE_URL: z.url("SUPABASE_URL doit être une URL valide"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY est requis"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY est requis"),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("ccjv-media"),

  API_VERSION: z.string().min(1).default("v1"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // On n'affiche jamais les valeurs : uniquement les clés fautives.
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(racine)"} : ${issue.message}`)
      .join("\n");
    throw new Error(
      `Configuration d'environnement invalide :\n${details}\n\n` +
        "Copiez `backend/.env.example` en `backend/.env` et renseignez les valeurs.",
    );
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Origines autorisées par CORS, séparées par des virgules dans `CORS_ORIGIN`. */
export const corsOrigins: string[] = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

/** Préfixe commun de toutes les routes métier : `/api/v1`. */
export const apiBasePath = `/api/${env.API_VERSION}`;
