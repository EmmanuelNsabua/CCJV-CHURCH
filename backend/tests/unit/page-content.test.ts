import { describe, expect, it, jest } from "@jest/globals";
import type { StaticPage } from "@/domain/entities";
import type { StaticPageRepository } from "@/domain/repositories";
import {
  getPageContentSchema,
  isKnownPageKey,
  knownPageKeys,
  pageContentSchemas,
} from "@/domain/content/page-content";
import { StaticPageService } from "@/modules/static-pages/static-page.service";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Registre des contenus de page (`domain/content/page-content.ts`).
 *
 * `public.static_pages.content` est un `jsonb` : sans registre, n'importe quelle
 * forme pourrait y être écrite et le frontend se retrouverait avec un contenu
 * qu'il ne sait pas lire. Ces tests fixent les trois garanties annoncées par le
 * module :
 *
 * 1. seules les `pageKey` déclarées sont éditables ;
 * 2. un contenu non conforme au schéma de la page est refusé ;
 * 3. les clés héritées du prototype (`toString`, `constructor`…) ne sont
 *    **pas** considérées comme connues.
 */

/* -------------------------------------------------------------------------- */
/*  Fabrique                                                                  */
/* -------------------------------------------------------------------------- */

/** Double du contrat `StaticPageRepository` — les écritures sont capturées. */
function fakeStaticPageRepository(stored: StaticPage | null = null) {
  const ecritures: { pageKey: string; content: Record<string, unknown> }[] = [];

  const repository: StaticPageRepository = {
    async findByKey(pageKey) {
      return stored !== null && stored.pageKey === pageKey ? stored : null;
    },
    async upsert(pageKey, content, updatedBy) {
      ecritures.push({ pageKey, content });
      return {
        id: "page-1",
        pageKey,
        content,
        updatedBy,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };
    },
  };

  return { repository, ecritures };
}

function expectAppError(
  received: unknown,
  code: AppError["code"],
  statusCode: number,
): AppError {
  expect(isAppError(received)).toBe(true);
  const error = received as AppError;
  expect(error.code).toBe(code);
  expect(error.statusCode).toBe(statusCode);
  return error;
}

