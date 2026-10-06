import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";
import {
  validate,
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Le middleware de validation est la seule porte d'entrée des données HTTP :
 * il valide, remplace la donnée brute par la donnée validée et rassemble les
 * erreurs en une seule réponse. Ces tests vérifient les quatre points qui
 * comptent : transmission, remplacement, détails, rejet des clés inconnues.
 */

interface Mocks {
  req: Request;
  res: Response;
  next: jest.Mock;
}

function createMocks(init: {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
} = {}): Mocks {
  const req = {
    body: init.body,
    params: init.params ?? {},
    query: init.query ?? {},
  } as unknown as Request;

  return { req, res: {} as Response, next: jest.fn() };
}

function callValidator(
  handler: ReturnType<typeof validate>,
  mocks: Mocks,
): void {
  handler(mocks.req, mocks.res, mocks.next as unknown as NextFunction);
}

function firstError(next: jest.Mock): unknown {
  return next.mock.calls[0]?.[0];
}

interface Detail {
  champ: string;
  message: string;
}

function detailsOf(received: unknown): Detail[] {
  expect(isAppError(received)).toBe(true);
  const error = received as AppError;
  expect(error.code).toBe("VALIDATION_ERROR");
  expect(error.statusCode).toBe(400);
  expect(Array.isArray(error.details)).toBe(true);
  return error.details as Detail[];
}

const bodySchema = z.object({
  title: z.string().min(3),
  capacity: z.number().int().positive(),
});

/* -------------------------------------------------------------------------- */
/*  Corps valide                                                              */
/* -------------------------------------------------------------------------- */

describe("validate — corps valide", () => {
  it("transmet le corps validé et appelle next() sans argument", () => {
    const mocks = createMocks({ body: { title: "Culte du dimanche", capacity: 300 } });

    callValidator(validate({ body: bodySchema }), mocks);

    expect(mocks.next).toHaveBeenCalledTimes(1);
    expect(mocks.next).toHaveBeenCalledWith();
    expect(mocks.req.body).toEqual({ title: "Culte du dimanche", capacity: 300 });
  });

  it("remplace le corps brut par la donnée transformée", () => {
    const schema = z.object({ title: z.string().trim().toLowerCase() });
    const mocks = createMocks({ body: { title: "  Culte  " } });

    callValidator(validate({ body: schema }), mocks);

    expect(mocks.req.body).toEqual({ title: "culte" });
  });

  it("applique les valeurs par défaut et les conversions du schéma", () => {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      published: z.coerce.boolean().default(false),
    });
    const mocks = createMocks({ body: { page: "4" } });

    callValidator(validate({ body: schema }), mocks);

    expect(mocks.req.body).toEqual({ page: 4, published: false });
  });

  it("n'écrit rien quand aucun schéma n'est fourni", () => {
    const mocks = createMocks({ body: { libre: true } });

    callValidator(validate({}), mocks);

    expect(mocks.next).toHaveBeenCalledWith();
    expect(mocks.req.body).toEqual({ libre: true });
  });
});

/* -------------------------------------------------------------------------- */
/*  Corps invalide                                                            */
/* -------------------------------------------------------------------------- */

describe("validate — corps invalide", () => {
  it("lève une ValidationError listant les champs fautifs", () => {
    const mocks = createMocks({ body: { title: "ab", capacity: -3 } });

    callValidator(validate({ body: bodySchema }), mocks);

    expect(mocks.next).toHaveBeenCalledTimes(1);
    const details = detailsOf(firstError(mocks.next));

    expect(details).toHaveLength(2);
    expect(details.map((d) => d.champ).sort()).toEqual(["capacity", "title"]);
    for (const detail of details) {
      expect(typeof detail.message).toBe("string");
      expect(detail.message.length).toBeGreaterThan(0);
    }
  });

  it("signale un champ manquant avec le nom du champ attendu", () => {
    const mocks = createMocks({ body: { title: "Culte du dimanche" } });

    callValidator(validate({ body: bodySchema }), mocks);

    const details = detailsOf(firstError(mocks.next));
    expect(details.map((d) => d.champ)).toEqual(["capacity"]);
  });

  it("ne remplace pas le corps brut quand la validation échoue", () => {
    const mocks = createMocks({ body: { title: "ab", capacity: 3 } });

    callValidator(validate({ body: bodySchema }), mocks);

    expect(mocks.req.body).toEqual({ title: "ab", capacity: 3 });
  });

  it("rejette un corps absent", () => {
    const mocks = createMocks({ body: undefined });

    callValidator(validate({ body: bodySchema }), mocks);

    detailsOf(firstError(mocks.next));
  });

  it("nomme « (racine) » une erreur portant sur le corps entier", () => {
    const mocks = createMocks({ body: "une chaîne" });

    callValidator(validate({ body: bodySchema }), mocks);

    const details = detailsOf(firstError(mocks.next));
    expect(details[0]?.champ).toBe("(racine)");
  });
});

/* -------------------------------------------------------------------------- */
/*  Clés inconnues                                                            */
/* -------------------------------------------------------------------------- */

