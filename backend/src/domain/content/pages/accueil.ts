import { z } from "zod";

import { cta, mediaOrLegacyPath, opt, text, verse } from "../primitives";

/**
 * §3.1 : pendant la migration, chaque `media.optional()` du contrat est lu comme
 * `mediaOrLegacyPath.optional()` — les valeurs existantes du frontend sont des
 * chemins `/media/ccjv-XX.jpeg`. Après l'étape M6 (§6.4), seule la forme `z.uuid()`
 * subsiste et un chemin devient une erreur de validation.
 */
export const accueilContentSchema = z.strictObject({
  heroTitle: text(120),
  heroIntro: text(600),
  heroCtaPrimaryLabel: cta(),
  heroCtaSecondaryLabel: cta(),
  heroImage: mediaOrLegacyPath.optional(),

  verseKey: verse,

  pastorHeading: opt(160),
  pastorMessage: opt(900),
  pastorMessageSecondary: opt(900),
  pastorImage: mediaOrLegacyPath.optional(),

  briefTitle: opt(120),
  briefIntro: opt(600),
  briefCtaLabel: cta(),
  briefImage: mediaOrLegacyPath.optional(),

  eventsTitle: opt(120),
  eventsIntro: opt(400),
  eventsCtaLabel: cta(),

  rhythmTitle: opt(120),
  rhythmIntro: opt(400),
  rhythmCtaLabel: cta(),

  teachingsTitle: opt(120),
  teachingsIntro: opt(400),
  teachingsNote: opt(300),
  teachingsCtaLabel: cta(),

  facesTitle: opt(120),
  facesIntro: opt(400),

  breathingPhrase: opt(120),
  breathingReference: opt(120),
  breathingImage: mediaOrLegacyPath.optional(),

  prayerTitle: opt(120),
  prayerMessage: opt(600),
  prayerCtaLabel: cta(),

  supportTitle: opt(120),
  supportIntro: opt(600),
  supportNote: opt(400),
  supportCtaLabel: cta(),
  supportImage: mediaOrLegacyPath.optional(),

  sendingTitle: opt(120),
  sendingMessage: opt(600),
  sendingPrimaryCtaLabel: cta(),
  sendingSecondaryCtaLabel: cta(),
  sendingLinkLabel: cta(60),
});
