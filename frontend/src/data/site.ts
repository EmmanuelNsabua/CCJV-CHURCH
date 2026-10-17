/**
 * Informations institutionnelles CCJV.
 *
 * ### Ce que ce fichier est, et ce qu'il n'est pas
 *
 * C'est une **constante de présentation et une donnée institutionnelle
 * officielle** : nom, adresse, dates de fondation, visionnaire, horaires
 * confirmés, numéro WhatsApp. La règle de contenu de `docs/015` §5 s'applique
 * telle quelle — « un fait confirmé est affiché tel quel ; un fait non fourni
 * n'est JAMAIS inventé ». Ces valeurs sont donc légitimes en code : elles ne
 * proviennent pas d'une base et ne changent pas au gré des publications.
 *
 * Ce qu'il n'est plus : un dépôt de contenus métier. Il se trouvait auparavant
 * dans `src/data/mock/site.ts`, aux côtés de trois jeux de données qui, eux,
 * **décrivaient** le contenu du site et ont été retirés, parce qu'ils faisaient
 * doublon avec des sources réelles et qu'ils pouvaient diverger d'elles :
 *
 * | Retiré de ce fichier | Source réelle désormais utilisée |
 * | --- | --- |
 * | `socials` (Instagram, TikTok, YouTube) | `getSettings().socialLinks` — `GET /api/v1/settings`, alimenté par le back-office |
 * | `weeklyRhythm` (rythme hebdomadaire) | `getSchedule()` — `GET /api/v1/schedule` |
 * | `choraleSchedule` (résumé d'horaires) | `getSchedule()`, filtré sur les entrées de la chorale |
 *
 * Le dossier `src/data/mock/` a disparu avec ces retraits : il ne reste ici que
 * ce qui a une raison d'être en code.
 */

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
