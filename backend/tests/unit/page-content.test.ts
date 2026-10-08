import { describe, expect, it } from "@jest/globals";
import type { ZodType } from "zod";
import { z } from "zod";
import type { StaticPage } from "@/domain/entities";
import type { StaticPageRepository } from "@/domain/repositories";
import {
  PAGE_CONTENT_CONTRACTS,
  getPageContentSchema,
  isKnownPageKey,
  knownPageKeys,
  normalizePageContent,
  readPageContent,
} from "@/domain/content/page-content";
import {
  pageContentUpdateSchema,
  pageParamsSchema,
} from "@/modules/static-pages/static-page.schema";
import { StaticPageService } from "@/modules/static-pages/static-page.service";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Registre des contenus de page — **conformité à `docs/031`**.
 *
 * `public.static_pages.content` est un `jsonb` : sans contrat, n'importe quelle
 * forme pourrait y être écrite et le frontend se retrouverait avec un contenu
 * qu'il ne sait pas lire. Ces tests fixent quatre choses, dans cet ordre :
 *
 * 1. **le registre est celui du document** — huit `pageKey`, et les compteurs de
 *    champs de `docs/031` §8 (42 / 44 / 33 / 25 / 38 / 3 / 29 / 13). C'est le
 *    contrôle le plus important du fichier : il transforme une table de synthèse
 *    en invariant exécutable, et il détecte aussi bien un champ oublié qu'un
 *    champ inventé ;
 * 2. **l'écriture est stricte** — une clé non reconnue est **refusée**, jamais
 *    élaguée (`docs/031` §3.4) ;
 * 3. **la lecture est tolérante** — elle ne lève jamais, et ce qu'elle ne sait
 *    pas lire est **omis**, jamais remplacé (`docs/031` §3.5 règle C, §4.3) ;
 * 4. **le service applique les deux** sans les confondre.
 */

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
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

function storedPage(content: Record<string, unknown>, pageKey = "accueil"): StaticPage {
  return {
    id: "page-1",
    pageKey,
    content,
    updatedBy: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
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

/** Champs du contrat — `strictObject` garantit `.shape`. */
function shapeOf(pageKey: string): Record<string, ZodType> {
  const schema = getPageContentSchema(pageKey);
  if (!(schema instanceof z.ZodObject)) {
    throw new Error(`Le contrat de « ${pageKey} » n'est pas un objet`);
  }
  return schema.shape as Record<string, ZodType>;
}

/**
 * Un champ est **obligatoire** si `undefined` ne le satisfait pas.
 *
 * C'est la définition opérante, et non une lecture de la source : `opt(max)` et
 * `cta()` sont des `text(max).optional()`, donc facultatifs ; `text(max)` ne
 * l'est pas. Le test mesure ainsi le contrat tel qu'il se comporte.
 */
function requiredFields(pageKey: string): string[] {
  return Object.entries(shapeOf(pageKey))
    .filter(([, field]) => !field.safeParse(undefined).success)
    .map(([name]) => name)
    .sort();
}

/** Contenu minimal conforme : les champs obligatoires, et eux seuls. */
function minimalContent(pageKey: string): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const name of requiredFields(pageKey)) {
    // `title`/`intro` sont les identités déjà persistées (§8) ; le seul autre
    // champ obligatoire de la spécification est un titre de hero.
    content[name] = name === "title" ? "Titre" : name === "intro" ? "Introduction" : "Texte";
  }
  return content;
}

/** Contenu minimal conforme de la page `accueil`. */
const ACCUEIL_VALIDE = {
  heroTitle: "Bienvenue au CCJV",
  heroIntro: "Une église, une famille.",
};

/* -------------------------------------------------------------------------- */
/*  1. Conformité au document                                                 */
/* -------------------------------------------------------------------------- */

