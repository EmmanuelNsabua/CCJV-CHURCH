import { describe, expect, it } from "@jest/globals";
import {
  estAvortement,
  evaluateProbe,
  motifsManquants,
  type Observation,
  type Sonde,
} from "../../scripts/lib/probe-harness";
import {
  CODE_TRANSACTION_AVORTEE,
  createProbeCatalogue,
  MESSAGE_TRANSACTION_AVORTEE,
  MESSAGES_OBSERVES,
} from "../../scripts/lib/migration-probes";

/**
 * **Le harnais de sondes qualifie-t-il correctement ce qu'il observe ?**
 *
 * Ce fichier existe à cause d'un défaut précis, survenu au Lot 5 : un harnais
 * avait annoncé **quatre refus** alors que la transaction était avortée depuis la
 * première violation. Les quatre essais n'avaient jamais atteint la règle qu'ils
 * prétendaient éprouver — la base les refusait pour une raison qui n'avait rien à
 * voir avec le sujet. Rien dans les assertions ne permettait de le voir.
 *
 * Cette suite verrouille les trois propriétés qui manquaient alors :
 *
 * 1. une attente **fausse** doit être signalée non conforme, dans les deux sens ;
 * 2. un refus par une **autre** règle n'est pas un refus conforme ;
 * 3. un **avortement de transaction** n'est jamais un refus, même quand le motif
 *    de la sonde est écrit trop large pour l'attraper.
 *
 * Elle ne remplace pas `npm run db:selftest`, qui exécute ces mêmes propriétés
 * contre PostgreSQL. Elle les rend **permanentes** : la suite Jest tourne à chaque
 * exécution, la preuve d'exécution sur base est un geste d'opérateur.
 */

const OBSERVATION_ACCEPTEE: Observation = { issue: "accepté", message: "", code: "" };

function refus(message: string, code = "23514"): Observation {
  return { issue: "refusé", message, code };
}

const MESSAGE_CONTRAINTE =
  'new row for relation "site_settings" violates check constraint "site_settings_no_prayer_secret"';

describe("harnais de sondes — qualification d'une observation", () => {
  it("accepte une observation conforme, dans les deux sens", () => {
    expect(evaluateProbe({ attendu: "accepté" }, OBSERVATION_ACCEPTEE).conforme).toBe(true);
    expect(evaluateProbe({ attendu: "refusé", motif: /no_prayer_secret/ }, refus(MESSAGE_CONTRAINTE)).conforme).toBe(
      true,
    );
  });

  it("signale une attente inversée, sans jamais l'accepter", () => {
    const attendaitUnRefus = evaluateProbe({ attendu: "refusé", motif: /.*/ }, OBSERVATION_ACCEPTEE);
    expect(attendaitUnRefus.conforme).toBe(false);
    expect(attendaitUnRefus.raison).toContain("observé « accepté »");

    const attendaitUneAcceptation = evaluateProbe({ attendu: "accepté" }, refus(MESSAGE_CONTRAINTE));
    expect(attendaitUneAcceptation.conforme).toBe(false);
    expect(attendaitUneAcceptation.raison).toContain("observé « refusé »");
  });

  it("refuse un refus qui ne porte pas le motif visé", () => {
    const voisin = evaluateProbe(
      { attendu: "refusé", motif: /media_access_department_unique/ },
      refus(MESSAGE_CONTRAINTE),
    );

    expect(voisin.conforme).toBe(false);
    expect(voisin.raison).toContain("autre règle");
  });

  it("refuse un refus sans motif déclaré, au lieu de l'accepter", () => {
    const sansMotif = evaluateProbe({ attendu: "refusé" }, refus(MESSAGE_CONTRAINTE));

    expect(sansMotif.conforme).toBe(false);
    expect(sansMotif.raison).toContain("aucun motif déclaré");
  });

  describe("avortement de transaction — le défaut du Lot 5", () => {
    const avortement: Observation = {
      issue: "refusé",
      message: MESSAGE_TRANSACTION_AVORTEE,
      code: CODE_TRANSACTION_AVORTEE,
    };

    it("reconnaît l'avortement au message comme au code", () => {
      expect(estAvortement(avortement)).toBe(true);
      expect(estAvortement(refus(MESSAGE_TRANSACTION_AVORTEE, "23514"))).toBe(true);
      expect(estAvortement(refus(MESSAGE_TRANSACTION_AVORTEE, ""))).toBe(true);
      expect(estAvortement(refus(MESSAGE_CONTRAINTE))).toBe(false);
      expect(estAvortement(OBSERVATION_ACCEPTEE)).toBe(false);
    });

    it("ne l'accepte jamais comme un refus, même avec un motif permissif", () => {
      // `/.*/` attrape **tous** les messages : c'est le pire motif possible, et
      // c'est précisément celui qui aurait laissé passer les quatre faux refus.
      const permissif = evaluateProbe({ attendu: "refusé", motif: /.*/ }, avortement);

      expect(permissif.conforme).toBe(false);
      expect(permissif.raison).toContain("transaction avortée");
    });

    it("n'accepte aucun refus pour une sonde du catalogue réel", () => {
      const catalogue = createProbeCatalogue({ mediaId: "m", deptId: "d", profileId: "p" });
      const refusantes = catalogue.filter((sonde) => sonde.attendu === "refusé");

      expect(refusantes.length).toBeGreaterThan(5);

      for (const sonde of refusantes) {
        expect({ sonde: sonde.label, conforme: evaluateProbe(sonde, avortement).conforme }).toEqual({
          sonde: sonde.label,
          conforme: false,
        });
      }
    });
  });
});

