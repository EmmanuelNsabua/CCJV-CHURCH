# 032 — Schéma SQL final

> **Statut :** spécification de schéma. Livrable n° 4 de `docs/028` §11.4.
> **Autorité :** `docs/028-decisions_arbitrees.md` **prévaut** (en-tête de 028). Ce
> document **n'arbitre rien** : il traduit en DDL les décisions D-01 à D-26 et les
> spécifications `029` (RBAC), `030` (cryptographie des prières) et `031` (contrats
> de contenu). Tout point non couvert y est écrit « **non tranché** » et versé en §8.
> **Périmètre :** modèle cible complet, énumérations, index, contraintes
> d'intégrité métier, frontière du chiffrement, conservation des données
> historiques, écarts avec les 16 tables en place.
> **Hors périmètre :** le **script de migration** lui-même (livrable n° 5 de 028
> §11.5). Ce document décrit la migration **requise**, pas son code.
> **Contenu :** du DDL de définition uniquement. Aucun code applicatif, aucun
> script d'exécution.

---

# 0. Méthode, sources et conventions

## 0.1 Sources, par ordre d'autorité

| Rang | Source | Ce qui en est tiré |
| --- | --- | --- |
| 1 | `docs/028-decisions_arbitrees.md` | D-01 → D-26. **Vérité.** Rien ici ne les contredit. |
| 2 | `docs/029-matrice_rbac.md` | **17 ressources** · 99 actions · 396 cellules. Test de complétude : toute ressource de la matrice doit exister dans le schéma. |
| 3 | `docs/030-specification_cryptographique_prieres.md` | §3 (format `EncryptedData`), §3.6 (structures de stockage), §4 (gestion des clés), §4.6 (isolation), §6 (audit et notification), §9. |
| 4 | `docs/031-schemas_contenu_pages.md` | §1 (contrat de template), §2.8 (ce qui relève de l'entité `Department`), §3.5 (`contract_version`), §5 (ce qui n'est pas dans `Page`). |
| 5 | `backend/src/infrastructure/database/schema/*.ts` et `backend/drizzle/0000_elite_pretty_boy.sql` | **État réel** : 16 tables, 6 énumérations. Aucune règle n'en est déduite. |
| 6 | `backend/src/infrastructure/database/seed-data.ts` | Données réellement présentes : 3 départements, 7 événements, 10 publications, 5 responsables, 4 témoignages, 5 visages, 7 versets, 6 rythmes, 2 réseaux sociaux, 15 réglages. Aucune donnée de prière (la graine ne comporte pas de `prayerRequests`). |

## 0.2 Test de complétude — les 17 ressources de `029` §2

`029` §2.18 annonce **17 / 17** ressources. Chacune doit exister physiquement, sinon
la matrice est inapplicable.

| # | Ressource (`029` §2) | Table du schéma cible | Statut |
| --- | --- | --- | --- |
| 1 | `.1` Users — `admin_profiles` | `public.admin_profiles` | existante, **étendue** (`scope`, `department_id`) |
| 2 | `.2` Departments — `departments` | `public.departments` + `public.department_capabilities` | existante, **étendue** (capacités D-25) |
| 3 | `.3` Publications — `publications` | `public.publications` | existante, **étendue** (`ARCHIVED`, `archived_at`, `department_id`) |
| 4 | `.4` Events — `events` | `public.events` | existante, **contrainte** (`department_id` NOT NULL, `visibility_scope`) |
| 5 | `.5` Media — `media_assets` | `public.media` | existante, **inchangée** |
| 6 | `.6` MediaAccess | `public.media_access` | **à créer** |
| 7 | `.7` Pages — `static_pages` | `public.static_pages` | existante, **étendue** (`template`, `contract_version`) |
| 8 | `.8` PrayerRequest — `prayer_requests` | `prayer_private.prayer_request` | **remplacée** (schéma isolé, chiffrée) |
| 9 | `.9` Notifications | `public.notifications` | **à créer** |
| 10 | `.10` Settings — `site_settings` | `public.site_settings` | existante, **contrainte** (`CHECK` de nommage) |
| 11 | `.11` Leaders | `public.leaders` | existante |
| 12 | `.12` Testimonies | `public.testimonies` | existante, **étendue** (`status`, D-24 / Q-PR9) |
| 13 | `.13` CommunityFaces | `public.community_faces` | existante |
| 14 | `.14` Verses — `scriptures` | `public.scriptures` | existante |
| 15 | `.15` ScheduleEntries | `public.schedule_entries` | existante, **étendue** (`department_id`) |
| 16 | `.16` SocialLinks | `public.social_links` | existante |
| 17 | `.17` Audit | `public.audit_log` + `prayer_private.prayer_audit_event` | **à créer** (deux registres disjoints, `030` §6.3.1) |

**Tables techniques supplémentaires**, exigées par `030` mais non listées comme
ressources de la matrice : `public.notification_outbox` (`030` §5.1 étape 13 et
§6.2 — atomicité sans franchir la frontière de privilèges),
`prayer_private.data_key_envelope` et `prayer_private.crypto_key` (implémentation
nécessaire de D-11, `030` §3.6.4).

## 0.3 Conventions

| Convention | Contenu |
| --- | --- |
| **DDL** | Écrit dans l'ordre d'exécution (§0.4). Les `CHECK` simples sont **en ligne** dans la définition de colonne ; les règles à plusieurs colonnes, les triggers et les index sont posés ensuite, pour rester lisibles. |
| **Nullabilité** | Toute colonne est `NOT NULL` **sauf mention explicite** d'un `NULL` autorisé. Un `NULL` autorisé est toujours justifié. |
| **`ON DELETE`** | Chaque clé étrangère porte sa règle, et la règle est justifiée en §1.5. Aucun `ON DELETE` par défaut implicite. |
| **Identifiants** | `uuid` partout, `gen_random_uuid()` (extension `pgcrypto`) pour les identifiants générés par le serveur. Les identifiants générés **par le client** (prières, `030` §3.6.1) n'ont **aucun** `DEFAULT`. |
| **Horodatage** | `timestamptz` exclusivement. Jamais de `timestamp` nu. |
| **Symboles** | ✔ conforme · ✘ interdit · **non tranché** : point non couvert par 028/029/030/031. |

## 0.4 Ordre d'exécution du DDL

`admin_profiles`, `departments` et `media` forment un **cycle**
(`departments.banner_media_id → media`, `media.uploaded_by → admin_profiles`,
`admin_profiles.department_id → departments`). Le cycle est levé en créant
`departments` **sans** sa colonne `created_by` et en posant les deux clés étrangères
par `ALTER TABLE` après coup.

```text
0.  Extension             pgcrypto (aucune autre)
1.  Énumérations          17 types (§2)
2.  Schéma prayer_private — 030 §4.6 niveau 1
    2a. crypto_key          (créée en premier : data_key_envelope la référence)
    2b. data_key_envelope
    2c. prayer_request
    2d. ALTER data_key_envelope → FK composite (prayer_request_id, request_id)
    2e. prayer_audit_event
3.  public.departments    (sans created_by)
4.  public.admin_profiles
5.  ALTER departments ADD COLUMN created_by + FK → admin_profiles
6.  public.media
7.  department_capabilities · media_access (dont trigger de destinataire) ·
    department_media
8.  public.events · event_media
9.  public.publications
10. Entités éditoriales   static_pages, scriptures, schedule_entries, social_links,
                          site_settings, leaders, testimonies, community_faces
11. Notifications         notifications, notification_outbox, audit_log
12. Triggers d'intégrité métier (§3.10)
13. Index (§10)
14. Privilèges et isolation (§5.4.1)
15. Vérifications structurelles post-création (§4.6)
```

---

# 1. Modèle cible — principes de décision

## 1.1 Ce que le schéma doit rendre **structurellement impossible**

Un schéma final ne se juge pas sur ce qu'il autorise, mais sur ce qu'aucun code
fautif ne peut écrire. Cinq interdictions sont portées par le DDL lui-même :

| # | Interdit par le schéma | Fondement | Mécanisme |
| --- | --- | --- | --- |
| 1 | Un nom stocké pour une demande anonyme | D-15, `030` §3.6.1 | `CHECK` de cohérence à trois colonnes (§3.1.3) |
| 2 | Un contact de demandeur | D-17 | colonne **inexistante** + vérification d'introspection (§4.6) |
| 3 | Un événement sans département responsable | D-26 | `department_id uuid NOT NULL` (§3.6) |
| 4 | Un retour `ARCHIVED → PUBLISHED` | D-18 | trigger de transition (§4.2) |
| 5 | Un droit média déduit d'un autre | D-21 | `media_access` à trois colonnes indépendantes, sans hiérarchie (§3.4) |

## 1.2 Trois choix de modélisation explicitement assumés

**C1 — Les capacités de département sont une table, pas une colonne JSON.**
D-25 impose que « la portée soit **dérivée de la capacité du département** » et que
le texte de département n'entre jamais dans une condition d'autorisation. L'encodage
exact est **non tranché** (`029` §5.3 : « liste de codes, table de jointure, colonne
JSON »). Le schéma retient une **table de capacités** parce qu'elle seule permet une
contrainte de clé primaire, un index de lecture par capacité et une liste fermée de
codes ; une colonne `jsonb` n'offrirait aucune de ces garanties. Ce choix est
**révisable** et figure en §8.

**C2 — `Event.visibility_scope` est persisté et vérifié, pas dérivé à la volée.**
D-26 dit que la portée est « **dérivée de la capacité du département** ». Deux
lectures existent : la dériver au calcul (aucune colonne), ou la persister et
vérifier sa cohérence. Le schéma retient la **seconde**, parce que la matrice `029`
§2.4 action 4.6 énumère `SET visibility_scope` comme une **action** — une action
suppose une donnée à écrire — et parce qu'un trigger garantit qu'aucune ligne ne peut
porter une portée incohérente avec la capacité de son département. Ce choix est
**révisable** et figure en §8.

**C3 — La règle des 3 est exprimée en contrainte déclarative, avec une réserve de
transaction.** Voir §4.1 : la réponse honnête est « oui, par un index unique partiel
sur un créneau généré, sans aucune extension », et « non, cela ne dispense pas d'une
transaction applicative sérialisée pour choisir *laquelle* publication archive ».

## 1.3 Ce que le schéma **ne** modélise **pas**, et pourquoi

| Non modélisé | Raison | Où c'est tranché |
| --- | --- | --- |
| `media.department_id` | Interdit par X27 / `021` §19 : la bibliothèque est **centrale** (D-22), l'accès passe par `MediaAccess`. | D-21, D-22 |
| `admin_profiles.password_hash` | Authentification déléguée à Supabase Auth (décision déjà en place, `admin.ts` en-tête). | en place |
| Colonnes de clé privée, DEK, fragment de custodie, KEK, clé d'environnement déchiffrante | **Ne doivent pas exister** dans le système déployé (`030` §7.2 point 9, D-11). Leur présence serait le défaut. | D-11, `030` §4.6 |
| `prayer_request.deleted_at` | D-16 : aucune purge automatique ; `030` §3.6.1 l'interdit explicitement. | D-16 |
| Rôle `PRESSE` / `ECODUME` | Interdit par D-01, D-09, XD-06 : le département est une **donnée**. | D-01, D-09 |
| Table de sections de page / page builder | D-23 : contrat par template, `content` est un jeu de **valeurs nommées**. | D-23 |
| Table `house_groups` | `HouseGroup` est mentionné par D-07 comme relevant d'`Affaires Sociales` ; **aucune** ressource de `029`, **aucune** règle de 028 ne le modélise. | **non tranché** (§8) |

## 1.4 Vue d'ensemble du modèle cible

| # | Table | Schéma | Statut | Ressource `029` |
| --- | --- | --- | --- | --- |
| 1 | `departments` | `public` | étendue | 2 |
| 2 | `admin_profiles` | `public` | étendue (`scope`, `department_id`) | 1 |
| 3 | `media` | `public` | inchangée | 5 |
| 4 | `media_access` | `public` | **créée** | 6 |
| 5 | `department_capabilities` | `public` | **créée** (D-25) | 2 |
| 6 | `department_media` | `public` | inchangée | 2 |
| 7 | `events` | `public` | contrainte (`department_id` NOT NULL, `visibility_scope`) | 4 |
| 8 | `event_media` | `public` | inchangée | 4 |
| 9 | `publications` | `public` | étendue (`ARCHIVED`, `archived_at`, `department_id`) | 3 |
| 10 | `static_pages` | `public` | étendue (`template`, `contract_version`) | 7 |
| 11 | `scriptures` | `public` | inchangée | 14 |
| 12 | `schedule_entries` | `public` | étendue (`department_id`) | 15 |
| 13 | `social_links` | `public` | inchangée | 16 |
| 14 | `site_settings` | `public` | contrainte (`CHECK` de nommage) | 10 |
| 15 | `leaders` | `public` | inchangée | 11 |
| 16 | `testimonies` | `public` | étendue (`status`) | 12 |
| 17 | `community_faces` | `public` | inchangée | 13 |
| 18 | `notifications` | `public` | **créée** | 9 |
| 19 | `notification_outbox` | `public` | **créée** (`030` §6.2) | — |
| 20 | `audit_log` | `public` | **créée** | 17 |
| 21 | `prayer_request` | `prayer_private` | **remplacée** | 8 |
| 22 | `data_key_envelope` | `prayer_private` | **créée** (D-11) | 8 |
| 23 | `crypto_key` | `prayer_private` | **créée** (D-11) | 8 |
| 24 | `prayer_audit_event` | `prayer_private` | **créée** (`030` §6.3) | 17 |

**24 tables** · **17 énumérations** (§2) · 2 schémas PostgreSQL · 2 rôles PostgreSQL
disjoints (§5.4).

## 1.5 Règles `ON DELETE` — décision et justification

Chaque règle est choisie pour **ne jamais détruire une donnée métier** ni laisser un
rattachement obligatoire orphelin.

