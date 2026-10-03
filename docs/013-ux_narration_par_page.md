# 013 — UX & Narration par page (V3)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV)
**Étape couverte :** ÉTAPE 3 (UX / Narration)
**Statut :** Proposition — implémentation après validation

Chaque page est définie par : **Objectif · Public · Question · Émotion · Contenu · Structure · CTA · Relations · Rôle dans l'appel**.

---

# A. ACCUEIL — première rencontre

**Objectif :** faire vivre une rencontre, pas présenter un catalogue.
**Public :** personne qui ne connaît pas CCJV.
**Question :** « Qui sont-ils ? Est-ce que je peux y aller ? »
**Émotion :** accueil → curiosité → confiance → désir de venir.

| # | Section | Fonction | Contenu | CTA |
| --- | --- | --- | --- | --- |
| 01 | **L'invitation (Hero)** | ACCUEILLIR | Identité, phrase d'accueil, photographie, verset d'ouverture, localisation | **Planifier ma visite** · **Voir les horaires** |
| 02 | **La Parole du jour** | RÉFLÉCHIR | Verset + référence, composition typographique pleine largeur, croix visible | — |
| 03 | **Un mot du pasteur** | RENCONTRER | Photo ou courte vidéo + quelques lignes signées | Écouter / Lire le message |
| 04 | **Qui sommes-nous en bref** | RACONTER | Identité, vision, date de fondation, photographie, référence spirituelle | **Découvrir notre histoire →** |
| 05 | **La vie de l'Église** | INFORMER | **3 événements maximum** (date, titre, lieu, photo, CTA) | Voir tous les événements |
| 06 | **Derniers enseignements** | TRANSMETTRE | 1 contenu principal (grand) + 2–3 secondaires | Écouter l'enseignement |
| 07 | **La communauté** | MONTRER | Photographies réelles (familles, enfants, louange, prédication) + témoignage mis en avant | Découvrir la communauté |
| 08 | **La prière** | FAIRE UNE PAUSE | Moment calme, filets, texte court | **Demander la prière** (point d'intégration) |
| 09 | **Soutenir l'église** | INVITER | Présentation sobre, moyens — uniquement si périmètre validé | Selon périmètre |
| 10 | **L'envoi** | INVITER | « La porte est ouverte. » + réseaux + infos pratiques | **Planifier ma visite** |

**Rôle dans l'appel :** porte d'entrée ; doit produire le passage *voir → comprendre → ressentir → se projeter → venir*.

---

# B. QUI SOMMES-NOUS

## B.0 `/qui-sommes-nous` — hub éditorial
**Objectif :** donner envie d'approfondir. **Émotion :** confiance, appartenance.
**Structure :** en-tête (verset) · présentation courte · 3 cartes-portes (ce que nous croyons / d'où nous venons / qui nous dirige) · photographie · respiration (verset) · CTA secondaires.
**CTA :** Découvrir notre histoire · Ce que nous croyons · Rencontrer l'équipe.

## B.1 `/qui-sommes-nous/ce-que-nous-croyons`
**Objectif :** expliciter la foi. **Question :** « En quoi croyez-vous ? » **Émotion :** clarté, sérieux.
**Contenu :** confession de foi, valeurs, vision spirituelle — **uniquement du contenu validé** (sinon `TODO — CONTENU À FOURNIR`).
**Structure :** en-tête (verset) · articles de foi numérotés · valeurs · respiration · CTA vers groupes/parcours nouveaux.

## B.2 `/qui-sommes-nous/d-ou-nous-venons`
**Objectif :** raconter l'histoire. **Émotion :** respect, continuité.
**Contenu :** 17 mars 2023, Pasteur Manasse Mwamba, 2 juillet 2023 (Ecodim), jalons.
**Structure :** en-tête · **Timeline** · grande photographie · respiration · CTA vers Vie de l'Église.

## B.3 `/qui-sommes-nous/qui-nous-dirige`
**Objectif :** incarner l'église. **Émotion :** proximité, confiance.
**Contenu :** Pasteur Manasse Mwamba + responsables (photos réelles, rôles).
**Structure :** en-tête · portrait principal · liste des responsables (nom, fonction, photo) · CTA contact.

---

# C. VIE DE L'ÉGLISE

## C.0 `/vie-de-leglise` — hub pratique
**Objectif :** répondre vite à « quand / où / comment venir ». **Émotion :** facilité.
**Structure :** en-tête · prochains rendez-vous (3) · **rythme hebdomadaire** (`WeekRhythm`) · accès rapide (nous trouver / faire un don) · respiration.

## C.1 `/vie-de-leglise/evenements`
**Objectif :** agenda complet. **Structure :** en-tête · événement principal (`FeaturedEvent`) · liste (`EventRow`) · archives · respiration.
**CTA :** Voir la fiche (→ `[slug]`).

## C.2 `/vie-de-leglise/evenements/[slug]`
**Objectif :** fiche complète. **Contenu :** titre, date, heure, lieu, département, description, photographies, informations pratiques, événements associés.
**CTA :** Ajouter à mon agenda · Nous contacter.

## C.3 `/vie-de-leglise/ou-nous-trouver`
**Objectif :** rendre la visite possible. **Émotion :** réassurance.
**Contenu :** adresse, horaires, accès, WhatsApp, réseaux sociaux, plan (si adresse fournie).
**CTA :** **Planifier ma visite** · WhatsApp.
**Note :** remplace l'actuelle `/contact`.

## C.4 `/vie-de-leglise/faire-un-don`
**Objectif :** soutenir — **uniquement si le périmètre le permet**. Sinon : page de présentation + **point d'intégration explicite**, aucun faux système de paiement.

---

# D. COMMUNAUTÉ

## D.0 `/communaute`
**Objectif :** montrer que CCJV est faite de personnes. **Émotion :** chaleur.
**Structure :** en-tête · photographies réelles · 4 portes (groupes de maison / parcours nouveaux / prière / témoignages) · respiration.

## D.1 `/communaute/groupes-de-maison`
**Objectif :** expliquer les groupes et permettre d'en rejoindre un. **CTA :** Rejoindre un groupe (point d'intégration).

## D.2 `/communaute/parcours-nouveaux` — *page clé de l'appel*
**Objectif :** dire à un nouveau **comment se passe l'arrivée, étape par étape**.
**Structure :** en-tête · **parcours en 4–5 étapes** (venir un dimanche → être accueilli → découvrir → s'intégrer) · questions fréquentes · CTA **Planifier ma visite**.

## D.3 `/communaute/priere`
**Objectif :** offrir un espace calme. **Émotion :** paix, écoute.
**Structure :** en-tête · composition apaisée · formulaire **uniquement si le périmètre le permet**, sinon point d'intégration + WhatsApp. **Aucun faux envoi.**

## D.4 `/communaute/temoignages`
**Objectif :** preuve humaine. **Contenu :** **témoignages réels uniquement** (sinon `TODO — CONTENU À FOURNIR`). **CTA :** Partager mon témoignage.

---

# E. ORGANISATION

## E.0 `/organisation` — hub
**Structure :** en-tête · présentation · 2 portes (responsables / départements) · respiration.

## E.1 `/organisation/responsables`
Responsables par département (nom, rôle, photo) — **contenu réel uniquement**.

## E.2 `/organisation/departements`
**Liste dynamique** (jamais codée en dur) : `DepartmentFeature` (photo en arche, numéro, nom, description).
**CTA :** Découvrir ce département (→ `[slug]`).

## E.3 `/organisation/departements/[slug]`
**Gabarit généralisé à partir de votre page `/chorale`** (déjà posée) :
en-tête (verset) · vocation + photographie + rythme de rencontre + responsable · piliers (`keyPoints`) · galerie (`gallery`) · respiration (verset) · CTA rejoindre.
**Note :** `/organisation/departements/chorale` remplacera `/organisation/chorale`.

---

# F. PUBLICATIONS & MÉDIAS

## F.0 `/publications` — hub éditorial
**Structure :** en-tête · 4 portes (actualités / enseignements / médiathèque / ressources) · dernier contenu mis en avant · respiration.

## F.1 `/publications/actualites` — articles et nouvelles (grille éditoriale chronologique).
## F.2 `/publications/enseignements` — sermons : **1 grand contenu + secondaires** (vidéo externe YouTube/Facebook).
## F.3 `/publications/mediatheque` — galerie photos/vidéos, filtrable par type.
## F.4 `/publications/ressources` — guides et documents (téléchargeables le cas échéant).
## F.5 `/publications/[slug]` — contenu individuel : titre, type, date, média, texte, contenus associés.

---

# G. PAGES TRANSVERSALES

| Page | Objectif | Contenu |
| --- | --- | --- |
| `/mentions-legales` | Conformité | Éditeur, hébergeur, propriété intellectuelle |
| `/confidentialite` | Confiance | Données collectées, finalités, droits |
| `/conditions` | Cadre | Conditions d'utilisation |
| `/accessibilite` | Inclusion | Engagement WCAG 2.2 AA, moyens de contact |
| `/recherche` | Retrouver | Recherche transversale (contenus, événements, départements) |

---

# H. SYSTÈME D'INTRODUCTION ET DE TRANSITIONS (§34–§36)

## H.1 Introduction de la Home
Séquence **courte et non bloquante** (~1,6 s max, sautable) :
`fond noir → croix visible → verset → référence → CCJV → fondu vers la Home`.

Contraintes : **SSR-safe** (le contenu est dans le DOM dès le départ — aucun blocage du rendu, aucun masquage du LCP) · `prefers-reduced-motion` → séquence supprimée · un seul rendu par session (`sessionStorage`) pour ne jamais ralentir un visiteur qui revient · purge automatique.

## H.2 Transitions entre pages
Langage commun, **variantes selon le contexte** : voile + croix + libellé de section, fondu, léger déplacement.
**Uniquement `transform` / `opacity`** (GPU-friendly), **CSS d'abord**, très peu de JS, aucune vidéo, aucun effet bloquant.

---

# I. RESPONSIVE — COMPOSITIONS INDÉPENDANTES (§37–§42)

Règle : **« Le Desktop et le Mobile racontent la même histoire, mais pas de la même manière. »**

| Élément | Desktop | Mobile |
| --- | --- | --- |
| Hero | 2 colonnes (panneau sombre + photographie) | Photographie pleine largeur puis texte ; hauteur réduite |
| Sections éditoriales | Composition asymétrique 5/7 ou 7/5 | Empilement **repensé** : image → titre → texte → CTA |
| Événements | Principal (`FeaturedEvent`) + lignes | Principal compact + lignes empilées |
| Galeries | 3 colonnes | Défilement horizontal tactile |
| Menu | Mega menu plein écran | Plein écran, sous-sections dépliables, accès WhatsApp/nous trouver |
| Respirations | Grandes hauteurs | Hauteurs réduites mais **conservées** (jamais supprimées) |

---

# J. GARDE-FOUS

1. **Ne rien inventer** : faits, horaires, adresses, responsables, témoignages, versets officiels (voir §28 du prompt et §K ci-dessous).
2. **Pas de faux système** : don et prière = présentation + point d'intégration, jamais de simulation.
3. **Jamais de page sans raison d'exister** ; jamais de page gonflée artificiellement.
4. **Performance** : la richesse visuelle n'autorise jamais une page lourde.
5. **Accessibilité** : croix et motifs décoratifs en `aria-hidden` ; contraste ; focus ; clavier.

---

# K. POINT À TRANCHER — PLACEHOLDERS

Le prompt V3 (§28) demande d'utiliser `TODO — CONTENU À FOURNIR` lorsqu'une information manque.
Une consigne antérieure demandait **l'absence totale de « TODO » à l'écran** (remplacés par du lorem ipsum).

**Proposition :** appliquer `TODO — CONTENU À FOURNIR` **uniquement** aux informations institutionnelles réellement inconnues (doctrine, horaires, adresse, responsables, témoignages, versets officiels) — car les inventer serait grave — et conserver le lorem ipsum pour le texte purement décoratif. Décision à confirmer.
