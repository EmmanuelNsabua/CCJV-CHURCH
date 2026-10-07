# CCJV — Architecture logicielle du backend

**Projet :** Centre Chrétien Jésus ma Vie (CCJV)  
**Phase :** Phase 3 — COMMENT  
**Sous-phase :** 3.3 — Architecture logicielle  
**Statut :** Conception — pré-GEL

---

# 1. Objectif

Ce document transforme le modèle métier et les modélisations UML précédentes en une architecture logicielle exploitable pour le backend CCJV.

L’objectif est de définir :

- les couches de l'application ;
- les responsabilités de chaque couche ;
- les modules métier ;
- les règles de dépendance ;
- le modèle d'autorisation ;
- la gestion des médias ;
- la protection des demandes de prière ;
- les transactions et la concurrence ;
- le contrat API ;
- les patterns structurants ;
- les frontières avec Supabase Auth et Storage.

Le code d'implémentation n'est pas produit dans ce document.

---

# 2. Architecture cible

L'architecture retenue est une architecture backend en couches, organisée autour du domaine métier.

```text
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS / FRONTENDS                   │
│              Site public + Back-office                  │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / REST
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API / PRESENTATION                    │
│ Controllers • Routes • DTO • Validation • HTTP Errors  │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION / MÉTIER                  │
│ Use Cases • Services • Policies • Transactions         │
└───────────────┬──────────────────────┬──────────────────┘
                │                      │
                ▼                      ▼
┌────────────────────────┐   ┌────────────────────────────┐
│       DOMAIN           │   │    INFRASTRUCTURE          │
│ Entités • Value Objects│   │ PostgreSQL • Storage        │
│ Règles métier • Ports  │   │ Supabase Auth • Crypto      │
└────────────┬───────────┘   └─────────────┬──────────────┘
             │                             │
             └──────────────┬──────────────┘
                            ▼
                    PostgreSQL / Storage
```

Le principe est :

> **La logique métier ne dépend pas de l'interface HTTP ni directement des fournisseurs d'infrastructure.**

---

# 3. Stack technique

La stack de référence est :

| Domaine | Technologie |
|---|---|
| Langage | TypeScript |
| Runtime | Node.js |
| Framework HTTP | Express |
| Base de données | PostgreSQL |
| ORM / accès DB | Drizzle ORM |
| Authentification | Supabase Auth |
| Stockage fichiers | Supabase Storage |
| Validation | Zod |
| API | REST `/api/v1` |
| Documentation API | OpenAPI / Swagger |
| Hébergement backend | Railway |
| Frontend public | Next.js / Vercel |
| DNS | Namecheap |

Le choix est cohérent avec le socle déjà retenu pour le projet : TypeScript/Express côté backend, PostgreSQL/Supabase pour les données et Supabase Auth/Storage pour les services associés.

---

# 4. Principes architecturaux

## 4.1. Backend comme autorité

Le backend est la source d'autorité pour :

- authentification ;
- autorisation ;
- règles métier ;
- validation ;
- états ;
- relations ;
- transitions ;
- accès aux médias ;
- confidentialité.

Le frontend ne doit jamais être considéré comme une frontière de sécurité.

---

## 4.2. API-first

Le backend expose une API REST versionnée :

```text
/api/v1
```

Le contrat est documenté avec OpenAPI.

Le site public et le back-office consomment cette API.

---

## 4.3. Pas d'accès direct frontend → base de données

Le frontend ne communique pas directement avec PostgreSQL.

Le flux est :

```text
Frontend
   ↓
API
   ↓
Application / Domain
   ↓
Repository
   ↓
PostgreSQL
```

Le frontend ne reçoit jamais les credentials privilégiés de la base ou de Supabase.

---

## 4.4. Pas de logique métier dans les controllers

Un controller :

- reçoit une requête ;
- récupère l'identité ;
- valide les données d'entrée ;
- appelle un use case ;
- transforme le résultat en réponse HTTP.

Il ne décide pas :

- qui peut modifier une publication ;
- quelle publication archiver ;
- si un média est utilisable ;
- si une prière peut être déchiffrée.

Ces règles appartiennent aux couches métier/politiques.

---

# 5. Organisation du code

Structure cible proposée :

