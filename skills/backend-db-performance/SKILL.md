---
name: backend-db-performance
description:
  Guide d'optimisation des performances base de données (Drizzle ORM / PostgreSQL / Supabase)
  et prévention des requêtes lentes/timed-out dans le backend et le client API CCJV.
  À consulter impérativement lors de l'implémentation de repositories, endpoints de listing,
  relations 1:N / N:M, ou gestion de pagination.
license: MIT
metadata:
  author: ccjv-core-team
  version: '1.0.0'
---

# Performance Base de Données & Prévention des Timeouts (CCJV)

Ce guide fixe les règles impératives d'ingénierie pour tout accès aux données entre le backend Express (sur Railway), la base de données PostgreSQL (sur Supabase) et le client frontend (Next.js sur Vercel).

---

## 1. Règle d'or : Interdiction absolue des requêtes en boucle (Problème $N+1$)

Dans une architecture cloud où le serveur applicatif (Railway) et la base de données (Supabase) sont distants, **chaque requête SQL subit la latence réseau (RTT)**.
Une boucle de 100 requêtes séquentielles à 40 ms par requête prend 4 à 12 secondes, ce qui déclenche inévitablement un timeout client.

### Anti-pattern à proscrire impérativement
```typescript
// ❌ INTERDIT : N+1 requêtes séquentielles dans une boucle
const rows = await db.select().from(table).limit(limit);
const items = [];
for (const row of rows) {
  const full = await loadFullEntity(row.id); // Émet des requêtes SQL pour chaque ID !
  items.push(full);
}
```

### Pattern officiel CCJV : Chargement ensembliste (*Batch Hydration*)
Toujours structurer la récupération en **requêtes groupées globales** d'une complexité $O(1)$ en nombre d'appels réseau, via `inArray()` :

```typescript
// ✅ OBLIGATOIRE : 1 requête principale + 1 requête par relation avec inArray
private async hydrate(rows: Row[]): Promise<Entity[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  // Requête groupée pour les relations 1:N
  const subItems = await this.db
    .select()
    .from(subTable)
    .where(inArray(subTable.parentId, ids))
    .orderBy(asc(subTable.position));

  // Indexation en mémoire via Map
  const map = new Map<string, SubItem[]>();
  for (const item of subItems) {
    const list = map.get(item.parentId) ?? [];
    list.push(item);
    map.set(item.parentId, list);
  }

  // Assemblage final en mémoire
  return rows.map((row) => ({
    ...row,
    subItems: map.get(row.id) ?? [],
  }));
}
```

---

## 2. Règles de pagination et bornage des limites

1. **Valeurs par défaut sobres :**
   - Taille de page standard pour les listes publiques ou admin : `20` ou `25`.
   - Limite maximale absolue autorisée par Zod sur `limit` : `100`.
2. **Ne pas charger des volumes massifs inutilement :**
   - Côté administration, privilégier une pagination par page côté serveur plutôt que de charger 100 ou 500 items en une seule fois pour paginer en mémoire dans le navigateur.

---

## 3. Calibrage des Timeouts HTTP Client (`src/lib/api/client.ts`)

1. **Lectures publiques :**
   - Le timeout par défaut de `DEFAULT_TIMEOUT_MS = 5_000` (5 secondes) est conservé pour le site public afin d'éviter tout blocage de rendu.
2. **Listes volumineuses ou administration :**
   - Les fonctions d'endpoint consommatrices (`listEnseignements`, listes de médias, exports) doivent spécifier un timeout allongé :
   ```typescript
   await apiFetch<CollectionResponse<Item>>(
     url,
     { timeoutMs: 15_000 }, // 15 secondes
   );
   ```

---

## 4. Précautions spécifiques avec Supabase & PgBouncer

- **`prepare: false`** : Le pooler de transactions de Supabase (Supavisor / PgBouncer) n'accepte pas les déclarations de requêtes préparées réutilisables. Ce paramètre reste obligatoire dans [`client.ts`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/backend/src/infrastructure/database/client.ts).
- **Protection contre la liste vide dans `inArray` :**
  Toujours tester `if (ids.length === 0) return [];` avant d'exécuter `inArray(table.id, ids)`, car PostgreSQL refuse la syntaxe SQL `IN ()`.
