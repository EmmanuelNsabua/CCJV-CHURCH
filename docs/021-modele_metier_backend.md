# CCJV — Modèle métier du backend

**Projet :** Centre Chrétien Jésus ma Vie (CCJV), Lubumbashi, RDC  
**Phase :** Phase 3 — COMMENT / Conception et Architecture  
**Livrable :** Modèle métier consolidé  
**Statut :** Base de conception — avant GEL de Phase 3

---

## 1. Objet du document

Ce document formalise le modèle métier du backend du site CCJV à partir des décisions prises pendant la conception.

Il décrit les **concepts métier**, leurs **responsabilités**, leurs **relations**, leurs **périmètres d'accès** et leurs **états**.

Il ne constitue pas encore le schéma SQL final, ni le contrat OpenAPI, ni le code d'implémentation.

Le principe directeur est le suivant :

> **Le backend gère le contenu et les données du site, pas sa conception visuelle.**

L'interface publique reste structurée et contrôlée par le code. Le back-office permet d'alimenter les structures prévues sans transformer le site en page builder.

---

# 2. Principes métier structurants

## 2.1. Séparation entre structure et contenu

Les pages publiques sont des **pages éditoriales structurées**.

La structure d'une page est définie par le code :

- composition ;
- ordre des sections ;
- types de sections autorisés ;
- variantes visuelles ;
- grille ;
- responsive ;
- animations ;
- contraintes de présentation.

Le back-office contrôle uniquement les éléments éditoriaux autorisés par cette structure :

- textes ;
- images et médias ;
- CTA ;
- versets ;
- paramètres éditoriaux prévus ;
- données dynamiques.

### Analogie métier

Une page est comparable à une maison :

- le code définit les murs, les pièces et leur organisation ;
- le back-office permet de peindre les murs et d'aménager les pièces ;
- l'utilisateur du back-office ne peut pas déplacer les murs.

Il n'existe donc **pas de page builder générique**.

---

# 3. Pages éditoriales structurées

Les pages éditoriales canoniques sont :

1. **Accueil**
2. **Qui sommes-nous**
3. **Événements**
4. **Où nous trouver**
5. **Faire un don**
6. **Communauté**
7. **Organisation**
8. **[Département]**

Les sept premières correspondent à des structures éditoriales déterminées.

`[Département]` est un **template dynamique** : il n'est pas une page statique supplémentaire. Il permet de présenter un département à partir de son identifiant/slug.

### Règle particulière — Organisation

`/organisation` reste une seule page.

Les départements ne deviennent pas des routes permanentes sous `/organisation`.

Un département peut être consulté contextuellement à partir de son slug, d'un bouton ou d'un lien.

---

# 4. Département

Le **Département** représente une unité organisationnelle de l'église.

Il constitue notamment le périmètre d'autonomie des responsables de département.

### Départements explicitement concernés par le back-office spécialisé

- **Presse**
- **Ecodume**
- **Affaires Sociales**

Toutefois, seuls **Presse** et **Ecodume** disposent actuellement d'un espace de gestion départemental dédié.

### Ecodume

Le nom canonique actuel est :

- nom d'affichage : **Ecodume**
- identifiant métier : `ECODUME`
- slug : `ecodume`

Le nom est porté par l'entité Département et ne doit pas être codé en dur dans le RBAC.

### Affaires Sociales

`HouseGroup` n'est pas une entité métier autonome.

Il correspond au département :

- nom : **Affaires Sociales**
- slug : `affaires-sociales`

Aucune table `HouseGroup` n'est donc nécessaire à ce stade.

---

# 5. Utilisateur et rôles

Le système distingue l'identité technique de l'utilisateur de son rôle métier.

## 5.1. Rôles métier

Le modèle comprend quatre rôles :

### SUPER_ADMIN

Autorité système suprême.

Périmètre :

- global ;
- gestion du système ;
- gestion des utilisateurs et rôles ;
- gestion des départements ;
- gestion des contenus ;
- gestion des médias ;
- paramètres ;
- journaux d'activité ;
- administration générale.

### Exception de confidentialité

Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière**.

