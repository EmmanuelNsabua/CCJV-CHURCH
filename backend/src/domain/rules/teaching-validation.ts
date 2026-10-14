import type {
  BiblicalReferenceInput,
} from "@/domain/repositories";
import { ValidationError } from "@/shared/errors/app-error";

/**
 * Validation du format de la date de prédication ("YYYY-MM-DD").
 */
export function validatePreachedAt(preachedAt: string): void {
  if (!preachedAt || typeof preachedAt !== "string") {
    throw new ValidationError("La date de prédication est obligatoire", [
      { champ: "preachedAt", message: "Date requise au format YYYY-MM-DD" },
    ]);
  }

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(preachedAt)) {
    throw new ValidationError("Format de date de prédication invalide", [
      { champ: "preachedAt", message: "Format attendu : AAAA-MM-JJ" },
    ]);
  }

  const parts = preachedAt.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) {
    throw new ValidationError("Format de date de prédication invalide", [
      { champ: "preachedAt", message: "Format attendu : AAAA-MM-JJ" },
    ]);
  }

  const dateObj = new Date(Date.UTC(y, m - 1, d));
  if (
    Number.isNaN(dateObj.getTime()) ||
    dateObj.getUTCFullYear() !== y ||
    dateObj.getUTCMonth() !== m - 1 ||
    dateObj.getUTCDate() !== d
  ) {
    throw new ValidationError("Date de prédication invalide", [
      { champ: "preachedAt", message: "La date spécifiée n'est pas valide dans le calendrier" },
    ]);
  }
}

/**
 * Validation des métadonnées obligatoires d'un enseignement.
 */
export function validateTeachingMetadata(data: {
  title?: string;
  speakerName?: string;
  preachedAt?: string;
}): void {
  const issues: Array<{ champ: string; message: string }> = [];

  if (data.title !== undefined && (!data.title || !data.title.trim())) {
    issues.push({ champ: "title", message: "Le titre ne peut pas être vide" });
  }

  if (
    data.speakerName !== undefined &&
    (!data.speakerName || !data.speakerName.trim())
  ) {
    issues.push({
      champ: "speakerName",
      message: "Le nom de l'orateur ne peut pas être vide",
    });
  }

  if (issues.length > 0) {
    throw new ValidationError("Champs obligatoires manquants ou invalides", issues);
  }

  if (data.preachedAt !== undefined) {
    validatePreachedAt(data.preachedAt);
  }
}

/**
 * Validation d'une collection de références bibliques.
 */
export function validateBiblicalReferences(
  refs: BiblicalReferenceInput[],
): void {
  const issues: Array<{ champ: string; message: string }> = [];

  refs.forEach((ref, index) => {
    const prefix = `references[${index}]`;

    if (!ref.book || !ref.book.trim()) {
      issues.push({
        champ: `${prefix}.book`,
        message: "Le livre biblique ne peut pas être vide",
      });
    }

    if (!Number.isInteger(ref.startChapter) || ref.startChapter <= 0) {
      issues.push({
        champ: `${prefix}.startChapter`,
        message: "Le chapitre de début doit être un entier supérieur à 0",
      });
    }

    if (!Number.isInteger(ref.startVerse) || ref.startVerse <= 0) {
      issues.push({
        champ: `${prefix}.startVerse`,
        message: "Le verset de début doit être un entier supérieur à 0",
      });
    }

    const endChap = ref.endChapter;
    const endVer = ref.endVerse;

    if (endChap !== undefined && endChap !== null) {
      if (!Number.isInteger(endChap) || endChap <= 0) {
        issues.push({
          champ: `${prefix}.endChapter`,
          message: "Le chapitre de fin doit être un entier supérieur à 0",
        });
      } else if (endChap < ref.startChapter) {
        issues.push({
          champ: `${prefix}.endChapter`,
          message:
            "Le chapitre de fin ne peut pas être inférieur au chapitre de début",
        });
      }
    }

    if (endVer !== undefined && endVer !== null) {
      if (!Number.isInteger(endVer) || endVer <= 0) {
        issues.push({
          champ: `${prefix}.endVerse`,
          message: "Le verset de fin doit être un entier supérieur à 0",
        });
      } else {
        const effectiveEndChap = endChap ?? ref.startChapter;
        if (effectiveEndChap === ref.startChapter && endVer < ref.startVerse) {
          issues.push({
            champ: `${prefix}.endVerse`,
            message:
              "Dans le même chapitre, le verset de fin ne peut pas être inférieur au verset de début",
          });
        }
      }
    }
  });

  if (issues.length > 0) {
    throw new ValidationError(
      "Une ou plusieurs références bibliques sont invalides",
      issues,
    );
  }
}

/**
 * Règle impérative de publication (Section 3.4 & 3.6) :
 * Au moins un média principal valide de type audio ou vidéo doit être associé avant toute publication.
 * Une miniature seule ne satisfait pas cette condition.
 */
export function validateTeachingCanBePublished(
  medias: Array<{ role: string; isPrimary: boolean }>,
): void {
  const hasPrimaryAudioOrVideo = medias.some(
    (m) =>
      m.isPrimary &&
      (m.role === "VIDEO" || m.role === "AUDIO"),
  );

  if (!hasPrimaryAudioOrVideo) {
    throw new ValidationError(
      "Publication impossible : au moins un média principal de type vidéo ou audio doit être associé avant de publier un enseignement",
      [
        {
          champ: "medias",
          message:
            "Un enseignement requiert un média principal AUDIO ou VIDEO pour être publié. Une miniature seule ne suffit pas.",
        },
      ],
    );
  }
}
