import { describe, expect, it } from "@jest/globals";
import { z } from "zod";
import {
  buildPaginationMeta,
  createSortSchema,
  DEFAULT_PAGE_SIZE,
  emptyQuerySchema,
  MAX_PAGE_SIZE,
  paginationQuerySchema,
  toOffset,
} from "@/shared/http/pagination";

/**
 * Conventions de pagination et de tri (`docs/004` §34).
 *
 * Le tri est le point sensible : la colonne vient toujours d'une liste blanche
 * serveur, jamais du client — c'est ce qui interdit toute injection par
 * `?sort=`.
 */

describe("buildPaginationMeta", () => {
  it("annonce 0 page pour une collection vide", () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it("calcule le nombre de pages pour une division exacte", () => {
    expect(buildPaginationMeta(2, 10, 40)).toEqual({
      page: 2,
      limit: 10,
      total: 40,
      totalPages: 4,
    });
  });

  it("arrondit à l'entier supérieur quand le dernier page est incomplète", () => {
    expect(buildPaginationMeta(1, 20, 21).totalPages).toBe(2);
    expect(buildPaginationMeta(1, 20, 1).totalPages).toBe(1);
    expect(buildPaginationMeta(1, 20, 101).totalPages).toBe(6);
  });

  it("conserve la page et la limite demandées sans les corriger", () => {
    // Une page au-delà du total renvoie une liste vide, pas une erreur : c'est
    // au client de revenir en arrière.
    expect(buildPaginationMeta(9, 100, 3)).toEqual({
      page: 9,
      limit: 100,
      total: 3,
      totalPages: 1,
    });
  });

  it("utilise les bornes documentées", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
    expect(MAX_PAGE_SIZE).toBe(100);
  });
});

describe("toOffset", () => {
  it("vaut 0 pour la première page", () => {
    expect(toOffset(1, 20)).toBe(0);
    expect(toOffset(1, 100)).toBe(0);
  });

  it("progresse d'une limite par page", () => {
    expect(toOffset(2, 10)).toBe(10);
    expect(toOffset(3, 10)).toBe(20);
    expect(toOffset(5, 25)).toBe(100);
  });
});

