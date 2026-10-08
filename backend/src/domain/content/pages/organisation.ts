import { z } from "zod";

import { bounded, cta, media, opt, text, verse } from "../primitives";

export const organisationContentSchema = z.strictObject({
  title: text(120),
  intro: text(600),
  overline: opt(80),
  heroPrimaryCtaLabel: cta(),
  heroSecondaryCtaLabel: cta(),

  heroPhotos: bounded(
    z.strictObject({ image: media, alt: text(160), label: text(60) }), 1, 4,
  ).optional(),

  verseKeys: bounded(verse.unwrap(), 0, 3).optional(),

  leadersHeading: opt(120),
  leadersIntro: opt(600),
  leadersFallbackLabel: opt(80),
  leadersEmptyTitle: opt(120),
  leadersEmptyText: opt(300),

  coordinationHeading: opt(120),
  coordinationIntro: opt(600),
  coordinationFallback: opt(600),

  transitionHeading: opt(300),
  transitionSubtitle: opt(200),
  transitionBody: opt(900),
  transitionPhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 4,
  ).optional(),

  departmentsTitle: opt(160),
  departmentsIntro: opt(600),
  departmentsEmptyTitle: opt(120),
  departmentsEmptyText: opt(300),

  joinHeading: opt(160),
  joinBody: opt(900),
  joinSteps: bounded(
    z.strictObject({ title: text(120), text: text(600) }), 1, 5,
  ).optional(),
  joinPrimaryCtaLabel: cta(),
  joinSecondaryCtaLabel: cta(),
  joinLinkLabel: cta(60),
});
