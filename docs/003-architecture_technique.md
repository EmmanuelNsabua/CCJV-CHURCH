# Architecture technique

## Site web — Centre Chrétien Jésus ma Vie (CCJV)

*Version de base (MVP)*

---

## 1. Vue d'ensemble

Architecture classique en trois couches :

- **Front-end public** : site vitrine (accueil, organisation, événements, publications, contact)
- **Back-office** : interface d'administration protégée par authentification
- **Back-end / API** : logique métier, accès aux données, gestion des médias

```
[ Site public ]   [ Back-office ]
        \             /
         \           /
          [   API   ]
              |
      [ Base de données ]
              |
      [ Stockage médias ]
```

---

## 2. Choix technologiques proposés

Vu le profil full-stack (développement mobile et desktop également maîtrisé), voici une proposition cohérente et légère, adaptée à une V1 :

| Couche | Proposition | Justification |
| --- | --- | --- |
| Front-end public | Framework JS léger (ex. Next.js ou équivalent) | Rendu rapide, bon pour le référencement, s'adapte bien à une connexion limitée |
| Back-office | Même framework, en zone protégée, ou app séparée simple | Réutilisation du code, cohérence technique |
| Back-end / API | API REST (Node.js/Express ou équivalent) | Simplicité, large écosystème, bonne compatibilité avec le front |
| Base de données | PostgreSQL ou MySQL | Robuste, gratuit, bien documenté |
| Stockage médias | Stockage objet (local au serveur en V1, ou service cloud si budget le permet) | Vidéos/photos hors base de données |
| Authentification admin | Simple (identifiant/mot de passe, session ou token) | Un seul rôle admin en V1, pas besoin de complexité |

Ce choix reste indicatif : à ajuster selon vos préférences techniques et l'environnement d'hébergement retenu.

---

## 3. Contraintes liées au contexte (Lubumbashi, RDC)

- **Connectivité variable** : privilégier des pages légères, des images compressées, un minimum de scripts externes.
- **Vidéos** : plutôt qu'un hébergement direct de fichiers vidéo lourds, envisager l'intégration de vidéos hébergées sur YouTube/Facebook (économise bande passante et stockage).
- **Hébergement** : à trancher selon le budget — hébergement mutualisé simple, ou solution cloud avec offre gratuite/peu coûteuse pour démarrer (ex. Vercel/Render/Railway pour le front et l'API, base de données gérée).
- **Maintenance** : l'administrateur n'étant pas technique, prévoir une interface d'administration simple, sans configuration serveur à sa charge.

---

## 4. Sécurité (niveau de base)

- Mots de passe hachés (jamais stockés en clair)
- HTTPS obligatoire sur le domaine
- Limitation des tentatives de connexion au back-office
- Sauvegardes régulières de la base de données et des médias

---

## 5. Environnements

- **Développement** : local, sur la machine du développeur
- **Production** : un seul environnement pour la V1 (pas de pré-production nécessaire à ce stade)

---

## 6. Points à trancher avec le client

- Budget et hébergement définitif
- Nom de domaine souhaité
- Qui aura accès à l'administration (une ou plusieurs personnes)