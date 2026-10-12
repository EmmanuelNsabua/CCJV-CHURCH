/**
 * Informations institutionnelles CCJV.
 *
 * Règle de contenu (docs/015 §5) : un fait confirmé est affiché tel quel ; un
 * fait non fourni n'est JAMAIS inventé — il reste marqué comme tel.
 *
 * CONFIRMÉ : fondation, naissance de l'Ecodim, pasteur visionnaire, ville,
 * adresse, horaires des cultes et de répétition de la chorale.
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
  visionaryRole: "Visionnaire / Pasteur principal",

  /** Adresse communiquée par CCJV. */
  address: "Quartier Hewa Bora, Avenue Djoloko Lubumbashi",
  addressLines: [
    "Quartier Hewa Bora",
    "Avenue Djoloko",
    "Lubumbashi, République démocratique du Congo",
  ],

  /** Culte dominical — horaire confirmé CCJV. */
  scheduleAdults: "Dimanche · 08h30 à 11h30",
  /** Ministère des enfants — se tient pendant le culte dominical. */
  scheduleChildren: "Dimanche · 08h30 (Ecodim, pendant le culte)",

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
 * Rythme hebdomadaire de la communauté — Horaires confirmés CCJV.
 * - Mardi : 16h30 – 18h30
 * - Vendredi : 16h30 – 18h30
 * - Dimanche : 08h30 – 11h30
 * - Répétitions chorale : Lundi 16h30–18h30, Mercredi à partir de 21h30 (veillée), Samedi 16h30–18h30
 */
export const weeklyRhythm: RhythmEntry[] = [
  {
    day: "Dimanche",
    title: "Culte dominical",
    time: "08h30 – 11h30",
    audience: "Toute l'assemblée",
    confirmed: true,
  },
  {
    day: "Dimanche",
    title: "Ecodim",
    time: "08h30 – 11h30",
    audience: "Enfants — pendant le culte",
    confirmed: true,
  },
  {
    day: "Lundi",
    title: "Répétition de la chorale Grand Groupe",
    time: "16h30 – 18h30",
    audience: "Chantres et musiciens",
    confirmed: true,
  },
  {
    day: "Mardi",
    title: "Culte de semaine",
    time: "16h30 – 18h30",
    audience: "Toute l'église",
    confirmed: true,
  },
  {
    day: "Mercredi",
    title: "Répétition / Veillée de la chorale",
    time: "À partir de 21h30",
    audience: "Chantres et musiciens",
    confirmed: true,
  },
  {
    day: "Vendredi",
    title: "Culte de prière et d'intercession",
    time: "16h30 – 18h30",
    audience: "Toute l'église",
    confirmed: true,
  },
  {
    day: "Samedi",
    title: "Répétition de la chorale Grand Groupe",
    time: "16h30 – 18h30",
    audience: "Chantres et musiciens",
    confirmed: true,
  },
];

/** Horaires confirmés de la chorale. */
export const choraleSchedule =
  "Lundi 16h30–18h30 · Mercredi à partir de 21h30 · Samedi 16h30–18h30";
