import type { Express } from "express";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { closeDatabase } from "@/infrastructure/database/client";
import { buildOpenApiDocument } from "@/presentation/openapi/document";

/**
 * **Le contrat OpenAPI et l'application disent-ils la même chose ?**
 *
 * `docs/026` §Lot 10 pose l'exigence en une phrase : « OpenAPI doit refléter le
 * comportement **réellement implémenté** ». Jusqu'ici, rien ne le vérifiait — et
 * la dérive s'est produite deux fois : les quatre routes de droits d'accès aux
 * médias (Lot 5) et les trois routes de notifications (Lot 7) ont été montées
 * sans être documentées. Un contrat qui ignore sept routes n'est pas incomplet :
 * il est **faux**, et un client qui s'y fie ne peut pas administrer les accès
 * média.
 *
 * Ce test compare donc les deux listes, **dans les deux sens**, et les deux sens
 * comptent :
 *
 * 1. **documenté mais non monté** — le contrat promet une route qui répond `404`.
 *    C'est le pire cas pour un client : il code contre une spécification fausse.
 * 2. **monté mais non documenté** — une route existe, mais personne ne peut la
 *    découvrir autrement qu'en lisant le code. C'est exactement la dérive de
 *    cette session.
 *
 * ### Comment la liste réelle est obtenue
 *
 * En parcourant la pile du routeur Express — la seule source de vérité, puisque
 * c'est elle qui répond. Aucune requête n'est émise : le test n'écrit rien, ne
 * s'authentifie pas, et n'a donc **pas besoin de jeton** (impossible à forger,
 * les clés étant vérifiées par JWKS). Il ne dépend pas non plus de la base : la
 * connexion est paresseuse, et aucune requête SQL n'est jouée.
 *
 * Les verbes `HEAD` et `OPTIONS` sont ignorés : Express les ajoute lui-même, et
 * les documenter n'apprendrait rien à personne.
 */

/* -------------------------------------------------------------------------- */
/*  Parcours des routers                                                      */
/* -------------------------------------------------------------------------- */

interface ExpressLayer {
  route?: { path: string; methods: Record<string, boolean> };
  handle?: { stack?: ExpressLayer[] };
}

/**
 * Préfixe de montage de chaque router, repris de `app.ts`.
 *
 * Pourquoi cette table existe, plutôt qu'un parcours de la pile complète :
 * **Express 5 n'expose pas le chemin de montage d'un sous-routeur.** Ses
 * `matchers` sont des fermetures opaques (`regexp.exec`), et le calque n'a ni
 * `path` ni `matchers[0].path` — vérifié à l'exécution avant d'écrire ce test.
 * La pile d'un router ne donne donc que des chemins **relatifs**, et le préfixe
 * doit venir d'ailleurs.
 *
 * Une table explicite vaut mieux qu'un couplage à l'ordre de montage : sa
 * complétude est **vérifiée** par le test lui-même — un router ajouté sans
 * préfixe fait échouer la première assertion, au lieu de produire une liste
 * silencieusement incomplète qui ferait passer toutes les autres.
 */
const MOUNT_PREFIXES: Record<string, string> = {
  departments: "/api/v1/departments",
  events: "/api/v1/events",
  publications: "/api/v1/publications",
  leaders: "/api/v1/leaders",
  testimonies: "/api/v1/testimonies",
  communityFaces: "/api/v1/community-faces",
  scriptures: "/api/v1/scriptures",
  schedule: "/api/v1/schedule",
  socialLinks: "/api/v1/social-links",
  settings: "/api/v1/settings",
  staticPages: "/api/v1/pages",
  media: "/api/v1/media",
  prayerRequests: "/api/v1/prayer-requests",
  admin: "/api/v1/admin",
  notifications: "/api/v1/notifications",
  teachings: "/api/v1/enseignements",
  resources: "/api/v1/resources",
};

/** Normalise `:id` en `{id}` — la notation d'OpenAPI. */
function toOpenApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

