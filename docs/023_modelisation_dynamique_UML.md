# CCJV — Modélisation dynamique UML du backend

**Projet :** Centre Chrétien Jésus ma Vie (CCJV)  
**Phase :** Phase 3 — COMMENT / 3.2 Modélisation dynamique & statique  
**Livrable :** Diagrammes de séquence et diagrammes d’états  
**Statut :** Modèle de conception — pré-GEL

---

## 1. Objectif

La modélisation statique décrit les objets métier et leurs relations.

La présente modélisation dynamique décrit comment ces objets collaborent dans le temps pour réaliser les principaux cas d’utilisation du backend.

Les scénarios retenus sont :

1. création et publication d’une publication ;
2. archivage automatique lors de la publication d’une quatrième publication ;
3. utilisation d’un média avec contrôle d’accès ;
4. création d’un compte de responsable de département ;
5. soumission d’une demande de prière ;
6. consultation et archivage d’une demande de prière par un Admin ;
7. tentative d’accès d’un Super Admin à une demande de prière.

Les composants utilisés dans les diagrammes (`API`, `AuthorizationService`, `PublicationService`, etc.) sont conceptuels. Leur découpage exact sera arrêté dans 3.3 — Architecture logicielle.

---

# 2. Principe transversal d’autorisation

Tous les cas d’utilisation protégés suivent le même principe :

```text
Utilisateur
    ↓
Authentification
    ↓
Autorisation
    ↓
Règle métier
    ↓
Persistance
    ↓
Réponse
```

Le frontend ne constitue jamais l’autorité de sécurité.

Masquer une action dans l’interface ne suffit pas : le backend doit toujours réévaluer le rôle, le scope et le périmètre de la ressource.

```mermaid
sequenceDiagram
    autonumber

    actor U as Utilisateur
    participant API as API
    participant AUTH as AuthorizationService
    participant S as Service métier
    participant R as Repository

    U->>API: Requête
    API->>AUTH: authenticate + authorize

    alt Refus
        AUTH-->>API: DENIED
        API-->>U: 401 / 403
    else Autorisé
        AUTH-->>API: ALLOWED
        API->>S: Exécuter opération
        S->>R: Lire / écrire
        R-->>S: Données
        S-->>API: Résultat
        API-->>U: Réponse
    end
```

---

# 3. Cas d’utilisation 1 — Créer et publier une publication

## Objectif

Permettre à un responsable de département ou à un Admin de créer une publication et de la publier dans le respect du périmètre d’autorisation.

```mermaid
sequenceDiagram
    autonumber

    actor U as Utilisateur
    participant F as Frontend
    participant API as API
    participant AUTH as AuthorizationService
    participant PS as PublicationService
    participant MAS as MediaAccessService
    participant PR as PublicationRepository
    participant MR as MediaRepository

    U->>F: Remplit la publication
    F->>API: POST /publications

    API->>AUTH: Vérifier rôle + scope
    AUTH-->>API: Autorisé / Refusé

    alt Accès refusé
        API-->>F: 403 Forbidden
        F-->>U: Action non autorisée
    else Accès autorisé
        API->>PS: createPublication(data)

        PS->>MAS: Vérifier les médias référencés
        MAS->>MR: Charger les médias
        MR-->>MAS: Médias
        MAS->>AUTH: Vérifier MediaAccess.USE
        AUTH-->>MAS: Accès confirmé

        alt Média non autorisé
            MAS-->>PS: MediaAccessDenied
            PS-->>API: Erreur métier
            API-->>F: 403 / 422
            F-->>U: Média non utilisable
        else Médias autorisés
            PS->>PR: save(DRAFT)
            PR-->>PS: Publication

            alt Publication demandée en PUBLISHED
                PS->>PR: publish(publication)
                PS->>PS: Appliquer règle d’archivage
            end

            PS-->>API: Publication
            API-->>F: 201 / 200
            F-->>U: Publication enregistrée
        end
    end
```

### Règle

Le frontend demande l’opération ; le backend décide si elle est autorisée.

---

# 4. Cas d’utilisation 2 — Publier une quatrième publication

## Objectif

