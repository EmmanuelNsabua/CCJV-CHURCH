import { describe, expect, it } from "vitest";
import {
  AppError,
  AuthRequiredError,
  ConflictError,
  DuplicateSlugError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitedError,
  UnsupportedMediaTypeError,
  ValidationError,
  isAppError,
} from "@/shared/errors/app-error";

/**
 * Le couple `code` + `statusCode` est le contrat d'erreur de l'API : le
 * frontend s'y fie pour réagir (reconnexion, message, redirection). Un code
 * qui change est une rupture de contrat, d'où ces assertions explicites.
 */

describe("codes et statuts HTTP", () => {
  const cas: readonly {
    nom: string;
    erreur: AppError;
    code: string;
    statusCode: number;
  }[] = [
    {
      nom: "ValidationError",
      erreur: new ValidationError(),
      code: "VALIDATION_ERROR",
      statusCode: 400,
    },
    {
      nom: "AuthRequiredError",
      erreur: new AuthRequiredError(),
      code: "AUTH_REQUIRED",
      statusCode: 401,
    },
    {
      nom: "ForbiddenError",
      erreur: new ForbiddenError(),
      code: "FORBIDDEN",
      statusCode: 403,
    },
    {
      nom: "NotFoundError",
      erreur: new NotFoundError("EVENT_NOT_FOUND", "Événement introuvable"),
      code: "EVENT_NOT_FOUND",
      statusCode: 404,
    },
    {
      nom: "ConflictError",
      erreur: new ConflictError("CONFLICT", "Conflit de version"),
      code: "CONFLICT",
      statusCode: 409,
    },
    {
      nom: "DuplicateSlugError",
      erreur: new DuplicateSlugError("eglise-centrale"),
      code: "DUPLICATE_SLUG",
      statusCode: 409,
    },
    {
      nom: "PayloadTooLargeError",
      erreur: new PayloadTooLargeError(5_242_880),
      code: "FILE_TOO_LARGE",
      statusCode: 413,
    },
    {
      nom: "UnsupportedMediaTypeError",
      erreur: new UnsupportedMediaTypeError(["image/jpeg", "image/png"]),
      code: "INVALID_FILE_TYPE",
      statusCode: 415,
    },
    {
      nom: "RateLimitedError",
      erreur: new RateLimitedError(),
      code: "RATE_LIMITED",
      statusCode: 429,
    },
    {
      nom: "InternalError",
      erreur: new InternalError("Échec technique"),
      code: "INTERNAL_ERROR",
      statusCode: 500,
    },
  ];

  for (const { nom, erreur, code, statusCode } of cas) {
    it(`${nom} porte le code ${code} et le statut ${statusCode}`, () => {
      expect(erreur).toBeInstanceOf(AppError);
      expect(erreur).toBeInstanceOf(Error);
      expect(erreur.code).toBe(code);
      expect(erreur.statusCode).toBe(statusCode);
      expect(erreur.name).toBe(nom);
      expect(erreur.message.length).toBeGreaterThan(0);
    });
  }
});

describe("NotFoundError", () => {
  it("accepte chacun des codes de ressource documentés", () => {
    const codes = [
      "DEPARTMENT_NOT_FOUND",
      "EVENT_NOT_FOUND",
      "PUBLICATION_NOT_FOUND",
      "LEADER_NOT_FOUND",
      "TESTIMONY_NOT_FOUND",
      "COMMUNITY_FACE_NOT_FOUND",
      "SCRIPTURE_NOT_FOUND",
      "SCHEDULE_ENTRY_NOT_FOUND",
      "SOCIAL_LINK_NOT_FOUND",
      "PRAYER_REQUEST_NOT_FOUND",
      "MEDIA_NOT_FOUND",
      "PAGE_NOT_FOUND",
      "NOT_FOUND",
    ] as const;

    for (const code of codes) {
      const erreur = new NotFoundError(code, "Ressource introuvable");
      expect(erreur.code).toBe(code);
      expect(erreur.statusCode).toBe(404);
      expect(erreur.isExposable).toBe(true);
    }
  });
});

describe("détails d'erreur", () => {
  it("expose les champs fautifs d'une erreur de validation", () => {
    const erreur = new ValidationError("Données invalides", [
      { champ: "title", message: "Champ requis" },
    ]);

    expect(erreur.details).toEqual([{ champ: "title", message: "Champ requis" }]);
  });

  it("expose les limites de taille et les types acceptés", () => {
    const taille = new PayloadTooLargeError(5_242_880);
    expect(taille.details).toEqual({ maxBytes: 5_242_880 });

    const type = new UnsupportedMediaTypeError(["image/jpeg"]);
    expect(type.details).toEqual({ accepted: ["image/jpeg"] });
  });

  it("porte le slug fautif dans un doublon", () => {
    const erreur = new DuplicateSlugError("eglise-centrale");
    expect(erreur.details).toEqual({ slug: "eglise-centrale" });
    expect(erreur.message).toContain("eglise-centrale");
  });

  it("n'expose aucun détail par défaut", () => {
    expect(new ForbiddenError().details).toBeUndefined();
    expect(new ValidationError().details).toBeUndefined();
  });
});

describe("InternalError", () => {
  it("n'est pas exposable au client", () => {
    const erreur = new InternalError("Échec de la connexion PostgreSQL");

    expect(erreur.isExposable).toBe(false);
    expect(erreur.code).toBe("INTERNAL_ERROR");
    expect(erreur.statusCode).toBe(500);
  });

  it("conserve la cause technique pour les journaux", () => {
    const cause = new Error("ECONNREFUSED 127.0.0.1:5432");
    const erreur = new InternalError("Base injoignable", cause);

    expect(erreur.cause).toBe(cause);
  });

  it("reste exposable pour toutes les erreurs client", () => {
    const clientes: AppError[] = [
      new ValidationError(),
      new AuthRequiredError(),
      new ForbiddenError(),
      new NotFoundError("NOT_FOUND", "Introuvable"),
      new DuplicateSlugError("slug"),
      new RateLimitedError(),
    ];

    for (const erreur of clientes) {
      expect(erreur.isExposable).toBe(true);
    }
  });
});

describe("isAppError", () => {
  it("reconnaît les erreurs applicatives", () => {
    expect(isAppError(new AppError("NOT_FOUND", 404, "Introuvable"))).toBe(true);
    expect(isAppError(new ValidationError())).toBe(true);
    expect(isAppError(new InternalError("Technique"))).toBe(true);
    // Une sous-classe indirecte aussi : la hiérarchie est plate mais explicite.
    expect(isAppError(new DuplicateSlugError("slug"))).toBe(true);
  });

  it("rejette tout ce qui n'est pas une erreur applicative", () => {
    expect(isAppError(new Error("erreur native"))).toBe(false);
    expect(isAppError(new TypeError("mauvais type"))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError("VALIDATION_ERROR")).toBe(false);
    expect(isAppError({ code: "VALIDATION_ERROR", statusCode: 400 })).toBe(false);
    expect(isAppError(404)).toBe(false);
  });

  it("distingue une erreur applicative de son clone structurel", () => {
    const clone = Object.assign(new Error("Introuvable"), {
      code: "NOT_FOUND",
      statusCode: 404,
      isExposable: true,
    });

    expect(isAppError(clone)).toBe(false);
  });
});