describe("validate — clés inconnues", () => {
  const strictSchema = z.strictObject({
    title: z.string().min(1),
  });

  it("rejette une clé inconnue quand le schéma est strict", () => {
    const mocks = createMocks({ body: { title: "Culte", role: "ROLE_ADMIN" } });

    callValidator(validate({ body: strictSchema }), mocks);

    const details = detailsOf(firstError(mocks.next));
    // Zod 4 rattache la clé en trop à l'objet racine (`path` vide) : le
    // middleware la nomme donc elle-même, une entrée par clé fautive. Le client
    // lit `champ: "role"` au lieu d'un « (racine) » qui ne désigne rien.
    expect(details).toHaveLength(1);
    expect(details[0]?.champ).toBe("role");
    expect(details[0]?.message).toContain("role");
  });

  it("nomme chaque clé inconnue quand il y en a plusieurs", () => {
    // Schéma strict dont tous les champs sont facultatifs : la seule faute est
    // donc la présence de clés non reconnues.
    const queryStricte = z.strictObject({
      page: z.coerce.number().int().min(1).optional(),
    });
    const mocks = createMocks({ query: { nimportequoi: "1", zatrer: "2" } });

    callValidator(validate({ query: queryStricte }), mocks);

    const details = detailsOf(firstError(mocks.next));
    expect(details.map((detail) => detail.champ).sort()).toEqual([
      "nimportequoi",
      "zatrer",
    ]);
    expect(details.every((detail) => detail.message.length > 0)).toBe(true);
  });

  it("identifie nommément la clé refusée", () => {
    const resultat = strictSchema.safeParse({ title: "Culte", role: "ROLE_ADMIN" });

    expect(resultat.success).toBe(false);
    if (!resultat.success) {
      // `keys` porte les clés non reconnues : c'est ce que le client doit
      // corriger.
      expect(JSON.stringify(resultat.error.issues)).toContain("role");
    }
  });

  it("accepte le corps strict quand il ne contient que les clés attendues", () => {
    const mocks = createMocks({ body: { title: "Culte" } });

    callValidator(validate({ body: strictSchema }), mocks);

    expect(mocks.next).toHaveBeenCalledWith();
    expect(mocks.req.body).toEqual({ title: "Culte" });
  });

  it("élague les clés inconnues quand le schéma est permissif", () => {
    // Comportement par défaut de Zod : la clé est retirée de la donnée validée,
    // elle ne peut donc pas atteindre le service.
    const mocks = createMocks({ body: { title: "Culte", role: "ROLE_ADMIN" } });

    callValidator(validate({ body: z.object({ title: z.string() }) }), mocks);

    expect(mocks.next).toHaveBeenCalledWith();
    expect(mocks.req.body).toEqual({ title: "Culte" });
  });
});

/* -------------------------------------------------------------------------- */
/*  Paramètres et query                                                       */
/* -------------------------------------------------------------------------- */

describe("validate — params et query", () => {
  const paramsSchema = z.object({ idOrSlug: z.string().min(1) });

  it("expose les paramètres validés via validatedParams", () => {
    const mocks = createMocks({ params: { idOrSlug: "eglise-centrale" } });

    callValidator(validate({ params: paramsSchema }), mocks);

    expect(mocks.next).toHaveBeenCalledWith();
    expect(validatedParams<{ idOrSlug: string }>(mocks.req).idOrSlug).toBe(
      "eglise-centrale",
    );
  });

  it("expose la query validée via validatedQuery", () => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });
    const mocks = createMocks({ query: { page: "2", limit: "50" } });

    callValidator(validate({ query: querySchema }), mocks);

    expect(mocks.next).toHaveBeenCalledWith();
    expect(validatedQuery<{ page: number; limit: number }>(mocks.req)).toEqual({
      page: 2,
      limit: 50,
    });
  });

  it("refuse un paramètre d'URL invalide", () => {
    const mocks = createMocks({ params: {} });

    callValidator(validate({ params: paramsSchema }), mocks);

    const details = detailsOf(firstError(mocks.next));
    expect(details.map((d) => d.champ)).toEqual(["idOrSlug"]);
  });

  it("refuse une query hors bornes", () => {
    const querySchema = z.object({ page: z.coerce.number().int().min(1) });
    const mocks = createMocks({ query: { page: "0" } });

    callValidator(validate({ query: querySchema }), mocks);

    const details = detailsOf(firstError(mocks.next));
    expect(details.map((d) => d.champ)).toEqual(["page"]);
  });

  it("n'expose pas de paramètres validés tant que la validation n'a pas réussi", () => {
    const mocks = createMocks({ params: { idOrSlug: "" } });

    callValidator(validate({ params: paramsSchema }), mocks);

    // La validation a échoué : aucun paramètre validé n'est publié.
    expect(validatedParams<{ idOrSlug?: string }>(mocks.req).idOrSlug).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/*  Agrégation des erreurs                                                    */
/* -------------------------------------------------------------------------- */

describe("validate — sources multiples", () => {
  it("rassemble en une seule erreur les fautes du corps, des paramètres et de la query", () => {
    const mocks = createMocks({
      body: { title: "ab", capacity: 0 },
      params: { idOrSlug: "" },
      query: { page: "0" },
    });

    callValidator(
      validate({
        body: bodySchema,
        params: z.object({ idOrSlug: z.string().min(1) }),
        query: z.object({ page: z.coerce.number().int().min(1) }),
      }),
      mocks,
    );

    expect(mocks.next).toHaveBeenCalledTimes(1);
    const details = detailsOf(firstError(mocks.next));

    expect(details.map((d) => d.champ).sort()).toEqual([
      "capacity",
      "idOrSlug",
      "page",
      "title",
    ]);
  });

  it("valide les sources indépendamment : une query valide est publiée malgré un corps invalide", () => {
    const mocks = createMocks({
      body: { title: "ab", capacity: 1 },
      query: { page: "3" },
    });

    callValidator(
      validate({
        body: bodySchema,
        query: z.object({ page: z.coerce.number().int().min(1) }),
      }),
      mocks,
    );

    expect(firstError(mocks.next)).toBeInstanceOf(AppError);
    expect(validatedQuery<{ page: number }>(mocks.req).page).toBe(3);
  });
});
