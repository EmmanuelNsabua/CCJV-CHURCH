# 3.3 — Architecture logicielle

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC  
**Version :** MVP V1  
**Phase :** 3 — Conception et Architecture  
**Sous-phase :** 3.3 — Architecture logicielle  
**Statut :** Validé

---

# 1. Objectif

Cette sous-phase définit l'architecture logicielle définitive du MVP V1.

Elle précise :

- l'organisation des composants ;
- la séparation des responsabilités ;
- l'architecture du frontend ;
- l'architecture du backend ;
- les règles de communication entre les composants ;
- les Design Patterns retenus ;
- l'application des principes SOLID ;
- la stratégie d'authentification et d'autorisation ;
- la validation des données ;
- l'accès à PostgreSQL ;
- la gestion des médias ;
- le contrat API REST ;
- les principes de performance et de sécurité.

Cette architecture constitue la référence technique pour la Phase 4 — Implémentation.

---

# 2. Architecture générale

L'application CCJV est composée de deux applications principales :

1. **Frontend Next.js**
2. **Backend API Node.js + Express**

Les deux applications communiquent exclusivement via une API REST sécurisée en HTTPS.

L'infrastructure complémentaire repose sur :

- PostgreSQL ;
- Supabase Auth ;
- Supabase Storage ;
- Vercel ;
- Railway ;
- Namecheap.

## Architecture globale

```text
                              INTERNET
                                  │
                                  │ HTTPS
                                  ▼
                            ┌───────────┐
                            │ Namecheap │
                            │    DNS    │
                            └─────┬─────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     VERCEL      │
                         │                 │
                         │    Next.js      │
                         │                 │
                         │ ┌─────────────┐ │
                         │ │ Site public │ │
                         │ └─────────────┘ │
                         │ ┌─────────────┐ │
                         │ │ Back-office │ │
                         │ └─────────────┘ │
                         └────────┬────────┘
                                  │
                                  │ REST / HTTPS
                                  ▼
                         ┌─────────────────┐
                         │     RAILWAY     │
                         │                 │
                         │ Node.js         │
                         │ + Express       │
                         └────────┬────────┘
                                  │
                  ┌───────────────┼────────────────┐
                  │               │                │
                  ▼               ▼                ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │ PostgreSQL   │ │ Supabase     │ │ Supabase     │
          │              │ │ Auth         │ │ Storage      │
          └──────────────┘ └──────────────┘ └──────────────┘
```

---

# 3. Stack technique définitive

| Domaine | Technologie |
|---|---|
| Langage principal | TypeScript |
| Frontend | Next.js |
| Backend | Node.js + Express |
| Base de données | PostgreSQL |
| ORM | Drizzle ORM |
| Authentification | Supabase Auth |
| Validation | Zod |
| Stockage médias | Supabase Storage |
| API | REST |
| Documentation API | OpenAPI |
| Hébergement frontend | Vercel |
| Hébergement backend | Railway |
| Domaine / DNS | Namecheap |

Cette stack est considérée comme **figée à l'issue de la Phase 3**.

---

# 4. Principes architecturaux

L'architecture repose sur les principes suivants :

### 4.1. Séparation des responsabilités

Chaque couche possède une responsabilité clairement définie.

### 4.2. API-first

Le frontend ne dépend pas directement de PostgreSQL.

Toutes les opérations métier passent par l'API Express.

### 4.3. Backend comme autorité métier

Le frontend ne constitue jamais une source de vérité concernant :

- les permissions ;
- les règles métier ;
- les contraintes de données ;
- les opérations sensibles.

### 4.4. Infrastructure découplée du domaine

Le domaine métier ne doit pas connaître les détails spécifiques de PostgreSQL, Supabase ou Railway.

### 4.5. Performance-first

La conception doit rester adaptée aux connexions mobiles lentes ou instables.

### 4.6. MVP sans sur-ingénierie

Les abstractions ne sont introduites que lorsqu'elles apportent une valeur réelle au projet.

---