```text
src/
├── app/
│   ├── routes/
│   ├── middleware/
│   ├── errors/
│   └── http/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── departments/
│   ├── publications/
│   ├── events/
│   ├── media/
│   ├── pages/
│   ├── prayers/
│   ├── notifications/
│   └── settings/
│
├── shared/
│   ├── authorization/
│   ├── validation/
│   ├── crypto/
│   ├── database/
│   ├── storage/
│   ├── logging/
│   └── utils/
│
└── config/
```

Chaque module métier suit autant que possible la même structure :

```text
module/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── policies/
│   └── repositories/
│
├── application/
│   ├── use-cases/
│   └── dto/
│
├── infrastructure/
│   ├── repositories/
│   └── adapters/
│
└── presentation/
    ├── controllers/
    ├── routes/
    └── schemas/
```

---

# 6. Modules métier

## 6.1. Auth

Responsabilités :

- vérification du token ;
- identification de l'utilisateur ;
- intégration avec Supabase Auth ;
- établissement du contexte d'authentification.

Le module Auth ne décide pas seul des permissions métier.

---

## 6.2. Users

Responsabilités :

- profils administratifs ;
- création des comptes responsables ;
- association rôle/scope/département ;
- activation/désactivation.

---

## 6.3. Departments

Responsabilités :

- gestion des départements ;
- identité ;
- slug ;
- informations départementales ;
- association des responsables.

---

## 6.4. Publications

Responsabilités :

- création ;
- modification ;
- suppression ;
- publication ;
- archivage ;
- règle des trois publications ;
- association aux médias ;
- rattachement obligatoire à un département.

---

## 6.5. Events

Responsabilités :

- création ;
- modification ;
- suppression ;
- dates ;
- localisation ;
- rattachement départemental si applicable.

---

## 6.6. Media

Responsabilités :

- bibliothèque centrale ;
- métadonnées ;
- Supabase Storage ;
- accès aux médias ;
- `MediaAccess` ;
- upload ;
- suppression ;
- gestion des ressources orphelines.

---

## 6.7. Pages

Responsabilités :

- pages éditoriales structurées ;
- validation du contenu JSON ;
- respect des templates ;
- exposition des contenus au frontend.

Le module Pages ne doit jamais permettre de modifier arbitrairement le layout.

---

## 6.8. Prayers

Responsabilités :

- réception publique ;
- validation ;
- chiffrement ;
- déchiffrement autorisé ;
- archivage ;
- confidentialité.

Ce module constitue une frontière de sécurité particulière.

---

## 6.9. Notifications

Responsabilités :

- création ;
- ciblage ;
- lecture ;
- marquage comme lu.

Pour les prières, la notification ne contient pas le contenu sensible.

---

# 7. Architecture d'autorisation

Le système applique :

```text
Role
+
Scope
+
Resource
+
Action
+
Context
```

La décision conceptuelle est :

```text
can(user, action, resource)
```

Exemple :

```text
can(
    ResponsablePresse,
    UPDATE,
    PublicationEcodume
)
→ false
```

---

# 8. Authorization Policy

L'autorisation doit être centralisée dans une couche de policies/services.

Exemples :

```text
PublicationPolicy
MediaPolicy
EventPolicy
DepartmentPolicy
PagePolicy
PrayerPolicy
UserPolicy
```

Une policy répond à une question d'autorisation.

Exemple conceptuel :

```text
PublicationPolicy.canUpdate(user, publication)
```

Elle vérifie notamment :

```text
SUPER_ADMIN
    → autorisé selon la politique globale

ADMIN
    → autorisé sur les contenus administrables

DEPARTMENT_MANAGER
    → publication.department_id
      == user.department_id
```

---

# 9. Exception PrayerRequest

`PrayerRequest` possède une politique spécifique.

```text
SUPER_ADMIN → DENY
ADMIN       → ALLOW
MANAGER     → DENY
PUBLIC      → CREATE ONLY
```

La politique est appliquée avant l'accès aux données sensibles.

```text
Request
 ↓
Auth
 ↓
PrayerPolicy
 ↓
DENY / ALLOW
 ↓
Repository
 ↓
CryptoService
```

Le déchiffrement n'est donc jamais une opération disponible simplement parce que l'utilisateur possède un rôle administratif élevé.

---

# 10. Chiffrement des demandes de prière

La conception impose une séparation entre :

