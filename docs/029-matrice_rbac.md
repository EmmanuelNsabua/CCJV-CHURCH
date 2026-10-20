# 029 — Matrice RBAC — `Role × Scope × Resource × Action`

> **Statut :** spécification d'autorisation. Ce document **ne code rien** et **ne
> remplace aucune décision** : il formalise `docs/028` §11.2 (« Matrice RBAC
> complète — `Role × Scope × Resource × Action`, incluant D-01 à D-06, D-21 et
> D-22 »).
> **Autorité :** en cas de divergence, `docs/028-decisions_arbitrees.md`
> **prévaut** (028, en-tête : « Elles prévalent sur les documents de conception
> lorsqu'ils divergent »). Un point non couvert par D-01 à D-26 est écrit
> « **non tranché** » et versé en §8.
> **Dépôt :** `CCJV-CHURCH` · **Fichier :** `docs/029-matrice_rbac.md`

---

# 0. Périmètre, sources et conventions

## 0.1 Ordre d'autorité des sources

| Rang | Source | Usage dans ce document |
| --- | --- | --- |
| 1 | `docs/028-decisions_arbitrees.md` (D-01 → D-26) | **Vérité.** Tout ce qui est affirmé ici en découle. |
| 2 | `docs/021-modele_metier_backend.md` §7, §6.1, §10, §12.3 | Matrices d'origine, scopes, gouvernance média, accès prières. |
| 3 | `docs/020-conception_backoffice.md` §4, §5, §18, §20 | Rôles, `ROLE + SCOPE`, matrice initiale, 5 contrôles par requête. |
| 4 | `docs/extraits/020-021-extrait.md` | Dépouillement citationnel : 29 entités, 64 règles R1–R64, **X1–X27**, 3 matrices. |
| 5 | `docs/024_architecture_logicielle_backend.md` §7, §8, §9, §23 | Forme de la décision (`can(user, action, resource)`), catalogue de policies, exception `PrayerRequest`, `403` pour le Super Admin. |
| 6 | Code `backend/src` | **État réel** documenté en §7 uniquement. Le code ne fonde aucune règle. |

## 0.2 Conventions de lecture des matrices (§2)

| Symbole | Signification |
| --- | --- |
| `✔` | Autorisé. Le **scope** applicable est écrit à côté (`GLOBAL`, `DEPARTMENT`, `PRIVATE`, `PUBLIC`). |
| `✘` | **Refus explicite.** Le fondement est cité (`D-nn`, `X-nn`, ou « refus par défaut — Q-01 »). |
| `?` | **Non tranché** par D-01 à D-26. Renvoi vers `Q-nn` (§8.2) ou vers une question ouverte de 028 (`028/Q-xx`). Aucune supposition n'est faite. |
| `—` | Sans objet (action inexistante pour cette ressource, ou action système hors RBAC). |

**Trois règles de lecture à ne jamais perdre de vue :**

1. **Le rôle dit *quoi*, le scope dit *sur quoi*** (021 §6 : « Role = que peut
   faire l'utilisateur ? » / « Scope = sur quelles ressources peut-il le
   faire ? »).
2. **Résolution d'un département :** un `DEPARTMENT_MANAGER` est rattaché à **un
   seul** département (D-02). La vérification départementale est donc une
   **égalité simple** `resource.department_id == user.department_id` ; un
   `department_id` absent ou nul vaut **refus**.
3. **`PRIVATE` n'est pas un rôle** : c'est un périmètre de confidentialité (021
   §6.1 : « Il désigne un périmètre de confidentialité particulier »), et la
   seule ressource qui le porte est `PrayerRequest` (`PRIVATE` + audience
   `ADMIN`, 021 §6.1).

## 0.3 Le refus par défaut n'est pas tranché

Aucune décision de D-01 à D-26 n'énonce que le modèle est **fermé par défaut**.
Toutes les cellules `✘` fondées sur une interdiction ou sur une attribution
explicite des pouvoirs le sont donc sans réserve ; les rares cellules marquées
`✘*` supposent la convention « refus par défaut » et renvoient à **Q-01**. Cette
question est **bloquante pour l'implémentation**, pas pour la lecture de ce
document.

---

# 1. Modèle d'autorisation

## 1.1 Les trois rôles (D-01)

```text
SUPER_ADMIN
ADMIN
DEPARTMENT_MANAGER
```

- « Responsable Presse » et « Responsable Ecodume » **ne sont pas des rôles** :
  ce sont **deux instances du même rôle**, différenciées par leur département
  rattaché (D-01). Le RBAC **ne code jamais** `PRESSE` ou `ECODUME` comme rôle.
- Corollaire normatif (D-09) : « Le département reste une entité/donnée, jamais
  un rôle codé en dur. »
- Corollaire issu de 021 §5.1 / §19, **non infirmé** par 028 : `ROLE_PRESSE`,
  `ROLE_ECODUME` et tout rôle équivalent sont proscrits.

| Rôle | Nature (fondement D-01 → D-04) | Scope de rattachement |
| --- | --- | --- |
| `SUPER_ADMIN` | Autorité système : utilisateurs et rôles, scopes, configuration système, départements, paramètres techniques et administratifs, journaux d'audit **complets**, administration globale de la plateforme (D-03). **Exception absolue : PrayerRequest** (D-03, D-10). | `GLOBAL` |
| `ADMIN` | Administrateur **opérationnel du contenu** : pages, départements, publications, événements, médias, **et création des comptes de responsables** (D-04). Seul rôle à voir les demandes de prière (D-10). | `GLOBAL` |
| `DEPARTMENT_MANAGER` | Responsable d'**un** département (D-02). Publie **directement**, sans validation préalable (D-06). | `DEPARTMENT` |
| *(visiteur)* | **Aucun rôle technique** (021 §2.1). Acteur public, non authentifié. | `PUBLIC` (périmètre de fait, non un `Scope` du modèle) |

**Le compte existant en production devient `ADMIN`** (D-05). Le `SUPER_ADMIN`
est un **compte distinct** (D-05).

## 1.2 Les trois scopes

| Scope | Définition (021 §6.1) | Valeur d'usage dans ce document |
| --- | --- | --- |
| `GLOBAL` | « L'utilisateur peut agir sur l'ensemble du périmètre autorisé par son rôle. » | Porté par `SUPER_ADMIN` (021 §6.1) et par `ADMIN` « pour les ressources globales qui lui sont attribuées » (021 §6.1). |
| `DEPARTMENT` | « L'utilisateur agit uniquement dans le département auquel il est associé. » | Porté par `DEPARTMENT_MANAGER`. Égalité `department_id` exigée (D-02, D-06). |
| `PRIVATE` | « La ressource est soumise à une politique d'accès restreinte. (…) Il désigne un périmètre de confidentialité particulier. » | Porté par `PrayerRequest` uniquement (`PRIVATE` + audience `ADMIN`, 021 §6.1). |

**Deux points que 028 ne tranche pas :**

- **Q-21** — le `Scope` est-il porté par **l'utilisateur** ou par **la
  ressource** ? 021 §16 le laisse explicitement ouvert : « `Scope →
  autorisation` : dépend du modèle RBAC final ». Cette matrice écrit les deux
  (scope du rôle en colonne, scope de la ressource en ligne) sans trancher la
  représentation.
- **Q-26** — la structure exacte de `MediaAccess` (droits portés, cardinalité) :
  021 §20.3 la déclare « à définir ».

`D-25` et `D-26` introduisent par ailleurs un **`visibility_scope`** sur
`Event` — notion **distincte** du `Scope` d'autorisation : « Le département
responsable et la portée publique sont **deux notions distinctes** ».

## 1.3 Rattachement d'un `DEPARTMENT_MANAGER` à un seul département (D-02)

```text
DEPARTMENT_MANAGER + department_id     ← un seul département, jamais plusieurs
```

| Règle | Conséquence d'autorisation |
| --- | --- |
| Un responsable porte **exactement un** `department_id` (D-02). | Une seule égalité suffit à décider ; il n'existe pas de « liste de départements » dans le jeton ni dans le profil. |
| Il « publie **directement** dans son département » (D-06). | Pas de validateur intermédiaire, pas d'état « en attente de validation ». |
| Presse et Ecodume sont **deux instances du même rôle** (D-01). | **Presse ↛ Ecodume** et **Ecodume ↛ Presse** sont deux cas de la **même** règle : `resource.department_id == user.department_id`. Aucune règle nominative « Presse » n'est écrite. |
| Presse et Ecodume ont seuls un espace back-office spécialisé (D-07). | `Affaires Sociales` existe comme département métier (`HouseGroup` en relève) **sans espace de gestion dédié à ce stade**. Aucun autre département n'est figé sans décision métier explicite (D-07). |

## 1.4 Authentification ≠ autorisation

Les deux opérations sont **séparées**, dans cet ordre, et **jamais** fusionnées
dans un controller (code actuel : `auth.ts` en-tête — « Authentification ET
autorisation, volontairement séparées »).

| Phase | Question posée | Où | Réponse en cas d'échec |
| --- | --- | --- | --- |
| **1. Authentification** | « Le jeton est-il valide ? » | `authenticate()` — vérifie la signature du jeton Supabase et attache l'identité. **Ne consulte pas la base.** | `401 AUTH_REQUIRED` |
| **2. Chargement du profil** | « Ce compte est-il un administrateur actif ? » | `requireAdmin()` — charge `admin_profiles`, refuse un profil absent ou `isActive = false`. | `403 FORBIDDEN` |
| **3. Autorisation** | « Ce rôle, sur ce scope, sur cette ressource, pour cette action ? » | Couche **policies** (§4), invoquée par un point unique. | `403 FORBIDDEN` |
| **4. Validation d'entrée** | « Le corps / la requête sont-ils conformes au schéma ? » | `validate()` (Zod). La validation d'une route protégée **ne précède jamais** son authentification. | `400 VALIDATION_ERROR` |

**Conséquence explicite :** « être authentifié auprès de Supabase ne confère
aucun droit » — un utilisateur authentifié **absent** de `admin_profiles` n'a
**aucune** permission. Cela vaut pour tout rôle, y compris un futur
`SUPER_ADMIN` : le rôle vient de la **base applicative**, jamais du jeton.

## 1.5 `Role` = ce qu'on peut faire · `Scope` = sur quel périmètre

```text
can(user, action, resource)
   =   roleAutorise(user.role, action, resource)
   ∧   scopeAutorise(user.scope, action, resource)
   ∧   appartenanceDépartementale(user.department_id, resource.department_id)
   ∧   contraintesPropresÀLaRessource(action, resource)
```

- `roleAutorise` → §2, matrice principale.
- `scopeAutorise` → §1.2 et §4.3.
- `appartenanceDépartementale` → §1.3 ; vaut **seulement** pour
  `DEPARTMENT_MANAGER`, et **refuse** si la ressource ne porte pas de
  `department_id`.
- `contraintesPropresÀLaRessource` → règles non-rôle : irréversibilité de
  l'archivage (D-18), `MediaAccess` (D-21, D-22), `department_id` obligatoire
  sur `Event` (D-26), contrat de template des pages (D-23), garantie
  cryptographique des prières (D-03, D-10, D-11).

---

# 2. Matrice principale — `Role × Scope × Resource × Action`

**17 ressources**, **99 lignes d'action**, **396 cellules de décision**. Colonnes :
`SUPER_ADMIN (GLOBAL)` · `ADMIN (GLOBAL)` · `DEPARTMENT_MANAGER (DEPARTMENT)` ·
`Visiteur (PUBLIC)`.

## 2.1 Users — `admin_profiles`

> **Arbitrage du 19/10/2026 — le commanditaire a tranché Q-02, Q-A4 et Q-24.**
>
> | Question | Décision |
> | --- | --- |
> | **Q-02** (lecture de l'annuaire par l'`ADMIN`) | **Ouverte à l'`ADMIN`** — cellule 1.4. |
> | **Q-02** (modification rôle / périmètre par l'`ADMIN`) | **Ouverte à l'`ADMIN`, bornée aux responsables de département** — cellule 1.5. |
> | **Q-A4** (désactivation par l'`ADMIN`) | **Ouverte à l'`ADMIN`, bornée aux responsables de département** — cellule 1.6. |
> | **Q-24** (suppression physique d'un compte) | **Réservée au `SUPER_ADMIN`** — cellule 1.8. |
>
> Les bornes ne sont pas négociables dans cet arbitrage et découlent de **D-04**,
> qui n'est pas modifié : « l'`ADMIN` n'est *inférieur*, il est **différent** ».
> Un `ADMIN` n'administre ni un pair `ADMIN`, ni un `SUPER_ADMIN` (XD-03), et il
> ne peut pas écrire un rôle qu'il ne détient pas — promouvoir un responsable en
> `ADMIN` serait s'attribuer un pouvoir par personne interposée. Personne
> n'administre **son propre** compte (désactivation, suppression) : ce serait un
> verrouillage. Implémenté dans `UserPolicy`
> (`refusePeerAdministrationByAdmin`, `refuseSelfAdministration`).

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `CREATE` compte `ADMIN` | `✔` | `✘` | `✘` | `✘` | D-03 (création et révocation des comptes `ADMIN`) ; D-04 (l'`ADMIN` ne peut pas administrer un `SUPER_ADMIN` **ni créer d'`ADMIN`**) |
| 1.2 | `CREATE` compte `DEPARTMENT_MANAGER` | `✔` | `✔` | `✘` | `✘` | D-03 ; **D-04** (« création des comptes de responsables ») |
| 1.3 | `CREATE` compte `SUPER_ADMIN` | `✔` | `✘` | `✘` | `✘` | D-03 ; **D-04** ; D-05 |
| 1.4 | `READ` annuaire administratif | `✔` | **`✔`** *(Q-02 arbitrée)* | `✘` | `✘` | D-03 ; **arbitrage du commanditaire (19/10/2026)** : lire n'est pas administrer |
| 1.5 | `UPDATE` rôle / scope d'un compte | `✔` | **`✔` sur un `DEPARTMENT_MANAGER` seulement, et vers `DEPARTMENT_MANAGER` seulement** *(Q-02 arbitrée)* | `✘` | `✘` | D-03 ; **D-04** (l'`ADMIN` gère les responsables, pas les rôles système) ; arbitrage du commanditaire |
| 1.6 | `DEACTIVATE` / `REVOKE` un compte `ADMIN` ou `DEPARTMENT_MANAGER` | `✔` | **`✔` sur un `DEPARTMENT_MANAGER` seulement** *(Q-A4 arbitrée)* | `✘` | `✘` | D-03 ; **D-04** ; arbitrage du commanditaire. Jamais sur son propre compte (verrouillage) |
| 1.7 | `ADMINISTER` (modifier / désactiver) un compte `SUPER_ADMIN` | `?` Q-03 | `✘` | `✘` | `✘` | **D-04** pour l'`ADMIN` ; 028 ne dit pas si un `SUPER_ADMIN` peut en administrer un autre (ni lui-même) — **refus par défaut maintenu**, ce qui protège le dernier accès d'administration |
| 1.8 | `DELETE` (suppression physique d'un compte) | **`✔`** *(Q-24 arbitrée ; jamais un `SUPER_ADMIN`, jamais soi-même)* | `✘` | `✘` | `✘` | Arbitrage du commanditaire (19/10/2026). Retenue par `media_access.granted_by` (`RESTRICT`, `409`) ; les autres références d'auteur sont en `SET NULL` |

**Refus explicites dans ce tableau : 20.**

> **Note d'implémentation — deux actions hors matrice.** La correction de
> l'identité d'un compte (`UPDATE_IDENTITY`) et la réinitialisation
> administrative d'un mot de passe (`RESET_PASSWORD`) ne figurent dans aucune
> cellule : elles sont accordées au `SUPER_ADMIN` seul, par alignement sur 1.5 et
> 1.6, et restent marquées `pending` dans le code en attendant une cellule
> explicite. Le changement de **son propre** mot de passe
> (`PATCH /admin/me/password`) n'est pas une administration d'autrui : il ne
> requiert que d'être un administrateur actif.

## 2.2 Departments — `departments`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | `CREATE` | `✔` | `✔` | `✘` | `✘` | D-03 (« gestion des départements ») ; D-04 (« départements ») |
| 2.2 | `READ` son département | `✔` | `✔` | `✔` (tout autre département : `✘`) | `?` Q-20 | D-02 (un seul département) ; D-06 (périmètre = « son département ») |
| 2.3 | `UPDATE` informations métier | `✔` | `✔` | `?` Q-05 | `✘` | D-03 ; D-04 ; 028 n'attribue pas la modification des informations d'un département à son responsable |
| 2.4 | `UPDATE` propriétés structurelles (`slug`, ordre d'affichage, structure de navigation, identifiants techniques, règles de visibilité globales, configuration système) | `✔` | `✔` | `✘` | `✘` | 020 §11 (« Il ne peut toutefois pas modifier les propriétés structurelles… »), **non infirmé** par 028 |
| 2.5 | `DEACTIVATE` sans supprimer | `?` 028/Q-B3 | `?` 028/Q-B3 | `✘` | `✘` | 028/Q-B3 explicitement ouverte — **la question ne porte plus que sur ce cas** |
| 2.6 | `DELETE` | `✔` | `✔` | `✘` | `✘` | **Arbitrage du commanditaire du 23/10/2026** : la suppression sort de Q-B3 et revient aux rôles globaux (`scope` `GLOBAL` exigé, comme 2.1). Le garde-fou de **D-08** est tenu par le code : `archiveAndDelete()` écrit l'instantané complet dans `department_archives` **dans la même transaction** que la suppression |
| 2.7 | `ADMINISTER` les capacités / politiques du département (D-25) | `?` Q-06 | `?` Q-06 | `?` Q-06 | `✘` | D-25 place `capabilities / policies` sur `Department` **sans nommer le rôle qui les édite** — voir **Q-06**, vecteur d'escalade |
| 2.8 | `READ` la portée événementielle du département (`visibility_scope` dérivé) | `✔` | `✔` | `✔` (le sien) | `✔` (effet public) | D-25 (« capacité événementielle globale »), D-26 |

**Refus explicites dans ce tableau : 11.**

## 2.3 Publications — `publications`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `CREATE` | `✔` | `✔` | `✔` (dans **son** département ; autre département : `✘`) | `✘` | D-04 ; **D-06** ; D-02 |
| 3.2 | `READ` back-office, **brouillons inclus** | `✔` | `✔` | `?` 028/Q-P4 | `✘` | 028/Q-P4 : « Un responsable peut-il **lire** les publications d'un autre département dans le back-office ? » |
| 3.3 | `READ` public | `PUBLISHED` `✔ PUBLIC` · `ARCHIVED` `✔ PUBLIC` (D-20) · `DRAFT` `✘` | idem | idem | `PUBLISHED` `✔`, `ARCHIVED` `✔` (D-20), `DRAFT` `✘` | **D-20** (« les archives restent publiques ») ; `DRAFT` non exposé (021 §8.1, non infirmé) |
| 3.4 | `UPDATE` | `✔` | `✔` | `✔` (son département ; autre : `✘`) | `✘` | D-06 (l'`ADMIN` conserve « modification ») ; D-18 (le responsable agit sur les publications de son département) |
| 3.5 | `DELETE` | `✔` | `✔` | `?` Q-07 | `✘` | D-06 n'attribue au responsable que la **publication** ; 028 ne reprend pas la liste de 021 §7 |
| 3.6 | `PUBLISH` (`DRAFT → PUBLISHED`) | `✔` | `✔` | `✔` **sans validation préalable** | `✘` | **D-06** (« publie directement… sans validation préalable de l'`ADMIN` ») |
| 3.7 | `ARCHIVE` (manuel) | `✔` | `✔` | `✔` | `✘` | **D-18** : « Action volontaire de l'`ADMIN` **ou du responsable du département** » |
| 3.8 | `UNARCHIVE` / retour vers `PUBLISHED` | `✘` | `✘` | `✘` | `✘` | **D-18** : « `PUBLISHED → ARCHIVED` est **irréversible** » |

**Refus explicites dans ce tableau : 14.**

> Rappels de ressource (non RBAC, mais opposables) : maximum **3 `PUBLISHED` par
> département, potentiellement moins** (D-18) ; départage `ORDER BY published_at
> ASC, id ASC` (D-19) ; `ARCHIVED` est un **état métier persistant**, pas une
> suppression (D-20).

## 2.4 Events — `events`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | `CREATE` (dans son département) | `✔` | `✔` | `✔` ; **pour un autre département : `?` 028/Q-EV2** | `✘` | D-25 (« ce que publie la Presse… »), D-26 (le département porte le responsable) ; 028/Q-EV2 explicitement ouverte |
| 4.2 | `READ` back-office | `✔` | `✔` | `?` Q-04 | `✘` | Même question que 3.2, non tranchée pour les événements |
| 4.3 | `READ` public | `✔` selon `visibility_scope` | `✔` selon `visibility_scope` | `✔` selon `visibility_scope` | `✔` selon `visibility_scope` | **D-25 / D-26** : « ce que publie la Presse concerne tout le monde ; ce que publie l'Ecodume reste un événement de l'Ecodume » |
| 4.4 | `UPDATE` | `✔` | `✔` | `✔` (son département ; autre : `✘`) | `✘` | D-26 (le département est **responsable** de l'événement) ; D-02 |
| 4.5 | `DELETE` | `✔` | `✔` | `?` Q-08 | `✘` | 028 ne nomme pas la suppression d'un événement |
| 4.6 | `SET` `visibility_scope` / attribuer la **capacité événementielle globale** | `?` Q-06 | `?` Q-06 | `?` Q-06 | `✘` | **D-25** : la portée est « une **capacité/politique du département** » — qui l'édite n'est pas tranché |
| 4.7 | `PUBLISH` / état brouillon | `?` 028/Q-EV3 | `?` 028/Q-EV3 | `?` 028/Q-EV3 | `?` 028/Q-EV3 | 028/Q-EV3 : « Les événements ont-ils un état brouillon/publié, ou sont-ils publiés à la création ? » |
| 4.8 | `CREATE` avec `department_id = NULL` | `✘` | `✘` | `✘` | `✘` | **D-26** : « Un événement global au sens d'un `department_id = NULL` **n'existe pas** » |

**Refus explicites dans ce tableau : 10.**

## 2.5 Media — `media_assets`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 5.1 | `UPLOAD` / `CREATE` | `✔` | `✔` | `✔` — le média rejoint la **bibliothèque centrale** | `✘` | **D-22** : « Un média téléversé par la Presse appartient à la **bibliothèque centrale** » |
| 5.2 | `READ` registre | `✔` | `✔` | `✔` — les médias pour lesquels un `MediaAccess` existe | `✘` | D-21, D-22 (aucun partage par défaut) ; le registre n'est pas public (code actuel, 018 §6.2) |
| 5.3 | `USE` (référencer dans un contenu) | `✔` | `✔` | `✔` **sous `MediaAccess USE`** pour son département | `✘` | **D-21** (« USE → oui » pour le Responsable Presse) ; **D-22** (Ecodume : « accès uniquement si explicitement autorisé ») |
| 5.4 | `MANAGE` (modifier la ressource) | `✔` | `✔` | `✔` « **selon périmètre** » — périmètre `?` Q-09 | `✘` | **D-21** : « MANAGE → selon périmètre » ; le périmètre n'est pas défini |
| 5.5 | `DELETE` | `✔` | `✔` | `✘` | `✘` | **D-21** : « Responsable Presse : (…) DELETE → **non** » ; « ADMIN : (…) DELETE → oui » |
| 5.6 | `REPLACE` (remplacer le fichier) | `?` Q-10 | `?` Q-10 | `✘` | `✘` | 020 §7 évoque « le remplacement éventuel d'un fichier » ; D-21 n'énumère que trois droits |
| 5.7 | `LIST` les départements autorisés d'un média | `✔` | `✔` | `?` Q-11 | `✘` | D-22 (gouvernance ADMIN/SUPER_ADMIN) ; la lecture par le responsable n'est pas tranchée |

**Refus explicites dans ce tableau : 9.**

> **D-21 est le fondement du test explicite de la permission demandée :**
> « **Pas de hiérarchie** `DELETE ⊃ MANAGE ⊃ USE` (…) Le système d'autorisation
> teste **explicitement** la permission demandée. » Un utilisateur ne reçoit
> donc **jamais** une capacité par déduction d'une autre.

## 2.6 MediaAccess

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 6.1 | `READ` les autorisations existantes | `✔` | `✔` | `?` Q-11 | `✘` | D-22 (le grant appartient à `ADMIN`/`SUPER_ADMIN`) |
| 6.2 | `GRANT` (`CREATE`) | `✔` | `✔` | `✘` | `✘` | **D-22** : « L'`ADMIN` ou le `SUPER_ADMIN` accorde l'autorisation » |
| 6.3 | `UPDATE` des droits (`USE` / `MANAGE` / `DELETE`) | `✔` | `✔` | `✘` | `✘` | D-21 (trois droits indépendants) + D-22 (l'autorisation est accordée par `ADMIN`/`SUPER_ADMIN`) |
| 6.4 | `REVOKE` (`DELETE`) | `✔` | `✔` | `✘` | `✘` | D-22 ; D-14 (révocation sans perte d'historique) |
| 6.5 | **S'ACCORDER UN ACCÈS À SOI-MÊME** | `—` | `—` | `✘` | `—` | **D-22** : « Un responsable départemental **ne peut pas se l'accorder lui-même** » |

**Refus explicites dans ce tableau : 8.**

> **Q-26** — La **structure** de `MediaAccess` (porte-t-elle un droit, trois
> droits, ou une table de droits ? qui est l'auteur du grant, existe-t-il une
> date ?) n'est pas définie : 021 §20.3 la liste comme « à définir ». Ce
> document décide **les actions**, pas la forme de la relation.

## 2.7 Pages — `static_pages`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` DEPT | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 7.1 | `READ` public | `?` Q-20 (lecture publique non arbitrée hors D-20) | `?` | `?` | `?` | Aucune décision de 028 ne régit la lecture publique des pages |
| 7.2 | `READ` back-office | `✔` | `✔` | `?` Q-05 | `✘` | D-04 (« pages ») |
| 7.3 | `UPDATE` contenu **à l'intérieur du contrat de template** | `✔` | `✔` | `?` Q-05 (page `[Département]`) | `✘` | **D-23** : « `Page.content` peut être flexible **à l'intérieur d'un contrat de template**, jamais arbitraire » ; la ligne `[Département]` est déclarée « Éditable » **sans nommer le rôle** |
| 7.4 | `CREATE` une page | `✘` | `✘` | `✘` | `✘` | **D-23** : contrat par template, « jamais de page builder » ; l'ensemble des pages est déterminé (021 §3) |
| 7.5 | `DELETE` une page | `✘` | `✘` | `✘` | `✘` | Idem |
| 7.6 | `UPDATE` structure / ordre des sections / layout / grille / animations | `✘` | `✘` | `✘` | `✘` | **D-23**, colonne « Non éditable » : « structure, ordre des sections, layout », « composition narrative, grille, animations » |

**Refus explicites dans ce tableau : 14.**

## 2.8 PrayerRequest — `prayer_requests` — ressource `PRIVATE`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` PRIVATE | `DEPARTMENT_MANAGER` | Visiteur PUBLIC | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 8.1 | `CREATE` (soumission) | `✘` | `✘` | `✘` | `✔ PUBLIC` | 021 §12.3 (seul le visiteur soumet) ; D-15 (`is_anonymous`), D-17 (aucun contact) |
| 8.2 | `READ` contenu (déchiffré) | `✘` | `✔ PRIVATE` | `✘` | `✘` | **D-10** : « L'`ADMIN` est **le seul** rôle à disposer de cette visibilité » ; **D-03** : « Exception absolue » |
| 8.3 | `READ` existence / **nombre** / dates / métadonnées | `✘` | `✔ PRIVATE` | `✘` | `✘` | **D-10** : « ni contenu · ni nom · **ni nombre de demandes** · **ni dates permettant d'en déduire l'activité** · ni notifications · ni métadonnées sensibles » |
| 8.4 | `VALIDATE` / `ARCHIVE` | `✘` | `✔ PRIVATE` | `✘` | `✘` | 021 §12.3 et I8 ; D-10 (l'`ADMIN` seul) ; **statuts** : voir Q-25 |
| 8.5 | `DELETE` (suppression manuelle) | `?` Q-19 | `?` Q-19 | `✘` | `✘` | **D-16** n'interdit que la **purge automatique** |
| 8.6 | `PURGE` automatique | `✘` | `✘` | `✘` | `✘` | **D-16** : « Aucune purge automatique. **Aucune durée arbitraire n'est inventée.** » |
| 8.7 | `EXPORT` / `DECRYPT` | `✘` | `✔ PRIVATE` | `✘` | `✘` | **D-11** : clé de données enveloppée **pour chaque Admin autorisé** ; « Pas de clé maître unique accessible au backend » |

**Refus explicites dans ce tableau : 21.**

> **Deux garanties à ne pas confondre :**
> 1. **Policy** — `PrayerPolicy` renvoie `DENY` pour `SUPER_ADMIN` (024 §9).
> 2. **Cryptographie** — « Cette exclusion est garantie **cryptographiquement**,
>    pas seulement par une policy » (D-03) ; « Le Super Admin, malgré son niveau
>    d'autorité système, ne doit pas être **techniquement capable** de lire le
>    contenu en clair » (021 §13). Un `SUPER_ADMIN` qui modifierait la policy ne
>    doit toujours pas pouvoir déchiffrer (D-11 : pas de clé maître côté backend).
>
> **D-17** : `requester_contact` est « supprimé définitivement » et « ne doit
> survivre **nulle part** ». Aucune cellule de cette matrice ne peut donc porter
> sur ce champ.

## 2.9 Notifications

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 9.1 | `RECEIVE` une notification **de `PrayerRequest`** | `✘` | `✔` | `✘` | `✘` | **D-10** : « ni notifications » pour le `SUPER_ADMIN` ; l'`ADMIN` est le seul destinataire (021 §14) |
| 9.2 | `READ` notifications (général) | `✔` | `✔` | `✘*` | `✘` | D-03 ; D-04 ; aucune attribution au responsable (Q-01, Q-12) |
| 9.3 | `MARK AS READ` (`UPDATE`) | `✔` | `✔` | `✘*` | `✘` | Idem |
| 9.4 | `DELETE` | `?` Q-12 | `?` Q-12 | `✘*` | `✘` | 028 ne traite la rétention que des prières (D-16) |

**Refus explicites dans ce tableau : 9.**

> Une notification relative à une prière **ne doit pas divulguer** le contenu
> privé (021 §14) et **ne doit pas** parvenir au `SUPER_ADMIN` (D-10). Le canal,
> les destinataires nominatifs et l'état de lecture ne sont pas tranchés
> (**Q-12**).

## 2.10 Settings — paramètres globaux / `site_settings`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 10.1 | `READ` public | `?` Q-20 | `?` | `?` | `?` | Non arbitré par 028 |
| 10.2 | `READ` back-office | `✔` | `?` Q-13 | `✘` | `✘` | **D-03** (« paramètres techniques et administratifs ») ; 020 §14 (X25) : « Cette dernière catégorie ne doit pas être exposée aux responsables de département » ; D-04 **ne mentionne pas** les paramètres |
| 10.3 | `UPDATE` | `✔` | `?` Q-13 | `✘` | `✘` | Idem |
| 10.4 | `CREATE` / `DELETE` | `—` | `—` | `—` | `—` | Document unique dans le code actuel (forme non arbitrée par 028) |

**Refus explicites dans ce tableau : 4.**

## 2.11 Leaders

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 11.1 | `READ` public | `?` Q-20 | `?` | `?` | `?` | Non arbitré par 028 |
| 11.2 | `READ` back-office | `✔` | `?` Q-14 | `?` Q-14 | `✘` | **D-24** : `Leader` = « donnée éditoriale structurée liée à l'organisation » ; **028 n'attribue aucune rôle** |
| 11.3 | `CREATE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem ; D-04 énumère « pages, départements, publications, événements, médias » **sans** `Leader` |
| 11.4 | `UPDATE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem |
| 11.5 | `DELETE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | 028/Q-API2 non tranchée |

**Refus explicites dans ce tableau : 4.**

## 2.12 Testimonies

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 12.1 | `READ` public (**exposition**) | `✘` provisoire | `✘` provisoire | `✘` provisoire | `✘` provisoire | **D-24** : « contenu éditorial persistant — **statut/modération à définir avant exposition publique** » (028/Q-PR9) |
| 12.2 | `READ` back-office | `✔` | `?` Q-14 | `?` Q-14 | `✘` | D-24 (entité persistante) ; rôle d'administration non nommé |
| 12.3 | `CREATE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem |
| 12.4 | `UPDATE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem |
| 12.5 | `DELETE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem |
| 12.6 | `MODERATE` / `PUBLISH` (statut) | `?` 028/Q-PR9 | `?` 028/Q-PR9 | `?` 028/Q-PR9 | `✘` | 028/Q-PR9 explicite |

**Refus explicites dans ce tableau : 9.**

## 2.13 CommunityFaces

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 13.1 | `READ` public | `?` Q-20 | `?` | `?` | `?` | Non arbitré par 028 |
| 13.2 | `CREATE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | **D-24** : « contenu éditorial persistant » ; rôle d'administration non nommé |
| 13.3 | `UPDATE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem |
| 13.4 | `DELETE` | `✔` | `?` Q-14 | `?` Q-14 | `✘` | Idem |

**Refus explicites dans ce tableau : 3.**

## 2.14 Verses — `scriptures`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 14.1 | `READ` public | `?` Q-20 | `?` | `?` | `?` | Non arbitré par 028 |
| 14.2 | `READ` back-office | `?` 028/Q-PG2 | `?` 028/Q-PG2 | `?` 028/Q-PG2 | `✘` | **028/Q-PG2** : « Les versets sont-ils éditables par le back-office ? » |
| 14.3 | `CREATE` | `?` 028/Q-PG2 | `?` | `?` | `✘` | Idem |
| 14.4 | `UPDATE` | `?` 028/Q-PG2 | `?` | `?` | `✘` | Idem |
| 14.5 | `DELETE` | `?` 028/Q-PG2 | `?` | `?` | `✘` | Idem |

**Refus explicites dans ce tableau : 4.**

> `Verse` est « conservé » selon D-24 comme « contenu éditorial / ressource
> biblique » — mais D-24 précise : « **Conserver ne signifie pas créer une table
> par type.** » Aucune capacité n'en découle.

## 2.15 ScheduleEntries — `schedule_entries`

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 15.1 | `READ` public | `?` Q-20 | `?` | `?` | `?` | Non arbitré par 028 |
| 15.2 | `CREATE` | `✔` | `?` Q-15 | `?` Q-15 | `✘` | **D-24** : « donnée de programmation et d'horaires » — **conservée** ; rôle d'administration non nommé |
| 15.3 | `UPDATE` | `✔` | `?` Q-15 | `?` Q-15 | `✘` | Idem |
| 15.4 | `DELETE` | `✔` | `?` Q-15 | `?` Q-15 | `✘` | Idem |

**Refus explicites dans ce tableau : 3.**

## 2.16 SocialLinks

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 16.1 | `READ` public | `?` Q-20 | `?` | `?` | `?` | Non arbitré par 028 |
| 16.2 | `READ` back-office | `✔` | `?` Q-13 | `✘` | `✘` | **D-24** : « configuration éditoriale » ; **D-03** (paramètres administratifs) ; 020 §14 (X25) |
| 16.3 | `CREATE` | `✔` | `?` Q-13 | `✘` | `✘` | Idem |
| 16.4 | `UPDATE` | `✔` | `?` Q-13 | `✘` | `✘` | Idem |
| 16.5 | `DELETE` | `✔` | `?` Q-13 | `✘` | `✘` | Idem |

**Refus explicites dans ce tableau : 8.**

## 2.17 Audit

| # | Action | `SUPER_ADMIN` GLOBAL | `ADMIN` GLOBAL | `DEPARTMENT_MANAGER` | Visiteur | Fondement |
| --- | --- | --- | --- | --- | --- | --- |
| 17.1 | `READ` journaux **complets** | `✔` | `?` Q-16 | `✘*` | `✘` | **D-03** : « consultation des journaux d'audit **complets** » ; 020 §18 / 021 §7 laissent l'`ADMIN` à « selon politique » / « selon périmètre », **non définis** (C-9) |
| 17.2 | `READ` journaux **partiels** (périmètre / politique) | `?` Q-16 | `?` Q-16 | `✘*` | `✘` | Les deux notions ne sont définies nulle part |
| 17.3 | `WRITE` une entrée d'audit | `—` système | `—` | `—` | `—` | Action du backend, hors RBAC |
| 17.4 | `PURGE` / `DELETE` des entrées | `?` Q-17 | `?` Q-17 | `✘*` | `✘` | Rétention de l'audit non tranchée (D-16 ne porte que sur les prières) |
| 17.5 | `READ` du **journal des accès aux `PrayerRequest`** | `?` **Q-18** | `?` Q-18 | `✘*` | `✘` | **Tension D-03 × D-10** : D-03 donne « journaux d'audit complets » — lire le journal des accès aux prières restitue **volume et dates**, ce que D-10 interdit au `SUPER_ADMIN` |

**Refus explicites dans ce tableau : 8.**

## 2.18 Synthèse chiffrée

| Mesure | Valeur |
| --- | --- |
| Ressources couvertes | **17 / 17** |
| Lignes d'action | **99** |
| Cellules de décision (`17 ressources × 99 actions × 4 colonnes`) | **396** |
| **Refus explicites** | **158** |
| Mentions « non tranché » (cellules `?` et annotations de périmètre) | **120** (122 avant l'arbitrage du 23/10/2026 sur la cellule 2.6) |
| Actions interdites à **tous** les rôles (règles de ressource) | 7.4, 7.5, 7.6, 8.6, 3.8, 4.8, 6.5 |

---

# 3. Matrice d'exclusion — X1 à X27, étendue

> **C'est la partie décisive du document : un RBAC se juge sur ses refus.**
> Convention de verdict : **CONFIRMÉE** (D-01 → D-26 reprennent l'interdiction,
> éventuellement en la renforçant), **MODIFIÉE** (l'interdiction subsiste mais
> son périmètre ou son effet change), **CADUQUE** (D-01 → D-26 rendent
> l'interdiction sans objet), **NON TRANCHÉE** (028 n'en traite pas → §8).

## 3.1 Verdicts sur les 27 règles

| # | Règle d'exclusion (citation de l'extrait) | Verdict | Décision(s) | Effet sur le RBAC aujourd'hui |
| --- | --- | --- | --- | --- |
| X1 | « Il ne peut pas dépasser les privilèges du Super Administrateur. » (Admin) — 020 §4.2 | **MODIFIÉE** | **D-04**, **D-03**, **D-10** | L'ordre des privilèges **n'est plus total** : l'`ADMIN` détient une capacité que le `SUPER_ADMIN` n'a pas (la lecture des prières, D-10). La règle devient : « l'`ADMIN` ne peut pas administrer un `SUPER_ADMIN` » — une interdiction **ciblée**, non une infériorité globale. À implémenter comme une règle de ressource `Users`, **jamais** comme une comparaison d'ordinal de rôle. |
| X2 | « créer un Super Administrateur ; » (Admin) — 020 §4.2 | **CONFIRMÉE** | **D-04** | Refus ferme : cellule 1.3 de §2.1. |
| X3 | « modifier ses propres privilèges pour devenir supérieur ; » (Admin) — 020 §4.2 | **NON TRANCHÉE** | D-03 (contextuel) | D-03 réserve « gestion des rôles et scopes » au `SUPER_ADMIN`, mais 028 n'énonce **aucune** interdiction explicite visant l'`ADMIN` sur ses propres privilèges. → **Q-29**. |
| X4 | « modifier les mécanismes de sécurité ; » (Admin) — 020 §4.2 | **NON TRANCHÉE** | D-03 (contextuel), D-12 | D-03 attribue au `SUPER_ADMIN` les « paramètres techniques » ; D-12 dit que le mécanisme de secours **n'est pas détenu par le `SUPER_ADMIN`** et réserve sa détention à la spécification cryptographique. La frontière de « mécanismes de sécurité » n'est pas tracée. → **Q-30**. |
| X5 | « accéder aux fonctions réservées à la gouvernance du système. » (Admin) — 020 §4.2 | **CONFIRMÉE** | **D-03** | Les fonctions de gouvernance sont désormais **énumérées** : utilisateurs et rôles, scopes, configuration système, paramètres techniques et administratifs, journaux d'audit complets, administration globale. Refus `ADMIN` : 1.1, 1.5, 1.7, 10.2, 10.3, 16.2‑16.5, 17.1. |
| X6 | « Il ne peut pas créer ou modifier un compte SUPER_ADMIN. » (Admin) — 021 §5.1 | **CONFIRMÉE** | **D-04**, D-05 | Cellules 1.3 et 1.7. La fermeture est **explicite** dans 028 (« ne peut pas administrer un SUPER_ADMIN »). |
| X7 | « modifier les pages statiques globales ; » (Responsable) — 020 §4.3 | **MODIFIÉE** | **D-23**, D-04 | La catégorie change : « pages statiques » devient « pages éditoriales structurées à contrat de template », et la ligne `[Département]` est déclarée **éditable** (D-23) **sans que le rôle titulaire soit nommé**. L'interdiction subsiste pour les pages globales ; le sort de la page départementale est **ouvert** → **Q-05**. |
| X8 | « modifier la structure du site ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-23** | Cellule 7.6 : structure, ordre des sections, layout, composition, grille, animations = **non éditables**, pour **tous** les rôles. |
| X9 | « modifier les composants ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-23** | « Les champs exacts seront **dérivés du frontend actuel et de ses templates** » ; le back-office ne touche pas aux composants. |
| X10 | « modifier le design ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-23** | Colonne « Non éditable » : layout, grille, animations, composition. |
| X11 | « accéder au département d'un autre responsable ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-02**, **D-06**, D-01 | Le rattachement **unique** (D-02) transforme l'interdiction en **égalité de département**. C'est la règle qui produit **Presse ↛ Ecodume** et **Ecodume ↛ Presse** — sans nommer aucun département. |
| X12 | « modifier les permissions ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-03**, **D-22** | Double fondement : rôles/scopes réservés au `SUPER_ADMIN` (D-03) ; le responsable « ne peut pas s'accorder lui-même » un accès média (D-22). |
| X13 | « gérer les utilisateurs ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-03**, **D-04** | Création des comptes = `SUPER_ADMIN` (tous) et `ADMIN` (responsables uniquement). Le responsable n'a rien. |
| X14 | « accéder aux fonctions du Super Administrateur ; » (Responsable) — 020 §4.3 | **CONFIRMÉE** | **D-03** | Refus par absence d'attribution + périmètre `DEPARTMENT`. |
| X15 | « accéder aux fonctions globales réservées à l'Administrateur. » (Responsable) — 020 §4.3 | **MODIFIÉE** | **D-06** | Le **contenu** de la catégorie change : il n'existe plus de fonction de **validation préalable** des contenus départementaux. Le responsable publie directement ; l'`ADMIN` conserve modification, archivage, suppression (D-06). L'interdiction d'accéder aux fonctions globales demeure. |
| X16 | « DEPARTMENT_MANAGER / Presse ne peut pas modifier les contenus d'Ecodume. » — 021 §6.1 | **CONFIRMÉE** | **D-01**, **D-02**, **D-06** | Cas particulier de X11. Reformulé **sans nommer** `PRESSE`/`ECODUME` : `resource.department_id == user.department_id`. |
| X17 | « Un responsable départemental ne peut pas s'accorder lui-même un accès. » (média) — 021 §10.2 | **CONFIRMÉE** | **D-22** | Cellule 6.5. Reprise **mot pour mot** par 028. |
| X18 | « Une publication Ecodume ne peut pas référencer un média réservé à Presse. » — 021 §11 | **CONFIRMÉE** (reformulée) | **D-21**, **D-22** | Le critère n'est plus une « réservation » intrinsèque du média mais l'existence d'un **`MediaAccess USE`** pour le département de la publication (D-22 : « accès uniquement si explicitement autorisé »). La vérification est explicite sur la permission demandée (D-21). |
| X19 | « Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière**. » — 021 §5.1 | **CONFIRMÉE et RENFORCÉE** | **D-10**, **D-03** | D-10 étend le refus : ni contenu, ni nom, **ni nombre**, ni dates, ni notifications, ni métadonnées sensibles. « Pour lui, le domaine `PrayerRequest` est **fonctionnellement inexistant**. » Cellules 8.2, 8.3, 8.4, 8.7, 9.1. |
| X20 | « Le Super Admin (…) ne doit pas être **techniquement capable** de lire le contenu en clair » — 021 §13 | **CONFIRMÉE et RENFORCÉE** | **D-03**, **D-11** | D-03 : « garantie **cryptographiquement**, pas seulement par une policy ». D-11 : « **Pas de clé maître unique accessible au backend** » → le refus ne dépend pas de la policy modifiable. |
| X21 | « Le backend ne doit donc jamais exposer le texte en clair à un acteur non autorisé. » — 021 §13 | **CONFIRMÉE** | **D-10**, **D-11**, **D-15**, **D-17** | Seul l'`ADMIN` autorisé déchiffre (D-11) ; le nom est chiffré (D-15) ; le contact est supprimé partout (D-17). |
| X22 | « Le back-office ne peut pas créer arbitrairement des sections ou modifier la structure visuelle. » — 021 §17 I11 | **CONFIRMÉE** | **D-23** | Cellules 7.4, 7.5, 7.6 : refus pour **tous** les rôles. |
| X23 | « Masquer un bouton dans le frontend ne constitue pas une protection suffisante. » — 020 §5 | **CONFIRMÉE et RENFORCÉE** | **D-03**, **D-22** | D-03 exige une garantie **cryptographique** ; D-22 exige une autorisation **explicite** pour les médias. Double exigence de non-contournement par l'interface. |
| X24 | « Le frontend ne constitue jamais la source de vérité pour les permissions. » — 020 §19 | **CONFIRMÉE** | **D-03**, **D-10**, **D-22** | Aucune décision de 028 ne déplace une décision d'autorisation vers le client. La source de vérité est la base applicative (`admin_profiles`) puis les policies (§4). |
| X25 | « Cette dernière catégorie [configuration] ne doit pas être exposée aux responsables de département. » — 020 §14 | **CONFIRMÉE** (partielle) | **D-03**, D-24 | Le responsable n'obtient **aucun** accès aux paramètres (10.2, 10.3, 16.2‑16.5). **Reste ouvert** : le périmètre de l'`ADMIN` sur les paramètres, que D-04 ne mentionne pas → **Q-13**. |
| X26 | « Il n'existe donc **pas de page builder générique**. » — 021 §2.1 | **CONFIRMÉE** | **D-23** | Titre même de D-23 : « Contrat de contenu par template, **jamais de page builder** ». |
| X27 | « Pas de `media.department_id`. » — 021 §19 | **CONFIRMÉE** | **D-21**, **D-22** | La bibliothèque reste **centrale** (D-22 : « appartient à la bibliothèque centrale ») et l'accès passe par `MediaAccess`, jamais par un rattachement du média à un département. |

## 3.2 Décompte des 27 règles

| Verdict | Nombre | Règles |
| --- | --- | --- |
| **CONFIRMÉE** (dont 3 « et renforcées », 1 reformulée, 1 partielle) | **22** | X2, X5, X6, X8, X9, X10, X11, X12, X13, X14, X16, X17, X18, X19, X20, X21, X22, X23, X24, X25, X26, X27 |
| **MODIFIÉE** | **3** | **X1**, **X7**, **X15** |
| **CADUQUE** | **0** | Aucune des 27 règles d'exclusion n'est rendue sans objet par D-01 à D-26. |
| **NON TRANCHÉE** | **2** | **X3**, **X4** |

> **Constat à retenir :** les trois règles modifiées par 028 sont les trois qui
> touchaient à la **hiérarchie des privilèges** (X1), au **périmètre éditorial du
> responsable** (X7) et au **gardiennage administratif** (X15). Aucune exclusion
> de fond n'a été levée : 028 **durcit** les refus sur les prières et les médias,
> et **déplace** le curseur sur la hiérarchie des rôles.

## 3.3 Exclusions **nouvelles** apportées par D-01 à D-26 (XD-01 → XD-17)

| # | Exclusion | Décision | Cellule(s) de §2 |
| --- | --- | --- | --- |
| XD-01 | Le `SUPER_ADMIN` n'obtient **rien** sur `PrayerRequest` : ni contenu, ni nom, ni **nombre**, ni dates, ni notifications, ni métadonnées. Le domaine est « fonctionnellement inexistant » pour lui. | D-10 | 8.2, 8.3, 9.1 |
| XD-02 | Le refus ci-dessus est **cryptographique**, pas seulement déclaratif : aucune clé maître au backend. | D-03, D-11 | 8.7 |
| XD-03 | L'`ADMIN` ne peut **pas** administrer un compte `SUPER_ADMIN` (ni le créer, ni le modifier, ni le désactiver). | D-04 | 1.3, 1.7 |
| XD-04 | Un `DEPARTMENT_MANAGER` n'agit que dans **son** département ; il ne peut pas administrer plusieurs départements avec le même rattachement. | D-02, D-06 | 2.2, 3.1, 3.4, 4.1, 4.4 |
| XD-05 | **Presse ↛ Ecodume** et **Ecodume ↛ Presse** — sans qu'aucun des deux noms n'apparaisse dans le code. | D-01, D-02, D-09 | §1.3, X16 |
| XD-06 | Interdiction de coder `PRESSE` ou `ECODUME` comme rôle : le département est une **donnée**. | D-01, D-09 | §5.2 |
| XD-07 | Un `DEPARTMENT_MANAGER` ne peut **jamais** supprimer un média. | D-21 | 5.5 |
| XD-08 | Un `DEPARTMENT_MANAGER` ne peut **jamais** s'accorder à lui-même un `MediaAccess`. | D-22 | 6.5 |
| XD-09 | Aucun partage de média par défaut : l'accès d'un département à un média est **explicite** et accordé par `ADMIN` ou `SUPER_ADMIN`. | D-22 | 5.3, 6.2, 6.3 |
| XD-10 | Aucune hiérarchie entre `USE`, `MANAGE`, `DELETE` : la permission demandée est testée **explicitement**. | D-21 | 5.3, 5.4, 5.5 |
| XD-11 | Un `DEPARTMENT_MANAGER` ne peut ni créer de compte, ni gérer les utilisateurs, ni toucher aux rôles ou aux scopes. | D-03, D-04 | 1.1‑1.8 |
| XD-12 | Un `DEPARTMENT_MANAGER` n'a aucun accès aux paramètres ni à la configuration. | D-03, D-24 | 10.2, 10.3, 16.2‑16.5 |
| XD-13 | `Affaires Sociales` n'a **pas** d'espace de gestion dédié « à ce stade » ; aucun autre département n'est figé sans décision métier explicite. | D-07 | §1.3 |
| XD-14 | Aucun retour `ARCHIVED → PUBLISHED` : la transition est **irréversible**. | D-18 | 3.8 |
| XD-15 | Aucun événement sans département responsable : `department_id = NULL` **n'existe pas**. | D-26 | 4.8 |
| XD-16 | Aucune purge automatique des demandes de prière, et **aucune durée arbitraire inventée**. | D-16 | 8.6 |
| XD-17 | `requester_contact` ne doit survivre **nulle part** : ni schéma, ni DTO, ni API, ni migration finale, ni réponse, ni donnée métier active. | D-17 | 8.1 |

**Total des refus explicites, extraction X + XD : 158 cellules (§2) + 17 exclusions transverses.**

---

# 4. Policies et mise en œuvre

## 4.1 Le catalogue de policies

`docs/024` §8 nomme **sept** policies : `PublicationPolicy`, `MediaPolicy`,
`EventPolicy`, `DepartmentPolicy`, `PagePolicy`, `PrayerPolicy`, `UserPolicy`.
Ce document les reprend **telles quelles**, et signale explicitement (§4.6) les
policies **supplémentaires** qu'exigent les ressources de §2 sans qu'aucune
décision de 028 ni 024 ne les ait nommées.

**Convention de nommage** (issue de 024 §8 : `PublicationPolicy.canUpdate(user, publication)`) :
`<Ressource>Policy.can<Action>(user, resource?)`.

| # | Policy | Ressource | Actions (méthodes) | Rôle et scope requis | Décisions |
| --- | --- | --- | --- | --- | --- |
| P-01 | `PublicationPolicy` | `Publication` | `canCreate` | `SUPER_ADMIN` `GLOBAL` · `ADMIN` `GLOBAL` · `MANAGER` `DEPARTMENT` (département forcé) | D-04, D-06 |
| | | | `canRead` / `canReadDraft` | `SUPER_ADMIN` `GLOBAL` · `ADMIN` `GLOBAL` · `MANAGER` : `?` (028/Q-P4) | 028/Q-P4 |
| | | | `canUpdate` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` si `department_id` égal | D-06 |
| | | | `canDelete` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` : `?` (Q-07) | D-06 |
| | | | `canPublish` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` **sans validation** | **D-06** |
| | | | `canArchive` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` | **D-18** |
| | | | `canUnarchive` | **`false` pour tout le monde** | **D-18** |
| P-02 | `MediaPolicy` | `Media` | `canUpload` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` | D-22 |
| | | | `canUse` | `SUPER_ADMIN` `GLOBAL` · `ADMIN` `GLOBAL` · `MANAGER` **si `MediaAccess USE`** | **D-21**, **D-22** |
| | | | `canManage` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` « selon périmètre » (`?` Q-09) | D-21 |
| | | | `canDelete` | `SUPER_ADMIN` · `ADMIN` — **`false` pour `MANAGER`** | **D-21** |
| | | | `canGrantAccess` | `SUPER_ADMIN` · `ADMIN` — **`false` pour `MANAGER`** | **D-22** |
| | | | `canReplace` | `?` (Q-10) | — |
| P-03 | `EventPolicy` | `Event` | `canCreate` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` ; autre département : `?` (028/Q-EV2) | D-25, D-26 |
| | | | `canRead` / `canReadDraft` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` : `?` (Q-04) — état : `?` (028/Q-EV3) | 028/Q-EV3 |
| | | | `canUpdate` / `canDelete` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` si `department_id` égal ; `DELETE` : `?` (Q-08) | D-26 |
| | | | `canSetVisibilityScope` | `?` pour tous (Q-06) — **dérivé de la capacité du département** | **D-25**, **D-26** |
| | | | `assertDepartmentRequired` | **`true`** : `department_id` non nul exigé à la création | **D-26** |
| P-04 | `DepartmentPolicy` | `Department` | `canCreate` | `SUPER_ADMIN` `GLOBAL` · `ADMIN` `GLOBAL` | D-03, D-04 |
| | | | `canRead` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` (le sien) | D-02 |
| | | | `canUpdateBusinessInfo` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` : `?` (Q-05) | — |
| | | | `canUpdateStructuralProps` | `SUPER_ADMIN` · `ADMIN` — **`false` pour `MANAGER`** | 020 §11 |
| | | | `canDeactivate` | `?` pour tous (028/Q-B3) | D-08 |
| | | | `canDelete` | **`SUPER_ADMIN` · `ADMIN`** (`scope` `GLOBAL`) — cellule 2.6, arbitrage du 23/10/2026 | D-08 (conservation assurée par `archiveAndDelete`) |
| | | | `canEditCapabilities` | `?` pour tous (Q-06) — voir §5.3 | **D-25** |
| P-05 | `PagePolicy` | `StaticPage` | `canRead` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` : `?` (Q-05) | D-04 |
| | | | `canUpdateContent` | `SUPER_ADMIN` · `ADMIN` · `MANAGER` : `?` (`[Département]`, Q-05) | **D-23** |
| | | | `canCreatePage` / `canDeletePage` / `canModifyStructure` / `canCreateSection` | **`false` pour tout le monde** | **D-23** |
| | | | `assertTemplateContract` | Valide `content` contre le template ; **jamais** de contenu arbitraire | **D-23** |
| P-06 | `PrayerPolicy` | `PrayerRequest` | `canSubmit` | `PUBLIC` uniquement | 021 §12.3 |
| | | | `canRead` / `canReadAggregate` | **`ADMIN` `PRIVATE` uniquement** — `DENY` explicite pour `SUPER_ADMIN`, `MANAGER`, public | **D-03**, **D-10** |
| | | | `canValidate` | `ADMIN` `PRIVATE` | 021 §12.3, I8 |
| | | | `canDecrypt` | `ADMIN` **autorisé** (clé enveloppée pour lui) | **D-11** |
| | | | `canDelete` | `?` (Q-19) — `PURGE` automatique : **`false`** | **D-16** |
| P-07 | `UserPolicy` | `AdminProfile` | `canCreateSuperAdmin` | `SUPER_ADMIN` uniquement | D-03, D-04 |
| | | | `canCreateAdmin` | `SUPER_ADMIN` uniquement | D-03 |
| | | | `canCreateManager` | `SUPER_ADMIN` · `ADMIN` | **D-04** |
| | | | `canReadProfiles` | `SUPER_ADMIN` ; **`ADMIN` `✔`** (Q-02 arbitrée) | D-03 ; arbitrage du commanditaire |
| | | | `canUpdateRoleScope` | `SUPER_ADMIN` ; **`ADMIN` `✔` sur un `DEPARTMENT_MANAGER`, vers `DEPARTMENT_MANAGER`** (Q-02 arbitrée) | D-03, D-04 ; arbitrage du commanditaire |
| | | | `canDeactivate` | `SUPER_ADMIN` ; **`ADMIN` `✔` sur un `DEPARTMENT_MANAGER`** (Q-A4 arbitrée) | D-03, D-04 ; arbitrage du commanditaire |
| | | | `canDelete` | **`SUPER_ADMIN` uniquement** (Q-24 arbitrée) ; jamais un `SUPER_ADMIN` ni soi-même | Arbitrage du commanditaire ; `media_access.granted_by` en `RESTRICT` |
| | | | `canAdministerTarget` | **`false` si la cible est `SUPER_ADMIN` et l'acteur `ADMIN`** | **D-04** |
| | | | `assertSingleDepartment` | Un `DEPARTMENT_MANAGER` porte **un** `department_id` non nul | **D-02** |

## 4.2 Où la décision est prise : **un point unique**

| Interdit | Exigé |
| --- | --- |
| Un `if (req.admin.role === …)` dans un controller. | Une policy, appelée par **un** garde d'autorisation monté dans la chaîne de middlewares. |
| Une règle départementale recopiée dans chaque service. | Un **unique** prédicat d'appartenance départementale (§4.3), réutilisé par toutes les policies. |
| Une décision d'autorisation prise dans le frontend, ou déduite de l'affichage d'un bouton. | X24 : « Le frontend ne constitue jamais la source de vérité pour les permissions. » |

**État réel du dépôt :** il **n'existe aucune couche `policies/`** aujourd'hui
(vérifié : `backend/src/**/policies/**` → aucun fichier). L'autorisation se
réduit à `requireAnyAdmin(deps.authDeps, "ROLE_ADMIN")` sur chaque route (§7).

**Forme cible**, conformément à 024 §7 (« La décision conceptuelle est
`can(user, action, resource)` ») et à 024 §8 (« L'autorisation doit être
centralisée dans une couche de policies/services ») :

```text
route
  ├── authenticate()                        → 401 AUTH_REQUIRED
  ├── requireAdmin(deps)                    → 403 FORBIDDEN
  ├── authorize(Policy, Action)             → 403 FORBIDDEN   ← POINT UNIQUE
  ├── validate({ params, query, body })     → 400 VALIDATION_ERROR
  ├── controller → use case
  │      └── Policy.canX(user, resource)    → 403 FORBIDDEN   ← décision sur l'instance
  └── réponse
```

**Deux temps, une seule couche.** Les 5 contrôles de 020 §20 (« identité · rôle ·
permission · périmètre · **propriété de la ressource** ») imposent que la policy
soit consultable deux fois : **avant** la validation (sur le type de ressource et
l'action — ne dépend d'aucune donnée d'entrée) et **après** le chargement de la
ressource (sur l'instance — `department_id`, `MediaAccess`, irréversibilité). Les
deux temps appellent **la même policy** ; aucune règle n'est dupliquée.

## 4.3 Comment une policy combine rôle **et** scope **et** appartenance départementale

```text
can(user, action, resource)
   =   P.roleAllows(user.role, action)                        ← §2
   ∧   P.scopeAllows(user.scope, action, resource)            ← §1.2
   ∧   (user.scope ≠ DEPARTMENT
        ∨ resource.department_id = user.department_id)        ← D-02, D-06
   ∧   P.resourceAllows(user, action, resource)               ← D-18, D-21, D-22, D-23, D-26
```

| Élément | Règle |
| --- | --- |
| `roleAllows` | Table §2, **explicite**. Jamais une comparaison d'ordinal entre rôles (D-04 : l'`ADMIN` n'est pas « inférieur », il est **différent** — cf. X1 modifiée). |
| `scopeAllows` | `GLOBAL` → aucune contrainte de département ; `DEPARTMENT` → contrainte d'égalité ; `PRIVATE` → politique de confidentialité dédiée (`PrayerRequest`, 021 §6.1). |
| Appartenance départementale | **Une seule égalité** (D-02). `department_id` de la ressource nul/absent → **refus**. Pour l'`ADMIN`/`SUPER_ADMIN`, la clause est **vraie** (scope `GLOBAL`). |
| `resourceAllows` | Irréversibilité `ARCHIVED` (D-18) ; `MediaAccess` explicite (D-21, D-22) ; contrat de template (D-23) ; `department_id` obligatoire sur `Event` (D-26). |
| **Barrière indépendante** | Pour `PrayerRequest`, la policy est **nécessaire mais pas suffisante** : la couche de déchiffrement ne doit offrir **aucun** chemin au `SUPER_ADMIN` (D-03, D-11). La policy refuse **et** la cryptographie refuse. |
| Défaut | `✘` — sous réserve de **Q-01** (le « refus par défaut » n'est pas explicitement arbitré). |

## 4.4 Ordre d'évaluation : authentification → autorisation → validation

| Rang | Phase | Middleware | Échec |
| --- | --- | --- | --- |
| 1 | **Authentification** | `authenticate()` | `401 AUTH_REQUIRED` |
| 2 | **Profil administrateur actif** | `requireAdmin(deps)` | `403 FORBIDDEN` |
| 3 | **Autorisation** (rôle × scope × ressource × action) | `authorize(Policy, Action)` | `403 FORBIDDEN` |
| 4 | **Validation d'entrée** | `validate({ params, query, body })` | `400 VALIDATION_ERROR` |
| 5 | Décision sur l'instance de ressource | `Policy.canX(user, resource)` dans le use case | `403 FORBIDDEN` |
| 6 | Accès aux données sensibles / déchiffrement | `CryptoService` (024 §9) | jamais atteint si 1–5 ont refusé |

**Invariant déjà testé dans le dépôt :** « La validation d'une route protégée ne
précède jamais son authentification » — et le test paramétré l'affirme
explicitement : `POST …` sans jeton → `401`, **jamais** `400`. L'insertion du
garde d'autorisation en rang 3 **ne modifie pas** cet invariant : sans jeton, le
refus tombe toujours au rang 1.

Pour `PrayerRequest`, l'ordre est **contractuel** (024 §9) :

```text
Request → Auth → PrayerPolicy → DENY / ALLOW → Repository → CryptoService
```

« Le déchiffrement n'est donc jamais une opération disponible simplement parce
que l'utilisateur possède un rôle administratif élevé. » (024 §9)

## 4.5 Mapping décision → réponse HTTP

| Situation | Code (`shared/errors/app-error.ts`) | HTTP | Émetteur | État dans le code |
| --- | --- | --- | --- | --- |
| En-tête `Authorization` absent, schéma non `Bearer`, jeton vide/mal formé/invalide/expiré | `AUTH_REQUIRED` | **401** | `authenticate()` | **Implémenté** |
| Jeton valide, **aucun** profil dans `admin_profiles` | `UNAUTHENTICATED_ADMIN` *(déclaré)* → émis aujourd'hui `FORBIDDEN` | **403** | `requireAdmin()` | Écart documenté : `UNAUTHENTICATED_ADMIN` est déclaré mais **jamais émis** (OpenAPI : « n'est pas émis par l'implémentation V1, qui répond toujours `FORBIDDEN` ») → **Q-22** |
| Profil présent mais `isActive = false` | `FORBIDDEN` | **403** | `requireAdmin()` | **Implémenté** |
| Rôle insuffisant pour l'action | `FORBIDDEN` | **403** | `authorize()` / `can*` | À construire |
| Scope incompatible ou `department_id` différent (Presse ↛ Ecodume) | `FORBIDDEN` | **403** | `can*` | À construire |
| Ressource hors périmètre mais **existante** | `FORBIDDEN` ou `NOT_FOUND` ? | **403 vs 404** | `can*` | **Non tranché** → **Q-23** |
| `SUPER_ADMIN` sur toute lecture de `PrayerRequest` | `FORBIDDEN` | **403** | `PrayerPolicy` | 024 §23 : « Le Super Admin reçoit `403` » ; **ne jamais** retourner un compteur ou une liste vide porteuse d'information (D-10 : « ni nombre ») |
| Action structurellement interdite (créer une page, modifier un layout, désarchiver) | `FORBIDDEN` | **403** | `PagePolicy` / `PublicationPolicy` | À construire ; `UNARCHIVE` : D-18 |
| Corps / params / query non conformes au schéma | `VALIDATION_ERROR` | **400** | `validate()` | **Implémenté** |
| Média non autorisé pour le département de la publication (021 §11) | `VALIDATION_ERROR` *(actuel)* ou autre ? | **400** *(actuel)* | use case | **Non tranché** → **Q-27** |
| Événement créé avec `department_id` nul | `VALIDATION_ERROR` | **400** | schéma + policy | **D-26** |

**Règles de non-fuite associées :**

1. Un refus d'autorisation ne doit **jamais** divulguer l'existence, le volume ou
   la date d'une donnée privée (D-10).
2. Un refus ne doit **jamais** être rendu par une erreur `500` : c'est un défaut
   de policy, pas une panne.
3. Le message générique est conservé ; le détail (rôle, ressource, action)
   demeure dans les journaux.

## 4.6 Policies supplémentaires exigées par les ressources de §2

Ces ressources sont exigées par la matrice mais **aucune** policy ne les couvre
dans les sept nommées par 024. Leur création **n'est pas arbitrée par 028**.

| # | Policy proposée | Ressource | Justification du besoin | Statut |
| --- | --- | --- | --- | --- |
| P-08 | `MediaAccessPolicy` | `MediaAccess` | `MediaAccess` est une **ressource à part entière** de §2.6, avec ses propres actions (`GRANT`, `UPDATE`, `REVOKE`, auto-attribution). 024 §11 la sépare explicitement : `Media` / `MediaAccess` / `StorageObject`. | **Non tranché** : 024 §8 ne la nomme pas (les règles peuvent rester dans `MediaPolicy.canGrantAccess`). |
| P-09 | `NotificationPolicy` | `Notification` | D-10 impose que le `SUPER_ADMIN` ne reçoive **aucune** notification relative à une prière. | **Non tranché** |
| P-10 | `AuditPolicy` | `AuditLog` | D-03 attribue « les journaux d'audit complets » ; 020 §18 / 021 §7 laissent l'`ADMIN` à « selon politique / selon périmètre », non définis. | **Non tranché** (Q-16, Q-17, Q-18) |
| P-11 | `EditorialEntityPolicy` | `Leader`, `Testimony`, `CommunityFace` | D-24 les déclare persistantes ; aucun rôle d'administration n'est nommé. | **Non tranché** (Q-14) |
| P-12 | `ScripturePolicy` | `Verse` / `Scripture` | 028/Q-PG2 explicitement ouverte : « Les versets sont-ils éditables par le back-office ? » | **Non tranché** |
| P-13 | `SchedulePolicy` | `ScheduleEntry` | D-24 conserve l'entité ; rôle non nommé. | **Non tranché** (Q-15) |
| P-14 | `SiteSettingsPolicy` | `SiteSettings` / `SocialLink` | D-03 (paramètres), D-24 (configuration globale / éditoriale), X25 (non-exposition au responsable). | **Non tranché** pour l'`ADMIN` (Q-13, Q-28) |

---

# 5. Extensibilité — ajouter sans réécrire

## 5.1 Principe directeur

024 §7 pose la décision sous forme de **couple (action, ressource)**, et non sous
forme d'identité de rôle. C'est ce qui rend l'extension additive :

```text
can(user, action, resource)      ← extension = une ligne de table, pas un branchement
```

## 5.2 Ajouter un **rôle**

| Étape | Ce qui change | Ce qui ne change **jamais** |
| --- | --- | --- |
| 1 | La valeur d'énumération persistée (`admin_role`) : `SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER`. | Aucune route (`*.routes.ts`). |
| 2 | Les lignes de la table §2 pour le nouveau rôle. | Aucun controller. |
| 3 | Les branches `roleAllows` des policies concernées. | Aucun autre service, aucune autre policy. |
| 4 | Le scope de rattachement s'il est autre que `GLOBAL`. | Le prédicat d'appartenance départementale (§4.3), **unique** et partagé. |
| 5 | Les tests de la matrice (§6) — un rôle de plus = une colonne de plus. | Les tests existants. |

**Interdits absolus dérivés de D-01 / D-09 :** `ROLE_PRESSE`, `ROLE_ECODUME`,
`ROLE_ADMIN_PRESSE` ou tout rôle qui encode un département. Le nom du département
« est porté par l'entité Département et ne doit pas être codé en dur dans le
RBAC » (021 §11 invariant I12).

## 5.3 Ajouter une **capacité départementale** — la capacité événementielle globale (D-25)

**Forme interdite**, telle que 028 la cite littéralement :

```ts
if (department.code === "PRESSE") { /* … */ }
```

**Forme retenue par D-25 :** la capacité est portée par la **donnée**
`Department` :

```text
Department
 ├── id
 ├── name
 ├── slug
 └── capabilities / policies   ← « capacité événementielle globale »
```

**Pourquoi c'est un point RBAC et non un détail de modèle :** c'est la capacité
de département qui décide de la **portée publique** d'un événement (D-26 :
`department_id` = qui est responsable · `visibility_scope` = qui est concerné), et
donc **qui voit l'événement**. Un département qui reçoit la capacité événementielle
globale publie pour toute l'église sans qu'une ligne de code change (D-25).

| Règle d'implémentation | Fondement |
| --- | --- |
| La politique décide à partir de **la capacité**, jamais du `code` ou du `slug` du département. | D-25 |
| Un autre département peut recevoir la même capacité **sans modifier le code métier**. | D-25 |
| Le texte de département n'entre **jamais** dans une condition d'autorisation. | D-09, 021 I12 |
| **Qui édite les capacités** : **non tranché** → **Q-06**. Un responsable qui pourrait modifier les capacités de son propre département s'attribuerait la portée globale : c'est le vecteur d'escalade le plus direct du modèle. | — |
| L'encodage exact (liste de codes, table de jointure, colonne JSON) : **non tranché** — D-25 n'arbitre que le **principe** et le nom du porteur (`capabilities / policies`). | — |

## 5.4 Ajouter une **ressource** ou une **action**

| Extension | Surface de modification |
| --- | --- |
| Nouvelle ressource (ex. une entité éditoriale de D-24) | 1 policy · 1 ligne par rôle dans §2 · 1 garde sur les routes concernées. **Aucun** changement dans les policies existantes. |
| Nouvelle action sur une ressource existante (ex. `PUBLISH`) | 1 méthode `canX` dans la policy existante · 1 ligne dans §2 · 1 test négatif. |

## 5.5 Ce que l'extensibilité **ne** permet pas

| Non extensible (et c'est voulu) | Fondement |
| --- | --- |
| Créer une page ou une section arbitraire. | D-23 |
| Réactiver une publication archivée. | D-18 |
| Donner au `SUPER_ADMIN` un accès aux prières — même par une policy modifiée. | D-03, D-11 (barrière cryptographique) |
| Déduire `DELETE` de `MANAGE`, ou `MANAGE` de `USE`. | D-21 (pas de hiérarchie) |
| Accorder un accès média par défaut à un département. | D-22 |

---

# 6. Plan de tests d'autorisation

## 6.1 Convention de canal

| Canal | Signification | Ce qu'il peut prouver |
| --- | --- | --- |
| **HTTP** | Requête réelle sur l'API (`tests/integration/routes.test.ts`). | `401` (aucun jeton) — **entièrement prouvable aujourd'hui**. Un `403` par rôle exigerait un **jeton réel** : il est **impossible de forger un jeton** (vérification par clés publiques JWKS de Supabase), donc un `403` HTTP n'est prouvable qu'avec un compte de test provisionné et un jeton obtenu par un vrai flux d'authentification. |
| **Middleware** | Appel direct de `authenticate` / `requireAdmin` / `requireRole` / `authorize` avec des doubles `req`/`res`/`next` (`tests/unit/auth-middleware.test.ts`) — identité posée sur `req.auth`, profil fourni par un double. | `401`, `403` par rôle, profil absent, profil désactivé. **C'est le canal privilégié du RBAC aujourd'hui.** |
| **Policy** | Appel direct de `Policy.canX(user, resource)`. | Toute la matrice §2, y compris les cas qu'aucune route n'expose. |
| **Service** | Use case avec repository doublé. | Règles de ressource : `MediaAccess`, contrat de template, irréversibilité d'archivage, `department_id` obligatoire. |
| **Crypto** | `CryptoService` isolé. | Le refus **non contournable** du `SUPER_ADMIN` (D-03, D-11). |
| **Statique** | Analyse du code source (test de non-régression lexicale). | D-25 / D-09 : absence de `PRESSE` / `ECODUME` dans la couche d'autorisation. |

## 6.2 Matrice `rôle × scénario × résultat attendu` — **les cas négatifs d'abord**

| # | Scénario | Acteur | Attendu | Canal | Prouvable aujourd'hui ? |
| --- | --- | --- | --- | --- | --- |
| N-01 | `GET /api/v1/prayer-requests` | `SUPER_ADMIN` | **403** `FORBIDDEN` — **aucun** compteur, **aucune** liste vide informative | Policy + HTTP | Policy : oui. HTTP : jeton réel requis |
| N-02 | `GET /api/v1/prayer-requests/:id` | `SUPER_ADMIN` | **403**, **aucun** accès au repository ni au `CryptoService` | Policy + Crypto | Oui (policy et crypto) |
| N-03 | `GET /api/v1/prayer-requests?limit=1` (métadonnée `total`) | `SUPER_ADMIN` | **403** ; assertion : **aucune** requête SQL émise | Policy + Service | Oui |
| N-04 | Notification de prière | `SUPER_ADMIN` | **Aucune** notification créée ni délivrée | Policy + Service | Oui |
| N-05 | Déchiffrement d'une demande, contexte `SUPER_ADMIN` | `SUPER_ADMIN` | **Impossible techniquement** — aucun chemin d'appel, aucune clé | Crypto | Oui (D-11) |
| N-06 | `GET /api/v1/prayer-requests/:id` | `DEPARTMENT_MANAGER` | **403** | Policy + HTTP | Idem N-01 |
| N-07 | `POST /api/v1/prayer-requests` | `ADMIN` / `SUPER_ADMIN` / `MANAGER` | **403** (soumission réservée au visiteur) | Policy | Oui |
| N-08 | `PATCH` publication d'un **autre** département | `MANAGER` Ecodume → publication Presse | **403** | Policy + HTTP | Policy : oui ; HTTP : jeton réel |
| N-09 | `PATCH` publication d'un **autre** département | `MANAGER` Presse → publication Ecodume | **403** | Policy + HTTP | Idem |
| N-10 | `POST` publication avec `department_id` d'un autre département dans le corps | `MANAGER` | **403** (ou **400**) — le département vient du **profil**, jamais du corps | Policy + Validation | Oui |
| N-11 | Créer un compte `SUPER_ADMIN` | `ADMIN` | **403** | Policy | Oui |
| N-12 | Modifier / désactiver un compte `SUPER_ADMIN` | `ADMIN` | **403** | Policy | Oui |
| N-13 | Créer un compte `ADMIN` | `ADMIN` | **403** (D-03 : réservé au `SUPER_ADMIN`) | Policy | Oui |
| N-14 | Auto-attribution d'un `MediaAccess` | `MANAGER` | **403** — refus **quelle que soit** la charge utile | Policy + Service | Oui |
| N-15 | Accorder un `MediaAccess` | `MANAGER`, même pour son propre département | **403** | Policy | Oui |
| N-16 | `DELETE /api/v1/media/:id` | `MANAGER` | **403** | Policy + HTTP | Idem N-08 |
| N-17 | `USE` d'un média sans `MediaAccess USE` pour son département | `MANAGER` Ecodume → média autorisé Presse seul | **403** / `400` (Q-27) | Service | Oui |
| N-18 | `MANAGE` déduit de `USE` | Tout rôle | **403** — le test porte sur la permission **demandée** | Policy | Oui (D-21) |
| N-19 | `DELETE` déduit de `MANAGE` | Tout rôle | **403** | Policy | Oui (D-21) |
| N-20 | Utiliser un média **réservé** à un autre département dans une publication | `MANAGER` Ecodume | Refus côté backend | Service | Oui (021 §11) |
| N-21 | `PATCH /api/v1/pages/:pageKey` sur une page globale | `MANAGER` | **403** | Policy | Oui (X7 / D-23) |
| N-22 | Créer une page | Tous rôles | **403** | Policy | Oui (D-23) |
| N-23 | Modifier la structure / l'ordre des sections / le layout | Tous rôles, **y compris `SUPER_ADMIN`** | **403** | Policy + schéma | Oui (D-23) |
| N-24 | `ARCHIVED → PUBLISHED` | Tous rôles | **403** / `409` (Q-23) | Policy | Oui (D-18) |
| N-25 | `POST /api/v1/events` avec `department_id` nul | `ADMIN`, `SUPER_ADMIN`, `MANAGER` | **400** — un événement sans département n'existe pas | Validation + Policy | Oui (D-26) |
| N-26 | Créer un événement pour un autre département | `MANAGER` Presse | **Non tranché** (028/Q-EV2) — **aucun test** avant arbitrage | — | Non |
| N-27 | Modifier les capacités de son propre département | `MANAGER` | **Non tranché** (Q-06) — à couvrir **dès** l'arbitrage, en priorité | Policy | Non |
| N-28 | Modifier les paramètres globaux | `MANAGER` | **403** | Policy + HTTP | Oui (D-03, X25) |
| N-29 | `GET /api/v1/media` (registre) | Visiteur | **401** | HTTP | **Oui, déjà couvert** |
| N-30 | Toute route protégée, **sans** jeton | Visiteur | **401** `AUTH_REQUIRED` — **jamais 400** | HTTP | **Oui, déjà couvert (test paramétré sur 40 routes)** |
| N-31 | Tout corps invalide sur route protégée, sans jeton | Visiteur | **401** avant toute validation | HTTP | **Oui, déjà couvert** |
| N-32 | Jeton valide, **aucun** profil administratif | Utilisateur authentifié quelconque | **403** (`UNAUTHENTICATED_ADMIN` ou `FORBIDDEN` — Q-22) | Middleware | Oui (double) |
| N-33 | Profil `isActive = false` | Tout rôle | **403** | Middleware | Oui (double) |
| N-34 | Modifier ses propres privilèges pour devenir supérieur | `ADMIN` | **Non tranché** (X3, Q-29) | — | Non |
| N-35 | Modifier les mécanismes de sécurité | `ADMIN` | **Non tranché** (X4, Q-30) | — | Non |
| N-36 | Aucun `PRESSE` / `ECODUME` dans la couche d'autorisation | Code | **0 occurrence** dans les policies et les décisions | **Statique** | Oui (D-25, D-09) |
| N-37 | Aucun `department_id` littéral dans une condition d'autorisation | Code | **0 occurrence** | Statique | Oui (D-25) |

## 6.3 Cas positifs (contrôle de non-vacuité)

| # | Scénario | Acteur | Attendu | Canal |
| --- | --- | --- | --- | --- |
| P-01 | Publier une publication dans son département | `MANAGER` Presse | **200/201**, état `PUBLISHED`, **sans** étape de validation | Policy + Service + HTTP |
| P-02 | Publier une 4ᵉ publication dans un département | `MANAGER` | La plus ancienne des trois passe `ARCHIVED` (max 3 `PUBLISHED`, D-18) | Service (transaction) |
| P-03 | Archiver manuellement | `ADMIN` **ou** `MANAGER` du département | **200** | Policy |
| P-04 | Lire une publication `ARCHIVED` | Visiteur | **200** — l'archive reste publique (D-20) | HTTP |
| P-05 | Lire / archiver une demande de prière | `ADMIN` autorisé | **200**, contenu **déchiffré** | HTTP + Crypto |
| P-06 | Créer un compte de responsable | `ADMIN` | **201** | HTTP |
| P-07 | Créer un compte de responsable | `SUPER_ADMIN` | **201** | HTTP |
| P-08 | Publier un événement de son département dont la portée est globale | `MANAGER` Presse | Portée publique globale **par la capacité**, non par le code du département | Policy + Service (D-25, D-26) |
| P-09 | Événement Ecodume | `MANAGER` Ecodume | Reste un événement Ecodume (portée non globale) | Service (D-26) |
| P-10 | `USE` d'un média explicitement autorisé | `MANAGER` Ecodume après grant par `ADMIN` | **200** | Service (D-22) |
| P-11 | Déposer une demande de prière | Visiteur, **sans** jeton | **201** ; `429 RATE_LIMITED` au-delà du plafond | HTTP |
| P-12 | Réutiliser le même média sur plusieurs contenus | `ADMIN` | **200**, pas de duplication | Service (020 §7) |

## 6.4 Garde anti-vacuité (obligatoire)

1. La table des routes protégées doit être **complète** : un test asserte déjà que
   le tableau n'est pas vide ; il doit aussi asserter que **chaque** route
   protégée de l'API y figure (40 entrées aujourd'hui).
2. Chaque **colonne de rôle** de §2 doit être couverte par **au moins un test
   négatif** : sinon la matrice pourrait être vide de refus sans que rien ne
   casse.
3. Chaque cellule `?` de §2 doit produire **soit** un test (si arbitrée plus
   tard) **soit** une entrée de §8 — jamais un silence.
4. Un test d'**irréversibilité** (N-24) et un test de **non-hiérarchie** (N-18,
   N-19) sont obligatoires : ce sont les deux règles que D-18 et D-21 ont
   explicitement posées contre l'intuition.

---

# 7. Écarts avec l'implémentation actuelle

## 7.1 État réel (vérifié dans le code)

| # | Constat | Preuve |
| --- | --- | --- |
| E-01 | **Un seul rôle** : `export type AdminRole = "ROLE_ADMIN"`. | `backend/src/domain/entities/index.ts` |
| E-02 | Aucune notion de **scope** ni de **département** sur le profil administrateur : `AdminProfile` = `id`, `username`, `displayName`, `role`, `isActive`, dates. | idem |
| E-03 | **Aucune couche de policies** : `backend/src/**/policies/**` → aucun fichier. | vérifié |
| E-04 | Autorisation réduite à `requireAnyAdmin(deps.authDeps, "ROLE_ADMIN")` sur **toutes** les routes protégées. | les 15 `*.routes.ts` |
| E-05 | La fabrique `requireRole(...roles)` **existe déjà** et est commentée comme prête pour un rôle de département. | `presentation/middlewares/auth.ts` |
| E-06 | Séparation authentification / autorisation **déjà en place** et testée. | `auth.ts`, `tests/unit/auth-middleware.test.ts` |
| E-07 | **Aucun `SUPER_ADMIN`** : 0 occurrence dans le code. Toute route de prière est derrière `ROLE_ADMIN`. | vérifié |
| E-08 | `PrayerRequest` porte `requesterContact` — schéma, entité, DTO, sérialiseur, repository, OpenAPI. | 12 occurrences |
| E-09 | États de prière du code : `"NEW" | "PRAYED"` — **différents** de `PENDING`/`ARCHIVED`. | `domain/entities` |
| E-10 | `PublicationStatus = "DRAFT" | "PUBLISHED"` — **pas d'`ARCHIVED`**. | idem |
| E-11 | `Event.departmentId: string | null` — **nullable**, contrairement à D-26 ; aucun `visibility_scope`. | idem |
| E-12 | `Department` ne porte **aucune** capacité. | idem |
| E-13 | `MediaAsset` n'a **aucun** `MediaAccess`. | idem |
| E-14 | **Aucune** entité `Notification`, **aucune** entité d'audit. | glob |
| E-15 | **363 tests** répartis en **13 suites** (12 fichiers `*.test.ts` + 1 fichier d'aide), dont un test paramétré sur **40 routes protégées** avec garde anti-vacuité. | `docs/026`, `tests/` |

## 7.2 Ce que le code doit changer

| # | Changement | Décisions |
| --- | --- | --- |
| C-01 | `AdminRole` : `"ROLE_ADMIN"` → `SUPER_ADMIN | ADMIN | DEPARTMENT_MANAGER` (migration d'énumération). | D-01, D-05 |
| C-02 | `AdminProfile` : ajouter `scope` et `department_id` (**un seul**, non nul pour un `DEPARTMENT_MANAGER`). | D-02 |
| C-03 | Le compte de production existant devient `ADMIN` ; créer un `SUPER_ADMIN` **distinct**. | D-05 |
| C-04 | Créer la couche de policies (P-01 → P-07) et **un** garde d'autorisation unique. | D-03, D-04, D-06, D-18, D-21, D-22 |
| C-05 | Remplacer `requireAnyAdmin(…, "ROLE_ADMIN")` par `authorize(Policy, Action)` sur **chaque** route, en conservant `authenticate → requireAdmin` en tête. | §4.4 |
| C-06 | **`PrayerPolicy`** : `DENY` pour `SUPER_ADMIN`, `MANAGER`, public ; `ALLOW` pour `ADMIN`. Ajouter les routes `MediaAccess`, notifications, etc. | **D-03, D-10** |
| C-07 | **Barrière cryptographique** : aucune clé maître côté backend ; clé de données enveloppée par Admin autorisé. | **D-03, D-11, D-13, D-14** |
| C-08 | **Supprimer `requester_contact` partout** — schéma, entité, DTO, sérialiseur, repository, OpenAPI, et purge vérifiée des données collectées. | **D-17** |
| C-09 | Chiffrer le **nom** ; `is_anonymous = true` → aucun nom stocké. | **D-15** |
| C-10 | `PublicationStatus` : ajouter `ARCHIVED`, **transition irréversible**, règle des 3 en transaction, `ORDER BY published_at ASC, id ASC`. | **D-18, D-19, D-20** |
| C-11 | `Event` : `department_id` **obligatoire** + `visibility_scope`. | **D-26** |
| C-12 | `Department` : capacités/politiques — **jamais** `if (code === "PRESSE")`. | **D-25** |
| C-13 | `MediaAccess` : modèle à droits **indépendants** ; `DELETE` refusé au responsable ; grant réservé à `ADMIN`/`SUPER_ADMIN`. | **D-21, D-22** |
| C-14 | Pages : contrat par template, structure non modifiable. | **D-23** |
| C-15 | Renommage complet `Ecodim` → `Ecodume` (données, identifiant, slug, frontend, back-office, docs). | **D-09** |
| C-16 | Codes HTTP : arbitrer `UNAUTHENTICATED_ADMIN` vs `FORBIDDEN`, et `403` vs `404`. | **Q-22, Q-23** |

## 7.3 Impact sur les 363 tests existants

### 7.3.1 Tests qui **restent valides sans modification**

| Suite / bloc | Pourquoi |
| --- | --- |
| `tests/integration/health.test.ts` | Sans autorisation. |
| `routes.test.ts` §1 (contrat `{data, meta}`), §2 / §2bis / §2ter / §2quater (validation, pagination, tri) | Ne dépendent pas du rôle. |
| `routes.test.ts` §3 — **test paramétré sur 40 routes protégées** | Assertion « sans jeton → `401 AUTH_REQUIRED` ». Ajouter un garde d'autorisation **avant** `validate` ne change pas le résultat : le refus tombe toujours à l'authentification. |
| `routes.test.ts` §4 — ordre des middlewares (`401`, jamais `400`) | L'invariant est **renforcé** : l'autorisation s'insère en rang 3, la validation reste en rang 4. |
| `routes.test.ts` §5 — non-exposition des brouillons | Indépendant du rôle. |
| `routes.test.ts` §6 — `POST /prayer-requests` (validation), §7 (rate limiting), §8 (route inexistante), §9 (query vide) | Route publique ou transverse. |
| `tests/unit/slug`, `pagination`, `file-signature`, `event-status`, `page-content`, `validate-middleware`, `app-error` | Pures, hors autorisation. |
| `tests/unit/department.service`, `event.service`, `publication.service` | Services ; impactés seulement si la signature reçoit un contexte d'autorisation — l'ajouter **en paramètre optionnel** préserve ces suites. |

**Estimation : la grande majorité des 363 tests reste valide** — le socle de
contrats d'API, de validation et de pagination est orthogonal au RBAC. C'est
précisément parce que ces tests ne testent **pas** les rôles qu'ils survivent.

### 7.3.2 Tests à **adapter**

| Fichier | Adaptation exigée | Décisions |
| --- | --- | --- |
| `tests/unit/auth-middleware.test.ts` | **Le plus touché.** Le double `adminProfile()` fixe `role: "ROLE_ADMIN"` → à paramétrer sur les 3 rôles. Le cas « rôle différent » utilise un cast `"ROLE_DEPARTMENT" as AdminRole` → à remplacer par une valeur réelle de l'énumération. `requireAnyAdmin` **assert `chain).toHaveLength(3)`** → passer à 4 si le garde d'autorisation entre dans la chaîne. Ajouter : `scope`, `department_id`, et le refus `SUPER_ADMIN` sur `PrayerRequest`. | D-01, D-02, D-03, D-10 |
| `routes.test.ts` §3 — table `ROUTES_PROTEGEES` | Ajouter une colonne `(rôle requis, scope requis)` par route : la table devient le **support anti-régression** du risque « policy oubliée sur une route ». | §4, §6.4 |
| Tests de prière | Aujourd'hui, tout porteur de `ROLE_ADMIN` lit les prières. Après migration, un `SUPER_ADMIN` qui lirait **doit** échouer (N-01, N-02) : les tests d'administration des prières doivent s'exécuter avec un profil `ADMIN`, **jamais** avec « n'importe quel administrateur ». | **D-10** |
| Tests créant un profil administrateur pour les routes de contenu | Peuvent conserver `ADMIN` (sémantiquement équivalent à l'ancien `ROLE_ADMIN` après D-05). | D-05 |
| Tests unitaires d'`app-error` / OpenAPI | Si `UNAUTHENTICATED_ADMIN` devient le code émis pour « authentifié sans profil », la référence OpenAPI (« n'est pas émis par l'implémentation V1 ») et le test d'erreur doivent suivre. | **Q-22** |

### 7.3.3 Tests **nouveaux** à écrire

| Bloc | Contenu | Priorité |
| --- | --- | --- |
| Matrice RBAC (policy) | Une ligne de test par cellule de §2 : rôle × ressource × action → `ALLOW`/`DENY`. | **1** |
| Cas négatifs inter-départements | N-08, N-09, N-10, N-17, N-20. | **1** |
| Prières | N-01 → N-07, P-05, P-11, plus le test cryptographique N-05. | **1** |
| Médias | N-14, N-15, N-16, N-18, N-19, P-10. | **2** |
| Publication | P-01, P-02, P-03, N-24. | **2** |
| Pages | N-21, N-22, N-23. | **2** |
| Statique | N-36, N-37 (absence de nom de département et de `department_id` littéral dans la couche d'autorisation). | **1** (coût nul, protège D-25) |
| Anti-vacuité | §6.4 points 1 à 3. | **1** |

## 7.4 Séquencement recommandé

```text
D-01/D-02/D-05  → migration de l'énumération + scope + department_id   (C-01, C-02, C-03)
D-04            → UserPolicy + création des responsables               (P-07)
D-10/D-03/D-11  → PrayerPolicy puis barrière cryptographique           (P-06, C-07)
D-06/D-18       → PublicationPolicy, états, irréversibilité            (C-10)
D-21/D-22       → MediaPolicy + MediaAccess                            (C-13)
D-25/D-26       → capacités de département, department_id obligatoire  (C-11, C-12)
D-23            → PagePolicy + contrats de template                    (C-14)
```

**Le RBAC ne peut pas être livré en une fois** : D-10 est une **spécification de
sécurité** (028 §3, en-tête) et D-12 renvoie la détention du mécanisme de secours
à une spécification cryptographique **préalable au Lot 8**. Tant que cette
spécification n'existe pas, la barrière cryptographique de D-03/D-11 est
**incomplète** — la policy seule serait contournable, ce que 028 interdit
explicitement.

---

# 8. Questions restantes

> **Règle appliquée :** tout point non couvert par `docs/028` est écrit
> « **non tranché** » et versé ici. **Aucun vide n'a été comblé par une
> supposition.** Les questions marquées **⚠** sont des **vecteurs d'escalade de
> privilèges** : à trancher avant toute implémentation du RBAC.

## 8.1 Questions explicitement ouvertes par `docs/028` §10

| # | Question (028 §10) | Lot | Impact sur cette matrice |
| --- | --- | --- | --- |
| **Q-A4** | Un `ADMIN` peut-il désactiver un autre `ADMIN` ? (et un `SUPER_ADMIN` ?) | 1 | Cellule 1.6 (`?`), 1.7 |
| **Q-B3** | Un département peut-il être désactivé sans être supprimé ? | 2 | Cellule 2.5 (`?`) — **la suppression (2.6) est tranchée** : `SUPER_ADMIN` · `ADMIN` `GLOBAL`, arbitrage du 23/10/2026 |
| **Q-EV2** | Un Responsable Presse peut-il créer un événement pour un autre département ? | 6 | Cellule 4.1 (`?`), N-26 |
| **Q-EV3** | Les événements ont-ils un état brouillon/publié, ou sont-ils publiés à la création ? | 6 | Cellule 4.7 (`?`) |
| **Q-P3** | La règle des 3 s'applique-t-elle par département, ou par département + type ? | 4 | N'affecte pas l'action `PUBLISH` (l'archivage est automatique), affecte le test P-02 |
| **Q-P4** | Un responsable peut-il **lire** les publications d'un autre département dans le back-office ? | 4 | Cellules 3.2, 4.2 (`?`) |
| **Q-M3** | Qui peut supprimer un média : auteur, département, ou `ADMIN` seul ? | 5 | D-21 tranche le **refus** au responsable ; le reste de Q-M3 reste ouvert |
| **Q-M4** | Types MIME et taille maximale acceptés ? | 5 | Hors RBAC (validation) |
| **Q-M5** | Médias orphelins : suppression automatique ou conservation ? | 5 | Cellule 5.5 (effet de bord) |
| **Q-PG2** | Les versets sont-ils éditables par le back-office ? | 3 | Cellules 14.2 → 14.5 (`?`) |
| **Q-API1** | Confirmer l'enveloppe `{data, meta}` et les 24 codes d'erreur (363 tests) | 10 | **Q-22** en dépend directement |
| **Q-API2** | Suppression définitive ou réversible (soft delete) ? | 10 | Cellules 1.8, 3.5, 4.5, 8.5, 11.5, 12.5, 13.4, 14.5, 15.4 (`?`) |
| **Q-API3** | Historique / audit par ressource dès le MVP, ou plus tard ? | 10 | §2.17 entier |
| **Q-PR9** | Statut / modération des `Testimony` avant exposition publique | 9 | Cellules 12.1, 12.6 (`✘` provisoire / `?`) |

## 8.2 Questions dérivées de cette matrice

| # | Question | Origine | Ressources concernées | Bloque |
| --- | --- | --- | --- | --- |
| **Q-01** | Le modèle est-il **fermé par défaut** — tout couple (rôle, ressource, action) non énuméré est-il refusé ? | Aucune décision de D-01 à D-26 ne l'énonce | **Toutes** | Toutes les cellules `✘*` |
| **Q-02** | Quel est le périmètre exact de l'`ADMIN` sur `Users` : lecture de l'annuaire, modification d'un rôle/scope, désactivation d'un `ADMIN` ? — **TRANCHÉE le 19/10/2026** : lecture `✔`, modification d'habilitation et désactivation `✔` **sur les responsables de département uniquement** (ni un pair `ADMIN`, ni un `SUPER_ADMIN`, jamais soi-même) | D-04 ne mentionne que « la création des comptes de responsables » | 1.4, 1.5, 1.6 | P-07 |
| **Q-03** | Un `SUPER_ADMIN` peut-il administrer **un autre** `SUPER_ADMIN` ? peut-il se désactiver lui-même ? combien de `SUPER_ADMIN` peuvent exister (D-05 parle d'« un compte distinct ») ? | D-03 / D-05, silencieux | 1.7 | P-07 |
| **Q-04** | Un responsable peut-il **lire** les publications et événements d'un autre département dans le back-office ? | 028/Q-P4, étendue aux événements | 3.2, 4.2 | P-01, P-03 |
| **Q-05** | Qui édite la page `[Département]` (D-23 la déclare éditable **sans nommer le rôle**) et les informations métier d'un département ? | D-23, D-04 | 2.3, 7.2, 7.3 | P-04, P-05 |
| **Q-06 ⚠** | **Qui peut éditer les capacités / politiques d'un département (D-25) ?** Un responsable qui pourrait modifier les capacités de son propre département s'attribuerait la **portée événementielle globale** — donc un pouvoir de publication à l'échelle de l'église. | D-25 ne nomme pas le rôle | 2.7, 4.6 | P-03, P-04, §5.3 |
| **Q-07** | Un responsable peut-il **supprimer** une publication de son département ? | D-06 n'attribue que la publication ; 021 §7 disait oui | 3.5 | P-01 |
| **Q-08** | Un responsable peut-il **supprimer** un événement de son département ? | 028 silencieuse | 4.5 | P-03 |
| **Q-09** | Quel est le « **périmètre** » du droit `MANAGE` d'un responsable sur un média (D-21 : « MANAGE → selon périmètre ») ? | D-21 emploie l'expression sans la définir | 5.4 | P-02 |
| **Q-10** | Le **remplacement de fichier** d'un média est-il une action distincte, et à quel droit se rattache-t-il ? | 020 §7 l'évoque ; D-21 n'énumère que trois droits | 5.6 | P-02 |
| **Q-11** | Un responsable voit-il la liste des `MediaAccess` existants (et donc indirectement les autres départements) ? | 028 silencieuse | 5.7, 6.1 | P-02, P-08 |
| **Q-12** | Notifications : canal, destinataires, état de lecture, rétention, suppression. | 028 ne traite que l'exclusion du `SUPER_ADMIN` (D-10) | 9.2 → 9.4 | P-09 |
| **Q-13** | L'`ADMIN` a-t-il un accès (lecture / écriture) aux paramètres globaux et à la configuration ? | D-04 ne les mentionne pas ; D-03 les réserve au `SUPER_ADMIN` | 10.2, 10.3, 16.2 → 16.5 | P-14 |
| **Q-14** | Qui administre `Leader`, `Testimony`, `CommunityFace` ? | D-24 les déclare persistantes **sans nommer de rôle** | 11.2 → 11.5, 12.2 → 12.5, 13.2 → 13.4 | P-11 |
| **Q-15** | Qui administre `ScheduleEntry` ? | D-24 conserve l'entité sans nommer de rôle | 15.2 → 15.4 | P-13 |
| **Q-16** | Quel est le « périmètre » d'accès de l'`ADMIN` aux journaux d'audit (« selon politique » / « selon périmètre », **non définis**) ? | 020 §18 / 021 §7, C-9 | 17.1, 17.2 | P-10 |
| **Q-17** | Rétention, archivage et purge des journaux d'audit ? | D-16 ne traite que les prières | 17.4 | P-10 |
| **Q-18 ⚠** | **Tension D-03 × D-10** : D-03 accorde au `SUPER_ADMIN` « la consultation des journaux d'audit **complets** », mais D-10 lui interdit « ni nombre de demandes, ni dates permettant d'en déduire l'activité, ni métadonnées sensibles ». Un journal d'accès aux prières **restitue volume et dates**. Le `SUPER_ADMIN` doit-il en être exclu (et le journal filtré), ou D-03 l'emporte-t-il ? | Contradiction interne entre deux décisions du même document | 17.5 | P-10, D-12/D-14 (audit des accès) |
| **Q-19** | La **suppression manuelle** d'une `PrayerRequest` est-elle autorisée ? | D-16 n'interdit que la purge **automatique** | 8.5 | P-06 |
| **Q-20** | Quel est le périmètre de la **lecture publique** pour les ressources que D-20 ne couvre pas (departments, pages, settings, leaders, testimonials, verses, schedule, social links) ? Seule la lecture publique des publications `PUBLISHED`/`ARCHIVED` est tranchée. | D-20 (publications uniquement) | 2.2, 7.1, 10.1, 11.1, 12.1, 13.1, 14.1, 15.1, 16.1 | Toutes les policies concernées |
| **Q-21** | Le `Scope` est-il porté par l'**utilisateur** ou par la **ressource** ? | 021 §16 : « dépend du modèle RBAC final » | §1.2 entier | Modèle de données |
| **Q-22** | Quel code pour « authentifié auprès du fournisseur d'identité mais sans profil administratif » : `UNAUTHENTICATED_ADMIN` (déclaré, jamais émis) ou `FORBIDDEN` (émis aujourd'hui) ? | 028/Q-API1 ; OpenAPI le documente déjà comme un écart | N-32 | Codes d'erreur |
| **Q-23** | Un accès hors périmètre à une ressource **existante** doit-il répondre `403 FORBIDDEN` ou `404 NOT_FOUND` (non-divulgation de l'existence) ? | Aucune décision de 028 | N-08, N-09, N-24 | P-01 → P-05 |
| **Q-24** | Modèle de suppression par ressource : définitive ou réversible (`soft delete`) ? — **TRANCHÉE le 19/10/2026 pour `Users`** : suppression **définitive**, réservée au `SUPER_ADMIN` (cellule 1.8). Les autres ressources restent ouvertes. | 028/Q-API2 | 1.8, 3.5, 4.5, 8.5, 11.5 → 15.4 | Toutes les policies |
| **Q-25** | États d'une `PrayerRequest` : `PENDING`/`ARCHIVED` (021 §12.2, I8) ou `NEW`/`PRAYED` (code actuel) ? 028 ne mentionne aucun état. | 028 silencieuse ; code divergent | 8.4 | P-06 |
| **Q-26** | Structure de `MediaAccess` : trois droits ? un par relation ? qui a accordé, quand ? | 021 §20.3 : « à définir » | 6.1 → 6.5 | Modèle de données |
| **Q-27** | Code HTTP de la violation « média non autorisé pour le département de la publication » : `403` (autorisation) ou `400`/`422` (règle métier) ? | 021 §11 pose la règle ; 028 ne dit pas comment elle se traduit | N-17, N-20 | P-02 |
| **Q-28** | Qui édite `SocialLink` (« configuration éditoriale », D-24) ? | D-24 ne nomme pas de rôle | 16.2 → 16.5 | P-14 |
| **Q-29** | Un `ADMIN` peut-il modifier ses **propres** privilèges pour devenir supérieur ? (règle X3, non tranchée) | 020 §4.2, X3 ; 028 silencieuse | N-34 | P-07 |
| **Q-30** | Quelle est la frontière des « **mécanismes de sécurité** » qu'un `ADMIN` ne peut pas modifier ? (règle X4, non tranchée) — D-12 place le mécanisme de secours hors du `SUPER_ADMIN` lui-même. | 020 §4.2, X4 ; D-12 | N-35 | P-06, crypto |
| **Q-31** | **Détention du mécanisme de secours** des demandes de prière et **rôles autorisés à déchiffrer** : « Sa détention exacte doit être formalisée dans la spécification cryptographique **avant implémentation** » (D-12). | D-12 | 8.7, P-06 | **Spécification cryptographique — préalable au Lot 8** |

## 8.3 Points **non tranchés** qui ne sont pas des questions mais des **réserves de garantie**

| # | Réserve | Fondement |
| --- | --- | --- |
| R-01 | La garantie « le `SUPER_ADMIN` ne lit pas les prières » **n'est pas encore** acquise par le seul RBAC : la policy est nécessaire, la cryptographie est indispensable. | D-03, D-11 |
| R-02 | Aucune décision ne décrit la **concurrence** de la règle des 3 (transaction, verrou, publication simultanée). | 028 silencieuse ; 021 §8.3 |
| R-03 | Le nombre d'`ADMIN` et la pluralité de responsables par département ne sont pas tranchés. | 028 silencieuse ; 021 §16 (`1 → 0..*`) |
| R-04 | L'effet sur le RBAC du **renommage `Ecodim` → `Ecodume`** (D-09) est nul **par construction** : le département est une donnée, jamais un rôle. Toute occurrence d'un nom de département dans la couche d'autorisation serait un défaut, pas une décision. | D-09, D-25 |

---

# 9. Synthèse

| Mesure | Valeur |
| --- | --- |
| Rôles | **3** (`SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER`) + le visiteur, non-rôle |
| Scopes | **3** (`GLOBAL`, `DEPARTMENT`, `PRIVATE`) + `visibility_scope` d'événement (notion distincte) |
| Ressources couvertes | **17 / 17** |
| Lignes d'action | **99** |
| Cellules de décision | **396** |
| **Refus explicites** | **158** |
| Mentions « non tranché » dans §2 | **122** |
| Règles d'exclusion X1–X27 | **22 confirmées · 3 modifiées · 0 caduque · 2 non tranchées** |
| Exclusions nouvelles XD-01 → XD-17 | **17** |
| Policies nommées par 024 | **7** (P-01 → P-07) |
| Policies supplémentaires exigées | **7** (P-08 → P-14), **aucune n'est arbitrée** |
| Suites de tests existantes | **13 suites / 363 tests** — la majorité reste valide ; `auth-middleware.test.ts` et la table `ROUTES_PROTEGEES` doivent être adaptés |
| Questions restantes | **14** issues de 028 §10 + **31** dérivées (Q-01 → Q-31) |

> **Ce document ne clôt pas la Phase 3.** Il formalise `docs/028` §11.2 et
> produit, conformément à la règle de 028, une liste de points **non tranchés**
> plutôt qu'un arbitrage de substitution. Les deux points à traiter **en
> priorité absolue** sont **Q-06** (qui édite les capacités de département — D-25)
> et **Q-18** (journal d'accès aux prières — D-03 × D-10), parce que le premier
> ouvre une escalade de privilèges et le second contredit une garantie
> cryptographique.
