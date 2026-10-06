import type { Event } from "@/domain/entities";
import type {
  DepartmentRepository,
  EventRepository,
  ListResult,
} from "@/domain/repositories";
import {
  DuplicateSlugError,
  NotFoundError,
} from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import { slugify, uniqueSlug } from "@/shared/utils/slug";
import type {
  CreateEventBody,
  EventListQuery,
  UpdateEventBody,
} from "./event.schema";

/**
 * Règles métier des événements.
 *
 * Deux invariants portés ici :
 *
 * 1. **Le statut n'est jamais écrit.** Il est recalculé depuis `eventDate` par
 *    le repository (`computeEventStatus`) ; le filtre `status` devient une
 *    comparaison de dates (docs/006 §5).
 * 2. **Un événement ne référence jamais un département inexistant** : la clé
 *    étrangère le garantirait en base, mais elle produirait une erreur SQL
 *    opaque là où le client attend un `DEPARTMENT_NOT_FOUND` explicite.
 */
export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly departments: DepartmentRepository,
  ) {}

  async list(query: EventListQuery): Promise<ListResult<Event>> {
    return this.events.list(
      { limit: query.limit, offset: toOffset(query.page, query.limit) },
      // `today` n'est pas transmis : le repository prend la date du jour.
      { status: query.status, departmentId: query.departmentId },
      query.sort,
    );
  }

  /** Lecture publique : `404 EVENT_NOT_FOUND` si rien ne correspond. */
  async get(idOrSlug: string): Promise<Event> {
    return this.require(idOrSlug);
  }

  async create(data: CreateEventBody): Promise<Event> {
    const { slug: requestedSlug, ...input } = data;

    await this.assertDepartmentExists(input.departmentId);

    const slug = await this.resolveSlug(input.title, requestedSlug);
    return this.events.create(input, slug);
  }

  async update(idOrSlug: string, data: UpdateEventBody): Promise<Event> {
    const existing = await this.require(idOrSlug);

    // Un `departmentId` absent (`undefined`) laisse le rattachement intact ;
    // `null` le supprime explicitement — l'événement redevient général.
    await this.assertDepartmentExists(data.departmentId);

    const updated = await this.events.update(existing.id, data);
    if (updated === null) {
      throw notFound(idOrSlug);
    }

    return updated;
  }

  async remove(idOrSlug: string): Promise<void> {
    const existing = await this.require(idOrSlug);

    const removed = await this.events.remove(existing.id);
    if (!removed) {
      throw notFound(idOrSlug);
    }
  }

  private async require(idOrSlug: string): Promise<Event> {
    const event = await this.events.findByIdOrSlug(idOrSlug);
    if (event === null) {
      throw notFound(idOrSlug);
    }
    return event;
  }

  /**
   * Vérifie l'existence du département référencé.
   * `null` (événement général) et `undefined` (champ non transmis) sont valides.
   */
  private async assertDepartmentExists(
    departmentId: string | null | undefined,
  ): Promise<void> {
    if (departmentId === undefined || departmentId === null) return;

    const exists = await this.departments.exists(departmentId);
    if (!exists) {
      throw new NotFoundError(
        "DEPARTMENT_NOT_FOUND",
        `Aucun département ne correspond à « ${departmentId} »`,
      );
    }
  }

  /** Slug explicite refusé s'il est déjà pris, sinon dérivé du titre. */
  private async resolveSlug(title: string, requested?: string): Promise<string> {
    const explicit = requested === undefined ? "" : slugify(requested);

    if (explicit.length > 0) {
      if (await this.events.slugExists(explicit)) {
        throw new DuplicateSlugError(explicit);
      }
      return explicit;
    }

    return uniqueSlug(title, (candidate) => this.events.slugExists(candidate));
  }
}

function notFound(idOrSlug: string): NotFoundError {
  return new NotFoundError(
    "EVENT_NOT_FOUND",
    `Aucun événement ne correspond à « ${idOrSlug} »`,
  );
}
