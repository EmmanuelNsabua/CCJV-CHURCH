# Document de conception — Back-Office CCJV

**Projet :** Centre Chrétien Jésus ma Vie — CCJV  
**Périmètre :** Back-Office d’administration du site  
**Phase :** Phase 3 — COMMENT / Conception et Architecture  
**Statut :** Document de conception initial — avant audit stratégique du frontend

---

## 1. Objet du document

Le présent document définit la conception du Back-Office permettant à CCJV de gérer le contenu et les données dynamiques de son site web sans intervention technique quotidienne.

Le Back-Office doit permettre à des utilisateurs non techniques de maintenir le site, tout en garantissant :

- la cohérence visuelle du site public ;
- la séparation entre contenu éditorial et structure technique ;
- la sécurité des accès ;
- la séparation des responsabilités entre les différents acteurs ;
- la réutilisation des médias ;
- la gestion des contenus dynamiques ;
- l’évolutivité du système.

Le Back-Office ne doit donc pas être conçu comme une interface permettant de « modifier le code du site », mais comme une **interface de gestion du contenu et des activités de l’église**.

---

## 2. Principes directeurs

### 2.1. Le Back-Office administre le contenu, pas le design

Le système doit distinguer clairement :

```text
CODE / DESIGN SYSTEM
        ↓
Structure visuelle
Composants
Variantes
Layouts
Animations
Responsive
Comportements

        +

CONTENU ADMINISTRABLE
        ↓
Textes
Images
Événements
Publications
Départements
Ressources
Médias
```

Un administrateur ne doit jamais avoir à manipuler :

- des classes CSS ;
- des composants React ;
- des identifiants techniques ;
- des URLs Supabase Storage ;
- des paramètres de mise en page ;
- des structures JSON ;
- des propriétés purement techniques.

### 2.2. Réutilisation des composants

Le frontend doit pouvoir encapsuler les structures récurrentes dans des composants réutilisables.

Exemple :

```text
BibleVerse
├── variante image
├── variante éditoriale
└── variante minimale
```

Le Back-Office ne modifie pas la structure de `BibleVerse`. Il fournit uniquement les données nécessaires :

```text
verset
référence biblique
image éventuelle
```

Même principe pour les composants réutilisables tels que :

```text
Hero
Card
Section événement
Section publication
Call-to-action
Gallery
etc.
```

Une même structure peut ainsi être utilisée sur plusieurs pages avec des paramètres différents.

---

# 3. Modèle général du Back-Office

Le Back-Office est organisé autour de trois niveaux :

```text
                    BACK-OFFICE CCJV
                           │
           ┌───────────────┼────────────────┐
           │               │                │
       CONTENU         ACTIVITÉS       ADMINISTRATION
           │               │                │
       Pages          Événements       Utilisateurs
       Médias         Publications     Rôles
       Ressources     Départements     Permissions
       etc.           etc.             Audit
```

L’utilisateur ne voit toutefois que les fonctionnalités correspondant à son rôle.

---

# 4. Modèle des utilisateurs

Trois catégories fonctionnelles sont retenues.

## 4.1. Super Administrateur

Le Super Administrateur possède le niveau de contrôle maximal.

Il peut :

- gérer les administrateurs ;
- gérer les responsables de département ;
- gérer les rôles et permissions ;
- accéder à tous les contenus ;
- accéder à tous les départements ;
- gérer les paramètres globaux ;
- consulter les journaux d’activité ;
- gérer les ressources et médias ;
- effectuer les opérations d’administration avancées.

Il constitue le niveau de gouvernance technique et fonctionnelle du Back-Office.

## 4.2. Administrateur

L’Administrateur assure la gestion opérationnelle du site.

Il peut notamment :

- gérer les contenus éditoriaux autorisés ;
- gérer les événements ;
- gérer les publications ;
- gérer les ressources ;
- gérer les médias ;
- gérer les départements ;
- gérer les données globales du site.

Il ne peut pas dépasser les privilèges du Super Administrateur.

Il ne peut notamment pas :

- créer un Super Administrateur ;
- modifier ses propres privilèges pour devenir supérieur ;
- modifier les mécanismes de sécurité ;
- accéder aux fonctions réservées à la gouvernance du système.

## 4.3. Responsable de département

Deux départements disposent actuellement d’un espace métier spécifique :

- **Press** ;
- **Ecodume**.

Le responsable d’un département possède un accès limité à son **périmètre métier**.

Il peut gérer les éléments dynamiques dont son département est responsable :

- informations propres à son département ;
- événements associés ;
- publications associées ;
- médias associés ;
- autres contenus dynamiques associés à son activité.

