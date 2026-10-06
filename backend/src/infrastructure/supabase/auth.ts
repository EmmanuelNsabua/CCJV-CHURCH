import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/config/env";
import { AuthRequiredError } from "@/shared/errors/app-error";
import { logger } from "@/infrastructure/logger";

/**
 * Vérification des jetons Supabase Auth.
 *
 * La signature est contrôlée contre les clés publiques JWKS du projet
 * (asymétrique), ce qui évite de manipuler un secret partagé côté backend.
 *
 * **Performance :** le jeu de clés est mis en cache par `jose` et rafraîchi
 * automatiquement. Aucun appel réseau n'est fait à chaque requête — contrainte
 * explicite de `docs/006` §22 (connectivité limitée) : une vérification par
 * appel réseau doublerait la latence de chaque écriture administrative.
 */
const jwksUrl = new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
const issuer = `${env.SUPABASE_URL}/auth/v1`;

const JWKS = createRemoteJWKSet(jwksUrl, {
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  timeoutDuration: 5_000,
  cooldownDuration: 30_000,
});

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  /** Rôle porté par le jeton Supabase (`authenticated`, `service_role`…). */
  tokenRole: string | null;
}

/**
 * Vérifie un jeton et retourne l'identité. Lève `AuthRequiredError` si le
 * jeton est absent, expiré, mal signé ou destiné à un autre projet.
 */
export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedUser> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: "authenticated",
    });

    const userId = readString(payload, "sub");
    if (!userId) {
      throw new AuthRequiredError("Jeton sans identifiant de sujet");
    }

    return {
      userId,
      email: readString(payload, "email"),
      tokenRole: readString(payload, "role"),
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) throw error;

    logger.warn(
      { err: error },
      "Jeton refusé : signature, expiration ou émetteur invalide",
    );
    // Message volontairement générique : on ne dit pas au client *pourquoi*
    // le jeton est refusé.
    throw new AuthRequiredError("Jeton d'accès invalide ou expiré");
  }
}

function readString(payload: JWTPayload, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

/** Extrait le jeton d'un en-tête `Authorization: Bearer <token>`. */
export function extractBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}
