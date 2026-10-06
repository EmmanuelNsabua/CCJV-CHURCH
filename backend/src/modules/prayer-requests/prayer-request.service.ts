import type { PrayerRequest, PrayerStatus } from "@/domain/entities";
import type {
  ListResult,
  PrayerRequestInput,
  PrayerRequestRepository,
} from "@/domain/repositories";
import { logger } from "@/infrastructure/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";

/**
 * Règles métier des demandes de prière.
 *
 * Le service ne connaît ni Express, ni Drizzle, ni code HTTP : il lève des
 * erreurs du domaine et laisse la présentation les traduire
 * (`IMPLEMENTATION_SPEC` §4).
 *
 * **Journalisation d'audit :** seuls des identifiants sont écrits. Le texte
 * d'une intention, un prénom ou un contact sont des données personnelles
 * sensibles et n'apparaissent dans aucun journal, même en `debug` (cahier §19).
 */

export interface PrayerRequestListQuery {
  page: number;
  limit: number;
  status?: PrayerStatus;
}

export class PrayerRequestService {
  constructor(private readonly prayerRequests: PrayerRequestRepository) {}

  /**
   * Dépôt public d'une intention.
   *
   * Aucune règle métier supplémentaire : le bornage, le nettoyage et le refus
   * des clés inconnues sont faits par le schéma strict en amont. Le service se
   * contente d'enregistrer et de tracer l'identifiant attribué.
   */
  async submit(input: PrayerRequestInput): Promise<PrayerRequest> {
    const created = await this.prayerRequests.create(input);

    logger.info(
      { prayerRequestId: created.id },
      "Demande de prière enregistrée",
    );

    return created;
  }

  /** Collection administrative : plus récentes d'abord, filtre `status`. */
  async list(query: PrayerRequestListQuery): Promise<ListResult<PrayerRequest>> {
    return this.prayerRequests.list(
      { limit: query.limit, offset: toOffset(query.page, query.limit) },
      query.status ? { status: query.status } : {},
    );
  }

  async getById(id: string): Promise<PrayerRequest> {
    const found = await this.prayerRequests.findById(id);
    if (!found) {
      throw prayerRequestNotFound();
    }
    return found;
  }

  /**
   * Marque la demande comme portée et renseigne `handledAt`.
   *
   * La vérification préalable donne le code exact `PRAYER_REQUEST_NOT_FOUND`
   * plutôt qu'un `null` ambigu, et la transition est validée ici aussi : le
   * service reste sûr même appelé sans passer par HTTP (script, test).
   */
  async markPrayed(id: string, status: PrayerStatus): Promise<PrayerRequest> {
    if (status !== "PRAYED") {
      throw new ValidationError(
        "Seule la transition vers le statut « PRAYED » est supportée",
      );
    }

    await this.getById(id);

    const handled = await this.prayerRequests.markHandled(id);
    if (!handled) {
      throw prayerRequestNotFound();
    }

    logger.info(
      { prayerRequestId: handled.id },
      "Demande de prière marquée comme portée",
    );

    return handled;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.prayerRequests.remove(id);
    if (!removed) {
      throw prayerRequestNotFound();
    }

    logger.info({ prayerRequestId: id }, "Demande de prière supprimée");
  }
}

/** Message volontairement identique quelle que soit la cause : rien à deviner. */
function prayerRequestNotFound(): NotFoundError {
  return new NotFoundError(
    "PRAYER_REQUEST_NOT_FOUND",
    "Cette demande de prière est introuvable",
  );
}
