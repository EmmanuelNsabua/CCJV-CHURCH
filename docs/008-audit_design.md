# 008 — Audit design (Étape 1)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC
**Sous-phase :** Conception du site public (pré-implémentation)
**Statut :** Document de travail — source des constats avant Creative Direction

---

## 1. Objet

Ce document consigne l'audit du dépôt réalisé avant toute conception : inventaire des
documents, des assets visuels, leur état technique, et les écarts relevés entre la
documentation existante et la direction artistique validée.

---

## 2. Inventaire des documents (`docs/`)

Tous les documents ont été lus intégralement.

| Fichier | Contenu | Statut |
| --- | --- | --- |
| `001-cahier_des_charges.md` | Contexte, objectifs, périmètre, contraintes | Lu |
| `002-specifications_fonctionnelle.md` | 6 pages publiques, modèle de données, règles | Lu |
| `003-architecture_technique.md` | Vue 3 couches, contraintes Lubumbashi | Lu |
| `004-architecture_logicielle_...md` | Stack définitive, couches, API, auth, patterns (Phase 3.3, **validé**) | Lu |
| `005-schema_database.md` | Schéma SQL (5 tables), index | Lu |
| `006-modelisation_dynamique_&_statique_...md` | UML, règles métier consolidées (Phase 3.2) | Lu |
| `007-design_graphique.md` | Charte graphique : logo, couleurs, typo, ton | Lu |

**Synthèse fonctionnelle (source de vérité)** : le périmètre public V1 est constitué de
6 pages — Accueil, Qui sommes-nous, Organisation, Événements, Publications/Médias,
Contact. Le modèle métier repose sur 5 entités : `Admin`, `Department`, `Event`,
`Publication`, `StaticPage`.

---

## 3. Inventaire des assets (`public/`)

### 3.1 Logo

- **Fichier :** `public/logo.png`
- **Format :** PNG, **1254 × 1254 px**, **405,7 Ko**.
- **Contenu :** bâtiment stylisé + livre ouvert (Bible), sigle « CCJV », nom complet
  « Centre Chrétien Jésus ma Vie ».
- **Analyse colorimétrique réelle** (échantillonnage pixel) :
  - Dominante : **noir** (`#000000`) et **blanc/crème quasi-blanc** (`#FDFDFD`/`#FFFFFF`).
  - Bâtiment/livre : **gris** (trait, `#BFBFBF` → `#DADADA`).
  - Le « vert » du sigle est en réalité un **vert menthe très pâle** (≈ `#BFFFBF`), en
    **quantité infime** (41 px sur ~1,57 M) — un accent discret, pas une masse verte.
  - Le « doré/crème » du lettrage est **quasi blanc** (pas un or soutenu).

### 3.2 Photographies (`public/images/`)

- **43 photographies JPEG**, issues de partages WhatsApp (photos réelles de la communauté).
- Poids unitaire : **38 → 245 Ko** (déjà compressées par WhatsApp), total ≈ 3,5 Mo.
- Dimensions dominantes :
  - Portrait mobile : `720×1080`, `810×1080`, `559×994`, `994×559`.
  - Grand format : `1967×2560`, `1439×2560`, `2560×1439`, `1280×960`, `1080×654`.
- **Conséquences :** matériau photographique réel et abondant, mais **non optimisé pour
  le web** (pas de WebP/AVIF, pas de recadrage dédié, plusieurs doublons de cadrage
  portrait/paysage). Une passe d'optimisation sera nécessaire à l'implémentation.

---

## 4. État du dépôt

- **Greenfield** : le dépôt ne contient que `docs/` et `public/`.
- Pas de `.git`, pas de `package.json`, pas de scaffold Next.js, aucun fichier de config.
- Outillage disponible sur la machine : **Node 22.19**, **npm 11.18**, **pnpm 11.7**.

> L'implémentation partira donc d'un socle Next.js à créer, en respectant la stack figée
> (Phase 3.3).

---

## 5. Cohérence documentation ↔ direction artistique

### 5.1 Points cohérents (aucune action requise)

