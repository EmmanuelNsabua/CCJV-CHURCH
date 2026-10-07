# 036 — Périmètre des publications et espaces départementaux

> **Statut :** clôt les deux points laissés ouverts par `docs/035` §3.
> **Décision du commanditaire.** Elle ne rouvre aucune décision antérieure.

---

## 1. Décision

**Seuls Presse et Ecodume sont des entités pouvant produire des publications**, et
seules elles disposent d'un **espace dédié dans le back-office**.

```text
Presse     → publie · espace back-office dédié
Ecodume    → publie · espace back-office dédié
Affaires Sociales → ne publie pas · pas d'espace back-office
```

**Aucune publication rattachée aux Affaires Sociales n'existe actuellement.** Le
cas n'a donc pas à être traité par la migration.

La question « que faire si une publication relevait des Affaires Sociales ? » est
**reportée** : elle sera tranchée plus tard si le besoin apparaît. Aucune
contrainte n'est posée aujourd'hui pour l'anticiper.

---

## 2. Conséquence sur le modèle — le mécanisme est confirmé

`docs/035` §3.2 proposait trois voies pour exprimer l'exclusion. La formulation du
commanditaire — *« des entités pouvant faire des publications et donc posséder un
espace dédié »* — **retient la capacité de département** (option 2 de D-25).

C'est le même mécanisme que celui déjà arrêté pour la portée événementielle :

```text
Department
 ├── id
 ├── name
 ├── slug
 └── capabilities / policies
       ├── event_management_scope   (D-25 : Presse = GLOBAL)
       └── can_publish              (Presse, Ecodume = true)
```

**Deux bénéfices, déjà énoncés pour D-25 et valables ici :**

- **aucune condition codée en dur** — pas de `if (code === "PRESSE")` ;
- **extensible sans migration** — un département qui se mettrait à publier se voit
  accorder la capacité par le `SUPER_ADMIN` (décision Q-06/Q-S6), sans toucher au
  code ni au schéma.

Cela répond directement à la réserve formulée en `docs/035` §3.1 : l'exclusion
n'est plus une règle sans support, elle est une **capacité administrable**.

---

## 3. Conséquence sur la migration (Q-S1)

Le périmètre se réduit et le mapping devient déterminable :

```text
10 publications existantes
        ↓
rattachement à Presse ou à Ecodume
        ↓
selon la nature réelle de chaque publication
```

Aucun cas « Affaires Sociales » à arbitrer : la question ne se pose pas sur les
données existantes.

Rappel de `docs/035` : la règle des 3 étant **globale**, le rattachement
départemental ne détermine pas le quota — il documente l'**origine** de chaque
publication. Le nombre d'archivages reste **7**, indépendamment de la répartition
retenue.

---

## 4. État

**La conception est close.** Aucun arbitrage ne reste en attente.

Deux actions, non décisionnelles :

1. **Identité du compte `SUPER_ADMIN`** — à désigner par l'organisation au
   bootstrap (`Q-NT3`).
2. **Mapping des 10 publications** vers Presse ou Ecodume (`Q-S1`), depuis leur
   contenu réel.

**Prochaine étape : Lot 0 (ESLint, absent du backend) puis Lot 1 — identité,
rôles, scopes, policies.**
