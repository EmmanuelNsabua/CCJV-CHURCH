import type { AdminProfile, Event, EventVisibilityScope } from "@/domain/entities";
import type {
  DepartmentCapabilityRepository,
  DepartmentRepository,
  EventRepository,
  ListResult,
} from "@/domain/repositories";
import { EventPolicy } from "@/presentation/policies";
import { logger } from "@/infrastructure/logger";
import {
  DuplicateSlugError,
  ForbiddenError,
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
 * Absence de repository de capacités : **aucune capacité accordée**.
 *
 * Ce n'est pas un défaut permissif mais un défaut **restrictif** : sans lecture
 * des capacités, une portée `GLOBAL` est refusée. Un service monté sans ce
 * repository ne peut donc pas publier à l'échelle de l'église par omission — il ne
 * le peut pas du tout, ce qui est le bon sens de l'erreur.
 */
const AUCUNE_CAPACITE: DepartmentCapabilityRepository = {
  async listForDepartment() {
    return [];
  },
  async grant() {
    throw new Error("Lecture seule : aucune écriture de capacité depuis ce service");
  },
  async revoke() {
    throw new Error("Lecture seule : aucune écriture de capacité depuis ce service");
  },
};

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
    /**
     * Lecture des capacités de département — **injectée**, jamais importée.
     *
     * Le défaut « aucune capacité » sert les doubles de test : il rend le refus
     * explicite (une portée `GLOBAL` sans capacité est refusée) sans obliger chaque
     * test à fournir un repository de capacités.
     */
    private readonly capabilities: DepartmentCapabilityRepository = AUCUNE_CAPACITE,
  ) {}

  /**
   * Vérifie qu'un acteur peut fixer une portée **globale** (D-25, D-26).
   *
   * Deux garanties, à deux niveaux, et aucune ne remplace l'autre :
   *
   * - **cette vérification** refuse tôt, avec un `403` lisible, en lisant la
   *   capacité du département **de rattachement de l'acteur** ;
   * - le **trigger** `events_visibility_scope_coherence` (migration 0008) refuse
   *   l'écriture en base, quelle qu'en soit l'origine — y compris un script
   *   d'administration qui ne passerait par aucune policy.
   *
   * La policy juge l'intention, la base garantit l'état : c'est la même
   * articulation que pour les notifications et la règle D-10.
   */
  async assertVisibilityAllowed(
    actor: AdminProfile,
    target: { departmentId: string; visibilityScope?: EventVisibilityScope },
  ): Promise<void> {
    if (target.visibilityScope !== "GLOBAL") return;

    // Les capacités lues sont celles du département **responsable de l'événement**
    // — celui qui publie — et non celles de l'acteur : une portée globale engage
    // le département qui porte l'événement (D-26).
    const capabilities = await this.capabilities.listForDepartment(target.departmentId);

    const decision = EventPolicy.can(actor, "SET_VISIBILITY_SCOPE", {
      departmentId: target.departmentId,
      visibilityScope: target.visibilityScope,
      actorDepartmentCapabilities: capabilities,
    });

    if (!decision.allowed) {
      logger.warn(
        {
          actorId: actor.id,
          departmentId: target.departmentId,
          reason: decision.reason,
        },
        "Portée globale refusée : capacité absente",
      );
      throw new ForbiddenError();
    }
  }

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
