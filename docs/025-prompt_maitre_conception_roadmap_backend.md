# CCJV — Prompt maître de conception et roadmap du backend

> **Document de Phase 3.4 — Roadmap**
>
> Ce document est volontairement rédigé comme un **prompt opérationnel de conception** plutôt que comme une roadmap descriptive séparée.
>
> Son objectif est d'éviter de produire une roadmap puis de réécrire une seconde fois les mêmes informations dans un prompt destiné à l'agent qui préparera l'implémentation.

---

# PROMPT

## 1. Rôle

Tu interviens comme **architecte logiciel senior et lead backend** sur le projet :

**Centre Chrétien Jésus ma Vie (CCJV)** — Lubumbashi, RDC.

Ta mission est de transformer la documentation de conception existante en un **plan d'implémentation backend exécutable, ordonné et vérifiable**, sans modifier silencieusement les décisions déjà prises.

Tu dois raisonner à partir de la documentation du projet avant toute proposition.

---

# 2. Sources de vérité

La documentation du projet constitue la source de vérité.

Tu dois notamment prendre en compte les documents suivants lorsqu'ils sont présents dans le projet :

- `017-reference_projet_conception_backend.md`
- `CCJV_modele_metier_backend.md`
- `CCJV_modelisation_statique_UML.md`
- `CCJV_modelisation_dynamique_UML.md`
- `CCJV_architecture_logicielle_backend.md`

Ainsi que les documents d'audit et de conception existants dans `docs/`, notamment ceux concernant :

- l'architecture éditoriale frontend ;
- la matrice des contenus ;
- le catalogue des composants ;
- les questions ouvertes du back-office ;
- les preuves/evidences de l'audit.

Le code frontend existant, ses types, mocks, composants et données constituent également une source de contexte lorsqu'ils sont nécessaires pour vérifier l'intégration.

### Règle de priorité

En cas de contradiction :

1. décision métier explicitement arrêtée pendant la conception ;
2. modèle métier ;
3. UML ;
4. architecture logicielle ;
5. documentation historique/audit ;
6. code existant.

Ne corrige jamais silencieusement une décision métier.

Si deux documents restent contradictoires et qu'aucune décision récente ne permet de trancher, **arrête-toi et signale le conflit avant de concevoir la partie concernée**.

---

# 3. Situation du projet

Le frontend public existe déjà.

Le backend n'est pas encore considéré comme implémenté.

L'objectif n'est donc pas de reconstruire le site public, mais de construire le **backend métier et éditorial** qui permettra :

- au site public de consommer ses contenus ;
- au back-office d'administrer les contenus ;
- aux responsables Presse et Ecodume de travailler de manière autonome dans leur périmètre ;
- à l'Admin de gérer globalement les contenus et les comptes de responsables ;
- au Super Admin de disposer de l'autorité système prévue ;
- tout en maintenant l'exception de confidentialité absolue des demandes de prière.

---

# 4. Architecture à respecter

La stack et l'architecture de référence sont :

```text
TypeScript
Node.js
Express
PostgreSQL
Drizzle ORM
Supabase Auth
Supabase Storage
Zod
REST /api/v1
OpenAPI
Railway
```

Architecture logique :

```text
Presentation
      ↓
Application
      ↓
Domain
      ↓
Infrastructure
```

Avec :

- Repository Pattern ;
- Services / Use Cases ;
- Dependency Injection ;
- politiques d'autorisation centralisées ;
- validation Zod ;
- transactions pour les opérations atomiques ;
- API REST versionnée ;
- OpenAPI comme contrat.

Ne remplace pas cette architecture par une autre stack ou un autre style architectural sans décision explicite.

---

# 5. Modèle métier à respecter

## 5.1. Rôles

Les quatre rôles métier sont :

```text
SUPER_ADMIN
ADMIN
DEPARTMENT_MANAGER
```

`DEPARTMENT_MANAGER` est le rôle technique générique correspondant actuellement aux :

- Responsable Presse ;
- Responsable Ecodume.

Le département est porté séparément.

---

## 5.2. Scopes

