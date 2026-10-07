# Questions de conception du Back-Office — CCJV

**Objet :** consigner les décisions qui ne peuvent pas être prises à partir du code ou de la documentation, afin qu'elles soient tranchées par CCJV avant la conception du modèle éditorial, du modèle de données et du RBAC.
**Règle appliquée :** **aucune hypothèse n'est transformée en décision.** Là où la documentation elle-même déclare une question ouverte, elle est citée verbatim avec sa ligne. Là où le code révèle un conflit non documenté, la divergence est décrite sans être arbitrée.
**Compagnon de :** `audit_architecture_editoriale_frontend.md`, `frontend_content_matrix.md`, `frontend_component_catalog.md`.

---

## Légende

| Priorité | Critère |
|---|---|
| **BLOQUANT** | Une décision est **nécessaire avant** de concevoir le modèle. Sans elle, tout schéma Zod, toute table ou toute politique RLS écrit serait à refaire. |
| **IMPORTANT** | La décision influence fortement l'UX ou l'architecture, mais la conception peut démarrer sur les autres volets. |
| **MINEUR** | Peut être reporté après le gel de la Phase 3, voire après la mise en service. |

**Statut de départ de chaque question :** toutes sont **OUVERTE**. Aucune n'a été tranchée par cet audit.

---

# BLOQUANT

## B1 — Quelle est la liste officielle des `page_key` (et qui peut éditer quelle page) ?

