import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { closeDatabase, sql } from "@/infrastructure/database/client";
import { logger } from "@/infrastructure/logger";
import { runProbe, type Sonde } from "./lib/probe-harness";
import {
  comparer,
  empreinte,
  type Empreinte,
} from "./lib/database-fingerprint";
import {
  createProbeCatalogue,
  MIGRATION_NOTIFICATIONS,
  RECONSTRUCTION_DES_ROLES,
} from "./lib/migration-probes";

/**
 * Vérification des migrations **sans rien appliquer**.
 *
 * ```text
 * npm run db:verify            # migrations additives
 * npm run db:verify -- --all   # inclut 0001 (reconstruction d'énumérations)
 * npm run db:selftest          # prouve que ce harnais sait échouer
 * ```
 *
 * ### Pourquoi ce script existe
 *
 * Le mandat impose deux règles d'arrêt : ne jamais créer le compte `SUPER_ADMIN`,
 * et ne jamais exécuter de migration destructrice. Il impose aussi que les
 * migrations soient « **testées sur copie** » avant d'être exécutées. Or il n'y a
 * pas de copie : Docker et WSL2 sont indisponibles sur cette machine, et le
 * projet n'a qu'une base.
 *
 * La vérification repose donc sur la propriété qui rend la chose possible :
 * **PostgreSQL exécute le DDL en transaction**. Les migrations sont jouées pour
 * de vrai — types, tables, index, contraintes, triggers — puis la transaction est
 * **annulée**. La base est identique avant et après, et le script le **prouve**
 * au lieu de l'affirmer.
 *
 * ### Le rapport dit ce qui a été exécuté, et ce qui ne l'a pas été
 *
 * Une migration **déjà appliquée** ne peut pas être rejouée : ses instructions
 * sont refusées (« already exists »). Après l'application des huit migrations du
 * projet, c'est le cas de la plupart d'entre elles, et **le SQL n'est alors plus
 * exercé du tout**. Le script l'annonce désormais ligne par ligne — `EXÉCUTÉE`,
 * `DÉJÀ APPLIQUÉE`, `MIXTE`, `NON REJOUABLE`, `ÉCHEC` — et affiche le décompte
 * réel des migrations dont le SQL a été exercé. Une version antérieure affichait
 * « AUCUNE n'est appliquée » puis « OK » pour des migrations qu'elle n'avait fait
 * qu'effleurer : un rapport vert qui ne disait pas ce qu'il avait mesuré.
 *
 * `NON REJOUABLE` est le cas d'une migration qui **échoue au rejeu sans être
 * fausse**, parce que son état de départ n'existe plus : `0001` convertit
 * `admin_profiles.role` en `text`, mais elle a créé elle-même une contrainte
 * `CHECK` référençant l'énumération, que la conversion rend inévaluable. Le
 * registre `drizzle.__drizzle_migrations` — celui qu'utilise `db:migrate` —
 * atteste que la migration est appliquée, ce qui permet de la classer sans
 * supposer. Toute erreur sur une migration **non** enregistrée reste un `ÉCHEC`.
 *
 * Les **sondes**, elles, s'exécutent contre les tables réelles dans tous les cas :
 * c'est ce qui garde sa valeur à la vérification une fois les migrations
 * appliquées.
 *
 * ### Isolation : deux niveaux, pas un
 *
 * 1. **Une instruction de migration est isolée par un `SAVEPOINT` propre.** Sans
 *    cela, une instruction refusée (« already exists ») avorte la transaction et
 *    toutes les instructions suivantes échouent pour cette raison-là — pas pour
 *    la leur. C'est un défaut que ce script a réellement connu.
 * 2. **Chaque sonde est isolée par un `SAVEPOINT`** (voir `lib/probe-harness.ts`,
 *    qui porte l'histoire des quatre faux refus du Lot 5).
 *
 * ### Le script échoue quand une sonde n'est pas conforme, ou qu'une migration échoue
 *
 * Une version antérieure affichait `!!!` et **terminait avec le code 0** : un
 * harnais dont l'échec ne se propage pas ne vérifie rien. Le code de sortie vaut
 * désormais 1 dès qu'une sonde n'est pas conforme ou qu'une migration échoue — et
 * ce n'est pas une intention : `npm run db:selftest` établit que la
 * qualification des sondes sait produire un échec.
 */