# 5. Architecture en couches

Le backend adopte quatre niveaux conceptuels :

```text
┌──────────────────────────────────────┐
│          PRESENTATION                │
│                                      │
│ Routes + Controllers + HTTP          │
└───────────────────┬──────────────────┘
                    ▼
┌──────────────────────────────────────┐
│          APPLICATION                 │
│                                      │
│ Services + Use Cases                 │
└───────────────────┬──────────────────┘
                    ▼
┌──────────────────────────────────────┐
│             DOMAIN                   │
│                                      │
│ Entities + Rules + Contracts         │
└───────────────────┬──────────────────┘
                    ▼
┌──────────────────────────────────────┐
│          INFRASTRUCTURE              │
│                                      │
│ Drizzle + PostgreSQL                 │
│ Supabase Auth + Storage              │
└──────────────────────────────────────┘
```

---

# 6. Couche Presentation

Cette couche est responsable de la communication HTTP.

Elle contient notamment :

- routes ;
- controllers ;
- middlewares ;
- sérialisation ;
- gestion des statuts HTTP.

Elle ne doit pas contenir les règles métier.

### Exemple

```text
POST /api/v1/events
        │
        ▼
EventController
        │
        ▼
EventService
```

Le controller transforme la requête HTTP en appel applicatif.

---

# 7. Couche Application

Cette couche contient les cas d'utilisation du système.

Exemples :

```text
EventService
DepartmentService
PublicationService
StaticPageService
```

Elle orchestre les opérations métier.

### Exemple

```text
EventService.create()
    │
    ├── validation métier
    ├── génération slug
    ├── vérification département
    └── repository.create()
```

---

# 8. Couche Domain

La couche Domain contient les concepts et règles métier indépendants de l'infrastructure.

Elle définit notamment :

- Event ;
- Department ;
- Publication ;
- StaticPage ;
- règles de statut ;
- types métier ;
- contrats des repositories.

Le domaine ne doit pas importer :

```text
Express
Drizzle
Supabase
Next.js
```

Cela permet de conserver une indépendance vis-à-vis des technologies d'infrastructure.

---

# 9. Couche Infrastructure

Cette couche implémente les détails techniques.

Elle contient notamment :

```text
Drizzle ORM
PostgreSQL
Supabase Auth
Supabase Storage
```

Exemple :

```text
IEventRepository
        ▲
        │ implements
        │
DrizzleEventRepository
        │
        ▼
PostgreSQL
```

Le domaine dépend donc d'un contrat et non directement du mécanisme de persistance.

---

# 10. Frontend Next.js

Next.js constitue une application unique contenant :

- le site public ;
- le back-office.

## Site public

```text
/
├── /qui-sommes-nous
├── /organisation
├── /evenements
├── /publications
└── /contact
```

## Back-office

```text
/admin
├── /dashboard
├── /evenements
├── /departements
├── /publications
└── /pages
```

Les interfaces publiques et administratives restent séparées au niveau fonctionnel.

---

# 11. Organisation frontend

Le frontend sera organisé par fonctionnalités plutôt que par accumulation de composants génériques.

Structure conceptuelle :

```text
src/
├── app/
│   ├── (public)/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── events/
│   ├── departments/
│   ├── publications/
│   └── pages/
│
├── lib/
│   ├── api/
│   ├── auth/
│   └── utils/
│
└── types/
```

L'organisation exacte des fichiers sera définie lors de la Phase 4 sans modifier l'architecture conceptuelle.

---

# 12. Backend Express

Organisation conceptuelle :

```text
src/
├── modules/
│   ├── auth/
│   ├── admins/
│   ├── departments/
│   ├── events/
│   ├── publications/
│   └── static-pages/
│
├── domain/
│   ├── entities/
│   ├── types/
│   └── repositories/
│
├── infrastructure/
│   ├── database/
│   ├── repositories/
│   ├── supabase/
│   └── storage/
│
├── shared/
│   ├── errors/
│   ├── validation/
│   ├── http/
│   └── utils/
│
├── config/
│
└── app/
```