Cette exception est intentionnelle et doit être garantie techniquement.

Le Super Admin reste l'autorité suprême du système sans disposer du pouvoir de déchiffrer les demandes de prière privées.

---

### ADMIN

Administrateur global du contenu.

Il peut notamment :

- gérer les pages éditoriales ;
- gérer les départements ;
- gérer les événements ;
- gérer les publications ;
- gérer les médias ;
- créer les comptes des responsables de département ;
- intervenir sur les contenus produits par les responsables.

Il ne peut pas créer ou modifier un compte SUPER_ADMIN.

---

### DEPARTMENT_MANAGER

Rôle technique générique correspondant aux responsables de département.

Les instances métier actuelles sont :

- **Responsable Presse**
- **Responsable Ecodume**

Le département associé détermine leur périmètre.

Exemple :

`DEPARTMENT_MANAGER + department_id = PRESSE`

ou

`DEPARTMENT_MANAGER + department_id = ECODUME`

Cette modélisation évite de créer des rôles techniques rigides tels que `ROLE_PRESSE` ou `ROLE_ECODUME`.

---

# 6. Modèle Role → Scope

Le modèle d'autorisation repose sur deux questions distinctes :

> **Role = que peut faire l'utilisateur ?**

> **Scope = sur quelles ressources peut-il le faire ?**

## 6.1. Scopes

### GLOBAL

L'utilisateur peut agir sur l'ensemble du périmètre autorisé par son rôle.

Exemples :

- SUPER_ADMIN ;
- ADMIN pour les ressources globales qui lui sont attribuées.

### DEPARTMENT

L'utilisateur agit uniquement dans le département auquel il est associé.

Exemple :

`DEPARTMENT_MANAGER / Presse`

ne peut pas modifier les contenus d'Ecodume.

### PRIVATE

La ressource est soumise à une politique d'accès restreinte.

`PRIVATE` ne signifie pas nécessairement « appartenant à un utilisateur ».

Il désigne un périmètre de confidentialité particulier.

Exemple :

`PrayerRequest` → `PRIVATE` + audience `ADMIN`.

---

# 7. Matrice métier des responsabilités

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

### Autonomie départementale

Le responsable d'un département peut :

- créer ;
- modifier ;
- publier ;
- archiver ;
- supprimer

les publications et événements relevant de son département, selon les règles métier définies.

Il n'a pas besoin d'une validation préalable de l'Admin pour publier.

L'Admin conserve cependant la capacité d'intervenir sur ces contenus.

---

# 8. Publication

La **Publication** représente un contenu éditorial publié par un département.

## 8.1. Règle d'appartenance

Chaque publication possède obligatoirement un `department_id`.

Une publication appartient donc toujours à un département.

Cette règle permet :

- de déterminer son périmètre de gestion ;
- d'appliquer le RBAC départemental ;
- d'appliquer la règle d'archivage par département.

---

## 8.2. États

Les états métier sont :

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

### DRAFT

Publication en préparation.

Elle n'est pas considérée dans la limite des trois publications publiées.

### PUBLISHED

Publication actuellement publiée.

### ARCHIVED

Publication historiquement conservée mais sortie du groupe des publications actuellement publiées.

L'archivage est un **état métier persistant**.

Il ne doit pas être simplement calculé à la volée.

---

## 8.3. Règle des trois publications

La règle est indépendante pour chaque département.

Pour un département donné :

1. les trois publications publiées les plus récentes restent `PUBLISHED` ;
2. lorsqu'une quatrième publication est publiée ;
3. la plus ancienne des trois précédentes devient `ARCHIVED`.

Exemple :

`P1 → P2 → P3`

Les trois sont publiées.

Publication de `P4` :

`P1 → ARCHIVED`  
`P2 → PUBLISHED`  
`P3 → PUBLISHED`  
`P4 → PUBLISHED`

Publication de `P5` :

`P2 → ARCHIVED`

Les brouillons ne participent jamais à ce calcul.

Presse et Ecodume disposent de cycles d'archivage indépendants.

---

# 9. Événement

L'**Événement** représente une activité annoncée sur le site.