- Périmètre 6 pages, données mockées en V1, départements dynamiques (jamais codés en dur).
- Palette, typographies (Lora/Inter), 1200 px, cartes sans ombre, boutons carrés,
  menu plein écran, CTA « Nous rejoindre », WhatsApp contextuel, WCAG 2.2 AA,
  performance-first, SEO — **tous alignés** entre la direction artistique et les docs.

### 5.2 Écart relevé — `events.is_archived`

- `005-schema_database.md` définit encore un champ `is_archived` (booléen).
- `006-modelisation_...md` (§5 et §23) le **supprime** : l'état `UPCOMING`/`ARCHIVED` est
  désormais **calculé** depuis `eventDate`, et n'est **jamais persisté**.
- **Décision :** l'implémentation publique suivra la modélisation (propriété calculée,
  pas de `is_archived`). Le schéma SQL `005` devra être aligné avant la phase backend
  (hors périmètre de la mission publique, mais signalé).

### 5.3 Écart relevé — couleur « vert » du logo

- La charte (`007`) et la direction artistique fixent `#1E7A1E` (vert sombre) comme
  couleur principale, en indiquant « à ajuster depuis le fichier logo source ».
- Le logo réel présente un vert menthe pâle quasi ponctuel et un ensemble quasi
  monochrome (noir/blanc).
- **Décision proposée (à valider) :** conserver `#1E7A1E` comme **vert d'interface
  principal** — c'est lui qui porte l'identité et garantit le contraste AA — et traiter
  le vert menthe du logo comme un **accent dérivé optionnel**, pas comme une couleur de
  texte ni de fond. La palette « doré/crème » `#EDE4C8` reste un accent, conformément à
  la direction artistique.

### 5.4 Point non tranché — fiche événement détaillée

- `002` mentionne une « fiche événement », mais la structure publique validée ne liste
  que 6 routes, **sans** `/evenements/[slug]`.
- **Décision proposée (à valider) :** en V1, la page Événements porte toute
  l'information dans des cartes riches (titre, date, heure, lieu, description, image,
  département) ; **pas de page de détail séparée**. Elle pourra être ajoutée en itération.

---

## 6. Informations institutionnelles manquantes (placeholders requis)

Aucune de ces données n'est disponible : elles seront représentées par des placeholders
explicites `TODO — … À FOURNIR`, jamais par des valeurs inventées.

| Donnée | Usage | Statut |
| --- | --- | --- |
| Horaires des cultes (adultes / enfants) | Accueil, Contact | TODO |
| Adresse / localisation exacte | Contact, Qui sommes-nous | TODO |
| Numéro WhatsApp (`wa.me/…`) | Footer, Contact | TODO |
| Message de bienvenue / vision / histoire | Accueil, Qui sommes-nous | TODO (Lorem autorisé pour le Hero) |
| Liste précise des départements | Organisation | Partielle : « Adultes », « Enfants/Ecodim » confirmés ; « chorale » mentionnée (`001`) ; « Jeunesse » citée en exemple (`006`) |
| Date/heure/lieu des prochains événements | Événements, Accueil | Mock |
| Réseaux sociaux | Footer, Contact | Confirmés : Instagram `ecodim_ccjv`, TikTok `ecodim_ccjv` |

### Informations confirmées (utilisables)

- Nom : Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC.
- Création de l'église : **17 mars 2023**.
- Naissance de l'Ecodim : **2 juillet 2023**.
- Visionnaire/créateur : **Pasteur Manasse Mwamba**.
- Instagram : `https://www.instagram.com/ecodim_ccjv/`.
- TikTok : `https://www.tiktok.com/@ecodim_ccjv`.

---

## 7. Recommandations d'audit (à appliquer à l'implémentation)

1. **Logo** : générer une déclinaison optimisée (WebP ~30–50 Ko, et une version
   « sigle seul » sur fond clair pour l'en-tête) ; conserver le PNG source intact.
2. **Photos** : convertir en WebP/AVIF via `next/image`, recadrer/dupliquer pour les
   formats éditoriaux (paysage large, portrait), ne servir que les dimensions utiles.
3. **Performance** : self-hosting des polices (`next/font`), Server Components, lazy
   loading des médias, aucun autoplay vidéo.
4. **Schéma** : aligner `005` (suppression de `is_archived`) avant la phase backend.