/* -------------------------------------------------------------------------- */
/*  Sélection des migrations                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Migrations **déjà appliquées** sur cette base : la référence de départ.
 *
 * `0000` a créé le schéma d'origine (départements, médias, publications…) — elle
 * est en place depuis longtemps. La rejouer échoue sur son premier `CREATE TYPE`
 * (`type "admin_role" already exists`), et c'est ce que ce script a réellement
 * produit à sa première exécution : un vérificateur qui commençait par la
 * migration déjà appliquée ne vérifiait rien du tout.
 *
 * L'appartenance à cette liste n'est pas une supposition : elle est **contrôlée**
 * avant toute exécution, par la présence d'un objet que `0000` crée. Sur une base
 * neuve, le script le dit au lieu de produire un faux rapport.
 */
const BASELINE = ["0000_elite_pretty_boy.sql"];

/** Marqueur de la référence : le type énuméré créé par `0000`. */
const BASELINE_MARKER = sql`
  select count(*)::int as n from pg_type where typname = 'admin_role'
`;

/**
 * Migrations **destructrices**, exclues par défaut.
 *
 * `0001` reconstruit l'énumération `admin_role` (DROP TYPE / CREATE TYPE). Elle
 * est transactionnelle comme le reste, donc le script peut la jouer sans risque
 * théorique — mais elle relève de la règle d'arrêt du mandat, et l'opérateur doit
 * la demander **explicitement**. Un défaut permissif ferait exécuter l'opération
 * la plus lourde du projet par une commande tapée distraitement.
 */
const DESTRUCTIVE = ["0001_lowly_frightful_four.sql"];

interface Migration {
  file: string;
  statements: string[];
}

function loadMigrations(includeDestructive: boolean): Migration[] {
  const dossier = join(process.cwd(), "drizzle");

  return readdirSync(dossier)
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .filter((name) => !BASELINE.includes(name))
    .filter((name) => includeDestructive || !DESTRUCTIVE.includes(name))
    .sort()
    .map((file) => ({
      file,
      statements: readFileSync(join(dossier, file), "utf8")
        // Les commentaires sont retirés **avant** le découpage : un
        // `--> statement-breakpoint` cité dans un commentaire créerait une
        // instruction vide, et une instruction vide fait échouer `tx.unsafe`.
        .split("--> statement-breakpoint")
        .map((bloc) => bloc.replace(/^\s*--.*$/gm, "").trim())
        .filter((bloc) => bloc.length > 0),
    }));
}

/** Ce qu'une instruction refusée doit dire pour signifier « l'objet est déjà là ». */
const OBJET_DEJA_PRESENT = /already exists|existe déjà|duplicate key value/i;

/**
 * Migrations **déjà appliquées**, d'après le registre de `drizzle-kit`.
 *
 * `drizzle.__drizzle_migrations` est le registre qu'utilise `npm run db:migrate`
 * lui-même : chaque ligne porte le `created_at` de l'entrée correspondante de
 * `drizzle/meta/_journal.json`, ce qui permet de retrouver le fichier.
 *
 * ### Pourquoi le registre est nécessaire
 *
 * Une migration **appliquée** peut devenir **non rejouable** sans être fausse.
 * C'est le cas de `0001` : elle convertit `admin_profiles.role` en `text`, mais
 * elle a elle-même créé une contrainte `CHECK` qui référence l'énumération —
 * rejouée, la conversion rend cette contrainte inévaluable
 * (`operator does not exist: text = admin_role`). Le SQL n'est pas cassé : son
 * **état de départ** n'existe plus.
 *
 * Sans le registre, le script ne pouvait pas distinguer « non rejouable » de
 * « cassée », et devait choisir entre deux maux : un rouge permanent (que
 * l'opérateur apprend à ignorer) ou un vert silencieux. Le registre tranche, et
 * la migration est annoncée `NON REJOUABLE — SQL NON exercé` : rien n'est masqué,
 * et un échec réel reste un échec.
 *
 * `null` signifie « registre indisponible » (base neuve) : dans ce cas, toute
 * erreur est un échec, puisque rien ne prouve que la migration était appliquée.
 */