Le modèle existant prévoit déjà une relation possible avec un département.

Le caractère obligatoire ou facultatif de cette relation doit être arrêté dans le schéma métier final avant le GEL de Phase 3, car le site peut également contenir des événements d'intérêt global.

Le statut temporel d'un événement peut rester calculé à partir de ses dates ; il ne doit pas être confondu avec l'état éditorial d'une publication.

---

# 10. Média

Le **Média** représente une ressource audiovisuelle ou graphique de la bibliothèque média centrale.

## 10.1. Bibliothèque centrale

Tous les médias appartiennent à une **bibliothèque globale unique**.

Il n'existe pas de bibliothèque média physiquement séparée par département.

Donc :

> `Media.department_id` n'est pas le modèle retenu.

---

## 10.2. Autorisation d'utilisation

L'accès à un média est contrôlé par une politique d'autorisation.

Un média peut être :

- accessible à Presse et Ecodume ;
- accessible uniquement à Ecodume ;
- accessible uniquement à Presse ;
- accessible à tous.

Le modèle conceptuel repose donc sur :

`Media`

et une relation de type :

`MediaAccess`

entre le média et les départements autorisés.

La gestion de cette autorisation appartient à l'Admin/Super Admin.

Un responsable départemental ne peut pas s'accorder lui-même un accès.

---

## 10.3. Trois opérations distinctes

Il faut distinguer :

1. **Utiliser** un média dans un contenu ;
2. **Modifier** un média ;
3. **Supprimer** un média.

Ces droits ne sont pas équivalents.

Un responsable peut être autorisé à utiliser un média sans disposer du droit de modifier ou supprimer la ressource centrale.

Le backend doit vérifier l'autorisation du média lors de la création, modification et publication d'un contenu.

---

# 11. Relation Publication ↔ Média

Une publication peut référencer un ou plusieurs médias selon sa structure éditoriale.

Le backend doit vérifier que chaque média référencé est utilisable par le département de la publication.

Exemple :

Une publication Ecodume ne peut pas référencer un média réservé à Presse.

Cette règle doit être appliquée côté backend et non uniquement dans l'interface.

---

# 12. Demande de prière

La **PrayerRequest** est une entité métier privée.

Elle représente une demande de prière soumise depuis le site public.

## 12.1. Soumission

Un visiteur peut soumettre une demande :

- anonymement ;
- ou avec son nom.

Aucune adresse e-mail ou numéro de téléphone n'est requis à ce stade.

---

## 12.2. État

Les états sont :

- `PENDING`
- `ARCHIVED`

### PENDING

Nouvelle demande reçue et non encore validée.

### ARCHIVED

Demande validée par un Admin.

L'archivage ne signifie pas suppression.

La demande reste conservée dans l'historique.

---

## 12.3. Accès

| Acteur | Soumettre | Lire | Valider / archiver |
|---|---:|---:|---:|
| Visiteur | Oui | Non | Non |
| Super Admin | Non | **Non** | Non |
| Admin | Non | **Oui** | **Oui** |
| Responsable département | Non | Non | Non |

La lecture est donc strictement réservée aux Admins.

---

# 13. Confidentialité cryptographique des demandes de prière

La confidentialité demandée est plus forte qu'un simple chiffrement de la base de données.

Le modèle métier impose le principe suivant :

> Le Super Admin, malgré son niveau d'autorité système, ne doit pas être techniquement capable de lire le contenu en clair d'une demande de prière.

Cela implique que le futur modèle technique devra prévoir un mécanisme cryptographique séparant :

- les données stockées ;
- les clés de chiffrement ;
- l'accès applicatif ;
- l'utilisateur Admin autorisé à déchiffrer.

Le choix précis du mécanisme cryptographique, du cycle de vie des clés, de leur rotation, de leur récupération et de la gestion de plusieurs comptes Admin reste un point de conception technique à formaliser dans le CST/architecture avant le GEL.

Le backend ne doit donc jamais exposer le texte en clair à un acteur non autorisé.

---

# 14. Notification

La création d'une demande de prière génère une **notification destinée aux Admins**.

