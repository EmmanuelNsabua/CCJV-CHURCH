# 027 — Arbitrages et questions restantes avant implémentation

> **Objet :** enregistrer les décisions déjà tranchées par le commanditaire, puis
> lister les points qui restent à régler avant d'écrire du code.
> **Règle :** aucune de ces questions n'est tranchée par l'agent. `docs/025` §20
> interdit de modifier silencieusement une décision métier.

---

# 1. Décisions tranchées

## D-1 — Accès du Super Admin (résout le conflit C-1)

**Le Super Admin accède à tout le contenu, SAUF les demandes de prière.**

`021 §5.1 L154` prévaut sur `020 §4.1 L139`. Le refus porte sur l'entité entière,
pas seulement sur le texte déchiffré.

## D-2 — Création des responsables (résout le conflit C-2)

**L'Admin peut créer des responsables de département.**

`021 §7 L250` prévaut sur `020 §18 L726`. L'Admin ne peut pas créer de Super Admin.

## D-3 — Les quatre rôles théoriques (résout l'incohérence interne)

Trois rôles **techniques** :

```text
SUPER_ADMIN
ADMIN
DEPARTMENT_MANAGER
```

`DEPARTMENT_MANAGER` est l'entité technique **unique**. « Responsable Presse » et
« Responsable Ecodume » ne sont **pas** des rôles distincts : ce sont **deux
instances du même rôle**, différenciées par leur **département** rattaché.

Conséquence : le RBAC ne code **jamais** `PRESSE` ou `ECODUME` comme rôles
(`docs/025` §5.3). Les quatre « rôles » théoriques se lisent donc :
Super Admin · Admin · Responsable Presse · Responsable Ecodume — les deux derniers
étant une seule entité technique.

## D-4 — Événements globaux (résout DB-5)

**Un événement global n'existe pas.** `Event.department_id` est **obligatoire**
(`NOT NULL`) — la cardinalité `Department 0..1 — 0..* Event` envisagée par `022`
est **écartée**.

Le caractère « global » est une **conséquence du département émetteur** :

| Département émetteur | Portée de l'événement |
| --- | --- |
| **Presse** | **Global** — toute l'église est concernée |
| **Ecodume** | **Propre à l'Ecodume** — l'application doit l'identifier comme tel |

Cette règle **n'existe dans aucun des documents 020–025** : elle est apportée par le
commanditaire et doit être consignée comme décision métier de référence.

**À vérifier à l'implémentation :** cette sémantique est-elle portée par le
département Presse lui-même (un attribut du département), ou codée en dur ? La
réponse conditionne le Lot 6 et doit permettre d'ajouter un département plus tard
sans réécriture. → **Q-EV1**

---

# 2. Questions restantes, par ordre de blocage

Chaque question est numérotée pour permettre une réponse par renvoi.

## A. Identité et rôles — bloque le Lot 1 *(point de départ de tout)*

| # | Question |
| --- | --- |
| **Q-A1** | Un `DEPARTMENT_MANAGER` est-il rattaché à **un seul** département ? |
| **Q-A2** | Le `SUPER_ADMIN` a-t-il des pouvoirs que l'`ADMIN` n'a pas, au-delà de la gestion des comptes ? Lesquels ? |
| **Q-A3** | Le compte administrateur déjà créé en production devient-il `ADMIN` ou `SUPER_ADMIN` ? |
| **Q-A4** | Un `ADMIN` peut-il désactiver un autre `ADMIN` ? Et un `SUPER_ADMIN` ? |
| **Q-A5** | Un `DEPARTMENT_MANAGER` peut-il **publier directement**, sans validation préalable de l'`ADMIN` ? (`021 §7 L273` dit oui, `020 §10` laisse ouvert — conflit C-3 non tranché) |

## B. Départements — bloque le Lot 2

| # | Question |
| --- | --- |
| **Q-B1** | **Liste définitive** des départements à créer. Presse et Ecodume sont certains ; y a-t-il « Affaires Sociales » (cité une seule fois dans `022 L240-244` sous « Exemples de données ») ou d'autres ? |
| **Q-B2** | Que faire des départements **actuellement en base** (Adultes, Enfants/Ecodim, Chorale, plus 7 événements et 10 publications qui leur sont rattachés) ? Suppression, renommage, conservation ? |
| **Q-B3** | Un département peut-il être **désactivé** sans être supprimé ? |

## C. Renommage `Ecodim` → `Ecodume` — bloque les Lots 2 et 11

| # | Question |
| --- | --- |
| **Q-C1** | **Portée du renommage** : données + code + libellés frontend (97 occurrences), ou libellé d'affichage seulement ? |

## D. Événements — bloque le Lot 6

| # | Question |
| --- | --- |
| **Q-EV1** | La règle « Presse = global » est-elle portée par un **attribut du département**, ou codée en dur ? (détermine si un nouveau département peut être ajouté sans réécriture) |
| **Q-EV2** | Un Responsable Presse peut-il créer un événement **pour un autre département** ? |
| **Q-EV3** | Les événements ont-ils un **état** (brouillon / publié), ou sont-ils publiés dès leur création ? |

## E. Publications — bloque le Lot 4

