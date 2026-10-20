import { describe, expect, it, jest } from "@jest/globals";
import type { Department } from "@/domain/entities";
import type { DepartmentRepository } from "@/domain/repositories";
import { DepartmentService } from "@/modules/departments/department.service";
import type {
  CreateDepartmentBody,
  UpdateDepartmentBody,
} from "@/modules/departments/department.schema";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Règles métier des départements, testées **sans base de données**.
 *
 * Le slug est le point sensible : c'est l'identifiant public qui apparaît dans
 * les URL du site. Trois comportements sont fixés ici :
 *
 * - dérivé du nom et **suffixé** tant qu'il n'est pas libre ;
 * - un slug **explicite** déjà pris est suffixé lui aussi (`-2`, `-3`…) : le
 *   slug est une adresse, l'identité du département reste son `id` UUID ;
 * - un identifiant inconnu produit `NotFoundError` / `DEPARTMENT_NOT_FOUND`
 *   (404) sur `get`, `update` et `remove`.
 */

const DEPARTMENT_ID = "8f2c1d34-5b6e-4f70-9a11-2c3d4e5f6a7b";

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
/* -------------------------------------------------------------------------- */

function departmentFixture(overrides: Partial<Department> = {}): Department {
  return {
    id: DEPARTMENT_ID,
    name: "Chorale",
    slug: "chorale",
    description: null,
    mission: null,
    history: null,
    responsibleName: null,
    tagline: null,
    meetingSchedule: null,
    keyPoints: null,
    bannerMediaId: null,
    bannerImageUrl: null,
    galleryUrls: [],
    activities: [],
    leaders: [],
    position: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

/** Double en mémoire du contrat `DepartmentRepository`. */
function fakeDepartmentRepository(seed: readonly Department[] = []) {
  const store = new Map<string, Department>(
    seed.map((item) => [item.id, item]),
  );
  const slugs = new Set(seed.map((item) => item.slug));

  const repository: DepartmentRepository = {
    async list(options) {
      const all = [...store.values()];
      return {
        items: all.slice(options.offset, options.offset + options.limit),
        total: all.length,
      };
    },

    async findById(id) {
      return store.get(id) ?? null;
    },

    async findByIdOrSlug(value) {
      for (const item of store.values()) {
        if (item.id === value || item.slug === value) return item;
      }
      return null;
    },

    async slugExists(slug) {
      return slugs.has(slug);
    },

    async exists(id) {
      return store.has(id);
    },

    async create(data, slug) {
      const created = departmentFixture({
        id: `id-${slug}`,
        name: data.name,
        slug,
        description: data.description ?? null,
        mission: data.mission ?? null,
        history: data.history ?? null,
        responsibleName: data.responsibleName ?? null,
        tagline: data.tagline ?? null,
        meetingSchedule: data.meetingSchedule ?? null,
        keyPoints: data.keyPoints ?? null,
        bannerMediaId: data.bannerMediaId ?? null,
        position: data.position ?? 0,
      });

      store.set(created.id, created);
      slugs.add(slug);
      return created;
    },

    async update(id, data) {
      const existing = store.get(id);
      if (existing === undefined) return null;

      const updated: Department = {
        ...existing,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.mission !== undefined ? { mission: data.mission } : {}),
        ...(data.history !== undefined ? { history: data.history } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      };

      store.set(id, updated);
      return updated;
    },

    async archiveAndDelete(id, options) {
      const existing = store.get(id);
      if (!existing) throw new Error("Not found");
      store.delete(id);
      slugs.delete(existing.slug);
      return {
        id: "archive-id",
        originalDepartmentId: id,
        name: existing.name,
        slug: existing.slug,
        snapshot: { ...existing },
        archivedBy: options.archivedBy ?? null,
        archivedAt: new Date(),
        reason: options.reason ?? null,
      };
    },

    async listArchives() {
      return { items: [], total: 0 };
    },

    async listActivities() {
      return [];
    },

    async saveActivities() {
      return [];
    },

    async remove(id) {
      return store.delete(id);
    },
  };

  return { repository, store };
}

function body(overrides: Partial<CreateDepartmentBody> = {}): CreateDepartmentBody {
  return { name: "Chorale", ...overrides };
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
/*  Slug                                                                      */
/* -------------------------------------------------------------------------- */

describe("DepartmentService — slug unique", () => {
  it("dérive le slug du nom", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    const created = await service.create(body({ name: "Département Jeunesse" }));

    expect(created.slug).toBe("departement-jeunesse");
  });

  it("suffixe le slug dérivé du nom quand il est déjà pris", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    const premier = await service.create(body({ name: "Chorale" }));
    const second = await service.create(body({ name: "Chorale" }));

    expect(premier.slug).toBe("chorale");
    expect(second.slug).toBe("chorale-2");
  });

  it("incrémente le suffixe jusqu'au premier slug libre", async () => {
    const { repository } = fakeDepartmentRepository([
      departmentFixture({ id: "id-1", slug: "chorale" }),
      departmentFixture({ id: "id-2", slug: "chorale-2" }),
      departmentFixture({ id: "id-3", slug: "chorale-3" }),
    ]);
    const service = new DepartmentService(repository);

    const created = await service.create(body());

    expect(created.slug).toBe("chorale-4");
  });

  it("accepte un slug explicite libre après normalisation", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    const created = await service.create(
      body({ name: "Chorale", slug: "Chorale Voix d'Espérance" }),
    );

    expect(created.slug).toBe("chorale-voix-d-esperance");
  });

  it("suffixe un slug explicite déjà pris au lieu de refuser la création", async () => {
    const { repository, store } = fakeDepartmentRepository([
      departmentFixture({ slug: "chorale" }),
    ]);
    const service = new DepartmentService(repository);

    const created = await service.create(body({ slug: "Chorale" }));

    expect(created.slug).toBe("chorale-2");
    // La création a bien eu lieu : un doublon de slug n'est plus un refus.
    expect(store.size).toBe(2);
  });

  it("suffixe un slug explicite : l'intention est conservée, l'adresse rendue unique", async () => {
    const { repository } = fakeDepartmentRepository([
      departmentFixture({ slug: "chorale" }),
    ]);
    const slugExists = jest.spyOn(repository, "slugExists");
    const service = new DepartmentService(repository);

    await service.create(body({ slug: "chorale" }));

    // Le premier candidat reste le slug demandé, puis `chorale-2`.
    expect(slugExists).toHaveBeenNthCalledWith(1, "chorale");
    expect(slugExists).toHaveBeenNthCalledWith(2, "chorale-2");
  });

  it("transmet le slug calculé séparément de l'entrée de création", async () => {
    const { repository } = fakeDepartmentRepository();
    const create = jest.spyOn(repository, "create");
    const service = new DepartmentService(repository);

    await service.create(body({ name: "Chorale", slug: "chorale" }));

    const [input, slug] = create.mock.calls[0] ?? [];
    // `slug` n'appartient pas à `DepartmentInput` : il est extrait du corps.
    expect(input).not.toHaveProperty("slug");
    expect(input).toMatchObject({ name: "Chorale" });
    expect(slug).toBe("chorale");
  });

  it("se replie sur « sans-titre » si le nom ne produit aucun slug exploitable", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    const created = await service.create(body({ name: "!!!" }));

    expect(created.slug).toBe("sans-titre");
  });
});

