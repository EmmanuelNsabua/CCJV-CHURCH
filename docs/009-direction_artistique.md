# 009 — Creative Direction (Étape 2)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC
**Sous-phase :** Conception du site public (pré-implémentation)
**Statut :** Proposition — à valider avant implémentation

---

## 1. Positionnement de marque

Le site doit faire percevoir CCJV simultanément comme :

- **Une institution religieuse** — crédible, structurée, sérieuse ;
- **Une communauté vivante** — vraies personnes, vraies activités, vraie énergie ;
- **Une famille spirituelle** — chaleureuse, accessible, humaine.

> **Perception recherchée :** institutionnelle dans sa crédibilité, humaine dans son
> expression, contemporaine dans son exécution.

**Niveau de modernité : 4/5 — moderne premium**, mais intemporel : pas d'effets
technologiques ostentatoires, pas de tendances éphémères.

---

## 2. Brand personality

**CCJV est :** sobre, chaleureux, digne, vivant, accueillant, contemporain.

**CCJV n'est pas :** luxueux, cérémoniel excessif, technologique, startup, impersonnel,
ostentatoire.

**Objectif émotionnel** (progression du visiteur) :

1. « C'est une église sérieuse, mais vivante. »
2. « C'est moderne, mais pas artificiel. »
3. « Il y a une vraie communauté derrière ce site. »
4. « J'aimerais découvrir cette communauté. »

Émotions portées en permanence : **paix, joie, espérance, foi, chaleur humaine,
modernité, dynamisme, communauté** — sans chaos visuel.

---

## 3. Visual language — le langage des contrastes

Le langage visuel de CCJV repose sur cinq tensions assumées :

| Contraste | Traduction visuelle |
| --- | --- |
| Institution ↔ Communauté | Structure éditoriale rigoureuse + photographie de vraies personnes |
| Structure éditoriale ↔ Vie humaine | Grille/typographie maîtrisée + photos spontanées (WhatsApp, non posées) |
| Minimalisme ↔ Dynamisme | Espace négatif généreux + motion/micro-interactions qui accompagnent le récit |
| Tradition spirituelle ↔ Contemporain | Lora (serif, chaleureux) ↔ Inter (sans, net) |
| Sobriété ↔ Chaleur | Palette vert/blanc sobre + accents doré/crème discrets |

**Quatre axes fondamentaux :** Minimaliste · Éditoriale · Photographique · Contemporaine.

---

## 4. Principes de composition

1. **L'espace négatif est un matériau.** Il crée la qualité ; on ne le « remplit » pas.
2. **La typographie est structurelle.** Les titres Lora rythment la page comme une
   publication éditoriale ; ils ne sont pas décoratifs.
3. **La photographie est la matière émotionnelle.** Elle montre la communauté réelle ;
   elle ne doit jamais être reléguée à un simple fond.
4. **Asymétrie assumée.** Les compositions (Hero en tête) évitent le centrage générique ;
   le déséquilibre contrôlé crée le dynamisme.
5. **Hiérarchie avant décoration.** Contraste, échelle, rythme — jamais d'ornements
   compensatoires.
6. **Container + Full width + Grille éditoriale.** Trois régimes de largeur combinés :
   - `Container` (≤ 1200 px) pour le contenu courant ;
   - `Full width` pour Hero, photographies, sections visuelles, navigation ;
   - `Grille éditoriale` (12 colonnes asymétriques) pour les compositions d'image/texte.

---

## 5. Direction photographique

**Importance : 4/5 — forte.** La photographie est un pilier de l'identité.

- **Règle absolue :** privilégier les **43 photos réelles** de `public/images/` ; ne
  recourir à des banques d'images qu'en dernier recours et jamais pour représenter la
  communauté.
- **Catégories** : portraits · cultes · louange · familles · prédication · Ecodim ·
  vie communautaire · architecture.
- **Traitement** : dominante chaude (en écho au doré), cadrage éditorial (recadrages
  paysage large / portrait serré), aucune saturation artificielle.
- **Placement** : grandes images pleine largeur pour le Hero et les transitions ;
  vignettes dans les cartes ; l'image raconte, le texte légende.

---

## 6. Direction motion

**Niveau : 4/5 — dynamique**, mais **aucun effet superflu**.

Principes :

- Le mouvement **accompagne la narration, la hiérarchie, la navigation, la compréhension** ;
  il n'est jamais le sujet.
- Interactions : hover subtil, apparition au scroll, parallax léger, transitions de page,
  micro-interactions pertinentes (menu, CTA, cartes).
- **`prefers-reduced-motion` obligatoire** : animations désactivées → l'expérience reste
  complète et cohérente (les éléments révélés au scroll deviennent visibles d'emblée).
- Évitements : pas d'autoplay vidéo, pas de WebGL, pas de carrousel lourd, pas de
  parallax sur mobile (performance).

---

## 7. Ton éditorial (voix)

- **Français**, registre institutionnel chaleureux : clair, digne, jamais jargon.
- Phrases courtes, verbes d'action (« Découvrez », « Rejoignez »), tutoiement/vouvoiement
  cohérent (vouvoiement institutionnel recommandé).
- Le contenu réel n'étant pas fourni, tout texte manquant est un **placeholder explicite**
  (`TODO — … À FOURNIR`) ou du Lorem ipsum (Hero uniquement), jamais un slogan inventé.

---

## 8. Garde-fous (ce que le design ne doit jamais être)

Pas de template WordPress générique · pas de landing SaaS · pas d'esthétique startup ·
pas de symboles religieux clichés · pas de glassmorphism/neumorphism · pas de cartes
arrondies · pas de grosses ombres · pas de gradients omniprésents · pas d'animations
gratuites · pas de Hero vidéo lourd · pas d'autoplay · pas d'interfaces surchargées ·
pas de stock photos impersonnelles · pas d'esthétique luxueuse ni technologique excessive.
