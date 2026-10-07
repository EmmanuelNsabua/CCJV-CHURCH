# 028 — Décisions arbitrées — référence d'implémentation

> **Statut :** décisions du commanditaire, arrêtées après lecture intégrale de
> `docs/020` à `docs/025`. Elles **prévalent** sur les documents de conception
> lorsqu'ils divergent (`docs/025` §2, règle de priorité).
> **Règle :** aucune de ces décisions n'est modifiable silencieusement. Toute
> évolution relève de la Phase 6 (`docs/025` §20).

---

# 1. Identité, rôles et scopes

## D-01 — Trois rôles techniques

```text
SUPER_ADMIN
ADMIN
DEPARTMENT_MANAGER
```

« Responsable Presse » et « Responsable Ecodume » ne sont **pas** des rôles
distincts : ce sont **deux instances du même rôle**, différenciées par leur
département rattaché. Le RBAC ne code **jamais** `PRESSE` ou `ECODUME` comme rôle.

## D-02 — Rattachement départemental unique

Un `DEPARTMENT_MANAGER` est rattaché à **un seul** département :
`DEPARTMENT_MANAGER + department_id`. Il ne peut pas administrer plusieurs
départements avec le même rattachement.

## D-03 — Pouvoirs du `SUPER_ADMIN`

Gestion des utilisateurs et de leurs rôles · création, modification, désactivation
et révocation des comptes `ADMIN` et `DEPARTMENT_MANAGER` · gestion des rôles et
scopes · configuration système · gestion des départements · paramètres techniques
et administratifs · consultation des journaux d'audit complets · administration
globale de la plateforme.

**Exception absolue : il ne peut pas lire les demandes de prière.** Cette exclusion
est garantie **cryptographiquement**, pas seulement par une policy.

## D-04 — Pouvoirs de l'`ADMIN`

Administrateur opérationnel du contenu : pages, départements, publications,
événements, médias, et **création des comptes de responsables**.
Il **ne peut pas** administrer un `SUPER_ADMIN`.

## D-05 — Compte existant en production

Le compte administrateur déjà créé devient **`ADMIN`**. Le `SUPER_ADMIN` sera un
compte **distinct**.

## D-06 — Publication directe par le responsable

Un `DEPARTMENT_MANAGER` publie **directement** dans son département, **sans
validation préalable** de l'`ADMIN`. L'`ADMIN` conserve ensuite ses pouvoirs
d'intervention : modification, archivage, suppression.

---

# 2. Départements

## D-07 — Périmètre retenu

```text
Presse
Ecodume
Affaires Sociales
```

**Distinction :** seuls **Presse** et **Ecodume** disposent d'un **espace
back-office spécialisé**. `Affaires Sociales` existe comme département métier —
`HouseGroup` en relève — mais **sans espace de gestion dédié** à ce stade.

Aucun autre département n'est figé sans décision métier explicite.

## D-08 — Données historiques : conservation, pas suppression

`Adultes`, `Enfants/Ecodim` et `Chorale` — auxquels sont rattachés **7 événements
et 10 publications** — **ne doivent pas être supprimés brutalement**.

La migration doit prévoir une **stratégie de conservation et de rattachement**
avant toute suppression éventuelle. Aucun événement ni publication ne doit
disparaître du fait du changement de modèle.

## D-09 — Renommage `Ecodim` → `Ecodume` : complet

Renommage **métier réel**, pas un changement de libellé d'affichage. Doivent
converger vers **Ecodume** : données persistées · identifiant métier · slug ·
frontend · back-office · documentation · références applicatives.

Les anciennes occurrences sont **migrées** ; on ne maintient pas deux
terminologies concurrentes.

**Le département reste une entité/donnée, jamais un rôle codé en dur.**

---

# 3. Demandes de prière — spécification de sécurité

> Ces décisions constituent une **spécification de sécurité**, pas des choix de
> confort. `docs/025` §Lot 8 exige une mini-spécification validée avant tout code
> cryptographique.

## D-10 — Le `SUPER_ADMIN` ne voit **rien**

Ni contenu · ni nom · ni nombre de demandes · ni dates permettant d'en déduire
l'activité · ni notifications · ni métadonnées sensibles.

**Pour lui, le domaine `PrayerRequest` est fonctionnellement inexistant.**
L'`ADMIN` est **le seul** rôle à disposer de cette visibilité.

## D-11 — Chiffrement en enveloppe, clé par Admin

```text
PrayerRequest
      ↓
clé de données aléatoire
      ↓
chiffrement du contenu
      ↓
clé de données enveloppée pour chaque Admin autorisé
```