describe("paginationQuerySchema", () => {
  it("applique les valeurs par défaut", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
    });
  });

  it("convertit les chaînes de la query string", () => {
    expect(paginationQuerySchema.parse({ page: "3", limit: "50" })).toEqual({
      page: 3,
      limit: 50,
    });
  });

  it("refuse une page ou une limite hors bornes", () => {
    expect(paginationQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});

/**
 * Convention des paramètres de requête : un paramètre non reconnu est **refusé**,
 * jamais ignoré. Le point faible d'un schéma de *query* composé est la stricteur :
 * elle se perd selon la façon dont le schéma est étendu. Ces tests verrouillent
 * les deux formes, pour que la règle ne dépende pas d'une supposition.
 */
describe("paginationQuerySchema — stricteur des paramètres de requête", () => {
  it("refuse un paramètre de requête inconnu", () => {
    const resultat = paginationQuerySchema.safeParse({ nimportequoi: "1" });

    expect(resultat.success).toBe(false);
    if (!resultat.success) {
      expect(resultat.error.issues[0]?.code).toBe("unrecognized_keys");
      expect(JSON.stringify(resultat.error.issues)).toContain("nimportequoi");
    }
  });

  it("accepte la query vide et applique les valeurs par défaut", () => {
    const resultat = paginationQuerySchema.safeParse({});

    expect(resultat.success).toBe(true);
    if (resultat.success) {
      expect(resultat.data).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    }
  });

  it("préserve la stricteur après .extend() — la forme utilisée par les modules", () => {
    const etendu = paginationQuerySchema.extend({
      status: z.enum(["UPCOMING", "ARCHIVED"]).optional(),
    });

    const valide = etendu.safeParse({ page: "2", limit: "10", status: "UPCOMING" });
    expect(valide.success).toBe(true);

    const inconnu = etendu.safeParse({ page: "2", nimportequoi: "1" });
    expect(inconnu.success).toBe(false);
    if (!inconnu.success) {
      expect(inconnu.error.issues[0]?.code).toBe("unrecognized_keys");
    }
  });

  it("perd la stricteur par étalement de .shape — forme interdite pour une query", () => {
    // Ce test documente le piège : `z.object({ ...paginationQuerySchema.shape })`
    // construit un objet neuf **non strict**, qui élague la clé au lieu de la
    // refuser. Aucun schéma de *query* du projet ne doit l'utiliser.
    const parEtalement = z.object({ ...paginationQuerySchema.shape });

    const resultat = parEtalement.safeParse({ nimportequoi: "1" });

    expect(resultat.success).toBe(true);
    if (resultat.success) {
      expect(resultat.data).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    }

    // Contrôle de cohérence : l'extension, elle, refuse bien la même entrée.
    expect(
      paginationQuerySchema.extend({}).safeParse({ nimportequoi: "1" }).success,
    ).toBe(false);
  });
});

describe("emptyQuerySchema", () => {
  it("accepte une query vide", () => {
    const resultat = emptyQuerySchema.safeParse({});
    expect(resultat.success).toBe(true);
    if (resultat.success) {
      expect(resultat.data).toEqual({});
    }
  });

  it("refuse tout paramètre, y compris la pagination", () => {
    // Les listes bornées (`schedule`, `scriptures`, `social-links`) ne sont pas
    // paginées : `?limit=20` y est donc un paramètre inconnu, pas un filtre.
    for (const requete of [
      { limit: "20" },
      { page: "1" },
      { sort: "-created_at" },
      { nimportequoi: "1" },
    ]) {
      const resultat = emptyQuerySchema.safeParse(requete);
      expect(resultat.success).toBe(false);
      if (!resultat.success) {
        expect(resultat.error.issues[0]?.code).toBe("unrecognized_keys");
      }
    }
  });
});

describe("createSortSchema", () => {
  const sortSchema = createSortSchema(
    ["published_at", "created_at", "position"],
    "published_at",
  );

  it("applique le tri par défaut en ordre croissant", () => {
    expect(sortSchema.parse(undefined)).toEqual({
      column: "published_at",
      direction: "asc",
    });
  });

  it("interprète le préfixe « - » comme un tri descendant", () => {
    expect(sortSchema.parse("-created_at")).toEqual({
      column: "created_at",
      direction: "desc",
    });
    expect(sortSchema.parse("position")).toEqual({
      column: "position",
      direction: "asc",
    });
    expect(sortSchema.parse("-position")).toEqual({
      column: "position",
      direction: "desc",
    });
  });

  it("tolère les espaces autour de la valeur", () => {
    expect(sortSchema.parse("  -created_at  ")).toEqual({
      column: "created_at",
      direction: "desc",
    });
  });

  it("rejette une colonne hors de la liste blanche", () => {
    const resultat = sortSchema.safeParse("id");

    expect(resultat.success).toBe(false);
    expect(sortSchema.safeParse("-id").success).toBe(false);
    expect(sortSchema.safeParse("password").success).toBe(false);
    expect(sortSchema.safeParse("published_at; drop table events").success).toBe(false);
  });

  it("explique les colonnes autorisées dans le message d'erreur", () => {
    const resultat = sortSchema.safeParse("id");
    expect(resultat.success).toBe(false);

    if (!resultat.success) {
      const message = resultat.error.issues.map((issue) => issue.message).join(" ");
      expect(message).toContain("published_at");
      expect(message).toContain("created_at");
      expect(message).toContain("position");
    }
  });

  it("accepte une liste blanche d'une seule colonne", () => {
    const unSeul = createSortSchema(["event_date"], "event_date");

    expect(unSeul.parse(undefined).column).toBe("event_date");
    expect(unSeul.safeParse("created_at").success).toBe(false);
  });
});

describe("paginationQuerySchema — combinaison avec le tri", () => {
  it("ne laisse pas passer une valeur de tri invalide dans une query complète", () => {
    const querySchema = paginationQuerySchema.extend({
      sort: createSortSchema(["published_at"], "published_at"),
    });

    const ok = querySchema.safeParse({ page: "2", limit: "10", sort: "-published_at" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data).toEqual({
        page: 2,
        limit: 10,
        sort: { column: "published_at", direction: "desc" },
      });
    }

    expect(querySchema.safeParse({ sort: "created_at" }).success).toBe(false);
  });
});
