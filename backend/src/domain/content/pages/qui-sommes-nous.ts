import { z } from "zod";

import { bounded, cta, media, mediaOrLegacyPath, opt, text, verse } from "../primitives";

/**
 * §3.1 : pendant la migration, chaque `media.optional()` du contrat est lu comme
 * `mediaOrLegacyPath.optional()` — les valeurs existantes du frontend sont des
 * chemins `/media/ccjv-XX.jpeg`. Après l'étape M6 (§6.4), seule la forme `z.uuid()`
 * subsiste et un chemin devient une erreur de validation.
 *
 * Les `image: media` obligatoires des tableaux ne changent pas : ils ne sont pas
 * concernés par la règle de lecture, qui ne porte que sur `media.optional()`.
 */
export const quiSommesNousContentSchema = z.strictObject({
  title: text(120),
  intro: text(600),

  heroImage: mediaOrLegacyPath.optional(),
  heroImageAlt: opt(160),

  visionHeading: opt(160),
  visionQuote: opt(600),
  visionBody: opt(900),
  visionImage: mediaOrLegacyPath.optional(),
  visionImageAlt: opt(160),

  birthDate: opt(40),
  birthHeading: opt(160),
  birthBody: opt(900),
  birthImage: mediaOrLegacyPath.optional(),
  birthImageAlt: opt(160),
  birthCaption: opt(200),

  verseKeys: bounded(verse.unwrap(), 0, 2).optional(),
  versePairImages: bounded(
    z.strictObject({ image: media, alt: opt(160) }), 0, 2,
  ).optional(),

  historyHeading: opt(120),
  historyIntro: opt(600),
  milestones: bounded(
    z.strictObject({
      date: text(40),
      title: text(160),
      text: text(900),
      image: mediaOrLegacyPath.optional(),
      alt: opt(160),
    }), 1, 4,
  ).optional(),

  transitionTitle: opt(120),
  transitionImage: mediaOrLegacyPath.optional(),
  transitionImageAlt: opt(160),

  convictionsHeading: opt(300),
  convictionsIntro: opt(600),

  pillarsHeading: opt(120),
  pillars: bounded(
    z.strictObject({
      category: text(60),
      angle: opt(60),
      title: text(120),
      text: text(600),
      references: text(160),
    }), 1, 6,
  ).optional(),

  shapeHeading: opt(120),
  shapeBody: opt(900),
  shapePhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 6,
  ).optional(),

  todayHeading: opt(120),
  todayBody: opt(900),
  todayImage: mediaOrLegacyPath.optional(),
  todayImageAlt: opt(160),
  todayFacts: bounded(
    z.strictObject({ label: text(60), value: text(60) }), 1, 4,
  ).optional(),

  facesHeading: opt(300),
  facesIntro: opt(600),
  facesCtaLabel: cta(60),

  outroHeading: opt(120),
  outroBody: opt(600),

  callHeading: opt(160),
  callBody: opt(600),
  callPrimaryCtaLabel: cta(),
  callSecondaryCtaLabel: cta(),
});
