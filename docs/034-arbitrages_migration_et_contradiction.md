# 034 — Arbitrages définitifs de migration et point de contradiction

> **Objet :** enregistrer les 12 arbitrages du commanditaire débloquant la
> migration, et **signaler une contradiction interne** qui doit être levée avant
> d'écrire la migration (`docs/025` §20 : ne jamais arbitrer silencieusement).
> **Statut :** les 11 premiers arbitrages sont exploitables tels quels. Le
> douzième point — la portée de la règle des 3 — est **bloquant**.

---

# 1. Les onze arbitrages exploitables

| # | Question | Décision arrêtée |
| --- | --- | --- |
| **Q-S2** | Les 2 événements sans département | → **Affaires Sociales** (`Culte spécial — Action de grâce`, `Journée communautaire`). `department_id` reste `NOT NULL`. |
| **Q-NT1** | `Ecodume` et `Enfants/Ecodim` | **Une seule ligne** : `Ecodume`. `Enfants/Ecodim` est une ancienne référence, pas un département. |
| **Q-NT2** | Slug canonique | **`ecodume`**. L'ancien `enfants-ecodim` ne devient pas le slug canonique ; une redirection peut préserver les liens historiques. |
| **Q-NT3** | Identité du `SUPER_ADMIN` | **Compte nominatif dédié**, distinct du compte `ADMIN` de production. Aucune élévation du compte existant. L'identité humaine est **à fournir par l'organisation avant le bootstrap** — non déductible. |
| **Q-NT10** | `testimonies.status` des témoignages existants | **`PUBLISHED`** — préserver le comportement public actuel. Aucun changement éditorial silencieux. |
| **Q-S5** | Prières existantes | **Aucun export.** Vérifier `COUNT(*) = 0`, journaliser la vérification, **puis** détruire l'ancien mécanisme. **Si le compte n'est plus 0 au moment de l'exécution, la migration s'arrête.** |
| **Q-18** | Audit des prières (`D-03` ⇄ `D-10`) | **Audit des prières isolé**, accessible aux seuls administrateurs autorisés à lire les prières. Le `SUPER_ADMIN` n'y a **pas** accès. Aucune donnée de prière dans les journaux applicatifs généraux. Exception explicite au principe d'audit complet. |
| **Q-06 / Q-S6** | Qui édite les capacités départementales (`D-25`) | **Seul le `SUPER_ADMIN`.** Ni l'`ADMIN` ni le `DEPARTMENT_MANAGER`. Le responsable **consomme** ses capacités, il ne les définit pas. |
| **Q1 / Q-31** | Détention du mécanisme de secours | **Partage de secret à seuil `2-sur-3`**, détenu par **trois personnes désignées hors du modèle d'autorisation applicatif**. Ni le `SUPER_ADMIN`, ni un `ADMIN` unique, ni le backend, ni une variable d'environnement. |
| **Q-NT8** | Rôle PostgreSQL applicatif | **`ccjv_app` réel** : `LOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS`, **non propriétaire** des tables. Rôle **`ccjv_owner` séparé, `NOLOGIN`**, pour la propriété et les migrations. Les privilèges sont **vérifiés après migration**, jamais supposés : un `REVOKE` sur un rôle inexistant est un no-op silencieux, et un privilège peut provenir de plusieurs chemins de membership. |
| **Q-S1** | Rattachement des 10 publications | **Rattacher chaque publication selon son département réel**, aucune redistribution artificielle destinée à remplir des quotas. Le mapping `legacy_publication_id → department_id` doit être établi à partir du **contenu réel** des publications. |

## Ce que Q-S1 exige concrètement

Le commanditaire refuse explicitement de fabriquer une répartition `4/3/3`. Le
développeur doit donc :

1. **lire les 10 publications** telles qu'elles existent en base ;
2. déterminer pour chacune le département correspondant à sa **nature réelle** ;
3. produire une table de mapping explicite, révisable et journalisée ;
4. appliquer ensuite la règle de plafond.

`3 / 3 / 3` **n'est pas une cible de répartition** : c'est uniquement un plafond.

---

# 2. CONTRADICTION À LEVER — portée de la règle des 3

## 2.1 Les deux énoncés, tous deux du même message

**Énoncé A — en tête de message, section « Q-P3 » :**

> « **Décision : `3 PUBLISHED maximum par département`, sans distinction de
> type.** […] **Q-P3 = PAR DÉPARTEMENT.** »

