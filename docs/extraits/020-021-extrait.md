# Extrait structuré et citationnel — documents 020 & 021

**Sources dépouillées intégralement (premier au dernier caractère) :**

| Réf. | Fichier | Lignes |
|---|---|---|
| **020** | `docs/020-conception_backoffice.md` — « Document de conception — Back-Office CCJV » | 920 |
| **021** | `docs/021-modele_metier_backend.md` — « CCJV — Modèle métier du backend » | 852 |

**Conventions de l'extrait**

- Toute affirmation porte : `[020|021] §<section> l.<ligne(s)>` puis, pour les passages normatifs, la **citation littérale entre guillemets français**.
- Les citations sont reproduites **verbatim** (accents, majuscules, ponctuation, fautes de frappe incluses).
- Lorsqu'un point n'est pas traité, la mention explicite `non traité dans 020/021` est employée. **Aucune inférence, aucune complétion.**
- Les deux documents ne donnent **aucun type de données** (aucun `VARCHAR`, `UUID`, `date`, `boolean`, ni schéma SQL). Partout où un attribut est listé, les documents en donnent le **libellé métier uniquement** ; il est donc systématiquement noté « type non spécifié dans 020/021 ».
- Les documents ne donnent **aucun endpoint HTTP**. Voir §5.

---

# 1. Modèle métier — inventaire exhaustif

## 1.0 Tableau de synthèse des entités et concepts recensés

| # | Entité / concept (nom exact des documents) | 020 | 021 | Statut dans les documents |
|---|---|---|---|---|
| E1 | Utilisateur / `User` | §4 | §5, §15 | Nommée |
| E2 | Super Administrateur / `SUPER_ADMIN` | §4.1, §18 | §5.1, §6.1, §7 | Nommée (rôle) |
| E3 | Administrateur / `ADMIN` | §4.2, §18 | §5.1, §6.1, §7 | Nommée (rôle) |
| E4 | Responsable de département / `DEPARTMENT_MANAGER` | §4.3, §18 | §5.1, §7 | Nommée (rôle) |
| E5 | `Role` | §20 | §15, §16, §17 | Nommée |
| E6 | `Scope` | §5, §20 | §6, §15, §16 | Nommée |
| E7 | `Permission` | §20 | — | Nommée dans 020 seulement |
| E8 | Département / `Department` | §6, §11 | §4, §15, §16, §17, §18 | Nommée |
| E9 | Publication / `Publication` | §8, §9 | §8, §11, §15, §16, §17 | Nommée |
| E10 | Événement / `Event` | §10 | §9, §15, §16, §18 | Nommée |
| E11 | Média / `Media` | §7 | §10, §11, §15, §16, §17 | Nommée |
| E12 | `MediaAccess` | — | §10.2, §15, §16 | Nommée dans 021 seulement |
| E13 | `PrayerRequest` / Demande de prière | — | §12, §13, §14, §15, §16, §17, §18 | Nommée dans 021 seulement |
| E14 | `Notification` | — | §14, §15, §16 | Nommée dans 021 seulement |
| E15 | Page | §12 | §2.1, §3, §20.4 | Nommée |
| E16 | Section | §12, §13 | §2.1, §20.4 | Nommée |
| E17 | Ressource | §3, §7, §15 | — | Nommée dans 020 seulement |
| E18 | Journal d'activité / Audit | §3, §4.1, §15, §18 | §5.1, §7 | Nommée |
| E19 | Configuration / paramètres globaux | §4.1, §14, §15 | §6.1, §7, §18 | Nommée |
| E20 | Composants réutilisables (`BibleVerse`, `Hero`, `Card`, `Section événement`, `Section publication`, `Call-to-action`, `Gallery`) | §2.2 | §2.1 (générique) | Nommés — code, **pas** des entités métier |
| E21 | `HouseGroup` | — | §4, §19 | Nommée puis **exclue** |
| E22 | `Leader` | — | §20.5 | Nommée, statut **à déterminer** |
| E23 | `Testimony` | — | §20.5 | Nommée, statut **à déterminer** |
| E24 | `CommunityFace` | — | §20.5 | Nommée, statut **à déterminer** |
| E25 | `Verse` | — | §20.5 | Nommée, statut **à déterminer** |
| E26 | `RhythmEntry` | — | §20.5 | Nommée, statut **à déterminer** |
| E27 | `SocialLink` | — | §20.5 | Nommée, statut **à déterminer** |
| E28 | `ScheduleEntry` | — | §20.5 | Nommée, statut **à déterminer** |
| E29 | `SiteSettings` | — | §20.5 | Nommée, statut **à déterminer** |

**Total : 29 entités/concepts nommés** (dont 3 rôles E2–E4, 1 ensemble de composants de code E20 non métier, 1 entité explicitement exclue E21, 8 entités au statut non tranché E22–E29).

---

## E1 — Utilisateur / `User`

- **Nom exact** : « Modèle des utilisateurs » [020 §4, l.126] ; `User` [021 §15, l.536].
- **Définition 021** : « Le système distingue l'identité technique de l'utilisateur de son rôle métier. » [021 §5, l.130].
- **Attributs cités** :
  - `role` — [020 §20, l.781] : « ├── role = DEPARTMENT_MANAGER » (exemple conceptuel). Type non spécifié.
  - `department_id` — [020 §20, l.783] : « ├── department_id = PRESS ». Type non spécifié. Obligatoire pour un `DEPARTMENT_MANAGER` (cf. E4) ; **non traité pour les autres rôles** dans 020/021.
  - `permissions` — [020 §20, l.785-792], liste de permissions (cf. E7).
- **Relations / cardinalités** :
  - `User └── Role └── Scope` [021 §15, l.536-537].
  - `Role → User` : **1 → 0..\*** [021 §16, l.577].
  - `Scope → autorisation` : « dépend du modèle RBAC final » [021 §16, l.578] → **non tranché**.
- **Règles de validité** : aucune règle de format, d'unicité, de mot de passe ou de cycle de vie de compte n'est énoncée → **non traité dans 020/021**.
- **États / transitions** : **non traité dans 020/021** (aucun état de compte : actif, suspendu, supprimé, etc.).
- **Note** : Supabase Auth figure dans la stack cible [020 §19, l.754], sans modèle de données associé.

---

## E2 — Super Administrateur / `SUPER_ADMIN`

- **Nom exact** : « Super Administrateur » [020 §4.1, l.130] ; `SUPER_ADMIN` [021 §5.1, l.136].
- **Définition** : « Autorité système suprême. » [021 §5.1, l.138] ; « Le Super Administrateur possède le niveau de contrôle maximal. » [020 §4.1, l.132].
- **Périmètre 021** [021 §5.1, l.140-150] : « global ; gestion du système ; gestion des utilisateurs et rôles ; gestion des départements ; gestion des contenus ; gestion des médias ; paramètres ; journaux d'activité ; administration générale. »
- **Capacités 020** [020 §4.1, l.134-144] : « gérer les administrateurs ; gérer les responsables de département ; gérer les rôles et permissions ; accéder à tous les contenus ; accéder à tous les départements ; gérer les paramètres globaux ; consulter les journaux d'activité ; gérer les ressources et médias ; effectuer les opérations d'administration avancées. »
- **Scope** : `GLOBAL` [021 §6.1, l.219].
- **Règle d'exclusion majeure** : « Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière**. » [021 §5.1, l.154] — voir §4 du présent extrait.
- **Contrainte de gouvernance** : « Il constitue le niveau de gouvernance technique et fonctionnelle du Back-Office. » [020 §4.1, l.146].
- **États / transitions** : **non traité dans 020/021**.

---

## E3 — Administrateur / `ADMIN`

- **Nom exact** : « Administrateur » [020 §4.2, l.148] ; `ADMIN` [021 §5.1, l.162].
- **Définition** : « L'Administrateur assure la gestion opérationnelle du site. » [020 §4.2, l.150] ; « Administrateur global du contenu. » [021 §5.1, l.164].
- **Capacités 020** [020 §4.2, l.152-160] : « gérer les contenus éditoriaux autorisés ; gérer les événements ; gérer les publications ; gérer les ressources ; gérer les médias ; gérer les départements ; gérer les données globales du site. »
- **Capacités 021** [021 §5.1, l.166-174] : « gérer les pages éditoriales ; gérer les départements ; gérer les événements ; gérer les publications ; gérer les médias ; **créer les comptes des responsables de département** ; intervenir sur les contenus produits par les responsables. »
- **Interdictions 020 (citations intégrales)** [020 §4.2, l.162-169] :
  - « Il ne peut pas dépasser les privilèges du Super Administrateur. »
  - « créer un Super Administrateur ; »
  - « modifier ses propres privilèges pour devenir supérieur ; »
  - « modifier les mécanismes de sécurité ; »
  - « accéder aux fonctions réservées à la gouvernance du système. »
- **Interdiction 021** : « Il ne peut pas créer ou modifier un compte SUPER_ADMIN. » [021 §5.1, l.176].
- **Scope** : `GLOBAL` « pour les ressources globales qui lui sont attribuées » [021 §6.1, l.220].
- **Accès aux demandes de prière** : **Oui** (lecture + validation/archivage) [021 §12.3, l.487] — exception au principe « lecture strictement réservée aux Admins ».
- **États / transitions** : **non traité dans 020/021**.

---

## E4 — Responsable de département / `DEPARTMENT_MANAGER`

- **Nom exact** : « Responsable de département » [020 §4.3, l.171] ; `DEPARTMENT_MANAGER` [021 §5.1, l.180].
- **Définition** : « Rôle technique générique correspondant aux responsables de département. » [021 §5.1, l.182].
- **Instances métier actuelles** : « **Responsable Presse** » et « **Responsable Ecodume** » [021 §5.1, l.186-187].
- **Attribut déterminant** : « Le département associé détermine leur périmètre. » [021 §5.1, l.189]. Exemples littéraux : `` `DEPARTMENT_MANAGER + department_id = PRESSE` `` ou `` `DEPARTMENT_MANAGER + department_id = ECODUME` `` [l.193-197].
- **Interdiction de duplication de rôles** : « Cette modélisation évite de créer des rôles techniques rigides tels que `ROLE_PRESSE` ou `ROLE_ECODUME`. » [021 §5.1, l.199] ; cf. aussi [021 §19, l.691-695] : « Pas de modèle métier fondé sur une multiplication de rôles tels que `ROLE_PRESSE`, `ROLE_ECODUME`, etc. »
- **Capacités** [020 §4.3, l.180-186] : « informations propres à son département ; événements associés ; publications associées ; médias associés ; autres contenus dynamiques associés à son activité. »
- **Interdictions (citations intégrales)** [020 §4.3, l.188-198] : « modifier les pages statiques globales ; modifier la structure du site ; modifier les composants ; modifier le design ; accéder au département d'un autre responsable ; modifier les permissions ; gérer les utilisateurs ; accéder aux fonctions du Super Administrateur ; accéder aux fonctions globales réservées à l'Administrateur. »
- **Autonomie étendue (021)** [021 §7, l.263-271] : « créer ; modifier ; publier ; archiver ; supprimer les publications et événements relevant de son département, selon les règles métier définies. »
- **Scope** : `DEPARTMENT` [021 §6.1, l.222-230] ; « ne peut pas modifier les contenus d'Ecodume. » [l.230].
- **Demandes de prière** : « Non » (soumettre / lire / valider) [021 §12.3, l.488].
- **États / transitions** : **non traité dans 020/021**.

---

## E5 — `Role`

- **Nom exact** : `Role` [020 §20, l.770] ; `Role` [021 §15, l.537].
- **Attributs** : libellé/valeur (`SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER`) [021 §5.1].
- **Relations** : `User └── Role └── Scope` [021 §15, l.536-537] ; `Role → User : 1 → 0..*` [021 §16, l.577].
- **Contraintes** : le rôle est **générique** et c'est le département qui détermine le périmètre [021 §19, l.695] : « Le rôle est générique et le département détermine le périmètre. »
- **Incohérence interne 021** : le document annonce **quatre** rôles mais n'en énumère que **trois** — voir §6.4 (C-I1).
- **États / transitions** : **non traité dans 020/021** (aucun cycle de vie de rôle, aucune notion de rôle personnalisé).

---

## E6 — `Scope`

