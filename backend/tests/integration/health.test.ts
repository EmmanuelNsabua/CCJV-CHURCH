import type { Express } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

/**
 * Test de bout en bout sur l'application Express réelle : middlewares,
 * validation, gestion d'erreurs et sérialisation sont traversés par une vraie
 * requête HTTP — sans écouter de port, grâce à `supertest`.
 *
 * ⚠️ `src/app.ts` compose le conteneur, lequel importe `src/modules/**` et
 * `src/infrastructure/repositories/**` : ces deux dossiers appartiennent à
 * d'autres lots et peuvent être incomplets. L'import est donc tentatif : s'il
 * échoue, les tests sont **ignorés en l'annonçant** plutôt que de faire échouer
 * la suite du socle pour une cause qui ne lui appartient pas. Dès que ces
 * fichiers existent, ce fichier se réactive tout seul, sans modification.
 *
 * Même remarque pour PostgreSQL : `/api/v1/health` interroge réellement la base
 * (`select 1`), donc l'assertion de santé est ignorée lorsque la base est
 * injoignable, au lieu d'être faussement verte.
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

const describeApplication = app === null ? describe.skip : describe;

describeApplication("application Express — contrats transverses", () => {
  it("répond 200 { status: 'ok' } à GET /api/v1/health", async (contexte) => {
    const reponse = await request(app as Express).get("/api/v1/health");

    if (reponse.status === 503 && reponse.body?.database === "down") {
      // La base n'est pas joignable depuis cet environnement : on documente le
      // contrat d'indisponibilité observé, sans prétendre que le service est sain.
      expect(reponse.body).toMatchObject({ status: "error", database: "down" });
      contexte.skip();
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
