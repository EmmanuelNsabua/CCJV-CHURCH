# Rapport d'Audit & Inventaire du Balisage Éditorial — CCJV

**Date :** 14 Novembre 2026  
**Auteur :** Agent IA Antigravity (Google DeepMind)  
**Projet :** Centre Chrétien Jésus ma Vie (CCJV-CHURCH)  
**Référence :** Architecture Espace Éditorial & Back-Office (Annexe A)  

---

## 1. Introduction et Objectifs de l'Audit

Cet audit prépare la mise en place de **l'Éditeur Visuel de Pages** au sein du Back-Office CCJV. Conformément aux directives de l'Annexe A du document d'architecture éditoriale, l'objectif a consisté à :
1. **Cartographier l'intégralité des routes publiques** du site vitrine CCJV.
2. **Identifier et isoler les sections éditables** (textes, visuels, accroches, boutons) des **zones dynamiques** (alimentées automatiquement par l'API REST Express `/api/v1` et la base PostgreSQL).
3. **Appliquer un balisage HTML non-destructif** basé sur des attributs `data-*` stricts, sans aucune altération du style, de la typographie, des classes Tailwind CSS v4, ni du comportement fonctionnel.
4. **Analyser la sécurité et le contrôle d'accès** pour garantir que seul le rôle `SUPER_ADMIN` puisse configurer et publier les modifications de mise en page.

---

## 2. Cartographie Exhaustive des Routes Publiques

L'arborescence publique comprend **18 routes statiques/éditoriales** et **6 gabarits de fiches détaillées dynamiques** :

| # | Route Publique | Fichier Source (Next.js 15 App Router) | Rôle & Contenu |
|---|----------------|----------------------------------------|----------------|
| 1 | `/` | `frontend/src/app/page.tsx` & `features/pages/Hero.tsx` | Page d'accueil, Hero carrousel, Parole du jour, Mot du Pasteur, Ecodim, Départements, Agenda |
| 2 | `/qui-sommes-nous` | `frontend/src/app/qui-sommes-nous/page.tsx` | Histoire de l'église, vision pastorale, convictions doctrinales, jalons historiques |
| 3 | `/communaute` | `frontend/src/app/communaute/page.tsx` | Vie fraternelle, dépôt de prières chiffrées, témoignages de foi, intégration nouveaux |
| 4 | `/ecodim` | `frontend/src/app/ecodim/page.tsx` | Ministère des enfants, pédagogie chrétienne, tranches d'âge, guide familles |
| 5 | `/organisation` | `frontend/src/app/organisation/page.tsx` | Équipe pastorale, collège des responsables, catalogue complet des ministères |
| 6 | `/vie-de-leglise/ou-nous-trouver` | `frontend/src/app/vie-de-leglise/ou-nous-trouver/page.tsx` | Informations d'accès, horaires cultes (08h30-11h30), accueil première visite |
| 7 | `/vie-de-leglise/faire-un-don` | `frontend/src/app/vie-de-leglise/faire-un-don/page.tsx` | Vision biblique de la générosité, domaines d'impact, canaux Mobile Money/bancaires |
| 8 | `/vie-de-leglise/evenements` | `frontend/src/app/vie-de-leglise/evenements/page.tsx` | Agenda complet des rassemblements, prochain culte, pôles d'expérience, archives |
| 9 | `/publications/actualites` | `frontend/src/app/publications/actualites/page.tsx` | Actualités récentes, slider 60/40 coulissant Presse/Ecodim, grille filtrée 3xX |
| 10 | `/publications/mediatheque` | `frontend/src/app/publications/mediatheque/page.tsx` | Galerie photographique et vidéo de la communauté avec visionneuse plein écran |
| 11 | `/publications/enseignements` | `frontend/src/app/publications/enseignements/page.tsx` | Catalogue des prédications dominicales, enseignements vidéo et audio |
| 12 | `/publications/ressources` | `frontend/src/app/publications/ressources/page.tsx` | Guides d'étude biblique, plans de prédication, fiches PDF à télécharger |
| 13 | `/newsletter` | `frontend/src/app/newsletter/page.tsx` | Inscription à la lettre pastorale, engagements déontologiques, verset |
| 14 | `/recherche` | `frontend/src/app/recherche/page.tsx` | Moteur de recherche unifié multi-ressources |
| 15 | `/mentions-legales` | `frontend/src/components/shared/LegalPage.tsx` | Mentions obligatoires, éditeur, hébergement |
| 16 | `/confidentialite` | `frontend/src/components/shared/LegalPage.tsx` | Politique de confidentialité et sécurité des prières |
| 17 | `/conditions` | `frontend/src/components/shared/LegalPage.tsx` | Conditions générales d'utilisation du site |
| 18 | `/accessibilite` | `frontend/src/components/shared/LegalPage.tsx` | Déclaration de conformité WCAG 2.2 AA |
| — | `/[slug]` | `frontend/src/app/[slug]/page.tsx` | Fiche détaillée d'un département (dynamique) |
| — | `/publications/[slug]` | `frontend/src/app/publications/[slug]/page.tsx` | Fiche détaillée publication générique (dynamique) |
| — | `/publications/actualites/[slug]` | `frontend/src/app/publications/actualites/[slug]/page.tsx` | Fiche détaillée d'une actualité (dynamique) |
| — | `/publications/enseignements/[slug]` | `frontend/src/app/publications/enseignements/[slug]/page.tsx` | Fiche détaillée d'un enseignement / prédication (dynamique) |
| — | `/publications/ressources/[slug]` | `frontend/src/app/publications/ressources/[slug]/page.tsx` | Fiche détaillée d'un guide / document PDF (dynamique) |
| — | `/vie-de-leglise/evenements/[slug]` | `frontend/src/app/vie-de-leglise/evenements/[slug]/page.tsx` | Fiche détaillée d'un événement (dynamique) |

---

## 3. Volumétrie des Sections et Répartition

Sur l'ensemble des 18 pages publiques auditées :
- **Nombre total de sections répertoriées :** 78 sections.
- **Sections Éditables (`data-editable="true"` au niveau des champs) :** 51 sections (65.4%).
  - Textes d'accroche, grands titres, sous-titres, chapeaux éditoriaux.
  - Visuels de fond, photos d'illustration des héros, citations pastorales.
  - Piliers de foi, valeurs, approches pédagogiques, guides des familles.
- **Sections Dynamiques (`data-editable="false"` avec `data-dynamic-source`) :** 27 sections (34.6%).
  - Flux d'événements à venir et archives (`events:upcoming`, `events:lead`, `events:archived`).
  - Flux des publications d'actualité (`publications:featured`, `publications:archive`).
  - Grille des départements et liste des leaders (`departments:all`, `leaders:all`).
  - Dernier enseignement multimédia et grille des prédications (`teachings:latest`, `teachings:archive`).
  - Ressources documentaires PDF (`resources:featured`, `resources:archive`).
  - Flux des témoignages modérés et approuvés (`testimonies:approved`).
  - Versets du jour et clôtures liturgiques (`scriptures:parole`, `scriptures:envoi`).
  - Formulaires interactifs sensibles (`system:prayer_requests`, `system:testimonies`, `system:newsletter`).

---

## 4. Éléments Transverses Non Marqués

Certains composants transverses de navigation et de structure globale ont été délibérément **exclus du balisage éditorial de section** pour préserver la cohérence du site :
1. **Header Principal (`src/components/layout/Header.tsx`) :**
   - Composant flottant avec gestion dynamique de la transparence/opacité au scroll.
   - Contient le logo institutionnel, le déclencheur de recherche globale et le bouton de menu plein écran.
   - *Raison de non-marquage :* Sa configuration relève des paramètres globaux du site (`/admin/settings`) et non de l'éditeur d'une page spécifique.
2. **Footer Global (`src/components/layout/Footer.tsx`) :**
   - Contient les horaires statutaires du culte dominical (08h30 - 11h30), les coordonnées de l'église à Lubumbashi, les liens légaux et les réseaux sociaux.
   - *Raison de non-marquage :* Géré de manière centralisée par la table `site_settings`.
3. **Modale de Recherche (`src/components/layout/SearchModal.tsx`) :**
   - Overlay global déclenché par raccourci clavier `⌘K` / `Ctrl+K`.
4. **Rideau d'Introduction d'Accueil (`src/features/pages/HomeIntroCurtain.tsx`) :**
   - Animation de bienvenue avec passage fluide vers la hero section.

---

## 5. Cas à Trancher (Arbitrages pour l'Éditeur Visuel)

Lors du balisage, plusieurs particularités architecturales et typographiques ont été identifiées. Elles nécessitent un arbitrage lors du développement de l'interface d'édition :

### 5.1. Titres Multi-Balises et Mots Stylisés (Italiques & Spans Colorés)
- **Constat :** Dans plusieurs titres majeurs (ex. Hero de la page Événements, citation « Nous nous retrouvons »), le texte contient des retours à la ligne explicites (`<br />`) ou des mots enveloppés dans des balises `<span className="italic text-ccjv-cream">`.
- **Cas rencontré :**
  ```html
  <h1>
    Des temps pour se retrouver, <span class="italic text-ccjv-cream">célébrer,</span> apprendre et grandir ensemble.
  </h1>
  ```
- **Option A (Recommandée) :** Traiter le champ comme du texte riche simplifié (Inline WYSIWYG) acceptant les balises `<em>`, `<br>` et une classe de couleur d'accent prédéfinie.
- **Option B :** Découper le titre en 3 sous-champs : `titre_debut`, `mot_accentue`, `titre_fin`. (Plus rigide mais évite toute injection HTML).

### 5.2. Versets Bibliques Couplés (Texte + Référence)
- **Constat :** Les composants `VerseSection` attendent systématiquement deux propriétés indissociables : `text` et `reference` (ex. Matthieu 18:20).
- **Préconisation :** Créer dans l'éditeur visuel un widget composé `VerseBlock` regroupant obligatoirement la citation et le livre/chapitre.

### 5.3. Pôles d'Expérience et Listes de Cartes Multiples
- **Constat :** Sur `/vie-de-leglise/evenements`, la section `experience_poles` présente 4 cartes composées (image, tag en majuscules, titre, description, lien CTA).
- **Préconisation :** Utiliser un schéma de type tableau d'objets (`items: Array<{ image, tag, title, description, link }>`) plafonné à 4 éléments pour garantir la grille responsive Tailwind.

---

## 6. Analyse de Sécurité et Contrôle d'Accès : Rôle SUPER_ADMIN (Étape 6)

### 6.1. Modèle de Données Existant (PostgreSQL / Drizzle)
Dans le schéma de base de données (`backend/src/infrastructure/database/schema/admin.sql`), les rôles sont définis par l'énumération :
```sql
CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER');
```
Chaque administrateur possède un profil `admin_profiles` lié à `auth.users` :
- `SUPER_ADMIN` : Droits absolus sur la plateforme (paramètres généraux, utilisateurs administrateurs, audit logs, configuration éditoriale).
- `ADMIN` : Gestion opérationnelle des contenus transversaux (agenda, publications globales, enseignements, modération).
- `DEPARTMENT_MANAGER` : Restreint strictement au périmètre de son département (ex. Ecodim ou Presse).

### 6.2. Middlewares et Politiques de Sécurité Existantes
Le backend Express dispose d'une infrastructure robuste :
1. `requireAuthenticatedAdmin(authDeps)` : Valide le token JWT Supabase et charge le profil dans `req.admin`.
2. `authorize(Policy, Action)` : Évalue les permissions selon les matrices RBAC.
   - Exemple concret : `SettingPolicy.canUpdate(actor)` exige `actor.role === 'SUPER_ADMIN'`.
   - Exemple concret : `UserPolicy.canManageAdmins(actor)` exige `actor.role === 'SUPER_ADMIN'`.

### 6.3. Recommandations pour l'API de l'Éditeur Visuel de Pages
Pour l'intégration de la Phase 4 (Éditeur de pages) :
1. **Création d'une table dédiée `page_layouts` / `page_sections` :**
   ```sql
   CREATE TABLE page_sections (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     page_route VARCHAR(255) NOT NULL,
     section_id VARCHAR(100) NOT NULL,
     section_type VARCHAR(100) NOT NULL,
     variant VARCHAR(100) DEFAULT 'default',
     content JSONB NOT NULL DEFAULT '{}'::jsonb,
     is_active BOOLEAN NOT NULL DEFAULT true,
     sort_order INTEGER NOT NULL DEFAULT 0,
     updated_by UUID REFERENCES admin_profiles(id),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     CONSTRAINT uq_page_section UNIQUE (page_route, section_id)
   );
   ```
2. **Politique d'autorisation `PageEditorPolicy` :**
   - **Lecture de brouillon / Prévisualisation :** Accessible à `SUPER_ADMIN` et `ADMIN`.
   - **Édition et Publication en production :** Réservée exclusivement au rôle `SUPER_ADMIN`.
   - Les `DEPARTMENT_MANAGER` n'ont aucun accès aux routes de mise en page globale.
3. **Audit Log Obligatoire :**
   - Toute modification de contenu ou de structure de page doit émettre une entrée dans `audit_logs` avec l'ancien et le nouvel état JSON (`diff`), conformément à la règle de gouvernance CCJV.

---

## 7. Inventaire Structuré des Données

L'inventaire complet des 78 sections et de leurs sélecteurs CSS est consigné au format JSON machine-readable dans :  
👉 [`docs/editor-inventory.json`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/editor-inventory.json).

---

## 8. Synthèse et Validation

- **Non-régression :** Vérifiée avec succès par compilation TypeScript (`tsc --noEmit`) et linting (`eslint .`).
- **Rendu Visuel :** Strictement identique à la version validée par l'utilisateur.
- **État du socle :** Prêt pour la phase d'implémentation de l'interface visuelle du back-office.
