/**
 * Environnement des tests, appliqué avant le moindre import de `src/`.
 *
 * `setupFiles` s'exécute avant l'installation du framework de test et avant le
 * chargement du fichier de test : `src/config/env.ts` lit `process.env` à
 * l'import, la valeur doit donc être posée ici et non dans un `beforeAll`.
 *
 * `NODE_ENV=test` a deux effets vérifiables dans le code :
 *
 * - `src/app.ts` n'installe pas `pino-http` (pas de journal par requête) ;
 * - `src/infrastructure/database/client.ts` réduit le pool à 2 connexions.
 *
 * `dotenv/config` (importé par `src/config/env.ts`) ne remplace jamais une
 * variable déjà définie : ces valeurs-ci gagnent donc sur `backend/.env`.
 */

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";

export {};