```text
Données chiffrées
        +
Clés
        +
Autorisation de déchiffrement
```

Le module `CryptoService` expose conceptuellement :

```text
encrypt()
decryptForAdmin()
```

mais ne doit pas exposer un mécanisme permettant à un Super Admin de contourner `PrayerPolicy`.

## Exigence

Le système doit permettre :

```text
Admin autorisé
    → contenu lisible

Super Admin
    → contenu non lisible
```

Un simple chiffrement avec une clé stockée dans les variables d'environnement du backend serait insuffisant : un administrateur système disposant de cette clé pourrait techniquement déchiffrer les demandes.

La conception cryptographique détaillée doit donc préserver la séparation entre :

- infrastructure ;
- privilège système ;
- clé de déchiffrement ;
- utilisateur Admin autorisé.

Le choix concret du protocole et de la gestion multi-Admin doit être arrêté avant implémentation.

---

# 11. Gestion des médias

Le module Media sépare :

```text
Media
MediaAccess
StorageObject
```

Conceptuellement :

```text
Media
 ├── metadata
 └── storageKey

MediaAccess
 ├── mediaId
 ├── departmentId
 └── permission
```

Le fichier physique est dans Supabase Storage.

La base contient les métadonnées et les relations d'autorisation.

---

# 12. Upload média

Flux cible :

```text
Frontend
   ↓
API
   ↓
Authorization
   ↓
MediaService
   ↓
Storage
   ↓
Database
```

L'API doit éviter de considérer l'URL publique du fichier comme l'autorité d'accès.

Le backend reste responsable des droits.

---

# 13. Publication et médias

Avant de créer ou publier une publication :

```text
Publication.department
        ↓
MediaAccessService
        ↓
MediaAccess.USE
        ↓
autorisé ?
```

Si un média n'est pas autorisé :

```text
→ opération refusée
```

Cette vérification est effectuée côté backend même si le back-office ne propose normalement pas le média interdit.

---

# 14. Transaction de publication

La publication d'une quatrième publication constitue une transaction métier.

Pseudo-flux :

```text
BEGIN

1. vérifier l'autorisation
2. verrouiller/charger les publications publiées du département
3. créer/mettre à jour la nouvelle publication
4. identifier la plus ancienne
5. archiver la plus ancienne
6. COMMIT
```

En cas d'erreur :

```text
ROLLBACK
```

Aucun état intermédiaire ne doit être présenté comme réussi.

---

# 15. Pattern Repository

Les services métier ne doivent pas dépendre directement de Drizzle.

Exemple conceptuel :

```text
PublicationService
       ↓
PublicationRepository
       ↓
Drizzle
       ↓
PostgreSQL
```

Le domaine/application dépend d'une abstraction :

```text
PublicationRepository
```

L'implémentation PostgreSQL/Drizzle se trouve dans l'infrastructure.

Cela permet :

- séparation des responsabilités ;
- testabilité ;
- évolution de l'accès aux données ;
- réduction du couplage.

---

# 16. Pattern Service / Use Case

Les opérations métier complexes sont représentées par des use cases.

Exemples :

```text
CreatePublication
PublishPublication
ArchivePublication
CreateDepartmentManager
GrantMediaAccess
SubmitPrayerRequest
ReadPrayerRequest
ArchivePrayerRequest
```

Le service/use case orchestre :

```text
Validation métier
+
Authorization
+
Repositories
+
Transactions
+
Services externes
```

---

# 17. Pattern Strategy

Le pattern Strategy est pertinent lorsque plusieurs politiques peuvent varier sans modifier le service principal.

Exemples potentiels :

```text
MediaAccessStrategy
EncryptionStrategy
PublicationArchivalStrategy
```

Cependant, un pattern ne doit pas être introduit uniquement pour suivre une liste de Design Patterns.

Il ne sera utilisé que lorsqu'une variation réelle de comportement le justifie.

---

# 18. Dependency Injection

Les services reçoivent leurs dépendances :

```text
PublicationService(
    publicationRepository,
    mediaAccessService,
    transactionManager
)
```

et non :

```text
PublicationService()
    → crée lui-même ses repositories
```

Objectifs :

- testabilité ;
- faible couplage ;
- remplacement d'adapters ;
- architecture explicite.

---

# 19. Gestion des erreurs

