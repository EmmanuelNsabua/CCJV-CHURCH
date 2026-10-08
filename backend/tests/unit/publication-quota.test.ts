import { describe, expect, it } from "@jest/globals";
import type { PublicationLifecycleState } from "@/domain/entities";
import { isInPublicationScope } from "@/domain/departments/capabilities";
import { DEPARTMENT_CAPABILITIES } from "@/domain/departments/capabilities";
import {
  PUBLICATION_QUOTA,
  archiveSequence,
  compareArchiveOrder,
  oldestPublished,
  planPublication,
  quotaExceeded,
  type QuotaCandidate,
} from "@/domain/rules/publication-quota";

/**
 * Règle des 3 — **décision finale de `docs/035` §1**.
 *
 * Cette règle décide d'une opération **irréversible** : archiver une publication
 * ne se défait pas (D-18, D-20). Elle est donc éprouvée ici exhaustivement, en
 * fonction pure, sans base de données.
 *
 * Trois propriétés méritent l'attention, parce qu'elles se paieraient en contenus
 * perdus si elles étaient fausses :
 *
 * 1. **une seule archival par publication** — jamais de rattrapage en cascade : la
 *    règle ne choisit pas sept contenus à effacer au détour d'une publication ;
 * 2. **le départage par `id`** — `published_at` étant une **date**, dix
 *    publications saisies le même jour sont un cas réel, et sans départage
 *    l'ordre dépendrait du plan d'exécution de PostgreSQL ;
 * 3. **les brouillons et les archives ne comptent pas** — seuls les `PUBLISHED`
 *    occupent une place.
 */

/* -------------------------------------------------------------------------- */
/*  Fabrique                                                                  */
/* -------------------------------------------------------------------------- */

function publication(
  id: string,
  publishedAt: string,
  status: PublicationLifecycleState = "PUBLISHED",
): QuotaCandidate {
  return { id, publishedAt, status };
}

/** Dix publications publiées, comme les dix existantes de `docs/033` É24. */
function dixPubliees(): QuotaCandidate[] {
  return Array.from({ length: 10 }, (_, index) =>
    publication(`pub-${String(index + 1).padStart(2, "0")}`, `2026-01-${String(index + 1).padStart(2, "0")}`),
  );
}

/* -------------------------------------------------------------------------- */
/*  Le plafond                                                                */
/* -------------------------------------------------------------------------- */

describe("règle des 3 — global, jamais par département (docs/035 §1)", () => {
  it("plafonne à trois publications simultanément publiées", () => {
    expect(PUBLICATION_QUOTA).toBe(3);
  });

  it("ne déclenche aucun archivage tant qu'une place est libre", () => {
    for (const nombre of [0, 1, 2]) {
      const existantes = dixPubliees().slice(0, nombre);
      const plan = planPublication(existantes, "nouvelle");

      expect({ nombre, toArchive: plan.toArchive, publishedAfter: plan.publishedAfter }).toEqual({
        nombre,
        toArchive: null,
        publishedAfter: nombre + 1,
      });
    }
  });

  it("archive la plus ancienne à la quatrième publication", () => {
    const existantes = [
      publication("b", "2026-03-01"),
      publication("a", "2026-01-01"),
      publication("c", "2026-02-01"),
    ];

    const plan = planPublication(existantes, "nouvelle");

    expect(plan.toArchive?.id).toBe("a");
    expect(plan.publishedAfter).toBe(3);
  });

  it("départage les dates égales par l'identifiant (D-19, docs/035 §1)", () => {
    // Dix publications le même jour : le cas réel visé par le départage.
    const memeJour = dixPubliees().map((item) => ({
      ...item,
      publishedAt: "2026-05-01",
    }));

    expect(oldestPublished(memeJour)?.id).toBe("pub-01");
    expect(planPublication(memeJour, "nouvelle").toArchive?.id).toBe("pub-01");
  });

  it("ne compte ni les brouillons ni les archives", () => {
    const melange = [
      publication("brouillon", "2026-01-01", "DRAFT"),
      publication("archive", "2026-01-02", "ARCHIVED"),
      publication("publiee", "2026-03-01", "PUBLISHED"),
    ];

    const plan = planPublication(melange, "nouvelle");

    expect(plan.toArchive).toBeNull();
    expect(plan.publishedAfter).toBe(2);
  });

  /**
   * Republier une ligne **déjà** `PUBLISHED` ne consomme aucune place : c'est une
   * modification, pas une publication nouvelle. Sans l'exclusion de la ligne
   * entrante, la republication archiverait... elle-même, ou une autre, pour rien.
   */
  it("republier une publication déjà en ligne ne consomme aucune place", () => {
    const existantes = [
      publication("a", "2026-01-01"),
      publication("b", "2026-02-01"),
      publication("c", "2026-03-01"),
    ];

    const plan = planPublication(existantes, "a");

    expect(plan.toArchive).toBeNull();
    expect(plan.publishedAfter).toBe(3);
  });

  it("n'archive jamais la publication entrante, même si c'est la plus ancienne", () => {
    const existantes = [
      publication("a", "2026-01-01"),
      publication("b", "2026-02-01"),
      publication("c", "2026-03-01"),
    ];

    const plan = planPublication(existantes, "a");

    expect(plan.toArchive).toBeNull();
  });

  it("ne mute jamais la liste reçue", () => {
    const existantes = dixPubliees();
    const copie = existantes.map((item) => ({ ...item }));

    oldestPublished(existantes);
    archiveSequence(existantes);
    planPublication(existantes, "nouvelle");

    // `Array.prototype.sort` trie **en place** : une règle qui trierait la liste
    // de l'appelant réordonnerait la collection qu'il est en train d'afficher.
    expect(existantes).toEqual(copie);
  });
});