Cette structure pourra être adaptée au cours de l'implémentation sans remettre en cause les responsabilités définies ici.

---

# 13. Drizzle ORM

**Drizzle ORM est retenu comme couche d'accès à PostgreSQL.**

Ses responsabilités :

- définition du schéma SQL côté application ;
- requêtes typées ;
- migrations ;
- accès à PostgreSQL.

Le flux est :

```text
Service
   │
   ▼
Repository
   │
   ▼
Drizzle ORM
   │
   ▼
PostgreSQL
```

Le Service ne doit jamais appeler Drizzle directement.

---

# 14. Zod

**Zod est retenu pour la validation des données.**

Il sera utilisé notamment pour :

- validation des bodies HTTP ;
- paramètres URL ;
- query parameters ;
- données entrantes ;
- validation de certaines configurations.

Exemple conceptuel :

```text
HTTP Request
     │
     ▼
Zod Schema
     │
 ┌───┴────┐
 │        │
Valide   Invalide
 │        │
 ▼        ▼
Service  400
```

La validation frontend pourra également utiliser des schémas compatibles lorsque cela apporte une valeur.

Cependant, la validation backend reste obligatoire.

---

# 15. OpenAPI

**OpenAPI est retenu comme contrat officiel de l'API REST.**

Le contrat documente :

- endpoints ;
- méthodes HTTP ;
- paramètres ;
- payloads ;
- réponses ;
- erreurs ;
- authentification ;
- schémas de données.

Le principe retenu est :

> Les schémas de validation constituent la référence des données échangées et sont utilisés pour maintenir/générer la documentation OpenAPI.

L'objectif est d'éviter d'avoir :

```text
TypeScript ≠ Zod ≠ OpenAPI
```

et de devoir maintenir trois définitions divergentes.

---

# 16. Versionnement API

Toutes les routes métier utilisent :

```text
/api/v1
```

Exemple :

```text
/api/v1/events
/api/v1/departments
/api/v1/publications
/api/v1/pages
```

Le versionnement permettra d'introduire une V2 incompatible sans casser immédiatement les clients existants.

---

# 17. API Events

```http
GET    /api/v1/events
GET    /api/v1/events/:id
POST   /api/v1/events
PATCH  /api/v1/events/:id
DELETE /api/v1/events/:id
```

### GET /events

Paramètres :

```text
page
limit
status
departmentId
```

Les événements peuvent être filtrés par :

- événements à venir ;
- événements archivés ;
- département.

Le statut est calculé à partir de `eventDate`.

---

# 18. API Departments

```http
GET    /api/v1/departments
GET    /api/v1/departments/:id
POST   /api/v1/departments
PATCH  /api/v1/departments/:id
DELETE /api/v1/departments/:id
```

Les opérations d'écriture nécessitent le rôle Admin.

---

# 19. API Publications

```http
GET    /api/v1/publications
GET    /api/v1/publications/:id
POST   /api/v1/publications
PATCH  /api/v1/publications/:id
DELETE /api/v1/publications/:id
```

Paramètres :

```text
page
limit
type
```

Types :

```text
VIDEO
PHOTO
TEXTE
```

---

# 20. API Static Pages

```http
GET   /api/v1/pages/:pageKey
PATCH /api/v1/pages/:pageKey
```

`GET` est public.

`PATCH` nécessite l'autorisation Admin.

---

# 21. API Media

Les fichiers sont gérés indépendamment des ressources métier.

```http
POST /api/v1/media
```

Le serveur :

1. authentifie l'administrateur ;
2. vérifie l'autorisation ;
3. valide le fichier ;
4. contrôle sa taille ;
5. l'envoie vers Supabase Storage ;
6. retourne une référence exploitable.

Exemple :

```json
{
  "url": "https://..."
}
```

La ressource métier conserve ensuite cette URL.

---

# 22. API Health Check

```http
GET /api/v1/health
```

Réponse :

