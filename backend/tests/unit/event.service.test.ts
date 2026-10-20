import { describe, expect, it, jest } from "@jest/globals";
import type { Event } from "@/domain/entities";
import type {
  DepartmentRepository,
  EventRepository,
} from "@/domain/repositories";
import { computeEventStatus } from "@/domain/rules/event-status";
import { EventService } from "@/modules/events/event.service";
import type {
  CreateEventBody,
  EventListQuery,
} from "@/modules/events/event.schema";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Règles métier des événements, testées **sans base de données**.
 *
 * Le service reçoit deux doubles respectant les contrats de
 * `domain/repositories` : aucun appel réseau, aucune écriture. Trois
 * invariants sont couverts ici :
 *
 * 1. le slug est dérivé du titre et suffixé en cas de collision, y compris
 *    lorsqu'il est **explicite** ;
 * 2. un `departmentId` inexistant produit `DEPARTMENT_NOT_FOUND` avant toute
 *    écriture ;
 * 3. le **statut n'est jamais calculé ni transmis** par le service : il reste
 *    entièrement délégué au repository, donc à `computeEventStatus`.
 */

const DEPARTMENT_ID = "8f2c1d34-5b6e-4f70-9a11-2c3d4e5f6a7b";
const OTHER_DEPARTMENT_ID = "d0000000-0000-4000-8000-00000000000a";
const EVENT_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
/* -------------------------------------------------------------------------- */

