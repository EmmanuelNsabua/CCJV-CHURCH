import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuration Vitest du backend CCJV.
 *
 * Les tests du socle s'exécutent **sans base de données** : les repositories
 * sont remplacés par des doubles et les middlewares sont appelés directement,
 * ce qui permet de valider les règles métier et l'autorisation sur n'importe
 * quelle machine, y compris en intégration continue (`docs/004` §27).
 *
 * `globals: false` : chaque test importe explicitement `describe`, `it`,
 * `expect`… Ce qui est importé est ainsi visible, et une faute de frappe sur un
 * utilitaire est une erreur de compilation, pas un échec silencieux.
 */
export default defineConfig({
  resolve: {
    // Même alias que `tsconfig.json` : `@/` désigne `backend/src/`.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    // Aucun fichier de test ne doit toucher le réseau : `src/infrastructure/
    // supabase/auth.ts` crée un jeu de clés JWKS distant à l'import, mais ne
    // l'interroge que lors d'une vérification de jeton réel.
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
    },
  },
});