La notification doit être persistée afin que l'information ne dépende pas de la présence simultanée d'un Admin en ligne.

La notification ne doit pas divulguer le contenu privé de la demande à un acteur non autorisé.

Exemple de notification :

> Nouvelle demande de prière reçue.

Le texte de la prière reste protégé par la politique de confidentialité de `PrayerRequest`.

---

# 15. Relations métier principales

Le modèle peut être résumé ainsi :

```text
User
 └── Role
      └── Scope

DEPARTMENT_MANAGER
 └── Department

Department
 ├── Publication
 ├── Event
 └── accès autorisés aux Media

Media
 └── MediaAccess
      └── Department

Publication
 ├── Department
 └── Media

PrayerRequest
 ├── Scope = PRIVATE
 └── Audience = ADMIN

PrayerRequest
 └── Notification
```

---

# 16. Cardinalités conceptuelles

| Relation | Cardinalité |
|---|---|
| Department → Publication | 1 → 0..* |
| Department → Event | 1 → 0..* ou selon la décision finale sur les événements globaux |
| Department → Department Manager | 1 → 0..* |
| Media → MediaAccess | 1 → 0..* |
| Department → MediaAccess | 1 → 0..* |
| Publication → Media | 1 → 0..* |
| PrayerRequest → Notification | 1 → 0..* |
| Role → User | 1 → 0..* |
| Scope → autorisation | dépend du modèle RBAC final |

---

# 17. Invariants métier

Les invariants suivants sont considérés comme structurants :

### I1 — Une publication appartient à un département

`Publication.department_id` est obligatoire.

### I2 — Un responsable départemental reste dans son périmètre

Un `DEPARTMENT_MANAGER` ne peut agir que sur les ressources autorisées de son `department_id`.

### I3 — Un média n'appartient pas à un département

La bibliothèque média est globale.

Les permissions d'utilisation sont séparées de l'appartenance.

### I4 — Une publication ne peut utiliser qu'un média autorisé

Cette règle doit être vérifiée par le backend.

### I5 — Les brouillons ne comptent pas dans l'archivage

Seules les publications `PUBLISHED` participent à la règle des trois dernières publications.

### I6 — L'archivage est persistant

Une publication archivée reste explicitement dans l'état `ARCHIVED`.

### I7 — L'archivage est indépendant par département

La publication d'un département ne déclenche pas l'archivage d'un autre.

### I8 — Une demande de prière validée devient archivée

La validation par un Admin entraîne le passage à `ARCHIVED`.

### I9 — Une demande de prière reste conservée après archivage

L'archivage ne supprime pas la demande.

### I10 — Super Admin ne lit pas les demandes de prière

Cette règle constitue une exception explicite au caractère global du rôle.

### I11 — Les pages ne sont pas librement composables

Le back-office ne peut pas créer arbitrairement des sections ou modifier la structure visuelle.

### I12 — Ecodume est une donnée de département

Le nom ne doit pas être utilisé comme mécanisme RBAC codé en dur.

---

# 18. Périmètres de données

Le modèle distingue trois niveaux :

## Global

Ressources accessibles dans le périmètre global du rôle :

- pages éditoriales ;
- bibliothèque média ;
- départements ;
- paramètres ;
- administration.

## Département

Ressources rattachées au département :

- publications ;
- événements départementaux ;
- informations départementales ;
- médias utilisables par le département.

## Privé

Ressources soumises à une politique de confidentialité particulière :

- demandes de prière.

---

# 19. Ce que le modèle métier exclut

Les éléments suivants ne font pas partie du modèle métier retenu à ce stade :

### Pas de page builder

Pas d'entité permettant de créer librement :

- des sections ;
- des blocs arbitraires ;
- des mises en page ;
- des grilles ;
- des variantes graphiques non prévues.

### Pas de HouseGroup

`HouseGroup` n'est pas une entité autonome.

### Pas de Media par département

Pas de `media.department_id`.

### Pas de rôle codé en dur par département

Pas de modèle métier fondé sur une multiplication de rôles tels que `ROLE_PRESSE`, `ROLE_ECODUME`, etc.

