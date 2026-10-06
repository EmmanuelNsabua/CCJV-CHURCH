import pino from "pino";
import { env, isProduction, isTest } from "@/config/env";

/**
 * Journalisation structurée JSON.
 *
 * Règles de sécurité (cahier §19, `docs/018` §9) : ne jamais journaliser de
 * jeton, d'en-tête `Authorization`, de corps de demande de prière, de
 * coordonnée personnelle ni de secret. Les sérialiseurs ci-dessous retirent les
 * champs sensibles des requêtes avant écriture.
 */
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "apikey",
  "proxy-authorization",
]);

const SENSITIVE_BODY_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "access_token",
  "refresh_token",
  "requestText",
  "requesterContact",
  "requesterName",
]);

function redactHeaders(
  headers: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!headers) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    safe[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[masqué]" : value;
  }
  return safe;
}

function redactBody(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactBody);

  const safe: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    safe[key] = SENSITIVE_BODY_FIELDS.has(key) ? "[masqué]" : redactBody(entry);
  }
  return safe;
}

export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  // En développement, une sortie lisible ; en production, du JSON brut.
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
  redact: {
    paths: [
      "req.headers",
      "request.headers",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.access_token",
      "*.refresh_token",
      "*.SUPABASE_SERVICE_ROLE_KEY",
    ],
    censor: "[masqué]",
  },
  serializers: {
    req(request: {
      method?: string;
      url?: string;
      headers?: Record<string, unknown>;
      body?: unknown;
    }) {
      return {
        method: request.method,
        url: request.url,
        headers: redactHeaders(request.headers),
        body: request.body === undefined ? undefined : redactBody(request.body),
      };
    },
    err(error: Error) {
      return {
        type: error.name,
        message: error.message,
        stack: isProduction ? undefined : error.stack,
      };
    },
  },
});

export type Logger = typeof logger;