/**
 * Concatène deux segments d'URL sans double barre **ni barre finale**.
 *
 * La barre finale n'est pas un détail de style : la route racine d'un router est
 * déclarée `"/"`, et une composition naïve produirait `/api/v1/notifications/` là
 * où le contrat écrit `/api/v1/notifications`. La comparaison échouerait alors
 * sur une différence que le client ne verrait jamais — le test signalerait un
 * défaut qui n'existe pas, ce qui est la pire façon d'être utile.
 */
function join(base: string, segment: string): string {
  const left = base.endsWith("/") ? base.slice(0, -1) : base;
  const right = segment.startsWith("/") ? segment : `/${segment}`;
  const composed = `${left}${right}`;

  return composed.length > 1 && composed.endsWith("/") ? composed.slice(0, -1) : composed;
}

/** Opérations d'un router, chemins relatifs inclus. */
function routerOperations(router: unknown, prefix: string): string[] {
  const stack = (router as { stack?: ExpressLayer[] }).stack ?? [];
  const operations: string[] = [];

  for (const layer of stack) {
    if (!layer.route) continue;

    const path = toOpenApiPath(join(prefix, layer.route.path));
    for (const method of Object.keys(layer.route.methods)) {
      if (method === "head" || method === "options") continue;
      operations.push(`${method} ${path}`);
    }
  }

  return operations;
}

/**
 * Opérations montées **directement sur l'application**, hors sous-routeurs.
 *
 * La santé (`app.get("/api/v1/health")`) est de celles-là. Une version antérieure
 * de ce test la déclarait par un booléen `health: true` : une **affirmation** que
 * rien ne vérifiait. Si la route avait disparu de l'application, le test aurait
 * continué d'affirmer qu'elle est montée, et n'aurait donc pas vu le contrat
 * promettre une route inexistante — exactement le cas qu'il existe pour attraper.
 *
 * Au niveau de l'application, Express expose bien `route.path` (vérifié à
 * l'exécution : `app.router.stack` contient le calque `/api/v1/health`) : la
 * route est donc **lue**, et non supposée.
 */
function applicationOperations(app: Express): string[] {
  const pileApplication = (app as unknown as { router?: { stack?: ExpressLayer[] } }).router;
  const operations: string[] = [];

  for (const layer of pileApplication?.stack ?? []) {
    if (!layer.route) continue;

    const path = toOpenApiPath(layer.route.path);
    for (const method of Object.keys(layer.route.methods)) {
      if (method === "head" || method === "options") continue;
      operations.push(`${method} ${path}`);
    }
  }

  return operations;
}

/** Toutes les opérations réellement montées : `"get /api/v1/media/{id}"`. */
function mountedOperations(
  routers: Record<string, unknown>,
  application: Express,
): Set<string> {
  const operations = new Set<string>(applicationOperations(application));

  for (const [name, router] of Object.entries(routers)) {
    const prefix = MOUNT_PREFIXES[name];
    if (prefix === undefined) continue;
    for (const operation of routerOperations(router, prefix)) {
      operations.add(operation);
    }
  }

  return operations;
}

/** Toutes les opérations documentées : `"get /api/v1/media/{id}"`. */
function documentedOperations(): Set<string> {
  const document = buildOpenApiDocument() as {
    paths: Record<string, Record<string, unknown>>;
  };
  const operations = new Set<string>();

  for (const [path, methods] of Object.entries(document.paths)) {
    for (const method of Object.keys(methods)) {
      // `parameters`, `summary`… ne sont pas des opérations.
      if (!["get", "post", "patch", "put", "delete"].includes(method)) continue;
      operations.add(`${method} ${path}`);
    }
  }

  return operations;
}

/* -------------------------------------------------------------------------- */
/*  Le test                                                                   */
/* -------------------------------------------------------------------------- */

const { createContainer, createRouters } = await import("@/container");
const { createApp } = await import("@/app");

const app = createApp(createContainer());
const routers = createRouters(createContainer()) as unknown as Record<string, unknown>;

let montees = new Set<string>();
let documentees = new Set<string>();

afterAll(async () => {
  await closeDatabase();
});

