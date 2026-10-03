import type { Event } from "@/types";
import { daysFromNow, getEventStatus } from "@/lib/utils";

/**
 * Données de démonstration (à remplacer par l'API `/api/v1/events`).
 * Les dates sont calculées relativement à aujourd'hui pour que le tri
 * UPCOMING / ARCHIVED reste fonctionnel. Contenus rédigés pour la démo.
 */
const rawEvents: Omit<Event, "status">[] = [
  {
    id: "evt-001",
    title: "Culte dominical",
    slug: "culte-dominical",
    excerpt:
      "Le rendez-vous de toute la famille CCJV : louange, Parole et communion fraternelle.",
    description:
      "Chaque dimanche, l'assemblée se rassemble pour adorer Dieu, écouter Sa Parole et vivre la communion fraternelle. Un moment ouvert à tous — membres comme visiteurs. Venez comme vous êtes.",
    eventDate: daysFromNow(3),
    eventTime: "09:00",
    location: "Temple CCJV — Lubumbashi",
    imageUrl: "/media/ccjv-08.jpeg",
    bannerImage: "/media/ccjv-08.jpeg",
    gallery: [
      "/media/ccjv-08.jpeg",
      "/media/ccjv-11.jpeg",
      "/media/ccjv-12.jpeg",
      "/media/ccjv-25.jpeg",
    ],
    departmentId: "dep-adultes",
    practicalInfo: [
      "Ouvert à tous, sans inscription.",
      "Accueil dès 08h30.",
      "Un espace est prévu pour les enfants (Ecodim).",
    ],
  },
  {
    id: "evt-002",
    title: "Rencontre Ecodim",
    slug: "rencontre-ecodim",
    excerpt:
      "Un temps pensé pour les enfants : chants, histoires bibliques et joie partagée.",
    description:
      "L'Ecodim réunit les enfants de l'église pour découvrir Dieu à leur mesure : chants, récits bibliques, activités créatives et beaucoup de joie. Les parents sont les bienvenus.",
    eventDate: daysFromNow(7),
    eventTime: "14:00",
    location: "Salle Ecodim — Lubumbashi",
    imageUrl: "/media/ccjv-13.jpeg",
    bannerImage: "/media/ccjv-13.jpeg",
    gallery: [
      "/media/ccjv-13.jpeg",
      "/media/ccjv-15.jpeg",
      "/media/ccjv-23.jpeg",
      "/media/ccjv-31.jpeg",
    ],
    departmentId: "dep-ecodim",
    practicalInfo: [
      "Pour les enfants de 3 à 12 ans.",
      "Encadrement assuré par l'équipe Ecodim.",
      "Prévenir l'équipe pour un premier passage.",
    ],
  },
  {
    id: "evt-003",
    title: "Répétition de la chorale",
    slug: "repetition-chorale",
    excerpt:
      "Chantres et musiciens préparent le service du dimanche dans la prière.",
    description:
      "La chorale se réunit chaque semaine pour prier, travailler l'harmonie des voix et préparer la louange du dimanche. Une place existe pour chaque voix comme pour chaque instrument.",
    eventDate: daysFromNow(10),
    eventTime: "17:00",
    location: "Temple CCJV — Lubumbashi",
    imageUrl: "/media/ccjv-15.jpeg",
    bannerImage: "/media/ccjv-15.jpeg",
    gallery: ["/media/ccjv-15.jpeg", "/media/ccjv-16.jpeg", "/media/ccjv-17.jpeg"],
    departmentId: "dep-chorale",
    practicalInfo: [
      "Ouvert à ceux qui souhaitent servir par la musique.",
      "Aucun niveau requis pour commencer.",
    ],
  },
  {
    id: "evt-004",
    title: "Culte spécial — Action de grâce",
    slug: "culte-special-action-de-grace",
    excerpt:
      "Un dimanche mis à part pour rendre grâce ensemble pour l'année écoulée.",
    description:
      "Une célébration commune où toute l'église rend grâce pour ce que Dieu a accompli : témoignages, louange prolongée et Parole. Un moment fort de la vie de la communauté.",
    eventDate: daysFromNow(16),
    eventTime: "09:00",
    location: "Temple CCJV — Lubumbashi",
    imageUrl: "/media/ccjv-09.jpeg",
    bannerImage: "/media/ccjv-09.jpeg",
    gallery: ["/media/ccjv-09.jpeg", "/media/ccjv-28.jpeg", "/media/ccjv-40.jpeg"],
    departmentId: null,
    practicalInfo: ["Toute l'église est invitée.", "Célébration suivie d'un repas fraternel."],
  },
  {
    id: "evt-005",
    title: "Culte dominical",
    slug: "culte-dominical-passe",
    excerpt: "Retour sur le culte du dimanche dernier.",
    description:
      "Le culte du dimanche dernier a réuni l'assemblée autour de la Parole et de la louange.",
    eventDate: daysFromNow(-4),
    eventTime: "09:00",
    location: "Temple CCJV — Lubumbashi",
    imageUrl: "/media/ccjv-11.jpeg",
    gallery: ["/media/ccjv-11.jpeg", "/media/ccjv-12.jpeg"],
    departmentId: "dep-adultes",
  },
  {
    id: "evt-006",
    title: "Journée communautaire",
    slug: "journee-communautaire",
    excerpt: "Une journée de fraternité, de jeux et de partage entre tous.",
    description:
      "Toute l'église s'est retrouvée pour une journée de fraternité : repas partagé, jeux, chants et conversations simples. La preuve que l'église est d'abord une famille.",
    eventDate: daysFromNow(-14),
    eventTime: "10:00",
    location: "Lubumbashi",
    imageUrl: "/media/ccjv-27.jpeg",
    gallery: ["/media/ccjv-27.jpeg", "/media/ccjv-30.jpeg"],
    departmentId: null,
  },
  {
    id: "evt-007",
    title: "Répétition de la chorale",
    slug: "repetition-chorale-passee",
    excerpt: "Préparation de la louange du dimanche.",
    description:
      "Répétition hebdomadaire de la chorale : travail vocal, harmonisation et prière.",
    eventDate: daysFromNow(-18),
    eventTime: "17:00",
    location: "Temple CCJV — Lubumbashi",
    departmentId: "dep-chorale",
  },
];

export const events: Event[] = rawEvents.map((e) => ({
  ...e,
  status: getEventStatus(e.eventDate),
}));

/** Événements à venir, triés par date croissante. */
export const upcomingEvents: Event[] = events
  .filter((e) => e.status === "UPCOMING")
  .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

/** Événements passés, triés par date décroissante. */
export const archivedEvents: Event[] = events
  .filter((e) => e.status === "ARCHIVED")
  .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

/** Résout un événement depuis son slug — utilisé par `/evenements/[slug]`. */
export function getEventBySlug(slug: string): Event | undefined {
  return events.find((event) => event.slug === slug);
}
