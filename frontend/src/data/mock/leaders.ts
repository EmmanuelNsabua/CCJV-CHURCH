/**
 * Responsables de l'église — contenus de DÉMONSTRATION.
 *
 * Seul le Pasteur Manasse Mwamba est confirmé par la documentation. Les autres
 * entrées sont rédigées pour la maquette et doivent être remplacées avant mise
 * en production (avec l'accord des personnes concernées).
 */
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
  {
    id: "lead-001",
    name: "Pasteur Manasse Mwamba",
    role: "Visionnaire / créateur",
    scope: "Direction générale",
    photo: "/media/ccjv-05.jpeg",
    bio: "Il a fondé le Centre Chrétien Jésus ma Vie le 17 mars 2023. Sa charge : affermir l'église dans la Parole, la prière et l'amour fraternel.",
  },
  {
    id: "lead-002",
    name: "Responsable — Adultes",
    role: "Coordination du volet adultes",
    scope: "Adultes",
    photo: "/media/ccjv-04.jpeg",
    bio: "Accompagne les hommes et les femmes de l'assemblée : enseignement, entraide et intégration des nouveaux venus.",
  },
  {
    id: "lead-003",
    name: "Responsable — Ecodim",
    role: "Ministère des enfants",
    scope: "Enfants / Ecodim",
    photo: "/media/ccjv-19.jpeg",
    bio: "Veille sur l'encadrement des enfants depuis la naissance de l'Ecodim, le 2 juillet 2023.",
  },
  {
    id: "lead-004",
    name: "Responsable — Chorale",
    role: "Direction musicale",
    scope: "Chorale",
    photo: "/media/ccjv-24.jpeg",
    bio: "Conduit les chantres et les musiciens dans la préparation de la louange du dimanche.",
  },
  {
    id: "lead-005",
    name: "Responsable — Accueil",
    role: "Accueil et fraternité",
    scope: "Communauté",
    photo: "/media/ccjv-38.jpeg",
    bio: "Premier visage que rencontrent les visiteurs : accueil, orientation et suivi des nouvelles personnes.",
  },
];

/** Le pasteur, mis en avant séparément sur les pages de leadership. */
export const leadPastor = leaders[0];
