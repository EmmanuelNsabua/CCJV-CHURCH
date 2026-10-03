# 3.2 — Modélisation dynamique & statique (UML)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC  
**Version :** MVP V1  
**Phase :** 3 — Conception et Architecture  
**Sous-phase :** 3.2 — Modélisation dynamique & statique

---

## 1. Objectif

Cette sous-phase formalise le modèle métier et les interactions principales du système CCJV à travers des modèles UML.

Elle permet de :

- définir les entités métier et leurs relations ;
- formaliser les cardinalités ;
- identifier les règles métier principales ;
- représenter les échanges entre les différents composants ;
- définir les états métier nécessitant un traitement particulier ;
- préparer la conception de l'architecture logicielle et du contrat API.

La modélisation est volontairement adaptée au périmètre **MVP V1** afin d'éviter toute sur-ingénierie.

---

# 2. Modèle statique

## 2.1. Entités métier

Le système V1 repose sur cinq principales entités persistantes :

1. `Admin`
2. `Department`
3. `Event`
4. `Publication`
5. `StaticPage`

Les services externes tels que Supabase Auth, Supabase Storage, YouTube et Facebook ne sont pas considérés comme des entités métier persistantes du système.

---

## 2.2. Admin

L'administrateur représente l'utilisateur autorisé à gérer le contenu du site depuis le back-office.

### Attributs

| Attribut | Type conceptuel | Contraintes |
|---|---|---|
| id | UUID / Integer | Identifiant unique |
| username | String | Obligatoire, unique |
| passwordHash | String | Hash sécurisé |

### Responsabilités

L'Admin peut :

- consulter le dashboard ;
- créer, modifier et supprimer des départements ;
- créer, modifier et supprimer des événements ;
- créer, modifier et supprimer des publications ;
- modifier les pages statiques.

L'authentification est déléguée à **Supabase Auth**. Les informations strictement nécessaires au domaine applicatif sont conservées dans la base de données selon la stratégie d'identification retenue lors de la conception de l'API.

---

# 3. Department

Un département représente une organisation ou une activité interne de l'église.

Exemples :

- Adultes ;
- Enfants ;
- Jeunesse ;
- Chorale ;
- autres départements créés ultérieurement.

Les départements sont **dynamiques** et ne doivent pas être codés en dur dans le frontend.

### Attributs

| Attribut | Type | Contraintes |
|---|---|---|
| id | UUID / Integer | Identifiant unique |
| name | String | Obligatoire |
| slug | String | Obligatoire, unique |
| description | Text | Optionnel |
| responsibleName | String | Optionnel |

### Règles

- Le nom est obligatoire.
- Le slug est généré automatiquement.
- Le slug doit être unique.
- Un département peut ne posséder aucun événement.
- Un département peut être associé à plusieurs événements.

---

# 4. Event

Un événement représente une activité organisée par l'église.

### Attributs

| Attribut | Type | Contraintes |
|---|---|---|
| id | UUID / Integer | Identifiant unique |
| title | String | Obligatoire |
| slug | String | Obligatoire, unique |
| eventDate | Date | Obligatoire |
| eventTime | Time | Selon spécification |
| location | String | Optionnel |
| imageUrl | String | Optionnel |
| departmentId | UUID / Integer | Nullable |

### Relation avec Department

```text
Department 1 ─────────── 0..* Event
```

Un département peut être associé à zéro ou plusieurs événements.

Un événement peut être associé à :

- un département précis ;
- aucun département.

Lorsque `departmentId = null`, l'événement est considéré comme **événement général de l'église**.

---

# 5. État d'un événement

L'état d'un événement n'est pas stocké dans la base de données.

La propriété `isArchived` initialement prévue dans le schéma est supprimée.

L'état est calculé à partir de `eventDate`.

### Règle métier

```text
SI eventDate >= date courante
    ALORS status = UPCOMING

SINON
    status = ARCHIVED
```

### Conséquences

La base de données ne contient pas :

```text
is_archived
```

L'API peut cependant exposer une propriété calculée :

```json
{
  "id": 1,
  "title": "Culte dominical",
  "eventDate": "2026-09-27",
  "status": "UPCOMING"
}
```

