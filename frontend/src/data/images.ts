/**
 * Rôles de mise en page sur les photographies réelles CCJV.
 *
 * ### Ce que ce fichier est, et ce qu'il n'est pas
 *
 * Chaque entrée est un **rôle de mise en page** — « ouverture d'accueil »,
 * « portrait vertical », « assemblée en culte » — associé à une photographie
 * réellement fournie par CCJV, servie depuis `/public/media`. Ce ne sont pas des
 * légendes : aucune affirmation n'est portée sur le sujet exact de l'image, et
 * ces usages restent décoratifs ou institutionnels.
 *
 * Ce qu'il n'est plus : un réservoir d'illustrations pour des contenus métier.
 * Deux listes ont été retirées parce qu'elles **fabriquaient** des associations :
 *
 * | Retiré | Pourquoi |
 * | --- | --- |
 * | `photoPool` | servait à composer des « albums » de la médiathèque sans lien avec les publications réelles |
 * | `galleryImages` | servait de galerie de remplacement sur les fiches de publication, associant des photos arbitraires à un contenu réel |
 *
 * Les pages concernées utilisent désormais les médias **réels** renvoyés par
 * l'API (`coverImage`, `contentUrl`, `gallery`, médias `THUMBNAIL` d'un
 * enseignement). Quand il n'y a pas de média, aucune image n'est affichée —
 * jamais une image d'emprunt présentée comme celle du contenu.
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
