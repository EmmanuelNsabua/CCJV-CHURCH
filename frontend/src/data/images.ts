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
  identite: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/aea87014-f8ca-4687-87d1-fdf66d7e99ef.jpg",
  /** Louange et adoration. */
  louange: "/media/ccjv-08.jpeg",
  /** Vie communautaire. */
  communaute: "/media/ccjv-30.jpeg",
  /** Ministère des enfants (Ecodim). */
  ecodim: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/3ac64c4e-feb1-41f3-8ca9-4a7a35fd1915.jpg",
  /** Image de la foi */
  foi: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/7f986717-f307-48cb-890d-1cdfb579cad8.jpg",
  /** Image de la louange */
  adoration: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/7028662f-97ac-4941-ad7e-daac3e636bb9.jpg",
  /** Début de l'Ecodim */
  ecodimAncien: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/64cefa2b-a0b3-468c-b8a5-bf243ed3aaa1.jpg",
  /** Portrait grand format (vertical). */
  portraitLarge: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/165129e3-ec16-4791-83b6-20f8e483df4a.jpg",
  /** Portrait du pasteur */
  pastor: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/a6dfb3f6-d17f-48ef-b6ff-adaea2f73048.jpg",
  /** Portrait (vertical). */
  portraitA: "/media/ccjv-07.jpeg",
  /** Portrait (vertical). */
  portraitB: "/media/ccjv-19.jpeg",
  /** Assemblée en culte. */
  assemblee: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/23ec1d87-668f-4b03-8305-42a47ceabad5.jpg",
  /** Chorale et musiciens. */
  chorale: "/media/ccjv-15.jpeg",
  /** Ministère, groupe et chorale */
  groupe: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/e8c98f72-6625-420e-ab54-5de5c4c0f665.jpg",
  /** Prédication / enseignement. */
  predication: "/media/ccjv-11.jpeg",
  /** Visuel de l'église */
  churchVisual: "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/aeed56ec-819d-48ca-b16d-b307883c2bea.jpg",
  /** Vie de quartier / extérieur. */
  exterieur: "/media/ccjv-21.jpeg",
  /** Service et entraide. */
  service: "/media/ccjv-28.jpeg",
  /** Rencontre fraternelle. */
  fraternite: "/media/ccjv-35.jpeg",
} as const;