Le rôle est générique et le département détermine le périmètre.

---

# 20. Points restant à formaliser avant le GEL de Phase 3

Ce document ferme le modèle métier issu des décisions prises, mais certains détails doivent encore être transformés en spécifications formelles avant le GEL.

### 20.1. Événements

Déterminer définitivement si `Event.department_id` est :

- obligatoire pour tous les événements ;
- ou nullable pour permettre des événements globaux.

### 20.2. Cryptographie des demandes de prière

Formaliser :

- modèle de chiffrement ;
- génération des clés ;
- stockage des clés ;
- déchiffrement côté Admin ;
- gestion de plusieurs Admins ;
- rotation ;
- révocation ;
- récupération ;
- perte de clé ;
- audit des accès.

### 20.3. Modèle exact des médias

Définir précisément :

- types MIME ;
- taille maximale ;
- buckets ;
- variantes / thumbnails ;
- politique d'accès ;
- relation `MediaAccess` ;
- suppression ;
- médias orphelins.

### 20.4. Modèle éditorial des pages

Transformer les structures visuelles déjà définies en contrats de données :

- page ;
- sections autorisées ;
- variantes ;
- champs éditables ;
- validation Zod ;
- fallback ;
- contenu vide.

### 20.5. Entités éditoriales complémentaires

Le modèle doit encore déterminer le statut final des entités actuellement observées dans le frontend, notamment :

- Leader ;
- Testimony ;
- CommunityFace ;
- Verse ;
- RhythmEntry ;
- SocialLink ;
- ScheduleEntry ;
- SiteSettings.

Elles doivent être classées explicitement comme :

- entités métier persistées ;
- configuration ;
- contenu éditorial ;
- données dérivées ;
- ou données supprimées du périmètre backend.

### 20.6. Suppression et historique

Définir, ressource par ressource :

- suppression physique ;
- soft delete ;
- archivage ;
- historique ;
- audit.

---

# 21. Passage vers les sous-livrables suivants de la Phase 3

Le présent document constitue le **modèle métier de référence**.

Il doit maintenant servir de base aux quatre travaux de conception suivants :

1. **Modélisation statique UML**
   - diagramme de classes ;
   - cardinalités ;
   - agrégats ;
   - états.

2. **Modélisation dynamique UML**
   - publication ;
   - archivage automatique ;
   - gestion média ;
   - création d'un responsable ;
   - demande de prière ;
   - autorisation RBAC.

3. **Architecture logicielle**
   - couches ;
   - repositories ;
   - services ;
   - politiques d'autorisation ;
   - gestion cryptographique ;
   - API.

4. **Roadmap**
   - lots ;
   - dépendances ;
   - ordre d'implémentation ;
   - estimation.

Aucun code d'implémentation ne doit être produit avant que ces quatre sous-livrables de la Phase 3 soient finalisés.

---

# 22. Règle du GEL

À la fin de la Phase 3, les éléments suivants seront figés :

- périmètre fonctionnel ;
- glossaire ;
- modèle métier ;
- stack technique ;
- architecture ;
- contrats structurants ;
- règles d'autorisation.

Toute modification fondamentale demandée après ce point devra être traitée comme une **itération de Phase 6** et non comme une modification opportuniste de l'implémentation.

---

## Conclusion

Le backend CCJV n'est pas conçu comme un CMS générique.

Il est conçu comme un **système éditorial métier contrôlé**, dans lequel :

- la structure du site reste maîtrisée par le code ;
- le contenu est administrable ;
- les départements disposent d'une autonomie réelle mais bornée ;
- les médias sont centralisés et gouvernés par des permissions d'utilisation ;
- les publications sont rattachées à un département et soumises à une politique d'archivage ;
- les demandes de prière constituent une zone privée avec une exigence de confidentialité cryptographique exceptionnelle ;
- le RBAC sépare clairement le rôle de l'étendue d'action ;
- les règles métier sont imposées par le backend et non uniquement par l'interface.

Ce modèle constitue désormais le socle métier à partir duquel les diagrammes UML et l'architecture technique pourront être construits.