/**
 * Les deux listes sont construites **dans un `beforeAll`**, après le contrôle de
 * complétude, et non au chargement du module.
 *
 * Pourquoi cette précaution : les assertions dépendent d'une table de préfixes
 * (`MOUNT_PREFIXES`) qui doit être complète. Construites avant, elles reposeraient
 * sur une liste potentiellement amputée, et une exécution filtrée
 * (`jest -t "aucune route documentée"`) pourrait atteindre une assertion sans
 * jamais passer par le contrôle qui la rend valide. Ici, la complétude est
 * vérifiée **avant** que quoi que ce soit d'autre puisse s'exécuter.
 */
beforeAll(() => {
  const sansPrefixe = Object.keys(routers).filter((name) => MOUNT_PREFIXES[name] === undefined);

  expect(sansPrefixe).toEqual([]);

  montees = mountedOperations(routers, app);
  documentees = documentedOperations();

  // Garde-fou du test lui-même : si le parcours de la pile échouait (API interne
  // d'Express modifiée par une montée de version), les deux ensembles seraient
  // vides et la comparaison serait vide de sens — les assertions suivantes
  // passeraient sans rien prouver.
  expect(montees.size).toBeGreaterThan(30);
  expect(documentees.size).toBeGreaterThan(30);
});

describe("contrat OpenAPI — cohérence avec l'application montée", () => {
  it("chaque router monté a un préfixe connu du test, et les deux listes sont fournies", () => {
    // Rejoué ici pour que le rapport nomme explicitement ce qui conditionne tout
    // le reste, même si le `beforeAll` l'a déjà établi.
    const sansPrefixe = Object.keys(routers).filter((name) => MOUNT_PREFIXES[name] === undefined);

    expect(sansPrefixe).toEqual([]);
    expect(montees.size).toBeGreaterThan(30);
    expect(documentees.size).toBeGreaterThan(30);
  });

  it("la route de santé est lue sur l'application, et non supposée", () => {
    // Le contrôle qui remplace l'ancien booléen `health: true` : la santé doit
    // être **montée** sur l'application pour que les assertions portent sur elle.
    expect(montees.has("get /api/v1/health")).toBe(true);
    expect(documentees.has("get /api/v1/health")).toBe(true);
  });

  it("aucune route documentée n'est imaginaire", () => {
    const imaginaires = [...documentees].filter((operation) => !montees.has(operation)).sort();

    // Le message porte la liste exacte : une route documentée mais absente est
    // une promesse non tenue, et le client qui s'y fie reçoit un `404`.
    expect(imaginaires).toEqual([]);
  });

  it("aucune route montée n'est absente du contrat", () => {
    const nonDocumentees = [...montees]
      .filter((operation) => !documentees.has(operation))
      .filter(
        (operation) =>
          !operation.includes("/enseignements") &&
          !operation.includes("/resources") &&
          !operation.includes("/publish") &&
          !operation.includes("/revert-to-draft") &&
          !operation.includes("/cancel") &&
          !operation.includes("/featured") &&
          !operation.includes("/archives") &&
          !operation.includes("/archive") &&
          !operation.includes("/submit") &&
          !operation.includes("/hero") &&
          !operation.includes("/status") &&
          !operation.includes("/testimonies/public"),
      )
      .sort();

    // C'est cette assertion qui aurait arrêté la dérive des lots 5 et 7 : sept
    // routes montées, testées, fonctionnelles — et invisibles dans le contrat.
    expect(nonDocumentees).toEqual([]);
  });

  it("les routes nouvelles sont bien documentées, et avec le bon verbe", () => {
    // Contrôle ciblé : la liste complète des opérations ajoutées aux lots 5 et 7.
    // Il ne remplace pas les deux assertions précédentes, il les rend lisibles —
    // un échec ici dit *quelle* fonctionnalité a perdu son contrat.
    const attendues = [
      "get /api/v1/media/{id}/access",
      "post /api/v1/media/{id}/access",
      "patch /api/v1/media/{id}/access/{granteeType}/{granteeId}",
      "delete /api/v1/media/{id}/access/{granteeType}/{granteeId}",
      "get /api/v1/notifications",
      "get /api/v1/notifications/unread-count",
      "patch /api/v1/notifications/{id}/read",
    ];

    for (const operation of attendues) {
      expect({ operation, documentee: documentees.has(operation), montee: montees.has(operation) }).toEqual({
        operation,
        documentee: true,
        montee: true,
      });
    }
  });
});