Garantir qu’un département ne conserve que ses trois publications `PUBLISHED` les plus récentes.

Lorsqu’une quatrième publication est publiée, la plus ancienne des trois précédentes devient `ARCHIVED`.

```mermaid
sequenceDiagram
    autonumber

    actor U as Responsable
    participant API as API
    participant AUTH as AuthorizationService
    participant PS as PublicationService
    participant PR as PublicationRepository
    participant TX as Transaction

    U->>API: Publier P4
    API->>AUTH: authorize(PUBLISH, P4.department)
    AUTH-->>API: Autorisé

    API->>PS: publish(P4)

    PS->>TX: BEGIN

    PS->>PR: Vérifier P4
    PR-->>PS: P4 = DRAFT

    PS->>PR: getPublishedByDepartment(departmentId)
    PR-->>PS: P1, P2, P3

    PS->>PR: setPublished(P4)
    PR-->>PS: P4 = PUBLISHED

    PS->>PR: archive(P1)
    PR-->>PS: P1 = ARCHIVED

    PS->>TX: COMMIT

    PS-->>API: P4 publiée + P1 archivée
    API-->>U: Succès
```

## Pourquoi une transaction ?

La publication et l’archivage constituent une seule opération métier.

L’état final ne doit jamais être incohérent.

La conception technique devra donc garantir l’atomicité et traiter les publications concurrentes.

---

# 5. Cas d’utilisation 3 — Utiliser un média avec contrôle d’accès

## Objectif

Démontrer que la bibliothèque média est globale, mais que l’utilisation d’un média dépend du département.

```mermaid
sequenceDiagram
    autonumber

    actor U as Responsable Ecodume
    participant API as API
    participant AUTH as AuthorizationService
    participant PS as PublicationService
    participant MAS as MediaAccessService
    participant MR as MediaRepository
    participant MAR as MediaAccessRepository
    participant PR as PublicationRepository

    U->>API: Créer publication Ecodume + media-001

    API->>AUTH: authorize(CREATE, ECODUME)
    AUTH-->>API: Autorisé

    API->>PS: createPublication(...)

    PS->>MAS: canUse(media-001, ECODUME)

    MAS->>MR: findById(media-001)
    MR-->>MAS: Media

    MAS->>MAR: findAccess(media-001, ECODUME)
    MAR-->>MAS: USE autorisé

    MAS-->>PS: true

    PS->>PR: save(publication)
    PR-->>PS: Publication créée

    PS-->>API: Publication
    API-->>U: Succès
```

### Cas de refus

```mermaid
sequenceDiagram
    autonumber

    actor U as Responsable Ecodume
    participant API as API
    participant AUTH as AuthorizationService
    participant MAS as MediaAccessService
    participant MAR as MediaAccessRepository

    U->>API: Utiliser media-003
    API->>AUTH: authorize(CREATE, ECODUME)
    AUTH-->>API: Autorisé

    API->>MAS: canUse(media-003, ECODUME)
    MAS->>MAR: findAccess(media-003, ECODUME)
    MAR-->>MAS: Aucun accès USE

    MAS-->>API: AccessDenied
    API-->>U: 403 Forbidden
```

### Invariant

L’existence du média ne suffit pas :

```text
Media existe
+
Department autorisé
+
Permission USE
```

---

# 6. Cas d’utilisation 4 — Créer un compte Responsable de département

## Objectif

Permettre à l’Admin de créer un compte de responsable sans lui permettre de créer un Super Admin.

```mermaid
sequenceDiagram
    autonumber

    actor A as Admin
    participant F as Frontend
    participant API as API
    participant AUTH as AuthorizationService
    participant US as UserService
    participant AS as AuthProvider
    participant UR as UserRoleRepository
    participant DR as DepartmentRepository

    A->>F: Créer responsable Presse
    F->>API: POST /users

    API->>AUTH: Vérifier rôle ADMIN
    AUTH-->>API: Autorisé

    API->>US: createDepartmentManager(data)

    US->>DR: Vérifier Department=PRESSE
    DR-->>US: Département valide

    US->>AS: createUser(identity)
    AS-->>US: Auth user créé

    US->>UR: assignRole(DEPARTMENT_MANAGER, DEPARTMENT, PRESSE)
    UR-->>US: Rôle associé

    US-->>API: Responsable créé
    API-->>F: 201 Created
    F-->>A: Compte créé
```

