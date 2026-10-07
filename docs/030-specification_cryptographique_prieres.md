# 030 — Spécification cryptographique des demandes de prière

> **Statut :** Spécification **normative**. Elle doit permettre d'implémenter le Lot 8
> sans décision technique supplémentaire non signalée.
> **Nature :** livrable n° 1 de `docs/028` §11 (« Spécification cryptographique des
> prières — algorithme, format de l'enveloppe, détention du mécanisme de secours
> (D-12), procédure de rotation (D-13) et de révocation (D-14) »). **Préalable
> obligatoire au Lot 8** (`docs/025` §12 / §9 : « Ne jamais implémenter un
> chiffrement approximatif uniquement pour faire fonctionner le MVP. »)
> **Prévalence :** les décisions **D-10 à D-17** de `docs/028` sont arrêtées et
> prévalent sur `docs/022`, `023`, `024`, `025`. Ce document ne les rediscute pas :
> il choisit les moyens **techniques** qui les réalisent.
> **Honnêteté normative :** toute garantie qui ne peut pas être tenue techniquement
> est écrite comme telle (§1.5, §4.8, §5.6). Aucune confidentialité n'est promise
> que l'architecture ne permet pas.

---

# 0. Objet, périmètre et conventions

## 0.1. Objet

Définir, pour `PrayerRequest` : la cible de protection, l'algorithme, le format de
la donnée chiffrée, la gestion des clés, le cycle de vie complet (enveloppement,
déchiffrement, rotation, révocation, récupération, perte totale), l'archivage, la
notification, la journalisation, et la liste de ce qui ne doit jamais apparaître.

## 0.2. Périmètre

**Dans le périmètre :** `PrayerRequest`, son contenu, le nom du demandeur,
`EncryptedData`, le registre des clés publiques, les enveloppes de clés, le
mécanisme de secours, l'audit et la notification associés.

**Hors périmètre :** tout le reste de la plateforme (publications, médias, pages,
événements, notifications génériques), qui ne relève pas de cette spécification.
Le document ne produit aucun code d'implémentation : seules des signatures, des
structures de données et des pseudo-séquences sont autorisées (`docs/025` §21).

## 0.3. Termes

| Terme | Définition |
| --- | --- |
| **DEK** | *Data Encryption Key* — clé symétrique aléatoire, **unique par demande**, qui chiffre le contenu. |
| **Enveloppe** | Chiffrement de la DEK par la clé **publique** d'un destinataire (`DataKeyEnvelope`). |
| **Destinataire** | Détenteur d'une paire de clés enregistrée : un `ADMIN` (`ADMIN_DECRYPTION`) ou la custodie de récupération (`RECOVERY`). |
| **Custodie** | Ensemble des personnes détenant les fragments de la clé privée de récupération (D-12). |
| **Scellement** | Opération produisant une charge utile chiffrée destinée à un ensemble de destinataires. |
| **Desscelllement** | Opération inverse, réalisée **exclusivement dans un navigateur** (Admin) ou dans l'outil de cérémonie hors ligne. |
| **Magasin des prières** | L'ensemble `PrayerRequest` + `DataKeyEnvelope` + registre de clés + registre d'audit des prières. |
| **AAD** | *Additional Authenticated Data* — données non chiffrées mais authentifiées par l'AEAD. |

## 0.4. Références normatives

- `docs/028` **D-10** (le `SUPER_ADMIN` ne voit rien), **D-11** (chiffrement en
  enveloppe, clé par Admin, pas de clé maître backend), **D-12** (récupération
  contrôlée hors `SUPER_ADMIN`), **D-13** (rotation sur événement), **D-14**
  (révocation sans perte d'historique, 4 étapes), **D-15** (nom chiffré,
  `is_anonymous`), **D-16** (conservation indéfinie), **D-17**
  (`requester_contact` inexistant).
- `docs/025` §9 et §Lot 8 : refus **avant** tout déchiffrement ; contenu absent des
  notifications ; « aucune clé globale accessible au backend ».
- `docs/023` **L487** : « Le refus doit intervenir **avant le déchiffrement**. »
  L489-L503 : flux interdit `Super Admin ↓ API ↓ Repository ↓ CryptoService ↓
  Texte en clair ↓ 403`.
- `docs/024` **L1045** : « la clé permettant de déchiffrer les demandes de prière
  ne doit pas être simplement assimilée à un secret backend global ».
  L495 : un chiffrement à clé d'environnement est « insuffisant ».
  §9 L436-L458 et §23 L889-L899 : `SUPER_ADMIN → DENY` / « Le Super Admin reçoit
  `403` ».
- `docs/022` **L161-L163** : value object `EncryptedData` (`ciphertext`, `nonce`,
  `keyReference`) ; L144-L151 : `PrayerRequest` ; L470 : le Super Admin ne doit pas
  pouvoir obtenir le contenu en clair.

## 0.5. Décisions arrêtées par ce document / paramètres à confirmer

