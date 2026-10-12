import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/infrastructure/database/schema";
// Import **de type uniquement** : effacé à la compilation, il ne construit donc
// aucun pool vers la base d'exploitation. Le repository attend exactement ce type.
import type { Database } from "@/infrastructure/database/client";

/**
 * Connexion à la **base de test**, distincte de celle du projet.
 *
 * ### Pourquoi ce fichier existe, et pourquoi il n'utilise pas `DATABASE_URL`
 *
 * `backend/.env` pointe vers la base **d'exploitation** (le pooler Supabase du
 * projet). Un test qui exerce la règle globale des 3 sur cette base-là archive de
 * vraies publications : la règle est globale, donc publier une quatrième ligne
 * rend `ARCHIVED` la plus ancienne des trois publications **réellement en ligne**.
 * Ce n'est pas une hypothèse : c'est la conséquence directe de `docs/035` §1.
 *
 * La preuve d'intégration passe donc par une variable **dédiée**,
 * `TEST_DATABASE_URL`, et il n'existe **aucun repli** sur `DATABASE_URL` : sans
 * variable explicite, la suite s'ignore (ou échoue en mode strict) au lieu de
 * risquer d'écrire ailleurs. Un repli silencieux serait exactement le genre de
 * commodité qui transforme un test en incident.
 *
 * ### Les deux garde-fous de l'appelant
 *
 * Ce module fournit la connexion ; la **qualification de la base** appartient au
 * test, qui vérifie avant toute écriture :
 *
 * 1. que le nom de la base se termine par `_test` (`nomBaseAccepte`) ;
 * 2. qu'elle ne contient **aucune** publication étrangère au test.
 *
 * Les deux ensemble rendent une erreur de configuration impossible à confondre
 * avec un succès : un `TEST_DATABASE_URL` mal désigné fait échouer la suite avec
 * un message explicite, avant la moindre insertion.
 */

/** Variable qui porte l'URL de la base de test. */
export const VARIABLE_BASE_DE_TEST = "TEST_DATABASE_URL";

/** Variable du mode strict, déjà utilisée par `tests/helpers/database.ts`. */
export const VARIABLE_MODE_STRICT = "REQUIRE_DATABASE";

/**
 * Suffixe exigé pour le nom de la base.
 *
 * La convention est explicite, et vérifiable par un humain qui lit la
 * configuration : `ccjv_test`, `ccjv_quota_test`… Une base d'exploitation ne
 * porte pas ce suffixe, et `nomBaseAccepte` refuse tout le reste.
 */
export const SUFFIXE_BASE_DE_TEST = "_test";

/** URL de la base de test, ou `null` si elle n'est pas configurée. */
export function urlBaseDeTest(): string | null {
  const url = process.env[VARIABLE_BASE_DE_TEST];
  if (url === undefined) return null;

  const valeur = url.trim();
  return valeur.length === 0 ? null : valeur;
}

/** Vrai si le nom de base est celui d'une base de test — garde **avant écriture**. */
export function nomBaseAccepte(nom: string): boolean {
  return nom.endsWith(SUFFIXE_BASE_DE_TEST);
}

export interface BaseDeTest {
  sql: Sql;
  /**
   * Même type que la base de production (`Database`), pour que le repository
   * réel — `DrizzlePublicationRepository` — soit constructible sans adaptation :
   * c'est bien **lui** qui est éprouvé, pas une variante.
   */
  db: Database;
  /** Nom réel de la base, lu par `current_database()`. */
  nom: string;
}

/**
 * Ouvre une connexion à la base de test.
 *
 * Les options reproduisent celles de `src/infrastructure/database/client.ts` :
 * `prepare: false` (le pooler ne supporte pas les requêtes préparées nommées, et
 * s'en écarter ferait diverger le test du chemin réel) et surtout la conservation
 * des colonnes `date` sous forme de **chaînes** — `published_at` est une date ISO
 * dans tout le domaine, et un `Date` JavaScript y introduirait un décalage de
 * fuseau que la production n'a pas.
 *
 * La taille du pool est en revanche plus large que celle de la production : la
 * démonstration de concurrence a besoin de plusieurs transactions ouvertes
 * **simultanément**, et `publishWithQuota` consomme à elle seule deux connexions
 * (la transaction, puis sa relecture finale).
 */
export async function ouvrirBaseDeTest(): Promise<BaseDeTest> {
  const url = urlBaseDeTest();
  if (url === null) {
    throw new Error(
      `${VARIABLE_BASE_DE_TEST} n'est pas défini : aucune base de test n'est configurée.`,
    );
  }

  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 20,
    prepare: false,
    types: {
      date: {
        to: 1184,
        from: [1082],
        serialize: (value: string) => value,
        parse: (value: string) => value,
      },
    },
  });

  const [ligne] = await client<{ nom: string }[]>`select current_database() as nom`;
  const nom = ligne?.nom ?? "";

  return {
    sql: client,
    // Le client de test porte **exactement** les mêmes options que celui de la
    // production ; seule l'inférence du paramètre de type de `postgres.js`
    // diffère entre deux littéraux distincts. La conversion est donc de forme,
    // jamais de comportement — et c'est le même fabriquant qui est appelé.
    db: drizzle(client, { schema, logger: false }) as unknown as Database,
    nom,
  };
}

/** Ferme le pool de la base de test. */
export async function fermerBaseDeTest(base: BaseDeTest): Promise<void> {
  await base.sql.end({ timeout: 5 });
}