### Opération interdite

```mermaid
sequenceDiagram
    autonumber

    actor A as Admin
    participant API as API
    participant AUTH as AuthorizationService

    A->>API: Créer SUPER_ADMIN
    API->>AUTH: authorize(CREATE_SUPER_ADMIN)
    AUTH-->>API: Refusé
    API-->>A: 403 Forbidden
```

Règle :

```text
ADMIN
 ├── peut créer DEPARTMENT_MANAGER
 └── ne peut pas créer/modifier SUPER_ADMIN
```

---

# 7. Cas d’utilisation 5 — Soumettre une demande de prière

## Objectif

Permettre à un visiteur de transmettre une demande de prière avec ou sans nom.

La demande est protégée avant sa persistance selon le mécanisme cryptographique qui sera arrêté dans la conception technique.

```mermaid
sequenceDiagram
    autonumber

    actor V as Visiteur
    participant F as Frontend
    participant API as Public Prayer API
    participant VAL as Validation / Anti-abuse
    participant CS as CryptoService
    participant PR as PrayerRequestRepository
    participant NS as NotificationService
    participant NR as NotificationRepository

    V->>F: Saisit sa demande

    alt Anonyme
        V->>F: Nom non renseigné
    else Identifié
        V->>F: Saisit son nom
    end

    F->>API: POST /prayer-requests
    API->>VAL: Valider + rate limit + anti-abus
    VAL-->>API: Données valides

    API->>CS: encrypt(message, name)
    CS-->>API: Données protégées

    API->>PR: create(PENDING, encryptedData)
    PR-->>API: PrayerRequest

    API->>NS: createPrayerNotification(requestId)
    NS->>NR: save(notification)
    NR-->>NS: Notification créée
    NS-->>API: OK

    API-->>F: 201 Created
    F-->>V: Demande reçue
```

## Règles de confidentialité

Le contenu de la demande ne doit pas apparaître :

- dans les logs applicatifs ;
- dans les erreurs ;
- dans les notifications ;
- dans les réponses publiques ;
- dans une réponse destinée au Super Admin.

---

# 8. Cas d’utilisation 6 — Consulter et archiver une demande par un Admin

```mermaid
sequenceDiagram
    autonumber

    actor A as Admin
    participant F as Frontend
    participant API as API
    participant AUTH as AuthorizationService
    participant PR as PrayerRequestRepository
    participant CS as CryptoService

    A->>F: Ouvre la demande
    F->>API: GET /prayer-requests/:id

    API->>AUTH: authorize(READ, PrayerRequest)
    AUTH-->>API: ADMIN autorisé

    API->>PR: findById(id)
    PR-->>API: PrayerRequest protégée

    API->>CS: decryptForAuthorizedAdmin(data)
    CS-->>API: Contenu en clair

    API-->>F: Demande déchiffrée
    F-->>A: Affiche la demande

    A->>F: Valider la demande
    F->>API: POST /prayer-requests/:id/archive

    API->>AUTH: authorize(VALIDATE, PrayerRequest)
    AUTH-->>API: ADMIN autorisé

    API->>PR: archive(id)
    PR-->>API: status = ARCHIVED

    API-->>F: 200 OK
    F-->>A: Demande archivée
```

La donnée reste conservée :

```text
PENDING → ARCHIVED
```

---

# 9. Cas d’utilisation 7 — Tentative d’accès du Super Admin

## Objectif

Vérifier l’exception fondamentale :

> SUPER_ADMIN ne peut pas lire les demandes de prière.

```mermaid
sequenceDiagram
    autonumber

    actor SA as Super Admin
    participant F as Frontend
    participant API as API
    participant AUTH as AuthorizationService

    SA->>F: Demande l’accès aux prières
    F->>API: GET /prayer-requests/:id

    API->>AUTH: authorize(READ, PrayerRequest)
    AUTH->>AUTH: Vérifier rôle + politique PRIVATE

    AUTH-->>API: DENIED

    API-->>F: 403 Forbidden
    F-->>SA: Accès refusé
```

