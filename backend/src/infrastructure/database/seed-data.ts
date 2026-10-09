/**
 * Données de développement.
 *
 * **Provenance :** reprises telles quelles de `frontend/src/data/mock/`.
 * Aucune donnée institutionnelle n'est inventée ici.
 *
 * Distinction appliquée partout :
 * - **CONFIRMÉ** par CCJV : fondation 17 mars 2023, Ecodim 2 juillet 2023,
 *   Pasteur Manasse Mwamba, adresse Quartier Hewa Bora / Avenue Djoloko,
 *   horaires de la chorale (lundi 16h30–18h30, mercredi dans la nuit,
 *   samedi 16h30–18h30), Instagram/TikTok `ecodim_ccjv`.
 * - **DÉMONSTRATION** : tout le reste (événements, publications, témoignages,
 *   visages, horaires du culte dominical, numéro WhatsApp). À remplacer par le
 *   back-office lorsque CCJV aura fourni les contenus réels.
 *
 * Les médias sont désignés par leur **nom de fichier source** dans
 * `frontend/public/media/`. Le script de seed les téléverse vers Supabase
 * Storage et remplace ces noms par les identifiants réels des médias créés.
 */

/** Nom de fichier dans `frontend/public/media/`. */
export type SeedMediaRef = string;

export interface SeedDataset {
  siteSettings: Record<string, string>;
  socialLinks: { label: string; href: string }[];
  scheduleEntries: {
    day: string;
    title: string;
    timeLabel: string;
    audience: string | null;
    isConfirmed: boolean;
  }[];
  scriptures: {
    key: string;
    text: string;
    reference: string;
    translation: string;
    context: string | null;
  }[];
  staticPages: { pageKey: string; content: Record<string, unknown> }[];
  departments: {
    name: string;
    description: string;
    responsibleName: string;
    tagline: string;
    meetingSchedule: string;
    keyPoints: string[];
    banner: SeedMediaRef;
    gallery: SeedMediaRef[];
  }[];
  events: {
    title: string;
    excerpt: string;
    description: string;
    /** Décalage en jours par rapport à aujourd'hui — le seed reste valable dans le temps. */
    dateOffsetDays: number;
    eventTime: string;
    location: string;
    image: SeedMediaRef;
    banner: SeedMediaRef;
    gallery: SeedMediaRef[];
    departmentName: string | null;
    practicalInfo: string[];
  }[];
  publications: {
    title: string;
    type: "VIDEO" | "PHOTO" | "TEXTE";
    category: "ACTUALITE" | "ENSEIGNEMENT" | "MEDIA" | "RESSOURCE";
    contentUrl: string | null;
    /** Média de couverture pour les publications PHOTO. */
    cover?: SeedMediaRef | null;
    description: string;
    dateOffsetDays: number;
    author: string | null;
    body: string[] | null;
  }[];
  leaders: {
    name: string;
    role: string;
    scope: string;
    bio: string;
    photo: SeedMediaRef;
    departmentName: string | null;
  }[];
  testimonies: {
    quote: string;
    personName: string;
    personRole: string;
    photo: SeedMediaRef;
  }[];
  communityFaces: {
    personName: string;
    caption: string;
    photo: SeedMediaRef;
  }[];
}