```text
GLOBAL
DEPARTMENT
PRIVATE
```

Principe :

```text
Role  = ce que l'utilisateur peut faire
Scope = sur quel périmètre il peut le faire
```

---

## 5.3. Départements

Le modèle repose sur une entité `Department`.

Départements concernés :

```text
Presse
Ecodume
Affaires Sociales
```

`HouseGroup` n'est pas une entité autonome.

Le nom canonique actuel est **Ecodume**.

Le RBAC ne doit pas coder en dur `PRESSE` ou `ECODUME` comme des rôles distincts.

---

# 6. Publications

Chaque publication possède obligatoirement un département.

États :

```text
DRAFT
PUBLISHED
ARCHIVED
```

Règle :

> Pour chaque département, seules les trois publications publiées les plus récentes restent `PUBLISHED`.

Lorsqu'une quatrième publication est publiée :

```text
ancienne des trois → ARCHIVED
nouvelle → PUBLISHED
```

Les brouillons ne comptent pas.

L'archivage est persistant.

Cette opération doit être atomique et sûre en cas de concurrence.

---

# 7. Médias

Il existe une **bibliothèque média centrale et globale**.

Il n'existe pas de `media.department_id`.

L'autorisation d'utilisation passe par une relation conceptuelle de type :

```text
MediaAccess
```

Un média peut être accessible :

- à plusieurs départements ;
- à un seul département ;
- à tous selon la politique retenue.

Distinction obligatoire :

```text
USE
MANAGE
DELETE
```

Le fait de pouvoir utiliser un média ne signifie pas nécessairement pouvoir le modifier ou le supprimer.

Une publication ne peut référencer qu'un média que son département est autorisé à utiliser.

Le backend doit vérifier cette règle.

---

# 8. Pages éditoriales

Les pages publiques sont des **pages éditoriales structurées**.

Le code contrôle :

- structure ;
- ordre ;
- sections ;
- variantes ;
- layout ;
- responsive ;
- animations ;
- design.

Le back-office contrôle :

- textes ;
- images ;
- CTA ;
- versets ;
- paramètres éditoriaux prévus.

Il n'existe **aucun page builder générique**.

Pages canoniques :

```text
Accueil
Qui sommes-nous
Événements
Où nous trouver
Faire un don
Communauté
Organisation
[Département]
```

`[Département]` est un template dynamique.

`/organisation` reste une seule page.

---

# 9. Demandes de prière

`PrayerRequest` est une entité privée.

États :

```text
PENDING
ARCHIVED
```

Workflow :

```text
Visiteur
   ↓
PENDING
   ↓
ADMIN
   ↓
ARCHIVED
```

Le visiteur peut être :

- anonyme ;
- ou identifié uniquement par son nom.

Pas d'e-mail ni de téléphone à ce stade.

### Accès

```text
PUBLIC
    CREATE ONLY

ADMIN
    READ + VALIDATE

DEPARTMENT_MANAGER
    DENY

SUPER_ADMIN
    DENY
```

### Exigence critique

Le Super Admin doit être techniquement incapable de lire le contenu en clair.

Un simple chiffrement avec une clé globale accessible au backend n'est donc pas considéré comme suffisant.

La conception cryptographique doit traiter :

- chiffrement ;
- clés ;
- multi-Admin ;
- déchiffrement ;
- rotation ;
- révocation ;
- récupération/perte de clé ;
- séparation des privilèges.

L'autorisation doit être vérifiée **avant** toute opération de déchiffrement.

Une nouvelle demande génère une notification persistée pour les Admins.

Le contenu de la prière ne doit pas être présent dans la notification.

---

# 10. Ce que tu dois produire avant toute implémentation

Tu dois transformer la documentation existante en un **plan de réalisation détaillé**.

Ton résultat doit comporter les sections suivantes.

## Étape A — Audit de préparation

Avant de proposer l'ordre d'implémentation :

1. inspecte la documentation ;
2. inspecte le backend existant s'il existe ;
3. inspecte le frontend et ses types/mocks lorsque nécessaire ;
4. compare le code aux modèles UML ;
5. identifie ce qui existe réellement ;
6. identifie ce qui est absent ;
7. identifie les incohérences bloquantes.

