/**
 * Nature d'un média, et règle d'admission par champ de formulaire.
 *
 * **Pourquoi cette règle existe.** La médiathèque est commune : elle contient
 * des photos, des vidéos, des sons — et, depuis que l'espace Ressources accepte
 * les PDF, des **documents**. Un champ qui attend une image de couverture ne
 * doit pas pouvoir recevoir un PDF : le sélecteur le proposerait, l'image
 * s'afficherait cassée sur le site public, et la cause serait invisible côté
 * back-office. Le type attendu est donc une propriété du **champ**, pas un
 * filtre que l'utilisateur peut annuler d'un clic.
 *
 * La règle est exprimée ici, hors de tout composant, pour être réutilisable et
 * vérifiable : un `mimeType` suffit, aucune requête n'est nécessaire.
 */

/** Nature d'un média, déduite de son type MIME. */
export type MediaKind = "image" | "video" | "audio" | "document";

/** Ce qu'un champ de formulaire accepte. */
export type MediaAccept = readonly MediaKind[];

/**
 * Classe un type MIME.
 *
 * Tout ce qui n'est ni image, ni vidéo, ni audio est un **document** : la
 * classification est volontairement fermée par le bas plutôt qu'ouverte, pour
 * qu'un type inconnu (`application/pdf`, `application/zip`, `""`) ne puisse
 * jamais passer pour une image.
 */
export function mediaKindOf(mimeType: string | null | undefined): MediaKind {
  const mime = (mimeType ?? "").toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

/**
 * Ce média est-il d'un type que le champ accepte ?
 *
 * `accept` absent ou vide = aucune restriction (médiathèque complète).
 */
export function isMediaAccepted(
  mimeType: string | null | undefined,
  accept?: MediaAccept | null,
): boolean {
  if (!accept || accept.length === 0) return true;
  return accept.includes(mediaKindOf(mimeType));
}

/** Libellé français d'une nature de média, pour les filtres et les badges. */
export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  image: "Images",
  video: "Vidéos",
  audio: "Audios",
  document: "Documents",
};
