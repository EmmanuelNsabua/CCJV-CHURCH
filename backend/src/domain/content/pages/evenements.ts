import { z } from "zod";

import { bounded, cta, media, mediaOrLegacyPath, opt, text, verse } from "../primitives";

/**
 * §3.1 : pendant la migration, chaque `media.optional()` du contrat est lu comme
 * `mediaOrLegacyPath.optional()` — les valeurs existantes du frontend sont des
 * chemins `/media/ccjv-XX.jpeg`. Après l'étape M6 (§6.4), seule la forme `z.uuid()`
 * subsiste et un chemin devient une erreur de validation.
 */
export const evenementsContentSchema = z.strictObject({
  title: text(160),
  verseKeys: bounded(verse.unwrap(), 0, 2).optional(),
  verseImages: bounded(
    z.strictObject({ image: media, alt: text(160) }), 0, 2,
  ).optional(),
  heroPhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 6,
  ).optional(),

  leadSectionTitle: opt(120),
  leadFallbackLabel: opt(60),
  leadWhenLabel: opt(40),
  leadWhereLabel: opt(40),
  leadCtaLabel: cta(60),

  upcomingTitle: opt(120),
  upcomingFallbackLabel: opt(60),
  upcomingLeadCtaLabel: cta(60),
  upcomingItemCtaLabel: cta(60),

  pillarsTitle: opt(120),
  pillarsIntro: opt(600),
  pillars: bounded(
    z.strictObject({
      overline: text(40),
      title: text(120),
      text: text(600),
      ctaLabel: text(60),
    }), 1, 6,
  ).optional(),

  rhythmTitle: opt(120),
  rhythmIntro: opt(600),
  weeklyEntries: bounded(
    z.strictObject({
      day: text(30),
      time: text(30),
      title: text(160),
      location: text(120),
      type: text(80),
      text: text(600),
    }), 1, 6,
  ).optional(),

  photoQuote: opt(600),
  photoQuoteBody: opt(600),
  photoQuoteCtaLabel: cta(60),
  photoQuoteImage: mediaOrLegacyPath.optional(),

  departmentsTitle: opt(120),
  departmentsIntro: opt(600),
  departmentsCtaLabel: cta(60),
  departmentsEmptyText: opt(600),

  archivedTitle: opt(120),
  archivedIntro: opt(600),

  invitationTitle: opt(160),
  invitationBody: opt(900),
  invitationPrimaryCtaLabel: cta(60),
  invitationSecondaryCtaLabel: cta(60),
});