ou :

```json
{
  "id": 2,
  "title": "Conférence",
  "eventDate": "2026-09-20",
  "status": "ARCHIVED"
}
```

Cette approche évite les incohérences entre la date réelle d'un événement et un booléen persistant devenu obsolète.

---

# 6. Publication

Une publication représente un contenu média ou éditorial publié par le CCJV.

### Attributs

| Attribut | Type | Contraintes |
|---|---|---|
| id | UUID / Integer | Identifiant unique |
| title | String | Obligatoire |
| type | PublicationType | Obligatoire |
| contentUrl | String | Selon le type |
| publishedAt | DateTime | Obligatoire |

### PublicationType

```text
<<enumeration>> PublicationType

VIDEO
PHOTO
TEXTE
```

### Règles selon le type

#### VIDEO

`contentUrl` contient l'URL d'une plateforme externe telle que YouTube ou Facebook.

Les vidéos ne sont pas hébergées directement par l'infrastructure CCJV en V1.

#### PHOTO

`contentUrl` contient l'URL du fichier stocké dans Supabase Storage.

#### TEXTE

Le modèle actuel devra être précisé lors de la conception du schéma final : une publication textuelle nécessite un contenu éditorial distinct d'une simple URL.

Cette décision sera intégrée au contrat API lors de la sous-phase 3.3.

---

# 7. StaticPage

Une page statique représente le contenu éditable d'une section institutionnelle du site.

### Attributs

| Attribut | Type | Contraintes |
|---|---|---|
| id | UUID / Integer | Identifiant unique |
| pageKey | PageKey | Obligatoire, unique |
| content | Text | Obligatoire |

### PageKey

```text
<<enumeration>> PageKey

ACCUEIL
QUI_SOMMES_NOUS
ORGANISATION
CONTACT
```

Les pages :

- Événements ;
- Publications/Médias

ne sont pas stockées comme contenu statique puisqu'elles sont construites à partir des entités `Event` et `Publication`.

---

# 8. Diagramme de classes global

```text
                    ┌──────────────────────┐
                    │        Admin         │
                    ├──────────────────────┤
                    │ id                   │
                    │ username             │
                    │ passwordHash         │
                    └──────────────────────┘
                              │
                              │ manages
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  Department  │  │    Event     │  │ Publication  │
     └──────┬───────┘  └──────────────┘  └──────────────┘
            │
            │ 1
            │
            │ 0..*
            ▼
         Event


                    ┌─────────────────┐
                    │   StaticPage    │
                    ├─────────────────┤
                    │ id              │
                    │ pageKey         │
                    │ content         │
                    └─────────────────┘
```

La relation métier principale est :

```text
Department 1 ─────────── 0..* Event
```

Les autres entités restent autonomes en V1.

---

# 9. Modèle dynamique

Les diagrammes de séquence suivants décrivent les principaux cas d'utilisation du MVP.

---

## 9.1. Consultation des événements

```text
Visiteur
   │
   │ Consultation page Événements
   ▼
Next.js
   │
   │ GET /api/events
   ▼
Express API
   │
   │ Demande événements
   ▼
EventRepository
   │
   │ SELECT événements
   ▼
PostgreSQL
   │
   │ Données
   ▼
EventRepository
   │
   │ Calcul status
   ▼
Express API
   │
   │ Réponse JSON
   ▼
Next.js
   │
   │ Rendu page
   ▼
Visiteur
```

### Règles

Les événements sont retournés dans l'ordre chronologique prévu par les spécifications.

L'état `UPCOMING` ou `ARCHIVED` est calculé à partir de `eventDate`.

---

# 10. Création d'un événement

```text
Admin
 │
 │ Remplit le formulaire
 ▼
Next.js Back-office
 │
 │ POST /api/events
 │ Authorization: Bearer <token>
 ▼
Express API
 │
 ├── Vérification authentification
 │
 ├── Vérification autorisation Admin
 │
 ├── Validation des données
 │
 ├── Génération du slug
 │
 └── Application des règles métier
 │
 ▼
EventService
 │
 ▼
EventRepository
 │
 ▼
PostgreSQL
 │
 │ INSERT
 ▼
EventRepository
 │
 ▼
Express API
 │
 │ 201 Created
 ▼
Next.js
 │
 ▼
Admin
```

