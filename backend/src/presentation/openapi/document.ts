/**
 * Construction du document OpenAPI 3.1 de l'API CCJV.
 *
 * ## Principe : la documentation n'est pas un second contrat
 *
 * Le cahier du projet impose que « la documentation OpenAPI corresponde au
 * comportement réel de l'API ». Ce fichier est donc écrit **contre
 * l'implémentation**, pas contre une intention :
 *
 * - les **chemins** et les **méthodes** sont ceux réellement montés dans
 *   `src/app.ts` et déclarés dans les `*.routes.ts` de chaque module ;
 * - les **corps de requête** sont les schémas Zod des modules eux-mêmes,
 *   importés et convertis par `@asteasolutions/zod-to-openapi` : Zod reste la
 *   source de vérité, un schéma qui change change la documentation. Ils sont
 *   inscrits **dans l'opération** (le générateur ne peut associer un `refId` à
 *   un schéma Zod que via `extendZodWithOpenApi`, dont le correctif de prototype
 *   n'atteint pas les classes de Zod 4.6 sous `tsx` : le document reste exact,
 *   seule la mise en facteur dans `components/schemas` est perdue) ;
 * - les **codes d'erreur** sont les 24 valeurs de l'union `ErrorCode` de
 *   `shared/errors/app-error.ts` — aucune n'est inventée, et la couverture est
 *   vérifiée à la compilation (`ERROR_CODES` ci-dessous) ;
 * - les **bornes** de pagination, les valeurs d'énumération et les tailles
 *   maximales sont importées des constantes de l'implémentation
 *   (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `MEDIA_FOLDERS`, …).
 *
 * ## Ce qui est écrit à la main, et pourquoi
 *
 * - Les **DTO de réponse** : l'API n'a pas de schéma Zod de sortie, la réponse
 *   est produite par les `*.serializer.ts`. Chaque schéma de ce fichier est
 *   donc la transcription exacte du serializer correspondant (champs toujours
 *   présents, champs omis lorsqu'ils valent `null` en domaine, énumérations).
 * - Les **paramètres** (chemin et requête) : les schémas Zod de *query*
 *   utilisent `.transform()` et `z.preprocess()` (`createSortSchema`,
 *   `deleteMediaQuerySchema`), qui ne se projettent pas en paramètres OpenAPI.
 *   Chaque paramètre reprend néanmoins les bornes réelles du schéma Zod.
 *
 * ## Enveloppes (docs/004 §34)
 *
 * - collection : `{ data: [...], meta: { page, limit, total, totalPages } }`
 * - ressource  : la ressource directement (jamais enveloppée)
 * - erreur     : `{ error: { code, message, details? } }`
 *
 * Trois exceptions à l'enveloppe de collection existent réellement dans le code
 * et sont documentées comme telles : `GET /scriptures`, `GET /schedule` et
 * `GET /social-links` renvoient `{ data: [...] }` **sans `meta`**, car ces
 * listes sont bornées et non paginées (`scripture.controller.ts:20`,
 * `schedule.controller.ts:17`, `social-link.controller.ts:17`).
 */

import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type {
  ResponseConfig,
  RouteConfig,
  ZodRequestBody,
} from "@asteasolutions/zod-to-openapi";
import type { ZodType } from "zod";

import type { ErrorCode } from "@/shared/errors/app-error";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/shared/http/pagination";

/* -------------------------------------------------------------------------- */
/*  Schémas Zod réels des modules — importés, jamais recopiés                 */
/* -------------------------------------------------------------------------- */

import {
  archiveDepartmentSchema,
  createDepartmentSchema,
  saveDepartmentActivitiesSchema,
  updateDepartmentSchema,
} from "@/modules/departments/department.schema";
import {
  createEventSchema,
  updateEventSchema,
} from "@/modules/events/event.schema";
import {
  createPublicationSchema,
  updatePublicationSchema,
} from "@/modules/publications/publication.schema";
import {
  createTeachingBodySchema,
  updateBiblicalReferencesBodySchema,
  updateTeachingBodySchema,
  updateTeachingMediasBodySchema,
} from "@/modules/teachings/teaching.schema";
import {
  createResourceSchema,
  replaceResourceFileSchema,
  updateResourceSchema,
} from "@/modules/resources/resource.schema";
import {
  createLeaderSchema,
  updateLeaderSchema,
} from "@/modules/leaders/leader.schema";
import {
  createTestimonySchema,
  updateTestimonySchema,
} from "@/modules/testimonies/testimony.schema";
import {
  createCommunityFaceSchema,
  updateCommunityFaceSchema,
} from "@/modules/community-faces/community-face.schema";
import {
  scriptureCreateSchema,
  scriptureUpdateSchema,
} from "@/modules/scriptures/scripture.schema";
import {
  scheduleCreateSchema,
  scheduleUpdateSchema,
} from "@/modules/schedule/schedule.schema";
import {
  socialLinkCreateSchema,
  socialLinkUpdateSchema,
} from "@/modules/social-links/social-link.schema";
import {
  ALLOWED_SETTING_KEYS,
  settingsPatchSchema,
} from "@/modules/settings/setting.schema";
import { pageContentUpdateSchema } from "@/modules/static-pages/static-page.schema";
import { MEDIA_FOLDERS } from "@/modules/media/media.schema";
import {
  PRAYER_REQUEST_CONTACT_MAX_LENGTH,
  PRAYER_REQUEST_NAME_MAX_LENGTH,
  PRAYER_REQUEST_TEXT_MAX_LENGTH,
  createPrayerRequestSchema,
  updatePrayerRequestSchema,
} from "@/modules/prayer-requests/prayer-request.schema";

/* -------------------------------------------------------------------------- */
/*  Constantes reprises de l'implémentation                                   */
/* -------------------------------------------------------------------------- */

/**
 * Préfixe commun de toutes les routes métier.
 *
 * Il est figé sur `/api/v1` : c'est la valeur par défaut d'`API_VERSION`
 * (`config/env.ts`) et le préfixe sous lequel les routers sont montés dans
 * `app.ts`. Changer `API_VERSION` demande de régénérer ce document.
 */
const API_BASE_PATH = "/api/v1";

/** Schéma d'authentification : jeton porteur Supabase (`middlewares/auth.ts`). */
const SECURITY_SCHEME_NAME = "bearerAuth";

/**
 * Les 24 codes d'erreur déclarés dans `shared/errors/app-error.ts`.
 *
 * Une union TypeScript n'existe pas à l'exécution : la liste est donc écrite
 * ici, mais les deux vérifications ci-dessous rendent toute dérive impossible
 * **à la compilation** :
 *
 * - `satisfies readonly ErrorCode[]` interdit d'inventer un code ;
 * - `MissingErrorCodes` interdit d'en oublier un.
 */
const ERROR_CODES = [
  // Authentification / autorisation
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "UNAUTHENTICATED_ADMIN",
  // Validation
  "VALIDATION_ERROR",
  // Ressources
  "EVENT_NOT_FOUND",
  "DEPARTMENT_NOT_FOUND",
  "PUBLICATION_NOT_FOUND",
  "PAGE_NOT_FOUND",
  "LEADER_NOT_FOUND",
  "TESTIMONY_NOT_FOUND",
  "COMMUNITY_FACE_NOT_FOUND",
  "SCRIPTURE_NOT_FOUND",
  "SCHEDULE_ENTRY_NOT_FOUND",
  "SOCIAL_LINK_NOT_FOUND",
  "PRAYER_REQUEST_NOT_FOUND",
  "MEDIA_NOT_FOUND",
  "MEDIA_ACCESS_NOT_FOUND",
  "SETTING_NOT_FOUND",
  "NOTIFICATION_NOT_FOUND",
  "PROFILE_NOT_FOUND",
  "RESOURCE_NOT_FOUND",
  // Conflits
  "DUPLICATE_SLUG",
  "DUPLICATE_EMAIL",
  "CONFLICT",
  // Fichiers
  "FILE_TOO_LARGE",
  "INVALID_FILE_TYPE",
  // Limites et divers
  "RATE_LIMITED",
  "NOT_FOUND",
  "INTERNAL_ERROR",
] as const satisfies readonly ErrorCode[];

/** Contrôle de compilation : aucun code source oublié. */
type MissingErrorCodes = Exclude<ErrorCode, (typeof ERROR_CODES)[number]>;
type AssertNever<T extends never> = T;
type ErrorCodeListIsExhaustive = AssertNever<MissingErrorCodes>;

/* -------------------------------------------------------------------------- */
/*  Types utilitaires                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Types d'opération empruntés au **document 3.1** produit par le générateur.
 *
 * `RouteConfig` expose `parameters` et `security` comme une **union** des
 * tableaux des spécifications 3.0, 3.1 et 3.2 d'`openapi3-ts` : un tableau de
 * paramètres 3.1 n'y est pas assignable (une union de tableaux n'est pas un
 * tableau d'unions). Le document produit étant strictement 3.1, les types sont
 * extraits de la sortie réelle du générateur plutôt que de son entrée.
 */
type GeneratedDocument = ReturnType<OpenApiGeneratorV31["generateDocument"]>;
type GeneratedOperation = NonNullable<
  NonNullable<GeneratedDocument["paths"]>[string]["get"]
>;

/** Paramètre d'opération (chemin ou requête). */
type OpenApiParameter = NonNullable<GeneratedOperation["parameters"]>[number];

/** Réponse d'opération : objet concret ou `$ref` vers `components/responses`. */
type OpenApiResponse = RouteConfig["responses"][string];

/** Exigence de sécurité d'une opération. */
type OpenApiSecurity = NonNullable<GeneratedOperation["security"]>;

/** Schéma d'un corps de requête : schéma Zod des modules, ou référence nommée. */
type RequestBodySchema = ZodType | { $ref: string };

/** Corps de requête, tel que le déclarent les routers de ce document. */
interface RequestBodySpec {
  required?: boolean;
  content: Record<string, { schema: RequestBodySchema }>;
}

/**
 * Route telle que ce fichier la déclare.
 *
 * Seuls `parameters` et `requestBody` s'écartent de `RouteConfig` : les
 * paramètres sont décrits dans le type 3.1 ci-dessus, et le corps de requête
 * porte un schéma Zod que le générateur doit convertir en composant référencé.
 * La conversion en `RouteConfig` est faite une seule fois, dans
 * `registerRoute`.
 */
type RouteSpec = Omit<RouteConfig, "parameters" | "requestBody"> & {
  parameters?: OpenApiParameter[];
  requestBody?: RequestBodySpec;
};

/** Route publique : aucun `security` hérité, aucune authentification. */
const NO_SECURITY: OpenApiSecurity = [];

/** Route d'administration : jeton porteur Supabase exigé. */
const BEARER_SECURITY: OpenApiSecurity = [{ [SECURITY_SCHEME_NAME]: [] }];

/**
 * Enregistre une opération.
 *
 * Deux conversions, et elles sont les seules du fichier :
 *
 * 1. `requestBody` → `request.body`. C'est le seul point d'entrée qui fait
 *    convertir un schéma Zod par le générateur ; un `requestBody` transmis tel
 *    quel serait sérialisé brut, schéma Zod compris.
 * 2. `parameters` → le type attendu par `RouteConfig`, décrit ci-dessus.
 */
function registerRoute(registry: OpenAPIRegistry, route: RouteSpec): void {
  const { requestBody, parameters, ...rest } = route;

  registry.registerPath({
    ...rest,
    ...(requestBody === undefined
      ? {}
      : { request: { body: requestBody as unknown as ZodRequestBody } }),
    ...(parameters === undefined
      ? {}
      : {
          parameters:
            parameters as unknown as NonNullable<RouteConfig["parameters"]>,
        }),
  } as unknown as RouteConfig);
}

/* -------------------------------------------------------------------------- */
/*  Fabriques typées (le typage contextuel garantit la conformité OpenAPI)     */
/* -------------------------------------------------------------------------- */

const parameter = (value: OpenApiParameter): OpenApiParameter => value;
const response = (value: ResponseConfig): ResponseConfig => value;

/** Référence vers un schéma de `components/schemas`. */
const schemaRef = (name: string): { $ref: string } => ({
  $ref: `#/components/schemas/${name}`,
});

/** Référence vers une réponse de `components/responses`. */
const responseRef = (name: string): OpenApiResponse => ({
  $ref: `#/components/responses/${name}`,
});

/** Réponse JSON portant un schéma nommé. */
const jsonResponse = (description: string, schemaName: string): ResponseConfig =>
  response({
    description,
    content: { "application/json": { schema: schemaRef(schemaName) } },
  });

/** Réponse d'erreur au format unique `{ error: { code, message, details? } }`. */
const errorResponse = (description: string): ResponseConfig =>
  response({
    description,
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

/** Paramètre de chemin — les bornes reprennent les schémas Zod des modules. */
function pathParameter(
  name: string,
  description: string,
  kind: "uuid" | "idOrSlug" | "scriptureKey" | "pageKey",
): OpenApiParameter {
  if (kind === "uuid") {
    return parameter({
      name,
      in: "path",
      required: true,
      description,
      schema: { type: "string", format: "uuid" },
    });
  }

  if (kind === "scriptureKey") {
    // `scriptureKeySchema` : 1–60 caractères, minuscules/chiffres/tirets.
    return parameter({
      name,
      in: "path",
      required: true,
      description,
      schema: {
        type: "string",
        minLength: 1,
        maxLength: 60,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      },
    });
  }

  if (kind === "pageKey") {
    // `pageParamsSchema` : 1–60 caractères, volontairement permissif (une clé
    // inconnue doit produire un 404 métier, pas un 400 de forme).
    return parameter({
      name,
      in: "path",
      required: true,
      description,
      schema: { type: "string", minLength: 1, maxLength: 60 },
    });
  }

  // `*IdOrSlugSchema` : 1–200 caractères, UUID **ou** slug.
  return parameter({
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "string", minLength: 1, maxLength: 200 },
  });
}

/** Paramètre de requête entier. */
function integerQueryParameter(
  name: string,
  description: string,
  bounds: { minimum?: number; maximum?: number; default?: number } = {},
): OpenApiParameter {
  return parameter({
    name,
    in: "query",
    required: false,
    description,
    schema: {
      type: "integer",
      ...(bounds.minimum === undefined ? {} : { minimum: bounds.minimum }),
      ...(bounds.maximum === undefined ? {} : { maximum: bounds.maximum }),
      ...(bounds.default === undefined ? {} : { default: bounds.default }),
    },
  });
}

/** Paramètre de requête à valeurs fermées. */
function enumQueryParameter(
  name: string,
  description: string,
  values: readonly string[],
  defaultValue?: string,
): OpenApiParameter {
  return parameter({
    name,
    in: "query",
    required: false,
    description,
    schema:
      defaultValue === undefined
        ? { type: "string", enum: [...values] }
        : { type: "string", enum: [...values], default: defaultValue },
  });
}

/** Paramètre de requête UUID. */
function uuidQueryParameter(
  name: string,
  description: string,
): OpenApiParameter {
  return parameter({
    name,
    in: "query",
    required: false,
    description,
    schema: { type: "string", format: "uuid" },
  });
}

/* -------------------------------------------------------------------------- */
/*  Paramètres partagés                                                       */
/* -------------------------------------------------------------------------- */

/** `paginationQuerySchema` — bornes réelles : `page` ≥ 1, `limit` 1–100. */
const PAGE_PARAMETER = integerQueryParameter(
  "page",
  `Numéro de page (commence à 1). Valeur hors bornes ⇒ 400 VALIDATION_ERROR.`,
  { minimum: 1, default: 1 },
);

const LIMIT_PARAMETER = integerQueryParameter(
  "limit",
  `Taille de page (1 à ${MAX_PAGE_SIZE} inclus). Valeur hors bornes ⇒ 400 VALIDATION_ERROR.`,
  { minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
);

const PAGINATION_PARAMETERS: OpenApiParameter[] = [
  PAGE_PARAMETER,
  LIMIT_PARAMETER,
];

/**
 * `createSortSchema` : une colonne de la liste blanche, précédée de `-` pour
 * l'ordre décroissant. Toute autre valeur ⇒ 400 VALIDATION_ERROR.
 */
function sortParameter(
  columns: readonly string[],
  defaultValue: string,
  description: string,
): OpenApiParameter {
  const values = columns.flatMap((column) => [column, `-${column}`]);
  return enumQueryParameter("sort", description, values, defaultValue);
}

/** Réponses d'erreur communes à toute route touchant la base et rate-limitée. */
function publicResponses(
  extra: Record<string, OpenApiResponse> = {},
): Record<string, OpenApiResponse> {
  return {
    400: responseRef("ValidationError"),
    429: responseRef("RateLimited"),
    500: responseRef("InternalError"),
    ...extra,
  };
}

/** Réponses d'erreur communes à toute route d'administration. */
function adminResponses(
  extra: Record<string, OpenApiResponse> = {},
): Record<string, OpenApiResponse> {
  return {
    400: responseRef("ValidationError"),
    401: responseRef("AuthenticationRequired"),
    403: responseRef("Forbidden"),
    429: responseRef("RateLimited"),
    500: responseRef("InternalError"),
    ...extra,
  };
}

/* -------------------------------------------------------------------------- */
/*  Modules CRUD génériques                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Description d'un module exposant la même forme que départements, événements,
 * publications, responsables, témoignages et visages de la communauté :
 * deux lectures publiques, trois écritures administrées.
 */
interface CrudModuleSpec {
  tag: string;
  /** Préfixe de montage, `/api/v1` inclus (ex. `/api/v1/departments`). */
  basePath: string;
  /** Schéma de la ressource (composant `components/schemas`). */
  resourceSchema: string;
  /** Schéma de la collection (composant `components/schemas`). */
  collectionSchema: string;
  parameterName: string;
  parameterDescription: string;
  parameterKind: "uuid" | "idOrSlug";
  listParameters: OpenApiParameter[];
  listSummary: string;
  listDescription: string;
  getSummary: string;
  getDescription: string;
  createSummary: string;
  createDescription: string;
  updateSummary: string;
  updateDescription: string;
  removeSummary: string;
  removeDescription: string;
  /** Code du 404 propre à la ressource (`EVENT_NOT_FOUND`, …). */
  notFoundCode: string;
  notFoundDescription: string;
  createBody: ZodType;
  updateBody: ZodType;
  /**
   * Réponses d'erreur propres au module, ajoutées à celles de la création.
   * Elles remplacent la réponse de même code déjà déclarée (par exemple un 404
   * plus précis, ou un 400 décrivant une règle métier du service).
   */
  extraCreateResponses?: Record<string, OpenApiResponse>;
  /** Idem pour la mise à jour. */
  extraUpdateResponses?: Record<string, OpenApiResponse>;
}

function registerCrudModule(
  registry: OpenAPIRegistry,
  spec: CrudModuleSpec,
): void {
  const childPath = `${spec.basePath}/{${spec.parameterName}}`;
  const childParameter = pathParameter(
    spec.parameterName,
    spec.parameterDescription,
    spec.parameterKind,
  );
  const notFound = errorResponse(
    `${spec.notFoundCode} — ${spec.notFoundDescription}`,
  );

  /*
   * Réponses d'erreur, réparties selon ce que chaque route peut réellement
   * produire :
   *
   * - la **collection** (`GET /`) ne reçoit aucun identifiant : elle ne peut donc
   *   jamais renvoyer le 404 de la ressource, seulement un 400 sur la *query* ;
   * - la **création** (`POST /`) ne reçoit pas d'identifiant non plus : son 404
   *   éventuel vient des règles métier du module (département référencé
   *   inexistant, par exemple) et est déclaré au cas par cas par le module ;
   * - les routes **à identifiant** (`GET /{…}`, `PATCH`, `DELETE`) reçoivent le
   *   404 de la ressource ;
   * - toute route d'administration peut aussi renvoyer 401 et 403, et `validate`
   *   valide les paramètres avant le service : un 400 y reste possible.
   */
  const listResponses = publicResponses();
  const itemResponses = publicResponses({ 404: notFound });
  const createResponses = adminResponses(spec.extraCreateResponses ?? {});
  const updateResponses = adminResponses({
    404: notFound,
    ...(spec.extraUpdateResponses ?? {}),
  });
  const deleteResponses = adminResponses({ 404: notFound });

  registerRoute(registry, {
    method: "get",
    path: spec.basePath,
    operationId: `${spec.tag}List`,
    tags: [spec.tag],
    summary: spec.listSummary,
    description: spec.listDescription,
    security: NO_SECURITY,
    parameters: spec.listParameters,
    responses: {
      200: jsonResponse("Collection paginée.", spec.collectionSchema),
      ...listResponses,
    },
  });

  registerRoute(registry, {
    method: "get",
    path: childPath,
    operationId: `${spec.tag}Get`,
    tags: [spec.tag],
    summary: spec.getSummary,
    description: spec.getDescription,
    security: NO_SECURITY,
    parameters: [childParameter],
    responses: {
      200: jsonResponse("Ressource trouvée.", spec.resourceSchema),
      ...itemResponses,
    },
  });

  registerRoute(registry, {
    method: "post",
    path: spec.basePath,
    operationId: `${spec.tag}Create`,
    tags: [spec.tag],
    summary: spec.createSummary,
    description: spec.createDescription,
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: spec.createBody } },
    },
    responses: {
      201: jsonResponse("Ressource créée.", spec.resourceSchema),
      ...createResponses,
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: childPath,
    operationId: `${spec.tag}Update`,
    tags: [spec.tag],
    summary: spec.updateSummary,
    description: spec.updateDescription,
    security: BEARER_SECURITY,
    parameters: [childParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: spec.updateBody } },
    },
    responses: {
      200: jsonResponse("Ressource mise à jour.", spec.resourceSchema),
      ...updateResponses,
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: childPath,
    operationId: `${spec.tag}Delete`,
    tags: [spec.tag],
    summary: spec.removeSummary,
    description: spec.removeDescription,
    security: BEARER_SECURITY,
    parameters: [childParameter],
    responses: {
      204: { description: "Ressource supprimée : corps vide." },
      ...deleteResponses,
    },
  });
}

