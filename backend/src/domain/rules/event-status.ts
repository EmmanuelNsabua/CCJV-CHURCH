import type { EventStatus } from "@/domain/entities";

/**
 * Règle métier de l'état d'un événement (`docs/006` §5, §19, §21.2).
 *
 * `is_archived` n'est pas persisté : l'état est **toujours** recalculé depuis
 * `eventDate`. C'est ce qui garantit qu'un événement passé ne reste jamais
 * affiché comme à venir, même si personne ne l'a « archivé » manuellement —
 * il n'existe d'ailleurs aucune transition manuelle (`docs/006` §19).
 *
 * La comparaison se fait sur des chaînes `YYYY-MM-DD`, ce qui évite tout
 * décalage de fuseau horaire entre le serveur et Lubumbashi.
 */
export function computeEventStatus(
  eventDate: string,
  now: Date = new Date(),
): EventStatus {
  const today = toIsoDate(now);
  return eventDate >= today ? "UPCOMING" : "ARCHIVED";
}

/** Date locale du serveur au format `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Date locale du serveur, décalée de `days` jours. */
export function isoDateFromNow(days: number, now: Date = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}
