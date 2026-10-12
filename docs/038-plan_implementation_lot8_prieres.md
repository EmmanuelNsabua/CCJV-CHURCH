# 037 — Plan d'implémentation du Lot 8 (Demandes de prière)

> **Destinataire.** Ce document est un **plan d'exécution** destiné à un agent
> d'implémentation qui n'a pas participé à la conception. Il ne remplace pas
> `docs/030` : **il l'ordonne**. Toute divergence entre ce plan et `docs/030` se
> tranche en faveur de `docs/030`, et doit être signalée.
>
> **État au moment de l'écriture.** Les lots 0 à 7, 9 (partiel), 10 et 12
> (partiel) sont livrés : 8 migrations appliquées, 510 tests verts, 70 opérations
> OpenAPI. Le Lot 8 est le **seul lot majeur non commencé**, et le seul dont la
> migration est destructrice.

---

## 1. Pourquoi ce lot est différent des autres

Le domaine des prières n'est pas « un module de plus ». Trois propriétés le
distinguent, et chacune interdit les raccourcis habituels.

1. **La garantie est cryptographique, pas déclarative.** `docs/028` D-03 : le
   `SUPER_ADMIN` « possède tous les pouvoirs du système » **sauf** celui-là, et le
   refus doit tenir « **cryptographiquement**, pas seulement par une policy »
   (D-10, D-11). Conséquence directe : **aucune clé maître n'est accessible au
   backend**. Un agent qui implémenterait un chiffrement serveur avec une clé en
   variable d'environnement aurait livré l'inverse de la spécification.
2. **Le refus ne doit rien divulguer.** D-10 interdit au `SUPER_ADMIN` le contenu,
   le **nombre**, les dates et les métadonnées. Un compteur à zéro, une liste vide
   porteuse d'un `total`, ou un `404` au lieu d'un `403` sont des fuites. Le
   §4.5 de `docs/029` en fait une règle générale de non-fuite.
3. **L'opération est irréversible.** `docs/033` prévoit la suppression de
   `public.prayer_requests` après bascule. Elle est **destructrice** et doit être
   préparée, prouvée par `npm run db:verify`, et exécutée sur décision explicite.

---

## 2. À lire avant d'écrire la première ligne

Par ordre d'autorité décroissante :

| Document | Ce qu'on y cherche | Pourquoi c'est indispensable |
| --- | --- | --- |
| `docs/030` (1 288 lignes) | **La spécification cryptographique complète** : format `EncryptedData` (§3), structures de stockage (§3.6), gestion des clés (§4), isolation des rôles (§4.6), audit et notification (§5, §6), écarts (§9) | C'est la seule source. Aucune décision de chiffrement ne peut être prise ailleurs. |
| `docs/032` §5.3 | Le schéma `prayer_private` : `prayer_request`, `data_key_envelope`, `crypto_key`, `prayer_audit_event`, et la frontière avec `public` | Les noms de tables, colonnes et contraintes y sont normatifs. |
| `docs/032` §3.3 et §3.7 | `notifications`, `notification_outbox`, `audit_log` | Le découpage des trois registres (public / isolé / outbox) y est décidé. |
| `docs/028` | D-10, D-11, D-15, D-16, D-17, D-22 | Les décisions qui contraignent tout le lot. |
| `docs/029` §2.8, §4.4, §4.5, §6.2 | Les cellules RBAC des prières, l'ordre **contractuel** de la chaîne, les cas négatifs N-01 → N-07 | Un test négatif oublié est un refus non vérifié. |
| `docs/033` | L'étape de migration (destructrice) et sa place dans la séquence | La bascule doit être ordonnée, pas improvisée. |

**Consigne d'arrêt immédiate.** Si `docs/030` s'avère ambigu ou incompatible avec
le schéma `docs/032`, **s'arrêter et documenter précisément l'écart** — ne jamais
« simplifier » une garantie de confidentialité pour avancer. C'est la consigne du
commanditaire, mot pour mot.

---

## 3. Ce qui existe déjà et doit être réutilisé (ne pas réécrire)

