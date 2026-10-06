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
      name: "Adultes",
      description:
        "Le volet adultes rassemble les hommes et les femmes de l'église autour de la Parole, de la prière et du service. On y apprend à marcher ensemble, à porter les uns les autres et à prendre sa place dans la maison.",
      responsibleName: "Pasteur Manasse Mwamba",
      tagline: "Grandir dans la Parole, servir ensemble.",
      meetingSchedule: "Dimanche · 09:00 — Culte dominical",
      keyPoints: [
        "Enseignement biblique solide et accessible à tous.",
        "Prière et intercession pour la famille et la ville.",
        "Accueil et intégration des nouvelles personnes.",
        "Service concret : entraide, visite des malades, soutien.",
      ],
      banner: "ccjv-27.jpeg",
      gallery: [
        "ccjv-09.jpeg",
        "ccjv-11.jpeg",
        "ccjv-12.jpeg",
        "ccjv-25.jpeg",
        "ccjv-28.jpeg",
        "ccjv-40.jpeg",
      ],
    },
    {
      name: "Enfants / Ecodim",
      description:
        "Ministère des enfants né le 2 juillet 2023. L'Ecodim accompagne les plus jeunes dans la découverte de Dieu, avec un enseignement adapté à chaque âge, des chants, des histoires bibliques et beaucoup de joie.",
      responsibleName: "Responsable Ecodim — à confirmer",
      tagline: "Une génération qui apprend à connaître Dieu.",
      meetingSchedule: "Dimanche · 09:00 — Rencontre Ecodim",
      keyPoints: [
        "Un enseignement adapté à chaque tranche d'âge.",
        "Chants, histoires bibliques et activités créatives.",
        "Un encadrement attentif et bienveillant.",
        "Des moments de fête avec toute l'église.",
      ],
      banner: "ccjv-13.jpeg",
      gallery: [
        "ccjv-13.jpeg",
        "ccjv-15.jpeg",
        "ccjv-23.jpeg",
        "ccjv-31.jpeg",
        "ccjv-33.jpeg",
        "ccjv-37.jpeg",
      ],
    },
    {
      name: "Chorale",
      description:
        "La louange à CCJV n'est pas une simple animation : c'est un sacerdoce. Chantres et musiciens se préparent chaque semaine pour conduire le peuple dans l'adoration, en esprit et en vérité.",
      responsibleName: "Responsable chorale — à confirmer",
      tagline: "Conduire l'assemblée dans la présence de Dieu.",
      // Horaires CONFIRMÉS par CCJV.
      meetingSchedule:
        "Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30",
      keyPoints: [
        "Une adoration vivante et consacrée.",
        "Travail vocal et instrumental chaque semaine.",
        "Un service tourné vers toute l'assemblée.",
        "Une place pour chaque voix et chaque instrument.",
      ],
      banner: "ccjv-15.jpeg",
      gallery: [
        "ccjv-15.jpeg",
        "ccjv-08.jpeg",
        "ccjv-12.jpeg",
        "ccjv-16.jpeg",
        "ccjv-17.jpeg",
        "ccjv-36.jpeg",
      ],
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
      departmentName: "Adultes",
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
      departmentName: "Enfants / Ecodim",
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
      departmentName: "Chorale",
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
      departmentName: "Adultes",
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
      departmentName: "Chorale",
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
    {
      name: "Pasteur Manasse Mwamba",
      role: "Visionnaire / créateur",
      scope: "Direction générale",
      bio: "Il a fondé le Centre Chrétien Jésus ma Vie le 17 mars 2023. Sa charge : affermir l'église dans la Parole, la prière et l'amour fraternel.",
      photo: "ccjv-05.jpeg",
      departmentName: null,
    },
    {
      name: "Responsable — Adultes",
      role: "Coordination du volet adultes",
      scope: "Adultes",
      bio: "Accompagne les hommes et les femmes de l'assemblée : enseignement, entraide et intégration des nouveaux venus.",
      photo: "ccjv-04.jpeg",
      departmentName: "Adultes",
    },
    {
      name: "Responsable — Ecodim",
      role: "Ministère des enfants",
      scope: "Enfants / Ecodim",
      bio: "Veille sur l'encadrement des enfants depuis la naissance de l'Ecodim, le 2 juillet 2023.",
      photo: "ccjv-19.jpeg",
      departmentName: "Enfants / Ecodim",
    },
    {
      name: "Responsable — Chorale",
      role: "Direction musicale",
      scope: "Chorale",
      bio: "Conduit les chantres et les musiciens dans la préparation de la louange du dimanche.",
      photo: "ccjv-24.jpeg",
      departmentName: "Chorale",
    },
    {
      name: "Responsable — Accueil",
      role: "Accueil et fraternité",
      scope: "Communauté",
      bio: "Premier visage que rencontrent les visiteurs : accueil, orientation et suivi des nouvelles personnes.",
      photo: "ccjv-38.jpeg",
      departmentName: null,
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
      personRole: "Chorale",
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