export const seedDataset: SeedDataset = {
  /* ------------------------------------------------------------------ */
  /*  Réglages institutionnels                                          */
  /* ------------------------------------------------------------------ */
  siteSettings: {
    "site.name": "CENTRE CHRÉTIEN JÉSUS MA VIE",
    "site.acronym": "CCJV",
    "site.location": "Lubumbashi, République démocratique du Congo",
    "site.foundedAt": "17 mars 2023",
    "site.ecodimFoundedAt": "2 juillet 2023",
    "site.visionary": "Pasteur Manasse Mwamba",
    "site.visionaryRole": "Visionnaire / créateur",
    "site.address": "Quartier Hewa Bora, Avenue Djoloko — Lubumbashi",
    "site.addressLine1": "Quartier Hewa Bora",
    "site.addressLine2": "Avenue Djoloko",
    "site.addressLine3": "Lubumbashi, République démocratique du Congo",
    // Horaire de démonstration — à confirmer par CCJV.
    "site.scheduleAdults": "Dimanche · 09h00",
    "site.scheduleChildren": "Dimanche · 09h00 (Ecodim, pendant le culte)",
    // Numéro de démonstration — à remplacer par le numéro réel.
    "site.whatsappNumber": "+243 123 456 789",
    "site.whatsappHref": "https://wa.me/243123456789",
  },

  socialLinks: [
    { label: "Instagram", href: "https://www.instagram.com/ecodim_ccjv/" },
    { label: "TikTok", href: "https://www.tiktok.com/@ecodim_ccjv" },
  ],

  /* ------------------------------------------------------------------ */
  /*  Rythme hebdomadaire                                               */
  /* ------------------------------------------------------------------ */
  scheduleEntries: [
    {
      day: "Dimanche",
      title: "Culte dominical",
      timeLabel: "09h00",
      audience: "Toute l'assemblée",
      isConfirmed: false,
    },
    {
      day: "Dimanche",
      title: "Ecodim",
      timeLabel: "09h00",
      audience: "Enfants — pendant le culte",
      isConfirmed: false,
    },
    // CONFIRMÉ par CCJV
    {
      day: "Lundi",
      title: "Répétition de la chorale",
      timeLabel: "16h30 – 18h30",
      audience: "Chantres et musiciens",
      isConfirmed: true,
    },
    {
      day: "Mercredi",
      title: "Répétition de la chorale",
      timeLabel: "Dans la nuit",
      audience: "Veillée de préparation",
      isConfirmed: true,
    },
    {
      day: "Mercredi",
      title: "Prière et intercession",
      timeLabel: "17h00",
      audience: "Toute l'église",
      isConfirmed: false,
    },
    // CONFIRMÉ par CCJV
    {
      day: "Samedi",
      title: "Répétition de la chorale",
      timeLabel: "16h30 – 18h30",
      audience: "Chantres et musiciens",
      isConfirmed: true,
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Écritures — Louis Segond 1910, domaine public                     */
  /*  Sélection à valider par CCJV. Aucun verset n'est inventé.         */
  /* ------------------------------------------------------------------ */
  scriptures: [
    {
      key: "rassemblement",
      text: "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux.",
      reference: "Matthieu 18:20",
      translation: "Louis Segond 1910",
      context: null,
    },
    {
      key: "louange",
      text: "Que tout ce qui respire loue l'Éternel !",
      reference: "Psaume 150:6",
      translation: "Louis Segond 1910",
      context: null,
    },
    {
      key: "repos",
      text: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.",
      reference: "Matthieu 11:28",
      translation: "Louis Segond 1910",
      context: null,
    },
    {
      key: "parole",
      text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
      reference: "Psaume 119:105",
      translation: "Louis Segond 1910",
      context: null,
    },
    {
      key: "ouvrage",
      text: "Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres, que Dieu a préparées d'avance, afin que nous les pratiquions.",
      reference: "Éphésiens 2:10",
      translation: "Louis Segond 1910",
      context: null,
    },
    {
      key: "corps",
      text: "Car, comme le corps est un et a plusieurs membres, et comme tous les membres du corps, malgré leur nombre, ne forment qu'un seul corps, ainsi en est-il de Christ.",
      reference: "1 Corinthiens 12:12",
      translation: "Louis Segond 1910",
      context: null,
    },
    {
      key: "memoire",
      text: "Qu'ainsi disent les rachetés de l'Éternel, ceux qu'il a délivrés de la main de l'ennemi.",
      reference: "Psaume 107:2",
      translation: "Louis Segond 1910",
      context: null,
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Pages éditables                                                   */
  /*  Uniquement des champs textuels nommés, validés par Zod.          */
  /* ------------------------------------------------------------------ */
  staticPages: [
    {
      pageKey: "accueil",
      content: {
        heroTitle: "Bienvenue dans la maison.",
        heroIntro:
          "Le Centre Chrétien Jésus ma Vie est une famille spirituelle à Lubumbashi. On y vient comme on est : pour écouter la Parole, louer Dieu et marcher ensemble.",
      },
    },
    {
      pageKey: "qui-sommes-nous",
      content: {
        title: "Une famille spirituelle à Lubumbashi",
        intro:
          "Église chrétienne fondée le 17 mars 2023, le Centre Chrétien Jésus ma Vie rassemble à Lubumbashi un peuple qui apprend à écouter la Parole, à prier et à vivre ensemble.",
      },
    },
    {
      pageKey: "organisation",
      content: {
        title: "Comment l'église s'organise",
        intro:
          "Les départements sont dynamiques : ils peuvent être créés et modifiés depuis le back-office.",
      },
    },
    {
      pageKey: "communaute",
      content: {
        title: "La communauté",
        intro:
          "L'église n'est pas un bâtiment, c'est un peuple. Voici comment cette communauté se vit au quotidien.",
      },
    },
    {
      pageKey: "vie-de-leglise",
      content: {
        title: "Quand et où nous rassembler",
        intro:
          "Cultes, rencontres et temps forts : le rythme de la semaine et les prochains rendez-vous.",
      },
    },
    {
      pageKey: "publications",
      content: {
        title: "Publications & Médias",
        intro:
          "Actualités, enseignements, médiathèque et ressources : ce que l'église publie.",
      },
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Départements — dynamiques, aucune liste codée en dur              */
  /* ------------------------------------------------------------------ */
  departments: [
    {
      name: "Les Serviteurs",
      description:
        "Le collège des serviteurs rassemble les ouvriers consacrés qui soutiennent la vision pastorale, animent les cellules de disciples et veillent sur la croissance spirituelle de chaque membre.",
      responsibleName: "Pasteur Manasse Mwamba",
      tagline: "Veiller sur le troupeau et enseigner la saine doctrine.",
      meetingSchedule: "Mardi & Vendredi · 16h30 | Dimanche · 08h30",
      keyPoints: [
        "Soutien pastoral et écoute des familles.",
        "Formation des disciples et affermissement spirituel.",
        "Enseignement des Écritures et prière pour l'église.",
        "Coordination collégiale des ministères.",
      ],
      banner: "ccjv-09.jpeg",
      gallery: ["ccjv-09.jpeg", "ccjv-11.jpeg", "ccjv-25.jpeg", "ccjv-27.jpeg"],
    },
    {
      name: "La Chorale Grand Groupe CCVJ",
      description:
        "Chantres, choristes et musiciens préparent chaque semaine l'atmosphère d'adoration des cultes dominicaux et des rassemblements majeurs de l'église.",
      responsibleName: "Coordination de la Louange",
      tagline: "Conduire l'assemblée dans la louange et l'adoration.",
      meetingSchedule: "Lundi 16h30–18h30 · Mercredi 21h30 · Samedi 16h30–18h30",
      keyPoints: [
        "Louange vivante et adoration en esprit et en vérité.",
        "Répétitions vocales et instrumentales régulières.",
        "Veillée de sanctification chaque mercredi soir.",
        "Accompagnement des nouveaux talents musicaux.",
      ],
      banner: "ccjv-15.jpeg",
      gallery: ["ccjv-15.jpeg", "ccjv-08.jpeg", "ccjv-16.jpeg", "ccjv-17.jpeg"],
    },
    {
      name: "La Chorale de Cano Vocal",
      description:
        "Groupe vocal dédié au travail des voix, aux compositions polyphoniques et aux cantiques inspirés lors des temps forts et des cultes de célébration.",
      responsibleName: "Direction Cano Vocal",
      tagline: "Harmonies et célébration vocale pour la gloire de Dieu.",
      meetingSchedule: "Samedi · 16h30 à 18h30",
      keyPoints: [
        "Recherche de l'harmonie vocale et expression spirituelle.",
        "Chants sacrés, hymnes et compositions originales.",
        "Formation technique et discipline des chantres.",
      ],
      banner: "ccjv-16.jpeg",
      gallery: ["ccjv-16.jpeg", "ccjv-15.jpeg", "ccjv-08.jpeg", "ccjv-36.jpeg"],
    },
    {
      name: "L'Ecodume",
      description:
        "Né le 2 juillet 2023, l'Ecodim accueille les enfants pendant les cultes pour leur transmettre la Parole à travers des enseignements adaptés, des chants et des activités créatives.",
      responsibleName: "Équipe pastorale Ecodim",
      tagline: "Former une génération qui connaît et aime Dieu dès l'enfance.",
      meetingSchedule: "Dimanche · 08h30 à 11h30 (pendant le culte)",
      keyPoints: [
        "Enseignement biblique adapté à chaque tranche d'âge.",
        "Encadrement sécurisé, attentionné et joyeux.",
        "Chants d'adoration pour enfants et ateliers bibliques.",
        "Moments festifs et représentations avec toute l'église.",
      ],
      banner: "ccjv-13.jpeg",
      gallery: ["ccjv-13.jpeg", "ccjv-18.jpeg", "ccjv-23.jpeg", "ccjv-31.jpeg"],
    },
    {
      name: "Affaires Sociales",
      description:
        "Ce pôle porte l'entraide fraternelle au sein de la communauté : visite des malades, soutien matériel aux personnes vulnérables, accompagnement des deuils et réjouissances familiales.",
      responsibleName: "Coordination Diaconale & Sociale",
      tagline: "Manifester l'amour du Christ par des actes de compassion concrets.",
      meetingSchedule: "Permanence après les cultes & Visites en semaine",
      keyPoints: [
        "Assistance matérielle et alimentaire d'urgence.",
        "Visites fraternelles aux malades et personnes isolées.",
        "Accompagnement des familles dans les événements de vie.",
        "Collecte et redistribution solidaire au sein de l'assemblée.",
      ],
      banner: "ccjv-28.jpeg",
      gallery: ["ccjv-28.jpeg", "ccjv-30.jpeg", "ccjv-35.jpeg", "ccjv-27.jpeg"],
    },
    {
      name: "Hygiène et Ancienneté",
      description:
        "Veille à la propreté, à la salubrité et à l'intendance de tous les espaces de rassemblement avant, pendant et après chaque culte et événement.",
      responsibleName: "Responsable Intendance & Salubrité",
      tagline: "Préparer un cadre digne, propre et accueillant pour la maison de Dieu.",
      meetingSchedule: "Avant et après chaque rassemblement",
      keyPoints: [
        "Nettoyage et désinfection rigoureuse du temple.",
        "Entretien des installations et du mobilier de culte.",
        "Maintien d'un environnement sain et agréable pour tous.",
      ],
      banner: "ccjv-21.jpeg",
      gallery: ["ccjv-21.jpeg", "ccjv-28.jpeg", "ccjv-09.jpeg"],
    },
    {
      name: "Protocole",
      description:
        "Le premier contact des fidèles et des nouveaux arrivants : orientation, gestion des places assises, ordre dans l'assemblée et assistance aux besoins du culte.",
      responsibleName: "Coordination du Protocole",
      tagline: "Accueillir chaque visiteur avec le sourire et la chaleur du Christ.",
      meetingSchedule: "Dimanche dès 07h45 · Mardi & Vendredi dès 15h45",
      keyPoints: [
        "Accueil chaleureux et personnalisé à l'entrée.",
        "Placement et fluidité dans le temple.",
        "Orientation des nouveaux venus vers le parcours d'intégration.",
        "Gestion de l'ordre et des nécessités pratiques du service.",
      ],
      banner: "ccjv-38.jpeg",
      gallery: ["ccjv-38.jpeg", "ccjv-01.jpeg", "ccjv-35.jpeg", "ccjv-30.jpeg"],
    },
    {
      name: "Évangélisation",
      description:
        "Équipe missionnaire qui va à la rencontre des habitants dans les quartiers, anime des campagnes de rue, témoigne de l'amour de Dieu et invite aux cultes.",
      responsibleName: "Responsable Évangélisation",
      tagline: "Annoncer la Bonne Nouvelle de Jésus-Christ à Lubumbashi.",
      meetingSchedule: "Samedi matin · Sorties missionnaires de quartier",
      keyPoints: [
        "Sorties d'évangélisation de proximité dans les avenues.",
        "Distribution de traités et entretiens spirituels.",
        "Suivi des nouvelles âmes jusqu'à leur intégration à l'église.",
        "Organisation de temps forts d'évangélisation en plein air.",
      ],
      banner: "ccjv-27.jpeg",
      gallery: ["ccjv-27.jpeg", "ccjv-35.jpeg", "ccjv-28.jpeg", "ccjv-11.jpeg"],
    },
    {
      name: "Intercession",
      description:
        "Sentinelles spirituelles de l'assemblée : prière continue pour les cultes, soutien des requêtes reçues, veillées de combat spirituel et délivrance.",
      responsibleName: "Responsable Intercession",
      tagline: "Porter l'église, les familles et la nation devant le trône de grâce.",
      meetingSchedule: "Vendredi 16h30–18h30 · Vigiles matinales & veillées",
      keyPoints: [
        "Prière fervente avant chaque culte pour la prédication.",
        "Prise en charge discrète de toutes les demandes de prière.",
        "Jeûnes et prières programmés pour la vie de l'église.",
        "Intercession pour le réveil spirituel de la ville.",
      ],
      banner: "ccjv-09.jpeg",
      gallery: ["ccjv-09.jpeg", "ccjv-12.jpeg", "ccjv-25.jpeg"],
    },
    {
      name: "Presse",
      description:
        "Captation vidéo, photographie, sonorisation, projection des cantiques et gestion de la présence en ligne pour toucher au-delà des murs.",
      responsibleName: "Responsable Presse & Multimédia",
      tagline: "Faire rayonner la Parole de Dieu à travers le numérique et l'audiovisuel.",
      meetingSchedule: "À chaque culte et répétition générale",
      keyPoints: [
        "Captation et diffusion des prédications sur les plateformes.",
        "Photographie et archives visuelles des événements.",
        "Gestion technique du son et des écrans pendant le culte.",
        "Création de contenus d'édification pour les réseaux sociaux.",
      ],
      banner: "ccjv-34.jpeg",
      gallery: ["ccjv-34.jpeg", "ccjv-11.jpeg", "ccjv-08.jpeg", "ccjv-09.jpeg"],
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Événements — démonstration                                        */
  /* ------------------------------------------------------------------ */
  events: [
    {
      title: "Culte dominical",
      excerpt:
        "Le rendez-vous de toute la famille CCJV : louange, Parole et communion fraternelle.",
      description:
        "Chaque dimanche, l'assemblée se rassemble pour adorer Dieu, écouter Sa Parole et vivre la communion fraternelle. Un moment ouvert à tous — membres comme visiteurs. Venez comme vous êtes.",
      dateOffsetDays: 3,
      eventTime: "09:00",
      location: "Temple CCJV — Lubumbashi",
      image: "ccjv-08.jpeg",
      banner: "ccjv-08.jpeg",
      gallery: ["ccjv-08.jpeg", "ccjv-11.jpeg", "ccjv-12.jpeg", "ccjv-25.jpeg"],
      departmentName: "Les Serviteurs",
      practicalInfo: [
        "Ouvert à tous, sans inscription.",
        "Accueil dès 08h30.",
        "Un espace est prévu pour les enfants (Ecodim).",
      ],
    },
    {
      title: "Rencontre Ecodim",
      excerpt:
        "Un temps pensé pour les enfants : chants, histoires bibliques et joie partagée.",
      description:
        "L'Ecodim réunit les enfants de l'église pour découvrir Dieu à leur mesure : chants, récits bibliques, activités créatives et beaucoup de joie. Les parents sont les bienvenus.",
      dateOffsetDays: 7,
      eventTime: "14:00",
      location: "Salle Ecodim — Lubumbashi",
      image: "ccjv-13.jpeg",
      banner: "ccjv-13.jpeg",
      gallery: ["ccjv-13.jpeg", "ccjv-15.jpeg", "ccjv-23.jpeg", "ccjv-31.jpeg"],
      departmentName: "L'Ecodume",
      practicalInfo: [
        "Pour les enfants de 3 à 12 ans.",
        "Encadrement assuré par l'équipe Ecodim.",
        "Prévenir l'équipe pour un premier passage.",
      ],
    },
    {
      title: "Répétition de la chorale",
      excerpt:
        "Chantres et musiciens préparent le service du dimanche dans la prière.",
      description:
        "La chorale se réunit chaque semaine pour prier, travailler l'harmonie des voix et préparer la louange du dimanche. Une place existe pour chaque voix comme pour chaque instrument.",
      dateOffsetDays: 10,
      eventTime: "17:00",
      location: "Temple CCJV — Lubumbashi",
      image: "ccjv-15.jpeg",
      banner: "ccjv-15.jpeg",
      gallery: ["ccjv-15.jpeg", "ccjv-16.jpeg", "ccjv-17.jpeg"],
      departmentName: "La Chorale Grand Groupe CCVJ",
      practicalInfo: [
        "Ouvert à ceux qui souhaitent servir par la musique.",
        "Aucun niveau requis pour commencer.",
      ],
    },
    {
      title: "Culte spécial — Action de grâce",
      excerpt:
        "Un dimanche mis à part pour rendre grâce ensemble pour l'année écoulée.",
      description:
        "Une célébration commune où toute l'église rend grâce pour ce que Dieu a accompli : témoignages, louange prolongée et Parole. Un moment fort de la vie de la communauté.",
      dateOffsetDays: 16,
      eventTime: "09:00",
      location: "Temple CCJV — Lubumbashi",
      image: "ccjv-09.jpeg",
      banner: "ccjv-09.jpeg",
      gallery: ["ccjv-09.jpeg", "ccjv-28.jpeg", "ccjv-40.jpeg"],
      departmentName: null,
      practicalInfo: [
        "Toute l'église est invitée.",
        "Célébration suivie d'un repas fraternel.",
      ],
    },
    {
      title: "Culte dominical",
      excerpt: "Retour sur le culte du dimanche dernier.",
      description:
        "Le culte du dimanche dernier a réuni l'assemblée autour de la Parole et de la louange.",
      dateOffsetDays: -4,
      eventTime: "09:00",
      location: "Temple CCJV — Lubumbashi",
      image: "ccjv-11.jpeg",
      banner: "ccjv-11.jpeg",
      gallery: ["ccjv-11.jpeg", "ccjv-12.jpeg"],
      departmentName: "Les Serviteurs",
      practicalInfo: [],
    },
    {
      title: "Journée communautaire",
      excerpt: "Une journée de fraternité, de jeux et de partage entre tous.",
      description:
        "Toute l'église s'est retrouvée pour une journée de fraternité : repas partagé, jeux, chants et conversations simples. La preuve que l'église est d'abord une famille.",
      dateOffsetDays: -14,
      eventTime: "10:00",
      location: "Lubumbashi",
      image: "ccjv-27.jpeg",
      banner: "ccjv-27.jpeg",
      gallery: ["ccjv-27.jpeg", "ccjv-30.jpeg"],
      departmentName: null,
      practicalInfo: [],
    },
    {
      title: "Répétition de la chorale",
      excerpt: "Préparation de la louange du dimanche.",
      description:
        "Répétition hebdomadaire de la chorale : travail vocal, harmonisation et prière.",
      dateOffsetDays: -18,
      eventTime: "17:00",
      location: "Temple CCJV — Lubumbashi",
      image: "ccjv-15.jpeg",
      banner: "ccjv-15.jpeg",
      gallery: [],
      departmentName: "La Chorale Grand Groupe CCVJ",
      practicalInfo: [],
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Publications — démonstration                                      */
  /*  Les liens YouTube sont des valeurs de démonstration.              */
  /* ------------------------------------------------------------------ */
  publications: [
    {
      title: "Culte du dimanche — La maison de Dieu",
      type: "VIDEO",
      category: "ENSEIGNEMENT",
      contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description:
        "Message du dimanche sur la joie d'entrer dans la maison de Dieu et d'y être accueilli.",
      dateOffsetDays: -2,
      author: "Pasteur Manasse Mwamba",
      body: null,
    },
    {
      title: "Retour en images — Culte dominical",
      type: "PHOTO",
      category: "MEDIA",
      contentUrl: null,
      cover: "ccjv-09.jpeg",
      description:
        "Quelques instants de louange, d'écoute de la Parole et de communion fraternelle.",
      dateOffsetDays: -5,
      author: null,
      body: null,
    },
    {
      title: "Enseignement — Une foi qui se vit ensemble",
      type: "VIDEO",
      category: "ENSEIGNEMENT",
      contentUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      description:
        "Pourquoi la foi chrétienne ne se vit jamais seul, et ce que cela change dans nos semaines.",
      dateOffsetDays: -9,
      author: "Pasteur Manasse Mwamba",
      body: null,
    },
    {
      title: "Album — Louange et adoration",
      type: "PHOTO",
      category: "MEDIA",
      contentUrl: null,
      cover: "ccjv-15.jpeg",
      description:
        "La chorale conduit l'assemblée dans l'adoration, en esprit et en vérité.",
      dateOffsetDays: -13,
      author: null,
      body: null,
    },
    {
      title: "Annonce — Rentrée de l'Ecodim",
      type: "TEXTE",
      category: "ACTUALITE",
      contentUrl: null,
      description:
        "Le ministère des enfants reprend ses rencontres. Parents, voici tout ce qu'il faut savoir pour accompagner vos enfants.",
      dateOffsetDays: -20,
      author: null,
      body: [
        "L'Ecodim, le ministère des enfants du Centre Chrétien Jésus ma Vie, reprend ses rencontres hebdomadaires.",
        "Chaque dimanche, les enfants sont accueillis par une équipe dédiée pour un temps adapté à leur âge : chants, récits bibliques et activités.",
        "Les parents qui souhaitent inscrire leur enfant pour la première fois sont invités à se présenter un peu avant le culte afin que nous puissions faire connaissance.",
      ],
    },
    {
      title: "Vie de l'Ecodim en images",
      type: "PHOTO",
      category: "MEDIA",
      contentUrl: null,
      cover: "ccjv-23.jpeg",
      description: "Les enfants de CCJV, leur joie et leurs activités.",
      dateOffsetDays: -27,
      author: null,
      body: null,
    },
    {
      title: "Nouvelle saison des groupes de maison",
      type: "TEXTE",
      category: "ACTUALITE",
      contentUrl: null,
      description:
        "Les groupes de maison reprennent dans plusieurs quartiers de Lubumbashi. Voici comment en rejoindre un.",
      dateOffsetDays: -31,
      author: null,
      body: [
        "Les groupes de maison sont de petits rassemblements, dans un quartier, chez un membre : on y prie, on y partage la Parole et on s'y soutient concrètement.",
        "Une nouvelle saison commence. Si vous souhaitez rejoindre un groupe près de chez vous, écrivez-nous : nous vous mettrons en relation.",
      ],
    },
    {
      title: "Guide d'étude — Les fondements de la foi",
      type: "TEXTE",
      category: "RESSOURCE",
      contentUrl: null,
      description:
        "Un parcours en six séances pour découvrir ou affermir les fondements de la foi chrétienne, seul ou en groupe.",
      dateOffsetDays: -38,
      author: null,
      body: [
        "Ce guide accompagne les nouveaux venus comme les membres qui souhaitent revisiter l'essentiel.",
        "Six séances : la grâce, la Parole, la prière, la communauté, le service, la persévérance.",
        "Chaque séance propose un texte biblique, quelques questions et un temps de prière.",
      ],
    },
    {
      title: "Plan de lecture biblique",
      type: "TEXTE",
      category: "RESSOURCE",
      contentUrl: null,
      description:
        "Un plan simple pour lire la Bible régulièrement, adapté à ceux qui débutent comme à ceux qui reprennent.",
      dateOffsetDays: -44,
      author: null,
      body: [
        "Lire la Bible régulièrement change la manière de traverser la semaine.",
        "Ce plan propose un rythme accessible : un passage court chaque jour, et un temps de reprise communautaire une fois par semaine.",
      ],
    },
    {
      title: "Journée communautaire en images",
      type: "PHOTO",
      category: "MEDIA",
      contentUrl: null,
      cover: "ccjv-30.jpeg",
      description:
        "Une journée de fraternité : repas partagé, jeux, chants et conversations simples.",
      dateOffsetDays: -52,
      author: null,
      body: null,
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Responsables — démonstration                                      */
  /*  Seul le Pasteur Manasse Mwamba est confirmé.                      */
  /* ------------------------------------------------------------------ */
  leaders: [
    // 00. Direction Générale / Visionnaire
    {
      name: "Pasteur Manasse Mwamba",
      role: "Visionnaire / Pasteur principal",
      scope: "Direction générale",
      bio: "Il a fondé le Centre Chrétien Jésus ma Vie le 17 mars 2023. Sa charge : affermir l'église dans la Parole, la prière et l'amour fraternel.",
      photo: "ccjv-05.jpeg",
      departmentName: null,
    },

    // 01. Collège des Serviteurs
    {
      name: "Responsable — Collège des Serviteurs",
      role: "Coordination pastorale & serviteurs",
      scope: "Les Serviteurs",
      bio: "Soutien pastoral et accompagnement des disciples.",
      photo: "ccjv-04.jpeg",
      departmentName: "Les Serviteurs",
    },
    {
      name: "Adjoint — Collège des Serviteurs",
      role: "Affermissement & accompagnement",
      scope: "Les Serviteurs",
      bio: "Affermissement dans la doctrine et suivi spirituel.",
      photo: "ccjv-25.jpeg",
      departmentName: "Les Serviteurs",
    },

    // 02. Chorale Grand Groupe CCJV
    {
      name: "Direction — Grand Groupe CCJV",
      role: "Direction musicale & louange",
      scope: "Chorale Grand Groupe",
      bio: "Conduit l'assemblée dans la présence de Dieu.",
      photo: "ccjv-24.jpeg",
      departmentName: "La Chorale Grand Groupe CCVJ",
    },
    {
      name: "Coordination — Grand Groupe CCJV",
      role: "Harmonie & pupitres",
      scope: "Chorale Grand Groupe",
      bio: "Travail vocal et sanctification des chantres.",
      photo: "ccjv-06.jpeg",
      departmentName: "La Chorale Grand Groupe CCVJ",
    },

    // 03. Chorale Cano Vocal
    {
      name: "Direction — Cano Vocal",
      role: "Chantre principal & arrangements",
      scope: "La Chorale de Cano Vocal",
      bio: "Compositions et harmonies pour la gloire de Dieu.",
      photo: "ccjv-17.jpeg",
      departmentName: "La Chorale de Cano Vocal",
    },
    {
      name: "Répétiteur — Cano Vocal",
      role: "Formation vocale & technique",
      scope: "La Chorale de Cano Vocal",
      bio: "Discipline vocale et louange polyphonique.",
      photo: "ccjv-36.jpeg",
      departmentName: "La Chorale de Cano Vocal",
    },

    // 04. Ecodim (Enfants)
    {
      name: "Responsable — Ecodim",
      role: "Ministère et encadrement des enfants",
      scope: "Ecodim (Enfants)",
      bio: "Veille sur l'encadrement des plus jeunes.",
      photo: "ccjv-19.jpeg",
      departmentName: "L'Ecodume",
    },
    {
      name: "Coordination Pédagogique — Ecodim",
      role: "Animation & récits bibliques",
      scope: "Ecodim (Enfants)",
      bio: "Enseignement biblique adapté et créatif.",
      photo: "ccjv-18.jpeg",
      departmentName: "L'Ecodume",
    },

    // 05. Affaires Sociales
    {
      name: "Responsable — Affaires Sociales",
      role: "Diaconat & entraide fraternelle",
      scope: "Affaires Sociales",
      bio: "Compassion et assistance aux familles dans le besoin.",
      photo: "ccjv-03.jpeg",
      departmentName: "Affaires Sociales",
    },
    {
      name: "Adjoint — Affaires Sociales",
      role: "Visite des malades & soutien",
      scope: "Affaires Sociales",
      bio: "Présence et réconfort auprès des personnes isolées.",
      photo: "ccjv-30.jpeg",
      departmentName: "Affaires Sociales",
    },

    // 06. Hygiène & Assainissement
    {
      name: "Responsable — Hygiène & Salubrité",
      role: "Intendance et propreté du temple",
      scope: "Hygiène et Ancienneté",
      bio: "Maintien d'un cadre propre et digne.",
      photo: "ccjv-22.jpeg",
      departmentName: "Hygiène et Ancienneté",
    },
    {
      name: "Adjoint — Hygiène & Salubrité",
      role: "Maintenance & cadre de culte",
      scope: "Hygiène et Ancienneté",
      bio: "Salubrité et ordre avant et après les cultes.",
      photo: "ccjv-21.jpeg",
      departmentName: "Hygiène et Ancienneté",
    },

    // 07. Protocole & Accueil
    {
      name: "Responsable — Protocole",
      role: "Accueil & placement de l'assemblée",
      scope: "Protocole",
      bio: "Premier sourire et accueil des visiteurs.",
      photo: "ccjv-38.jpeg",
      departmentName: "Protocole",
    },
    {
      name: "Adjoint — Protocole",
      role: "Orientation des nouveaux visiteurs",
      scope: "Protocole",
      bio: "Accompagnement et fluidité dans le temple.",
      photo: "ccjv-01.jpeg",
      departmentName: "Protocole",
    },

    // 08. Évangélisation & Mission
    {
      name: "Responsable — Évangélisation",
      role: "Stratégie missionnaire & plein air",
      scope: "Évangélisation",
      bio: "Proclamation de la Bonne Nouvelle à Lubumbashi.",
      photo: "ccjv-27.jpeg",
      departmentName: "Évangélisation",
    },
    {
      name: "Coordination — Sorties de Quartier",
      role: "Témoignage & suivi des âmes",
      scope: "Évangélisation",
      bio: "Évangélisation de rue et suivi des convertis.",
      photo: "ccjv-35.jpeg",
      departmentName: "Évangélisation",
    },

    // 09. Intercession & Prière
    {
      name: "Responsable — Intercession",
      role: "Sentinelles & veillées de prière",
      scope: "Intercession",
      bio: "Intercession fervente et veilles spirituelles.",
      photo: "ccjv-07.jpeg",
      departmentName: "Intercession",
    },
    {
      name: "Adjoint — Intercession",
      role: "Soutien des intentions reçues",
      scope: "Intercession",
      bio: "Porte les requêtes de prière des fidèles.",
      photo: "ccjv-12.jpeg",
      departmentName: "Intercession",
    },

    // 10. Presse, Médias & Multimédia
    {
      name: "Responsable — Presse & Médias",
      role: "Communication & diffusion en ligne",
      scope: "Presse & Médias",
      bio: "Diffusion numérique et captation des messages.",
      photo: "ccjv-34.jpeg",
      departmentName: "Presse",
    },
    {
      name: "Coordination — Audiovisuel & Régie",
      role: "Captation vidéo & sonorisation",
      scope: "Presse & Médias",
      bio: "Technique son, écrans et retransmission.",
      photo: "ccjv-32.jpeg",
      departmentName: "Presse",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Témoignages — DÉMONSTRATION, à remplacer par de vrais témoignages */
  /* ------------------------------------------------------------------ */
  testimonies: [
    {
      quote:
        "Je suis arrivée sans connaître personne. On m'a accueillie simplement, sans me juger. Aujourd'hui, j'ai une famille ici.",
      personName: "Grâce",
      personRole: "Membre de l'assemblée",
      photo: "ccjv-01.jpeg",
    },
    {
      quote:
        "Nos enfants attendent le dimanche avec impatience. L'Ecodim leur a appris à aimer la Parole de Dieu.",
      personName: "Patrick",
      personRole: "Papa de deux enfants",
      photo: "ccjv-03.jpeg",
    },
    {
      quote:
        "Servir dans la louange a changé ma manière de prier. On ne chante pas seulement : on apprend à se tenir devant Dieu.",
      personName: "Esther",
      personRole: "La Chorale Grand Groupe CCVJ",
      photo: "ccjv-18.jpeg",
    },
    {
      quote:
        "J'ai traversé une période difficile. Les prières de l'église m'ont porté, et je n'ai jamais été seul.",
      personName: "Josué",
      personRole: "Membre depuis 2023",
      photo: "ccjv-34.jpeg",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  Visages de la communauté — DÉMONSTRATION                          */
  /* ------------------------------------------------------------------ */
  communityFaces: [
    {
      personName: "Grâce",
      caption: "Elle accueille les nouveaux venus le dimanche matin.",
      photo: "ccjv-01.jpeg",
    },
    {
      personName: "Patrick",
      caption: "Papa de deux enfants, fidèle au culte avec sa famille.",
      photo: "ccjv-03.jpeg",
    },
    {
      personName: "Esther",
      caption: "Choriste : elle conduit l'assemblée dans la louange.",
      photo: "ccjv-06.jpeg",
    },
    {
      personName: "Naomi",
      caption: "Elle accompagne les enfants de l'Ecodim chaque dimanche.",
      photo: "ccjv-18.jpeg",
    },
    {
      personName: "Emmanuel",
      caption: "Musicien, au service de la louange et de la prière.",
      photo: "ccjv-34.jpeg",
    },
  ],
};

/**
 * Clés de `site_settings` autorisées en écriture par le back-office.
 * Toute autre clé est rejetée : le modèle ne doit pas dériver vers un
 * magasin clé/valeur générique.
 */
export const ALLOWED_SETTING_KEYS: readonly string[] = Object.keys(
  seedDataset.siteSettings,
);

/** Clés de page éditables. */
export const ALLOWED_PAGE_KEYS: readonly string[] = seedDataset.staticPages.map(
  (page) => page.pageKey,
);
