import type { TransactionSql } from "postgres";
import { closeDatabase, sql } from "@/infrastructure/database/client";
import { logger } from "@/infrastructure/logger";
import { evaluateProbe, runProbe, type Sonde, type Observation } from "./lib/probe-harness";
import { comparer, empreinte, empreinteTable } from "./lib/database-fingerprint";
import {
  CODE_TRANSACTION_AVORTEE,
  createProbeCatalogue,
  MESSAGE_TRANSACTION_AVORTEE,
  MESSAGES_OBSERVES,
} from "./lib/migration-probes";

/**
 * **Le harnais de sondes sait-il échouer ?**
 *
 * ```text
 * npm run db:selftest
 * ```
 *
 * ### Pourquoi ce script existe
 *
 * Un harnais de vérification peut être faux de deux manières. La première est
 * bruyante : il échoue et on le voit. La seconde est silencieuse : il **réussit**
 * sans rien avoir établi. Le projet a connu la seconde — au Lot 5, un harnais a
 * annoncé quatre refus alors que la transaction était avortée depuis la première
 * violation, et les quatre essais n'avaient jamais atteint la règle qu'ils
 * prétendaient éprouver. Ce script s'attaque à cette classe-là, et il le fait en
 * **exécutant** les comportements qu'il invoque plutôt qu'en les commentant.
 *
 * Un dispositif qui vérifie un harnais doit lui-même être soupçonné : chacun des
 * contrôles ci-dessous produit une observation, et la compare à une attente
 * écrite à l'avance — y compris quand l'attente est un échec.
 *
 * ### Ce que chaque contrôle établit
 *
 * | Contrôle | Ce qu'il prouve |
 * | --- | --- |
 * | 1 | après une violation, toute instruction suivante est refusée pour **cette** raison (`25P02`) : le défaut du Lot 5 est reproduit, pas supposé |
 * | 2 | avec un `SAVEPOINT` par sonde, la même séquence redevient signifiante : l'écriture légitime est **acceptée** |
 * | 3 | le harnais **détecte** une attente fausse et un motif voisin, et n'est pas systématiquement négatif |
 * | 4 | une transaction avortée ne peut pas produire un refus conforme — ni par `evaluateProbe`, ni par `runProbe` |
 * | 5 | chaque motif du catalogue réel ne reconnaît **que** la règle qu'il vise |
 * | 6 | une écriture acceptée est visible dans la transaction, disparaît au retour de `SAVEPOINT`, et ne survit pas à l'annulation finale |
 * | 7 | une erreur rattrapée resurgit à la fin d'une transaction : c'est ce qui oblige `verify-migrations.ts` à terminer en levant |
 * | 8 | l'empreinte qui atteste « transaction annulée » **voit** une modification d'état, puis redevient identique après annulation |
 *
 * ### Ce qu'il n'écrit pas
 *
 * Aucune donnée : les contrôles 1 à 6 vivent dans une transaction terminée par un
 * `ROLLBACK`, et leur empreinte est vérifiée après coup ; le contrôle 7 n'émet
 * qu'un `select 1/0`, qui ne peut rien écrire par construction. Le script
 * n'applique aucune migration et ne crée aucun compte.
 */

/* -------------------------------------------------------------------------- */
/*  Journalisation des contrôles                                              */
/* -------------------------------------------------------------------------- */

interface Controle {
  nom: string;
  attendu: string;
  observe: string;
  conforme: boolean;
}

const controles: Controle[] = [];

function controler(nom: string, attendu: string, observe: string, conforme: boolean): void {
  controles.push({ nom, attendu, observe, conforme });
  console.log(
    `  ${conforme ? "OK " : "!!!"} ${nom}\n        attendu : ${attendu}\n        observé : ${observe}`,
  );
}

/** Exécute une instruction et renvoie l'observation brute, sans interprétation. */
async function observer(
  tx: TransactionSql,
  requete: (t: TransactionSql) => Promise<unknown>,
): Promise<Observation> {
  try {
    await requete(tx);
    return { issue: "accepté", message: "", code: "" };
  } catch (error) {
    const erreur = error as Error & { code?: string };
    return {
      issue: "refusé",
      message: erreur.message.split("\n")[0] ?? "",
      code: erreur.code ?? "",
    };
  }
}