Il ne peut pas :

- modifier les pages statiques globales ;
- modifier la structure du site ;
- modifier les composants ;
- modifier le design ;
- accéder au département d’un autre responsable ;
- modifier les permissions ;
- gérer les utilisateurs ;
- accéder aux fonctions du Super Administrateur ;
- accéder aux fonctions globales réservées à l’Administrateur.

---

# 5. Principe de périmètre d’accès

L’autorisation ne repose pas uniquement sur le rôle.

Elle repose sur :

```text
ROLE + SCOPE
```

Exemple :

```text
Responsable Press
    +
Scope = Press
```

Il peut donc accéder à :

```text
Event.department = Press
Publication.department = Press
Media.department = Press
Department.id = Press
```

mais pas à :

```text
Event.department = Ecodume
Publication.department = Ecodume
Media.department = Ecodume
Department.id = Ecodume
```

Cette restriction doit être appliquée **dans le backend**, et non uniquement dans l’interface.

Masquer un bouton dans le frontend ne constitue pas une protection suffisante.

---

# 6. Départements

Tous les départements de l’église ne disposent pas d’un espace Back-Office.

Ils sont répartis en deux catégories.

## 6.1. Départements de présentation

Les départements suivants sont principalement des entités à présenter sur le site :

- Serviteurs ;
- Chorale Grand Groupe CCVJ ;
- Chorale de Cano Vocal ;
- Affaire sociale ;
- D’hygiène et Ancien semence ;
- Protocol ;
- Évangélisation ;
- Intercession ;
- autres départements futurs.

Ils peuvent posséder des informations éditoriales telles que :

```text
Nom
Description
Responsable
Image
Présentation
Informations complémentaires
Visibilité
```

mais ils ne génèrent pas automatiquement un compte utilisateur.

## 6.2. Départements disposant d’un espace métier

Actuellement :

```text
Press
Ecodume
```

Ces départements disposent :

- d’une entité département ;
- d’un responsable ;
- d’un compte utilisateur ;
- d’un périmètre d’autorisation ;
- de données dynamiques propres.

Cette distinction doit être native dans le modèle de données.

---

# 7. Médiathèque

Le système doit comporter une **véritable médiathèque centralisée**.

Elle constitue le point d’entrée principal pour la gestion des fichiers.

Elle doit permettre :

- l’import d’un média ;
- la prévisualisation ;
- la recherche ;
- le filtrage ;
- la sélection d’un média ;
- la réutilisation d’un média ;
- le remplacement éventuel d’un fichier ;
- la suppression selon les règles définies ;
- la consultation des informations du média.

Les fichiers sont stockés dans **Supabase Storage**.

Cependant, l’utilisateur ne manipule pas directement :

```text
bucket
object path
URL Storage
UUID
```

Il manipule :

```text
Image
Photo
Vidéo
Document
```

Le système fournit ensuite le lien technique nécessaire au frontend.

### Réutilisation

Un même média doit pouvoir être utilisé dans plusieurs contextes :

```text
Média
   ├── Hero
   ├── Département
   ├── Publication
   ├── Événement
   └── Ressource
```

Le système doit donc éviter les duplications inutiles.

---

# 8. Publications

Les publications utilisent un workflow commun :

```text
BROUILLON
    │
    ▼
PUBLIÉ
    │
    ▼
ARCHIVÉ
```

## 8.1. Brouillon

Le contenu existe mais n’est pas visible publiquement.

Il peut être :

- créé ;
- modifié ;
- complété ;
- préparé avant publication.

## 8.2. Publié

Le contenu est disponible sur le site public.

## 8.3. Archivé

Le contenu n’est plus considéré comme faisant partie des publications récentes.

L’archivage n’est toutefois **pas simplement une action manuelle arbitraire**.

Il dépend d’une règle métier basée sur le nombre de publications récentes.

Cette règle devra déterminer notamment :

- le seuil de publications récentes ;
- le périmètre du calcul ;
- le moment où une publication devient éligible à l’archivage ;
- si l’archivage est automatique ou déclenché par l’administrateur.

**La valeur exacte du seuil reste à définir.**

---

# 9. Publications par département

Le système de publication reste commun.

Nous ne créons pas :

```text
PublicationPress
PublicationEcodume
PublicationAdmin
```

mais :

```text
Publication
    │
    └── department / owner scope
```

Ainsi :

```text
Administrateur
→ toutes les publications autorisées

Responsable Press
→ publications Press

Responsable Ecodume
→ publications Ecodume
```

Cela permet de conserver une architecture unifiée tout en maintenant la séparation des responsabilités.

