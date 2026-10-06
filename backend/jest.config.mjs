/**
 * Configuration Jest du backend CCJV.
 *
 * Le projet est en ESM (`"type": "module"` dans `package.json`) : Jest est donc
 * lancé avec `--experimental-vm-modules` (voir le script `test` de
 * `package.json`). Les fichiers `.ts` sont déclarés ESM via
 * `extensionsToTreatAsEsm`, ce qui fait que `@swc/jest` conserve la syntaxe
 * `import`/`export` au lieu de la transpiler en CommonJS.
 *
 * ## Pourquoi `@swc/jest`
 *
 * Le transformateur ne vérifie **aucun** type : ce rôle est déjà tenu par
 * `npm run typecheck` (`tsc --noEmit`), exécuté séparément. En échange, la
 * transformation est quasi instantanée et ne dépend pas de l'API du compilateur
 * TypeScript — un point qui compte avec TypeScript 7.
 *
 * ## Pourquoi `injectGlobals: false`
 *
 * Même parti pris que l'ancienne configuration Vitest (`globals: false`) :
 * chaque fichier de test importe explicitement `describe`, `it`, `expect` et
 * `jest` depuis `@jest/globals`. Ce qui est importé est visible, et une faute de
 * frappe sur un utilitaire devient une erreur de compilation plutôt qu'un échec
 * silencieux.
 *
 * ## Alias `@/`
 *
 * `moduleResolution: "bundler"` autorise des imports relatifs sans extension
 * dans `src/` (`./event.schema`). Jest, lui, résout les modules comme Node ;
 * `moduleNameMapper` couvre les deux formes (avec et sans `.js`) pour que la
 * même configuration fonctionne quel que soit le style d'import rencontré.
 */

import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('jest').Config} */
export default {
  rootDir,
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],

  // Les fichiers `.ts` sont traités comme de vrais modules ES.
  extensionsToTreatAsEsm: [".ts"],

  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: false, decorators: false },
          target: "es2022",
          // `verbatimModuleSyntax` est une contrainte de `tsc` : SWC élague de
          // lui-même les imports qui ne servent qu'au typage.
          preserveAllComments: false,
        },
        sourceMaps: "inline",
      },
    ],
  },

  moduleNameMapper: {
    // Alias `@/` → `backend/src/`, identique à `tsconfig.json` et à
    // `vitest.config.ts`.
    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Import relatif explicitement suffixé `.js` (style Node ESM) alors que le
    // fichier source est un `.ts`.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // `NODE_ENV=test` et `LOG_LEVEL=silent` sont posés avant tout import de
  // `src/`, exactement comme l'option `env` de Vitest le faisait.
  setupFiles: ["<rootDir>/tests/setup/env.ts"],

  injectGlobals: false,

  // Les tests d'intégration interrogent une base distante : la marge par défaut
  // de 5 s est trop courte pour un premier aller-retour réseau.
  testTimeout: 30_000,

  // Les erreurs non maîtrisées d'un test sont visibles telles quelles : utile
  // pour diagnostiquer une base injoignable sans masquer la cause.
  verbose: false,
};
