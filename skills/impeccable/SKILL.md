---
name: impeccable
description: "Directives et détection d'anti-patterns de design pour éliminer le 'slop IA' et concevoir des interfaces web singulières, artisanales et irréprochables."
---

# Impeccable — Anti-Patterns de Design IA & Rigueur Visuelle

Inspiré du référentiel **Impeccable** créé par Paul Bakaus (pbakaus/impeccable), ce guide définit les contraintes déterministes et la grille d'audit pour éliminer les clichés visuels générés par défaut par les modèles d'intelligence artificielle (« AI slop ») et produire des interfaces d'un niveau d'artisanat exceptionnel.

---

## 1. Détection des anti-patterns IA (« AI Slop »)

Tout composant ou écran conçu dans le projet CCJV doit être préalablement audité contre ces anti-patterns typiques de l'IA :

### 1.1. Anti-patterns de mise en page & structure
1. **Emboîtement superflu de cartes (*Nested Cards*) :**
   - *Cliché IA :* Une boîte blanche dans une boîte grise dans une carte avec ombre.
   - *Règle Impeccable :* Utiliser l'espace négatif, les séparateurs fins (`border-ccjv-line`) et l'alignement pour hiérarchiser, plutôt que d'empiler des conteneurs.
2. **Symétrie paresseuse et vide non maîtrisé :**
   - *Cliché IA :* Formulaire bêtement centré flottant dans 80% de vide stérile sans composition.
   - *Règle Impeccable :* Composition asymétrique intentionnelle (ex. Split screen avec volet narratif immersif d'un côté et formulaire utilitaire affûté de l'autre).
3. **Pseudos-ombres diffuses et faux glassmorphism :**
   - *Cliché IA :* `shadow-2xl` floues, `backdrop-blur-md` à outrance.
   - *Règle Impeccable :* Contrastes nets, délimitation franche par bordures franches (1px solide), ombres portées quasi inexistantes ou strictement géométriques.

### 1.2. Anti-patterns de couleur & contraste
1. **Dégradés violacés/bleutés génériques :**
   - *Cliché IA :* `from-indigo-500 to-purple-600` vu sur tous les templates SaaS.
   - *Règle Impeccable :* Palette ancrée dans l'identité réelle du projet (Vert végétal `#1e7a1e`, noir d'encre `#1a1a1a`, crème `#ede4c8`, fond minéral `#fafaf7`).
2. **Texte gris illisible sur fond teinté :**
   - *Cliché IA :* Texte gris moyen `#9ca3af` sur fond blanc ou coloré, contrastes inférieurs à 3:1.
   - *Règle Impeccable :* Contraste systématique > 4.5:1 (WCAG AA), noirs profonds pour les titres, gris secondaires maîtrisés (`#5e5d59`).
3. **Noirs et gris délavés sans intention :**
   - *Cliché IA :* `#000000` brut ou gris froids fadasse.
   - *Règle Impeccable :* Teintes chaudes et minérales coordonnées avec le design system.

### 1.4. Bruit visuel et clichés décoratifs parasites (Red flags majeurs)
1. **Accumulation de badges et « capsules » décoratives :**
   - *Cliché IA :* Multiplier les petites pastilles (ex: « ACCÈS SÉCURISÉ », mini-badge de logo dans un coin, étiquette de catégorie superflue au-dessus d'un titre). C'est du bruit qui étouffe le regard.
   - *Règle Impeccable :* Zéro badge non fonctionnel. L'autorité et la sécurité d'une interface s'expriment par la retenue et la précision, pas par des étiquettes.
2. **Surcharge rédactionnelle en bas d'écran :**
   - *Cliché IA :* Empiler une citation, une référence de verset, un sous-titre de verset, puis un copyright verbeux sous le bouton principal.
   - *Règle Impeccable :* Respirabilité maximale. Un titre fort, une courte phrase d'accompagnement. Rien de superflu sous le formulaire.
3. **Faux plein écran (boîte dans la page) :**
   - *Cliché IA :* Dessiner une fausse page enfermée dans une boîte `max-w-5xl` flottant au centre d'un fond grisâtre.
   - *Règle Impeccable :* L'application occupe l'intégralité du viewport (`h-screen overflow-hidden`). Le panneau d'image est disposé avec un padding généreux pour flotter avec élégance sur le canevas, tandis que l'espace utilitaire de droite s'étend sur le reste de la largeur disponible.

---

## 2. Application au Split-Screen de Connexion CCJV

Sur la base de la maquette de référence fournie par l'utilisateur :

1. **Panneau gauche (Volet visuel & narratif) :**
   - Image atmosphérique et spirituelle authentique (dunes, paysages solennels, architecture lumineuse, cadrage noir et blanc ou tonalité chaude).
   - Badge CCJV sobre en coin supérieur (acronyme, croix stylisée ou logo discret, monochrome).
   - En bas : texte éditorial fort en sérif avec verset ou devise (« L'intendance fidèle de la maison de Dieu »), typographie affirmée.
   - **Angles strictement droits (`rounded-none`, 0px)**, bordure fine séparatrice.
2. **Panneau droit (Formulaire d'authentification) :**
   - Titre franc en `font-serif` (« Connexion ») et mot d'accueil bienveillant (« Accès à l'espace pastoral et administratif »).
   - Champs `email` et `password` avec labels nets, `rounded-none`, bordures `border-ccjv-line`, focus vert CCJV franc (`outline: 2px solid #1e7a1e`).
   - Ligne d'assistance accessible (« Mot de passe oublié ? » / Case à cocher « Rester connecté »).
   - Bouton de soumission plein, d'un noir encre profond (`#121212`) ou vert CCJV profond, avec survol subtil sans rebond artificiel.
   - Pied de page discret rappelant la confidentialité et le retour vers le site public.
