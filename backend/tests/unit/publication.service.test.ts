import { describe, expect, it, jest } from "@jest/globals";
import type { Publication } from "@/domain/entities";
import { planPublication } from "@/domain/rules/publication-quota";
import type { PublicationRepository } from "@/domain/repositories";
import { PublicationService } from "@/modules/publications/publication.service";
import type {
  CreatePublicationBody,
  PublicationListQuery,
  UpdatePublicationBody,
} from "@/modules/publications/publication.schema";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Règles métier des publications, testées **sans base de données**.
 *
 * Deux familles de règles sont couvertes :
 *
 * 1. **Cohérence type ↔ contenu** — une VIDEO sans lien http(s), une PHOTO sans
 *    image et un TEXTE sans corps sont refusés *avant* toute écriture ;
 * 2. **Aucun brouillon ne sort d'une lecture publique** — le service force
 *    `status: "PUBLISHED"` en liste et appelle `findByIdOrSlug(value, false)`
 *    en lecture unitaire, alors que les opérations d'administration résolvent la
 *    ressource brouillons compris.
 */

const PUBLICATION_ID = "3b4c5d6e-7f80-4a1b-9c2d-3e4f5a6b7c8d";
const COVER_MEDIA_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
/** Département **responsable** : obligatoire depuis D-02 / D-06. */
const DEPARTMENT_ID = "d0000000-0000-4000-8000-00000000000a";

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
/* -------------------------------------------------------------------------- */

