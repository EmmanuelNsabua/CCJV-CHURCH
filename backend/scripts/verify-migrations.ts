import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { TransactionSql } from "postgres";
import { closeDatabase, sql } from "@/infrastructure/database/client";
import { logger } from "@/infrastructure/logger";

/**
 * Vérification des migrations **sans rien appliquer**.
 *
 * ```text
 * npm run db:verify            # migrations additives
 * npm run db:verify -- --all   # inclut 0001 (reconstruction d'énumérations)
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
 * **PostgreSQL exécute le DDL en transaction**. Les migrations sont donc jouées
 * pour de vrai — types, tables, index, contraintes, triggers — puis la
 * transaction est **annulée**. La base est identique avant et après, et le script
 * le **prouve** au lieu de l'affirmer : il compare l'empreinte des objets et les
 * compteurs de lignes avant/après.
 *
 * Ce que cela établit, et que la lecture ne peut pas établir : que le SQL
 * s'exécute, dans cet ordre, sur *cette* base, et que les contraintes refusent
 * réellement ce qu'elles prétendent refuser. Un `CHECK` mal écrit se lit comme un
 * bon `CHECK` ; il ne s'exécute pas comme tel.
 *
 * ### Chaque sonde est isolée par un `SAVEPOINT`
 *
 * Sans cela, la première violation de contrainte avorte la transaction, et toutes
 * les sondes suivantes échouent pour une raison qui n'est pas la leur — un faux
 * positif de plus. C'est un défaut que ce script a réellement connu.
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

/* -------------------------------------------------------------------------- */
/*  Sondes                                                                    */
/* -------------------------------------------------------------------------- */

interface ProbeResult {
  label: string;
  conforme: boolean;
  detail: string;
}

interface Probe {
  /** Migration dont la sonde dépend : elle est ignorée si elle n'est pas jouée. */
  requires: string;
  label: string;
  attendu: "accepté" | "refusé";
  /** Motif attendu dans le message d'erreur, quand la sonde attend un refus. */
  motif?: RegExp;
  run: (tx: TransactionSql) => Promise<unknown>;
}

/** Migration nécessaire aux sondes de notifications (rôle `ADMIN`). */
const ROLE_RECONSTRUCTION = "0001_lowly_frightful_four.sql";

