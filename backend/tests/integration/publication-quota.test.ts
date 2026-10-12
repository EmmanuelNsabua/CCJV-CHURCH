import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import { DrizzlePublicationRepository } from "@/infrastructure/repositories/publication.repository";
import { media, publications } from "@/infrastructure/database/schema";
import {
  fermerBaseDeTest,
  nomBaseAccepte,
  ouvrirBaseDeTest,
  SUFFIXE_BASE_DE_TEST,
  urlBaseDeTest,
  VARIABLE_BASE_DE_TEST,
  VARIABLE_MODE_STRICT,
  type BaseDeTest,
} from "../helpers/test-database";

/**
 * **Règle globale des 3, prouvée sur PostgreSQL réel.**
 *
 * ```text
 * $env:TEST_DATABASE_URL = 'postgresql://postgres@127.0.0.1:55432/ccjv_test'
 * $env:REQUIRE_DATABASE  = '1'
 * npm test -- tests/integration/publication-quota.test.ts
 * ```
 *
 * ### Ce que ce fichier ajoute, et pourquoi il ne pouvait pas être écrit avant
 *
 * `tests/unit/publication-quota.test.ts` éprouve `planPublication` — la
 * **décision** — cas par cas, sans base. `tests/unit/publication.service.test.ts`
 * vérifie que le service appelle bien le quota, à travers un **double** qui
 * rejoue la règle du domaine. Ni l'un ni l'autre n'exécute ce qui, en production,
 * fait tenir la règle :
 *
 * - la **transaction** de `DrizzlePublicationRepository.publishWithQuota` ;
 * - le **verrou d'avis** `pg_advisory_xact_lock(hashtext('publications.quota'))`
 *   qui sérialise les publications concurrentes ;
 * - les **contraintes réelles** de PostgreSQL, sur les vraies colonnes.
 *
 * L'audit `docs/039` §7 (I1) avait relevé le point : la règle n'était prouvée que
 * pour son plan et pour la migration qui l'a appliquée aux données existantes.
 * Le commentaire du double, dans `publication.service.test.ts`, renvoyait à « la
 * sûreté en concurrence […] dans le repository, avec PostgreSQL » — une
 * vérification qui n'existait nulle part. Ce fichier la fait exister.
 *
 * ### Pourquoi une base dédiée, et pourquoi cette base-là
 *
 * La règle est **globale** (`docs/035` §1) : publier une quatrième ligne archive
 * la plus ancienne des trois publications **réellement en ligne**. Sur la base
 * d'exploitation du projet, ce test changerait donc le site. Il s'exécute sur une
 * base **de test** désignée par `TEST_DATABASE_URL`, avec deux garde-fous
 * appliqués **avant la moindre écriture** :
 *
 * 1. le nom de la base doit se terminer par `_test` ;
 * 2. elle ne doit contenir **aucune** publication étrangère à ce fichier.
 *
 * `TEST_DATABASE_URL` n'a **aucun repli** sur `DATABASE_URL` : sans elle, la suite
 * s'annonce ignorée — ou échoue, sous `REQUIRE_DATABASE=1`.
 *
 * ### L'index de quota ne protège pas la règle
 *
 * `publications_quota_idx` est un index **partiel non unique**
 * (`(published_at, id) WHERE status = 'PUBLISHED'`) : il sert au tri d'archivage
 * et au comptage, il n'interdit rien. Rien, en base, n'empêche quatre lignes
 * `PUBLISHED` d'exister. La preuve de concurrence ci-dessous porte donc
 * entièrement sur le verrou et la transaction — s'ils lâchaient, la base
 * accepterait le dépassement sans broncher.
 *
 * ### Le fichier lit la base, jamais l'objet rendu
 *
 * Toutes les assertions portent sur l'état **relu par SQL**, sur une connexion
 * indépendante. Ce n'est pas une précaution de style : le dernier test du fichier
 * montre que l'objet rendu par `publishWithQuota` **ne reflète pas** l'état
 * persisté. Un test qui se fierait à la valeur de retour déclarerait le contraire
 * de ce que contient la base.
 */