function publicationFixture(overrides: Partial<Publication> = {}): Publication {
  return {
    id: PUBLICATION_ID,
    title: "Enseignement du mercredi",
    slug: "enseignement-du-mercredi",
    type: "TEXTE",
    category: "ENSEIGNEMENT",
    status: "PUBLISHED",
    contentUrl: null,
    coverImageUrl: null,
    description: null,
    body: ["Premier paragraphe."],
    author: null,
    publishedAt: "2026-05-01",
    departmentId: DEPARTMENT_ID,
    archivedAt: null,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

/**
 * Double **en mémoire** du contrat `PublicationRepository`.
 *
 * Il reproduit la règle de visibilité du vrai repository : `findByIdOrSlug`
 * refuse un brouillon quand `includeDrafts` vaut `false`. C'est ce qui permet
 * de vérifier que le service demande bien l'exclusion.
 */
function fakePublicationRepository(seed: readonly Publication[] = []) {
  const store = new Map<string, Publication>(
    seed.map((item) => [item.id, item]),
  );
  const slugs = new Set(seed.map((item) => item.slug));

  const repository: PublicationRepository = {
    async list(options, filters) {
      const all = [...store.values()].filter(
        (item) =>
          (filters.type === undefined || item.type === filters.type) &&
          (filters.category === undefined || item.category === filters.category) &&
          (filters.status === undefined || item.status === filters.status),
      );

      return {
        items: all.slice(options.offset, options.offset + options.limit),
        total: all.length,
      };
    },

    async findById(id) {
      return store.get(id) ?? null;
    },

    async findByIdOrSlug(value, includeDrafts) {
      for (const item of store.values()) {
        if (item.id !== value && item.slug !== value) continue;
        if (!includeDrafts && item.status !== "PUBLISHED") continue;
        return item;
      }
      return null;
    },

    async slugExists(slug) {
      return slugs.has(slug);
    },

    async create(data, slug) {
      const created = publicationFixture({
        id: `id-${slug}`,
        title: data.title,
        slug,
        type: data.type,
        category: data.category,
        // Valeur par défaut du repository : `PUBLISHED` si le client n'a rien
        // demandé. `DRAFT` est une décision explicite.
        status: data.status ?? "PUBLISHED",
        contentUrl: data.contentUrl ?? null,
        coverImageUrl: data.coverMediaId === undefined || data.coverMediaId === null
          ? null
          : "https://cdn.example.test/cover.jpg",
        description: data.description ?? null,
        body: data.body ?? null,
        author: data.author ?? null,
        publishedAt: data.publishedAt,
      });

      store.set(created.id, created);
      slugs.add(slug);
      return created;
    },

    async update(id, data) {
      const existing = store.get(id);
      if (existing === undefined) return null;

      const updated: Publication = {
        ...existing,
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.contentUrl !== undefined ? { contentUrl: data.contentUrl } : {}),
        ...(data.coverMediaId !== undefined
          ? {
              coverImageUrl:
                data.coverMediaId === null
                  ? null
                  : "https://cdn.example.test/cover.jpg",
            }
          : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
      };

      store.set(id, updated);
      return updated;
    },

    async remove(id) {
      return store.delete(id);
    },

    /**
     * Écriture d'attente : le double applique le **même** effet que le vrai
     * repository — statut, et date d'archivage posée avec l'archive, jamais après.
     */
    async applyLifecycle(id, change) {
      const existing = store.get(id);
      if (existing === undefined) return null;

      const updated: Publication = {
        ...existing,
        status: change.status,
        archivedAt: change.status === "ARCHIVED" ? change.at : null,
        updatedAt: change.at,
      };
      store.set(id, updated);
      return updated;
    },

    /**
     * Double du quota : il rejoue la règle du domaine (`planPublication`) sur son
     * propre magasin, **sans transaction ni verrou**.
     *
     * ⚠️ **Ce que ce double ne vérifie pas** — et ne peut pas vérifier : ni la
     * transaction de `DrizzlePublicationRepository.publishWithQuota`, ni le verrou
     * d'avis `pg_advisory_xact_lock(hashtext('publications.quota'))`, ni les
     * contraintes de PostgreSQL. Un double n'a ni connexion, ni transaction, ni
     * verrou. Les tests de **ce fichier** établissent une seule chose : que
     * `PublicationService` appelle le quota, quand, et avec quels arguments.
     *
     * Cette distinction est écrite ici après l'audit `docs/039` §7 (I1). Une
     * version antérieure de ce commentaire affirmait que « la sûreté en
     * concurrence est vérifiée là où elle existe : dans le repository, avec
     * PostgreSQL » — c'est-à-dire qu'elle renvoyait à une vérification qui
     * **n'existait nulle part**. Elle existe désormais, et elle est ailleurs :
     *
     * - `tests/integration/publication-quota.test.ts` — le repository **réel** sur
     *   PostgreSQL : quota, archivage de la plus ancienne, départage par `id ASC`,
     *   et trois publications concurrentes sérialisées par le verrou ;
     * - `tests/unit/publication-quota.test.ts` — le **plan** seul
     *   (`planPublication`), sans base de données.
     */
    async publishWithQuota(id, publishedAt) {
      const target = store.get(id);
      if (target === undefined) return null;

      const plan = planPublication([...store.values()], id);

      if (plan.toArchive !== null) {
        const archived = store.get(plan.toArchive.id);
        if (archived !== undefined) {
          store.set(archived.id, {
            ...archived,
            status: "ARCHIVED",
            archivedAt: new Date("2026-06-01T00:00:00.000Z"),
          });
        }
      }

      const updated: Publication = { ...target, status: "PUBLISHED", publishedAt };
      store.set(id, updated);
      return updated;
    },
  };

  return { repository, store };
}

function body(overrides: Partial<CreatePublicationBody> = {}): CreatePublicationBody {
  return {
    title: "Enseignement du mercredi",
    type: "TEXTE",
    category: "ENSEIGNEMENT",
    body: ["Premier paragraphe."],
    publishedAt: "2026-05-01",
    // Département **responsable** : obligatoire depuis D-02 / D-06.
    departmentId: DEPARTMENT_ID,
    ...overrides,
  };
}

function expectAppError(
  received: unknown,
  code: AppError["code"],
  statusCode: number,
): AppError {
  expect(isAppError(received)).toBe(true);
  const error = received as AppError;
  expect(error.code).toBe(code);
  expect(error.statusCode).toBe(statusCode);
  return error;
}

async function capture(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

/* -------------------------------------------------------------------------- */
/*  Règles par type — VIDEO                                                   */
/* -------------------------------------------------------------------------- */

describe("PublicationService — règles du type VIDEO", () => {
  it("accepte une URL https", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const created = await service.create(
      body({
        type: "VIDEO",
        body: null,
        contentUrl: "https://www.youtube.com/watch?v=abc123",
      }),
    );

    expect(created.type).toBe("VIDEO");
    expect(created.contentUrl).toBe("https://www.youtube.com/watch?v=abc123");
  });

  it("accepte une URL http", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    await expect(
      service.create(
        body({ type: "VIDEO", body: null, contentUrl: "http://cdn.ccjv.test/v.mp4" }),
      ),
    ).resolves.toMatchObject({ type: "VIDEO" });
  });

  it("refuse une VIDEO sans contentUrl (VALIDATION_ERROR, 400)", async () => {
    const { repository, store } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const error = expectAppError(
      await capture(service.create(body({ type: "VIDEO", body: null }))),
      "VALIDATION_ERROR",
      400,
    );

    expect(error.details).toEqual({ champ: "contentUrl" });
    expect(store.size).toBe(0);
  });

  it("refuse une VIDEO dont le contentUrl n'est pas http(s)", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    for (const contentUrl of [
      "ftp://cdn.ccjv.test/v.mp4",
      "/media/video.mp4",
      "javascript:alert(1)",
      "youtube.com/watch?v=abc",
      "",
    ]) {
      const error = expectAppError(
        await capture(
          service.create(body({ type: "VIDEO", body: null, contentUrl })),
        ),
        "VALIDATION_ERROR",
        400,
      );
      expect(error.details).toEqual({ champ: "contentUrl" });
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Règles par type — PHOTO                                                   */
/* -------------------------------------------------------------------------- */

describe("PublicationService — règles du type PHOTO", () => {
  it("accepte une PHOTO portant un contentUrl", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    await expect(
      service.create(
        body({
          type: "PHOTO",
          body: null,
          contentUrl: "https://cdn.ccjv.test/photo.jpg",
        }),
      ),
    ).resolves.toMatchObject({ type: "PHOTO" });
  });

  it("accepte une PHOTO portant seulement un coverMediaId", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const created = await service.create(
      body({ type: "PHOTO", body: null, coverMediaId: COVER_MEDIA_ID }),
    );

    expect(created.coverImageUrl).toBe("https://cdn.example.test/cover.jpg");
  });

  it("refuse une PHOTO sans contentUrl ni coverMediaId", async () => {
    const { repository, store } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const error = expectAppError(
      await capture(service.create(body({ type: "PHOTO", body: null }))),
      "VALIDATION_ERROR",
      400,
    );

    expect(error.details).toEqual({ champ: "contentUrl" });
    expect(store.size).toBe(0);
  });

  it("refuse une PHOTO dont le coverMediaId vaut explicitement null et sans URL", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    expectAppError(
      await capture(
        service.create(body({ type: "PHOTO", body: null, coverMediaId: null })),
      ),
      "VALIDATION_ERROR",
      400,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  Règles par type — TEXTE                                                   */
/* -------------------------------------------------------------------------- */

describe("PublicationService — règles du type TEXTE", () => {
  it("accepte un TEXTE avec un corps non vide", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    await expect(
      service.create(body({ body: ["Un paragraphe."] })),
    ).resolves.toMatchObject({ type: "TEXTE" });
  });

  it("refuse un TEXTE sans body", async () => {
    const { repository, store } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const error = expectAppError(
      await capture(service.create(body({ body: null }))),
      "VALIDATION_ERROR",
      400,
    );

    expect(error.details).toEqual({ champ: "body" });
    expect(store.size).toBe(0);
  });

  it("refuse un TEXTE dont le body est vide", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    for (const bodyValue of [[], ["   "], ["", "\n"]]) {
      expectAppError(
        await capture(service.create(body({ body: bodyValue }))),
        "VALIDATION_ERROR",
        400,
      );
    }
  });

  it("n'exige aucun lien pour un TEXTE", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    await expect(
      service.create(body({ contentUrl: null })),
    ).resolves.toMatchObject({ type: "TEXTE" });
  });
});

/* -------------------------------------------------------------------------- */
/*  Statut                                                                    */
/* -------------------------------------------------------------------------- */

describe("PublicationService — statut", () => {
  it("laisse le repository appliquer PUBLISHED quand le statut est absent", async () => {
    const { repository } = fakePublicationRepository();
    const create = jest.spyOn(repository, "create");
    const service = new PublicationService(repository);

    const created = await service.create(body());

    const [input] = create.mock.calls[0] ?? [];
    // Le service ne devine pas de statut : l'absence de valeur est transmise
    // telle quelle, et c'est le repository qui retombe sur PUBLISHED.
    expect(input).not.toHaveProperty("status");
    expect(created.status).toBe("PUBLISHED");
  });

  it("transmet un statut DRAFT explicite", async () => {
    const { repository, store } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const created = await service.create(body({ status: "DRAFT" }));

    expect(created.status).toBe("DRAFT");
    expect(store.get(created.id)?.status).toBe("DRAFT");
  });

  it("transmet un statut PUBLISHED explicite", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    await expect(service.create(body({ status: "PUBLISHED" }))).resolves.toMatchObject({
      status: "PUBLISHED",
    });
  });
});

/* -------------------------------------------------------------------------- */
/*  Brouillons et lecture publique                                            */
/* -------------------------------------------------------------------------- */

describe("PublicationService — les brouillons ne sortent pas", () => {
  it("force status PUBLISHED sur la liste publique, quoi que demande le client", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture(),
      publicationFixture({
        id: "brouillon",
        slug: "brouillon",
        status: "DRAFT",
      }),
    ]);
    const list = jest.spyOn(repository, "list");
    const service = new PublicationService(repository);

    const query: PublicationListQuery = {
      page: 1,
      limit: 20,
      type: "TEXTE",
      category: "ENSEIGNEMENT",
      sort: { column: "published_at", direction: "desc" },
    };
    const resultat = await service.list(query);

    const [, filters] = list.mock.calls[0] ?? [];
    // Le filtre de statut n'est pas celui du client : il est imposé par le
    // service, et la query publique ne comporte de toute façon pas de `status`.
    expect(filters).toEqual({
      type: "TEXTE",
      category: "ENSEIGNEMENT",
      status: "PUBLISHED",
    });
    expect(resultat.items.map((item) => item.slug)).toEqual([
      "enseignement-du-mercredi",
    ]);
    expect(resultat.total).toBe(1);
  });

  it("calcule l'offset de la page demandée", async () => {
    const { repository } = fakePublicationRepository();
    const list = jest.spyOn(repository, "list");
    const service = new PublicationService(repository);

    await service.list({
      page: 3,
      limit: 15,
      sort: { column: "published_at", direction: "desc" },
    });

    expect(list.mock.calls[0]?.[0]).toEqual({ limit: 15, offset: 30 });
  });

  it("lit une publication publiée avec includeDrafts = false", async () => {
    const { repository } = fakePublicationRepository([publicationFixture()]);
    const findByIdOrSlug = jest.spyOn(repository, "findByIdOrSlug");
    const service = new PublicationService(repository);

    await service.get("enseignement-du-mercredi");

    expect(findByIdOrSlug).toHaveBeenCalledWith("enseignement-du-mercredi", false);
  });

  it("rend un brouillon indistinguable d'un absent en lecture publique", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({ status: "DRAFT" }),
    ]);
    const service = new PublicationService(repository);

    const failure = await capture(service.get("enseignement-du-mercredi"));

    expectAppError(failure, "PUBLICATION_NOT_FOUND", 404);
  });

  it("résout un brouillon pour la mise à jour (administration)", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({ status: "DRAFT" }),
    ]);
    const findByIdOrSlug = jest.spyOn(repository, "findByIdOrSlug");
    const service = new PublicationService(repository);

    const updated = await service.update("enseignement-du-mercredi", {
      status: "PUBLISHED",
    });

    expect(findByIdOrSlug).toHaveBeenCalledWith("enseignement-du-mercredi", true);
    expect(updated.status).toBe("PUBLISHED");
  });

  it("résout un brouillon pour la suppression (administration)", async () => {
    const { repository, store } = fakePublicationRepository([
      publicationFixture({ status: "DRAFT" }),
    ]);
    const service = new PublicationService(repository);

    await service.remove("enseignement-du-mercredi");

    expect(store.size).toBe(0);
  });

  it("répond PUBLICATION_NOT_FOUND sur un slug inconnu", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    expectAppError(
      await capture(service.get("inconnu")),
      "PUBLICATION_NOT_FOUND",
      404,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  Cohérence sur la ressource fusionnée (PATCH)                              */
/* -------------------------------------------------------------------------- */

describe("PublicationService — cohérence lors d'une mise à jour partielle", () => {
  it("refuse un PATCH qui viderait le contentUrl d'une VIDEO", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({
        type: "VIDEO",
        body: null,
        contentUrl: "https://www.youtube.com/watch?v=abc123",
      }),
    ]);
    const service = new PublicationService(repository);

    const patch: UpdatePublicationBody = { contentUrl: null };
    const error = expectAppError(
      await capture(service.update("enseignement-du-mercredi", patch)),
      "VALIDATION_ERROR",
      400,
    );

    expect(error.details).toEqual({ champ: "contentUrl" });
  });

  it("refuse un PATCH qui bascule un TEXTE en VIDEO sans lui donner de lien", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({ type: "TEXTE" }),
    ]);
    const service = new PublicationService(repository);

    const patch: UpdatePublicationBody = { type: "VIDEO" };
    expectAppError(
      await capture(service.update("enseignement-du-mercredi", patch)),
      "VALIDATION_ERROR",
      400,
    );
  });

  it("accepte un PATCH cohérent sur la ressource fusionnée", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({
        type: "VIDEO",
        body: null,
        contentUrl: "https://www.youtube.com/watch?v=abc123",
      }),
    ]);
    const service = new PublicationService(repository);

    const updated = await service.update("enseignement-du-mercredi", {
      contentUrl: "https://www.youtube.com/watch?v=def456",
    });

    expect(updated.contentUrl).toBe("https://www.youtube.com/watch?v=def456");
  });

  it("refuse de vider le corps d'un TEXTE", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({ type: "TEXTE" }),
    ]);
    const service = new PublicationService(repository);

    expectAppError(
      await capture(service.update("enseignement-du-mercredi", { body: [] })),
      "VALIDATION_ERROR",
      400,
    );
  });

  it("répond PUBLICATION_NOT_FOUND à la mise à jour d'une publication inconnue", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    expectAppError(
      await capture(service.update("inconnu", { title: "Autre titre" })),
      "PUBLICATION_NOT_FOUND",
      404,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  Slug                                                                      */
/* -------------------------------------------------------------------------- */

describe("PublicationService — slug", () => {
  it("dérive le slug du titre", async () => {
    const { repository } = fakePublicationRepository();
    const service = new PublicationService(repository);

    const created = await service.create(body({ title: "Noël 2026" }));

    expect(created.slug).toBe("noel-2026");
  });

  it("suffixe le slug dérivé du titre en cas de collision", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({ slug: "enseignement-du-mercredi" }),
    ]);
    const service = new PublicationService(repository);

    const created = await service.create(body());

    expect(created.slug).toBe("enseignement-du-mercredi-2");
  });

  it("refuse un slug explicite déjà pris (DUPLICATE_SLUG, 409)", async () => {
    const { repository } = fakePublicationRepository([
      publicationFixture({ slug: "enseignement-du-mercredi" }),
    ]);
    const service = new PublicationService(repository);

    const error = expectAppError(
      await capture(service.create(body({ slug: "Enseignement du mercredi" }))),
      "DUPLICATE_SLUG",
      409,
    );

    expect(error.details).toEqual({ slug: "enseignement-du-mercredi" });
  });
});