Le frontend ne doit pas être considéré comme une source d'autorité pour les règles métier.

Toute opération sensible doit être contrôlée côté API.

---

# 11. Modification d'un événement

```text
Admin
 │
 │ Modification
 ▼
Next.js
 │
 │ PUT/PATCH /api/events/:id
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 ├── Validation
 ├── Vérification existence
 └── Application règles métier
 │
 ▼
EventService
 │
 ▼
EventRepository
 │
 ▼
PostgreSQL
 │
 │ UPDATE
 ▼
Express
 │
 ▼
Next.js
 │
 ▼
Admin
```

---

# 12. Suppression d'un événement

```text
Admin
 │
 │ Suppression
 ▼
Next.js
 │
 │ DELETE /api/events/:id
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 └── Vérification existence
 │
 ▼
EventService
 │
 ▼
EventRepository
 │
 ▼
PostgreSQL
 │
 │ DELETE
 ▼
Express
 │
 │ 204 No Content
 ▼
Next.js
 │
 ▼
Admin
```

---

# 13. Upload d'une image

Les fichiers ne sont pas enregistrés dans PostgreSQL.

```text
Admin
 │
 │ Sélection image
 ▼
Next.js
 │
 │ Upload
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 ├── Validation extension/MIME
 ├── Validation taille
 └── Préparation du fichier
 │
 ▼
Supabase Storage
 │
 │ Stockage
 ▼
Supabase Storage
 │
 │ URL fichier
 ▼
Express
 │
 ▼
Next.js
 │
 ▼
Admin
```

L'entité métier conserve uniquement la référence vers le fichier :

```text
imageUrl
```

---

# 14. Création d'une publication vidéo

```text
Admin
 │
 │ URL vidéo
 ▼
Next.js
 │
 │ POST /api/publications
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 ├── Validation
 └── Validation URL
 │
 ▼
PublicationService
 │
 ▼
PostgreSQL
 │
 │ INSERT
 ▼
Express
 │
 ▼
Next.js
 │
 ▼
Admin
```

Aucun fichier vidéo n'est transféré vers le serveur CCJV.

---

# 15. Création d'une publication photo

```text
Admin
 │
 │ Sélection photo
 ▼
Next.js
 │
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 └── Validation fichier
 │
 ▼
Supabase Storage
 │
 │ URL
 ▼
Express
 │
 │ Création publication
 ▼
PostgreSQL
 │
 ▼
Express
 │
 ▼
Next.js
 │
 ▼
Admin
```

---

# 16. Création d'une publication texte

```text
Admin
 │
 │ Saisie contenu
 ▼
Next.js
 │
 │ POST /api/publications
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 └── Validation contenu
 │
 ▼
PublicationService
 │
 ▼
PostgreSQL
 │
 ▼
Express
 │
 ▼
Next.js
 │
 ▼
Admin
```

---

# 17. Gestion d'un département

Le département suit le même principe général que les autres ressources administrables.

```text
Admin
 │
 ▼
Next.js Back-office
 │
 │ POST /api/departments
 ▼
Express
 │
 ├── Auth
 ├── Authorization
 ├── Validation
 ├── Génération slug
 └── Règles métier
 │
 ▼
DepartmentService
 │
 ▼
DepartmentRepository
 │
 ▼
PostgreSQL
```

Les départements sont dynamiques : aucune liste fixe ne doit être codée dans le frontend.

---

# 18. Gestion des pages statiques

```text
Admin
 │
 │ Modification contenu
 ▼
Next.js
 │
 │ PUT/PATCH /api/pages/:pageKey
 ▼
Express
 │
 ├── Authentification
 ├── Autorisation
 ├── Validation pageKey
 └── Validation contenu
 │
 ▼
StaticPageService
 │
 ▼
StaticPageRepository
 │
 ▼
PostgreSQL
```

---

# 19. Diagramme d'états — Event

Le cycle de vie fonctionnel d'un événement est volontairement simple.