/** Compte les lignes d'une table, vue depuis une connexion **hors** transaction. */
async function compter(table: string): Promise<number> {
  const [ligne] = await sql.unsafe(`select count(*)::int as n from ${table}`);
  return (ligne as unknown as { n: number }).n;
}

/**
 * Compte les lignes **depuis l'intérieur de la transaction**.
 *
 * La distinction n'est pas cosmétique : une écriture non validée n'est visible que
 * de sa propre transaction. Un premier jet de ce contrôle comptait par une autre
 * connexion et observait `0` après une insertion pourtant acceptée — le contrôle
 * mesurait l'isolation entre connexions, pas l'effet de l'écriture. C'est
 * exactement ce que ce script doit rendre visible : une preuve qui échoue pour une
 * raison étrangère à la propriété visée.
 */
async function compterDans(tx: TransactionSql, table: string): Promise<number> {
  const [ligne] = await tx.unsafe(`select count(*)::int as n from ${table}`);
  return (ligne as unknown as { n: number }).n;
}

const VIOLATION = `insert into site_settings (key, value) values ('recovery_key_share_1', 'fragment')`;
const ECRITURE_LEGITIME = `insert into site_settings (key, value) values ('church_name', 'Centre Chrétien Jésus ma Vie')`;

/* -------------------------------------------------------------------------- */
/*  Contrôle 7 — isolé, hors de la transaction principale                     */
/* -------------------------------------------------------------------------- */

/**
 * Une erreur rattrapée à l'intérieur d'un bloc `sql.begin` **ressurgit** quand le
 * bloc se termine normalement : `postgres.js` conserve la première erreur de la
 * transaction et rejette `sql.begin` avec elle.
 *
 * Ce n'est pas un détail d'implémentation, c'est ce qui rend nécessaire le `throw`
 * final de `verify-migrations.ts`. Si ce contrôle venait à échouer, le
 * vérificateur pourrait **valider** une migration en croyant l'annuler.
 *
 * L'unique instruction émise est `select 1/0` : elle échoue toujours (`22012`) et
 * ne peut écrire quoi que ce soit, quelle que soit l'issue de la transaction.
 */
async function controleErreurQuiResurgit(): Promise<void> {
  const avant = await compter("site_settings");
  let verdict = "";

  try {
    await sql.begin(async (tx) => {
      try {
        await tx`select 1/0`;
      } catch {
        // Volontairement rattrapée : c'est le cas qui doit ressurgir.
      }
      // Retour normal : `sql.begin` doit malgré tout refuser de valider.
    });
    verdict = "sql.begin résolu — la transaction aurait été validée";
  } catch (error) {
    verdict = `sql.begin rejette — code ${String((error as { code?: string }).code)}`;
  }

  const apres = await compter("site_settings");

  controler(
    "7. une erreur rattrapée resurgit à la fin de la transaction",
    "sql.begin rejette avec le code 22012 | site_settings inchangé",
    `${verdict} | ${String(avant)} → ${String(apres)} ligne(s)`,
    verdict.includes("22012") && avant === apres,
  );
}

