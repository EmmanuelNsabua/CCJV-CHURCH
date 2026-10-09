import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { db, sql } from "@/infrastructure/database/client";
import { DrizzlePublicationRepository } from "@/infrastructure/repositories/publication.repository";
import { DEFAULT_PAGE_SIZE } from "@/shared/http/pagination";
import { createDepartmentSchema } from "@/modules/departments/department.schema";
import { createEventSchema } from "@/modules/events/event.schema";
import { listAdminProfilesQuerySchema } from "@/modules/admin/admin.schema";
import {
  deleteMediaQuerySchema,
  listQuerySchema as listMediaQuerySchema,
} from "@/modules/media/media.schema";
import { listPrayerRequestsQuerySchema } from "@/modules/prayer-requests/prayer-request.schema";
import { settingsPatchSchema } from "@/modules/settings/setting.schema";
import {
  closeTestDatabase,
  describeIfDatabaseAvailable,
} from "../helpers/database";

/**
 * Tests d'intégration des routes HTTP réelles.
 *
 * Ils traversent le pipeline complet — Helmet, CORS, rate limiting, sécurité,
 * validation Zod, controller, service, repository, PostgreSQL, sérialisation,
 * gestion d'erreurs — par de vraies requêtes, sans ouvrir de port (`supertest`
 * démarre une instance éphémère par appel).
 *
 * Ce fichier est le filet de non-régression du contrat public de l'API et des
 * garanties de sécurité. Trois principes le gouvernent :
 *
 * 1. **Aucune donnée durable.** Le seul écrit est un brouillon de publication
 *    portant un préfixe reconnaissable, supprimé dans un `afterAll` — et
 *    préalablement nettoyé dans le `beforeAll` pour survivre à un arrêt brutal
 *    d'une exécution précédente.
 * 2. **Aucune dépendance à un jeton valide.** Les jetons sont vérifiés contre
 *    les clés JWKS de Supabase : impossible d'en forger un depuis un test. Les
 *    cas d'authentification se testent donc tous **sans** en-tête, ce qui
 *    couvre exactement le scénario d'un client non authentifié.
 * 3. **Jamais d'échec pour une cause hors du code.** Si l'application n'est pas
 *    composable ou si PostgreSQL est injoignable, la suite s'ignore en
 *    l'annonçant : `npm test` reste utilisable hors ligne.
 *
 * ⚠️ Budget de rate limiting. Le limiteur global autorise 120 requêtes par
 * minute **et par IP** ; tous les appels de ce fichier partagent la même clé
 * (127.0.0.1), et le compteur est en mémoire donc partagé par toutes les suites
 * de ce fichier. Le fichier émet aujourd'hui 117 requêtes, recomptées une à une
 * (`18 + 18 + 9 + 8 + 5 + 43 + 5 + 2 + 3 + 1 + 1 + 4` : blocs 1, 2, 2bis, 2ter,
 * 2quater, 3, 4, 5, 6, 7, 8 puis 9) **et** mesurées à l'exécution : l'en-tête
 * `RateLimit` de la dernière requête vaut `"120-in-1min"; r=3`. Soit une marge de
 * 3 sous 120 : n'ajoutez pas de boucle non bornée sans recompter, et ne provoquez
 * jamais de 429, qui polluerait toutes les suites suivantes. Les cas couverts
 * « au niveau du schéma » (collections protégées du bloc 2bis) ne consomment
 * aucun quota.
 *
 * Le décompte précédent annonçait 114 requêtes : il comptait 3 requêtes au bloc 5,
 * qui n'en émet que 2 (le test « le brouillon existe réellement en base » et le
 * test de repository interrogent la base directement, sans passer par HTTP). Le
 * compteur réel avant l'ajout du bloc 9 était donc 113, comme le confirme le
 * `r=7` relevé sur la dernière requête du fichier à ce moment-là.
 */

const API = "/api/v1";

/** Identifiant (UUID) qui ne correspond à aucune ressource en base. */
const UUID_INEXISTANT = "00000000-0000-4000-8000-000000000000";

/** Slug qui ne correspond à aucune ressource en base. */
const SLUG_INEXISTANT = "zz-test-integration-inexistant";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -------------------------------------------------------------------------- */
/*  Amorce de l'application, avec dégradation propre                          */
/* -------------------------------------------------------------------------- */

let app: Express | null = null;
let erreurImport: unknown = null;

try {
  const module = await import("@/app");
  app = module.createApp();
} catch (error) {
  erreurImport = error;
}

if (app === null) {
  const raison =
    erreurImport instanceof Error
      ? erreurImport.message.split("\n")[0]
      : String(erreurImport);

  console.warn(
    "[tests/integration/routes.test.ts] Tests d'intégration ignorés : " +
      `l'application n'est pas composable (${raison}).`,
  );
}

/**
 * `describeIfDatabaseAvailable` annonce lui-même la raison de l'ignorance.
 * L'import de l'application est une seconde condition : les deux doivent être
 * satisfaites pour exécuter la moindre requête.
 */
const suiteAvecBase = await describeIfDatabaseAvailable(
  "routes HTTP — contrats publics, validation et sécurité",
);

const describeIntegration = app === null ? describe.skip : suiteAvecBase;

/* -------------------------------------------------------------------------- */
/*  Utilitaires                                                               */
/* -------------------------------------------------------------------------- */

type MethodeHttp = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Émet la requête correspondant au verbe, sans corps.
 *
 * Le `switch` exhaustif évite un accès indexé sur `request(app)`, qui ferait
 * perdre le typage de la valeur de retour.
 */
function envoyer(chemin: string, methode: MethodeHttp) {
  const agent = request(app as Express);

  switch (methode) {
    case "GET":
      return agent.get(chemin);
    case "POST":
      return agent.post(chemin);
    case "PATCH":
      return agent.patch(chemin);
    case "DELETE":
      return agent.delete(chemin);
  }
}

