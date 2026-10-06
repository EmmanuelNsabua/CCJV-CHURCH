/**
 * Versets bibliques — textes RÉELS (traduction Louis Segond 1910, domaine public).
 *
 * ⚠️ Aucun verset n'est inventé : ce sont des citations exactes avec leur
 * référence. Conformément à la Direction artistique (§14), la sélection
 * définitive doit être VALIDÉE par CCJV avant mise en production.
 */

export interface Verse {
  text: string;
  reference: string;
}

export const verses = {
  rassemblement: {
    text: "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux.",
    reference: "Matthieu 18:20",
  },
  louange: {
    text: "Que tout ce qui respire loue l'Éternel !",
    reference: "Psaume 150:6",
  },
  repos: {
    text: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.",
    reference: "Matthieu 11:28",
  },
  parole: {
    text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
    reference: "Psaume 119:105",
  },
  ouvrage: {
    text: "Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres, que Dieu a préparées d'avance, afin que nous les pratiquions.",
    reference: "Éphésiens 2:10",
  },
  corps: {
    text: "Car, comme le corps est un et a plusieurs membres, et comme tous les membres du corps, malgré leur nombre, ne forment qu'un seul corps, ainsi en est-il de Christ.",
    reference: "1 Corinthiens 12:12",
  },
  memoire: {
    text: "Qu'ainsi disent les rachetés de l'Éternel, ceux qu'il a délivrés de la main de l'ennemi.",
    reference: "Psaume 107:2",
  },
  mission: {
    text: "Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit, et enseignez-leur à observer tout ce que je vous ai prescrit.",
    reference: "Matthieu 28:19-20",
  },
} as const satisfies Record<string, Verse>;

