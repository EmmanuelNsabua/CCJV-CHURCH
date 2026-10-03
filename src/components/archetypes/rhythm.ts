import type { BandSpace } from "@/components/composition/Band";

/**
 * Échelle de respiration partagée par les archétypes.
 *
 * Un même archétype ne doit pas produire exactement le même rythme sur toutes
 * les pages qui l'utilisent : `rhythm` module l'amplitude verticale sans
 * toucher à la structure. C'est ce qui évite de remplacer un template par huit.
 */
export type PageRhythm = "dense" | "standard" | "serene";

export const rhythmScale: Record<
  PageRhythm,
  { close: BandSpace; open: BandSpace; wide: BandSpace }
> = {
  dense: { close: "tight", open: "normal", wide: "airy" },
  standard: { close: "normal", open: "airy", wide: "silence" },
  serene: { close: "airy", open: "silence", wide: "silence" },
};
