# CCJV-CHURCH — Manifeste de provenance et gouvernance des Skills

Ce document consigne la provenance officielle, la licence, les versions de référence et les règles d'adaptation de chaque compétence (*skill*) installée dans le dossier [`./skills/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/) du projet CCJV-CHURCH.

---

## 1. Principes de gouvernance et de primauté

1. **Règle de subordination :** Les compétences contenues dans ce répertoire sont des aides d'ingénierie et des guides de bonnes pratiques. Elles ne constituent en aucun cas une autorité supérieure aux règles du projet CCJV. En cas de contradiction, les documents de référence CCJV ([`docs/037`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/037-contrat-design-system-backoffice.md), [`docs/029`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/029-matrice_rbac.md), [`docs/030`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/030-specification_cryptographique_prieres.md), [`GEMINI.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/GEMINI.md)) prévalent impérativement.
2. **Mode de consultation explicite :** Dans l'environnement Antigravity, ces compétences locales sont des fichiers de référence sur disque. L'agent doit les consulter via les outils de lecture de fichiers (`view_file`) avant toute tâche complexe relevant de leur périmètre.

---

## 2. Inventaire des compétences installées

### 2.1. `vercel-react-best-practices`
- **Chemin local :** [`skills/vercel-react-best-practices/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/vercel-react-best-practices/)
- **Dépôt source :** `https://github.com/vercel-labs/agent-skills` (package `react-best-practices`)
- **Auteur :** Vercel Engineering
- **Licence :** MIT
- **Rôle dans CCJV :** Guide complet pour l'optimisation des performances React 19 et Next.js 15 (élimination des waterfalls asynchrones, Server vs Client components, réduction du bundle, mémoïsation ciblée, hydratation sans scintillement).
- **Adaptation CCJV :** Strictement appliqué au code Next.js 15 App Router du projet. La règle de non-prolifération des composants et de conservation des Server Components par défaut s'aligne parfaitement sur ce guide.

### 2.2. `web-design-guidelines`
- **Chemin local :** [`skills/web-design-guidelines/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/web-design-guidelines/)
- **Dépôt source :** `https://github.com/vercel-labs/agent-skills` (package `web-design-guidelines` / `web-interface-guidelines`)
- **Auteur :** Vercel Design & Engineering
- **Licence :** MIT
- **Rôle dans CCJV :** Audit et conformité des interactions UI, accessibilité WCAG 2.2 AA, gestion des états de focus visible (`focus-visible`), formulaires natifs accessibles (`aria-describedby`, `aria-invalid`), et robustesse du responsive.
- **Adaptation CCJV :** Les règles de focus doivent impérativement utiliser le token identitaire `--color-ccjv-green` (`outline: 2px solid var(--color-ccjv-green)`).

### 2.3. `composition-patterns`
- **Chemin local :** [`skills/composition-patterns/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/composition-patterns/)
- **Dépôt source :** `https://github.com/vercel-labs/agent-skills` (package `composition-patterns`)
- **Auteur :** Vercel Engineering
- **Licence :** MIT
- **Rôle dans CCJV :** Modèles d'architecture de composants React 19 évolutifs, évitant l'inflation des props booléennes par la composition (composants composés, injection de dépendance d'état, variantes explicites).
- **Adaptation CCJV :** Utilisé pour la conception modulaire des composants d'administration (`DataTable`, `FormField`, `AdminSidebar`).

### 2.4. `frontend-design`
- **Chemin local :** [`skills/frontend-design/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/frontend-design/)
- **Dépôt source :** `https://github.com/anthropics/skills` (package `frontend-design`)
- **Auteur :** Anthropic
- **Licence :** Source-Available / Anthropic Skills License
- **Rôle dans CCJV :** Guide pour créer des interfaces épurées, typographiquement soignées, sans aspect de "template générique" ou de composants AI stéréotypés.
- **Adaptation CCJV :** Doit respecter scrupuleusement la palette CCJV et la règle des angles droits (`rounded-none`).

### 2.5. `webapp-testing`
- **Chemin local :** [`skills/webapp-testing/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/webapp-testing/)
- **Dépôt source :** `https://github.com/anthropics/skills` (package `webapp-testing`)
- **Auteur :** Anthropic
- **Licence :** Source-Available / Anthropic Skills License
- **Rôle dans CCJV :** Méthodologie et scripts de vérification automatisée de l'interface et du rendu dynamique des pages.
- **Adaptation CCJV :** Les tests doivent s'exécuter localement sans altérer les données de la base de données ni créer de fausses données en production.

### 2.6. `impeccable`
- **Chemin local :** [`skills/impeccable/`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/skills/impeccable/)
- **Dépôt source :** `https://github.com/pbakaus/impeccable`
- **Auteur :** Paul Bakaus (Renaissance Geek)
- **Licence :** MIT
- **Rôle dans CCJV :** Détection et élimination des anti-patterns visuels génériques propres aux IA (« AI slop » : emboîtement superflu de cartes, typographie uniforme sans voix, dégradés clichés, textes vagues).
- **Adaptation CCJV :** Subordonné aux tokens CCJV, aux angles droits stricts (`rounded-none`, 0px) et à la ligne éditoriale ecclésiale en français.

---

## 3. Compétences évaluées et écartées

| Compétence évaluée | Dépôt source | Motif de non-rétention pour CCJV |
| :--- | :--- | :--- |
| `vercel-cli-with-tokens` | Vercel Labs | Inutile : aucun déploiement CLI automatisé requis pendant la phase de développement local. |
| `deploy-to-vercel` | Vercel Labs | Hors périmètre : les pipelines CI/CD sont déjà gérés au niveau du dépôt. |
| `react-native-skills` | Vercel Labs | Non pertinent : le projet CCJV est une application web Next.js pure, sans cible React Native. |
| `writing-guidelines` | Vercel Labs | Redondant : l'architecture éditoriale et la ligne éditoriale CCJV sont déjà documentées dans [`docs/015-architecture_editoriale.md`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/docs/015-architecture_editoriale.md). |
| `mcp-builder` | Anthropic | Non pertinent : développement d'applications web, pas de serveurs Model Context Protocol. |
| `docx`, `pdf`, `pptx`, `xlsx` | Anthropic | Non pertinent : manipulation de formats bureautiques lourds non requis pour le back-office MVP. |
| `canvas-design`, `algorithmic-art` | Anthropic | Non pertinent : création artistique algorithmique sans rapport avec un back-office d'administration. |
| `theme-factory` | Anthropic | Inapplicable : le thème et les tokens CCJV sont strictement figés par le design system gelé. |