async function probe(
  tx: TransactionSql,
  index: number,
  spec: Probe,
): Promise<ProbeResult> {
  const point = `sonde_${index}`;
  await tx.unsafe(`savepoint ${point}`);

  let observe: "accepté" | "refusé" = "accepté";
  let message = "";

  try {
    await spec.run(tx);
  } catch (error) {
    observe = "refusé";
    message = (error as Error).message.split("\n")[0] ?? "";
  }

  await tx.unsafe(`rollback to savepoint ${point}`);

  const motifOk = spec.attendu === "accepté" || spec.motif === undefined || spec.motif.test(message);

  return {
    label: spec.label,
    conforme: observe === spec.attendu && motifOk,
    detail: `${observe}${message ? ` — ${message.slice(0, 120)}` : ""}`,
  };
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

  console.log("Vérification des migrations — AUCUNE n'est appliquée.\n");
  console.log(
    includeDestructive
      ? "Mode --all : les migrations destructrices sont incluses (transaction annulée).\n"
      : `Mode par défaut : ${DESTRUCTIVE.join(", ")} exclue(s). Utiliser --all pour les inclure.\n`,
  );

  const avant = await footprint();

  try {
    await sql.begin(async (tx) => {
      for (const migration of migrations) {
        for (const statement of migration.statements) {
          await tx.unsafe(statement);
        }
        console.log(`  OK  ${migration.file} — ${migration.statements.length} instruction(s)`);
      }

      const [media] = await tx`select id from media limit 1`;
      const [dept] = await tx`select id from departments limit 1`;
      const [profil] = await tx`select id from admin_profiles limit 1`;
      if (!media || !dept || !profil) {
        throw new Error("Contexte insuffisant : média, département et profil requis.");
      }
      const mediaId = media.id;
      const deptId = dept.id;
      const profilId = profil.id;

      console.log("\nSondes :\n");

      const sondes: Probe[] = [
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : grant valide (département, USE)",
          attendu: "accepté",
          run: (t) =>
            t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profilId})`,
        },
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : grant sans aucun droit (XD-09)",
          attendu: "refusé",
          motif: /at_least_one_right/,
          run: (t) =>
            t`insert into media_access (media_id, grantee_type, grantee_id, granted_by) values (${mediaId}, 'ADMIN_PROFILE', ${profilId}, ${profilId})`,
        },
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : département portant DELETE (XD-07)",
          attendu: "refusé",
          motif: /department_no_delete/,
          run: (t) =>
            t`insert into media_access (media_id, grantee_type, grantee_id, can_delete, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profilId})`,
        },
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : destinataire inexistant (trigger)",
          attendu: "refusé",
          motif: /inexistant/,
          run: (t) =>
            t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${mediaId}, 'DEPARTMENT', '00000000-0000-4000-8000-000000000000', true, ${profilId})`,
        },
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : profil portant DELETE (autorisé, D-21)",
          attendu: "accepté",
          run: (t) =>
            t`insert into media_access (media_id, grantee_type, grantee_id, can_delete, granted_by) values (${mediaId}, 'ADMIN_PROFILE', ${profilId}, true, ${profilId})`,
        },
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : seconde ligne, même département (unicité partielle)",
          attendu: "refusé",
          motif: /media_access_department_unique/,
          run: async (t) => {
            await t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profilId})`;
            await t`insert into media_access (media_id, grantee_type, grantee_id, can_manage, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profilId})`;
          },
        },
        {
          requires: "0003_medical_blue_blade.sql",
          label: "accès média : horodatage incohérent",
          attendu: "refusé",
          motif: /timestamps_order/,
          run: (t) =>
            t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by, granted_at, updated_at) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profilId}, now(), now() - interval '1 day')`,
        },
        {
          requires: "0002_easy_magik.sql",
          label: "capacité : vocabulaire fermé — PUBLICATION_SCOPE accepté",
          attendu: "accepté",
          run: (t) =>
            t`insert into department_capabilities (department_id, capability) values (${deptId}, 'PUBLICATION_SCOPE')`,
        },
        {
          requires: "0002_easy_magik.sql",
          label: "capacité : code hors vocabulaire refusé (docs/032 §3.5)",
          attendu: "refusé",
          motif: /known_capability/,
          run: (t) =>
            t`insert into department_capabilities (department_id, capability) values (${deptId}, 'EVENT_SCOPE_EVERYTHING')`,
        },
        {
          requires: "0002_easy_magik.sql",
          label: "capacité : doublon pour le même département",
          attendu: "refusé",
          motif: /department_capabilities_department_id_capability_pk|duplicate key/,
          run: async (t) => {
            await t`insert into department_capabilities (department_id, capability) values (${deptId}, 'EVENT_SCOPE_GLOBAL')`;
            await t`insert into department_capabilities (department_id, capability) values (${deptId}, 'EVENT_SCOPE_GLOBAL')`;
          },
        },
        {
          requires: "0005_late_hiroim.sql",
          label: "paramètres : clé ordinaire acceptée",
          attendu: "accepté",
          run: (t) =>
            t`insert into site_settings (key, value) values ('church_name', 'Centre Chrétien Jésus ma Vie')`,
        },
        {
          requires: "0005_late_hiroim.sql",
          label: "paramètres : clé de secours REFUSÉE (docs/030 §5.5, D-10)",
          attendu: "refusé",
          motif: /no_prayer_secret/,
          run: (t) =>
            t`insert into site_settings (key, value) values ('recovery_key_share_1', 'fragment')`,
        },
        {
          requires: "0005_late_hiroim.sql",
          label: "paramètres : secret de prière refusé, même en casse mixte",
          attendu: "refusé",
          motif: /no_prayer_secret/,
          run: (t) =>
            t`insert into site_settings (key, value) values ('Prayer_Crypto_Backup', 'x')`,
        },
        {
          requires: "0004_complete_guardian.sql",
          label: "notification : destinataire inexistant (trigger)",
          attendu: "refusé",
          motif: /inexistant|admin_role/,
          run: (t) =>
            t`insert into notifications (recipient_user_id, type) values ('00000000-0000-4000-8000-0000000000ff', 'KEY_REGISTERED')`,
        },
      ];

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

        // Les sondes de notifications dépendent en outre de la reconstruction des
        // rôles : sans elle, le trigger ne peut pas résoudre le littéral `ADMIN`
        // et échoue par erreur d'énumération, pas par refus logique.
        if (sonde.requires === "0004_complete_guardian.sql" && !jouees.has(ROLE_RECONSTRUCTION)) {
          ignorees += 1;
          console.log(
            `  --  ${sonde.label}\n        ignorée : dépend de ${ROLE_RECONSTRUCTION} (relancer avec --all)`,
          );
          continue;
        }

        const resultat = await probe(tx, index, sonde);
        if (resultat.conforme) conformes += 1;
        console.log(`  ${resultat.conforme ? "OK " : "!!!"} ${resultat.label}\n        ${resultat.detail}`);
      }

      console.log(`\nSondes conformes : ${conformes} | ignorées : ${ignorees}`);

      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if ((error as Error).message !== ROLLBACK) {
      logger.error({ err: error }, "Vérification interrompue");
      process.exitCode = 1;
    }
  }

  const apres = await footprint();

  const identique =
    apres.tables === avant.tables &&
    apres.fonctions === avant.fonctions &&
    apres.declencheurs === avant.declencheurs &&
    apres.profils === avant.profils &&
    apres.medias === avant.medias &&
    apres.publications === avant.publications;

  console.log("\nEmpreinte de la base :", identique ? "IDENTIQUE (transaction annulée)" : "MODIFIÉE");
  if (!identique) {
    console.log("  avant :", avant);
    console.log("  après :", apres);
    process.exitCode = 1;
  }

  await closeDatabase();
}

/**
 * Empreinte de la base : nombre d'objets créables par une migration, et compteurs
 * des tables qui portent des données éditoriales.
 *
 * C'est la **preuve** du rollback. Sans elle, le script affirmerait « rien n'a été
 * appliqué » sans le montrer — et une transaction qui aurait commité par accident
 * passerait inaperçue.
 */
async function footprint(): Promise<Record<string, number>> {
  const [objets] = await sql`
    select
      (select count(*)::int from information_schema.tables where table_schema = 'public') as tables,
      (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public') as fonctions,
      (select count(*)::int from pg_trigger where not tgisinternal) as declencheurs,
      (select count(*)::int from admin_profiles) as profils,
      (select count(*)::int from media) as medias,
      (select count(*)::int from publications) as publications
  `;

  return objets as unknown as Record<string, number>;
}

main().catch(async (error: unknown) => {
  logger.error({ err: error }, "Vérification impossible");
  process.exitCode = 1;
  await closeDatabase();
});
