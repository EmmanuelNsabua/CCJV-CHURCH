/**
 * Hiérarchie d'erreurs applicative.
 *
 * Le domaine et l'application lèvent ces erreurs ; la couche présentation les
 * traduit en réponses HTTP. Aucune erreur HTTP n'est levée depuis un service :
 * c'est ce qui permet de tester la logique métier sans serveur.
 *
 * Codes alignés sur `docs/004` §26 et `docs/018` §6.3.
 */

export type ErrorCode =
  // Authentification / autorisation
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "UNAUTHENTICATED_ADMIN"
  // Validation
  | "VALIDATION_ERROR"
  // Ressources
  | "EVENT_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "PUBLICATION_NOT_FOUND"
  | "PAGE_NOT_FOUND"
  | "LEADER_NOT_FOUND"
  | "TESTIMONY_NOT_FOUND"
  | "COMMUNITY_FACE_NOT_FOUND"
  | "SCRIPTURE_NOT_FOUND"
  | "SCHEDULE_ENTRY_NOT_FOUND"
  | "SOCIAL_LINK_NOT_FOUND"
  | "PRAYER_REQUEST_NOT_FOUND"
  | "MEDIA_NOT_FOUND"
  | "MEDIA_ACCESS_NOT_FOUND"
  | "SETTING_NOT_FOUND"
  | "NOTIFICATION_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "RESOURCE_NOT_FOUND"
  // Conflits
  | "DUPLICATE_SLUG"
  /**
   * Adresse déjà enregistrée chez le fournisseur d'identité.
   *
   * Distinct de `CONFLICT` : c'est une situation que l'administrateur **corrige
   * lui-même** en changeant d'adresse, et le client doit pouvoir le lui dire
   * précisément. Un code générique l'obligerait à deviner quel champ reprendre.
   */
  | "DUPLICATE_EMAIL"
  | "CONFLICT"
  // Fichiers
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE"
  // Limites et divers
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface AppErrorOptions {
  /** Précisions exploitables par le client (champs fautifs, contraintes). */
  details?: unknown;
  /** Erreur d'origine, conservée pour les journaux — jamais renvoyée au client. */
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;
  /** `true` = message sûr à exposer, même en production. */
  readonly isExposable: boolean;

  constructor(
    code: ErrorCode,
    statusCode: number,
    message: string,
    options: AppErrorOptions & { exposable?: boolean } = {},
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = options.details;
    this.isExposable = options.exposable ?? true;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides", details?: unknown) {
    super("VALIDATION_ERROR", 400, message, { details });
  }
}

export class AuthRequiredError extends AppError {
  constructor(message = "Authentification requise") {
    super("AUTH_REQUIRED", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé") {
    super("FORBIDDEN", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, 404, message, { details });
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, 409, message, { details });
  }
}

export class DuplicateSlugError extends ConflictError {
  constructor(slug: string) {
    super("DUPLICATE_SLUG", `Le slug « ${slug} » est déjà utilisé`, { slug });
  }
}

/**
 * L'adresse est déjà enregistrée chez le fournisseur d'identité.
 *
 * L'adresse **n'est pas** reprise dans le message : elle vient d'être saisie par
 * l'appelant, et la répéter dans une réponse la ferait circuler une fois de plus
 * sans utilité. Le champ fautif suffit — le client sait laquelle il a envoyée.
 */
export class DuplicateEmailError extends ConflictError {
  constructor() {
    super(
      "DUPLICATE_EMAIL",
      "Un compte d'authentification existe déjà pour cette adresse",
      { champ: "email" },
    );
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(maxBytes: number) {
    super(
      "FILE_TOO_LARGE",
      413,
      `Fichier trop volumineux : la limite est de ${Math.round(maxBytes / 1024 / 1024)} Mo`,
      { details: { maxBytes } },
    );
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(accepted: readonly string[]) {
    super("INVALID_FILE_TYPE", 415, "Type de fichier non autorisé", {
      details: { accepted },
    });
  }
}

export class RateLimitedError extends AppError {
  constructor() {
    super("RATE_LIMITED", 429, "Trop de requêtes, veuillez réessayer plus tard");
  }
}

/**
 * Erreur interne : le message technique reste dans les journaux.
 * En production, le client ne reçoit qu'un message générique.
 */
export class InternalError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("INTERNAL_ERROR", 500, message, { cause, exposable: false });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
