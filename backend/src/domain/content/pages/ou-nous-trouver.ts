import { z } from "zod";

import { bounded, cta, mediaOrLegacyPath, opt, text, verse } from "../primitives";

/**
 * §3.1 : pendant la migration, chaque `media.optional()` du contrat est lu comme
 * `mediaOrLegacyPath.optional()` — les valeurs existantes du frontend sont des
 * chemins `/media/ccjv-XX.jpeg`. Après l'étape M6 (§6.4), seule la forme `z.uuid()`
 * subsiste et un chemin devient une erreur de validation.
 */
export const ouNousTrouverContentSchema = z.strictObject({
  title: text(160),
  heroImage: mediaOrLegacyPath.optional(),
  heroImageAlt: opt(160),
  heroCtaLabel: cta(60),

  meetingsTitle: opt(120),
  meetingsIntro: opt(600),
  meetingsSubtitle: opt(120),
  meetingsSubtitleText: opt(400),
  scheduleEntries: bounded(
    z.strictObject({ name: text(160), time: text(60), text: text(600) }), 1, 6,
  ).optional(),
  meetingsNote: opt(400),

  addressSubtitle: opt(120),
  addressText: opt(300),
  directionsCtaLabel: cta(60),
  contactLabel: opt(120),
  contactText: opt(300),

  verseKey: verse,

  visitTitle: opt(120),
  visitIntro: opt(600),
  visitPoints: bounded(
    z.strictObject({ title: text(160), text: text(600) }), 1, 6,
  ).optional(),

  closingTitle: opt(160),
  closingBody: opt(600),
  closingImage: mediaOrLegacyPath.optional(),
  closingImageAlt: opt(160),
  closingPrimaryCtaLabel: cta(60),
  closingSecondaryCtaLabel: cta(60),
});
