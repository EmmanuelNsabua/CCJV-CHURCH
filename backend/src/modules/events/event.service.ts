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
  ForbiddenError,
  NotFoundError,
  ValidationError,
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
      {
        status: query.status,
        view: query.view,
        departmentId: query.departmentId,
      },
      query.sort,
    );
  }

  /** Lecture publique : `404 EVENT_NOT_FOUND` si rien ne correspond. */
  async get(idOrSlug: string): Promise<Event> {
    return this.require(idOrSlug);
  }

  async create(data: CreateEventBody): Promise<Event> {
    const { slug: requestedSlug, ...input } = data;

    const startDate = input.startDate ?? input.eventDate;
    if (!startDate) {
      throw new ValidationError("La date de début est obligatoire");
    }

    const endDate = input.endDate ?? startDate;
    if (endDate < startDate) {
      throw new ValidationError("La date de fin ne peut pas être antérieure à la date de début");
    }

    // Si l'événement est créé directement en statut PUBLISHED, valider les prérequis
    if (input.status === "PUBLISHED") {
      this.assertPublishConditions({
        title: input.title,
        startDate,
        endDate,
        location: input.location,
        imageMediaId: input.imageMediaId,
      });
    }

    if (input.departmentId) {
      await this.assertDepartmentExists(input.departmentId);
    }

    const slug = await this.resolveSlug(input.title, requestedSlug);
    return this.events.create(
      {
        ...input,
        startDate,
        eventDate: startDate,
        endDate,
        eventTime: input.startTime ?? input.eventTime ?? null,
        startTime: input.startTime ?? input.eventTime ?? null,
        endTime: input.endTime ?? null,
      },
      slug,
    );
  }

  /**
   * Publication d'un événement avec vérification stricte des conditions requises (§4.3).
   */
  async publish(idOrSlug: string): Promise<Event> {
    const existing = await this.require(idOrSlug);

    this.assertPublishConditions({
      title: existing.title,
      startDate: existing.startDate,
      endDate: existing.endDate,
      location: existing.location,
      imageMediaId: existing.imageMediaId,
    });

    const published = await this.events.publish(existing.id);
    if (!published) {
      throw notFound(idOrSlug);
    }
    return published;
  }

  /**
   * Repasse un événement publié en brouillon avant modification (§4.4).
   */
  async revertToDraft(idOrSlug: string): Promise<Event> {
    const existing = await this.require(idOrSlug);
    const updated = await this.events.revertToDraft(existing.id);
    if (!updated) {
      throw notFound(idOrSlug);
    }
    return updated;
  }

  /**
   * Annulation d'un événement (§4.5).
   * L'événement annulé conserve sa fiche et reste visible dans l'agenda avec la mention « Annulé ».
   */
  async cancel(idOrSlug: string): Promise<Event> {
    const existing = await this.require(idOrSlug);
    const updated = await this.events.cancel(existing.id);
    if (!updated) {
      throw notFound(idOrSlug);
    }
    return updated;
  }

  /**
   * Modification d'un événement.
   * Règle §4.4 : Toute modification d'un envent publié exige son retour au brouillon avant les changements.
   */
  async update(idOrSlug: string, data: UpdateEventBody): Promise<Event> {
    const existing = await this.require(idOrSlug);

    // Règle §4.4 : interdire la modification directe d'un événement publié sans repasser par le brouillon
    if (existing.status === "PUBLISHED" && data.status !== "DRAFT") {
      throw new ValidationError(
        "Un événement publié ne peut pas être modifié directement. Veuillez d'abord le repasser en brouillon.",
      );
    }

    if (data.departmentId !== undefined) {
      await this.assertDepartmentExists(data.departmentId);
    }

    const startDate = data.startDate ?? data.eventDate ?? existing.startDate;
    const endDate = data.endDate ?? existing.endDate;
    if (startDate && endDate && endDate < startDate) {
      throw new ValidationError("La date de fin ne peut pas être antérieure à la date de début");
    }

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

  /** Conditions impératives pour publier un événement (§4.3) */
  private assertPublishConditions(event: {
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string | null;
    imageMediaId?: string | null;
  }): void {
    if (!event.title || event.title.trim().length < 2) {
      throw new ValidationError("Un titre valide est requis pour publier un événement");
    }
    if (!event.startDate) {
      throw new ValidationError("Une date de début est requise pour publier un événement");
    }
    if (!event.endDate) {
      throw new ValidationError("Une date de fin est requise pour publier un événement");
    }
    if (event.endDate < event.startDate) {
      throw new ValidationError("La date de fin ne peut pas précéder la date de début");
    }
    if (!event.location || event.location.trim().length === 0) {
      throw new ValidationError("Un lieu est obligatoire pour publier un événement");
    }
    if (!event.imageMediaId) {
      throw new ValidationError("Une miniature issue de la bibliothèque est obligatoire pour publier un événement");
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

  /**
   * Slug définitif : slug explicite **suffixé** s'il est déjà pris, sinon
   * dérivé du titre.
   *
   * Deux événements peuvent porter le même intitulé (« Culte de la Pentecôte »
   * revient chaque année) : c'est la date qui les distingue, pas l'URL.
   */
  private async resolveSlug(title: string, requested?: string): Promise<string> {
    const explicit = requested === undefined ? "" : slugify(requested);
    const base = explicit.length > 0 ? explicit : title;

    return uniqueSlug(base, (candidate) => this.events.slugExists(candidate));
  }
}

function notFound(idOrSlug: string): NotFoundError {
  return new NotFoundError(
    "EVENT_NOT_FOUND",
    `Aucun événement ne correspond à « ${idOrSlug} »`,
  );
}
