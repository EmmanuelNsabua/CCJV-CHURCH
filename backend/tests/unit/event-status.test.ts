import { describe, expect, it } from "@jest/globals";
import {
  computeEventStatus,
  isoDateFromNow,
  toIsoDate,
} from "@/domain/rules/event-status";

/**
 * `is_archived` n'est jamais persisté : l'état d'un événement est recalculé
 * depuis `eventDate` à chaque lecture. Ces tests fixent la borne exacte
 * (« aujourd'hui » reste à venir) et le passage de mois et d'année.
 */

describe("computeEventStatus", () => {
  // Instant de référence : 15 mai 2026, 10 h 30 (heure locale du serveur).
  const now = new Date(2026, 4, 15, 10, 30, 0);

  it("classe une date future en UPCOMING", () => {
    expect(computeEventStatus("2026-05-16", now)).toBe("UPCOMING");
    expect(computeEventStatus("2026-06-01", now)).toBe("UPCOMING");
    expect(computeEventStatus("2027-01-01", now)).toBe("UPCOMING");
  });

  it("classe la date du jour en UPCOMING", () => {
    expect(computeEventStatus("2026-05-15", now)).toBe("UPCOMING");
  });

  it("classe une date passée en ARCHIVED", () => {
    expect(computeEventStatus("2026-05-14", now)).toBe("ARCHIVED");
    expect(computeEventStatus("2026-04-30", now)).toBe("ARCHIVED");
    expect(computeEventStatus("2025-12-31", now)).toBe("ARCHIVED");
  });

  it("ignore l'heure du jour : le lendemain à 00 h 00 bascule en ARCHIVED", () => {
    const presqueMinuit = new Date(2026, 4, 15, 23, 59, 59);
    expect(computeEventStatus("2026-05-15", presqueMinuit)).toBe("UPCOMING");

    const apresMinuit = new Date(2026, 4, 16, 0, 0, 1);
    expect(computeEventStatus("2026-05-15", apresMinuit)).toBe("ARCHIVED");
  });

  it("utilise la date du jour par défaut quand `now` n'est pas fourni", () => {
    expect(computeEventStatus(toIsoDate(new Date()))).toBe("UPCOMING");
    expect(computeEventStatus(isoDateFromNow(1))).toBe("UPCOMING");
    expect(computeEventStatus(isoDateFromNow(-1))).toBe("ARCHIVED");
  });
});

describe("toIsoDate", () => {
  it("formate en YYYY-MM-DD avec zéro de remplissage", () => {
    expect(toIsoDate(new Date(2026, 0, 5, 3, 4, 5))).toBe("2026-01-05");
    expect(toIsoDate(new Date(2026, 8, 9, 12, 0, 0))).toBe("2026-09-09");
    expect(toIsoDate(new Date(2026, 11, 31, 23, 59, 59))).toBe("2026-12-31");
    expect(toIsoDate(new Date(2026, 0, 1, 0, 0, 0))).toBe("2026-01-01");
  });

  it("raisonne en date locale, jamais en UTC", () => {
    // 00 h 30 local : dans un fuseau en avance sur UTC (celui de Lubumbashi,
    // CAT/UTC+2), le jour UTC est encore la veille. Le statut d'un événement
    // doit suivre le calendrier local, sinon un culte du jour disparaîtrait
    // du site pendant les deux premières heures de la journée.
    expect(toIsoDate(new Date(2026, 0, 1, 0, 30, 0))).toBe("2026-01-01");
  });
});

describe("isoDateFromNow", () => {
  it("retourne le jour même pour un décalage nul", () => {
    expect(isoDateFromNow(0, new Date(2026, 4, 15, 23, 0, 0))).toBe("2026-05-15");
  });

  it("franchit la fin d'un mois", () => {
    expect(isoDateFromNow(1, new Date(2026, 0, 31, 12, 0, 0))).toBe("2026-02-01");
    expect(isoDateFromNow(2, new Date(2026, 3, 30, 12, 0, 0))).toBe("2026-05-02");
    expect(isoDateFromNow(-1, new Date(2026, 2, 1, 12, 0, 0))).toBe("2026-02-28");
  });

  it("franchit la fin d'une année", () => {
    expect(isoDateFromNow(1, new Date(2025, 11, 31, 12, 0, 0))).toBe("2026-01-01");
    expect(isoDateFromNow(-1, new Date(2026, 0, 1, 12, 0, 0))).toBe("2025-12-31");
  });

  it("gère les années bissextiles", () => {
    expect(isoDateFromNow(1, new Date(2024, 1, 28, 12, 0, 0))).toBe("2024-02-29");
    expect(isoDateFromNow(1, new Date(2026, 1, 28, 12, 0, 0))).toBe("2026-03-01");
  });

  it("reste sur un jour calendaire lors d'un changement d'heure", () => {
    // 02 h 30 n'existe pas partout le jour du passage à l'heure d'été : le
    // calcul doit rester un décalage de jour, pas d'heures.
    expect(isoDateFromNow(1, new Date(2026, 2, 28, 2, 30, 0))).toBe("2026-03-29");
  });

  it("ne modifie jamais l'instant reçu", () => {
    const reference = new Date(2026, 4, 15, 10, 0, 0);
    const copie = new Date(reference);

    isoDateFromNow(30, reference);

    expect(reference.getTime()).toBe(copie.getTime());
  });
});
