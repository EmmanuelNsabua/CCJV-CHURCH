import { describe } from "@jest/globals";
import { sql, closeDatabase } from "@/infrastructure/database/client";
/**
 * Disponibilité de la base, pour les tests d'intégration.
 *
 * Les tests d'intégration interrogent la **vraie base Supabase** (identifiants
 * dans `backend/.env`). Hors ligne, ou si le projet est en pause, ils doivent
 * s'ignorer proprement en l'annonçant — jamais planter, jamais échouer pour une
 * cause qui n'est pas dans le code.
 *
 * La sonde est exécutée une seule fois par fichier de test (chaque fichier Jest
 * a son propre registre de modules) et son résultat est mémorisé : `select 1`
 * sur le pooler Supabase coûte quelques centaines de millisecondes, il ne faut
 * pas le refaire à chaque suite.
 */

let sonde: Promise<boolean> | null = null;

export function isDatabaseReachable(): Promise<boolean> {
  sonde ??= (async () => {
    try {
      await sql`select 1`;
      return true;
    } catch {
      return false;
    }
  })();

  return sonde;
}

/** Signature minimale et commune à `describe` et `describe.skip`. */
type SuiteFactory = (nom: string, fabrique: () => void) => void;

/**
 * Choisit entre `describe` et `describe.skip` selon la disponibilité de la base.
 *
 * À utiliser avec un `await` de premier niveau, **avant** toute fabrique de
 * suite :
 *
 * ```ts
 * const describeAvecBase = await describeIfDatabaseAvailable("départements");
 * describeAvecBase("…", () => { … });
 * ```
 *
 * `describe.skip` continue de déclarer les `it` (ils apparaissent « skipped »
 * dans le rapport) mais n'en exécute aucun corps : aucune requête réseau n'est
 * tentée, et `npm test` reste utilisable hors ligne.
 *
 * ### `REQUIRE_DATABASE=1` — l'ignorance devient un échec
 *
 * Un test ignoré ne fait pas échouer une exécution : sans drapeau, une base
 * injoignable produit un rapport **vert** dont deux suites n'ont pas tourné. Le
 * décompte de Jest le dit (`Tests: … skipped`), mais rien n'oblige à le lire, et
 * c'est exactement la façon dont une preuve disparaît sans bruit.
 *
 * Avec `REQUIRE_DATABASE=1`, l'indisponibilité **lève** au chargement du fichier :
 * la suite est rapportée en échec, avec la raison. Le mode strict est donc
 * disponible pour une exécution de vérification, sans rien retirer au confort du
 * mode hors ligne.
 */
export async function describeIfDatabaseAvailable(
  titre: string,
): Promise<SuiteFactory> {
  const disponible = await isDatabaseReachable();

  if (!disponible) {
    if (process.env.REQUIRE_DATABASE === "1") {
      throw new Error(
        `[tests] Base PostgreSQL injoignable alors que REQUIRE_DATABASE=1 : la suite « ${titre} » ` +
          "ne peut pas s'exécuter. Sans ce drapeau, elle serait ignorée — et l'exécution " +
          "rapporterait un succès qui n'a pas eu lieu.",
      );
    }

    console.warn(
      `[tests] Suite ignorée — base PostgreSQL injoignable : « ${titre} ». ` +
        "Renseignez DATABASE_URL dans backend/.env, ou relancez lorsque la base est de nouveau accessible.",
    );
    return describe.skip;
  }

  return describe;
}

/**
 * Ferme le pool PostgreSQL ouvert par ce fichier de test.
 *
 * Sans cela, `postgres.js` garde des sockets ouverts jusqu'à son
 * `idle_timeout` (20 s) et Jest signale un processus de travail qui ne se
 * termine pas proprement.
 */
export async function closeTestDatabase(): Promise<void> {
  try {
    await closeDatabase();
  } catch {
    // Le pool n'a jamais servi (base injoignable) : rien à fermer.
  }
}