L'API doit distinguer au minimum :

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Exemples :

### 401

Token absent/invalide.

### 403

Utilisateur authentifié mais non autorisé.

### 404

Ressource inexistante.

### 409

Conflit métier ou concurrence.

### 422

Données valides syntaxiquement mais invalides selon les règles métier.

### 429

Trop de demandes, particulièrement important pour la soumission publique de prières.

---

# 20. Validation Zod

Les entrées API sont validées avant d'entrer dans les use cases.

```text
HTTP Request
   ↓
Zod Schema
   ↓
DTO
   ↓
Use Case
```

Zod ne remplace pas les règles métier.

Exemple :

```text
Zod
→ departmentId est un UUID valide

Domain
→ ce département existe et le responsable est autorisé à l'utiliser
```

---

# 21. Contrat REST

Préfixe :

```text
/api/v1
```

Ressources principales proposées :

```text
/auth
/users
/departments
/publications
/events
/media
/pages
/prayer-requests
/notifications
/settings
```

Exemples :

```http
GET    /api/v1/departments
GET    /api/v1/departments/:slug

GET    /api/v1/publications
POST   /api/v1/publications
GET    /api/v1/publications/:id
PATCH  /api/v1/publications/:id
DELETE /api/v1/publications/:id

POST   /api/v1/publications/:id/publish
POST   /api/v1/publications/:id/archive

GET    /api/v1/events
POST   /api/v1/events
PATCH  /api/v1/events/:id
DELETE /api/v1/events/:id

GET    /api/v1/media
POST   /api/v1/media
PATCH  /api/v1/media/:id
DELETE /api/v1/media/:id

GET    /api/v1/pages/:key

POST   /api/v1/prayer-requests
GET    /api/v1/prayer-requests/:id
POST   /api/v1/prayer-requests/:id/archive

GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
```

Cette liste constitue une base de contrat et doit être formalisée dans OpenAPI avant le GEL.

---

# 22. API publique des demandes de prière

La soumission est une opération publique contrôlée :

```http
POST /api/v1/prayer-requests
```

Elle doit appliquer :

- validation Zod ;
- rate limiting ;
- anti-abus ;
- taille maximale ;
- protection contre l'injection ;
- chiffrement ;
- réponse minimale.

La réponse publique ne doit jamais retourner la demande chiffrée ni des détails internes.

---

# 23. API privée des demandes de prière

Les opérations de lecture sont réservées aux Admins.

```http
GET /api/v1/prayer-requests/:id
```

Avant tout accès :

```text
authenticate
    ↓
PrayerPolicy
    ↓
Admin ?
    ↓
decrypt
```

Le Super Admin reçoit `403`.

---

# 24. Pages éditoriales structurées

L'API Pages doit respecter le principe :

```text
Code = structure
DB = contenu
```

Le backend valide le contenu contre un schéma associé au template.

Exemple conceptuel :

```text
Page
 ├── key = QUI_SOMMES_NOUS
 ├── template = QUI_SOMMES_NOUS
 └── content
       ├── hero
       ├── introduction
       ├── history
       └── ...
```

Le backend ne fournit pas de mécanisme permettant au back-office de créer une nouvelle section arbitraire.

---

# 25. Frontend public vs Back-office

Les deux clients consomment le backend, mais avec des politiques différentes.

```text
                 Backend API
                /            \
               /              \
      Site public          Back-office
          │                     │
    lecture publique      opérations privées
    + prayer submit       + administration
```

Le site public n'obtient jamais les opérations d'administration simplement parce qu'une route existe.

---

# 26. Caching

Le cache doit être appliqué uniquement aux données dont la fraîcheur le permet.

Candidats :

- pages éditoriales ;
- départements publics ;
- publications publiées ;
- événements publics ;
- settings publics.

À ne pas mettre en cache de manière publique :

- demandes de prière ;
- notifications privées ;
- données administratives ;
- informations sensibles d'autorisation.

Le mécanisme précis de cache sera défini selon les besoins de performance du frontend.

---

# 27. Journalisation et audit

Les opérations administratives importantes doivent être auditables.

Exemples :

```text
USER_CREATED
ROLE_ASSIGNED
DEPARTMENT_UPDATED
PUBLICATION_CREATED
PUBLICATION_PUBLISHED
PUBLICATION_ARCHIVED
MEDIA_ACCESS_GRANTED
MEDIA_DELETED
PAGE_UPDATED
PRAYER_REQUEST_ARCHIVED
```