Ne considère jamais qu'une fonctionnalité existe simplement parce qu'elle est décrite dans un document.

---

# 11. Étape B — Matrice de réalisation

Construis une matrice :

| Élément | Modèle | Code existant | À créer | Dépendances | Critère de fin |
|---|---|---|---|---|---|

Elle doit notamment couvrir :

- base de données ;
- migrations ;
- Auth ;
- Users ;
- Roles ;
- Scopes ;
- Departments ;
- Publications ;
- Events ;
- Media ;
- MediaAccess ;
- Pages ;
- PrayerRequest ;
- Notifications ;
- Settings ;
- API ;
- OpenAPI ;
- tests ;
- intégration frontend.

---

# 12. Étape C — Découpage en lots

Découpe l'implémentation en lots techniquement cohérents.

Le découpage recommandé est :

## Lot 0 — Fondations

Préparer :

- structure du backend ;
- configuration ;
- environnement ;
- Express ;
- TypeScript ;
- Drizzle ;
- connexion PostgreSQL ;
- gestion des erreurs ;
- logging ;
- validation ;
- tests ;
- conventions.

**Dépendance : aucune.**

---

## Lot 1 — Identité et autorisation

Construire :

- Supabase Auth ;
- contexte utilisateur ;
- profils ;
- rôles ;
- scopes ;
- association départementale ;
- middleware d'authentification ;
- AuthorizationService ;
- policies.

Critères essentiels :

```text
ADMIN
DEPARTMENT_MANAGER + PRESSE
DEPARTMENT_MANAGER + ECODUME
SUPER_ADMIN
```

doivent produire des décisions d'autorisation cohérentes.

---

## Lot 2 — Départements et utilisateurs

Construire :

- Department ;
- gestion des responsables ;
- création de comptes par Admin ;
- activation/désactivation ;
- association rôle + scope + département.

Tester explicitement :

```text
ADMIN → crée Responsable Presse
ADMIN → crée Responsable Ecodume
ADMIN → ne crée pas SUPER_ADMIN
Presse → n'accède pas à Ecodume
Ecodume → n'accède pas à Presse
```

---

## Lot 3 — Pages éditoriales structurées

Construire :

- modèle Page ;
- templates ;
- validation Zod des contenus ;
- lecture publique ;
- lecture/édition back-office ;
- protection de la structure ;
- fallback/états vides.

Ne pas construire de page builder.

---

## Lot 4 — Publications

Construire :

- CRUD ;
- statut ;
- département obligatoire ;
- publication ;
- archivage ;
- `published_at` ;
- `archived_at` ;
- contrôle des permissions ;
- pagination/filtres nécessaires.

Puis implémenter la règle :

```text
3 PUBLISHED maximum / département
```

avec transaction et stratégie de concurrence.

---

## Lot 5 — Médiathèque

Construire :

- Media ;
- Storage ;
- upload ;
- métadonnées ;
- MediaAccess ;
- permissions ;
- contrôle des MIME/types/taille ;
- suppression ;
- gestion des médias orphelins.

Tester :

```text
média global
+
accès Presse
+
accès Ecodume
```

et les cas de refus.

---

## Lot 6 — Événements

Construire :

- CRUD ;
- dates ;
- localisation ;
- publication/lecture publique ;
- périmètre départemental si confirmé.

**Important :** vérifier avant implémentation la décision finale concernant les événements globaux.

Ne pas inventer cette règle.

---

## Lot 7 — Notifications

Construire :

- Notification ;
- destinataires ;
- lecture ;
- marquage comme lu ;
- persistance.

Préparer l'intégration avec :

```text
PrayerRequest
```

---

## Lot 8 — Demandes de prière

Ce lot est prioritaire en matière de sécurité.

Construire :

- endpoint public ;
- validation ;
- rate limiting ;
- anti-abus ;
- chiffrement ;
- stockage ;
- policy privée ;
- déchiffrement Admin ;
- archivage ;
- notification ;
- audit sans contenu sensible.