```json
{
  "status": "ok"
}
```

Ce endpoint est destiné notamment au monitoring et au diagnostic de l'instance Railway.

---

# 23. Authentification

L'authentification repose sur **Supabase Auth**.

Flux :

```text
Admin
 │
 │ Login
 ▼
Supabase Auth
 │
 │ Access Token
 ▼
Next.js
 │
 │ Bearer Token
 ▼
Express
 │
 │ Validation token
 ▼
Identification utilisateur
```

Les routes protégées utilisent :

```http
Authorization: Bearer <access_token>
```

---

# 24. Autorisation

L'authentification et l'autorisation sont distinctes.

### Authentification

Vérifie l'identité.

### Autorisation

Vérifie les permissions.

En V1 :

```text
ROLE_ADMIN
```

est le seul rôle applicatif nécessaire.

Les routes d'administration nécessitent :

```text
Utilisateur authentifié
+
Rôle Admin
```

---

# 25. Middleware API

Le pipeline général est :

```text
Request
   │
   ▼
CORS
   │
   ▼
Rate Limiting
   │
   ▼
Authentication
   │
   ▼
Authorization
   │
   ▼
Validation Zod
   │
   ▼
Controller
   │
   ▼
Service
```

Les middlewares sont appliqués uniquement lorsque nécessaires selon le type de route.

---

# 26. Gestion des erreurs

Les erreurs API utilisent un format uniforme.

```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found"
  }
}
```

Codes principaux :

```text
AUTH_REQUIRED
FORBIDDEN
VALIDATION_ERROR
EVENT_NOT_FOUND
DEPARTMENT_NOT_FOUND
PUBLICATION_NOT_FOUND
PAGE_NOT_FOUND
DUPLICATE_SLUG
FILE_TOO_LARGE
INVALID_FILE_TYPE
INTERNAL_ERROR
```

Les détails internes sensibles ne sont jamais exposés au client en production.

---

# 27. Design Patterns retenus

## Repository Pattern

**Retenu.**

Responsabilité :

> abstraire la persistance.

---

## Service Layer

**Retenu.**

Responsabilité :

> encapsuler les cas d'utilisation et règles métier.

---

## Dependency Injection

**Retenu.**

Les services reçoivent leurs dépendances plutôt que de créer directement leurs repositories.

Exemple conceptuel :

```text
EventService
     │
     └── IEventRepository
```

Cela améliore la testabilité.

---

## Strategy Pattern

**Non retenu en V1.**

Les différences entre `VIDEO`, `PHOTO` et `TEXTE` ne justifient pas encore cette complexité.

---

## Factory Pattern

**Non retenu en V1.**

Aucun besoin de création polymorphe complexe n'est identifié.

---

## Observer Pattern

**Non retenu en V1.**

Les notifications et événements asynchrones sont hors périmètre.

---

# 28. SOLID

L'architecture applique les principes SOLID.

### Single Responsibility

Chaque composant possède une responsabilité claire.

### Open/Closed

Les modules doivent pouvoir évoluer sans modification massive des composants existants.

### Liskov Substitution

Les implémentations doivent respecter les contrats définis.

### Interface Segregation

Les interfaces restent ciblées.

### Dependency Inversion

Le domaine dépend de contrats et non des implémentations concrètes.

---

# 29. Performance

La performance est une contrainte fonctionnelle et technique majeure du projet.

L'application doit rester utilisable avec une connectivité limitée.

## Frontend

- Server Components lorsque pertinent ;
- pré-rendu des pages publiques lorsque pertinent ;
- faible quantité de JavaScript client ;
- lazy loading ;
- code splitting ;
- images optimisées ;
- WebP/AVIF lorsque pertinent ;
- pagination ;
- absence d'autoplay vidéo ;
- chargement différé des contenus lourds.

## API

- pagination ;
- réponses limitées ;
- filtrage côté serveur ;
- sélection des données nécessaires ;
- index PostgreSQL ;
- cache HTTP lorsque pertinent.

## Médias