### Point de sécurité critique

Le refus doit intervenir **avant le déchiffrement**.

Le flux suivant est interdit :

```text
Super Admin
 ↓
API
 ↓
Repository
 ↓
CryptoService
 ↓
Texte en clair
 ↓
403
```

Le flux attendu est :

```text
Super Admin
 ↓
API
 ↓
AuthorizationService
 ↓
DENIED
```

---

# 10. Diagramme d’états — Publication

```mermaid
stateDiagram-v2
    [*] --> DRAFT

    DRAFT --> PUBLISHED : publish()

    PUBLISHED --> ARCHIVED : dépassement des 3 plus récentes
    PUBLISHED --> ARCHIVED : archivage explicite autorisé

    ARCHIVED --> [*]
```

### Règle

Le passage automatique vers `ARCHIVED` est déclenché par la publication d’une nouvelle publication du même département.

Le nombre de publications `PUBLISHED` doit rester limité à trois par département.

---

# 11. Diagramme d’états — Demande de prière

```mermaid
stateDiagram-v2
    [*] --> PENDING

    PENDING --> ARCHIVED : validation ADMIN

    ARCHIVED --> [*]
```

Il n’existe pas de suppression automatique lors de la validation.

---

# 12. Diagramme conceptuel — Accès à un média

L’accès au média n’est pas un état global du média.

Il dépend de la combinaison :

```text
Media
+
Department
+
Permission
```

```mermaid
stateDiagram-v2
    [*] --> NOT_AUTHORIZED

    NOT_AUTHORIZED --> USE_ALLOWED : accord USE
    USE_ALLOWED --> MANAGE_ALLOWED : accord MANAGE
    MANAGE_ALLOWED --> DELETE_ALLOWED : accord DELETE

    USE_ALLOWED --> NOT_AUTHORIZED : révocation
    MANAGE_ALLOWED --> USE_ALLOWED : retrait MANAGE
    DELETE_ALLOWED --> MANAGE_ALLOWED : retrait DELETE
```

**Attention :** cette représentation est conceptuelle. La conception finale peut représenter `USE`, `MANAGE` et `DELETE` comme trois permissions indépendantes plutôt qu'une hiérarchie stricte.

---

# 13. Cas transversal — Responsable hors périmètre

Un responsable Presse ne doit pas pouvoir modifier une ressource Ecodume.

```mermaid
sequenceDiagram
    autonumber

    actor P as Responsable Presse
    participant API as API
    participant AUTH as AuthorizationService
    participant S as Service métier

    P->>API: Modifier publication Ecodume
    API->>AUTH: authorize(UPDATE, Ecodume)

    AUTH->>AUTH: role = DEPARTMENT_MANAGER
    AUTH->>AUTH: user.department = PRESSE
    AUTH->>AUTH: resource.department = ECODUME

    AUTH-->>API: DENIED
    API-->>P: 403 Forbidden

    Note over API,S: Le Service métier n’est jamais exécuté.
```

---

# 14. Cas transversal — Admin intervenant sur un contenu départemental

L’Admin dispose d’un périmètre global sur les contenus qu’il administre.

```mermaid
sequenceDiagram
    autonumber

    actor A as Admin
    participant API as API
    participant AUTH as AuthorizationService
    participant S as PublicationService
    participant R as PublicationRepository

    A->>API: Modifier publication Presse
    API->>AUTH: authorize(UPDATE, Presse publication)
    AUTH-->>API: ALLOWED

    API->>S: update(publication)
    S->>R: save(publication)
    R-->>S: Publication mise à jour
    S-->>API: OK
    API-->>A: 200 OK
```

---

# 15. Concurrence sur l’archivage des publications

Le scénario de publication de la quatrième publication révèle une contrainte technique importante.

Deux publications peuvent être publiées presque simultanément :

```text
Requête A → P4
Requête B → P5
```

Sans protection transactionnelle ou concurrentielle, les deux opérations peuvent observer le même état :