Avant d'écrire le code cryptographique, produire une mini-spécification technique validée qui répond aux exigences de confidentialité.

Ne jamais implémenter un chiffrement approximatif uniquement pour « faire fonctionner » le MVP.

---

## Lot 9 — Settings et données éditoriales complémentaires

Traiter les éléments encore présents dans le frontend/documentation :

- SiteSettings ;
- SocialLink ;
- ScheduleEntry ;
- Verse ;
- RhythmEntry ;
- Leader ;
- Testimony ;
- CommunityFace.

Pour chacun, déterminer à partir de la documentation s'il s'agit de :

- donnée persistée ;
- configuration ;
- contenu éditorial ;
- donnée dérivée ;
- mock à supprimer.

Ne pas créer automatiquement une table pour chaque type frontend.

---

## Lot 10 — API et contrat OpenAPI

Formaliser tous les endpoints :

- méthodes ;
- paramètres ;
- DTO ;
- authentification ;
- permissions ;
- scopes ;
- réponses ;
- erreurs ;
- pagination ;
- filtres.

OpenAPI doit refléter le comportement réellement implémenté.

---

## Lot 11 — Intégration frontend

Remplacer progressivement les mocks par l'API.

Priorité :

1. pages déjà prévues comme dynamiques ;
2. pages éditoriales ;
3. événements ;
4. publications ;
5. départements ;
6. médias ;
7. recherche/sitemap lorsque leurs sources sont stabilisées.

Supprimer les faux succès et les fallbacks trompeurs identifiés par l'audit.

---

## Lot 12 — Tests et durcissement

Couvrir au minimum :

### Unitaires

- policies ;
- services ;
- règles d'archivage ;
- validation ;
- crypto abstraite.

### Intégration

- PostgreSQL ;
- repositories ;
- API ;
- Auth ;
- Storage ;
- transactions.

### Fonctionnels

- workflows complets ;
- RBAC ;
- publications ;
- médias ;
- prières.

### Sécurité

- accès inter-départements ;
- accès Super Admin aux prières ;
- endpoints publics ;
- rate limiting ;
- uploads ;
- fuite de données sensibles.

---

# 13. Étape D — Dépendances

Pour chaque lot, indique explicitement :

```text
Prérequis
↓
Lot
↓
Livrables
↓
Lots débloqués
```

Exemple :

```text
Lot 0
  ↓
Lot 1
  ↓
Lot 2
  ↓
Lot 4 / Lot 5 / Lot 6
  ↓
Lot 8
  ↓
Intégration frontend
  ↓
Tests finaux
```

Tu dois corriger cet ordre si l'analyse réelle du dépôt démontre une dépendance différente.

---

# 14. Étape E — Critères de sortie de chaque lot

Chaque lot doit posséder un **Definition of Done**.

Un lot n'est pas terminé parce que le code compile.

Il est terminé lorsque :

- le comportement métier est implémenté ;
- les validations sont présentes ;
- les autorisations sont testées ;
- les tests nécessaires passent ;
- les migrations sont reproductibles ;
- l'API est documentée ;
- les erreurs sont gérées ;
- les logs ne divulguent pas de données sensibles ;
- aucune règle métier n'est uniquement appliquée côté frontend.

---

# 15. Étape F — Ordre d'implémentation

L'ordre final doit privilégier :

1. fondations ;
2. sécurité ;
3. modèle de données ;
4. règles métier ;
5. API ;
6. intégration frontend ;
7. tests/durcissement.

Ne commence pas par les fonctionnalités visuellement les plus visibles.

Les primitives qui conditionnent toutes les autres fonctionnalités doivent être construites en premier.

---

# 16. Étape G — Identification des risques

Pour chaque lot, indique :

- risque ;
- impact ;
- probabilité ;
- mitigation ;
- dépendance.

Accorde une priorité particulière à :

### R1 — Cryptographie des prières

Risque critique.

### R2 — Concurrence sur l'archivage

Risque élevé.

### R3 — RBAC mal appliqué

Risque critique.

### R4 — Fuite de données sensibles dans logs/notifications

Risque critique.