/** Corps d'erreur normalisé `{ error: { code, message } }`. */
function bodyErreur(reponse: request.Response): {
  code: string;
  message: string;
  details?: { champ?: string; message?: string }[];
} {
  return reponse.body.error as {
    code: string;
    message: string;
    details?: { champ?: string; message?: string }[];
  };
}

/* -------------------------------------------------------------------------- */
/*  Tableaux de cas                                                           */
/* -------------------------------------------------------------------------- */

type TypeChamp = "string" | "number";

interface CollectionPublique {
  /** Segment d'URL sous `/api/v1`. */
  ressource: string;
  /** Champs présents et non nuls sur chaque élément, avec leur type attendu. */
  champsObligatoires: Readonly<Record<string, TypeChamp>>;
  /** Identifiant (ou slug) sans correspondance, pour le 404. */
  identifiantAbsent: string;
  /** Code d'erreur exact attendu sur la lecture unitaire. */
  codeAbsent: string;
}

/**
 * Les six collections publiques paginées.
 *
 * Chaque entrée est le contrat minimal de la ressource : ce que le frontend
 * consomme réellement. Les champs facultatifs (donc absents plutôt que `null`
 * dans la sérialisation) sont volontairement exclus du tableau.
 */
const COLLECTIONS_PUBLIQUES: readonly CollectionPublique[] = [
  {
    ressource: "departments",
    champsObligatoires: { id: "string", name: "string", slug: "string" },
    identifiantAbsent: SLUG_INEXISTANT,
    codeAbsent: "DEPARTMENT_NOT_FOUND",
  },
  {
    ressource: "events",
    champsObligatoires: {
      id: "string",
      title: "string",
      slug: "string",
      eventDate: "string",
      status: "string",
    },
    identifiantAbsent: SLUG_INEXISTANT,
    codeAbsent: "EVENT_NOT_FOUND",
  },
  {
    ressource: "publications",
    champsObligatoires: {
      id: "string",
      title: "string",
      slug: "string",
      type: "string",
      publishedAt: "string",
      status: "string",
    },
    identifiantAbsent: SLUG_INEXISTANT,
    codeAbsent: "PUBLICATION_NOT_FOUND",
  },
  {
    ressource: "leaders",
    champsObligatoires: { id: "string", name: "string", role: "string" },
    identifiantAbsent: UUID_INEXISTANT,
    codeAbsent: "LEADER_NOT_FOUND",
  },
  {
    ressource: "testimonies",
    champsObligatoires: { id: "string", quote: "string", name: "string" },
    identifiantAbsent: UUID_INEXISTANT,
    codeAbsent: "TESTIMONY_NOT_FOUND",
  },
  {
    ressource: "community-faces",
    champsObligatoires: { id: "string", name: "string", caption: "string" },
    identifiantAbsent: UUID_INEXISTANT,
    codeAbsent: "COMMUNITY_FACE_NOT_FOUND",
  },
];

/**
 * Les six collections CRUD paginées — celles qu'un client interroge vraiment.
 */
const COLLECTIONS_CRUD: readonly string[] = [
  "departments",
  "events",
  "publications",
  "leaders",
  "testimonies",
  "community-faces",
];

/**
 * **Toutes** les collections dont la *query* est validée et qui répondent sans
 * jeton, donc testables par une vraie requête HTTP.
 *
 * Les six collections CRUD, plus les trois listes bornées non paginées
 * (`scriptures`, `schedule`, `social-links`) : la convention « paramètre inconnu
 * ⇒ 400 » ne souffre aucune exception, y compris là où aucun filtre n'existe.
 * Le tableau est verrouillé par une garde d'exhaustivité dans le bloc 2ter : le
 * vider ou l'amputer fait échouer la suite au lieu de la faire passer à vide.
 */
const COLLECTIONS_QUERY_STRICTE: readonly string[] = [
  ...COLLECTIONS_CRUD,
  "scriptures",
  "schedule",
  "social-links",
];

/**
 * Collections à *query* validée mais **administratives** (`GET /media`,
 * `GET /prayer-requests`, `GET /admin/profiles`).
 *
 * L'authentification précède la validation (cahier §8, vérifié au bloc 4) : un
 * appel sans jeton sort en `401 AUTH_REQUIRED`, jamais en 400. Le refus d'un
 * paramètre inconnu y est donc vérifié **sur le schéma**, sans requête — ce qui
 * évite aussi de consommer le budget de rate limiting.
 */
const COLLECTIONS_QUERY_STRICTE_PROTEGEES: readonly {
  ressource: string;
  requete: Record<string, string>;
  schema: { safeParse: (value: unknown) => { success: boolean } };
}[] = [
  {
    ressource: "media",
    requete: { nimportequoi: "1" },
    schema: listMediaQuerySchema,
  },
  {
    ressource: "prayer-requests",
    requete: { nimportequoi: "1" },
    schema: listPrayerRequestsQuerySchema,
  },
  {
    ressource: "admin/profiles",
    requete: { nimportequoi: "1" },
    schema: listAdminProfilesQuerySchema,
  },
];

/**
 * Collections qui **exposent réellement un tri** (`createSortSchema`, liste
 * blanche de colonnes). Ailleurs, l'ordre est fixé par le serveur : l'API ne
 * prétend pas trier, et un `?sort=…` y est donc refusé comme n'importe quel
 * paramètre non reconnu — option (a) de la décision de contrat.
 */
const COLLECTIONS_TRI_IMPLEMENTE: readonly string[] = ["events", "publications"];

/**
 * Paramètres **légitimes** qui doivent continuer de fonctionner après le passage
 * en strict : pagination explicite, filtres fermés, filtre UUID. Une
 * régression ici serait plus grave qu'un 400 manquant — c'est le client réel
 * qui casserait.
 */