- **Nom exact** : `Scope` [020 §5, l.209 ; 021 §6, l.203].
- **Valeurs exactes** : `GLOBAL`, `DEPARTMENT`, `PRIVATE` [021 §6.1, l.213/222/232].
- **Définitions littérales** :
  - `GLOBAL` : « L'utilisateur peut agir sur l'ensemble du périmètre autorisé par son rôle. » [021 §6.1, l.215].
  - `DEPARTMENT` : « L'utilisateur agit uniquement dans le département auquel il est associé. » [021 §6.1, l.224].
  - `PRIVATE` : « La ressource est soumise à une politique d'accès restreinte. `PRIVATE` ne signifie pas nécessairement « appartenant à un utilisateur ». Il désigne un périmètre de confidentialité particulier. » [021 §6.1, l.234-238].
- **Cardinalité** : `Scope → autorisation : dépend du modèle RBAC final` [021 §16, l.578] → **non tranché**.
- **États / transitions** : **non traité dans 020/021**.

---

## E7 — `Permission`

- **Nom exact** : « Permission » [020 §20, l.771].
- **Modèle** : `Role + Permission + Scope` [020 §20, l.768-774].
- **Permissions explicitement nommées** [020 §20, l.786-792] :
  `` publication.create ``, `` publication.read ``, `` publication.update ``, `` event.create ``, `` event.update ``, `` department.update ``, `` media.manage ``.
- **Règle** : « Une requête API doit vérifier : 1. l'identité de l'utilisateur ; 2. son rôle ; 3. sa permission ; 4. son périmètre ; 5. la propriété de la ressource concernée. » [020 §20, l.795-801].
- **Non traité** : aucune permission de type `publication.delete`, `publication.publish`, `publication.archive`, `event.delete`, `user.*`, `prayer.*`, `media.read` n'est nommée. **020/021 ne fournissent pas de catalogue de permissions** ; 021 ne mentionne même pas l'entité `Permission`.
- **États / transitions** : **non traité dans 020/021**.

---

## E8 — Département / `Department`

- **Nom exact** : « Département » [020 §6, l.244] ; `Department` [021 §4, l.93].
- **Définition** : « Le **Département** représente une unité organisationnelle de l'église. » [021 §4, l.93]. « Il constitue notamment le périmètre d'autonomie des responsables de département. » [021 §4, l.95].

### Attributs cités (libellés métier, types non spécifiés)

| Attribut | Source | Obligatoire ? |
|---|---|---|
| `Nom` | [020 §6.1, l.267] ; [020 §11, l.489] | non précisé |
| `Description` | [020 §6.1, l.268] ; [020 §11, l.490] | non précisé |
| `Responsable` | [020 §6.1, l.269] ; [020 §11, l.493] | non précisé |
| `Image` | [020 §6.1, l.270] ; [020 §11, l.492] | non précisé |
| `Présentation` | [020 §6.1, l.271] ; [020 §11, l.491] | non précisé |
| `Informations complémentaires` | [020 §6.1, l.272] ; [020 §11, l.494] | non précisé |
| `Visibilité` | [020 §6.1, l.273] | non précisé |
| `id` | [020 §5, l.226] (`Department.id = Press`) | non précisé |
| nom d'affichage | [021 §4, l.109] | non précisé |
| identifiant métier (`ECODUME`) | [021 §4, l.110] | non précisé |
| slug (`ecodume`) | [021 §4, l.111] | non précisé |

- **Propriétés structurelles réservées à l'administration** (exemples, non tranchés) [020 §11, l.501-508] : « `slug` ; `ordre d'affichage` ; `structure de navigation` ; `identifiants techniques` ; `règles de visibilité globales` ; `configuration système` » — et « La frontière exacte entre ces propriétés sera déterminée après l'audit du frontend et la conception détaillée du modèle de données. » [l.510].

### Catégories de départements (020 §6)

- **Départements de présentation** [020 §6.1, l.252-262] : « Serviteurs ; Chorale Grand Groupe CCVJ ; Chorale de Cano Vocal ; Affaire sociale ; D'hygiène et Ancien semence ; Protocol ; Évangélisation ; Intercession ; autres départements futurs. »
  - Règle : « mais ils ne génèrent pas automatiquement un compte utilisateur. » [l.276].
- **Départements disposant d'un espace métier** [020 §6.2, l.280-285] : « Press / Ecodume ».
  - Règle : « Ces départements disposent : d'une entité département ; d'un responsable ; d'un compte utilisateur ; d'un périmètre d'autorisation ; de données dynamiques propres. » [l.287-293].
  - Règle : « Cette distinction doit être native dans le modèle de données. » [l.295].

### Départements (021 §4)

- « Départements explicitement concernés par le back-office spécialisé » : « **Presse** ; **Ecodume** ; **Affaires Sociales** » [l.99-101].
- « Toutefois, seuls **Presse** et **Ecodume** disposent actuellement d'un espace de gestion départemental dédié. » [l.103].
- **Ecodume** [l.105-113] : « nom d'affichage : **Ecodume** ; identifiant métier : `ECODUME` ; slug : `ecodume` ».
  - Invariant : « Le nom est porté par l'entité Département et ne doit pas être codé en dur dans le RBAC. » [l.113] = invariant **I12** [021 §17, l.632-634] : « Ecodume est une donnée de département. Le nom ne doit pas être utilisé comme mécanisme RBAC codé en dur. »
- **Affaires Sociales** [l.115-124] : « `HouseGroup` n'est pas une entité métier autonome. Il correspond au département : nom : **Affaires Sociales** ; slug : `affaires-sociales` » ; « Aucune table `HouseGroup` n'est donc nécessaire à ce stade. »

### Relations et cardinalités (021 §16)

| Relation | Cardinalité | Ligne |
|---|---|---|
| Department → Publication | 1 → 0..* | l.570 |
| Department → Event | 1 → 0..* **ou selon la décision finale sur les événements globaux** | l.571 |
| Department → Department Manager | 1 → 0..* | l.572 |
| Department → MediaAccess | 1 → 0..* | l.574 |

- **Arbre 021 §15, l.543-546** : « Department ├── Publication ├── Event └── accès autorisés aux Media ».

### États / transitions

**Non traité dans 020/021** : aucun état de département (actif/inactif/archivé) n'est défini.

---

## E9 — Publication / `Publication`

- **Nom exact** : « Publications » [020 §8, l.356] ; `Publication` [021 §8, l.279].
- **Définition** : « La **Publication** représente un contenu éditorial publié par un département. » [021 §8, l.281].

### Attributs

| Attribut | Source | Obligatoire ? |
|---|---|---|
| `department_id` | [021 §8.1, l.285] ; [021 §17 I1, l.588] | **Obligatoire** — « Chaque publication possède obligatoirement un `department_id`. » |
| état (`DRAFT`/`PUBLISHED`/`ARCHIVED`) | [021 §8.2, l.299-303] | implicite |
| médias référencés | [021 §11, l.431] (« peut référencer un ou plusieurs médias ») | facultatif (0..*) |
| Titre, Description, texte, image, verset | [020 §14, l.599-604] — liste générique « Contenu » | non précisé |

- **Type** : non spécifié dans 020/021. **Aucune** autre colonne (slug, date de publication, auteur, catégorie) n'est nommée.

### Relations et cardinalités

- `Department → Publication : 1 → 0..*` [021 §16, l.570].
- `Publication → Media : 1 → 0..*` [021 §16, l.575].
- `Publication ├── Department └── Media` [021 §15, l.552-554].
- **Modèle d'unicité** [020 §9, l.406-422] : pas de `PublicationPress` / `PublicationEcodume` / `PublicationAdmin` ; un seul type `Publication` avec « department / owner scope ».

### Contraintes de validité

- **I1** [021 §17, l.586-588] : « Une publication appartient à un département — `Publication.department_id` est obligatoire. »
- **I4** [021 §17, l.600-602] : « Une publication ne peut utiliser qu'un média autorisé — Cette règle doit être vérifiée par le backend. »
- **I5** [021 §17, l.604-606] : « Les brouillons ne comptent pas dans l'archivage. »
- **I6** [021 §17, l.608-610] : « L'archivage est persistant. »
- **I7** [021 §17, l.612-614] : « L'archivage est indépendant par département. »
- **§11** [l.431-439] : vérification média↔département, côté backend.

### États et transitions

Trois états [021 §8.2, l.299-303] : `DRAFT`, `PUBLISHED`, `ARCHIVED`.

Transition canonique [020 §8, l.360-368] :

```text
BROUILLON → PUBLIÉ → ARCHIVÉ
```

Transitions détaillées : voir §3.1–§3.3 du présent extrait (archivage des publications).

---

## E10 — Événement / `Event`

- **Nom exact** : « Événements » [020 §10, l.441] ; `Event` [021 §9, l.358].
- **Définition** : « L'**Événement** représente une activité annoncée sur le site. » [021 §9, l.360].

### Attributs (020 §10, l.447-456 — liste intégrale, types non spécifiés)

```text
Titre
Description
Date
Heure
Lieu
Image
Département
Statut
```

- **021 ajoute** : `department_id` (dont le caractère obligatoire est **à trancher** — [021 §9, l.362-364] et [021 §20.1, l.705-708]) ; des **dates** servant à un statut temporel [021 §9, l.366].
- **Type** : non spécifié dans 020/021.

### Relations et cardinalités

- `Department → Event : 1 → 0..* ou selon la décision finale sur les événements globaux` [021 §16, l.571].
- Relation avec un département : « Le modèle existant prévoit déjà une relation possible avec un département. » [021 §9, l.362].
- **Relation Média ↔ Événement** : citée uniquement comme usage [020 §7, l.348 : `Média └── Événement`]. **Aucune relation `Event → Media` n'est modélisée dans 021** → non traité dans 021.

### Contraintes et règles

- « Les responsables Press et Ecodume peuvent proposer/gérer les événements relevant de leur département. » [020 §10, l.458].
- « L'Administrateur peut gérer les événements globaux. » [020 §10, l.460] — **voir §3.7, point déterminant**.
- « Le Super Administrateur dispose d'un accès complet. » [020 §10, l.462].
- « Le statut temporel d'un événement peut rester calculé à partir de ses dates ; il ne doit pas être confondu avec l'état éditorial d'une publication. » [021 §9, l.366].
- **Absence remarquable** : **aucun invariant (I1–I12) ne porte sur `Event`** dans [021 §17, l.586-634].

### États et transitions

- **020** : `Statut` figure comme attribut [l.455] mais « **aucune** valeur d'état n'est énumérée ».
- **021** : aucun état d'événement défini ; seul le « statut temporel » calculé est mentionné [l.366].
- **Workflow éditorial d'événement** : à préciser [020 §10, l.464-476] et **tranché différemment (implicitement)** par [021 §7, l.273] — voir §6.3 (C-3).

---

## E11 — Média / `Media`

- **Nom exact** : « Médiathèque » [020 §7, l.299] ; « Média » [021 §10, l.370].
- **Définition** : « Le **Média** représente une ressource audiovisuelle ou graphique de la bibliothèque média centrale. » [021 §10, l.372].

### Attributs

| Attribut | Source | Statut |
|---|---|---|
| `department_id` | [021 §10.1, l.382] | **Non retenu** : « `Media.department_id` n'est pas le modèle retenu. » |
| type MIME | [021 §20.3, l.729] | **à définir** |
| taille maximale | [021 §20.3, l.730] | **à définir** |
| buckets | [021 §20.3, l.731] | **à définir** |
| variantes / thumbnails | [021 §20.3, l.732] | **à définir** |
| politique d'accès | [021 §20.3, l.733] | **à définir** |
| suppression | [021 §20.3, l.735] | **à définir** |
| médias orphelins | [021 §20.3, l.736] | **à définir** |

- **Attributs techniques NON manipulés par l'utilisateur** [020 §7, l.319-326] : « bucket ; object path ; URL Storage ; UUID ».
- **Vocabulaire utilisateur** [020 §7, l.328-335] : « Image ; Photo ; Vidéo ; Document ».
- **Stockage** : « Les fichiers sont stockés dans **Supabase Storage**. » [020 §7, l.317].

### Relations et cardinalités

- `Media → MediaAccess : 1 → 0..*` [021 §16, l.573].
- `Media └── MediaAccess └── Department` [021 §15, l.548-550].
- `Média ├── Hero ├── Département ├── Publication ├── Événement └── Ressource` [020 §7, l.343-350].
- `Publication → Media : 1 → 0..*` [021 §16, l.575].

### Contraintes

- **I3** [021 §17, l.594-598] : « Un média n'appartient pas à un département — La bibliothèque média est globale. Les permissions d'utilisation sont séparées de l'appartenance. »
- **I4** [021 §17, l.600-602] : média autorisé obligatoire dans une publication, vérifié par le backend.
- **§11** [021, l.433-437] : « Le backend doit vérifier que chaque média référencé est utilisable par le département de la publication. » + exemple : « Une publication Ecodume ne peut pas référencer un média réservé à Presse. »
- **§10.3** [l.415-425] : trois droits distincts (utiliser / modifier / supprimer) ; vérification à la création, la modification et la publication.

### États / transitions

**Non traité dans 020/021** : aucun état de média (uploadé, en cours, remplacé, supprimé) n'est défini.

---

## E12 — `MediaAccess`

- **Nom exact** : `MediaAccess` [021 §10.2, l.403].
- **Définition** : « une relation de type : `MediaAccess` entre le média et les départements autorisés. » [021 §10.2, l.401-405].
- **Attributs** : **aucun attribut nommé** dans 021 (pas de dates, pas de qui a accordé l'accès, pas de portée). Le contenu exact de la relation est à définir [021 §20.3, l.734 : « relation `MediaAccess` »].
- **Cardinalités** [021 §16] : `Media → MediaAccess : 1 → 0..*` (l.573) ; `Department → MediaAccess : 1 → 0..*` (l.574).
- **Sémantique autorisée (littérale)** [021 §10.2, l.390-395] : « accessible à Presse et Ecodume ; accessible uniquement à Ecodume ; accessible uniquement à Presse ; accessible à tous. »
- **Gouvernance** : « La gestion de cette autorisation appartient à l'Admin/Super Admin. » et « Un responsable départemental ne peut pas s'accorder lui-même un accès. » [021 §10.2, l.407-409].
- **États / transitions** : **non traité dans 020/021**.

---

## E13 — `PrayerRequest` / Demande de prière

- **Nom exact** : « Demande de prière » [021 §12, l.443] ; `PrayerRequest` [021 §12, l.445].
- **Définition** : « La **PrayerRequest** est une entité métier privée. Elle représente une demande de prière soumise depuis le site public. » [021 §12, l.445-447].

### Attributs

| Attribut | Source | Statut |
|---|---|---|
| contenu / texte de la prière | [021 §13, l.500] ; [021 §14, l.527] | présent, **chiffré** (mécanisme à définir) |
| nom | [021 §12.1, l.453] | **facultatif** : « anonymement ; ou avec son nom. » |
| adresse e-mail | [021 §12.1, l.456] | **non requis** : « Aucune adresse e-mail ou numéro de téléphone n'est requis à ce stade. » |
| numéro de téléphone | [021 §12.1, l.456] | **non requis** (idem) |
| `Scope` | [021 §15, l.557] | `PRIVATE` |
| `Audience` | [021 §15, l.558] | `ADMIN` |

- **Type** : non spécifié dans 020/021. **Aucune** date de réception, aucun identifiant de soumission, aucun statut de lecture n'est nommé.

### Relations et cardinalités

- `PrayerRequest ├── Scope = PRIVATE └── Audience = ADMIN` [021 §15, l.556-558].
- `PrayerRequest └── Notification` [021 §15, l.560-561].
- `PrayerRequest → Notification : 1 → 0..*` [021 §16, l.576].

### Contraintes

- **I8** [021 §17, l.616-618] : « Une demande de prière validée devient archivée — La validation par un Admin entraîne le passage à `ARCHIVED`. »
- **I9** [021 §17, l.620-622] : « Une demande de prière reste conservée après archivage — L'archivage ne supprime pas la demande. »
- **I10** [021 §17, l.624-626] : « Super Admin ne lit pas les demandes de prière — Cette règle constitue une exception explicite au caractère global du rôle. »
- **Interdiction d'exposition** : « Le backend ne doit donc jamais exposer le texte en clair à un acteur non autorisé. » [021 §13, l.511].

### États et transitions

Deux états seulement [021 §12.2, l.462-465] : `PENDING`, `ARCHIVED`.

- `PENDING` : « Nouvelle demande reçue et non encore validée. » [l.469].
- `ARCHIVED` : « Demande validée par un Admin. » [l.473].
- « L'archivage ne signifie pas suppression. La demande reste conservée dans l'historique. » [l.475-477].
- **Transition autorisée** : `PENDING → ARCHIVED` par validation d'un Admin. **Aucune transition inverse, aucune suppression, aucun état `REJECTED`/`READ`/`SPAM` n'est défini** → non traité dans 020/021.

---

## E14 — `Notification`

- **Nom exact** : `Notification` [021 §14, l.515].
- **Définition / déclencheur** : « La création d'une demande de prière génère une **notification destinée aux Admins**. » [021 §14, l.517].
- **Attributs** : **aucun attribut nommé**. Exemple de contenu littéral : « > Nouvelle demande de prière reçue. » [021 §14, l.525]. Type non spécifié.
- **Relations** : `PrayerRequest └── Notification` [021 §15, l.560-561] ; `1 → 0..*` [021 §16, l.576].
- **Contraintes** :
  - « La notification doit être persistée afin que l'information ne dépende pas de la présence simultanée d'un Admin en ligne. » [021 §14, l.519].
  - « La notification ne doit pas divulguer le contenu privé de la demande à un acteur non autorisé. » [021 §14, l.521].
  - « Le texte de la prière reste protégé par la politique de confidentialité de `PrayerRequest`. » [021 §14, l.527].
- **États / transitions** : **non traité dans 020/021** (aucun état lu/non lu, aucun canal d'acheminement — e-mail, in-app, etc. — n'est spécifié).

---

## E15 — Page

- **Nom exact** : « Pages statiques » [020 §12, l.514] ; « pages éditoriales structurées » [021 §2.1, l.30].
- **Modèle imposé** [020 §12, l.516-530] :

```text
Page
   │
   ├── Section
   │      ├── type
   │      ├── variante
   │      └── données
   │
   ├── Section
   └── Section