async function registreDrizzle(): Promise<Set<string> | null> {
  try {
    const journal = JSON.parse(
      readFileSync(join(process.cwd(), "drizzle/meta/_journal.json"), "utf8"),
    ) as { entries: { when: number; tag: string }[] };

    const parHorodatage = new Map(
      journal.entries.map((entree) => [entree.when, `${entree.tag}.sql`]),
    );

    const lignes = await sql`select created_at from drizzle.__drizzle_migrations`;

    const appliquees = new Set<string>();
    for (const ligne of lignes) {
      const fichier = parHorodatage.get(Number((ligne as { created_at: unknown }).created_at));
      if (fichier !== undefined) appliquees.add(fichier);
    }

    return appliquees;
  } catch {
    return null;
  }
}

interface BilanMigration {
  file: string;
  executees: number;
  dejaPresentes: number;
  erreur?: string;
  /** Vrai quand l'échec vient d'un rejeu impossible, la migration étant appliquée. */
  nonRejouable?: boolean;
}

/** Verdict lisible d'une migration : ce qui a été exécuté, et ce qui ne l'a pas été. */
function verdict(bilan: BilanMigration): { marque: string; texte: string } {
  if (bilan.erreur !== undefined) {
    if (bilan.nonRejouable === true) {
      return {
        marque: "-- ",
        texte: `NON REJOUABLE — déjà appliquée, rejeu impossible : ${bilan.erreur} | SQL NON exercé`,
      };
    }

    return { marque: "!!!", texte: `ÉCHEC — ${bilan.erreur}` };
  }

  if (bilan.dejaPresentes === 0) {
    return { marque: "OK ", texte: `EXÉCUTÉE — ${bilan.executees} instruction(s)` };
  }

  if (bilan.executees === 0) {
    return {
      marque: "-- ",
      texte: `DÉJÀ APPLIQUÉE — ${bilan.dejaPresentes} instruction(s), SQL NON exercé`,
    };
  }

  return {
    marque: "OK ",
    texte: `MIXTE — ${bilan.executees} exécutée(s), ${bilan.dejaPresentes} déjà présente(s)`,
  };
}

/** Vrai si le SQL de cette migration n'a été exercé par aucune instruction. */
function sqlNonExerce(bilan: BilanMigration): boolean {
  if (bilan.erreur !== undefined) return bilan.nonRejouable === true;
  return bilan.executees === 0;
}

/* -------------------------------------------------------------------------- */
/*  Exécution                                                                 */
/* -------------------------------------------------------------------------- */

const ROLLBACK = "__VERIFICATION_TERMINEE__";

