import { z } from "zod";

import { cta, opt } from "../primitives";

/** §3.2 : contrat de gabarit, sous réserve du §7 Q-PG7. */
export const departementContentSchema = z.strictObject({
  overline: opt(80),
  closeLabel: cta(40),
  factsTitle: opt(120),
  factsScheduleLabel: opt(60),
  factsResponsibleLabel: opt(60),
  factsLocationLabel: opt(60),
  keyPointsTitle: opt(120),
  galleryTitle: opt(120),
  joinTitle: opt(120),
  joinBody: opt(600),
  joinCtaLabel: cta(60),
  switchLabel: opt(80),
  contactMessage: opt(400),
});