export function buildOpenApiDocument(): Record<string, unknown> {
  const registry = new OpenAPIRegistry();

  /* ---------------------------------------------------------------------- */
  /*  Schéma d'authentification                                             */
  /* ---------------------------------------------------------------------- */

  /**
   * Jeton porteur Supabase.
   *
   * Il n'existe **qu'un** schéma de sécurité : les routes publiques déclarent
   * `security: []`, les routes d'administration `security: [{ bearerAuth: [] }]`.
   * Aucun cookie n'est utilisé (`credentials: false` dans `app.ts`).
   */
  registry.registerComponent("securitySchemes", SECURITY_SCHEME_NAME, {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Jeton d'accès Supabase (`Authorization: Bearer <jeton>`), vérifié par " +
      "`presentation/middlewares/auth.ts` (`verifyAccessToken`). Le jeton identifie " +
      "l'utilisateur auprès du fournisseur d'identité ; il ne confère aucun droit à lui " +
      "seul : `requireAdmin` charge ensuite le profil `admin_profiles` et exige qu'il " +
      "existe et qu'il soit actif, puis la **policy de la ressource** décide de l'action " +
      "(rôle, périmètre, égalité départementale, état de la ressource).",
  });

  /* ---------------------------------------------------------------------- */
  /*  Schémas d'erreur et de pagination                                     */
  /* ---------------------------------------------------------------------- */

  registry.registerComponent("schemas", "ValidationIssue", {
    type: "object",
    description:
      "Un champ fautif tel que produit par `middlewares/validate.ts` et par le traducteur d'erreurs.",
    required: ["champ", "message"],
    properties: {
      champ: {
        type: "string",
        description:
          "Chemin du champ fautif, en notation pointée ; `(racine)` pour le corps entier.",
      },
      message: { type: "string", description: "Message de Zod, en français." },
    },
  });

  registry.registerComponent("schemas", "ErrorResponse", {
    type: "object",
    description:
      "Enveloppe d'erreur unique de l'API. Toute erreur, y compris non maîtrisée, " +
      "sort sous cette forme (`shared/http/respond.ts`, " +
      "`presentation/middlewares/error-handler.ts`).",
    required: ["error"],
    properties: {
      error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: {
            type: "string",
            description:
              "Code métier. Liste fermée des 24 codes de `shared/errors/app-error.ts`.",
            enum: [...ERROR_CODES],
          },
          message: {
            type: "string",
            description:
              "Message lisible. En production, un message non exposable est remplacé " +
              "par « Une erreur interne est survenue ».",
          },
          details: {
            description:
              "Précisions exploitables, présent uniquement lorsque l'erreur en porte. " +
              "Tableau `{ champ, message }` pour `VALIDATION_ERROR`, objet libre sinon " +
              "(par exemple `{ slug }`, `{ maxBytes }`, `{ accepted }`, `{ key }`, " +
              "`{ total, usages }`).",
            oneOf: [
              {
                type: "array",
                items: schemaRef("ValidationIssue"),
                description: "Détail d'une erreur de validation Zod.",
              },
              {
                type: "object",
                additionalProperties: true,
                description: "Détail propre au code d'erreur.",
              },
            ],
          },
        },
      },
    },
  });

  registry.registerComponent("schemas", "PaginationMeta", {
    type: "object",
    description:
      "Métadonnées de pagination, présentes sur les seules réponses de collection " +
      "(`buildPaginationMeta`). `totalPages` vaut 0 lorsque la collection est vide.",
    required: ["page", "limit", "total", "totalPages"],
    properties: {
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: MAX_PAGE_SIZE },
      total: {
        type: "integer",
        minimum: 0,
        description: "Nombre total d'éléments, tous filtres appliqués.",
      },
      totalPages: { type: "integer", minimum: 0 },
    },
  });

  registry.registerComponent("schemas", "HealthStatus", {
    type: "object",
    description:
      "État du service. Le contrôle interroge réellement PostgreSQL : un conteneur " +
      "qui répond « ok » alors que la base est injoignable serait un faux positif.",
    required: ["status", "version", "environment", "database"],
    properties: {
      status: { type: "string", enum: ["ok", "error"] },
      version: {
        type: "string",
        description: "Valeur de `API_VERSION` (préfixe des routes).",
      },
      environment: {
        type: "string",
        enum: ["development", "test", "production"],
      },
      database: { type: "string", enum: ["up", "down"] },
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Ressources : transcription exacte des *.serializer.ts                 */
  /* ---------------------------------------------------------------------- */

  registry.registerComponent("schemas", "Department", {
    type: "object",
    description:
      "Département (`department.serializer.ts`). Les champs facultatifs sont **omis** " +
      "lorsqu'ils sont nuls, jamais émis à `null`.",
    required: ["id", "name", "slug"],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      slug: { type: "string" },
      description: { type: "string" },
      responsibleName: { type: "string" },
      bannerImage: {
        type: "string",
        description: "URL publique résolue du média de bandeau.",
      },
      meetingSchedule: { type: "string" },
      keyPoints: { type: "array", items: { type: "string" } },
      gallery: {
        type: "array",
        items: { type: "string" },
        description: "URLs publiques ; omis lorsque la galerie est vide.",
      },
      tagline: { type: "string" },
    },
  });

  registry.registerComponent("schemas", "DepartmentCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Department") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "DepartmentArchive", {
    type: "object",
    description:
      "Archive d'un département supprimé (`departmentArchives`). `snapshot` est " +
      "l'instantané complet de la fiche au moment de la suppression, transmis tel quel.",
    required: [
      "id",
      "originalDepartmentId",
      "name",
      "slug",
      "snapshot",
      "archivedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      originalDepartmentId: {
        type: "string",
        format: "uuid",
        description: "`id` du département supprimé ; il n'existe plus dans `departments`.",
      },
      name: { type: "string" },
      slug: { type: "string" },
      snapshot: {
        type: "object",
        additionalProperties: true,
        description:
          "Fiche complète au moment de la suppression : champs, activités, " +
          "responsables et références de médias.",
      },
      archivedBy: {
        type: ["string", "null"],
        format: "uuid",
        description: "Auteur de la suppression, `null` si l'information n'était pas fournie.",
      },
      archivedAt: { type: "string", format: "date-time" },
      reason: { type: ["string", "null"] },
    },
  });

  registry.registerComponent("schemas", "DepartmentArchiveCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("DepartmentArchive") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "DepartmentActivity", {
    type: "object",
    description:
      "Activité d'un département (`department.serializer.ts` → `activities`). " +
      "Les champs facultatifs sont **omis** lorsqu'ils sont nuls.",
    required: ["id", "title", "position"],
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      description: { type: "string" },
      imageMediaId: { type: "string", format: "uuid" },
      imageUrl: {
        type: "string",
        description: "URL publique résolue du média de l'activité.",
      },
      position: { type: "integer", minimum: 0 },
    },
  });

  registry.registerComponent("schemas", "DepartmentActivityCollection", {
    type: "object",
    description:
      "Réponse de `PUT /departments/{idOrSlug}/activities` : la collection **relue " +
      "depuis la base**, jamais l'écho du corps envoyé.",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("DepartmentActivity") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "Event", {
    type: "object",
    description:
      "Événement (`event.serializer.ts`). `eventDate` est une chaîne `AAAA-MM-JJ` et " +
      "`eventTime` une chaîne `HH:MM` : jamais d'objet `Date`, pour éviter tout " +
      "décalage de fuseau entre le serveur et Lubumbashi. `status` est **calculé** " +
      "depuis `eventDate`, jamais stocké.",
    required: ["id", "title", "slug", "eventDate", "departmentId", "status"],
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      slug: { type: "string" },
      description: { type: "string" },
      eventDate: { type: "string", format: "date" },
      eventTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" },
      location: { type: "string" },
      imageUrl: { type: "string" },
      departmentId: {
        type: ["string", "null"],
        format: "uuid",
        description:
          "`null` = événement général de l'église. Toujours présent, y compris à `null`.",
      },
      status: {
        type: "string",
        enum: ["UPCOMING", "ARCHIVED"],
        description: "`UPCOMING` si `eventDate` ≥ aujourd'hui, sinon `ARCHIVED`.",
      },
      excerpt: { type: "string" },
      bannerImage: { type: "string" },
      gallery: { type: "array", items: { type: "string" } },
      practicalInfo: { type: "array", items: { type: "string" } },
    },
  });

  registry.registerComponent("schemas", "EventCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Event") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "Publication", {
    type: "object",
    description:
      "Publication (`publication.serializer.ts`) : médiathèque, actualités, " +
      "enseignements et ressources partagent une seule collection filtrée par `category`.",
    required: ["id", "title", "slug", "type", "publishedAt", "status", "category"],
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      slug: { type: "string" },
      type: { type: "string", enum: ["VIDEO", "PHOTO", "TEXTE"] },
      contentUrl: {
        type: "string",
        description: "Lien vidéo externe (YouTube/Facebook) ou chemin d'image.",
      },
      description: { type: "string" },
      publishedAt: { type: "string", format: "date" },
      category: {
        type: "string",
        enum: ["ACTUALITE", "ENSEIGNEMENT", "MEDIA", "RESSOURCE"],
      },
      author: { type: "string" },
      body: {
        type: "array",
        items: { type: "string" },
        description: "Corps éditorial des publications TEXTE (paragraphes).",
      },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED"] },
      coverImage: { type: "string", description: "URL résolue du média de couverture." },
    },
  });

  registry.registerComponent("schemas", "PublicationCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Publication") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Enseignements — `teaching.serializer.ts`                               */
  /* ---------------------------------------------------------------------- */

  registry.registerComponent("schemas", "BiblicalReference", {
    type: "object",
    description:
      "Référence biblique d'un enseignement (`teaching.serializer.ts`). `endChapter` et " +
      "`endVerse` valent `null` pour un verset isolé. `formatted` est calculé par le " +
      "serveur : le client n'a pas à recomposer « Jean 3:16 » lui-même.",
    required: [
      "id",
      "book",
      "startChapter",
      "startVerse",
      "endChapter",
      "endVerse",
      "position",
      "formatted",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      book: { type: "string" },
      startChapter: { type: "integer", minimum: 1 },
      startVerse: { type: "integer", minimum: 1 },
      endChapter: { type: ["integer", "null"], minimum: 1 },
      endVerse: { type: ["integer", "null"], minimum: 1 },
      position: { type: "integer" },
      formatted: {
        type: "string",
        description: "Ex. `Jean 3:16`, `Psaume 23:1–6`, `Romains 8:1–11:36`.",
      },
    },
  });

  registry.registerComponent("schemas", "TeachingMedia", {
    type: "object",
    description:
      "Média attaché à un enseignement (`teaching.serializer.ts`). `role` décide de " +
      "l'usage : `VIDEO` (le message), `AUDIO` (la version podcast), `THUMBNAIL` " +
      "(l'illustration). Un média `isPrimary` est celui que la page publique met en avant.",
    required: ["id", "mediaId", "role", "isPrimary", "position"],
    properties: {
      id: { type: "string", format: "uuid", description: "Lien `teaching_media`, pas le média." },
      mediaId: { type: "string", format: "uuid" },
      role: { type: "string", enum: ["VIDEO", "AUDIO", "THUMBNAIL"] },
      isPrimary: { type: "boolean" },
      position: { type: "integer" },
      url: { type: "string", description: "URL publique résolue du média." },
      mimeType: { type: "string" },
      sizeBytes: { type: "integer", minimum: 0 },
      alt: { type: ["string", "null"] },
    },
  });

  registry.registerComponent("schemas", "Teaching", {
    type: "object",
    description:
      "Enseignement / sermon (`teaching.serializer.ts`). `slug` peut être `null` " +
      "(l'adresse publique n'est alors pas disponible). `status` est **stocké**, " +
      "contrairement au statut calculé des événements.",
    required: [
      "id",
      "title",
      "slug",
      "speakerName",
      "preachedAt",
      "summary",
      "description",
      "status",
      "publishedAt",
      "createdAt",
      "updatedAt",
      "biblicalReferences",
      "medias",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      slug: { type: ["string", "null"] },
      speakerName: { type: "string" },
      preachedAt: {
        type: "string",
        format: "date",
        description: "Date de prédication `AAAA-MM-JJ` — jamais un objet `Date`.",
      },
      summary: { type: ["string", "null"] },
      description: { type: ["string", "null"] },
      status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      publishedAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "`null` tant que l'enseignement n'a jamais été publié.",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      biblicalReferences: {
        type: "array",
        items: schemaRef("BiblicalReference"),
      },
      medias: { type: "array", items: schemaRef("TeachingMedia") },
      // Omis (et non `null`) lorsqu'aucun média n'est marqué principal.
      primaryMedia: schemaRef("TeachingMedia"),
    },
  });

  registry.registerComponent("schemas", "TeachingCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Teaching") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "BiblicalReferenceCollection", {
    type: "array",
    description:
      "Réponse de `PUT /enseignements/{id}/references-bibliques` : la liste **relue " +
      "depuis la base**, pas l'écho du corps envoyé.",
    items: schemaRef("BiblicalReference"),
  });

  registry.registerComponent("schemas", "TeachingMediaCollection", {
    type: "array",
    description:
      "Réponse de `PUT /enseignements/{id}/medias` : la liste **relue depuis la base**.",
    items: schemaRef("TeachingMedia"),
  });

  /* ---------------------------------------------------------------------- */
  /*  Ressources — `domain/entities` (aucun sérialiseur dédié)               */
  /* ---------------------------------------------------------------------- */

  registry.registerComponent("schemas", "Resource", {
    type: "object",
    description:
      "Document téléchargeable de l'espace Ressources. L'entité du domaine est renvoyée " +
      "**sans sérialiseur dédié** : les dates sortent donc au format ISO-8601 via la " +
      "sérialisation JSON, et `file` est l'URL publique du PDF déjà téléversé dans le " +
      "dossier `resources` du Storage.",
    required: ["id", "name", "slug", "description", "file", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      slug: { type: "string" },
      description: { type: ["string", "null"] },
      file: {
        type: "string",
        description:
          "URL du PDF. Le service refuse (`VALIDATION_ERROR`) une valeur qui ne désigne " +
          "pas un `.pdf` — une ressource sans document n'a pas de sens.",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "ResourceCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Resource") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "Leader", {
    type: "object",
    description:
      "Responsable (`leader.serializer.ts`). Tous les champs sont toujours présents : " +
      "`scope`, `bio`, `photo` et `departmentId` valent `null` lorsqu'ils sont vides.",
    required: [
      "id",
      "name",
      "role",
      "scope",
      "bio",
      "photo",
      "departmentId",
      "position",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      role: { type: "string" },
      scope: { type: ["string", "null"] },
      bio: { type: ["string", "null"] },
      photo: { type: ["string", "null"], description: "URL publique du portrait." },
      departmentId: { type: ["string", "null"], format: "uuid" },
      position: { type: "integer", minimum: 0 },
    },
  });

  registry.registerComponent("schemas", "LeaderCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Leader") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "Testimony", {
    type: "object",
    description:
      "Témoignage (`testimony.serializer.ts`) : `name` ← `personName`, " +
      "`role` ← `personRole`, `photo` ← `photoUrl`.",
    required: ["id", "photo", "quote", "name", "role", "position"],
    properties: {
      id: { type: "string", format: "uuid" },
      photo: { type: ["string", "null"] },
      quote: { type: "string" },
      name: { type: "string" },
      role: { type: ["string", "null"] },
      position: { type: "integer", minimum: 0 },
    },
  });

  registry.registerComponent("schemas", "TestimonyCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Testimony") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "CommunityFace", {
    type: "object",
    description:
      "Visage de la communauté (`community-face.serializer.ts`) : `name` ← `personName`.",
    required: ["id", "photo", "name", "caption", "position"],
    properties: {
      id: { type: "string", format: "uuid" },
      photo: { type: ["string", "null"] },
      name: { type: "string" },
      caption: { type: "string" },
      position: { type: "integer", minimum: 0 },
    },
  });

  registry.registerComponent("schemas", "CommunityFaceCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("CommunityFace") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "Scripture", {
    type: "object",
    description: "Verset (`scripture.serializer.ts`). Horodatages en ISO 8601 complet.",
    required: [
      "id",
      "key",
      "text",
      "reference",
      "translation",
      "context",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      key: {
        type: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        maxLength: 60,
      },
      text: { type: "string" },
      reference: { type: "string" },
      translation: { type: "string" },
      context: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "ScriptureList", {
    type: "object",
    description:
      "Liste **non paginée** : le controller renvoie `{ data }` sans `meta` " +
      "(`scripture.controller.ts:20`).",
    required: ["data"],
    properties: {
      data: { type: "array", items: schemaRef("Scripture") },
    },
  });

  registry.registerComponent("schemas", "ScheduleEntry", {
    type: "object",
    description:
      "Entrée du rythme hebdomadaire (`schedule.serializer.ts`). `timeLabel` est un " +
      "libellé libre (« 16h30 – 18h30 », « Dans la nuit »), pas une heure.",
    required: [
      "id",
      "day",
      "title",
      "timeLabel",
      "audience",
      "isConfirmed",
      "position",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      day: { type: "string" },
      title: { type: "string" },
      timeLabel: { type: "string" },
      audience: { type: ["string", "null"] },
      isConfirmed: {
        type: "boolean",
        description: "`false` = horaire encore provisoire.",
      },
      position: { type: "integer", minimum: 0 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "ScheduleEntryList", {
    type: "object",
    description:
      "Liste **non paginée** : `{ data }` sans `meta` (`schedule.controller.ts:17`).",
    required: ["data"],
    properties: {
      data: { type: "array", items: schemaRef("ScheduleEntry") },
    },
  });

  registry.registerComponent("schemas", "SocialLink", {
    type: "object",
    description: "Lien social (`social-link.serializer.ts`), ordonné par `position`.",
    required: ["id", "label", "href", "position", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      label: { type: "string" },
      href: { type: "string", format: "uri" },
      position: { type: "integer", minimum: 0 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "SocialLinkList", {
    type: "object",
    description:
      "Liste **non paginée** : `{ data }` sans `meta` (`social-link.controller.ts:17`).",
    required: ["data"],
    properties: {
      data: { type: "array", items: schemaRef("SocialLink") },
    },
  });

  registry.registerComponent("schemas", "Settings", {
    type: "object",
    description:
      "Réglages institutionnels (`setting.serializer.ts`) : regroupement de deux " +
      "sources, les scalaires de `site_settings` et la liste ordonnée des liens sociaux.",
    required: ["settings", "socialLinks"],
    properties: {
      settings: {
        type: "object",
        description:
          "Objet clé/valeur. Clés écrivables : " +
          ALLOWED_SETTING_KEYS.map((key) => `\`${key}\``).join(", ") +
          ". Cette liste est fermée : toute autre clé est refusée en `VALIDATION_ERROR`.",
        additionalProperties: { type: "string" },
      },
      socialLinks: {
        type: "array",
        items: {
          type: "object",
          required: ["label", "href"],
          properties: {
            label: { type: "string" },
            href: { type: "string", format: "uri" },
          },
        },
      },
    },
  });

  registry.registerComponent("schemas", "StaticPage", {
    type: "object",
    description:
      "Page éditable (`static-page.serializer.ts`). `content` est un objet de champs " +
      "textuels nommés — jamais du HTML : le schéma du contenu dépend de `pageKey` " +
      "(`domain/content/page-content.ts`) et est validé par le service.",
    required: [
      "id",
      "pageKey",
      "content",
      "updatedBy",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      pageKey: { type: "string" },
      content: { type: "object", additionalProperties: true },
      updatedBy: {
        type: ["string", "null"],
        format: "uuid",
        description:
          "Administrateur de la dernière modification (traçabilité, jamais affiché).",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "Media", {
    type: "object",
    description:
      "Média (`media.serializer.ts`). `mimeType` est déduit des **octets** du fichier, " +
      "jamais du `Content-Type` ni du nom de fichier envoyés par le client.",
    required: [
      "id",
      "url",
      "bucket",
      "path",
      "folder",
      "mimeType",
      "sizeBytes",
      "width",
      "height",
      "alt",
      "uploadedBy",
      "createdAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      url: { type: "string", description: "URL publique du fichier." },
      bucket: { type: "string" },
      path: { type: "string", description: "Chemin interne, généré par le serveur." },
      folder: {
        type: ["string", "null"],
        enum: [...MEDIA_FOLDERS, null],
        description: "Premier segment du chemin, ou `null`.",
      },
      mimeType: {
        type: "string",
        description: "Types acceptés : image/jpeg, image/png, image/webp, image/gif.",
      },
      sizeBytes: { type: "integer", minimum: 0 },
      width: { type: ["integer", "null"], minimum: 0 },
      height: { type: ["integer", "null"], minimum: 0 },
      alt: {
        type: ["string", "null"],
        description: "Texte alternatif, requis pour l'accessibilité (WCAG 2.2 AA).",
      },
      uploadedBy: { type: ["string", "null"], format: "uuid" },
      createdAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "MediaCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Media") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "MediaUsageReport", {
    type: "object",
    description:
      "Où un média est utilisé (`media.serializer.ts`). `usages` ne contient que les " +
      "emplacements qui le référencent réellement.",
    required: ["media", "total", "usages"],
    properties: {
      media: schemaRef("Media"),
      total: { type: "integer", minimum: 0 },
      usages: {
        type: "array",
        items: {
          type: "object",
          required: ["source", "label", "count"],
          properties: {
            source: { type: "string", description: "Identifiant technique de l'usage." },
            label: { type: "string", description: "Libellé lisible de l'usage." },
            count: { type: "integer", minimum: 1 },
          },
        },
      },
    },
  });

  registry.registerComponent("schemas", "PrayerRequest", {
    type: "object",
    description:
      "Vue **administrative** d'une demande de prière (`prayer-request.serializer.ts`). " +
      "Seule forme à porter le texte de l'intention et les coordonnées ; elle n'est " +
      "produite que par des routes montées derrière l'authentification administrative " +
      "**et** admises par `PrayerPolicy`, qui refuse ce domaine au `SUPER_ADMIN` (D-10).",
    required: [
      "id",
      "requestText",
      "requesterName",
      "requesterContact",
      "confidentiality",
      "status",
      "handledAt",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      requestText: { type: "string", maxLength: PRAYER_REQUEST_TEXT_MAX_LENGTH },
      requesterName: {
        type: ["string", "null"],
        maxLength: PRAYER_REQUEST_NAME_MAX_LENGTH,
      },
      requesterContact: {
        type: ["string", "null"],
        maxLength: PRAYER_REQUEST_CONTACT_MAX_LENGTH,
      },
      confidentiality: { type: "string", enum: ["private", "community"] },
      status: { type: "string", enum: ["NEW", "PRAYED"] },
      handledAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "PrayerRequestCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("PrayerRequest") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registry.registerComponent("schemas", "PrayerRequestCreated", {
    type: "object",
    description:
      "Accusé de réception minimal renvoyé au visiteur qui vient de déposer sa demande. " +
      "Il ne contient **ni le texte, ni le prénom, ni le contact** : ces données " +
      "personnelles ne sont jamais renvoyées au client.",
    required: ["id", "createdAt", "status"],
    properties: {
      id: { type: "string", format: "uuid" },
      createdAt: { type: "string", format: "date-time" },
      status: { type: "string", enum: ["NEW", "PRAYED"] },
    },
  });

  registry.registerComponent("schemas", "AdminProfile", {
    type: "object",
    description:
      "Profil administratif courant (`admin.serializer.ts`). Aucune information " +
      "d'authentification : ni jeton, ni secret, ni adresse d'authentification.",
    required: ["id", "username", "displayName", "role"],
    properties: {
      id: { type: "string", format: "uuid" },
      username: { type: "string" },
      displayName: { type: ["string", "null"] },
      /*
       * Les trois rôles techniques de D-01 — et non plus `ROLE_ADMIN`.
       *
       * Le contrat annonçait une valeur que la base refuse désormais d'écrire :
       * l'énumération PostgreSQL `admin_role` ne connaît que ces trois rôles
       * (Lot 1a, `docs/032` §3.2). Un client qui se fiait à l'ancienne valeur
       * comparaît un rôle qu'aucun profil ne porte.
       *
       * Il n'existe **aucun rôle de département** : un responsable d'un
       * département et un responsable d'un autre sont deux instances de
       * `DEPARTMENT_MANAGER`, différenciées par leur `departmentId` (D-02). Le
       * périmètre et le rattachement ne figurent pas encore dans ce schéma : ils
       * relèvent du Lot 10, qui alignera le contrat sur le DTO réellement
       * sérialisé.
       */
      role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] },
    },
  });

  registry.registerComponent("schemas", "AdminProfileSummary", {
    type: "object",
    description:
      "Entrée de l'annuaire administratif : le profil courant complété de l'état " +
      "d'activation, de la date de création et de l'adresse de connexion.",
    required: [
      "id",
      "username",
      "displayName",
      "role",
      "isActive",
      "createdAt",
      "email",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      username: { type: "string" },
      displayName: { type: ["string", "null"] },
      role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      /*
       * Adresse de connexion, lue chez le fournisseur d'identité — elle
       * n'existe pas dans `admin_profiles`. `null` quand elle n'a pas pu être
       * résolue : l'annuaire reste consultable, la colonne est simplement vide.
       *
       * Ce champ n'existe que sur la **collection administrative**, dont l'accès
       * est décidé par `UserPolicy.READ` (SUPER_ADMIN) : `GET /admin/me` garde
       * son contrat, sans adresse.
       */
      email: { type: ["string", "null"], format: "email" },
    },
  });

  registry.registerComponent("schemas", "AdminProfileCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("AdminProfileSummary") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Corps de requête : les schémas Zod des modules, pris tels quels        */
  /* ---------------------------------------------------------------------- */

  /*
   * Zod est la source de vérité : aucun corps JSON n'est réécrit à la main.
   * Les schémas importés ci-dessus sont passés directement au générateur, qui
   * les convertit et les inscrit dans le document. Les alias ci-dessous ne
   * donnent à chaque corps que le nom sous lequel il apparaît dans l'API.
   */
  const CreateDepartmentBody = createDepartmentSchema;
  const UpdateDepartmentBody = updateDepartmentSchema;
  const CreateEventBody = createEventSchema;
  const UpdateEventBody = updateEventSchema;
  const CreatePublicationBody = createPublicationSchema;
  const UpdatePublicationBody = updatePublicationSchema;
  const CreateLeaderBody = createLeaderSchema;
  const UpdateLeaderBody = updateLeaderSchema;
  const CreateTestimonyBody = createTestimonySchema;
  const UpdateTestimonyBody = updateTestimonySchema;
  const CreateCommunityFaceBody = createCommunityFaceSchema;
  const UpdateCommunityFaceBody = updateCommunityFaceSchema;
  const CreateScriptureBody = scriptureCreateSchema;
  const UpdateScriptureBody = scriptureUpdateSchema;
  const CreateScheduleEntryBody = scheduleCreateSchema;
  const UpdateScheduleEntryBody = scheduleUpdateSchema;
  const CreateSocialLinkBody = socialLinkCreateSchema;
  const UpdateSocialLinkBody = socialLinkUpdateSchema;
  const SettingsPatchBody = settingsPatchSchema;
  const PageContentUpdateBody = pageContentUpdateSchema;
  const CreatePrayerRequestBody = createPrayerRequestSchema;
  const UpdatePrayerRequestBody = updatePrayerRequestSchema;

  /**
   * Corps du téléversement (`multipart/form-data`).
   *
   * Il est écrit ici parce qu'il n'est **pas** entièrement exprimable en Zod :
   * `uploadMediaBodySchema` décrit les champs texte (`folder`, `alt`), tandis
   * que `file` est traité par multer puis examiné par `StorageService`, qui
   * déduit son type des octets. Le champ `file` est donc décrit dans la
   * convention OpenAPI (`type: string`, `format: binary`), et l'énumération de
   * `folder` reprend la constante `MEDIA_FOLDERS` du module — liste fermée, donc
   * sans risque de dérive —, `alt` reprenant la borne de `uploadMediaBodySchema`.
   */
  registry.registerComponent("schemas", "UploadMediaRequest", {
    type: "object",
    description:
      "Formulaire de téléversement : un fichier unique sous le nom de champ `file`, " +
      "un dossier de destination `folder`, et un texte alternatif facultatif `alt`.",
    required: ["file", "folder"],
    properties: {
      file: {
        type: "string",
        format: "binary",
        description:
          "Fichier binaire, un seul. Limite `MAX_UPLOAD_BYTES` (5 Mio par défaut) ; " +
          "le type réel est déduit des octets, jamais du `Content-Type` ni du nom.",
      },
      folder: {
        type: "string",
        enum: [...MEDIA_FOLDERS],
        description:
          "Dossier de destination dans le bucket. Liste fermée : un dossier hors de " +
          "cette liste produit un 400, il ne vient jamais d'une chaîne libre.",
      },
      alt: {
        type: "string",
        maxLength: 300,
        description: "Texte alternatif (accessibilité WCAG 2.2 AA), facultatif.",
      },
    },
  });

  const UploadMediaRequest = schemaRef("UploadMediaRequest");

  /* ---------------------------------------------------------------------- */
  /*  Réponses réutilisables                                                */
  /* ---------------------------------------------------------------------- */

  registry.registerComponent("responses", "ValidationError", {
    description:
      "`VALIDATION_ERROR` — données invalides. Le `details` est un tableau " +
      "`{ champ, message }` produit par le middleware `validate` (ou par Zod en " +
      "dernier recours). Un paramètre de chemin ou de requête hors bornes, un corps " +
      "non conforme au schéma ou une clé inconnue produisent cette réponse.\n\n" +
      "**Paramètres de requête.** Les schémas de *query* sont des objets **stricts** : " +
      "tout paramètre non reconnu est refusé ici, et jamais ignoré en silence. " +
      "`GET /departments?nimportequoi=1` produit donc un 400 dont `details` nomme " +
      "`nimportequoi`, et `?sort=…` est refusé sur les collections qui n'offrent pas de " +
      "tri (seuls `events` et `publications` en exposent un, à liste blanche).\n\n" +
      "La convention ne souffre **aucune** exception : les listes bornées non paginées " +
      "(`GET /scriptures`, `GET /schedule`, `GET /social-links`) ne reconnaissent aucun " +
      "paramètre, et les deux routes hors collection `GET /settings` et " +
      "`GET /pages/{pageKey}` valident elles aussi une *query* vide, par " +
      "`emptyQuerySchema` — `?nimportequoi=1` y produit donc un 400.\n\n" +
      "Deux précisions vérifiées à l'exécution :\n" +
      "- un corps **vide** `{}` n'est refusé que là où le schéma l'impose par un " +
      "`refine` (« Aucun champ à mettre à jour » : responsables, témoignages, visages, " +
      "versets, rythme, liens sociaux) ; les mises à jour de départements, d'événements " +
      "et de publications n'ont pas cette contrainte et acceptent `{}` ;\n" +
      "- un corps JSON **mal formé** ne produit pas cette réponse : `express.json()` " +
      "échoue avant `validate`, ce qui donne un `500 INTERNAL_ERROR` (voir " +
      "`InternalError`).",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "AuthenticationRequired", {
    description:
      "`AUTH_REQUIRED` — en-tête `Authorization: Bearer <jeton>` absent, mal formé ou " +
      "jeton Supabase invalide/expiré.",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "Forbidden", {
    description:
      "`FORBIDDEN` — jeton valide mais compte non administrable : utilisateur absent de " +
      "`admin_profiles`, compte désactivé (`isActive = false`), ou rôle insuffisant. " +
      "Le code `UNAUTHENTICATED_ADMIN` est déclaré pour ce cas dans " +
      "`shared/errors/app-error.ts` mais n'est pas émis par l'implémentation V1, qui " +
      "répond toujours `FORBIDDEN`.",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "RateLimited", {
    description:
      "`RATE_LIMITED` — limite globale dépassée : 120 requêtes par minute et par IP " +
      "(`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, valeurs par défaut de `config/env.ts`), " +
      "appliquée à toutes les routes sous `/api/v1` sauf `/api/v1/health`. " +
      "Deux en-têtes au format draft-8 sont émis (`standardHeaders: \"draft-8\"`), sans " +
      "`X-RateLimit-*` (`legacyHeaders: false`).",
    headers: {
      RateLimit: {
        description:
          "Politique, quota restant et secondes avant réinitialisation. Forme relevée " +
          "sur l'API : `\"120-in-1min\"; r=111; t=59`.",
        schema: { type: "string" },
      },
      "RateLimit-Policy": {
        description:
          "Politique appliquée. Forme relevée sur l'API : " +
          "`\"120-in-1min\"; q=120; w=60; pk=:…:`. Sur `POST /prayer-requests`, le " +
          "limiteur dédié de la route écrase cet en-tête avec sa propre politique.",
        schema: { type: "string" },
      },
    },
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "RateLimitedPublicWrite", {
    description:
      "`RATE_LIMITED` — limite dédiée à l'écriture publique dépassée : " +
      "**5 dépôts par heure et par IP** (`prayer-request.routes.ts`). Le message invite à " +
      "réessayer dans une heure ou à écrire directement à l'équipe. La limite globale " +
      "(120/minute) s'applique en amont et peut produire la même réponse.\n\n" +
      "Précision vérifiée à l'exécution : le compteur décompte **toutes** les requêtes " +
      "de cette route, y compris celles refusées en `400 VALIDATION_ERROR` — les " +
      "en-têtes ci-dessous sont donc présents bien avant le 429. Ils accompagnent " +
      "l'en-tête `RateLimit` du limiteur global.",
    headers: {
      "RateLimit-Limit": { schema: { type: "integer" }, description: "Quota : 5." },
      "RateLimit-Remaining": {
        schema: { type: "integer" },
        description: "Dépôts restants dans la fenêtre (relevé : `2` après trois appels).",
      },
      "RateLimit-Reset": {
        schema: { type: "integer" },
        description: "Secondes avant réinitialisation de la fenêtre (relevé : `3587`).",
      },
      "RateLimit-Policy": {
        schema: { type: "string" },
        description: "Politique du limiteur de la route (relevé : `5;w=3600`).",
      },
    },
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "Conflict", {
    description:
      "`CONFLICT` — conflit métier. `details` précise la cause (par exemple " +
      "`{ total, usages }` pour un média encore référencé, `{ key }` pour une clé de " +
      "verset déjà prise).",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "FileTooLarge", {
    description:
      "`FILE_TOO_LARGE` — le fichier dépasse la limite de téléversement. " +
      "`details: { maxBytes }`. La taille est contrôlée deux fois : par multer " +
      "(`LIMIT_FILE_SIZE`, traduit en 413) puis par `StorageService`, qui ne fait " +
      "confiance à aucune métadonnée de la requête.",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "InvalidFileType", {
    description:
      "`INVALID_FILE_TYPE` — le type **réel** du fichier, déduit de ses octets, n'est " +
      "pas accepté **pour le dossier visé** : les dossiers d'images (`events`, " +
      "`departments`, `publications`, `leaders`, `testimonies`, `community`, `pages`) " +
      "n'acceptent que JPEG, PNG, WEBP et AVIF ; seul `resources` accepte un PDF. Un " +
      "fichier vide produit la même réponse. `details: { accepted }` contient la liste " +
      "du dossier demandé.",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  registry.registerComponent("responses", "InternalError", {
    description:
      "`INTERNAL_ERROR` — erreur inattendue : ni `AppError`, ni `ZodError`. En " +
      "production, le message technique reste dans les journaux serveur (corrélés par " +
      "`requestId`) et le client ne reçoit qu'un message générique ; hors production, " +
      "le message d'origine est renvoyé.\n\n" +
      "Cas **vérifié à l'exécution** : un corps JSON mal formé (par exemple " +
      "`{\"name\": }`) produit cette réponse — et non un `400 VALIDATION_ERROR` — car " +
      "`express.json()` échoue avant le middleware `validate`. Exemple relevé : " +
      "`Unexpected token '}', \"{\\\"name\\\": }\" is not valid JSON` hors production.",
    content: { "application/json": { schema: schemaRef("ErrorResponse") } },
  });

  /* ---------------------------------------------------------------------- */
  /*  Système                                                               */
  /* ---------------------------------------------------------------------- */

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/health`,
    operationId: "getHealth",
    tags: ["Système"],
    summary: "Contrôle de santé",
    description:
      "Interroge réellement PostgreSQL (`select 1`). Cette route est montée **avant** le " +
      "rate limiter global et n'est donc jamais limitée : Railway l'interroge souvent. " +
      "Elle ne fait pas partie des routers métier et ne suit pas l'enveloppe " +
      "`{ data, meta }`.",
    security: NO_SECURITY,
    responses: {
      200: {
        description: "Service et base disponibles.",
        content: { "application/json": { schema: schemaRef("HealthStatus") } },
      },
      503: {
        description:
          "`database: \"down\"` — la base est injoignable. Aucune erreur applicative " +
          "`{ error }` n'est produite : la réponse garde la forme du contrôle de santé.",
        content: { "application/json": { schema: schemaRef("HealthStatus") } },
      },
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Départements                                                          */
  /* ---------------------------------------------------------------------- */

  registerCrudModule(registry, {
    tag: "departments",
    basePath: `${API_BASE_PATH}/departments`,
    resourceSchema: "Department",
    collectionSchema: "DepartmentCollection",
    parameterName: "idOrSlug",
    parameterKind: "idOrSlug",
    parameterDescription:
      "Identifiant UUID **ou** slug du département. C'est ce qui permet au frontend de " +
      "conserver ses URL actuelles (`/departements/chorale`) sans requête supplémentaire.",
    listParameters: PAGINATION_PARAMETERS,
    listSummary: "Lister les départements",
    listDescription:
      "Collection paginée, ordonnée par `position` côté serveur. Aucun filtre métier " +
      "en V1 : seuls `page` et `limit` sont acceptés. Aucun tri n'est exposé, donc " +
      "`?sort=…` est refusé en `400 VALIDATION_ERROR` — comme tout autre paramètre non " +
      "reconnu.",
    getSummary: "Lire un département",
    getDescription:
      "Accepte un UUID ou un slug. Un identifiant inconnu produit `DEPARTMENT_NOT_FOUND`.",
    createSummary: "Créer un département",
    createDescription:
      "Administration (`ADMIN` ou `SUPER_ADMIN`, jamais un responsable — D-03, D-04). " +
      "Le slug est dérivé du nom et suffixé jusqu'à être libre ; un slug explicite déjà " +
      "pris est lui aussi **suffixé** (`-2`, `-3`…) au lieu d'être refusé : l'identité " +
      "du département est son `id` UUID, le slug n'est qu'une adresse lisible.",
    updateSummary: "Mettre à jour un département",
    updateDescription:
      "Administration. Mise à jour partielle : `slug` en est volontairement absent, une " +
      "URL publique ne doit pas changer. Le schéma est `.partial()` **sans** contrainte " +
      "de non-vacuité : un corps vide `{}` est accepté par la validation.",
    removeSummary: "Supprimer un département",
    removeDescription:
      "Administration : `SUPER_ADMIN` ou `ADMIN` en scope `GLOBAL` (cellule 2.6, " +
      "**arbitrage du 23/10/2026**). La suppression est toujours **précédée d'un " +
      "archivage** : l'instantané complet de la fiche est écrit dans " +
      "`department_archives` dans la même transaction (D-08), puis l'entité active, " +
      "ses activités et sa galerie sont supprimées. Les événements rattachés ne sont " +
      "pas supprimés : la clé étrangère `events.department_id` est " +
      "`onDelete: set null`, ils redeviennent généraux.",
    notFoundCode: "DEPARTMENT_NOT_FOUND",
    notFoundDescription:
      "aucun département ne correspond à l'identifiant ou au slug fourni. " +
      "`details` absent.",
    createBody: CreateDepartmentBody,
    updateBody: UpdateDepartmentBody,
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/departments/archives`,
    operationId: "departmentsListArchives",
    tags: ["departments"],
    summary: "Lister les archives de départements",
    description:
      "Administration (`SUPER_ADMIN`, `ADMIN`, ou `DEPARTMENT_MANAGER` rattaché — " +
      "`DepartmentPolicy.READ`). Collection paginée, antéchronologique : la dernière " +
      "suppression archivée arrive en premier. Chaque entrée porte l'instantané complet " +
      "de la fiche au moment de sa suppression.\n\n" +
      "Cette route est déclarée **avant** `/{idOrSlug}` : sans cela, le littéral " +
      "`archives` serait interprété comme un slug.",
    security: BEARER_SECURITY,
    parameters: PAGINATION_PARAMETERS,
    responses: {
      200: jsonResponse(
        "Archives conservées, de la plus récente à la plus ancienne.",
        "DepartmentArchiveCollection",
      ),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "put",
    path: `${API_BASE_PATH}/departments/{idOrSlug}/activities`,
    operationId: "departmentsSaveActivities",
    tags: ["departments"],
    summary: "Remplacer les activités d'un département",
    description:
      "Administration (`ADMIN` ou `SUPER_ADMIN`). Remplacement **total** : la liste " +
      "envoyée devient l'état des activités, **dans son ordre**, et les activités " +
      "absentes du corps sont supprimées — la transaction efface puis réinsère. " +
      "L'opération est idempotente : rejouer le même corps laisse la même collection. " +
      "La réponse est la collection **relue depuis la base**, ce qui fournit les " +
      "`id` et `imageUrl` définitifs des activités créées.",
    security: BEARER_SECURITY,
    parameters: [
      pathParameter(
        "idOrSlug",
        "Identifiant UUID **ou** slug du département.",
        "idOrSlug",
      ),
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": { schema: saveDepartmentActivitiesSchema },
      },
    },
    responses: {
      200: jsonResponse(
        "Activités enregistrées, relues depuis la base.",
        "DepartmentActivityCollection",
      ),
      ...adminResponses({
        404: errorResponse(
          "`DEPARTMENT_NOT_FOUND` — aucun département ne correspond à " +
            "l'identifiant ou au slug fourni. `details` absent.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/departments/{idOrSlug}/archive`,
    operationId: "departmentsArchive",
    tags: ["departments"],
    summary: "Archiver puis supprimer un département",
    description:
      "Administration : `SUPER_ADMIN` ou `ADMIN` en scope `GLOBAL` — **même action " +
      "`DELETE`** que `DELETE /departments/{idOrSlug}` (cellule 2.6, arbitrage du " +
      "23/10/2026), mais la réponse porte l'archive créée au lieu d'un `204`.\n\n" +
      "C'est la route qu'emploient les deux parcours de suppression du back-office : " +
      "elle conserve un instantané complet de la fiche (champs, activités, " +
      "responsables, références médias) dans `department_archives`, dans la même " +
      "transaction que la suppression (D-08). Le motif est facultatif et reste " +
      "horodaté avec l'auteur.",
    security: BEARER_SECURITY,
    parameters: [
      pathParameter(
        "idOrSlug",
        "Identifiant UUID **ou** slug du département.",
        "idOrSlug",
      ),
    ],
    requestBody: {
      required: false,
      content: {
        "application/json": { schema: archiveDepartmentSchema },
      },
    },
    responses: {
      200: jsonResponse(
        "Département archivé puis supprimé ; l'archive est renvoyée.",
        "DepartmentArchive",
      ),
      ...adminResponses({
        404: errorResponse(
          "`DEPARTMENT_NOT_FOUND` — aucun département ne correspond à " +
            "l'identifiant ou au slug fourni. `details` absent.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Événements                                                            */
  /* ---------------------------------------------------------------------- */

  registerCrudModule(registry, {
    tag: "events",
    basePath: `${API_BASE_PATH}/events`,
    resourceSchema: "Event",
    collectionSchema: "EventCollection",
    parameterName: "idOrSlug",
    parameterKind: "idOrSlug",
    parameterDescription: "Identifiant UUID **ou** slug de l'événement.",
    listParameters: [
      PAGE_PARAMETER,
      LIMIT_PARAMETER,
      enumQueryParameter(
        "status",
        "État **calculé** depuis `eventDate` : `UPCOMING` (aujourd'hui ou plus tard) ou " +
          "`ARCHIVED` (passé). Le statut n'existe pas en base ; il est traduit en " +
          "comparaison de dates par le repository. Omis ⇒ tous les événements.",
        ["UPCOMING", "ARCHIVED"],
      ),
      uuidQueryParameter(
        "departmentId",
        "Ne renvoyer que les événements d'un département donné (UUID).",
      ),
      sortParameter(
        ["event_date", "created_at"],
        "event_date",
        "Tri. Colonnes autorisées : `event_date`, `created_at` ; préfixe `-` pour " +
          "l'ordre décroissant. Défaut : `event_date` croissant — appelé avec " +
          "`status=UPCOMING`, l'écran public obtient l'événement le plus proche en " +
          "premier. Toute autre colonne ⇒ 400 VALIDATION_ERROR.",
      ),
    ],
    listSummary: "Lister les événements",
    listDescription:
      "Collection publique paginée et filtrée. `status`, `departmentId` et `sort` sont " +
      "les seuls paramètres reconnus en plus de `page`/`limit` ; aucune borne de date " +
      "fournie par le client n'est acceptée : la notion d'« à venir » est calculée par le " +
      "serveur. Tout autre paramètre — une faute de frappe comprise — est refusé en " +
      "`400 VALIDATION_ERROR`.",
    getSummary: "Lire un événement",
    getDescription:
      "Accepte un UUID ou un slug. Un identifiant inconnu produit `EVENT_NOT_FOUND`.",
    createSummary: "Créer un événement",
    createDescription:
      "Administration. `departmentId` peut valoir `null` (événement général) ; s'il est " +
      "fourni, le service vérifie que le département existe réellement.",
    updateSummary: "Mettre à jour un événement",
    updateDescription:
      "Administration. Mise à jour partielle ; `slug` n'y figure pas. Un `departmentId` " +
      "inexistant est refusé avant écriture.",
    removeSummary: "Supprimer un événement",
    removeDescription:
      "Administration. Suppression définitive, sans effet de bord sur les médias " +
      "référencés.",
    notFoundCode: "EVENT_NOT_FOUND",
    notFoundDescription:
      "aucun événement ne correspond à l'identifiant ou au slug fourni.",
    createBody: CreateEventBody,
    updateBody: UpdateEventBody,
    extraCreateResponses: {
      404: errorResponse(
        "`DEPARTMENT_NOT_FOUND` — le `departmentId` fourni ne correspond à aucun " +
          "département. Le service vérifie l'intégrité référentielle avant écriture.",
      ),
    },
    extraUpdateResponses: {
      404: errorResponse(
        "`EVENT_NOT_FOUND` ou `DEPARTMENT_NOT_FOUND` — l'événement est introuvable, ou " +
          "le `departmentId` fourni ne correspond à aucun département.",
      ),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Publications                                                          */
  /* ---------------------------------------------------------------------- */

  registerCrudModule(registry, {
    tag: "publications",
    basePath: `${API_BASE_PATH}/publications`,
    resourceSchema: "Publication",
    collectionSchema: "PublicationCollection",
    parameterName: "idOrSlug",
    parameterKind: "idOrSlug",
    parameterDescription: "Identifiant UUID **ou** slug de la publication.",
    listParameters: [
      PAGE_PARAMETER,
      LIMIT_PARAMETER,
      enumQueryParameter(
        "type",
        "Type de publication. Omis ⇒ tous les types.",
        ["VIDEO", "PHOTO", "TEXTE"],
      ),
      enumQueryParameter(
        "category",
        "Rubrique éditoriale, qui pilote le routage du frontend. Omis ⇒ toutes les " +
          "rubriques.",
        ["ACTUALITE", "ENSEIGNEMENT", "MEDIA", "RESSOURCE"],
      ),
      sortParameter(
        ["published_at", "created_at"],
        "-published_at",
        "Tri. Colonnes autorisées : `published_at`, `created_at` ; préfixe `-` pour " +
          "l'ordre décroissant. Défaut : `-published_at` (chronologie décroissante). " +
          "Toute autre colonne ⇒ 400 VALIDATION_ERROR.",
      ),
    ],
    listSummary: "Lister les publications",
    listDescription:
      "Collection publique paginée. `type`, `category` et `sort` sont les seuls " +
      "paramètres reconnus en plus de `page`/`limit` ; tout autre paramètre est refusé en " +
      "`400 VALIDATION_ERROR`. **Le filtre de statut n'existe pas** : le service " +
      "force `PUBLISHED` côté base, un client ne peut donc pas demander les brouillons, " +
      "même en forgeant la *query*. Le champ `status` reste exposé dans la réponse " +
      "(utile au back-office).",
    getSummary: "Lire une publication",
    getDescription:
      "Accepte un UUID ou un slug. Une publication en brouillon est traitée comme " +
      "inexistante et produit `PUBLICATION_NOT_FOUND`.",
    createSummary: "Créer une publication",
    createDescription:
      "Administration. `status` vaut `PUBLISHED` par défaut ; `DRAFT` dépublie sans " +
      "supprimer. `publishedAt` a pour valeur par défaut la date du jour. Le service " +
      "vérifie la cohérence entre `type` et contenu : `VIDEO` exige un `contentUrl` " +
      "http(s), `PHOTO` un `contentUrl` ou un `coverMediaId`, `TEXTE` un `body` non vide — " +
      "sinon `VALIDATION_ERROR`.",
    updateSummary: "Mettre à jour une publication",
    updateDescription:
      "Administration. Mise à jour partielle ; `slug` n'y figure pas et `publishedAt` " +
      "n'a **pas** de valeur par défaut : un `PATCH` qui ne parle pas de la date de " +
      "publication ne la réécrit pas. La cohérence `type`/contenu est arbitrée par le " +
      "service, qui dispose de la ressource existante.",
    removeSummary: "Supprimer une publication",
    removeDescription: "Administration. Suppression définitive.",
    notFoundCode: "PUBLICATION_NOT_FOUND",
    notFoundDescription:
      "aucune publication publiée ne correspond à l'identifiant ou au slug fourni.",
    createBody: CreatePublicationBody,
    updateBody: UpdatePublicationBody,
    extraUpdateResponses: {
      400: errorResponse(
        "`VALIDATION_ERROR` — corps de forme valide (Zod) mais contenu incohérent avec " +
          "le `type` déclaré, une fois la mise à jour partielle appliquée à la " +
          "ressource existante : `VIDEO` sans `contentUrl` http(s), `PHOTO` sans " +
          "`contentUrl` ni couverture, `TEXTE` sans `body` non vide. " +
          "`details: { champ }`.",
      ),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Responsables                                                          */
  /* ---------------------------------------------------------------------- */

  registerCrudModule(registry, {
    tag: "leaders",
    basePath: `${API_BASE_PATH}/leaders`,
    resourceSchema: "Leader",
    collectionSchema: "LeaderCollection",
    parameterName: "id",
    parameterKind: "uuid",
    parameterDescription:
      "Identifiant UUID du responsable : `leaders` n'a pas de slug.",
    listParameters: PAGINATION_PARAMETERS,
    listSummary: "Lister les responsables",
    listDescription:
      "Collection paginée. Aucun filtre serveur : seuls `page` et `limit` sont reconnus. " +
      "Aucun tri n'est exposé (l'ordre vient de `position` côté serveur), donc " +
      "`?sort=…` est refusé en `400 VALIDATION_ERROR` — comme tout autre paramètre non " +
      "reconnu.",
    getSummary: "Lire un responsable",
    getDescription: "Un identifiant inconnu produit `LEADER_NOT_FOUND`.",
    createSummary: "Créer un responsable",
    createDescription:
      "Administration. `photoMediaId` référence la table `media` : le portrait est un " +
      "média téléversé, jamais une URL libre.",
    updateSummary: "Mettre à jour un responsable",
    updateDescription:
      "Administration. Mise à jour partielle ; un corps vide est refusé " +
      "(`Aucun champ à mettre à jour`).",
    removeSummary: "Supprimer un responsable",
    removeDescription: "Administration. Suppression définitive.",
    notFoundCode: "LEADER_NOT_FOUND",
    notFoundDescription: "aucun responsable ne correspond à cet identifiant.",
    createBody: CreateLeaderBody,
    updateBody: UpdateLeaderBody,
  });

  /* ---------------------------------------------------------------------- */
  /*  Témoignages                                                           */
  /* ---------------------------------------------------------------------- */

  registerCrudModule(registry, {
    tag: "testimonies",
    basePath: `${API_BASE_PATH}/testimonies`,
    resourceSchema: "Testimony",
    collectionSchema: "TestimonyCollection",
    parameterName: "id",
    parameterKind: "uuid",
    parameterDescription: "Identifiant UUID du témoignage : aucun slug.",
    listParameters: PAGINATION_PARAMETERS,
    listSummary: "Lister les témoignages",
    listDescription:
      "Collection paginée, ordonnée par `position`. Aucun filtre serveur et aucun tri " +
      "exposé : seuls `page` et `limit` sont reconnus, tout autre paramètre — `?sort=…` " +
      "compris — est refusé en `400 VALIDATION_ERROR`.",
    getSummary: "Lire un témoignage",
    getDescription: "Un identifiant inconnu produit `TESTIMONY_NOT_FOUND`.",
    createSummary: "Créer un témoignage",
    createDescription: "Administration. `photoMediaId` référence la table `media`.",
    updateSummary: "Mettre à jour un témoignage",
    updateDescription: "Administration. Mise à jour partielle ; un corps vide est refusé.",
    removeSummary: "Supprimer un témoignage",
    removeDescription: "Administration. Suppression définitive.",
    notFoundCode: "TESTIMONY_NOT_FOUND",
    notFoundDescription: "aucun témoignage ne correspond à cet identifiant.",
    createBody: CreateTestimonyBody,
    updateBody: UpdateTestimonyBody,
  });

  /* ---------------------------------------------------------------------- */
  /*  Visages de la communauté                                              */
  /* ---------------------------------------------------------------------- */

  registerCrudModule(registry, {
    tag: "community-faces",
    basePath: `${API_BASE_PATH}/community-faces`,
    resourceSchema: "CommunityFace",
    collectionSchema: "CommunityFaceCollection",
    parameterName: "id",
    parameterKind: "uuid",
    parameterDescription: "Identifiant UUID du visage : aucun slug.",
    listParameters: PAGINATION_PARAMETERS,
    listSummary: "Lister les visages de la communauté",
    listDescription:
      "Collection paginée, ordonnée par `position`. Aucun filtre serveur et aucun tri " +
      "exposé : seuls `page` et `limit` sont reconnus, tout autre paramètre — `?sort=…` " +
      "compris — est refusé en `400 VALIDATION_ERROR`.",
    getSummary: "Lire un visage de la communauté",
    getDescription: "Un identifiant inconnu produit `COMMUNITY_FACE_NOT_FOUND`.",
    createSummary: "Créer un visage de la communauté",
    createDescription: "Administration. `photoMediaId` référence la table `media`.",
    updateSummary: "Mettre à jour un visage de la communauté",
    updateDescription: "Administration. Mise à jour partielle ; un corps vide est refusé.",
    removeSummary: "Supprimer un visage de la communauté",
    removeDescription: "Administration. Suppression définitive.",
    notFoundCode: "COMMUNITY_FACE_NOT_FOUND",
    notFoundDescription: "aucun visage ne correspond à cet identifiant.",
    createBody: CreateCommunityFaceBody,
    updateBody: UpdateCommunityFaceBody,
  });

  /* ---------------------------------------------------------------------- */
  /*  Enseignements                                                         */
  /* ---------------------------------------------------------------------- */

  /*
   * Deux montages existent (`app.ts` : `/enseignements` **et** `/teachings`),
   * ainsi que `/ressources` et `/resources`. Un seul est documenté — le chemin
   * français, celui qu'emploie le frontend — et l'alias est signalé dans la
   * description : documenter deux fois la même opération dédoublerait les
   * `operationId` et ferait croire à deux ressources distinctes.
   */

  const teachingIdParameter = pathParameter(
    "id",
    "Identifiant de l'enseignement. Les **écritures** exigent un UUID ; la **lecture** " +
      "accepte un UUID **ou** un slug (le paramètre porte `id` parce qu'un contrat " +
      "OpenAPI ne peut pas porter deux gabarits équivalents).",
    "uuid",
  );

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/enseignements`,
    operationId: "teachingsList",
    tags: ["teachings"],
    summary: "Lister les enseignements",
    description:
      "Collection paginée, ouverte. **Alias** : `GET /teachings` (même controller).\n\n" +
      "Un jeton d'administration valide dans `Authorization` élargit la lecture aux " +
      "brouillons et aux archives ; sans jeton, seuls les enseignements `PUBLISHED` " +
      "sortent. Le jeton est **facultatif** ici : son absence n'est pas une erreur, " +
      "elle restreint.\n\n" +
      "`status` et `search` sont les seuls filtres reconnus, et la *query* est stricte : " +
      "tout autre paramètre — `?sort=…` compris — est refusé en `400 VALIDATION_ERROR`.",
    security: NO_SECURITY,
    parameters: [
      ...PAGINATION_PARAMETERS,
      enumQueryParameter(
        "status",
        "Ne renvoyer que les enseignements dans cet état. Un demandeur non administrateur " +
          "n'obtient de toute façon que les `PUBLISHED`.\n\n" +
          "`ARCHIVED` correspond à un enseignement retiré du public mais conservé.",
        ["DRAFT", "PUBLISHED", "ARCHIVED"],
      ),
      parameter({
        name: "search",
        in: "query",
        required: false,
        description:
          "Recherche textuelle sur le titre et le nom de l'orateur (insensible à la casse).",
        schema: { type: "string" },
      }),
    ],
    responses: {
      200: jsonResponse("Enseignements correspondants.", "TeachingCollection"),
      ...publicResponses(),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/enseignements/{id}`,
    operationId: "teachingsGet",
    tags: ["teachings"],
    summary: "Lire un enseignement",
    description:
      "Accepte un UUID ou un slug. **Alias** : `GET /teachings/{id}`. Un " +
      "enseignement non publié reste accessible si la requête porte un jeton " +
      "d'administration ; sinon il est traité comme introuvable (`404`).",
    security: NO_SECURITY,
    parameters: [teachingIdParameter],
    responses: {
      200: jsonResponse("Enseignement trouvé.", "Teaching"),
      ...publicResponses({
        404: errorResponse(
          "`TEACHING_NOT_FOUND` — aucun enseignement ne correspond, ou il n'est pas " +
            "publié et la requête n'est pas administratrice.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/enseignements`,
    operationId: "teachingsCreate",
    tags: ["teachings"],
    summary: "Créer un enseignement",
    description:
      "Administration (`SUPER_ADMIN`, `ADMIN` — `TeachingPolicy`). Créé en `DRAFT` par " +
      "défaut : la publication est une transition distincte (`POST /{id}/publish`), qui " +
      "exige au moins un média.\n\n" +
      "`slug` est facultatif. S'il est omis, il est dérivé du titre ; s'il est déjà " +
      "pris, il est **suffixé** (`-2`, `-3`…) : deux enseignements peuvent porter le " +
      "même titre, seule l'adresse publique est rendue unique.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: createTeachingBodySchema } },
    },
    responses: {
      201: jsonResponse("Enseignement créé, en brouillon.", "Teaching"),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/enseignements/{id}`,
    operationId: "teachingsUpdate",
    tags: ["teachings"],
    summary: "Mettre à jour les métadonnées d'un enseignement",
    description:
      "Administration. Mise à jour partielle. `status` n'est **jamais écrit tel quel** : " +
      "une demande de `PUBLISHED` emprunte la transition contrôlée de `publish()` (même " +
      "règle de média, même horodatage de `publishedAt`) ; re-enregistrer un enseignement " +
      "déjà publié ne change pas sa date de publication.",
    security: BEARER_SECURITY,
    parameters: [teachingIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: updateTeachingBodySchema } },
    },
    responses: {
      200: jsonResponse("Enseignement mis à jour.", "Teaching"),
      ...adminResponses({
        404: errorResponse("`TEACHING_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "put",
    path: `${API_BASE_PATH}/enseignements/{id}/references-bibliques`,
    operationId: "teachingsUpdateBiblicalReferences",
    tags: ["teachings"],
    summary: "Remplacer les références bibliques",
    description:
      "Administration. Remplacement **total** de la collection, dans une transaction : " +
      "la liste envoyée devient l'état des références, dans son ordre. Les `id` de " +
      "liaison sont régénérés — seul `formatted` compte pour l'affichage.",
    security: BEARER_SECURITY,
    parameters: [teachingIdParameter],
    requestBody: {
      required: true,
      content: {
        "application/json": { schema: updateBiblicalReferencesBodySchema },
      },
    },
    responses: {
      200: jsonResponse(
        "Références enregistrées, relues depuis la base.",
        "BiblicalReferenceCollection",
      ),
      ...adminResponses({
        404: errorResponse("`TEACHING_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "put",
    path: `${API_BASE_PATH}/enseignements/{id}/medias`,
    operationId: "teachingsUpdateMedias",
    tags: ["teachings"],
    summary: "Remplacer les médias d'un enseignement",
    description:
      "Administration. Remplacement **total** : chaque entrée associe un média existant " +
      "à un `role` (`VIDEO`, `AUDIO`, `THUMBNAIL`) et indique s'il est principal. Les " +
      "fichiers eux-mêmes se téléversent d'abord via `POST /media` — cette route ne fait " +
      "que les référencer.",
    security: BEARER_SECURITY,
    parameters: [teachingIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: updateTeachingMediasBodySchema } },
    },
    responses: {
      200: jsonResponse(
        "Médias attachés, relus depuis la base.",
        "TeachingMediaCollection",
      ),
      ...adminResponses({
        404: errorResponse("`TEACHING_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/enseignements/{id}/publish`,
    operationId: "teachingsPublish",
    tags: ["teachings"],
    summary: "Publier un enseignement",
    description:
      "Administration. `DRAFT → PUBLISHED`, avec deux règles vérifiées par le service : " +
      "les métadonnées doivent être complètes et **au moins un média** doit être attaché. " +
      "`publishedAt` est horodaté par le serveur — jamais fourni par le client.",
    security: BEARER_SECURITY,
    parameters: [teachingIdParameter],
    responses: {
      200: jsonResponse("Enseignement publié.", "Teaching"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — métadonnées incomplètes ou aucun média : un enseignement " +
            "publié sans média n'aurait rien à montrer.",
        ),
        404: errorResponse("`TEACHING_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/enseignements/{id}/archive`,
    operationId: "teachingsArchive",
    tags: ["teachings"],
    summary: "Archiver un enseignement",
    description:
      "Administration. Retire l'enseignement du public sans le supprimer : il reste " +
      "consultable par un administrateur et réapparaît si l'on republie. Aucun corps " +
      "n'est attendu.",
    security: BEARER_SECURITY,
    parameters: [teachingIdParameter],
    responses: {
      200: jsonResponse("Enseignement archivé.", "Teaching"),
      ...adminResponses({
        404: errorResponse("`TEACHING_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/enseignements/{id}`,
    operationId: "teachingsDelete",
    tags: ["teachings"],
    summary: "Supprimer un enseignement",
    description:
      "Administration. Suppression définitive, sans effet de bord sur les médias " +
      "référencés (le registre `media` les conserve).",
    security: BEARER_SECURITY,
    parameters: [teachingIdParameter],
    responses: {
      204: {
        description: "Enseignement supprimé ; aucun corps renvoyé.",
      },
      ...adminResponses({
        404: errorResponse("`TEACHING_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Ressources téléchargeables (PDF)                                       */
  /* ---------------------------------------------------------------------- */

  const resourceIdParameter = pathParameter(
    "id",
    "Identifiant de la ressource. Les écritures exigent un UUID ; la **lecture** accepte " +
      "un UUID **ou** un slug (le paramètre porte `id` pour que le contrat n'ait qu'un " +
      "seul gabarit d'URL par route).",
    "uuid",
  );

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/resources`,
    operationId: "resourcesList",
    tags: ["resources"],
    summary: "Lister les ressources",
    description:
      "Collection **publique** paginée. **Alias** : `GET /ressources`.\n\n" +
      "`search` est le seul filtre reconnu ; la *query* est stricte, donc tout autre " +
      "paramètre est refusé en `400 VALIDATION_ERROR`.",
    security: NO_SECURITY,
    parameters: [
      ...PAGINATION_PARAMETERS,
      parameter({
        name: "search",
        in: "query",
        required: false,
        description: "Recherche textuelle sur le nom de la ressource.",
        schema: { type: "string" },
      }),
    ],
    responses: {
      200: jsonResponse("Ressources disponibles.", "ResourceCollection"),
      ...publicResponses(),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/resources/{id}`,
    operationId: "resourcesGet",
    tags: ["resources"],
    summary: "Lire une ressource",
    description:
      "Accepte un UUID ou un slug. **Alias** : `GET /ressources/{id}`.",
    security: NO_SECURITY,
    parameters: [resourceIdParameter],
    responses: {
      200: jsonResponse("Ressource trouvée.", "Resource"),
      ...publicResponses({
        404: errorResponse(
          "`RESOURCE_NOT_FOUND` — aucune ressource ne correspond à l'identifiant ou au slug.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/resources`,
    operationId: "resourcesCreate",
    tags: ["resources"],
    summary: "Créer une ressource",
    description:
      "Administration (`SUPER_ADMIN`, `ADMIN` — `ResourcePolicy`). La ressource est " +
      "**publiée immédiatement** : il n'existe pas d'état brouillon pour un document.\n\n" +
      "Le PDF se téléverse d'abord via `POST /media` avec `folder=resources` (seul dossier " +
      "qui accepte un PDF, jusqu'à 20 Mo), puis son URL publique est fournie ici. Le " +
      "service refuse (`VALIDATION_ERROR`) une valeur qui ne désigne pas un `.pdf` : une " +
      "ressource sans document n'a pas de sens.\n\n" +
      "`slug` est facultatif ; dérivé du nom s'il est omis, **suffixé** s'il est déjà pris.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: createResourceSchema } },
    },
    responses: {
      201: jsonResponse("Ressource créée et publiée.", "Resource"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — `name` vide, ou `file` qui ne désigne pas un fichier `.pdf`.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/resources/{id}`,
    operationId: "resourcesUpdate",
    tags: ["resources"],
    summary: "Mettre à jour une ressource",
    description:
      "Administration. Mise à jour partielle des métadonnées ; `file` peut aussi y être " +
      "remplacé, avec la même exigence de PDF. Pour ne changer **que** le document, " +
      "préférer `PUT /{id}/file`.",
    security: BEARER_SECURITY,
    parameters: [resourceIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: updateResourceSchema } },
    },
    responses: {
      200: jsonResponse("Ressource mise à jour.", "Resource"),
      ...adminResponses({
        404: errorResponse("`RESOURCE_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "put",
    path: `${API_BASE_PATH}/resources/{id}/file`,
    operationId: "resourcesReplaceFile",
    tags: ["resources"],
    summary: "Remplacer le PDF d'une ressource",
    description:
      "Administration. Remplace le seul document : le nom, le slug et la description " +
      "sont conservés — c'est le geste « nouvelle édition du même document » (mise à jour " +
      "du guide de l'année), qui ne doit pas changer l'adresse publique.",
    security: BEARER_SECURITY,
    parameters: [resourceIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: replaceResourceFileSchema } },
    },
    responses: {
      200: jsonResponse("Document remplacé.", "Resource"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — `file` absent ou ne désignant pas un `.pdf`.",
        ),
        404: errorResponse("`RESOURCE_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/resources/{id}`,
    operationId: "resourcesDelete",
    tags: ["resources"],
    summary: "Supprimer une ressource",
    description:
      "Administration. Suppression définitive de la fiche ; le fichier reste dans le " +
      "Storage et peut être purgé depuis la médiathèque.",
    security: BEARER_SECURITY,
    parameters: [resourceIdParameter],
    responses: {
      204: { description: "Ressource supprimée ; aucun corps renvoyé." },
      ...adminResponses({
        404: errorResponse("`RESOURCE_NOT_FOUND` — identifiant inconnu."),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Versets                                                               */
  /* ---------------------------------------------------------------------- */

  const scriptureKeyParameter = pathParameter(
    "key",
    "Clé du verset : minuscules, chiffres et tirets (ex. « rassemblement »), 1 à 60 " +
      "caractères. La `key` est l'identifiant d'URL — les pages référencent leurs versets " +
      "par clé — et n'est pas modifiable par `PATCH`.",
    "scriptureKey",
  );

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/scriptures`,
    operationId: "scripturesList",
    tags: ["scriptures"],
    summary: "Lister les versets",
    description:
      "Liste complète, **non paginée** : le controller renvoie `{ data }` sans `meta` " +
      "(`scripture.controller.ts:20`). Aucun filtre n'est reconnu (`docs/018` §6.1) : la " +
      "*query* est validée par un objet strict, donc un paramètre quel qu'il soit — " +
      "`?limit=20` compris — produit `400 VALIDATION_ERROR` au lieu d'être ignoré.",
    security: NO_SECURITY,
    responses: {
      200: jsonResponse("Versets enregistrés.", "ScriptureList"),
      ...publicResponses(),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/scriptures/{key}`,
    operationId: "scripturesGet",
    tags: ["scriptures"],
    summary: "Lire un verset par clé",
    description:
      "Une clé inconnue produit `SCRIPTURE_NOT_FOUND` avec `details: { key }`.",
    security: NO_SECURITY,
    parameters: [scriptureKeyParameter],
    responses: {
      200: jsonResponse("Verset trouvé.", "Scripture"),
      ...publicResponses({
        404: errorResponse(
          "`SCRIPTURE_NOT_FOUND` — aucun verset n'est enregistré pour cette clé. " +
            "`details: { key }`.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/scriptures`,
    operationId: "scripturesCreate",
    tags: ["scriptures"],
    summary: "Créer un verset",
    description:
      "Administration. `key` est unique : le service détecte le conflit **avant** " +
      "l'écriture pour renvoyer une erreur métier plutôt qu'une violation de contrainte " +
      "SQL. `translation` vaut « Louis Segond 1910 » par défaut.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: CreateScriptureBody } },
    },
    responses: {
      201: jsonResponse("Verset créé.", "Scripture"),
      ...adminResponses({ 409: responseRef("Conflict") }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/scriptures/{key}`,
    operationId: "scripturesUpdate",
    tags: ["scriptures"],
    summary: "Mettre à jour un verset",
    description:
      "Administration. Mise à jour partielle ; `key` n'est pas modifiable et un corps " +
      "vide (`{}`) est refusé (`Aucun champ à mettre à jour`).",
    security: BEARER_SECURITY,
    parameters: [scriptureKeyParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: UpdateScriptureBody } },
    },
    responses: {
      200: jsonResponse("Verset mis à jour.", "Scripture"),
      ...adminResponses({
        404: errorResponse("`SCRIPTURE_NOT_FOUND` — clé inconnue. `details: { key }`."),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/scriptures/{key}`,
    operationId: "scripturesDelete",
    tags: ["scriptures"],
    summary: "Supprimer un verset",
    description: "Administration. Suppression définitive.",
    security: BEARER_SECURITY,
    parameters: [scriptureKeyParameter],
    responses: {
      204: { description: "Verset supprimé : corps vide." },
      ...adminResponses({
        404: errorResponse("`SCRIPTURE_NOT_FOUND` — clé inconnue."),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Rythme hebdomadaire                                                   */
  /* ---------------------------------------------------------------------- */

  const scheduleIdParameter = pathParameter(
    "id",
    "Identifiant UUID de l'entrée du rythme.",
    "uuid",
  );

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/schedule`,
    operationId: "scheduleList",
    tags: ["schedule"],
    summary: "Lister le rythme hebdomadaire",
    description:
      "Liste complète, **non paginée** et ordonnée par `position` : `{ data }` sans " +
      "`meta` (`schedule.controller.ts:17`). Il n'existe **aucune** route " +
      "`GET /schedule/{id}` : la lecture d'une entrée isolée n'est pas exposée. Aucun " +
      "filtre n'est reconnu : la *query* est validée par un objet strict, tout paramètre " +
      "produit `400 VALIDATION_ERROR`.",
    security: NO_SECURITY,
    responses: {
      200: jsonResponse("Entrées du rythme hebdomadaire.", "ScheduleEntryList"),
      ...publicResponses(),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/schedule`,
    operationId: "scheduleCreate",
    tags: ["schedule"],
    summary: "Créer une entrée du rythme",
    description:
      "Administration. `isConfirmed` vaut `false` et `position` vaut `0` par défaut.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: CreateScheduleEntryBody } },
    },
    responses: {
      201: jsonResponse("Entrée créée.", "ScheduleEntry"),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/schedule/{id}`,
    operationId: "scheduleUpdate",
    tags: ["schedule"],
    summary: "Mettre à jour une entrée du rythme",
    description: "Administration. Mise à jour partielle ; un corps vide est refusé.",
    security: BEARER_SECURITY,
    parameters: [scheduleIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: UpdateScheduleEntryBody } },
    },
    responses: {
      200: jsonResponse("Entrée mise à jour.", "ScheduleEntry"),
      ...adminResponses({
        404: errorResponse(
          "`SCHEDULE_ENTRY_NOT_FOUND` — aucune entrée ne correspond à cet identifiant.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/schedule/{id}`,
    operationId: "scheduleDelete",
    tags: ["schedule"],
    summary: "Supprimer une entrée du rythme",
    description: "Administration. Suppression définitive.",
    security: BEARER_SECURITY,
    parameters: [scheduleIdParameter],
    responses: {
      204: { description: "Entrée supprimée : corps vide." },
      ...adminResponses({
        404: errorResponse(
          "`SCHEDULE_ENTRY_NOT_FOUND` — aucune entrée ne correspond à cet identifiant.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Réseaux sociaux                                                       */
  /* ---------------------------------------------------------------------- */

  const socialLinkIdParameter = pathParameter(
    "id",
    "Identifiant UUID du lien social.",
    "uuid",
  );

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/social-links`,
    operationId: "socialLinksList",
    tags: ["social-links"],
    summary: "Lister les réseaux sociaux",
    description:
      "Liste complète, **non paginée** et ordonnée par `position` : `{ data }` sans " +
      "`meta` (`social-link.controller.ts:17`). Les liens affichés dans le pied de page " +
      "et sur la page « nous trouver » proviennent de cette route et sont aussi exposés " +
      "dans `GET /settings`. Aucun filtre n'est reconnu : la *query* est validée par un " +
      "objet strict, tout paramètre produit `400 VALIDATION_ERROR`.",
    security: NO_SECURITY,
    responses: {
      200: jsonResponse("Liens sociaux ordonnés.", "SocialLinkList"),
      ...publicResponses(),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/social-links`,
    operationId: "socialLinksCreate",
    tags: ["social-links"],
    summary: "Créer un lien social",
    description:
      "Administration. `href` doit être une URL `http`/`https` valide : ces liens sont " +
      "affichés tels quels, un `href` arbitraire (`javascript:`, `data:`) est refusé par " +
      "Zod. `position` vaut `0` par défaut.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: CreateSocialLinkBody } },
    },
    responses: {
      201: jsonResponse("Lien créé.", "SocialLink"),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/social-links/{id}`,
    operationId: "socialLinksUpdate",
    tags: ["social-links"],
    summary: "Mettre à jour un lien social",
    description: "Administration. Mise à jour partielle ; un corps vide est refusé.",
    security: BEARER_SECURITY,
    parameters: [socialLinkIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: UpdateSocialLinkBody } },
    },
    responses: {
      200: jsonResponse("Lien mis à jour.", "SocialLink"),
      ...adminResponses({
        404: errorResponse(
          "`SOCIAL_LINK_NOT_FOUND` — aucun lien ne correspond à cet identifiant.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/social-links/{id}`,
    operationId: "socialLinksDelete",
    tags: ["social-links"],
    summary: "Supprimer un lien social",
    description: "Administration. Suppression définitive.",
    security: BEARER_SECURITY,
    parameters: [socialLinkIdParameter],
    responses: {
      204: { description: "Lien supprimé : corps vide." },
      ...adminResponses({
        404: errorResponse(
          "`SOCIAL_LINK_NOT_FOUND` — aucun lien ne correspond à cet identifiant.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Réglages institutionnels                                              */
  /* ---------------------------------------------------------------------- */

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/settings`,
    operationId: "settingsGet",
    tags: ["settings"],
    summary: "Lire les réglages du site",
    description:
      "Document unique, sans identifiant : regroupe les scalaires de `site_settings` " +
      "(exposés en objet clé/valeur) et la liste ordonnée des liens sociaux. Les deux " +
      "sources sont lues en parallèle.\n\n" +
      "Aucun paramètre de requête n'est reconnu : la *query* est validée par un objet " +
      "strict vide (`emptyQuerySchema`), donc `?nimportequoi=1` produit " +
      "`400 VALIDATION_ERROR` au lieu d'être ignoré.",
    security: NO_SECURITY,
    responses: {
      200: jsonResponse("Réglages courants.", "Settings"),
      ...publicResponses(),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/settings`,
    operationId: "settingsUpdate",
    tags: ["settings"],
    summary: "Mettre à jour les réglages du site",
    description:
      "Administration. Mise à jour en masse de scalaires. La liste des clés écrivables " +
      "est **fermée** : une clé inconnue fait échouer toute l'opération plutôt que d'être " +
      "ignorée silencieusement. La réponse est l'état **complet relu**, qui contient donc " +
      "aussi les clés absentes de la requête.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: SettingsPatchBody } },
    },
    responses: {
      200: jsonResponse("Réglages mis à jour et relus.", "Settings"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — objet `settings` vide (`Aucun réglage à mettre à jour`, " +
            "`details: { allowedKeys }`), ou clé non autorisée " +
            "(`Clé de réglage non autorisée : …`, `details: { unknownKeys, allowedKeys }`). " +
            "Une valeur vide ou blanche est refusée par Zod (1 à 500 caractères).",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Pages éditables                                                       */
  /* ---------------------------------------------------------------------- */

  const pageKeyParameter = pathParameter(
    "pageKey",
    "Clé de la page (1 à 60 caractères), telle que le frontend la connaît. " +
      "Volontairement permissive : une clé inconnue produit un 404 métier " +
      "(`PAGE_NOT_FOUND`), pas un 400 de forme.",
    "pageKey",
  );

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/pages/{pageKey}`,
    operationId: "pagesGet",
    tags: ["pages"],
    summary: "Lire le contenu d'une page éditable",
    description:
      "Il n'existe pas de route de collection : l'énumération des clés éditables vient du " +
      "registre `domain/content/page-content.ts`, pas de la base. Une clé hors registre " +
      "produit `PAGE_NOT_FOUND`.\n\n" +
      "Aucun paramètre de requête n'est reconnu : la *query* est validée par un objet " +
      "strict vide (`emptyQuerySchema`), donc `?nimportequoi=1` produit " +
      "`400 VALIDATION_ERROR` au lieu d'être ignoré.",
    security: NO_SECURITY,
    parameters: [pageKeyParameter],
    responses: {
      200: jsonResponse("Contenu de la page.", "StaticPage"),
      ...publicResponses({
        404: errorResponse(
          "`PAGE_NOT_FOUND` — aucune page ne correspond à cette `pageKey`.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/pages/{pageKey}`,
    operationId: "pagesUpdate",
    tags: ["pages"],
    summary: "Mettre à jour le contenu d'une page éditable",
    description:
      "Administration. La validation est faite **en deux temps** : forme générale " +
      "(`{ content: objet }`) par Zod, puis contenu par le schéma de la page dans le " +
      "service — c'est la seule façon de rejeter une `pageKey` inconnue en " +
      "`PAGE_NOT_FOUND` et un contenu non conforme en `VALIDATION_ERROR`. " +
      "`updatedBy` est déduit du jeton vérifié, jamais du corps de la requête : un client " +
      "ne peut pas falsifier l'auteur de la modification.",
    security: BEARER_SECURITY,
    parameters: [pageKeyParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: PageContentUpdateBody } },
    },
    responses: {
      200: jsonResponse("Contenu mis à jour.", "StaticPage"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — `content` n'est pas un objet, ou son contenu ne respecte " +
            "pas le schéma de la page concernée. `details` décrit les champs fautifs.",
        ),
        404: errorResponse(
          "`PAGE_NOT_FOUND` — la `pageKey` n'est pas une page éditable.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Médias — entièrement administratifs                                   */
  /* ---------------------------------------------------------------------- */

  const mediaIdParameter = pathParameter("id", "Identifiant UUID du média.", "uuid");

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/media`,
    operationId: "mediaList",
    tags: ["media"],
    summary: "Lister les médias",
    description:
      "Administration : le registre des fichiers téléversés n'est **jamais** public. " +
      "Collection paginée, sans filtre serveur.",
    security: BEARER_SECURITY,
    parameters: PAGINATION_PARAMETERS,
    responses: {
      200: jsonResponse("Collection paginée de médias.", "MediaCollection"),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/media/{id}/usage`,
    operationId: "mediaUsage",
    tags: ["media"],
    summary: "Lister les usages d'un média",
    description:
      "Administration. Renvoie le média, le nombre total de références et la liste des " +
      "emplacements qui le référencent réellement. Le calcul passe par une seule requête " +
      "SQL, jamais par une boucle.",
    security: BEARER_SECURITY,
    parameters: [mediaIdParameter],
    responses: {
      200: jsonResponse("Rapport d'usages.", "MediaUsageReport"),
      ...adminResponses({
        404: errorResponse(
          "`MEDIA_NOT_FOUND` — aucun média ne correspond à cet identifiant. " +
            "`details: { id }`.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/media/{id}`,
    operationId: "mediaGet",
    tags: ["media"],
    summary: "Lire un média",
    description: "Administration. Aucun champ interne n'est exposé : ni clé, ni jeton.",
    security: BEARER_SECURITY,
    parameters: [mediaIdParameter],
    responses: {
      200: jsonResponse("Média trouvé.", "Media"),
      ...adminResponses({
        404: errorResponse(
          "`MEDIA_NOT_FOUND` — aucun média ne correspond à cet identifiant.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/media`,
    operationId: "mediaUpload",
    tags: ["media"],
    summary: "Téléverser un média",
    description:
      "Administration. Corps `multipart/form-data` : un champ fichier `file` et un champ " +
      "texte `folder`, plus un `alt` facultatif.\n\n" +
      "Le téléversement est fait **en mémoire** (`multer.memoryStorage()`) : rien n'est " +
      "jamais écrit sur le disque du serveur, éphémère sur l'hébergement. Type et taille " +
      "sont contrôlés par `StorageService` à partir des **octets** du fichier — jamais du " +
      "`Content-Type` ni du nom de fichier envoyés par le client — et le nom du fichier " +
      "stocké est généré par le serveur (UUID + extension), ce qui élimine les traversées " +
      "de chemin et les collisions.\n\n" +
      "Les types acceptés dépendent du **dossier** : `resources` n'accepte que des PDF " +
      "(documents téléchargeables de l'espace Ressources, jusqu'à 20 Mo) ; tous les " +
      "autres dossiers n'acceptent que des images, plafonnées à 5 Mo. Un PDF envoyé dans " +
      "un dossier d'images — ou une photo envoyée dans `resources` — est refusé en `415`.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "multipart/form-data": { schema: UploadMediaRequest } },
    },
    responses: {
      201: jsonResponse("Média téléversé et enregistré.", "Media"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — champ `folder` absent ou hors de la liste autorisée, " +
            "`alt` trop long, aucun fichier reçu sous le nom de champ `file` " +
            "(« Aucun fichier reçu : le champ de formulaire « file » est requis »), ou " +
            "plusieurs fichiers envoyés. `details` indique le champ fautif.",
        ),
        413: responseRef("FileTooLarge"),
        415: responseRef("InvalidFileType"),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/media/{id}`,
    operationId: "mediaDelete",
    tags: ["media"],
    summary: "Supprimer un média",
    description:
      "Administration. Refusée par défaut si le fichier est encore référencé : la " +
      "réponse est alors `CONFLICT` avec le détail des usages. `?force=true` détache " +
      "d'abord les références, puis supprime la ligne **et** le fichier du Storage. " +
      "Seule la chaîne littérale `true` autorise la suppression forcée : `false` ou toute " +
      "autre valeur est refusée par Zod (une valeur quelconque ne doit pas être convertie " +
      "en booléen, `Boolean(\"false\")` valant `true`). `force` est le **seul** paramètre " +
      "reconnu : le schéma est strict, donc `?forcee=true` (faute de frappe) produit " +
      "`400 VALIDATION_ERROR` au lieu d'être ignoré — l'absence de `force` réel ne peut " +
      "pas passer pour un refus de forcer.",
    security: BEARER_SECURITY,
    parameters: [
      mediaIdParameter,
      enumQueryParameter(
        "force",
        "`true` pour supprimer un média encore référencé (les références sont " +
          "détachées). Défaut : `false`.",
        ["true", "false"],
        "false",
      ),
    ],
    responses: {
      204: { description: "Média supprimé du registre et du Storage : corps vide." },
      ...adminResponses({
        404: errorResponse(
          "`MEDIA_NOT_FOUND` — aucun média ne correspond à cet identifiant.",
        ),
        409: errorResponse(
          "`CONFLICT` — le média est encore utilisé et `force` n'est pas `true`. " +
            "`details: { total, usages }`.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Droits d'accès aux médias (Lot 5)                                     */
  /* ---------------------------------------------------------------------- */

  /*
   * Quatre opérations, quatre actions **distinctes** — c'est le cœur de D-21 :
   * lire les droits, les accorder, les modifier et les retirer ne sont pas quatre
   * degrés d'un même droit, mais quatre décisions. Elles délèguent toutes à
   * `MediaAccessPolicy`, qui emprunte à `MediaPolicy` la formulation de « seul
   * l'ADMIN ou le SUPER_ADMIN accorde » (`docs/029` §4.6) : une seule règle, deux
   * portes d'entrée.
   *
   * Toutes administratives : le registre des autorisations dit qui peut faire
   * quoi, et cette information n'appartient pas aux visiteurs.
   */

  const granteeTypeParameter = parameter({
    name: "granteeType",
    in: "path",
    required: true,
    description:
      "Type de destinataire : un département, ou un profil nommément désigné.",
    // Une liste fermée, comme pour toute énumération de l'API : la colonne
    // `grantee_type` est polymorphe, et son rôle est justement de dire comment
    // interpréter `granteeId`. Accepter une valeur libre rendrait une
    // autorisation ambiguë — accordée à une entité non identifiée.
    schema: { type: "string", enum: ["DEPARTMENT", "ADMIN_PROFILE"] },
  });
  const granteeIdParameter = pathParameter(
    "granteeId",
    "Identifiant du destinataire (`departments.id` ou `admin_profiles.id`, selon `granteeType`).",
    "uuid",
  );

  registry.registerComponent("schemas", "MediaAccess", {
    type: "object",
    description:
      "Droits d'accès d'un média (`docs/032` §3.4). Les **trois droits sont " +
      "indépendants** : `canManage` n'implique pas `canUse`, et `canDelete` ne se " +
      "déduit d'aucun autre (D-21). Tous les booléens sont toujours présents, y " +
      "compris `false` — un objet qui omettrait un droit inviterait à le déduire.",
    required: [
      "id",
      "mediaId",
      "granteeType",
      "granteeId",
      "canUse",
      "canManage",
      "canDelete",
      "grantedBy",
      "grantedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      mediaId: { type: "string", format: "uuid" },
      granteeType: { type: "string", enum: ["DEPARTMENT", "ADMIN_PROFILE"] },
      granteeId: { type: "string", format: "uuid" },
      canUse: { type: "boolean", description: "Référencer le média dans un contenu." },
      canManage: { type: "boolean", description: "Modifier la ressource média." },
      canDelete: {
        type: "boolean",
        description: "Jamais accordé à un département (XD-07).",
      },
      grantedBy: {
        type: "string",
        format: "uuid",
        description:
          "Auteur du grant — la preuve de qui a autorisé quoi (`docs/029` §2.6).",
      },
      grantedAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });

  registry.registerComponent("schemas", "MediaAccessGrant", {
    type: "object",
    description:
      "Corps d'un accord de droits. Un accès qui n'accorde **rien** est refusé " +
      "(400 en validation, et `media_access_at_least_one_right` en base), et un " +
      "département ne peut **jamais** recevoir `DELETE` (XD-07) — le schéma comme " +
      "la base le refusent, avec le même effet.",
    required: ["granteeType", "granteeId"],
    properties: {
      granteeType: { type: "string", enum: ["DEPARTMENT", "ADMIN_PROFILE"] },
      granteeId: { type: "string", format: "uuid" },
      canUse: { type: "boolean", default: false },
      canManage: { type: "boolean", default: false },
      canDelete: { type: "boolean", default: false },
    },
  });

  registry.registerComponent("schemas", "MediaRights", {
    type: "object",
    description: "Réécriture des trois droits d'une ligne existante (cellule 6.3).",
    properties: {
      canUse: { type: "boolean", default: false },
      canManage: { type: "boolean", default: false },
      canDelete: { type: "boolean", default: false },
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/media/{id}/access`,
    operationId: "mediaAccessList",
    tags: ["media"],
    summary: "Lister les droits d'accès d'un média",
    description:
      "Qui peut utiliser ce média, et pour quoi faire. Liste **bornée et non " +
      "paginée** : elle est rendue dans l'enveloppe `{ data: [...] }`, sans `meta` " +
      "— comme celles de `scriptures`, `schedule` et `social-links`. Réservé au " +
      "`SUPER_ADMIN` et à l'`ADMIN` : la lecture par un responsable n'est pas " +
      "arbitrée (docs/029 Q-11, cellule 6.1), et le refus par défaut s'applique. " +
      "À ne pas confondre avec le **registre des médias** (cellule 5.2), qui, lui, " +
      "est ouvert au responsable pour les médias où un droit existe.",
    security: BEARER_SECURITY,
    parameters: [mediaIdParameter],
    responses: {
      200: {
        description: "Droits d'accès du média.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["data"],
              properties: {
                data: {
                  type: "array",
                  items: schemaRef("MediaAccess"),
                },
              },
            },
          },
        },
      },
      ...adminResponses({
        404: errorResponse("`MEDIA_NOT_FOUND` — aucun média ne correspond à cet identifiant."),
      }),
    },
  });

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/media/{id}/access`,
    operationId: "mediaAccessGrant",
    tags: ["media"],
    summary: "Accorder un accès à un média",
    description:
      "`SUPER_ADMIN` ou `ADMIN` uniquement : « L'`ADMIN` ou le `SUPER_ADMIN` accorde " +
      "l'autorisation » (D-22). Un responsable ne peut **jamais** s'accorder un " +
      "accès, ni à lui-même ni à son département (XD-08). Aucun partage par défaut " +
      "(XD-09) : sans cette opération, un département ne voit rien. `409` si ce " +
      "destinataire dispose déjà d'une ligne — elle se **modifie**, elle ne se " +
      "duplique pas, pour que l'auteur du grant initial reste attribuable.",
    security: BEARER_SECURITY,
    parameters: [mediaIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("MediaAccessGrant") } },
    },
    responses: {
      201: jsonResponse("Droits accordés.", "MediaAccess"),
      ...adminResponses({
        404: errorResponse("`MEDIA_NOT_FOUND` — aucun média ne correspond à cet identifiant."),
        409: errorResponse(
          "`CONFLICT` — règle refusée par la base : droits portant `DELETE` sur un " +
            "département (XD-07), ligne déjà existante, aucun droit accordé, ou " +
            "destinataire inexistant.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/media/{id}/access/{granteeType}/{granteeId}`,
    operationId: "mediaAccessUpdate",
    tags: ["media"],
    summary: "Modifier les droits d'un destinataire",
    description:
      "Réécrit les trois droits d'une ligne existante (cellule 6.3). `SUPER_ADMIN` " +
      "ou `ADMIN` uniquement : modifier un droit est la même opération qu'en " +
      "accorder un, à une ligne près. Les trois droits sont **remplacés**, jamais " +
      "fusionnés : une modification partielle obligerait à relire l'état courant, " +
      "donc à écrire depuis un état périmé.",
    security: BEARER_SECURITY,
    parameters: [mediaIdParameter, granteeTypeParameter, granteeIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("MediaRights") } },
    },
    responses: {
      200: jsonResponse("Droits mis à jour.", "MediaAccess"),
      ...adminResponses({
        404: errorResponse(
          "`MEDIA_NOT_FOUND` ou `MEDIA_ACCESS_NOT_FOUND` — le média, ou la ligne de " +
            "droits de ce destinataire, n'existe pas.",
        ),
        409: errorResponse("`CONFLICT` — règle refusée par la base (XD-07, ligne vide)."),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/media/{id}/access/{granteeType}/{granteeId}`,
    operationId: "mediaAccessRevoke",
    tags: ["media"],
    summary: "Retirer un accès",
    description:
      "Le retrait **supprime la ligne** au lieu de mettre les trois droits à " +
      "`false` : « l'autorisation se retire par `DELETE` » (`docs/029` §2.6), et une " +
      "ligne vide est de toute façon interdite par la base. `SUPER_ADMIN` ou " +
      "`ADMIN` uniquement.",
    security: BEARER_SECURITY,
    parameters: [mediaIdParameter, granteeTypeParameter, granteeIdParameter],
    responses: {
      204: { description: "Accès retiré : corps vide." },
      ...adminResponses({
        404: errorResponse(
          "`MEDIA_NOT_FOUND` ou `MEDIA_ACCESS_NOT_FOUND` — il n'y a aucun droit à retirer.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Notifications (Lot 7)                                                 */
  /* ---------------------------------------------------------------------- */

  /*
   * Aucune route ne désigne un destinataire : il est toujours le profil
   * authentifié. `docs/029` §2.9 fait d'une notification une donnée **adressée**,
   * et une route acceptant un identifiant ouvrirait la boîte de réception de
   * quelqu'un d'autre. Ne pas exposer l'entrée est plus sûr que la refuser.
   *
   * Aucune route de création non plus : aucune cellule `CREATE` n'existe dans la
   * matrice, et le créateur est le **système** au dépôt d'une demande de prière
   * (`docs/030` §6.2) — son garde, D-10, est porté par le service et garanti par
   * un trigger de la base.
   */

  registry.registerComponent("schemas", "Notification", {
    type: "object",
    description:
      "Notification adressée à **un** administrateur (`docs/032` §3.3). Elle dit " +
      "qu'un événement a eu lieu, jamais de quoi il s'agit : aucun contenu, aucun " +
      "nom, aucun extrait, aucune longueur. Cette interdiction est **structurelle** " +
      "— les colonnes n'existent pas.",
    required: ["id", "type", "isRead", "createdAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      type: {
        type: "string",
        enum: [
          "PRAYER_REQUEST_RECEIVED",
          "KEY_REGISTERED",
          "KEY_REVOKED",
          "RECOVERY_KEY_CHANGED",
        ],
      },
      referenceId: {
        type: ["string", "null"],
        description:
          "Identifiant de la ressource référencée (demande de prière, clé) — " +
          "jamais un fragment de texte.",
      },
      isRead: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
  });

  const notificationIdParameter = pathParameter(
    "id",
    "Identifiant UUID de la notification.",
    "uuid",
  );

  registry.registerComponent("schemas", "NotificationCollection", {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: schemaRef("Notification") },
      meta: schemaRef("PaginationMeta"),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/notifications`,
    operationId: "notificationsList",
    tags: ["notifications"],
    summary: "Boîte de réception de l'appelant",
    description:
      "Les notifications **du profil authentifié**, les plus récentes d'abord. " +
      "Aucun paramètre ne permet de demander la boîte d'un autre : le destinataire " +
      "est toujours `req.admin.id`. Le domaine des notifications est réservé à " +
      "l'`ADMIN` — D-10 le ferme entièrement au `SUPER_ADMIN`, cycle de vie des " +
      "clés compris (`docs/030` §4.7, §6.2), et le responsable n'y a aucune part.",
    security: BEARER_SECURITY,
    parameters: [
      ...PAGINATION_PARAMETERS,
      enumQueryParameter(
        "unreadOnly",
        "`true` pour ne rendre que les notifications non lues. Seules les chaînes " +
          "`true` et `false` sont acceptées — `Boolean(\"false\")` vaut `true`.",
        ["true", "false"],
        "false",
      ),
    ],
    responses: {
      200: jsonResponse("Collection paginée de notifications.", "NotificationCollection"),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/notifications/unread-count`,
    operationId: "notificationsUnreadCount",
    tags: ["notifications"],
    summary: "Nombre de notifications non lues",
    description:
      "Indicateur de la barre de navigation. Aucune requête de *query* n'est " +
      "reconnue (objet strict) : un `?nimportequoi=1` est refusé en " +
      "`400 VALIDATION_ERROR` plutôt qu'ignoré.",
    security: BEARER_SECURITY,
    responses: {
      200: {
        description: "Compteur.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["unread"],
              properties: { unread: { type: "integer", minimum: 0 } },
            },
          },
        },
      },
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/notifications/{id}/read`,
    operationId: "notificationsMarkRead",
    tags: ["notifications"],
    summary: "Marquer une notification comme lue",
    description:
      "**Idempotent** : marquer une notification déjà lue renvoie `200` sans rien " +
      "changer — rejouer un marquage n'est pas une faute. Une notification " +
      "appartenant à un autre produit le **même `404`** qu'une notification " +
      "inexistante : distinguer `403` et `404` révélerait l'existence d'une donnée " +
      "adressée à quelqu'un d'autre (`docs/029` §4.5, règles de non-fuite).",
    security: BEARER_SECURITY,
    parameters: [notificationIdParameter],
    responses: {
      200: jsonResponse("Notification marquée comme lue.", "Notification"),
      ...adminResponses({
        404: errorResponse(
          "`NOTIFICATION_NOT_FOUND` — aucune notification ne correspond à cet " +
            "identifiant **ou** elle appartient à un autre destinataire.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Demandes de prière                                                    */
  /* ---------------------------------------------------------------------- */

  const prayerRequestIdParameter = pathParameter(
    "id",
    "Identifiant UUID de la demande de prière (jamais un slug).",
    "uuid",
  );

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/prayer-requests`,
    operationId: "prayerRequestsSubmit",
    tags: ["prayer-requests"],
    summary: "Déposer une demande de prière",
    description:
      "**Route publique** : c'est le seul point d'écriture ouvert à un visiteur non " +
      "authentifié. Le corps est un objet **strict** : toute clé inconnue provoque un " +
      "400 plutôt que d'être ignorée, et un champ non prévu ne peut pas être injecté dans " +
      "la ligne.\n\n" +
      "La route est **rate-limitée à 5 dépôts par heure et par IP** " +
      "(`prayer-request.routes.ts`), en plus de la limite globale. Le compteur est indexé " +
      "sur l'adresse IP réelle (`trust proxy` activé pour Railway).\n\n" +
      "La réponse est volontairement minimale : ni le texte de l'intention, ni le prénom, " +
      "ni le contact ne sont renvoyés — ces données personnelles sensibles ne circulent " +
      "pas une seconde fois.",
    security: NO_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: CreatePrayerRequestBody } },
    },
    responses: {
      201: jsonResponse("Demande enregistrée.", "PrayerRequestCreated"),
      400: responseRef("ValidationError"),
      429: responseRef("RateLimitedPublicWrite"),
      500: responseRef("InternalError"),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/prayer-requests`,
    operationId: "prayerRequestsList",
    tags: ["prayer-requests"],
    summary: "Lister les demandes de prière",
    description:
      "**Administration uniquement.** Lecture jamais publique : le formulaire affirme au " +
      "visiteur que sa demande « ne sera jamais publiée sur Internet ni sur les réseaux " +
      "sociaux ». Ordre fixé par le serveur (date décroissante) ; aucun paramètre de tri " +
      "n'existe.",
    security: BEARER_SECURITY,
    parameters: [
      PAGE_PARAMETER,
      LIMIT_PARAMETER,
      enumQueryParameter(
        "status",
        "Filtrer par état. Omis ⇒ toutes les demandes.",
        ["NEW", "PRAYED"],
      ),
    ],
    responses: {
      200: jsonResponse("Collection paginée de demandes.", "PrayerRequestCollection"),
      ...adminResponses(),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/prayer-requests/{id}`,
    operationId: "prayerRequestsGet",
    tags: ["prayer-requests"],
    summary: "Lire une demande de prière",
    description:
      "Administration. Le message d'erreur est volontairement identique quelle que soit " +
      "la cause : rien à deviner pour un appelant non autorisé.",
    security: BEARER_SECURITY,
    parameters: [prayerRequestIdParameter],
    responses: {
      200: jsonResponse("Demande trouvée.", "PrayerRequest"),
      ...adminResponses({
        404: errorResponse(
          "`PRAYER_REQUEST_NOT_FOUND` — cette demande de prière est introuvable.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/prayer-requests/{id}`,
    operationId: "prayerRequestsUpdate",
    tags: ["prayer-requests"],
    summary: "Marquer une demande comme portée",
    description:
      "Administration. Une seule transition existe en V1 : `NEW → PRAYED`. Le corps est " +
      "un objet strict dont le seul champ autorisé est `status`, avec la seule valeur " +
      "littérale `PRAYED` — accepter `NEW` laisserait croire à un retour arrière que la " +
      "persistance ne sait pas exprimer. Renseigne `handledAt`.",
    security: BEARER_SECURITY,
    parameters: [prayerRequestIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: UpdatePrayerRequestBody } },
    },
    responses: {
      200: jsonResponse("Demande marquée comme portée.", "PrayerRequest"),
      ...adminResponses({
        400: errorResponse(
          "`VALIDATION_ERROR` — corps non conforme : clé inconnue, champ `status` absent, " +
            "ou valeur autre que la chaîne littérale `PRAYED`.",
        ),
        404: errorResponse(
          "`PRAYER_REQUEST_NOT_FOUND` — cette demande de prière est introuvable.",
        ),
      }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/prayer-requests/{id}`,
    operationId: "prayerRequestsDelete",
    tags: ["prayer-requests"],
    summary: "Supprimer une demande de prière",
    description: "Administration. Suppression définitive.",
    security: BEARER_SECURITY,
    parameters: [prayerRequestIdParameter],
    responses: {
      204: { description: "Demande supprimée : corps vide." },
      ...adminResponses({
        404: errorResponse(
          "`PRAYER_REQUEST_NOT_FOUND` — cette demande de prière est introuvable.",
        ),
      }),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Administration                                                        */
  /* ---------------------------------------------------------------------- */

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/admin/me`,
    operationId: "adminMe",
    tags: ["admin"],
    summary: "Profil de l'administrateur connecté",
    description:
      "Exige seulement d'être un **administrateur actif** (jeton valide + profil " +
      "`admin_profiles` présent et `isActive`), sans rôle supplémentaire : c'est l'appel " +
      "par lequel l'interface sait qui est connecté. Aucun identifiant n'est reçu — le " +
      "profil est déduit du jeton vérifié, jamais d'un paramètre d'URL, ce qui interdit de " +
      "lire le profil d'un autre administrateur.",
    security: BEARER_SECURITY,
    responses: {
      200: jsonResponse("Profil courant.", "AdminProfile"),
      401: responseRef("AuthenticationRequired"),
      403: responseRef("Forbidden"),
      429: responseRef("RateLimited"),
      500: responseRef("InternalError"),
    },
  });

  registerRoute(registry, {
    method: "get",
    path: `${API_BASE_PATH}/admin/profiles`,
    operationId: "adminProfilesList",
    tags: ["admin"],
    summary: "Lister les profils administratifs",
    description:
      "Annuaire administratif, avec l'état d'activation, la date de création et " +
      "l'adresse de connexion de chaque profil. Collection paginée, sans filtre " +
      "serveur.\n\n" +
      "**Cellule 1.4 — arbitrée** : ouverte au `SUPER_ADMIN` **et à l'`ADMIN`** " +
      "(Q-02 tranchée par le commanditaire). Lire l'annuaire n'autorise pas à " +
      "administrer les comptes qu'on y trouve : les cellules 1.5 et 1.6 restent " +
      "bornées aux responsables de département pour un acteur `ADMIN`, et XD-03 " +
      "lui interdit toute action contre un `SUPER_ADMIN`.",
    security: BEARER_SECURITY,
    parameters: PAGINATION_PARAMETERS,
    responses: {
      200: jsonResponse("Collection paginée de profils.", "AdminProfileCollection"),
      ...adminResponses(),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Gestion des comptes d'administration (Lot 2)                          */
  /* ---------------------------------------------------------------------- */

  registry.registerComponent("schemas", "AdminUserCreate", {
    type: "object",
    description:
      "Création d'un compte et de son habilitation (`docs/023` §6). Le rôle demandé " +
      "choisit la règle appliquée : un `ADMIN` peut créer un responsable et **rien " +
      "d'autre** (D-04) — demander un compte `ADMIN` ou `SUPER_ADMIN` produit un " +
      "`403`, exactement comme le décrit la séquence « opération interdite » de " +
      "`docs/023` §6. Le département est obligatoire pour un responsable et refusé " +
      "pour un rôle système (D-02, `docs/032` §3.1).",
    required: ["email", "username", "role"],
    properties: {
      email: { type: "string", format: "email", maxLength: 254 },
      username: { type: "string", minLength: 3, maxLength: 50 },
      displayName: { type: ["string", "null"], maxLength: 120 },
      role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] },
      departmentId: {
        type: ["string", "null"],
        format: "uuid",
        description: "Obligatoire pour `DEPARTMENT_MANAGER`, interdit sinon.",
      },
      password: {
        type: "string",
        minLength: 12,
        description:
          "Mot de passe **provisoire**, facultatif. S'il est omis, le serveur en " +
          "génère un — qui n'est **jamais** renvoyé par l'API dans les deux cas. " +
          "Aucun document n'arrête la remise du premier identifiant : c'est un point ouvert.",
      },
    },
  });

  registry.registerComponent("schemas", "AdminUserAuthorization", {
    type: "object",
    description:
      "Réécriture complète d'une habilitation (cellule 1.5). Les trois champs sont " +
      "obligatoires : la contrainte de cohérence `admin_profiles_scope_coherence` " +
      "porte sur le **triplet**, et accepter une modification partielle obligerait à " +
      "relire l'état courant — donc à écrire depuis un état périmé.",
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] },
      departmentId: { type: ["string", "null"], format: "uuid" },
    },
  });

  registry.registerComponent("schemas", "AdminUserActivation", {
    type: "object",
    description:
      "Activation ou désactivation (cellule 1.6). `isActive` porte le sens : " +
      "désactiver et réactiver sont la **même** habilitation, et une route par " +
      "direction laisserait croire à deux droits distincts.",
    required: ["isActive"],
    properties: { isActive: { type: "boolean" } },
  });

  registry.registerComponent("schemas", "AdminUserIdentity", {
    type: "object",
    description:
      "Correction de l'identité d'un compte. `username` et `displayName` vivent " +
      "dans `admin_profiles`, `email` chez le fournisseur d'identité — deux " +
      "écritures, deux autorités, donc **aucune transaction commune**. Au moins " +
      "un champ est exigé : une requête vide n'est pas une modification. Le rôle " +
      "et le périmètre ne figurent pas ici (cellule 1.5, autre permission).",
    minProperties: 1,
    properties: {
      username: { type: "string", minLength: 3, maxLength: 50 },
      displayName: { type: ["string", "null"], maxLength: 120 },
      email: { type: "string", format: "email", maxLength: 254 },
    },
  });

  registry.registerComponent("schemas", "AdminUserPassword", {
    type: "object",
    description:
      "Nouveau mot de passe. La valeur traverse le serveur **sans y être lue, " +
      "journalisée, stockée ni renvoyée** : elle part vers l'API d'administration " +
      "Supabase, qui l'empreinte elle-même. Aucun algorithme de hachage n'existe " +
      "dans le projet, et la réponse est un `204` sans corps.",
    required: ["password"],
    properties: {
      password: {
        type: "string",
        minLength: 12,
        maxLength: 200,
        description:
          "12 caractères au minimum (borne basse de `docs/030` §5). La politique " +
          "de complexité reste celle de Supabase : le fournisseur arbitre le refus.",
      },
    },
  });

  const adminUserIdParameter = {
    name: "id",
    in: "path" as const,
    required: true,
    schema: { type: "string" as const, format: "uuid" },
    description: "Identifiant `admin_profiles.id` du compte visé.",
  };

  registerRoute(registry, {
    method: "post",
    path: `${API_BASE_PATH}/admin/users`,
    operationId: "adminUsersCreate",
    tags: ["admin"],
    summary: "Créer un compte d'administration",
    description:
      "Crée le compte d'authentification puis son habilitation, et **compense** — en " +
      "supprimant le compte d'authentification — si l'écriture du profil échoue : on " +
      "ne laisse pas derrière soi un utilisateur capable de s'authentifier et dépourvu " +
      "de tout droit. Le mot de passe n'est jamais renvoyé. `409 DUPLICATE_EMAIL` si " +
      "l'adresse est déjà enregistrée ; `403` si le rôle demandé est hors du pouvoir " +
      "de l'appelant.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("AdminUserCreate") } },
    },
    responses: {
      201: jsonResponse("Compte créé.", "AdminProfileSummary"),
      ...adminResponses({ 409: responseRef("Conflict") }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/admin/users/{id}/authorization`,
    operationId: "adminUsersUpdateAuthorization",
    tags: ["admin"],
    summary: "Réécrire l'habilitation d'un compte",
    description:
      "Rôle, périmètre et rattachement.\n\n" +
      "**Cellule 1.5 — arbitrée** : ouverte au `SUPER_ADMIN` **et, pour les " +
      "responsables de département seulement, à l'`ADMIN`** (Q-02 tranchée). " +
      "Pour un acteur `ADMIN` : la cible doit être un `DEPARTMENT_MANAGER` et le " +
      "rôle écrit doit rester `DEPARTMENT_MANAGER` — promouvoir vers un rôle " +
      "qu'il ne détient pas serait s'attribuer un pouvoir par personne " +
      "interposée (D-03, D-04). Administrer un compte `SUPER_ADMIN` reste refusé " +
      "à tous (XD-03, Q-03).",
    security: BEARER_SECURITY,
    parameters: [adminUserIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("AdminUserAuthorization") } },
    },
    responses: {
      200: jsonResponse("Habilitation mise à jour.", "AdminProfileSummary"),
      ...adminResponses({ 404: responseRef("NotFound") }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/admin/users/{id}/activation`,
    operationId: "adminUsersSetActivation",
    tags: ["admin"],
    summary: "Désactiver ou réactiver un compte",
    description:
      "La révocation est **immédiate** (D-14) : le profil est mis à jour avant le " +
      "fournisseur d'identité, parce que c'est `is_active` que la chaîne d'accès relit " +
      "à chaque requête — donc ce qui invalide les jetons déjà émis. Une désactivation " +
      "ne touche pas au rôle : réactiver rend le compte tel qu'il était.\n\n" +
      "**Cellule 1.6 — arbitrée** : ouverte au `SUPER_ADMIN` **et, pour les " +
      "responsables de département seulement, à l'`ADMIN`** (Q-A4 tranchée). " +
      "Personne ne désactive son propre compte : ce serait un verrouillage. Pour " +
      "supprimer définitivement un compte, voir `DELETE /admin/users/{id}`.",
    security: BEARER_SECURITY,
    parameters: [adminUserIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("AdminUserActivation") } },
    },
    responses: {
      200: jsonResponse("État du compte mis à jour.", "AdminProfileSummary"),
      ...adminResponses({ 404: responseRef("NotFound") }),
    },
  });

  registerRoute(registry, {
    method: "delete",
    path: `${API_BASE_PATH}/admin/users/{id}`,
    operationId: "adminUsersDelete",
    tags: ["admin"],
    summary: "Supprimer définitivement un compte",
    description:
      "**Suppression physique et irréversible** du profil et du compte " +
      "d'authentification — à ne pas confondre avec la désactivation.\n\n" +
      "**Cellule 1.8 — arbitrée** : réservée au **`SUPER_ADMIN`** (Q-24 tranchée " +
      "par le commanditaire). Trois bornes s'appliquent : aucun compte " +
      "`SUPER_ADMIN` ne peut être supprimé (Q-03 — le dernier accès " +
      "d'administration est donc protégé), personne ne supprime son propre " +
      "compte, et un compte encore **auteur de droits d'accès média** ne peut pas " +
      "disparaître (`media_access.granted_by` est en `RESTRICT`) : la réponse est " +
      "alors `409`, avec la consigne de retirer ces autorisations.\n\n" +
      "Ordre des écritures : profil d'abord, compte d'authentification ensuite. " +
      "Si la seconde échoue, la réponse le dit explicitement — le compte " +
      "subsistant ne peut plus rien faire (aucun profil, donc aucun droit).",
    security: BEARER_SECURITY,
    parameters: [adminUserIdParameter],
    responses: {
      204: { description: "Compte supprimé. Aucun corps." },
      ...adminResponses({
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/admin/users/{id}/identity`,
    operationId: "adminUsersUpdateIdentity",
    tags: ["admin"],
    summary: "Corriger l'identité d'un compte",
    description:
      "Nom d'utilisateur, nom affiché et adresse de connexion. **Aucune cellule " +
      "de `docs/029` §2.1** ne couvre cette opération : l'hypothèse retenue est la " +
      "plus restrictive cohérente (alignée sur la cellule 1.5, donc `SUPER_ADMIN`), " +
      "déclarée `pending` dans `UserPolicy`. Les exclusions existantes s'appliquent " +
      "— XD-03 (un `ADMIN` n'administre pas un `SUPER_ADMIN`) et Q-03 (un " +
      "`SUPER_ADMIN` n'administre pas un pair).\n\n" +
      "L'adresse est écrite **avant** l'identité applicative : le fournisseur est " +
      "seul à pouvoir refuser pour un motif métier (adresse déjà prise). En cas " +
      "d'échec de la seconde écriture, la réponse **le dit** — l'adresse a changé, " +
      "le profil non.",
    security: BEARER_SECURITY,
    parameters: [adminUserIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("AdminUserIdentity") } },
    },
    responses: {
      200: jsonResponse("Profil mis à jour.", "AdminProfileSummary"),
      ...adminResponses({
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/admin/users/{id}/password`,
    operationId: "adminUsersSetPassword",
    tags: ["admin"],
    summary: "Réinitialiser le mot de passe d'un compte",
    description:
      "Réinitialisation **administrative** : aucun courriel n'est envoyé, la " +
      "valeur est transmise par HTTPS au backend puis à l'API d'administration " +
      "Supabase, qui l'empreinte. Aucun hachage n'est calculé par l'application, " +
      "et le secret ne figure ni dans une réponse, ni dans un journal, ni en base. " +
      "Réponse `204` sans corps.\n\n" +
      "Les sessions déjà ouvertes ne sont **pas** révoquées : un jeton reste " +
      "valide jusqu'à expiration. Pour couper un accès immédiatement, utilisez la " +
      "désactivation.",
    security: BEARER_SECURITY,
    parameters: [adminUserIdParameter],
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("AdminUserPassword") } },
    },
    responses: {
      204: { description: "Mot de passe redéfini. Aucun corps." },
      ...adminResponses({ 404: responseRef("NotFound") }),
    },
  });

  registerRoute(registry, {
    method: "patch",
    path: `${API_BASE_PATH}/admin/me/password`,
    operationId: "adminChangeOwnPassword",
    tags: ["admin"],
    summary: "Changer son propre mot de passe",
    description:
      "Aucun identifiant n'est reçu : la cible est l'identité du **jeton vérifié**. " +
      "Volontairement hors de `UserPolicy` — administrer son propre secret n'est pas " +
      "administrer autrui — et indispensable : Q-03 interdit à un `SUPER_ADMIN` " +
      "d'administrer un compte `SUPER_ADMIN`, y compris le sien, ce qui laisserait " +
      "le compte suprême sans moyen de faire tourner son mot de passe. La garde " +
      "reste réelle : administrateur **actif**. Réponse `204` sans corps.",
    security: BEARER_SECURITY,
    requestBody: {
      required: true,
      content: { "application/json": { schema: schemaRef("AdminUserPassword") } },
    },
    responses: {
      204: { description: "Mot de passe modifié. Aucun corps." },
      ...adminResponses(),
    },
  });

  /* ---------------------------------------------------------------------- */
  /*  Assemblage                                                            */
  /* ---------------------------------------------------------------------- */

  const generator = new OpenApiGeneratorV31(registry.definitions, {
    sortComponents: "alphabetically",
  });

  const document = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "API CCJV — Centre Chrétien Jésus ma Vie",
      version: "v1",
      description: [
        "API REST Express + TypeScript servant les contenus publics du site et le",
        "back-office d'administration.",
        "",
        "### Préfixe",
        `Toutes les routes métier sont montées sous \`${API_BASE_PATH}\`. Seul`,
        `\`GET ${API_BASE_PATH}/health\` échappe au rate limiting global. Une URL`,
        "inconnue sous ce préfixe produit `404 NOT_FOUND`, au format d'erreur standard.",
        "",
        "### Authentification",
        "Jeton porteur Supabase (`Authorization: Bearer <jeton>`), vérifié par",
        "`presentation/middlewares/auth.ts`. L'authentification auprès du fournisseur",
        "d'identité **ne confère aucun droit** : l'utilisateur doit en plus posséder un",
        "profil dans `admin_profiles`, actif, puis le **rôle requis par la policy de la",
        "ressource** pour l'action demandée. Chaque opération déclare son exigence :",
        "`security: []` pour une route publique, `bearerAuth` pour une route",
        "d'administration.",
        "",
        "### Enveloppes de réponse",
        "- collection : `{ data: [...], meta: { page, limit, total, totalPages } }` ;",
        "- ressource : la ressource directement, jamais enveloppée ;",
        "- erreur : `{ error: { code, message, details? } }` — forme unique, y compris",
        "  pour une erreur non maîtrisée ou une route inconnue.",
        "",
        "Trois listes bornées font exception à l'enveloppe de collection et renvoient",
        "`{ data: [...] }` **sans** `meta`, car elles ne sont pas paginées :",
        "`GET /scriptures`, `GET /schedule` et `GET /social-links`.",
        "",
        "Un corps JSON **mal formé** sort en `500 INTERNAL_ERROR` (et non en 400) :",
        "`express.json()` échoue avant le middleware `validate`. Comportement vérifié",
        "sur l'API en fonctionnement.",
        "",
        "### Paramètres de requête",
        "Les schémas de *query* sont des objets **stricts** : tout paramètre non reconnu",
        "est refusé en `400 VALIDATION_ERROR`, `details` nommant le paramètre fautif —",
        "jamais ignoré en silence. Une faute de frappe côté client devient donc une erreur",
        "exploitable, et la convention est identique sur **toutes** les routes.",
        "`?sort=…` n'est reconnu que là où un tri existe réellement (`GET /events`,",
        "`GET /publications`, en liste blanche de colonnes) ; ailleurs il est refusé,",
        "l'ordre étant fixé par le serveur. Les listes non paginées `GET /scriptures`,",
        "`GET /schedule` et `GET /social-links` ne reconnaissent **aucun** paramètre ;",
        "`GET /settings` et `GET /pages/:pageKey` valident également une *query* vide",
        "(`emptyQuerySchema`) et déclarent donc, eux aussi, un 400.",
        "",
        "### Limites",
        `- rate limiting global : 120 requêtes par minute et par IP (\`RATE_LIMIT_MAX\`),`,
        "  soit `429 RATE_LIMITED` ;",
        "- écriture publique `POST /prayer-requests` : 5 dépôts par heure et par IP ;",
        `- pagination : \`page\` ≥ 1 (défaut 1), \`limit\` 1–${MAX_PAGE_SIZE} (défaut ${DEFAULT_PAGE_SIZE}) ;`,
        "- corps JSON et `urlencoded` : 1 Mo maximum ; téléversement : limite de",
        "  `MAX_UPLOAD_BYTES` (5 Mio par défaut), type réel du fichier vérifié.",
        "",
        "### Source de vérité",
        "Document **généré** depuis l'implémentation : `npm run openapi` (script",
        "`src/presentation/openapi/generate.ts`), qui produit `openapi.json` et",
        "`openapi.yaml`. Les chemins et méthodes reprennent le montage réel de",
        "`src/app.ts` et des `*.routes.ts` ; les corps de requête sont les schémas Zod",
        "des modules eux-mêmes ; les codes d'erreur sont les 24 valeurs de l'union",
        "`ErrorCode` de `shared/errors/app-error.ts`.",
      ].join("\n"),
    },
    servers: [
      {
        url: "/",
        description:
          "Origine courante. Les chemins documentés incluent déjà le préfixe " +
          `${API_BASE_PATH} : l'URL effective est donc <origine>${API_BASE_PATH}/…`,
      },
      {
        url: "http://localhost:4000",
        description:
          "Développement local : `PORT` vaut 4000 par défaut (`config/env.ts`).",
      },
    ],
    tags: [
      {
        name: "Système",
        description:
          "Contrôle de santé, hors routers métier et hors rate limiting.",
      },
      {
        name: "departments",
        description:
          "Départements de l'église : lecture publique, écriture administration.",
      },
      {
        name: "events",
        description:
          "Événements : lecture publique (statut calculé), écriture administration.",
      },
      {
        name: "publications",
        description:
          "Médiathèque, actualités, enseignements et ressources, filtrés par " +
          "`category`. Les brouillons ne sont jamais visibles publiquement.",
      },
      {
        name: "leaders",
        description: "Responsables : lecture publique, écriture administration.",
      },
      {
        name: "testimonies",
        description: "Témoignages : lecture publique, écriture administration.",
      },
      {
        name: "community-faces",
        description:
          "Visages de la communauté : lecture publique, écriture administration.",
      },
      {
        name: "scriptures",
        description:
          "Versets identifiés par une clé d'URL. Liste non paginée.",
      },
      {
        name: "schedule",
        description:
          "Rythme hebdomadaire. Liste non paginée, sans lecture d'entrée isolée.",
      },
      {
        name: "social-links",
        description:
          "Réseaux sociaux ordonnés. Liste non paginée ; les liens sont aussi " +
          "exposés par `GET /settings`.",
      },
      {
        name: "settings",
        description:
          "Réglages institutionnels : document unique, clés d'écriture fermées.",
      },
      {
        name: "pages",
        description:
          "Contenus éditables des pages statiques, par clé de page.",
      },
      {
        name: "media",
        description:
          "Registre des médias téléversés. Entièrement administratif : aucune " +
          "de ces routes n'est publique.",
      },
      {
        name: "teachings",
        description:
          "Enseignements (sermons) : métadonnées, références bibliques et médias. " +
          "Lecture publique restreinte aux publications ; écriture réservée aux rôles " +
          "globaux. Chemin documenté : `/enseignements` (alias `/teachings`).",
      },
      {
        name: "resources",
        description:
          "Documents PDF téléchargeables de l'espace Ressources. Lecture publique, " +
          "écriture réservée aux rôles globaux. Chemin documenté : `/resources` " +
          "(alias `/ressources`).",
      },
      {
        name: "prayer-requests",
        description:
          "Demandes de prière. Dépôt public rate-limité ; toute lecture est " +
          "réservée à l'administration.",
      },
      {
        name: "admin",
        description:
          "Identité administrative et annuaire des profils. Aucune route publique.",
      },
    ],
    security: [],
  });

  return document as unknown as Record<string, unknown>;
}

export { API_BASE_PATH, ERROR_CODES };