| Élément | Fichier | État |
| --- | --- | --- |
| `PrayerPolicy` (P-06) | `presentation/policies/prayer.policy.ts` | **Écrit.** Exclusion D-10 évaluée **avant** la table (donc pour toute action future) ; `READ`/`READ_AGGREGATE`/`VALIDATE`/`DECRYPT` réservés à `ADMIN` ; `DECRYPT` exige en outre une **clé enveloppée nominative** dans la ressource ; `SUBMIT` refusé à tout rôle administratif ; `DELETE` et `PURGE` refusés à tous (Q-19, D-16) |
| `NotificationPolicy` (P-09) | `presentation/policies/notification.policy.ts` | **Écrit.** Toute notification du domaine des prières est refusée hors `ADMIN` — `SUPER_ADMIN` **compris**, y compris pour les clés (`docs/030` §4.7, §6.2) |
| Table `notifications` + trigger D-10 | `drizzle/0004_complete_guardian.sql` | **Appliqué et prouvé** : `PRAYER_REQUEST_RECEIVED` ne peut viser qu'un `ADMIN` **actif** ; `KEY_*` jamais un `SUPER_ADMIN` |
| Contrainte `site_settings_no_prayer_secret` | `drizzle/0005_late_hiroim.sql` | **Appliqué** : aucune clé `prayer|crypto|dek|recovery|kek|master` ne peut être rangée dans les paramètres |
| `verify-migrations.ts` | `scripts/verify-migrations.ts` | **Outil** : prouve une migration par exécution dans une transaction annulée, avec sondes déclaratives. À étendre de sondes crypto. |
| `openapi-contract.test.ts` | `tests/integration/` | **Outil** : refuse toute route non documentée **et** toute route documentée inexistante |

**Règle de travail.** Le lot 8 **ajoute** des policies et des sondes ; il ne
modifie pas les policies existantes. Toute modification d'un lot livré doit être
justifiée dans le message de commit.

---

## 4. Séquence d'implémentation (14 étapes)

Chaque étape est **livrable et vérifiable seule**. Ne pas enchaîner deux étapes
sans `tsc` + `npm test` verts.

### Étape 1 — Assimiler `docs/030` et produire une note de conformité

- Lire `docs/030` **intégralement** (§1 à §9).
- Produire `docs/038-note_conformite_lot8.md` : pour chaque exigence numérotée de
  `docs/030`, une ligne `exigence → où elle sera implémentée → test qui la prouve`.
- **Critère d'acceptation** : aucune exigence sans test associé ; tout écart
  identifié est listé en tête, avec une proposition de résolution.
- **Ne rien coder avant cette étape.**

### Étape 2 — Schéma `prayer_private` (ADDITIF, non destructif)

- Créer le schéma `prayer_private` et ses quatre tables d'après `docs/032` §5.3 :
  `prayer_request`, `data_key_envelope`, `crypto_key`, `prayer_audit_event`.
- Le **nouveau** `prayer_request` n'a **pas** de colonne de contact : `D-17` et
  XD-17 exigent que `requester_contact` ne survive « nulle part ».
- Migration **additive** (`CREATE SCHEMA`, `CREATE TABLE`), sans effet sur
  `public.prayer_requests` qui reste intact à ce stade.
- **Critères** : `npm run db:migrate` vert ; `npm run db:verify` étendu de sondes
  (insertion valide acceptée, `NOT NULL` respectés) ; aucune route touchée ;
  `npm test` vert.
- **Piège** : ne pas modifier le schéma `public` à cette étape. La bascule est
  l'étape 11.

### Étape 3 — Isolation des privilèges (`docs/030` §4.6)

- Créer le rôle PostgreSQL applicatif des prières et ses droits (`GRANT`/`REVOKE`)
  selon §4.6 : le rôle qui écrit dans `prayer_private` **ne peut pas** écrire dans
  `public.notifications` — c'est la raison d'être de `notification_outbox`.
- **Critères** : un test d'intégration tente une écriture croisée et **doit** être
  refusé par PostgreSQL. Ce test est la preuve de l'isolation ; sans lui, §4.6
  n'est qu'une intention.

### Étape 4 — Domaine : format `EncryptedData` et contrats de crypto

- Types du domaine (`domain/prayer/`) : `EncryptedData` exactement tel que
  `docs/030` §3 le définit, `KeyEnvelope`, `KeyPurpose`, `KeyStatus`.
- **Aucune** implémentation cryptographique à cette étape : uniquement les types et
  les **ports** (`CryptoService` abstrait, cf. §9 de `docs/024`).
- **Critère** : `tsc` vert, et un test qui vérifie que le type `EncryptedData` ne
  porte **aucun** champ de contenu en clair (test structurel, comme celui des
  notifications).

### Étape 5 — Implémentation cryptographique `CryptoService` (côté serveur : enveloppes)

- Implémenter **uniquement** les opérations que le serveur doit faire :
  création de paire RSA-OAEP-4096, **enveloppement** d'une DEK pour un
  destinataire, stockage des clés publiques, **jamais** de déchiffrement de
  contenu avec une clé serveur.