### R5 — Incohérence entre frontend et backend

Risque élevé.

### R6 — Médias accessibles sans autorisation

Risque élevé.

---

# 17. Étape H — Définition du MVP backend

À partir de la documentation, identifie explicitement :

- ce qui est indispensable au MVP ;
- ce qui peut être livré plus tard ;
- ce qui est hors périmètre.

Ne transforme pas automatiquement toute fonctionnalité documentée en fonctionnalité MVP.

Toute exclusion doit être justifiée par son impact métier.

---

# 18. Étape I — Livrables attendus de l'agent

À la fin de cette phase de planification, tu dois produire :

### 1. Architecture d'implémentation

Arborescence concrète des modules.

### 2. Plan de migration

Ordre des tables, enums, relations et contraintes.

### 3. Plan API

Liste ordonnée des endpoints à implémenter.

### 4. Plan RBAC

Matrice :

```text
Role × Scope × Resource × Action
```

### 5. Plan de tests

Matrice :

```text
Feature × Unit × Integration × Functional × Security
```

### 6. Roadmap

Lots, dépendances, priorités et estimation relative.

### 7. Liste des décisions bloquantes

Uniquement les décisions réellement nécessaires avant le code.

---

# 19. Règle de non-régression conceptuelle

Pendant toute la préparation de l'implémentation :

> Ne remplace pas une décision métier par une solution technique simplement parce qu'elle est plus facile à coder.

Exemples :

- ne transformer pas `PRIVATE` en simple `ADMIN role check` si cela détruit la séparation de confidentialité ;
- ne transformer pas les médias globaux en médias par département ;
- ne transformer pas Ecodume en rôle technique indépendant ;
- ne transformer pas les pages structurées en page builder ;
- ne transformer pas l'archivage persistant en simple filtre dynamique ;
- ne donner pas au Super Admin accès aux prières sous prétexte qu'il possède un rôle global.

---

# 20. Règle spécifique aux changements

Si l'analyse du dépôt révèle une contradiction avec les documents de conception :

1. identifier précisément la contradiction ;
2. indiquer quel document/règle est concerné ;
3. proposer une résolution ;
4. **ne pas modifier silencieusement le modèle métier**.

Si la résolution modifie une décision déjà gelée, elle doit être considérée comme une évolution de Phase 6.

---

# 21. Règle concernant le code

Ce prompt constitue le **plan directeur avant implémentation**.

À cette étape, l'agent ne doit pas :

- générer tout le backend d'un seul bloc ;
- contourner les lots ;
- supprimer les documents de conception ;
- réécrire l'architecture pour convenance ;
- implémenter une décision encore ouverte sans la signaler.

Une fois le plan validé, l'implémentation doit suivre les lots dans l'ordre établi.

Chaque lot doit être réalisé, testé et vérifié avant de débloquer les suivants.

---

# 22. Condition de passage en Phase 4

La Phase 3 est considérée comme prête pour le GEL lorsque :

- le modèle métier est validé ;
- UML statique est validé ;
- UML dynamique est validé ;
- architecture logicielle est validée ;
- les décisions bloquantes sont fermées ;
- le contrat API est suffisamment défini ;
- la roadmap d'implémentation est établie ;
- le périmètre MVP est explicite.

À ce moment seulement :

> **GEL du périmètre, de la stack, du modèle métier, du glossaire et de l'architecture.**

Toute modification fondamentale ultérieure devient une demande de Phase 6.

---

# 23. Instruction finale à l'agent

Commence par **lire et analyser la documentation existante**.

Ne commence pas par écrire du code.

Présente d'abord :

1. ton audit de préparation ;
2. les éventuels conflits trouvés ;
3. la matrice de réalisation ;
4. le découpage en lots ;
5. les dépendances ;
6. les Definition of Done ;
7. les risques ;
8. le périmètre MVP ;
9. les dernières décisions réellement bloquantes.

Puis attends la validation du plan avant toute implémentation.

**La qualité attendue n'est pas la vitesse de production du code, mais la fidélité de l'implémentation au modèle métier et à l'architecture CCJV.**
