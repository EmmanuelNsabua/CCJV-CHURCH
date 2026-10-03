/**
 * Informations institutionnelles CCJV.
 *
 * Règle de contenu (docs/015 §5) : un fait confirmé est affiché tel quel ; un
 * fait non fourni n'est JAMAIS inventé — il reste marqué comme tel.
 *
 * CONFIRMÉ : fondation, naissance de l'Ecodim, pasteur visionnaire, ville,
 * adresse, horaires de répétition de la chorale.
 * DÉMONSTRATION : horaires du culte dominical et de l'Ecodim (à valider par CCJV).
 */

export interface SocialLink {
  label: string;
  href: string;
}

export const site = {
  name: "CENTRE CHRÉTIEN JÉSUS MA VIE",
  acronym: "CCJV",
  location: "Lubumbashi, République démocratique du Congo",
  foundedAt: "17 mars 2023",
  ecodimFoundedAt: "2 juillet 2023",
  visionary: "Pasteur Manasse Mwamba",
  visionaryRole: "Visionnaire / créateur",

  /** Adresse communiquée par CCJV. */
  address: "Quartier Hewa Bora, Avenue Djoloko Lubumbashi",
  addressLines: [
    "Quartier Hewa Bora",
    "Avenue Djoloko",
    "Lubumbashi, République démocratique du Congo",
  ],

  /** Culte dominical — horaire de démonstration, à valider par CCJV. */
  scheduleAdults: "Dimanche · 09h00",
  /** Ministère des enfants — se tient pendant le culte dominical. */
  scheduleChildren: "Dimanche · 09h00 (Ecodim, pendant le culte)",

  whatsappNumber: "+243 123 456 789",
  whatsappHref: "https://wa.me/243123456789",
} as const;

export const socials: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/ecodim_ccjv/" },
  { label: "TikTok", href: "https://www.tiktok.com/@ecodim_ccjv" },
];

export interface RhythmEntry {
  day: string;
  title: string;
  time: string;
  audience?: string;
  /** `true` lorsque l'horaire a été communiqué par CCJV. */
  confirmed?: boolean;
}

/**
 * Rythme hebdomadaire de la communauté.
 *
 * Les répétitions de la chorale sont des horaires CONFIRMÉS par CCJV
 * (lundi 16h30–18h30, mercredi dans la nuit, samedi 16h30–18h30).
 * Les autres entrées restent des horaires de démonstration.
 */
export const weeklyRhythm: RhythmEntry[] = [
  {
    day: "Dimanche",
    title: "Culte dominical",
    time: "09h00",
    audience: "Toute l'assemblée",
  },
  {
    day: "Dimanche",
    title: "Ecodim",
    time: "09h00",
    audience: "Enfants — pendant le culte",
  },
  {
    day: "Lundi",
    title: "Répétition de la chorale",
    time: "16h30 – 18h30",
    audience: "Chantres et musiciens",
    confirmed: true,
  },
  {
    day: "Mercredi",
    title: "Répétition de la chorale",
    time: "Dans la nuit",
    audience: "Veillée de préparation",
    confirmed: true,
  },
  {
    day: "Mercredi",
    title: "Prière et intercession",
    time: "17h00",
    audience: "Toute l'église",
  },
  {
    day: "Samedi",
    title: "Répétition de la chorale",
    time: "16h30 – 18h30",
    audience: "Chantres et musiciens",
    confirmed: true,
  },
];

/** Horaires confirmés de la chorale, isolés pour les fiches département. */
export const choraleSchedule =
  "Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30";
