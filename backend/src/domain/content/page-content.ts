import type { ZodType } from "zod";
import { z } from "zod";

/**
 * Registre des contenus éditables, **un schéma par `pageKey`**.
 *
 * `public.static_pages.content` est un `jsonb` : sans registre, n'importe quelle
 * forme pourrait y être écrite et le frontend se retrouverait avec un contenu
 * qu'il ne sait pas lire. Le registre est donc la source de vérité
 * (`docs/018` §5) :
 *
 * 1. seules les `pageKey` déclarées ici sont éditables — une clé inconnue est
 *    rejetée à l'écriture (`PAGE_NOT_FOUND`) ;
 * 2. un contenu non conforme au schéma de la page est rejeté
 *    (`VALIDATION_ERROR`) ;
 * 3. **seuls des champs textuels nommés** existent ici : titres, introductions
 *    et descriptions. Jamais de HTML, jamais de mise en page, jamais d'ordre de
 *    sections — ceux-ci appartiennent au code du frontend. Les valeurs sont
 *    affichées comme du texte, jamais injectées comme du balisage.
 *
 * Les clés correspondent aux pages réellement servies par le frontend. Les
 * listes (événements, publications, départements, versets) ne sont **pas** ici :
 * elles ont leurs propres tables.
 */

/** Champ textuel : non vide après nettoyage, borné en longueur. */
const text = (max: number) => z.string().trim().min(1).max(max);

/**
 * Champs obligatoires : ceux déjà présents dans le jeu de données de référence
 * (`seed-data.ts`). Les champs facultatifs sont des compléments éditoriaux :
 * absents, la page garde son texte par défaut dans le code.
 */
export const pageContentSchemas: Record<string, ZodType> = {
  accueil: z.object({
    heroTitle: text(120),
    heroIntro: text(600),
    pastorHeading: text(160).optional(),
    pastorMessage: text(900).optional(),
  }),

  "qui-sommes-nous": z.object({
    title: text(120),
    intro: text(600),
    historyTitle: text(160).optional(),
    historyIntro: text(900).optional(),
  }),

  organisation: z.object({
    title: text(120),
    intro: text(600),
    departmentsTitle: text(160).optional(),
    departmentsIntro: text(600).optional(),
  }),

  communaute: z.object({
    title: text(120),
    intro: text(600),
    facesTitle: text(160).optional(),
    facesIntro: text(600).optional(),
  }),

  "vie-de-leglise": z.object({
    title: text(120),
    intro: text(600),
    rhythmTitle: text(160).optional(),
    rhythmIntro: text(600).optional(),
  }),

  publications: z.object({
    title: text(120),
    intro: text(600),
    teachingsTitle: text(160).optional(),
    teachingsIntro: text(600).optional(),
  }),
};

/** Clés éditables, dans l'ordre de déclaration (utile au back-office). */
export const knownPageKeys: readonly string[] = Object.keys(pageContentSchemas);

/**
 * Schéma d'une page, ou `undefined` si la clé n'est pas éditable.
 *
 * `noUncheckedIndexedAccess` rend l'accès indexé faillible : c'est exactement le
 * comportement voulu ici, une clé inconnue n'a pas de schéma.
 */
export function getPageContentSchema(pageKey: string): ZodType | undefined {
  return isKnownPageKey(pageKey) ? pageContentSchemas[pageKey] : undefined;
}

/**
 * `Object.hasOwn` plutôt qu'un simple accès : sans cela, une clé héritée du
 * prototype (`toString`, `constructor`…) serait considérée comme connue.
 */
export function isKnownPageKey(pageKey: string): boolean {
  return Object.hasOwn(pageContentSchemas, pageKey);
}