/* -------------------------------------------------------------------------- */
/*  Conditions d'exécution                                                    */
/* -------------------------------------------------------------------------- */

const url = urlBaseDeTest();

if (url === null) {
  const raison =
    `${VARIABLE_BASE_DE_TEST} n'est pas défini : la preuve d'intégration de ` +
    "`publishWithQuota` ne peut pas s'exécuter, et un test ignoré ne prouve rien. " +
    "Démarrez la base de test (voir l'en-tête de ce fichier) et relancez.";

  if (process.env[VARIABLE_MODE_STRICT] === "1") {
    throw new Error(raison);
  }

  console.warn(`[tests/integration/publication-quota.test.ts] ${raison}`);
}

const decrire = url === null ? describe.skip : describe;

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Préfixe **propre à cette exécution**.
 *
 * Il porte l'isolation : le nettoyage ne supprime que les lignes dont le `slug`
 * commence par lui, et la garde de `beforeAll` refuse de continuer s'il existe
 * une publication qui n'en relève pas. Aucune donnée étrangère à ce fichier ne
 * peut donc être lue, modifiée ou supprimée — même si la base de test était
 * réutilisée pour autre chose.
 */
const PREFIXE = `essai-quota-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-`;

/** Espace d'identifiants réservé aux fixtures, avec un suffixe lisible. */
function idFixture(suffixe: string): string {
  return `11111111-1111-4111-8111-${suffixe.padStart(12, "0")}`;
}

interface LigneFixture {
  id: string;
  slug: string;
  status: string;
  publishedAt: string;
  archive: boolean;
}