| # | Question |
| --- | --- |
| **Q-P1** | **Archivage manuel** : en plus de la règle des 3, un responsable peut-il archiver une publication volontairement ? (`022 L272` dit non — déclencheur unique ; `023 L528` et `024 L831` disent oui — conflit C2-2 non tranché) |
| **Q-P2** | À **date égale**, comment départager « la plus ancienne » des trois ? (`created_at`, `id`, autre — `021 §8.3 L331` ne définit pas le critère de récence) |
| **Q-P3** | La règle des 3 s'applique-t-elle **par département** ou par couple département + type de publication ? |
| **Q-P4** | Un `DEPARTMENT_MANAGER` peut-il **lire** les publications d'un autre département dans le back-office ? (la lecture publique, elle, reste ouverte à tous) |
| **Q-P5** | Les publications `ARCHIVED` restent-elles **visibles publiquement** (archives consultables) ou disparaissent-elles du site ? |

## F. Médias — bloque le Lot 5

| # | Question |
| --- | --- |
| **Q-M1** | `USE` / `MANAGE` / `DELETE` : **hiérarchie** (DELETE implique MANAGE implique USE) ou **trois droits indépendants** ? (`023` se contredit : `§12 L574-580` contre `§12 L583` et `§18 D2 L789`) |
| **Q-M2** | Par défaut, un média téléversé par la Presse est-il utilisable par l'Ecodume ? Ou faut-il une autorisation explicite ? |
| **Q-M3** | Qui peut **supprimer** un média : son auteur, son département, ou l'`ADMIN` seul ? |
| **Q-M4** | **Types et taille** acceptés (le code actuel : JPEG/PNG/WebP/AVIF, 5 Mo — à confirmer) |
| **Q-M5** | Médias **orphelins** (téléversés puis non utilisés) : suppression automatique, ou conservation ? |

## G. Demandes de prière — **CRITIQUE**, bloque le Lot 8

> `docs/025` §Lot 8 exige une **mini-spécification validée avant tout code
> cryptographique**. Ces six questions la constituent.

| # | Question |
| --- | --- |
| **Q-PR1** | Le Super Admin est exclu du contenu. Peut-il voir qu'une demande **existe** (compteur, date) sans contenu, ou **rien du tout** ? |
| **Q-PR2** | **Modèle de clés** : une clé par Admin ? Une clé maîtresse scellée séparément pour chaque Admin ? Un secret partagé à seuil (k parmi n) ? |
| **Q-PR3** | **Récupération** : que se passe-t-il si **tous les Admins** perdent leur accès ? Les demandes deviennent-elles définitivement illisibles (assumé), ou existe-t-il un mécanisme de secours — et qui le détient ? |
| **Q-PR4** | **Rotation** : à quelle fréquence, et que deviennent les demandes chiffrées avec l'ancienne clé ? |
| **Q-PR5** | **Révocation** : quand un Admin quitte son service, comment son accès est-il retiré sans rendre les demandes illisibles ? |
| **Q-PR6** | Le **nom** du demandeur est-il chiffré comme le texte, ou traité comme métadonnée ? (il est facultatif ; `docs/025 §9` n'exige que le nom) |
| **Q-PR7** | **Rétention** : combien de temps conserve-t-on une demande archivée avant suppression définitive ? |
| **Q-PR8** | Les **données de contact déjà collectées** sur d'éventuelles demandes existantes : suppression définitive, ou conservation ? |

## H. Pages éditoriales — bloque le Lot 3

| # | Question |
| --- | --- |
| **Q-PG1** | Pour chaque page (Accueil, Qui sommes-nous, Organisation, Communauté, Vie de l'Église, Publications), quel est le **texte réellement éditable** ? Le code actuel expose 6 pages avec un ou deux champs ; faut-il aller plus loin ? |
| **Q-PG2** | Les **versets** sont-ils éditables par le back-office, ou restent-ils sous contrôle du code ? |

## I. Entités frontend à statuer — bloque le Lot 9

| # | Question |
| --- | --- |
| **Q-I1** | `Leader` (responsables), `Testimony` (témoignages), `CommunityFace` (visages) : **conservées** en base, ou supprimées et remplacées par du contenu éditorial ? |
| **Q-I2** | `Verse`, `ScheduleEntry` (rythme hebdomadaire), `SocialLink`, `SiteSettings` : idem. `docs/025` §Lot 9 avertit de **ne pas créer une table par type frontend** — ces tables existent déjà dans mon implémentation et doivent être justifiées ou retirées. |

## J. Contrat et exploitation — bloque le Lot 10

| # | Question |
| --- | --- |
| **Q-API1** | Je propose de **conserver** l'enveloppe de réponse `{data, meta}` et les 24 codes d'erreur déjà implémentés et couverts par 363 tests. Confirmez-vous ? |
| **Q-API2** | **Suppression** : définitive, ou réversible (corbeille / soft delete) ? |
| **Q-API3** | **Historique / audit** par ressource : nécessaire dès le MVP, ou plus tard ? |

---

# 3. Les trois questions qui débloquent le plus

Si vous voulez aller à l'essentiel pour démarrer :

1. **Q-A1, Q-A2, Q-A3, Q-A5** — sans elles, le Lot 1 (identité et autorisation) ne
   peut pas être conçu. C'est la primitive qui conditionne **tous** les autres lots.
2. **Q-B1, Q-B2, Q-C1** — sans elles, ni le Lot 2 ni la migration de données ne
   peuvent être écrits.
3. **Q-PR1 à Q-PR8** — sans elles, le Lot 8 (cryptographie) ne peut pas commencer ;
   et c'est le lot dont dépend la promesse de confidentialité faite aux fidèles.