| Clé étrangère | Règle | Justification |
| --- | --- | --- |
| `admin_profiles.department_id → departments.id` | **RESTRICT** | Un département qui porte encore un responsable ne peut pas disparaître : sinon le responsable serait rattaché à rien, et `029` §0.2 règle 2 dit qu'« un `department_id` absent ou nul vaut **refus** » — le compte deviendrait silencieusement inopérant. |
| `media.uploaded_by → admin_profiles.id` | **SET NULL** | Le média appartient à la bibliothèque **centrale** (D-22), pas à son auteur. Supprimer un compte ne doit pas détruire un fichier partagé. L'auteur est une traçabilité, pas une propriété. |
| `media_access.grantee_id` | **aucune FK** | `grantee_id` est **polymorphe** (département ou profil). Une FK conditionnelle n'existe pas en SQL : l'intégrité est portée par un trigger et deux index uniques partiels. Justifié et signalé en §4.3 (Q-S4). |
| `media_access.media_id → media.id` | **CASCADE** | Un droit d'accès n'a aucun sens sans le média. Et `media` est protégé par `RESTRICT` côté références éditoriales : un média encore utilisé par un contenu ne peut pas être supprimé, donc la cascade ne se déclenche que sur un média réellement orphelin — précisément le cas où la ligne de droit doit disparaître. |
| `media_access.granted_by → admin_profiles.id` | **RESTRICT** | Un grant est une **preuve d'autorisation** (`029` §2.6, action `GRANT` réservée à `ADMIN`/`SUPER_ADMIN`). Effacer l'auteur d'un grant rendrait l'autorisation inattribuable. La suppression du compte est donc refusée tant que ses grants subsistent ; l'alternative est une désactivation (D-03 parle de « désactivation » et « révocation », jamais de suppression physique — cf. Q-24). |
| `department_capabilities.department_id → departments.id` | **CASCADE** | Une capacité est un attribut du département, pas une entité autonome. |
| `department_capabilities.granted_by → admin_profiles.id` | **RESTRICT** | Même raison que pour `media_access` : l'auteur d'un grant de capacité est conservé (`029` Q-06). |
| `department_media`, `event_media` → entité parente | **CASCADE** | Table de jointure ordonnée : elle n'existe que par son parent. |
| `department_media`, `event_media` → `media.id` | **RESTRICT** | Déjà en place. Un média référencé par une galerie ne peut pas être supprimé : c'est le garde-fou qui rend la suppression de média sûre (D-21 : `DELETE` non accordé au responsable). |
| `events.department_id → departments.id` | **RESTRICT** *(remplace `SET NULL`)* | D-26 : « Un événement global au sens d'un `department_id = NULL` **n'existe pas** ». Une règle `SET NULL` **fabriquerait** exactement l'état interdit. C'est le changement de règle le plus important du schéma. |
| `events.image_media_id`, `events.banner_media_id` → `media.id` | **SET NULL** | Le visuel est un ornement ; la suppression du fichier ne doit pas supprimer l'événement. |
| `publications.department_id → departments.id` | **RESTRICT** | Même raison que pour `events` : une publication sans département rendrait la règle des 3 (D-18) inévaluable, et `029` §0.2 règle 2 refuse un `department_id` nul. |
| `publications.cover_media_id` → `media.id` | **SET NULL** | Ornement. |
| `leaders.department_id → departments.id` | **SET NULL** | Un responsable peut être **institutionnel** et ne relever d'aucun département : la graine contient trois responsables à `departmentName: null` (direction générale, accueil, communauté). Le rattachement est ici facultatif par nature, contrairement à `events`. |
| `schedule_entries.department_id → departments.id` | **SET NULL** | Le rythme hebdomadaire est majoritairement **institutionnel** (culte dominical). Le rattachement départemental est un enrichissement, jamais une obligation. |
| `static_pages.updated_by → admin_profiles.id` | **SET NULL** | Traçabilité de dernière écriture, pas de propriété. |
| `testimonies.moderated_by → admin_profiles.id` | **SET NULL** | Idem : la modération est un acte tracé, pas un lien constitutif. |
| `notifications.recipient_user_id → admin_profiles.id` | **CASCADE** | Une notification s'adresse à un destinataire : sans destinataire, la ligne n'a plus d'objet, et la conserver maintiendrait un lien vers un compte révoqué — ce que D-14 étape 1 interdit (« accès futur immédiatement révoqué »). |
| `audit_log.actor_user_id → admin_profiles.id` | **SET NULL**, colonne **nullable** | Un journal d'audit doit **survivre** à la disparition de l'acteur : c'est sa fonction. `NULL` y signifie « acteur supprimé » ou « acteur public » (soumission anonyme). La rétention et la purge de l'audit sont **non tranchées** (Q-17). |
| `data_key_envelope.prayer_request_id, request_id → prayer_request (id, request_id)` | **RESTRICT** | `030` §3.6.2 l'impose, et `030` §6.1 conclut : « Purge : **impossible dans le modèle** : `ON DELETE RESTRICT`, aucune colonne `deleted_at` ». La FK **composite** lie en outre l'enveloppe à sa demande : une enveloppe transposée est refusée par la base. |
| `data_key_envelope.recipient_key_ref → crypto_key.key_reference` | **RESTRICT** | Une enveloppe sans clé destinataire est indéchiffrable et non attribuable ; la révocation d'une clé **conserve** ses enveloppes (`030` §5.4 étape 2.2 : « les lignes sont CONSERVÉES : l'historique des enveloppes est une preuve »), donc la clé ne peut pas être supprimée. |
| `crypto_key.owner_user_id` | **aucune FK** | `030` §3.6.3 et §4.6 : « Pas de clé étrangère inter-schéma (§4.6). […] L'intégrité est vérifiée par le cas d'usage. » Une FK exigerait des privilèges croisés qui affaibliraient l'isolation. |
| `prayer_audit_event.prayer_request_id` | **aucune FK**, colonne nullable | `030` §6.3.3 autorise `resourceId = null` et `resourceType ∈ {PrayerRequest, PrayerKey}`. Une FK unique contredirait cette énumération. L'intégrité est portée par le cas d'usage. |
| `notification_outbox.prayer_request_id` | **aucun `REFERENCES`** | **Volontaire** : c'est le seul point de contact entre le magasin isolé et le schéma public. Une FK franchirait la frontière de privilèges que `030` §4.6 interdit (§5.3, §5.4). |
| `notifications.reference_id` | **aucune FK** | Colonne polymorphe : elle porte soit un identifiant de demande de prière (dont l'existence est invisible hors `prayer_private`), soit une référence de clé publique. |
| `departments.created_by → admin_profiles.id` | **RESTRICT**, colonne **nullable** | Traçabilité facultative. `RESTRICT` parce que l'auteur d'un département est une donnée d'historique. **Non tranché** (Q-S12). |

---

# 2. Énumérations

## 2.1 Liste complète et décision d'évolution

`ALTER TYPE … ADD VALUE` est la seule évolution **non destructive** : elle ajoute une
valeur à la fin, sans réécriture de table. En revanche, **retirer**, **renommer** ou
**réordonner** une valeur exige la reconstruction du type :

```sql
-- Recréation d'un type (procédure générale, jamais une simple commande)
ALTER TYPE   x RENAME TO x_old;
CREATE TYPE  x AS ENUM (… nouvelles valeurs …);
ALTER TABLE  t ALTER COLUMN c TYPE x USING c::text::x;   -- échoue si une valeur a disparu
DROP TYPE    x_old;
```

Conséquence normative : la valeur `'ARCHIVED'` de `publication_status` s'ajoute sans
risque, tandis que la disparition de `'NEW'`/`'PRAYED'` de `prayer_status` relève de
la reconstruction (§7), laquelle exige **avant** exécution que **toutes** les lignes
existantes portent une valeur survivante.

| # | Type | Valeurs exactes | Usage | Stratégie d'évolution |
| --- | --- | --- | --- | --- |
| 1 | `admin_role` | `SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER` | `admin_profiles.role` | **Recréation** (les valeurs existantes `ROLE_ADMIN` disparaissent). Ajout futur (ex. un 4ᵉ rôle, `029` §5.2) : `ADD VALUE`. |
| 2 | `admin_scope` | `GLOBAL`, `DEPARTMENT` | `admin_profiles.scope` | `ADD VALUE` si `029` Q-21 tranche un scope supplémentaire. **`PRIVATE` n'y figure pas** : `029` §1.2 précise que `PRIVATE` « n'est pas un rôle » et désigne le périmètre de `PrayerRequest`, jamais un scope de profil. |
| 3 | `event_visibility_scope` | `DEPARTMENT`, `GLOBAL` | `events.visibility_scope` | `ADD VALUE` (D-26 n'en fixe pas la liste exhaustive ; le trigger §3.6 tolère toute valeur future non `GLOBAL` sur un département sans capacité). |
| 4 | `publication_type` | `VIDEO`, `PHOTO`, `TEXTE` | `publications.type` | `ADD VALUE`. Aligné sur le contrat frontend implémenté ; **ne pas renommer**. |
| 5 | `publication_category` | `ACTUALITE`, `ENSEIGNEMENT`, `MEDIA`, `RESSOURCE` | `publications.category` | `ADD VALUE`. |
| 6 | `publication_status` | `DRAFT`, `PUBLISHED`, `ARCHIVED` | `publications.status` | `ADD VALUE` pour `ARCHIVED` (D-18). Aucune valeur ne doit jamais être retirée : D-20 fait d'`ARCHIVED` un « état métier **persistant** ». |
| 7 | `media_access_mode` | `USE`, `MANAGE`, `DELETE` | Documentation de `029` §2.5 ; **non utilisé comme colonne** (§3.4) | Type conservé pour la **traçabilité** de la décision D-21 et pour d'éventuels journaux. Les trois droits étant arrêtés, aucune évolution n'est possible sans revoir D-21. |
| 8 | `media_grantee_type` | `DEPARTMENT`, `ADMIN_PROFILE` | `media_access.grantee_type` | `ADD VALUE` si un grant s'adresse un jour à un autre type de principal. |
| 9 | `testimony_status` | `DRAFT`, `PENDING`, `PUBLISHED` | `testimonies.status` | **Recréation** si une valeur disparaît. `029` §2.12 action 12.1 refuse **provisoirement** toute exposition publique (D-24 / Q-PR9) : le statut par défaut reste `DRAFT`, et `PUBLISHED` n'est atteignable qu'après arbitrage. |
| 10 | `notification_type` | `PRAYER_REQUEST_RECEIVED`, `KEY_REGISTERED`, `KEY_REVOKED`, `RECOVERY_KEY_CHANGED` | `notifications.type` | `ADD VALUE`. **Liste volontairement minimale** : `030` §6.2 dit de `PRAYER_REQUEST_RECEIVED` qu'elle est la « **seule** valeur existante (**022** L138-L141). Aucune valeur n'est ajoutée (aucune décision métier inventée) » ; les trois valeurs de sécurité sont exigées par `030` §4.7 et §6.2. Aucune valeur générique de notification métier n'est créée, faute de décision. |
| 11 | `audit_action` | `USER_CREATED`, `ROLE_ASSIGNED`, `PUBLICATION_CREATED`, `PUBLICATION_UPDATED`, `PUBLICATION_PUBLISHED`, `PUBLICATION_ARCHIVED`, `PUBLICATION_DELETED`, `MEDIA_UPLOADED`, `MEDIA_UPDATED`, `MEDIA_DELETED`, `MEDIA_ACCESS_GRANTED`, `MEDIA_ACCESS_UPDATED`, `MEDIA_ACCESS_REVOKED`, `PAGE_UPDATED`, `DEPARTMENT_CREATED`, `DEPARTMENT_UPDATED`, `DEPARTMENT_CAPABILITY_CHANGED`, `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_DELETED` | `audit_log.action` | `ADD VALUE`. `030` §9 écart E2 exclut **tout** événement `PRAYER_*` de ce registre : aucune valeur `PRAYER_*` ne doit y être ajoutée. La liste est **non tranchée** dans son exhaustivité (028/Q-API3) mais fermée par principe : « aucun événement de prière dans le journal d'audit général » (`030` A11). |
| 12 | `audit_result` | `OK`, `DENIED`, `ERROR` | `audit_log.result` | `ADD VALUE`. `030` §6.3.3 écrit `"ERROR_<code technique>"` ; le code technique vit dans `metadata`, jamais dans la valeur d'énumération (une énumération doit rester fermée). |
| 13 | `prayer_status` | `PENDING`, `ARCHIVED` | `prayer_request.status` | **Recréation** (`NEW`/`PRAYED` disparaissent). Valeurs arrêtées par `030` §3.6.1 et §6.1. |
| 14 | `envelope_purpose` | `ADMIN`, `RECOVERY` | `data_key_envelope.purpose` | `ADD VALUE` si un troisième type de destinataire apparaît (D-12 n'en prévoit pas). |
| 15 | `key_purpose` | `ADMIN_DECRYPTION`, `RECOVERY` | `crypto_key.purpose` | `ADD VALUE`. |
| 16 | `key_status` | `ACTIVE`, `RETIRED`, `REVOKED` | `crypto_key.status` | `ADD VALUE`. |
| 17 | `prayer_audit_action` | `PRAYER_SUBMITTED`, `PRAYER_READ`, `PRAYER_ACCESS_DENIED`, `PRAYER_ARCHIVED`, `PRAYER_UNDECRYPTABLE`, `KEY_REGISTERED`, `KEY_REVOKED`, `KEY_RETIRED`, `ENVELOPE_REWRAPPED`, `RECOVERY_BUNDLE_EXPORTED`, `RECOVERY_ENVELOPES_IMPORTED`, `COVERAGE_ANOMALY_DETECTED` | `prayer_audit_event.action` | `ADD VALUE`. Liste **close** par `030` §6.3.2 : aucune valeur ne peut être ajoutée sans décision (toute valeur nouvelle serait un vecteur d'exposition). |

**Une énumération de l'existant disparaît** : `prayer_confidentiality`
(`private`, `community`), remplacée par la colonne booléenne `is_anonymous` (D-15,
`030` §9 écart E4). **Deux sont reconstruites** : `admin_role` et `prayer_status`.

## 2.2 DDL — énumérations

```sql
-- 0. Extension requise
--    pgcrypto : gen_random_uuid() (déjà disponible sur l'hébergement Supabase).
--    AUCUNE AUTRE extension n'est requise : la règle des 3 (§4.1) est portée par
--    un index unique partiel sur une colonne générée, et non par une contrainte
--    d'exclusion GiST — ce qui évite d'exiger btree_gist.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Énumérations -----------------------------------------------------------------

-- D-01 : trois rôles techniques. Aucun rôle de département (D-01, D-09, XD-06).
CREATE TYPE admin_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'DEPARTMENT_MANAGER'
);

-- 029 §1.2 : deux scopes PORTÉS PAR UN PROFIL. PRIVATE est un périmètre de
-- ressource, jamais un scope de profil.
CREATE TYPE admin_scope AS ENUM (
  'GLOBAL',
  'DEPARTMENT'
);

-- D-26 : portée publique d'un événement — notion DISTINCTE du scope d'autorisation.
CREATE TYPE event_visibility_scope AS ENUM (
  'DEPARTMENT',
  'GLOBAL'
);

CREATE TYPE publication_type AS ENUM (
  'VIDEO',
  'PHOTO',
  'TEXTE'
);

CREATE TYPE publication_category AS ENUM (
  'ACTUALITE',
  'ENSEIGNEMENT',
  'MEDIA',
  'RESSOURCE'
);

-- D-18/D-20 : trois états. ARCHIVED est un état métier persistant, pas une
-- suppression, et la transition PUBLISHED → ARCHIVED est irréversible.
CREATE TYPE publication_status AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
);

-- D-21 : trois droits ayant des finalités différentes, SANS hiérarchie.
-- Ce type documente le vocabulaire de la décision ; il ne sert pas de colonne :
-- media_access porte trois colonnes booléennes indépendantes (§3.4).
CREATE TYPE media_access_mode AS ENUM (
  'USE',
  'MANAGE',
  'DELETE'
);

CREATE TYPE media_grantee_type AS ENUM (
  'DEPARTMENT',
  'ADMIN_PROFILE'
);

-- D-24 + 028/Q-PR9 : le statut de modération est nécessaire AVANT toute
-- exposition publique. La valeur par défaut est DRAFT (aucune exposition).
CREATE TYPE testimony_status AS ENUM (
  'DRAFT',
  'PENDING',
  'PUBLISHED'
);

-- 030 §6.2 : PRAYER_REQUEST_RECEIVED est la seule valeur héritée (022 L138-L141),
-- complétée par les trois notifications de sécurité exigées par 030 §4.7.
-- AUCUNE notification de ce domaine ne peut viser un SUPER_ADMIN (D-10).
CREATE TYPE notification_type AS ENUM (
  'PRAYER_REQUEST_RECEIVED',
  'KEY_REGISTERED',
  'KEY_REVOKED',
  'RECOVERY_KEY_CHANGED'
);

-- 030 §6.3.1 : événements administratifs généraux uniquement. Aucune valeur
-- PRAYER_* : ces événements vivent dans prayer_private.prayer_audit_event.
CREATE TYPE audit_action AS ENUM (
  'USER_CREATED',
  'ROLE_ASSIGNED',
  'PUBLICATION_CREATED',
  'PUBLICATION_UPDATED',
  'PUBLICATION_PUBLISHED',
  'PUBLICATION_ARCHIVED',
  'PUBLICATION_DELETED',
  'MEDIA_UPLOADED',
  'MEDIA_UPDATED',
  'MEDIA_DELETED',
  'MEDIA_ACCESS_GRANTED',
  'MEDIA_ACCESS_UPDATED',
  'MEDIA_ACCESS_REVOKED',
  'PAGE_UPDATED',
  'DEPARTMENT_CREATED',
  'DEPARTMENT_UPDATED',
  'DEPARTMENT_CAPABILITY_CHANGED',
  'EVENT_CREATED',
  'EVENT_UPDATED',
  'EVENT_DELETED'
);

CREATE TYPE audit_result AS ENUM (
  'OK',
  'DENIED',
  'ERROR'
);

-- 030 §3.6.1 : deux états, arrêtés par la spécification cryptographique.
-- « ARCHIVED est un état métier persistant ; aucun retour en PENDING n'est défini. »
CREATE TYPE prayer_status AS ENUM (
  'PENDING',
  'ARCHIVED'
);

-- 030 §3.6.2 : l'enveloppe est destinée soit à un ADMIN, soit à la custodie.
CREATE TYPE envelope_purpose AS ENUM (
  'ADMIN',
  'RECOVERY'
);

-- 030 §3.6.3 : le registre public distingue une clé de déchiffrement Admin d'une
-- clé de récupération.
CREATE TYPE key_purpose AS ENUM (
  'ADMIN_DECRYPTION',
  'RECOVERY'
);

CREATE TYPE key_status AS ENUM (
  'ACTIVE',
  'RETIRED',
  'REVOKED'
);

-- 030 §6.3.2 : liste CLOSE des actions auditées. Aucune valeur supplémentaire
-- n'est admise sans décision : chacune serait une surface d'exposition.
CREATE TYPE prayer_audit_action AS ENUM (
  'PRAYER_SUBMITTED',
  'PRAYER_READ',
  'PRAYER_ACCESS_DENIED',
  'PRAYER_ARCHIVED',
  'PRAYER_UNDECRYPTABLE',
  'KEY_REGISTERED',
  'KEY_REVOKED',
  'KEY_RETIRED',
  'ENVELOPE_REWRAPPED',
  'RECOVERY_BUNDLE_EXPORTED',
  'RECOVERY_ENVELOPES_IMPORTED',
  'COVERAGE_ANOMALY_DETECTED'
);
```

---

# 3. Modèle cible — DDL complet

## 3.1 Magasin des prières — schéma `prayer_private`

> **Isolation de niveau 1 — obligatoire** (`030` §4.6, A16). Schéma dédié, deux
> rôles PostgreSQL **disjoints**, `ccjv_app` **sans aucun privilège** sur
> `prayer_private`. Les `GRANT` figurent en §5.4.1.

### 3.1.1 DDL — `crypto_key` (registre des clés **publiques**)

Créée en premier : `data_key_envelope` la référence.

```sql
CREATE SCHEMA IF NOT EXISTS prayer_private;

COMMENT ON SCHEMA prayer_private IS
  'Magasin des demandes de prière. Rôle applicatif principal (ccjv_app) SANS AUCUN '
  'privilège (030 §4.6). Chiffrement côté client : aucune clé privée, aucune DEK, '
  'aucune fonction de déchiffrement côté serveur (D-11, 030 A1/A2).';

CREATE TABLE prayer_private.crypto_key (
  -- Format imposé par 030 §3.6.3 : 'ADM-<userId>-<n>' ou 'REC-<année>-<nn>'.
  -- userId est un UUIDv4 canonique en minuscules (36 caractères, 122 bits aléatoires).
  key_reference    text          PRIMARY KEY
                   CHECK (key_reference
                          ~ '^(ADM-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9]+'
                          '|REC-[0-9]{4}-[0-9]{2})$'),

  purpose          key_purpose   NOT NULL,

  -- 030 §3.6.3 : NULL si et seulement si purpose = 'RECOVERY'.
  -- AUCUNE clé étrangère inter-schéma (030 §4.6) : l'intégrité est vérifiée
  -- par le cas d'usage, pour ne pas exiger de privilèges croisés.
  owner_user_id    uuid,

  -- DER SPKI — clé PUBLIQUE uniquement (030 §3.6.3).
  public_key_spki  bytea         NOT NULL CHECK (octet_length(public_key_spki) > 0),

  -- 030 §4.7 : base32(SHA-256(SPKI)[0..19]) en groupes de 5, affichée dans le
  -- back-office et comparable HORS BANDE entre Admins (détection R1/R2).
  -- 20 octets ⇒ 32 caractères base32 : la contrainte de forme porte donc sur des
  -- groupes de 4 à 5 caractères, séparés par des tirets.
  fingerprint      text          NOT NULL UNIQUE
                   CHECK (fingerprint ~ '^[A-Z2-7]{4,5}(-[A-Z2-7]{4,5})+$'),

  algorithm        text          NOT NULL DEFAULT 'RSA-OAEP-4096/SHA-256'
                   CHECK (algorithm = 'RSA-OAEP-4096/SHA-256'),

  status           key_status    NOT NULL DEFAULT 'ACTIVE',

  -- 030 §3.6.3 : « incrémenté à chaque événement de sécurité (D-13) ».
  -- NON TRANCHÉ (Q-S8bis) : D-13 énumère les déclencheurs (compromission,
  -- changement de politique, perte, remplacement de mécanisme, révocation) sans
  -- dire si TOUT événement incrémente une génération, ou seulement la génération
  -- d'enveloppement partagée.
  wrap_generation  integer       NOT NULL DEFAULT 1 CHECK (wrap_generation >= 1),

  -- 030 §4.7 : « au plus 2 clés ACTIVE par utilisateur (recouvrement nécessaire
  -- à la rotation) ». Les deux colonnes sont NULL pour la custodie, qui n'a
  -- qu'une clé et n'a donc pas besoin de recouvrement.
  key_slot         smallint      CHECK (key_slot IS NULL OR key_slot BETWEEN 1 AND 2),
  is_slot_active   boolean,

  created_at       timestamptz   NOT NULL DEFAULT now(),
  activated_at     timestamptz,
  retired_at       timestamptz,
  revoked_at       timestamptz,

  -- 030 §3.6.3 : owner_user_id est NULL SI ET SEULEMENT SI purpose = 'RECOVERY'.
  CONSTRAINT crypto_key_owner_exclusive CHECK (
    (purpose = 'RECOVERY'         AND owner_user_id IS NULL)
    OR
    (purpose = 'ADMIN_DECRYPTION' AND owner_user_id IS NOT NULL)
  ),

  CONSTRAINT crypto_key_slot_scope CHECK (
    (purpose = 'RECOVERY'         AND key_slot IS NULL     AND is_slot_active IS NULL)
    OR
    (purpose = 'ADMIN_DECRYPTION' AND key_slot IS NOT NULL AND is_slot_active IS NOT NULL)
  ),

  -- D-13 : la rotation sur événement change d'état ; les horodatages doivent
  -- donc être cohérents avec l'état, et un créneau ne peut rester « actif » que
  -- sur une clé ACTIVE.
  CONSTRAINT crypto_key_status_timestamps CHECK (
    (status = 'ACTIVE'  AND revoked_at IS NULL     AND retired_at IS NULL
                        AND (purpose = 'RECOVERY' OR is_slot_active IS NOT NULL))
    OR
    (status = 'RETIRED' AND revoked_at IS NULL     AND retired_at IS NOT NULL
                        AND is_slot_active = false)
    OR
    (status = 'REVOKED' AND revoked_at IS NOT NULL AND is_slot_active = false)
  )
);

COMMENT ON TABLE prayer_private.crypto_key IS
  '030 §3.6.3 — registre des clés PUBLIQUES. AUCUNE colonne de clé privée, sous '
  'aucune forme : ni en clair, ni chiffrée, ni encodée (test T2, Annexe A). '
  'La clé privée Admin vit dans le navigateur (030 §4.3, option O1 retenue) ; '
  'la clé privée RECOVERY est découpée en 3 fragments (Shamir 2/3, hors système).';
```

### 3.1.2 DDL — `data_key_envelope`

```sql
CREATE TABLE prayer_private.data_key_envelope (
  id                 uuid              PRIMARY KEY DEFAULT gen_random_uuid(),

  -- La FK est posée par ALTER TABLE à l'étape 2d : elle référence le couple
  -- (id, request_id) de prayer_request, afin que l'enveloppe soit liée à sa
  -- demande AU NIVEAU DE LA BASE et non seulement par le chiffrement.
  -- 030 §2.4 : « L'inclusion de requestId lie l'enveloppe à sa demande » ;
  -- 030 §3.4 : « toute discordance entraîne un rejet ».
  prayer_request_id  uuid              NOT NULL,
  request_id         uuid              NOT NULL,

  -- 030 §1.3, §4.1 : deux catégories de destinataires, disjointes.
  purpose            envelope_purpose  NOT NULL,

  -- Référence le registre PUBLIC des clés (030 §3.6.2). Non secret.
  recipient_key_ref  text              NOT NULL
                     REFERENCES prayer_private.crypto_key (key_reference)
                     ON DELETE RESTRICT,

  -- 030 §2.4, A4 : « RSA-OAEP-4096/SHA-256 », paramètre EXPLICITE, jamais implicite.
  wrap_algorithm     text              NOT NULL DEFAULT 'RSA-OAEP-4096/SHA-256'
                     CHECK (wrap_algorithm = 'RSA-OAEP-4096/SHA-256'),

  -- 512 octets = taille du module RSA-4096 (030 §3.2.2). La charge utile avant
  -- enveloppement est de 49 octets : 0x01 ‖ DEK(32 o) ‖ requestId(16 o).
  wrapped_key        bytea             NOT NULL
                     CHECK (octet_length(wrapped_key) = 512),

  created_at         timestamptz       NOT NULL DEFAULT now(),

  -- Renseigné lors d'une révocation ou d'un ré-enveloppement (030 §3.6.2, §5.4).
  -- La ligne est CONSERVÉE : « l'historique des enveloppes est une preuve ».
  revoked_at         timestamptz,

  CONSTRAINT data_key_envelope_revocation_order CHECK (
    revoked_at IS NULL OR revoked_at >= created_at
  )
);

COMMENT ON TABLE prayer_private.data_key_envelope IS
  '030 §3.6.2. Implémentation nécessaire de D-11 : une enveloppe par destinataire '
  'autorisé. Le ré-enveloppement est idempotent sur l''index unique partiel '
  'data_key_envelope_active_unique (colonne revoked_at NULL).';

-- ---------------------------------------------------------------------------
-- 2c. prayer_request
-- ---------------------------------------------------------------------------
CREATE TABLE prayer_private.prayer_request (
  -- Identifiant généré PAR LE CLIENT (UUIDv4 aléatoire, 030 §2.5, §3.6.1).
  -- Aucun DEFAULT : le serveur ne génère jamais cet identifiant.
  id                    uuid            PRIMARY KEY,

  -- Version du format cryptographique (030 §3.5). Entier monotone, porté par la
  -- demande, repris dans keyReference et dans l'AAD. Jamais modifié après création.
  crypto_version        smallint        NOT NULL
                        CHECK (crypto_version >= 1),

  -- Message chiffré : AES-256-GCM, tag concaténé en fin de flux (030 §3.1).
  -- bytea, JAMAIS text, JAMAIS jsonb (030 §3.2.2).
  message_ciphertext    bytea           NOT NULL
                        CHECK (octet_length(message_ciphertext) >= 16),
  message_nonce         bytea           NOT NULL
                        CHECK (octet_length(message_nonce) = 12),
  message_key_reference text            NOT NULL
                        CHECK (message_key_reference
                               ~ '^ccjv-prayer:v[0-9]+:dek:[0-9a-f-]{36}$'),

  -- Nom chiffré : NULL si et seulement si la demande est anonyme (D-15).
  name_ciphertext       bytea           CHECK (octet_length(name_ciphertext) >= 16),
  name_nonce            bytea           CHECK (octet_length(name_nonce) = 12),
  name_key_reference    text            CHECK (name_key_reference
                                               ~ '^ccjv-prayer:v[0-9]+:dek:[0-9a-f-]{36}$'),

  -- Colonne EN CLAIR, assumée (030 §9 écart E4) : nécessaire à l'interface Admin
  -- et à la contrainte D-15 ci-dessous. Fuit un bit par ligne à un adversaire de
  -- type A2 — déjà subsumé par P3 (nombre et dates), donc sans effet marginal.
  is_anonymous          boolean         NOT NULL,

  status                prayer_status   NOT NULL DEFAULT 'PENDING',

  created_at            timestamptz     NOT NULL DEFAULT now(),
  -- Renseigné lors de la transition PENDING → ARCHIVED (030 §6.1).
  validated_at          timestamptz,

  -- Colonne GÉNÉRÉE, strictement égale à `id`. Elle n'existe que pour servir de
  -- cible à la clé étrangère composite de data_key_envelope : elle rend
  -- impossible, AU NIVEAU DE LA BASE, qu'une enveloppe porte un requestId
  -- différent de celui de la demande qu'elle référence.
  request_id            uuid            GENERATED ALWAYS AS (id) STORED,

  -- ---------------------------------------------------------------------------
  -- Contraintes d'intégrité métier
  -- ---------------------------------------------------------------------------

  -- D-15 / 030 §3.6.1 : rend STRUCTURELLEMENT IMPOSSIBLE le stockage d'un nom
  -- pour une demande anonyme, et l'absence de nom pour une demande nominative.
  CONSTRAINT prayer_request_anonymity_coherence CHECK (
    (is_anonymous = true
       AND name_ciphertext    IS NULL
       AND name_nonce         IS NULL
       AND name_key_reference IS NULL)
    OR
    (is_anonymous = false
       AND name_ciphertext    IS NOT NULL
       AND name_nonce         IS NOT NULL
       AND name_key_reference IS NOT NULL)
  ),

  -- 030 §6.1 : validated_at est renseigné si et seulement si la demande est archivée.
  CONSTRAINT prayer_request_archive_coherence CHECK (
    (status = 'ARCHIVED') = (validated_at IS NOT NULL)
  ),

  -- 030 §2.2 règle 2 : le nonce est DISTINCT entre le message et le nom d'une
  -- même demande. Une DEK ne chiffre jamais plus de deux valeurs, et jamais deux
  -- fois avec le même nonce.
  CONSTRAINT prayer_request_nonce_distinct CHECK (
    name_nonce IS NULL OR name_nonce <> message_nonce
  ),

  -- 030 §3.1 et §3.5 : keyReference « identifie la DEK DE LA DEMANDE » et il est
  -- IMMUABLE. La version et l'identifiant portés doivent donc être exactement
  -- ceux de la ligne — ce qui rend toute transposition détectable en base.
  CONSTRAINT prayer_request_version_coherence CHECK (
    message_key_reference = 'ccjv-prayer:v' || crypto_version::text
                            || ':dek:' || id::text
    AND (name_key_reference IS NULL
         OR name_key_reference = 'ccjv-prayer:v' || crypto_version::text
                                 || ':dek:' || id::text)
  ),

  CONSTRAINT prayer_request_id_request_id_key UNIQUE (id, request_id)
);

COMMENT ON TABLE prayer_private.prayer_request IS
  'D-11, D-15, D-16, D-17, 030 §3.6.1. Aucune suppression automatique prévue : '
  'D-16 impose une conservation indéfinie, et deleted_at est interdit par 030 §3.6.1. '
  'AUCUNE colonne de contact (D-17) et AUCUNE colonne de secret (030 T2) : '
  'l''absence est vérifiée par les requêtes de §4.6, et non par un CHECK — une '
  'contrainte PostgreSQL ne peut pas interroger information_schema.';
COMMENT ON COLUMN prayer_private.prayer_request.is_anonymous IS
  'Seule colonne de contenu en clair, par nécessité de filtrage Admin (030 §9 E4).';

-- ---------------------------------------------------------------------------
-- 2d. Liaison en base entre l'enveloppe et sa demande
-- ---------------------------------------------------------------------------
-- 030 §2.4 impose que le requestId soit embarqué dans la charge utile enveloppée,
-- et §3.4 que le destinataire le VÉRIFIE. Le schéma va plus loin : il impose que
-- le requestId stocké sur l'enveloppe soit celui de la demande référencée, ce qui
-- rend une transposition de ligne impossible même pour une écriture directe en
-- base — sans faire confiance au seul contrôle côté navigateur.
ALTER TABLE prayer_private.data_key_envelope
  ADD CONSTRAINT data_key_envelope_request_fk
  FOREIGN KEY (prayer_request_id, request_id)
  REFERENCES prayer_private.prayer_request (id, request_id)
  ON DELETE RESTRICT;
```

### 3.1.3 DDL — `prayer_audit_event` (registre d'audit **séparé**)

```sql
CREATE TABLE prayer_private.prayer_audit_event (
  id               uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 030 §6.3.3 : « UUID, ou null pour une soumission publique ».
  -- Aucune clé étrangère : le registre est dans un schéma isolé (030 §4.6).
  actor_user_id    uuid,

  action           prayer_audit_action   NOT NULL,

  -- 030 §6.3.3 : resourceType ∈ {PrayerRequest, PrayerKey}.
  resource_type    varchar(20)           NOT NULL
                   CHECK (resource_type IN ('PrayerRequest', 'PrayerKey')),

  -- requestId ou keyReference, ou null (030 §6.3.3). Aucune FK : voir §1.5.
  resource_id      text,

  created_at       timestamptz           NOT NULL DEFAULT now(),

  result           audit_result          NOT NULL,

  -- 030 §6.3.3 : liste blanche de clés NON sensibles UNIQUEMENT. Toute autre clé
  -- provoque le rejet de l'événement (schéma Zod en .strict(), côté application).
  metadata         jsonb                 NOT NULL DEFAULT '{}'::jsonb
                   CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE prayer_private.prayer_audit_event IS
  '030 §6.3.1 et §6.3.2. Lecteurs : ADMIN uniquement — MÊME GARDE QUE LE CONTENU. '
  '030 §9 écart E2 : D-10 prévaut sur 024 §27, donc AUCUN événement PRAYER_* ne '
  'figure dans public.audit_log, dont la lecture est ouverte au SUPER_ADMIN.';
```

## 3.2 `public.departments` (D-07, D-08, D-09, D-25)

```sql
CREATE TABLE public.departments (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 031 §2.8 partie A : nom obligatoire, borné à 120.
  name              varchar(120)  NOT NULL,
  -- 031 §2.8 : slug = identifiant d'URL ET d'ancrage (OrganisationExplorer).
  slug              varchar(160)  NOT NULL UNIQUE,
  description       text,
  tagline           varchar(200),
  -- Affichage éditorial : « Responsable Presse » N'EST PAS un rôle (D-01).
  -- Le rattachement réel passe par admin_profiles.department_id.
  responsible_name  varchar(120),
  meeting_schedule  varchar(255),
  -- 031 §2.8 : « la fiche n'en affiche que 4 » (keyPoints.slice(0, 4)).
  key_points        text[],

  banner_media_id   uuid          REFERENCES public.media (id) ON DELETE SET NULL,

  -- Ordre d'affichage voulu par l'administration (031 §2.8).
  position          integer       NOT NULL DEFAULT 0,

  -- `created_by` est ajoutée à l'étape 5 (§0.4), après création de admin_profiles :
  -- elle crée sinon un cycle de dépendances. NON TRANCHÉ (Q-S12).

  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT departments_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT departments_slug_not_blank CHECK (length(btrim(slug)) > 0),
  CONSTRAINT departments_timestamps_order CHECK (updated_at >= created_at)
);

COMMENT ON TABLE public.departments IS
  'D-07, D-09 : département = DONNÉE, jamais un rôle (D-01, D-09, XD-06). '
  'D-08 : les départements historiques (Adultes, Enfants/Ecodim, Chorale) sont '
  'CONSERVÉS — voir §6.';
COMMENT ON COLUMN public.departments.responsible_name IS
  'Affichage éditorial uniquement (031 §2.8). Aucun droit n''en découle : le '
  'responsable réel est un admin_profiles de rôle DEPARTMENT_MANAGER (D-01, D-02).';
```

## 3.3 `public.admin_profiles` (D-01, D-02, D-03, D-04)

```sql
CREATE TABLE public.admin_profiles (
  -- Égale à auth.users.id (Supabase Auth) : la FK est gérée hors Drizzle, dans le
  -- schéma auth. Aucun mot de passe n'est stocké ici.
  id             uuid          PRIMARY KEY,
  username       varchar(50)   NOT NULL,
  display_name   varchar(120),

  -- D-01 : trois rôles techniques. D-05 : le compte de production devient ADMIN.
  role           admin_role    NOT NULL,

  -- 029 §1.2 : le scope dit SUR QUOI le rôle agit.
  scope          admin_scope   NOT NULL,

  -- D-02 : un DEPARTMENT_MANAGER est rattaché à UN SEUL département.
  -- Colonne simple, jamais un tableau : « il n'existe pas de liste de
  -- départements dans le jeton ni dans le profil » (029 §1.3).
  department_id  uuid          REFERENCES public.departments (id) ON DELETE RESTRICT,

  is_active      boolean       NOT NULL DEFAULT true,

  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),

  -- ---------------------------------------------------------------------------
  -- D-02 explicité en base
  -- ---------------------------------------------------------------------------
  -- Un DEPARTMENT_MANAGER porte un scope DEPARTMENT ET un department_id non nul.
  -- Un ADMIN ou SUPER_ADMIN porte GLOBAL et AUCUN département.
  -- Conséquence voulue : « un department_id absent ou nul vaut refus » (029 §0.2)
  -- ne peut jamais se produire pour un responsable, puisqu'il est NOT NULL.
  CONSTRAINT admin_profiles_scope_coherence CHECK (
    (role = 'DEPARTMENT_MANAGER'
       AND scope = 'DEPARTMENT'
       AND department_id IS NOT NULL)
    OR
    (role <> 'DEPARTMENT_MANAGER'
       AND scope = 'GLOBAL'
       AND department_id IS NULL)
  ),

  CONSTRAINT admin_profiles_timestamps_order CHECK (updated_at >= created_at),
  CONSTRAINT admin_profiles_username_not_blank CHECK (length(btrim(username)) > 0)
);

COMMENT ON TABLE public.admin_profiles IS
  'D-01 → D-05, 029 §1.4. « Être authentifié auprès de Supabase ne confère aucun '
  'droit » : le rôle vient de CETTE table, jamais du jeton. Aucune ligne ⇒ 403.';
COMMENT ON COLUMN public.admin_profiles.department_id IS
  'D-02. Non unique : la pluralité de responsables par département est NON TRANCHÉE '
  '(029 R-03). Une éventuelle unicité serait un UNIQUE (department_id), à décider.';

-- ---------------------------------------------------------------------------------
-- Étape 5 (§0.4) — lever le cycle departments ↔ admin_profiles
-- ---------------------------------------------------------------------------------
ALTER TABLE public.departments ADD COLUMN created_by uuid;

ALTER TABLE public.departments
  ADD CONSTRAINT departments_created_by_fk
  FOREIGN KEY (created_by) REFERENCES public.admin_profiles (id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.departments.created_by IS
  'Traçabilité facultative (NON TRANCHÉ, Q-S12). NULL pour les lignes historiques.';

-- D-04 : « l'ADMIN ne peut pas administrer un SUPER_ADMIN » — règle de policy,
-- pas de contrainte SQL. Elle est implémentée dans UserPolicy.canAdministerTarget
-- (029 §4.1, lignes 1.3 et 1.7) et vérifiée par les tests N-11, N-12, N-13.
```

## 3.4 `public.media` et `public.media_access` (D-21, D-22, X27)

```sql
CREATE TABLE public.media (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket       varchar(100)  NOT NULL,
  -- Chemin interne au bucket, généré par le serveur. Jamais fourni par le client.
  path         text          NOT NULL UNIQUE,
  -- URL publique dénormalisée : évite une signature à chaque lecture.
  public_url   text          NOT NULL,
  -- Type MIME DÉDUIT DU CONTENU BINAIRE, pas de l'en-tête client.
  mime_type    varchar(100)  NOT NULL,
  size_bytes   integer       NOT NULL CHECK (size_bytes > 0),
  width        integer       CHECK (width  IS NULL OR width  > 0),
  height       integer       CHECK (height IS NULL OR height > 0),
  -- Accessibilité WCAG 2.2 AA. Son caractère obligatoire est NON TRANCHÉ
  -- (031 Q-PG6 : les composants codent alt="" et n'exposent aucune prop alt).
  alt          text,

  -- Traçabilité de l'auteur. SET NULL : le média appartient à la BIBLIOTHÈQUE
  -- CENTRALE (D-22), pas à son auteur.
  uploaded_by  uuid          REFERENCES public.admin_profiles (id) ON DELETE SET NULL,

  created_at   timestamptz   NOT NULL DEFAULT now(),

  -- 028/Q-M4 : les types MIME et la taille maximale acceptés sont NON TRANCHÉS.
  -- Le code actuel accepte JPEG/PNG/WebP/AVIF et 5 Mo ; ce CHECK n'est donc PAS
  -- écrit ici, pour ne pas figer une décision de validation qui n'appartient pas
  -- au schéma.
  CONSTRAINT media_path_not_blank CHECK (length(btrim(path)) > 0)
);

COMMENT ON TABLE public.media IS
  'X27 / 021 §19 : PAS de media.department_id. La bibliothèque est centrale (D-22) ; '
  'l''accès d''un département passe UNIQUEMENT par media_access.';

-- ---------------------------------------------------------------------------------
-- D-21 + D-22 + XD-09 : « aucun partage par défaut ».
-- Trois droits INDÉPENDANTS — « pas de hiérarchie DELETE ⊃ MANAGE ⊃ USE ».
-- Aucun drapeau agrégé, aucun niveau, aucun ordinal : aucune capacité ne peut
-- être reçue par déduction d'une autre.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.media_access (
  id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),

  media_id        uuid                NOT NULL
                  REFERENCES public.media (id) ON DELETE CASCADE,

  -- D-22 : « L'ADMIN ou le SUPER_ADMIN accorde l'autorisation. » L'auteur du grant
  -- est conservé : c'est la preuve de qui a autorisé quoi (029 §2.6).
  grantee_type    media_grantee_type  NOT NULL,
  -- COLONNE POLYMORPHE : désigne un département OU un profil selon grantee_type.
  -- Aucune FK n'est possible (voir §4.3 et Q-S4) ; l'existence de la cible est
  -- vérifiée par le trigger media_access_check_grantee.
  grantee_id      uuid                NOT NULL,

  -- Trois droits indépendants. DEFAULT false = aucun partage par défaut.
  -- USE   : référencer le média dans un contenu (029 §2.5 action 5.3)
  -- MANAGE: modifier la ressource — « selon périmètre » (D-21, 029 Q-09 non tranché)
  -- DELETE: refusé au DEPARTMENT_MANAGER (D-21, XD-07)
  can_use         boolean             NOT NULL DEFAULT false,
  can_manage      boolean             NOT NULL DEFAULT false,
  can_delete      boolean             NOT NULL DEFAULT false,

  granted_by      uuid                NOT NULL
                  REFERENCES public.admin_profiles (id) ON DELETE RESTRICT,
  granted_at      timestamptz         NOT NULL DEFAULT now(),
  updated_at      timestamptz         NOT NULL DEFAULT now(),

  -- Un grant qui n'accorde RIEN est un défaut de saisie, pas une ligne valide :
  -- l'autorisation se retire par DELETE (action REVOKE, 029 §2.6), et une ligne
  -- de droit vide brouillerait la lecture « qui a accès à quoi ».
  CONSTRAINT media_access_at_least_one_right CHECK (
    can_use OR can_manage OR can_delete
  ),

  -- Cohérence des trois droits avec D-21 et 029 §2.5/§2.6 : un grant à un
  -- DÉPARTEMENT ne peut JAMAIS porter DELETE — « Responsable Presse : … DELETE → non »
  -- (XD-07). Un grant personnel (ADMIN_PROFILE) est accordé par l'ADMIN ou le
  -- SUPER_ADMIN, qui détiennent les trois droits.
  CONSTRAINT media_access_department_no_delete CHECK (
    grantee_type <> 'DEPARTMENT' OR can_delete = false
  ),

  CONSTRAINT media_access_timestamps_order CHECK (updated_at >= granted_at)
);

COMMENT ON TABLE public.media_access IS
  'D-21 : « Le système d''autorisation teste EXPLICITEMENT la permission '
  'demandée. » Un utilisateur ne reçoit donc JAMAIS une capacité par déduction '
  'd''une autre. D-22 : le grant est réservé à ADMIN/SUPER_ADMIN ; un responsable '
  '« ne peut pas s''accorder lui-même » un accès (029 §2.6 action 6.5).';
COMMENT ON COLUMN public.media_access.grantee_id IS
  'Clé étrangère POLYMORPHE impossible en SQL : l''intégrité est portée par deux '
  'index uniques partiels (media_access_department_unique et '
  'media_access_profile_unique) et par le trigger media_access_check_grantee. '
  'Absence de FK assumée et signalée : voir §4.3 et Q-S4.';

-- Un département ne peut avoir qu'UNE ligne de droits par média (029 Q-26 : la
-- structure exacte de MediaAccess est explicitement « à définir » ; la cardinalité
-- retenue est celle qui rend les trois droits lisibles en une seule ligne).
CREATE UNIQUE INDEX media_access_department_unique
  ON public.media_access (media_id, grantee_id)
  WHERE grantee_type = 'DEPARTMENT';

CREATE UNIQUE INDEX media_access_profile_unique
  ON public.media_access (media_id, grantee_id)
  WHERE grantee_type = 'ADMIN_PROFILE';

-- Vérification de l'existence de la cible, faute de FK polymorphique possible.
CREATE OR REPLACE FUNCTION public.media_access_check_grantee()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.grantee_type = 'DEPARTMENT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.departments WHERE id = NEW.grantee_id) THEN
      RAISE EXCEPTION 'media_access: département % inexistant', NEW.grantee_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  ELSIF NEW.grantee_type = 'ADMIN_PROFILE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = NEW.grantee_id) THEN
      RAISE EXCEPTION 'media_access: profil % inexistant', NEW.grantee_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER media_access_grantee_exists
  BEFORE INSERT OR UPDATE OF grantee_type, grantee_id ON public.media_access
  FOR EACH ROW EXECUTE FUNCTION public.media_access_check_grantee();
```

## 3.5 `public.department_capabilities` (D-25)

Créée après `admin_profiles` (dont elle référence l'auteur du grant) et après
`departments`.

```sql
-- ---------------------------------------------------------------------------------
-- D-25 : capacité / politique du département — « jamais un if (code === "PRESSE") ».
-- Encodage retenu : TABLE de jointure (voir §1.2, choix C1). Clé primaire composée
-- (department_id, capability) ; index de lecture par capacité pour le sens inverse,
-- qui est celui utilisé par le trigger de portée.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.department_capabilities (
  department_id    uuid         NOT NULL
                   REFERENCES public.departments (id) ON DELETE CASCADE,

  -- Code de capacité, CONTRÔLÉ : la seule capacité nommée par D-25 est la
  -- « capacité événementielle globale ». Aucune autre n'est inventée ; le CHECK
  -- est élargi par décision explicite, jamais par commodité (§8, Q-S8).
  capability       varchar(60)  NOT NULL
                   CHECK (capability IN ('EVENT_SCOPE_GLOBAL')),

  -- Auteur du grant. NON TRANCHÉ : 029 Q-06 (« qui peut éditer les capacités »)
  -- n'est pas arbitrée ; le schéma conserve l'auteur, la policy tranchera le droit.
  granted_by       uuid         REFERENCES public.admin_profiles (id)
                                ON DELETE RESTRICT,

  granted_at       timestamptz  NOT NULL DEFAULT now(),

  PRIMARY KEY (department_id, capability)
);

COMMENT ON TABLE public.department_capabilities IS
  'D-25, 029 §5.3. La portée publique d''un événement (D-26) est DÉRIVÉE de la '
  'capacité du département. Qui édite les capacités est NON TRANCHÉ (029 Q-06) : '
  'aucun rôle n''est encodé ici — la règle vit dans DepartmentPolicy.canEditCapabilities.';
```

## 3.6 `public.events` (D-25, D-26)

```sql
CREATE TABLE public.events (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title             varchar(150)  NOT NULL,
  slug              varchar(180)  NOT NULL UNIQUE,
  description       text,
  excerpt           text,
  event_date        date          NOT NULL,
  event_time        time,
  location          varchar(150),

  image_media_id    uuid          REFERENCES public.media (id) ON DELETE SET NULL,
  banner_media_id   uuid          REFERENCES public.media (id) ON DELETE SET NULL,

  -- ---------------------------------------------------------------------------
  -- D-26 : « Event.department_id reste OBLIGATOIRE. Un événement global au sens
  -- d'un department_id = NULL N'EXISTE PAS : on ne perd jamais l'information du
  -- responsable. »
  -- ---------------------------------------------------------------------------
  -- NOT NULL remplace la colonne nullable actuelle. La règle ON DELETE devient
  -- RESTRICT : `SET NULL` FABRIQUERAIT l'état interdit.
  department_id     uuid          NOT NULL
                    REFERENCES public.departments (id) ON DELETE RESTRICT,

  -- D-25 / D-26 : « Le département responsable et la portée publique sont deux
  -- notions DISTINCTES. » PRESSE (responsable) + GLOBAL (concerné) est un état
  -- valide et normal ; son inverse aussi.
  visibility_scope  event_visibility_scope NOT NULL DEFAULT 'DEPARTMENT',

  practical_info    text[],

  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT events_timestamps_order CHECK (updated_at >= created_at),
  CONSTRAINT events_title_not_blank  CHECK (length(btrim(title)) > 0)
);

COMMENT ON TABLE public.events IS
  'D-26. `visibility_scope` est DISTINCT du Scope d''autorisation de 029 §1.2 : '
  'l''un dit QUI EST CONCERNÉ, l''autre SUR QUOI un rôle agit (029 §1.2, alinéa final). '
  'Les événements ne portent PAS d''état brouillon/publié : 028/Q-EV3 est NON TRANCHÉE.';
COMMENT ON COLUMN public.events.visibility_scope IS
  'D-25 : dérivé de la capacité du département (department_capabilities). '
  'La cohérence est garantie par le trigger events_visibility_scope_coherence.';

-- ---------------------------------------------------------------------------------
-- D-25 : la vérification passe par la CAPACITÉ, jamais par le code ou le slug du
-- département. « Un département qui reçoit la capacité événementielle globale
-- publie pour toute l'église sans qu'une ligne de code change. »
-- ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.events_check_visibility_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_global_capability boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.department_capabilities
    WHERE department_id = NEW.department_id
      AND capability    = 'EVENT_SCOPE_GLOBAL'
  ) INTO has_global_capability;

  IF NEW.visibility_scope = 'GLOBAL' AND NOT has_global_capability THEN
    RAISE EXCEPTION
      'D-25/D-26: le département % ne détient pas la capacité EVENT_SCOPE_GLOBAL; '
      'visibility_scope = GLOBAL est refusé', NEW.department_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER events_visibility_scope_coherence
  BEFORE INSERT OR UPDATE OF visibility_scope, department_id ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_check_visibility_scope();
```

## 3.7 `public.publications` (D-18, D-19, D-20)

```sql
CREATE TABLE public.publications (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  title           varchar(150)            NOT NULL,
  slug            varchar(180)            NOT NULL UNIQUE,
  type            publication_type        NOT NULL,
  category        publication_category    NOT NULL,

  content_url     text,
  description     text,
  body            text[],
  author          varchar(120),

  -- D-19 : critère PRINCIPAL de la règle de récence.
  -- « created_at est ÉCARTÉ : une publication créée comme brouillon longtemps
  -- avant sa parution ne doit pas être considérée comme plus ancienne. »
  published_at    date                    NOT NULL,

  status          publication_status      NOT NULL DEFAULT 'PUBLISHED',

  -- ---------------------------------------------------------------------------
  -- D-18 : « PUBLISHED → ARCHIVED est IRRÉVERSIBLE. »
  -- Colonne dédiée, cohérente avec l'état ; l'irréversibilité elle-même est
  -- garantie par le trigger publications_status_immutable (§3.10).
  -- ---------------------------------------------------------------------------
  archived_at     timestamptz,

  cover_media_id  uuid                    REFERENCES public.media (id) ON DELETE SET NULL,

  -- ---------------------------------------------------------------------------
  -- D-18 : « maximum 3 PUBLISHED par département ».
  -- Colonne NÉCESSAIRE : sans elle, la règle des 3 est inévaluable.
  -- NOT NULL : une publication sans département serait un « événement global »
  -- déguisé, et 029 §0.2 règle 2 refuse un department_id nul.
  -- ---------------------------------------------------------------------------
  department_id   uuid                    NOT NULL
                  REFERENCES public.departments (id) ON DELETE RESTRICT,

  -- ---------------------------------------------------------------------------
  -- Créneau de publication — SUPPORT DE LA RÈGLE DES 3 (D-18).
  -- Colonne GÉNÉRÉE, jamais écrite par l'application : elle vaut 1 dès que la
  -- publication est PUBLISHED, et NULL sinon. Combinée à l'index unique partiel
  -- (department_id, published_slot) WHERE status = 'PUBLISHED', elle limite à UNE
  -- seule publication PUBLISHED par département — l'énoncé exact de D-18 :
  -- « maximum 3 PUBLISHED par département, mais potentiellement moins ».
  -- L'application applique l'archivage préalable selon D-19 ; la base refuse
  -- toute violation de la borne.
  -- NON TRANCHÉ (Q-S10) : la portée est « par département », conformément à la
  -- lettre de D-18 ; 028/Q-P3 (« département + type ») n'est pas arbitrée.
  -- ---------------------------------------------------------------------------
  published_slot  smallint                GENERATED ALWAYS AS (
                                            CASE WHEN status = 'PUBLISHED'
                                                 THEN 1::smallint
                                                 ELSE NULL END
                                          ) STORED,

  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now(),

  CONSTRAINT publications_archived_at_coherence CHECK (
    (status = 'ARCHIVED') = (archived_at IS NOT NULL)
  ),

  CONSTRAINT publications_timestamps_order CHECK (updated_at >= created_at)
);

COMMENT ON TABLE public.publications IS
  'D-18, D-19, D-20. ARCHIVED n''est PAS une suppression : « ARCHIVED est un état '
  'métier PERSISTANT » et « les archives restent publiques » (D-20, 029 §2.3 action 3.3).';
COMMENT ON COLUMN public.publications.published_at IS
  'D-19 : ORDER BY published_at ASC, id ASC. `id` est le second critère en cas '
  'd''égalité STRICTE. created_at est écarté et ne doit jamais servir au tri.';
COMMENT ON COLUMN public.publications.published_slot IS
  'Support de la règle des 3 PUBLISHED par département (D-18). Générée : toute '
  'tentative d''écriture directe est refusée par PostgreSQL.';

-- Contrainte de la règle des 3 : voir §4.1 pour le raisonnement complet.
CREATE UNIQUE INDEX publications_max_three_published_per_department
  ON public.publications (department_id, published_slot)
  WHERE status = 'PUBLISHED';
```

## 3.8 Entités éditoriales (D-23, D-24, `031`)

```sql
-- ---------------------------------------------------------------------------------
-- D-23 / 031 : Page.content est un JEU DE VALEURS NOMMÉES, jamais un document.
-- `template` est DÉRIVÉ du page_key PAR LE SERVEUR (031 §1.4, L4) : aucune route
-- n'accepte de `template` en entrée.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.static_pages (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 031 §8 : 8 pages canoniques + 3 clés de pôle conservées sans route servie
  -- (accueil, qui-sommes-nous, organisation, communaute, vie-de-leglise,
  --  publications, evenements, ou-nous-trouver, faire-un-don, departement).
  page_key          varchar(60)   NOT NULL UNIQUE,

  -- Écrit par le serveur, jamais reçu du client (031 §3.6 écart E7).
  template          varchar(40)   NOT NULL,

  -- 031 §3.5, option retenue : la version de contrat est une COLONNE, pas une clé
  -- du contenu — le contenu reste purement éditorial.
  contract_version  integer       NOT NULL DEFAULT 1 CHECK (contract_version >= 1),

  content           jsonb         NOT NULL,

  updated_by        uuid          REFERENCES public.admin_profiles (id) ON DELETE SET NULL,

  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),

  -- 031 §1.4 L3 : les schémas sont des z.strictObject — une clé inconnue est
  -- REFUSÉE. Le jsonb doit donc être un objet, jamais un tableau ni un scalaire.
  CONSTRAINT static_pages_content_is_object CHECK (jsonb_typeof(content) = 'object'),

  -- 031 §1.4 L2 : le vocabulaire du contrat ne contient AUCUN mot de structure.
  -- La structure, l'ordre et le layout sont portés par le CODE et ne peuvent pas
  -- être édités — y compris par un SUPER_ADMIN (029 §2.7 action 7.6, test N-23).
  CONSTRAINT static_pages_no_structure_keys CHECK (
    NOT (content ?| ARRAY[
      'html','markdown','richText','script','style','className',
      'section','sections','block','blocks','component','template',
      'order','position','index','variant','tone','width','rhythm',
      'layout','columns','href','slug','pageKey'
    ])
  ),

  CONSTRAINT static_pages_timestamps_order CHECK (updated_at >= created_at)
);

COMMENT ON TABLE public.static_pages IS
  'D-23 : « Page.content peut être flexible À L''INTÉRIEUR D''UN CONTRAT DE '
  'TEMPLATE, jamais arbitraire. » 029 §2.7 : CREATE (7.4) et DELETE (7.5) sont '
  'refusés À TOUS LES RÔLES — l''ensemble des pages est déterminé (021 §3).';

-- 031 §1.6 règle 6 : « Un verset est une RÉFÉRENCE, pas un texte. »
-- Les champs verseKey/verseKeys portent des clés de `scriptures.key`. Une clé
-- orpheline produirait — selon 031 §2.9 — une ERREUR DE RENDU dans HeroManifesto.
--
-- NOTE D'EXÉCUTION : cette fonction est écrite avant le CREATE TABLE scriptures
-- (§3.8, plus bas) pour la lisibilité, mais PostgreSQL résout le nom de table à
-- l'EXÉCUTION et non à la création de la fonction. L'ordre réel est celui de
-- §0.4 (scriptures créée à l'étape 10, triggers à l'étape 12).
--
-- Le contrôle porte sur les DEUX formes du contrat (031 §3.2) : `verseKey` est une
-- chaîne scalaire, `verseKeys` un tableau borné. Un champ absent n'est pas une clé
-- et n'est donc pas rejeté — 031 §1.4 L7 : « l'absence est un état normal ».
CREATE OR REPLACE FUNCTION public.static_pages_check_verse_keys()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  k text;
BEGIN
  -- Forme scalaire : verseKey
  IF jsonb_typeof(NEW.content -> 'verseKey') = 'string' THEN
    k := NEW.content ->> 'verseKey';
    IF NOT EXISTS (SELECT 1 FROM public.scriptures WHERE key = k) THEN
      RAISE EXCEPTION 'static_pages: clé de verset inconnue dans verseKey: %', k
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  -- Forme tableau : verseKeys
  IF jsonb_typeof(NEW.content -> 'verseKeys') = 'array' THEN
    FOR k IN SELECT jsonb_array_elements_text(NEW.content -> 'verseKeys')
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.scriptures WHERE key = k) THEN
        RAISE EXCEPTION 'static_pages: clé de verset inconnue dans verseKeys: %', k
          USING ERRCODE = 'foreign_key_violation';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER static_pages_verse_keys_exist
  BEFORE INSERT OR UPDATE OF content ON public.static_pages
  FOR EACH ROW EXECUTE FUNCTION public.static_pages_check_verse_keys();

-- ---------------------------------------------------------------------------------
-- Versets — ressource 14. Existante, inchangée.
-- 029 §2.14 : les cinq actions sont NON TRANCHÉES (028/Q-PG2 : « Les versets
-- sont-ils éditables par le back-office ? »). Le schéma ne tranche rien.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.scriptures (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  key          varchar(60)   NOT NULL UNIQUE,
  text         text          NOT NULL,
  reference    varchar(80)   NOT NULL,
  translation  varchar(80)   NOT NULL DEFAULT 'Louis Segond 1910',
  context      varchar(200),
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------
-- Rythme hebdomadaire — ressource 15.
-- 031 §6.7 : QUATRE formulations concurrentes du même fait. 031 §7 Q-PG5 est NON
-- TRANCHÉE : soit les blocs lisent cette table, soit ils restent des champs de
-- page. `department_id` est ajouté FACULTATIVEMENT — la majorité des entrées sont
-- institutionnelles (culte dominical), donc SET NULL est la règle correcte.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.schedule_entries (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  day           varchar(20)   NOT NULL,
  title         varchar(120)  NOT NULL,
  time_label    varchar(60)   NOT NULL,
  audience      varchar(120),
  -- Horaire communiqué par CCJV (true) ou encore provisoire (false).
  is_confirmed  boolean       NOT NULL DEFAULT false,
  department_id uuid          REFERENCES public.departments (id) ON DELETE SET NULL,
  position      integer       NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

-- Ressource 16 — inchangée, contrainte de forme sur le schéma d'URL.
CREATE TABLE public.social_links (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  label       varchar(60)  NOT NULL,
  href        text         NOT NULL,
  position    integer      NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT social_links_href_scheme CHECK (href ~* '^(https?|mailto|tel):')
);

-- ---------------------------------------------------------------------------------
-- Réglages institutionnels — ressource 10.
-- Liste FERMÉE de clés (15 valeurs en place). 029 §2.10 : la lecture et l'écriture
-- par l'ADMIN sont NON TRANCHÉES (Q-13) ; le responsable n'y a AUCUN accès (XD-12).
-- ---------------------------------------------------------------------------------
CREATE TABLE public.site_settings (
  key         varchar(80)  PRIMARY KEY,
  value       text         NOT NULL,
  updated_at  timestamptz  NOT NULL DEFAULT now(),

  -- Aucune clé de configuration ne doit porter un secret de prière : le
  -- SUPER_ADMIN lit les paramètres (D-03) et ne doit RIEN voir du domaine
  -- PrayerRequest (D-10). Ce CHECK ferme la porte à un secret de secours en ligne,
  -- que 030 §5.5 interdit : « Toute forme de clé de secours en ligne recréerait
  -- exactement O3 et est interdite ».
  CONSTRAINT site_settings_no_prayer_secret CHECK (
    key !~* '^(prayer|crypto|dek|recovery|kek|master)'
  )
);

COMMENT ON TABLE public.site_settings IS
  'D-24 (« configuration globale »). ATTENTION : cette table est lisible par le '
  'SUPER_ADMIN ; elle ne doit contenir AUCUN paramètre du domaine des prières '
  '(D-10, 030 §6.2 et §7.3).';

-- Ressource 11 — inchangée. 029 §2.11 : aucune capacité ne découle de D-24.
CREATE TABLE public.leaders (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             varchar(120)  NOT NULL,
  role             varchar(120)  NOT NULL,
  scope            varchar(120),
  bio              text,
  photo_media_id   uuid          REFERENCES public.media (id) ON DELETE SET NULL,
  department_id    uuid          REFERENCES public.departments (id) ON DELETE SET NULL,
  position         integer       NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------------
-- Témoignages — ressource 12.
-- D-24 : « contenu éditorial persistant — STATUT/MODÉRATION À DÉFINIR avant
-- exposition publique » (028/Q-PR9). 029 §2.12 action 12.1 : exposition publique
-- refusée PROVISOIREMENT pour tous les rôles.
-- Le schéma fournit le STATUT ; il ne tranche PAS la politique de modération.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.testimonies (
  id               uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  quote            text              NOT NULL,
  person_name      varchar(120)      NOT NULL,
  person_role      varchar(120),
  photo_media_id   uuid              REFERENCES public.media (id) ON DELETE SET NULL,

  -- DRAFT par défaut : aucune exposition tant que 028/Q-PR9 n'est pas tranchée.
  status           testimony_status  NOT NULL DEFAULT 'DRAFT',
  moderated_by     uuid              REFERENCES public.admin_profiles (id) ON DELETE SET NULL,
  moderated_at     timestamptz,

  position         integer           NOT NULL DEFAULT 0,
  created_at       timestamptz       NOT NULL DEFAULT now(),
  updated_at       timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT testimonies_moderation_coherence CHECK (
    (status = 'PUBLISHED') = (moderated_at IS NOT NULL)
  )
);

COMMENT ON COLUMN public.testimonies.status IS
  '028/Q-PR9 : statut/modération NON TRANCHÉ au-delà de la nécessité de ne pas '
  'exposer avant décision. PUBLISHED n''est atteignable qu''après arbitrage.';

-- Ressource 13 — inchangée.
CREATE TABLE public.community_faces (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name     varchar(120)  NOT NULL,
  caption         text          NOT NULL,
  photo_media_id  uuid          REFERENCES public.media (id) ON DELETE SET NULL,
  position        integer       NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);
```

## 3.9 Notifications, outbox et audit

```sql
-- ---------------------------------------------------------------------------------
-- Notifications — ressource 9.
-- D-10 : « ni notifications » pour le SUPER_ADMIN. 030 §6.2 : les destinataires
-- d'une notification de prière sont « EXCLUSIVEMENT les utilisateurs détenant le
-- rôle ADMIN au moment de la soumission ».
-- ---------------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id                 uuid               PRIMARY KEY DEFAULT gen_random_uuid(),

  recipient_user_id  uuid               NOT NULL
                     REFERENCES public.admin_profiles (id) ON DELETE CASCADE,

  type               notification_type  NOT NULL,

  -- 030 §6.2 : { referenceId = requestId }. Colonne POLYMORPHE : soit un requestId
  -- (prière), soit une référence de clé. Aucune FK (§1.5).
  reference_id       text,

  -- 030 §6.2 : la notification ne contient QUE ces champs. Aucun contenu, aucun
  -- nom, aucun extrait, aucune longueur, aucun keyReference du contenu, aucune
  -- liste de destinataires, aucun état anonyme (022 L492, 024 §27 L991).
  -- Cette interdiction est STRUCTURELLE : les colonnes n'existent pas.
  is_read            boolean            NOT NULL DEFAULT false,
  created_at         timestamptz        NOT NULL DEFAULT now()
);

-- D-10 : AUCUNE notification du domaine des prières ne peut viser un non-ADMIN.
-- 030 §6.2 : « un garde applicatif rejette toute tentative de créer une
-- notification PRAYER_* pour un principal non-ADMIN ».
--
-- IMPORTANT : cette règle NE PEUT PAS être un CHECK. PostgreSQL interdit toute
-- sous-requête dans une contrainte CHECK, et la règle exige de lire la table
-- public.admin_profiles. Elle est donc portée par un trigger — même niveau de
-- garantie (elle s'applique à toute écriture, y compris directe en base), mais
-- elle n'est pas déclarative.
CREATE OR REPLACE FUNCTION public.notifications_check_recipient_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_role admin_role;
  recipient_ok   boolean;
BEGIN
  -- Deux règles distinctes, toutes deux fondées sur D-10 :
  --  1. une notification de PRIÈRE ne vise que les ADMIN actifs (030 §6.2) ;
  --  2. une notification de SÉCURITÉ des clés de prière va à tous les Admins et
  --     JAMAIS au SUPER_ADMIN (030 §6.2 et §4.7).
  SELECT p.role, (p.role = 'ADMIN' AND p.is_active) = true
    INTO recipient_role, recipient_ok
    FROM public.admin_profiles p
    WHERE p.id = NEW.recipient_user_id;

  IF recipient_role IS NULL THEN
    RAISE EXCEPTION 'notifications: destinataire % inexistant', NEW.recipient_user_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.type = 'PRAYER_REQUEST_RECEIVED' AND NOT recipient_ok THEN
    RAISE EXCEPTION
      'D-10 / 030 §6.2: une notification PRAYER_REQUEST_RECEIVED ne peut viser '
      'qu''un ADMIN actif (destinataire % a le rôle %)',
      NEW.recipient_user_id, recipient_role
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.type IN ('KEY_REGISTERED', 'KEY_REVOKED', 'RECOVERY_KEY_CHANGED')
     AND recipient_role <> 'ADMIN' THEN
    RAISE EXCEPTION
      'D-10 / 030 §6.2: une notification % est destinée aux ADMIN uniquement ; '
      'le SUPER_ADMIN ne reçoit AUCUNE notification du domaine des prières '
      '(destinataire % a le rôle %)',
      NEW.type, NEW.recipient_user_id, recipient_role
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notifications_recipient_role_check
  BEFORE INSERT OR UPDATE OF recipient_user_id, type ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_check_recipient_role();

COMMENT ON TABLE public.notifications IS
  '030 §6.2. Une notification d''archivage n''est JAMAIS créée : « ni 023, ni 022 '
  '(une seule valeur d''énumération) ne la prévoient ». Les notifications de '
  'sécurité (KEY_REGISTERED, KEY_REVOKED, RECOVERY_KEY_CHANGED) vont à TOUS les '
  'Admins et JAMAIS au SUPER_ADMIN, sans exception (030 §4.7, §6.2).';

-- ---------------------------------------------------------------------------------
-- Outbox — 030 §5.1 étape 13 et §6.2.
-- « Pourquoi pas dans la même table : l'isolation des rôles (§4.6) interdit au rôle
-- prayers_api d'écrire dans public.notifications ; l'outbox préserve l'atomicité
-- sans casser la frontière de privilèges. »
-- La ligne ne contient QUE requestId et un horodatage : jamais de contenu.
-- AUCUN REFERENCES vers prayer_private : une FK franchirait la frontière.
-- ---------------------------------------------------------------------------------
CREATE TABLE public.notification_outbox (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id  uuid         NOT NULL,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  processed_at       timestamptz
);

COMMENT ON TABLE public.notification_outbox IS
  '030 §6.2. Seul point de contact entre le magasin isolé et le schéma public. '
  'Alimentée dans la MÊME TRANSACTION que l''insertion de la demande.';

-- ---------------------------------------------------------------------------------
-- Journal d'audit GÉNÉRAL — ressource 17.
-- 030 §6.3.1 : « Le journal général ne contient AUCUN événement de prière : sa
-- rétention est donc sans effet sur D-10. »
-- L'énumération AUDIT_ACTION ne comporte AUCUNE valeur PRAYER_* (§2.1, ligne 11).
-- ---------------------------------------------------------------------------------
CREATE TABLE public.audit_log (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nullable : « acteur supprimé » ou « acteur public » (soumission anonyme).
  -- SET NULL : un journal d'audit doit SURVIVRE à la disparition de l'acteur.
  actor_user_id  uuid          REFERENCES public.admin_profiles (id) ON DELETE SET NULL,

  action         audit_action  NOT NULL,
  resource_type  varchar(40)   NOT NULL,
  resource_id    text,

  created_at     timestamptz   NOT NULL DEFAULT now(),

  result         audit_result  NOT NULL DEFAULT 'OK',

  -- Liste blanche de clés NON sensibles. Le code de motif de refus vit ici,
  -- jamais dans la valeur d'énumération (§2.1, ligne 12).
  metadata       jsonb         NOT NULL DEFAULT '{}'::jsonb
                 CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.audit_log IS
  'D-03 : « consultation des journaux d''audit COMPLETS » — par le SUPER_ADMIN, '
  'sauf ce qui touche aux prières (D-10, 030 §6.3.1). 029 §2.17 : le périmètre de '
  'l''ADMIN (Q-16), la purge (Q-17) et le journal d''accès aux prières (Q-18, '
  'tension D-03 × D-10) sont NON TRANCHÉS. Le schéma ne les tranche pas : Q-18 se '
  'résout en constatant que ce journal vit dans prayer_private, où le SUPER_ADMIN '
  'n''a aucun privilège (§5.4).';
```

## 3.10 Triggers d'intégrité métier

```sql
-- ---------------------------------------------------------------------------------
-- D-18 : « PUBLISHED → ARCHIVED est IRRÉVERSIBLE : une publication archivée ne
-- redevient pas automatiquement PUBLISHED. »
-- 029 §2.3 action 3.8 : UNARCHIVE est refusé à TOUS les rôles.
-- Cette irréversibilité est portée par la BASE : une policy peut être modifiée,
-- une contrainte de transition ne le peut pas sans migration.
-- ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publications_forbid_unarchive()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'ARCHIVED' AND NEW.status <> 'ARCHIVED' THEN
    RAISE EXCEPTION
      'D-18: ARCHIVED est irréversible; publication % ne peut pas revenir à %',
      OLD.id, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.archived_at IS NOT NULL
     AND NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
    RAISE EXCEPTION
      'D-18: archived_at est définitif pour la publication %', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER publications_status_immutable
  BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.publications_forbid_unarchive();

-- ---------------------------------------------------------------------------------
-- 030 §6.1 : « ARCHIVED est un état métier persistant ; aucun retour en PENDING
-- n'est défini. » Même logique que pour les publications.
-- ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prayer_private.prayer_request_forbid_reopen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'ARCHIVED' AND NEW.status <> 'ARCHIVED' THEN
    RAISE EXCEPTION
      '030 §6.1: la transition ARCHIVED -> % n''est pas définie', NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.validated_at IS NOT NULL
     AND NEW.validated_at IS DISTINCT FROM OLD.validated_at THEN
    RAISE EXCEPTION '030 §6.1: validated_at est définitif'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prayer_request_status_immutable
  BEFORE UPDATE ON prayer_private.prayer_request
  FOR EACH ROW EXECUTE FUNCTION prayer_private.prayer_request_forbid_reopen();

-- ---------------------------------------------------------------------------------
-- D-21 EXPLICITEMENT : « Pas de hiérarchie DELETE ⊃ MANAGE ⊃ USE : ces capacités
-- ont des finalités différentes. Le système d'autorisation teste EXPLICITEMENT la
-- permission demandée. » Une lecture par déduction ne doit donc pas être possible
-- depuis la DONNÉE : aucun drapeau agrégé, aucun niveau, aucun ordinal n'existe sur
-- media_access — seules trois colonnes booléennes indépendantes (§3.4). Le trigger
-- de destinataire et les CHECK de §3.4 verrouillent le reste.
-- ---------------------------------------------------------------------------------
```

---

# 4. Contraintes d'intégrité métier

## 4.1 Règle des 3 `PUBLISHED` par département (D-18) — réponse honnête

**Formulation de la règle** (D-18) : *maximum 3 `PUBLISHED` par département, mais
potentiellement moins.* C'est une **garantie maximale**, pas une obligation de
maintenir trois publications visibles.

**Précision normative sur la borne.** D-18 énonce une **borne supérieure** — « une
garantie maximale, pas une obligation de maintenir trois publications visibles » — et
**jamais une obligation de conserver trois publications `PUBLISHED` simultanément**.
Une borne supérieure de 3 et une borne supérieure de 1 sont donc, en base, la **même
contrainte** : elles interdisent toutes deux le franchissement, et D-18 n'impose à
aucun moment de maintenir trois lignes `PUBLISHED` en parallèle. La contrainte
déclarative retenue applique donc la borne telle que D-18 la formule, sans
l'interpréter : **au plus une publication `PUBLISHED` par département**, l'archivage
des précédentes relevant de l'application et de D-19.

**Réponse en une ligne :** oui, la borne est exprimable en contrainte
**déclarative** (index unique partiel sur un créneau généré, **sans aucune
extension**) ; mais **aucune** contrainte déclarative ne peut choisir *quelle*
publication archiver, donc l'écriture doit **malgré tout** passer par une transaction
applicative sérialisée.

### 4.1.1 Ce qui est déclarable — et la forme retenue

**Forme écartée, et pourquoi.** Le premier réflexe est une **contrainte d'exclusion**
`GiST` sur `(department_id WITH =, <constante> WITH =)` restreinte à
`status = 'PUBLISHED'` :

```sql
-- ÉCARTÉE : cette forme exprime « au plus UN PUBLISHED par département », pas
-- « au plus TROIS ». Une contrainte d'exclusion refuse DEUX lignes dont la clé
-- d'exclusion est identique : en forçant la seconde colonne à la constante 1, la
-- 2e publication PUBLISHED du département est rejetée. La règle de D-18 est une
-- borne supérieure, pas une unicité au sens strict — mais elle interdit de toute
-- façon le franchissement, ce que la forme retenue réalise sans extension.
-- ALTER TABLE public.publications
--   ADD CONSTRAINT publications_max_three_published_per_department
--   EXCLUDE USING gist (
--     department_id WITH =,
--     (CASE WHEN status = 'PUBLISHED' THEN 1 ELSE NULL END) WITH =
--   )
--   WHERE (status = 'PUBLISHED');
```

**Forme retenue : un index unique partiel sur un créneau généré.** Le discriminant
est la colonne générée `published_slot` (§3.7) :

```sql
-- Déjà écrite dans la définition de la table (§3.7) :
CREATE UNIQUE INDEX publications_max_three_published_per_department
  ON public.publications (department_id, published_slot)
  WHERE status = 'PUBLISHED';
```

**Pourquoi cette forme, et non une contrainte d'exclusion.**

| Critère | Index unique partiel + créneau | Exclusion `GiST` |
| --- | --- | --- |
| Extension requise | **aucune** | `btree_gist` **obligatoire** pour l'opérateur `=` sur `uuid` et `smallint` |
| Type d'index produit | `btree` — plus petit, plus rapide, mieux optimisé par le planificateur | `GiST` — plus volumineux |
| Contrainte de domaine | `published_slot` est **généré** : `GENERATED ALWAYS` refuse toute écriture, l'application ne peut pas forger un créneau | le créneau devrait être une colonne ordinaire, donc écrivable |
| Lisibilité | une colonne nommée, documentée, visible dans l'introspection | une expression `CASE` enfouie dans une définition de contrainte |

**Limite de cette forme, énoncée sans détour :** elle garantit qu'un état au-delà de
la borne ne peut pas être validé — ce qui est exactement l'énoncé de D-18 — mais elle
ne dit pas *quelles* publications restent visibles. Ce second point n'est pas
déclarable (§4.1.2).

### 4.1.2 Ce qui n'est pas déclarable

| Question | Déclarable en SQL ? | Pourquoi |
| --- | --- | --- |
| « Au plus 3 `PUBLISHED` par département » | **Oui** — index unique partiel avec discriminant | Prédicat ensembliste sur un groupe fini et borné. |
| « Laquelle des publications archivées est la plus ancienne » | **Non** | D-19 fixe le **critère de tri** (`ORDER BY published_at ASC, id ASC`) mais D-18 ne dit **pas ce qui arrive** aux autres publications lors d'une publication supplémentaire. Publier peut : (a) archiver une seule publication, (b) archiver **toutes** les précédentes, ou (c) être refusé. Aucune de ces trois lectures n'est écrite dans 028. |
| « Deux publications simultanées ne produisent pas un dépassement » | **Non**, sans verrou applicatif | Voir §4.1.3. |

### 4.1.3 La concurrence — pourquoi la transaction applicative reste obligatoire

`029` R-02 le dit explicitement : *« Aucune décision ne décrit la **concurrence** de
la règle des 3 (transaction, verrou, publication simultanée). »*

Mécanisme concret du défaut : deux transactions publient chacune une nouvelle
publication dans le même département. Chacune vérifie le compte, archive selon D-19,
puis publie la sienne. Si la vérification et l'archivage ne sont pas sérialisés, la
base peut se retrouver dans un état où le compte respecte la borne (la contrainte le
garantit) mais où **la mauvaise** publication a été archivée — ou, selon
l'implémentation, avec un `409` sur l'une des deux.

**Réponse retenue, et elle est normative :** la contrainte déclarative de §4.1.1
garde la **borne** inviolable ; la **transaction** doit en outre :

1. ouvrir une transaction `READ COMMITTED` **ou** `REPEATABLE READ` ;
2. verrouiller le département : `SELECT id FROM departments WHERE id = $1 FOR UPDATE`
   — un verrou sur une ligne unique par département sérialise exactement ce dont la
   règle a besoin, et ne coûte rien hors publication ;
3. lire les publications `PUBLISHED` du département
   `ORDER BY published_at ASC, id ASC` (D-19) et archiver celles qui doivent l'être
   en posant `archived_at = now()` ;
4. insérer ou mettre à jour la publication visée ;
5. `COMMIT`.

**Ce que la base garantit seule :** la borne (aucun état au-delà ne peut être
validé). **Ce que la transaction apporte :** le choix déterministe de l'archivée,
conforme à D-19. **Ce qui reste non tranché :** la publication à laquelle le nouveau
`PUBLISHED` s'applique quand plusieurs sont simultanées (§8, Q-S9).

### 4.1.4 Portée de la règle — signalée, non tranchée

`028/Q-P3` demande : « La règle des 3 s'applique-t-elle par département, ou par
département **+ type** ? » Le schéma écrit la contrainte sur `department_id`
**seul**, conformément à la lettre de D-18 (« maximum 3 `PUBLISHED` par
département »). Si Q-P3 est tranchée en faveur de « département + type », la
contrainte devient un index unique partiel sur `(department_id, type, published_slot)`.
**Cette question n'est pas tranchée** et figure en §8 (Q-S10).

## 4.2 Irréversibilité de `ARCHIVED` (D-18)

**Où elle vit :** trois niveaux, du plus faible au plus fort.

| Niveau | Mécanisme | Ce qu'il empêche |
| --- | --- | --- |
| Donnée | `CHECK ((status = 'ARCHIVED') = (archived_at IS NOT NULL))` | Un état `ARCHIVED` sans horodatage, ou un horodatage sans état — donc une transition « à moitié faite ». |
| **Base** | **Trigger `BEFORE UPDATE`** `publications_forbid_unarchive()` | Toute transition `ARCHIVED → {DRAFT, PUBLISHED}` **et** toute modification de `archived_at`. Vaut pour **tous** les rôles, y compris `SUPER_ADMIN` et y compris une écriture directe en base. |
| Application | `PublicationPolicy.canUnarchive` → **`false` pour tout le monde** (`029` §4.1) | Le refus est renvoyé en `403` avant même d'atteindre la base (`029` §2.3 action 3.8, test N-24). |

**Pourquoi un trigger et pas seulement une policy :** `029` §5.5 range « Réactiver
une publication archivée » parmi les choses que l'**extensibilité ne permet pas**.
Une policy peut être modifiée par une évolution applicative ; une contrainte de
transition ne peut l'être que par une migration explicite — exactement le niveau de
garantie qu'exige une règle annoncée comme irréversible.

**Rappel de D-20 :** `ARCHIVED` n'est **pas** une suppression. Les archives restent
publiques et consultables (URL existante, recherche, archive). Le schéma n'enlève donc
**aucune** capacité de lecture : il n'ajoute aucune colonne de visibilité et ne touche
pas au `status` en lecture.

## 4.3 Cohérence des trois droits de `media_access` (D-21, D-22)

**Principe D-21 :** `USE`, `MANAGE`, `DELETE` ont des finalités différentes ; il n'y a
**pas de hiérarchie** ; « le système d'autorisation teste **explicitement** la
permission demandée ». Un utilisateur ne reçoit **jamais** une capacité par déduction
d'une autre (`029` §2.5, XD-10).

**Traduction en schéma — trois colonnes booléennes indépendantes**, sans niveau, sans
ordinal, sans drapeau agrégé :

| Règle | Mécanisme | Fondement |
| --- | --- | --- |
| Aucun partage par défaut | Trois colonnes `NOT NULL DEFAULT false` | D-22, XD-09 |
| `DELETE` jamais accordé à un département | `CHECK (grantee_type <> 'DEPARTMENT' OR can_delete = false)` | D-21 (« Responsable Presse : … DELETE → non »), XD-07 |
| Un grant vide est refusé | `CHECK (can_use OR can_manage OR can_delete)` | Une ligne de droit sans droit n'autorise rien : elle rendrait la lecture « qui a accès à quoi » ambiguë, et `REVOKE` existe pour retirer un accès (`029` §2.6 action 6.4) |
| `USE` n'implique pas `MANAGE` | **absence de toute règle implicite** : les policies testent la colonne demandée | D-21, tests N-18 et N-19 |
| `MANAGE` n'implique pas `DELETE` | idem | D-21 |
| Auto-attribution interdite | `granted_by` conservé ; `MediaPolicy.canGrantAccess` refuse `DEPARTMENT_MANAGER` | D-22, `029` §2.6 action 6.5, test N-14 |
| Un département ne peut pas avoir deux lignes de droits sur un média | Index unique partiel `(media_id, grantee_id) WHERE grantee_type = 'DEPARTMENT'` | Lisibilité : les trois droits se lisent en une ligne |
| Un profil non plus | Index unique partiel symétrique | idem |

**Limite structurelle assumée — l'absence de clé étrangère sur `grantee_id`.**
`grantee_id` est **polymorphe** : il désigne un département ou un profil selon
`grantee_type`. SQL ne permet pas une FK conditionnelle. L'intégrité est donc portée
par le **trigger** `media_access_check_grantee()`, qui vérifie l'existence de la ligne
visée et refuse l'insertion avec une `foreign_key_violation`.

C'est un mécanisme **plus faible** qu'une FK : il est contournable par une
désactivation de trigger, et il n'empêche pas une suppression ultérieure de la cible.
**Remèdes appliqués :** l'`ON DELETE RESTRICT` sur `admin_profiles.granted_by` et
`departments.created_by` (§1.5) protège les auteurs ; la suppression d'un département
**avec** des grants média reste toutefois possible et laisserait des grants orphelins.
Cette faiblesse est signalée en §8 (Q-S4) : la réponse propre serait une FK vers une
**vue unifiée** des destinataires, ou deux tables de droits distinctes.

## 4.4 `Event.department_id NOT NULL` (D-26)

```sql
department_id uuid NOT NULL REFERENCES public.departments (id) ON DELETE RESTRICT
```

| Aspect | Décision | Fondement |
| --- | --- | --- |
| Nullabilité | **`NOT NULL`** | D-26 : « Un événement global au sens d'un `department_id = NULL` **n'existe pas** : on ne perd jamais l'information du responsable. » |
| `ON DELETE` | **`RESTRICT`** (au lieu de `SET NULL`) | `SET NULL` **fabriquerait** l'état que D-26 déclare inexistant. C'est le point où le schéma cible **refuse** une opération que le schéma actuel autorise. |
| Portée publique | Colonne `visibility_scope` **distincte**, `NOT NULL DEFAULT 'DEPARTMENT'` | D-26 : « Le département responsable et la portée publique sont deux notions **distinctes** » ; le cas « Presse responsable, événement concernant toute l'église » est un état normal. |
| Cohérence portée/capacité | Trigger `events_visibility_scope_coherence` : `GLOBAL` exige la capacité `EVENT_SCOPE_GLOBAL` | D-25 : la portée est **dérivée de la capacité** du département ; `029` §5.3 interdit qu'un `code` ou un `slug` entre dans une condition. Le trigger ne lit **jamais** un nom de département — il lit une **capacité**. |
| Ce que la base **ne** fait pas | Elle n'interdit pas à un département **sans** capacité de publier un événement de portée `DEPARTMENT` | C'est le comportement normal ; la portée globale est le cas particulier. |
| Refus testé | `029` §6.2 N-25 : `POST /events` avec `department_id` nul → **400** | La base produit une violation `NOT NULL` ; l'API la traduit en `VALIDATION_ERROR` (400), conformément à `029` §4.5. |

**Point d'attention pour la migration :** l'ajout de `NOT NULL` sur une table qui
contient des lignes à `department_id = NULL` échoue. La graine contient **2
événements sur 7** à `departmentName: null` (« Culte spécial — Action de grâce »,
« Journée communautaire »). Voir §6.3.1 et §7.

## 4.5 Ce qu'imposent D-11/D-15 sur la prière

| Imposition | Traduction en schéma | Où |
| --- | --- | --- |
| Le contenu est chiffré | `message_ciphertext bytea NOT NULL`, `message_nonce bytea NOT NULL` (12 o), `message_key_reference text NOT NULL` | §3.1.2 |
| **Le nom est chiffré au même niveau que le message** (D-15) | `name_ciphertext`, `name_nonce`, `name_key_reference`, vérifiés au même titre que le message | §3.1.2 |
| `is_anonymous = true` ⇒ **aucun** nom stocké (D-15) | `CHECK` de cohérence à trois colonnes : rend **structurellement impossible** le stockage d'un nom pour une demande anonyme | §3.1.2 |
| `is_anonymous = false` ⇒ un nom **est** stocké | Même `CHECK`, branche symétrique | §3.1.2 |
| **Aucune clé maître accessible au backend** (D-11) | Aucune colonne de clé privée, DEK, graine ou fragment **nulle part**. Vérifié par **introspection** (§4.6), conformément au test **T2** | `030` A1, T2 |
| Aucune fonction de déchiffrement côté serveur | Hors schéma : `030` M1 impose un test d'import (`createDecipheriv`, `privateDecrypt` interdits) | `030` T1 |
| Le contact est **inexistant** (D-17) | Colonne **absente**. Vérifié par **introspection** (§4.6) | D-17, `030` T16 |
| Conservation indéfinie (D-16) | Aucune colonne `deleted_at` — **interdit par `030` §3.6.1** — et `ON DELETE RESTRICT` sur les enveloppes | §3.1.2, §1.5 |
| Une DEK par demande, jamais réutilisée | Une enveloppe par destinataire ; `key_reference` **immuable**, reprenant le `requestId` de la demande (vérifié par `CHECK`) et de l'enveloppe (vérifié par FK composite) | `030` §3.1, §3.6.2 |
| Nonce distinct entre message et nom | `CHECK (name_nonce IS NULL OR name_nonce <> message_nonce)` | `030` §2.2 règle 2 |
| Versionnage explicite | `crypto_version smallint NOT NULL`, repris dans `key_reference` et vérifié par un `CHECK` de cohérence | `030` §3.5 |
| Couverture des enveloppes | Index partiel `data_key_envelope_active_unique` **+** contrôle périodique applicatif | `030` §3.6.2, §5.4.1 |

**Ce que le schéma ne peut pas garantir, et qui est écrit comme tel :**

1. **Aucune contrainte déclarative** n'exprime « chaque demande possède au moins une
   enveloppe ADMIN active et exactement une enveloppe RECOVERY active » à
   l'insertion d'une ligne dans **une autre table**. PostgreSQL ne sait pas exprimer
   une contrainte d'existence inter-table par `CHECK`. `030` §5.4.1 en fait
   explicitement un **contrôle applicatif périodique**, pas une contrainte. Le schéma
   apporte ce qu'il peut : l'unicité de l'enveloppe **active** par `(demande, clé)`,
   qui rend l'anomalie *détectable* par une simple requête (`V8`, §4.6).
2. **Les métadonnées (nombre, dates, existence)** ne sont pas protégées contre un
   adversaire détenant le rôle propriétaire de la base (`030` §1.5 P3, §4.8 G8).
   Aucune colonne ne peut corriger cela ; seule l'isolation §5.4 le peut,
   partiellement.
3. **Un `ADMIN` révoqué conserve la lecture de ce qu'il pouvait lire** (`030` §5.4.3,
   G7). Aucun schéma ne peut révoquer rétroactivement une clé privée détenue hors
   système.
4. **Deux règles de `030` (T2, T16) ne sont PAS des contraintes SQL.** PostgreSQL
   interdit toute sous-requête dans un `CHECK`, et une contrainte ne peut pas
   interroger `information_schema`. Elles sont donc portées par des **vérifications
   exécutées après création** (§4.6) — une différence de nature à connaître : ces
   garanties dépendent d'une exécution, non de la définition de la table.

## 4.6 Vérifications structurelles post-création (D-17, `030` T2)

Ces requêtes **doivent renvoyer zéro ligne**. Elles remplacent deux `CHECK` qui
seraient **invalides en PostgreSQL** (sous-requête interdite dans une contrainte
`CHECK`) et qui sont donc, à juste titre, écrits ici.

```sql
-- ---------------------------------------------------------------------------------
-- V1 — D-17 / 030 T16 : AUCUN contact, nulle part, dans le magasin des prières.
-- « Il ne doit survivre NULLE PART : schéma · DTO · API · migrations finales ·
--   réponses · données métier actives. » (D-17)
-- ---------------------------------------------------------------------------------
SELECT table_schema, table_name, column_name
FROM   information_schema.columns
WHERE  table_schema = 'prayer_private'
  AND  column_name ~* '(contact|phone|telephone|email|mail|whatsapp)';
-- Attendu : 0 ligne.

-- ---------------------------------------------------------------------------------
-- V2 — 030 Annexe A T2 : aucune colonne de clé privée, de DEK, de graine, de
-- fragment de custodie ou de phrase secrète, dans AUCUNE table du magasin.
-- « Un test de schéma (Annexe A) vérifie qu'aucune colonne du schéma prayer_private
--   ne correspond à private|secret|seed|share. » (030 §3.6.3)
-- ---------------------------------------------------------------------------------
SELECT table_schema, table_name, column_name
FROM   information_schema.columns
WHERE  table_schema = 'prayer_private'
  AND  column_name ~* '(private|secret|seed|share|passphrase|master|kek|dek)'
  AND  column_name NOT IN (
         'key_reference',            -- identifiant PUBLIC, non secret (030 §3.1)
         'message_key_reference',    -- format ccjv-prayer:v1:dek:<requestId>
         'name_key_reference',
         'recipient_key_ref'
       );
-- Attendu : 0 ligne.
-- NOTE : `key_reference` contient littéralement « dek » dans le format imposé par
-- 030 §3.1 (« ccjv-prayer:v<version>:dek:<requestId> »). Le filtre l'exclut
-- explicitement — il est PUBLIC par décision et ne contient « aucun octet de clé ».

-- ---------------------------------------------------------------------------------
-- V3 — D-16 / 030 §3.6.1 : aucune colonne de purge dans le magasin des prières.
-- « Purge : impossible dans le modèle : ON DELETE RESTRICT, aucune colonne
--   deleted_at. » (030 §6.1)
-- ---------------------------------------------------------------------------------
SELECT table_schema, table_name, column_name
FROM   information_schema.columns
WHERE  table_schema = 'prayer_private'
  AND  column_name ~* '(deleted_at|purged_at|expires_at|retention)';
-- Attendu : 0 ligne.

-- ---------------------------------------------------------------------------------
-- V4 — D-10 / 030 §6.3.1 : AUCUNE valeur PRAYER_* dans le journal d'audit général,
-- et aucune valeur PRAYER_* dans l'énumération audit_action elle-même.
-- « Cet écart assumé vis-à-vis de 024 §27 : D-10 prévaut. » (030 §6.3.1)
-- ---------------------------------------------------------------------------------
SELECT e.enumlabel
FROM   pg_enum e
JOIN   pg_type t ON t.oid = e.enumtypid
WHERE  t.typname = 'audit_action'
  AND  e.enumlabel LIKE 'PRAYER%';
-- Attendu : 0 ligne.

SELECT count(*) AS prayer_events_du_general
FROM   public.audit_log
WHERE  action::text LIKE 'PRAYER%';
-- Attendu : 0. (Test permanent T9 de 030 Annexe A.)

-- ---------------------------------------------------------------------------------
-- V5 — D-26 : aucun événement sans département responsable.
-- « Un événement global au sens d'un department_id = NULL N'EXISTE PAS. »
-- ---------------------------------------------------------------------------------
SELECT count(*) AS evenements_sans_departement
FROM   public.events
WHERE  department_id IS NULL;
-- Attendu : 0. La contrainte NOT NULL rend ce compte structurellement impossible
-- après migration ; la requête documente la vérification.

-- ---------------------------------------------------------------------------------
-- V6 — D-18 : aucune publication PUBLISHED en excès dans un département.
-- ---------------------------------------------------------------------------------
SELECT department_id, count(*) AS publiees
FROM   public.publications
WHERE  status = 'PUBLISHED'
GROUP  BY department_id
HAVING count(*) > 1;
-- Attendu : 0 ligne en régime cible. Cet état est impossible à PRODUIRE :
-- l'index publications_max_three_published_per_department le refuse. La requête
-- sert de contrôle de non-régression si l'index était un jour retiré.

-- ---------------------------------------------------------------------------------
-- V7 — 030 §4.7 : au plus 2 clés Admin actives par utilisateur.
-- ---------------------------------------------------------------------------------
SELECT owner_user_id, count(*) AS cles_actives
FROM   prayer_private.crypto_key
WHERE  purpose = 'ADMIN_DECRYPTION'
  AND  status  = 'ACTIVE'
GROUP  BY owner_user_id
HAVING count(*) > 2;
-- Attendu : 0 ligne.

-- ---------------------------------------------------------------------------------
-- V8 — 030 §5.4.1 : contrôle de couverture des enveloppes (jamais une contrainte).
-- « Un contrôle applicatif (rôle prayers_api) vérifie, pour chaque demande, qu'il
--   existe au moins une enveloppe non révoquée vers une clé ADMIN ACTIVE, et
--   exactement une enveloppe non révoquée vers la clé RECOVERY ACTIVE. »
-- ---------------------------------------------------------------------------------
SELECT r.id                                              AS demande_sans_couverture,
       count(*) FILTER (WHERE k.purpose = 'ADMIN_DECRYPTION'
                          AND k.status  = 'ACTIVE')      AS enveloppes_admin_actives,
       count(*) FILTER (WHERE k.purpose = 'RECOVERY'
                          AND k.status  = 'ACTIVE')      AS enveloppes_recovery_actives
FROM      prayer_private.prayer_request     r
LEFT JOIN prayer_private.data_key_envelope e
       ON e.prayer_request_id = r.id AND e.revoked_at IS NULL
LEFT JOIN prayer_private.crypto_key        k
       ON k.key_reference = e.recipient_key_ref
GROUP BY  r.id
HAVING    count(*) FILTER (WHERE k.purpose = 'ADMIN_DECRYPTION'
                             AND k.status  = 'ACTIVE') = 0
   OR     count(*) FILTER (WHERE k.purpose = 'RECOVERY'
                             AND k.status  = 'ACTIVE') <> 1;
-- Attendu : 0 ligne. Toute ligne est une anomalie de couverture : elle produit
-- COVERAGE_ANOMALY_DETECTED dans prayer_audit_event et une alerte aux Admins
-- uniquement — jamais au SUPER_ADMIN, jamais dans le journal général (030 §5.4.1).
```

## 4.7 Récapitulatif des contraintes par table

| Table | `NOT NULL` structurants | `CHECK` de cohérence | Triggers | Index unique / partiel de contrainte |
| --- | --- | --- | --- | --- |
| `departments` | `name`, `slug`, `position` | nom, slug non vides ; horodatages | — | `slug` UNIQUE |
| `department_capabilities` | `department_id`, `capability` | liste fermée de capacités | — | PK `(department_id, capability)` |
| `admin_profiles` | `role`, `scope`, `is_active` | **cohérence `role`/`scope`/`department_id`** (D-02) ; horodatages | — | username `lower()` UNIQUE |
| `media` | `bucket`, `path`, `public_url`, `mime_type`, `size_bytes` | taille > 0, dimensions > 0 | — | `path` UNIQUE |
| `media_access` | `media_id`, `grantee_type`, `grantee_id`, `granted_by`, 3 droits | ≥ 1 droit, pas de `DELETE` à un département, horodatages | `media_access_grantee_exists` | `(media_id, grantee_id)` partiels par type |
| `events` | **`department_id`**, `visibility_scope`, `event_date`, `title`, `slug` | horodatages, titre non vide | `events_visibility_scope_coherence` | `slug` UNIQUE |
| `publications` | **`department_id`**, `status`, `published_at`, `type`, `category` | `(status='ARCHIVED') = (archived_at IS NOT NULL)` ; horodatages | `publications_status_immutable` | **règle des 3** (§4.1) |
| `static_pages` | `page_key`, `template`, `contract_version`, `content` | contenu objet, **aucune clé de structure**, horodatages | `static_pages_verse_keys_exist` | `page_key` UNIQUE |
| `scriptures` | `key`, `text`, `reference`, `translation` | — | — | `key` UNIQUE |
| `schedule_entries` | `day`, `title`, `time_label`, `is_confirmed` | — | — | — |
| `social_links` | `label`, `href` | schéma d'URL | — | — |
| `site_settings` | `key`, `value` | **aucune clé de secret de prière** | — | PK `key` |
| `leaders` | `name`, `role`, `position` | — | — | — |
| `testimonies` | `quote`, `person_name`, `status` | `(status='PUBLISHED') = (moderated_at IS NOT NULL)` | — | — |
| `community_faces` | `person_name`, `caption`, `position` | — | — | — |
| `notifications` | `recipient_user_id`, `type`, `is_read` | — | `notifications_recipient_role_check` | — |
| `notification_outbox` | `prayer_request_id` | — | — | — |
| `audit_log` | `action`, `resource_type`, `result` | `metadata` objet | — | — |
| `prayer_request` | `id`, `crypto_version`, `message_*`, `is_anonymous`, `status` | **anonymat**, archive, nonces, version, identifiant | `prayer_request_status_immutable` | PK `id` ; `(id, request_id)` UNIQUE |
| `data_key_envelope` | `prayer_request_id`, `request_id`, `purpose`, `recipient_key_ref`, `wrapped_key` | algorithme figé, taille de clé, ordre des horodatages | — | `(prayer_request_id, recipient_key_ref)` partiel sur `revoked_at IS NULL` |
| `crypto_key` | `key_reference`, `purpose`, `public_key_spki`, `fingerprint`, `status`, `wrap_generation` | propriétaire exclusif, créneau, cohérence statut/horodatages | — | `fingerprint` UNIQUE ; `(owner_user_id, key_slot)` partiel sur `is_slot_active` |
| `prayer_audit_event` | `action`, `resource_type`, `result` | liste fermée de `resource_type`, `metadata` objet | — | — |

---

# 5. Frontière du chiffrement

## 5.1 Colonnes chiffrées, colonnes en clair — table par table

**Règle générale :** le chiffrement ne concerne **que** le domaine `PrayerRequest`
(D-10 → D-17, `030`). Aucune autre table de la plateforme ne porte de donnée
chiffrée — `030` §0.2 place explicitement « tout le reste de la plateforme
(publications, médias, pages, événements, notifications génériques) » **hors
périmètre**.

### 5.1.1 Colonnes **chiffrées** (opaque pour le serveur)

| Table | Colonne | Type | Chiffré par | Contenu |
| --- | --- | --- | --- | --- |
| `prayer_private.prayer_request` | `message_ciphertext` | `bytea` | AES-256-GCM, clé = DEK de la demande, nonce `message_nonce` | Le **texte de la demande** (bourré par paliers de 256 o, `030` §3.3) |
| `prayer_private.prayer_request` | `name_ciphertext` | `bytea` | idem, nonce `name_nonce` **distinct** | Le **nom du demandeur** — D-15 : « même niveau de protection que le message » |
| `prayer_private.data_key_envelope` | `wrapped_key` | `bytea` | RSA-OAEP-4096/SHA-256, clé **publique** du destinataire | `0x01 ‖ DEK(32 o) ‖ requestId(16 o)` — 49 octets en clair, 512 octets en sortie |
| `prayer_private.crypto_key` | `public_key_spki` | `bytea` | **Non chiffré — public par nature** | Clé **publique** DER SPKI. Sa divulgation n'a aucun effet : RSA-OAEP ne se déchiffre pas avec une clé publique |

### 5.1.2 Colonnes **en clair** — et pourquoi chacune l'est

| Table | Colonne | En clair parce que | Fondement |
| --- | --- | --- | --- |
| `prayer_request` | `id` (requestId) | Identifiant entrant dans l'**AAD** et dans la charge utile de l'enveloppe : le destinataire doit pouvoir le relire pour vérifier la liaison. « Il est stocké en clair : ce n'est pas un secret. » | `030` §3.1 |
| `prayer_request` | `request_id` | Colonne générée, copie technique de `id` pour la FK composite. Aucune information nouvelle. | §3.1.2 |
| `prayer_request` | `crypto_version` | Reprise dans `keyReference` et dans l'AAD ; le déchiffreur doit **dispatcher** sur la version avant toute opération. | `030` §3.5 |
| `prayer_request` | `message_nonce`, `name_nonce` | Le nonce GCM est un paramètre public du chiffré. | `030` §3.1 |
| `prayer_request` | `message_key_reference`, `name_key_reference` | « Il ne contient **aucun** octet de clé et **aucune** empreinte de clé privée. » | `030` §3.1 |
| `prayer_request` | **`is_anonymous`** | Nécessaire à l'interface Admin et à la contrainte D-15. « Fuit un bit par ligne à un adversaire de type A2 — déjà subsumé par P3 (nombre et dates), donc sans effet marginal. » | `030` §9 **écart E4**, assumé |
| `prayer_request` | `status`, `created_at`, `validated_at` | D-10 exige que ces métadonnées soient invisibles **applicativement** pour le `SUPER_ADMIN` (garanti par l'isolation §5.4 et le refus au niveau du principal), mais elles ne peuvent pas être **cryptographiquement** protégées : un `ADMIN` a besoin d'un ordre chronologique. | `030` §1.4, §1.5 P3 |
| `data_key_envelope` | `purpose`, `request_id`, `recipient_key_ref`, `wrap_algorithm`, `revoked_at`, `created_at` | Métadonnées d'enveloppe. Le contrôle de couverture (`030` §5.4.1) « ne déchiffre rien : il ne lit que des métadonnées d'enveloppes ». | `030` §5.4.1 |
| `crypto_key` | **toutes** | Le registre est **public par construction** : `key_reference`, `fingerprint`, algorithme, statut, générations. L'empreinte est même « une donnée publique vérifiable **hors bande** » (détection R2). | `030` §3.6.3, §4.5.2 |
| `prayer_audit_event` | `actor_user_id`, `action`, `resource_type`, `resource_id`, `created_at`, `result`, `metadata` | Liste blanche stricte `030` §6.3.3 : **jamais** de contenu. | `030` §6.3.3 |
| **Toutes les autres tables** | **toutes** | Hors périmètre de `030` §0.2. Aucune donnée éditoriale, média, page, événement ou publication n'est chiffrée. | `030` §0.2 |

### 5.1.3 Colonnes **interdites** — vérifiées par le schéma

| Interdiction | Vérification |
| --- | --- |
| `requester_contact` | Colonne **inexistante** ; la vérification **V1** (§4.6) contrôle par introspection qu'aucune colonne de `prayer_private` ne porte un nom correspondant à `contact\|phone\|telephone\|email\|mail\|whatsapp` (D-17, XD-17) |
| Colonne de clé privée, de DEK, de graine, de fragment de custodie | Vérification **V2** (§4.6), conforme au test **T2** de `030` Annexe A |
| Colonne `deleted_at` | **Inexistante** — `030` §3.6.1 l'interdit nommément (D-16) ; vérification **V3** |
| Index plein texte ou de recherche sur un contenu de prière | Aucun index de ce type ne figure en §10 ni dans le schéma ; `030` §7.1 point 3 l'interdit (« Aucun index de recherche ne peut être bâti côté serveur sur les prières ») |
| Clé de secours en ligne | `site_settings_no_prayer_secret` **et** absence de toute table de secrets ; `030` §5.5 : « Toute forme de clé de secours en ligne recréerait exactement O3 et est **interdite** » |

## 5.2 Où vivent les enveloppes et le registre de clés **public**

```text
prayer_private
├── prayer_request          ← chiffré (message + nom), aucune clé
├── data_key_envelope       ← ENVELOPPES : une par (demande, destinataire)
│     purpose      ADMIN | RECOVERY
│     request_id   = id de la demande (FK composite : liaison en base)
│     wrapped_key  = RSA-OAEP(clé_publique_destinataire, 0x01‖DEK‖requestId)
├── crypto_key              ← REGISTRE PUBLIC : clés PUBLIQUES, empreintes, statuts
│     public_key_spki (DER SPKI), fingerprint, algorithm, status, wrap_generation
│     AUCUNE colonne de clé privée, sous aucune forme
└── prayer_audit_event      ← registre d'audit SÉPARÉ, lisible par les Admins seuls
```

**Trois points de conception :**

1. **Les enveloppes vivent dans le magasin isolé**, jamais dans `public`. Elles
   constituent, avec les chiffrés, l'intégralité de ce qu'un adversaire A2 (accès
   complet à la base) peut lire : « Déchiffrer quoi que ce soit : aucune clé privée ni
   DEK n'existe dans le magasin. Backlog **définitivement** illisible » (`030` §1.2 A2).
2. **Le registre de clés est public** et le reste : la clé publique SPKI et son
   empreinte sont affichées dans le back-office et comparables hors bande entre
   Admins — c'est le mécanisme de **détection** R1/R2 (`030` §4.4.2, §4.5.2). Il se
   trouve **dans `prayer_private`** et non dans `public`, précisément parce que le
   `SUPER_ADMIN` ne doit pas pouvoir le **modifier** : `030` R2 le désigne comme un
   vecteur de substitution de la clé `RECOVERY`.
3. **Aucune copie des enveloppes hors du magasin.** `030` §5.2.2 étape ⑤ : « Un Admin
   ne reçoit jamais l'enveloppe d'un autre Admin : rien à copier pour un compte
   compromis. » La sélection des enveloppes est faite à la lecture, par destinataire.

## 5.3 Comment le `SUPER_ADMIN` est exclu **au niveau du schéma** (D-10)

L'exclusion est **cumulative** : chaque couche est indépendante, et l'échec de l'une
ne rétablit pas l'accès. Le schéma porte les couches 1, 2, 3 et 5 ; les couches 4 et 6
sont architecturales.

| # | Couche | Ce qu'elle garantit | Nature |
| --- | --- | --- | --- |
| **1** | **Séparation de schéma** : `prayer_private` ≠ `public` | Aucune requête du code applicatif principal ne peut atteindre les tables de prière, même par erreur. | Schéma (§5.4) |
| **2** | **Rôles PostgreSQL disjoints** : `ccjv_app` sans **aucun** privilège sur `prayer_private` | « Aucune requête du reste de l'application — et donc **aucun code exécuté par un `SUPER_ADMIN` à travers la plateforme** — ne peut lire, compter ou énumérer les demandes. » | Privilèges (§5.4) |
| **3** | **Aucune FK inter-schéma** (`crypto_key.owner_user_id`, `notification_outbox.prayer_request_id`) | L'isolation ne peut pas être contournée par un chemin de jointure, et le rôle `prayers_api` n'a besoin d'aucun privilège croisé. | Schéma (§1.5) |
| **4** | **Aucune capacité de déchiffrement côté serveur** : aucune clé privée, aucune DEK, aucune fonction de déchiffrement | Même un accès total au backend ne permet pas de lire le backlog. « Le backend ne possède **rien à voler**. » | Architecture (`030` §4.4, M1/M2) |
| **5** | **Aucune surface applicative** : aucune table `public` ne référence le domaine des prières ; aucun index, aucune vue, aucun compteur | D-10 exige « ni nombre de demandes, ni dates permettant d'en déduire l'activité ». | Schéma |
| **6** | **Refus au niveau du principal, avant toute lecture** (`canReachDomain`) | « Le `Repository` n'est jamais atteint » : aucune requête SQL n'est émise pour un `SUPER_ADMIN`. | Policy (`030` §5.2.2, test T3) |

**Le cas le plus important pour le schéma est la couche 5.** Une table `public` qui
référencerait `prayer_private` donnerait au `SUPER_ADMIN` un **décompte** ou un
**horodatage** — ce que D-10 interdit explicitement. Le schéma cible évite
soigneusement :

| Tentation évitée | Pourquoi elle aurait fuité | Ce qui est fait à la place |
| --- | --- | --- |
| `public.notifications` avec une FK ou une jointure vers `prayer_request` | Une jointure ou un `COUNT` révèle le **nombre** de demandes | `reference_id text` **sans FK** ; la notification ne contient que `type` et `referenceId` (`030` §6.2) |
| `public.audit_log` avec des valeurs `PRAYER_*` | Un journal lisible par le `SUPER_ADMIN` révèle l'**activité** du domaine (`030` §6.3.1) | Énumération `audit_action` **sans aucune valeur `PRAYER_*`** ; les événements vivent dans `prayer_audit_event` |
| FK `notification_outbox.prayer_request_id → prayer_request.id` | Franchirait la frontière de privilèges (le rôle `ccjv_app` devrait lire la table des prières) | **Aucun `REFERENCES`** : la colonne est un simple `uuid` |
| Vue `public` de comptage pour un tableau de bord | Révèle un **volume** | `030` §6.3.4 : « aucune métrique exposant un volume de prières à un tableau de bord lisible par le `SUPER_ADMIN` » |
| `site_settings` porteuse d'un paramètre de prière | Le `SUPER_ADMIN` lit les paramètres (D-03) | `CHECK site_settings_no_prayer_secret` |

**Ce que le schéma ne garantit pas, et qui est écrit comme tel :** les
**métadonnées** (nombre, dates, existence) restent lisibles par quiconque détient le
rôle **propriétaire** de la base ou une sauvegarde complète (`030` §1.5 P3, §4.6,
Annexe C G8). Aucune colonne ne corrige cela : seule l'isolation de **niveau 2**
(§5.4.2) le peut, partiellement.

## 5.4 Isolation du magasin — schéma séparé et rôles PostgreSQL disjoints

`030` §4.6 décrit deux niveaux. **Le niveau 1 est arrêté** (A16) ; **le niveau 2 est
« recommandé, à confirmer »** (A16, Q4).

### 5.4.1 Niveau 1 — arrêté, reproduit tel quel

| Règle de `030` §4.6 | Traduction en schéma |
| --- | --- |
| « Schéma dédié `prayer_private` regroupe `prayer_request`, `data_key_envelope`, `crypto_key`, `prayer_audit_event` » | **Fait** : 4 tables dans `prayer_private`, aucune dans `public` |
| « Deux rôles PostgreSQL **disjoints** : `ccjv_app` (rôle applicatif principal) : **aucun privilège** sur `prayer_private`. `prayers_api` : privilèges sur `prayer_private` **uniquement**, plus `INSERT` sur `public.notification_outbox` » | **Fait** : DDL ci-dessous |
| « Deux pools de connexions : le module Prayers est le **seul** à ouvrir une connexion avec `prayers_api`, via un secret distinct » | Hors schéma (application) ; conséquence : `PRAYER_DB_URL` (§5.5) |
| « Aucune requête du reste de l'application — et donc aucun code exécuté par un `SUPER_ADMIN` à travers la plateforme — ne peut lire, compter ou énumérer les demandes » | **Fait** : `REVOKE ALL ON SCHEMA prayer_private FROM ccjv_app` |
| « Pas de clé étrangère inter-schéma » | **Fait** : `crypto_key.owner_user_id` sans `REFERENCES`, `notification_outbox` sans `REFERENCES` |
| « RLS : Optionnelle, en défense supplémentaire » | **Non tranché** (§8) : appliquer RLS exigerait de fixer une politique dont `030` ne dit que « restreinte au flux du module » |

```sql
-- ---------------------------------------------------------------------------------
-- Isolation de niveau 1 — 030 §4.6, A16. Arrêté.
-- Les rôles ccjv_app et prayers_api sont supposés créés par le déploiement.
-- ---------------------------------------------------------------------------------

-- Rôle applicatif principal : AUCUN privilège sur le magasin des prières.
REVOKE ALL ON SCHEMA prayer_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES    IN SCHEMA prayer_private FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA prayer_private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA prayer_private FROM PUBLIC;

REVOKE ALL ON SCHEMA prayer_private FROM ccjv_app;
REVOKE ALL ON ALL TABLES IN SCHEMA prayer_private FROM ccjv_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA prayer_private
  REVOKE ALL ON TABLES FROM ccjv_app;

-- prayers_api : privilèges sur prayer_private UNIQUEMENT.
GRANT USAGE ON SCHEMA prayer_private TO prayers_api;
GRANT SELECT, INSERT, UPDATE ON
  prayer_private.prayer_request,
  prayer_private.data_key_envelope,
  prayer_private.crypto_key,
  prayer_private.prayer_audit_event
  TO prayers_api;

-- Aucun DELETE n'est accordé : D-16 interdit toute purge, et 030 §6.1 conclut
-- « Purge : impossible dans le modèle ». L'absence de privilège DELETE rend la
-- règle indépendante de la discipline du code applicatif.
REVOKE DELETE ON ALL TABLES IN SCHEMA prayer_private FROM prayers_api;

-- prayers_api : INSERT sur l'outbox publique, et RIEN de plus dans public.
-- C'est le seul point de contact, et il ne transporte qu'un requestId et un
-- horodatage (030 §6.2).
GRANT INSERT ON public.notification_outbox TO prayers_api;

-- Le worker de notification tourne avec ccjv_app : il consomme l'outbox et crée
-- les notifications (030 §5.1 étape 15).
GRANT SELECT, UPDATE ON public.notification_outbox TO ccjv_app;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO ccjv_app;
```

### 5.4.2 Niveau 2 — **à confirmer** (A16, Q4)

`030` §4.6 : « Le magasin des prières est hébergé dans une **instance/base dédiée**
dont les identifiants ne figurent **ni** dans la configuration de la plateforme
principale, **ni** dans le périmètre du rôle `service_role`/propriétaire de la base
principale. »

**Ce que le niveau 2 change dans le schéma :** **rien**. Le DDL est identique ; seuls
changent l'instance d'accueil et les identifiants. Le schéma est donc écrit pour
fonctionner dans les deux cas, conformément à A16 (« Niveau 1 arrêté ; niveau 2 à
confirmer »).

**Pourquoi le niveau 2 est nécessaire pour une partie de D-10 :** sans lui, quiconque
détient le rôle **propriétaire** de la base principale (chaîne de connexion
d'administration, `service_role` Supabase, sauvegarde complète) peut lire le
**nombre** de demandes, leurs **statuts** et leurs **dates** — ce que D-10 interdit
au `SUPER_ADMIN`. Avec le niveau 2, ces métadonnées n'existent que dans un magasin
dont il n'a pas les identifiants.

**Le résidu assumé (P3) :** même au niveau 2, l'hébergeur de l'instance dédiée et
quiconque obtient une sauvegarde complète de cette instance voient ces métadonnées.
« **Cette partie de D-10 n'est pas cryptographiquement garantie.** » (`030` §4.6)

### 5.4.3 Niveau 2 — variante de DDL, si Q4 est tranchée favorablement

Le schéma logique étant identique, la promotion au niveau 2 change la **localisation**
des objets, pas leur définition. La seule conséquence de schéma est que
`public.notification_outbox` devient **inter-base** : `030` §5.1 étape 13 exige une
transaction unique, et deux instances distinctes ne la fournissent pas nativement.

```sql
-- Si Q4 = « Niveau 2 », l'outbox ne peut plus être atteinte par un simple INSERT
-- depuis la transaction d'insertion de la demande. La même transaction locale reste
-- possible SI les deux bases sont sur la même instance et si postgres_fdw est utilisé :
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
-- La cible (base principale) est montée en serveur étranger, l'insertion se fait
-- dans la même transaction locale. Aucune clé étrangère n'est créée : la frontière
-- de privilèges reste intacte (§5.3, couche 3).
```

**Point non tranché :** le mécanisme exact d'atomicité **inter-base** du niveau 2.
`030` §5.1 étape 13 exige une transaction unique ; `030` §4.6 Q4 laisse le niveau 2
ouvert. Les deux exigences ne sont pas simultanément satisfaites par une simple
transaction locale si les magasins sont sur des instances distinctes. C'est un point
**non tranché** (§8, Q-S11).

## 5.5 Ce que le schéma ne contient **pas**, et qui ne doit jamais y apparaître

Liste normative, vérifiable par les tests de `030` Annexe A.

| Élément absent | Vérification |
| --- | --- |
| Clé privée Admin, blob de clé non chiffré, phrase secrète | Aucune colonne (vérification **V2**, §4.6). Le blob vit dans l'`IndexedDB` du navigateur de l'Admin (`030` §2.6, §4.3 option O1) |
| DEK, sous quelque forme que ce soit | Aucune colonne, aucune fonction, aucun journal. La DEK n'est **jamais stockée** ; elle n'existe que dans le navigateur du visiteur puis, enveloppée, dans `data_key_envelope.wrapped_key` |
| Fragment de custodie (Shamir), clé privée `RECOVERY` | Aucune colonne. « Aucun fragment n'est stocké sur un serveur, dans le dépôt Git, dans une variable d'environnement, dans un gestionnaire de mots de passe en ligne, ni saisi dans un formulaire web » (`030` §4.5.2) |
| KEK, clé maître, clé d'environnement servant à déchiffrer | **Aucune n'existe** : « leur présence serait en soi le défaut » (`030` §7.2 point 9). Écart assumé vs `024` §29 : **aucune** variable `CRYPTO_KEY` (`030` §9 écart E7) — subsiste `PRAYER_DB_URL` (rôle `prayers_api`), qui n'est pas une clé de déchiffrement |
| Contact, courriel, téléphone du demandeur | Colonne **inexistante**, vérification **V1** (D-17, test T16) |
| Index plein texte, résumé, mot-clé, empreinte perceptuelle, indice de similarité | Aucun index de ce type en §10 ; `030` §7.1 point 5 |
| Événement de prière dans le journal général | `audit_action` sans valeur `PRAYER_*` ; vérification **V4** ; `030` §6.3.1, test T9 |
| Compteur, vue ou table de bord exposant un volume de prières | Aucune vue, aucune table agrégée dans `public` |
| Un identifiant de demande en URL ou en en-tête, des octets de clé dans un journal | Hors schéma, mais contraignant : `030` §7.3 (« URL, paramètres de requête, en-têtes personnalisés ») |

---

# 6. Stratégie de conservation (D-08)

## 6.1 Ce qui doit être conservé

D-08 : *« `Adultes`, `Enfants/Ecodim` et `Chorale` — auxquels sont rattachés **7
événements et 10 publications** — **ne doivent pas être supprimés brutalement**. La
migration doit prévoir une **stratégie de conservation et de rattachement** avant
toute suppression éventuelle. Aucun événement ni publication ne doit disparaître du
fait du changement de modèle. »*

**État vérifié dans la graine (`seed-data.ts`) :**

| Département historique | Rattachements réels dans la graine |
| --- | --- |
| `Adultes` | **3 événements** (`Culte dominical`, `Culte dominical` archivé, plus le culte spécial qui porte `departmentName: null`) · **1 responsable** · banque de 6 photos |
| `Enfants / Ecodim` | **1 événement** (`Rencontre Ecodim`) · **1 responsable** · 6 photos |
| `Chorale` | **2 événements** (`Répétition de la chorale` ×2) · **1 responsable** · 6 photos · rythme hebdomadaire confirmé (`schedule_entries`) |

**Vérification du décompte D-08 (« 7 événements et 10 publications ») :**

| Ensemble | Total en graine | Rattachés à un département historique | À `departmentName: null` |
| --- | --- | --- | --- |
| Événements | **7** | **5** (Culte dominical, Rencontre Ecodim, Répétition ×2, Culte dominical archivé) | **2** (« Culte spécial — Action de grâce », « Journée communautaire ») |
| Publications | **10** | **0** — la graine **ne porte aucune colonne de département** pour les publications | **10** |

**Écart à signaler, non tranché :** D-08 écrit « auxquels sont rattachés 7 événements
et 10 publications ». La graine ne rattache explicitement que **5 événements** à ces
départements et **aucune publication**. Les 7 et 10 sont donc les **totaux** de la
base actuelle, non les rattachements effectifs. Conséquence directe : l'ajout de
`publications.department_id NOT NULL` (§3.7) exige une **décision de rattachement
pour les 10 publications**. Cette décision est **non tranchée** (§8, Q-S1).

## 6.2 Structure retenue pour conserver les départements historiques

**Principe : aucune suppression, aucune table d'archive, aucune colonne `deleted_at`.**
Les départements historiques sont **conservés comme lignes ordinaires de
`public.departments`**, et l'histoire est portée par les rattachements qui existent
déjà :

```text
public.departments
├── Presse                       ← D-07, espace back-office spécialisé
├── Ecodume                      ← D-07 + D-09 (renommage depuis « Ecodim »)
├── Affaires Sociales            ← D-07, sans espace dédié à ce stade
├── Adultes                      ← D-08 · CONSERVÉ
├── Ecodume (ex-Enfants/Ecodim)  ← D-08 + D-09 · CONSERVÉ et RENOMMÉ
└── Chorale                      ← D-08 · CONSERVÉ
```

**Pourquoi cette structure suffit :**

| Exigence de D-08 | Comment elle est satisfaite | Vérification |
| --- | --- | --- |
| « Ne doivent pas être supprimés brutalement » | Aucun `DELETE` sur `departments` dans la migration ; les lignes restent | `SELECT count(*) FROM public.departments WHERE slug IN ('adultes','ecodume','chorale')` = 3 |
| « Aucun événement ni publication ne doit disparaître » | `events.department_id` et `publications.department_id` sont `ON DELETE RESTRICT` : la suppression d'un département portant un événement ou une publication est **refusée par la base** (§1.5) | Toute tentative de `DELETE` échoue avec `foreign_key_violation` |
| « Stratégie de conservation **et de rattachement** » | Le rattachement est **conservé tel quel** pour les 5 événements rattachés ; les 2 événements à `NULL` et les 10 publications reçoivent un rattachement explicite (§6.3) | Voir §6.3 |
| « Avant toute suppression **éventuelle** » | Une suppression éventuelle reste **possible** et reste **non tranchée** (`028/Q-B3`, `029` §2.2 actions 2.5/2.6). Si elle est tranchée un jour, elle se heurtera volontairement à `RESTRICT` — comportement voulu par D-08 | `029` §2.2 cellules 2.5 et 2.6 |

**Slug du département historique renommé.** D-09 impose que l'**identifiant métier**
converge vers « Ecodume » : « Renommage **métier réel**, pas un changement de libellé
d'affichage. Doivent converger vers **Ecodume** : données persistées · **identifiant
métier** · **slug** · frontend · back-office · documentation ». En conséquence :

```sql
-- D-09 : renommage COMPLET. La ligne est CONSERVÉE (aucun DELETE, D-08) :
-- seul le contenu identitaire change.
UPDATE public.departments
SET    name       = 'Ecodume',
       slug       = 'ecodume',
       updated_at = now()
WHERE  slug IN ('ecodim', 'enfants-ecodim', 'ecodume');
-- Le texte éditorial (description, tagline, key_points) est réécrit par le
-- back-office, pas par cette migration : aucune valeur éditoriale n'est inventée.
```

**Point d'attention :** l'ancrage frontend `#ecodim` est un **alias de code**
(`OrganisationExplorer.tsx`, `DepartmentModal.tsx` — `031` §2.8 le range dans « Jamais
éditable »). Le renommage des données ne casse pas l'ancre, qui vit dans le JSX ;
l'alignement des alias est un point **non tranché** (§8, Q-S13).

## 6.3 Rattachement des 7 événements et des 10 publications

### 6.3.1 Événements — le rattachement est dérivable pour 5, à décider pour 2

`events.department_id` devient `NOT NULL`. Les 5 événements rattachés conservent leur
département (identifié par `name` dans la graine). Les **2 événements
institutionnels** (« Culte spécial — Action de grâce », « Journée communautaire »)
n'ont **aucun** département dans la graine.

**Ce que D-26 interdit :** les laisser à `NULL`. **Ce que D-26 exige :** « on ne perd
jamais l'information du **responsable** ». **Ce que D-26 n'écrit pas :** **quel**
département devient responsable d'un événement institutionnel existant — aucun
département de D-07 n'est « l'église entière ».

**Formulation honnête :** ce rattachement est **non tranché** (§8, Q-S2). La migration
doit donc être **bloquante** sur ce point et ne peut pas être exécutée sans décision.
Trois options, listées pour que la décision soit prise en connaissance de cause —
**aucune n'est appliquée d'office** :

| Option | Contenu | Conséquence |
| --- | --- | --- |
| **O-A** | Créer un département institutionnel (`slug: 'vie-de-leglise'`, nom à confirmer) qui porte les événements de toute l'église | Respecte D-26 (un responsable identifié) ; ajoute un département qui n'est pas dans D-07 — or D-07 dit qu'« aucun autre département n'est figé sans décision métier explicite » |
| **O-B** | Rattacher ces 2 événements au département **Presse** (responsable de la communication) avec `visibility_scope = 'GLOBAL'` | C'est **littéralement** le cas d'usage décrit par D-26 (« La Presse est responsable de l'événement, mais l'événement concerne toute l'église ») — mais il présuppose que la Presse assume rétroactivement des événements qu'elle n'a pas créés, et la Presse doit alors détenir la capacité `EVENT_SCOPE_GLOBAL` |
| **O-C** | Les rattacher au département dont le sujet est le plus proche (`Adultes` pour le culte spécial) | Cohérent avec le rattachement des autres cultes dominicaux de la graine ; laisse toutefois `Journée communautaire` sans rattachement naturel |

**Le schéma ne tranche pas.** Il **rend le choix obligatoire** : la migration échouera
tant que `department_id` sera `NULL` — exactement l'effet voulu par D-26.

### 6.3.2 Publications — 10 rattachements à décider

`publications.department_id` est une **colonne nouvelle** (§3.7) et elle est
`NOT NULL`. Or la graine **ne porte aucune information de département** pour les
publications : les 10 publications sont toutes à rattacher.

**Formulation honnête :** ce rattachement est **non tranché** (§8, Q-S1). Aucune règle
ne permet de le déduire : seuls les **titres** suggèrent une proximité (« Annonce —
Rentrée de l'Ecodim » et « Vie de l'Ecodim en images » évoquent `Enfants/Ecodim` ;
« Album — Louange et adoration » évoque `Chorale`), et une déduction par titre serait
une **inférence**, ce que la règle de méthode de ce document interdit.

**Séquence d'exécution obligatoire** (additive, donc réversible jusqu'à la dernière
étape) :

```sql
-- 1. Ajouter la colonne NULLABLE : aucune écriture existante n'est invalidée.
ALTER TABLE public.publications ADD COLUMN department_id uuid;
ALTER TABLE public.publications
  ADD CONSTRAINT publications_department_id_fk
  FOREIGN KEY (department_id) REFERENCES public.departments (id) ON DELETE RESTRICT;

-- 2. Renseigner les 10 lignes — DÉCISION MÉTIER REQUISE (§8, Q-S1).
--    Tant que cette étape n'est pas exécutée, l'étape 3 échoue : c'est voulu.
UPDATE public.publications
SET    department_id = (SELECT d.id FROM public.departments d WHERE d.slug = 'presse')
WHERE  department_id IS NULL;

-- 3. Verrouiller la règle : uniquement après 0 ligne à NULL.
ALTER TABLE public.publications ALTER COLUMN department_id SET NOT NULL;

-- 4. Ajouter la colonne générée et la contrainte de la règle des 3 (§3.7, §4.1).
ALTER TABLE public.publications
  ADD COLUMN published_slot smallint
  GENERATED ALWAYS AS (
    CASE WHEN status = 'PUBLISHED' THEN 1::smallint ELSE NULL END
  ) STORED;

CREATE UNIQUE INDEX publications_max_three_published_per_department
  ON public.publications (department_id, published_slot)
  WHERE status = 'PUBLISHED';
```

**Contrôle de non-perte obligatoire** avant et après migration :

```sql
-- Aucune ligne perdue : le compte doit être IDENTIQUE avant et après.
SELECT 'public.departments'        AS table_name, count(*) FROM public.departments
UNION ALL SELECT 'public.events',            count(*) FROM public.events
UNION ALL SELECT 'public.publications',      count(*) FROM public.publications
UNION ALL SELECT 'public.leaders',           count(*) FROM public.leaders
UNION ALL SELECT 'public.testimonies',       count(*) FROM public.testimonies
UNION ALL SELECT 'public.community_faces',   count(*) FROM public.community_faces
UNION ALL SELECT 'public.scriptures',        count(*) FROM public.scriptures
UNION ALL SELECT 'public.schedule_entries',  count(*) FROM public.schedule_entries
UNION ALL SELECT 'public.social_links',      count(*) FROM public.social_links
UNION ALL SELECT 'public.site_settings',     count(*) FROM public.site_settings
UNION ALL SELECT 'public.static_pages',      count(*) FROM public.static_pages
UNION ALL SELECT 'public.media',             count(*) FROM public.media;
-- Référence attendue (graine) : 3, 7, 10, 5, 4, 5, 7, 6, 2, 15, 6, n (médias).
```

## 6.4 Départements **désactivés** — point non tranché, assumé

`028/Q-B3` — « Un département peut-il être désactivé sans être supprimé ? » — **n'est
pas tranchée** (`029` §2.2 cellules 2.5 et 2.6, marquées `?`).

**Le schéma ne crée donc PAS de colonne d'activation sur `departments`.** La créer
serait inventer une décision : sa présence impliquerait qu'un département inactif
disparaît des listes publiques, ce qu'aucune décision n'énonce. Le point figure en §8
(Q-S3).

**Ce qui existe à la place, et qui est suffisant aujourd'hui :** la conservation pure
(D-08) et la protection par `RESTRICT`. Un département dont on ne veut plus « n'est
plus alimenté » : il n'est jamais supprimé, ses événements et publications restent
consultables (D-20 pour les publications archivées), et son éventuelle disparition des
surfaces publiques est une décision d'affichage, non de modèle.

---

# 7. Écarts avec les 16 tables existantes

## 7.1 Méthode de lecture du tableau

| Colonne | Signification |
| --- | --- |
| **Table existante** | Les 16 tables de `0000_elite_pretty_boy.sql`. |
| **Ce qui change** | L'écart au modèle cible. |
| **Migration** | **`additive`** = aucune donnée perdue, opération réversible · **`destructive`** = perte de données ou d'une capacité existante. Toute ligne destructive porte une **alternative**. |
| **Risque** | Ce qui peut casser si l'étape est mal ordonnée. |

**Règle appliquée :** toute suppression de table ou de colonne est marquée
**`destructive`** et une alternative est proposée.

## 7.2 Tableau des écarts

| # | Table existante | Ce qui change | Migration | Risque | Alternative proposée |
| --- | --- | --- | --- | --- | --- |
| 1 | `admin_profiles` | `role` : énum `admin_role` reconstruite (`ROLE_ADMIN` → `ADMIN`) ; ajout `scope NOT NULL` ; ajout `department_id` nullable + FK `RESTRICT` ; ajout du `CHECK` de cohérence | **`destructive`** (recréation du type ; la valeur `ROLE_ADMIN` disparaît) | Toute ligne subsistante portant `ROLE_ADMIN` fait échouer `ALTER COLUMN … TYPE admin_role USING …::admin_role`. Le `CHECK` de cohérence échoue si `scope` est posé `NOT NULL` sans valeur | **Séquence additive en trois temps** : (1) créer `admin_scope` ; (2) `ADD COLUMN scope` **nullable** ; (3) `UPDATE … SET role='ADMIN', scope='GLOBAL'` ; (4) `SET NOT NULL` + `CHECK`. **Aucune ligne n'est perdue** ; la reconstruction du type n'intervient qu'après que 0 ligne porte `ROLE_ADMIN`. Vérification : `SELECT count(*) FROM public.admin_profiles WHERE role::text = 'ROLE_ADMIN'` **doit valoir 0**. **Le compte de production existant devient `ADMIN`** (D-05, `029` C-03) |
| 2 | `departments` | **Ajout de la colonne `created_by`** (`ALTER TABLE … ADD COLUMN`, étape 5 de §0.4) puis de sa FK `RESTRICT` ; ajout de la table `department_capabilities` | **`additive`** | La FK `created_by` est posée **après** `admin_profiles` : dans le mauvais ordre, la contrainte échoue. La colonne reste `NULL` pour toutes les lignes existantes — acceptable, elle est facultative par construction | Si `created_by` n'est pas retenu : **ne pas ajouter la colonne ni la FK**. Elle n'est exigée par aucune décision. **Non tranché** (Q-S12) |
| 3 | `media` | **Aucun changement de structure.** Ajout de la table `media_access` | **`additive`** | Aucun. La table reste la bibliothèque centrale (D-22, X27) | — |
| 4 | `department_media` | Aucun changement. `ON DELETE RESTRICT` conservé sur `media_id` | **`additive`** (aucune modification) | Aucun | — |
| 5 | `events` | **`department_id` : `NULL` → `NOT NULL`** ; `ON DELETE` : `SET NULL` → `RESTRICT` ; ajout `visibility_scope NOT NULL DEFAULT 'DEPARTMENT'` ; trigger de cohérence de portée | **`destructive`** (les capacités « événement sans département » et « supprimer un département sans perdre les événements » **disparaissent**) | **Bloquant** : la graine contient **2 événements à `department_id = NULL`**. `SET NOT NULL` échouera. C'est voulu par D-26 — mais la migration ne peut pas être exécutée sans décision (§6.3.1, §8 Q-S2) | **Aucune alternative n'est conforme à D-26** : « Un événement global au sens d'un `department_id = NULL` **n'existe pas** ». L'alternative est **procédurale** : trancher le rattachement des 2 événements institutionnels **avant** d'exécuter `SET NOT NULL`. `RESTRICT` remplace `SET NULL` par nécessité : `SET NULL` fabriquerait l'état interdit. Si la suppression d'un département doit rester possible, l'alternative est la **désactivation** (l'objet même de `028/Q-B3`, non tranchée) |
| 6 | `event_media` | Aucun changement | **`additive`** | Aucun | — |
| 7 | `publications` | `status` : ajout `ARCHIVED` ; ajout `archived_at` ; **ajout `department_id NOT NULL`** + FK `RESTRICT` ; ajout de la colonne générée `published_slot` et de l'index unique partiel de la règle des 3 ; trigger d'irréversibilité | **`additive`** pour l'énumération (`ADD VALUE` est non destructif) — **bloquant** sur `department_id NOT NULL` : la graine porte **10 publications sans département** | **Bloquant** : `SET NOT NULL` échoue sans décision de rattachement (§6.3.2, §8 Q-S1) | Pour la colonne : séquence additive en 3 temps (§6.3.2). **Aucune alternative ne permet d'éviter `department_id`** : sans lui, la règle des 3 (D-18) est **inévaluable**, et D-18 est une décision arrêtée. Pour la règle des 3 : la forme retenue (§4.1.1) **n'exige aucune extension** ; l'alternative — une contrainte d'exclusion `GiST` à créneaux — exigerait `btree_gist` sans apporter de garantie supplémentaire |
| 8 | `community_faces` | Aucun changement | **`additive`** | Aucun | — |
| 9 | `leaders` | Aucun changement (FK vers `departments` déjà `SET NULL`, règle correcte : §1.5) | **`additive`** | Aucun | — |
| 10 | `testimonies` | Ajout `status NOT NULL DEFAULT 'DRAFT'`, `moderated_by`, `moderated_at`, `CHECK` de cohérence | **`additive`** | Aucun : `DRAFT` par défaut **n'expose rien** (Q-PR9) — et l'exposition publique est de toute façon refusée provisoirement à tous les rôles (`029` §2.12 action 12.1) | Sans alternative : D-24 exige un « statut/modération **à définir avant exposition publique** ». Ne pas créer la colonne laisserait la table sans moyen d'exprimer cette réserve |
| 11 | `schedule_entries` | Ajout `department_id` **nullable**, FK `SET NULL` | **`additive`** | Aucun | 031 §7 Q-PG5 est **non tranchée** sur l'usage de cette table ; la colonne est ajoutée vide et n'est remplie que par décision. **Alternative recommandée :** ne pas l'ajouter tant que Q-PG5 n'est pas tranchée |
| 12 | `scriptures` | Aucun changement | **`additive`** | Aucun | — |
| 13 | `site_settings` | Ajout du `CHECK site_settings_no_prayer_secret` | **`additive`** (mais **bloquant** si une clé existante commence par `prayer`/`crypto`/`dek`/`recovery`/`kek`/`master`) | Aucune des 15 clés de la graine ne commence ainsi : contrôle vérifié. Un ajout futur de clé serait refusé — c'est le but | Si une clé légitime commençait par un de ces préfixes, l'alternative est une **liste blanche** explicite des 15 clés autorisées (déjà présente côté application, `ALLOWED_SETTING_KEYS`) plutôt qu'un préfixe interdit |
| 14 | `social_links` | Ajout du `CHECK social_links_href_scheme` | **`additive`** | Bloquant si un `href` existant n'est ni `http(s)`, ni `mailto`, ni `tel` | Le `CHECK` accepte déjà `mailto:` et `tel:` — le seul cas refusé est un schéma exotique. **Alternative :** ne pas poser ce `CHECK`, qui n'est exigé par aucune décision |
| 15 | `static_pages` | Ajout `template NOT NULL`, `contract_version NOT NULL DEFAULT 1` ; `CHECK` contenu-objet ; `CHECK` sans clé de structure ; trigger de validation des clés de verset | **`additive`** pour les colonnes (`template` doit être **renseigné** : il est dérivable de `page_key` par la table de correspondance serveur, `031` §1.4 L4) — **`destructive`** si le `CHECK` de structure est posé alors qu'un contenu existant porte une clé interdite | Les 12 valeurs de la graine utilisent `heroTitle`, `heroIntro`, `title`, `intro` — **aucune** n'est une clé de structure : contrôle vérifié. En revanche, `template` doit être renseigné pour les 6 lignes avant `SET NOT NULL` | **Alternative pour le `CHECK` de structure** : le porter uniquement côté Zod (`031` §1.4 L3, `z.strictObject`), sans `CHECK` en base. Le schéma **retient les deux** (défense en profondeur) ; retirer le `CHECK` ne retirerait pas la garantie applicative |
| 16 | `prayer_requests` | **Table supprimée** ; remplacée par `prayer_private.prayer_request` | **`destructive`** | Perte de `request_text`, `requester_name`, `requester_contact`, `confidentiality`, `status` (`NEW`/`PRAYED`), `handled_at`, `created_at`, `updated_at`. Le type `prayer_confidentiality` est supprimé ; le type `prayer_status` est reconstruit (`NEW`/`PRAYED` disparaissent) | **Aucune alternative ne permet de conserver ces données dans le modèle cible**, et c'est **par décision** : (a) D-17 supprime `requester_contact` « définitivement » — « il ne doit survivre **nulle part** » ; (b) D-11/D-15 exigent du **chiffré** : un texte en clair ne peut pas être converti en chiffré sans la DEK et les clés publiques, qui n'existent pas ; (c) `030` §3.6.1 interdit toute colonne de contact. **Alternative procédurale retenue** : **purge explicite et vérifiée avant suppression de la table**, conformément à D-17 (« avec **purge explicite et vérifiée** si elles existent réellement en production »). Le contrôle de la graine montre qu'aucune donnée de prière n'y figure : aucune donnée de développement n'est concernée. **Si et seulement si** des lignes existent en production, l'ordre est : (1) **exporter** les données dans un support hors base, sous la responsabilité du commanditaire ; (2) `TRUNCATE` explicite **puis vérifié** (`SELECT count(*) = 0`) ; (3) `DROP TABLE`. La décision d'export ou de destruction **relève du commanditaire** et est **non tranchée** (§8, Q-S5) |

## 7.3 Récapitulatif chiffré des écarts

| Catégorie | Nombre | Tables |
| --- | --- | --- |
| **Tables inchangées** | **6** | `media`, `community_faces`, `department_media`, `event_media`, `leaders`, `scriptures` |
| Tables **additives** pures (aucune perte) | **5** | `departments`, `schedule_entries`, `testimonies`, `social_links`, `site_settings` |
| Tables **additives mais bloquantes** (une décision requise avant exécution) | **2** | `publications` (rattachement des 10), `static_pages` (`template` à renseigner) |
| Tables **destructives** | **3** | `admin_profiles` (recréation d'énumération) · `events` (`department_id` NOT NULL + `RESTRICT`) · `prayer_requests` (**suppression de table**) |
| **Tables créées** | **9** | `media_access`, `department_capabilities`, `notifications`, `notification_outbox`, `audit_log`, `prayer_private.prayer_request`, `prayer_private.data_key_envelope`, `prayer_private.crypto_key`, `prayer_private.prayer_audit_event` |
| **Types d'énumération supprimés** | **1** | `prayer_confidentiality` (remplacé par `is_anonymous`, D-15) |
| **Types d'énumération recréés** | **2** | `admin_role`, `prayer_status` |
| **Types d'énumération étendus** | **1** | `publication_status` (`+ ARCHIVED`) |

**Une seule suppression de table est requise : `prayer_requests`.** Elle est imposée
par D-17 et par D-11/D-15, non par commodité — et elle exige la **purge explicite et
vérifiée** de D-17 (§7.2, ligne 16).

**Une seule suppression de colonne est requise : `prayer_requests.requester_contact`**
— supprimée avec la table elle-même. Aucune autre colonne du schéma existant n'est
supprimée.

---

# 8. Points non tranchés

Formulés pour être **répondus en une phrase**. Seuls les points que `028`, `029`,
`030` et `031` laissent **réellement** ouverts figurent ci-dessous. Aucun n'est comblé
par une supposition.

## 8.1 Points de schéma dérivés des questions ouvertes de `028`/`029`/`030`/`031`

| # | Point non tranché | Ce qui est déjà su | Question à trancher en une phrase | Renvoi |
| --- | --- | --- | --- | --- |
| **Q-S1** | **Rattachement départemental des 10 publications existantes** | `publications.department_id` doit être `NOT NULL` (règle des 3, D-18) ; la graine ne porte **aucune** information de département pour les publications | À quel département rattacher chacune des 10 publications existantes ? | D-08, D-18 |
| **Q-S2** | **Rattachement des 2 événements institutionnels** | D-26 interdit `department_id = NULL` ; D-07 n'énumère que Presse, Ecodume, Affaires Sociales (aucun département « église entière ») | Quel département devient responsable de ces 2 événements ? | D-07, D-26 |
| **Q-S3** | **Un département peut-il être désactivé sans être supprimé ?** | Aucune colonne d'activation n'existe sur `departments` ; `029` §2.2 cellules 2.5/2.6 sont marquées `?` | Ajouter une colonne de désactivation, ou conserver les départements sans état d'activation ? | `028/Q-B3` |
| **Q-S4** | **Absence de clé étrangère sur `media_access.grantee_id`** | La colonne est polymorphe ; un trigger vérifie l'existence, mais ne protège pas d'une suppression ultérieure de la cible | Faut-il scinder `media_access` en deux tables (droits par département / par profil), ou conserver la forme polymorphe protégée par trigger ? | `029/Q-26` |
| **Q-S5** | **Sort des données de prière existantes en production** | D-17 exige une « purge explicite et vérifiée » ; aucune donnée de prière ne figure dans la graine de développement | Les données de prière éventuellement présentes en production doivent-elles être exportées hors base avant suppression, ou détruites sans export ? | D-17 |
| **Q-S6** | **Qui édite les capacités de département ?** | D-25 place les capacités sur le département et ne nomme **aucun** rôle ; la table porte `granted_by` mais aucune policy n'est arbitrée | Quel rôle peut écrire dans `department_capabilities` ? | `029/Q-06` ⚠ |
| **Q-S7** | **Encodage des capacités de département** | D-25 arrête le **principe** et le nom du porteur (« capacités / politiques ») ; l'encodage exact est déclaré « non tranché » (`029` §5.3) | La table `department_capabilities` est-elle l'encodage retenu, ou faut-il une colonne `jsonb` / un tableau ? | D-25, `029` §5.3 |
| **Q-S8** | **Code de la capacité « événementielle globale »** | D-25 nomme la capacité entre guillemets, sans code technique ; le schéma retient `EVENT_SCOPE_GLOBAL` | Le code `EVENT_SCOPE_GLOBAL` est-il retenu, et d'autres codes sont-ils prévus dès maintenant ? | D-25 |
| **Q-S8bis** | **Sémantique de `wrap_generation`** | `030` §3.6.3 dit « incrémenté à chaque événement de sécurité (D-13) » ; D-13 énumère les déclencheurs sans dire si tous incrémentent la même génération | `wrap_generation` est-il **un** compteur global par déploiement, ou **un** compteur par clé ? | `030` §3.6.3, D-13 |
| **Q-S9** | **Concurrence de la règle des 3** | D-19 fixe le critère de tri ; R-02 constate que « la concurrence de la règle des 3 (transaction, verrou, publication simultanée) » n'est décrite nulle part | Deux publications simultanées dans un département : quelle publication archive-t-on, et l'une des deux requêtes reçoit-elle `409` ? | `029` R-02, D-18, D-19 |
| **Q-S10** | **Portée de la règle des 3 : département, ou département + type ?** | Le schéma écrit la contrainte sur `department_id` seul, conformément à la lettre de D-18 | La contrainte porte-t-elle sur `department_id` seul, ou sur `(department_id, type)` ? | `028/Q-P3` |
| **Q-S11** | **Atomicité de l'outbox en isolation de niveau 2** | `030` §5.1 exige une transaction unique ; §4.6 Q4 laisse le niveau 2 ouvert | Si le niveau 2 est retenu, l'atomicité passe-t-elle par `postgres_fdw`, par un outbox à deux phases, ou par une acceptation explicite d'une fenêtre de non-atomicité ? | `030` A16/Q4 |
| **Q-S12** | **`departments.created_by`** | Aucune décision n'exige ni n'interdit de tracer qui a créé un département | Faut-il conserver la colonne `created_by` (et sa FK `RESTRICT`) ? | — |
| **Q-S13** | **Alias d'ancre des départements renommés** | D-09 impose que le slug converge vers `ecodume` ; `031` §2.8 range les alias `#ecodim` et `#adulte` dans « Jamais éditable » (ils vivent dans le JSX) | Les alias d'ancre `#ecodim` / `#adulte` doivent-ils être alignés, et qui en décide ? | D-09, `031` §2.8 |
| **Q-S14** | **RLS sur `prayer_private`** | `030` §4.6 la qualifie d'« optionnelle, en défense supplémentaire » et ne décrit la politique que comme « restreinte au flux du module » | Active-t-on RLS sur `prayer_private`, et avec quelle politique exacte ? | `030` §4.6 |
| **Q-S15** | **Conservation des valeurs historiques de `prayer_confidentiality`** | Le type est supprimé et remplacé par `is_anonymous` (`030` §9 E4) ; les valeurs `private`/`community` distinguaient un niveau de diffusion qui n'existe plus | Les données portant `community` doivent-elles être converties en `is_anonymous = true`, ou l'information est-elle abandonnée ? | D-15, `030` §9 E4 |
| **Q-S16** | **Correspondance de `status = 'PRAYED'`** | Le type `prayer_status` est reconstruit ; `NEW → PENDING` est direct, `ARCHIVED` signifie « validé » et non « prié » | L'état `PRAYED` doit-il devenir `ARCHIVED`, ou être abandonné ? | `030` §3.6.1, `029/Q-25` |
| **Q-S17** | **Champ `metadata` de `prayer_audit_event`** | `030` §6.3.3 fixe une « liste blanche de clés NON sensibles uniquement » et un schéma Zod en `.strict()` : le nom exact du champ n'est pas imposé | La liste blanche est-elle appliquée uniquement côté Zod, ou faut-il aussi un `CHECK` de clés autorisées en base ? | `030` §6.3.3 |
| **Q-S18** | **Exhaustivité de `audit_action`** | `028/Q-API3` est ouverte (« historique/audit par ressource dès le MVP, ou plus tard ? ») et `030` A11 impose de n'y mettre aucun événement de prière | La liste de 20 valeurs est-elle figée pour le MVP, et qui l'étend ? | `028/Q-API3`, `030` A11 |

## 8.2 Points de schéma qui ne sont pas des questions mais des réserves de garantie

| # | Réserve | Fondement | Effet sur le schéma |
| --- | --- | --- | --- |
| **R-S1** | **La couverture des enveloppes n'est pas une contrainte déclarative.** « Au moins une enveloppe ADMIN active, exactement une enveloppe RECOVERY active » est un **contrôle applicatif périodique**, pas un `CHECK`. | `030` §3.6.2, §5.4.1 | Le schéma fournit ce qu'il peut : l'unicité de l'enveloppe **active** par `(demande, clé)`, qui rend l'anomalie détectable par la requête **V8** (§4.6) |
| **R-S2** | **Les métadonnées des prières ne sont pas protégées** contre un adversaire détenant le rôle propriétaire de la base ou une sauvegarde complète. Nombre, dates et existence restent lisibles. | `030` §1.5 P3, §4.6, Annexe C G8 | Aucune colonne ne corrige cela. Seule l'isolation de niveau 2 le réduit, partiellement (§5.4.2) |
| **R-S3** | **Un `ADMIN` révoqué conserve la lecture de ce qu'il pouvait lire.** Ni la révocation ni le ré-enveloppement ne changent le chiffré. | `030` §5.4.3, Annexe C G7 | Le schéma ne peut pas révoquer une clé privée détenue hors système. `CASCADE` sur `notifications` retire l'accès **futur** ; rien ne retire le passé |
| **R-S4** | **La clé privée d'un `ADMIN` peut être perdue** : le blob vit dans son navigateur. Perte simultanée du blob, de la sauvegarde et de la phrase secrète ⇒ illisibilité. | `030` §4.3, §5.6 | Les données **restent stockées** (D-16) et restent **structurellement valides** : la contrainte de couverture signale l'anomalie. Le schéma n'ajoute aucune colonne de « mode dégradé » — `030` §5.6 l'interdit |
| **R-S5** | **Le schéma ne peut pas empêcher l'ajout d'une clé de structure dans `Page.content`** par un futur développeur qui retirerait le `CHECK`. | D-23, `031` §1.4 L2-L3 | Défense en profondeur : `CHECK static_pages_no_structure_keys` **et** `z.strictObject`. Les deux doivent rester en place ; retirer l'un affaiblit l'autre |
| **R-S6** | **Le trigger `media_access_check_grantee` est plus faible qu'une FK** : il est contournable par désactivation, et n'empêche pas la suppression ultérieure de sa cible. | §4.3 | Signalé en Q-S4. **Remède partiel appliqué** : `RESTRICT` sur les FK d'auteur ; le CASCADE sur `media` nettoie les droits d'un média supprimé |
| **R-S7** | **Le vocabulaire de `audit_action` n'est pas exhaustif** et son extension future est un vecteur d'exposition si un événement `PRAYER_*` y était ajouté par mégarde. | D-03, D-10, `030` A11 | `030` Annexe A **T9** doit être un test permanent, doublé par la vérification **V4** (§4.6). Le schéma ne l'exprime pas : aucune contrainte SQL ne peut interdire une valeur d'énumération ajoutée plus tard |
| **R-S8** | **Le schéma ne peut pas garantir l'absence de secret dans un DTO, un journal ou une réponse d'API.** Seules les tables sont vérifiables par introspection. | `030` §7.1 à §7.3, tests T8, T16 | Les garanties applicatives correspondantes restent portées par les tests de `030` Annexe A, hors périmètre du schéma |

## 8.3 Points explicitement **exclus** de cette liste

Ne figurent **pas** ci-dessus, parce qu'ils sont **tranchés** :

| Point | Tranché par |
| --- | --- |
| Les 3 rôles et leurs scopes | D-01, D-02, D-03, D-04, `029` §1.1, §1.2 |
| L'irréversibilité de `ARCHIVED` | D-18, `029` §2.3 action 3.8 |
| L'ordre `published_at ASC, id ASC` | D-19 |
| Les archives restent publiques | D-20 |
| Les trois droits média sont indépendants | D-21 |
| Aucun partage média par défaut | D-22 |
| `Event.department_id` obligatoire + `visibility_scope` distinct | D-26 |
| Le nom de prière est chiffré, `is_anonymous` décide de sa présence | D-15 |
| Aucune purge automatique des prières, conservation indéfinie | D-16 |
| `requester_contact` supprimé partout | D-17 |
| Contrat de contenu par template, jamais de page builder | D-23 |
| Nature métier avant type frontend | D-24 |
| Les huit pages canoniques et leurs 238 champs | `031` §8 |
| Les états de prière (`PENDING`, `ARCHIVED`) | `030` §3.6.1, §6.1 |
| Le format d'`EncryptedData` et de `keyReference` | `030` §3.1 |
| L'isolation de niveau 1 du magasin des prières | `030` A16 (arrêté) |
| Le choix « index unique partiel sur créneau généré » plutôt qu'`EXCLUDE` GiST | **Tranché ici** (§4.1.1) : l'index n'exige aucune extension et le créneau est non écrivable |

---

# 9. Synthèse

## 9.1 Chiffres du modèle cible

| Mesure | Valeur |
| --- | --- |
| **Tables** | **24** — 20 dans `public`, 4 dans `prayer_private` |
| Tables existantes conservées | 15 (sur 16 : `prayer_requests` est remplacée) |
| Tables créées | 9 (`media_access`, `department_capabilities`, `notifications`, `notification_outbox`, `audit_log`, `prayer_request`, `data_key_envelope`, `crypto_key`, `prayer_audit_event`) |
| Tables supprimées | **1** — `public.prayer_requests` (**destructive**, imposée par D-17 et D-11/D-15) |
| **Énumérations** | **17** — 3 reprises telles quelles, 1 étendue, 2 reconstruites, 11 créées ; `prayer_confidentiality` supprimée |
| Schémas PostgreSQL | 2 (`public`, `prayer_private`) |
| Rôles PostgreSQL applicatifs | 2, **disjoints** (`ccjv_app`, `prayers_api`) |
| Ressources RBAC de `029` couvertes | **17 / 17** |
| Extensions PostgreSQL requises | **1** (`pgcrypto`) |
| Index | **51** — 22 repris de l'existant, 29 ajoutés (§10) |
| `CHECK` de cohérence métier | 27 |
| Triggers d'intégrité métier | 6 (`publications_status_immutable`, `prayer_request_status_immutable`, `events_visibility_scope_coherence`, `media_access_grantee_exists`, `notifications_recipient_role_check`, `static_pages_verse_keys_exist`) |
| Vérifications structurelles post-création | 8 (V1 → V8, §4.6) |

## 9.2 Réponse à la question centrale — la règle des 3

**La règle des 3 est exprimable en contrainte déclarative, mais cela ne suffit pas.**

| Question | Réponse |
| --- | --- |
| Peut-elle être exprimée en contrainte **déclarative** ? | **Oui.** Par un **index unique partiel** sur `(department_id, published_slot)` restreint à `status = 'PUBLISHED'`, où `published_slot` est une colonne **générée** (donc non écrivable) — **sans aucune extension**. La **borne** devient inviolable : aucun état au-delà ne peut être validé, même par une écriture directe en base. |
| Dispense-t-elle d'une **transaction applicative** ? | **Non.** Aucune contrainte déclarative ne peut choisir **quelle** publication archive. D-18 ne dit pas ce qu'il advient des autres `PUBLISHED` lors d'une publication supplémentaire, et `029` R-02 constate que la concurrence n'est décrite nulle part. La transaction doit verrouiller le département (`SELECT … FOR UPDATE`) et appliquer `ORDER BY published_at ASC, id ASC` (D-19). |
| Y a-t-il un point **non tranché** ? | **Oui, deux** : la portée de la règle (département seul ou département + type — `028/Q-P3`, Q-S10) et le comportement sous publication simultanée (Q-S9). |

## 9.3 Suppressions destructives identifiées

| # | Objet | Nature | Alternative |
| --- | --- | --- | --- |
| 1 | **`public.prayer_requests`** (table entière) | **Destructive** | Aucune alternative conforme au modèle cible : D-17 supprime le contact « définitivement », D-11/D-15 exigent du chiffré qu'aucun clair existant ne peut fournir, `030` §3.6.1 interdit toute colonne de contact. **Alternative procédurale :** purge explicite et vérifiée (D-17) avant `DROP`, avec décision d'export préalable — Q-S5 |
| 2 | **`admin_role`** (recréation du type) | **Destructive** (la valeur `ROLE_ADMIN` disparaît) | Séquence additive en 3 temps : ajouter `scope` nullable, `UPDATE` vers `ADMIN`/`GLOBAL`, puis reconstruire le type après contrôle à 0 ligne |
| 3 | **`prayer_confidentiality`** (type supprimé) | **Destructive** (type seul) | L'information est **remplacée** par `is_anonymous` (D-15, `030` §9 E4). Aucune donnée métier n'est perdue au sens du modèle cible — mais la correspondance des valeurs historiques est **non tranchée** (Q-S15) |
| 4 | **`prayer_status`** (recréation : `NEW`/`PRAYED` disparaissent) | **Destructive** (type) | Les états cibles `PENDING`/`ARCHIVED` sont arrêtés par `030` §3.6.1. Le mapping `NEW → PENDING` est direct ; `PRAYED` n'a **pas** d'équivalent (`ARCHIVED` signifie « validé », non « prié ») — sa correspondance est **non tranchée** (Q-S16) |
| 5 | **`events.department_id`** : `NULL` → `NOT NULL`, `ON DELETE SET NULL` → `RESTRICT` | **Destructive** (les capacités « événement sans département » et « supprimer un département sans perdre ses événements » disparaissent) | Aucune alternative conforme à D-26 : « Un événement global au sens d'un `department_id = NULL` **n'existe pas** ». Alternative **procédurale** : trancher le rattachement des 2 événements institutionnels avant `SET NOT NULL` (Q-S2) |
| 6 | **`publications.department_id`** `NOT NULL` ajouté sur 10 lignes sans rattachement | **Bloquante** (non destructive en soi) | Séquence additive en 3 temps (§6.3.2), après décision de rattachement (Q-S1) |

**Aucune autre colonne n'est supprimée.** Les 15 autres tables existantes ne perdent
ni ligne ni colonne.

## 9.4 Points non tranchés — résumé

**18 points** (Q-S1 → Q-S18) et **8 réserves de garantie** (R-S1 → R-S8).

Les **quatre prioritaires**, parce qu'ils rendent la migration **inexécutable** ou
ouvrent une escalade :

| Priorité | Point | Pourquoi bloquant ou critique |
| --- | --- | --- |
| **1** | **Q-S2** — rattachement des 2 événements institutionnels | `events.department_id SET NOT NULL` **échouera** sur 2 lignes à `NULL`. D-26 rend le choix obligatoire |
| **2** | **Q-S1** — rattachement des 10 publications | `publications.department_id SET NOT NULL` **échouera** sur 10 lignes |
| **3** | **Q-S6** — qui édite les capacités de département | Vecteur d'escalade de privilèges : un responsable qui écrirait ses propres capacités s'attribuerait la portée événementielle globale (D-25, `029` Q-06) |
| **4** | **Q-S11** — atomicité de l'outbox en isolation de niveau 2 | Une transaction unique et deux instances distinctes ne sont pas simultanément satisfaites sans mécanisme inter-base (`030` §5.1 vs §4.6 Q4) |

Les **quatorze autres** (Q-S3, Q-S4, Q-S5, Q-S7, Q-S8, Q-S8bis, Q-S9, Q-S10, Q-S12,
Q-S13, Q-S14, Q-S15, Q-S16, Q-S17, Q-S18) n'empêchent pas l'exécution du DDL mais
**figent un choix** qui devra être assumé : ils sont révisables par une migration
additive, et chacun est formulé en §8.1 pour être répondu en une phrase.

---

# 10. Index — existants et ajoutés

## 10.1 Index repris (22) — état en place

| # | Index | Table | Requête servie |
| --- | --- | --- | --- |
| 1 | `admin_profiles_username_lower_idx` (UNIQUE, `lower(username)`) | `admin_profiles` | Unicité insensible à la casse : « Admin » et « admin » sont le même compte |
| 2 | `admin_profiles_role_idx` (`role`) | `admin_profiles` | Filtrage de l'annuaire par rôle (`029` §2.1) |
| 3 | `media_uploaded_by_idx` (`uploaded_by`) | `media` | Médias d'un auteur — contrôle de l'origine d'un téléversement |
| 4 | `media_created_at_idx` (`created_at`) | `media` | Registre trié par récence (`029` §2.5 action 5.2) |
| 5 | `department_media_position_idx` (`department_id, position`) | `department_media` | Galerie ordonnée d'un département (`031` §2.8, 6 photos max) |
| 6 | `departments_slug_idx` (UNIQUE, `slug`) | `departments` | Résolution par slug et ancrage (`OrganisationExplorer`) |
| 7 | `departments_position_idx` (`position`) | `departments` | Liste ordonnée du back-office : « dans l'ordre défini par le back-office » |
| 8 | `event_media_position_idx` (`event_id, position`) | `event_media` | Galerie ordonnée d'un événement |
| 9 | `events_slug_idx` (UNIQUE, `slug`) | `events` | Fiche `/vie-de-leglise/evenements/[slug]` |
| 10 | `events_event_date_idx` (`event_date`) | `events` | Liste par date — index principal de l'agenda |
| 11 | `events_department_id_idx` (`department_id`) | `events` | Événements d'un département (`029` §2.4) |
| 12 | `publications_slug_idx` (UNIQUE, `slug`) | `publications` | Fiche publication |
| 13 | `publications_published_at_idx` (`published_at DESC`) | `publications` | Flux courant, plus récentes d'abord |
| 14 | `publications_category_idx` (`category`) | `publications` | Rubriques `ACTUALITE`/`ENSEIGNEMENT`/`MEDIA`/`RESSOURCE` — `getPublicationsByCategory` |
| 15 | `publications_type_idx` (`type`) | `publications` | Filtre `VIDEO`/`PHOTO`/`TEXTE` |
| 16 | `publications_status_idx` (`status`) | `publications` | Non-exposition des brouillons (`029` §2.3 action 3.3) |
| 17 | `community_faces_position_idx` (`position`) | `community_faces` | Ordre éditorial des visages |
| 18 | `leaders_position_idx` (`position`) | `leaders` | Ordre éditorial des responsables |
| 19 | `leaders_department_id_idx` (`department_id`) | `leaders` | Responsables d'un département |
| 20 | `testimonies_position_idx` (`position`) | `testimonies` | Ordre éditorial des témoignages |
| 21 | `schedule_entries_position_idx` (`position`) | `schedule_entries` | Ordre éditorial du rythme hebdomadaire |
| 22 | `scriptures_key_idx` (UNIQUE, `key`) | `scriptures` | Résolution `verseKey` → verset (`031` §1.6 règle 6) |

**Deux index de l'existant ne sont pas repris** — non par choix, mais parce que la
table qu'ils servent est supprimée : `prayer_requests_created_at_idx` et
`prayer_requests_status_idx`. Ils sont remplacés par les index n° 45 et 46 sur
`prayer_private.prayer_request`.

## 10.2 Index ajoutés (29) — chacun avec la requête qu'il sert

| # | Index | Table | Requête servie | Pourquoi c'est nécessaire |
| --- | --- | --- | --- | --- |
| 23 | `static_pages_page_key_idx` (UNIQUE, `page_key`) | `static_pages` | `getPage(pageKey)` | Repris de l'existant, désormais déclaré dans la définition de table |
| 24 | `social_links_position_idx` (`position`) | `social_links` | Ordre éditorial des réseaux sociaux | Repris |
| 25 | `publications_archived_at_idx` (`archived_at DESC`) **partiel** `WHERE status = 'ARCHIVED'` | `publications` | Archive publique (D-20) : « hors du flux courant, mais reste consultable (archive / recherche / URL existante) » | **Index partiel** : le flux courant ne contient pas d'`ARCHIVED`. Sans le prédicat, l'index serait dominé par le flux courant et l'archive serait parcourue séquentiellement |
| 26 | `publications_published_per_department_idx` (`department_id, published_at ASC, id ASC`) **partiel** `WHERE status = 'PUBLISHED'` | `publications` | Application de D-19 : `ORDER BY published_at ASC, id ASC` **restreint au département** pour choisir les publications à archiver | **Index partiel** : c'est **exactement** la requête de la règle des 3 (§4.1.3, étape 3). L'ordre des colonnes suit D-19 mot pour mot (critère principal puis départage) |
| 27 | `publications_max_three_published_per_department` (UNIQUE, `department_id, published_slot`) **partiel** `WHERE status = 'PUBLISHED'` | `publications` | **Contrainte** de la règle des 3 (§4.1.1) | Index **de contrainte**, pas de performance : c'est lui qui rend la borne inviolable |
| 28 | `media_access_media_id_idx` (`media_id`) | `media_access` | « Qui a accès à ce média ? » — action 5.7 (`LIST` les départements autorisés) et 6.1 (`READ` les autorisations) | La FK `ON DELETE CASCADE` **exige** un index sur `media_id` : sans lui, toute suppression de média parcourt la table entière |
| 29 | `media_access_department_unique` (UNIQUE partiel, `media_id, grantee_id` où `DEPARTMENT`) | `media_access` | Contrainte de cardinalité (§4.3) | Index **de contrainte** |
| 30 | `media_access_profile_unique` (UNIQUE partiel, `media_id, grantee_id` où `ADMIN_PROFILE`) | `media_access` | Contrainte de cardinalité (§4.3) | Index **de contrainte** |
| 31 | `media_access_grantee_use_idx` (`grantee_type, grantee_id`) **partiel** `WHERE can_use = true` | `media_access` | **La requête d'autorisation de `USE`** : `029` §2.5 action 5.3 — « `USE` sous `MediaAccess USE` pour son département » | **Index partiel sur le prédicat réellement testé.** D-21 impose que « le système teste **explicitement** la permission demandée ». Le `DEFAULT false` fait que les droits accordés sont une minorité |
| 32 | `media_access_grantee_manage_idx` (`grantee_type, grantee_id`) **partiel** `WHERE can_manage = true` | `media_access` | Action `MANAGE` (5.4) — « `MANAGE` → selon périmètre » | Symétrique : la non-hiérarchie de D-21 **interdit** de déduire `MANAGE` de `USE`, donc `MANAGE` a sa propre requête et son propre index |
| 33 | `media_access_grantee_delete_idx` (`grantee_type, grantee_id`) **partiel** `WHERE can_delete = true` | `media_access` | Action `DELETE` (5.5) — réservée à `ADMIN`/`SUPER_ADMIN` | Symétrique. Ces trois index séparés **matérialisent** l'indépendance des trois droits : un `DELETE` ne peut pas être satisfait par l'index de `MANAGE` |
| 34 | `events_visibility_scope_idx` (`visibility_scope, event_date DESC`) | `events` | Lecture publique conditionnée à la portée (D-25/D-26, action 4.3) : « ce que publie la Presse concerne tout le monde ; ce que publie l'Ecodume reste un événement de l'Ecodume » | La portée devient un **critère de filtrage** (elle ne l'était pas). L'ordre `(scope, date DESC)` sert la requête publique « événements globaux à venir » sans tri |
| 35 | `events_department_date_idx` (`department_id, event_date DESC`) | `events` | Vue par département, triée par date — action 4.4 (back-office) et section « par département » de `/vie-de-leglise/evenements` | Complète `events_department_id_idx` (qui ne porte pas la date) |
| 36 | `department_capabilities_capability_idx` (`capability, department_id`) | `department_capabilities` | **La requête de la capacité** : `SELECT department_id WHERE capability = 'EVENT_SCOPE_GLOBAL'` — sert le trigger `events_visibility_scope_coherence` et la résolution « quels départements ont la portée globale » | La PK `(department_id, capability)` ne sert pas ce sens de lecture : elle indexe par département d'abord |
| 37 | `notifications_recipient_unread_idx` (`recipient_user_id, created_at DESC`) **partiel** `WHERE is_read = false` | `notifications` | Boîte de réception : notifications non lues d'un destinataire, plus récentes d'abord (actions 9.2, 9.3) | **Index partiel** : `is_read = true` est l'état final de toute notification, donc majoritaire à terme |
| 38 | `notifications_type_idx` (`type`) | `notifications` | Filtrage par type — notamment pour vérifier l'absence de notification de prière chez un non-`ADMIN` (contrôle `030` §6.2) | Sert la vérification de non-régression « aucune notification de prière au `SUPER_ADMIN` » |
| 39 | `notification_outbox_pending_idx` (`created_at`) **partiel** `WHERE processed_at IS NULL` | `notification_outbox` | **Le worker de notification** (`030` §5.1 étape 15) : « consomme l'outbox » — il ne lit que les lignes non traitées, en ordre d'arrivée | **Index partiel** : une fois traitées, les lignes sortent de l'index ; la file reste en mémoire quel que soit l'historique accumulé (D-16 interdit de purger) |
| 40 | `audit_log_actor_created_idx` (`actor_user_id, created_at DESC`) | `audit_log` | « Journaux d'audit par acteur » — D-03 (consultation des journaux complets) et `029` §2.17 action 17.1 | Sert la vue par acteur, qui est la vue d'investigation |
| 41 | `audit_log_created_idx` (`created_at DESC`) | `audit_log` | Journal complet, plus récent d'abord — lecture par le `SUPER_ADMIN` (D-03) | Vue par défaut du journal |
| 42 | `audit_log_resource_idx` (`resource_type, resource_id`) | `audit_log` | « Historique par ressource » — `028/Q-API3` est ouverte | La question étant **non tranchée** (Q-S18 / Q-17), l'index est posé : il rend l'ajout de la fonctionnalité **additif** au lieu d'exiger une migration d'index |
| 43 | `prayer_request_created_idx` (`created_at DESC`) | `prayer_request` | **Ordre chronologique des demandes** — `030` §1.4 : « un Admin a besoin d'un ordre chronologique » | **Seul index de tri autorisé.** `030` §7.1 point 3 interdit tout index plein texte ou de recherche construit sur un contenu clair |
| 44 | `prayer_request_status_idx` (`status`) | `prayer_request` | Filtrage `PENDING` / `ARCHIVED` — action 8.4 (`VALIDATE`/`ARCHIVE`) | Reprend la logique de l'index supprimé avec `prayer_requests` |
| 45 | `data_key_envelope_active_request_idx` (`prayer_request_id`) **partiel** `WHERE revoked_at IS NULL` | `data_key_envelope` | **Le contrôle de couverture** (`030` §5.4.1, requête **V8**) | **Index partiel** : « non révoquée » est le prédicat exact du contrôle. Les enveloppes révoquées sont **conservées** (`030` §5.4) et grossissent sans fin : les exclure est indispensable |
| 46 | `data_key_envelope_active_unique` (UNIQUE partiel, `prayer_request_id, recipient_key_ref` où `revoked_at IS NULL`) | `data_key_envelope` | **Idempotence du ré-enveloppement** : `030` §3.6.2 (« le ré-enveloppement est un upsert idempotent »), test **T17** | Index **de contrainte**. Le partiel est nécessaire : la ligne révoquée est conservée **et** une nouvelle ligne active la remplace — un `UNIQUE` global l'interdirait |
| 47 | `data_key_envelope_recipient_idx` (`recipient_key_ref`) | `data_key_envelope` | **Révocation d'une clé** (`030` §5.4 étape 2.2) : « toutes les enveloppes destinées à ces clés : `revoked_at = now()` » | Requête de masse par clé. La FK `RESTRICT` vers `crypto_key` exige également cet index |
| 48 | `crypto_key_active_slot_uidx` (UNIQUE partiel, `owner_user_id, key_slot` où `is_slot_active = true`) | `crypto_key` | **Contrainte de `030` §4.7** : « Nombre de clés actives : au plus **2** par utilisateur (recouvrement nécessaire à la rotation) » | Index **de contrainte**. Deux créneaux au plus (1 et 2) et un seul actif par créneau ⇒ au plus deux clés `ACTIVE` par utilisateur |
| 49 | `crypto_key_status_purpose_idx` (`purpose, status`) | `crypto_key` | **La requête de l'ensemble actif des destinataires** : `030` §5.1 étape 7 et §5.2.2 — « pour chaque clé publique active (chaque `ADMIN` + `RECOVERY`) » | **La** requête chaude du domaine des prières : exécutée à chaque soumission, pour sceller. L'index est minuscule (quelques lignes) |
| 50 | `prayer_audit_event_action_created_idx` (`action, created_at DESC`) | `prayer_audit_event` | **Détection R1/R2** (`030` §4.4.2) : « un événement `KEY_REGISTERED` est écrit dans le registre d'audit des prières » | La détection de substitution de clé passe par la lecture des `KEY_*` récents — c'est la requête d'alerte |
| 51 | `prayer_audit_event_created_idx` (`created_at DESC`) | `prayer_audit_event` | Registre d'audit des prières, plus récent d'abord (lecture par les Admins) | Vue par défaut |

## 10.3 DDL des index

Les index n° 23, 24, 27, **29** et **30** sont déjà posés dans les sections de création
des tables (§3.4, §3.7, §3.8). Ils sont répétés ici, avec `IF NOT EXISTS`, pour que le
bloc soit exécutable d'un seul tenant et idempotent.

```sql
-- ---------------------------------------------------------------------------------
-- Index posés avec la table — rappel pour l'exécution d'un seul tenant
-- ---------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS static_pages_page_key_idx
  ON public.static_pages (page_key);

CREATE INDEX IF NOT EXISTS social_links_position_idx
  ON public.social_links (position);

CREATE UNIQUE INDEX IF NOT EXISTS publications_max_three_published_per_department
  ON public.publications (department_id, published_slot)
  WHERE status = 'PUBLISHED';

CREATE UNIQUE INDEX IF NOT EXISTS media_access_department_unique
  ON public.media_access (media_id, grantee_id)
  WHERE grantee_type = 'DEPARTMENT';

CREATE UNIQUE INDEX IF NOT EXISTS media_access_profile_unique
  ON public.media_access (media_id, grantee_id)
  WHERE grantee_type = 'ADMIN_PROFILE';

-- ---------------------------------------------------------------------------------
-- publications — D-18 / D-19 / D-20
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS publications_archived_at_idx
  ON public.publications (archived_at DESC)
  WHERE status = 'ARCHIVED';

CREATE INDEX IF NOT EXISTS publications_published_per_department_idx
  ON public.publications (department_id, published_at ASC, id ASC)
  WHERE status = 'PUBLISHED';

-- ---------------------------------------------------------------------------------
-- media_access — D-21 / D-22
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS media_access_media_id_idx
  ON public.media_access (media_id);

-- Un index partiel PAR DROIT : la non-hiérarchie de D-21 interdit qu'un droit soit
-- satisfait par l'index d'un autre.
CREATE INDEX IF NOT EXISTS media_access_grantee_use_idx
  ON public.media_access (grantee_type, grantee_id)
  WHERE can_use = true;

CREATE INDEX IF NOT EXISTS media_access_grantee_manage_idx
  ON public.media_access (grantee_type, grantee_id)
  WHERE can_manage = true;

CREATE INDEX IF NOT EXISTS media_access_grantee_delete_idx
  ON public.media_access (grantee_type, grantee_id)
  WHERE can_delete = true;

-- ---------------------------------------------------------------------------------
-- events — D-25 / D-26
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS events_visibility_scope_idx
  ON public.events (visibility_scope, event_date DESC);

CREATE INDEX IF NOT EXISTS events_department_date_idx
  ON public.events (department_id, event_date DESC);

-- ---------------------------------------------------------------------------------
-- department_capabilities — D-25 (sens inverse de la PK, utilisé par le trigger)
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS department_capabilities_capability_idx
  ON public.department_capabilities (capability, department_id);

-- ---------------------------------------------------------------------------------
-- notifications / outbox — D-10, 030 §6.2
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications (recipient_user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS notifications_type_idx
  ON public.notifications (type);

CREATE INDEX IF NOT EXISTS notification_outbox_pending_idx
  ON public.notification_outbox (created_at)
  WHERE processed_at IS NULL;

-- ---------------------------------------------------------------------------------
-- audit_log — D-03, D-10
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS audit_log_actor_created_idx
  ON public.audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_created_idx
  ON public.audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_resource_idx
  ON public.audit_log (resource_type, resource_id);

-- ---------------------------------------------------------------------------------
-- Magasin des prières — AUCUN index de contenu (030 §7.1 point 3)
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS prayer_request_created_idx
  ON prayer_private.prayer_request (created_at DESC);

CREATE INDEX IF NOT EXISTS prayer_request_status_idx
  ON prayer_private.prayer_request (status);

CREATE INDEX IF NOT EXISTS data_key_envelope_active_request_idx
  ON prayer_private.data_key_envelope (prayer_request_id)
  WHERE revoked_at IS NULL;

-- Contrainte d'idempotence du ré-enveloppement (test T17).
CREATE UNIQUE INDEX IF NOT EXISTS data_key_envelope_active_unique
  ON prayer_private.data_key_envelope (prayer_request_id, recipient_key_ref)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS data_key_envelope_recipient_idx
  ON prayer_private.data_key_envelope (recipient_key_ref);

-- Contrainte de 030 §4.7 : au plus deux clés Admin ACTIVE par utilisateur.
CREATE UNIQUE INDEX IF NOT EXISTS crypto_key_active_slot_uidx
  ON prayer_private.crypto_key (owner_user_id, key_slot)
  WHERE is_slot_active = true;

CREATE INDEX IF NOT EXISTS crypto_key_status_purpose_idx
  ON prayer_private.crypto_key (purpose, status);

CREATE INDEX IF NOT EXISTS prayer_audit_event_action_created_idx
  ON prayer_private.prayer_audit_event (action, created_at DESC);

CREATE INDEX IF NOT EXISTS prayer_audit_event_created_idx
  ON prayer_private.prayer_audit_event (created_at DESC);
```

## 10.4 Décisions d'index — trois principes

| Principe | Application |
| --- | --- |
| **Index partiels plutôt qu'index pleins quand le prédicat est structurel** | **14 index partiels** (25, 27, 29, 30, 31, 32, 33, 37, 39, 45, 46, 48, et les deux partiels de contrainte déclarés ci-dessus). Chacun correspond à un état minoritaire ou à un prédicat de requête constant : `PUBLISHED` par opposition au flux complet, `can_use = true` par opposition au `DEFAULT false`, `revoked_at IS NULL` par opposition à l'historique conservé, `processed_at IS NULL` par opposition aux lignes traitées, `is_read = false` par opposition aux lues, `is_slot_active = true` par opposition aux clés retirées |
| **Un index par droit média, jamais un index commun** | D-21 interdit toute hiérarchie : `USE`, `MANAGE` et `DELETE` ont **trois** index partiels distincts (31, 32, 33). Un index unique sur les trois colonnes servirait mal les trois requêtes et suggérerait faussement que les droits vont ensemble |
| **Aucun index sur un contenu de prière** | Aucun index `GIN`, `tsvector` ou trigramme n'existe sur `prayer_request`. `030` §7.1 point 3 : « Tout extrait, préfixe, suffixe, résumé, recherche par mot-clé ou index plein texte construit sur un contenu en clair » est **interdit** — et le contenu étant chiffré, un tel index serait de toute façon inutilisable |