describe("registre — les huit pages de docs/031 §3.2", () => {
  it("déclare exactement les huit clés du document, dans son ordre", () => {
    // §3.5 règle D : « Les huit `pageKey` de ce document sont la liste complète.
    // Ajouter une page, une section ou un champ obligatoire est un acte de
    // Phase 6, pas une extension silencieuse. »
    expect([...knownPageKeys]).toEqual([
      "accueil",
      "qui-sommes-nous",
      "evenements",
      "ou-nous-trouver",
      "faire-un-don",
      "communaute",
      "organisation",
      "departement",
    ]);
  });

  it("expose un contrat strict pour chaque clé déclarée", () => {
    for (const pageKey of knownPageKeys) {
      expect(isKnownPageKey(pageKey)).toBe(true);

      const schema = getPageContentSchema(pageKey);
      expect(schema).toBeDefined();
      // `strictObject` et non `object` : §3.2 l'exige, et c'est ce qui fait
      // refuser une clé inconnue au lieu de l'élaguer en silence.
      expect(schema instanceof z.ZodObject).toBe(true);
      expect((schema as z.ZodObject).strict).toBeTruthy();
    }
  });

  /**
   * **Le contrôle de transcription.** `docs/031` §8 donne, page par page, le
   * nombre de champs éditables et le nombre de champs obligatoires. Les deux
   * colonnes sont vérifiées ici : un champ oublié, un champ inventé ou une
   * obligation ajoutée font échouer le test, avec le nom de la page fautive.
   */
  it("compte les champs de docs/031 §8 : 227 champs de contrat, 11 obligatoires", () => {
    const attendu: Record<string, { champs: number; obligatoires: number }> = {
      accueil: { champs: 42, obligatoires: 2 },
      "qui-sommes-nous": { champs: 44, obligatoires: 2 },
      evenements: { champs: 33, obligatoires: 1 },
      "ou-nous-trouver": { champs: 25, obligatoires: 1 },
      "faire-un-don": { champs: 38, obligatoires: 1 },
      communaute: { champs: 3, obligatoires: 2 },
      organisation: { champs: 29, obligatoires: 2 },
      // Le gabarit `departement` ne porte **aucun** champ obligatoire : ses deux
      // obligations sont celles de l'entité `Department` (`name`, `slug`), qui
      // vit dans `departments`, jamais dans `static_pages.content` (§2.8).
      departement: { champs: 13, obligatoires: 0 },
    };

    let totalChamps = 0;
    let totalObligatoires = 0;

    for (const [pageKey, expected] of Object.entries(attendu)) {
      const shape = shapeOf(pageKey);
      const required = requiredFields(pageKey);

      expect({
        pageKey,
        champs: Object.keys(shape).length,
        obligatoires: required.length,
      }).toEqual({ pageKey, ...expected });

      totalChamps += Object.keys(shape).length;
      totalObligatoires += required.length;
    }

    // §8 annonce 238 champs : 227 de contrat + les 11 de l'entité `Department`
    // (partie A de §2.8), qui ne sont pas dans `Page.content` — le document le
    // dit explicitement, et un test qui les compterait ici exigerait de
    // dupliquer la donnée.
    expect(totalChamps).toBe(227);

    // §8 annonce 13 champs obligatoires : 11 dans les contrats, plus `name` et
    // `slug` de `Department`. La soustraction est vérifiée plutôt que constatée.
    expect(totalObligatoires).toBe(11);
    expect(totalObligatoires + 2).toBe(13);
  });

  it("n'accepte comme obligatoires que des identités de page", () => {
    const obligatoires = knownPageKeys.flatMap((pageKey) =>
      requiredFields(pageKey).map((champ) => `${pageKey}.${champ}`),
    );

    // §8 : « Les 13 champs obligatoires sont exclusivement des identités de page
    // déjà existantes : les `title`/`intro` déjà persistés pour accueil,
    // qui-sommes-nous, organisation, communaute, les `name`/`slug` de l'entité
    // `Department`, et le titre de hero de chaque page créée. »
    expect(obligatoires.sort()).toEqual([
      "accueil.heroIntro",
      "accueil.heroTitle",
      "communaute.intro",
      "communaute.title",
      "evenements.title",
      "faire-un-don.title",
      "organisation.intro",
      "organisation.title",
      "ou-nous-trouver.title",
      "qui-sommes-nous.intro",
      "qui-sommes-nous.title",
    ]);

    // Aucun libellé de CTA ni champ facultatif ne peut être obligatoire : §3.5
    // règle A.4 interdit de rendre obligatoire un champ qui ne l'était pas.
    for (const champ of obligatoires) {
      const nom = champ.split(".")[1] ?? "";
      expect({ champ, identite: ["title", "intro"].includes(nom) || /(Title|Intro)$/.test(nom) }).toEqual({
        champ,
        identite: true,
      });
    }
  });

  it("le registre est gelé : aucun contrat hors document, aucune clé en double", () => {
    expect(Object.keys(PAGE_CONTENT_CONTRACTS)).toEqual([...knownPageKeys]);
    expect(new Set(knownPageKeys).size).toBe(knownPageKeys.length);
  });
});