---

# 10. Événements

Les événements constituent également des données dynamiques.

Un événement peut notamment comporter :

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

Les responsables Press et Ecodume peuvent proposer/gérer les événements relevant de leur département.

L’Administrateur peut gérer les événements globaux.

Le Super Administrateur dispose d’un accès complet.

Le workflow précis :

```text
Responsable
   ↓
Proposition
   ↓
Validation éventuelle
   ↓
Publication
```

reste à préciser dans la conception fonctionnelle détaillée.

---

# 11. Informations des départements

Un responsable peut modifier les informations métier de son propre département.

Exemple :

```text
PRÉSENTATION DE PRESS

Nom
Description
Image
Présentation
Responsable
Informations complémentaires
```

Il ne peut toutefois pas modifier les propriétés structurelles susceptibles d’affecter le fonctionnement général du site.

Exemples potentiellement réservés à l’administration :

```text
slug
ordre d’affichage
structure de navigation
identifiants techniques
règles de visibilité globales
configuration système
```

La frontière exacte entre ces propriétés sera déterminée après l’audit du frontend et la conception détaillée du modèle de données.

---

# 12. Pages statiques et contenu éditorial

Les pages ne doivent pas être modélisées comme des documents libres.

Le modèle privilégié est :

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

La structure visuelle reste définie par le frontend.

Le Back-Office fournit les données nécessaires aux sections administrables.

### Exemple

```text
Accueil
│
├── Hero
├── BibleVerse
├── Mot du pasteur
├── Présentation
├── Événements à venir
├── Derniers enseignements
├── Communauté
├── Prière
└── Soutenir l’église
```

Cela ne signifie pas que toutes ces sections deviennent éditables.

C’est précisément l’objet de l’**audit stratégique du frontend** qui suivra ce document.

---

# 13. Gestion des données dynamiques dans les pages

Une section qui consomme des données dynamiques doit posséder un comportement défini lorsque ces données sont absentes.

Exemple :

```text
Événements à venir
        │
        ├── événements disponibles
        │       ↓
        │    afficher
        │
        └── aucun événement
                ↓
          comportement défini
```

Les comportements possibles sont :

- masquer la section ;
- afficher un état vide ;
- afficher un message éditorial ;
- afficher un CTA alternatif ;
- utiliser un contenu de remplacement.

Le comportement ne doit pas être laissé au hasard.

Il doit être déterminé par la conception de chaque composant.

---

# 14. Distinction entre contenu, données et configuration

Le système doit distinguer trois catégories.

## Contenu

Ce que l’utilisateur éditorial écrit :

```text
titre
description
texte
image
verset
etc.
```

## Données dynamiques

Ce que le système produit ou organise :

```text
événements
publications
départements
médias
ressources
```

## Configuration

Ce qui contrôle le fonctionnement du système :

```text
permissions
rôles
règles
structure
paramètres techniques
```

Cette dernière catégorie ne doit pas être exposée aux responsables de département.

---

# 15. Architecture fonctionnelle du Back-Office

L’organisation cible peut être représentée ainsi :

```text
BACK-OFFICE
│
├── Tableau de bord
│
├── Contenu
│   ├── Pages
│   ├── Ressources
│   └── Médias
│
├── Vie de l’église
│   ├── Événements
│   └── Départements
│
└── Administration
    ├── Utilisateurs
    ├── Rôles & permissions
    ├── Journal d’activité
    └── Configuration
```

Cette navigation est **conceptuelle**.

Elle devra être adaptée à chaque rôle afin de ne présenter à l’utilisateur que ce dont il a réellement besoin.

---

# 16. Tableau de bord

Le tableau de bord n’a pas vocation à devenir un système d’analytics complexe.

Il doit principalement permettre de comprendre rapidement :

- ce qui nécessite une action ;
- les événements à venir ;
- les contenus en brouillon ;
- les contenus récemment publiés ;
- les contenus éventuellement incomplets ;
- les propositions à valider ;
- les actions fréquentes.

Pour un responsable de département, le tableau de bord doit être centré exclusivement sur son périmètre.

---

# 17. Expérience utilisateur

L’objectif UX prioritaire est :

> **Permettre à une personne non technique de comprendre immédiatement ce qu’elle peut faire et de le faire sans connaître le fonctionnement technique du site.**

Le Back-Office doit donc privilégier :

- des termes métier ;
- des formulaires simples ;
- des actions explicites ;
- des aperçus ;
- des sélecteurs de médias ;
- des statuts compréhensibles ;
- des confirmations contextualisées ;
- des messages d’erreur humains ;
- une navigation adaptée au rôle.

