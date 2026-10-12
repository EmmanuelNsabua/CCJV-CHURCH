import type { TransactionSql } from "postgres";

/**
 * Le harnais de sondes, extrait du vérificateur de migrations pour être
 * **exerçable et prouvable** hors de lui.
 *
 * ### Pourquoi ce fichier existe
 *
 * Au Lot 5, un premier harnais de sondes a annoncé **quatre refus** qui n'avaient
 * jamais eu lieu. La cause n'était pas la base : sans `SAVEPOINT`, la première
 * violation de contrainte avorte la transaction, et **toute instruction suivante
 * est refusée pour cette raison-là** — quelle que soit la règle qu'elle visait.
 * Un harnais qui enregistre « ça a échoué » comptait donc ces quatre échecs comme
 * quatre preuves de refus. La transaction n'avait plus rien à voir avec le sujet :
 * elle était morte depuis la première sonde.
 *
 * Trois conséquences, écrites ici plutôt que dans un commentaire de circonstance,
 * parce que chacune est une propriété du harnais et non une anecdote :
 *
 * 1. **Chaque sonde est isolée par un `SAVEPOINT`**, et la sonde se termine par
 *    `ROLLBACK TO SAVEPOINT` : elle repart d'un état propre, quelle que soit
 *    l'issue de la précédente. Sans cela, une sonde refusée corromprait toutes
 *    les suivantes — y compris celles qui doivent être **acceptées**, ce qui
 *    rendait le harnais tantôt complaisant, tantôt menteur.
 * 2. **Un refus doit nommer sa règle.** `motif` est **obligatoire** dès que la
 *    sonde attend un refus : sans lui, n'importe quelle erreur satisfait la sonde,
 *    y compris une erreur de syntaxe, une colonne mal orthographiée ou un
 *    avortement de transaction. Le type l'impose, la vérification de structure le
 *    contrôle (`tests/unit/probe-harness.test.ts`).
 * 3. **Un avortement de transaction n'est jamais un refus.** C'est la mesure
 *    directe du défaut du Lot 5 : `25P02` (`current transaction is aborted`) est
 *    reconnu et **rejeté** par `evaluateProbe`, même si le motif de la sonde
 *    avait été écrit trop large pour l'attraper. Le harnais n'est donc plus
 *    protégé par la qualité de ses motifs, mais par construction.
 *
 * ### Ce que le harnais ne fait pas
 *
 * Il n'établit rien à lui seul : il **observe** et **qualifie**. C'est
 * `verify-migrations.ts` qui décide de l'échec (`process.exitCode`), et
 * `verify-probe-harness.ts` qui prouve que ce harnais-là sait échouer.
 */

/* -------------------------------------------------------------------------- */
/*  Spécification d'une sonde                                                 */
/* -------------------------------------------------------------------------- */

interface SondeBase {
  /** Migration dont la sonde dépend : elle est ignorée si elle n'est pas jouée. */
  requires: string;
  label: string;
  run: (tx: TransactionSql) => Promise<unknown>;
}

/** Sonde qui doit **passer** : la base accepte une écriture légitime. */
export interface SondeAcceptee extends SondeBase {
  attendu: "accepté";
}

/** Sonde qui doit **être refusée**, et pour la raison nommée par `motif`. */
export interface SondeRefusee extends SondeBase {
  attendu: "refusé";
  /**
   * Motif attendu dans le message d'erreur. **Obligatoire** : c'est ce champ qui
   * distingue « la règle visée s'applique » de « quelque chose a échoué ».
   */
  motif: RegExp;
}

export type Sonde = SondeAcceptee | SondeRefusee;

/* -------------------------------------------------------------------------- */
/*  Observation et qualification                                              */
/* -------------------------------------------------------------------------- */

/** Ce que le harnais a vu, sans interprétation. */
export interface Observation {
  issue: "accepté" | "refusé";
  /** Premier segment du message PostgreSQL, vide si l'écriture est passée. */
  message: string;
  /** Code d'erreur PostgreSQL (`23514`, `25P02`…), vide si l'écriture est passée. */
  code: string;
}

/** Ce que le harnais en conclut, et **pourquoi**. */
export interface Qualification {
  conforme: boolean;
  /** Motif du verdict, en clair — un `!!!` sans explication ne se diagnostique pas. */
  raison: string;
}

