# 039 — Audit des dispositifs de vérification du backend

> **Objet.** Le compte rendu de clôture du backend affirmait : « Trois harnais de
> vérification se sont révélés faux pendant ce travail — dont un qui annonçait
> quatre refus alors que la transaction était simplement avortée depuis la
> première violation. » Cet audit établit ce que cette phrase recouvre
> réellement, corrige ce qui doit l'être, et **réévalue la clôture** à partir des
> preuves disponibles.
>
> **Périmètre.** Les dispositifs de vérification uniquement : scripts de
> vérification, harnais de sondes, tests d'intégration concernés, utilitaires de
> test. Aucun module métier, aucun contrat d'API, aucun schéma, aucune migration.
>
> **État.** Audit conduit sur la base réelle du projet, `db:verify` et
> `db:selftest` exécutés, 22 suites et 522 tests verts.

---

## 1. Inventaire des dispositifs de vérification

| # | Dispositif | Chemin | Ce qu'il prétend vérifier | Nature |
| --- | --- | --- | --- | --- |
| V1 | Vérificateur de migrations | `backend/scripts/verify-migrations.ts` | que le SQL des migrations s'exécute sur *cette* base, et que les contraintes refusent ce qu'elles prétendent refuser | exécute PostgreSQL dans une transaction annulée |
| V1b | Catalogue de sondes | `backend/scripts/lib/migration-probes.ts` | les 14 comportements de contrainte (média, capacités, paramètres, notifications) | données pures |
| V1c | Harnais de sondes | `backend/scripts/lib/probe-harness.ts` | la **qualification** d'une observation : conforme, ou non, et pourquoi | pur + transactionnel |
| V1d | Empreinte de base | `backend/scripts/lib/database-fingerprint.ts` | que rien n'a été validé par accident (compteurs d'objets + contenu ligne à ligne) | SQL |
| V2 | Banc d'essai du harnais | `backend/scripts/verify-probe-harness.ts` | que V1 **sait échouer** : 14 contrôles exécutés | exécute PostgreSQL dans une transaction annulée |
| V3 | Contrat OpenAPI | `backend/tests/integration/openapi-contract.test.ts` | que le contrat et l'application montée disent la même chose, dans les deux sens | parcourt la pile Express, sans requête |
| V4 | Contrats HTTP | `backend/tests/integration/routes.test.ts` | contrats publics, validation, authentification, sécurité, garde de brouillon | requêtes HTTP réelles + PostgreSQL |
| V5 | Santé | `backend/tests/integration/health.test.ts` | `200 {status:'ok', database:'up'}` sur `/api/v1/health` | requête HTTP réelle |
| V6 | Utilitaires d'intégration | `backend/tests/helpers/database.ts` | disponibilité de la base, choix `describe` / `describe.skip` | sonde `select 1` |
| V7 | 20 suites unitaires | `backend/tests/unit/**` | policies (14 fichiers), services, schémas, règles de domaine, CLI | doubles, sans base |
| V8 | Vérificateur éditorial temporaire | `backend/scripts/__tmp_verify_editorial.ts` | cinq ressources éditoriales contre la **base réelle** | écrit puis restaure, hors transaction |

Deux harnais cités par les messages de commit **n'existent plus dans le dépôt** :
ils n'ont jamais été versionnés (voir §2.1 et §3).

---

## 2. Les harnais fautifs : ce que le dépôt établit

Le compte rendu parlait de « trois harnais ». Le dépôt en documente **six
instances de défaut, réparties sur cinq harnais distincts**. La correspondance
exacte avec le chiffre « trois » **ne peut pas être établie avec certitude**,
pour une raison précise : deux des harnais concernés étaient des scripts
temporaires, jamais commités, et le dépôt n'en conserve que la description dans
les messages de commit. La reconstruction qui suit s'en tient donc à ce qui est
**écrit ou exécutable**, et signale chaque déduction.

### 2.1 H1 — le harnais de sondes sans `SAVEPOINT` (Lot 5) : les « quatre refus »

| | |
| --- | --- |
| Chemin | **inconnu** — script temporaire, jamais versionné |
| Exigence visée | les huit comportements de la table `media_access` (Lot 5) |
| Résultat annoncé | 8 essais, dont 5 refus, table « Essai / Attendu / Observé » |
| Résultat réellement vérifié | **au plus 1 refus** — celui qui a avorté la transaction |
| Défaut | aucun point de retour entre les essais : après la première violation, PostgreSQL place la transaction en état avorté et refuse **toute** instruction suivante pour cette raison-là |
| Source | message de commit `fc234d2` (Lot 5), et l'en-tête de `verify-migrations.ts` qui porte la trace du défaut |

Le message de commit est explicite : « Un premier passage avait produit un faux
positif : sans `SAVEPOINT`, la première violation avortait la transaction et les
essais suivants échouaient pour une autre raison que celle qu'ils prétendaient
prouver. » Voir §3 pour la reconstitution chiffrée des quatre refus.

