import { z } from "zod";

/** Texte éditorial : nettoyé, non vide, borné. Jamais de HTML, jamais de balisage. */
export const text = (max: number) => z.string().trim().min(1).max(max);

/** Champ facultatif : absent ⇒ le frontend garde son texte par défaut (page-content.ts:29-33). */
export const opt = (max: number) => text(max).optional();

/** Libellé de CTA : le libellé est éditorial, la cible reste dans le code. */
export const cta = (max = 48) => text(max).optional();

/** Référence média : identifiant de la bibliothèque (`Media.id`). */
export const media = z.uuid();

/**
 * Forme de transition : les valeurs existantes du frontend sont des CHEMINS
 * (`/media/ccjv-XX.jpeg`, `images.ts:11-40`). Elles sont acceptées le temps de la
 * migration (§6.4, étape M6) puis retirées ; un chemin n'est jamais une
 * référence de bibliothèque et ne bénéficie d'aucun contrôle d'accès (`MediaAccess`,
 * D-21/D-22).
 */
export const mediaOrLegacyPath = z.union([
  media,
  z.string().trim().regex(/^\/media\/ccjv-\d{2}\.jpeg$/),
]);

/**
 * Référence de verset : clé d'un enregistrement `Scripture`.
 * Bornée à 60 comme `scriptures.key` (editorial.ts:64).
 */
export const verse = text(60).optional();

/** Tableau borné d'objets éditoriaux : l'ordre des éléments est éditorial. */
export const bounded = <T extends z.ZodType>(item: T, min: number, max: number) =>
  z.array(item).min(min).max(max);