```text
                     ┌───────────────┐
                     │    UPCOMING   │
                     │               │
                     │ Date future   │
                     └───────┬───────┘
                             │
                             │ eventDate < today
                             ▼
                     ┌───────────────┐
                     │   ARCHIVED    │
                     │               │
                     │ Date passée   │
                     └───────────────┘
```

Il n'existe pas de transition manuelle « Archiver ».

L'état dépend exclusivement de la date de l'événement.

---

# 20. Diagramme d'états — Publication

La V1 ne nécessite pas de workflow complexe de validation.

Le cycle fonctionnel est :

```text
┌──────────────┐
│    DRAFT     │
└──────┬───────┘
       │ publication
       ▼
┌──────────────┐
│  PUBLISHED   │
└──────────────┘
```

Toutefois, si le back-office V1 ne prévoit pas de sauvegarde en brouillon, l'état `DRAFT` peut être supprimé du modèle et une publication créée est directement considérée comme publiée.

La décision finale sera alignée avec le comportement défini dans le CSF et le contrat API.

---

# 21. Règles métier consolidées

## 21.1. Département

- Le nom est obligatoire.
- Le slug est généré automatiquement.
- Le slug est unique.
- Les départements sont dynamiques.
- Un département peut posséder plusieurs événements.

## 21.2. Événement

- Le titre est obligatoire.
- La date est obligatoire.
- Le slug est généré automatiquement.
- Le slug est unique.
- Le département est facultatif.
- Un événement sans département est un événement général.
- L'état est calculé automatiquement à partir de la date.
- Aucun champ `is_archived` n'est persisté.

## 21.3. Publication

- Le titre est obligatoire.
- Le type est obligatoire.
- Les types autorisés sont `VIDEO`, `PHOTO` et `TEXTE`.
- Les vidéos utilisent une plateforme externe.
- Les photos sont stockées dans Supabase Storage.
- Les publications sont affichées chronologiquement.

## 21.4. Page statique

- `pageKey` est unique.
- Le contenu est administrable.
- Les pages dynamiques ne sont pas dupliquées dans `static_pages`.

## 21.5. Administration

- Seul un utilisateur autorisé avec le rôle Admin peut effectuer les opérations CRUD.
- L'authentification est assurée par Supabase Auth.
- L'API vérifie l'autorisation indépendamment du frontend.

---

# 22. Contraintes de performance issues de la modélisation

La modélisation doit rester compatible avec la contrainte principale du projet : **connectivité parfois instable et bande passante limitée**.

Les principes suivants sont donc retenus :

- pagination des collections ;
- limitation de la taille des réponses API ;
- récupération uniquement des données nécessaires ;
- images optimisées ;
- chargement différé des médias ;
- absence d'hébergement vidéo direct ;
- pré-rendu des pages publiques lorsque pertinent ;
- limitation du JavaScript côté client ;
- indexation des champs utilisés pour les tris et recherches ;
- cache lorsque pertinent ;
- éviter les requêtes inutiles côté frontend.

---

# 23. Cohérence avec la base de données

Le modèle confirme les entités suivantes :

```text
admins
departments
events
publications
static_pages
```

Modification validée par rapport au schéma initial :

```text
events.is_archived
```

est **supprimé**.

L'état d'archivage est désormais une propriété calculée.

Le schéma SQL définitif sera ajusté avant implémentation afin de refléter exactement cette décision ainsi que les éventuelles décisions prises durant la sous-phase 3.3.

---

# 24. Conclusion de la modélisation

La modélisation UML du MVP V1 est volontairement simple et centrée sur les besoins métier.

Le système repose sur :

```text
Admin
 │
 ├── Departments
 │       └── Events
 │
 ├── Publications
 │
 └── Static Pages
```

avec :

```text
Next.js
    │
    │ REST / HTTPS
    ▼
Express
    │
    ├── PostgreSQL
    ├── Supabase Auth
    └── Supabase Storage
```

Cette modélisation constitue la base de la **sous-phase 3.3 — Architecture logicielle**.

Aucune implémentation ne doit commencer avant la finalisation de l'architecture, du contrat API et de la roadmap de la Phase 3.