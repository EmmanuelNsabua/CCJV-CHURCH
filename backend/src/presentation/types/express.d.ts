import type { AdminProfile } from "@/domain/entities";
import type { AuthenticatedUser } from "@/infrastructure/supabase/auth";

/**
 * Enrichissement de la requête Express.
 *
 * `auth` porte l'identité vérifiée (jeton valide), `admin` le profil applicatif
 * chargé depuis la base. Les deux sont distincts : être authentifié ne suffit
 * pas à être administrateur actif (cahier §7).
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
      admin?: AdminProfile;
    }
  }
}

export {};
