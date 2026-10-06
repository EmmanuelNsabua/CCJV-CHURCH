import type {
  PrayerConfidentiality,
  PrayerRequest,
  PrayerStatus,
} from "@/domain/entities";

/**
 * Sérialisation des demandes de prière vers l'API.
 *
 * Deux représentations, et deux seulement :
 *
 * - `PrayerRequestDto` : la vue **administrative**, seule à porter le texte de
 *   l'intention et les coordonnées. Elle n'est produite que par des routes
 *   montées derrière `requireAnyAdmin` ;
 * - `PrayerRequestCreatedDto` : l'accusé de réception renvoyé au visiteur qui
 *   vient de déposer sa demande. Il ne contient **ni le texte, ni le prénom, ni
 *   le contact** : ces données n'ont aucune utilité pour le client qui les a
 *   envoyées, et les faire transiter à nouveau exposerait inutilement une
 *   donnée personnelle sensible (cahier §19).
 *
 * Les horodatages sont des `Date` en base : ils sortent en ISO 8601 complet.
 */

export interface PrayerRequestDto {
  id: string;
  requestText: string;
  requesterName: string | null;
  requesterContact: string | null;
  confidentiality: PrayerConfidentiality;
  status: PrayerStatus;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Accusé de réception minimal d'une création publique. */
export interface PrayerRequestCreatedDto {
  id: string;
  createdAt: string;
  status: PrayerStatus;
}

export function toPrayerRequestDto(entity: PrayerRequest): PrayerRequestDto {
  return {
    id: entity.id,
    requestText: entity.requestText,
    requesterName: entity.requesterName,
    requesterContact: entity.requesterContact,
    confidentiality: entity.confidentiality,
    status: entity.status,
    handledAt: entity.handledAt ? entity.handledAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toPrayerRequestCreatedDto(
  entity: PrayerRequest,
): PrayerRequestCreatedDto {
  return {
    id: entity.id,
    createdAt: entity.createdAt.toISOString(),
    status: entity.status,
  };
}