async function main(): Promise<void> {
  const includeDestructive = process.argv.includes("--all");

  // Contrôle de la référence **avant** toute exécution : sur une base neuve, les
  // migrations à appliquer ne sont pas celles-ci, et un rapport « tout est vert »
  // y serait faux.
  const [marqueur] = await BASELINE_MARKER;
  if ((marqueur as { n: number } | undefined)?.n === 0) {
    console.error(
      `Cette base ne porte pas la référence ${BASELINE.join(", ")} : ` +
        "ce script vérifie des migrations à appliquer, il ne construit pas un schéma neuf.",
    );
    process.exitCode = 1;
    await closeDatabase();
    return;
  }

  const migrations = loadMigrations(includeDestructive);
  const jouees = new Set(migrations.map((migration) => migration.file));
  const appliquees = await registreDrizzle();

  // État **réel** de la base : le rôle `ADMIN` existe-t-il ? C'est ce fait, et non
  // la liste des migrations que ce script a jouées, qui décide si les sondes de
  // notifications peuvent s'exécuter.
  const [role] = await sql`
    select count(*)::int as n from pg_enum e
      join pg_type t on t.oid = e.enumtypid
     where t.typname = 'admin_role' and e.enumlabel = 'ADMIN'
  `;
  const roleAdminDisponible = ((role as { n: number } | undefined)?.n ?? 0) > 0;

  console.log("Vérification des migrations — AUCUNE n'est appliquée.\n");
  console.log(
    includeDestructive
      ? "Mode --all : les migrations destructrices sont incluses (transaction annulée).\n"
      : `Mode par défaut : ${DESTRUCTIVE.join(", ")} exclue(s). Utiliser --all pour les inclure.\n`,
  );

  console.log(
    appliquees === null
      ? "Registre drizzle : indisponible — toute erreur de migration sera un échec.\n"
      : `Registre drizzle : ${String(appliquees.size)} migration(s) appliquée(s) sur cette base.\n`,
  );

  const avant = await empreinteHorsTransaction();

  /** Sondes non conformes, tous motifs confondus : décide du code de sortie. */
  let nonConformes = 0;

  try {
    await sql.begin(async (tx) => {
      const bilans: BilanMigration[] = [];
      let numeroMigration = 0;

      for (const migration of migrations) {
        const point = `migration_${++numeroMigration}`;

        // Le SAVEPOINT est indispensable : une instruction refusée **avorte la
        // transaction**, et toutes les migrations suivantes échoueraient alors
        // pour une raison qui n'est pas la leur. Sans lui, une migration déjà
        // appliquée rendait le script inutilisable — ce qu'il a réellement fait.
        await tx.unsafe(`savepoint ${point}`);

        const bilan: BilanMigration = {
          file: migration.file,
          executees: 0,
          dejaPresentes: 0,
        };

        for (const [rang, statement] of migration.statements.entries()) {
          // Un point de retour **par instruction** : sans lui, la première
          // instruction refusée figerait les suivantes, et « 13 instructions
          // passées » pourrait ne vouloir dire que « 13 fois la même erreur ».
          const pointInstruction = `${point}_${rang + 1}`;
          await tx.unsafe(`savepoint ${pointInstruction}`);

          try {
            await tx.unsafe(statement);
            bilan.executees += 1;
          } catch (error) {
            await tx.unsafe(`rollback to savepoint ${pointInstruction}`);
            const message = (error as Error).message.split("\n")[0] ?? "";

            if (OBJET_DEJA_PRESENT.test(message)) {
              bilan.dejaPresentes += 1;
            } else {
              // Un échec qui n'est **pas** « l'objet existe déjà » est un vrai
              // échec : la version antérieure le classait « DÉJÀ APPLIQUÉE » dès
              // que le message contenait « duplicate key value », ce qui pouvait
              // taire une migration cassée.
              bilan.erreur = `instruction ${rang + 1} — ${message.slice(0, 160)}`;
              break;
            }
          }
        }

        if (bilan.erreur !== undefined) {
          // Les effets partiels d'une migration en échec sont annulés, pour que
          // les migrations suivantes s'exécutent sur un état cohérent.
          await tx.unsafe(`rollback to savepoint ${point}`);
          // Un rejeu impossible n'est un échec que si rien ne prouve que la
          // migration était déjà appliquée.
          bilan.nonRejouable = appliquees?.has(migration.file) ?? false;
        }

        bilans.push(bilan);
        const rendu = verdict(bilan);
        console.log(`  ${rendu.marque} ${bilan.file} — ${rendu.texte}`);
      }

      const [media] = await tx`select id from media limit 1`;
      const [dept] = await tx`select id from departments limit 1`;
      const [profil] = await tx`select id from admin_profiles limit 1`;
      if (!media || !dept || !profil) {
        throw new Error("Contexte insuffisant : média, département et profil requis.");
      }

      const sondes: Sonde[] = createProbeCatalogue({
        mediaId: media.id,
        deptId: dept.id,
        profileId: profil.id,
      });

      console.log("\nSondes :\n");

      let conformes = 0;
      let ignorees = 0;
      let index = 0;

      for (const sonde of sondes) {
        index += 1;

        // Une sonde dont la migration n'a pas été jouée est **ignorée en le
        // disant** : la passer sous silence ferait croire à une vérification.
        if (!jouees.has(sonde.requires)) {
          ignorees += 1;
          console.log(`  --  ${sonde.label}\n        ignorée : ${sonde.requires} non jouée`);
          continue;
        }

        // Les sondes de notifications dépendent de la reconstruction des rôles :
        // sans elle, le trigger ne peut pas résoudre le littéral `ADMIN` et
        // échoue par erreur d'énumération, pas par refus logique.
        //
        // La condition porte sur l'**état de la base** (`roleAdminDisponible`), pas
        // sur ce que ce script a joué : depuis que 0001 est appliquée, le rôle
        // existe réellement, et la sonde doit s'exécuter. La conditionner à la
        // liste jouée l'aurait fait ignorer à jamais — une sonde « ignorée » qui
        // ne dépend plus de rien est une vérification perdue.
        if (sonde.requires === MIGRATION_NOTIFICATIONS && !roleAdminDisponible) {
          ignorees += 1;
          console.log(
            `  --  ${sonde.label}\n        ignorée : le rôle ADMIN n'existe pas en base (${RECONSTRUCTION_DES_ROLES} non appliquée)`,
          );
          continue;
        }

        const resultat = await runProbe(tx, index, sonde);

        if (resultat.conforme) {
          conformes += 1;
        } else {
          nonConformes += 1;
        }

        console.log(
          `  ${resultat.conforme ? "OK " : "!!!"} ${resultat.label}\n        ` +
            `${resultat.observation.issue} — ${resultat.raison}`,
        );
      }

      const executees = bilans.filter((bilan) => bilan.executees > 0 && bilan.erreur === undefined);
      const nonExercees = bilans.filter(sqlNonExerce);
      const echouees = bilans.filter(
        (bilan) => bilan.erreur !== undefined && bilan.nonRejouable !== true,
      );

      console.log(
        `\nMigrations : SQL exercé pour ${String(executees.length)}/${String(bilans.length)}` +
          ` | SQL non exercé : ${String(nonExercees.length)}` +
          ` | échecs : ${String(echouees.length)}\n` +
          `Sondes : conformes ${String(conformes)} | ignorées ${String(ignorees)}` +
          ` | non conformes ${String(nonConformes)}`,
      );

      if (nonExercees.length > 0) {
        // Une migration non exercée n'est pas une migration vérifiée : le dire
        // explicitement, plutôt que de laisser un « OK » ambiant le suggérer.
        console.log(
          `  SQL non exercé : ${nonExercees.map((bilan) => bilan.file).join(", ")}` +
            " — déjà appliquée(s) sur cette base, le vérificateur ne les éprouve pas.",
        );
      }

      if (echouees.length > 0) {
        console.log(`  Migrations en échec : ${echouees.map((bilan) => bilan.file).join(", ")}`);
      }

      // Un échec de migration doit se propager : sans cette ligne, un rapport
      // rouge pouvait se terminer avec le code 0 — le défaut que ce script
      // appliquait à lui-même avant cet audit.
      if (echouees.length > 0) {
        process.exitCode = 1;
      }

      // Le script se termine **toujours** en levant : c'est ce qui annule la
      // transaction. (`postgres.js` rejette `sql.begin` avec la première erreur
      // rattrapée par une sonde si le bloc se termine normalement — vérifié à
      // l'exécution, `scripts/verify-probe-harness.ts` contrôle n° 5.)
      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if ((error as Error).message !== ROLLBACK) {
      logger.error({ err: error }, "Vérification interrompue");
      process.exitCode = 1;
    }
  }

  const apres = await empreinteHorsTransaction();

  const comparaison = comparer(avant, apres);

  console.log(
    "\nEmpreinte de la base :",
    comparaison.identique
      ? `IDENTIQUE (transaction annulée) — ${String(Object.keys(avant.donnees).length)} tables comparées ligne à ligne`
      : "MODIFIÉE",
  );

  if (!comparaison.identique) {
    console.log("  compteurs avant :", avant.compteurs);
    console.log("  compteurs après :", apres.compteurs);
    if (comparaison.compteursDifferents.length > 0) {
      console.log("  compteurs différents :", comparaison.compteursDifferents.join(", "));
    }
    if (comparaison.tablesModifiees.length > 0) {
      // Seuls les **noms** sont affichés : le contenu des lignes est comparé par
      // empreinte, jamais recopié dans la sortie.
      console.log("  tables dont le contenu a changé :", comparaison.tablesModifiees.join(", "));
    }
    process.exitCode = 1;
  }

  if (nonConformes > 0) {
    console.log(`\n${String(nonConformes)} sonde(s) non conforme(s) : le code de sortie vaut 1.`);
    process.exitCode = 1;
  }

  await closeDatabase();
}

/* -------------------------------------------------------------------------- */
/*  Empreinte de la base                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Empreinte de la base **hors transaction** — les objets créables par une
 * migration (compteurs), et le contenu des tables éditoriales.
 *
 * C'est la **preuve** du rollback : sans elle, le script affirmerait « rien n'a
 * été appliqué » sans le montrer, et une transaction qui aurait validé par
 * accident passerait inaperçue. La fonction elle-même vit dans
 * `lib/database-fingerprint.ts`, où `npm run db:selftest` la confronte à un état
 * réellement modifié pour établir qu'elle **sait** voir une différence.
 */
function empreinteHorsTransaction(): Promise<Empreinte> {
  return empreinte((requete) => sql.unsafe(requete));
}

main().catch(async (error: unknown) => {
  logger.error({ err: error }, "Vérification impossible");
  process.exitCode = 1;
  await closeDatabase();
});