| # | Point | Statut |
| --- | --- | --- |
| A1 | **Aucune capacité de déchiffrement côté serveur** (aucune clé privée, aucune DEK, aucune fonction `decrypt`) | **Arrêté** |
| A2 | Chiffrement **côté client** (navigateur du visiteur pour la soumission, navigateur de l'Admin pour la lecture) | **Arrêté** |
| A3 | AEAD **AES-256-GCM**, nonce 96 bits, tag 128 bits, DEK 256 bits, **une DEK par demande** | **Arrêté** |
| A4 | Enveloppement **RSA-OAEP-4096/SHA-256** par destinataire | **Arrêté** (v1) |
| A5 | Clé privée Admin : **détenue par le client**, jamais transmise ; au repos, uniquement un blob chiffré local | **Arrêté** |
| A6 | Versionnage cryptographique explicite (`cryptoVersion`) et registre d'algorithmes embarqué | **Arrêté** |
| A7 | Remontée de version : nouvelle version = nouvelles demandes ; les anciennes restent sous leur version d'origine | **Arrêté** |
| A8 | Refus d'autorisation **au niveau du principal**, sans aucune lecture en base | **Arrêté** |
| A9 | Publication refusée (fail closed) s'il n'existe aucune clé `ADMIN` active ou aucune clé `RECOVERY` active | **Arrêté** |
| A10 | Ensembles d'enveloppes **contraints exactement** à l'ensemble actif des destinataires | **Arrêté** |
| A11 | Aucun événement de prière dans le journal d'audit général ; registre d'audit des prières séparé | **Arrêté** (écart vs `024` §27, justifié par D-10 — §9) |
| A12 | Bourrage (*padding*) du clair par paliers de 256 octets avant chiffrement | **Arrêté** |
| A13 | Longueur maximale du message et du nom (paramètres techniques) | **À confirmer** (proposition : 4 000 octets / 120 octets) |
| A14 | Seuil de la custodie : 2 parmi 3 (contre 3 parmi 5) | **À confirmer** |
| A15 | Identité nominative des dépositaires de la custodie | **À confirmer** (§8 Q1) |
| A16 | Isolation du magasin : niveaux 1 et 2 (§4.6) | **Niveau 1 arrêté ; niveau 2 à confirmer** |
| A17 | Révocation rétroactive (ré-écriture du contenu) des demandes déjà accessibles à un Admin révoqué | **À confirmer** (§8 Q3) |
| A18 | Un nouvel `ADMIN` obtient-il l'historique (ré-enveloppement) ou seulement les demandes futures ? | **À confirmer** (§8 Q5) |
| A19 | KDF du blob local et du fichier de sauvegarde : PBKDF2-HMAC-SHA-256 ≥ 600 000 itérations (Argon2id si intégré) | **Arrêté** (révisable) |
| A20 | Résistance post-quantique de l'enveloppement | **À confirmer** (§8 Q7) |

## 0.6. Règle générale d'implémentation

Aucun algorithme n'est implémenté à la main. Les primitives utilisées sont
**exclusivement** celles de `node:crypto` (OpenSSL) côté serveur et de
`crypto.subtle` (WebCrypto) côté navigateur : aucun AES, RSA, OAEP, bourrage ou
générateur écrit manuellement, aucune bibliothèque cryptographique tierce non
standard. La seule logique écrite à la main est le **format** (§3) et
l'**orchestration** (§5), tous deux couverts par des vecteurs de test figés
(Annexe A).

---

# 1. Modèle de menace

## 1.1. Actifs à protéger

| Actif | Description | Niveau de protection exigé |
| --- | --- | --- |
| **C1 — Contenu** | Le texte de la demande. | Absolu : illisible hors Admin autorisé (D-10). |
| **C2 — Nom** | Le nom du demandeur, s'il n'est pas anonyme. | Identique au contenu (D-15). |
| **C3 — Existence, nombre, dates** | Le fait qu'une demande existe, combien, quand. | Aucune visibilité applicative ; voir §1.5 pour la limite. |
| **C4 — Matériel cryptographique** | DEK, clés privées Admin, clé privée de récupération et ses fragments. | Jamais sur un serveur ; jamais dans un journal. |
| **C5 — Intégrité** | Le contenu déchiffré est bien celui enregistré, non échangé entre demandes. | Intégrité AEAD + liaison AAD (§3.4). |
| **C6 — Disponibilité** | La possibilité pour un Admin autorisé de lire la demande. | Assurée par la redondance d'enveloppes + la custodie ; **non garantie en cas de perte totale** (§5.6). |

## 1.2. Adversaires

| # | Adversaire | Pouvoirs supposés | Ce qu'il peut faire | Ce qu'il ne peut pas faire |
| --- | --- | --- | --- | --- |
| **A1** | **`SUPER_ADMIN`** (adversaire désigné par la conception) | Tous les droits applicatifs que D-03 lui accorde : comptes, rôles, configuration, journaux d'audit complets, administration globale. **Il n'a pas de droits sur les prières** et **n'a pas d'identifiants de base directe**. | Créer un compte `ADMIN` (chemin de contournement à venir, §4.8) ; consulter tout journal général ; modifier la configuration applicative. | Lire une seule demande, passée ou à venir, sauf par les quatre chemins résiduels explicités en §4.8 ; accéder au registre de clés via l'API autrement qu'en tant que principal authentifié ; obtenir les fragments de la custodie. |
| **A2** | **Accès à la base** (fuite de `DATABASE_URL`, sauvegarde volée, *dump* exfiltré, accès de l'hébergeur au stockage) | Lecture complète des tables du magasin des prières. | Lire `ciphertext`, `nonce`, `keyReference`, les enveloppes, les clés **publiques**, les dates, le nombre de lignes ; altérer ou supprimer des lignes. | Déchiffrer quoi que ce soit : aucune clé privée ni DEK n'existe dans le magasin. Backlog **définitivement** illisible. |
| **A3** | **Accès au backend** (RCE, compromission du processus Node, lecture des variables d'environnement, image de production) | Tout ce que contient le serveur : secrets applicatifs, `SUPABASE_SERVICE_ROLE_KEY`, code, mémoire du processus. | Lire les tables accessibles au rôle applicatif ; altérer le code ou la configuration ; servir un JavaScript modifié au navigateur d'un Admin ou d'un visiteur ; **lire les demandes futures** par substitution de clé publique (§4.8). | Déchiffrer le backlog : il n'y a rien à voler. Même pendant une soumission, il ne voit pas le clair : le chiffrement est fait dans le navigateur du visiteur (§2.3). |
| **A4** | **Admin légitime révoqué** | Sa clé privée, les enveloppes qu'il a copiées, tout clair qu'il a pu copier. | Continuer à lire **ce qu'il avait déjà** : rien ne peut le lui retirer rétroactivement (§5.4.5). | Lire toute demande créée après sa révocation : aucune enveloppe ne lui est plus destinée. |
| **A5** | **Adversaire réseau** | Interception, modification, rejeu sur le chemin visiteur ↔ API. | Observer les métadonnées de transport, rejouer une soumission. | Lire le clair : la charge utile est déjà chiffrée de bout en bout ; TLS est une défense supplémentaire, pas la protection principale. |
| **A6** | **Visiteur malveillant / robot** | Soumissions illimitées, charges utiles arbitraires et bien formées. | Saturer le stockage, soumettre du contenu illisible, fabriquer de fausses demandes (aucune authentification de l'émetteur n'existe). | Lire les demandes d'autrui (DEK strictement par demande, aucune clé partagée). |
| **A7** | **Fournisseur d'hébergement** | Même pouvoir qu'A2 et A3 combinés. | Voir §4.8 : capacités à venir, jamais le backlog. | Déchiffrer le backlog. |
| **A8** | **Demandeur lui-même** | Son propre contenu. | Lire sa propre demande (il l'a écrite). | Lire les autres demandes ; se réauthentifier ultérieurement (aucun compte visiteur). |

**Non traités (hors périmètre) :** compromission physique du poste d'un Admin,
extension de navigateur malveillante, ingénierie sociale sur un Admin, attaquant
quantique (voir §1.5 et Q7).

## 1.3. Ce que le système protège

1. **Le contenu et le nom contre tout adversaire qui ne détient pas une clé privée
   de destinataire** — y compris `SUPER_ADMIN`, la base, l'hébergeur, le backend,
   une sauvegarde volée, un ancien Admin (pour les données postérieures à sa
   révocation).
2. **La non-substitution de contenu** : un adversaire qui peut écrire dans la base
   ne peut pas échanger un contenu entre deux demandes ni échanger le message et le
   nom d'une même demande, ni fabriquer un contenu authentifié (intégrité AEAD +
   AAD liée, §3.4).
3. **L'invisibilité applicative pour `SUPER_ADMIN`** : aucun chemin, aucune route,
   aucune policy, aucun journal, aucune notification, aucun compteur, aucune
   métrique, aucun export (§5.2, §6.3).
4. **L'impossibilité pour le backend de lire, à tout moment et sans action
   malveillante de sa part**, une demande enregistrée : le backend ne détient
   aucune capacité de déchiffrement (§4.4). C'est la réalisation directe de
   `024` L1045 et de D-11.

## 1.4. Ce que le système ne protège pas (contre-mesures et limites)

| Limite | Nature | Réponse |
| --- | --- | --- |
| Un adversaire qui **contrôle le JavaScript servi** au navigateur d'un Admin au moment où celui-ci desscelle | Non empêchable par la cryptographie : le clair ou la DEK sont dans le navigateur de l'Admin. | Déploiement de production **hors du périmètre du rôle `SUPER_ADMIN`** (séparation des tâches), builds reproductibles, revue de code, CSP stricte, aucune dépendance tierce sur la page de lecture, journal d'audit des déploiements. **Détection, pas empêchement.** |
| Un adversaire qui **substitue une clé publique** au moment de la soumission (sur le serveur ou dans le JS public) | Impossible à prévenir : l'émetteur est anonyme et fait confiance à la page servie. | Les enveloppes produites restent **exactement** l'ensemble actif (A10) ; toute demande est affichée avec l'empreinte de ses destinataires : une clé inconnue est **visible** par tout Admin. Détection, pas empêchement. |
| **`SUPER_ADMIN` créant un compte `ADMIN`** | Chemin applicatif légitime selon D-03. | Il n'obtient d'enveloppes que pour les demandes **futures**, et son empreinte apparaît dans l'ensemble des destinataires de ces demandes. Fenêtre bornée, détectable (§4.8). |
| **Métadonnées** (nombre, dates, états) contre un adversaire d'infrastructure | Non protégeables : les lignes existent, et un Admin a besoin d'un ordre chronologique. | Isolation des identifiants et des rôles (§4.6) + absence totale de surface applicative. Contre un adversaire détenant le rôle **propriétaire** de la base ou une sauvegarde complète : **garantie non tenable**, écrite comme telle (§1.5, P3). |
| **Perte totale des clés privées Admin et de la custodie** | Conséquence assumée de l'absence de clé maître (D-11). | §5.6 : les données restent stockées (D-16) mais **définitivement illisibles**. Aucune récupération n'est possible. |
| **Authenticité de l'émetteur** | Formulaire public, aucun compte visiteur. | Le contenu déchiffré est intègre mais **non authentifié** : nul ne peut prouver qui l'a soumis. N'est pas un objectif. |
| **Fuite par un Admin autorisé** | Il lit légitimement. | Hors périmètre cryptographique ; l'audit enregistre chaque lecture (§6.3). |
| **Adversaire quantique** | RSA-4096 est vulnérable à un futur adversaire quantique capable de déchiffrer rétroactivement. | Le versionnage (§3.5) permet une v2 hybride sans migration des anciennes données ; **les demandes déjà enregistrées sous v1 ne peuvent pas être protégées rétroactivement** (Q7). |

## 1.5. Les quatre périmètres de garantie (formulation honnête)

| Périmètre | Objet | Statut | Condition |
| --- | --- | --- | --- |
| **P1 — Applicatif** | Toute forme de visibilité de `PrayerRequest` pour un `SUPER_ADMIN` agissant à travers la plateforme (API, back-office, notifications, journaux généraux, exports, compteurs, métriques, recherche). | **Tenable à 100 %** | Implémentation de §5.2 (refus au niveau du principal) et de §6.3 (audit séparé). |
| **P2 — Contenu et nom** | C1 et C2 contre tout adversaire qui n'est pas un destinataire légitime, y compris un accès complet à la base et au backend. | **Tenable** | Aucune clé privée ni DEK sur un serveur (§4.1, §4.4) ; custodie hors système (§4.5) ; code déployé honnête au moment de la lecture (§1.4). |
| **P3 — Métadonnées** | Nombre, dates, statuts, et le fait même qu'une demande existe. | **Non tenable** contre un adversaire détenant le rôle propriétaire de la base, une sauvegarde complète ou l'accès physique au serveur de base. | Tenable au niveau applicatif (P1) et contre un adversaire ne détenant que les identifiants du rôle applicatif principal (isolation §4.6). |
| **P4 — Capacité à venir** | Lecture des demandes **futures** par un adversaire qui contrôle le code déployé, le registre des clés, ou qui crée une identité `ADMIN`. | **Non tenable** : c'est une capacité *active*, délibérée, bornée dans le temps. | Détectable (§4.8), jamais rétroactive : aucun chemin ne permet d'atteindre le backlog. |

> **Énoncé de vérité, à conserver tel quel dans la documentation du projet :**
> *le chiffrement retiré ici supprime la capacité **permanente** de lecture (le
> backlog est définitivement illisible par quiconque n'a pas de clé privée de
> destinataire). Il ne peut pas supprimer la capacité **transitoire** d'un acteur
> qui contrôle le logiciel au moment où un secret est en clair dans un navigateur.
> Toute formulation promettant davantage serait inexacte.*

---

# 2. Algorithme et primitives

## 2.1. Vue d'ensemble du schéma retenu

```text
VISITEUR (navigateur)                          ADMIN (navigateur)
    │                                               │
    │ 1. GET /prayer-keys  → clés PUBLIQUES          │ clé privée détenue localement
    │ 2. DEK = aléa(32 o)                            │ jamais transmise
    │ 3. contenu = AES-256-GCM(DEK, bourré)          │
    │ 4. pour chaque destinataire :                  │
    │    enveloppe = RSA-OAEP(clé_publique, DEK‖id)  │
    │                                                │
    └──────────► API : que du chiffré ───────────────┘
                     │
                     │  persiste : ciphertext, nonce, keyReference, enveloppes
                     │  AUCUNE clé privée, AUCUNE DEK, AUCUNE fonction de déchiffrement
                     ▼
                 PostgreSQL (magasin des prières)
```

**Propriété structurante : le backend est un simple transporteur d'octets
chiffrés.** Il ne génère aucune clé, ne détient aucune clé privée, ne détient
jamais une DEK, et n'expose aucune opération de déchiffrement.

## 2.2. Primaire de chiffrement du contenu — **ARRÊTÉ**

| Paramètre | Valeur | Justification |
| --- | --- | --- |
| Algorithme | **AES-256-GCM** | AEAD standard, disponible dans WebCrypto et dans `node:crypto`, aucune dépendance, largement audité. |
| Taille de clé | **256 bits** (DEK) | Marge maximale pour un algorithme symétrique standard. |
| Nonce / IV | **96 bits (12 octets)**, **aléatoire** | Taille recommandée par NIST SP 800-38D pour GCM (traitement le plus efficace, sans dérivation interne). |
| Tag d'authentification | **128 bits** | Valeur maximale ; rejet strict de tout tag plus court. |
| Bourrage | Bourrage du clair à un multiple de **256 octets** avec préfixe de longueur (§3.3) | Empêche la déduction de la longueur du message à partir de la longueur du chiffré. |
| Une DEK par demande | **Oui** — usage : exactement 1 chiffrement de message + 1 chiffrement de nom, au maximum | Réutilisation de nonce **structurellement impossible** : une DEK neuve n'a aucun historique. |

**Protection contre la réutilisation de nonce — règle normative :**

1. Une DEK **ne doit jamais** chiffrer plus de deux valeurs (le message et,
   éventuellement, le nom) et **ne doit jamais** être réutilisée pour une autre
   demande. Toute réutilisation est un défaut critique.
2. Chaque nonce est produit par le CSPRNG (`crypto.getRandomValues`, 12 octets) et
   **comparé** au nonce déjà produit pour la même demande ; en cas d'égalité, un
   nouveau nonce est tiré (`do { … } while (nonce.equals(autre))`). Cette
   vérification est triviale et supprime même la collision théorique.
3. Le nonce **n'est jamais** dérivé du contenu, d'un compteur prévisible ou d'un
   identifiant. Un nonce déterministe est interdit.
4. À la lecture, un nonce de longueur **différente de 12 octets** doit être rejeté
   avant tout appel à la primitive (contrôle de forme, pas de tentative).

## 2.3. Lieu d'exécution du chiffrement — **ARRÊTÉ : côté client**

| Option | Description | Verdict |
| --- | --- | --- |
| **S1 — chiffrement serveur** | L'API reçoit le clair, génère la DEK et scelle. | **Rejeté.** Le clair transite par la mémoire du backend : un adversaire A3 peut en conserver une copie, et la DEK est connue du serveur — la garantie devient dépendante de l'honnêteté du code au moment de la soumission. Contredit l'esprit de `024` L495/L1045. |
| **S2 — chiffrement client (visiteur)** | Le navigateur du visiteur génère la DEK et scelle pour les destinataires. | **Retenu.** Le backend ne voit **jamais** le clair ni la DEK, même à la soumission. Aucune injection HTML/SQL possible depuis le contenu (le serveur ne manipule que `bytea`). Aucun outil d'observabilité (APM, *trace*, *breadcrumb*) ne peut capturer le clair. |

**Conséquence normative :** `SubmitPrayerRequest` ne comporte **aucune** étape de
chiffrement. L'API **valide la forme** du scellement (structure, longueurs,
ensemble des destinataires) et le **persiste tel quel**. Le nom `encrypt()` du
`CryptoService` conceptuel de `023`/`024` désigne désormais une opération exécutée
dans le navigateur ; côté serveur, le seul service crypto est un **validateur de
format** (§5.1), qui n'importe aucun primitif de déchiffrement.

## 2.4. Primaire d'enveloppement des clés — **ARRÊTÉ (v1)**

| Paramètre | Valeur | Justification |
| --- | --- | --- |
| Algorithme | **RSA-OAEP** | Chiffrement à clé publique disponible et stable dans WebCrypto **et** dans `node:crypto`, sans accord de clé ni dérivation supplémentaire à écrire. |
| Taille de clé | **4096 bits** | Horizon de conservation indéfini (D-16) ; marge de sécurité maximale pour un schéma RSA. |
| Fonction de hachage / MGF | **SHA-256** (MGF1-SHA-256) | Paramètre explicite, jamais implicite. |
| Charge utile d'une enveloppe | `0x01 ‖ DEK (32 o) ‖ requestId (16 o, UUIDv4 brut)` — 49 octets | Sous la limite OAEP-SHA-256 pour 4096 bits (446 octets). L'inclusion de `requestId` **lie l'enveloppe à sa demande** : une enveloppe transposée d'une ligne à une autre est rejetée par le destinataire. |
| Génération des paires | `crypto.subtle.generateKey` (navigateur) uniquement | Aucune paire de clés n'est générée par le backend. |

**Pourquoi pas X25519 / *sealed box* ?** Plus compact et plus rapide, mais
nécessite d'écrire un accord de clé éphémère et une dérivation HKDF, donc du code
cryptographique non standard à tester, pour un volume de données négligeable
(quelques demandes par jour). Le risque d'erreur d'implémentation est ici supérieur
au gain. Le mécanisme de version (§3.5) permet une v2 X25519 ou hybride sans
toucher aux données existantes.

## 2.5. Génération de l'aléa — **ARRÊTÉ**

| Aléa | Source | Longueur |
| --- | --- | --- |
| DEK | `crypto.getRandomValues` (navigateur, CSPRNG du système) | 32 octets |
| Nonce AES-GCM | idem | 12 octets |
| Identifiant de demande (`requestId`) | idem, UUIDv4 | 122 bits aléatoires |
| Sel PBKDF2 (blob local) | idem | 16 octets |

**Interdits :** `Math.random`, toute graine dérivée du temps, d'un compteur ou
d'une entrée utilisateur, tout générateur non cryptographique. Le navigateur doit
être en HTTPS (contexte sécurisé) : `crypto.subtle` y est indisponible autrement.

## 2.6. KDF et protection au repos de la clé privée Admin — **ARRÊTÉ**

| Usage | Paramètre |
| --- | --- |
| KDF | **PBKDF2-HMAC-SHA-256**, ≥ **600 000** itérations |
| Sel | 16 octets aléatoires, stockés à côté du blob |
| Chiffrement du blob | **AES-256-GCM**, nonce 12 octets, tag 128 bits |
| AAD du blob | `"ccjv-prayer-adminkey:v1:" ‖ userId ‖ ":" ‖ keyReference` |
| Politique de phrase secrète | ≥ 12 caractères ou ≥ 4 mots aléatoires, refusée si égale à un mot de passe connu compromis (liste locale) |
| Format du blob | `{ v:1, kdf:"PBKDF2-SHA256", iter:600000, salt, nonce, ciphertext, keyReference, userId }` |

Ce blob **ne quitte jamais l'appareil de l'Admin** : il vit dans l'`IndexedDB` du
navigateur et, pour la sauvegarde, dans un fichier exporté manuellement. Le serveur
n'en reçoit **jamais** copie (§4.3, option O2 rejetée). Argon2id est préférable si
une implémentation WASM est intégrée plus tard ; ce changement est une révision de
`kdf`, donc une nouvelle version de format de blob (`v:2`).

## 2.7. Ce qui est arrêté / ce qui reste à confirmer

**Arrêté par ce document :** AES-256-GCM, 96/128, DEK unique par demande, bourrage
par paliers, RSA-OAEP-4096/SHA-256, chiffrement côté client, structure d'enveloppe
liée à `requestId`, PBKDF2 600 k, versionnage de format, absence totale de capacité
de déchiffrement côté serveur.

**À confirmer avant implémentation (Q1-Q9, §8) :** paramètres de taille (A13),
seuil de custodie (A14), identité des dépositaires (A15), isolation de niveau 2
(A16), révocation rétroactive (A17), accès des nouveaux Admins à l'historique
(A18), choix post-quantique (A20).

---

# 3. Format de la donnée chiffrée

## 3.1. Value object `EncryptedData` (022 L159-L164) — repris et précisé

`EncryptedData` reste un **value object immuable du domaine**, avec exactement les
trois attributs du modèle statique.

| Attribut | Type | Contenu | Contraintes |
| --- | --- | --- | --- |
| `ciphertext` | `bytes` | Sortie AEAD **avec** son tag (le tag est concaténé en fin de flux, comme le produit `node:crypto`/WebCrypto). | Longueur ≥ 16 ; non vide. |
| `nonce` | `bytes` | Nonce AES-GCM. | Longueur **exactement 12**. |
| `keyReference` | `string` | Identifiant **non secret** du matériel protégeant ce chiffré. | Format imposé ci-dessous. |

**Format normatif de `keyReference` :**

```text
keyReference = "ccjv-prayer:v" <cryptoVersion> ":dek:" <requestId>
exemple      = "ccjv-prayer:v1:dek:9f1c2e40-3a5b-4d6e-8f70-1a2b3c4d5e6f"
```

Règles :

- `keyReference` identifie la **DEK de la demande** (donc sa version
  cryptographique et son instance) ; il ne contient **aucun** octet de clé et
  **aucune** empreinte de clé privée.
- Il est **stocké en clair** : ce n'est pas un secret. Il ne doit jamais être
  utilisé comme secret ni comme facteur d'authentification.
- Il est **immuable** pour une demande donnée : une rotation ne le modifie jamais
  (elle ajoute des enveloppes).

**Invariants du value object (à faire respecter par le constructeur) :**

1. Refus de construction si `nonce.length !== 12`, si `ciphertext.length < 16`, si
   `keyReference` ne correspond pas à l'expression `^ccjv-prayer:v[0-9]+:dek:[0-9a-f-]{36}$`.
2. Aucune méthode `decrypt`, aucune référence à une clé privée, aucune méthode
   `toString()` renvoyant le contenu.
3. Le value object ne peut pas être construit à partir d'un clair : la seule
   fabrique est `EncryptedData.fromSealedPayload(...)`.
4. Égalité structurelle par valeur (comparaison des trois attributs).

## 3.2. Sérialisation et structure exacte

### 3.2.1. Sur le fil (API) — JSON, base64 standard (sans `=` final facultatif toléré)

```json
{
  "cryptoVersion": 1,
  "requestId": "9f1c2e40-3a5b-4d6e-8f70-1a2b3c4d5e6f",
  "isAnonymous": false,
  "message": {
    "ciphertext": "<base64>",
    "nonce": "<base64, 12 octets>",
    "keyReference": "ccjv-prayer:v1:dek:9f1c2e40-3a5b-4d6e-8f70-1a2b3c4d5e6f"
  },
  "requesterName": {
    "ciphertext": "<base64>",
    "nonce": "<base64, 12 octets>",
    "keyReference": "ccjv-prayer:v1:dek:9f1c2e40-…"
  },
  "envelopes": [
    { "recipientKeyRef": "ADM-2f81…", "wrapAlgorithm": "RSA-OAEP-4096/SHA-256", "wrappedKey": "<base64>" },
    { "recipientKeyRef": "REC-2026-01", "wrapAlgorithm": "RSA-OAEP-4096/SHA-256", "wrappedKey": "<base64>" }
  ]
}
```

`requesterName` **doit être `null`** (absent) lorsque `isAnonymous` vaut `true`
(D-15 : aucun nom stocké). Il **doit être présent** sinon : le demandeur est alors
identifié par son nom seul (`docs/025` §9).

### 3.2.2. En base — `bytea`, jamais de base64

| Donnée | Type PostgreSQL | Remarque |
| --- | --- | --- |
| `ciphertext` | `bytea` | Jamais `text`, jamais `jsonb`. |
| `nonce` | `bytea` | `CHECK (octet_length(nonce) = 12)`. |
| `wrapped_key` | `bytea` | 512 octets pour RSA-4096. |
| `key_reference` | `text` | Contrainte de forme par `CHECK`. |

## 3.3. Bourrage du clair — **ARRÊTÉ**

Le clair de chaque champ est encodé puis bourré **avant** chiffrement :

```text
clair_champ = longueur_encodee (4 octets, big-endian, valeur = len(payload)) ‖ payload_utf8
bourre      = clair_champ ‖ 0x00 × (palier - (len(clair_champ) mod palier))      [palier = 256]
```

Le bourrage est retiré après déchiffrement en relisant les 4 premiers octets ; un
dépassement ou une incohérence provoque un **rejet** (échec d'authentification
logique, jamais une troncature silencieuse).

**Raison :** sans bourrage, `len(ciphertext) - 16` révèle la longueur exacte du
message à tout lecteur de la base (A2). Avec bourrage par paliers de 256 octets,
seul le palier est révélé.

**Statut de la déduction de longueur :** le palier reste visible. Ce point relève
de P3 (métadonnées non tenables) et est assumé.

## 3.4. AAD — liaison cryptographique — **ARRÊTÉ**

```text
AAD(cryptoVersion, requestId, champ) =
    UTF-8( "ccjv-prayer" ‖ 0x1F ‖ <cryptoVersion décimal> ‖ 0x1F ‖
           <requestId en minuscules> ‖ 0x1F ‖ <champ> )
où champ ∈ { "message", "name" }
```

`0x1F` (séparateur d'unité) empêche toute ambiguïté de concaténation.

**Ce que l'AAD garantit :**

| Attaque | Sans AAD | Avec AAD |
| --- | --- | --- |
| Échange du chiffré de la demande A vers la ligne B | Indétectable | Rejeté (identifiant différent). |
| Échange du chiffré `message` et du chiffré `name` d'une même demande | Indétectable | Rejeté (champ différent). |
| Rejeu d'un chiffré dans une autre version de format | Indétectable | Rejeté. |

L'AAD est **recalculée** par le destinataire à partir des colonnes stockées ; si
un adversaire A2 modifie `key_reference` ou `requestId`, le déchiffrement échoue.

**Enveloppe :** RSA-OAEP ne prend pas d'AAD ; la liaison est assurée par
l'inclusion de `requestId` dans la charge utile de l'enveloppe (§2.4). Le
destinataire **doit** vérifier que le `requestId` extrait correspond à celui de la
ligne avant d'utiliser la DEK ; toute discordance entraîne un rejet.

## 3.5. Versionnage du format — **ARRÊTÉ**

- `cryptoVersion` est un **entier monotone** stocké sur chaque demande et repris
  dans `keyReference` et dans l'AAD.
- Un **registre d'algorithmes embarqué dans le code** associe chaque version à ses
  paramètres. Les paramètres ne sont **jamais** stockés par enregistrement (aucune
  redondance, aucune possibilité de faire diverger une ligne).
- La version courante à la création est la plus élevée du registre. Une demande
  **ne change jamais** de version : toute évolution s'applique aux demandes
  futures.
- Le déchiffreur côté navigateur **dispatche sur la version** et refuse une
  version inconnue avec un message non technique (aucun détail interne).
- Retirer une version du registre est une **décision de sécurité** : elle rend
  illisibles les demandes qui en dépendent et exige une ré-écriture préalable
  (§5.3). Elle ne peut pas être silencieuse.
- Le registre v1 figure en **Annexe B**.

**Pourquoi ce versionnage est obligatoire :** D-16 impose une conservation
indéfinie. Sans version explicite, un futur changement d'algorithme rendrait
impossible toute migration cryptographique contrôlée, et un remplacement de
mécanisme (D-13) serait irréalisable.

## 3.6. Structure de stockage complète

### 3.6.1. Schéma `prayer_private` — `prayer_request`

| Colonne | Type | Contraintes |
| --- | --- | --- |
| `id` | `uuid` | **PK**, généré **par le client** (UUIDv4), unicité imposée ; doublon → `409`. |
| `crypto_version` | `smallint` | `NOT NULL`. |
| `message_ciphertext` | `bytea` | `NOT NULL`. |
| `message_nonce` | `bytea` | `NOT NULL CHECK (octet_length(message_nonce) = 12)`. |
| `message_key_reference` | `text` | `NOT NULL`, contrainte de forme. |
| `name_ciphertext` | `bytea` | `NULL` si anonyme. |
| `name_nonce` | `bytea` | `NULL` si anonyme ; sinon `CHECK (octet_length = 12)`. |
| `name_key_reference` | `text` | `NULL` si anonyme. |
| `is_anonymous` | `boolean` | `NOT NULL`. |
| `status` | `prayer_status` (`PENDING`,`ARCHIVED`) | `NOT NULL DEFAULT 'PENDING'`. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()`. |
| `validated_at` | `timestamptz` | `NULL` jusqu'à l'archivage. |

**Contrainte normative (D-15) :**

```sql
CHECK (
  (is_anonymous = true  AND name_ciphertext IS NULL
                        AND name_nonce IS NULL
                        AND name_key_reference IS NULL)
  OR
  (is_anonymous = false AND name_ciphertext IS NOT NULL
                        AND name_nonce IS NOT NULL
                        AND name_key_reference IS NOT NULL)
)
```

Cette contrainte rend **structurellement impossible** le stockage d'un nom pour une
demande anonyme.

**Interdictions de schéma :** aucune colonne `requester_contact`, `email`,
`phone`, `contact` (D-17) ; aucune colonne de clé privée, de DEK ou de fragment de
récupération ; aucune colonne `deleted_at` (D-16 : pas de purge).

### 3.6.2. `data_key_envelope`

| Colonne | Type | Contraintes |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `prayer_request_id` | `uuid` | `NOT NULL`, `REFERENCES prayer_request(id) ON DELETE RESTRICT`. |
| `purpose` | `envelope_purpose` (`ADMIN`,`RECOVERY`) | `NOT NULL`. |
| `recipient_key_ref` | `text` | `NOT NULL`, référence le registre des clés publiques. |
| `wrap_algorithm` | `text` | `NOT NULL` (`RSA-OAEP-4096/SHA-256`). |
| `wrapped_key` | `bytea` | `NOT NULL`. |
| `created_at` | `timestamptz` | `NOT NULL`. |
| `revoked_at` | `timestamptz` | `NULL` ; renseigné lors d'une révocation ou d'un ré-enveloppement. |

`UNIQUE (prayer_request_id, recipient_key_ref)` — le ré-enveloppement est un
**upsert idempotent**, historisé dans le registre d'audit (§6.3).

**Invariant de couverture (vérifié périodiquement, §5.4.4) :** toute demande doit
posséder **au moins une** enveloppe non révoquée dont la clé destinataire est
`ACTIVE` et de type `ADMIN`, **et** exactement une enveloppe non révoquée vers la
clé `RECOVERY` active.

### 3.6.3. `crypto_key` — registre des clés **publiques**

| Colonne | Type | Contraintes |
| --- | --- | --- |
| `key_reference` | `text` | PK (`ADM-<userId>-<n>` ou `REC-<année>-<nn>`). |
| `purpose` | `key_purpose` (`ADMIN_DECRYPTION`,`RECOVERY`) | `NOT NULL`. |
| `owner_user_id` | `uuid` | `NULL` si et seulement si `purpose = 'RECOVERY'`. Pas de clé étrangère inter-schéma (§4.6). |
| `public_key_spki` | `bytea` | `NOT NULL` (DER SPKI — **public**). |
| `fingerprint` | `text` | `NOT NULL UNIQUE` : `base32(SHA-256(SPKI)[0..19])` en groupes de 5. |
| `algorithm` | `text` | `NOT NULL` (`RSA-OAEP-4096/SHA-256`). |
| `status` | `key_status` (`ACTIVE`,`RETIRED`,`REVOKED`) | `NOT NULL`. |
| `wrap_generation` | `integer` | `NOT NULL` ; incrémenté à chaque événement de sécurité (D-13). |
| `created_at`, `activated_at`, `retired_at`, `revoked_at` | `timestamptz` | — |

**Aucune colonne de clé privée, sous aucune forme** — ni en clair, ni chiffrée, ni
encodée. Un test de schéma (Annexe A) vérifie qu'aucune colonne du schéma
`prayer_private` ne correspond à `private|secret|seed|share`.

### 3.6.4. Correspondance avec le modèle statique

`022` ne modélise que `PrayerRequest` et son `EncryptedData` (L143-L164). Les deux
entités `data_key_envelope` et `crypto_key` sont l'**implémentation nécessaire de
D-11** (« clé de données enveloppée pour chaque Admin autorisé ») : `022` §15
L667-L668 déclare explicitement ne pas fixer « la stratégie précise de chiffrement
des prières » ni « le modèle exact de plusieurs comptes Admin ». Il n'y a donc pas
de contradiction, seulement un comblement de vide autorisé.

---

# 4. Gestion des clés

## 4.1. Chaîne de clés complète

```text
contenu ──chiffré par──► DEK (32 o aléatoires, UNE par demande, jamais stockée)
                            │
                            ├──enveloppée pour──► clé PUBLIQUE Admin n°1
                            ├──enveloppée pour──► clé PUBLIQUE Admin n°2
                            └──enveloppée pour──► clé PUBLIQUE RECOVERY

Clé privée Admin n   : détenue par le navigateur de l'Admin n  → jamais sur un serveur
Clé privée RECOVERY  : découpée en fragments → custodie hors ligne → jamais sur un serveur
```

**Il n'existe aucune clé maître.** Aucune clé, à aucun niveau, ne permet à un
composant serveur de déchiffrer quoi que ce soit (D-11).

## 4.2. Génération de la DEK

| Étape | Acteur | Détail |
| --- | --- | --- |
| 1 | Navigateur du visiteur | `dek = crypto.getRandomValues(new Uint8Array(32))` |
| 2 | Navigateur du visiteur | Chiffre `message` (champ `"message"`) puis, si non anonyme, `name` (champ `"name"`). |
| 3 | Navigateur du visiteur | Enveloppe la DEK pour **chaque** destinataire actif. |
| 4 | Navigateur du visiteur | Efface best-effort les tampons de la DEK et du clair (`fill(0)`) après envoi. |
| 5 | API | Reçoit, valide la forme, insère, insère les enveloppes, **oublie tout** : elle n'a jamais eu la DEK. |

**Limite assumée :** JavaScript ne permet aucune effacement garanti (pas de
`memzero`, ramasse-miettes non déterministe). La DEK peut subsister quelques
instants dans la mémoire du navigateur du **visiteur** — qui connaît de toute façon
le contenu. Aucune DEK ne subsiste côté serveur.

## 4.3. Où vit la clé privée d'un Admin — **la question centrale**

| Option | Description | Verdict |
| --- | --- | --- |
| **O1 — Clé détenue par le client** | Paire générée dans le navigateur de l'Admin. Clé privée jamais transmise ; au repos, blob chiffré par phrase secrète (`§2.6`), conservé **localement** (IndexedDB + fichier de sauvegarde hors ligne). | **RETENU.** C'est la seule option qui rend la garantie réelle : le backend ne peut pas déchiffrer, même s'il le voulait. |
| **O2 — Clé dérivée d'un secret utilisateur** | Clé privée **dérivée** de façon déterministe d'une phrase secrète (PBKDF2 → graine → paire). | **REJETÉ.** Toute enveloppe volée (A2) devient un **oracle de vérification hors ligne** : un attaquant teste une phrase candidate en dérivant la clé et en tentant l'ouverture — sans avoir besoin d'aucun autre artefact. Une phrase secrète humaine est cassable hors ligne. De plus, la dérivation déplace le secret utilisateur d'un usage local à un usage global. |
| **O3 — Clé stockée chiffrée côté serveur** | Clé privée chiffrée par une KEK détenue par le backend (variable d'environnement, KMS, HSM applicatif). | **REJETÉ SANS AMBIGUÏTÉ.** Le backend peut alors déchiffrer seul : la garantie devient **illusoire**. Un adversaire A1/A3/A7 qui atteint le processus ou la configuration obtient exactement le pouvoir qu'on veut lui refuser. C'est la situation que `024` L495 et L1045 interdisent explicitement. |
| **O4 — Clé matérielle (WebAuthn, KMS, HSM)** | Support physique ou service de clés. | **Non retenu en v1.** WebAuthn **authentifie**, il ne déchiffre pas ; un KMS résout la protection *au repos* mais le backend devrait y déléguer le déchiffrement — ce qui recrée O3. Pertinent seulement si des clés privées doivent un jour rester en ligne ; hors périmètre. |

**Ce que O1 implique opérationnellement (assumé) :**

1. Un Admin ne peut déchiffrer que depuis **un appareil où sa clé est présente**
   (poste habituel ou fichier de sauvegarde importé). Un changement d'appareil est
   une opération manuelle.
2. La perte simultanée du blob local **et** du fichier de sauvegarde **et** de la
   phrase secrète rend l'Admin incapable de lire — la custodie (D-12) reste le
   dernier recours.
3. Un Admin malveillant peut copier le clair qu'il lit. Aucune cryptographie ne
   l'empêche : c'est un accès légitime.

## 4.4. Le point critique : un `SUPER_ADMIN` à accès système complet peut-il l'obtenir ?

### 4.4.1. Le mécanisme exact qui l'en empêche

La réponse tient en une phrase, et elle est architecturale, pas déclarative :

> **Le backend ne possède rien à voler.** Aucune clé privée, aucune DEK, aucune
> fonction de déchiffrement n'existe dans le système déployé. Le chiffrement se
> produit dans le navigateur du visiteur ; le desscellement dans le navigateur de
> l'Admin ; la custodie hors ligne. Un adversaire qui obtient la totalité du
> système — base, processus, variables d'environnement, code, dépôt, sauvegardes —
> n'obtient que des octets chiffrés et des clés **publiques**.

Trois propriétés vérifiables le garantissent :

| # | Propriété | Vérification |
| --- | --- | --- |
| M1 | **Aucun primitif de déchiffrement côté serveur.** Le module `shared/crypto` des prières n'importe ni `createDecipheriv`, ni `privateDecrypt`, ni une fonction de desscellement. | Test automatisé d'import (Annexe A, T1). |
| M2 | **Aucune colonne de clé privée, de DEK, ni de fragment de custodie** dans aucun schéma de la base. | Test de schéma (T2). |
| M3 | **Aucun chemin d'autorisation** vers les prières pour un `SUPER_ADMIN`, évalué **avant toute lecture en base et avant toute opération cryptographique** (`023` L487). | Test d'intégration (T3, T4). |

Ces trois propriétés sont **nécessaires et suffisantes** pour P2 (§1.5) : sans elles,
la garantie de D-10 est indéfendable ; avec elles, un `SUPER_ADMIN` qui obtiendrait
la base entière ne peut pas déchiffrer une seule demande.

### 4.4.2. Formulation de ce qui reste possible

| Chemin résiduel | Description | Effet | Détection |
| --- | --- | --- | --- |
| **R1 — Création d'une identité `ADMIN`** | Le `SUPER_ADMIN` crée un compte `ADMIN`, s'y connecte, enregistre une clé publique qu'il contrôle. | Il reçoit les enveloppes des demandes **créées pendant l'activité de ce compte**. Aucun accès au backlog. | Son empreinte apparaît dans l'ensemble des destinataires affiché pour chaque nouvelle demande ; un événement `KEY_REGISTERED` est écrit dans le registre d'audit des prières (lisible par les Admins). |
| **R2 — Substitution de la clé `RECOVERY`** | Il remplace la clé publique de récupération par la sienne dans le registre. | Les demandes futures sont enveloppées aussi pour lui : il obtient une seconde voie de lecture **future**. | Le changement d'empreinte de la clé `RECOVERY` est notifié à tous les Admins ; l'empreinte de la clé de récupération est une donnée publique vérifiable hors bande. |
| **R3 — Modification du code servi** | Il modifie le JavaScript de déchiffrement pour exfiltrer clair ou clé privée déverrouillée. | Lecture de ce que les Admins consultent **à partir de ce moment**. | Revue de code, *build* reproductible, comparaison d'empreinte du *bundle*, journal des déploiements. |
| **R4 — Contrôle de l'outil de cérémonie** | Il altère l'outil hors ligne utilisé lors d'une cérémonie de récupération. | Lecture des DEK / clairs traités pendant une cérémonie. | Outil à code ouvert, signé, exécuté sur machine isolée, contrôlé par au moins deux dépositaires. |

**Règle normative qui découle de R1-R4 : le déploiement de production, le registre
des clés et l'outil de cérémonie doivent être hors du périmètre d'action du rôle
`SUPER_ADMIN`.** Si le commanditaire choisit de lui laisser ces accès, D-10 devient
une garantie **partielle** et doit être reformulé : « le `SUPER_ADMIN` ne peut pas
lire l'historique, mais peut lire les demandes futures tant que sa compromission
n'est pas détectée ». Cette réserve est inscrite ici parce qu'aucune architecture
ne peut la lever seule.

## 4.5. Custodie de récupération (D-12) — formalisation

### 4.5.1. Principe

Une **troisième catégorie de destinataire**, distincte des comptes ordinaires, hors
de la plateforme, dont la clé publique est enregistrée comme `RECOVERY` et dont
**chaque demande reçoit systématiquement une enveloppe** (D-12 : « les demandes ne
doivent pas devenir illisibles à la première perte de tous les accès Admin »).

**Ce que la custodie est :** un pouvoir de **restauration d'accès**.
**Ce que la custodie est aussi, par construction :** un pouvoir de **lecture
totale**, dès lors que ses détenteurs assemblent la clé privée. Ce second point est
écrit ici sans détour : *il est le prix de D-12, et il n'existe aucune conception en
enveloppe qui offre la récupération sans offrir ce pouvoir.* Les protections sont
humaines et procédurales, pas cryptographiques.

### 4.5.2. Détention — **à confirmer nominativement (Q1)**

| Règle | Contenu |
| --- | --- |
| Nombre de fragments | **3 fragments, seuil 2** (proposition retenue, A14). |
| Type de partage | **Shamir** sur GF(256), `k = 2`, `n = 3`, implémentation standard et testée (aucun code de partage écrit à la main). |
| Interdictions absolues | **Aucun dépositaire n'est le `SUPER_ADMIN`.** Aucun dépositaire ne détient de compte applicatif disposant de droits d'administration. Aucun fragment n'est stocké sur un serveur, dans le dépôt Git, dans une variable d'environnement, dans un gestionnaire de mots de passe en ligne, ni saisi dans un formulaire web. |
| Profil proposé (à valider) | (1) un responsable pastoral de l'église ; (2) un membre du conseil **sans compte technique** sur la plateforme ; (3) un dépositaire externe (coffre physique, notaire, ou coffre d'une organisation partenaire). |
| Conservation | Support physique scellé, dans **trois lieux distincts**, jamais deux fragments au même endroit. |
| Empreinte de contrôle | L'empreinte de la clé `RECOVERY` publique est publiée dans la documentation du projet et affichée dans le back-office ; elle permet à tout Admin de détecter une substitution (R2). |

### 4.5.3. Cérémonie de récupération (procédure auditée)

```text
1. Déclencheur documenté (perte des clés Admin, nécessité pastorale, etc.)
2. Convocation des dépositaires — au moins 2 sur 3
3. Export par la plateforme d'un BUNDLE (données publiques uniquement) :
     { requestId, cryptoVersion, ciphertext, nonce, keyReference,
       enveloppes RECOVERY }
   → aucun secret ; ce bundle seul est INUTILISABLE.
4. Transport hors ligne (support physique) vers une machine ISOLÉE du réseau
5. Outil de cérémonie (code ouvert, signé, hors du dépôt applicatif) :
     a. saisie des 2 fragments → reconstruction de la clé privée RECOVERY en mémoire
     b. pour chaque demande : ouverture de l'enveloppe RECOVERY → obtention de la DEK
        (le requestId contenu est vérifié : rejet si discordance)
     c. ré-enveloppement immédiat de la DEK vers les clés PUBLIQUES Admin courantes
     d. sortie : LOT D'ENVELOPPES NOUVELLES, et RIEN D'AUTRE
     e. effacement des tampons ; aucun clair n'est jamais affiché ni écrit
6. Ré-import du lot d'enveloppes (endpoint protégé, réservé aux Admins)
7. Génération d'une NOUVELLE clé RECOVERY lors d'une nouvelle cérémonie ;
   nouveaux fragments ; enveloppes RECOVERY ré-écrites pour toutes les demandes
8. Destruction des anciens fragments et de l'ancienne clé RECOVERY
9. Journalisation de l'opération dans le registre d'audit des prières :
     acteur, date, identifiants de demandes traitées, résultat — JAMAIS de contenu
```

**Propriété importante de la procédure :** l'étape 5.c ré-enveloppe **sans jamais
exposer le contenu**. Les dépositaires restaurent l'accès des Admins sans lire les
prières. Seule la DEK est manipulée en clair, quelques microsecondes, sur une
machine isolée.

**Limite qui subsiste :** pendant la cérémonie, la clé privée de récupération est
assemblée. Des dépositaires qui le voudraient **pourraient** lire — la protection
est le seuil 2-sur-3, la présence de témoins, l'outil signé (qui ne journalise ni
n'affiche de clair), l'isolement réseau, et le renouvellement systématique de la
clé de récupération après chaque cérémonie.

## 4.6. Isolation du magasin des prières

**Niveau 1 — obligatoire (A16).**

| Règle | Contenu |
| --- | --- |
| Schéma dédié | `prayer_private` regroupe `prayer_request`, `data_key_envelope`, `crypto_key`, `prayer_audit_event`. |
| Deux rôles PostgreSQL **disjoints** | `ccjv_app` (rôle applicatif principal) : **aucun privilège** sur `prayer_private`. `prayers_api` : privilèges sur `prayer_private` **uniquement**, plus `INSERT` sur `public.notification_outbox` (§6.2). |
| Deux pools de connexions | Le module Prayers est le **seul** à ouvrir une connexion avec `prayers_api`, via un secret distinct. |
| Conséquence | Aucune requête du reste de l'application — et donc aucun code exécuté par un `SUPER_ADMIN` à travers la plateforme — ne peut lire, compter ou énumérer les demandes. |
| Pas de clé étrangère inter-schéma | `crypto_key.owner_user_id` n'a pas de `REFERENCES public.users` : la clé étrangère exigerait des privilèges croisés qui affaibliraient l'isolation. L'intégrité est vérifiée par le cas d'usage. |
| RLS | Optionnelle, en défense supplémentaire : politique `prayers_api` restreinte au flux du module. |

**Niveau 2 — recommandé, à confirmer (A16, Q4).** Le magasin des prières est
hébergé dans une **instance/base dédiée** dont les identifiants ne figurent **ni**
dans la configuration de la plateforme principale, **ni** dans le périmètre du rôle
`service_role`/propriétaire de la base principale.

**Pourquoi le niveau 2 est nécessaire pour une partie de D-10 :** sans lui, quiconque
détient le rôle **propriétaire** de la base principale (chaîne de connexion
d'administration, `service_role` Supabase, sauvegarde complète) peut lire le nombre
de demandes, leurs statuts et leurs dates. Avec le niveau 2, ces métadonnées
n'existent que dans un magasin dont le `SUPER_ADMIN` n'a pas les identifiants.

**Résidu assumé (P3) :** même au niveau 2, l'hébergeur de l'instance dédiée et
quiconque obtient une sauvegarde complète de cette instance voient ces
métadonnées. **Cette partie de D-10 n'est pas cryptographiquement garantie.**

## 4.7. Enregistrement et administration des clés publiques

| Règle | Contenu |
| --- | --- |
| Qui enregistre | Un utilisateur `ADMIN` authentifié enregistre **sa propre** clé. L'API refuse toute tentative d'enregistrer une clé pour un autre `owner_user_id` (le propriétaire est **déduit du principal**, jamais du corps de la requête). |
| Qui révoque | La révocation d'une clé suit la révocation du compte — **sans trancher Q-A4** (`028` §10 : « un `ADMIN` peut-il désactiver un autre `ADMIN` ? » reste ouverte). La procédure cryptographique est définie indépendamment de la réponse. |
| Validation de forme | SPKI DER, RSA 4096 bits, exposant 65537, OAEP/SHA-256. Toute autre clé est rejetée avec `422`. |
| Nombre de clés actives | Au plus **2** par utilisateur (recouvrement nécessaire à la rotation). |
| Empreinte | `base32(SHA-256(SPKI)[0..19])` en groupes de 5, affichée dans le back-office et comparable hors bande entre Admins. |
| Journalisation | Chaque enregistrement/révocation produit un `KEY_REGISTERED` / `KEY_REVOKED` dans le registre d'audit des prières **et** une notification à tous les autres Admins (détection R1/R2). |
| Rotation de clé | Nouvelle clé `ACTIVE` → nouvelle génération ; l'ancienne passe `RETIRED` (utilisable en lecture, plus utilisée pour l'enveloppement des nouvelles demandes). |

## 4.8. Synthèse des garanties de la gestion des clés

| Garantie | Tenable ? | Raison |
| --- | --- | --- |
| Un `SUPER_ADMIN` ne peut pas déchiffrer une demande enregistrée | **Oui** | Il n'existe aucune clé déchiffrante dans le système déployé (M1, M2). |
| Un accès complet à la base ne permet pas de déchiffrer | **Oui** | Idem. |
| Un accès complet au backend ne permet pas de déchiffrer le backlog | **Oui** | Idem. Même pendant une soumission, le clair n'entre pas dans le processus. |
| Un Admin révoqué ne lit plus les demandes futures | **Oui** | Aucune enveloppe ne lui est plus destinée (§5.4). |
| Un Admin révoqué ne peut plus **relire** l'historique qu'il détenait | **NON** | Ni la révocation ni le ré-enveloppement ne changent le chiffré. Seule une **ré-écriture du contenu** (nouvelle DEK, nouveau chiffrement) le pourrait — et rien ne garantit qu'il n'a pas conservé le clair (§5.4.5). |
| Le nombre, les dates, l'existence des demandes sont invisibles | **Partiellement** | Applicativement oui (P1) ; contre une sauvegarde complète ou un rôle propriétaire de base, non (P3). |
| Les demandes futures sont inaccessibles à un adversaire contrôlant le déploiement | **NON** | Capacité transitoire P4 : substitution de clé, injection dans le JS, création d'un compte `ADMIN`. Détectable, non empêchable. |
| Le système résiste à un futur adversaire quantique | **NON en v1** | RSA-4096 ; voir Q7 et §1.4. |
| Les données restent lisibles indéfiniment | **Oui, conditionnellement** | Tant qu'un Admin détient une enveloppe non révoquée et sa clé privée, ou que 2 fragments de custodie survivent. Sinon : perte définitive et assumée (§5.6). |

---

# 5. Cycle de vie

## 5.1. Envelopper (création d'une demande)

```text
NAVIGATEUR DU VISITEUR
 1. GET  /api/v1/prayer-keys                     → clés PUBLIQUES actives + empreintes
 2. valider le formulaire (message requis ; nom requis si non anonyme)
 3. requestId = UUIDv4 aléatoire
 4. dek       = aléa(32)
 5. message   = AES-256-GCM(dek, nonce_m, bourré(texte), AAD(v, requestId, "message"))
 6. si non anonyme :
      name    = AES-256-GCM(dek, nonce_n ≠ nonce_m, bourré(nom), AAD(v, requestId, "name"))
 7. pour chaque clé publique active (chaque ADMIN + RECOVERY) :
      enveloppe = RSA-OAEP(clé_publique, 0x01 ‖ dek ‖ requestId_bin)
 8. POST /api/v1/prayer-requests  { cryptoVersion, requestId, isAnonymous,
                                    message, requesterName?, envelopes[] }

API (rôle prayers_api)
 9. rate limiting + plafond de taille (429 / 413)
10. validation Zod : forme, longueurs, versions, base64, 12 octets de nonce
11. vérification d'ENSEMBLE (A10) :
      - recipientKeyRef ∈ registre, purpose attendu, status ACTIVE
      - l'ensemble des enveloppes ADMIN == l'ensemble des clés ADMIN actives
      - exactement une enveloppe RECOVERY, vers la clé RECOVERY active
      → toute divergence : 422, aucune écriture
12. FAIL CLOSED (A9) : si aucune clé ADMIN active OU aucune clé RECOVERY active
      → 503, aucune écriture (jamais de donnée non récupérable)
13. transaction unique :
      INSERT prayer_request (…)             -- contrainte D-15 appliquée par la base
      INSERT data_key_envelope × N
      INSERT public.notification_outbox (requestId)   -- §6.2
    COMMIT
14. 201 Created — corps minimal : { id } (jamais l'écho du chiffré, jamais de détail)

WORKER DE NOTIFICATION (rôle ccjv_app, hors requête publique)
15. consomme l'outbox, crée une Notification PRAYER_REQUEST_RECEIVED par ADMIN
```

**Aucune étape serveur ne déchiffre, ne génère de clé, ni ne conserve de secret.**

## 5.2. Déchiffrer (avec vérification d'autorisation **avant**)

### 5.2.1. Séquence normative

```text
ADMIN (navigateur)                         API (rôle prayers_api)
    │                                          │
    ├── GET /api/v1/prayer-requests/:id ──────►│
    │                                          │ ① authenticate (Supabase JWT) → principal
    │                                          │ ② PrayerPolicy.canReachDomain(principal)
    │                                          │    ↳ évaluation PURE sur le principal
    │                                          │      AUCUNE lecture en base, AUCUN repository,
    │                                          │      AUCUNE requête d'existence, AUCUN crypto
    │                                          │    ↳ refus → 403, corps CONSTANT, et STOP
    │                                          │ ③ repository.findById(id)      (rôle prayers_api)
    │                                          │ ④ PrayerPolicy.canRead(principal, request)
    │                                          │ ⑤ sélection des enveloppes du principal
    │                                          │    (uniquement ses propres destinataires)
    │◄─── 200 { ciphertext, nonce, keyReference,
    │          envelope(s) du principal } ─────┤   Cache-Control: no-store
    │                                          │
    │ ⑥ RSA-OAEP déscellement de l'enveloppe
    │    → vérification que requestId correspond, sinon REJET
    │ ⑦ AES-256-GCM déchiffrement du message et du nom
    │    → vérification AAD + débourrage, sinon REJET
    │ ⑧ affichage en TEXTE BRUT (jamais de HTML, jamais de Markdown)
```

### 5.2.2. Règles de la politique (`PrayerPolicy`)

| Règle | Contenu |
| --- | --- |
| **Étape ② — garde de domaine (`canReachDomain`)** | Autorisé **si et seulement si** le principal est authentifié, actif, et détient le rôle **`ADMIN`**. Sont refusés : `SUPER_ADMIN`, `DEPARTMENT_MANAGER`, tout rôle futur non explicitement autorisé, tout compte désactivé, tout anonyme. Cette garde **ne consulte aucune donnée** : c'est ce qui rend impossible le flux interdit de `023` L489 (« Repository » n'est jamais atteint). |
| **Réponse au refus** | **403**, corps **constant** (même message, même forme) quel que soit l'identifiant demandé, y compris s'il n'existe pas. Aucun `404` distinct pour un `SUPER_ADMIN` : cela éviterait de lui donner un **oracle d'existence** — or D-10 interdit même de lui révéler qu'une demande existe. |
| **Étape ④ — garde d'objet** | Pour un `ADMIN` : autorisé. Pour tout autre rôle, refus. La garde d'objet ne sert donc qu'à la défense en profondeur et à l'extension future. |
| **Étape ⑤ — minimisation** | Seules les enveloppes destinataires du principal sont renvoyées. Un Admin ne reçoit jamais l'enveloppe d'un autre Admin : rien à copier pour un compte compromis. |
| **Interdictions** | Aucune réponse d'API ne contient de clair. Aucune route ne renvoie la DEK. Aucun endpoint ne renvoie l'ensemble des enveloppes d'un Admin tiers. |
| **Audit** | Chaque lecture produit un `PRAYER_READ` (§6.3), jamais le contenu. Les refus produisent `PRAYER_ACCESS_DENIED` avec le **rôle** du principal, dans le registre d'audit des prières — **pas** dans le journal général. |

### 5.2.3. Règles côté navigateur de l'Admin

| Règle | Contenu |
| --- | --- |
| Déverrouillage | La clé privée est déverrouillée par la phrase secrète de l'Admin (§2.6) au début d'une session de lecture ; elle n'est **jamais** persistée déverrouillée. |
| Verrouillage automatique | Après **15 minutes** d'inactivité, changement d'onglet prolongé, ou fermeture de l'onglet. La DEK et le clair déchiffrés sont effacés en mémoire. |
| Rendu | Les données déchiffrées sont rendues en **texte brut** exclusivement. Interdiction absolue d'`innerHTML`, de rendu Markdown/HTML, de composant d'aperçu riche : un contenu de prière ne doit jamais pouvoir exécuter de script dans le navigateur qui détient la clé. |
| CSP | Politique stricte sur la page de lecture : aucune source de script tierce, aucun télémétrie/replay de session, aucun `connect-src` autre que l'API. |
| Persistance | Interdiction d'écrire le clair ou la clé déverrouillée dans `localStorage`, `sessionStorage`, un *service worker*, un cache HTTP, un presse-papiers automatique, ou un stockage d'analytique. |
| Erreurs | Un échec d'authentification AEAD est présenté comme « demande illisible » sans détail technique ; l'événement est audité. |

## 5.3. Rotation (D-13)

### 5.3.1. Déclencheurs — **jamais périodiques**

| Déclencheur (D-13) | Objet roté | Effet immédiat |
| --- | --- | --- |
| Compromission suspectée d'une clé Admin | Paire de clés de cet Admin | Nouvelle paire `ACTIVE` ; ancienne `REVOKED` ; nouvelle génération. |
| Compromission suspectée de la custodie | Paire `RECOVERY` | Cérémonie de renouvellement (§4.5.3 étape 7) : nouveaux fragments, ré-enveloppement `RECOVERY` de toutes les demandes. |
| Changement majeur de politique | Génération d'enveloppement + éventuellement `cryptoVersion` | Nouvelles demandes sous la nouvelle génération. |
| Perte d'une clé | Paire concernée | Voir §5.4.4 (couverture) et §5.5 (récupération) si la clé perdue était indispensable. |
| Remplacement d'un mécanisme cryptographique | `cryptoVersion` (v1 → v2) | Nouvelles demandes en v2 ; **aucune** modification des demandes v1. |
| Révocation nécessitant une nouvelle génération | Génération | Nouvelle génération pour l'enveloppement des demandes suivantes. |

**Règle normative :** aucune rotation périodique, aucun « âge maximal de clé »
arbitraire. Une rotation automatique temporelle n'est **pas** implémentée (D-13).

### 5.3.2. Procédure

```text
1. Générer la nouvelle paire (navigateur de l'Admin) et enregistrer la clé publique
2. La nouvelle clé devient ACTIVE ; l'ancienne devient RETIRED
3. incrémenter wrap_generation
4. Les demandes FUTURES sont enveloppées pour la nouvelle clé
5. Les demandes ANCIENNES conservent leurs enveloppes d'origine : elles restent
   lisibles avec l'ancienne clé privée (D-13)
6. Deux issues possibles pour l'ancienne clé privée :
   a. CONSERVÉE localement (historique de clés) → l'Admin lit l'historique
      normalement ; recommandé sur un appareil de confiance.
   b. DÉTRUITE après ré-enveloppement côté client :
        l'Admin déverrouille l'ancienne clé,
        ouvre chaque enveloppe ancienne, obtient la DEK,
        la ré-enveloppe pour la nouvelle clé publique,
        POST /api/v1/prayer-envelopes  (lot, ≤ 200 éléments)
        → upsert des enveloppes ; les anciennes sont marquées revoked_at
7. Si l'ancienne clé privée est PERDUE sans ré-enveloppement préalable :
      un autre Admin procède au ré-enveloppement pour la nouvelle clé
      (il détient sa propre enveloppe, donc la DEK)
      → en l'absence de tout autre Admin : cérémonie de récupération (§4.5.3)
```

**Sort des anciennes données (D-13) :** elles restent déchiffrables *via leur
matériel d'origine* tant qu'un destinataire autorisé doit les consulter. Aucune
ré-écriture de masse n'est déclenchée par une rotation. La seule opération qui
ré-écrit du contenu est la **ré-encryption** (§5.4.5), qui relève d'une décision
explicite (Q3).

## 5.4. Révocation d'un Admin (D-14) — les quatre étapes détaillées

```text
ÉTAPE 1 — Accès FUTUR immédiatement révoqué
  1.1  retrait du rôle ADMIN / désactivation du compte (HORS périmètre de cette
       spécification : dépend de Q-A4, docs/028 §10 — non tranché ici)
  1.2  révocation des sessions Supabase de l'utilisateur
  1.3  retrait de ses clés de l'ensemble ACTIF des destinataires
  1.4  effet : les demandes suivantes ne sont PLUS enveloppées pour lui
  → délai d'effet : la requête suivante. Aucune donnée n'est touchée.

ÉTAPE 2 — Clés d'accès révoquées
  2.1  crypto_key.status  : ACTIVE → REVOKED ; revoked_at = now()
  2.2  toutes les enveloppes destinées à ces clés : revoked_at = now()
       (les lignes sont CONSERVÉES : l'historique des enveloppes est une preuve)
  2.3  incrément de wrap_generation
  2.4  consigne explicite à l'Admin : détruire sa clé privée locale
       (destruction NON vérifiable techniquement — limite assumée, §5.4.5)
  2.5  événement KEY_REVOKED dans le registre d'audit + notification aux autres Admins

ÉTAPE 3 — Demandes existantes TOUJOURS accessibles aux Admins restants
  3.1  aucune donnée n'est modifiée : chaque autre Admin conserve sa propre
       enveloppe et sa propre clé privée
  3.2  aucun rechiffrement global : la conséquence de D-11 (une enveloppe par
       Admin) est précisément de rendre cette étape gratuite
  3.3  VÉRIFICATION DE COUVERTURE (§5.4.4) lancée immédiatement

ÉTAPE 4 — Ré-enveloppement si nécessaire
  Cas 4.a — il reste au moins un Admin détenant une enveloppe pour la demande :
      cet Admin (navigateur) ouvre l'enveloppe, obtient la DEK, la ré-enveloppe
      pour les clés ADMIN actives + la clé RECOVERY active,
      POST /api/v1/prayer-envelopes
      → upsert ; l'ancienne enveloppe est marquée revoked_at
  Cas 4.b — aucun Admin restant ne détient d'enveloppe (l'Admin révoqué était le
      seul destinataire) :
      cérémonie de récupération (§4.5.3) — seule voie possible
  Cas 4.c — pré-révocation (recommandé) :
      AVANT que l'accès ne soit coupé, l'Admin sortant procède lui-même au
      ré-enveloppement pour les Admins restants (il détient encore sa clé)
      → évite 4.b dans la quasi-totalité des cas
```

### 5.4.1. Vérification de couverture (contrôle périodique)

Un contrôle applicatif (rôle `prayers_api`) vérifie, pour chaque demande, qu'il
existe **au moins une** enveloppe non révoquée vers une clé `ADMIN` `ACTIVE`, et
**exactement une** enveloppe non révoquée vers la clé `RECOVERY` `ACTIVE`.

- Toute anomalie produit une alerte **destinée aux Admins uniquement** — jamais au
  `SUPER_ADMIN`, jamais dans le journal général.
- Ce contrôle ne déchiffre rien : il ne lit que des métadonnées d'enveloppes.

### 5.4.2. Ce que la révocation garantit

| Garantie | Statut |
| --- | --- |
| Aucune demande postérieure à la révocation n'est lisible par l'Admin révoqué | **Tenue** — aucune enveloppe ne lui est destinée. |
| Aucune perte d'historique pour les Admins restants | **Tenue** — enveloppes indépendantes (D-14 point 3). |
| L'historique reste accessible **sans** rechiffrement de masse | **Tenue** — propriété structurelle de D-11. |

### 5.4.3. Ce que la révocation ne garantit pas — énoncé explicite

> **La révocation ne retire pas rétroactivement la capacité de lecture d'un Admin
> révoqué sur les demandes qu'il pouvait déjà lire.** Trois raisons, toutes
> techniques : (1) le chiffré n'a pas changé, il détient déjà les enveloppes
> correspondantes ; (2) sa clé privée est hors de portée de la plateforme, aucune
> procédure ne peut la détruire à distance ; (3) même une ré-écriture du contenu ne
> garantirait rien s'il en a conservé une copie en clair.
>
> **Seule réponse technique :** la **ré-encryption** — génération d'une nouvelle
> DEK, retrait du bourrage, nouveau chiffrement du contenu, nouvelles enveloppes,
> marquage `cryptoVersion`/génération incrémentés. Elle exige qu'un destinataire
> autorisé détienne encore la DEK (sinon : cérémonie), elle est coûteuse, et elle
> **ne change rien** face à un Admin ayant copié le clair. Elle est donc une
> **décision de politique** (Q3), pas un mécanisme automatique.

## 5.5. Récupération (D-12)

Voir §4.5 pour la détention et la cérémonie. Points normatifs complémentaires :

| Point | Règle |
| --- | --- |
| Qui peut déclencher | Une demande écrite et motivée, traitée par un `ADMIN` (côté plateforme, pour l'export du bundle) **et** par les dépositaires (hors plateforme). Le `SUPER_ADMIN` n'a **aucun** rôle dans cette procédure, à aucune étape. |
| Qui ne peut pas | Le `SUPER_ADMIN` : il ne détient aucun fragment, il n'est pas notifié, aucune trace de la procédure ne lui est accessible. |
| Ce que produit la procédure | Des **enveloppes nouvelles** pour les clés Admin courantes, et une nouvelle clé `RECOVERY`. Jamais du contenu. |
| Ce que la procédure ne peut pas faire | Restaurer un contenu dont **aucune** DEK ne peut être ouverte : si les fragments de custodie **et** les clés Admin sont perdus, la demande reste illisible définitivement. |
| Audit | Intégral dans le registre d'audit des prières (acteurs, dates, identifiants traités, résultat), **jamais** de contenu. La cérémonie produit en outre un procès-verbal papier signé par les dépositaires, conservé hors plateforme. |
| Récupération d'urgence « in extremis » | Aucune exception : il n'existe pas de procédure de contournement, pas de « compte de secours » en ligne, pas de clé de dépannage. **Toute forme de clé de secours en ligne recréerait exactement O3 et est interdite.** |

## 5.6. Perte totale — état assumé

| Scénario | Résultat | Assumé ? |
| --- | --- | --- |
| Toutes les clés privées Admin perdues, custodie intacte | Récupération possible par cérémonie (§4.5.3). | Oui, mécanisme prévu (D-12). |
| Toutes les clés Admin perdues **sauf une** | Aucune perte : l'Admin restant ré-enveloppe pour les autres. | Oui. |
| Clés Admin perdues **et** moins de 2 fragments de custodie disponibles | **Les demandes concernées sont définitivement illisibles.** | **Oui — conséquence directe de D-11 (aucune clé maître) et de D-16 (aucune purge).** |
| Perte de la clé privée d'un seul Admin | Ses demandes restent lisibles par les autres Admins ; il est ré-enveloppé au besoin. | Oui. |

**Traitement des données définitivement illisibles :**

1. Elles **restent stockées** (D-16 interdit toute purge automatique). Aucune
   suppression n'est inventée.
2. Elles restent **structuriellement valides** : la contrainte de couverture
   (§5.4.1) signale l'anomalie aux Admins.
3. Elles ne sont **jamais** présentées comme lisibles : l'interface Admin affiche un
   état explicite (« demande non récupérable : aucune clé de déchiffrement
   disponible »), sans faux succès et sans fallback trompeur (`docs/025` Lot 11).
4. Aucune récupération n'est simulée. Aucun « mode dégradé » ne substitue un
   contenu.

> **Énoncé à conserver :** *le système privilégie la confidentialité sur la
> disponibilité. Une perte totale de clés produit une perte **définitive** de
> lisibilité, pas une exposition. C'est un choix explicite, conforme à D-11, D-12
> et D-16.*

---

# 6. Archivage, notification et audit

## 6.1. Transition `PENDING → ARCHIVED`

| Point | Règle |
| --- | --- |
| Déclencheur | Validation par un `ADMIN` (`023` §8, `022` L434-L440). |
| Endpoint | `POST /api/v1/prayer-requests/:id/archive` |
| Séquence | authenticate → `canReachDomain` (étape ② de §5.2.1, **refus avant toute lecture**) → chargement → `canRead` → `UPDATE status='ARCHIVED', validated_at=now()`. |
| Données | **Aucune donnée cryptographique n'est touchée** : le chiffré, les nonces, les `keyReference` et **toutes** les enveloppes sont conservés. L'archivage n'est **pas** une suppression (`023` L552 : « Il n'existe pas de suppression automatique lors de la validation. »). |
| Réversibilité | `ARCHIVED` est un état métier persistant ; aucun retour en `PENDING` n'est défini. |
| Conservation | **Indéfinie** (D-16). Aucune tâche de purge, aucun `cron` de nettoyage, aucune rétention arbitraire n'est créée. |
| Déchiffrement après archivage | Identique : rien ne change dans le matériel cryptographique ; la lecture reste possible par les Admins (les enveloppes ne sont pas révoquées par l'archivage). |
| Purge | **Impossible dans le modèle** : `ON DELETE RESTRICT`, aucune colonne `deleted_at`. Une future politique de rétention relèverait de la Phase 6 (D-16). |

## 6.2. Notification — sans aucun contenu de prière

| Point | Règle |
| --- | --- |
| Destinataires | **Exclusivement** les utilisateurs détenant le rôle `ADMIN` **au moment de la soumission**, dont la clé publique est `ACTIVE`. **Aucun `SUPER_ADMIN`** : un garde applicatif rejette toute tentative de créer une notification `PRAYER_*` pour un principal non-`ADMIN` (D-10 : « ni notifications »). |
| Type | `PRAYER_REQUEST_RECEIVED` — **seule** valeur existante (`022` L138-L141). Aucune valeur n'est ajoutée (aucune décision métier inventée). |
| Contenu | `{ recipientUserId, type, referenceId = requestId, isRead = false, createdAt }` |
| Interdits dans la notification | Contenu, nom, extrait, préfixe, longueur, nombre de caractères, `keyReference`, liste des destinataires, statut anonyme, tout élément dérivé du contenu (`022` L492, `024` §27 L991). |
| Atomicité | La notification est créée par un **worker** consommant `public.notification_outbox`, alimentée dans la **même transaction** que l'insertion de la demande (§5.1 étape 13). La ligne d'outbox ne contient que `requestId` et un horodatage : jamais de contenu. |
| Pourquoi pas dans la même table | L'isolation des rôles (§4.6) interdit au rôle `prayers_api` d'écrire dans `public.notifications` ; l'outbox préserve l'atomicité sans casser la frontière de privilèges. |
| Notification d'archivage | **Aucune** n'est créée : ni `023`, ni `022` (une seule valeur d'énumération) ne la prévoient. |
| Notifications de sécurité | `KEY_REGISTERED`, `KEY_REVOKED`, changement de clé `RECOVERY` : notification à **tous les Admins** (mécanisme de détection R1/R2, §4.4.2). Jamais au `SUPER_ADMIN`. |

## 6.3. Journalisation et audit — sans donnée sensible

### 6.3.1. Deux registres, jamais confondus

| Registre | Contenu | Lecteurs |
| --- | --- | --- |
| **Journal général** (`public.audit_log`, `024` §27) | Événements administratifs généraux : `USER_CREATED`, `ROLE_ASSIGNED`, `PUBLICATION_*`, `MEDIA_*`, `PAGE_UPDATED`… | `SUPER_ADMIN` inclus. |
| **Registre d'audit des prières** (`prayer_private.prayer_audit_event`) | Tout événement touchant une demande de prière ou une clé de prière. | **`ADMIN` uniquement** — même garde que le contenu. |

**Écart assumé vis-à-vis de `024` §27 (voir §9) :** `024` L978-L988 range
`PRAYER_REQUEST_ARCHIVED` dans la liste des événements d'audit — dont la lecture
est ouverte au `SUPER_ADMIN` par D-03. Cela contredirait D-10 (« ni nombre, ni
dates ») : un journal lisible par lui révèle l'activité du domaine des prières.
**D-10 prévaut.** L'événement est bien enregistré, mais dans le registre isolé.

### 6.3.2. Actions auditées (registre des prières)

```text
PRAYER_SUBMITTED           (soumission reçue — par l'endpoint public)
PRAYER_READ                (lecture par un Admin — contenu renvoyé chiffré)
PRAYER_ACCESS_DENIED       (refus — rôle du principal, jamais son contenu)
PRAYER_ARCHIVED            (validation)
PRAYER_UNDECRYPTABLE       (échec d'authentification AEAD côté client)
KEY_REGISTERED             (enregistrement d'une clé publique)
KEY_REVOKED                (révocation d'une clé d'accès)
KEY_RETIRED                (rotation : ancienne clé mise hors service)
ENVELOPE_REWRAPPED         (ré-enveloppement, en lot)
RECOVERY_BUNDLE_EXPORTED   (export d'un bundle de récupération)
RECOVERY_ENVELOPES_IMPORTED(import d'un lot d'enveloppes restaurées)
COVERAGE_ANOMALY_DETECTED  (demande sans enveloppe active)
```

### 6.3.3. Champs autorisés (liste blanche stricte)

```text
actorUserId        (UUID, ou null pour une soumission publique)
action             (énumération ci-dessus)
resourceType       ("PrayerRequest" | "PrayerKey")
resourceId         (requestId ou keyReference, ou null)
createdAt          (horodatage)
result             ("OK" | "DENIED" | "ERROR_<code technique>")
metadata           (JSONB, liste blanche de clés NON sensibles uniquement :
                    cryptoVersion, génération, empreinte de clé publique,
                    nombre d'enveloppes, code de motif de refus)
```

**Toute autre clé dans `metadata` provoque le rejet de l'événement** (le schéma Zod
du registre est en `.strict()` : pas de champ supplémentaire toléré). Cela rend
impossible l'ajout accidentel d'un champ sensible par un développeur futur.

### 6.3.4. Règles de journalisation technique

| Règle | Contenu |
| --- | --- |
| Corps de requête | **Jamais** journalisé sur les routes de prière. Un `redact` de la couche de *logging* supprime les champs `message`, `requesterName`, `name`, `envelopes`, `wrappedKey`, `ciphertext`, `nonce`. |
| Observabilité | Aucun APM/error-tracking ne capture le corps ni les variables locales des routes de prière. Aucun *breadcrumb*, aucun *session replay* sur la page de lecture du back-office. |
| Messages d'erreur | Constantes, non techniques, sans identifiant de demande pour un refus de domaine, sans trace de pile vers le client, sans distinction entre « inexistant » et « interdit » pour un principal refusé. |
| Erreurs de chiffrement | Un échec AEAD n'est jamais journalisé avec les octets concernés : uniquement `PRAYER_UNDECRYPTABLE` + `requestId`. |
| Métriques | Compteurs agrégés **sans étiquette de demande** ; aucune métrique exposant un volume de prières à un tableau de bord lisible par le `SUPER_ADMIN`. Si un compteur d'exploitation est nécessaire, il vit dans le magasin isolé. |
| Rétention du journal général | Le journal général ne contient **aucun** événement de prière : sa rétention est donc sans effet sur D-10. |
| Rétention du registre des prières | Conservation indéfinie, comme les demandes (D-16). |

---

# 7. Ce qui ne doit JAMAIS apparaître

Liste normative. Chaque ligne est vérifiable par les tests de l'Annexe A.

## 7.1. Les données elles-mêmes

1. Le **contenu** d'une prière, en clair, sous quelque forme que ce soit.
2. Le **nom** du demandeur, en clair.
3. Tout **extrait**, **préfixe**, **suffixe**, **résumé**, **recherche par mot-clé**
   ou **index plein texte** construit sur un contenu en clair. Aucun index de
   recherche ne peut être bâti côté serveur sur les prières.
4. Le **contact** du demandeur — `requester_contact` est **supprimé définitivement**
   (D-17) : schéma, DTO, API, migration, réponse, donnée active. Aucun champ
   « téléphone », « e-mail » ou « contact » n'existe dans le domaine des prières.
5. Toute donnée **dérivée** du contenu : longueur exacte (au-delà du palier de
   bourrage), langue détectée, sentiment, mots-clés, empreinte perceptuelle, indice
   de similarité entre deux demandes.

## 7.2. Le matériel cryptographique

6. Une **DEK**, sous quelque forme que ce soit, hors enveloppe chiffrée.
7. Une **clé privée** Admin, un **blob de clé** non chiffré, une **phrase secrète**
   d'Admin.
8. Un **fragment de custodie** (Shamir), la clé privée `RECOVERY`, ou un
   intermédiaire permettant de les reconstituer partiellement.
9. Une **KEK**, une clé maître, une clé d'environnement servant à déchiffrer les
   prières — de tels éléments ne doivent **pas exister** dans le système déployé :
   leur présence serait en soi le défaut.
10. Les **enveloppes d'un autre destinataire** que le principal authentifié.
11. Toute **graine**, tout `requestId` réutilisé comme secret, tout élément laissant
    déduire une clé.

## 7.3. Les surfaces d'exposition

| Surface | Interdits |
| --- | --- |
| **Journaux** (applicatif, HTTP, base, hébergeur, conteneur, CI) | Contenu, nom, clés, enveloppes, nonces, `keyReference` du seul fait du contenu, corps de requête, variables locales. |
| **Réponses d'API** | Clair, nom, clé privée, DEK, enveloppes d'un tiers. La réponse de soumission publique ne contient que `{ id }`. La réponse de lecture ne contient que le chiffré et **l'enveloppe du principal**. |
| **Notifications** | Contenu, nom, extrait, longueur, état anonyme, `keyReference`, liste des destinataires. Seuls `type` et `referenceId` sont autorisés. |
| **Messages d'erreur** | Contenu, nom, identifiant de demande pour un refus de domaine, traces de pile, distinction « inexistant / interdit » pour un principal refusé, détail d'un échec AEAD. |
| **Traces / APM / métriques / replays de session** | Corps, clair, clé, `requestId` en étiquette de métrique, tout ce qui permettrait de compter les prières. |
| **Journaux d'audit généraux** | Tout événement du domaine des prières, y compris le seul nom d'action `PRAYER_*` (§6.3.1). |
| **URL, paramètres de requête, en-têtes personnalisés** | `requestId` dans une URL, un contenu dans un paramètre, une clé dans un en-tête. Les identifiants ne figurent que dans le chemin `/prayer-requests/:id` ou le corps. |
| **Caches** | HTTP (le magasin des prières est `no-store`), CDN, mémoire applicative, cache de requêtes Drizzle — aucun cache de contenu déchiffré, ni serveur, ni navigateur. |
| **Exports, sauvegardes, environnements de test** | Contenu en clair dans un jeu de test, une *fixture*, un *seed*, un *dump* de développement, une capture d'écran de recette, un ticket, un message d'équipe. |
| **Code source et dépôt** | Clé privée de test, `requestId` de production, contenu réel, fragment de custodie. Les jeux de test utilisent des clés **dédiées** et un contenu factice, jamais une donnée réelle. |
| **Interface du back-office** | Rendu HTML/Markdown du contenu, `innerHTML`, aperçu riche, impression automatique, presse-papiers automatique, journal de navigation d'un `SUPER_ADMIN` vers une route de prière (la route ne doit pas exister pour lui). |

## 7.4. Cas particulier du `SUPER_ADMIN` (D-10)

Pour lui, `PrayerRequest` est **fonctionnellement inexistant**. Cela implique
concrètement :

- aucune route `/prayer-*` ne figure dans sa navigation, son OpenAPI visible, sa
  documentation d'interface ou son catalogue de permissions ;
- aucune requête d'une route de prière n'est **enregistrée** comme un événement
  lisible par lui (le refus est audité dans le registre isolé) ;
- aucun compteur, tableau de bord, statistique d'activité ou état de santé ne
  mentionne le domaine des prières dans une surface qui lui est accessible ;
- aucune recherche globale, aucun export, aucun rapport d'administration ne
  traverse le domaine des prières ;
- aucune notification ne lui est destinée, y compris les notifications de sécurité
  des clés de prière (§6.2).

---

# 8. Questions à trancher avant implémentation

Chaque question est formulée pour être répondue en une phrase. Toutes les autres
décisions sont arrêtées dans ce document.

| # | Question | Réponse attendue |
| --- | --- | --- |
| **Q1** | Qui sont nommément les **trois dépositaires** de la custodie de récupération (aucun n'étant le `SUPER_ADMIN` ni un compte d'administration) ? | Trois noms + le rôle de chacun. |
| **Q2** | Le seuil de custodie est-il bien **2 fragments sur 3**, ou faut-il 3 sur 5 ? | « 2/3 » ou « 3/5 ». |
| **Q3** | Lors de la révocation d'un Admin, exige-t-on une **révocation rétroactive** (ré-écriture du contenu sous une nouvelle DEK) de l'historique qu'il pouvait lire, ou l'absence d'accès futur suffit-elle ? | « Rétroactive » ou « future uniquement ». |
| **Q4** | Le magasin des prières est-il hébergé dans une **instance/base dédiée** (niveau 2, §4.6), ou dans la base principale avec schéma et rôles séparés (niveau 1) ? | « Niveau 2 » ou « Niveau 1 assumé ». |
| **Q5** | Un **nouvel `ADMIN`** doit-il obtenir l'accès à l'**historique** existant (ré-enveloppement manuel) ou seulement aux demandes créées après son inscription ? | « Historique » ou « futur uniquement ». |
| **Q6** | L'interface Admin doit-elle afficher, pour chaque demande, la **liste des destinataires de l'enveloppe et leurs empreintes** (mesure de détection de R1/R2) ? | « Oui, pour tous les Admins » ou « non ». |
| **Q7** | Accepte-t-on une v1 **RSA-4096** avec migration ultérieure vers une v2 hybride post-quantique, ou faut-il un enveloppement hybride dès la v1 ? | « v1 RSA puis v2 » ou « hybride dès la v1 ». |
| **Q8** | Confirme-t-on les plafonds **4 000 octets pour le message** et **120 octets pour le nom** (A13) ? | Valeur numérique ou « confirmé ». |
| **Q9** | Le **déploiement de production** de la plateforme (et donc la possibilité de modifier le JavaScript de déchiffrement) est-il hors du périmètre du rôle `SUPER_ADMIN` ? | « Oui, séparation des tâches » ou « non, il conserve ce pouvoir ». |

> Sans réponse à **Q1**, **Q3**, **Q4** et **Q9**, le Lot 8 ne peut pas être
> implémenté sans décision technique supplémentaire. **Q2**, **Q5**, **Q6**,
> **Q7** et **Q8** ont une proposition par défaut dans ce document et peuvent être
> confirmées en une ligne.

---

# 9. Écarts et précisions par rapport aux documents 022-025

Aucun écart silencieux (`docs/025` §20). Chaque point est justifié par une décision
arrêtée de `docs/028`, qui prévaut.

| # | Document source | Ce qui est écrit | Ce que cette spécification retient | Justification |
| --- | --- | --- | --- | --- |
| E1 | `023` §7 L368-L392 ; `024` §22 | Le serveur appelle `CryptoService.encrypt(message, name)` | Le chiffrement est réalisé **dans le navigateur du visiteur** | D-10 et `024` L495/L1045 : un chiffrement serveur laisse le clair et la DEK dans la mémoire d'un processus que le `SUPER_ADMIN` peut atteindre. `023` L353 autorise expressément « le mécanisme cryptographique qui sera arrêté dans la conception technique ». |
| E2 | `024` §27 L978-L988 | `PRAYER_REQUEST_ARCHIVED` figure dans la liste des événements d'audit | L'événement existe mais est écrit dans un **registre isolé**, non lisible par le `SUPER_ADMIN` | D-10 prime : un journal d'audit lisible par lui révèle l'activité du domaine. |
| E3 | `022` §2 L143-L164 | `PrayerRequest` + `EncryptedData` uniquement | Ajout de `data_key_envelope` et `crypto_key` | Implémentation nécessaire de D-11 ; `022` §15 L667-L668 déclare ces points non fixés. |
| E4 | `022` L147 | `isAnonymous` est un attribut du modèle | `is_anonymous` reste une **colonne en clair** | Nécessaire à l'interface Admin et à la contrainte D-15. Fuit un bit par ligne à un adversaire de type A2 — déjà subsumé par P3 (nombre et dates), donc sans effet marginal. |
| E5 | `024` §21 L986-L988 | Trois endpoints de prière | Ajout des endpoints de clés (`/prayer-keys`) et de ré-enveloppement (`/prayer-envelopes`), plus `GET /prayer-requests` (liste) | `024` L853 présente sa liste comme « une base de contrat » ; les opérations de clés sont indispensables à D-11/D-13/D-14 et aucune n'existe sans elles. |
| E6 | `022` L163 | `keyReference` non défini | Format `ccjv-prayer:v<version>:dek:<requestId>` | Comblement d'un vide (022 §15 L667). |
| E7 | `024` §29 L1034-L1039 | Variables d'environnement dont `CRYPTO_KEY / KEY REFERENCES` | **Aucune** variable `CRYPTO_KEY` : le backend ne détient aucune clé déchiffrante. Subsistent `PRAYER_DB_URL` (rôle `prayers_api`) et les paramètres non secrets du registre | `024` L1045 : « la clé … ne doit pas être simplement assimilée à un secret backend global ». Le seul moyen de respecter cette phrase est qu'aucune clé ne soit nécessaire côté serveur. |
| E8 | `023` §8 L429 / `024` §10 L478 | `decryptForAuthorizedAdmin` / `decryptForAdmin` | Le service crypto serveur expose `validateSealedPayload()` et rien d'autre ; le déchiffrement est une fonction cliente | Contradiction C8 levée par le choix architectural : il n'existe plus de déchiffrement côté serveur. |
| E9 | `022` §12 L492 ; `024` §27 L991 | La notification ne « recopie » pas le contenu sensible | Liste d'interdits explicite et liste blanche de champs (§6.2) | Durcissement : « ne pas recopier » devient « ne peut structurellement pas contenir ». |
| E10 | `024` §9 L458 | « Le déchiffrement n'est donc jamais une opération disponible simplement parce que l'utilisateur possède un rôle administratif élevé. » | Renforcé : le refus intervient **sur le seul principal**, sans lecture en base | `023` L487 et L489-L503 (le `Repository` ne doit jamais être atteint). |

---

# Annexe A — Invariants et tests de non-régression

Ces tests sont **normatifs** : ils font partie du critère de fin du Lot 8.

| # | Invariant | Test |
| --- | --- | --- |
| T1 | Le module crypto des prières n'importe **aucun** primitif de déchiffrement (`createDecipheriv`, `privateDecrypt`, `subtle.decrypt`, `decipher*`). | Analyse statique des imports du module (échec du build si violation). |
| T2 | Aucune colonne d'aucune table de `prayer_private` ne correspond à `private|secret|seed|share|passphrase`. | Introspection du schéma en intégration. |
| T3 | Un `SUPER_ADMIN` appelant `GET /prayer-requests/:id` reçoit `403` et **aucune** requête SQL n'est émise vers les tables de prières. | Espion sur le pool de connexions + assertion `sqlCount === 0`. |
| T4 | Un `SUPER_ADMIN` appelant `GET /prayer-requests/:id` avec un identifiant inexistant reçoit la **même** réponse qu'avec un identifiant existant. | Comparaison octet à octet des deux réponses. |
| T5 | Un `DEPARTMENT_MANAGER`, un compte désactivé et un anonyme reçoivent `403` avec le même corps. | Test paramétré. |
| T6 | Une soumission dont l'ensemble des enveloppes diffère de l'ensemble actif des destinataires (manquante, en trop, clé inconnue, clé révoquée) est rejetée `422` **sans écriture**. | Test paramétré sur 5 variantes. |
| T7 | Une soumission alors qu'aucune clé `ADMIN` active ou aucune clé `RECOVERY` active n'existe renvoie `503` **sans écriture** (fail closed). | Test avec registre vide. |
| T8 | Aucun corps de requête des routes de prière n'apparaît dans les sorties de la couche de journalisation, sur tous les niveaux. | Capture du flux de logs + recherche du motif factice. |
| T9 | Aucun événement `PRAYER_*` n'est écrit dans le journal d'audit général. | Assertion sur le registre général après un parcours complet. |
| T10 | Échange de deux `ciphertext` entre deux demandes ⇒ échec d'authentification AEAD. Échange `message`/`name` ⇒ échec. | Vecteurs de test figés. |
| T11 | Une enveloppe déplacée d'une demande vers une autre est rejetée par le `requestId` embarqué. | Vecteur de test. |
| T12 | Les longueurs de `ciphertext` ne suivent que les paliers de 256 octets (aucune corrélation avec la longueur du clair). | Chiffrement de messages de tailles 1…500 et vérification du nombre de paliers distincts. |
| T13 | Un `nonce` de longueur ≠ 12 ou un `keyReference` mal formé sont rejetés avant tout appel cryptographique. | Tests de validation Zod + constructeur du value object. |
| T14 | Le corps de la réponse de soumission publique ne contient que `{ id }`. | Assertion de schéma strict. |
| T15 | Une demande anonyme ne peut pas porter de nom : la contrainte de base refuse l'insertion. | Test d'intégration sur la contrainte `CHECK`. |
| T16 | Aucun champ `contact`, `email`, `phone` n'existe dans le schéma, les DTO, les schémas Zod ou les réponses des routes de prière. | Test de schéma + introspection OpenAPI. |
| T17 | Un ré-enveloppement est idempotent : deux exécutions produisent une seule enveloppe par `(demande, clé)`. | Test d'upsert. |
| T18 | Une lecture ne renvoie **que** les enveloppes du principal authentifié. | Test avec deux Admins, assertion sur le corps. |

---

# Annexe B — Registre des versions de format (v1)

| Paramètre | v1 |
| --- | --- |
| AEAD du contenu | AES-256-GCM |
| Taille de DEK | 32 octets |
| Taille de nonce | 12 octets, aléatoire, distinct par champ |
| Tag | 16 octets |
| Bourrage | paliers de 256 octets, préfixe de longueur sur 4 octets big-endian |
| AAD | `"ccjv-prayer" 0x1F version 0x1F requestId 0x1F champ` |
| Enveloppement | RSA-OAEP, 4096 bits, SHA-256 / MGF1-SHA-256 |
| Charge utile d'enveloppe | `0x01 ‖ DEK(32) ‖ requestId(16)` |
| KDF du blob local | PBKDF2-HMAC-SHA-256, 600 000 itérations, sel 16 octets |
| Chiffrement du blob local | AES-256-GCM, AAD `"ccjv-prayer-adminkey:v1:<userId>:<keyReference>"` |
| Empreinte de clé | `base32(SHA-256(SPKI)[0..19])`, groupes de 5 |
| Identifiant de demande | UUIDv4, généré par le navigateur du visiteur |

**Règle d'évolution :** ajouter une ligne = ajouter une version (v2, v3…). Les
paramètres d'une version publiée ne sont **jamais** modifiés : une valeur erronée
devient une nouvelle version. Retirer une version exige une ré-écriture préalable
des données concernées (§3.5) et constitue une opération de sécurité tracée.

---

# Annexe C — Récapitulatif des garanties

| # | Affirmation | Statut | Section |
| --- | --- | --- | --- |
| G1 | Un `SUPER_ADMIN` ne peut lire aucune demande enregistrée, passée ou future, sans action active et détectable | **Tenue** (sous réserve de Q9) | §4.4 |
| G2 | Un accès complet à la base ou au backend ne permet de déchiffrer aucune demande | **Tenue** | §4.4, M1-M2 |
| G3 | Aucune surface applicative ne révèle au `SUPER_ADMIN` l'existence, le nombre, les dates ou les notifications des prières | **Tenue** | §5.2, §6.2, §7.4 |
| G4 | L'ajout ou le retrait d'un Admin ne provoque jamais de perte d'historique | **Tenue** | §5.4 |
| G5 | Le refus intervient avant toute lecture de données et avant toute opération cryptographique | **Tenue** | §5.2.1 |
| G6 | Aucun événement de prière n'est lisible dans le journal général | **Tenue** | §6.3.1 |
| G7 | Un Admin révoqué perd rétroactivement l'accès à ce qu'il pouvait lire | **NON TENUE** — seule la ré-écriture du contenu l'approcherait | §5.4.3 |
| G8 | Le nombre, les dates et l'existence des demandes sont invisibles à un adversaire détenant une sauvegarde complète ou le rôle propriétaire de la base | **NON TENUE** | §1.5 P3, §4.6 |
| G9 | Un adversaire contrôlant le déploiement, le registre des clés ou l'outil de cérémonie ne peut pas lire les demandes **futures** | **NON TENUE** — détectable, non empêchable | §4.4.2, §4.8 |
| G10 | Les données restent lisibles indéfiniment | **Conditionnelle** — perte définitive si clés Admin et custodie sont perdues | §5.6 |
| G11 | Le système résiste à un futur adversaire quantique | **NON TENUE en v1** | §1.4, Q7 |
