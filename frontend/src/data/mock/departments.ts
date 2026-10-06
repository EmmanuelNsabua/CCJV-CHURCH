import type { Department } from "@/types";

/**
 * Données de démonstration — les départements sont DYNAMIQUES et ne doivent
 * jamais être codés en dur (docs/006 §3). Contenus rédigés pour la démo,
 * à remplacer via le back-office lorsque la persistance sera en place.
 */
export const departments: Department[] = [
  {
    id: "dep-adultes",
    name: "Adultes",
    slug: "adultes",
    tagline: "Grandir dans la Parole, servir ensemble.",
    description:
      "Le volet adultes rassemble les hommes et les femmes de l'église autour de la Parole, de la prière et du service. On y apprend à marcher ensemble, à porter les uns les autres et à prendre sa place dans la maison.",
    responsibleName: "Pasteur Manasse Mwamba",
    meetingSchedule: "Dimanche · 09:00 — Culte dominical",
    bannerImage: "/media/ccjv-27.jpeg",
    keyPoints: [
      "Enseignement biblique solide et accessible à tous.",
      "Prière et intercession pour la famille et la ville.",
      "Accueil et intégration des nouvelles personnes.",
      "Service concret : entraide, visite des malades, soutien.",
    ],
    gallery: [
      "/media/ccjv-09.jpeg",
      "/media/ccjv-11.jpeg",
      "/media/ccjv-12.jpeg",
      "/media/ccjv-25.jpeg",
      "/media/ccjv-28.jpeg",
      "/media/ccjv-40.jpeg",
    ],
  },
  {
    id: "dep-ecodim",
    name: "Enfants / Ecodim",
    slug: "enfants-ecodim",
    tagline: "Une génération qui apprend à connaître Dieu.",
    description:
      "Ministère des enfants né le 2 juillet 2023. L'Ecodim accompagne les plus jeunes dans la découverte de Dieu, avec un enseignement adapté à chaque âge, des chants, des histoires bibliques et beaucoup de joie.",
    responsibleName: "Responsable Ecodim — à confirmer",
    meetingSchedule: "Dimanche · 09:00 — Rencontre Ecodim",
    bannerImage: "/media/ccjv-13.jpeg",
    keyPoints: [
      "Un enseignement adapté à chaque tranche d'âge.",
      "Chants, histoires bibliques et activités créatives.",
      "Un encadrement attentif et bienveillant.",
      "Des moments de fête avec toute l'église.",
    ],
    gallery: [
      "/media/ccjv-13.jpeg",
      "/media/ccjv-15.jpeg",
      "/media/ccjv-23.jpeg",
      "/media/ccjv-31.jpeg",
      "/media/ccjv-33.jpeg",
      "/media/ccjv-37.jpeg",
    ],
  },
  {
    id: "dep-chorale",
    name: "Chorale",
    slug: "chorale",
    tagline: "Conduire l'assemblée dans la présence de Dieu.",
    description:
      "La louange à CCJV n'est pas une simple animation : c'est un sacerdoce. Chantres et musiciens se préparent chaque semaine pour conduire le peuple dans l'adoration, en esprit et en vérité.",
    responsibleName: "Responsable chorale — à confirmer",
    meetingSchedule:
      "Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30",
    bannerImage: "/media/ccjv-15.jpeg",
    keyPoints: [
      "Une adoration vivante et consacrée.",
      "Travail vocal et instrumental chaque semaine.",
      "Un service tourné vers toute l'assemblée.",
      "Une place pour chaque voix et chaque instrument.",
    ],
    gallery: [
      "/media/ccjv-15.jpeg",
      "/media/ccjv-08.jpeg",
      "/media/ccjv-12.jpeg",
      "/media/ccjv-16.jpeg",
      "/media/ccjv-17.jpeg",
      "/media/ccjv-36.jpeg",
    ],
  },
];

/** Résout le nom d'un département depuis son id (jamais de logique codée en dur). */
export function getDepartmentName(id?: string | null): string | undefined {
  if (!id) return undefined;
  return departments.find((department) => department.id === id)?.name;
}

/** Résout un département depuis son slug — utilisé par les fiches `/departements/[slug]`. */
export function getDepartmentBySlug(slug: string): Department | undefined {
  return departments.find((department) => department.slug === slug);
}