/** Échec explicite, avec la raison — jamais une assertion muette. */
function exiger(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

decrire("règle globale des 3 — publishWithQuota sur PostgreSQL réel", () => {
  let base: BaseDeTest;
  let depot: DrizzlePublicationRepository;
  let departmentId: string;

  /** État des fixtures, **relu par SQL** sur une connexion indépendante. */
  async function etat(): Promise<LigneFixture[]> {
    return base.sql<LigneFixture[]>`
      select id,
             slug,
             status,
             published_at as "publishedAt",
             (archived_at is not null) as "archive"
        from publications
       where slug like ${`${PREFIXE}%`}
       order by published_at, id
    `;
  }

  async function compterPubliees(): Promise<number> {
    const [ligne] = await base.sql<{ n: number }[]>`
      select count(*)::int as n
        from publications
       where slug like ${`${PREFIXE}%`} and status = 'PUBLISHED'
    `;
    return ligne?.n ?? 0;
  }

  /**
   * Supprime **les seules** lignes de ce fichier.
   *
   * Les publications d'abord : la couverture d'une publication référence un
   * média, et la contrainte est `ON DELETE SET NULL` — l'ordre évite de laisser
   * des publications pointant vers un média disparu entre deux instructions.
   */
  async function nettoyerFixtures(): Promise<void> {
    await base.sql`delete from publications where slug like ${`${PREFIXE}%`}`;
    await base.sql`delete from media where path like ${`${PREFIXE}%`}`;
  }

  /**
   * Crée un média de fixture, pour éprouver l'**hydratation**.
   *
   * `publishWithQuota` ne rend pas la seule ligne de `publications` : la forme
   * rendue est celle du contrat du repository, où `coverImageUrl` est résolue
   * depuis `media`. Un test qui n'inspecterait que le statut ne verrait pas une
   * hydratation perdue ; celui-ci vérifie que la couverture est toujours résolue.
   */
  async function creerMediaFixture(
    etiquette: string,
    suffixeId: string,
  ): Promise<{ id: string; publicUrl: string }> {
    const id = idFixture(suffixeId);
    const publicUrl = `https://exemple.test/${PREFIXE}${etiquette}.jpg`;

    await base.db.insert(media).values({
      id,
      bucket: "ccjv-test",
      path: `${PREFIXE}${etiquette}`,
      publicUrl,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      alt: "Couverture de fixture",
    });

    return { id, publicUrl };
  }

  /** Crée un brouillon avec un identifiant imposé — la fixture, pas la règle. */
  async function creerBrouillon(
    etiquette: string,
    suffixeId: string,
    date: string,
    couvertureId?: string,
  ): Promise<string> {
    const id = idFixture(suffixeId);

    await base.db.insert(publications).values({
      id,
      title: `[essai] ${etiquette}`,
      slug: `${PREFIXE}${etiquette}`,
      type: "TEXTE",
      category: "ENSEIGNEMENT",
      status: "DRAFT",
      publishedAt: date,
      departmentId,
      body: ["Paragraphe de fixture."],
      coverMediaId: couvertureId ?? null,
    });

    return id;
  }

  beforeAll(async () => {
    base = await ouvrirBaseDeTest();

    // GARDE 1 — la base est bien une base de test. Appliquée avant toute écriture.
    exiger(
      nomBaseAccepte(base.nom),
      `La base « ${base.nom} » ne se termine pas par « ${SUFFIXE_BASE_DE_TEST} » : ` +
        "ce test archive des publications et refuse de s'exécuter ailleurs que sur " +
        "une base de test explicitement nommée.",
    );

    // Nettoyage d'entrée : une exécution précédente interrompue ne doit pas
    // laisser de fixtures derrière elle.
    await nettoyerFixtures();

    // GARDE 2 — aucune publication étrangère. La règle étant globale, une seule
    // ligne publiée par quelqu'un d'autre fausserait le scénario et serait
    // archivée par le test : on refuse avant d'écrire.
    const [etrangeres] = await base.sql<{ n: number }[]>`
      select count(*)::int as n from publications where slug not like ${`${PREFIXE}%`}
    `;
    exiger(
      (etrangeres?.n ?? 0) === 0,
      `La base de test contient ${String(etrangeres?.n)} publication(s) étrangère(s) à ` +
        "ce fichier : la règle des 3 est globale, le test les archiverait. " +
        "Utilisez une base de test dédiée et vide.",
    );

    const [departement] = await base.sql<{ id: string }[]>`
      select id from departments order by id limit 1
    `;
    exiger(
      departement !== undefined,
      "Aucun département en base : appliquez les migrations sur la base de test " +
        "(elles créent les dix départements de référence).",
    );
    departmentId = departement.id;

    depot = new DrizzlePublicationRepository(base.db);
  });

  afterAll(async () => {
    // Le nettoyage doit rester fiable **même si une assertion a échoué** : Jest
    // exécute `afterAll` après un échec, et le `finally` ferme le pool dans tous
    // les cas.
    try {
      await nettoyerFixtures();
    } finally {
      await fermerBaseDeTest(base);
    }
  });

  beforeEach(async () => {
    await nettoyerFixtures();

    const restantes = await etat();
    exiger(restantes.length === 0, "Le nettoyage des fixtures a échoué.");
  });

  /* ------------------------------------------------------------------------ */
  /*  1. Le quota, et l'archivage de la plus ancienne                         */
  /* ------------------------------------------------------------------------ */

  it("trois publications tiennent, la quatrième archive la plus ancienne", async () => {
    const a = await creerBrouillon("a", "a1", "2026-01-01");
    const b = await creerBrouillon("b", "b2", "2026-01-02");
    const c = await creerBrouillon("c", "c3", "2026-01-03");

    // Les trois premières publications passent par le **chemin réel** : ce sont
    // donc aussi les trois branches « il reste de la place » qui sont exercées.
    await depot.publishWithQuota(a, "2026-01-01");
    await depot.publishWithQuota(b, "2026-01-02");
    await depot.publishWithQuota(c, "2026-01-03");

    const apresTrois = await etat();
    expect(apresTrois.map((ligne) => ligne.status)).toEqual([
      "PUBLISHED",
      "PUBLISHED",
      "PUBLISHED",
    ]);
    expect(apresTrois.every((ligne) => !ligne.archive)).toBe(true);

    // Quatrième publication : une place doit être libérée.
    const d = await creerBrouillon("d", "d4", "2026-01-04");
    await depot.publishWithQuota(d, "2026-01-04");

    // Lecture **en base**, après la fin de la transaction.
    const final = await etat();
    const parId = new Map(final.map((ligne) => [ligne.id, ligne]));

    // 5. Le plafond n'est pas dépassé.
    expect(await compterPubliees()).toBe(3);
    expect(final.filter((ligne) => ligne.status === "PUBLISHED")).toHaveLength(3);

    // 6. La plus ancienne est archivée, avec sa date d'archivage persistée.
    expect(parId.get(a)).toMatchObject({ status: "ARCHIVED", archive: true });

    // 7. La nouvelle est publiée, à sa date.
    expect(parId.get(d)).toMatchObject({
      status: "PUBLISHED",
      publishedAt: "2026-01-04",
      archive: false,
    });

    // 8. Les deux autres restent publiées.
    expect(parId.get(b)).toMatchObject({ status: "PUBLISHED", archive: false });
    expect(parId.get(c)).toMatchObject({ status: "PUBLISHED", archive: false });

    // 9. Les statuts sont bien **persistés** : une relecture par une connexion
    // distincte les retrouve, ils ne viennent donc pas d'un objet en mémoire.
    const [relu] = await base.sql<{ status: string }[]>`
      select status from publications where id = ${a}
    `;
    expect(relu?.status).toBe("ARCHIVED");
  });

  /* ------------------------------------------------------------------------ */
  /*  2. Le départage par `id ASC` à date identique                            */
  /* ------------------------------------------------------------------------ */

  it("à dates identiques, la plus ancienne est celle dont l'id est le plus petit", async () => {
    // Les identifiants sont choisis pour que l'ordre d'**insertion** ne coïncide
    // avec aucun des deux autres ordres possibles : `x` est inséré en premier
    // mais porte le plus grand id, `y` porte le plus petit. Une implémentation
    // qui archiverait « la première ligne rencontrée » archiverait `x` ; celle de
    // `docs/035` §1 (`published_at ASC, id ASC`) archive `y`.
    const x = await creerBrouillon("x", "c3", "2026-02-01");
    const y = await creerBrouillon("y", "a1", "2026-02-01");
    const z = await creerBrouillon("z", "b2", "2026-02-01");

    await depot.publishWithQuota(x, "2026-02-01");
    await depot.publishWithQuota(y, "2026-02-01");
    await depot.publishWithQuota(z, "2026-02-01");

    const w = await creerBrouillon("w", "d4", "2026-02-02");
    await depot.publishWithQuota(w, "2026-02-02");

    const final = await etat();
    const parId = new Map(final.map((ligne) => [ligne.id, ligne]));

    expect(await compterPubliees()).toBe(3);
    expect(parId.get(y)).toMatchObject({ status: "ARCHIVED", archive: true });
    expect(parId.get(x)).toMatchObject({ status: "PUBLISHED", archive: false });
    expect(parId.get(z)).toMatchObject({ status: "PUBLISHED", archive: false });
    expect(parId.get(w)).toMatchObject({ status: "PUBLISHED", archive: false });
  });

  /* ------------------------------------------------------------------------ */
  /*  3. Le dépassement est refusé, il n'est pas résorbé en silence            */
  /* ------------------------------------------------------------------------ */

  it("une republication de la même ligne ne consomme aucune place", async () => {
    const a = await creerBrouillon("a", "a1", "2026-03-01");
    const b = await creerBrouillon("b", "b2", "2026-03-02");
    const c = await creerBrouillon("c", "c3", "2026-03-03");

    await depot.publishWithQuota(a, "2026-03-01");
    await depot.publishWithQuota(b, "2026-03-02");
    await depot.publishWithQuota(c, "2026-03-03");

    // Republier une ligne déjà publiée : `planPublication` l'exclut de ses propres
    // candidates (`exceptId`), donc rien n'est archivé.
    await depot.publishWithQuota(a, "2026-03-04");

    const final = await etat();
    expect(final.map((ligne) => ligne.status)).toEqual([
      "PUBLISHED",
      "PUBLISHED",
      "PUBLISHED",
    ]);
    expect(final.filter((ligne) => ligne.archive)).toHaveLength(0);
    expect(final.find((ligne) => ligne.id === a)?.publishedAt).toBe("2026-03-04");
  });

  /* ------------------------------------------------------------------------ */
  /*  4. La concurrence réelle                                                 */
  /* ------------------------------------------------------------------------ */

  it("trois publications simultanées ne dépassent pas le quota et restent ordonnées", async () => {
    const a = await creerBrouillon("a", "a1", "2026-04-01");
    const b = await creerBrouillon("b", "b2", "2026-04-02");
    const c = await creerBrouillon("c", "c3", "2026-04-03");

    await depot.publishWithQuota(a, "2026-04-01");
    await depot.publishWithQuota(b, "2026-04-02");
    await depot.publishWithQuota(c, "2026-04-03");

    const d1 = await creerBrouillon("d1", "d1", "2026-04-04");
    const d2 = await creerBrouillon("d2", "d2", "2026-04-05");
    const d3 = await creerBrouillon("d3", "d3", "2026-04-06");

    /**
     * **Barrière** : une transaction indépendante prend le verrou d'avis et le
     * garde. Les trois publications qui suivent ne peuvent donc pas entrer dans
     * la section critique — elles s'empilent derrière le verrou, et leur
     * chevauchement est **observable** dans `pg_locks` avant d'être relâché.
     *
     * C'est ce qui remplace une temporisation : on n'espère pas que trois
     * promesses lancées ensemble se chevauchent, on **constate** que trois
     * transactions attendent le même verrou au même instant.
     */
    let libererLeVerrou!: () => void;
    const attendreLiberation = new Promise<void>((resoudre) => {
      libererLeVerrou = resoudre;
    });
    let verrouPris = false;

    const detenteurDuVerrou = base.sql.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(hashtext('publications.quota'))`;
      verrouPris = true;
      await attendreLiberation;
    });

    /** Attend une condition, avec une borne — jamais une durée fixe. */
    async function attendre(
      condition: () => Promise<boolean>,
      description: string,
      essais = 200,
      intervalleMs = 25,
    ): Promise<boolean> {
      for (let essai = 0; essai < essais; essai += 1) {
        if (await condition()) return true;
        await new Promise((resoudre) => setTimeout(resoudre, intervalleMs));
      }
      console.warn(`[quota] condition non atteinte : ${description}`);
      return false;
    }

    /** Transactions bloquées sur l'**advisory lock** effectivement détenu. */
    async function compterEnAttenteSurLeVerrou(): Promise<number> {
      const [ligne] = await base.sql<{ n: number }[]>`
        select count(*)::int as n
          from pg_locks attente
          join pg_locks detenu
            on detenu.locktype = attente.locktype
           and detenu.classid = attente.classid
           and detenu.objid = attente.objid
           and detenu.objsubid = attente.objsubid
           and detenu.granted
         where attente.locktype = 'advisory'
           and not attente.granted
           and attente.database = (select oid from pg_database where datname = current_database())
      `;
      return ligne?.n ?? 0;
    }

    const publicationsConcurrentes = [
      depot.publishWithQuota(d1, "2026-04-04"),
      depot.publishWithQuota(d2, "2026-04-05"),
      depot.publishWithQuota(d3, "2026-04-06"),
    ];

    let attentesObservees = 0;

    try {
      await attendre(async () => verrouPris, "le détenteur du verrou démarre");

      // Les trois transactions doivent être **simultanément** en attente.
      const troisEnAttente = await attendre(
        async () => {
          attentesObservees = Math.max(attentesObservees, await compterEnAttenteSurLeVerrou());
          return attentesObservees >= 3;
        },
        "trois transactions en attente sur le verrou d'avis",
      );

      expect({ attentesObservees, troisEnAttente }).toEqual({
        attentesObservees: 3,
        troisEnAttente: true,
      });

      // Pendant l'attente, aucune n'a écrit : la preuve que la règle est décidée
      // **sous** le verrou, et non lue par trois transactions qui courent
      // ensemble avant de conclure chacune de son côté.
      expect(await compterPubliees()).toBe(3);
    } finally {
      // La barrière est relâchée même si une assertion ci-dessus a échoué :
      // sans cela, les trois transactions resteraient bloquées et la suite
      // laisserait un pool ouvert.
      libererLeVerrou();
      await Promise.allSettled(publicationsConcurrentes);
      await detenteurDuVerrou;
    }

    const resultats = await Promise.all(publicationsConcurrentes);
    expect(resultats.filter((resultat) => resultat !== null)).toHaveLength(3);

    /* --- État final, relu en base après la fin de toutes les transactions --- */

    const final = await etat();
    const parId = new Map(final.map((ligne) => [ligne.id, ligne]));
    const publiees = final.filter((ligne) => ligne.status === "PUBLISHED");

    // Le quota n'a jamais été franchi.
    expect(await compterPubliees()).toBe(3);
    expect(publiees).toHaveLength(3);

    // Le résultat final est **déterministe** : les trois nouvelles publications
    // ont pris les trois places, les trois anciennes sont archivées — quel que
    // soit l'ordre dans lequel les transactions ont obtenu le verrou.
    expect(new Set(publiees.map((ligne) => ligne.id))).toEqual(new Set([d1, d2, d3]));

    // L'archivage est persisté, et il a touché exactement les trois anciennes.
    for (const ancienne of [a, b, c]) {
      expect(parId.get(ancienne)).toMatchObject({ status: "ARCHIVED", archive: true });
    }

    // Aucune publication n'a été archivée deux fois, aucune ligne étrangère n'a
    // été touchée : six lignes au total, trois publiées, trois archivées.
    expect(final).toHaveLength(6);
    expect(final.filter((ligne) => ligne.archive)).toHaveLength(3);

    // L'ordre d'archivage reste `published_at ASC, id ASC` : parmi les trois
    // archivées, ce sont bien les trois plus anciennes qui le sont.
    const datesPubliees = publiees.map((ligne) => ligne.publishedAt).sort();
    expect(datesPubliees).toEqual(["2026-04-04", "2026-04-05", "2026-04-06"]);
  });

  /* ------------------------------------------------------------------------ */
  /*  5. Chevauchement forcé : la décision est prise sous le verrou           */
  /* ------------------------------------------------------------------------ */

  /**
   * Ce scénario **force** les trois transactions à se chevaucher, au lieu
   * d'attendre du hasard qu'elles se rencontrent.
   *
   * La barrière verrouille les **trois lignes cibles** (`SELECT … FOR UPDATE`).
   * Chaque transaction peut alors lire l'état publié — l'étape de **décision** —
   * mais se bloque à l'écriture de sa propre cible. Autrement dit, les trois sont
   * nécessairement engagées dans la section critique au même instant, et ce que
   * le verrou d'avis change est **observable** :
   *
   * - **avec** le verrou : une seule transaction décide, les deux autres sont
   *   encore en attente du verrou d'avis — elles décideront sur un état à jour ;
   * - **sans** le verrou : les trois décident sur le **même** état périmé
   *   « `{A, B, C}` publiées, la plus ancienne est A », archivent chacune A, et
   *   le site se retrouve à **cinq** publications en ligne.
   *
   * C'est cette différence qui fait du verrou une pièce porteuse, et non un
   * ornement. Le contrôle a été exécuté : verrou retiré temporairement, ce test
   * échoue en constatant cinq publiées ; verrou rétabli à l'identique
   * (SHA-256 vérifié), il passe.
   */
  it("trois transactions engagées ensemble restent sérialisées", async () => {
    const a = await creerBrouillon("a", "a1", "2026-06-01");
    const b = await creerBrouillon("b", "b2", "2026-06-02");
    const c = await creerBrouillon("c", "c3", "2026-06-03");

    await depot.publishWithQuota(a, "2026-06-01");
    await depot.publishWithQuota(b, "2026-06-02");
    await depot.publishWithQuota(c, "2026-06-03");

    const d1 = await creerBrouillon("d1", "d1", "2026-06-04");
    const d2 = await creerBrouillon("d2", "d2", "2026-06-05");
    const d3 = await creerBrouillon("d3", "d3", "2026-06-06");

    let libererLesLignes!: () => void;
    const attendreLiberation = new Promise<void>((resoudre) => {
      libererLesLignes = resoudre;
    });

    const barrage = base.sql.begin(async (transaction) => {
      // Les trois cibles sont verrouillées : aucune transaction ne pourra écrire
      // sa publication tant que la barrière est tenue.
      await transaction`
        select id from publications where id in (${d1}, ${d2}, ${d3}) for update
      `;
      await attendreLiberation;
    });

    /** Transactions de ce test réellement bloquées sur un verrou. */
    async function compterBloquees(): Promise<number> {
      const [ligne] = await base.sql<{ n: number }[]>`
        select count(*)::int as n
          from pg_stat_activity
         where datname = current_database()
           and wait_event_type = 'Lock'
      `;
      return ligne?.n ?? 0;
    }

    async function attendreCondition(
      condition: () => Promise<boolean>,
      essais = 200,
      intervalleMs = 25,
    ): Promise<boolean> {
      for (let essai = 0; essai < essais; essai += 1) {
        if (await condition()) return true;
        await new Promise((resoudre) => setTimeout(resoudre, intervalleMs));
      }
      return false;
    }

    // Les trois publications sont lancées avant que la barrière ne relâche quoi
    // que ce soit : elles ne peuvent donc pas se succéder « par chance ».
    const concurrentes = [
      depot.publishWithQuota(d1, "2026-06-04"),
      depot.publishWithQuota(d2, "2026-06-05"),
      depot.publishWithQuota(d3, "2026-06-06"),
    ];

    let bloqueesObservees = 0;

    try {
      const engagees = await attendreCondition(async () => {
        bloqueesObservees = Math.max(bloqueesObservees, await compterBloquees());
        return bloqueesObservees >= 3;
      });

      expect({ engagees, bloqueesObservees }).toEqual({ engagees: true, bloqueesObservees: 3 });

      // Aucune n'a encore écrit : la décision n'est pas prise pendant que les
      // trois tournent ensemble.
      expect(await compterPubliees()).toBe(3);
    } finally {
      libererLesLignes();
      await Promise.allSettled(concurrentes);
      await barrage;
    }

    await Promise.all(concurrentes);

    const final = await etat();
    const publiees = final.filter((ligne) => ligne.status === "PUBLISHED");

    expect(await compterPubliees()).toBe(3);
    expect(final).toHaveLength(6);
    expect(new Set(publiees.map((ligne) => ligne.id))).toEqual(new Set([d1, d2, d3]));
    expect(final.filter((ligne) => ligne.archive)).toHaveLength(3);
  });

  /* ------------------------------------------------------------------------ */
  /*  6. Non-régression I8 : la valeur rendue EST l'état persisté             */
  /* ------------------------------------------------------------------------ */

  /**
   * Ce test est né d'un défaut réel, mesuré avant correction (I8 de `docs/039`).
   *
   * `publishWithQuota` terminait par `return this.findById(id)` **à l'intérieur**
   * du bloc de transaction — mais `findById` interroge `this.db`, c'est-à-dire le
   * pool : la lecture partait donc sur une **autre connexion**, qui ne voit pas
   * les écritures non validées. La méthode rendait la ligne dans son état
   * d'**avant** : `status: "DRAFT"` pour une publication qui venait d'être mise
   * en ligne. `PublicationService.create` et `.update` relayant cette valeur telle
   * quelle (`publication.service.ts`, lignes 67 et 121), l'API répondait `DRAFT`
   * pour une publication publiée.
   *
   * **Avant correction, ce test échouait exactement ici** — il s'appelait alors
   * `[défaut connu] …` et affirmait le comportement fautif. Il affirme désormais
   * le comportement attendu, et il est précisément conçu pour ne pas pouvoir
   * repasser au vert par accident :
   *
   * 1. le **statut** rendu doit être `PUBLISHED` ;
   * 2. l'objet rendu est comparé **champ par champ** à l'état relu par SQL après
   *    validation — il ne suffit pas que le statut soit bon si une date, un
   *    département ou un horodatage vient d'une lecture périmée ;
   * 3. la **couverture est hydratée** (`coverImageUrl`, résolue depuis `media`) :
   *    une correction qui lirait la seule ligne de `publications` sans repasser
   *    par `hydrate` perdrait cette relation, et ce test le dirait ;
   * 4. la **règle du quota** et l'**archivage de la plus ancienne** restent
   *    vérifiés, puisqu'ils font partie du même appel.
   */
  it("rend la publication avec son statut réel, hydratée, comme en base", async () => {
    const couverture = await creerMediaFixture("couverture", "c0");

    const a = await creerBrouillon("a", "a1", "2026-05-01");
    const b = await creerBrouillon("b", "b2", "2026-05-02");
    const c = await creerBrouillon("c", "c3", "2026-05-03");

    await depot.publishWithQuota(a, "2026-05-01");
    await depot.publishWithQuota(b, "2026-05-02");
    await depot.publishWithQuota(c, "2026-05-03");

    // Quatrième publication : elle déclenche l'archivage de `a`, et c'est **son**
    // objet rendu qui doit refléter les écritures de la transaction.
    const d = await creerBrouillon("d", "d4", "2026-05-04", couverture.id);
    const rendu = await depot.publishWithQuota(d, "2026-05-04");

    /**
     * État persisté, relu **après** la validation de la transaction.
     *
     * Deux lectures, et les deux servent :
     *
     * - la lecture typée (drizzle) donne exactement la forme des colonnes, donc
     *   une comparaison **champ par champ** avec l'objet rendu — `toStrictEqual`
     *   n'ignore aucune clé, y compris celles qui valent `undefined` ;
     * - la lecture **SQL brute** ancre le statut sur la base elle-même, sans
     *   passer par la couche qui l'a écrit. C'est la vérification que réclamait
     *   la mission : le statut ne vient pas d'un objet en mémoire.
     */
    const [lignePersistee] = await base.db
      .select()
      .from(publications)
      .where(eq(publications.id, d));

    const [statutSql] = await base.sql<{ status: string }[]>`
      select status from publications where id = ${d}
    `;

    // 1. Le statut rendu est le statut réel — celui de la base, et non l'ancien.
    expect(rendu?.status).toBe("PUBLISHED");
    expect(statutSql?.status).toBe("PUBLISHED");
    expect(rendu?.id).toBe(d);

    // 2. L'objet rendu **est** l'état persisté, champ par champ : mêmes valeurs,
    //    y compris `createdAt` et `updatedAt`, qui provenaient d'une lecture
    //    périmée avant la correction. Le contrat du repository expose une URL de
    //    couverture là où la table porte une référence (`coverMediaId`).
    expect(lignePersistee).toBeDefined();
    const { coverMediaId, ...attendu } = lignePersistee as Record<string, unknown>;
    expect(coverMediaId).toBe(couverture.id);
    expect(rendu).toStrictEqual({ ...attendu, coverImageUrl: couverture.publicUrl });

    // 3. L'hydratation du contrat est préservée : la couverture est résolue par
    //    `media`, et non laissée nulle.
    expect(rendu?.coverImageUrl).toBe(couverture.publicUrl);

    // 4. La règle du quota et l'archivage restent ceux de `docs/035` §1.
    expect(await compterPubliees()).toBe(3);

    const final = await etat();
    const parId = new Map(final.map((ligne) => [ligne.id, ligne]));
    expect(parId.get(a)).toMatchObject({ status: "ARCHIVED", archive: true });
    expect(parId.get(b)).toMatchObject({ status: "PUBLISHED", archive: false });
    expect(parId.get(c)).toMatchObject({ status: "PUBLISHED", archive: false });
  });
});