À éviter :

- exposition des IDs ;
- jargon technique ;
- configuration JSON ;
- URLs Storage ;
- formulaires excessivement génériques ;
- écrans remplis de paramètres ;
- permissions présentées comme des concepts techniques à l’utilisateur métier.

---

# 18. Matrice initiale des droits

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

**Cette matrice est une base de conception et non encore le contrat définitif de permissions.**

---

# 19. Architecture technique cible

La conception reprend la stack déjà retenue :

```text
Frontend
Next.js
    │
    │ REST / JSON
    ▼
Backend
Express + TypeScript
    │
    ├── Presentation
    ├── Application
    ├── Domain
    └── Infrastructure
          │
          ├── PostgreSQL / Supabase
          ├── Supabase Auth
          └── Supabase Storage
```

Le backend reste responsable de l’application des règles métier et des autorisations.

Le frontend ne constitue jamais la source de vérité pour les permissions.

---

# 20. Autorisation

Le système d’autorisation devra prendre en charge :

```text
Role
+
Permission
+
Scope
```

Exemple conceptuel :

```text
User
│
├── role = DEPARTMENT_MANAGER
│
├── department_id = PRESS
│
└── permissions
      ├── publication.create
      ├── publication.read
      ├── publication.update
      ├── event.create
      ├── event.update
      ├── department.update
      └── media.manage
```

Une requête API doit vérifier :

1. l’identité de l’utilisateur ;
2. son rôle ;
3. sa permission ;
4. son périmètre ;
5. la propriété de la ressource concernée.

---

# 21. Audit du frontend — étape suivante

Ce document ne doit **pas inventer la liste finale des champs administrables**.

L’étape suivante est donc un audit stratégique du frontend existant.

DeepSeek devra déterminer :

- quelles sections existent ;
- lesquelles sont réutilisables ;
- quelles variantes existent ;
- quelles propriétés sont communes ;
- quelles données sont statiques ;
- quelles données sont dynamiques ;
- quelles données doivent être administrables ;
- quelles données doivent rester dans le code ;
- quels composants doivent être encapsulés ;
- quels états doivent être prévus lorsque les données dynamiques sont absentes ;
- quels fallbacks sont nécessaires ;
- quelles données doivent être liées à un département ;
- quelles données sont globales ;
- quelles contraintes visuelles doivent être protégées.

Le résultat de cet audit alimentera ensuite :

```text
Audit frontend
      ↓
Modèle éditorial
      ↓
Modèle de données
      ↓
Permissions
      ↓
Écrans du Back-Office
      ↓
API
      ↓
Implémentation
```

**Le prompt DeepSeek sera donc rédigé à partir de ce document, et non l’inverse.**

---

# 22. Points encore à spécifier

Le document permet désormais de fixer les grandes orientations, mais quelques règles doivent encore être précisées avant le GEL complet de la conception :

1. **Validation des événements proposés par les responsables**  
   Publication directe ou validation par un Administrateur ?

2. **Règle exacte d’archivage des publications**  
   Quel seuil de publications récentes ? Global ou par catégorie/département ?

3. **Granularité exacte des permissions des responsables**  
   Quels « autres contenus associés » peuvent-ils gérer ?

4. **Propriété des médias**  
   Média global, média appartenant à un département, ou combinaison des deux ?

5. **Comportement de chaque section dynamique sans données**  
   Masquage, état vide, fallback ou CTA.

6. **Liste définitive des propriétés administrables des départements**.

7. **Liste définitive des fonctions réservées au Super Administrateur**.

---

## Position dans la méthodologie

Nous sommes dans :

**PHASE 3 — COMMENT**

et plus précisément dans la conception du Back-Office.

Le déroulement logique devient :

```text
                PHASE 3
                   │
                   ▼
      ① Document de conception
                   │
                   ▼
      ② Audit stratégique frontend
          avec DeepSeek Harness
                   │
                   ▼
      ③ Consolidation du modèle
         éditorial + données
                   │
                   ▼
      ④ UML + architecture détaillée
                   │
                   ▼
      ⑤ Conception UX du Back-Office
                   │
                   ▼
      ⑥ Contrat API / OpenAPI
                   │
                   ▼
      ⑦ Roadmap d’implémentation
                   │
                   ▼
                GEL
                   │
                   ▼
             PHASE 4 — CODE
```

**Ce document constitue le document maître initial de conception du Back-Office.**

Le prompt DeepSeek sera ensuite construit pour auditer le frontend en fonction de ces principes, avec interdiction de transformer arbitrairement chaque élément visuel en champ CMS.
