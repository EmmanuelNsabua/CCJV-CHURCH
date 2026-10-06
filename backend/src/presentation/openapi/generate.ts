/**
 * Génération de la documentation OpenAPI.
 *
 * Écrit `backend/openapi.json` et `backend/openapi.yaml` à partir du document
 * construit dans `./document.ts`, puis affiche un résumé de contrôle.
 *
 * Usage : `npm run openapi` (script `tsx src/presentation/openapi/generate.ts`).
 *
 * Deux formats pour un même contenu : le JSON est la référence exploitable par
 * les outils, le YAML est la forme lisible et versionnable. Le YAML est écrit
 * par un émetteur local — le projet n'ajoute aucune dépendance npm pour cela.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildOpenApiDocument } from "./document";

/* -------------------------------------------------------------------------- */
/*  Sortie YAML                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Clés et valeurs pouvant être écrites sans guillemets.
 *
 * Volontairement restrictif : tout le reste est émis entre guillemets doubles,
 * ce qui évite les pièges classiques du YAML (deux-points, `#`, `-`, chaînes
 * qui ressemblent à des nombres, `200` interprété comme entier).
 */
const PLAIN_SCALAR = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Mots réservés YAML : une chaîne qui les vaut doit être citée. */
const RESERVED_SCALARS = new Set([
  "true",
  "false",
  "yes",
  "no",
  "on",
  "off",
  "null",
  "y",
  "n",
  "True",
  "False",
  "Null",
  "NULL",
  "YES",
  "NO",
  "ON",
  "OFF",
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Représentation d'une valeur scalaire, sur une seule ligne. */
function scalarToYaml(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }
  if (typeof value === "string") {
    return PLAIN_SCALAR.test(value) && !RESERVED_SCALARS.has(value)
      ? value
      : JSON.stringify(value);
  }
  return JSON.stringify(value);
}

/** Une clé de mapping : identifiant simple, sinon citée. */
const keyToYaml = (key: string): string =>
  PLAIN_SCALAR.test(key) && !RESERVED_SCALARS.has(key)
    ? key
    : JSON.stringify(key);

/**
 * Sérialise une valeur en lignes YAML en style bloc.
 *
 * Les séquences utilisent la forme compacte `- clé: valeur` puis alignent les
 * clés suivantes sur la même colonne, comme le ferait un émoteur standard.
 */
function toYamlLines(value: unknown, level: number): string[] {
  const pad = "  ".repeat(level);

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    return value.flatMap((item) => {
      const compact =
        (isPlainObject(item) && Object.keys(item).length > 0) ||
        (Array.isArray(item) && item.length > 0);
      if (!compact) return [`${pad}- ${scalarToYaml(item)}`];
      const inner = toYamlLines(item, level + 1);
      const [first, ...rest] = inner;
      // `pad` + « - » + espace occupe exactement l'indentation de l'enfant :
      // les lignes suivantes restent alignées sur la première clé.
      return [`${pad}- ${(first ?? "").trimStart()}`, ...rest];
    });
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return [`${pad}{}`];
    return entries.flatMap(([key, entryValue]) => {
      const keyText = keyToYaml(key);
      const nested =
        (isPlainObject(entryValue) && Object.keys(entryValue).length > 0) ||
        (Array.isArray(entryValue) && entryValue.length > 0);
      return nested
        ? [`${pad}${keyText}:`, ...toYamlLines(entryValue, level + 1)]
        : [`${pad}${keyText}: ${scalarToYaml(entryValue)}`];
    });
  }

  return [`${pad}${scalarToYaml(value)}`];
}

function toYaml(value: unknown): string {
  return `${toYamlLines(value, 0).join("\n")}\n`;
}

/* -------------------------------------------------------------------------- */
/*  Génération                                                               */
/* -------------------------------------------------------------------------- */

/** `src/presentation/openapi` (ou `dist/presentation/openapi`) → `backend/`. */
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const jsonPath = resolve(backendRoot, "openapi.json");
const yamlPath = resolve(backendRoot, "openapi.yaml");

interface DocumentShape {
  paths?: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown>; responses?: Record<string, unknown> };
  tags?: unknown[];
}

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
];

function summarize(document: DocumentShape): void {
  const paths = document.paths ?? {};
  const pathNames = Object.keys(paths);

  let operations = 0;
  let publicOperations = 0;
  let adminOperations = 0;

  for (const pathItem of Object.values(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.includes(method)) continue;
      operations += 1;
      const security = (operation as { security?: unknown[] }).security;
      if (Array.isArray(security) && security.length === 0) {
        publicOperations += 1;
      } else {
        adminOperations += 1;
      }
    }
  }

  const schemas = Object.keys(document.components?.schemas ?? {});
  const responses = Object.keys(document.components?.responses ?? {});

  const lines = [
    "",
    "Documentation OpenAPI générée.",
    `  ${jsonPath}`,
    `  ${yamlPath}`,
    "",
    `  chemins            : ${pathNames.length}`,
    `  opérations         : ${operations}`,
    `    publiques        : ${publicOperations}  (security: [])`,
    `    administration   : ${adminOperations}  (security: bearerAuth)`,
    `  catégories (tags)  : ${document.tags?.length ?? 0}`,
    `  schémas réutilisés : ${schemas.length}`,
    `  réponses réutilisées : ${responses.length}`,
    "",
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

function main(): void {
  const document = buildOpenApiDocument() as DocumentShape;

  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  writeFileSync(yamlPath, toYaml(document), "utf8");

  summarize(document);
}

main();