```

- **Règle** : « Les pages ne doivent pas être modélisées comme des documents libres. » [020 §12, l.516] ; « La structure visuelle reste définie par le frontend. Le Back-Office fournit les données nécessaires aux sections administrables. » [020 §12, l.532-534].
- **Invariant I11** [021 §17, l.628-630] : « Les pages ne sont pas librement composables — Le back-office ne peut pas créer arbitrairement des sections ou modifier la structure visuelle. »
- **Pages éditoriales canoniques** [021 §3, l.66-77] :
  1. **Accueil** 2. **Qui sommes-nous** 3. **Événements** 4. **Où nous trouver** 5. **Faire un don** 6. **Communauté** 7. **Organisation** 8. **[Département]**
  - « Les sept premières correspondent à des structures éditoriales déterminées. » [l.77].
  - « `[Département]` est un **template dynamique** : il n'est pas une page statique supplémentaire. Il permet de présenter un département à partir de son identifiant/slug. » [l.79].
- **Règle particulière — Organisation** [021 §3, l.81-88] : « `/organisation` reste une seule page. Les départements ne deviennent pas des routes permanentes sous `/organisation`. Un département peut être consulté contextuellement à partir de son slug, d'un bouton ou d'un lien. »
- **Structure d'exemple — Accueil** [020 §12, l.538-550] : « Hero ; BibleVerse ; Mot du pasteur ; Présentation ; Événements à venir ; Derniers enseignements ; Communauté ; Prière ; Soutenir l'église » — suivi de : « Cela ne signifie pas que toutes ces sections deviennent éditables. C'est précisément l'objet de l'**audit stratégique du frontend** qui suivra ce document. » [l.552-554].
- **Attributs de Page nommés** : **aucun** (pas de slug, titre, meta, statut). **Non traité** ; le modèle éditorial des pages reste à formaliser [021 §20.4, l.738-748] : « page ; sections autorisées ; variantes ; champs éditables ; validation Zod ; fallback ; contenu vide. »
- **États / transitions** : **non traité dans 020/021** pour l'entité Page elle-même.

---

## E16 — Section

- **Nom exact** : « Section » [020 §12, l.523].
- **Attributs littéraux** [020 §12, l.524-526] : `type`, `variante`, `données`. Types non spécifiés.
- **Contraintes** :
  - Le back-office ne compose pas librement : I11 [021 §17, l.628-630].
  - « Le Back-Office ne modifie pas la structure de `BibleVerse`. Il fournit uniquement les données nécessaires : verset ; référence biblique ; image éventuelle » [020 §2.2, l.81-87].
  - **Comportement obligatoire en absence de données dynamiques** [020 §13, l.560-586] : « Une section qui consomme des données dynamiques doit posséder un comportement défini lorsque ces données sont absentes. » Comportements possibles : « masquer la section ; afficher un état vide ; afficher un message éditorial ; afficher un CTA alternatif ; utiliser un contenu de remplacement. » Et : « Le comportement ne doit pas être laissé au hasard. Il doit être déterminé par la conception de chaque composant. » [l.584-586].
- **Exclusions** [021 §19, l.673-681] : « Pas d'entité permettant de créer librement : des sections ; des blocs arbitraires ; des mises en page ; des grilles ; des variantes graphiques non prévues. »
- **États / transitions** : **non traité dans 020/021**.

---

## E17 — Ressource

- **Nom exact** : « Ressources » [020 §3, l.118 ; §15, l.646].
- **Mentions** : contenu administrable [020 §3, l.118] ; capacité Super Admin « gérer les ressources et médias » [020 §4.1, l.143] ; capacité Admin « gérer les ressources » [020 §4.2, l.157] ; nœud de navigation « Contenu ├── Pages ├── Ressources └── Médias » [020 §15, l.644-647] ; ligne de matrice « Ressources globales » [020 §18, l.725] ; contexte d'usage média [020 §7, l.349].
- **Attributs, relations, contraintes, états** : **non traité dans 020/021**. L'entité « Ressource » n'est jamais définie dans 021 (elle n'apparaît pas dans le modèle métier).

---

## E18 — Journal d'activité / Audit

- **Nom exact** : « Audit » [020 §3, l.119] ; « journaux d'activité » [020 §4.1, l.142] ; « Journal d'activité » [020 §15, l.656] ; « Journaux d'activité » [021 §7, l.258].
- **Attributs** : **aucun** n'est nommé. **Non traité dans 020/021.**
- **Droits** : Super Admin : « Oui » [021 §7, l.258] / « ✓ » [020 §18, l.729]. Admin : « selon politique » [020 §18, l.729] et « Selon périmètre » [021 §7, l.258] — **la politique et le périmètre ne sont définis nulle part** → question ouverte. Responsable : « — » [020 §18, l.729] / « Non » [021 §7, l.258].
- **Rattachement à la cryptographie** : « audit des accès » fait partie des points à formaliser [021 §20.2, l.723].
- **États / transitions** : **non traité dans 020/021**.

---

## E19 — Configuration / paramètres globaux

- **Nom exact** : « Configuration » [020 §14, l.619 ; §15, l.657] ; « Paramètres globaux » [021 §7, l.257].
- **Contenu** [020 §14, l.623-629] : « permissions ; rôles ; règles ; structure ; paramètres techniques. »
- **Règle d'exclusion** : « Cette dernière catégorie ne doit pas être exposée aux responsables de département. » [020 §14, l.631].
- **Droits** : Super Admin « gérer les paramètres globaux » [020 §4.1, l.141] ; Admin « Selon périmètre » [021 §7, l.257] et « — » pour « Configuration système » [020 §18, l.728] ; Responsable « Non » [021 §7, l.257] / « — » [020 §18, l.728].
- **États / transitions** : **non traité dans 020/021**.

---

## E20 — Composants réutilisables (code, hors modèle métier)

- **Nom exact** [020 §2.2, l.89-99] : « Hero ; Card ; Section événement ; Section publication ; Call-to-action ; Gallery ; etc. »
- **Exemple détaillé** [020 §2.2, l.74-79] : « BibleVerse ├── variante image ├── variante éditoriale └── variante minimale ».
- **Règles** :
  - « Le frontend doit pouvoir encapsuler les structures récurrentes dans des composants réutilisables. » [020 §2.2, l.70].
  - « Une même structure peut ainsi être utilisée sur plusieurs pages avec des paramètres différents. » [020 §2.2, l.101].
  - « Le Back-Office ne modifie pas la structure de `BibleVerse`. » [020 §2.2, l.81].
  - Interdits d'administration [020 §2.1, l.58-66] : « des classes CSS ; des composants React ; des identifiants techniques ; des URLs Supabase Storage ; des paramètres de mise en page ; des structures JSON ; des propriétés purement techniques. »
  - Dictionnaire de la structure, défini par le code [021 §2.1, l.32-41] : « composition ; ordre des sections ; types de sections autorisés ; variantes visuelles ; grille ; responsive ; animations ; contraintes de présentation. »

---

## E21 — `HouseGroup` (explicitement exclu)

- « `HouseGroup` n'est pas une entité métier autonome. » [021 §4, l.117].
- « Aucune table `HouseGroup` n'est donc nécessaire à ce stade. » [021 §4, l.124].
- « ### Pas de HouseGroup — `HouseGroup` n'est pas une entité autonome. » [021 §19, l.683-685].
- Correspondance : département « nom : **Affaires Sociales** ; slug : `affaires-sociales` » [021 §4, l.121-122].
- **020 ne mentionne pas `HouseGroup`** → non traité dans 020.

---

## E22–E29 — Entités éditoriales au statut non tranché

**Source unique : [021 §20.5, l.750-769].** Citation intégrale :

> « Le modèle doit encore déterminer le statut final des entités actuellement observées dans le frontend, notamment :
> - Leader ;
> - Testimony ;
> - CommunityFace ;
> - Verse ;
> - RhythmEntry ;
> - SocialLink ;
> - ScheduleEntry ;
> - SiteSettings.
>
> Elles doivent être classées explicitement comme :
> - entités métier persistées ;
> - configuration ;
> - contenu éditorial ;
> - données dérivées ;
> - ou données supprimées du périmètre backend. »

- **Attributs, relations, contraintes, états** : **non traités dans 020/021** pour les huit entités.
- **020 ne mentionne aucune de ces huit entités** → non traité dans 020.

---

# 2. Rôles, scopes et autorisations

## 2.1 Liste exacte des rôles

**020** — « Trois catégories fonctionnelles sont retenues. » [020 §4, l.128] :

| # | Rôle (020) | Ligne |
|---|---|---|
| 1 | Super Administrateur | l.130 |
| 2 | Administrateur | l.148 |
| 3 | Responsable de département | l.171 |

**021** — « Le modèle comprend quatre rôles : » [021 §5.1, l.134], puis **trois** blocs :

| # | Rôle (021) | Ligne |
|---|---|---|
| 1 | `SUPER_ADMIN` | l.136 |
| 2 | `ADMIN` | l.162 |
| 3 | `DEPARTMENT_MANAGER` | l.180 |

- **Rôles interdits** : « `ROLE_PRESSE`, `ROLE_ECODUME`, etc. » [021 §19, l.693] ; « rôles techniques rigides tels que `ROLE_PRESSE` ou `ROLE_ECODUME` » [021 §5.1, l.199].
- **Rôles absents des deux documents** : aucun rôle « Visiteur », « Éditeur », « Modérateur », « Membre ». Le « Visiteur » n'apparaît qu'en tant qu'acteur de la table des demandes de prière [021 §12.3, l.485] — **aucun rôle technique ne lui est associé**.

## 2.2 Liste exacte des scopes

| Scope | Définition littérale | Source |
|---|---|---|
| `GLOBAL` | « L'utilisateur peut agir sur l'ensemble du périmètre autorisé par son rôle. » | [021 §6.1, l.215] |
| `DEPARTMENT` | « L'utilisateur agit uniquement dans le département auquel il est associé. » | [021 §6.1, l.224] |
| `PRIVATE` | « La ressource est soumise à une politique d'accès restreinte. » | [021 §6.1, l.234] |

- Formulaire d'autorisation 020 : `ROLE + SCOPE` [020 §5, l.208-210] ; `Role + Permission + Scope` [020 §20, l.768-774].
- Deux questions fondatrices [021 §6, l.207-209] : « **Role = que peut faire l'utilisateur ?** » / « **Scope = sur quelles ressources peut-il le faire ?** ».
- Affection des scopes : `SUPER_ADMIN` → GLOBAL [021 §6.1, l.219] ; `ADMIN` → GLOBAL « pour les ressources globales qui lui sont attribuées » [l.220] ; `DEPARTMENT_MANAGER` → DEPARTMENT [l.222-230] ; `PrayerRequest` → PRIVATE + audience `ADMIN` [l.240-242].

## 2.3 Matrice d'autorisation — 020 §18 (reproduite à l'identique)

Source : [020 §18, l.716-729].

| Fonction | Super Admin | Admin | Resp. Press | Resp. Ecodume |
|---|:---:|:---:|:---:|:---:|
| Tableau de bord | ✓ | ✓ | ✓ | ✓ |
| Pages / contenu global | ✓ | ✓ | — | — |
| Structure éditoriale | ✓ | ✓ | — | — |
| Médias | ✓ | ✓ | périmètre | périmètre |
| Événements | ✓ | ✓ | périmètre | périmètre |
| Publications | ✓ | ✓ | périmètre | périmètre |
| Département | ✓ | ✓ | son département | son département |
| Ressources globales | ✓ | ✓ | — | — |
| Utilisateurs | ✓ | — | — | — |
| Rôles / permissions | ✓ | — | — | — |
| Configuration système | ✓ | — | — | — |
| Audit | ✓ | selon politique | — | — |

- **Réserve explicite** : « **Cette matrice est une base de conception et non encore le contrat définitif de permissions.** » [020 §18, l.731].
- **Note** : cette matrice ne comporte **aucune ligne « Demandes de prière »** et **aucune ligne « Événements globaux »**.

## 2.4 Matrice d'autorisation — 021 §7 (reproduite à l'identique)

Source : [021 §7, l.248-259].

| Ressource | Super Admin | Admin | Responsable département |
|---|---|---|---|
| Utilisateurs | Oui | Création des responsables | Non |
| Rôles / scopes | Oui | Non | Non |
| Départements | Oui | Oui | Lecture / contenu autorisé |
| Pages éditoriales globales | Oui | Oui | Non |
| Événements | Oui | Oui | Son département |
| Publications | Oui | Oui | Son département |
| Médias | Tous | Tous | Médias autorisés |
| Paramètres globaux | Oui | Selon périmètre | Non |
| Journaux d'activité | Oui | Selon périmètre | Non |
| Demandes de prière | **Non** | **Oui** | **Non** |

## 2.5 Matrice `PrayerRequest` — 021 §12.3 (reproduite à l'identique)

Source : [021 §12.3, l.483-488].

| Acteur | Soumettre | Lire | Valider / archiver |
|---|---:|---:|---:|
| Visiteur | Oui | Non | Non |
| Super Admin | Non | **Non** | Non |
| Admin | Non | **Oui** | **Oui** |
| Responsable département | Non | Non | Non |

- Règle conclusive : « La lecture est donc strictement réservée aux Admins. » [021 §12.3, l.490].

## 2.6 Règles d'exclusion explicites (qui ne peut PAS quoi)

| # | Interdiction (citation littérale) | Source |
|---|---|---|
| X1 | « Il ne peut pas dépasser les privilèges du Super Administrateur. » (Admin) | [020 §4.2, l.162] |
| X2 | « créer un Super Administrateur ; » (Admin) | [020 §4.2, l.166] |
| X3 | « modifier ses propres privilèges pour devenir supérieur ; » (Admin) | [020 §4.2, l.167] |
| X4 | « modifier les mécanismes de sécurité ; » (Admin) | [020 §4.2, l.168] |
| X5 | « accéder aux fonctions réservées à la gouvernance du système. » (Admin) | [020 §4.2, l.169] |
| X6 | « Il ne peut pas créer ou modifier un compte SUPER_ADMIN. » (Admin) | [021 §5.1, l.176] |
| X7 | « modifier les pages statiques globales ; » (Responsable) | [020 §4.3, l.190] |
| X8 | « modifier la structure du site ; » (Responsable) | [020 §4.3, l.191] |
| X9 | « modifier les composants ; » (Responsable) | [020 §4.3, l.192] |
| X10 | « modifier le design ; » (Responsable) | [020 §4.3, l.193] |
| X11 | « accéder au département d'un autre responsable ; » (Responsable) | [020 §4.3, l.194] |
| X12 | « modifier les permissions ; » (Responsable) | [020 §4.3, l.195] |
| X13 | « gérer les utilisateurs ; » (Responsable) | [020 §4.3, l.196] |
| X14 | « accéder aux fonctions du Super Administrateur ; » (Responsable) | [020 §4.3, l.197] |
| X15 | « accéder aux fonctions globales réservées à l'Administrateur. » (Responsable) | [020 §4.3, l.198] |
| X16 | « `DEPARTMENT_MANAGER / Presse` ne peut pas modifier les contenus d'Ecodume. » | [021 §6.1, l.228-230] |
| X17 | « Un responsable départemental ne peut pas s'accorder lui-même un accès. » (média) | [021 §10.2, l.409] |
| X18 | « Une publication Ecodume ne peut pas référencer un média réservé à Presse. » | [021 §11, l.437] |
| X19 | « Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière**. » | [021 §5.1, l.154] |
| X20 | « Le Super Admin, malgré son niveau d'autorité système, ne doit pas être techniquement capable de lire le contenu en clair d'une demande de prière. » | [021 §13, l.500] |
| X21 | « Le backend ne doit donc jamais exposer le texte en clair à un acteur non autorisé. » | [021 §13, l.511] |
| X22 | « Le back-office ne peut pas créer arbitrairement des sections ou modifier la structure visuelle. » | [021 §17 I11, l.630] |
| X23 | « Masquer un bouton dans le frontend ne constitue pas une protection suffisante. » | [020 §5, l.240] |
| X24 | « Le frontend ne constitue jamais la source de vérité pour les permissions. » | [020 §19, l.760] |
| X25 | « Cette dernière catégorie ne doit pas être exposée aux responsables de département. » (Configuration) | [020 §14, l.631] |
| X26 | « Il n'existe donc **pas de page builder générique**. » | [021 §2.1, l.60] |
| X27 | « Pas de `media.department_id`. » | [021 §19, l.689] |

## 2.7 Règles de création de comptes et d'attribution de rôle

- **Super Admin** — « gérer les administrateurs ; gérer les responsables de département ; gérer les rôles et permissions » [020 §4.1, l.136-138].
- **Admin** — « créer les comptes des responsables de département » [021 §5.1, l.173].
- **Responsable** — « ils ne génèrent pas automatiquement un compte utilisateur. » [020 §6.1, l.276] (départements de présentation) ; les départements à espace métier disposent au contraire « d'un compte utilisateur » [020 §6.2, l.291].
- **Interdiction** — « Il ne peut pas créer ou modifier un compte SUPER_ADMIN. » [021 §5.1, l.176].
- **Procédure / workflow de création** : « création d'un responsable » est listée parmi les modèles dynamiques UML à produire [021 §21, l.799] — donc **le détail n'est pas traité dans 020/021** (pas d'invitation, pas de mot de passe, pas de validation, pas de délégation).
- **Contradiction 020 ↔ 021** sur ce point : voir §6.3 (C-2).

## 2.8 Contrôles d'accès exigés par le backend

- « Cette restriction doit être appliquée **dans le backend**, et non uniquement dans l'interface. » [020 §5, l.238].
- « Le backend reste responsable de l'application des règles métier et des autorisations. » [020 §19, l.758].
- 5 vérifications par requête API : identité, rôle, permission, périmètre, propriété de la ressource [020 §20, l.795-801].
- « Le backend doit vérifier l'autorisation du média lors de la création, modification et publication d'un contenu. » [021 §10.3, l.425].
- « Cette règle doit être appliquée côté backend et non uniquement dans l'interface. » (média autorisé) [021 §11, l.439].
- Invariant I2 [021 §17, l.590-592] : « Un `DEPARTMENT_MANAGER` ne peut agir que sur les ressources autorisées de son `department_id`. »

---

# 3. Règles métier

> Chaque règle est numérotée, citée littéralement et localisée. **Total : 64 règles** (R1–R64).

## 3.1 Règle d'archivage des publications et mécanique de concurrence

**R1 — Indépendance par département.** [021 §8.3, l.327] : « La règle est indépendante pour chaque département. »

**R2 — Règle des trois publications (texte normatif intégral).** [021 §8.3, l.329-333] :

> « Pour un département donné :
> 1. les trois publications publiées les plus récentes restent `PUBLISHED` ;
> 2. lorsqu'une quatrième publication est publiée ;
> 3. la plus ancienne des trois précédentes devient `ARCHIVED`. »

**R3 — Exemple normatif d'application.** [021 §8.3, l.335-350] :

> « Exemple :
> `P1 → P2 → P3`
> Les trois sont publiées.
> Publication de `P4` :
> `P1 → ARCHIVED`
> `P2 → PUBLISHED`
> `P3 → PUBLISHED`
> `P4 → PUBLISHED`
> Publication de `P5` :
> `P2 → ARCHIVED` »

**R4 — Les brouillons sont exclus du calcul.** [021 §8.3, l.352] : « Les brouillons ne participent jamais à ce calcul. » ; renforcé par l'invariant **I5** [021 §17, l.604-606] : « Seules les publications `PUBLISHED` participent à la règle des trois dernières publications. » ; et [021 §8.2, l.309] : « Elle n'est pas considérée dans la limite des trois publications publiées. »

**R5 — Cycles indépendants Presse / Ecodume.** [021 §8.3, l.354] : « Presse et Ecodume disposent de cycles d'archivage indépendants. » ; invariant **I7** [021 §17, l.612-614] : « La publication d'un département ne déclenche pas l'archivage d'un autre. »

**R6 — L'archivage n'est pas une action manuelle arbitraire.** [020 §8.3, l.389-391] : « L'archivage n'est toutefois **pas simplement une action manuelle arbitraire**. Il dépend d'une règle métier basée sur le nombre de publications récentes. »

**R7 — Éléments que la règle doit déterminer (020, liste littérale).** [020 §8.3, l.393-398] : « le seuil de publications récentes ; le périmètre du calcul ; le moment où une publication devient éligible à l'archivage ; si l'archivage est automatique ou déclenché par l'administrateur. »

**R8 — Seuil : non défini dans 020.** [020 §8.3, l.400] : « **La valeur exacte du seuil reste à définir.** » — valeur fixée à trois par 021 (§8.3) ; voir §6.3 (C-4).

**R9 — L'archivage est un état persistant, pas un calcul.** [021 §8.2, l.319-321] : « L'archivage est un **état métier persistant**. Il ne doit pas être simplement calculé à la volée. » ; invariant **I6** [021 §17, l.608-610] : « Une publication archivée reste explicitement dans l'état `ARCHIVED`. »

**R10 — L'archivage est une capacité du responsable.** [021 §7, l.263-271] : le responsable peut « créer ; modifier ; publier ; archiver ; supprimer les publications et événements relevant de son département, selon les règles métier définies. »

> **Mécanique de concurrence : non traitée dans 020/021.** Aucun des deux documents n'énonce quoi que ce soit sur : transactions, verrous (`lock`), isolation, concurrence d'accès, publication simultanée de deux publications dans un même département, ordre de départage à date égale, idempotence, ou résolution de conflit. Le mot « concurrence » et tout équivalent (verrou, transaction, race condition) **n'apparaît nulle part**. Le seul indice d'ordonnancement est l'adjectif « les plus récentes » [021 §8.3, l.331], sans définition du critère de récence (date de publication ? de création ? d'archivage ?) — **la base de tri n'est pas spécifiée**.

## 3.2 États des publications

**R11 — Trois états, nomenclature littérale.** [021 §8.2, l.299-303] : « Les états métier sont : `DRAFT` / `PUBLISHED` / `ARCHIVED` ».

**R12 — États (020, nomenclature française).** [020 §8, l.360-368] : « BROUILLON → PUBLIÉ → ARCHIVÉ ».

**R13 — `DRAFT` / Brouillon.** [021 §8.2, l.307] : « Publication en préparation. » ; [020 §8.1, l.372-379] : « Le contenu existe mais n'est pas visible publiquement. Il peut être : créé ; modifié ; complété ; préparé avant publication. »

**R14 — `PUBLISHED` / Publié.** [021 §8.2, l.313] : « Publication actuellement publiée. » ; [020 §8.2, l.383] : « Le contenu est disponible sur le site public. »

**R15 — `ARCHIVED` / Archivé.** [021 §8.2, l.317] : « Publication historiquement conservée mais sortie du groupe des publications actuellement publiées. » ; [020 §8.3, l.387] : « Le contenu n'est plus considéré comme faisant partie des publications récentes. »

**R16 — Transition déclenchée par la publication d'une quatrième.** [021 §8.3, l.331-333] (cf. R2).

**R17 — Workflow commun.** [020 §8, l.358] : « Les publications utilisent un workflow commun. »

**R18 — Pas de type de publication par département.** [020 §9, l.406-422] : « Nous ne créons pas : `PublicationPress` `PublicationEcodume` `PublicationAdmin` mais : `Publication └── department / owner scope` ».

**R19 — Périmètres de gestion des publications.** [020 §9, l.426-435] : « Administrateur → toutes les publications autorisées ; Responsable Press → publications Press ; Responsable Ecodume → publications Ecodume. »

**R20 — Finalité de l'architecture unifiée.** [020 §9, l.437] : « Cela permet de conserver une architecture unifiée tout en maintenant la séparation des responsabilités. »

**R21 — Transition `PENDING → ARCHIVED` pour les demandes de prière** (voir §3.3).

**R22 — Aucun état de suppression/`UNPUBLISHED`/`SCHEDULED`/`REVIEW` n'existe.** Absence vérifiée sur l'ensemble des états énumérés [020 §8, 021 §8.2] → **non traité dans 020/021** (aucune publication programmée, aucune dépublication, aucune modération).

## 3.3 États des demandes de prière

**R23 — Deux états.** [021 §12.2, l.462-465] : « Les états sont : `PENDING` / `ARCHIVED` ».

**R24 — `PENDING`.** [021 §12.2, l.469] : « Nouvelle demande reçue et non encore validée. »

**R25 — `ARCHIVED`.** [021 §12.2, l.473] : « Demande validée par un Admin. »

**R26 — L'archivage ne supprime pas.** [021 §12.2, l.475-477] : « L'archivage ne signifie pas suppression. La demande reste conservée dans l'historique. » ; invariant **I9** [021 §17, l.620-622] : « L'archivage ne supprime pas la demande. »

**R27 — Validation = archivage.** Invariant **I8** [021 §17, l.616-618] : « La validation par un Admin entraîne le passage à `ARCHIVED`. »

**R28 — Validation réservée à l'Admin.** [021 §12.3, l.487] : colonne « Valider / archiver » = **Oui** pour Admin uniquement.

**R29 — Aucun état supplémentaire** (`READ`, `REJECTED`, `SPAM`, `PUBLISHED`, suppression) : **non traité dans 020/021**.

## 3.4 Périmètre des médias et droits d'accès

**R30 — Bibliothèque globale unique.** [021 §10.1, l.376-378] : « Tous les médias appartiennent à une **bibliothèque globale unique**. Il n'existe pas de bibliothèque média physiquement séparée par département. »

**R31 — `Media.department_id` rejeté.** [021 §10.1, l.382] : « `Media.department_id` n'est pas le modèle retenu. » ; invariant **I3** [021 §17, l.594-598] et exclusion [021 §19, l.687-689] : « Pas de Media par département — Pas de `media.department_id`. »

**R32 — Accès contrôlé par politique.** [021 §10.2, l.388] : « L'accès à un média est contrôlé par une politique d'autorisation. »

**R33 — Quatre cas d'accès.** [021 §10.2, l.390-395] : « accessible à Presse et Ecodume ; accessible uniquement à Ecodume ; accessible uniquement à Presse ; accessible à tous. »

**R34 — Modèle `Media` + `MediaAccess`.** [021 §10.2, l.397-405] : « Le modèle conceptuel repose donc sur : `Media` et une relation de type : `MediaAccess` entre le média et les départements autorisés. »

**R35 — Gouvernance des accès.** [021 §10.2, l.407-409] : « La gestion de cette autorisation appartient à l'Admin/Super Admin. Un responsable départemental ne peut pas s'accorder lui-même un accès. »

**R36 — Trois opérations distinctes.** [021 §10.3, l.415-421] : « Il faut distinguer : 1. **Utiliser** un média dans un contenu ; 2. **Modifier** un média ; 3. **Supprimer** un média. Ces droits ne sont pas équivalents. »

**R37 — Droit d'usage sans droit de modification.** [021 §10.3, l.423] : « Un responsable peut être autorisé à utiliser un média sans disposer du droit de modifier ou supprimer la ressource centrale. »

**R38 — Vérification à trois moments.** [021 §10.3, l.425] : « Le backend doit vérifier l'autorisation du média lors de la création, modification et publication d'un contenu. »

**R39 — Vérification média↔département de la publication.** [021 §11, l.433] : « Le backend doit vérifier que chaque média référencé est utilisable par le département de la publication. » ; **I4** [021 §17, l.600-602].

**R40 — Interdiction croisée entre départements.** [021 §11, l.437] : « Une publication Ecodume ne peut pas référencer un média réservé à Presse. »

**R41 — Application côté backend.** [021 §11, l.439] : « Cette règle doit être appliquée côté backend et non uniquement dans l'interface. »

**R42 — Médiathèque centralisée : capacités exigées.** [020 §7, l.305-316] : « l'import d'un média ; la prévisualisation ; la recherche ; le filtrage ; la sélection d'un média ; la réutilisation d'un média ; le remplacement éventuel d'un fichier ; la suppression selon les règles définies ; la consultation des informations du média. » Et [020 §7, l.301] : « Le système doit comporter une **véritable médiathèque centralisée**. Elle constitue le point d'entrée principal pour la gestion des fichiers. »

**R43 — Abstraction technique.** [020 §7, l.317-337] : « Les fichiers sont stockés dans **Supabase Storage**. Cependant, l'utilisateur ne manipule pas directement : bucket / object path / URL Storage / UUID. Il manipule : Image / Photo / Vidéo / Document. Le système fournit ensuite le lien technique nécessaire au frontend. »

**R44 — Réutilisation multi-contextes.** [020 §7, l.341-352] : « Un même média doit pouvoir être utilisé dans plusieurs contextes : Média ├── Hero ├── Département ├── Publication ├── Événement └── Ressource » ; « Le système doit donc éviter les duplications inutiles. »

**R45 — « Suppression selon les règles définies » : les règles ne sont pas définies.** [020 §7, l.314] renvoie à des règles non énoncées dans 020 ; 021 §20.3 les laisse à définir (« suppression ; médias orphelins », l.735-736) → **non traité dans 020/021**.

## 3.5 Structure des pages éditoriales et périmètre du back-office

**R46 — Principe de séparation structure/contenu.** [021 §2.1, l.30-50] : « Les pages publiques sont des **pages éditoriales structurées**. La structure d'une page est définie par le code : composition ; ordre des sections ; types de sections autorisés ; variantes visuelles ; grille ; responsive ; animations ; contraintes de présentation. Le back-office contrôle uniquement les éléments éditoriaux autorisés par cette structure : textes ; images et médias ; CTA ; versets ; paramètres éditoriaux prévus ; données dynamiques. »

**R47 — Analogie métier normative.** [021 §2.1, l.54-58] : « le code définit les murs, les pièces et leur organisation ; le back-office permet de peindre les murs et d'aménager les pièces ; l'utilisateur du back-office ne peut pas déplacer les murs. »

**R48 — Pas de page builder.** [021 §2.1, l.60] : « Il n'existe donc **pas de page builder générique**. » ; renforcé par [021 §19, l.673-681].

**R49 — Le Back-Office administre le contenu, pas le design.** [020 §2.1, l.30-56] : « Le système doit distinguer clairement : CODE / DESIGN SYSTEM → Structure visuelle, Composants, Variantes, Layouts, Animations, Responsive, Comportements + CONTENU ADMINISTRABLE → Textes, Images, Événements, Publications, Départements, Ressources, Médias ».

**R50 — Interdits d'administration (liste littérale).** [020 §2.1, l.58-66] : « Un administrateur ne doit jamais avoir à manipuler : des classes CSS ; des composants React ; des identifiants techniques ; des URLs Supabase Storage ; des paramètres de mise en page ; des structures JSON ; des propriétés purement techniques. »

**R51 — Objet du Back-Office.** [020 §1, l.24] : « Le Back-Office ne doit donc pas être conçu comme une interface permettant de « modifier le code du site », mais comme une **interface de gestion du contenu et des activités de l'église**. »

**R52 — Modèle de page Section/type/variante/données.** [020 §12, l.516-534] (cf. E15/E16).

**R53 — Le back-office ne décide pas seul de l'éditabilité des sections.** [020 §12, l.552-554] : « Cela ne signifie pas que toutes ces sections deviennent éditables. C'est précisément l'objet de l'**audit stratégique du frontend** qui suivra ce document. »

**R54 — Comportement obligatoire des sections sans données.** [020 §13, l.560-586] (cf. E16).

**R55 — Trois catégories à distinguer.** [020 §14, l.592-629] : « Contenu » (« titre, description, texte, image, verset, etc. ») / « Données dynamiques » (« événements, publications, départements, médias, ressources ») / « Configuration » (« permissions, rôles, règles, structure, paramètres techniques »).

**R56 — Configuration non exposée aux responsables.** [020 §14, l.631] : « Cette dernière catégorie ne doit pas être exposée aux responsables de département. »

**R57 — Responsable : informations métier oui, propriétés structurelles non.** [020 §11, l.482-508] : « Un responsable peut modifier les informations métier de son propre département. » ; « Il ne peut toutefois pas modifier les propriétés structurelles susceptibles d'affecter le fonctionnement général du site. » ; exemples réservés : « slug ; ordre d'affichage ; structure de navigation ; identifiants techniques ; règles de visibilité globales ; configuration système » ; et : « La frontière exacte entre ces propriétés sera déterminée après l'audit du frontend et la conception détaillée du modèle de données. »

**R58 — Pages canoniques et template département.** [021 §3, l.66-88] (cf. E15) : 8 pages, dont 7 à structure déterminée ; `/organisation` reste une page unique sans routes de département permanentes.

**R59 — Le document 020 ne doit pas inventer la liste des champs.** [020 §21, l.807] : « Ce document ne doit **pas inventer la liste finale des champs administrables**. » ; et [020, l.920] : « avec interdiction de transformer arbitrairement chaque élément visuel en champ CMS. »

**R60 — Invariant I11.** [021 §17, l.628-630] : « Les pages ne sont pas librement composables. »

## 3.6 Principes structurants et gouvernance

**R61 — Principe directeur 021.** [021 §1, l.20] : « **Le backend gère le contenu et les données du site, pas sa conception visuelle.** » ; [021 §1, l.22] : « L'interface publique reste structurée et contrôlée par le code. Le back-office permet d'alimenter les structures prévues sans transformer le site en page builder. »

**R62 — Le backend est l'autorité.** [020 §19, l.758-760] + [020 §5, l.238-240] (cf. §2.8).

**R63 — Portée du document 021.** [021 §22, l.821-833] : « À la fin de la Phase 3, les éléments suivants seront figés : périmètre fonctionnel ; glossaire ; modèle métier ; stack technique ; architecture ; contrats structurants ; règles d'autorisation. » ; « Toute modification fondamentale demandée après ce point devra être traitée comme une **itération de Phase 6** et non comme une modification opportuniste de l'implémentation. »

**R64 — Aucun code avant finalisation.** [021 §21, l.817] : « Aucun code d'implémentation ne doit être produit avant que ces quatre sous-livrables de la Phase 3 soient finalisés. » (Les quatre : modélisation statique UML, modélisation dynamique UML, architecture logicielle, roadmap — [021 §21, l.787-816].)

## 3.7 DÉCISION SUR LES ÉVÉNEMENTS GLOBAUX — recherche ciblée

> **CONCLUSION : la décision finale n'est PAS prise dans 020 ni dans 021.** Elle est **explicitement laissée ouverte** par 021, et **020 en postule l'existence sans la modéliser**. Les deux documents divergent sur son statut.

### Pièces 1 — 020 affirme que des événements globaux existent et que l'Admin les gère

**Localisation : 020, §10 « Événements », l.460.**

> **« L'Administrateur peut gérer les événements globaux. »**

Contexte immédiat, l.458-462 :

> « Les responsables Press et Ecodume peuvent proposer/gérer les événements relevant de leur département.
> L'Administrateur peut gérer les événements globaux.
> Le Super Administrateur dispose d'un accès complet. »

### Pièce 2 — 020 laisse ouvert le workflow de validation (mais pas l'existence des événements globaux)

**Localisation : 020, §10, l.464-476.**

> « Le workflow précis :
> ```text
> Responsable → Proposition → Validation éventuelle → Publication
> ```
> reste à préciser dans la conception fonctionnelle détaillée. »

Et [020 §22, l.854-855] :

> « 1. **Validation des événements proposés par les responsables** — Publication directe ou validation par un Administrateur ? »

### Pièce 3 — 021 déclare explicitement que la question n'est PAS tranchée

**Localisation : 021, §9 « Événement », l.362-364.**

> « Le modèle existant prévoit déjà une relation possible avec un département.
> Le caractère obligatoire ou facultatif de cette relation doit être arrêté dans le schéma métier final avant le GEL de Phase 3, car le site peut également contenir **des événements d'intérêt global**. »

**Localisation : 021, §16 « Cardinalités conceptuelles », l.571.**

> « | Department → Event | 1 → 0..* ou selon la décision finale sur les événements globaux | »

**Localisation : 021, §20.1 « Événements », l.703-708 — la formulation la plus explicite des deux documents :**

> « ### 20.1. Événements
> Déterminer définitivement si `Event.department_id` est :
> - obligatoire pour tous les événements ;
> - ou nullable pour permettre des événements globaux. »

### Pièce 4 — Constats d'absence (vérifiés sur l'intégralité des deux documents)

- 021 §17 « Invariants métier » (l.582-635) énumère **I1 à I12** : **aucun invariant ne concerne `Event` ni `Event.department_id`**. Le seul invariant proche (« I1 — Une publication appartient à un département », l.586-588) porte sur `Publication`, pas sur `Event`. → **La contrainte d'appartenance d'un événement n'est pas érigée en invariant.**
- 021 §18 « Périmètres de données » (l.638-666) liste, au titre du périmètre « Département » : « publications ; **événements départementaux** ; informations départementales ; médias utilisables par le département. » (l.655-659). **Aucun périmètre n'est défini pour d'éventuels événements globaux** ; l'expression « événements départementaux » n'est jamais opposée à une catégorie « événements globaux » définie.
- 021 §19 « Ce que le modèle métier exclut » (l.669-696) **ne mentionne pas les événements globaux** : ils ne sont ni retenus ni exclus.
- La matrice 020 §18 (l.716-729) comporte la ligne « Événements | ✓ | ✓ | périmètre | périmètre » : **aucune ligne ni colonne « événements globaux »**.
- Le mot « global » appliqué aux événements n'apparaît dans 020 qu'à la **ligne 460**, et dans 021 qu'aux **lignes 364, 571 et 708** (dans un contexte d'incertitude). Aucune autre occurrence.

### Synthèse factuelle

| Point | Statut documentaire |
|---|---|
| Existence d'événements sans département | **Postulée par 020 (l.460)** ; **conditionnelle et non décidée dans 021 (l.364, 571, 708)** |
| `Event.department_id` obligatoire ? | **Non tranché** — [021 §20.1, l.705-708] |
| `Event.department_id` nullable ? | **Non tranché** — [021 §20.1, l.708] |
| Qui gère les événements globaux | **020 : l'Administrateur** (l.460) ; **021 : non traité** |
| Cardinalité définitive | **Non tranchée** — [021 §16, l.571] |
| Périmètre d'accès d'un événement global | **Non traité dans 020/021** |
| Invariant correspondant | **Absent** — [021 §17, l.582-635] |
| Échéance | « avant le GEL de Phase 3 » — [021 §9, l.364] ; cf. aussi [020, l.852] |

> **Note de périmètre :** l'extrait porte exclusivement sur 020 et 021, conformément à la mission. Le répertoire `docs/` contient des documents postérieurs (`022_modelisation_statique_UML.md`, `023_modelisation_dynamique_UML.md`, `024_architecture_logicielle_backend.md`, `025-prompt_maitre_conception_roadmap_backend.md`, `026-plan_implementation_backend.md`) : leur existence est constatée, **ils n'ont pas été lus dans le cadre de cette mission** et aucune affirmation n'est portée à leur sujet.

---

# 4. Exigences de confidentialité des demandes de prière

> **Observation liminaire : le sujet est traité uniquement dans 021.** Le document 020 ne contient **ni le terme « prière » au sens d'entité métier**, ni `PrayerRequest`, ni aucune exigence de chiffrement, de clé ou de confidentialité. La seule occurrence du mot « Prière » dans 020 est la liste des sections de la page Accueil (« Prière », [020 §12, l.548]) et la ligne de navigation conceptuelle du Back-Office (« Prière » en tant que section dynamique). → **Le sujet est non traité dans 020.**

## 4.1 Chiffrement, clés, séparation des privilèges — citations intégrales

**[021 §13, l.494-511] — section « Confidentialité cryptographique des demandes de prière », reproduite dans son intégralité :**

> « # 13. Confidentialité cryptographique des demandes de prière
>
> La confidentialité demandée est plus forte qu'un simple chiffrement de la base de données.
>
> Le modèle métier impose le principe suivant :
>
> > Le Super Admin, malgré son niveau d'autorité système, ne doit pas être techniquement capable de lire le contenu en clair d'une demande de prière.
>
> Cela implique que le futur modèle technique devra prévoir un mécanisme cryptographique séparant :
>
> - les données stockées ;
> - les clés de chiffrement ;
> - l'accès applicatif ;
> - l'utilisateur Admin autorisé à déchiffrer.
>
> Le choix précis du mécanisme cryptographique, du cycle de vie des clés, de leur rotation, de leur récupération et de la gestion de plusieurs comptes Admin reste un point de conception technique à formaliser dans le CST/architecture avant le GEL.
>
> Le backend ne doit donc jamais exposer le texte en clair à un acteur non autorisé. »

**[021 §5.1, l.152-158] — section « Exception de confidentialité », reproduite dans son intégralité :**

> « ### Exception de confidentialité
>
> Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière**.
>
> Cette exception est intentionnelle et doit être garantie techniquement.
>
> Le Super Admin reste l'autorité suprême du système sans disposer du pouvoir de déchiffrer les demandes de prière privées. »

**[021 §17, l.624-626] — invariant I10, citation intégrale :**

> « ### I10 — Super Admin ne lit pas les demandes de prière
>
> Cette règle constitue une exception explicite au caractère global du rôle. »

**[021 §6.1, l.232-242] — scope `PRIVATE`, citation intégrale :**

> « ### PRIVATE
>
> La ressource est soumise à une politique d'accès restreinte.
>
> `PRIVATE` ne signifie pas nécessairement « appartenant à un utilisateur ».
>
> Il désigne un périmètre de confidentialité particulier.
>
> Exemple :
>
> `PrayerRequest` → `PRIVATE` + audience `ADMIN`. »

## 4.2 Multi-Administrateur, déchiffrement, rotation, révocation, récupération, perte de clé, audit

**Statut unique : non tranché — liste de travaux à formaliser.**

**[021 §20.2, l.710-723] — citation intégrale :**

> « ### 20.2. Cryptographie des demandes de prière
>
> Formaliser :
>
> - modèle de chiffrement ;
> - génération des clés ;
> - stockage des clés ;
> - déchiffrement côté Admin ;
> - gestion de plusieurs Admins ;
> - rotation ;
> - révocation ;
> - récupération ;
> - perte de clé ;
> - audit des accès. »

Rappel complémentaire de [021 §13, l.509] : « Le choix précis du mécanisme cryptographique, du cycle de vie des clés, de leur rotation, de leur récupération et de la gestion de plusieurs comptes Admin reste un point de conception technique à formaliser dans le CST/architecture avant le GEL. »

**Conséquence documentaire, point par point :**

| Exigence | Statut dans 020/021 |
|---|---|
| Algorithme / schéma de chiffrement | **Non traité** (à formaliser) |
| Génération des clés | **Non traité** (à formaliser) |
| Stockage des clés | **Non traité** ; seule la **séparation** « données stockées / clés de chiffrement / accès applicatif / utilisateur Admin autorisé à déchiffrer » est prescrite [021 §13, l.504-507] |
| Déchiffrement côté Admin | **Non traité** (à formaliser) — mais présupposé : « l'utilisateur Admin autorisé à déchiffrer » [l.507] |
| Multi-Administrateur | **Non traité** — « gestion de plusieurs Admins » [§20.2, l.718] ; « gestion de plusieurs comptes Admin » [§13, l.509] |
| Rotation des clés | **Non traité** — listé [§20.2, l.719], [§13, l.509] |
| Révocation | **Non traité** — listé [§20.2, l.720] |
| Récupération de clé | **Non traité** — listé [§20.2, l.721], [§13, l.509] |
| **Perte de clé** | **Non traité** — listé [§20.2, l.722] ; **aucune conséquence métier n'est décrite** (aucune règle de type « perte = perte définitive » ou « escrow ») |
| Séparation des privilèges | **Prescrite en principe** : séparation des 4 éléments [§13, l.504-507] ; exclusion du Super Admin [l.154-158, l.500, I10] |
| Journalisation / audit des accès | **Non traité** — « audit des accès » listé [§20.2, l.723] ; les « journaux d'activité » [021 §7, l.258] ne comportent aucune spécification de contenu, et la matrice exclut le Responsable et n'accorde à l'Admin qu'un « Selon périmètre » **non défini** |

## 4.3 Notifications

**[021 §14, l.515-527] — citation intégrale :**

> « # 14. Notification
>
> La création d'une demande de prière génère une **notification destinée aux Admins**.
>
> La notification doit être persistée afin que l'information ne dépende pas de la présence simultanée d'un Admin en ligne.
>
> La notification ne doit pas divulguer le contenu privé de la demande à un acteur non autorisé.
>
> Exemple de notification :
>
> > Nouvelle demande de prière reçue.
>
> Le texte de la prière reste protégé par la politique de confidentialité de `PrayerRequest`. »

- Relation : `PrayerRequest └── Notification` [021 §15, l.560-561] ; `1 → 0..*` [021 §16, l.576].
- **Non traité** : canal de notification (e-mail, in-app, SMS, push), destinataires nominatifs, contenu exact structuré, états de lecture, relances ou escalades, purge/archivage des notifications.

## 4.4 Soumission et accès (rappels normatifs)

**[021 §12.1, l.449-456] — citation intégrale :**

> « ## 12.1. Soumission
>
> Un visiteur peut soumettre une demande :
>
> - anonymement ;
> - ou avec son nom.
>
> Aucune adresse e-mail ou numéro de téléphone n'est requis à ce stade. »

**[021 §12.3, l.483-490]** : matrice reproduite en §2.5 ; conclusion littérale : « La lecture est donc strictement réservée aux Admins. »

---

# 5. Contrat d'API

> **Constat central : aucun des deux documents ne définit de contrat d'API.** Ils l'excluent explicitement de leur périmètre et le renvoient à un livrable ultérieur. **Aucun endpoint, aucune méthode HTTP, aucun paramètre, aucun filtre, aucun format de réponse et aucun code d'erreur n'est mentionné dans 020 ou 021.** Les seuls éléments à caractère contractuel sont listés ci-dessous.

## 5.1 Exclusions explicites de périmètre

- [021 §1, l.16] : « Il ne constitue pas encore le schéma SQL final, ni le contrat OpenAPI, ni le code d'implémentation. »
- [020 §21, l.828-844] — la chaîne des livrables place l'API **après** le modèle de données et les permissions :

```text
Audit frontend → Modèle éditorial → Modèle de données → Permissions → Écrans du Back-Office → API → Implémentation
```

- [020, l.906] : « ⑥ Contrat API / OpenAPI » — étape **⑥** de la Phase 3, non encore produite.
- [021 §21, l.803-809] : l'API apparaît comme composant de l'« Architecture logicielle » à produire (« couches ; repositories ; services ; politiques d'autorisation ; gestion cryptographique ; API »).

## 5.2 Seuls éléments techniques mentionnés

| Élément | Citation littérale | Source |
|---|---|---|
| Style d'échange | « Next.js │ │ REST / JSON ▼ Backend Express + TypeScript » | [020 §19, l.740-746] |
| Backend | « Backend Express + TypeScript │ ├── Presentation ├── Application ├── Domain └── Infrastructure » | [020 §19, l.746-751] |
| Persistance / services | « ├── PostgreSQL / Supabase ├── Supabase Auth └── Supabase Storage » | [020 §19, l.753-755] |
| Contrôles d'une requête API | « Une requête API doit vérifier : 1. l'identité de l'utilisateur ; 2. son rôle ; 3. sa permission ; 4. son périmètre ; 5. la propriété de la ressource concernée. » | [020 §20, l.795-801] |
| Permissions nommées (vocabulaire, non des routes) | `publication.create`, `publication.read`, `publication.update`, `event.create`, `event.update`, `department.update`, `media.manage` | [020 §20, l.786-792] |
| Vérifications média côté API | « Le backend doit vérifier l'autorisation du média lors de la création, modification et publication d'un contenu. » | [021 §10.3, l.425] |
| Validation de schéma annoncée | « validation Zod » — parmi les points à formaliser du modèle éditorial | [021 §20.4, l.746] |

## 5.3 Absences vérifiées (aucune occurrence dans 020/021)

- **Endpoints / chemins** : aucun (`/api/...`, `/publications`, `/events`, `/prayer-requests`, etc.) — **non traité**.
- **Méthodes HTTP** : aucune (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) — le seul mot « POST » n'apparaît pas ; **non traité**.
- **Paramètres de requête, pagination, tri, filtres** : aucun (pas de `page`, `limit`, `offset`, `sort`, `search`, `status`, `department`) — **non traité**. La recherche et le filtrage sont évoqués uniquement comme **capacités d'interface de la médiathèque** [020 §7, l.309-310], sans contrat.
- **Formats de réponse** : aucun (ni enveloppe, ni schéma JSON, ni codes de succès) — **non traité**.
- **Codes d'erreur HTTP / corps d'erreur** : aucun — **non traité**. Le seul élément voisin est une exigence UX : « des messages d'erreur humains » [020 §17, l.699].
- **Versionnement d'API, authentification (JWT, cookies, en-têtes), CORS, rate limiting, idempotence** : **non traité**.
- **Noms de routes publiques** : seuls `/organisation` [021 §3, l.83] et « routes permanentes sous `/organisation` » [l.85] sont cités — ce sont des routes **frontend**, pas des endpoints d'API.

---

# 6. Questions ouvertes, décisions en attente, contradictions

## 6.1 Questions ouvertes explicitement listées par 020 (§22, l.850-871)

> « 1. **Validation des événements proposés par les responsables** — Publication directe ou validation par un Administrateur ?
> 2. **Règle exacte d'archivage des publications** — Quel seuil de publications récentes ? Global ou par catégorie/département ?
> 3. **Granularité exacte des permissions des responsables** — Quels « autres contenus associés » peuvent-ils gérer ?
> 4. **Propriété des médias** — Média global, média appartenant à un département, ou combinaison des deux ?
> 5. **Comportement de chaque section dynamique sans données** — Masquage, état vide, fallback ou CTA.
> 6. **Liste définitive des propriétés administrables des départements**.
> 7. **Liste définitive des fonctions réservées au Super Administrateur**. »

## 6.2 Points restant à formaliser explicitement listés par 021 (§20, l.699-780)

> « ### 20.1. Événements — Déterminer définitivement si `Event.department_id` est : obligatoire pour tous les événements ; ou nullable pour permettre des événements globaux.
> ### 20.2. Cryptographie des demandes de prière — Formaliser : modèle de chiffrement ; génération des clés ; stockage des clés ; déchiffrement côté Admin ; gestion de plusieurs Admins ; rotation ; révocation ; récupération ; perte de clé ; audit des accès.
> ### 20.3. Modèle exact des médias — Définir précisément : types MIME ; taille maximale ; buckets ; variantes / thumbnails ; politique d'accès ; relation `MediaAccess` ; suppression ; médias orphelins.
> ### 20.4. Modèle éditorial des pages — Transformer les structures visuelles déjà définies en contrats de données : page ; sections autorisées ; variantes ; champs éditables ; validation Zod ; fallback ; contenu vide.
> ### 20.5. Entités éditoriales complémentaires — [… 8 entités, cf. E22–E29 …]
> ### 20.6. Suppression et historique — Définir, ressource par ressource : suppression physique ; soft delete ; archivage ; historique ; audit. »

Autres points ouverts 021 : `Scope → autorisation : dépend du modèle RBAC final` [§16, l.578] ; « Le workflow précis … reste à préciser » est une ouverture de 020 reprise par la liste UML dynamique [021 §21, l.796-801].

## 6.3 Contradictions / divergences entre 020 et 021

| # | Point | 020 (citation) | 021 (citation) | Nature |
|---|---|---|---|---|
| **C-1** | Lecture des demandes de prière par le Super Admin | « accéder à tous les contenus » [020 §4.1, l.139] | « Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière**. » [021 §5.1, l.154] | **Contradiction frontale.** 020 énonce un accès universel ; 021 y pose une exception technique garantie. 020 ne connaît pas `PrayerRequest`. |
| **C-2** | Création de comptes par l'Admin | Matrice : « Utilisateurs \| ✓ \| — \| — \| — \| » [020 §18, l.726] | « Utilisateurs \| Oui \| **Création des responsables** \| Non » [021 §7, l.250] ; « créer les comptes des responsables de département » [021 §5.1, l.173] | **Contradiction.** 020 réserve la gestion des utilisateurs au Super Admin ; 021 accorde à l'Admin la création des comptes de responsables. |
| **C-3** | Validation préalable des contenus de département | « Le workflow précis : Responsable ↓ Proposition ↓ Validation éventuelle ↓ Publication reste à préciser » [020 §10, l.464-476] ; « les propositions à valider » [020 §16, l.678] ; question ouverte n°1 [020 §22, l.854-855] | « Il n'a pas besoin d'une validation préalable de l'Admin pour publier. » [021 §7, l.273] | **Divergence de statut** : 020 laisse la question ouverte et prévoit des « propositions à valider » dans le tableau de bord ; 021 **tranche** en faveur de la publication directe. 020 §22 n'a pas été mis à jour. |
| **C-4** | Seuil d'archivage des publications | « **La valeur exacte du seuil reste à définir.** » [020 §8.3, l.400] ; question ouverte n°2 [020 §22, l.857-858] | « les trois publications publiées les plus récentes restent `PUBLISHED` » [021 §8.3, l.331] ; « Presse et Ecodume disposent de cycles d'archivage indépendants. » [l.354] | **Résolution non répercutée.** 021 fixe le seuil (3) et le périmètre (par département), répondant à 020 §22.2, mais 020 reste dans l'état antérieur. |
| **C-5** | Propriété / rattachement des médias | « Media.department = Press » dans le périmètre autorisé [020 §5, l.225] ; « Médias \| ✓ \| ✓ \| périmètre \| périmètre » [020 §18, l.721] ; question ouverte n°4 « Média global, média appartenant à un département, ou combinaison des deux ? » [020 §22, l.863-864] | « Tous les médias appartiennent à une **bibliothèque globale unique**. » ; « `Media.department_id` n'est pas le modèle retenu. » [021 §10.1, l.376-382] ; I3 [§17, l.594-598] | **Contradiction de modèle.** 020 raisonne sur `Media.department` comme critère d'accès ; 021 rejette explicitement ce rattachement et le remplace par `MediaAccess`. 021 répond à la question n°4 de 020. |
| **C-6** | Département « Affaires Sociales » / « Affaire sociale » | Classé « départements de présentation » : « Affaire sociale » [020 §6.1, l.257] ; « ils ne génèrent pas automatiquement un compte utilisateur. » [l.276] | « Départements explicitement concernés par le back-office spécialisé : **Presse** ; **Ecodume** ; **Affaires Sociales** » [021 §4, l.99-101] ; « Toutefois, seuls **Presse** et **Ecodume** disposent actuellement d'un espace de gestion départemental dédié. » [l.103] | **Divergence de classification et d'orthographe** (« Affaire sociale » vs « Affaires Sociales »). 021 rattache en outre `HouseGroup` à ce département, notion absente de 020. |
| **C-7** | Nom canonique du département Presse | « **Press** » partout : [020 §4.3, l.175], [020 §6.2, l.283], en-tête de matrice « Resp. Press » [l.716], « PRÉSENTATION DE PRESS » [l.487] | « **Presse** » [021 §4, l.99, 103] ; identifiant `PRESSE` [021 §5.1, l.193] ; « Presse et Ecodume » [021 §8.3, l.354] | **Incohérence de nommage entre les deux documents.** 021 fixe le triptyque canonique pour Ecodume (« nom d'affichage / identifiant métier / slug », l.109-111) **mais pas pour Presse** (aucun slug fourni). |
| **C-8** | Rôle « Super Admin » vs « Super Administrateur » | « Super Administrateur » [020 §4.1, l.130], « Super Admin » (matrices, l.716-729) | `SUPER_ADMIN` [021 §5.1, l.136], « Super Admin » [matrice §7, l.248] | Incohérence de libellé (sans impact sémantique constaté). |
| **C-9** | Périmètre de l'audit Admin | « Audit \| ✓ \| selon politique \| — \| — » [020 §18, l.729] | « Journaux d'activité \| Oui \| Selon périmètre \| Non » [021 §7, l.258] | **Divergence de formulation et d'objet** : « politique » vs « périmètre », et la ligne 020 porte sur « Audit » (objet d'audit) là où 021 porte sur « Journaux d'activité » (journal). Les deux notions (« politique », « périmètre ») restent **non définies**. |
| **C-10** | Périmètre « Départements » du Responsable | « Département \| ✓ \| ✓ \| son département \| son département » [020 §18, l.724] | « Départements \| Oui \| Oui \| Lecture / contenu autorisé » [021 §7, l.252] | **Précision apportée par 021** : 020 octroyait un périmètre (« son département », formulation ouverte) là où 021 le borne à « Lecture / contenu autorisé ». Tension avec [020 §11, l.482] « Un responsable peut modifier les informations métier de son propre département. » |
| **C-11** | Événements globaux | « L'Administrateur peut gérer les événements globaux. » [020 §10, l.460] | « Le caractère obligatoire ou facultatif de cette relation doit être arrêté … car le site peut également contenir des événements d'intérêt global. » [021 §9, l.362-364] ; §20.1 [l.705-708] | **Voir §3.7** : 020 affirme une capacité, 021 remet en question l'existence même de la catégorie. |

## 6.4 Contradictions internes à un même document

| # | Document | Constat |
|---|---|---|
| **C-I1** | **021** | **« Le modèle comprend quatre rôles : » [021 §5.1, l.134] — mais seuls trois rôles sont énumérés** : `SUPER_ADMIN` (l.136), `ADMIN` (l.162), `DEPARTMENT_MANAGER` (l.180). Le quatrième rôle n'est jamais nommé dans le document. |
| **C-I2** | **021** | 021 déduit une « exception » des privilèges du Super Admin (I10) tout en le définissant comme « Autorité système suprême » avec un périmètre « global » [l.138-142] ; le document assume explicitement cette tension : « Cette règle constitue une exception explicite au caractère global du rôle. » [l.626]. Incohérence levée, mais elle contredit la matrice historique de 020 (§18) qui ne connaît pas la ressource. |
| **C-I3** | **020** | 020 §4.2 déclare que l'Admin ne peut pas « créer un Super Administrateur » (l.166) — interdiction visant implicitement la création d'autres comptes — alors que la matrice §18 (l.726) lui refuse **toute** ligne « Utilisateurs ». Ambiguïté interne. |
| **C-I4** | **020** | 020 §8.3 fait dépendre l'archivage d'une règle à définir et demande « si l'archivage est automatique ou déclenché par l'administrateur » (l.398), tandis que 020 §4.3/§9 présentent l'archivage comme une action de gestion. Le document ne tranche pas lui-même. |
| **C-I5** | **020** | 020 §4.3 dit que le responsable peut gérer « médias associés » (l.185) et §5 autorise la lecture de `Media.department = Press` (l.225-226), ce que 021 §10.1/I3 interdit. Contradiction inter-document comptabilisée en C-5, mais qui constitue aussi une fragilité interne à 020 (sa matrice §18 dit « périmètre » sans définir le périmètre média). |
| **C-I6** | **021** | 021 §10.2 exige une relation `MediaAccess` et §20.3 reconnaît que cette relation reste « à définir » (l.734) : le modèle métier est présenté comme fermé (§20, l.699-701 : « Ce document ferme le modèle métier ») tout en comportant une entité centrale non spécifiée. |

## 6.5 Décisions non tranchées, non listées comme telles par les documents (constatées par lecture exhaustive)

Ces points **ne sont ni traités ni listés comme ouverts** — ils sont simplement absents :

- Base de tri de « les trois publications publiées les plus récentes » : critère non défini (date de publication ? de création ? de mise à jour ?) [021 §8.3, l.331].
- Comportement et droits en cas de **conflit** entre Admin et Responsable sur une même publication (021 §7, l.275 dit « L'Admin conserve cependant la capacité d'intervenir sur ces contenus », sans arbitrage ni trace).
- Sort d'une publication `ARCHIVED` : y a-t-il retour possible vers `PUBLISHED` ? **Non traité**.
- Suppression d'une publication : capacité accordée au Responsable [021 §7, l.269] mais **aucun état, aucune règle, aucun invariant** de suppression ; [021 §20.6, l.771-780] renvoie le sujet à plus tard.
- Comportement du frontend public vis-à-vis d'une publication `ARCHIVED` (exclue du site ? accessible par URL ?) : **non traité**.
- Cycle de vie des comptes (création, désactivation, changement de département, suppression, mot de passe) : **non traité**.
- Nombre d'Administrateurs, unicité d'un responsable par département, pluralité de responsables par département : **non traité** (021 §16, l.572 dit `1 → 0..*`, soit 0 ou plusieurs).
- Procédure de récupération si **le dernier Admin** perd l'accès aux demandes de prière : **non traité**.
- Délai/absence de traitement des demandes de prière (`PENDING` depuis X jours), résiliation d'une demande, notification en double : **non traité**.
- Export/sauvegarde des données, RGPD/consentement, conservation : **non traité**.
- Domaine, HTTPS, hébergement, environnements (dev/staging/prod) : **non traité**.
- Multilinguisme (fr/en, swahili), fuseaux horaires (Lubumbashi/UTC+2), format des dates : **non traité** (le projet précise « Lubumbashi, RDC » [021, l.3] sans conséquence technique énoncée).
- États de la ressource `Event` : **non traités** (cf. E10).
- Statistiques / analytics : explicitement hors périmètre du tableau de bord [020 §16, l.668] : « Le tableau de bord n'a pas vocation à devenir un système d'analytics complexe. »

---

# 7. Points non traités dans 020 et/ou 021 — récapitulatif

| Sujet | Statut |
|---|---|
| Schéma SQL, types de colonnes, migrations | **Non traité dans 020/021** — explicitement exclu : « Il ne constitue pas encore le schéma SQL final » [021 §1, l.16] |
| Contrat OpenAPI, endpoints, méthodes, paramètres, réponses, codes d'erreur | **Non traité dans 020/021** — cf. §5 |
| Permission catalogue complet | **Non traité** — 7 permissions nommées à titre d'exemple seulement [020 §20, l.786-792] |
| Cycle de vie des comptes utilisateurs, authentification, mots de passe, MFA, sessions | **Non traité dans 020/021** (Supabase Auth cité comme brique [020 §19, l.754]) |
| Demandes de prière dans 020 | **Non traité dans 020** (aucune mention de `PrayerRequest`, de chiffrement ou de confidentialité) |
| Chiffrement : algorithme, clés, rotation, révocation, récupération, perte de clé, multi-Admin, audit des accès | **Non traité / à formaliser** — [021 §13, l.509] ; [021 §20.2, l.710-723] |
| `MediaAccess` : structure exacte | **Non traité / à formaliser** — [021 §20.3, l.734] |
| Modèle exact des médias (MIME, taille, buckets, thumbnails, suppression, orphelins) | **Non traité / à formaliser** — [021 §20.3, l.727-736] |
| Modèle éditorial des pages (champs éditables, validation Zod, fallback, contenu vide) | **Non traité / à formaliser** — [021 §20.4, l.738-748] |
| Statut de `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry`, `SocialLink`, `ScheduleEntry`, `SiteSettings` | **Non traité / à déterminer** — [021 §20.5, l.750-769] |
| Suppression, soft delete, historique, audit par ressource | **Non traité / à formaliser** — [021 §20.6, l.771-780] |
| Entité « Ressource » (attributs, relations, états) | **Non traitée dans 020/021** ; absente du modèle métier 021 |
| Journal d'activité : contenu, format, rétention, accès | **Non traité dans 020/021** |
| Départements de présentation : modèle de données (nommés mais non modélisés) | **Non traité** — [020 §6.1, l.252-276] |
| Relations `Event ↔ Media` et `Department ↔ Media` (hors `MediaAccess`) | **Non traité dans 021** (usages évoqués dans 020 §7, l.347-350 uniquement) |
| Mécanique de concurrence de l'archivage (transactions, verrous, conflits, ordre de départage) | **Non traité dans 020/021** — cf. §3.1 |
| Propriétés administrables exactes des départements (frontière) | **Ouvert** — [020 §11, l.510] ; [020 §22.6, l.869] |
| Liste définitive des fonctions réservées au Super Administrateur | **Ouvert** — [020 §22.7, l.871] |
| Comportement des sections dynamiques sans données (par composant) | **Ouvert** — [020 §13, l.584-586] ; [020 §22.5, l.866-867] |
| Granularité des permissions des responsables (« autres contenus associés ») | **Ouvert** — [020 §22.3, l.860-861] |
| Politique d'accès à l'audit pour l'Admin | **Ouvert** — « selon politique » [020 §18, l.729] / « Selon périmètre » [021 §7, l.258] non définis |
| Priorité, fuseaux horaires, internationalisation, RGPD, sauvegardes, environnements | **Non traité dans 020/021** |

---

## Annexe — Index de vérification rapide (fichier → sections)

### 020 — `docs/020-conception_backoffice.md` (920 lignes)

| § | Titre | Lignes |
|---|---|---|
| 1 | Objet du document | 10-24 |
| 2 | Principes directeurs (2.1 contenu vs design ; 2.2 réutilisation) | 28-101 |
| 3 | Modèle général du Back-Office | 105-122 |
| 4 | Modèle des utilisateurs (4.1 Super Admin ; 4.2 Administrateur ; 4.3 Responsable) | 126-198 |
| 5 | Principe de périmètre d'accès (ROLE + SCOPE) | 202-240 |
| 6 | Départements (6.1 présentation ; 6.2 espace métier) | 244-296 |
| 7 | Médiathèque (+ Réutilisation) | 299-352 |
| 8 | Publications (8.1 Brouillon ; 8.2 Publié ; 8.3 Archivé) | 356-400 |
| 9 | Publications par département | 404-437 |
| 10 | Événements | 441-476 |
| 11 | Informations des départements | 480-510 |
| 12 | Pages statiques et contenu éditorial | 514-554 |
| 13 | Gestion des données dynamiques dans les pages | 558-586 |
| 14 | Distinction contenu / données / configuration | 590-631 |
| 15 | Architecture fonctionnelle du Back-Office | 635-662 |
| 16 | Tableau de bord | 666-680 |
| 17 | Expérience utilisateur | 684-710 |
| 18 | Matrice initiale des droits | 714-731 |
| 19 | Architecture technique cible | 735-760 |
| 20 | Autorisation | 764-802 |
| 21 | Audit du frontend — étape suivante | 805-846 |
| 22 | Points encore à spécifier | 850-871 |
| — | Position dans la méthodologie | 875-920 |

### 021 — `docs/021-modele_metier_backend.md` (852 lignes)

| § | Titre | Lignes |
|---|---|---|
| 1 | Objet du document | 10-22 |
| 2 | Principes métier structurants (2.1 séparation structure/contenu) | 26-60 |
| 3 | Pages éditoriales structurées (+ Règle Organisation) | 64-88 |
| 4 | Département (dont Ecodume, Affaires Sociales) | 91-124 |
| 5 | Utilisateur et rôles (5.1 ; Exception de confidentialité) | 128-199 |
| 6 | Modèle Role → Scope (6.1 Scopes GLOBAL/DEPARTMENT/PRIVATE) | 203-242 |
| 7 | Matrice métier des responsabilités (+ Autonomie départementale) | 246-276 |
| 8 | Publication (8.1 appartenance ; 8.2 états ; 8.3 règle des trois) | 279-355 |
| 9 | Événement | 358-367 |
| 10 | Média (10.1 bibliothèque ; 10.2 autorisation ; 10.3 trois opérations) | 370-425 |
| 11 | Relation Publication ↔ Média | 429-439 |
| 12 | Demande de prière (12.1 soumission ; 12.2 état ; 12.3 accès) | 443-490 |
| 13 | Confidentialité cryptographique des demandes de prière | 494-511 |
| 14 | Notification | 515-528 |
| 15 | Relations métier principales | 531-562 |
| 16 | Cardinalités conceptuelles | 566-579 |
| 17 | Invariants métier (I1–I12) | 582-635 |
| 18 | Périmètres de données (Global / Département / Privé) | 638-666 |
| 19 | Ce que le modèle métier exclut | 669-696 |
| 20 | Points restant à formaliser (20.1–20.6) | 699-780 |
| 21 | Passage vers les sous-livrables suivants | 783-817 |
| 22 | Règle du GEL | 821-833 |
| — | Conclusion | 837-852 |