### 2.2 H2 — la sonde de doublon dont la fixture avait disparu (Lot 5)

| | |
| --- | --- |
| Chemin | **inconnu** — même script temporaire que H1 |
| Exigence visée | l'index unique partiel `media_access_department_unique` |
| Résultat annoncé | « seconde ligne, même département → refusé » |
| Résultat réellement vérifié | **rien** : la première insertion, appartenant à la transaction avortée, avait été annulée ; la seconde ne pouvait donc heurter aucune ligne |
| Défaut | la fixture de la sonde ne subsistait pas jusqu'à la collision |
| Source | message de commit `fc234d2` : « Un second essai de doublon était également invalide — le premier `insert` ayant été annulé, il n'y avait rien à heurter. » |

### 2.3 H3 — le parcours de la pile Express (Lot 10)

| | |
| --- | --- |
| Chemin | harnais de mise au point du test `openapi-contract.test.ts`, non conservé |
| Exigence visée | comparer les routes documentées et les routes réellement montées (`docs/026` §Lot 10) |
| Résultat annoncé | liste des opérations montées |
| Résultat réellement vérifié | liste **vide de tout préfixe** : les chemins étaient relatifs au sous-routeur |
| Défaut | Express 5 n'expose pas le chemin de montage d'un sous-routeur (`matchers` = fermetures opaques) ; la conclusion aurait pu être tirée d'une comparaison sans objet |
| Source | message de commit `06d902a` : « la liste produite était vide de tout préfixe, et les assertions auraient pu passer sans rien prouver » |