Les images sont stockées et servies via Supabase Storage.

Les vidéos ne sont pas stockées directement par CCJV.

---

# 30. Sécurité

Les exigences minimales sont :

- HTTPS obligatoire ;
- mots de passe gérés par Supabase Auth ;
- tokens vérifiés côté backend ;
- autorisation côté backend ;
- secrets uniquement dans les variables d'environnement ;
- rate limiting ;
- validation Zod ;
- CORS configuré explicitement ;
- contrôle des fichiers uploadés ;
- limitation de taille des fichiers ;
- sauvegardes PostgreSQL ;
- messages d'erreur non verbeux en production.

La clé :

```text
SUPABASE_SERVICE_ROLE_KEY
```

ne doit jamais être exposée au navigateur.

---

# 31. Variables d'environnement

## Frontend

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Backend

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CORS_ORIGIN
```

Les secrets ne sont jamais versionnés dans Git.

---

# 32. Déploiement

## Frontend

```text
Git
 ↓
Vercel
 ↓
Next.js
```

## Backend

```text
Git
 ↓
Railway
 ↓
Node.js + Express
```

## Infrastructure

```text
Supabase
├── PostgreSQL
├── Auth
└── Storage
```

## Domaine

```text
Namecheap
     │
     │ DNS
     ▼
Vercel
```

---

# 33. Principes de communication

Le système respecte les règles suivantes :

### Autorisé

```text
Next.js → Express
Express → PostgreSQL
Express → Supabase Auth
Express → Supabase Storage
```

### Interdit

```text
Next.js → PostgreSQL
Next.js → Service Role Supabase
Frontend → secrets backend
```

Le frontend peut utiliser les mécanismes publics nécessaires de Supabase Auth, mais toute opération nécessitant des privilèges serveur passe par le backend.

---

# 34. Contrat de réponse API

Les réponses de collection utilisent :

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Les réponses individuelles utilisent directement la ressource :

```json
{
  "id": "uuid",
  "title": "Culte dominical"
}
```

Les erreurs utilisent :

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

Cette convention devra être décrite dans OpenAPI.

---

# 35. Exemple de flux complet

Création d'un événement avec image :

```text
Admin
 │
 ▼
Next.js Back-office
 │
 │ Upload image
 ▼
Express
 │
 ├── Auth
 ├── Authorization
 ├── Validation
 │
 ▼
Supabase Storage
 │
 │ imageUrl
 ▼
Next.js
 │
 │ POST /api/v1/events
 ▼
Express
 │
 ├── Zod
 ├── EventService
 ├── Slug generation
 └── Department validation
 │
 ▼
EventRepository
 │
 ▼
Drizzle
 │
 ▼
PostgreSQL
 │
 ▼
Express
 │
 │ JSON
 ▼
Next.js
 │
 ▼
Admin
```

---

# 36. Décisions finales de 3.3

Les décisions suivantes sont désormais retenues :

| Décision | Choix |
|---|---|
| Architecture | Architecture en couches |
| Frontend | Next.js + TypeScript |
| Backend | Node.js + Express + TypeScript |
| ORM | Drizzle ORM |
| BDD | PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Validation | Zod |
| API | REST |
| Documentation | OpenAPI |
| Version API | `/api/v1` |
| Pattern persistance | Repository |
| Pattern métier | Service Layer |
| Injection | Dependency Injection |
| Strategy | Non retenu V1 |
| Factory | Non retenu V1 |
| Observer | Non retenu V1 |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Domaine | Namecheap |

---

# 37. Statut

La sous-phase **3.3 — Architecture logicielle** est considérée comme **validée**.

Elle constitue la référence pour l'implémentation du MVP V1.

Toute modification fondamentale de :

- stack ;
- architecture ;
- modèle métier ;
- stratégie API ;
- mécanisme d'authentification ;
- stockage ;

après la clôture de la Phase 3 devra être considérée comme une modification du périmètre et reportée en **Phase 6 — Itération**, conformément à la règle du GEL.