**Pas de clé maître unique accessible au backend.** Conséquence : retirer un Admin
ne demande pas de rechiffrer tout l'historique.

## D-12 — Récupération contrôlée, hors `SUPER_ADMIN`

Les demandes ne doivent **pas** devenir illisibles à la première perte de tous les
accès Admin. Un mécanisme de secours **séparé des comptes utilisateurs ordinaires**,
avec procédure contrôlée et **auditée**, est prévu.

**Ce mécanisme n'est PAS détenu par le `SUPER_ADMIN`** — cela recréerait
exactement le pouvoir de lecture qu'on lui interdit. Sa détention exacte doit être
formalisée dans la spécification cryptographique **avant implémentation**.

## D-13 — Rotation sur événement, jamais périodique arbitraire

Déclencheurs : compromission suspectée · changement majeur de politique · perte
d'une clé · remplacement d'un mécanisme cryptographique · révocation nécessitant
une nouvelle génération.

Les anciennes demandes restent déchiffrables via leur matériel cryptographique
d'origine tant que les Admins autorisés doivent les consulter.

## D-14 — Révocation sans perte d'historique

1. accès futur immédiatement révoqué · 2. clés d'accès révoquées · 3. demandes
existantes **toujours accessibles** aux Admins encore autorisés · 4. si nécessaire,
clés de données **ré-enveloppées** pour les Admins restants.

Le départ d'un Admin ne provoque **jamais** la perte de l'historique.

## D-15 — Le nom est chiffré

Le nom est une donnée personnelle associée à une demande privée : **même niveau de
protection que le message**. Si `is_anonymous = true`, aucun nom n'est stocké.

## D-16 — Conservation indéfinie

Aucune purge automatique. **Aucune durée arbitraire n'est inventée.** Une politique
de rétention pourra être ajoutée en Phase 6.

## D-17 — `requester_contact` supprimé définitivement

Le contact est exclu du modèle. Il ne doit survivre **nulle part** : schéma · DTO ·
API · migrations finales · réponses · données métier actives.

Les données éventuellement déjà collectées sont traitées en migration de manière à
**ne pas être réintroduites**, avec **purge explicite et vérifiée** si elles existent
réellement en production.

---

# 4. Publications

## D-18 — Archivage manuel autorisé

Deux mécanismes distincts :

| Mécanisme | Déclencheur |
| --- | --- |
| **Automatique** | Règle des trois publications |
| **Manuel** | Action volontaire de l'`ADMIN` ou du responsable du département |

`PUBLISHED → ARCHIVED` est **irréversible** : une publication archivée ne redevient
pas automatiquement `PUBLISHED`.

**Formulation retenue :** *maximum 3 `PUBLISHED` par département, mais
potentiellement moins.* La règle des trois est une **garantie maximale**, pas une
obligation de maintenir trois publications visibles.

→ Lève la contradiction C2-2 (`022 L272` contre `023 L528` / `024 L831`).

## D-19 — Départage déterministe de la récence

```sql
ORDER BY published_at ASC, id ASC
```

`published_at` est le critère principal, `id` le second en cas d'égalité stricte.

**`created_at` est écarté** : une publication créée comme brouillon longtemps avant
sa parution ne doit pas être considérée comme plus ancienne qu'une publication
parue avant elle.

## D-20 — Les archives restent publiques

```text
PUBLISHED → apparaît dans les publications courantes
ARCHIVED  → hors du flux courant, mais reste consultable
            (archive / recherche / URL existante)
```

`ARCHIVED` est un **état métier persistant**, pas une suppression. La présentation
exacte de l'archive reste à définir dans le contrat frontend/API.

---

# 5. Médias

## D-21 — Trois permissions indépendantes

```text
USE   MANAGE   DELETE
```

**Pas de hiérarchie** `DELETE ⊃ MANAGE ⊃ USE` : ces capacités ont des finalités
différentes. Le système d'autorisation teste **explicitement** la permission
demandée.

```text
Responsable Presse :  USE → oui   ·  MANAGE → selon périmètre  ·  DELETE → non
ADMIN             :  USE → oui   ·  MANAGE → oui               ·  DELETE → oui
```

Règle métier sous-jacente : **utiliser ≠ modifier ≠ supprimer**.
→ Lève l'incohérence interne de `023` (`§12 L574-580` contre `§12 L583`).

## D-22 — Aucun partage par défaut

Un média téléversé par la Presse appartient à la **bibliothèque centrale** et n'est
**pas** automatiquement utilisable par l'Ecodume.