describe("catalogue de sondes — structure et motifs", () => {
  const catalogue = createProbeCatalogue({ mediaId: "m", deptId: "d", profileId: "p" });

  it("déclare un motif pour chaque sonde qui attend un refus", () => {
    // `motifsManquants` sert de filet à l'exécution : le type l'interdit, mais une
    // sonde construite hors TypeScript pourrait encore omettre son motif.
    expect(motifsManquants(catalogue)).toEqual([]);
    expect(catalogue.filter((sonde) => sonde.attendu === "refusé").length).toBeGreaterThan(5);
  });

  it("détecte une sonde sans motif — le contrôle n'est pas complaisant", () => {
    const deficiente = [
      ...catalogue,
      { requires: "x.sql", label: "sonde sans motif", attendu: "refusé", run: async () => undefined },
    ] as unknown as Sonde[];

    expect(motifsManquants(deficiente)).toEqual(["sonde sans motif"]);
  });

  it("reconnaît le message réel de chaque sonde, et seulement celui-là", () => {
    const messages = Object.entries(MESSAGES_OBSERVES);
    const sansFixture: string[] = [];
    const faux: string[] = [];

    // Garde-fou contre un passage à vide : si le catalogue ou les fixtures se
    // vidaient, la boucle ci-dessous ne s'exécuterait pas et l'assertion finale
    // serait vraie sans rien avoir comparé.
    const refusantes = catalogue.filter((sonde) => sonde.attendu === "refusé");
    expect(refusantes.length).toBe(messages.length);
    expect(messages.length).toBeGreaterThan(5);

    for (const sonde of catalogue) {
      if (sonde.attendu !== "refusé") continue;

      const messageReel = MESSAGES_OBSERVES[sonde.label];
      if (messageReel === undefined) {
        sansFixture.push(sonde.label);
        continue;
      }

      if (!sonde.motif.test(messageReel)) {
        faux.push(`${sonde.label} : ${String(sonde.motif)} ne reconnaît pas son propre message`);
      }

      // Un motif qui reconnaît le message d'une **autre** règle confond deux
      // comportements distincts : la sonde passerait pour la mauvaise raison.
      const confusions = messages.filter(
        ([label, message]) => label !== sonde.label && message !== messageReel && sonde.motif.test(message),
      );

      if (confusions.length > 0) {
        faux.push(`${sonde.label} reconnaît aussi ${confusions.map(([label]) => label).join(", ")}`);
      }
    }

    expect({ sansFixture, faux }).toEqual({ sansFixture: [], faux: [] });
  });

  it("n'utilise aucun motif attrape-tout", () => {
    // Un motif plus court que le nom d'une contrainte ne peut pas désigner une
    // règle : il désigne une famille de messages.
    const tropCourts = catalogue
      .filter((sonde) => sonde.attendu === "refusé")
      .filter((sonde) => String(sonde.motif).length < 24)
      .map((sonde) => `${sonde.label} : ${String(sonde.motif)}`);

    expect(tropCourts).toEqual([]);
  });

  it("ne reconnaît jamais le message d'une transaction avortée", () => {
    const complaisantes = catalogue
      .filter((sonde) => sonde.attendu === "refusé")
      .filter((sonde) => sonde.motif.test(MESSAGE_TRANSACTION_AVORTEE))
      .map((sonde) => sonde.label);

    expect(complaisantes).toEqual([]);
  });
});