- Paramètres cryptographiques : **reprendre littéralement ceux de `docs/030` §3 et
  §4** (algorithme, taille de clé, mode, dérivation). Ne pas choisir soi-même un
  paramètre : toute valeur doit être citée du document, avec sa référence.
- **Critères** : tests unitaires sur des vecteurs connus ; un test vérifie qu'un
  enveloppement ne peut être ouvert que par le destinataire prévu.

### Étape 6 — Chiffrement **côté client** et contrat de soumission publique

- Le texte de l'intention est chiffré **dans le navigateur** ; l'API reçoit
  `EncryptedData` + les enveloppes, **jamais** de clair (`docs/030` §2.3).
- Route publique : `POST /api/v1/prayer-requests` — sans authentification, avec
  **rate limiting dédié** (le module existant en a déjà un : 5 dépôts/heure/IP) et
  validation stricte du format.
- **Critères** : un test d'intégration vérifie qu'un corps contenant un champ de
  texte en clair est **refusé** en `400` ; un autre vérifie que la réponse de
  création ne contient **ni texte, ni prénom, ni contact** (c'est déjà le
  comportement du sérialiseur existant — le préserver).
- **Test négatif N-07** : `ADMIN`, `SUPER_ADMIN`, `MANAGER` reçoivent `403` sur
  `POST /prayer-requests` (déjà garanti par `PrayerPolicy.SUBMIT`).

### Étape 7 — Lecture : `ADMIN` seul, `SUPER_ADMIN` jamais

- Câbler `PrayerPolicy` sur les routes administratives :
  `GET /prayer-requests`, `GET /prayer-requests/:id`,
  `PATCH /prayer-requests/:id` (`VALIDATE`).
- **Ordre contractuel** (`docs/029` §4.4) :
  `Request → Auth → PrayerPolicy → DENY/ALLOW → Repository → CryptoService`.
  Le `CryptoService` ne doit **jamais** être atteint après un refus.
- **Critères** — les cas négatifs d'abord, testés au niveau service avec doubles :
  - **N-01** `SUPER_ADMIN` sur la collection → `403`, **aucun compteur**, aucune
    liste vide informative ;
  - **N-02** `SUPER_ADMIN` sur une demande → `403`, et **aucun accès au
    repository** (assertion sur le double : `findById` non appelé) ;
  - **N-03** `SUPER_ADMIN` avec `?limit=1` → `403`, **aucune requête SQL** ;
  - **N-06** `DEPARTMENT_MANAGER` → `403`.
- **Piège** : le refus doit être **constant**. Deux refus de causes différentes
  (« non autorisé », « inexistante ») doivent produire une réponse identique.

### Étape 8 — Déchiffrement : clé enveloppée nominative (D-11)

- `PrayerPolicy.DECRYPT` exige que `envelopeRecipientIds` contienne l'identifiant de
  l'acteur. Le service doit **charger les enveloppes** et refuser avant tout appel
  au déchiffrement.
- **Critères** : un `ADMIN` sans enveloppe est refusé (`403`) ; un `ADMIN` avec
  enveloppe passe ; **N-05** un `SUPER_ADMIN` ne dispose d'**aucun chemin
  d'appel** (test structurel : aucun code ne lui fournit de clé).

### Étape 9 — Audit isolé et notification par outbox

- `prayer_private.prayer_audit_event` : registre **disjoint** de `public.audit_log`.
  **Aucun** événement `PRAYER_*` ne doit apparaître dans le registre public, dont la
  lecture est ouverte au `SUPER_ADMIN` (`docs/030` A11, écart E2).
- Notification : écriture dans `notification_outbox` (§6.2) avec
  `{ referenceId = requestId } ` et **aucun contenu** ; le trigger D-10 de
  `public.notifications` s'applique au transfert.
- **Critères** : **N-04** aucune notification de prière n'est créée ni délivrée
  pour un `SUPER_ADMIN` ; un test vérifie qu'aucune ligne de `audit_log` ne porte
  d'action `PRAYER_*` ; un test vérifie que l'outbox ne contient que des
  identifiants et des horodatages.

### Étape 10 — Récupération des clés : partage 2-of-3 **hors application**

- Implémenter la récupération telle que `docs/030` §4 la spécifie : le secret est
  partagé en **trois fragments**, dont **aucun** n'est détenu par le
  `SUPER_ADMIN` ni stocké en ligne dans un registre qu'il peut lire.
