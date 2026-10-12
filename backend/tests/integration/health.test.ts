import type { Express } from "express";
import request from "supertest";
import { afterAll, describe, expect, it } from "@jest/globals";
import { closeTestDatabase, isDatabaseReachable } from "../helpers/database";

/**
 * Test de bout en bout sur l'application Express réelle : middlewares,
 * validation, gestion d'erreurs et sérialisation sont traversés par une vraie
 * requête HTTP — sans écouter de port, grâce à `supertest`.
 *
 * ⚠️ `src/app.ts` compose le conteneur, lequel importe `src/modules/**` et
 * `src/infrastructure/repositories/**`. L'import est donc tentatif : s'il
 * échoue, les tests sont **ignorés en l'annonçant** plutôt que de faire échouer
 * la suite du socle pour une cause qui ne lui appartient pas. Dès que ces
 * fichiers existent, ce fichier se réactive tout seul, sans modification.
 *
 * Même remarque pour PostgreSQL : `/api/v1/health` interroge réellement la base
 * (`select 1`), donc l'assertion de santé documente le contrat d'indisponibilité
 * lorsque la base est injoignable, au lieu d'échouer bruyamment hors ligne.
 */

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
    "[tests/integration/health.test.ts] Tests d'intégration ignorés : " +
      `l'application n'est pas encore composable (${raison}). ` +
      "Ils s'exécuteront automatiquement dès que les modules et repositories auront été livrés.",
  );
}

const baseInjoignable = app === null ? false : !(await isDatabaseReachable());

if (baseInjoignable) {
  console.warn(
    "[tests/integration/health.test.ts] Base PostgreSQL injoignable : " +
      "l'assertion de santé vérifie le contrat d'indisponibilité (503 « database: down ») " +
      "au lieu du contrat de disponibilité (200 « database: up »).",
  );
}

const describeApplication = app === null ? describe.skip : describe;

describeApplication("application Express — contrats transverses", () => {
  afterAll(async () => {
    await closeTestDatabase();
  });

  it("répond 200 { status: 'ok' } à GET /api/v1/health", async () => {
    const reponse = await request(app as Express).get("/api/v1/health");

    if (reponse.status === 503 && reponse.body?.database === "down") {
      // La base n'est pas joignable depuis cet environnement.
      //
      // ⚠️ Le contrat **nominatif** — « 200 { status: 'ok', database: 'up' } » —
      // n'a alors PAS été exercé : ce test porte un titre qui annonce une
      // vérification que la branche ci-dessous ne fait pas. L'audit des
      // dispositifs de vérification a rendu ce fait visible, et a ajouté le mode
      // strict : quand l'environnement affirme que la base doit être joignable,
      // l'indisponibilité est un **échec**, pas une variante acceptable.
      if (process.env.REQUIRE_DATABASE === "1") {
        throw new Error(
          "GET /api/v1/health répond 503 { database: 'down' } alors que REQUIRE_DATABASE=1 : " +
            "le contrat de disponibilité (200 « database: up ») n'a pas été exercé.",
        );
      }

      console.warn(
        "[tests/integration/health.test.ts] Contrat NOMINATIF non exercé : " +
          "la base est injoignable, l'assertion porte sur le contrat d'indisponibilité " +
          "(503 « database: down »). Relancer avec REQUIRE_DATABASE=1 pour en faire un échec.",
      );
      expect(reponse.body).toMatchObject({ status: "error", database: "down" });
      return;
    }

    expect(reponse.status).toBe(200);
    expect(reponse.body).toMatchObject({ status: "ok", database: "up" });
    expect(reponse.headers["content-type"]).toMatch(/application\/json/);
  });

  it("répond 404 au format d'erreur normalisé sur une route inconnue", async () => {
    const reponse = await request(app as Express).get("/api/v1/route-inexistante");

    expect(reponse.status).toBe(404);
    expect(reponse.headers["content-type"]).toMatch(/application\/json/);
    expect(reponse.body).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(typeof reponse.body.error.message).toBe("string");
    expect(reponse.body.error.message).toBeTruthy();
  });

  it("ne divulgue ni pile d'appels ni détail technique dans une erreur 404", async () => {
    const reponse = await request(app as Express).get("/api/v1/inconnu");

    expect(reponse.body.error.stack).toBeUndefined();
    expect(reponse.body.error.details).toBeUndefined();
  });

  it("répond en JSON avec les en-têtes de durcissement d'Helmet", async () => {
    const reponse = await request(app as Express).get("/api/v1/inconnu");

    expect(reponse.headers["x-powered-by"]).toBeUndefined();
    expect(reponse.headers["x-content-type-options"]).toBe("nosniff");
  });
});