/* -------------------------------------------------------------------------- */
/*  Contrôles 1 à 6 — dans une transaction annulée                            */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  console.log("Preuve de sensibilité du harnais de sondes — AUCUNE donnée n'est écrite.\n");
  console.log("Contrôles :\n");

  // --- Contrôle 7, seul, avant d'ouvrir la transaction principale -----------
  await controleErreurQuiResurgit();

  const [media] = await sql`select id from media limit 1`;
  const [dept] = await sql`select id from departments limit 1`;
  const [profil] = await sql`select id from admin_profiles limit 1`;
  if (!media || !dept || !profil) {
    console.error("Contexte insuffisant : média, département et profil requis.");
    process.exitCode = 1;
    await closeDatabase();
    return;
  }

  const catalogue = createProbeCatalogue({
    mediaId: media.id,
    deptId: dept.id,
    profileId: profil.id,
  });

  const accesAvant = await compter("media_access");

  /** Écriture légitime : une autorisation valide pour le département. */
  const ecrireAutorisationValide = (t: TransactionSql) =>
    t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${media.id}, 'DEPARTMENT', ${dept.id}, true, ${profil.id})`;

  /** Écriture qu'une contrainte refuse : `updated_at` antérieur à `granted_at`. */
  const ecrireHorodatageIncoherent = (t: TransactionSql) =>
    t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by, granted_at, updated_at) values (${media.id}, 'DEPARTMENT', ${dept.id}, true, ${profil.id}, now(), now() - interval '1 day')`;

  const sondeLegitime: Sonde = {
    requires: "0003_medical_blue_blade.sql",
    label: "essai : autorisation valide attendue acceptée",
    attendu: "accepté",
    run: ecrireAutorisationValide,
  };

  const sondeHorodatageJuste: Sonde = {
    requires: "0003_medical_blue_blade.sql",
    label: "essai : horodatage incohérent, motif juste",
    attendu: "refusé",
    motif: /media_access_timestamps_order/,
    run: ecrireHorodatageIncoherent,
  };

  const ROLLBACK = "__SELFTEST_TERMINE__";

  try {
    await sql.begin(async (tx) => {
      /* --- Contrôle 1 : le défaut du Lot 5, reproduit --------------------- */
      await tx.unsafe("savepoint controle_1");

      const premiere = await observer(tx, (t) => t.unsafe(VIOLATION));
      // Aucun point de retour entre les deux : la transaction est morte, et
      // l'instruction suivante n'atteindra jamais la règle qu'elle visait.
      const deuxieme = await observer(tx, (t) => t.unsafe(ECRITURE_LEGITIME));

      await tx.unsafe("rollback to savepoint controle_1");

      controler(
        "1. sans isolation, une violation avorte la transaction",
        `1re refusée (23514) | 2e refusée (${CODE_TRANSACTION_AVORTEE}), message sans rapport avec la règle`,
        `1re : ${premiere.issue} (${premiere.code}) | 2e : ${deuxieme.issue} (${deuxieme.code}) — ${deuxieme.message.slice(0, 70)}`,
        premiere.code === "23514" &&
          deuxieme.code === CODE_TRANSACTION_AVORTEE &&
          deuxieme.message.includes("current transaction is aborted"),
      );

      /* --- Contrôle 2 : l'isolation restaure le sens ---------------------- */
      const isolee = await runProbe(tx, 901, sondeLegitime);

      controler(
        "2. avec un SAVEPOINT par sonde, la même écriture est acceptée",
        "conforme : l'écriture légitime passe après une violation isolée",
        `${isolee.observation.issue} — ${isolee.raison}`,
        isolee.conforme,
      );

      /* --- Contrôle 3 : le harnais détecte les attentes fausses ---------- */
      const attenteInversee = await runProbe(tx, 902, {
        requires: "0003_medical_blue_blade.sql",
        label: "essai : écriture valide, attente de refus",
        attendu: "refusé",
        motif: /.*/,
        run: ecrireAutorisationValide,
      });

      controler(
        "3a. une écriture acceptée ne satisfait pas une attente de refus",
        "non conforme : attendu « refusé », observé « accepté »",
        `${attenteInversee.conforme ? "conforme" : "non conforme"} — ${attenteInversee.raison}`,
        !attenteInversee.conforme,
      );

      const refusAttenduAccepte = await runProbe(tx, 903, {
        requires: "0003_medical_blue_blade.sql",
        label: "essai : écriture refusée, attente d'acceptation",
        attendu: "accepté",
        run: ecrireHorodatageIncoherent,
      });

      controler(
        "3b. une écriture refusée ne satisfait pas une attente d'acceptation",
        "non conforme : attendu « accepté », observé « refusé »",
        `${refusAttenduAccepte.conforme ? "conforme" : "non conforme"} — ${refusAttenduAccepte.raison}`,
        !refusAttenduAccepte.conforme,
      );

      const mauvaisMotif = await runProbe(tx, 904, {
        requires: "0003_medical_blue_blade.sql",
        label: "essai : horodatage incohérent, motif voisin",
        attendu: "refusé",
        motif: /media_access_department_unique/,
        run: ecrireHorodatageIncoherent,
      });

      controler(
        "3c. un refus par une autre règle n'est pas conforme",
        "non conforme : le motif visé est absent du message",
        `${mauvaisMotif.conforme ? "conforme" : "non conforme"} — ${mauvaisMotif.raison}`,
        !mauvaisMotif.conforme,
      );

      const motifJuste = await runProbe(tx, 905, sondeHorodatageJuste);

      controler(
        "3d. le harnais n'est pas systématiquement négatif",
        "conforme : le refus porte bien le motif visé",
        `${motifJuste.conforme ? "conforme" : "non conforme"} — ${motifJuste.raison}`,
        motifJuste.conforme,
      );

      /* --- Contrôle 4 : un avortement n'est jamais un refus -------------- */
      const parQualification = evaluateProbe(
        { attendu: "refusé", motif: /.*/ },
        { issue: "refusé", message: MESSAGE_TRANSACTION_AVORTEE, code: CODE_TRANSACTION_AVORTEE },
      );

      controler(
        "4a. evaluateProbe refuse un avortement, même avec un motif permissif",
        "non conforme : 25P02 n'établit rien sur la règle visée",
        `${parQualification.conforme ? "conforme" : "non conforme"} — ${parQualification.raison}`,
        !parQualification.conforme,
      );

      const complaisantes = catalogue.filter(
        (sonde) =>
          evaluateProbe(sonde, {
            issue: "refusé",
            message: MESSAGE_TRANSACTION_AVORTEE,
            code: CODE_TRANSACTION_AVORTEE,
          }).conforme,
      );

      controler(
        "4b. aucune sonde du catalogue réel n'accepte un avortement",
        `0 sonde complaisante sur ${String(catalogue.length)}`,
        `${String(complaisantes.length)} : ${complaisantes.map((sonde) => sonde.label).join(" | ") || "aucune"}`,
        complaisantes.length === 0,
      );

      // Et si la transaction est réellement avortée, `runProbe` échoue **en le
      // disant** au lieu de comptabiliser un refus : il ne peut pas poser son
      // propre point de retour.
      await tx.unsafe("savepoint controle_4c");
      await observer(tx, (t) => t.unsafe(VIOLATION));

      let echecVisible = "";
      try {
        await runProbe(tx, 906, sondeLegitime);
        echecVisible = "aucune erreur : le harnais a produit un résultat";
      } catch (error) {
        echecVisible = `erreur levée — code ${String((error as { code?: string }).code)}`;
      }

      await tx.unsafe("rollback to savepoint controle_4c");

      controler(
        "4c. dans une transaction avortée, runProbe échoue au lieu de conclure",
        `erreur levée avec le code ${CODE_TRANSACTION_AVORTEE}`,
        echecVisible,
        echecVisible.includes(CODE_TRANSACTION_AVORTEE),
      );

      /* --- Contrôle 5 : les motifs du catalogue discriminent ------------- */
      const ambigus: string[] = [];
      const sansFixture: string[] = [];

      for (const sonde of catalogue) {
        if (sonde.attendu !== "refusé") continue;

        const messageReel = MESSAGES_OBSERVES[sonde.label];

        if (messageReel === undefined) {
          // Un libellé renommé sans sa fixture retirerait silencieusement le
          // contrôle : c'est un échec, pas une dispense.
          sansFixture.push(sonde.label);
          continue;
        }

        const autres = Object.entries(MESSAGES_OBSERVES)
          .filter(([label, message]) => label !== sonde.label && message !== messageReel)
          .filter(([, message]) => sonde.motif.test(message));

        if (autres.length > 0) {
          ambigus.push(`${sonde.label} reconnaît ${String(autres.length)} autre(s) message(s)`);
        }
      }

      controler(
        "5. chaque motif de refus ne reconnaît que la règle qu'il vise",
        "0 motif ambigu, 0 sonde sans message observé",
        `${String(ambigus.length)} motif(s) ambigu(s) : ${ambigus.join(" | ") || "aucun"}` +
          ` | ${String(sansFixture.length)} sonde(s) sans fixture : ${sansFixture.join(" | ") || "aucune"}`,
        ambigus.length === 0 && sansFixture.length === 0,
      );

      /* --- Contrôle 6 : les effets transactionnels ----------------------- */
      // a. une écriture acceptée est visible dans la transaction ;
      await tx.unsafe("savepoint controle_6");
      await observer(tx, ecrireAutorisationValide);
      const dansLaTransaction = await compterDans(tx, "media_access");

      // b. elle disparaît au retour du point de sauvegarde.
      await tx.unsafe("rollback to savepoint controle_6");
      const apresRetour = await compterDans(tx, "media_access");

      controler(
        "6a. une écriture acceptée est visible, puis annulée par le SAVEPOINT",
        `visible dans la transaction : ${String(accesAvant + 1)} | après retour : ${String(accesAvant)}`,
        `visible : ${String(dansLaTransaction)} | après retour : ${String(apresRetour)}`,
        dansLaTransaction === accesAvant + 1 && apresRetour === accesAvant,
      );

      /* --- Contrôle 8 : l'empreinte sait voir une différence ------------- */
      // `verify-migrations.ts` conclut « transaction annulée » parce que
      // l'empreinte est identique. Ce contrôle établit que cette empreinte
      // **n'est pas aveugle** : sur un état réellement modifié, elle diffère.
      // Lecture et modification passent par **la transaction**, puisque c'est là
      // que l'état modifié existe.
      const lireEmpreinte = (requete: string) => tx.unsafe(requete);

      const publicationsAvant = await empreinteTable(lireEmpreinte, "publications");
      const compteursAvant = await empreinte(lireEmpreinte);

      await tx.unsafe("savepoint controle_8");
      // Une modification d'**état**, sans changement du nombre de lignes : c'est
      // exactement ce qu'un décompte de lignes ne verrait pas.
      await observer(tx, (t) =>
        t.unsafe(`
          update publications
             set title = title || ' [essai]'
           where id in (select id from publications limit 1)
        `),
      );

      const publicationsModifiees = await empreinteTable(lireEmpreinte, "publications");
      const comparaisonModifiee = comparer(compteursAvant, await empreinte(lireEmpreinte));

      await tx.unsafe("rollback to savepoint controle_8");

      const publicationsApres = await empreinteTable(lireEmpreinte, "publications");
      const comparaisonRendue = comparer(compteursAvant, await empreinte(lireEmpreinte));

      controler(
        "8. l'empreinte voit une modification d'état, et redevient identique après annulation",
        "modifiée : publications différente et table signalée | après retour : identique",
        `modifiée : ${publicationsModifiees !== publicationsAvant ? "empreinte différente" : "emprunte INCHANGÉE"}` +
          `, tables signalées : ${comparaisonModifiee.tablesModifiees.join(", ") || "aucune"}` +
          ` | après retour : ${comparaisonRendue.identique ? "identique" : "DIFFÉRENTE"}` +
          `${publicationsApres === publicationsAvant ? "" : " (empreinte non restaurée)"}`,
        publicationsModifiees !== publicationsAvant &&
          comparaisonModifiee.tablesModifiees.includes("publications") &&
          !comparaisonModifiee.identique &&
          comparaisonRendue.identique &&
          publicationsApres === publicationsAvant,
      );

      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if ((error as Error).message !== ROLLBACK) {
      logger.error({ err: error }, "Preuve interrompue");
      process.exitCode = 1;
    }
  }

  /* --- 6b. et rien ne survit à l'annulation finale ----------------------- */
  const accesApres = await compter("media_access");

  controler(
    "6b. rien ne survit à l'annulation de la transaction",
    `media_access : ${String(accesAvant)} avant, ${String(accesAvant)} après`,
    `media_access : ${String(accesAvant)} avant, ${String(accesApres)} après`,
    accesApres === accesAvant,
  );

  const conformes = controles.filter((controle) => controle.conforme).length;
  console.log(
    `\nContrôles conformes : ${String(conformes)}/${String(controles.length)}` +
      (conformes === controles.length ? " — le harnais détecte une preuve fausse." : " — LE HARNAIS NE DÉTECTE PAS TOUT."),
  );

  if (conformes !== controles.length) {
    process.exitCode = 1;
  }

  await closeDatabase();
}

main().catch(async (error: unknown) => {
  logger.error({ err: error }, "Preuve impossible");
  process.exitCode = 1;
  await closeDatabase();
});
