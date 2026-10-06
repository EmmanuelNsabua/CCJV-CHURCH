# Spécification d'implémentation des modules — backend CCJV

> À respecter à la lettre. Tout écart produit une incohérence entre modules,
> et l'API doit rester homogène (`docs/004` §15, cahier §15).

---

## 1. Arborescence d'un module

```text
src/modules/<nom>/
├── <nom>.schema.ts       # schémas Zod (création, mise à jour, liste, paramètres)
├── <nom>.serializer.ts   # entité domaine → représentation API
├── <nom>.service.ts      # règles métier ; ne connaît ni HTTP ni Drizzle
├── <nom>.controller.ts   # requête HTTP → service → réponse ; aucune règle métier
└── <nom>.routes.ts       # fabrique de Router
```

Les implémentations de persistance vivent **hors** des modules :

```text
src/infrastructure/repositories/<nom>.repository.ts
```

---

## 2. Couche domaine — déjà écrite, à ne pas modifier

- Entités : `src/domain/entities/index.ts`
- Contrats de repositories : `src/domain/repositories/index.ts`
- Règles : `src/domain/rules/` (ex. `computeEventStatus`)

Le domaine **n'importe jamais** Drizzle, Express ou Supabase.

---

## 3. Repositories

```ts
export class DrizzleDepartmentRepository implements DepartmentRepository {
  constructor(private readonly db: Database) {}
}
```

Règles :

1. **Le repository résout les médias.** Les entités du domaine portent déjà des
   URL (`bannerImageUrl`, `galleryUrls`, `photoUrl`, `imageUrl`, `coverImageUrl`).
   C'est le repository qui joint `media` et renvoie des entités prêtes à
   sérialiser. Les services ne manipulent jamais d'identifiant de média en
   lecture.
2. **Aucune requête N+1.** Une galerie se charge par une seule requête
   `where inArray(eventMedia.eventId, ids)` regroupée en mémoire, jamais dans une
   boucle.
3. `list()` retourne toujours `{ items, total }` : le `total` provient d'un
   `count()` séparé avec les mêmes filtres.
4. Les colonnes `date`/`time` restent des **chaînes** (`YYYY-MM-DD`, `HH:MM:SS`).
   Ne jamais construire d'objet `Date` pour ces champs.
5. `findByIdOrSlug(value)` accepte un UUID **ou** un slug : c'est ce qui permet
   au frontend d'utiliser ses URL actuelles sans requête supplémentaire.
6. `slugExists(slug, exceptId?)` sert à la génération de slug et à la détection
   de conflit (`DUPLICATE_SLUG`).

---

## 4. Services

```ts
export class DepartmentService {
  constructor(private readonly departments: DepartmentRepository) {}
}
```

Règles :

1. **Aucun import d'Express.** Le service ne connaît ni `req`, ni `res`, ni code
   HTTP. Il lève des erreurs du domaine (`NotFoundError`, `DuplicateSlugError`…).
2. Génération de slug : `uniqueSlug(nom, (c) => repo.slugExists(c, id))`.
3. Vérification d'existence avant écriture ; `null` → `NotFoundError` avec le
   **code exact** de la ressource (`DEPARTMENT_NOT_FOUND`, `EVENT_NOT_FOUND`…).
4. Validation métier au-delà de Zod : par exemple, un `EVENT` ne peut pas
   référencer un `departmentId` inexistant.
5. Fonctions courtes, une intention par méthode.

---

## 5. Controllers

```ts
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";

export const departmentController = {
  async list(req: Request, res: Response) {
    const { page, limit } = validatedQuery<PaginationQuery>(req);
    const { items, total } = await service.list({ ... });
    sendCollection(res, items.map(toDepartmentDto), page, limit, total);
  },
};
```

Règles :

1. Le controller **lit** les entrées validées, **appelle** le service,
   **sérialise** et **répond**. Rien d'autre.
2. Les données entrantes passent par `validatedParams` / `validatedQuery` —
   jamais par `req.params` ou `req.query` directement : ces valeurs ne sont pas
   validées.