/* -------------------------------------------------------------------------- */
/*  Ordre d'archivage                                                         */
/* -------------------------------------------------------------------------- */

describe("ordre d'archivage — published_at ASC, id ASC", () => {
  it("classe par date, puis par identifiant", () => {
    const liste = [
      publication("z", "2026-01-01"),
      publication("a", "2026-01-01"),
      publication("m", "2025-12-31"),
    ].sort(compareArchiveOrder);

    expect(liste.map((item) => item.id)).toEqual(["m", "a", "z"]);
  });

  it("compare les dates ISO littéralement, sans conversion", () => {
    // Une conversion en `Date` ouvrirait un décalage de fuseau : la règle doit
    // rester dans l'ordre lexicographique de `YYYY-MM-DD`.
    expect(compareArchiveOrder(publication("x", "2026-01-09"), publication("x", "2026-01-10"))).toBeLessThan(0);
    expect(compareArchiveOrder(publication("x", "2026-01-10"), publication("x", "2026-01-09"))).toBeGreaterThan(0);
  });

  it("est réflexif : deux fois la même publication sont à égalité", () => {
    const item = publication("a", "2026-01-01");
    expect(compareArchiveOrder(item, { ...item })).toBe(0);
  });

  it("rend null quand rien n'est publié", () => {
    expect(
      oldestPublished([publication("a", "2026-01-01", "DRAFT")]),
    ).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  Dépassement — le cas réel des 10 publications                             */
/* -------------------------------------------------------------------------- */

describe("dépassement — constat, jamais rattrapage silencieux", () => {
  it("chiffre le dépassement des dix publications existantes : sept archivages", () => {
    // docs/035 §2 : « 10 publications existantes pour 3 places », soit 7
    // archivages — étape « irréversible, sans porte de sortie » (É24 de 033).
    expect(quotaExceeded(dixPubliees())).toBe(7);
    expect(quotaExceeded(dixPubliees().slice(0, 3))).toBe(0);
    expect(quotaExceeded(dixPubliees().slice(0, 2))).toBe(0);
  });

  it("ne planifie qu'UNE archival même si la base est déjà hors plafond", () => {
    const plan = planPublication(dixPubliees(), "nouvelle");

    // La règle ne résorbe pas un dépassement en cascade : l'archivage est
    // irréversible (D-18) et aucune décision n'autorise à choisir sept contenus
    // à effacer au détour d'une publication. Le dépassement se traite par
    // l'opération explicite d'É24, relue avant d'être exécutée.
    expect(plan.toArchive?.id).toBe("pub-01");
    expect(plan.publishedAfter).toBe(PUBLICATION_QUOTA);
  });

  it("rend la suite exacte des archivages à préparer, du plus ancien au plus récent", () => {
    const sequence = archiveSequence(dixPubliees());

    expect(sequence.map((item) => item.id)).toEqual([
      "pub-01",
      "pub-02",
      "pub-03",
      "pub-04",
      "pub-05",
      "pub-06",
      "pub-07",
    ]);
    // Les trois conservées sont les trois plus récentes : la règle archive par
    // ancienneté, jamais par catégorie ni par département (docs/035 §1).
    expect(sequence.map((item) => item.publishedAt)).not.toContain("2026-01-10");
  });

  it("ne prépare aucune séquence quand le plafond est respecté", () => {
    expect(archiveSequence(dixPubliees().slice(0, 3))).toEqual([]);
    expect(archiveSequence([])).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/*  Périmètre des publications — l'exclusion des Affaires Sociales            */
/* -------------------------------------------------------------------------- */

describe("périmètre des publications — capacité de département (docs/035 §3.2)", () => {
  it("un département n'entre dans le périmètre que s'il porte la capacité", () => {
    // docs/035 §1 : « les Affaires Sociales n'entrent pas dans le périmètre des
    // publications ». L'exclusion est portée par l'**absence** de capacité, et
    // jamais par le nom du département (D-09) : le code ne le connaît pas.
    expect(isInPublicationScope([])).toBe(false);
    expect(
      isInPublicationScope([DEPARTMENT_CAPABILITIES.PUBLICATION_SCOPE]),
    ).toBe(true);
  });

  it("la capacité événementielle n'ouvre pas le périmètre des publications", () => {
    // Deux capacités distinctes, deux périmètres distincts : posséder l'une ne
    // donne rien sur l'autre (`docs/029` §5.3 : la capacité est une donnée, et
    // aucune ne se déduit d'une autre).
    expect(
      isInPublicationScope([DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL]),
    ).toBe(false);
  });

  it("les deux capacités coexistent sans se confondre", () => {
    const lesDeux = [
      DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL,
      DEPARTMENT_CAPABILITIES.PUBLICATION_SCOPE,
    ];

    expect(isInPublicationScope(lesDeux)).toBe(true);
    expect(lesDeux).toHaveLength(2);
  });
});