```text
P1
P2
P3
```

et produire un état incohérent.

La conception technique devra donc prévoir une stratégie adaptée :

- transaction ;
- verrouillage approprié ;
- contrainte SQL ;
- ou mécanisme équivalent.

Le choix exact appartient à 3.3.

---

# 16. Flux métier complet d’une publication

```mermaid
sequenceDiagram
    autonumber

    actor U as Responsable
    participant API as API
    participant AUTH as Authorization
    participant PS as PublicationService
    participant MAS as MediaAccessService
    participant PR as PublicationRepository
    participant TX as Transaction

    U->>API: POST publication
    API->>AUTH: Autoriser CREATE
    AUTH-->>API: OK

    API->>PS: create()

    PS->>MAS: Vérifier médias
    MAS-->>PS: OK

    PS->>TX: BEGIN
    PS->>PR: save(DRAFT)

    alt Publication immédiate
        PS->>PR: Compter PUBLISHED du département
        PS->>PR: publier nouvelle publication

        alt Trois publications déjà publiées
            PS->>PR: archiver la plus ancienne
        end
    end

    PS->>TX: COMMIT

    PS-->>API: Résultat
    API-->>U: Succès
```

---

# 17. Validation du modèle métier par la dynamique

Les scénarios confirment les règles suivantes.

## RBAC

```text
Role + Scope + Department
```

déterminent l’autorisation.

## Autonomie départementale

Un responsable travaille sans validation préalable de l’Admin, mais uniquement dans son département.

## Administration globale

L’Admin peut intervenir sur les contenus départementaux.

## Bibliothèque média

Les médias sont centralisés et leur utilisation est gouvernée par `MediaAccess`.

## Publications

Le rattachement départemental permet d’appliquer la règle des trois publications indépendamment pour chaque département.

## Prières

Le workflow est :

```text
Public
  ↓
PENDING
  ↓
ADMIN
  ↓
ARCHIVED
```

## Confidentialité

L’autorisation est vérifiée avant toute opération de déchiffrement.

---

# 18. Points restant à fermer avant 3.3

La modélisation dynamique révèle quatre décisions à formaliser avant l’architecture.

## D1 — Événements globaux

Déterminer si :

```text
Event.department_id
```

est obligatoire ou nullable pour permettre des événements globaux.

## D2 — Permissions média

Déterminer si :

```text
USE < MANAGE < DELETE
```

est une hiérarchie stricte ou trois permissions indépendantes.

Le modèle métier favorise la seconde interprétation afin de préserver la distinction entre utilisation, modification et suppression.

## D3 — Cryptographie des prières

Formaliser :

- protocole ;
- génération des clés ;
- stockage ;
- déchiffrement ;
- gestion de plusieurs Admins ;
- rotation ;
- révocation ;
- récupération ;
- perte de clé.

Le point essentiel reste inchangé :

> le Super Admin ne doit pas pouvoir lire les demandes de prière en clair.

## D4 — Archivage concurrent

L'opération :

```text
nouvelle publication → PUBLISHED
+
ancienne plus récente parmi les trois → ARCHIVED
```

doit être atomique.

---

# 19. Conclusion

La dynamique du backend CCJV s’articule autour de quatre opérations transversales :

```text
1. AUTORISER
      ↓
2. EXÉCUTER LA RÈGLE MÉTIER
      ↓
3. PERSISTER DE FAÇON COHÉRENTE
      ↓
4. RETOURNER LE RÉSULTAT
```

Deux mécanismes métier sont particulièrement structurants :

### Publications

```text
3 PUBLISHED maximum par département
```

### Demandes de prière

```text
PRIVATE
+
ADMIN uniquement
+
protection cryptographique
+
Super Admin exclu
```

La modélisation dynamique fournit ainsi le pont entre le modèle métier et l’architecture logicielle.

La prochaine étape de la Phase 3 est **3.3 — Architecture logicielle** : couches, services, repositories, politiques d’autorisation, mécanisme cryptographique, contrats API et patterns.

Le code d’implémentation reste hors périmètre tant que les quatre sous-livrables de la Phase 3 ne sont pas finalisés.
