/**
 * Visages de la communauté — contenus de DÉMONSTRATION.
 *
 * ⚠️ Les prénoms et descriptions sont rédigés pour la maquette : ils doivent
 * être remplacés par de vraies identités, avec l'accord des personnes, avant
 * mise en production. Les photos proviennent des ressources réelles du projet.
 */
export interface CommunityFace {
  id: string;
  photo: string;
  name: string;
  caption: string;
}

export const communityFaces: CommunityFace[] = [
  {
    id: "face-01",
    photo: "/media/ccjv-01.jpeg",
    name: "Grâce",
    caption: "Elle accueille les nouveaux venus le dimanche matin.",
  },
  {
    id: "face-02",
    photo: "/media/ccjv-03.jpeg",
    name: "Patrick",
    caption: "Papa de deux enfants, fidèle au culte avec sa famille.",
  },
  {
    id: "face-03",
    photo: "/media/ccjv-06.jpeg",
    name: "Esther",
    caption: "Choriste : elle conduit l'assemblée dans la louange.",
  },
  {
    id: "face-04",
    photo: "/media/ccjv-18.jpeg",
    name: "Naomi",
    caption: "Elle accompagne les enfants de l'Ecodim chaque dimanche.",
  },
  {
    id: "face-05",
    photo: "/media/ccjv-34.jpeg",
    name: "Emmanuel",
    caption: "Musicien, au service de la louange et de la prière.",
  },
];

/**
 * Groupes de maison — données de DÉMONSTRATION à Lubumbashi.
 * Représentent des cellules de quartier réelles pour la communion fraternelle.
 */
export interface HouseGroup {
  id: string;
  name: string;
  quarter: string;
  schedule: string;
  host: string;
  description: string;
  image?: string;
}

export const houseGroups: HouseGroup[] = [
  {
    id: "groupe-hewa-bora",
    name: "Groupe Hewa Bora & Centre",
    quarter: "Quartier Hewa Bora",
    schedule: "Chaque mercredi · 17h30",
    host: "Chez l'habitant (Quartier Hewa Bora)",
    description: "Un espace d'accueil au cœur du quartier de l'église, réunissant familles et jeunes pour prier et méditer la Parole en simplicité.",
    image: "/media/ccjv-35.jpeg",
  },
  {
    id: "groupe-bel-air",
    name: "Groupe Bel-Air & Ruashi",
    quarter: "Quartier Bel-Air",
    schedule: "Chaque jeudi · 17h00",
    host: "Chez l'habitant (Quartier Bel-Air)",
    description: "Rencontre fraternelle axée sur l'encouragement mutuel, le partage des fardeaux et l'amitié sincère au quotidien.",
    image: "/media/ccjv-30.jpeg",
  },
  {
    id: "groupe-golf",
    name: "Groupe Golf & Baudouin",
    quarter: "Quartier Golf",
    schedule: "Chaque mercredi · 18h00",
    host: "Chez l'habitant (Quartier Golf)",
    description: "Temps d'édification et de prière dans une atmosphère paisible, favorisant les échanges ouverts et la croissance spirituelle.",
    image: "/media/ccjv-28.jpeg",
  },
  {
    id: "groupe-kenya",
    name: "Groupe Kenya & Kamalondo",
    quarter: "Commune de la Kenya",
    schedule: "Chaque mardi · 17h30",
    host: "Chez l'habitant (Commune de la Kenya)",
    description: "Un cadre chaleureux pour approfondir les Écritures, chanter et porter ensemble les défis et victoires des familles.",
    image: "/media/ccjv-27.jpeg",
  },
];

