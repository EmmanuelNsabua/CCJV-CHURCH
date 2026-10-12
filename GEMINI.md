# CCJV-CHURCH — Guide de comportement et contrat opérationnel des agents IA

Ce document constitue le **contrat de comportement opérationnel permanent** pour tout agent d'intelligence artificielle ou développeur intervenant sur le dépôt **CCJV-CHURCH**. Il encadre les interventions, impose les priorités architecturales et garantit la non-régression du site public ainsi que l'intégrité du backend et du futur back-office.

---

## 1. Hiérarchie absolue des références

Lors de toute décision ou arbitrage, la priorité suivante s'applique sans exception :

1. **Sécurité, cryptographie et contraintes métier non négociables** :
   - Confidentialité absolue et chiffrement des intentions de prière ([`docs/030-specification_cryptographique_prieres.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/030-specification_cryptographique_prieres.md)).
   - Autorité exclusive du backend sur les règles de gestion et la matrice RBAC ([`docs/029-matrice_rbac.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/029-matrice_rbac.md)).
   - Zéro exposition de secrets privilégiés (`SERVICE_ROLE_KEY`) côté client.
   - Zéro accès direct à PostgreSQL depuis le frontend (passage obligatoire par l'API REST Express `/api/v1`).
2. **Spécifications et architecture validées du projet** :
   - Documents de conception et de modélisation du CCJV ([`docs/001`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/001-cahier_des_charges.md) à [`docs/036`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/036-perimetre_publications.md)).
   - Architecture backend et schéma SQL final ([`docs/024_architecture_logicielle_backend.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/024_architecture_logicielle_backend.md), [`docs/032-schema_sql_final.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/032-schema_sql_final.md)).
3. **Contrat du design system du back-office (Gelé en Phase 3)** :
   - [`docs/037-contrat-design-system-backoffice.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/037-contrat-design-system-backoffice.md).
4. **Conventions techniques du dépôt** :
   - Next.js 15 App Router, TypeScript strict, Tailwind CSS v4 (`@theme`), client HTTP [`src/lib/api/client.ts`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/frontend/src/lib/api/client.ts).
5. **Skills et bonnes pratiques génériques (`./skills/`)** :
   - Les guides et compétences installés dans `./skills/` sont des aides d'ingénierie et d'optimisation. Ils s'effacent systématiquement devant une règle ou un contrat explicite du projet CCJV.

---

## 2. Identité et périmètre du projet

- **Contexte :** Centre Chrétien Jésus ma Vie (CCJV) — Église vivante à Lubumbashi, RDC.
- **Rôle du Frontend :**
  - **Site public :** Vitrine d'accueil, informations cultuelles, découverte des départements, consultation des enseignements et médias, dépôt public de requêtes d'intercession.
  - **Back-Office (`/admin`) :** Interface d'administration sécurisée permettant aux pasteurs, administrateurs et responsables de départements de gérer les contenus, les événements, les médias et les requêtes, selon leurs permissions strictes.
- **Stack technologique vérifiée :**
  - *Frontend :* Next.js `15.5.26`, React `19.1.0`, TypeScript `5.7.0` (mode strict), Tailwind CSS `4.3.3`, PostCSS `8.5.28`, ESLint `9.17.0`.
  - *Backend :* Node.js / Express `5.2.1` (ES Modules), TypeScript `7.0.2`, Drizzle ORM `0.45.3`, PostgreSQL / Supabase `2.117.2`, Zod `4.6.5`, Pino `10.4.0`.
- **Frontières et isolation :**
  - Le site public réside dans `frontend/src/app/` (routes racines, `[slug]`, `qui-sommes-nous`, `communaute`, `organisation`, `vie-de-leglise`, `publications`).
  - Le back-office réside exclusivement dans le groupe de routes `frontend/src/app/(admin)/admin/` avec son propre layout hermétique (`AdminLayout`), sans hériter du Header, Footer ou menu plein écran du site public.

---

## 3. Règles de développement et qualité du code

1. **TypeScript strict :** Typage systématique et explicite de toutes les props, retours de fonctions, contrats d'API et états. Interdiction du type `any` non justifié.
2. **Server Components par défaut :** Tout composant Next.js est un Server Component par défaut. La directive `"use client"` est réservée aux composants nécessitant un état local (`useState`), des effets (`useEffect`), des références DOM (`useRef`) ou des gestionnaires d'événements.
3. **Approche additive et non-régression du site public :**
   - Interdiction de modifier les styles existants ou le comportement des composants partagés (`Button`, `Badge`, `EmptyState`) s'ils sont utilisés par le site public.
   - Les nouvelles fonctionnalités nécessaires au back-office (ex. `variant="danger"` sur `Button`, variantes sémantiques sur `Badge`) sont ajoutées par **extension additive strictly compatible**.
4. **Formulaires et tableaux sans surpoids :**
   - Utilisation exclusive des contrôles HTML natifs stylisés avec Tailwind CSS et encapsulés dans `FormField`.
   - Utilisation du composant tableau sur mesure `DataTable` (interdiction de TanStack Table pour le MVP).
   - Pas de bibliothèque de formulaire externe (`react-hook-form`, `formik`) sans décision explicite.
5. **Icônes :** Utilisation standardisée de `lucide-react` pour le back-office, avec `aria-label` obligatoire sur tout bouton sans texte visible.
6. **Accessibilité (WCAG 2.2 AA) :**
   - Règle `rounded-none` (0 px) par défaut, conformité des contrastes texte/fond (> 4.5:1).
   - Indicateur de focus visible obligatoire : `outline: 2px solid var(--color-ccjv-green)` avec `outline-offset: 2px`.
   - Respect strict de `prefers-reduced-motion`.
7. **Gestion des erreurs et feedback :**
   - Différencier les erreurs de validation (400/422), les erreurs d'authentification (401), les refus d'accès (403), et les erreurs serveur/réseau (500).
   - Utiliser `Toast` pour les notifications d'état et `ConfirmModal` pour toute opération destructive.

---

## 4. Règles de sécurité et gestion des autorisations

1. **Souveraineté du backend :** L'interface utilisateur masque ou désactive des boutons par commodité ergonomique, mais le backend reste le seul garant de l'autorisation d'exécuter une action.
2. **Authentification centralisée :**
   - Utilisation du mécanisme Supabase Auth retenu pour le projet.
   - Extension de [`src/lib/api/client.ts`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/frontend/src/lib/api/client.ts) avec `apiFetchOrThrow` pour injecter automatiquement l'en-tête `Authorization: Bearer <token>` depuis la session active.
   - Zéro passage de token en clair dans les URLs ou dans des logs.
3. **Protection des secrets :** La clé `SUPABASE_SERVICE_ROLE_KEY` est strictement réservée au backend et aux migrations. Elle ne doit jamais figurer dans le bundle frontend (`NEXT_PUBLIC_*`).
4. **Données sensibles :** Les intentions de prière et données privées ne doivent jamais être affichées à des utilisateurs non habilités ni exposées dans des outils de tracking.

---

## 5. Discipline de modification et méthode de travail

Avant toute intervention, l'agent doit suivre scrupuleusement ces 10 commandements :

1. **Lire avant d'éditer :** Examiner les documents de conception et les composants existants avant de créer un nouveau fichier.
2. **Délimiter le périmètre :** Se concentrer strictement sur la tâche demandée. Pas de refactorisation opportuniste de fichiers sans rapport.
3. **Non-régression :** Ne jamais supprimer ou modifier une route, un composant public ou une dépendance sans avoir mesuré son impact.
4. **Vérifier concrètement :** Exécuter les commandes de validation après chaque modification :
   - `npm run typecheck` (`tsc --noEmit`)
   - `npm run lint` (`eslint .`)
   - `npm run build` (lorsque requis)
5. **Honnêteté des rapports :** Ne jamais affirmer qu'un test ou qu'un build est réussi s'il n'a pas été réellement exécuté.
6. **Signaler les contradictions :** Si deux documents ou si le code et une spécification sont en désaccord, documenter explicitement le conflit sans inventer une résolution unilatérale.
7. **Demander clarification :** Si une exigence métier ou architecturale est ambiguë, solliciter l'arbitrage de l'utilisateur.

---

## 6. Gouvernance du projet et règle du GEL

Le projet CCJV respecte une méthodologie stricte en 6 phases :

| Phase | Intitulé | Description |
| :--- | :--- | :--- |
| **Phase 1** | **POURQUOI** | Cahier des charges et vision fonctionnelle |
| **Phase 2** | **QUOI** | Glossaire, spécifications fonctionnelles et techniques, MVP |
| **Phase 3** | **COMMENT** | Stack, UML, architecture logicielle, API, design system et roadmap |
| **Phase 4** | **IMPLÉMENTATION** | Développement du code applicatif par lots |
| **Phase 5** | **TEST ET LIVRAISON** | Validation fonctionnelle, recette, tests d'intégration et déploiement |
| **Phase 6** | **ITÉRATION** | Évolutions futures et backlog |

> **Règle du GEL :**  
> À la fin de la **Phase 3**, le périmètre fonctionnel, la stack, le glossaire, l'architecture et le contrat de design system ([`docs/037`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/037-contrat-design-system-backoffice.md)) sont **GELÉS**.  
> Toute demande ultérieure modifiant la structure ou introduisant un nouveau périmètre doit être enregistrée dans le backlog de la **Phase 6**, sans perturber l'implémentation de la Phase 4. Les corrections nécessaires pour rendre le code conforme aux contrats gelés restent des tâches normales d'implémentation.

---

## 7. Compétences et Skills d'ingénierie (`./skills/`)

### 7.1. Localisation et mode de consultation
Les compétences d'ingénierie sont installées localement dans le dossier :
👉 [`./skills/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/) (à la racine du dépôt).

> **Important — Mécanisme de consultation dans l'IDE :**  
> Les skills situées dans `./skills/` constituent des guides de référence locaux. Elles ne sont pas injectées automatiquement dans le contexte global de l'agent.  
> L'agent **doit lire explicitement** le fichier `SKILL.md` ou les règles associées via les outils de lecture de fichiers (`view_file`) avant d'entamer une tâche relevant de leur domaine.

### 7.2. Matrice d'utilisation des compétences par tâche

| Tâche / Besoin | Skill à consulter | Fichier d'entrée principal |
| :--- | :--- | :--- |
| **Composants React 19, Server/Client, performance, suppression des waterfalls** | `vercel-react-best-practices` | [`skills/vercel-react-best-practices/SKILL.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/vercel-react-best-practices/SKILL.md) |
| **Accessibilité WCAG 2.2 AA, états de focus, formulaires natifs, navigation clavier** | `web-design-guidelines` | [`skills/web-design-guidelines/SKILL.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/web-design-guidelines/SKILL.md) |
| **Composition visuelle sobre, alignement, contraste, typographie, qualité UI** | `frontend-design` | [`skills/frontend-design/SKILL.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/frontend-design/SKILL.md) |
| **Patterns de composition de composants modulaires et extensibles** | `composition-patterns` | [`skills/composition-patterns/SKILL.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/composition-patterns/SKILL.md) |
| **Tests fonctionnels, validation de formulaires et composants** | `webapp-testing` | [`skills/webapp-testing/SKILL.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/webapp-testing/SKILL.md) |

### 7.3. Primauté absolue du projet
Si une recommandation générique issue d'une skill (par exemple l'utilisation d'une bibliothèque tierce, d'un framework CSS externe ou d'un composant tout fait) entre en conflit avec une décision gelée du CCJV (ex. `docs/037`, absence de TanStack Table, angles stricts `rounded-none`), **les règles du projet CCJV prévalent impérativement**.