Le contenu sensible de la prière ne doit jamais être écrit dans les logs.

Un événement d'audit peut conserver :

```text
actorId
action
resourceType
resourceId
timestamp
result
metadata non sensible
```

---

# 28. Sécurité

Le backend doit appliquer au minimum :

- HTTPS ;
- validation systématique ;
- authentification Supabase ;
- RBAC côté serveur ;
- contrôle de scope ;
- rate limiting ;
- protection des endpoints publics ;
- contrôle MIME/taille des uploads ;
- secrets hors dépôt Git ;
- principe du moindre privilège ;
- logs sans données sensibles ;
- CORS contrôlé ;
- headers de sécurité ;
- gestion propre des erreurs.

---

# 29. Gestion des secrets

Les secrets restent exclusivement côté infrastructure.

Exemples :

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
CRYPTO_KEY / KEY REFERENCES
```

Aucun secret privilégié ne doit être exposé au frontend.

Particularité importante :

> la clé permettant de déchiffrer les demandes de prière ne doit pas être simplement assimilée à un secret backend global, sinon le Super Admin/infrastructure pourrait potentiellement la récupérer.

La solution cryptographique finale doit résoudre explicitement cette contrainte.

---

# 30. Dépendances entre modules

Les dépendances principales sont :

```text
Auth
  ↓
Authorization
  ↓
Users / Departments
  ↓
Publications / Events / Media / Pages
  ↓
Notifications

Prayers
  ├── Authorization
  ├── Crypto
  └── Notifications
```

Les modules ne doivent pas s'appeler mutuellement de manière anarchique.

Les dépendances passent par des interfaces/services explicites.

---

# 31. Architecture logique complète

```text
                    ┌───────────────────┐
                    │  Next.js Public   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Next.js Backoffice│
                    └─────────┬─────────┘
                              │
                           HTTPS
                              │
                    ┌─────────▼─────────┐
                    │   Express API     │
                    │ /api/v1           │
                    └─────────┬─────────┘
                              │
              ┌───────────────▼────────────────┐
              │ Presentation / HTTP            │
              │ Routes / Controllers / Zod    │
              └───────────────┬────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │ Application                    │
              │ Use Cases / Services / Policy  │
              └───────────────┬────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │ Domain                          │
              │ Entities / Rules / Interfaces   │
              └───────────────┬────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │ Infrastructure                 │
              │ Drizzle / Supabase / Storage   │
              │ Auth / Crypto / Logging        │
              └───────┬─────────────┬─────────┘
                      │             │
              ┌───────▼──────┐ ┌──▼─────────────┐
              │ PostgreSQL   │ │ Supabase       │
              │              │ │ Storage / Auth │
              └──────────────┘ └────────────────┘
```

---

# 32. Décisions d'architecture

Les décisions suivantes sont considérées comme structurantes :

### A1 — API REST versionnée

```text
/api/v1
```

### A2 — Architecture en couches

```text
Presentation
Application
Domain
Infrastructure
```

### A3 — Repository Pattern

Les use cases ne dépendent pas directement de Drizzle.

### A4 — Service / Use Case

Les règles métier complexes sont orchestrées par des services/use cases.

### A5 — Dependency Injection

Les dépendances sont injectées.

### A6 — Authorization centralisée

Le RBAC n'est pas dispersé dans les controllers.

### A7 — Backend autoritaire

Aucune décision de sécurité critique ne repose sur le frontend.

### A8 — Media centralisé

Les médias sont stockés dans une bibliothèque globale avec autorisations d'utilisation par département.

### A9 — Prayer isolé

Les demandes de prière disposent d'une politique d'accès et d'une frontière cryptographique spécifiques.

### A10 — Transactions métier

Les opérations nécessitant plusieurs changements cohérents sont atomiques.

---

# 33. Ce que l'architecture interdit

L'architecture interdit notamment :

- accès direct Next.js → PostgreSQL ;
- logique métier dans les controllers ;
- vérification RBAC uniquement côté frontend ;
- accès direct du frontend au service role Supabase ;
- média « autorisé » uniquement parce que son URL est connue ;
- déchiffrement des prières avant contrôle d'autorisation ;
- stockage des demandes de prière en clair dans les logs ;
- page builder générique ;
- duplication des règles métier dans plusieurs modules ;
- création de rôles codés en dur pour chaque département.

---

# 34. Contrat de dépendance

La règle de dépendance est :

```text
Presentation
    ↓