**Pourquoi bloquant.** `static_pages.content` est un `jsonb` **validé par un schéma Zod par `page_key`** (`schema/editorial.ts:24-31` : « *Le back-office édite des champs nommés, jamais du HTML… Une `page_key` inconnue est rejetée à l'écriture* »). La liste des clés et les schémas associés sont donc **structurellement nécessaires** avant la première écriture. C'est aussi ce qui détermine la granularité des permissions (« qui peut éditer la page Accueil ? »).

**Le problème.** **Quatre listes divergent** et **aucune** ne correspond aux routes réellement servies :

| Source | Liste déclarée |
|---|---|
| `frontend/src/types/index.ts:75` | `ACCUEIL`, `QUI_SOMMES_NOUS`, **`COMMUNAUTE`**, `CONTACT` |
| `docs/006` | `ACCUEIL`, `QUI_SOMMES_NOUS`, `ORGANISATION`, `CONTACT` |
| `docs/011`, `docs/017` | `…`, `COMMUNAUTE`, `CONTACT` |
| **Code réel (21 routes)** | `/`, `/qui-sommes-nous`, `/organisation`, `/vie-de-leglise/evenements`, `/faire-un-don`, `/ou-nous-trouver`, 4 × `/communaute/*`, `/recherche`, 4 × légal… |

**Fait vérifié :** `/communaute` et `/contact` **ne sont pas des routes** (aucun fichier), tandis que `/organisation` — qui porte 25,9 Ko de prose — **n'a aucune clé**.

**Recensement par « page contenant de la prose en dur » : ~16 clés nécessaires**, contre 4 déclarées. Liste proposée (à valider) : `ACCUEIL`, `QUI_SOMMES_NOUS`, `ORGANISATION`, `EVENEMENTS`, `FAIRE_UN_DON`, `OU_NOUS_TROUVER`, `GROUPES_DE_MAISON`, `PARCOURS_NOUVEAU`, `PRIERE`, `TEMOIGNAGES`, `RECHERCHE`, `RESSOURCES`, + 4 clés légales (ou un modèle légal partagé).

**Décisions requises :**
1. La liste **définitive** des `page_key`.
2. Un `page_key` par page, ou des clés partagées (4 pages légales) ?
3. Un `page_key` sans page (contenu préparé à l'avance) est-il autorisé ?
4. L'édition d'une page est-elle réservée à l'Admin, ou un Responsable de département peut-il éditer la page de son périmètre ?

**Source :** `frontend/src/types/index.ts:75`, `docs/006`, `docs/011`, `docs/017`, code des 21 routes. — **CONFIRMÉ** (divergence établie) / décision **À DÉCIDER**.

---

## B2 — Quel est le rôle de département, et quelle est la forme exacte du scope ?

**Pourquoi bloquant.** Le RBAC conditionne le schéma (`department_id` sur `admin_profiles`), les politiques RLS, et la forme de chaque requête API. `docs/020:238-240` est catégorique : « *Cette restriction doit être appliquée **dans le backend**… Masquer un bouton dans le frontend ne constitue pas une protection suffisante.* »

**Trois noms concurrents pour le même rôle :**

| Source | Nom littéral |
|---|---|
| `docs/018` | `ROLE_DEPARTMENT_EDITOR` |
| `docs/020:781` | `DEPARTMENT_MANAGER` |
| `docs/020:171-176`, `docs/020:716-724` | « Responsable de département » |

**Ce que dit le code :** `adminRoleEnum = pgEnum("admin_role", ["ROLE_ADMIN"])` — **une seule valeur** (`schema/enums.ts:16`). `admin_profiles` porte `role`, `isActive`, mais **aucune colonne `department_id`, aucun `scope`**. La fabrique `requireRole(...)` existe et son commentaire annonce l'intention (`middlewares/auth.ts:90-92`) mais **aucune table de permissions ni aucun test de permission n'existe** : le contrôle est un simple `roles.includes(req.admin.role)`.

**Décisions requises :**
1. **Nom définitif** de l'enum et de ses valeurs.
2. **Un ou plusieurs niveaux** de rôle de département ? (un seul, ou éditeur + validateur ?)
3. Un utilisateur peut-il être responsable de **plusieurs** départements ? (une colonne `department_id` simple, ou une table `admin_department_scopes` ?)
4. Le modèle `ROLE + PERMISSION + SCOPE` de `docs/020` §20 est-il retenu intégralement (table de permissions), ou une simplification `ROLE + SCOPE` suffit-elle en V1 ?
5. Les permissions nommées de `docs/020:785-792` (`publication.create`, `publication.read`, `publication.update`, `event.create`, `event.update`, `department.update`, `media.manage`) sont-elles la liste **définitive** ? En manque-t-il (`publication.delete`, `publication.publish`, `media.delete`, `event.delete`) ?
6. `requireSelf` mentionné dans `docs/018` doit-il exister ?

**Source :** `schema/enums.ts:16`, `schema/admin.ts`, `middlewares/auth.ts:90-110`, `docs/018:123-125`, `docs/020:171-176, 204-240, 781-792`. — **CONFIRMÉ** / décision **À DÉCIDER**.

---

## B3 — `Ecodume` et `Ecodim` sont-ils le même département ? Et `Press` / `Ecodume` existent-ils vraiment sur le site ?

**Pourquoi bloquant.** Ces deux départements sont **les seuls dotés d'un scope d'autorisation** dans tout le projet (`docs/020:283-285`). Leur identité détermine les valeurs de scope, les slugs, et donc les contraintes d'unicité et les tests d'autorisation.

**Les faits, tous vérifiés :**

| Élément | `docs/020` | Code / données réelles |
|---|---|---|
| Départements à espace métier | « **Press** », « **Ecodume** » | **Aucun des deux n'existe** : ni table, ni mock, ni route, ni entrée de navigation |
| Ministère des enfants | — *(« Ecodume » est cité comme département)* | **« Enfants / Ecodim »** (`slug: "enfants-ecodim"`), fondé le 2 juillet 2023 |
| Départements servis | liste de 10 noms (§6.1) : Serviteurs, Chorale Grand Groupe **CCVJ**, Chorale de Cano Vocal, Affaire sociale, D'hygiène et Ancien semence, Protocol, Évangélisation, Intercession | **3** : `adultes`, `enfants-ecodim`, `chorale` |

**Observations complémentaires :**
- Aucun des **10** départements nommés par `docs/020` §6.1/§6.2 n'apparaît dans le code.
- Aucun des **3** départements du code n'apparaît dans `docs/020`.
- `docs/020` écrit « **CCVJ** » là où tout le reste du projet écrit « **CCJV** » — probable coquille, à confirmer.
- `docs/017:203` mentionne *Adultes, Enfants/Ecodim, Chorale* (les trois du code) — donc **une autre source que `docs/020`** les connaît.
- Les données mock portent `responsibleName: "Responsable Ecodim — à confirmer"` et `"Responsable chorale — à confirmer"` — **identités non fournies**.

**Décisions requises :**
1. `Ecodume` et `Ecodim` désignent-ils **la même entité** ? Si oui, quelle est la graphie officielle ?
2. `Press` et `Ecodume` sont-ils des départements **à créer** sur le site public, ou des périmètres **internes sans page** ?
3. La liste nominative de `docs/020` §6.1 est-elle la **liste cible** des départements à créer dans le Back-Office, et les 3 actuels (Adultes, Ecodim, Chorale) sont-ils conservés, fusionnés ou renommés ?
4. `CCVJ` est-il une coquille pour `CCJV` ?

**Source :** `docs/020:173-176, 250-295`, `data/mock/departments.ts`, `data/mock/site.ts`, `docs/017:203`, `docs/001:70` (« *la liste précise n'est pas encore connue* »). — **AMBIGU** / décision **À DÉCIDER**.

---

## B4 — `Publication` et `Media` doivent-ils être rattachables à un département ?

**Pourquoi bloquant.** `docs/020` §9 pose une **exigence explicite** :

> « Le système de publication reste commun. Nous ne créons pas `PublicationPress`, `PublicationEcodume`, `PublicationAdmin`, mais : `Publication → department / owner scope`. » (`docs/020:406-423`)

Or le code contredit cette exigence :

| Entité | Colonne départementale | Conséquence |
|---|---|---|
| `events` | **`department_id`** ✅ (`schema/events.ts:51`, FK `SET NULL`) | doc §10 satisfait |
| `leaders` | **`department_id`** ✅ (`schema/people.ts:38`) | — |
| **`publications`** | ❌ **AUCUNE** (`schema/publications.ts`) | **§9 inapplicable** |
| **`media`** | ❌ **AUCUNE** (`schema/media.ts`) | **§22.4 non tranchée** |

**Résultat mesuré :** le scénario central de `docs/020` §5 est implémentable **à 60 %** — `Event.department = Press` et `Department.id = Press` fonctionnent, `Publication.department = Press` et `Media.department = Press` **sont impossibles aujourd'hui**.

**Nuance à ne pas perdre :** `docs/020:863-864` (§22.4) déclare elle-même la question **ouverte** : « *Propriété des médias : Média global, média appartenant à un département, ou combinaison des deux ?* ». Et `docs/018` prévoit une arborescence Storage **par entité** (`events/ departments/ publications/ leaders/ testimonies/ community/ pages/`) — donc une médiathèque **globale**, pas départementale.

**Décisions requises :**
1. `publications.department_id` : **on ajoute une colonne nullable** (publication globale ou départementale) ? Ou on assume que les publications restent globales et on révise `docs/020` §9 ?
2. `media.department_id` : média **global**, **départemental**, ou **les deux** (colonne nullable `department_id` + notion de média partagé) ?
3. Un Responsable peut-il **rattacher** une publication à son département à la création, ou est-ce réservé à l'Admin ?
4. Que devient une publication départementale si le département est supprimé ? (`SET NULL` comme pour `events`, ou blocage ?)
5. Une publication **globale** (sans département) est-elle modifiable par un Responsable ? *(Réponse attendue : non.)*

**Source :** `docs/020:404-437, 863-864`, `schema/events.ts:51`, `schema/publications.ts`, `schema/media.ts`, `docs/018`. — **CONFIRMÉ** / décision **À DÉCIDER**.

---

## B5 — Quel est le seuil et la règle exacte d'archivage des publications ?

**Pourquoi bloquant.** Le workflow `BROUILLON → PUBLIÉ → ARCHIVÉ` de `docs/020` §8 est **la seule règle métier non triviale du système**, et elle conditionne : l'enum `publication_status`, l'affichage public (« publications récentes »), et l'UX de l'écran Publications.

**Ce que dit la documentation — verbatim :**

> « L'archivage n'est toutefois **pas simplement une action manuelle arbitraire**. Il dépend d'une règle métier basée sur le nombre de publications récentes. Cette règle devra déterminer notamment : le seuil de publications récentes ; le périmètre du calcul ; le moment où une publication devient éligible à l'archivage ; si l'archivage est automatique ou déclenché par l'administrateur. **La valeur exacte du seuil reste à définir.** » (`docs/020:389-400`)

**Fait vérifié : aucune valeur de seuil n'existe dans AUCUN document ni dans le code.** Conformément à la consigne §15 (« Ne décide pas toi-même du seuil métier s'il n'est pas présent dans les documents »), **cet audit ne propose aucun chiffre.**

**État du code :** `publicationStatusEnum = pgEnum("publication_status", ["DRAFT", "PUBLISHED"])` — **`ARCHIVED` n'existe pas** (`schema/enums.ts:37-40`). Valeur par défaut `PUBLISHED` (`schema/publications.ts:54`, arbitrage n°6 de `docs/018`) — soit **l'inverse** d'un workflow commençant par un brouillon. Côté frontend, `Publication` (`types/index.ts:58-73`) **n'a aucun champ de statut**.

**Décisions requises :**
1. **La valeur du seuil** (nombre de publications récentes).
2. Le **périmètre** du calcul : global, par `category`, ou par département ?
3. La **fenêtre de récence** : en nombre de publications, en jours, ou les deux ?
4. Déclenchement **automatique** (tâche planifiée) ou **manuel** par l'administrateur ?
5. **L'état initial** à la création : `DRAFT` (brouillon par défaut, plus sûr) ou `PUBLISHED` (arbitrage actuel de `docs/018`) ?
6. `ARCHIVED` est-il un état **persisté** ou **dérivé** (comme `EventStatus`, calculé depuis `event_date`) ? — *Note : `docs/006` a tranché ce débat en faveur du calculé pour les événements ; la même logique appliquée aux publications donnerait un archivage calculé, sans colonne.*
7. Une publication archivée est-elle **encore accessible** publiquement (URL conservée) ou retirée du site ?
8. Un brouillon est-il visible par son auteur uniquement, ou par tous les administrateurs ?

**Source :** `docs/020:358-400, 857-858`, `schema/enums.ts:37-40`, `schema/publications.ts:54`, `types/index.ts:58-73`, `docs/018:133`. — **THRESHOLD MENTIONED BUT UNVALUED** / décision **À DÉCIDER**.

---

## B6 — `HouseGroup` (groupes de maison) est-il une entité métier ?

**Pourquoi bloquant.** Décider si une entité entre dans le modèle change le nombre de tables, les écrans du Back-Office et le RBAC.

**Les faits :**

| Aspect | Constat |
|---|---|
| Présente dans le frontend | ✅ `data/mock/community.ts:52-99` — `HouseGroup { id, name, quarter, schedule, host, description, image? }`, **4 enregistrements** |
| Rendu sur le site | ✅ `/communaute/groupes-de-maison` (20,7 Ko), 7 sections |
| Table en base | ❌ **aucune** |
| Endpoint API | ❌ **aucun** (`endpoints.ts` n'expose rien pour les groupes) |
| Mentionnée dans la documentation | ❌ **aucun des 20 documents** |
| Champ départemental | ❌ aucun |
| Statut / publication | ❌ aucun |

**C'est la seule entité du frontend qui n'existe nulle part ailleurs.** Les groupes portent des données à forte sensibilité éditoriale : un **lieu d'accueil chez un particulier** (`host: "Chez l'habitant (Quartier Hewa Bora)"`) — publier une adresse privée est une décision qui engage CCJV.

**Décisions requises :**
1. Les groupes de maison sont-ils une **entité administrable**, ou un contenu éditorial figé ?
2. Si entité : quels champs ? (`quarter` est-il lié à une liste de quartiers de Lubumbashi ?)
3. Le champ `host` (« chez l'habitant ») doit-il être **public** ? Faut-il un consentement ?
4. Un `HouseGroup` est-il rattaché à un département, à un quartier, à un responsable ?
5. Faut-il un `status` (un groupe peut-il être « inactif » / « complet ») ?

**Source :** `data/mock/community.ts:52-99`, `frontend/src/app/communaute/groupes-de-maison/page.tsx`, absence vérifiée dans `schema/*` et `endpoints.ts`. — **CONFIRMÉ (entité fantôme)** / décision **À DÉCIDER**.

---

## B7 — Le formulaire de demande de prière : brancher, retirer, ou remplacer par WhatsApp ?

**Pourquoi bloquant.** Ce n'est pas une question d'UX : c'est un **défaut de confiance publié** et un **risque de conformité**.

**Le fait vérifié.** `PrayerRequestForm.handleSubmit` exécute `setTimeout(…, 600)` puis `setSubmitted(true)`. **Aucun appel réseau.** L'écran de succès affirme pourtant : **« Votre demande a bien été reçue. »** Les champs `contact` et `confidentiality` sont **collectés et jamais utilisés**.

**Aggravant.** La page `/confidentialite` promet un traitement confidentiel des demandes de prière. `prayer_requests` **existe en base** avec `confidentiality` (`private` | `community`) et `status` (`NEW` | `PRAYED`). Le module API, le repository et le schéma Zod **existent également**. **Le chemin technique est complet — seul le branchement frontend manque.**

**Autre incohérence :** la page qui porte ce formulaire s'appelle `/communaute/priere-et-intercession`, mais l'accueil renvoie vers **WhatsApp** pour demander la prière (section 10), jamais vers cette page.

**Décisions requises :**
1. Le formulaire est-il **branché** sur l'API (`POST /prayer-requests`) ou **retiré** au profit de WhatsApp ?
2. Si branché : qui **traite** les demandes dans le Back-Office ? Quel rôle ? Un écran dédié ?
3. Le champ `confidentiality` : que garantit « community » concrètement ? Qui peut lire une demande `private` ?
4. Une demande de prière est-elle une **entité administrable visible** dans un écran du Back-Office (donc avec un cycle de vie `NEW → PRAYED`) ?
5. Quelles **mentions de confidentialité** faut-il afficher, et faut-il réécrire `/confidentialite` en conséquence ?
6. Faut-il un **anti-spam** (le formulaire est public et sans authentification) ?
7. Quel **canal** l'accueil doit-il proposer : WhatsApp, la page interne, ou les deux ?

**Source :** `components/forms/PrayerRequestForm.tsx`, `app/communaute/priere-et-intercession/page.tsx`, `/confidentialite`, `schema/prayer-requests.ts`, `modules/prayer-requests/*`. — **CONFIRMÉ (défaut critique)** / décision **À DÉCIDER**.

---

## B8 — Que fait-on du champ `scope` déjà présent sur `leaders` ?

**Pourquoi bloquant.** Le mot `scope` est **déjà pris** dans le schéma existant, avec un sens **sans rapport** avec l'autorisation.

**Les faits :**

| Emplacement | Définition | Sens |
|---|---|---|
| `schema/people.ts:32-33` | « *Domaine couvert, ex. « Chorale ».* » `varchar(120)` | **Libellé d'affiliation organisationnelle** — une chaîne, **pas une FK** |
| `docs/020:204-236` | `ROLE + SCOPE`, `scope = PRESS` | **Périmètre d'autorisation** — une clé étrangère vers un département |

**Valeurs réelles de `leaders.scope` :** `"Direction générale"`, `"Adultes"`, `"Enfants / Ecodim"`, `"Chorale"`, `"Communauté"` — **aucune n'est un identifiant de département** : ce sont des libellés français libres, non joignables à `departments`.

**Risque concret.** Si le modèle d'autorisation introduit une colonne `scope` (ou une notion `scope`), deux concepts homonymes coexisteront dans le même schéma, avec des valeurs non compatibles. Une requête de portée écrite par erreur sur la mauvaise colonne produirait **silencieusement** un périmètre vide ou total.

**Lié (voir I6) :** `leaders.departmentId` **existe déjà** en parallèle — donc l'affiliation d'un responsable est **doublement** représentée : par un libellé (`scope`) **et** par une FK (`departmentId`).

**Décisions requises :**
1. Renomme-t-on `leaders.scope` (par ex. `domainLabel`, `affiliation`) **avant** d'introduire le `scope` d'autorisation ?
2. Ou conserve-t-on `leaders.scope` et nomme-t-on autrement le périmètre d'autorisation (`departmentScope`, `ownerScope`) ?
3. `leaders.scope` reste-t-il un **libellé libre**, ou devient-il **dérivé** de `departmentId` (rendant la colonne redondante → à supprimer) ?

**Source :** `schema/people.ts:32-40`, `data/mock/leaders.ts:14`, `docs/020:204-236`. — **CONFIRMÉ (collision de nommage)** / décision **À DÉCIDER**.

---

# IMPORTANT

## I1 — Quelles pages adoptent un archétype avant que leur prose ne soit exposée ?

**Le fait.** Le système d'archétypes de `docs/015` est implémenté mais adopté par **9 pages sur 21**. Les 4 pages les plus lourdes en prose — `/qui-sommes-nous` (30 Ko), `/vie-de-leglise/evenements` (37 Ko), `/faire-un-don` (29 Ko), `/organisation` (25 Ko) — n'en utilisent **aucun**. Trois archétypes existent et ne sont pas employés par la page qui correspond à leur profil : `NarrativePage` (pour `/qui-sommes-nous`, dont le commentaire interne dit pourtant « Page Narrative Majeure »), `InformationPage` (pour `/ou-nous-trouver`), `ListingPage` (pour `/evenements`). **`DirectoryPage` n'est utilisé par aucune route.**

**Pourquoi important.** Le nombre et l'ordre des sections déterminent la forme du `content` jsonb par `page_key`. Exposer 16 champs sur une page dont la composition va changer oblige à migrer le contenu.

**Décisions requises :**
1. Les 4 pages lourdes sont-elles **migrées** vers un archétype, ou **assumées** comme compositions libres ? (`docs/015` §3 autorise explicitement les compositions libres : « *Une page peut toujours composer des briques brutes si aucun archétype ne convient* ».)
2. `DirectoryPage` doit-il être utilisé (par `/organisation` ?) ou **supprimé** ?
3. La migration visuelle est-elle un préalable au Back-Office, ou un chantier parallèle ?
4. Faut-il **geler** la composition des pages avant d'exposer leur contenu ?

**Source :** code des 21 routes ; `docs/015:115-133, 169-197`. — **CONFIRMÉ** / décision **À DÉCIDER**.

---

## I2 — Trois vocabulaires de ton : unifier ou assumer ?

**Le fait.** Aucun des trois référentiels n'est inclus dans un autre :

| Composant | Valeurs |
|---|---|
| `Band` | `light`, `cream`, `tinted`, `dark`, `green`, `bare` |
| `VerseSection` | `dark`, `light`, `cream`, `green`, `offwhite`, `white`, `tinted`, `transparent` |
| `EventsSection` | `offwhite`, `light`, `cream`, `white`, `tinted`, `dark` |

De plus `VerseSection.light` et `.offwhite` produisent **la même classe CSS** (`bg-ccjv-offwhite text-ccjv-ink`), ce qui rend deux valeurs indistinguables.

**Décisions requises :** unifier sur `BandTone` comme référentiel unique ? Ou assumer des jeux contextuels documentés ? Le chantier est-il fait **avant** ou **après** le Back-Office ? — **Source :** `Band.tsx:14-38`, `VerseSection.tsx:6-33`, `EventsSection.tsx:27-40`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I3 — La navigation reste-t-elle dans le code ?

**Le fait.** `lib/nav.ts` (219 lignes) porte **toute** la navigation en dur : hiérarchie, `href`, pôles sans page, `description`, `ready`, et la logique `getBreadcrumbs`. **Aucun champ `icon`, `badge`, `order`, `visible`, ni condition de rôle.** `ready` est figé à `true` partout ; `primaryNav` est un clone identique de `mainNav` (le filtre ne filtre rien) ; `allDestinations` n'est jamais consommé.

Or `docs/020:499-508` (§11) liste « **structure de navigation** » parmi les propriétés « exemple potentiellement réservé à l'administration », et `docs/020:429-435` donne à l'administration « Gérer les départements ».

**Décisions requises :**
1. La navigation reste-t-elle **entièrement codée** (position recommandée : c'est de la structure) ?
2. Ou les **libellés** et **descriptions** deviennent-ils administrables (le `label` et la `description` d'un `NavItem` sont du contenu) ?
3. Les **entrées de menu liées aux départements** doivent-elles être générées dynamiquement (puisque les départements sont dynamiques) ?
4. Que signifient `ready` et le mécanisme « palier 1 » désormais que tous les pôles sont `ready: true` ?
5. Faut-il introduire la **visibilité conditionnelle par rôle** dans la navigation du Back-Office (et non du site) ?

**Source :** `lib/nav.ts`, `docs/020:429-435, 499-508`, `docs/015:225-253`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I4 — Quelle politique de repli uniforme pour les sections sans données ?

**Le fait.** **Trois stratégies coexistent sans règle écrite** : `EmptyState` (9 appels / 6 fichiers), `ContentPending` (5 appels / 4 fichiers), panneau éditorial en dur (1 occurrence). Sur `/organisation` — la page la mieux traitée — **les deux entités de même nature utilisent deux stratégies différentes** : `EmptyState` pour le pasteur (S7), paragraphe en dur non administrable pour l'équipe (S8).

À l'inverse, **l'accueil — la page la plus visitée — n'a que 2 gardes pour 12 sections**.

**Aggravant : les replis silencieux substituent une donnée non validée.**
- `DepartmentModal.tsx:171` : `meetingSchedule ?? "Culte dominical · 09:00"` — alors que `site.ts:34` déclare cet horaire « **de démonstration, à valider par CCJV** ». Le site affirme donc un horaire non validé comme s'il était propre au département.
- `OrganisationExplorer.tsx:52` : `dept.bannerImage ?? images.communaute` — un département sans bannière affiche **la photo d'une autre entité**.

**Décisions requises :**
1. Une **règle unique** est-elle adoptée (voir la proposition de l'audit §10.3) ?
2. Pour l'accueil : **masquer** la section, afficher un **état vide**, ou un **texte éditorial de repli administrable** ?
3. Les **replis d'image génériques** sont-ils interdits (recommandé) ?
4. Le **repli d'horaire** devient-il « Horaire à préciser » ?
5. Les textes de repli sont-ils **administrables** par `page_key`, ou figés dans le code ?

**Source :** `organisation/page.tsx:242,278,306,336,430`, `DepartmentModal.tsx:171`, `OrganisationExplorer.tsx:52,121`, `EventsSection.tsx:77`, `VerseSection.tsx:104-115`, `site.ts:34`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I5 — Le texte alternatif (`alt`) est-il obligatoire à la saisie ?

**Le fait.** `media.alt` **existe** en base (`schema/media.ts:40-41`), nullable, justifié par « *obligatoire pour l'accessibilité WCAG 2.2 AA* ». Mais dans les faits :
- l'accueil utilise `alt=""` partout (décoratif — décision défendable) ;
- les fiches génèrent `alt={dept.name}` et `` alt={`${activeDept.name} — photo ${gIdx + 1}`} `` — **auto-généré, donc sans valeur informative** ;
- `mock/images.ts:5-8` avertit : « *Les valeurs ci-dessous sont des RÔLES DE MISE EN PAGE, pas des légendes* » et `docs/015:268-270` rappelle qu'« *aucune légende photographique affirmative n'est écrite* ».

**Le paradoxe à trancher :** `alt` est le champ où la règle « ne jamais inventer un fait » doit se matérialiser — mais qui **connaît** le sujet de la photo ? `docs/015` précise que l'agent n'a pas de capacité d'analyse d'image et que **la correspondance photo → sujet reste à relire par CCJV**.

**Décisions requises :**
1. `alt` est-il **obligatoire** pour les images de contenu, **facultatif** pour le décoratif ? Comment le Back-Office distingue-t-il les deux ?
2. Qui saisit le `alt` — l'éditeur au moment de l'usage, ou le média à l'import ?
3. CCJV **valide-t-il** la correspondance photo → sujet ? Sans cela, tout `alt` resterait une supposition.
4. Les surimpressions actuelles de `/organisation` (« Entraide & Service », « Louange », « Ecodim ») sont-elles des **légendes affirmatives** (à valider ou retirer), ou des **libellés de section** ?
5. Faut-il ajouter `caption` (légende) et `credit` (crédit) sur `media`, comme le suggère le besoin de « consultation des informations du média » de `docs/020` §7 ?

**Source :** `schema/media.ts:40-41`, `mock/images.ts`, `docs/015:257-270`, `organisation/page.tsx:97-136`, `OrganisationExplorer.tsx:53`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I6 — Le responsable d'un département est-il une personne référencée ou une chaîne libre ?

**Le fait.** **Deux représentations parallèles** de la même information :

| Représentation | Emplacement | Type |
|---|---|---|
| Chaîne libre | `departments.responsibleName` | `varchar(120)` — **pas une FK** |
| Référence | `leaders.departmentId` → `departments.id` | FK nullable |

Valeurs réelles : `"Pasteur Manasse Mwamba"`, `"Responsable Ecodim — à confirmer"`, `"Responsable chorale — à confirmer"`. Côté `leaders`, les personnes s'appellent aussi `"Responsable — Adultes"`, `"Responsable — Ecodim"` — donc **des placeholders des deux côtés**.

**Aggravant, lié :** le « pasteur principal » est **positionnel** — `const [leadPastor, ...teamLeaders] = leaders` (`organisation/page.tsx:27`) et `leadPastor = leaders[0]` (`mock/leaders.ts:62`). **Réordonner les responsables change silencieusement qui est présenté comme pasteur visionnaire.**

**Décisions requises :**
1. `responsibleName` devient-il une **FK vers `leaders`**, ou reste-t-il un champ libre pour les personnes non référencées ?
2. Si FK : que fait la fiche département quand le responsable référencé est supprimé ?
3. Comment exprime-t-on le **responsable principal** : un booléen `isLead` sur `leaders`, une colonne `position = 0` (déjà existante mais ambiguë), ou une FK depuis une table `church_leadership` ?
4. Les placeholders « — à confirmer » sont-ils un **état** à modéliser (donc un statut) ou du texte provisoire à remplacer ?
5. Un Responsable de département peut-il **créer** des `leaders` pour son département ? (`docs/020:186` mentionne « autres contenus dynamiques associés ».)

**Source :** `schema/departments.ts:32`, `schema/people.ts:38`, `organisation/page.tsx:27`, `mock/departments.ts:41,66`, `mock/leaders.ts:62`, `docs/020:186, 860-861`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I7 — Les publications ont-elles une galerie ?

**Le fait.** `events` et `departments` ont chacun **une table de jointure ordonnée** (`event_media`, `department_media`). **`publications` n'en a aucune** — uniquement `coverMediaId` (une seule image).

Or le frontend affiche, pour une publication PHOTO, une **« Galerie de l'album »** composée de `imageSource` **+ 10 photos génériques du mock `galleryImages`**, **présentées sans aucune mention**. C'est le pire cas relevé dans l'audit : de la donnée de démonstration présentée comme du contenu réel.

**Décisions requises :**
1. Une publication a-t-elle une **galerie ordonnée** (donc une table `publication_media`) ?
2. Si oui, remplace-t-elle `coverMediaId` ou coexiste-t-elle ?
3. Les publications de type `VIDEO` peuvent-elles aussi avoir une galerie ?
4. La galerie est-elle administrable par un Responsable de département ?

**Source :** `schema/publications.ts:55`, `schema/events.ts:72-88`, `schema/departments.ts:58-74`, `publications/[slug]/page.tsx`, `mock/images.ts:62-73`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I8 — Quel est le devenir des données de démonstration (les mocks) ?

**Le fait.** Après branchement de l'API, **9 modules mock** et **~11 pages** resteront à traiter. Certains sont déjà **entièrement morts** : `mock/leaders.ts` et `mock/testimonies.ts` ne sont **importés par aucun fichier**, ainsi que 4 résolveurs (`getEventBySlug`, `getDepartmentBySlug`, `getPublicationBySlug`, `getPublicationsByCategory`) et `choraleSchedule`.

**Aggravant :** les mocks utilisent `daysFromNow()` (`lib/utils.ts`), donc **toutes les dates d'événements et de publications sont non déterministes** — elles changent à chaque build. `sitemap.ts` et `/recherche`, qui lisent les mocks, publient donc des slugs et des dates **instables**.

**Décisions requises :**
1. Les mocks sont-ils **supprimés** après branchement, ou **conservés** comme jeu de données de démonstration en développement ?
2. Si conservés : comment empêcher qu'ils alimentent le sitemap et la recherche en production ?
3. Les données de démonstration actuelles (10 publications, 7 événements, 3 départements, 5 responsables, 5 visages, 4 témoignages, 4 groupes) deviennent-elles le **seed initial** de la base ?
4. Quelles données de démonstration **contiennent des affirmations non validées** et doivent être retirées avant mise en production ? *(`"Pasteur Manasse Mwamba"` est confirmé par `docs/015` §5 ; les prénoms des visages (« Grâce », « Patrick », « Esther », « Naomi », « Emmanuel ») sont explicitement « rédigés pour la maquette » et requièrent l'accord des personnes.)*
5. Le faux numéro WhatsApp `+243 123 456 789`, qui alimente **12 CTA** sur le site, doit-il être remplacé avant la mise en ligne ?

**Source :** `lib/utils.ts`, `data/mock/*`, `sitemap.ts`, `recherche/page.tsx`, `mock/leaders.ts:1-7`, `mock/community.ts:3-7`, `mock/site.ts:39-40`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I9 — Le rythme hebdomadaire : laquelle des cinq versions est la bonne ?

**Le fait.** **Cinq formulations divergentes** du même horaire coexistent :

| Source | Contenu |
|---|---|
| `mock/site.ts` (`weeklyRhythm`) | Dimanche 09h00 · **Lundi** 16h30–18h30 `confirmed` · **Mercredi dans la nuit** `confirmed` · Mercredi 17h00 prière · **Samedi** 16h30–18h30 `confirmed` |
| `/` (via `WeekRhythm`) | Affiche le mock, **sans jamais montrer `confirmed`** |
| `/vie-de-leglise/ou-nous-trouver` | `"Dimanche · 09:00"`, `"Mercredi · 17:00"`, `"Lundi & Samedi · 16:30"` — **supprime le créneau « mercredi dans la nuit » marqué confirmé** |
| `/vie-de-leglise/evenements` | Tableau **local** : Mercredi **18:00** + **Vendredi 17:00 chorale** — **contredit** le mock |
| `/qui-sommes-nous` (prose) | « Dimanche 09h », « Mercredi 17h » |

`choraleSchedule` (« *Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30* ») existe dans le mock et n'est **jamais importé**. La même information apparaît aussi dans `departments.meetingSchedule` de la chorale.

**Enjeu factuel :** ces horaires sont affichés à des visiteurs qui se déplacent. **Un horaire faux a un coût réel.** Le créneau « **Vendredi 17:00** » n'existe que dans une page ; le créneau « **Mercredi 18:00** » contredit « **17:00** » ; « mercredi dans la nuit » existe dans deux sources et disparaît d'une troisième.

**Décisions requises :**
1. **Quels sont les horaires réels**, validés par CCJV ?
2. Le champ `isConfirmed` (`schedule_entries`) doit-il être **affiché** (par ex. « horaire provisoire ») ou n'est-il qu'un indicateur interne ?
3. Un **même** créneau peut-il apparaître plusieurs fois (deux entrées « Mercredi ») ? Avec des `id`, oui — le mock, lui, n'a pas d'`id` et utilise `day+title` comme clé.
4. `choraleSchedule` (chaîne agrégée) doit-il exister comme donnée, ou être **dérivé** des entrées de chorale ?
5. La liaison avec `departments.meetingSchedule` (même information, autre emplacement) est-elle voulue ?

**Source :** `mock/site.ts:57-108`, `ou-nous-trouver/page.tsx`, `evenements/page.tsx:81`, `qui-sommes-nous/page.tsx`, `departments.ts:67-68`. — **CONFIRMÉ (5 versions)** / **À DÉCIDER**.

---

## I10 — Faut-il ajouter une métadonnée de recherche et un nom d'origine aux médias ?

**Le fait.** `media` porte `bucket`, `path` (généré serveur), `publicUrl`, `mimeType`, `sizeBytes`, `width`, `height`, `alt`, `uploadedBy`, `createdAt`. **Aucun `title`, `filename` d'origine, `caption`, `credit`, ni `tags`.**

Or `docs/020:301-315` (§7) exige que la médiathèque permette : « *l'import d'un média ; la prévisualisation ; **la recherche** ; **le filtrage** ; la sélection d'un média ; la réutilisation ; le remplacement ; la suppression ; la consultation des informations du média* ».

**Le problème pratique :** un responsable cherchant « la photo de la chorale » n'a **rien** sur quoi chercher, sauf `alt` — qui est nullable et auto-généré aujourd'hui. Le `path` est un identifiant technique généré côté serveur, explicitement « *jamais fourni par le client* ».

**Décisions requises :**
1. Ajoute-t-on un `title` / `filename` d'origine pour rendre la recherche possible ?
2. Ajoute-t-on `caption` et `credit` ?
3. Ajoute-t-on des `tags` / une catégorie ?
4. La recherche porte-t-elle sur `alt` + `title` + `caption` (recherche plein texte) ?
5. Faut-il une notion de **dossier / collection** éditoriale, distincte de l'arborescence technique prévue par `docs/018` ?

**Source :** `schema/media.ts`, `docs/020:299-352`, `docs/018`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I11 — Les événements ont-ils un workflow de validation ?

**Le fait.** `docs/020` §10 laisse explicitement la question ouverte :

> « Le workflow précis : Responsable → Proposition → Validation éventuelle → Publication **reste à préciser dans la conception fonctionnelle détaillée.** » (`docs/020:464-476`)
> « **Validation des événements proposés par les responsables** : Publication directe ou validation par un Administrateur ? » (`docs/020:854-855`)

**Ce que fait le code :** `events` **n'a aucune colonne de statut** — pas de `status`, pas d'`is_archived`. `docs/006` a tranché pour un état **calculé** depuis `event_date` (`UPCOMING` | `ARCHIVED`), et `schema/events.ts:20-23` le confirme : « *Aucune transition manuelle « archiver » n'existe* ».

**Conséquence :** les événements ont un cycle de vie temporel, mais **aucun cycle de vie éditorial**. On ne peut pas représenter un événement « brouillon » ou « en attente de validation ».

**Décisions requises :**
1. Les événements ont-ils besoin d'un **statut éditorial** (`DRAFT` | `PUBLISHED`) en plus de l'état temporel calculé ?
2. Si oui : un Responsable publie-t-il **directement**, ou soumet-il à validation ?
3. `ARCHIVED` (temporel, calculé) et un éventuel `ARCHIVED` (éditorial, persisté) porteraient-ils le **même nom** ? *(Risque de confusion identique à B8.)*
4. Qui valide, et l'écran de validation relève-t-il du tableau de bord Admin ?

**Source :** `docs/020:441-476, 854-855`, `docs/006`, `schema/events.ts:17-27`, `types/index.ts:12-16`. — **CONFIRMÉ (question ouverte documentée)** / **À DÉCIDER**.

---

## I12 — Faut-il un journal d'activité (audit) ?

**Le fait.** `docs/020:142`, `:655`, `:729` prévoient un « **Journal d'activité** » (*Audit*) : le Super Admin peut « consulter les journaux d'activité », et la matrice §18 lui accorde « Audit : ✓ » (Admin : « selon politique »). **La navigation conceptuelle de §15 inclut « Journal d'activité ».**

**État du code : aucune table d'audit n'existe.** Aucun des schémas ne porte de table de log. (Des `logger.warn` applicatifs existent pour les refus d'autorisation, mais ils ne sont pas persistés en base.)

**Décisions requises :**
1. Un journal d'activité est-il **dans le périmètre** du Back-Office, ou hors périmètre ?
2. Si oui : quels **événements** sont tracés (création, modification, publication, suppression, connexion, changement de rôle) ?
3. Quel **niveau de détail** (valeurs avant/après, ou simple fait) ?
4. Quelle **durée de rétention** ?
5. L'Admin y a-t-il accès, ou seulement le Super Admin ? Quelle est la « politique » évoquée par la matrice ?
6. `static_pages.updatedBy`, `media.uploadedBy` existent déjà — suffisent-ils, ou faut-il un journal complet ?

**Source :** `docs/020:142, 655, 716-731`, absence vérifiée dans `schema/*`. — **CONFIRMÉ** / **À DÉCIDER**.

---

## I13 — Une publication est-elle brouillon visible par son auteur seulement ?

**Le fait.** `docs/020:370-379` définit le brouillon (« *Le contenu existe mais n'est pas visible publiquement… créé, modifié, complété, préparé avant publication* ») mais ne dit rien du **partage entre administrateurs**.

**Aggravant mesuré :** l'API publique `getPublications()` ne filtre **pas** sur le statut côté frontend, qui **ne connaît même pas le champ** (`types/index.ts:58-73`). Toute publication, y compris `DRAFT`, serait donc rendue si l'API ne la filtre pas explicitement.

**Décisions requises :**
1. L'API publique exclut-elle **systématiquement** `DRAFT` ? *(À vérifier côté `publication.service.ts`.)*
2. Un brouillon est-il visible par **tous** les administrateurs, ou seulement par son **créateur** ?
3. Un Responsable de département voit-il les brouillons des **autres** départements ?
4. Le statut doit-il être **exposé** au frontend public (pour afficher un bandeau « brouillon » en prévisualisation) ?

**Source :** `docs/020:370-379`, `schema/enums.ts:32-40`, `types/index.ts:58-73`, `endpoints.ts:161-178`. — **CONFIRMÉ** / **À DÉCIDER**.

---

# MINEUR

## M1 — Plafond de `keyPoints` : 4 en carte, intégral en tiroir
`OrganisationExplorer.tsx:101` tronque à 4 ; `DepartmentModal.tsx:202` affiche tout. Cohérence à rétablir.

## M2 — Le titre d'une publication est rendu deux fois
`publications/[slug]/page.tsx` : le titre apparaît en `h1` dans le héros et en `h2` dans le résumé.

## M3 — Les contenus associés sont rendus deux fois
Même fichier : un `aside` **et** l'emplacement `related` de `DetailPage`.

## M4 — Catégorie → libellé dupliqué
Un ternaire inline dans `/actualites` et un `Record categoryLabel` dans `[slug]`. À factoriser.

## M5 — `typeLabel.VIDEO = "Enseignement"`
Toute publication vidéo est étiquetée « Enseignement », y compris une vidéo qui ne serait pas un enseignement. À remplacer par un libellé de type réel.

## M6 — `<main>` imbriqué sur `/organisation`
`organisation/page.tsx:30` rend un `<main>` dans le `<main id="contenu">` du layout. Seule page dans ce cas. HTML invalide, impact accessibilité.

## M7 — Placeholders publiés
`/mentions-legales` : `"Adresse : information à compléter. Contact : information à compléter."` et la mention de l'hébergeur. `CategoryLabel` : `"À venir"`, `"Auteur non renseigné"`, `"Vidéo à venir"`.

## M8 — Liens morts
`/vie-de-leglise/premiere-visite` (depuis `groupes-de-maison:65`) et `/contact` (prose de `mentions-legales`). Routes inexistantes.

## M9 — Fautes publiées
« Données **susceptible** d'être traitées » (`/confidentialite`). Surlicence : `"CCVJ"` dans `docs/020`.

## M10 — Contradictions de texte à corriger
`/enseignements` affirme que la vidéo se regarde « sans quitter le site » alors que tout ouvre YouTube dans un nouvel onglet. `/recherche` affirme que médiathèque et ressources « ne sont pas encore publiés » alors que ses propres mocks les contiennent.

## M11 — Éléments de code morts à nettoyer
`mock/testimonies.ts` et `mock/leaders.ts` (jamais importés) ; `choraleSchedule` ; `getEventBySlug`, `getDepartmentBySlug`, `getPublicationBySlug`, `getPublicationsByCategory` ; import `departments` inutilisé dans `sitemap.ts:5` ; import `weeklyRhythm` inutilisé dans `ou-nous-trouver:7` ; `allDestinations` jamais consommé ; `PortraitPanel` et `PeopleGrid` jamais utilisés ; `DirectoryPage` jamais utilisé ; `primaryNav` clone identique.

## M12 — Jetons et couleurs hors charte
`bg-[#132A13]` sur `/parcours-nouveau` — couleur hors palette `--ccjv-*`.

## M13 — Poids des assets
`logo.png` 415 Ko, `logo_2.png` 621 Ko, 41 JPEG jusqu'à 250 Ko. **9 fichiers jamais référencés** ; **4 référencés uniquement par un module mort**.

## M14 — Duplication du composant `EmptyState` en 9 appels / 6 fichiers
Aucune règle écrite sur quand l'utiliser. À documenter dans le design system.

## M15 — `Hero` d'accueil sans props
`features/pages/Hero.tsx` n'accepte **aucune prop** : titre, paragraphe, 2 libellés de CTA et l'image sont en dur. Pour rendre l'accueil administrable, il faut **d'abord** lui ajouter une interface de props.

---

# Récapitulatif

| Priorité | Nombre | Questions |
|---|---|---|
| **BLOQUANT** | **8** | B1 `page_key` · B2 rôle et scope · B3 Ecodume/Ecodim et Press · B4 rattachement départemental des publications et médias · B5 seuil d'archivage · B6 `HouseGroup` · B7 formulaire de prière · B8 collision du mot `scope` |
| **IMPORTANT** | **13** | I1 archétypes · I2 tons · I3 navigation · I4 replis · I5 `alt` · I6 responsable de département · I7 galerie de publication · I8 devenir des mocks · I9 rythme hebdomadaire · I10 métadonnées média · I11 workflow événement · I12 audit · I13 visibilité des brouillons |
| **MINEUR** | **15** | M1 à M15 |
| **TOTAL** | **36** | — |

**Note :** `docs/020` §22 liste **7** « points encore à spécifier ». Cet audit en porte le total à **36**, dont **8 bloquants** — non pas parce que le document était incomplet, mais parce que le code a été écrit depuis, et qu'il révèle des questions que la conception initiale ne pouvait pas anticiper (asymétrie du rattachement départemental, collision du mot `scope`, entité `HouseGroup` sans backend, formulaire simulé).

**Aucune de ces 36 questions n'a été tranchée par l'audit.**