```text
Upload Presse → Media global → MediaAccess → Presse autorisé
Ecodume       → accès uniquement si explicitement autorisé
```

L'`ADMIN` ou le `SUPER_ADMIN` accorde l'autorisation.
**Un responsable départemental ne peut pas se l'accorder lui-même.**

---

# 6. Pages éditoriales

## D-23 — Contrat de contenu par template, jamais de page builder

```text
Template
   ↓
Sections autorisées
   ↓
Champs éditables autorisés
```

`Page.content` peut être **flexible à l'intérieur d'un contrat de template**, jamais
arbitraire. Les champs exacts seront **dérivés du frontend actuel et de ses
templates**, puis inscrits dans les schémas Zod.

| Page | Éditable | Non éditable |
| --- | --- | --- |
| **Accueil** | textes éditoriaux, versets, images, CTA, contenus dynamiques prévus | structure, ordre des sections, layout |
| **Qui sommes-nous** | textes historiques et identitaires, images, versets, contenus de présentation | composition narrative, grille, animations |
| **Événements** | introduction éditoriale, éléments de présentation, contenus d'événements | structure de page et composants |
| **Où nous trouver** | textes d'accueil, horaires, informations pratiques, images, CTA | structure et design |
| **Faire un don** | textes de conviction, visuels, informations de don, CTA | composition et parcours visuel |
| **Communauté** | textes, images, contenus communautaires prévus | structure et layout |
| **Organisation** | présentation de l'organisation, textes, visuels | structure organisationnelle de la page |
| **[Département]** | nom et informations éditoriales du département, textes, images, médias, contenus autorisés | template, layout, structure |

---

# 7. Entités éditoriales

## D-24 — Nature métier avant type frontend

### Persistantes

| Entité | Nature |
| --- | --- |
| `Leader` | donnée éditoriale structurée liée à l'organisation |
| `Testimony` | contenu éditorial persistant — **statut/modération à définir avant exposition publique** |
| `CommunityFace` | contenu éditorial persistant |

### Conservées

| Élément | Nature |
| --- | --- |
| `Verse` | contenu éditorial / ressource biblique |
| `ScheduleEntry` | donnée de programmation et d'horaires |
| `SocialLink` | configuration éditoriale |
| `SiteSettings` | configuration globale |

⚠️ **Conserver ne signifie pas créer une table par type.** Le principe :

```text
Type frontend → Existe-t-il une responsabilité métier ? → Oui → modèle approprié
```

`SiteSettings` peut rester une configuration structurée ; `SocialLink` une
collection structurée de paramètres. La modélisation SQL exacte relève du schéma
final. **On ne crée pas une table uniquement parce qu'un type TypeScript existe.**

---

# 8. Événements

## D-25 — Portée portée par le Département, jamais codée en dur

**Interdit :**

```ts
if (department.code === "PRESSE") { /* … */ }
```

**Retenu :** une **capacité/politique du département**.

```text
Department
 ├── id
 ├── name
 ├── slug
 └── capabilities / policies   ← « capacité événementielle globale »
```

Ainsi un autre département pourrait recevoir la même capacité **sans modifier le
code métier**.

## D-26 — Rattachement obligatoire + portée distincte

`Event.department_id` reste **obligatoire**. Un événement global au sens d'un
`department_id = NULL` **n'existe pas** : on ne perd jamais l'information du
responsable.

Le département responsable et la portée publique sont **deux notions distinctes** :

```text
Event
 ├── department_id     = PRESSE      (qui en est responsable)
 └── visibility_scope  = GLOBAL      (qui est concerné)
```

> La Presse est responsable de l'événement, mais l'événement concerne toute
> l'église.

La portée est **dérivée de la capacité du département** (D-25) : ce que publie la
Presse concerne tout le monde ; ce que publie l'Ecodume reste un événement de
l'Ecodume.

---

# 9. Synthèse