/**
 * Signature d'une transaction **avortée** par une violation antérieure.
 *
 * `25P02` est le code PostgreSQL de « current transaction is aborted, commands
 * ignored until end of transaction block ». C'est exactement l'erreur qui a
 * produit les quatre faux refus du Lot 5 : elle ne dit rien de la règle visée.
 */
const TRANSACTION_AVORTEE = /current transaction is aborted/i;
const CODE_TRANSACTION_AVORTEE = "25P02";

/** Vrai si l'observation est un avortement de transaction, à un titre ou à un autre. */
export function estAvortement(observation: Observation): boolean {
  return (
    observation.code === CODE_TRANSACTION_AVORTEE ||
    TRANSACTION_AVORTEE.test(observation.message)
  );
}

/**
 * Qualifie une observation — **fonction pure**, donc éprouvable sans base.
 *
 * C'est ici, et nulle part ailleurs, que se décide ce qui compte comme preuve.
 */
export function evaluateProbe(
  spec: Pick<Sonde, "attendu"> & { motif?: RegExp },
  observation: Observation,
): Qualification {
  if (estAvortement(observation)) {
    return {
      conforme: false,
      raison:
        "transaction avortée par une violation antérieure (25P02) : le refus " +
        "n'établit rien sur la règle visée",
    };
  }

  if (spec.attendu === "accepté") {
    return observation.issue === "accepté"
      ? { conforme: true, raison: "accepté, comme attendu" }
      : {
          conforme: false,
          raison: `attendu « accepté », observé « refusé »${observation.code ? ` (code ${observation.code})` : ""}`,
        };
  }

  if (observation.issue === "accepté") {
    return { conforme: false, raison: "attendu « refusé », observé « accepté »" };
  }

  if (spec.motif === undefined) {
    // Interdit par le type, mais une sonde construite hors TypeScript resterait
    // possible : on refuse plutôt que d'accepter n'importe quelle erreur.
    return {
      conforme: false,
      raison: "refus observé, mais aucun motif déclaré : le refus n'est pas qualifié",
    };
  }

  return spec.motif.test(observation.message)
    ? { conforme: true, raison: `refusé par la règle visée (${observation.message.slice(0, 120)})` }
    : {
        conforme: false,
        raison:
          `refusé, mais par une autre règle que celle visée — motif attendu ` +
          `${String(spec.motif)} absent de « ${observation.message.slice(0, 120)} »`,
      };
}

/* -------------------------------------------------------------------------- */
/*  Exécution d'une sonde                                                     */
/* -------------------------------------------------------------------------- */

export interface ResultatSonde extends Qualification {
  label: string;
  observation: Observation;
}

/**
 * Exécute une sonde **dans son propre `SAVEPOINT`** et qualifie le résultat.
 *
 * L'ordre est contractuel :
 *
 * ```text
 * SAVEPOINT → exécution → observation → ROLLBACK TO SAVEPOINT → qualification
 * ```
 *
 * Le point de retour est posé **avant** l'exécution, et le retour en arrière a
 * lieu **quelle que soit l'issue** : une sonde acceptée laisse une ligne derrière
 * elle, et la sonde suivante doit pouvoir compter sur un état connu. Le nom du
 * point est unique, pour qu'une sonde ne puisse pas libérer celui d'une autre.
 */
export async function runProbe(
  tx: TransactionSql,
  index: number,
  spec: Sonde,
): Promise<ResultatSonde> {
  const point = `sonde_${index}`;
  await tx.unsafe(`savepoint ${point}`);

  let observation: Observation = { issue: "accepté", message: "", code: "" };

  try {
    await spec.run(tx);
  } catch (error) {
    const erreur = error as Error & { code?: string };
    observation = {
      issue: "refusé",
      message: erreur.message.split("\n")[0] ?? "",
      code: erreur.code ?? "",
    };
  }

  await tx.unsafe(`rollback to savepoint ${point}`);

  return { label: spec.label, observation, ...evaluateProbe(spec, observation) };
}

/**
 * Interdit par le type, contrôlé à l'exécution : **toute** sonde qui attend un
 * refus doit déclarer un motif.
 *
 * Sert à `tests/unit/probe-harness.test.ts`, qui vérifie le catalogue réel contre
 * cette règle sans ouvrir de connexion PostgreSQL.
 */
export function motifsManquants(sondes: readonly Sonde[]): string[] {
  return sondes
    .filter((sonde) => sonde.attendu === "refusé" && sonde.motif === undefined)
    .map((sonde) => sonde.label);
}