const PARAMS_LEGITIMES: readonly {
  chemin: string;
  motif: string;
  verifier?: (corps: Record<string, unknown>) => void;
}[] = [
  {
    chemin: `${API}/departments?page=1&limit=2`,
    motif: "pagination explicite",
    verifier: (corps) => {
      const meta = corps.meta as Record<string, unknown>;
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(2);
    },
  },
  {
    chemin: `${API}/leaders?page=1&limit=2`,
    motif: "pagination explicite sur une collection sans filtre",
  },
  {
    chemin: `${API}/events?status=UPCOMING`,
    motif: "filtre fermé `status`",
  },
  {
    chemin: `${API}/events?departmentId=${UUID_INEXISTANT}`,
    motif: "filtre UUID `departmentId`",
  },
  {
    chemin: `${API}/publications?type=VIDEO&category=ENSEIGNEMENT`,
    motif: "filtres fermés `type` et `category`",
  },
];

/** Bornes de pagination hors limites, communes à toutes les collections. */
const LIMITES_INVALIDES: readonly { requete: string; champ: string }[] = [
  { requete: "?limit=1000", champ: "limit" },
  { requete: "?limit=0", champ: "limit" },
  { requete: "?page=0", champ: "page" },
];

interface RouteProtegee {
  methode: MethodeHttp;
  chemin: string;
  /** Fichier de déclaration, pour retrouver la route à modifier. */
  source: string;
}

/**
 * **Toutes** les routes non publiques de l'API, relevées dans chaque
 * `src/modules/<module>/<module>.routes.ts`.
 *
 * Ajouter une route protégée ne demande qu'une ligne ici : le test paramétré
 * ci-dessous en fait un cas 401 automatiquement. L'exhaustivité est relative à
 * cette table — c'est pourquoi elle est triée par module et annotée.
 */
const ROUTES_PROTEGEES: readonly RouteProtegee[] = [
  /* departments — department.routes.ts */
  { methode: "POST", chemin: `${API}/departments`, source: "departments" },
  { methode: "PATCH", chemin: `${API}/departments/${SLUG_INEXISTANT}`, source: "departments" },
  { methode: "DELETE", chemin: `${API}/departments/${SLUG_INEXISTANT}`, source: "departments" },

  /* events — event.routes.ts */
  { methode: "POST", chemin: `${API}/events`, source: "events" },
  { methode: "PATCH", chemin: `${API}/events/${SLUG_INEXISTANT}`, source: "events" },
  { methode: "DELETE", chemin: `${API}/events/${SLUG_INEXISTANT}`, source: "events" },

  /* publications — publication.routes.ts */
  { methode: "POST", chemin: `${API}/publications`, source: "publications" },
  { methode: "PATCH", chemin: `${API}/publications/${SLUG_INEXISTANT}`, source: "publications" },
  { methode: "DELETE", chemin: `${API}/publications/${SLUG_INEXISTANT}`, source: "publications" },

  /* leaders — leader.routes.ts */
  { methode: "POST", chemin: `${API}/leaders`, source: "leaders" },
  { methode: "PATCH", chemin: `${API}/leaders/${UUID_INEXISTANT}`, source: "leaders" },
  { methode: "DELETE", chemin: `${API}/leaders/${UUID_INEXISTANT}`, source: "leaders" },

  /* testimonies — testimony.routes.ts */
  { methode: "POST", chemin: `${API}/testimonies`, source: "testimonies" },
  { methode: "PATCH", chemin: `${API}/testimonies/${UUID_INEXISTANT}`, source: "testimonies" },
  { methode: "DELETE", chemin: `${API}/testimonies/${UUID_INEXISTANT}`, source: "testimonies" },

  /* community-faces — community-face.routes.ts */
  { methode: "POST", chemin: `${API}/community-faces`, source: "community-faces" },
  { methode: "PATCH", chemin: `${API}/community-faces/${UUID_INEXISTANT}`, source: "community-faces" },
  { methode: "DELETE", chemin: `${API}/community-faces/${UUID_INEXISTANT}`, source: "community-faces" },

  /* scriptures — scripture.routes.ts */
  { methode: "POST", chemin: `${API}/scriptures`, source: "scriptures" },
  { methode: "PATCH", chemin: `${API}/scriptures/zz-test-integration`, source: "scriptures" },
  { methode: "DELETE", chemin: `${API}/scriptures/zz-test-integration`, source: "scriptures" },

  /* schedule — schedule.routes.ts */
  { methode: "POST", chemin: `${API}/schedule`, source: "schedule" },
  { methode: "PATCH", chemin: `${API}/schedule/${UUID_INEXISTANT}`, source: "schedule" },
  { methode: "DELETE", chemin: `${API}/schedule/${UUID_INEXISTANT}`, source: "schedule" },

  /* social-links — social-link.routes.ts */
  { methode: "POST", chemin: `${API}/social-links`, source: "social-links" },
  { methode: "PATCH", chemin: `${API}/social-links/${UUID_INEXISTANT}`, source: "social-links" },
  { methode: "DELETE", chemin: `${API}/social-links/${UUID_INEXISTANT}`, source: "social-links" },

  /* settings — setting.routes.ts (route unique, document singulier) */
  { methode: "PATCH", chemin: `${API}/settings`, source: "settings" },

  /* static-pages — static-page.routes.ts */
  { methode: "PATCH", chemin: `${API}/pages/accueil`, source: "static-pages" },

  /* media — media.routes.ts : registre entièrement administratif, GET compris */
  { methode: "GET", chemin: `${API}/media`, source: "media" },
  { methode: "GET", chemin: `${API}/media/${UUID_INEXISTANT}/usage`, source: "media" },
  { methode: "GET", chemin: `${API}/media/${UUID_INEXISTANT}`, source: "media" },
  { methode: "POST", chemin: `${API}/media`, source: "media" },
  { methode: "DELETE", chemin: `${API}/media/${UUID_INEXISTANT}`, source: "media" },

  /* prayer-requests — prayer-request.routes.ts : seule la création est publique */
  { methode: "GET", chemin: `${API}/prayer-requests`, source: "prayer-requests" },
  { methode: "GET", chemin: `${API}/prayer-requests/${UUID_INEXISTANT}`, source: "prayer-requests" },
  { methode: "PATCH", chemin: `${API}/prayer-requests/${UUID_INEXISTANT}`, source: "prayer-requests" },
  { methode: "DELETE", chemin: `${API}/prayer-requests/${UUID_INEXISTANT}`, source: "prayer-requests" },

  /* admin — admin.routes.ts : aucune route publique */
  { methode: "GET", chemin: `${API}/admin/me`, source: "admin" },
  { methode: "GET", chemin: `${API}/admin/profiles`, source: "admin" },
];

