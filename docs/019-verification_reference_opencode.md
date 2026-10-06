# 019 — Vérification des allégations de `docs/017`

> **Objet :** confronter le rapport de reconnaissance OpenCode (`docs/017`) à
> l'état réel du dépôt, avant de bâtir le backend dessus.
> **Méthode :** chaque allégation vérifiable a été testée sur le disque, pas
> reprise sur parole. Les commandes sont reproductibles.

---

## 1. Verdict global

Le rapport `docs/017` est **de bonne qualité sur le fond métier** — les
contradictions documentaires, les besoins d'authentification, les contraintes de
sécurité et les ambiguïtés de modèle sont correctement identifiés et se sont
tous révélés exacts. Sa **cartographie du code, en revanche, est périmée** : le
frontend a été remanié après sa rédaction.

---

## 2. Allégations exactes

| Allégation | Vérification |
| --- | --- |
| `PrayerRequestForm.tsx` existe et n'appelle aucun backend | ✅ Confirmé |
| `EventsSection.tsx`, `ParallaxImage.tsx` existent | ✅ Confirmés |
| `public/media/` contient 41 fichiers | ✅ 41 |
| `public/images/` contient 41 originaux | ✅ 41 |
| Aucun appel réseau dans `src/` | ✅ Aucun `fetch`, aucun client API |
| Contradiction `is_archived` entre `docs/005` et `docs/006` | ✅ Réelle — 4 mentions dans `005`, 3 dans `006` qui le supprime |
| Le frontend ne persiste pas `is_archived` | ✅ Les 2 seules occurrences sont des **commentaires** (`types/index.ts`, `lib/utils.ts`) |
| Ambiguïté sur `Leader`, `Testimony`, `CommunityFace` absents du schéma 5 tables | ✅ Confirmée et traitée (`docs/018` §4.2) |
| 5 pôles sans page dédiée, sans redirection | ✅ Conforme au code |

---

## 3. Allégations inexactes

| Allégation (`docs/017`) | Réalité constatée |
| --- | --- |
| « 30 routes observées » | **21** fichiers `page.tsx` |
| `/qui-sommes-nous/ce-que-nous-croyons` existe | **Absent** |
| `/qui-sommes-nous/d-ou-nous-venons` existe | **Absent** |
| `/organisation/departements` existe | **Absent** |
| `/organisation/responsables` existe | **Absent** |
| `features/events/EventCard.tsx` « observé mais inutilisé » | **Le fichier n'existe pas** |
| `features/departments/DepartmentCard.tsx` « observé mais inutilisé » | **Le fichier n'existe pas** |
| `features/departments/DepartmentFeature.tsx` | **Le dossier `features/departments/` n'existe pas** |

Conséquence : la liste de routes de `docs/017` §3.1 **ne peut pas servir de
référence** pour l'intégration frontend. C'est `frontend/src/app/` qui fait foi.

---

## 4. Ce que `docs/017` ne pouvait pas voir

Ces éléments sont apparus après sa rédaction et n'ont donc pas pu être signalés :

1. **Le frontend a été restructuré** : pôles de retour (`/qui-sommes-nous`,
   `/organisation`), sous-pages supprimées, routes renommées
   (`parcours-nouveau`, `priere-et-intercession`).
2. **`PrayerRequestForm` a été ajouté** — il **simule** l'envoi
   (`setTimeout`) en affichant « Votre demande a bien été reçue ». C'est un faux
   système, non documenté, qui a motivé la création de l'entité
   `prayer_requests` (`docs/018` §3).
3. **Des fichiers de travail non commités** existaient
   (`organisation/page.tsx`, `OrganisationExplorer.tsx`, `DepartmentModal.tsx`),
   signe que le frontend était encore en cours de modification.

---

## 5. Conclusion opérationnelle

Le backend a été conçu sur le **modèle de données** (stable : `docs/005`,
`docs/006`, `frontend/src/types/index.ts`) et **non** sur l'arborescence des
routes (instable). C'est ce qui permet à l'API de rester valide malgré les
remaniements successifs du frontend : les entités `Department`, `Event`,
`Publication`, `Leader`, `Testimony`, `CommunityFace` n'ont pas changé, seules
leurs adresses ont bougé.

Les sept contradictions listées par `docs/017` §17 ont été arbitrées une par une
dans `docs/018` §1, en faveur du document le plus récent et du contrat
réellement implémenté dans le frontend.