async function capture(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

/** Contenu minimal conforme de la page `accueil`. */
const ACCUEIL_VALIDE = {
  heroTitle: "Bienvenue au CCJV",
  heroIntro: "Une église, une famille.",
};

/* -------------------------------------------------------------------------- */
/*  Registre                                                                  */
/* -------------------------------------------------------------------------- */

describe("registre des pages — clés connues", () => {
  it("expose un schéma pour chaque clé déclarée", () => {
    expect(knownPageKeys.length).toBeGreaterThan(0);

    for (const pageKey of knownPageKeys) {
      expect(isKnownPageKey(pageKey)).toBe(true);
      expect(getPageContentSchema(pageKey)).toBeDefined();
      expect(typeof getPageContentSchema(pageKey)?.safeParse).toBe("function");
    }
  });

  it("déclare les pages réellement servies par le frontend", () => {
    expect(new Set(knownPageKeys)).toEqual(
      new Set([
        "accueil",
        "qui-sommes-nous",
        "organisation",
        "communaute",
        "vie-de-leglise",
        "publications",
      ]),
    );
  });

  it("accepte un contenu conforme au schéma de la page", () => {
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse(ACCUEIL_VALIDE);

    expect(resultat?.success).toBe(true);
    if (resultat?.success) {
      expect(resultat.data).toEqual(ACCUEIL_VALIDE);
    }
  });

  it("accepte les compléments éditoriaux facultatifs", () => {
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse({
      ...ACCUEIL_VALIDE,
      pastorHeading: "Le mot du pasteur",
      pastorMessage: "Un message.",
    });

    expect(resultat?.success).toBe(true);
  });

  it("nettoyage les espaces autour des valeurs textuelles", () => {
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse({
      heroTitle: "  Bienvenue  ",
      heroIntro: "  Une église.  ",
    });

    expect(resultat?.success).toBe(true);
    if (resultat?.success) {
      expect(resultat.data).toEqual({
        heroTitle: "Bienvenue",
        heroIntro: "Une église.",
      });
    }
  });
});

describe("registre des pages — clés inconnues", () => {
  it("ne retourne aucun schéma pour une clé inconnue", () => {
    for (const pageKey of ["", "inconnue", "ACCUEIL", "accueil/", "admin"]) {
      expect(isKnownPageKey(pageKey)).toBe(false);
      expect(getPageContentSchema(pageKey)).toBeUndefined();
    }
  });

  it("ne considère pas une clé héritée du prototype comme connue", () => {
    // Sans `Object.hasOwn`, `pageContentSchemas["toString"]` renverrait la
    // fonction héritée de `Object.prototype`, et la page serait « éditable ».
    for (const pageKey of ["toString", "constructor", "hasOwnProperty", "__proto__"]) {
      expect(isKnownPageKey(pageKey)).toBe(false);
      expect(getPageContentSchema(pageKey)).toBeUndefined();
    }
  });

  it("n'expose que des champs textuels nommés, jamais de HTML", () => {
    // Les valeurs sont affichées comme du texte : un schéma qui accepterait un
    // champ libre ouvrirait la porte à du balisage injecté.
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse(ACCUEIL_VALIDE);

    expect(resultat?.success).toBe(true);
    expect(Object.keys(pageContentSchemas)).toEqual([...knownPageKeys]);
  });
});

describe("registre des pages — contenus refusés", () => {
  it("refuse un contenu sans champ obligatoire", () => {
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse({ heroTitle: "Bienvenue" });

    expect(resultat?.success).toBe(false);
  });

  it("refuse un champ obligatoire vide ou composé d'espaces", () => {
    const schema = getPageContentSchema("accueil");

    expect(
      schema?.safeParse({ ...ACCUEIL_VALIDE, heroTitle: "" }).success,
    ).toBe(false);
    expect(
      schema?.safeParse({ ...ACCUEIL_VALIDE, heroTitle: "   " }).success,
    ).toBe(false);
  });

  it("refuse un champ obligatoire trop long", () => {
    const schema = getPageContentSchema("accueil");

    expect(
      schema?.safeParse({ ...ACCUEIL_VALIDE, heroTitle: "a".repeat(121) }).success,
    ).toBe(false);
    expect(
      schema?.safeParse({ ...ACCUEIL_VALIDE, heroIntro: "a".repeat(601) }).success,
    ).toBe(false);
  });

  it("refuse un type de valeur inattendu", () => {
    const schema = getPageContentSchema("accueil");

    expect(schema?.safeParse({ heroTitle: 42, heroIntro: "Une église." }).success).toBe(
      false,
    );
    expect(schema?.safeParse([]).success).toBe(false);
    expect(schema?.safeParse(null).success).toBe(false);
  });

  it("rejette le contenu d'une autre page", () => {
    // Les clés diffèrent d'une page à l'autre : `title`/`intro` ne sont pas
    // valides pour `accueil`.
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse({ title: "Organisation", intro: "Une église." });

    expect(resultat?.success).toBe(false);
  });

  it("valide chaque page déclarée avec son propre schéma", () => {
    const contenus: Record<string, Record<string, unknown>> = {
      accueil: ACCUEIL_VALIDE,
      "qui-sommes-nous": { title: "Qui sommes-nous", intro: "Notre histoire." },
      organisation: { title: "Organisation", intro: "Nos départements." },
      communaute: { title: "Communauté", intro: "Nos visages." },
      "vie-de-leglise": { title: "Vie de l'église", intro: "Notre rythme." },
      publications: { title: "Publications", intro: "Nos ressources." },
    };

    for (const pageKey of knownPageKeys) {
      const schéma = getPageContentSchema(pageKey);
      const resultat = schéma?.safeParse(contenus[pageKey]);

      expect({ pageKey, success: resultat?.success }).toEqual({
        pageKey,
        success: true,
      });
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Service : application du registre                                         */
/* -------------------------------------------------------------------------- */

describe("StaticPageService — application du registre", () => {
  it("valide et transmet le contenu d'une page connue", async () => {
    const { repository, ecritures } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const page = await service.updateContent("accueil", ACCUEIL_VALIDE, null);

    expect(ecritures).toHaveLength(1);
    expect(ecritures[0]).toEqual({
      pageKey: "accueil",
      content: ACCUEIL_VALIDE,
    });
    expect(page.pageKey).toBe("accueil");
  });

  it("retire les champs non déclarés avant l'écriture", async () => {
    const { repository, ecritures } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    await service.updateContent(
      "accueil",
      { ...ACCUEIL_VALIDE, html: "<script>alert(1)</script>" },
      null,
    );

    // Le schéma est un `z.object` : les clés inconnues sont élaguées, elles ne
    // peuvent donc pas atteindre le `jsonb`.
    expect(ecritures[0]?.content).toEqual(ACCUEIL_VALIDE);
    expect(ecritures[0]?.content).not.toHaveProperty("html");
  });

  it("rejette une pageKey inconnue avec PAGE_NOT_FOUND (404)", async () => {
    const { repository, ecritures } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const error = expectAppError(
      await capture(service.updateContent("inconnue", ACCUEIL_VALIDE, null)),
      "PAGE_NOT_FOUND",
      404,
    );

    expect(error.details).toEqual({ pageKey: "inconnue" });
    expect(ecritures).toHaveLength(0);
  });

  it("rejette une pageKey inconnue en lecture aussi", async () => {
    const { repository } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    expectAppError(
      await capture(service.getByKey("toString")),
      "PAGE_NOT_FOUND",
      404,
    );
  });

  it("rejette un contenu non conforme avec VALIDATION_ERROR (400)", async () => {
    const { repository, ecritures } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const error = expectAppError(
      await capture(service.updateContent("accueil", { heroTitle: "" }, null)),
      "VALIDATION_ERROR",
      400,
    );

    expect(error.message).toContain("accueil");
    expect(Array.isArray(error.details)).toBe(true);
    expect(ecritures).toHaveLength(0);
  });

  it("nomme les champs fautifs dans le détail de l'erreur", async () => {
    const { repository } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const error = expectAppError(
      await capture(service.updateContent("accueil", {}, null)),
      "VALIDATION_ERROR",
      400,
    );

    const details = error.details as { champ: string; message: string }[];
    expect(details.map((detail) => detail.champ).sort()).toEqual([
      "heroIntro",
      "heroTitle",
    ]);
  });

  it("répond PAGE_NOT_FOUND quand la page connue n'a pas encore de contenu", async () => {
    const { repository } = fakeStaticPageRepository(null);
    const service = new StaticPageService(repository);

    const error = expectAppError(
      await capture(service.getByKey("accueil")),
      "PAGE_NOT_FOUND",
      404,
    );

    expect(error.message).toContain("pas encore de contenu");
  });

  it("rend le contenu enregistré d'une page connue", async () => {
    const { repository } = fakeStaticPageRepository({
      id: "page-1",
      pageKey: "accueil",
      content: ACCUEIL_VALIDE,
      updatedBy: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const service = new StaticPageService(repository);

    await expect(service.getByKey("accueil")).resolves.toMatchObject({
      pageKey: "accueil",
      content: ACCUEIL_VALIDE,
    });
  });

  it("enregistre l'auteur de la modification tel quel", async () => {
    const { repository } = fakeStaticPageRepository();
    const upsert = jest.spyOn(repository, "upsert");
    const service = new StaticPageService(repository);

    await service.updateContent("accueil", ACCUEIL_VALIDE, "admin-1");

    expect(upsert).toHaveBeenCalledWith("accueil", ACCUEIL_VALIDE, "admin-1");
  });
});
