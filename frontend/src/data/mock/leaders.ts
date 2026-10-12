export interface Leader {
  id: string;
  name: string;
  role: string;
  photo?: string;
  /** Département ou service rattaché. */
  scope?: string;
  bio?: string;
}

export const leaders: Leader[] = [
  // 00. Direction Générale / Visionnaire
  {
    id: "lead-pastor",
    name: "Pasteur Manasse Mwamba",
    role: "Visionnaire / Pasteur principal",
    scope: "Direction générale",
    photo: "/media/ccjv-05.jpeg",
    bio: "Il a fondé le Centre Chrétien Jésus ma Vie le 17 mars 2023. Sa charge : affermir l'église dans la Parole, la prière et l'amour fraternel.",
  },

  // 01. Collège des Serviteurs
  {
    id: "lead-serviteurs-1",
    name: "John Doe",
    role: "Coordination pastorale & serviteurs",
    scope: "Collège des Serviteurs",
    photo: "/media/ccjv-04.jpeg",
  },
  {
    id: "lead-serviteurs-2",
    name: "Sarah Mulumba",
    role: "Affermissement & accompagnement",
    scope: "Collège des Serviteurs",
    photo: "/media/ccjv-25.jpeg",
  },

  // 02. Chorale Grand Groupe CCJV
  {
    id: "lead-chorale-1",
    name: "Isabelle Mutebi",
    role: "Direction musicale & louange",
    scope: "Chorale Grand Groupe",
    photo: "/media/ccjv-24.jpeg",
  },
  {
    id: "lead-chorale-2",
    name: "Sr Théthé Masengo",
    role: "Harmonie & pupitres",
    scope: "Chorale Grand Groupe",
    photo: "/media/ccjv-06.jpeg",
  },

  // 03. Chorale Cano Vocal
  {
    id: "lead-cano-1",
    name: "Jean De Dieu Kalomb",
    role: "Chantre principal & arrangements",
    scope: "Chorale Cano Vocal",
    photo: "/media/ccjv-17.jpeg",
  },
  {
    id: "lead-cano-2",
    name: "Danielle Tshimanga",
    role: "Formation vocale & technique",
    scope: "Chorale Cano Vocal",
    photo: "/media/ccjv-36.jpeg",
  },

  // 04. Ecodim (Enfants)
  {
    id: "lead-ecodim-1",
    name: "Luc Nkoy",
    role: "Ministère et encadrement des enfants",
    scope: "Ecodim (Enfants)",
    photo: "/media/ccjv-19.jpeg",
  },
  {
    id: "lead-ecodim-2",
    name: "Grace Masengo",
    role: "Animation & récits bibliques",
    scope: "Ecodim (Enfants)",
    photo: "/media/ccjv-18.jpeg",
  },

  // 05. Affaires Sociales
  {
    id: "lead-sociales-1",
    name: "Pascal Ngoma",
    role: "Diaconat & entraide fraternelle",
    scope: "Affaires Sociales",
    photo: "/media/ccjv-03.jpeg",
  },
  {
    id: "lead-sociales-2",
    name: "Thérèse Tshibangu",
    role: "Visite des malades & soutien",
    scope: "Affaires Sociales",
    photo: "/media/ccjv-30.jpeg",
  },

  // 06. Hygiène & Assainissement
  {
    id: "lead-hygiene-1",
    name: "Jeanne Tshiela",
    role: "Intendance et propreté du temple",
    scope: "Hygiène & Assainissement",
    photo: "/media/ccjv-22.jpeg",
  },
  {
    id: "lead-hygiene-2",
    name: "Marc Tshiama",
    role: "Maintenance & cadre de culte",
    scope: "Hygiène & Assainissement",
    photo: "/media/ccjv-21.jpeg",
  },

  // 07. Protocole & Accueil
  {
    id: "lead-protocole-1",
    name: "Chrétien Yav",
    role: "Accueil & placement de l'assemblée",
    scope: "Protocole & Accueil",
    photo: "/media/ccjv-38.jpeg",
  },
  {
    id: "lead-protocole-2",
    name: "Hazaria Miteu",
    role: "Orientation des nouveaux visiteurs",
    scope: "Protocole & Accueil",
    photo: "/media/ccjv-01.jpeg",
  },

  // 08. Évangélisation & Mission
  {
    id: "lead-evangelisation-1",
    name: "Jean Pierre Kalenga",
    role: "Stratégie missionnaire & plein air",
    scope: "Évangélisation",
    photo: "/media/ccjv-27.jpeg",
  },
  {
    id: "lead-evangelisation-2",
    name: "Joël Mutombo",
    role: "Témoignage & suivi des âmes",
    scope: "Évangélisation",
    photo: "/media/ccjv-35.jpeg",
  },

  // 09. Intercession & Prière
  {
    id: "lead-intercession-1",
    name: "Don De Dieu Kabeya",
    role: "Sentinelles & veillées de prière",
    scope: "Intercession",
    photo: "/media/ccjv-07.jpeg",
  },
  {
    id: "lead-intercession-2",
    name: "David Ngoy",
    role: "Soutien des intentions reçues",
    scope: "Intercession",
    photo: "/media/ccjv-12.jpeg",
  },

  // 10. Presse, Médias & Multimédia
  {
    id: "lead-presse-1",
    name: "Ezéchiel Olemba",
    role: "Communication & diffusion en ligne",
    scope: "Presse & Médias",
    photo: "/media/ccjv-34.jpeg",
  },
  {
    id: "lead-presse-2",
    name: "Mathieu Bakenga",
    role: "Captation vidéo & sonorisation",
    scope: "Presse & Médias",
    photo: "/media/ccjv-32.jpeg",
  },
];

/** Le pasteur visionnaire, mis en avant séparément. */
export const leadPastor = leaders[0];