- **Consigne absolue** : ne pas créer de « clé de secours » accessible au backend.
  `docs/030` §5.5 : « toute forme de clé de secours en ligne recréerait exactement
  O3 et est interdite ». La contrainte `site_settings_no_prayer_secret` (migration
  0005) ferme déjà la voie la plus évidente.
- **Critères** : un test vérifie qu'aucune table du schéma **public** ne contient de
  fragment ; un test vérifie que deux fragments suffisent et qu'un seul ne suffit
  pas.

### Étape 11 — Bascule des données et **migration destructrice** (Étape É de `docs/033`)

- À ne faire **qu'après** que les étapes 2 à 10 soient vertes et que la bascule ait
  été prouvée par `npm run db:verify`.
- Séquence : recopier les demandes existantes (0 en base aujourd'hui, à vérifier),
  vérifier l'égalité des comptes, **puis** `DROP TABLE public.prayer_requests`.
- **Critères** : `db:verify` étendu de sondes « la table cible existe, la table
  source est absente, aucun nom de table orphelin » ; sauvegarde préalable
  documentée ; **exécution sur décision explicite du commanditaire**, jamais
  automatique.
- **Piège** : c'est l'opération que le mandat classe en règle d'arrêt. Elle doit
  être présentée prête à exécuter, pas exécutée d'office.

### Étape 12 — Politique de conservation (D-16)

- **Aucune purge automatique.** Aucune durée de conservation n'est arbitrée :
  n'inventer ni « 90 jours », ni « 1 an », ni aucune valeur. XD-16 l'interdit
  explicitement, et `PrayerPolicy.PURGE` refuse déjà tout le monde.
- Si le commanditaire veut une purge, elle se décide **avant** d'être codée.

### Étape 13 — Administration : comptage et validation

- Le `PATCH` de validation (marquage « prise en charge ») est réservé à l'`ADMIN`.
- Tout compteur exposé à l'`ADMIN` doit être **absent** pour les autres — et
  jamais présent dans une réponse de refus.
- **Critère** : `PRAYED`/`NEW` restent les seuls statuts, avec le libellé de la
  matrice `docs/029` §2.8 (Q-25 non tranchée : ne pas en inventer d'autres).

### Étape 14 — Contrat, tests et rapport

- Documenter dans OpenAPI **chaque** route ajoutée (le test
  `openapi-contract.test.ts` refusera l'oubli — c'est son rôle) ;
- ajouter les sondes de `db:verify` correspondant aux nouvelles contraintes ;
- exécuter la matrice négative `docs/029` §6.2 (N-01 → N-07) **au canal policy et
  service** — le canal HTTP exige un compte de test provisionné et un jeton réel,
  impossible à forger (les jetons sont vérifiés par JWKS) ;
- produire un rapport : fichiers, migrations, tests, résultats, risques résiduels.

---

## 5. Traps connus — chacun a déjà coûté du temps dans ce projet

| Piège | Ce qui se passe | Comment l'éviter |
| --- | --- | --- |
| **Chiffrement côté serveur** | La spécification exige le chiffrement **dans le navigateur** ; un chiffrement serveur recrée exactement la faille O3 | Relire `docs/030` §2.3 et §5.5 avant de concevoir |
| **Clé maître en variable d'environnement** | D-11 l'interdit ; le `SUPER_ADMIN` lirait tout | Aucune clé de déchiffrement de contenu côté backend |
| **Contenu dans un journal** | Une ligne de log suffit à divulguer | Aucun champ de contenu dans les appels au logger ; relire chaque `logger.*` ajouté |
| **Compteur ou liste vide dans un refus** | D-10 interdit « ni nombre » | Le refus est un `403` constant, sans corps utile |
| **`public.audit_log` pour les prières** | Ce registre est lisible par le `SUPER_ADMIN` | Registre disjoint `prayer_audit_event` |
| **FK vers `prayer_private` depuis `public`** | Franchit la frontière de privilèges (`docs/030` §4.6) | `notification_outbox.prayer_request_id` **sans** `REFERENCES` |
| **Trois droits déduits l'un de l'autre** | D-21 l'interdit (vaut aussi pour les accès média du cycle de clés) | Tester la permission **demandée**, jamais une autre |
| **Migration destructrice lancée « pour voir »** | Perte irréversible | `db:verify` d'abord ; exécution sur décision explicite |
| **`ALTER TYPE … ADD VALUE` + usage dans la même transaction** | PostgreSQL refuse d'employer une valeur ajoutée dans la transaction qui l'a créée | Deux migrations distinctes (déjà rencontré au Lot 4) |
| **Colonne `NOT NULL` sur table peuplée** | `ADD COLUMN … NOT NULL` sans défaut échoue | Séquence *nullable → renseignement → NOT NULL* |

---

## 6. Commandes de vérification (à exécuter à chaque étape)

```bash
cd backend
npx tsc --noEmit                 # types
npm test                         # 528 tests aujourd'hui, à faire croître
npm run lint                     # oxlint — 0 erreur exigée
npm run build                    # build de production
npm run db:generate              # « No schema changes » attendu si le schéma est aligné
npm run db:verify                # prouve les migrations SANS les appliquer
npm run db:selftest              # prouve que le harnais de sondes SAIT échouer
npm run openapi                  # régénère le contrat (puis npm test)
```

### Base de test, et mode strict

Deux garanties exigent une base **PostgreSQL réelle** et ne peuvent pas être
vérifiées par des doubles : la règle globale des 3 sous concurrence
(`tests/integration/publication-quota.test.ts`) et la validité des migrations. La
base d'exploitation ne convient pas pour la première — la règle étant globale,
publier une quatrième ligne y archiverait une publication **réellement en ligne**.
Un cluster local jetable la remplace :

```bash
# 1. cluster de test (une fois), sur 127.0.0.1 uniquement
initdb -D "$LOCALAPPDATA/ccjv-pgtest/data" -U postgres --auth-host=trust --locale=C -E UTF8
pg_ctl -D "$LOCALAPPDATA/ccjv-pgtest/data" -l "$LOCALAPPDATA/ccjv-pgtest/postgres.log" \
       -o "-p 55432 -c listen_addresses=127.0.0.1" start
createdb -h 127.0.0.1 -p 55432 -U postgres ccjv_test

# 2. schéma du projet sur cette base (jamais l'inverse)
DATABASE_URL='postgresql://postgres@127.0.0.1:55432/ccjv_test' npm run db:migrate

# 3. vérification complète : aucun test ignoré
REQUIRE_DATABASE=1 TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/ccjv_test' npm test

# arrêt
pg_ctl -D "$LOCALAPPDATA/ccjv-pgtest/data" stop
```

`TEST_DATABASE_URL` n'a **aucun repli** sur `DATABASE_URL`, et le test refuse de
s'exécuter si le nom de la base ne se termine pas par `_test` ou si elle contient
une publication étrangère : une erreur de configuration échoue avant la première
écriture.

**Règle de preuve.** Aucun lot n'est déclaré terminé sans : `tsc` = 0, tests
verts, et une **preuve d'exécution** pour chaque garantie nouvelle (sonde
`db:verify`, test négatif, ou assertion structurelle). Un test qui passe pour la
mauvaise raison est plus dangereux qu'un test absent — plusieurs harnais faux ont
déjà été corrigés dans ce projet, dont un qui ne testait rien parce que la
transaction était avortée ; l'inventaire exact est dans
`docs/039-audit_harnais_verification.md`.

**Trois états à ne jamais confondre.** Un test **réussi** a exercé le
comportement, un test **ignoré** ne l'a pas exercé (Jest l'annonce : `Tests: … skipped`),
un test **non exécuté** n'a pas été lancé du tout. Un rapport vert qui contient
des tests ignorés n'est pas une preuve de ce qu'ils couvrent. C'est pourquoi
`REQUIRE_DATABASE=1` existe : sans lui, une base injoignable produit un vert
trompeur ; avec lui, l'indisponibilité est un **échec**. Les deux commandes à
retenir :

```bash
npm test                              # usage courant — la suite de quota s'annonce IGNORÉE
REQUIRE_DATABASE=1 TEST_DATABASE_URL=… npm test   # vérification — rien n'est ignoré
```

---

## 7. Définition de « terminé » pour le Lot 8

1. Le texte d'une demande est chiffré **côté client**, et le backend ne détient
   aucune clé qui permettrait de le lire.
2. Le `SUPER_ADMIN` obtient `403` sur **toute** lecture de prière, sans contenu,
   sans nombre, sans dates — et n'a **aucun chemin d'appel** vers le déchiffrement.
3. `npm test` couvre N-01 → N-07 au canal policy/service, et le dépôt public est
   rate-limité.
4. Aucune ligne de journal, de notification ou de réponse API ne contient de
   contenu, de nom ou de contact.
5. La récupération est un partage **hors application** ; aucun fragment n'est
   stocké en ligne.
6. L'audit des prières est **disjoint** du registre public.
7. `public.prayer_requests` est supprimée **sur décision explicite**, après preuve
   par `db:verify`.
8. Le contrat OpenAPI documente les routes ajoutées, et `openapi-contract.test.ts`
   est vert.