/* -------------------------------------------------------------------------- */
/*  Données de test éphémères                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Préfixe volontairement reconnaissable : il rend la ligne de test repérable en
 * base à l'œil nu, et permet un nettoyage par `LIKE` même si le nettoyage
 * nominal n'a pas pu s'exécuter (arrêt du processus).
 */
const PREFIXE_BROUILLON = "zz-test-integration-brouillon-";
const SLUG_BROUILLON = `${PREFIXE_BROUILLON}publication`;
const TITRE_BROUILLON =
  "[TEST] Brouillon d'intégration — ne doit jamais être exposé publiquement";

/**
 * `true` seulement lorsque la ligne de test a réellement été insérée.
 *
 * Le nettoyage de fin ne doit pas tenter de requête si rien n'a été écrit :
 * hors ligne (suite ignorée), un `delete` échouerait et ferait planter un
 * fichier qui n'a pourtant rien à se reprocher.
 */
let brouillonInstalle = false;

async function purgerBrouillonsDeTest(): Promise<void> {
  await sql`delete from publications where slug like ${`${PREFIXE_BROUILLON}%`}`;
}

async function installerBrouillonDeTest(): Promise<void> {
  // Nettoyage défensif : une exécution précédente interrompue avant son
  // `afterAll` aurait laissé la ligne, et l'insertion échouerait sur l'index
  // unique de `slug`.
  await purgerBrouillonsDeTest();

  // `department_id` est `NOT NULL` depuis le Lot 4 (D-02, D-06) : le brouillon de
  // test porte donc un département, comme toute publication réelle. Il est pris
  // par **slug** et non par nom : le test ne dépend pas du référentiel.
  await sql`
    insert into publications (title, slug, type, category, published_at, status, department_id)
    values (
      ${TITRE_BROUILLON}, ${SLUG_BROUILLON}, 'TEXTE', 'ACTUALITE', current_date, 'DRAFT',
      (select id from departments where slug = 'presse')
    )
  `;

  brouillonInstalle = true;
}

/**
 * Nettoyage et fermeture du pool au niveau du fichier — donc exécutés même si
 * la suite est ignorée (base injoignable), pour ne jamais laisser de socket
 * ouvert derrière soi.
 */
afterAll(async () => {
  try {
    if (brouillonInstalle) {
      await purgerBrouillonsDeTest();
    }
  } finally {
    await closeTestDatabase();
  }
});

/* -------------------------------------------------------------------------- */
/*  Suite                                                                     */
/* -------------------------------------------------------------------------- */

