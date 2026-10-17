import type { Testimony, TestimonyStatus } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  TestimonyFilters,
  TestimonyInput,
  TestimonyRepository,
} from "@/domain/repositories";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import type { PublicSubmitTestimonyBody } from "./testimony.schema";

const ALLOWED_TRANSITIONS: Record<TestimonyStatus, TestimonyStatus[]> = {
  PENDING: ["PUBLISHED", "REJECTED"],
  PUBLISHED: ["PENDING", "ARCHIVED"],
  REJECTED: ["PENDING"],
  ARCHIVED: ["PUBLISHED", "PENDING"],
};

/**
 * Règles métier des témoignages.
 * Gère le cycle de modération réversible, les soumissions publiques et la sélection Hero.
 */
export class TestimonyService {
  constructor(private readonly testimonies: TestimonyRepository) {}

  /** Liste réservée aux administrateurs avec filtres de statut et sélection Hero. */
  list(
    options: ListOptions,
    filters?: TestimonyFilters,
  ): Promise<ListResult<Testimony>> {
    return this.testimonies.list(options, filters);
  }

  /** Liste publique : ne renvoie QUE les témoignages publiés. */
  listPublic(options: ListOptions): Promise<ListResult<Testimony>> {
    return this.testimonies.listPublic(options);
  }

  /** Témoignages mis en avant dans la section Hero du site public. */
  listHeroFeatured(limit = 3): Promise<Testimony[]> {
    return this.testimonies.listHeroFeatured(limit);
  }

  async get(id: string): Promise<Testimony> {
    const testimony = await this.testimonies.findById(id);
    if (!testimony) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
    return testimony;
  }

  /**
   * Soumission publique d'un témoignage.
   * Toujours enregistré à l'état PENDING avec consentement horodaté côté serveur.
   */
  async submitPublic(data: PublicSubmitTestimonyBody): Promise<Testimony> {
    if (!data.consent) {
      throw new ValidationError(
        "Le consentement aux conditions d'examen est obligatoire.",
      );
    }

    return this.testimonies.create({
      content: data.content,
      quote: data.content,
      authorName: data.authorName ?? null,
      personName: data.authorName ?? "",
      isAnonymous: data.isAnonymous ?? false,
      status: "PENDING",
      isFeatured: false,
      photoMediaId: data.photoMediaId ?? null,
      consentedAt: new Date(),
    });
  }

  create(input: TestimonyInput): Promise<Testimony> {
    return this.testimonies.create(input);
  }

  /**
   * Correction éditoriale par l'administration.
   * Ne modifie pas arbitrairement le statut.
   */
  async update(id: string, input: Partial<TestimonyInput>): Promise<Testimony> {
    const existing = await this.get(id);

    // Si on modifie le contenu d'un témoignage déjà publié,
    // on peut soit conserver le statut soit le réexaminer selon les règles.
    const updated = await this.testimonies.update(existing.id, input);
    if (!updated) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
    return updated;
  }

  /**
   * Transition d'état de modération réversible et contrôlée.
   */
  async changeStatus(
    id: string,
    newStatus: TestimonyStatus,
    meta?: { reviewedBy?: string | null; adminNotes?: string | null },
  ): Promise<Testimony> {
    const existing = await this.get(id);

    if (existing.status === newStatus) {
      return existing;
    }

    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Transition d'état non autorisée : impossible de passer de ${existing.status} à ${newStatus}`,
      );
    }

    const updated = await this.testimonies.updateStatus(id, newStatus, {
      reviewedBy: meta?.reviewedBy ?? null,
      reviewedAt: new Date(),
      adminNotes: meta?.adminNotes,
    });

    if (!updated) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
    return updated;
  }

  /**
   * Sélection ou désélection éditoriale pour la section Hero.
   * La sélection est conservée en base même si le statut évolue.
   */
  async setFeatured(id: string, isFeatured: boolean): Promise<Testimony> {
    const existing = await this.get(id);
    const updated = await this.testimonies.setFeatured(existing.id, isFeatured);
    if (!updated) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.testimonies.remove(id);
    if (!removed) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
  }
}