Application
    ↓
Domain

Infrastructure
    ↓
implémente les interfaces nécessaires
```

Le domaine ne dépend pas :

```text
Express
Drizzle
Supabase
Next.js
Railway
```

L'infrastructure, elle, peut dépendre de ces technologies.

---

# 35. Préparation du contrat OpenAPI

Avant la Phase 4, chaque endpoint devra préciser :

- méthode HTTP ;
- chemin ;
- authentification ;
- scope ;
- rôle autorisé ;
- paramètres ;
- body ;
- schéma Zod correspondant ;
- réponses ;
- erreurs ;
- pagination ;
- filtres ;
- exemple de payload.

Exemple conceptuel :

```yaml
POST /api/v1/publications
  security:
    - bearerAuth: []

  requestBody:
    schema: CreatePublicationRequest

  responses:
    201:
      schema: PublicationResponse

    401:
      schema: ErrorResponse

    403:
      schema: ErrorResponse

    422:
      schema: ValidationError
```

Le contrat OpenAPI complet constitue un livrable à finaliser avant le GEL.

---

# 36. Vérification par rapport au métier

L'architecture respecte les objectifs métier établis :

| Besoin métier | Réponse architecturale |
|---|---|
| Autonomie Presse/Ecodume | Scope DEPARTMENT |
| Administration globale | Scope GLOBAL + rôle ADMIN |
| Super Admin | rôle système supérieur |
| Prières privées | module + policy + crypto |
| Média central | Media + MediaAccess |
| Publications départementales | Publication.department |
| Trois publications | PublicationService + transaction |
| Pages structurées | Page + template validé |
| Pas de page builder | structure contrôlée par code |
| Back-office non technique | DTO/use cases adaptés aux tâches métier |
| Sécurité backend | Authorization centralisée |

---

# 37. Limites volontairement laissées ouvertes

Les points suivants ne doivent pas être considérés comme implicitement résolus :

1. protocole cryptographique définitif des demandes de prière ;
2. gestion des clés pour plusieurs Admins ;
3. récupération/rotation des clés ;
4. événements globaux ou exclusivement départementaux ;
5. détail définitif des permissions média ;
6. schéma SQL final ;
7. contrats OpenAPI exhaustifs ;
8. modèle final des entités éditoriales complémentaires ;
9. stratégie complète de cache ;
10. politique détaillée de suppression et d'audit.

Ces décisions doivent être fermées avant le GEL.

---

# 38. Conclusion

L'architecture cible du backend CCJV repose sur une séparation stricte entre :

```text
HTTP
 ↓
Application
 ↓
Métier
 ↓
Infrastructure
```

avec :

```text
RBAC centralisé
+
Repository Pattern
+
Use Cases / Services
+
Dependency Injection
+
REST / OpenAPI
+
PostgreSQL / Drizzle
+
Supabase Auth / Storage
+
Crypto isolée pour les prières
```

Le principe directeur reste :

> **Le code contrôle la structure du site ; le backend contrôle les données, les règles métier et les autorisations ; le back-office fournit les opérations métier prévues.**

Ce document constitue le livrable **3.3 — Architecture logicielle**. Il doit être complété par le contrat OpenAPI détaillé et par les décisions techniques encore ouvertes avant de considérer la conception comme gelée.

---

# 39. Passage vers 3.4 — Roadmap

La prochaine étape est de transformer cette architecture en lots d'implémentation :

1. fondations backend ;
2. authentification et RBAC ;
3. départements et utilisateurs ;
4. publications et archivage ;
5. événements ;
6. médiathèque ;
7. pages éditoriales ;
8. notifications ;
9. demandes de prière et cryptographie ;
10. API publique ;
11. intégration frontend ;
12. tests et durcissement.

Le détail des dépendances, priorités et charges appartient au livrable **3.4 — Roadmap**.

**Aucun code de production ne doit encore être écrit : la Phase 3 n'est pas terminée tant que la roadmap et les contrats structurants ne sont pas finalisés.**