3. Les erreurs ne sont **jamais** attrapées dans un controller : Express 5
   propage automatiquement le rejet d'une fonction `async` vers le middleware
   d'erreur. Ne pas écrire de `try/catch` inutile.
4. Aucune construction manuelle de réponse d'erreur : `sendError` est réservé au
   middleware d'erreur.

---

## 6. Routes

```ts
export interface DepartmentRouterDeps {
  service: DepartmentService;
  authDeps: AuthDependencies;
}

export function createDepartmentRouter(deps: DepartmentRouterDeps): Router {
  const router = Router();
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  // Lecture publique
  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get("/:idOrSlug", validate({ params: idOrSlugSchema }), controller.get);

  // Écriture réservée à l'administration
  router.post("/", ...admin, validate({ body: createSchema }), controller.create);
  router.patch("/:idOrSlug", ...admin, validate({ body: updateSchema }), controller.update);
  router.delete("/:idOrSlug", ...admin, controller.remove);

  return router;
}
```

Règles :

1. **Séparation public / administration explicite.** Aucune route d'écriture
   n'est montée sans `...admin` (cahier §8).
2. Ordre des middlewares : `authenticate` → `requireAdmin` → `requireRole` →
   `validate`. Ne jamais valider avant d'authentifier une route protégée.
3. Le préfixe `/api/v1` est ajouté au montage, jamais dans le router.

---

## 7. Sérialisation — contrat du frontend

La sortie doit rester **strictement** compatible avec `src/types/index.ts` du
frontend. Correspondances imposées :

| Entité | Champ API | Source domaine |
| --- | --- | --- |
| Department | `bannerImage`, `gallery`, `keyPoints`, `meetingSchedule`, `responsibleName`, `tagline` | `bannerImageUrl`, `galleryUrls`, … |
| Event | `imageUrl`, `bannerImage`, `gallery`, `eventDate`, `eventTime`, `practicalInfo`, `status` | idem |
| Publication | `contentUrl`, `publishedAt`, `body`, `category`, `type`, `author` | idem |
| Leader | `photo` | `photoUrl` |
| Testimony | `photo`, `name`, `role` | `photoUrl`, `personName`, `personRole` |
| CommunityFace | `photo`, `name`, `caption` | `photoUrl`, `personName` |

`id` reste une chaîne UUID. Les dates sont sérialisées en ISO `YYYY-MM-DD`.
Les `Date` (timestamps) sont sérialisées en ISO 8601 complet.

---

## 8. Pagination, filtres, tri

- `page` ≥ 1 (défaut 1), `limit` 1–100 (défaut 20) via `paginationQuerySchema`.
- Tri : `createSortSchema(colonnes, défaut)` — **jamais** un nom de colonne
  libre venu du client.
- Filtres en liste blanche, validés par Zod.

---

## 9. Erreurs — codes à utiliser

Utiliser les classes de `@/shared/errors/app-error` et **exactement** ces codes :

```text
AUTH_REQUIRED · FORBIDDEN · UNAUTHENTICATED_ADMIN
VALIDATION_ERROR
DEPARTMENT_NOT_FOUND · EVENT_NOT_FOUND · PUBLICATION_NOT_FOUND · PAGE_NOT_FOUND
LEADER_NOT_FOUND · TESTIMONY_NOT_FOUND · COMMUNITY_FACE_NOT_FOUND
SCRIPTURE_NOT_FOUND · SCHEDULE_ENTRY_NOT_FOUND · SOCIAL_LINK_NOT_FOUND
PRAYER_REQUEST_NOT_FOUND · MEDIA_NOT_FOUND
DUPLICATE_SLUG · CONFLICT
FILE_TOO_LARGE · INVALID_FILE_TYPE · RATE_LIMITED · NOT_FOUND
```

---

## 10. Notes de contenu

Aucune donnée institutionnelle ne doit être inventée (cahier §11). Les seeds
reprennent **uniquement** les faits confirmés et les contenus de démonstration
déjà présents dans `frontend/src/data/mock/`.