| # | Décision | Réf. |
| --- | --- | --- |
| D-01 | Trois rôles techniques ; Presse/Ecodume = instances de `DEPARTMENT_MANAGER` | Q-A1, incohérence des 4 rôles |
| D-02 | Un seul département par responsable | Q-A1 |
| D-03 | Pouvoirs système du `SUPER_ADMIN`, **sauf prayers** | Q-A2, conflit C-1 |
| D-04 | L'`ADMIN` crée les responsables | Q-A2, conflit C-2 |
| D-05 | Compte existant → `ADMIN` | Q-A3 |
| D-06 | Publication directe sans validation | Q-A5 |
| D-07 | Presse, Ecodume, Affaires Sociales | Q-B1 |
| D-08 | Données historiques conservées et migrées | Q-B2 |
| D-09 | Renommage complet `Ecodim` → `Ecodume` | Q-C1 |
| D-10 | `SUPER_ADMIN` : aucune visibilité sur les prières | Q-PR1 |
| D-11 | Chiffrement en enveloppe, clé par Admin | Q-PR2 |
| D-12 | Récupération contrôlée, hors `SUPER_ADMIN` | Q-PR3 |
| D-13 | Rotation sur événement de sécurité | Q-PR4 |
| D-14 | Révocation sans perte d'historique | Q-PR5 |
| D-15 | Nom chiffré · `is_anonymous` | Q-PR6 |
| D-16 | Conservation indéfinie | Q-PR7 |
| D-17 | `requester_contact` supprimé définitivement | Q-PR8 |
| D-18 | Archivage manuel autorisé · max 3, possiblement moins | Q-P1 |
| D-19 | `published_at ASC, id ASC` | Q-P2 |
| D-20 | Archives publiquement accessibles | Q-P5 |
| D-21 | `USE`/`MANAGE`/`DELETE` indépendants | Q-M1 |
| D-22 | Aucun partage média par défaut | Q-M2 |
| D-23 | Contrats éditoriaux par template | Q-PG1 |
| D-24 | Nature métier avant type frontend | Q-I1, Q-I2 |
| D-25 | Capacité du département, jamais `if PRESSE` | Q-EV1 |
| D-26 | `department_id` obligatoire + `visibility_scope` distinct | D-4, Q-EV1 |

---

# 10. Questions encore ouvertes

Non bloquantes pour le Lot 1, mais à trancher avant leur lot respectif :

| # | Question | Lot |
| --- | --- | --- |
| **Q-A4** | Un `ADMIN` peut-il désactiver un autre `ADMIN` ? | 1 |
| **Q-B3** | Un département peut-il être désactivé sans être supprimé ? | 2 |
| **Q-EV2** | Un Responsable Presse peut-il créer un événement pour un autre département ? | 6 |
| **Q-EV3** | Les événements ont-ils un état brouillon/publié, ou sont-ils publiés à la création ? | 6 |
| **Q-P3** | La règle des 3 s'applique-t-elle par département, ou par département + type ? | 4 |
| **Q-P4** | Un responsable peut-il **lire** les publications d'un autre département dans le back-office ? | 4 |
| **Q-M3** | Qui peut supprimer un média : auteur, département, ou `ADMIN` seul ? | 5 |
| **Q-M4** | Types MIME et taille maximale acceptés ? *(code actuel : JPEG/PNG/WebP/AVIF, 5 Mo)* | 5 |
| **Q-M5** | Médias orphelins : suppression automatique ou conservation ? | 5 |
| **Q-PG2** | Les versets sont-ils éditables par le back-office ? | 3 |
| **Q-API1** | Confirmer la conservation de l'enveloppe `{data, meta}` et des 24 codes d'erreur déjà implémentés (363 tests) | 10 |
| **Q-API2** | Suppression définitive ou réversible (soft delete) ? | 10 |
| **Q-API3** | Historique/audit par ressource dès le MVP, ou plus tard ? | 10 |
| **Q-PR9** | Statut/modération des `Testimony` avant exposition publique (soulevé par D-24) | 9 |

---

# 11. Prochaine étape : spécifications formelles avant GEL

Les arbitrages doivent être transformés en **spécifications formelles** :

1. **Spécification cryptographique des prières** — algorithme, format de
   l'enveloppe, détention du mécanisme de secours (D-12), procédure de rotation
   (D-13) et de révocation (D-14). **Préalable obligatoire au Lot 8.**
2. **Matrice RBAC complète** — `Role × Scope × Resource × Action`, incluant D-01 à
   D-06, D-21 et D-22.
3. **Schéma des pages par template** — dérivé du frontend réel, puis inscrit en
   schémas Zod (D-23).
4. **Schéma SQL final** — 3 rôles, `department_id` obligatoire sur les événements,
   `visibility_scope`, `MediaAccess` à trois droits, entités éditoriales selon D-24,
   avec **stratégie de conservation des données historiques** (D-08).
5. **Plan de migration des données** — renommage `Ecodume` (D-09), rattachement des
   7 événements et 10 publications (D-08), purge de `requester_contact` (D-17),
   migration de l'enum des rôles (D-05).

Ces cinq documents constituent la condition de passage en Phase 4 (`docs/025` §22).
