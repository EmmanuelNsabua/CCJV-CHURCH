# Cahier des charges

## Site web — Centre Chrétien Jésus ma Vie (CCJV)

---

## 1. Contexte et présentation

Le Centre Chrétien Jésus ma Vie (CCJV) est une église basée à Lubumbashi, en République Démocratique du Congo. Elle organise des activités pour ses membres adultes et pour les enfants, ainsi que des départements spécifiques (chorale, etc.).

L'église souhaite se doter d'une identité numérique afin d'augmenter sa visibilité, de mieux faire connaître ses activités et de faciliter la communication avec ses membres et le public.

## 2. Objectifs du projet

- Présenter l'église, sa vision, ses activités et son organisation.
- Informer sur les événements (cultes, activités des enfants, rencontres des départements).
- Publier des contenus multimédias (vidéos, photos, annonces).
- Offrir un espace d'administration permettant à l'église de gérer elle-même son contenu, sans dépendre d'un technicien.

## 3. Utilisateurs cibles

| Profil | Description |
| --- | --- |
| Visiteur | Toute personne consultant le site public (membres, sympathisants, nouveaux venus) |
| Administrateur | Personne(s) désignée(s) par l'église pour gérer le contenu du site |
| (Optionnel) Éditeur | Responsable d'un département pouvant publier dans sa rubrique |

## 4. Périmètre fonctionnel

### 4.1 Site public (vitrine)

- Page d'accueil : présentation générale, message de bienvenue, horaires des cultes
- Page « Qui sommes-nous » : histoire, vision, valeurs de l'église
- Organisation : présentation des volets (adultes, enfants) et des départements (chorale, etc.)
- Événements : liste des événements à venir, avec date, lieu, description
- Publications / Médias : galerie de vidéos et photos, annonces
- Page de contact : localisation, coordonnées, éventuellement formulaire de contact

### 4.2 Espace d'administration (back-office)

- Authentification sécurisée de l'administrateur
- Gestion du contenu des pages (textes, images)
- Gestion des événements (création, modification, suppression)
- Gestion des publications/médias (ajout de vidéos, photos, annonces)
- Gestion des départements et de leurs activités

### 4.3 Back-end

- API pour servir le contenu au site public et au back-office
- Base de données pour stocker pages, événements, médias, utilisateurs
- Stockage des fichiers médias (vidéos, images)

## 5. Contraintes

- **Connectivité** : le site doit rester léger et rapide, en tenant compte d'une connexion internet parfois limitée à Lubumbashi.
- **Simplicité d'usage** : le back-office doit être utilisable par une personne non technique.
- **Hébergement** : à définir (solution locale, régionale ou internationale) selon le budget disponible.
- **Évolutivité** : l'architecture doit permettre d'ajouter facilement de nouvelles rubriques ou fonctionnalités à l'avenir.

## 6. Livrables attendus

- Site web public (vitrine)
- Espace d'administration
- Documentation technique et fonctionnelle
- Éventuellement, un guide d'utilisation simple pour l'administrateur

## 7. Décisions retenues

- **Charte graphique** : basée sur le logo CCJV (vert, blanc/or, noir).
- **Départements** : la liste précise n'est pas encore connue. Le site prévoira une rubrique « Départements » générique, alimentable plus tard via le back-office, sans liste figée dans le code.
- **Niveau d'ambition** : version de base (MVP) pour cette première phase — fonctionnalités essentielles uniquement (vitrine, événements, publications simples, back-office basique). Les fonctionnalités avancées (formulaires complexes, multi-éditeurs, etc.) sont reportées à une phase ultérieure.

## 8. Points encore à préciser

- Budget et solution d'hébergement
- Délai souhaité de mise en ligne