**Correction en place**, vérifiée dans le fichier actuel : la table explicite
`MOUNT_PREFIXES`, dont la complétude est contrôlée **avant** la construction des
listes (elle l'est désormais dans un `beforeAll`, voir §5.4).

### 2.4 H4 — la barre finale (Lot 10)

| | |
| --- | --- |
| Chemin | même harnais que H3 |
| Exigence visée | identité des chemins entre contrat et application |
| Résultat annoncé | un écart sur `/api/v1/notifications` |
| Résultat réellement vérifié | **aucun écart** : le harnais composait `/api/v1/notifications/` là où le contrat écrit sans barre finale. Il signalait un défaut inexistant |
| Défaut | composition d'URL naïve |
| Source | message de commit `06d902a` |

### 2.5 H5 — le vérificateur de migrations avant application (Lot 5 → Lot 9)

| | |
| --- | --- |
| Chemin | `backend/scripts/verify-migrations.ts`, révision antérieure à `ea80570` |
| Exigence visée | « les migrations sont testées sur copie » |
| Résultat annoncé | un rapport vert |
| Résultat réellement vérifié | **rien**, pour deux raisons cumulées |
| Défauts | (1) le script commençait par `0000`, déjà appliquée : il échouait sur son premier `CREATE TYPE` et ne vérifiait rien ; (2) aucun `SAVEPOINT` entre migrations, donc une migration déjà appliquée rendait les suivantes ininterprétables |
| Source | message de commit `ea80570`, section « DEUX DÉFAUTS DU SCRIPT, CORRIGÉS AVANT CONCLUSION » |

---

## 3. Le cas des « quatre refus » — reconstitution

### 3.1 Ce qui est exécuté, et dans quel ordre

Le harnais de H1 éprouvait huit comportements de `media_access`, dans cet ordre,
avec l'attendu publié au commit `fc234d2` :

| # | Essai | Attendu | Suit la 1re violation ? |
| --- | --- | --- | --- |
| 1 | grant valide (département, USE) | accepté | — |
| 2 | grant sans aucun droit (XD-09) | **refusé** | **← première violation** |
| 3 | département portant DELETE (XD-07) | **refusé** | oui |
| 4 | destinataire inexistant (trigger) | **refusé** | oui |
| 5 | profil portant DELETE (autorisé, D-21) | accepté | oui |
| 6 | seconde ligne, même département | **refusé** | oui |
| 7 | département ET profil, même identifiant | accepté | oui |
| 8 | horodatage incohérent | **refusé** | oui |

### 3.2 Le point exact où la transaction meurt

L'essai 2 viole la contrainte `media_access_at_least_one_right`. En PostgreSQL,
une erreur dans un bloc de transaction place la transaction en **état avorté** :
toutes les instructions suivantes sont refusées avec `25P02` (« current
transaction is aborted, commands ignored until end of transaction block »),
**quelle que soit leur conformité**. Aucun point de retour n'ayant été posé, rien
ne peut rétablir l'état.

### 3.3 Ce qui n'a jamais été atteint

Les essais **3, 4, 6 et 8** — les quatre refus qui suivent la première violation.
Ils n'ont jamais atteint la contrainte qu'ils visaient : leur « refusé » était
celui de la transaction morte, et il se serait produit **même si la contrainte
avait été absente**.

> **C'est là le chiffre « quatre ».** Il est reconstitué par arithmétique sur la
> table du commit, et non lu dans une sortie de console : le script n'a jamais
> été versionné, son rapport ne l'est donc pas non plus. Les essais 5 et 7, qui
> attendaient une **acceptation**, ne pouvaient pas passer pour des succès : ils
> auraient au contraire été signalés en échec. Le harnais était donc simultanément
> **complaisant sur les refus** et **menteur sur les acceptations** — les deux
> faces du même défaut.

### 3.4 Pourquoi le résultat affiché était trompeur

Le harnais enregistrait « l'opération a échoué ». Or **quatre causes distinctes**
produisent un échec :

1. la règle visée s'applique → le refus est une preuve ;
2. une **autre** règle s'applique → le refus n'est pas la preuve annoncée ;
3. la transaction est **avortée** → le refus ne prouve rien du tout ;
4. l'instruction est fautive (syntaxe, colonne, type) → le refus ne prouve rien.

Sans inspection du message ni du code SQLSTATE, ces quatre cas sont
indiscernables. C'est exactement ce que la correction devait rendre impossible.

### 3.5 Ce qu'il fallait prouver, et ce qui a été mis en place

La propriété métier (« la contrainte refuse X ») et la propriété transactionnelle
(« les effets sont annulés ») sont **séparées** en deux dispositifs :

- `lib/probe-harness.ts` : une sonde = un `SAVEPOINT` propre, exécution,
  observation, `ROLLBACK TO SAVEPOINT`, puis **qualification motivée**. Trois
  règles y sont structurelles, et non déclaratives :
  - un refus **doit** nommer sa règle (`motif` obligatoire — imposé par le type,
    contrôlé à l'exécution par `motifsManquants`) ;
  - un refus par une autre règle n'est **pas** conforme ;
  - un **avortement de transaction n'est jamais un refus** (`estAvortement`, code
    `25P02` ou message), **même si le motif de la sonde est écrit trop large**.
- `scripts/verify-probe-harness.ts` : l'exécution, sur la base réelle, de
  quatorze contrôles qui établissent que ce harnais **sait échouer**.

### 3.6 Preuve que les nouvelles assertions détectent un résultat incorrect

| Contrôle exécuté (`npm run db:selftest`) | Attendu | Observé |
| --- | --- | --- |
| 1. sans isolation, une violation avorte la transaction | 1re refusée (23514), 2e refusée (25P02) avec un message sans rapport | conforme — `current transaction is aborted…` |
| 2. avec un `SAVEPOINT` par sonde, la même écriture est acceptée | acceptée | conforme |
| 3a. une écriture acceptée ne satisfait pas une attente de refus | non conforme | non conforme |
| 3b. une écriture refusée ne satisfait pas une attente d'acceptation | non conforme | non conforme |
| 3c. un refus par une autre règle n'est pas conforme | non conforme | non conforme |
| 3d. le harnais n'est pas systématiquement négatif | conforme | conforme |
| 4a. `evaluateProbe` refuse un avortement, même avec `/.*/` | non conforme | non conforme |
| 4b. aucune sonde du catalogue réel n'accepte un avortement | 0 sur 14 | 0 |
| 4c. dans une transaction avortée, `runProbe` échoue au lieu de conclure | erreur `25P02` | erreur `25P02` |
| 5. chaque motif ne reconnaît que la règle qu'il vise | 0 ambigu, 0 sonde sans fixture | conforme |
| 6a. une écriture acceptée est visible, puis annulée par le `SAVEPOINT` | 1 puis 0 | conforme |
| 6b. rien ne survit à l'annulation finale | 0 avant, 0 après | conforme |
| 7. une erreur rattrapée resurgit à la fin de la transaction | rejet 22012, base inchangée | conforme |
| 8. l'empreinte voit une modification d'état, puis redevient identique | modifiée, puis identique | conforme |

**14 contrôles sur 14.** Le contrôle 6a a d'ailleurs **échoué à sa première
exécution**, et pour une raison juste : il comptait les lignes par une autre
connexion que celle de la transaction, donc il mesurait l'isolation entre
connexions et non l'effet de l'écriture. Le contrôle a été corrigé — pas
l'attente. C'est la démonstration que ces contrôles ne sont pas décoratifs.

---

## 4. Défauts découverts pendant l'audit

Ces défauts n'étaient pas connus au moment de la clôture. Ils concernent des
dispositifs **vivants**, c'est-à-dire ceux dont les résultats ont été présentés
comme des preuves.

### 4.1 Le vérificateur ne propageait pas l'échec d'une sonde

`verify-migrations.ts` affichait `!!!` pour une sonde non conforme, puis
**terminait avec le code 0**. Le décompte était imprimé, mais aucune commande ne
pouvait s'y fier : `npm run db:verify && …` continuait.

*Preuve de la sensibilité après correction* : un motif de sonde a été remplacé
temporairement par un motif volontairement faux. `db:verify` a alors produit
`!!! paramètres : clé de secours REFUSÉE`, `non conformes 1`, **code de sortie 1**.
Le motif a été restauré, et l'empreinte SHA-256 du fichier est **identique** avant
et après (`C94F2B77…75BD`), la commande repassant au vert.

### 4.2 Le rapport annonçait des migrations qui n'étaient pas exécutées

L'en-tête affirmait : « Les migrations sont donc jouées pour de vrai — types,
tables, index, contraintes, triggers — puis la transaction est annulée. » Après
l'application des huit migrations, **six sur sept** étaient refusées dès leur
première instruction (`already exists`) et donc **jamais exécutées** ; le
cinquième essai de la migration se contentait du premier refus et s'arrêtait là.
Le rapport affichait « AUCUNE n'est appliquée » et une ligne `OK` uniforme.

**Constat, après correction** (même base, même instant) :

| Verdict | Migrations |
| --- | --- |
| `EXÉCUTÉE` — SQL réellement exécuté | `0006` (14 instructions) |
| `MIXTE` — une partie exécutée, une partie déjà présente | `0003` (1/10), `0004` (1/8), `0008` (13/20) |
| `DÉJÀ APPLIQUÉE` — **SQL non exercé** | `0002`, `0005`, `0007` |
| `NON REJOUABLE` — rejeu impossible | `0001` (voir 4.3) |

Le résumé affiche désormais `SQL exercé pour 4/7 | SQL non exercé : 3 | échecs : 0`
et nomme les migrations non exercées. **Ce sont les sondes, et non les
migrations, qui portent la valeur de la vérification une fois le schéma
appliqué** : elles s'exécutent contre les tables réelles.

### 4.3 Une migration destructrice présentée comme vérifiée sans l'être

`0001` convertit `admin_profiles.role` en `text`, mais elle a créé elle-même une
contrainte `CHECK` qui référence l'énumération : rejouée, la conversion rend
cette contrainte inévaluable. Le vérificateur **d'avant l'audit**, exécuté pour
constater et non pour supposer, rapportait :

```text
--  0001_lowly_frightful_four.sql — DÉJÀ APPLIQUÉE (objets présents en base)
```

…alors que la version corrigée établit que l'instruction 3 échoue
(`operator does not exist: text = admin_role`). L'ancien script s'arrêtait au
premier « already exists » et **n'atteignait jamais l'instruction 3** : il
qualifiait de vérifiée une migration qu'il n'avait pas exécutée.

Le rejeu n'est pas *cassé*, il est **impossible** — l'état de départ n'existe
plus. Le vérificateur distingue donc maintenant les deux, en s'appuyant sur le
registre `drizzle.__drizzle_migrations` (celui qu'utilise `db:migrate`) :
`NON REJOUABLE — SQL NON exercé` pour une migration enregistrée, `ÉCHEC` sinon.
Toute erreur sur une migration **non enregistrée** reste un échec.

### 4.4 L'empreinte du rollback ne voyait pas les changements d'état

Elle comparait des **compteurs** (tables, fonctions, déclencheurs, profils,
médias, publications). Or une migration peut modifier des états sans changer
aucun compte : la règle des 3 archive une publication et en publie une autre, et
`publications` garde le même nombre de lignes. Un `COMMIT` accidentel de la
migration 0008 aurait pu passer pour « empreinte identique ».

L'empreinte couvre désormais, en plus des compteurs (colonnes, index, contraintes
et types inclus), le **contenu** de dix tables, ligne à ligne, par un `md5` de
`to_jsonb(ligne)` ordonné par le texte des lignes. Le contrôle 8 du banc d'essai
établit qu'elle **voit** une modification d'état et qu'elle redevient identique
après annulation.

### 4.5 Un test qui réussissait en assertant le contraire

`health.test.ts` porte le titre « répond 200 { status: 'ok' } à
GET /api/v1/health ». Quand la base est injoignable, il acceptait `503
{ database: 'down' }` et **passait**. Le contrat nominatif n'était donc jamais
exercé, et l'exécution était verte.

*Reproduit* : avec `DATABASE_URL` sur un hôte injoignable, `npm test` sort **0**
avec 128 tests ignorés et ce test « réussi ». Le mode strict existe désormais
(`REQUIRE_DATABASE=1`), et la branche tolerante **annonce** que le contrat
nominatif n'a pas été exercé.

### 4.6 Une base absente produisait un rapport vert

`describeIfDatabaseAvailable` renvoyait `describe.skip` : sans base, les deux
suites d'intégration disparaissaient du rapport sans que le code de sortie
change. `Tests: 128 skipped, 4 passed, exit 0` — mesuré, pas supposé.

Avec `REQUIRE_DATABASE=1`, l'indisponibilité **lève** au chargement : la suite est
rapportée en échec avec sa raison (`Test Suites: 2 failed`, exit 1). Le mode hors
ligne reste disponible, mais il n'est plus confondu avec une vérification.

### 4.7 Un script temporaire capable d'écrire dans la production

`scripts/__tmp_verify_editorial.ts`, marqué « à supprimer après exécution » dans
son propre en-tête, était toujours versionné, linté, et **modifie la base
réelle** (`site_settings`, contenu de `static_pages.accueil`, versets) avant de
restaurer l'état par comparaison — **sans transaction**. Une interruption entre
l'écriture et la restauration laissait les valeurs de vérification en ligne sur
le site.

Il est conservé (sa couverture n'est pas intégralement reprise ailleurs) mais son
exécution est devenue **explicite** : sans `--confirm`, il refuse de démarrer
(code de sortie 1, aucune connexion).

---

## 5. Corrections apportées

| Fichier | Nature | Justification |
| --- | --- | --- |
| `backend/scripts/lib/probe-harness.ts` | **nouveau** | extraction du harnais de sondes : `SAVEPOINT` par sonde, motif obligatoire pour un refus, `25P02` jamais accepté comme un refus, qualification motivée. Extrait pour être **exerçable** par le banc d'essai et par Jest |
| `backend/scripts/lib/migration-probes.ts` | **nouveau** | catalogue des 14 sondes (données pures, sans connexion) + les messages réels observés, matière du contrôle des motifs |
| `backend/scripts/lib/database-fingerprint.ts` | **nouveau** | empreinte des objets **et du contenu**, comparée par noms de tables ; extraite pour être éprouvée |
| `backend/scripts/verify-migrations.ts` | modifié | `SAVEPOINT` par instruction ; verdicts `EXÉCUTÉE` / `DÉJÀ APPLIQUÉE` / `MIXTE` / `NON REJOUABLE` / `ÉCHEC` ; registre drizzle ; **code de sortie 1** sur sonde non conforme ou migration en échec ; motifs resserrés (nom de contrainte, plus d'alternative générique) ; en-tête corrigé |
| `backend/scripts/verify-probe-harness.ts` | **nouveau** | 14 contrôles exécutés : le harnais **sait échouer**, et l'empreinte **sait voir** |
| `backend/tests/unit/probe-harness.test.ts` | **nouveau** | 12 tests sans base : qualification, avortement, structure du catalogue, motifs discriminants |
| `backend/tests/integration/openapi-contract.test.ts` | modifié | la route de santé est **lue** sur l'application (plus de booléen `health: true`) ; complétude des préfixes et garde-fous déplacés dans un `beforeAll`, donc non contournables par une exécution filtrée |
| `backend/tests/helpers/database.ts` | modifié | `REQUIRE_DATABASE=1` : l'indisponibilité de la base devient un échec au lieu d'une ignorance |
| `backend/tests/integration/health.test.ts` | modifié | la branche d'indisponibilité annonce que le contrat nominatif n'est pas exercé, et échoue en mode strict |
| `backend/scripts/__tmp_verify_editorial.ts` | modifié | exécution explicite (`--confirm`) ; en-tête décrivant le risque réel |
| `backend/package.json` | modifié | script `db:selftest` |

Aucune migration, aucun schéma, aucun module métier, aucun contrat d'API n'a été
modifié — `npm run db:generate` répond « No schema changes ».

---

## 6. Matrice d'audit

| Harnais / test | Exigence | Défaut constaté | Risque de faux positif | Correction | Preuve attendue |
| --- | --- | --- | --- | --- | --- |
| H1 sondes sans `SAVEPOINT` (Lot 5, non versionné) | 8 contraintes de `media_access` | transaction avortée dès la 1re violation ; 4 refus jamais éprouvés | **avéré** : 4 refus annoncés sans preuve | `SAVEPOINT` par sonde + motif obligatoire + `25P02` refusé | `db:selftest` contrôles 1, 2, 4a–4c |
| H2 sonde de doublon (Lot 5, non versionné) | unicité partielle par département | fixture annulée, rien à heurter | **avéré** | les deux insertions vivent dans le même `SAVEPOINT` | `db:verify` sonde 6 : `duplicate key … media_access_department_unique` |
| H3 parcours Express (Lot 10) | identité contrat / application | préfixes absents de la pile | **avéré** : comparaison sans objet | table `MOUNT_PREFIXES` + complétude contrôlée **avant** construction | `openapi-contract.test.ts` : 70 opérations comparées dans les deux sens |
| H4 barre finale (Lot 10) | identité des chemins | `/notifications/` vs `/notifications` | **avéré** : défaut inexistant signalé | `join()` normalise la barre finale | même test, assertion dédiée aux 7 routes des lots 5 et 7 |
| H5 vérificateur v1 (Lot 5 → 9) | « migrations testées sur copie » | partait de `0000` ; aucun `SAVEPOINT` inter-migrations | **avéré** : rapport vert sans vérification | `BASELINE` contrôlée par l'état de la base ; `SAVEPOINT` par instruction | `db:verify` : 7 migrations rapportées avec leur verdict réel |
| V1 code de sortie | un échec doit se propager | `!!!` puis exit 0 | **avéré** | `process.exitCode = 1` | mutation temporaire d'un motif → exit 1, puis restauration à empreinte identique |
| V1 rapport de migration | dire ce qui a été exécuté | 6/7 migrations non exécutées annoncées `OK` | **avéré** | verdicts explicites + registre drizzle + décompte | `db:verify` : `SQL exercé pour 4/7`, liste des non exercées |
| V1 empreinte | preuve du rollback | compteurs seuls ; états invisibles | **élevé** | empreinte de contenu sur 10 tables | `db:selftest` contrôle 8 |
| V3 contrat OpenAPI | contrat ⇒ application | `health: true` affirmé sans lecture ; garde-fous en `it` séparés | modéré | santé lue sur `app.router.stack` ; garde-fous en `beforeAll` | test : `get /api/v1/health` présent des deux côtés |
| V5 santé | `200 { ok, up }` | réussit en assertant `503 { down }` | **avéré** | branche tolerante annoncée ; `REQUIRE_DATABASE=1` en fait un échec | base injoignable : exit 1 en mode strict, exit 0 + avertissement sinon |
| V6 utilitaires d'intégration | suites d'intégration exécutées | base absente ⇒ suites ignorées, exit 0 | **avéré** | `REQUIRE_DATABASE=1` | 128 ignorés mesurés ; en mode strict, `Test Suites: 2 failed` |
| V8 script éditorial | cinq ressources éditoriales | écrit dans la production, hors transaction | opérationnel | exécution explicite (`--confirm`) | sans drapeau : refus, exit 1, aucune connexion |
| V4 contrats HTTP | permissions, validation, non-divulgation | aucun défaut trouvé | faible | aucune | 522 tests verts, dont 128 d'intégration sur base réelle |
| V7 suites unitaires | policies, services, règles | aucun défaut trouvé dans les assertions (codes d'erreur exacts partout) | faible | aucune | `tests/unit/**` : 20 suites |

---

## 7. Ce qui reste incertain

| # | Point | Nature | Portée |
| --- | --- | --- | --- |
| I1 | ~~**`publishWithQuota` n'est jamais exécuté par un test**~~ — **clos** | le double de `publication.service.test.ts` rejouait `planPublication` « sans transaction ni verrou », et son commentaire renvoyait la sûreté en concurrence « au repository, avec PostgreSQL » — sans qu'aucun test n'exerce la méthode réelle | **Preuve d'intégration écrite et exécutée** : `tests/integration/publication-quota.test.ts`, 6 tests sur une base PostgreSQL de test dédiée — quota, archivage de la plus ancienne, départage par `id ASC`, trois publications concurrentes observées en attente sur le verrou d'avis, puis chevauchement forcé. Contrôle de sensibilité exécuté : **verrou d'avis retiré → cinq publications en ligne au lieu de trois**, puis rétabli à l'identique (SHA-256 vérifié). Le commentaire du double est corrigé |
| I8 | ~~**La valeur rendue par `publishWithQuota` ne reflète pas l'état persisté**~~ — **défaut corrigé** | `return this.findById(id)` s'exécutait dans le bloc de transaction mais interrogeait `this.db`, donc une **autre connexion** du pool : elle ne voyait pas les écritures non validées, et rendait la ligne dans son état d'avant. Mesuré : `status: "DRAFT"` rendu contre `"PUBLISHED"` en base. `PublicationService.create`/`.update` renvoyant cette valeur telle quelle (lignes 67 et 121), `POST /api/v1/publications` avec `status: "PUBLISHED"` répondait `"DRAFT"` pour une publication en ligne | **Correction appliquée** (`publication.repository.ts`) : la ligne est relue **dans la transaction** (`tx.select()…`) puis passée à `hydrate`, réutilisé tel quel — la forme rendue reste exactement celle du contrat (`coverImageUrl` résolue depuis `media`). **Non-régression** : test `« rend la publication avec son statut réel, hydratée, comme en base »` de `publication-quota.test.ts`, qui compare l'objet rendu **champ par champ** (`toStrictEqual`) à l'état relu après validation, et vérifie le statut par SQL brut. **Sensibilité prouvée** : ancien `return this.findById(id)` rétabli temporairement → le test échoue (`Expected "PUBLISHED", Received "DRAFT"`), puis correction rétablie à l'identique (SHA-256 vérifié) → 6/6 verts. Contrôles : `tsc` 0, lint 0 erreur, build 0, **23 suites / 528 tests, 0 ignoré** (`REQUIRE_DATABASE=1` + `TEST_DATABASE_URL`), `db:selftest` 14/14, `db:verify` 14 sondes conformes et empreinte identique |
| I2 | **`db:verify` ne peut plus éprouver le SQL des migrations appliquées** | propriété de la méthode, pas un défaut : une migration appliquée n'est pas rejouable | 4/7 migrations non exercées aujourd'hui. Pour le Lot 8, l'étape destructrice **sera** exercée, puisqu'elle ne sera pas encore appliquée. Après application, elle cessera de l'être — c'est attendu et désormais affiché |
| I3 | **Vérification destructive de `0001` impossible** | l'état de départ n'existe plus | `NON REJOUABLE` affiché ; aucune conclusion ne peut être tirée de son rejeu |
| I4 | **Matrice HTTP de `docs/029` §6** | exige un compte de test provisionné : les jetons sont vérifiés par JWKS, un jeton ne peut pas être forgé depuis un test | reste hors d'atteinte par construction ; les cas négatifs sont couverts aux canaux policy et service |
| I5 | **`docs/032` — `static_pages.template`, `contract_version`, `schedule_entries.department_id`** | ajouts de schéma non livrés | sans effet sur les harnais ; relève du Lot 9 |
| I6 | **Identité provisoire du `SUPER_ADMIN`** | `superadmin@ccjv.local` reste un compte provisoire | à remplacer par l'identité désignée par l'organisation |
| I7 | **Lot 8 non commencé** | `public.prayer_requests` contient 0 ligne, la table est intacte | plan d'exécution dans `docs/038` |

---

## 8. Tableau de clôture

| Exigence / critère | État avant audit | Correction | Résultat après audit | Preuve | Statut final |
| --- | --- | --- | --- | --- | --- |
| Les migrations sont exécutées et prouvées, non appliquées | rapport vert **inexact** (6/7 non exercées) | verdicts explicites + registre | `SQL exercé pour 4/7`, non exercées nommées | `npm run db:verify` | `VALIDÉ` (avec I2 affiché) |
| La transaction de vérification est annulée | compteurs identiques | empreinte de contenu | identique, 10 tables comparées | `db:verify` + `db:selftest` contrôle 8 | `VALIDÉ` |
| Les contraintes refusent réellement (14 sondes) | 14 conformes, mais non fiable par construction | `SAVEPOINT`, motifs ancrés, `25P02` refusé | 14/14 conformes, chacune nommant sa règle | `db:verify` (messages de contraintes) | `VALIDÉ` |
| Le vérificateur sait échouer | **non** : exit 0 sur `!!!` | `process.exitCode = 1` | exit 1 sur sonde non conforme | mutation temporaire révoquée (SHA-256 identique) | `VALIDÉ` |
| Le harnais de sondes sait échouer | non établi | 14 contrôles | 14/14 | `npm run db:selftest` | `VALIDÉ` |
| Aucune sonde n'accepte un avortement de transaction | **faux** au Lot 5 (4 refus) | `estAvortement` + motif obligatoire | 0 sonde complaisante sur 14 | `db:selftest` 4a–4c ; Jest 6 cas | `VALIDÉ` |
| Le contrat OpenAPI reflète l'application | 2 harnais faux corrigés, 1 affirmation non lue | santé lue, garde-fous en `beforeAll` | 70 opérations comparées, deux sens | `openapi-contract.test.ts` | `VALIDÉ` |
| Une base absente ne produit pas un rapport vert | **faux** : 128 ignorés, exit 0 | `REQUIRE_DATABASE=1` | exit 1 en mode strict | mesure des deux modes | `VALIDÉ` |
| Le test de santé exerce son contrat nominatif | **faux** : réussissait sur `503` | mode strict + annonce | exit 1 si la base manque en mode strict | mesure des deux modes | `VALIDÉ` |
| Contrats HTTP, permissions, non-divulgation | 522 tests verts | aucune | inchangé | `npm test` | `VALIDÉ` |
| Départements, capacités, comptes, contenus | état vérifié | aucune | 10 départements, 5 capacités, 2 comptes, 3 `PUBLISHED` / 7 `ARCHIVED` datées, 0 `media_access` | lecture directe en base après tous les harnais | `VALIDÉ` |
| Règle des 3 — planification | 12 cas unitaires | aucune | inchangé | `publication-quota.test.ts` | `VALIDÉ` |
| Règle des 3 — application en migration | 3 `PUBLISHED` / 7 `ARCHIVED` | aucune | inchangé | lecture en base ; `db:verify` réexécute 0008 | `VALIDÉ` |
| Règle des 3 — application au **runtime** (transaction + verrou) | revendiquée, non exercée | `tests/integration/publication-quota.test.ts` | 3 publiées sous 3 transactions concurrentes ; 5 publiées si le verrou est retiré | `npm test` avec `TEST_DATABASE_URL` + `REQUIRE_DATABASE=1` | `VALIDÉ` |
| Rejeu de `0001` | présenté « DÉJÀ APPLIQUÉE » | registre drizzle | `NON REJOUABLE`, SQL non exercé | `db:verify --all` | `NON APPLICABLE` (état de départ disparu, démontré) |
| Matrice HTTP `docs/029` §6 | non exécutée | aucune | non exécutée | — | `BLOQUÉ` (jeton JWKS non forgeable, I4) |
| Lot 8 — demandes de prière | non commencé | aucune | non commencé | — | `NON APPLICABLE` (hors périmètre) |
| Clôture du goal du backend | déclarée complète | audit | **maintenue pour l'implémentation**, **nuancée pour la preuve** | voir §9 | `VALIDÉ` avec réserve I1 |

---

## 9. Conclusion sur la clôture

Les cinq notions doivent être distinguées, et elles ne se recouvrent pas :

| | État |
| --- | --- |
| **Implémentation terminée** | oui — lots 0 à 7, 9 (partiel), 10, 12 (partiel) livrés, 8 migrations appliquées |
| **Tests exécutés** | oui — 23 suites, **528 tests, aucun ignoré, aucun non exécuté** (avec `TEST_DATABASE_URL` et `REQUIRE_DATABASE=1` ; sans la base de test, 6 tests s'annoncent ignorés et ne prouvent rien) |
| **Tests fiables** | **oui après cet audit** ; ils ne l'étaient pas tous avant (quatre harnais faux corrigés aux lots 5 et 10, puis six défauts découverts ici) |
| **Exigences validées** | toutes celles revendiquées, **y compris** la sûreté en concurrence de `publishWithQuota` (I1) et son contrat de retour (I8), l'un et l'autre clos |
| **Goal clôturé** | maintenu pour l'implémentation ; les deux réserves qui portaient sur `publishWithQuota` (I1, I8) sont levées |

**Ce qui doit être retiré ou nuancé dans les conclusions antérieures :**

1. « Les migrations sont jouées pour de vrai puis la transaction est annulée » —
   **faux depuis l'application des migrations** ; il faut lire « le SQL de 4
   migrations sur 7 est exercé ; les autres sont déjà appliquées et leurs
   contraintes sont éprouvées par les sondes ».
2. « `db:verify` vert » — la valeur de ce vert a changé : avant, une sonde non
   conforme n'affectait pas le code de sortie, et `0001` était annoncée
   « DÉJÀ APPLIQUÉE » sans avoir été exécutée.
3. « La règle des 3 est appliquée » — **désormais prouvé de bout en bout** : le
   plan (12 cas unitaires), la migration (3 `PUBLISHED` / 7 `ARCHIVED` datées) et
   le chemin d'exécution sous concurrence (§I1, clos).
4. « Trois harnais faux » (compte rendu, et `docs/038` §6) — le dépôt en documente
   **six instances sur cinq harnais** ; le chiffre « trois » n'est pas
   reconstituable avec certitude (§2).

**Ce qui n'a pas besoin d'être retiré :** les corrections des lots 5 et 10,
`publishWithQuota` lui-même (le code n'a pas été touché), les contraintes en
base, les politiques d'autorisation, l'état des données.

---

## 10. Déclaration de périmètre

- **Code métier** : inchangé. Aucun fichier de `backend/src/**` n'a été modifié.
- **Contrats d'API** : inchangés. `openapi.json` et `openapi.yaml` n'ont pas été
  régénérés ; le test qui les compare a changé, pas le contrat.
- **Schéma de base de données** : inchangé. `npm run db:generate` répond
  « No schema changes, nothing to migrate ».
- **Migrations** : inchangées. Aucun fichier de `backend/drizzle/**` n'a été
  modifié, aucune migration n'a été appliquée.
- **Données** : inchangées. Tous les harnais exécutés écrivent dans une
  transaction annulée ou, pour le contrôle 7, dans une instruction qui ne peut
  rien écrire (`select 1/0`). État relevé après l'ensemble des exécutions :
  3 `PUBLISHED`, 7 `ARCHIVED` toutes datées, 0 `media_access`, 15 réglages,
  10 départements, 5 capacités, 2 comptes, 6 pages, 0 demande de prière publique.
- **Fichiers modifiés** : uniquement des dispositifs de vérification
  (`backend/scripts/**`, `backend/tests/**`, `backend/package.json`).
- **Travaux en cours préservés** : `frontend/**` et `docs/audit/_evidence/**`
  n'ont pas été touchés.

---

## 11. Prochaines actions, par ordre de nécessité

1. ~~**Écrire la preuve d'exécution de `publishWithQuota`** (I1)~~ — **fait** :
   `tests/integration/publication-quota.test.ts`, six tests sur base PostgreSQL de
   test, avec contrôle de sensibilité du verrou d'avis.
2. ~~**Corriger le commentaire du double** de `publication.service.test.ts`~~ —
   **fait** : il énonce désormais ce que le test unitaire vérifie (l'appel et ses
   arguments) et renvoie aux deux preuves réelles.
3. ~~**Ajouter `REQUIRE_DATABASE=1` aux commandes de vérification**~~ — **fait**
   dans `docs/038` §6, avec les commandes de provisionnement de la base de test.
4. ~~**Corriger le défaut I8** — la valeur rendue par `publishWithQuota`~~ —
   **fait** : relecture via `tx` dans la transaction, `hydrate` réutilisé, test de
   non-régression ajouté et sa sensibilité prouvée par mutation révoquée.
5. **Report de Lot 8** : étendre `createProbeCatalogue` de sondes
   `prayer_private`, et ajouter au banc d'essai les contrôles correspondants —
   les 14 contrôles actuels ne dépendent d'aucune table du Lot 8.
6. ~~**Mentionner `npm run db:selftest`** dans `docs/038` §6~~ — **fait**.