/* -------------------------------------------------------------------------- */
/*  Identifiant inconnu                                                       */
/* -------------------------------------------------------------------------- */

describe("DepartmentService — identifiant inconnu", () => {
  it("répond DEPARTMENT_NOT_FOUND sur un slug inconnu", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    const error = expectAppError(
      await capture(service.get("inconnu")),
      "DEPARTMENT_NOT_FOUND",
      404,
    );

    expect(error.message).toContain("inconnu");
  });

  it("répond DEPARTMENT_NOT_FOUND sur un identifiant inconnu", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    expectAppError(
      await capture(service.get("11111111-2222-4333-8444-555555555555")),
      "DEPARTMENT_NOT_FOUND",
      404,
    );
  });

  it("répond DEPARTMENT_NOT_FOUND à la mise à jour d'un département inconnu", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    const patch: UpdateDepartmentBody = { name: "Nouveau nom" };
    expectAppError(
      await capture(service.update("inconnu", patch)),
      "DEPARTMENT_NOT_FOUND",
      404,
    );
  });

  it("répond DEPARTMENT_NOT_FOUND à la suppression d'un département inconnu", async () => {
    const { repository } = fakeDepartmentRepository();
    const service = new DepartmentService(repository);

    expectAppError(
      await capture(service.remove("inconnu")),
      "DEPARTMENT_NOT_FOUND",
      404,
    );
  });

  it("répond DEPARTMENT_NOT_FOUND quand la ligne disparaît entre la lecture et l'écriture", async () => {
    const { repository } = fakeDepartmentRepository([departmentFixture()]);
    jest.spyOn(repository, "update").mockResolvedValue(null);
    const service = new DepartmentService(repository);

    expectAppError(
      await capture(service.update("chorale", { name: "Nouveau nom" })),
      "DEPARTMENT_NOT_FOUND",
      404,
    );
  });

  it("répond DEPARTMENT_NOT_FOUND quand la ligne disparaît entre la lecture et la suppression", async () => {
    const { repository } = fakeDepartmentRepository([departmentFixture()]);
    jest.spyOn(repository, "remove").mockResolvedValue(false);
    const service = new DepartmentService(repository);

    expectAppError(
      await capture(service.remove("chorale")),
      "DEPARTMENT_NOT_FOUND",
      404,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  Chemins nominaux                                                          */
/* -------------------------------------------------------------------------- */

describe("DepartmentService — lectures et écritures", () => {
  it("lit un département par son slug", async () => {
    const { repository } = fakeDepartmentRepository([departmentFixture()]);
    const service = new DepartmentService(repository);

    await expect(service.get("chorale")).resolves.toMatchObject({
      id: DEPARTMENT_ID,
      slug: "chorale",
    });
  });

  it("lit un département par son identifiant", async () => {
    const { repository } = fakeDepartmentRepository([departmentFixture()]);
    const service = new DepartmentService(repository);

    await expect(service.get(DEPARTMENT_ID)).resolves.toMatchObject({
      id: DEPARTMENT_ID,
    });
  });

  it("calcule l'offset de la page demandée", async () => {
    const { repository } = fakeDepartmentRepository();
    const list = jest.spyOn(repository, "list");
    const service = new DepartmentService(repository);

    await service.list({ page: 4, limit: 5 });

    expect(list).toHaveBeenCalledWith({ limit: 5, offset: 15 });
  });

  it("met à jour un département existant et conserve son slug", async () => {
    const { repository } = fakeDepartmentRepository([departmentFixture()]);
    const service = new DepartmentService(repository);

    const updated = await service.update("chorale", { name: "Chorale Sainte-Cécile" });

    expect(updated.name).toBe("Chorale Sainte-Cécile");
    // Une URL publique ne change pas dans le dos des visiteurs.
    expect(updated.slug).toBe("chorale");
  });

  it("supprime un département existant", async () => {
    const { repository, store } = fakeDepartmentRepository([departmentFixture()]);
    const service = new DepartmentService(repository);

    await service.remove("chorale");

    expect(store.size).toBe(0);
  });

  it("propage une panne du repository sans la transformer", async () => {
    const failure = new Error("base injoignable");
    const { repository } = fakeDepartmentRepository();
    jest.spyOn(repository, "findByIdOrSlug").mockRejectedValue(failure);
    const service = new DepartmentService(repository);

    await expect(service.get("chorale")).rejects.toBe(failure);
  });
});
