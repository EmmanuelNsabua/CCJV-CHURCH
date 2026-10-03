# Spécification fonctionnelle

## Site web — Centre Chrétien Jésus ma Vie (CCJV)

*Version de base (MVP), en cohérence avec le cahier des charges.*

---

## 1. Arborescence du site public

1. **Accueil**
2. **Qui sommes-nous**
3. **Organisation** (adultes / enfants / départements)
4. **Événements**
5. **Publications / Médias**
6. **Contact**

---

## 2. Détail des pages publiques

### 2.1 Accueil

- Bandeau avec logo CCJV et message de bienvenue
- Horaires des cultes (adultes et enfants)
- Aperçu des 2-3 prochains événements
- Aperçu des dernières publications (vidéos/photos/annonces)
- Liens vers les autres sections

### 2.2 Qui sommes-nous

- Histoire de l'église
- Vision / valeurs
- Localisation (adresse, éventuellement carte)

### 2.3 Organisation

- Présentation du volet « Adultes »
- Présentation du volet « Enfants »
- Liste des départements (rubrique générique, alimentée via le back-office — voir §4.4)
- Pour chaque département : nom, courte description, responsable (optionnel)

### 2.4 Événements

- Liste des événements à venir, triés par date
- Fiche événement : titre, date, heure, lieu, description, image (optionnelle)
- Archivage automatique des événements passés (masqués de la liste principale)

### 2.5 Publications / Médias

- Liste de publications (vidéo, photo ou texte + image)
- Chaque publication : titre, type, date, contenu (lien vidéo ou image), courte description
- Affichage simple en grille ou liste chronologique

### 2.6 Contact

- Adresse et coordonnées de l'église
- Bouton « Contacter par WhatsApp » — redirige vers une conversation WhatsApp avec le numéro de l'église (lien type `wa.me`)

---

## 3. Espace d'administration (back-office)

### 3.1 Authentification

- Connexion par identifiant / mot de passe
- Un seul rôle « Administrateur » dans cette première version

### 3.2 Tableau de bord

- Vue d'ensemble : nombre d'événements à venir, dernières publications

### 3.3 Gestion des événements

- Créer / modifier / supprimer un événement
- Champs : titre, date, heure, lieu, description, image

### 3.4 Gestion des départements

- Créer / modifier / supprimer un département
- Champs : nom, description, responsable (optionnel)

### 3.5 Gestion des publications

- Créer / modifier / supprimer une publication
- Champs : titre, type (vidéo / photo / texte), contenu, description, date

### 3.6 Gestion des pages statiques

- Modifier le contenu des pages « Accueil » et « Qui sommes-nous » (textes principaux)

---

## 4. Modèle de données (aperçu)

| Entité | Champs principaux |
| --- | --- |
| Événement | id, titre, date, heure, lieu, description, image |
| Département | id, nom, description, responsable |
| Publication | id, titre, type, contenu, description, date |
| Utilisateur (admin) | id, identifiant, mot de passe (haché) |
| Page statique | id, clé (accueil/qui-sommes-nous), contenu |

---

## 5. Règles de gestion

- Un événement passé n'apparaît plus dans la liste des événements à venir, mais reste consultable dans un historique (optionnel en V1).
- Les publications sont affichées par ordre chronologique décroissant.
- Seul l'administrateur peut créer/modifier/supprimer du contenu ; le site public est en lecture seule.

---

## 6. Hors périmètre (V1)

- Espace membre / connexion pour les visiteurs
- Paiements en ligne (dons, etc.)
- Multi-éditeurs avec droits différenciés par département
- Notifications automatiques (e-mail/SMS) pour les événements