/**
 * Sélection des photos réelles CCJV (copies propres dans /public/media ;
 * les originaux restent intacts dans /public/images).
 *
 * ⚠️ Les valeurs ci-dessous sont des RÔLES DE MISE EN PAGE, pas des légendes.
 * L'agent n'a pas de capacité d'analyse d'image : aucune légende affirmative
 * n'est écrite à partir de ces fichiers, et la correspondance photo → sujet doit
 * être relue par CCJV avant mise en production.
 */

export const images = {
  /** Ouverture d'accueil — paysage large. */
  hero: "/media/ccjv-02.jpeg",
  /** Identité / rassemblement. */
  identite: "/media/ccjv-27.jpeg",
  /** Louange et adoration. */
  louange: "/media/ccjv-08.jpeg",
  /** Vie communautaire. */
  communaute: "/media/ccjv-30.jpeg",
  /** Ministère des enfants (Ecodim). */
  ecodim: "/media/ccjv-13.jpeg",
  /** Portrait grand format (vertical). */
  portraitLarge: "/media/ccjv-05.jpeg",
  /** Portrait (vertical). */
  portraitA: "/media/ccjv-01.jpeg",
  /** Portrait (vertical). */
  portraitB: "/media/ccjv-03.jpeg",
  /** Assemblée en culte. */
  assemblee: "/media/ccjv-09.jpeg",
  /** Chorale et musiciens. */
  chorale: "/media/ccjv-15.jpeg",
  /** Prédication / enseignement. */
  predication: "/media/ccjv-11.jpeg",
  /** Vie de quartier / extérieur. */
  exterieur: "/media/ccjv-21.jpeg",
  /** Service et entraide. */
  service: "/media/ccjv-28.jpeg",
  /** Rencontre fraternelle. */
  fraternite: "/media/ccjv-35.jpeg",
} as const;

/** Réserve d'images pour les galeries (aucune légende n'y est associée). */
export const photoPool: string[] = [
  "/media/ccjv-09.jpeg",
  "/media/ccjv-11.jpeg",
  "/media/ccjv-12.jpeg",
  "/media/ccjv-15.jpeg",
  "/media/ccjv-16.jpeg",
  "/media/ccjv-17.jpeg",
  "/media/ccjv-23.jpeg",
  "/media/ccjv-25.jpeg",
  "/media/ccjv-28.jpeg",
  "/media/ccjv-31.jpeg",
  "/media/ccjv-32.jpeg",
  "/media/ccjv-33.jpeg",
  "/media/ccjv-36.jpeg",
  "/media/ccjv-37.jpeg",
  "/media/ccjv-40.jpeg",
];

/** Sélection pour les publications de type PHOTO. */
export const galleryImages: string[] = [
  "/media/ccjv-09.jpeg",
  "/media/ccjv-11.jpeg",
  "/media/ccjv-12.jpeg",
  "/media/ccjv-15.jpeg",
  "/media/ccjv-23.jpeg",
  "/media/ccjv-25.jpeg",
  "/media/ccjv-28.jpeg",
  "/media/ccjv-32.jpeg",
  "/media/ccjv-37.jpeg",
  "/media/ccjv-40.jpeg",
];
