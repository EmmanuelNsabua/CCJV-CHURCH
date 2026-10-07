# 035 — Arbitrage final : règle des 3 GLOBALE

> **Statut :** dernier point bloquant levé. La conception est close.
> **Portée :** révise `docs/028` D-18, `docs/032` (contrainte), `docs/033` (migration)
> et `docs/034` §2.

---

## 1. Décision

**La règle des 3 est GLOBALE.**

```text
PUBLISHED ≤ 3        toutes catégories et tous départements confondus
```

Le site ne peut afficher que **trois publications `PUBLISHED` simultanément** —
et non trois par département.

### Mécanique d'archivage

À la publication d'une quatrième :

```text
1. la plus ancienne des trois PUBLISHED est identifiée
   ORDER BY published_at ASC, id ASC
2. elle passe à ARCHIVED — transition irréversible
3. la nouvelle devient PUBLISHED
```

`id` sert de critère de départage en cas d'égalité stricte de `published_at`
(conforme à `docs/028` D-19, inchangé).

### Précision nouvelle — périmètre d'application

**Les Affaires Sociales n'entrent pas dans le périmètre des publications.**

---

## 2. Conséquences sur les documents existants

| Document | Ce qui change |
| --- | --- |
| `028` D-18 | « maximum 3 `PUBLISHED` **par département** » → **maximum 3 au total**. Le reste de D-18 (archivage manuel autorisé, irréversibilité) est inchangé. |
| `032` | La contrainte cesse d'être un index unique partiel sur `(department_id, published_slot)` : elle porte sur le **créneau global** seul. La colonne générée `published_slot` reste, son unicité devient globale. |
| `033` | Étape `É24` (archivage rétroactif) : le nombre d'archivages passe de « ≥ 1 » à **7** — 10 publications existantes pour 3 places. Étape irréversible, sans porte de sortie. |
| `034` §2 | Contradiction **levée** : la lecture B (globale) est retenue. |
| `029` | Les cellules RBAC visant `Publication` restent valides ; seule la règle métier sous-jacente change. |

---

## 3. Deux points à propager, non encore traités

### 3.1 Q-S1 devient plus contraint

`docs/034` §1 prévoyait de rattacher chaque publication « selon sa nature réelle ».
Mais si **les Affaires Sociales sont hors du périmètre des publications**, alors
les **10 publications existantes ne peuvent être rattachées qu'à Presse ou
Ecodume**.

Deux cas à traiter :

- une publication dont la nature réelle relèverait des Affaires Sociales →
  **que fait-on ?** La rattacher malgré tout, la rattacher à un autre
  département, ou l'archiver d'office ?
- le mapping doit être **vérifié** contre cette exclusion, pas seulement établi.

### 3.2 Une règle qui existe désormais sans support en base

L'exclusion des Affaires Sociales du périmètre des publications n'est exprimée
nulle part. Trois options, à choisir lors de l'écriture du schéma :

| Option | Nature |
| --- | --- |
| Contrainte en base (`CHECK` ou trigger) | garanti, mais rigide — un département qui entre dans le périmètre exigerait une migration |
| Capacité de département (`D-25`) : `publication_scope = false` | cohérent avec D-25, extensible **sans migration** |
| Règle applicative seule | souple, mais contournable par un accès direct à la base |

**Recommandation :** la **capacité de département** (option 2) — elle applique au
périmètre des publications le même mécanisme que celui retenu pour la portée
événementielle, et évite de figer dans une contrainte une règle qu'un département
pourrait devoir intégrer plus tard.

---

## 4. État de la conception

**Tous les points bloquants sont levés.** Plus aucune décision n'est requise
avant d'écrire du code.

Restent deux actions, qui ne sont pas des arbitrages :

1. **Identité du compte `SUPER_ADMIN`** — à désigner par l'organisation au moment
   du bootstrap (`Q-NT3`). Non inventable.
2. **Mapping des 10 publications** vers Presse ou Ecodume (`Q-S1`), établi à
   partir de leur contenu réel, **vérifié contre l'exclusion des Affaires
   Sociales** (§3.1).

**Prochaine étape : Lot 0 (ESLint, absent du backend) puis Lot 1 (identité,
rôles, scopes, policies).**
