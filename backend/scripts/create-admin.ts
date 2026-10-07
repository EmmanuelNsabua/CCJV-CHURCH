import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/infrastructure/supabase/client";
import { DrizzleAdminProfileRepository } from "@/infrastructure/repositories/admin-profile.repository";
import { db } from "@/infrastructure/database/client";
import { closeDatabase } from "@/infrastructure/database/client";
import { logger } from "@/infrastructure/logger";

/**
 * Création du premier administrateur.
 *
 * Deux opérations, dans cet ordre :
 * 1. création du compte auprès de **Supabase Auth** — c'est lui qui détient le
 *    mot de passe, jamais notre base (`docs/006` §2.2) ;
 * 2. création du profil applicatif dans `admin_profiles`, avec le rôle `ADMIN`
 *    et le scope `GLOBAL` (`docs/028` D-01, D-05 : le compte d'administration
 *    existant devient `ADMIN` ; le `SUPER_ADMIN` est un compte **distinct**, qui
 *    ne doit pas être créé par ce script d'amorçage).
 *
 * Si la seconde étape échoue, le compte d'authentification est supprimé :
 * on ne laisse pas derrière soi un utilisateur capable de se connecter mais
 * dépourvu de profil — donc systématiquement refusé à l'usage.
 *
 * ⚠️ Ce script n'est PAS destiné à la production : il sert à amorcer un
 * environnement de développement ou un environnement neuf.
 *
 * Usage :
 *   npx tsx scripts/create-admin.ts --email admin@ccjv.local [--username admin] [--password "..."]
 *
 * À défaut de `--password`, un mot de passe aléatoire est généré et affiché
 * une seule fois.
 */

interface CliArgs {
  email: string;
  username: string;
  password: string;
  generated: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token || !token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(key, next);
      index += 1;
    }
  }

  const email = values.get("email") ?? process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error(
      "Adresse e-mail requise : `--email <adresse>` ou variable ADMIN_EMAIL.",
    );
  }

  const username = values.get("username") ?? process.env.ADMIN_USERNAME ?? email.split("@")[0];
  if (!username) {
    throw new Error("Nom d'utilisateur introuvable.");
  }

  const providedPassword = values.get("password") ?? process.env.ADMIN_PASSWORD;
  const password = providedPassword ?? generatePassword();

  return { email, username, password, generated: !providedPassword };
}

/** Mot de passe aléatoire d'une longueur confortable, sans caractère ambigu. */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(24);
  let password = "";
  for (const byte of bytes) {
    password += alphabet[byte % alphabet.length];
  }
  return password;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const adminProfiles = new DrizzleAdminProfileRepository(db);

  const existing = await adminProfiles.findByUsername(args.username);
  if (existing) {
    throw new Error(
      `Le nom d'utilisateur « ${args.username} » est déjà utilisé (profil ${existing.id}).`,
    );
  }

  logger.info({ email: args.email }, "Création du compte Supabase Auth…");

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: args.email,
    password: args.password,
    // L'adresse est considérée comme vérifiée : le compte est créé par
    // l'administrateur lui-même, aucun courriel de confirmation n'est envoyé.
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(
      `Échec de la création du compte Supabase Auth : ${error?.message ?? "utilisateur non retourné"}`,
    );
  }

  const userId = data.user.id;

  try {
    const profile = await adminProfiles.upsert({
      id: userId,
      username: args.username,
      displayName: args.username,
      role: "ADMIN",
      scope: "GLOBAL",
    });

    logger.info(
      { profileId: profile.id, username: profile.username, role: profile.role },
      "Profil administrateur créé",
    );
  } catch (error) {
    // Compensation : on ne laisse pas un compte d'authentification orphelin.
    logger.error(
      { err: error },
      "Échec de la création du profil : suppression du compte Auth",
    );
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw error;
  }

  // Affichage volontairement hors du logger : ces informations ne doivent pas
  // se retrouver dans des journaux persistés.
  process.stdout.write(
    [
      "",
      "──────────────────────────────────────────────",
      "  Administrateur CCJV créé",
      "──────────────────────────────────────────────",
      `  Utilisateur : ${args.username}`,
      `  Courriel    : ${args.email}`,
      args.generated
        ? `  Mot de passe: ${args.password}   ← généré, affiché une seule fois`
        : "  Mot de passe: (celui fourni)",
      "",
      "  Conservez ces informations en lieu sûr.",
      "──────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, "Création de l'administrateur impossible");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
