import type { Publication } from "@/types";
import { daysFromNow } from "@/lib/utils";

/**
 * Données de démonstration (à remplacer par l'API `/api/v1/publications`).
 * Tri chronologique décroissant. Vidéos : liens externes (YouTube).
 * Contenus rédigés pour la démo.
 */
export const publications: Publication[] = [
  {
    id: "pub-001",
    title: "Culte du dimanche — La maison de Dieu",
    slug: "culte-du-dimanche-la-maison-de-dieu",
    type: "VIDEO",
    category: "ENSEIGNEMENT",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "Pasteur Manasse Mwamba",
    description:
      "Message du dimanche sur la joie d'entrer dans la maison de Dieu et d'y être accueilli.",
    publishedAt: daysFromNow(-2),
  },
  {
    id: "pub-002",
    title: "Retour en images — Culte dominical",
    slug: "retour-en-images-culte-dominical",
    type: "PHOTO",
    category: "MEDIA",
    contentUrl: "/media/ccjv-09.jpeg",
    description:
      "Quelques instants de louange, d'écoute de la Parole et de communion fraternelle.",
    publishedAt: daysFromNow(-5),
  },
  {
    id: "pub-003",
    title: "Enseignement — Une foi qui se vit ensemble",
    slug: "enseignement-une-foi-qui-se-vit-ensemble",
    type: "VIDEO",
    category: "ENSEIGNEMENT",
    contentUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    author: "Pasteur Manasse Mwamba",
    description:
      "Pourquoi la foi chrétienne ne se vit jamais seul, et ce que cela change dans nos semaines.",
    publishedAt: daysFromNow(-9),
  },
  {
    id: "pub-004",
    title: "Album — Louange et adoration",
    slug: "album-louange-et-adoration",
    type: "PHOTO",
    category: "MEDIA",
    contentUrl: "/media/ccjv-15.jpeg",
    description:
      "La chorale conduit l'assemblée dans l'adoration, en esprit et en vérité.",
    publishedAt: daysFromNow(-13),
  },
  {
    id: "pub-005",
    title: "Annonce — Rentrée de l'Ecodim",
    slug: "annonce-rentree-de-lecodim",
    type: "TEXTE",
    category: "ACTUALITE",
    description:
      "Le ministère des enfants reprend ses rencontres. Parents, voici tout ce qu'il faut savoir pour accompagner vos enfants.",
    publishedAt: daysFromNow(-20),
    body: [
      "L'Ecodim, le ministère des enfants du Centre Chrétien Jésus ma Vie, reprend ses rencontres hebdomadaires.",
      "Chaque dimanche, les enfants sont accueillis par une équipe dédiée pour un temps adapté à leur âge : chants, récits bibliques et activités.",
      "Les parents qui souhaitent inscrire leur enfant pour la première fois sont invités à se présenter un peu avant le culte afin que nous puissions faire connaissance.",
    ],
  },
  {
    id: "pub-006",
    title: "Vie de l'Ecodim en images",
    slug: "vie-de-lecodim-en-images",
    type: "PHOTO",
    category: "MEDIA",
    contentUrl: "/media/ccjv-23.jpeg",
    description: "Les enfants de CCJV, leur joie et leurs activités.",
    publishedAt: daysFromNow(-27),
  },
  {
    id: "pub-007",
    title: "Nouvelle saison des groupes de maison",
    slug: "nouvelle-saison-des-groupes-de-maison",
    type: "TEXTE",
    category: "ACTUALITE",
    description:
      "Les groupes de maison reprennent dans plusieurs quartiers de Lubumbashi. Voici comment en rejoindre un.",
    publishedAt: daysFromNow(-31),
    body: [
      "Les groupes de maison sont de petits rassemblements, dans un quartier, chez un membre : on y prie, on y partage la Parole et on s'y soutient concrètement.",
      "Une nouvelle saison commence. Si vous souhaitez rejoindre un groupe près de chez vous, écrivez-nous : nous vous mettrons en relation.",
    ],
  },
  {
    id: "pub-008",
    title: "Guide d'étude — Les fondements de la foi",
    slug: "guide-detude-les-fondements-de-la-foi",
    type: "TEXTE",
    category: "RESSOURCE",
    description:
      "Un parcours en six séances pour découvrir ou affermir les fondements de la foi chrétienne, seul ou en groupe.",
    publishedAt: daysFromNow(-38),
    body: [
      "Ce guide accompagne les nouveaux venus comme les membres qui souhaitent revisiter l'essentiel.",
      "Six séances : la grâce, la Parole, la prière, la communauté, le service, la persévérance.",
      "Chaque séance propose un texte biblique, quelques questions et un temps de prière.",
    ],
  },
  {
    id: "pub-009",
    title: "Plan de lecture biblique",
    slug: "plan-de-lecture-biblique",
    type: "TEXTE",
    category: "RESSOURCE",
    description:
      "Un plan simple pour lire la Bible régulièrement, adapté à ceux qui débutent comme à ceux qui reprennent.",
    publishedAt: daysFromNow(-44),
    body: [
      "Lire la Bible régulièrement change la manière de traverser la semaine.",
      "Ce plan propose un rythme accessible : un passage court chaque jour, et un temps de reprise communautaire une fois par semaine.",
    ],
  },
  {
    id: "pub-010",
    title: "Journée communautaire en images",
    slug: "journee-communautaire-en-images",
    type: "PHOTO",
    category: "MEDIA",
    contentUrl: "/media/ccjv-30.jpeg",
    description:
      "Une journée de fraternité : repas partagé, jeux, chants et conversations simples.",
    publishedAt: daysFromNow(-52),
  },
];

/** Résout une publication depuis son slug — utilisé par `/publications/[slug]`. */
export function getPublicationBySlug(slug: string): Publication | undefined {
  return publications.find((publication) => publication.slug === slug);
}

/** Publications filtrées par rubrique éditoriale (tri chronologique). */
export function getPublicationsByCategory(
  category: NonNullable<Publication["category"]>,
): Publication[] {
  return publications.filter((publication) => publication.category === category);
}
