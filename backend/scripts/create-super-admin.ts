import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, closeDatabase } from "@/infrastructure/database/client";
import { adminProfiles } from "@/infrastructure/database/schema/admin";
import { DrizzleAdminProfileRepository } from "@/infrastructure/repositories/admin-profile.repository";
import { supabaseAdmin } from "@/infrastructure/supabase/client";
import { logger } from "@/infrastructure/logger";

/**
 * Création du compte **`SUPER_ADMIN`** — opération d'amorçage, hors application.
 *
 * ```text
 * npm run admin:super -- --email <adresse> [--username superadmin] [--password "..."] [--dry-run]
 * ```
 *
 * ### Pourquoi ce script existe, et pourquoi ce n'est pas une route
 *
 * `docs/028` D-03 fait du `SUPER_ADMIN` un compte **distinct**, possédant tous les
 * pouvoirs du système sauf un : il ne voit **rien** du domaine des prières (D-10).
 * C'est le seul compte dont l'existence précède l'application — d'où une
 * conséquence que le mandat a inscrite en règle d'arrêt : **son identité est
 * désignée par l'organisation**, jamais inventée par l'implémentation (Q-NT3).
 *
 * La route `POST /admin/users` sait créer un `SUPER_ADMIN` (`docs/029` cellule
 * 1.3 : « `SUPER_ADMIN` ✔ »), mais elle exige… qu'un `SUPER_ADMIN` l'appelle.
 * C'est un œuf et une poule : le **premier** compte ne peut pas naître de l'API.
 * Il naît donc ici, avec les identifiants de l'exploitant — le même niveau de
 * confiance qu'une migration, et sans qu'aucun rôle applicatif soit requis.
 *
 * ### Ce que le script garantit
 *
 * 1. **Idempotence** : si un profil `SUPER_ADMIN` existe déjà, le script s'arrête
 *    en le disant, sans rien écrire. Relancer un amorçage ne doit jamais produire
 *    un second compte suprême.
 * 2. **Cohérence du profil** : `role = SUPER_ADMIN`, `scope = GLOBAL`,
 *    `department_id = NULL` — exactement ce qu'exige la contrainte
 *    `admin_profiles_scope_coherence` (`docs/032` §3.1). Un rôle système rattaché à
 *    un département serait refusé par la base.
 * 3. **Compensation** : si l'écriture du profil échoue après la création du compte
 *    d'authentification, le compte est supprimé — on ne laisse pas un utilisateur
 *    capable de s'authentifier et dépourvu de profil.
 * 4. **Aucun secret journalisé** : le mot de passe est affiché **une fois** sur la
 *    sortie standard s'il a été généré, et n'apparaît dans aucun journal structuré.
 * 5. **`--dry-run`** : vérifie tout (connexion, absence de compte, cohérence) et
 *    s'arrête avant la moindre écriture.
 *
 * ### Ce que le script ne fait pas
 *
 * Il ne crée **aucune** clé de prière, aucun fragment de récupération, aucune
 * enveloppe : ces objets appartiennent au cycle cryptographique du Lot 8, et le
 * `SUPER_ADMIN` n'y a de toute façon **aucun accès** (D-10, D-11).
 */

interface CliArgs {
  email: string;
  username: string;
  password: string | null;
  dryRun: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const values = new Map<string, string>();
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token || !token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = argv[index + 1];

    if (next && !next.startsWith("--")) {
      values.set(key, next);
      index += 1;
      continue;
    }

    if (key === "dry-run") dryRun = true;
  }

  const email = values.get("email") ?? process.env.SUPER_ADMIN_EMAIL;
  if (!email) {
    throw new Error(
      "Adresse électronique requise : `--email <adresse>` ou variable SUPER_ADMIN_EMAIL. " +
        "L'identité du compte suprême est désignée par l'organisation (Q-NT3), jamais inventée.",
    );
  }

  const username = values.get("username") ?? email.split("@")[0] ?? "superadmin";
  const password = values.get("password") ?? null;

  return { email, username, password, dryRun };
}

function generatePassword(): string {
  // 24 octets, soit 192 bits : très au-delà des 12 caractères de `docs/030` §5.
  // `base64url` évite les caractères que les interfaces web tronquent.
  return randomBytes(24).toString("base64url");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const profiles = new DrizzleAdminProfileRepository(db);

  // 1. Un SUPER_ADMIN existe-t-il déjà ? C'est la première question, et elle
  //    protège d'un second compte suprême créé par une relance.
  const existants = await db
    .select({ id: adminProfiles.id, username: adminProfiles.username })
    .from(adminProfiles)
    .where(eq(adminProfiles.role, "SUPER_ADMIN"));

  if (existants.length > 0) {
    logger.warn(
      { comptes: existants.length, usernames: existants.map((row) => row.username) },
      "Un compte SUPER_ADMIN existe déjà : aucun compte créé (script idempotent)",
    );
    return;
  }

  // 2. Un compte du même nom d'utilisateur ? Le profil est unique par
  //    `lower(username)` : le dire avant d'écrire évite une erreur de contrainte.
  const homonyme = await profiles.findByUsername(args.username);
  if (homonyme !== null) {
    throw new Error(
      `Un profil porte déjà le nom d'utilisateur « ${args.username} » ` +
        `(rôle ${homonyme.role}). Choisissez un autre nom, ou promouvez ce compte ` +
        "depuis l'application.",
    );
  }

  const motDePasse = args.password ?? generatePassword();
  const genere = args.password === null;

  if (args.dryRun) {
    logger.info(
      { email: args.email, username: args.username },
      "Simulation : tout est en ordre, AUCUNE écriture effectuée (--dry-run)",
    );
    return;
  }

  // 3. Compte d'authentification d'abord : c'est Supabase qui détient le mot de
  //    passe (docs/006 §2.2), le profil applicatif ne porte aucun secret.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: args.email,
    password: motDePasse,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(
      `Création du compte d'authentification impossible : ${error?.message ?? "identifiant absent"}`,
    );
  }

  try {
    // 4. Profil applicatif : `GLOBAL` et **aucun** département, comme l'exige la
    //    contrainte de cohérence.
    const profil = await profiles.upsert({
      id: data.user.id,
      username: args.username,
      displayName: "Super administrateur",
      role: "SUPER_ADMIN",
      scope: "GLOBAL",
      departmentId: null,
    });

    logger.info(
      { id: profil.id, username: profil.username, role: profil.role, scope: profil.scope },
      "Compte SUPER_ADMIN créé : tous les pouvoirs du système, SAUF le domaine des prières (D-10)",
    );
  } catch (error) {
    // 5. Compensation : pas de compte d'authentification sans profil.
    await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    throw error;
  }

  if (genere) {
    // Sortie **standard**, une seule fois : un mot de passe généré doit être lu par
    // l'opérateur, jamais retrouvé dans un journal structuré.
    console.log(
      `\nMot de passe provisoire (affiché une seule fois) : ${motDePasse}\n` +
        "Changez-le à la première connexion, ou régénérez-le depuis Supabase Auth.\n",
    );
  }
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, "Création du compte SUPER_ADMIN interrompue");
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