describeIntegration("routes HTTP — contrats, validation et sécurité", () => {
  /* ---------------------------------------------------------------------- */
  /*  1. Contrat de réponse des routes publiques                            */
  /* ---------------------------------------------------------------------- */

  describe("1. contrat de réponse des collections publiques", () => {
    for (const collection of COLLECTIONS_PUBLIQUES) {
      it(`GET ${API}/${collection.ressource} → 200, enveloppe { data, meta } conforme`, async () => {
        const reponse = await request(app as Express).get(
          `${API}/${collection.ressource}`,
        );

        expect(reponse.status).toBe(200);
        expect(reponse.headers["content-type"]).toMatch(/application\/json/);

        const data: unknown = reponse.body.data;
        expect(Array.isArray(data)).toBe(true);

        const items = data as Record<string, unknown>[];
        // La base de développement est amorcée : une collection vide signalerait
        // un problème de données, pas un contrat satisfait. On refuse donc de
        // valider « à vide ».
        expect(items.length).toBeGreaterThan(0);

        const meta = reponse.body.meta as Record<string, unknown>;
        expect(Object.keys(meta).sort()).toEqual([
          "limit",
          "page",
          "total",
          "totalPages",
        ]);
        for (const cle of ["page", "limit", "total", "totalPages"]) {
          expect(typeof meta[cle]).toBe("number");
        }

        const total = Number(meta.total);
        const limit = Number(meta.limit);
        expect(meta.page).toBe(1);
        expect(limit).toBe(DEFAULT_PAGE_SIZE);
        expect(total).toBeGreaterThanOrEqual(items.length);
        expect(meta.totalPages).toBe(Math.ceil(total / limit));

        for (const item of items) {
          // `id` est toujours un UUID : c'est la clé de toutes les routes
          // unitaires et de toutes les références croisées du frontend.
          expect(typeof item.id).toBe("string");
          expect(String(item.id)).toMatch(UUID_PATTERN);

          for (const [champ, type] of Object.entries(
            collection.champsObligatoires,
          )) {
            expect(typeof item[champ]).toBe(type);
          }
        }
      });

      it(`GET ${API}/${collection.ressource}?limit=2 → au plus 2 éléments et meta recalculée`, async () => {
        const reponse = await request(app as Express).get(
          `${API}/${collection.ressource}?limit=2`,
        );

        expect(reponse.status).toBe(200);

        const items = reponse.body.data as unknown[];
        const meta = reponse.body.meta as Record<string, unknown>;

        expect(items.length).toBeLessThanOrEqual(2);
        expect(meta.limit).toBe(2);
        expect(meta.page).toBe(1);
        expect(meta.totalPages).toBe(
          Math.ceil(Number(meta.total) / Number(meta.limit)),
        );
      });

      it(`GET ${API}/${collection.ressource}/<identifiant inexistant> → 404 ${collection.codeAbsent}`, async () => {
        const reponse = await request(app as Express).get(
          `${API}/${collection.ressource}/${collection.identifiantAbsent}`,
        );

        expect(reponse.status).toBe(404);
        expect(reponse.headers["content-type"]).toMatch(/application\/json/);

        const erreur = bodyErreur(reponse);
        expect(erreur.code).toBe(collection.codeAbsent);
        expect(typeof erreur.message).toBe("string");
        expect(erreur.message.length).toBeGreaterThan(0);

        // Une ressource absente ne divulgue jamais de détail technique.
        expect(erreur).not.toHaveProperty("stack");
      });
    }
  });

  /* ---------------------------------------------------------------------- */
  /*  2. Validation des entrées                                             */
  /* ---------------------------------------------------------------------- */

  describe("2. validation — bornes de pagination", () => {
    for (const collection of COLLECTIONS_PUBLIQUES) {
      for (const cas of LIMITES_INVALIDES) {
        it(`GET ${API}/${collection.ressource}${cas.requete} → 400 VALIDATION_ERROR sur « ${cas.champ} »`, async () => {
          const reponse = await request(app as Express).get(
            `${API}/${collection.ressource}${cas.requete}`,
          );

          expect(reponse.status).toBe(400);

          const erreur = bodyErreur(reponse);
          expect(erreur.code).toBe("VALIDATION_ERROR");
          expect(typeof erreur.message).toBe("string");

          // Le champ fautif est nommé : l'erreur est exploitable par le client.
          expect(Array.isArray(erreur.details)).toBe(true);
          expect(
            (erreur.details ?? []).some((detail) => detail.champ === cas.champ),
          ).toBe(true);
        });
      }
    }
  });

  /* ---------------------------------------------------------------------- */
  /*  2bis. Convention des paramètres de requête                            */
  /* ---------------------------------------------------------------------- */

  /**
   * **Convention** : tout paramètre de requête non reconnu est refusé en
   * `400 VALIDATION_ERROR` sur *toutes* les routes de collection, et le
   * paramètre fautif est nommé dans `details`. Aucune collection n'est
   * silencieusement permissive — c'est précisément l'irrégularité que ce bloc
   * verrouille : `departments`, `leaders`, `testimonies` et `community-faces`
   * utilisaient la pagination commune non stricte, et acceptaient donc
   * `?sort=colonne_inconnue` en 200, contrairement à `events` et `publications`.
   */
  describe("2bis. paramètre de requête inconnu — refusé partout", () => {
    it("le tableau des collections à query stricte est complet (sinon les tests passeraient à vide)", () => {
      // Garde anti-vacuité : sans elle, une table vidée par accident ferait
      // disparaître les cas sans qu'aucun test n'échoue.
      expect(COLLECTIONS_QUERY_STRICTE.length).toBeGreaterThan(0);

      // Garde d'exhaustivité : les six collections CRUD **et** les trois listes
      // bornées doivent être couvertes, sans doublon.
      for (const ressource of [...COLLECTIONS_CRUD, "scriptures", "schedule", "social-links"]) {
        expect(COLLECTIONS_QUERY_STRICTE).toContain(ressource);
      }
      expect(new Set(COLLECTIONS_QUERY_STRICTE).size).toBe(
        COLLECTIONS_QUERY_STRICTE.length,
      );

      expect(COLLECTIONS_QUERY_STRICTE_PROTEGEES.length).toBeGreaterThan(0);
      expect(PARAMS_LEGITIMES.length).toBeGreaterThan(0);
    });

    for (const ressource of COLLECTIONS_QUERY_STRICTE) {
      it(`GET ${API}/${ressource}?nimportequoi=1 → 400 VALIDATION_ERROR nommant « nimportequoi »`, async () => {
        const reponse = await request(app as Express).get(
          `${API}/${ressource}?nimportequoi=1`,
        );

        expect(reponse.status).toBe(400);
        expect(reponse.headers["content-type"]).toMatch(/application\/json/);

        const erreur = bodyErreur(reponse);
        expect(erreur.code).toBe("VALIDATION_ERROR");
        // Le paramètre fautif est nommé : la faute de frappe du client devient
        // une erreur exploitable, pas un silence.
        expect(
          (erreur.details ?? []).some((detail) => detail.champ === "nimportequoi"),
        ).toBe(true);
      });
    }

    for (const collection of COLLECTIONS_QUERY_STRICTE_PROTEGEES) {
      it(`GET ${API}/${collection.ressource} refuse « nimportequoi » au niveau du schéma (route protégée)`, () => {
        // L'authentification précède la validation sur ces routes : le 401 est
        // vérifié au bloc 3, et le refus du paramètre ici.
        const resultat = collection.schema.safeParse(collection.requete);

        expect(resultat.success).toBe(false);
        expect(
          collection.schema.safeParse({ page: "1", limit: "2" }).success,
        ).toBe(true);
      });
    }

    it(`DELETE ${API}/media/:id — « force » reste accepté, une faute de frappe est refusée`, () => {
      // Route non-collection : le paramètre légitime `force` documenté ne doit
      // pas être cassé par le passage en strict, mais `?forcee=true` ne doit pas
      // passer pour une absence de `force` (il ne serait alors jamais converti
      // en suppression forcée, sans que le client le sache).
      expect(deleteMediaQuerySchema.safeParse({}).success).toBe(true);
      expect(deleteMediaQuerySchema.safeParse({ force: "true" }).success).toBe(true);
      expect(deleteMediaQuerySchema.safeParse({ force: "false" }).success).toBe(true);
      expect(deleteMediaQuerySchema.safeParse({ forcee: "true" }).success).toBe(false);
      expect(
        deleteMediaQuerySchema.safeParse({ force: "maybe" }).success,
      ).toBe(false);
    });
  });

  describe("2ter. validation — liste blanche de tri", () => {
    it("le tableau des collections triées est renseigné", () => {
      expect(COLLECTIONS_TRI_IMPLEMENTE.length).toBeGreaterThan(0);
      expect(COLLECTIONS_TRI_IMPLEMENTE.length).toBeLessThanOrEqual(
        COLLECTIONS_CRUD.length,
      );
    });

    for (const ressource of COLLECTIONS_CRUD) {
      it(`GET ${API}/${ressource}?sort=colonne_interdite → 400 VALIDATION_ERROR`, async () => {
        const reponse = await request(app as Express).get(
          `${API}/${ressource}?sort=colonne_interdite`,
        );

        expect(reponse.status).toBe(400);

        const erreur = bodyErreur(reponse);
        expect(erreur.code).toBe("VALIDATION_ERROR");
        // Deux causes possibles selon la collection, et une seule réponse :
        // `events`/`publications` refusent la colonne (elle est hors liste
        // blanche), les quatre autres refusent le paramètre lui-même (aucun tri
        // n'est exposé). Dans les deux cas le champ fautif est `sort`.
        expect(
          (erreur.details ?? []).some((detail) => detail.champ === "sort"),
        ).toBe(true);
      });
    }

    for (const ressource of COLLECTIONS_TRI_IMPLEMENTE) {
      it(`GET ${API}/${ressource}?sort=-created_at → 200 (tri descendant autorisé)`, async () => {
        const reponse = await request(app as Express).get(
          `${API}/${ressource}?sort=-created_at`,
        );

        expect(reponse.status).toBe(200);
        expect(Array.isArray(reponse.body.data)).toBe(true);
      });
    }
  });

  /**
   * Contre-épreuve du passage en strict : les paramètres **légitimes** doivent
   * continuer de fonctionner. Un schéma strict qui refuserait ses propres clés
   * (`page`, `limit`) ou un filtre documenté casserait le client réel tout en
   * faisant passer les tests de refus ci-dessus.
   */
  describe("2quater. paramètres légitimes — toujours acceptés", () => {
    for (const cas of PARAMS_LEGITIMES) {
      it(`GET ${cas.chemin} → 200 (${cas.motif})`, async () => {
        const reponse = await request(app as Express).get(cas.chemin);

        expect(reponse.status).toBe(200);

        const corps = reponse.body as Record<string, unknown>;
        expect(Array.isArray(corps.data)).toBe(true);
        cas.verifier?.(corps);
      });
    }
  });

  /* ---------------------------------------------------------------------- */
  /*  3. Sécurité — aucune route d'administration sans jeton                */
  /* ---------------------------------------------------------------------- */

  describe("3. sécurité — routes d'administration sans en-tête Authorization", () => {
    it("le tableau des routes protégées est renseigné et bien formé", () => {
      // Sans cette garde, une table vidée par accident ferait passer le test
      // paramétré « à vide » : zéro cas, zéro échec, fausse assurance.
      expect(ROUTES_PROTEGEES.length).toBeGreaterThan(0);

      for (const route of ROUTES_PROTEGEES) {
        expect(["GET", "POST", "PATCH", "DELETE"]).toContain(route.methode);
        expect(route.chemin.startsWith(`${API}/`)).toBe(true);
        expect(route.source.length).toBeGreaterThan(0);
      }
    });

    for (const route of ROUTES_PROTEGEES) {
      it(`${route.methode} ${route.chemin} → 401 AUTH_REQUIRED (${route.source})`, async () => {
        const reponse = await envoyer(route.chemin, route.methode);

        // 401 et non 403 : l'absence de jeton est un défaut d'authentification.
        // 401 et non 400 ou 404 : l'authentification est le premier middleware,
        // la route est bien montée et le chemin est le bon.
        expect(reponse.status).toBe(401);
        expect(reponse.headers["content-type"]).toMatch(/application\/json/);

        const erreur = bodyErreur(reponse);
        expect(erreur.code).toBe("AUTH_REQUIRED");
        expect(typeof erreur.message).toBe("string");
        expect(erreur.message.length).toBeGreaterThan(0);

        // Aucun contenu protégé ne fuit, et aucun détail technique non plus.
        expect(reponse.body).not.toHaveProperty("data");
        expect(erreur).not.toHaveProperty("stack");
      });
    }

    it("GET /api/v1/admin/me avec un jeton malformé → 401 AUTH_REQUIRED", async () => {
      const reponse = await request(app as Express)
        .get(`${API}/admin/me`)
        .set("Authorization", "Bearer pas-un-jwt");

      expect(reponse.status).toBe(401);
      expect(bodyErreur(reponse).code).toBe("AUTH_REQUIRED");
    });

    it("GET /api/v1/admin/me avec un schéma d'authentification incorrect → 401 AUTH_REQUIRED", async () => {
      const reponse = await request(app as Express)
        .get(`${API}/admin/me`)
        .set("Authorization", "Basic xxx");

      expect(reponse.status).toBe(401);
      expect(bodyErreur(reponse).code).toBe("AUTH_REQUIRED");
    });

    it("POST /api/v1/departments avec un en-tête Bearer vide → 401 AUTH_REQUIRED", async () => {
      const reponse = await request(app as Express)
        .post(`${API}/departments`)
        .set("Authorization", "Bearer ");

      expect(reponse.status).toBe(401);
      expect(bodyErreur(reponse).code).toBe("AUTH_REQUIRED");
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  4. Ordre des middlewares                                              */
  /* ---------------------------------------------------------------------- */

  describe("4. ordre des middlewares — authentification avant validation", () => {
    interface CasOrdre {
      methode: MethodeHttp;
      chemin: string;
      corps?: Record<string, unknown>;
      motif: string;
    }

    /**
     * Chacune de ces entrées est **réellement invalide** (voir le test de
     * cohérence ci-dessous). Si la validation s'exécutait avant
     * l'authentification, la réponse serait 400 ; elle doit être 401.
     */
    const CAS: readonly CasOrdre[] = [
      {
        methode: "POST",
        chemin: `${API}/departments`,
        corps: {},
        motif: "corps vide, `name` requis",
      },
      {
        methode: "POST",
        chemin: `${API}/events`,
        corps: {},
        motif: "corps vide, `title` et `eventDate` requis",
      },
      {
        methode: "PATCH",
        chemin: `${API}/settings`,
        corps: {},
        motif: "corps vide, `settings` requis",
      },
      {
        methode: "GET",
        chemin: `${API}/media?limit=1000`,
        motif: "query hors bornes (limit > 100)",
      },
      {
        methode: "GET",
        chemin: `${API}/admin/profiles?page=0`,
        motif: "query hors bornes (page < 1)",
      },
    ];

    it("les entrées utilisées ici sont bien invalides (sinon le 401 ne prouverait rien)", () => {
      expect(createDepartmentSchema.safeParse({}).success).toBe(false);
      expect(createEventSchema.safeParse({}).success).toBe(false);
      expect(settingsPatchSchema.safeParse({}).success).toBe(false);
      expect(listMediaQuerySchema.safeParse({ limit: "1000" }).success).toBe(
        false,
      );
      expect(
        listAdminProfilesQuerySchema.safeParse({ page: "0" }).success,
      ).toBe(false);
    });

    for (const cas of CAS) {
      it(`${cas.methode} ${cas.chemin} — ${cas.motif} — sans jeton → 401, jamais 400`, async () => {
        const agent = envoyer(cas.chemin, cas.methode);
        const reponse = await (cas.corps === undefined
          ? agent
          : agent.send(cas.corps));

        expect(reponse.status).toBe(401);
        expect(reponse.status).not.toBe(400);
        expect(bodyErreur(reponse).code).toBe("AUTH_REQUIRED");
      });
    }
  });

  /* ---------------------------------------------------------------------- */
  /*  5. Non-exposition des brouillons                                      */
  /* ---------------------------------------------------------------------- */

  describe("5. non-exposition des brouillons de publication", () => {
    beforeAll(async () => {
      await installerBrouillonDeTest();
    });

    it("le brouillon existe réellement en base (le test n'est pas vacuous)", async () => {
      const lignes = await sql`
        select id, status from publications
        where slug = ${SLUG_BROUILLON}
      `;

      expect(lignes.length).toBe(1);
      expect(lignes[0]?.status).toBe("DRAFT");
    });

    it(`le brouillon n'apparaît jamais dans GET ${API}/publications`, async () => {
      // `limit` au maximum autorisé : même en demandant toute la collection, le
      // brouillon ne doit pas ressortir.
      const reponse = await request(app as Express).get(
        `${API}/publications?limit=100`,
      );

      expect(reponse.status).toBe(200);

      const items = reponse.body.data as { slug?: unknown; status?: unknown }[];

      expect(items.some((item) => item.slug === SLUG_BROUILLON)).toBe(false);
      // Garde plus large : aucun brouillon, quel qu'il soit.
      expect(items.some((item) => item.status === "DRAFT")).toBe(false);
    });

    it(`le brouillon reste introuvable par GET ${API}/publications/:idOrSlug → 404`, async () => {
      const reponse = await request(app as Express).get(
        `${API}/publications/${SLUG_BROUILLON}`,
      );

      expect(reponse.status).toBe(404);
      // Un brouillon est indistinguable d'une ressource absente : le code est
      // celui d'un 404 ordinaire, sans indice sur son existence.
      expect(bodyErreur(reponse).code).toBe("PUBLICATION_NOT_FOUND");
    });

    it("la garde est portée par le repository, pas seulement par le filtre de liste", async () => {
      const publications = new DrizzlePublicationRepository(db);

      await expect(
        publications.findByIdOrSlug(SLUG_BROUILLON, false),
      ).resolves.toBeNull();

      const administrable = await publications.findByIdOrSlug(
        SLUG_BROUILLON,
        true,
      );
      expect(administrable).not.toBeNull();
      expect(administrable?.status).toBe("DRAFT");
      expect(administrable?.title).toBe(TITRE_BROUILLON);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  6. Écriture publique — demandes de prière (validation seule)          */
  /* ---------------------------------------------------------------------- */

  describe("6. POST /api/v1/prayer-requests — validation du corps", () => {
    /**
     * Budget de rate limiting de cette suite : 5 dépôts par heure et par IP.
     * Les trois cas ci-dessous sont **refusés avant insertion**, donc aucune
     * ligne n'est créée et aucun quota n'est consommé par un 201. Rester sous 5
     * requêtes POST sur cette route est une contrainte du fichier : ajouter un
     * cas ici nécessite de vérifier ce budget.
     */
    it("corps vide → 400 VALIDATION_ERROR nommant « requestText »", async () => {
      const reponse = await request(app as Express)
        .post(`${API}/prayer-requests`)
        .send({});

      expect(reponse.status).toBe(400);

      const erreur = bodyErreur(reponse);
      expect(erreur.code).toBe("VALIDATION_ERROR");
      expect(
        (erreur.details ?? []).some((detail) => detail.champ === "requestText"),
      ).toBe(true);
    });

    it("clé inconnue (`isFeatured`) → 400 : le schéma est strict", async () => {
      const reponse = await request(app as Express)
        .post(`${API}/prayer-requests`)
        .send({ requestText: "Intention de test", isFeatured: true });

      expect(reponse.status).toBe(400);

      const erreur = bodyErreur(reponse);
      expect(erreur.code).toBe("VALIDATION_ERROR");
      // Une clé non prévue ne peut pas être injectée dans la ligne : elle est
      // refusée, jamais silencieusement ignorée.
      expect(JSON.stringify(erreur.details)).toContain("isFeatured");
    });

    it("texte composé uniquement d'espaces → 400", async () => {
      const reponse = await request(app as Express)
        .post(`${API}/prayer-requests`)
        .send({ requestText: "     " });

      expect(reponse.status).toBe(400);

      const erreur = bodyErreur(reponse);
      expect(erreur.code).toBe("VALIDATION_ERROR");
      expect(
        (erreur.details ?? []).some((detail) => detail.champ === "requestText"),
      ).toBe(true);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  7. Rate limiting                                                      */
  /* ---------------------------------------------------------------------- */

  describe("7. rate limiting — en-têtes normalisés", () => {
    it(`GET ${API}/departments expose RateLimit et RateLimit-Policy sans 429`, async () => {
      const reponse = await request(app as Express).get(`${API}/departments`);

      // On n'atteint jamais la limite ici : provoquer un 429 polluerait les
      // autres suites, qui partagent le compteur (en mémoire, par IP).
      expect(reponse.status).toBe(200);

      expect(typeof reponse.headers["ratelimit"]).toBe("string");
      expect(typeof reponse.headers["ratelimit-policy"]).toBe("string");
      expect(reponse.headers["ratelimit-policy"]).toMatch(/q=\d+/);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  8. Route inexistante                                                  */
  /* ---------------------------------------------------------------------- */

  describe("8. route inexistante", () => {
    it(`GET ${API}/route-qui-nexiste-pas → 404 NOT_FOUND au format standard`, async () => {
      const reponse = await request(app as Express).get(
        `${API}/route-qui-nexiste-pas`,
      );

      expect(reponse.status).toBe(404);
      expect(reponse.headers["content-type"]).toMatch(/application\/json/);

      const erreur = bodyErreur(reponse);
      expect(erreur.code).toBe("NOT_FOUND");
      expect(typeof erreur.message).toBe("string");
      expect(erreur.message.length).toBeGreaterThan(0);
      expect(erreur).not.toHaveProperty("stack");
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  9. Routes sans paramètre — document unique et page éditable            */
  /* ---------------------------------------------------------------------- */

  /**
   * Les deux dernières routes de l'API dont la *query* n'était pas validée :
   * `GET /settings` (document unique) et `GET /pages/:pageKey` (page éditable).
   * Elles acceptaient `?nimportequoi=1` en `200`, en l'ignorant.
   *
   * Aucun paramètre légitime n'y existe : ni le controller, ni le frontend n'en
   * lisent un — le schéma est donc l'objet strict **vide**
   * (`emptyQuerySchema`), et non un objet permissif qui laisserait passer le
   * paramètre en silence.
   */
  describe("9. routes sans paramètre — paramètre inconnu refusé", () => {
    interface RouteQueryVide {
      chemin: string;
      /** Ce que la lecture doit réellement renvoyer, pour prouver le 200. */
      verifier: (corps: Record<string, unknown>) => void;
    }

    const ROUTES_QUERY_VIDE: readonly RouteQueryVide[] = [
      {
        chemin: `${API}/settings`,
        verifier: (corps) => {
          expect(typeof corps.settings).toBe("object");
          expect(Array.isArray(corps.socialLinks)).toBe(true);
        },
      },
      {
        chemin: `${API}/pages/accueil`,
        verifier: (corps) => {
          // La page rendue est bien celle demandée, et non un contenu générique.
          expect(corps.pageKey).toBe("accueil");
          expect(typeof corps.content).toBe("object");
        },
      },
    ];

    it("le tableau des routes à query vide est renseigné", () => {
      expect(ROUTES_QUERY_VIDE.length).toBeGreaterThan(0);
    });

    for (const route of ROUTES_QUERY_VIDE) {
      it(`GET ${route.chemin}?nimportequoi=1 → 400 VALIDATION_ERROR nommant « nimportequoi »`, async () => {
        const reponse = await request(app as Express).get(
          `${route.chemin}?nimportequoi=1`,
        );

        // 400 et non 200 : le paramètre n'est plus ignoré, il est refusé — la
        // convention vaut donc aussi pour les routes hors collection.
        expect(reponse.status).toBe(400);
        expect(String(reponse.headers["content-type"])).toContain(
          "application/json",
        );

        const erreur = bodyErreur(reponse);
        expect(erreur.code).toBe("VALIDATION_ERROR");
        expect(
          (erreur.details ?? []).some(
            (detail) => detail.champ === "nimportequoi",
          ),
        ).toBe(true);
      });

      it(`GET ${route.chemin} sans paramètre → 200 (non-régression)`, async () => {
        const reponse = await request(app as Express).get(route.chemin);

        // Contre-épreuve : le passage en strict ne doit pas casser la lecture
        // légitime, qui est l'appel réel du frontend.
        expect(reponse.status).toBe(200);
        expect(String(reponse.headers["content-type"])).toContain(
          "application/json",
        );

        route.verifier(reponse.body as Record<string, unknown>);
      });
    }
  });
});