**Énoncé B — en conclusion du même message :**

> « En gros, Q-S1 dit : les publications ne doivent pas être traitées selon les
> départements, mais selon leur **ordre de publication globale**. Ainsi, que ce
> soit une publication effectuée par un tel ou tel autre département,
> **globalement**, on l'archive lorsqu'elle n'a plus sa place dans le tableau des
> publications en premiers rangs. »

Ces deux énoncés **ne peuvent pas coexister** : l'un découpe le quota par
département, l'autre le traite globalement tous départements confondus.

## 2.2 Conséquences divergentes, chiffrées

| | **Lecture A — par département** | **Lecture B — globale** |
| --- | --- | --- |
| Plafond | 3 par département | 3 au total, tous départements confondus |
| Maximum `PUBLISHED` sur le site | 3 × 3 départements = **9** | **3** |
| Avec les 10 publications existantes | **≥ 1 archivage** (9 places pour 10) | **≥ 7 archivages** |
| Clé de l'index unique partiel | `(department_id, published_slot)` | `(published_slot)` |
| Sens métier | chaque département garde ses 3 publications courantes | le site n'affiche que ses 3 publications les plus récentes, tous départements confondus |

La différence est **déterminante** : elle change le nombre d'archivages
irréversibles (1 contre 7), la structure de la contrainte en base, et la
visibilité publique du site.

## 2.3 Éléments versés au débat

**En faveur de la lecture A :**
- `docs/021` fixe le seuil à **3 par département** ;
- `docs/028` D-18 énonce *« maximum 3 `PUBLISHED` par département »* ;
- `docs/029` (matrice RBAC) et `docs/032` (schéma SQL) ont été construits sur
  cette base ;
- l'énoncé A est le plus explicite et le plus récent dans l'ordre du message.

**En faveur de la lecture B :**
- elle est formulée **en conclusion**, au moment où le commanditaire traite
  précisément le cas des 10 publications — donc possiblement comme une
  **clarification tardive** ;
- elle évite de traiter les publications « selon les départements », ce qui
  semble être une intention de fond ;
- l'expression « tableau des publications en premiers rangs » évoque une
  **hiérarchie globale**, pas un plafond par entité ;
- elle réduit la charge de décision : plus besoin de déterminer le département
  réel des 10 publications pour la règle de plafond (mais Q-S1 reste nécessaire
  pour le rattachement lui-même).

## 2.4 Question à trancher

> **La règle des 3 est-elle un plafond PAR DÉPARTEMENT (9 publications visibles
> au total) ou GLOBAL (3 publications visibles sur tout le site) ?**

Une phrase suffit. Aucune migration ne peut être écrite avant cette réponse :
elle détermine le nombre d'archivages irréversibles et la définition de la
contrainte de base.

---

# 3. Effet de ces arbitrages sur les documents existants

| Document | Impact |
| --- | --- |
| `028` | D-18 (règle des 3) → **à réviser selon l'arbitrage §2**. D-12 (récupération) → précisée : `2-sur-3`. D-25 (capacités) → précisée : `SUPER_ADMIN` seul. |
| `029` | Q-06 / Q-S6 **fermées**. Q-18 **fermée** (audit isolé). Q-31 **fermée** (`2-sur-3`). |
| `030` | Q1 **fermée** (`2-sur-3`, détenteurs hors application). |
| `031` | Inchangé. |
| `032` | Index unique partiel → **à adapter selon l'arbitrage §2**. |
| `033` | Étapes `É24` (archivage rétroactif) et `É28` → **à recalculer** : le nombre d'archivages passe de « ≥ 1 » à « ≥ 7 » en lecture B. Q-S2, Q-NT1, Q-NT2, Q-NT10, Q-S5, Q-NT8 **fermées**. |

---

# 4. Ce qui reste

**Une seule question bloquante :** la portée de la règle des 3 (§2.4).

**Une décision opérationnelle :** l'identité du compte `SUPER_ADMIN` — à fournir
par l'organisation au moment du bootstrap, non à inventer.

**Une donnée à produire par le développeur :** le mapping des 10 publications
vers leur département réel (Q-S1), établi à partir de leur contenu.

Tout le reste est arbitré. **Le Lot 0 puis le Lot 1 peuvent démarrer** dès que
§2.4 est tranchée.
