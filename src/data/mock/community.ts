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