/* -------------------------------------------------------------------------- */
/*  2. Écriture stricte                                                       */
/* -------------------------------------------------------------------------- */

describe("registre — l'écriture est stricte (docs/031 §3.4)", () => {
  it("refuse une clé non reconnue au lieu de l'élaguer", () => {
    const schema = getPageContentSchema("accueil");

    const resultat = schema?.safeParse({ ...ACCUEIL_VALIDE, sections: [] });

    expect(resultat?.success).toBe(false);
  });

  it("refuse une faute de frappe en nommant le champ", () => {
    const schema = getPageContentSchema("accueil");

    const resultat = schema?.safeParse({ ...ACCUEIL_VALIDE, heroTittle: "…" });

    expect(resultat?.success).toBe(false);
    if (resultat && !resultat.success) {
      // Zod ne remplit pas `path` pour une clé non reconnue : la clé fautive est
      // dans `keys` (et dans le message). C'est `formatIssues` — partagé avec le
      // middleware de validation — qui la restitue en `champ`, comme l'exige
      // `docs/031` §3.4.
      const issues = resultat.error.issues;
      const clesFautives = issues.flatMap((issue) =>
        "keys" in issue && Array.isArray(issue.keys) ? issue.keys.map(String) : [],
      );
      expect(clesFautives).toContain("heroTittle");
    }
  });

  it("refuse un champ obligatoire vide, blanc, ou trop long", () => {
    const schema = getPageContentSchema("accueil");

    for (const heroTitle of ["", "   ", "a".repeat(121)]) {
      expect(`${JSON.stringify(heroTitle).slice(0, 8)}:${schema?.safeParse({ ...ACCUEIL_VALIDE, heroTitle }).success}`).toBe(
        `${JSON.stringify(heroTitle).slice(0, 8)}:false`,
      );
    }
  });

  it("accepte le balisage comme TEXTE : le contrat interdit le HTML, pas la chaîne qui y ressemble", () => {
    // §3.4, dernière ligne : `{ heroTitle: "<b>x</b>" }` est **accepté**. Le
    // frontend affiche la valeur comme du texte, jamais comme du balisage : la
    // protection est à l'affichage, et un schéma qui refuserait ces chaînes
    // n'ajouterait aucune sécurité — il empêcherait seulement d'écrire un titre
    // contenant un `<`.
    const schema = getPageContentSchema("accueil");
    const resultat = schema?.safeParse({ ...ACCUEIL_VALIDE, heroTitle: "<b>x</b>" });

    expect(resultat?.success).toBe(true);
  });

  it("n'accepte ni tableau ni null comme contenu", () => {
    const schema = getPageContentSchema("accueil");

    expect(schema?.safeParse([]).success).toBe(false);
    expect(schema?.safeParse(null).success).toBe(false);
  });
});

