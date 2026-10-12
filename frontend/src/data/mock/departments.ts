import type { Department } from "@/types";

/**
 * Référentiel des départements officiels CCJV (conforme au document institutionnel).
 * Les départements sont dynamiques et présentés dans /organisation.
 */
export const departments: Department[] = [
  {
    id: "dep-serviteurs",
    name: "Collège des Serviteurs",
    slug: "serviteurs",
    tagline: "Veiller sur le troupeau et enseigner la saine doctrine.",
    description:
      "Le collège des serviteurs rassemble les ouvriers consacrés qui soutiennent la vision pastorale, animent les cellules de disciples et veillent sur la croissance spirituelle de chaque membre.",
    responsibleName: "Pasteur Manasse Mwamba",
    meetingSchedule: "Mardi & Vendredi · 16h30 | Dimanche · 08h30",
    bannerImage: "/media/ccjv-09.jpeg",
    keyPoints: [
      "Soutien pastoral et écoute des familles.",
      "Formation des disciples et affermissement spirituel.",
      "Enseignement des Écritures et prière pour l'église.",
      "Coordination collégiale des ministères.",
    ],
    gallery: [
      "/media/ccjv-09.jpeg",
      "/media/ccjv-11.jpeg",
      "/media/ccjv-25.jpeg",
      "/media/ccjv-27.jpeg",
    ],
    verse: {
      text: "Du reste, ce qu'on demande des dispensateurs, c'est que chacun soit trouvé fidèle.",
      reference: "1 Corinthiens 4:2",
    },
  },
  {
    id: "dep-chorale-grand-groupe",
    name: "Chorale Grand Groupe CCJV",
    slug: "chorale-grand-groupe",
    tagline: "Conduire l'assemblée dans la louange et l'adoration.",
    description:
      "Chantres, choristes et musiciens préparent chaque semaine l'atmosphère d'adoration des cultes dominicaux et des rassemblements majeurs de l'église.",
    responsibleName: "Coordination de la Louange",
    meetingSchedule: "Lundi 16h30–18h30 · Mercredi 21h30 · Samedi 16h30–18h30",
    bannerImage: "/media/ccjv-15.jpeg",
    keyPoints: [
      "Louange vivante et adoration en esprit et en vérité.",
      "Répétitions vocales et instrumentales régulières.",
      "Veillée de sanctification chaque mercredi soir.",
      "Accompagnement des nouveaux talents musicaux.",
    ],
    gallery: [
      "/media/ccjv-15.jpeg",
      "/media/ccjv-08.jpeg",
      "/media/ccjv-16.jpeg",
      "/media/ccjv-17.jpeg",
    ],
    verse: {
      text: "Que tout ce qui respire loue l'Éternel ! Louez l'Éternel !",
      reference: "Psaume 150:6",
    },
  },
  {
    id: "dep-cano-vocal",
    name: "Chorale Cano Vocal",
    slug: "cano-vocal",
    tagline: "Harmonies et célébration vocale pour la gloire de Dieu.",
    description:
      "Groupe vocal dédié au travail des voix, aux compositions polyphoniques et aux cantiques inspirés lors des temps forts et des cultes de célébration.",
    responsibleName: "Direction Cano Vocal",
    meetingSchedule: "Samedi · 16h30 à 18h30",
    bannerImage: "/media/ccjv-16.jpeg",
    keyPoints: [
      "Recherche de l'harmonie vocale et expression spirituelle.",
      "Chants sacrés, hymnes et compositions originales.",
      "Formation technique et discipline des chantres.",
    ],
    gallery: [
      "/media/ccjv-16.jpeg",
      "/media/ccjv-15.jpeg",
      "/media/ccjv-08.jpeg",
      "/media/ccjv-36.jpeg",
    ],
    verse: {
      text: "Chantez à l'Éternel un cantique nouveau ! Chantez à l'Éternel, vous tous, habitants de la terre !",
      reference: "Psaume 96:1",
    },
  },
  {
    id: "dep-ecodim",
    name: "Ecodim — Ministère des Enfants",
    slug: "enfants-ecodim",
    tagline: "Former une génération qui connaît et aime Dieu dès l'enfance.",
    description:
      "Né le 2 juillet 2023, l'Ecodim accueille les enfants pendant les cultes pour leur transmettre la Parole à travers des enseignements adaptés, des chants et des activités créatives.",
    responsibleName: "Équipe pastorale Ecodim",
    meetingSchedule: "Dimanche · 08h30 à 11h30 (pendant le culte)",
    bannerImage: "/media/ccjv-13.jpeg",
    keyPoints: [
      "Enseignement biblique adapté à chaque tranche d'âge.",
      "Encadrement sécurisé, attentionné et joyeux.",
      "Chants d'adoration pour enfants et ateliers bibliques.",
      "Moments festifs et représentations avec toute l'église.",
    ],
    gallery: [
      "/media/ccjv-13.jpeg",
      "/media/ccjv-18.jpeg",
      "/media/ccjv-23.jpeg",
      "/media/ccjv-31.jpeg",
    ],
    verse: {
      text: "Instruis l'enfant selon la voie qu'il doit suivre; et quand il sera vieux, il ne s'en détournera pas.",
      reference: "Proverbes 22:6",
    },
  },
  {
    id: "dep-affaires-sociales",
    name: "Affaires Sociales & Entraide",
    slug: "affaires-sociales",
    tagline: "Manifester l'amour du Christ par des actes de compassion concrets.",
    description:
      "Ce pôle porte l'entraide fraternelle au sein de la communauté : visite des malades, soutien matériel aux personnes vulnérables, accompagnement des deuils et réjouissances familiales.",
    responsibleName: "Coordination Diaconale & Sociale",
    meetingSchedule: "Permanence après les cultes & Visites en semaine",
    bannerImage: "/media/ccjv-28.jpeg",
    keyPoints: [
      "Assistance matérielle et alimentaire d'urgence.",
      "Visites fraternelles aux malades et personnes isolées.",
      "Accompagnement des familles dans les événements de vie.",
      "Collecte et redistribution solidaire au sein de l'assemblée.",
    ],
    gallery: [
      "/media/ccjv-28.jpeg",
      "/media/ccjv-30.jpeg",
      "/media/ccjv-35.jpeg",
      "/media/ccjv-27.jpeg",
    ],
    verse: {
      text: "Pendant que nous en avons l'occasion, pratiquons le bien envers tous, et surtout envers les frères en la foi.",
      reference: "Galates 6:10",
    },
  },
  {
    id: "dep-hygiene-assainissement",
    name: "Hygiène & Assainissement",
    slug: "hygiene-assainissement",
    tagline: "Préparer un cadre digne, propre et accueillant pour la maison de Dieu.",
    description:
      "Veille à la propreté, à la salubrité et à l'intendance de tous les espaces de rassemblement avant, pendant et après chaque culte et événement.",
    responsibleName: "Responsable Intendance & Salubrité",
    meetingSchedule: "Avant et après chaque rassemblement",
    bannerImage: "/media/ccjv-21.jpeg",
    keyPoints: [
      "Nettoyage et désinfection rigoureuse du temple.",
      "Entretien des installations et du mobilier de culte.",
      "Maintien d'un environnement sain et agréable pour tous.",
    ],
    gallery: [
      "/media/ccjv-21.jpeg",
      "/media/ccjv-28.jpeg",
      "/media/ccjv-09.jpeg",
    ],
    verse: {
      text: "Mais que tout se fasse avec bienséance et avec ordre.",
      reference: "1 Corinthiens 14:40",
    },
  },
  {
    id: "dep-protocole",
    name: "Protocole & Accueil",
    slug: "protocole",
    tagline: "Accueillir chaque visiteur avec le sourire et la chaleur du Christ.",
    description:
      "Le premier contact des fidèles et des nouveaux arrivants : orientation, gestion des places assises, ordre dans l'assemblée et assistance aux besoins du culte.",
    responsibleName: "Coordination du Protocole",
    meetingSchedule: "Dimanche dès 07h45 · Mardi & Vendredi dès 15h45",
    bannerImage: "/media/ccjv-38.jpeg",
    keyPoints: [
      "Accueil chaleureux et personnalisé à l'entrée.",
      "Placement et fluidité dans le temple.",
      "Orientation des nouveaux venus vers le parcours d'intégration.",
      "Gestion de l'ordre et des nécessités pratiques du service.",
    ],
    gallery: [
      "/media/ccjv-38.jpeg",
      "/media/ccjv-01.jpeg",
      "/media/ccjv-35.jpeg",
      "/media/ccjv-30.jpeg",
    ],
    verse: {
      text: "Pourvoyez aux besoins des saints. Exercez l'hospitalité avec empressement.",
      reference: "Romains 12:13",
    },
  },
  {
    id: "dep-evangelisation",
    name: "Évangélisation & Mission",
    slug: "evangelisation",
    tagline: "Annoncer la Bonne Nouvelle de Jésus-Christ à Lubumbashi.",
    description:
      "Équipe missionnaire qui va à la rencontre des habitants dans les quartiers, anime des campagnes de rue, témoigne de l'amour de Dieu et invite aux cultes.",
    responsibleName: "Responsable Évangélisation",
    meetingSchedule: "Samedi matin · Sorties missionnaires de quartier",
    bannerImage: "/media/ccjv-27.jpeg",
    keyPoints: [
      "Sorties d'évangélisation de proximité dans les avenues.",
      "Distribution de traités et entretiens spirituels.",
      "Suivi des nouvelles âmes jusqu'à leur intégration à l'église.",
      "Organisation de temps forts d'évangélisation en plein air.",
    ],
    gallery: [
      "/media/ccjv-27.jpeg",
      "/media/ccjv-35.jpeg",
      "/media/ccjv-28.jpeg",
      "/media/ccjv-11.jpeg",
    ],
    verse: {
      text: "Allez par tout le monde, et prêchez la bonne nouvelle à toute la création.",
      reference: "Marc 16:15",
    },
  },
  {
    id: "dep-intercession",
    name: "Intercession & Prière",
    slug: "intercession",
    tagline: "Porter l'église, les familles et la nation devant le trône de grâce.",
    description:
      "Sentinelles spirituelles de l'assemblée : prière continue pour les cultes, soutien des requêtes reçues, veillées de combat spirituel et délivrance.",
    responsibleName: "Responsable Intercession",
    meetingSchedule: "Vendredi 16h30–18h30 · Vigiles matinales & veillées",
    bannerImage: "/media/ccjv-09.jpeg",
    keyPoints: [
      "Prière fervente avant chaque culte pour la prédication.",
      "Prise en charge discrète de toutes les demandes de prière.",
      "Jeûnes et prières programmés pour la vie de l'église.",
      "Intercession pour le réveil spirituel de la ville.",
    ],
    gallery: [
      "/media/ccjv-09.jpeg",
      "/media/ccjv-12.jpeg",
      "/media/ccjv-25.jpeg",
    ],
    verse: {
      text: "La prière fervente du juste a une grande efficace.",
      reference: "Jacques 5:16",
    },
  },
  {
    id: "dep-presse-medias",
    name: "Presse, Médias & Communication",
    slug: "presse-medias",
    tagline: "Faire rayonner la Parole de Dieu à travers le numérique et l'audiovisuel.",
    description:
      "Captation vidéo, photographie, sonorisation, projection des cantiques et gestion de la présence en ligne (YouTube, TikTok, Instagram, Web) pour toucher au-delà des murs.",
    responsibleName: "Responsable Presse & Multimédia",
    meetingSchedule: "À chaque culte et répétition générale",
    bannerImage: "/media/ccjv-34.jpeg",
    keyPoints: [
      "Captation et diffusion des prédications sur les plateformes.",
      "Photographie et archives visuelles des événements.",
      "Gestion technique du son et des écrans pendant le culte.",
      "Création de contenus d'édification pour les réseaux sociaux.",
    ],
    gallery: [
      "/media/ccjv-34.jpeg",
      "/media/ccjv-11.jpeg",
      "/media/ccjv-08.jpeg",
      "/media/ccjv-09.jpeg",
    ],
    verse: {
      text: "Écris la vision, et grave-la sur des tables, afin qu'on la lise couramment.",
      reference: "Habacuc 2:2",
    },
  },
];

/** Résout le nom d'un département depuis son id. */
export function getDepartmentName(id?: string | null): string | undefined {
  if (!id) return undefined;
  return departments.find((department) => department.id === id)?.name;
}

/** Résout un département depuis son slug. */
export function getDepartmentBySlug(slug: string): Department | undefined {
  return departments.find((department) => department.slug === slug);
}