function eventFixture(overrides: Partial<Event> = {}): Event {
  return {
    id: EVENT_ID,
    title: "Culte du dimanche",
    slug: "culte-du-dimanche",
    description: null,
    excerpt: null,
    eventDate: "2026-05-17",
    eventTime: "09:00",
    startDate: "2026-05-17",
    endDate: "2026-05-17",
    startTime: "09:00",
    endTime: null,
    location: "Temple central",
    imageMediaId: null,
    bannerMediaId: null,
    imageUrl: null,
    bannerImageUrl: null,
    galleryUrls: [],
    departmentId: DEPARTMENT_ID,
    visibilityScope: "DEPARTMENT",
    practicalInfo: null,
    status: "DRAFT",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

/**
 * Double **en mémoire** du contrat `EventRepository`.
 */
function fakeEventRepository(seed: readonly Event[] = []) {
  const store = new Map<string, Event>(seed.map((item) => [item.id, item]));
  const slugs = new Set(seed.map((item) => item.slug));

  const repository: EventRepository = {
    async list(options, filters) {
      const all = [...store.values()].filter(
        (item) =>
          (filters.departmentId === undefined ||
            item.departmentId === filters.departmentId) &&
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

    async findByIdOrSlug(value) {
      for (const item of store.values()) {
        if (item.id === value || item.slug === value) return item;
      }
      return null;
    },

    async slugExists(slug) {
      return slugs.has(slug);
    },

    async create(data, slug) {
      const created = eventFixture({
        id: `id-${slug}`,
        title: data.title,
        slug,
        description: data.description ?? null,
        excerpt: data.excerpt ?? null,
        eventDate: data.eventDate,
        eventTime: data.eventTime ?? null,
        startDate: data.startDate ?? data.eventDate,
        endDate: data.endDate ?? data.eventDate,
        startTime: data.startTime ?? data.eventTime ?? null,
        endTime: data.endTime ?? null,
        location: data.location ?? null,
        departmentId: data.departmentId ?? null,
        imageMediaId: data.imageMediaId ?? null,
        practicalInfo: data.practicalInfo ?? null,
        status: data.status ?? "DRAFT",
      });

      store.set(created.id, created);
      slugs.add(slug);
      return created;
    },

    async update(id, data) {
      const existing = store.get(id);
      if (existing === undefined) return null;

      const updated: Event = {
        ...existing,
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.eventDate !== undefined ? { eventDate: data.eventDate } : {}),
        ...(data.departmentId !== undefined
          ? { departmentId: data.departmentId }
          : {}),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      };

      store.set(id, updated);
      return updated;
    },

    async publish(id) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Event = { ...existing, status: "PUBLISHED", updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },

    async revertToDraft(id) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Event = { ...existing, status: "DRAFT", updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },

    async cancel(id) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Event = { ...existing, status: "CANCELLED", updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },

    async remove(id) {
      return store.delete(id);
    },
  };

  return { repository, store };
}

/** Double de `DepartmentRepository` : seul `exists` est sollicité. */
function fakeDepartmentRepository(exists: boolean): DepartmentRepository {
  const nonSollicite = (): never => {
    throw new Error("Méthode non sollicitée par EventService");
  };

  return {
    async exists(id: string) {
      return exists && id === DEPARTMENT_ID;
    },
    async list() {
      return nonSollicite();
    },
    async findById() {
      return nonSollicite();
    },
    async findByIdOrSlug() {
      return nonSollicite();
    },
    async slugExists() {
      return nonSollicite();
    },
    async create() {
      return nonSollicite();
    },
    async update() {
      return nonSollicite();
    },
    async archiveAndDelete() {
      return nonSollicite();
    },
    async listArchives() {
      return nonSollicite();
    },
    async listActivities() {
      return nonSollicite();
    },
    async saveActivities() {
      return nonSollicite();
    },
    async remove() {
      return nonSollicite();
    },
  };
}

function body(overrides: Partial<CreateEventBody> = {}): CreateEventBody {
  return {
    title: "Culte du dimanche",
    eventDate: "2026-05-17",
    // Département **responsable** : obligatoire depuis D-26 / XD-15.
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

/* -------------------------------------------------------------------------- */
/*  Slug                                                                      */
/* -------------------------------------------------------------------------- */

describe("EventService — génération du slug", () => {
  it("dérive le slug du titre quand aucun slug n'est fourni", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(body({ title: "Veillée de prière" }));

    expect(created.slug).toBe("veillee-de-priere");
  });

  it("suffixe le slug dérivé du titre quand il est déjà pris", async () => {
    const { repository } = fakeEventRepository([
      eventFixture({ slug: "culte-du-dimanche" }),
    ]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(body());

    expect(created.slug).toBe("culte-du-dimanche-2");
  });

  it("incrémente le suffixe jusqu'au premier slug libre", async () => {
    const { repository } = fakeEventRepository([
      eventFixture({ id: "id-1", slug: "culte-du-dimanche" }),
      eventFixture({ id: "id-2", slug: "culte-du-dimanche-2" }),
      eventFixture({ id: "id-3", slug: "culte-du-dimanche-3" }),
    ]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(body());

    expect(created.slug).toBe("culte-du-dimanche-4");
  });

  it("accepte un slug explicite libre, sans le suffixer", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(
      body({ title: "Culte du dimanche", slug: "Culte Spécial 2026" }),
    );

    expect(created.slug).toBe("culte-special-2026");
  });

  it("suffixe un slug explicite déjà pris au lieu de refuser la création", async () => {
    const { repository, store } = fakeEventRepository([
      eventFixture({ slug: "culte-du-dimanche" }),
    ]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(body({ slug: "culte-du-dimanche" }));

    expect(created.slug).toBe("culte-du-dimanche-2");
    // L'événement a bien été ajouté : un doublon de slug n'est plus un refus.
    expect(store.size).toBe(2);
  });

  it("cherche une variante libre pour un slug explicite déjà pris", async () => {
    const { repository } = fakeEventRepository([
      eventFixture({ slug: "culte-du-dimanche" }),
    ]);
    const slugExists = jest.spyOn(repository, "slugExists");
    const service = new EventService(repository, fakeDepartmentRepository(true));

    await service.create(body({ slug: "culte-du-dimanche" }));

    // Le slug demandé reste le premier candidat, la variante vient ensuite.
    expect(slugExists).toHaveBeenNthCalledWith(1, "culte-du-dimanche");
    expect(slugExists).toHaveBeenNthCalledWith(2, "culte-du-dimanche-2");
  });
});

/* -------------------------------------------------------------------------- */
/*  Département référencé                                                     */
/* -------------------------------------------------------------------------- */

describe("EventService — département référencé", () => {
  it("refuse un departmentId inexistant (DEPARTMENT_NOT_FOUND, 404)", async () => {
    const { repository, store } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(false));

    const failure = await service
      .create(body({ departmentId: DEPARTMENT_ID }))
      .catch((error: unknown) => error);

    const error = expectAppError(failure, "DEPARTMENT_NOT_FOUND", 404);
    expect(error.message).toContain(DEPARTMENT_ID);
    // La vérification précède l'écriture : rien n'a été inséré.
    expect(store.size).toBe(0);
  });

  it("accepte un departmentId existant", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(body({ departmentId: DEPARTMENT_ID }));

    expect(created.departmentId).toBe(DEPARTMENT_ID);
  });

  /**
   * **Le modèle a changé, et ces deux tests le fixent.**
   *
   * Ils vérifiaient qu'un événement pouvait être « général », c'est-à-dire sans
   * département. `docs/028` D-26 et XD-15 ont tranché l'inverse : « un événement
   * global au sens d'un `department_id = NULL` **n'existe pas** ». La colonne est
   * désormais `NOT NULL`, et la notion d'événement transversal est portée par
   * `visibility_scope` — un événement garde toujours son département responsable.
   */
  it("exige un département responsable : XD-15 a supprimé l'événement sans département", async () => {
    const departments = fakeDepartmentRepository(true);
    const exists = jest.spyOn(departments, "exists");
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, departments);

    const created = await service.create(body({ departmentId: DEPARTMENT_ID }));

    expect(created.departmentId).toBe(DEPARTMENT_ID);
    // Le service vérifie l'existence du département référencé, mais il ne peut
    // plus être omis : la séquence de création n'a pas de branche « sans
    // département ».
    expect(exists).toHaveBeenCalledWith(DEPARTMENT_ID);
  });

  it("vérifie le département lors d'une mise à jour", async () => {
    const { repository } = fakeEventRepository([eventFixture()]);
    const service = new EventService(repository, fakeDepartmentRepository(false));

    const failure = await service
      .update("culte-du-dimanche", { departmentId: DEPARTMENT_ID })
      .catch((error: unknown) => error);

    expectAppError(failure, "DEPARTMENT_NOT_FOUND", 404);
  });

  it("un événement ne se détache plus de son département : le rattachement est une donnée tenue", async () => {
    const { repository } = fakeEventRepository([
      eventFixture({ departmentId: OTHER_DEPARTMENT_ID }),
    ]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const updated = await service.update("culte-du-dimanche", {
      departmentId: DEPARTMENT_ID,
    });

    // Réaffecter le responsable reste possible (c'est une décision éditoriale),
    // et le service vérifie que le département visé existe…
    expect(updated.departmentId).toBe(DEPARTMENT_ID);
    // …mais le supprimer ne l'est plus : `department_id` est `NOT NULL` et XD-15
    // fait du département responsable un invariant du modèle. Le corps de mise à
    // jour ne peut d'ailleurs plus porter `null` : le schéma le refuse.
    expect(updated.departmentId).not.toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  Statut délégué à computeEventStatus                                       */
/* -------------------------------------------------------------------------- */

describe("EventService — statut délégué", () => {
  it("ne transmet jamais de statut au repository à la création", async () => {
    const { repository } = fakeEventRepository();
    const create = jest.spyOn(repository, "create");
    const service = new EventService(repository, fakeDepartmentRepository(true));

    await service.create(body());

    const [input] = create.mock.calls[0] ?? [];
    expect(input).toBeDefined();
    // `status` n'est ni fourni par le client (absent du schéma) ni ajouté par
    // le service : il est calculé par le repository, à la lecture.
    expect(input).not.toHaveProperty("status");
  });

  it("crée un événement au statut DRAFT par défaut", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(body({ eventDate: "2026-06-01" }));

    expect(created.status).toBe("DRAFT");
  });

  it("gère les transitions de cycle de vie (publish, revertToDraft, cancel)", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const created = await service.create(
      body({
        title: "Séminaire",
        eventDate: "2026-08-01",
        location: "Grand Temple",
        imageMediaId: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(created.status).toBe("DRAFT");

    const published = await service.publish(created.id);
    expect(published.status).toBe("PUBLISHED");

    const reverted = await service.revertToDraft(created.id);
    expect(reverted.status).toBe("DRAFT");

    const cancelled = await service.cancel(created.id);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("transmet les filtres de liste sans injecter de borne `today`", async () => {
    const { repository } = fakeEventRepository([eventFixture()]);
    const list = jest.spyOn(repository, "list");
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const query: EventListQuery = {
      page: 2,
      limit: 10,
      status: "UPCOMING",
      departmentId: DEPARTMENT_ID,
      sort: { column: "event_date", direction: "asc" },
    };

    await service.list(query);

    const [options, filters, sort] = list.mock.calls[0] ?? [];
    expect(options).toEqual({ limit: 10, offset: 10 });
    // `today` est absent : le repository prend la date du jour et applique
    // `computeEventStatus`. Le service ne traduit pas le statut en dates.
    expect(filters).toEqual({
      status: "UPCOMING",
      departmentId: DEPARTMENT_ID,
    });
    expect(filters).not.toHaveProperty("today");
    expect(sort).toEqual({ column: "event_date", direction: "asc" });
  });
});

/* -------------------------------------------------------------------------- */
/*  Lecture, mise à jour, suppression                                         */
/* -------------------------------------------------------------------------- */

describe("EventService — lecture et administration", () => {
  it("lit un événement par son slug", async () => {
    const { repository } = fakeEventRepository([eventFixture()]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    await expect(service.get("culte-du-dimanche")).resolves.toMatchObject({
      id: EVENT_ID,
      slug: "culte-du-dimanche",
    });
  });

  it("lit un événement par son identifiant", async () => {
    const { repository } = fakeEventRepository([eventFixture()]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    await expect(service.get(EVENT_ID)).resolves.toMatchObject({ id: EVENT_ID });
  });

  it("répond EVENT_NOT_FOUND sur un slug inconnu", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const failure = await service.get("inconnu").catch((error: unknown) => error);

    expectAppError(failure, "EVENT_NOT_FOUND", 404);
  });

  it("répond EVENT_NOT_FOUND à la mise à jour d'un événement inconnu", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const failure = await service
      .update("inconnu", { title: "Nouveau titre" })
      .catch((error: unknown) => error);

    expectAppError(failure, "EVENT_NOT_FOUND", 404);
  });

  it("supprime un événement existant", async () => {
    const { repository, store } = fakeEventRepository([eventFixture()]);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    await service.remove("culte-du-dimanche");

    expect(store.size).toBe(0);
  });

  it("répond EVENT_NOT_FOUND à la suppression d'un événement inconnu", async () => {
    const { repository } = fakeEventRepository();
    const service = new EventService(repository, fakeDepartmentRepository(true));

    const failure = await service.remove("inconnu").catch((error: unknown) => error);

    expectAppError(failure, "EVENT_NOT_FOUND", 404);
  });

  it("propage une panne du repository sans la transformer", async () => {
    const failure = new Error("base injoignable");
    const { repository } = fakeEventRepository();
    jest.spyOn(repository, "findByIdOrSlug").mockRejectedValue(failure);
    const service = new EventService(repository, fakeDepartmentRepository(true));

    await expect(service.get("culte-du-dimanche")).rejects.toBe(failure);
  });
});
