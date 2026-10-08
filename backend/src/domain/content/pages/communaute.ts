import { z } from "zod";

import { bounded, text } from "../primitives";

/**
 * Contrat minimal : la page n'a pas de route servie (§2.6) et les textes des
 * quatre sous-pages communautaires restent hors contrat jusqu'à décision
 * (§7 Q-PG10).
 */
export const communauteContentSchema = z.strictObject({
  title: text(120),
  intro: text(600),
  doors: bounded(
    z.strictObject({ label: text(120), description: text(300) }), 1, 6,
  ).optional(),
});