describe("enveloppe d'écriture — docs/031 §3.3 et §3.4", () => {
  it("accepte la forme attendue", () => {
    expect(pageContentUpdateSchema.safeParse({ content: ACCUEIL_VALIDE }).success).toBe(true);
  });

  it("refuse une clé racine non reconnue", () => {
    // §3.4 : `{ content: {…}, extra: 1 }` → 400, `extra` non reconnu. Un
    // `z.object` ordinaire aurait retiré la clé et renvoyé un succès.
    const resultat = pageContentUpdateSchema.safeParse({
      content: ACCUEIL_VALIDE,
      extra: 1,
    });

    expect(resultat.success).toBe(false);
  });

  it("refuse `content: []` : un tableau est un objet en JavaScript, pas ici", () => {
    expect(pageContentUpdateSchema.safeParse({ content: [] }).success).toBe(false);
  });

  it("la clé de page reste permissive : une clé inconnue doit produire un 404 métier", () => {
    // `PATCH /pages/inconnue` → `404 PAGE_NOT_FOUND`, **jamais** un 400 de
    // forme (§3.4, ligne 3). Le schéma de paramètre ne doit donc pas énumérer
    // les clés connues.
    expect(pageParamsSchema.safeParse({ pageKey: "inconnue" }).success).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/*  3. Lecture tolérante                                                      */
/* -------------------------------------------------------------------------- */

describe("lecture tolérante — docs/031 §3.5 règle C et §4.3", () => {
  it("rend un contenu conforme tel quel", () => {
    expect(readPageContent("accueil", ACCUEIL_VALIDE)).toEqual(ACCUEIL_VALIDE);
  });

  it("ne lève jamais, quelle que soit la donnée stockée", () => {
    const donnees: unknown[] = [
      null,
      undefined,
      42,
      "texte",
      [],
      {},
      { heroTitle: 42 },
      { heroTitle: "a".repeat(5_000) },
      { heroTitle: null, heroIntro: [] },
      { inconnu: "valeur" },
    ];

    for (const donnee of donnees) {
      // C'est l'exigence centrale : « aucune page ne renvoie 500 à cause de son
      // contenu » (§4.3 règle 3). Une exception ici serait une page blanche.
      expect(() => readPageContent("accueil", donnee)).not.toThrow();
    }
  });

  it("omet un champ invalide sans le remplacer par une valeur inventée", () => {
    const relu = readPageContent("accueil", {
      heroTitle: "Titre valide",
      heroIntro: 42, // invalide
    });

    // §4.3 règle 1 : « Le texte manquant n'est jamais remplacé par un texte
    // inventé. » Le champ fautif est **absent**, et le frontend reprend sa
    // constante de code (`docs/016` §5).
    expect(relu).toEqual({ heroTitle: "Titre valide" });
    expect(relu).not.toHaveProperty("heroIntro");
  });

  it("omet une clé inconnue stockée en base", () => {
    // Une ligne ancienne, ou écrite hors contrat, ne doit pas pouvoir élargir
    // ce que l'API expose : le contrat reste la seule description de la sortie.
    const relu = readPageContent("accueil", {
      ...ACCUEIL_VALIDE,
      structureDesSections: ["hero", "events"],
    });

    expect(relu).toEqual(ACCUEIL_VALIDE);
    expect(relu).not.toHaveProperty("structureDesSections");
  });

  it("rend un objet vide — jamais une erreur — pour une clé inconnue ou un contenu non-objet", () => {
    expect(readPageContent("inconnue", ACCUEIL_VALIDE)).toEqual({});
    expect(readPageContent("accueil", [])).toEqual({});
    expect(readPageContent("accueil", null)).toEqual({});
  });

  it("conserve plusieurs champs valides même si d'autres sont fautifs", () => {
    const relu = readPageContent("accueil", {
      heroTitle: "Titre",
      heroIntro: "Introduction",
      heroCtaPrimaryLabel: "Découvrir",
      prayerMessage: 123, // invalide
    });

    expect(relu).toEqual({
      heroTitle: "Titre",
      heroIntro: "Introduction",
      heroCtaPrimaryLabel: "Découvrir",
    });
  });

  it("normalise sans rien changer tant qu'aucun contrat n'a changé de structure", () => {
    // `docs/031` §3.5 règle B prévoit `normalizePageContent` pour les migrations
    // `v1 → v2 → …` ; le registre étant gelé (règle D), l'étape est aujourd'hui
    // l'identité. Le test fixe ce point pour que la fonction ne devienne pas un
    // lieu de transformation silencieuse.
    expect(normalizePageContent("accueil", ACCUEIL_VALIDE)).toEqual(ACCUEIL_VALIDE);
  });
});

/* -------------------------------------------------------------------------- */
/*  4. Service : strict à l'entrée, tolérant à la sortie                      */
/* -------------------------------------------------------------------------- */

describe("StaticPageService — strict à l'entrée, tolérant à la sortie", () => {
  it("valide et transmet le contenu d'une page connue", async () => {
    const { repository, ecritures } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const page = await service.updateContent("accueil", ACCUEIL_VALIDE, null);

    expect(ecritures).toHaveLength(1);
    expect(ecritures[0]).toEqual({ pageKey: "accueil", content: ACCUEIL_VALIDE });
    expect(page.pageKey).toBe("accueil");
  });

  it("REFUSE un champ non déclaré, au lieu de le retirer en silence", async () => {
    const { repository, ecritures } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const error = expectAppError(
      await capture(
        service.updateContent(
          "accueil",
          { ...ACCUEIL_VALIDE, html: "<script>alert(1)</script>" },
          null,
        ),
      ),
      "VALIDATION_ERROR",
      400,
    );

    expect(ecritures).toHaveLength(0);
    const details = error.details as { champ: string; message: string }[];
    expect(details.map((detail) => detail.champ)).toContain("html");
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

  it("rejette une pageKey inconnue en lecture aussi, et une clé héritée du prototype", async () => {
    const { repository } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    for (const pageKey of ["inconnue", "toString", "constructor", "__proto__"]) {
      expectAppError(await capture(service.getByKey(pageKey)), "PAGE_NOT_FOUND", 404);
    }
  });

  it("nomme les champs obligatoires manquants", async () => {
    const { repository } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const error = expectAppError(
      await capture(service.updateContent("accueil", {}, null)),
      "VALIDATION_ERROR",
      400,
    );

    const details = error.details as { champ: string; message: string }[];
    expect(details.map((detail) => detail.champ).sort()).toEqual(["heroIntro", "heroTitle"]);
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

  it("sert le contenu **relu**, donc tolérant : une ligne ancienne ne casse pas la page", async () => {
    const { repository } = fakeStaticPageRepository(
      storedPage({
        heroTitle: "Titre enregistré",
        heroIntro: 42, // donnée historique incohérente
        sectionOrder: ["hero"], // clé hors contrat
      }),
    );
    const service = new StaticPageService(repository);

    const page = await service.getByKey("accueil");

    expect(page.content).toEqual({ heroTitle: "Titre enregistré" });
  });

  it("la réponse d'écriture et la lecture disent exactement la même chose", async () => {
    const { repository } = fakeStaticPageRepository();
    const service = new StaticPageService(repository);

    const written = await service.updateContent("accueil", ACCUEIL_VALIDE, "admin-1");

    // Les deux chemins appliquent la **même** lecture : sans cela, une réponse
    // d'écriture pourrait contenir un champ que la lecture suivante omettrait, et
    // l'interface afficherait un état qui n'existe pas.
    expect(written.content).toEqual(readPageContent("accueil", ACCUEIL_VALIDE));
  });

  it("chaque page du registre accepte son contenu minimal", async () => {
    for (const pageKey of knownPageKeys) {
      const { repository, ecritures } = fakeStaticPageRepository();
      const service = new StaticPageService(repository);

      await service.updateContent(pageKey, minimalContent(pageKey), null);

      expect({ pageKey, ecrit: ecritures.length }).toEqual({ pageKey, ecrit: 1 });
    }
  });

  it("les huit contrats sont distincts : aucune page n'est la copie d'une autre", async () => {
    const signatures = knownPageKeys.map((pageKey) =>
      Object.keys(shapeOf(pageKey)).sort().join(","),
    );

    // Huit ensembles de clés **différents**. Une copie accidentelle de contrat
    // (le genre de faute qu'une transcription de 238 champs produit) rendrait
    // deux signatures identiques, et deux pages accepteraient mutuellement leur
    // contenu.
    expect(new Set(signatures).size).toBe(knownPageKeys.length);
  });

  it("refuse le contenu d'une autre page dès qu'il porte une clé étrangère", async () => {
    // `title`/`intro` sont déclarés par plusieurs pages : ce partage est le
    // contrat, pas un défaut. Ce que le test vérifie, c'est le refus des clés
    // **propres** à une autre page.
    const organization = getPageContentSchema("organisation");
    const accueil = getPageContentSchema("accueil");

    expect(
      organization?.safeParse({ ...minimalContent("organisation"), heroTitle: "Titre" })
        .success,
    ).toBe(false);

    // `name`/`slug` appartiennent à l'entité `Department`, jamais à
    // `static_pages.content` (`docs/031` §2.8 : partie A vs partie B).
    expect(
      accueil?.safeParse({ ...minimalContent("accueil"), name: "Presse", slug: "presse" })
        .success,
    ).toBe(false);
  });
});
