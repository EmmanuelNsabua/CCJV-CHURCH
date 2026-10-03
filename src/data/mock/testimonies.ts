/**
 * Témoignages — contenus de DÉMONSTRATION rédigés pour la maquette.
 *
 * ⚠️ Ils ne sont pas réels : ils illustrent le format (visage + parole) et
 * doivent être remplacés par de vrais témoignages, recueillis avec l'accord
 * des personnes, avant mise en production (Direction artistique §12/§18).
 * Les prénoms sont volontairement génériques pour éviter toute attribution.
 */
export interface Testimony {
  id: string;
  photo: string;
  quote: string;
  name: string;
  role: string;
}

export const testimonies: Testimony[] = [
  {
    id: "tem-001",
    photo: "/media/ccjv-01.jpeg",
    quote:
      "Je suis arrivée sans connaître personne. On m'a accueillie simplement, sans me juger. Aujourd'hui, j'ai une famille ici.",
    name: "Grâce",
    role: "Membre de l'assemblée",
  },
  {
    id: "tem-002",
    photo: "/media/ccjv-03.jpeg",
    quote:
      "Nos enfants attendent le dimanche avec impatience. L'Ecodim leur a appris à aimer la Parole de Dieu.",
    name: "Patrick",
    role: "Papa de deux enfants",
  },
  {
    id: "tem-003",
    photo: "/media/ccjv-18.jpeg",
    quote:
      "Servir dans la louange a changé ma manière de prier. On ne chante pas seulement : on apprend à se tenir devant Dieu.",
    name: "Esther",
    role: "Chorale",
  },
  {
    id: "tem-004",
    photo: "/media/ccjv-34.jpeg",
    quote:
      "J'ai traversé une période difficile. Les prières de l'église m'ont porté, et je n'ai jamais été seul.",
    name: "Josué",
    role: "Membre depuis 2023",
  },
];
