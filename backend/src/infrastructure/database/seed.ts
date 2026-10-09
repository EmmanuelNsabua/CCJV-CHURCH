/**
 * Seed des contenus de démonstration.
 *
 * ```bash
 * npm run seed              # insère ce qui manque — idempotent
 * npm run seed -- --reset   # vide d'abord les tables de contenu, puis insère
 * ```
 *
 * Quatre garanties, dans cet ordre :
 * 1. **refus en production** — ce sont des contenus de démonstration ; le script
 *    s'arrête si `NODE_ENV=production`, sauf `ALLOW_SEED_IN_PRODUCTION=true` ;
 * 2. **médias d'abord** — les fichiers référencés par `seed-data.ts` (désignés
 *    par leur nom dans `frontend/public/media/`) sont téléversés puis
 *    enregistrés ; les contenus ne référencent que des identifiants réels ;
 * 3. **idempotence** — un média déjà téléversé est réutilisé, et chaque table
 *    est comptée avant insertion : une table déjà peuplée n'est pas réinsérée ;
 * 4. **aucune donnée inventée** — le contenu vient exclusivement de
 *    `seed-data.ts`, lui-même repris de `frontend/src/data/mock/` (docs/015 §5).
 *
 * `--reset` ne touche **jamais** `admin_profiles`, donc les comptes Supabase
 * Auth : l'accès au back-office doit survivre à une remise à zéro du contenu.
 *
 * Il supprime en revanche les **médias du seed** — les lignes `media` marquées
 * par `SEED_MEDIA_ALT_PREFIX`, **et** leurs fichiers dans le bucket. Supprimer
 * les lignes sans les fichiers laisserait des objets orphelins dans le Storage ;
 * les conserver empêcherait de démontrer un seed complet et reproductible. Les
 * médias téléversés depuis le back-office (sans marqueur) sont préservés.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { env } from "@/config/env";
import { createContainer, type AppDependencies } from "@/container";
import type { MediaAsset } from "@/domain/entities";
import { isoDateFromNow } from "@/domain/rules/event-status";
import { closeDatabase, type Database } from "@/infrastructure/database/client";
import { seedDataset, type SeedDataset } from "@/infrastructure/database/seed-data";
import {
  communityFaces,
  departments,
  events,
  leaders,
  publications,
  scheduleEntries,
  scriptures,
  siteSettings,
  socialLinks,
  staticPages,
  testimonies,
} from "@/infrastructure/database/schema";
import { supabaseAdmin } from "@/infrastructure/supabase/client";
import type { StorageService } from "@/infrastructure/supabase/storage";
import { uniqueSlug } from "@/shared/utils/slug";

/* -------------------------------------------------------------------------- */
/*  Constantes                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Dossier des médias sources. Résolu depuis ce fichier en priorité
 * (`backend/src/infrastructure/database/` → racine du dépôt), puis depuis le
 * répertoire courant (`backend/` → racine) : le script fonctionne aussi bien
 * via `npm run seed` que depuis un autre répertoire.
 */
const MEDIA_DIRECTORY_CANDIDATES: readonly string[] = [
  fileURLToPath(new URL("../../../../frontend/public/media/", import.meta.url)),
  resolve(process.cwd(), "..", "frontend", "public", "media"),
];

/**
 * Dossier logique de destination dans le bucket : il n'existe qu'un préfixe
 * `pages` adapté à des visuels de site qui ne relèvent d'aucune entité métier
 * (`events`, `departments`, `leaders`… sont réservés aux téléversements du
 * back-office).
 */
const SEED_MEDIA_FOLDER = "pages";

/**
 * Texte alternatif des médias du seed — il porte le **nom de fichier source**.
 *
 * C'est aussi la clé d'idempotence durable : `StorageService.upload` génère un
 * chemin aléatoire (`pages/<uuid>.jpeg`) et n'accepte **aucun** nom fourni par
 * l'appelant (docs/018 §33). Le chemin d'un média ne peut donc pas être
 * reconstruit depuis un nom de fichier, et `findByPath` seul ne suffit pas à le
 * retrouver d'une exécution à l'autre. Le back-office peut réécrire ce texte
 * ensuite : le média sera alors simplement re-téléversé.
 */
const SEED_MEDIA_ALT_PREFIX = "CCJV (démo) — ";

function seedMediaAlt(filename: string): string {
  return `${SEED_MEDIA_ALT_PREFIX}${filename}`;
}

/** Taille de page du parcours du registre des médias. */
const MEDIA_PAGE_SIZE = 200;

/**
 * Tables vidées par `--reset`, dans l'ordre **inverse** des dépendances.
 * Les galeries (`event_media`, `department_media`) suivent leur parent par
 * `ON DELETE CASCADE` : rien à supprimer explicitement.
 */
const RESET_TABLES: readonly { label: string; table: PgTable }[] = [
  { label: "community_faces", table: communityFaces },
  { label: "testimonies", table: testimonies },
  { label: "leaders", table: leaders },
  { label: "publications", table: publications },
  { label: "events", table: events },
  { label: "departments", table: departments },
  { label: "static_pages", table: staticPages },
  { label: "scriptures", table: scriptures },
  { label: "schedule_entries", table: scheduleEntries },
  { label: "social_links", table: socialLinks },
  { label: "site_settings", table: siteSettings },
];

/* -------------------------------------------------------------------------- */
/*  Types internes                                                            */
/* -------------------------------------------------------------------------- */

type Repositories = AppDependencies["repositories"];

interface MediaPhaseReport {
  /** Nom de fichier source → identifiant du média en base. */
  ids: Map<string, string>;
  uploaded: number;
  reused: number;
  referenced: number;
}

/** Résultat d'une passe sur le registre des médias du seed. */
interface SeedMediaScan {
  assets: MediaAsset[];
  /** Texte alternatif marqué → identifiant. */
  index: Map<string, string>;
}

interface StepReport {
  label: string;
  existing: number;
  inserted: number;
  skipped: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Utilitaires                                                               */
/* -------------------------------------------------------------------------- */

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Chaîne des causes d'une erreur.
 *
 * Drizzle enveloppe l'erreur PostgreSQL dans un `Failed query: …` : sans la
 * cause, un échec de seed reste illisible (contrainte violée ? connexion
 * refusée ? type invalide ?). On affiche donc toute la chaîne.
 */
function errorChain(error: unknown): string[] {
  const messages: string[] = [];
  let current: unknown = error;

  while (current !== null && current !== undefined && messages.length < 5) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = current.cause;
    } else {
      messages.push(String(current));
      break;
    }
  }

  return messages.length > 0 ? messages : ["(erreur sans message)"];
}

/** Comptage d'une table : c'est le garde-fou d'idempotence. */
async function countRows(db: Database, table: PgTable): Promise<number> {
  const [row] = await db.select({ total: count() }).from(table);
  return row?.total ?? 0;
}

/**
 * Une étape = une table. Si elle contient déjà des lignes, rien n'est inséré :
 * relancer le seed ne doit jamais dupliquer un contenu éditorial.
 */
async function step(
  db: Database,
  label: string,
  table: PgTable,
  insert: () => Promise<number>,
): Promise<StepReport> {
  const existing = await countRows(db, table);

  if (existing > 0) {
    return { label, existing, inserted: 0, skipped: true };
  }

  return { label, existing, inserted: await insert(), skipped: false };
}

function resolveMediaDirectory(): string {
  for (const candidate of MEDIA_DIRECTORY_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Dossier des médias introuvable. Chemins essayés :\n" +
      MEDIA_DIRECTORY_CANDIDATES.map((candidate) => `  - ${candidate}`).join("\n"),
  );
}

/**
 * Fichiers réellement référencés par le jeu de données, sans doublon et dans
 * l'ordre d'apparition. Aucun fichier du dossier n'est téléversé « au cas où » :
 * le bucket ne contient que ce que le site affiche.
 */
function collectMediaFilenames(dataset: SeedDataset): string[] {
  const filenames = new Set<string>();

  for (const department of dataset.departments) {
    filenames.add(department.banner);
    for (const file of department.gallery) {
      filenames.add(file);
    }
  }

  for (const event of dataset.events) {
    filenames.add(event.image);
    filenames.add(event.banner);
    for (const file of event.gallery) {
      filenames.add(file);
    }
  }

  for (const publication of dataset.publications) {
    if (publication.cover) {
      filenames.add(publication.cover);
    }
  }

  for (const leader of dataset.leaders) {
    filenames.add(leader.photo);
  }

  for (const testimony of dataset.testimonies) {
    filenames.add(testimony.photo);
  }

  for (const face of dataset.communityFaces) {
    filenames.add(face.photo);
  }

  return [...filenames];
}

/**
 * Le bucket doit exister **et** être public : les URL stockées dans `media`
 * sont servies directement au navigateur.
 */
async function ensureMediaBucket(bucket: string): Promise<void> {
  const created = await supabaseAdmin.storage.createBucket(bucket, { public: true });

  if (created.error !== null && !/already exists|duplicate/i.test(created.error.message)) {
    // Un bucket peut préexister sans que l'erreur le dise explicitement : on ne
    // conclut à l'échec que si le bucket est réellement introuvable.
    const probe = await supabaseAdmin.storage.getBucket(bucket);
    if (probe.error !== null) {
      throw new Error(
        `Bucket « ${bucket} » indisponible : ${created.error.message}`,
      );
    }
  }

  const current = await supabaseAdmin.storage.getBucket(bucket);
  if (current.error !== null) {
    throw new Error(`Bucket « ${bucket} » illisible : ${current.error.message}`);
  }

  if (current.data.public !== true) {
    const updated = await supabaseAdmin.storage.updateBucket(bucket, { public: true });
    if (updated.error !== null) {
      throw new Error(
        `Bucket « ${bucket} » : passage en public impossible : ${updated.error.message}`,
      );
    }
    console.log(`Bucket « ${bucket} » : rendu public (il ne l'était pas).`);
  }
}

/**
 * Médias déjà créés par le seed : une seule passe paginée sur le registre,
 * quel que soit le nombre de fichiers. Seuls les médias **marqués** sont
 * retenus — un téléversement du back-office n'est jamais confondu avec eux.
 */
async function scanSeedMedia(repositories: Repositories): Promise<SeedMediaScan> {
  const assets: MediaAsset[] = [];
  const index = new Map<string, string>();
  let offset = 0;

  for (;;) {
    const { items, total } = await repositories.media.list({
      limit: MEDIA_PAGE_SIZE,
      offset,
    });

    for (const asset of items) {
      if (asset.alt !== null && asset.alt.startsWith(SEED_MEDIA_ALT_PREFIX)) {
        assets.push(asset);
        index.set(asset.alt, asset.id);
      }
    }

    offset += items.length;
    if (items.length === 0 || offset >= total) {
      return { assets, index };
    }
  }
}

/**
 * Phase média : téléverser ce qui manque, réutiliser ce qui existe.
 *
 * L'ordre compte — le fichier est d'abord téléversé, la ligne `media` ensuite ;
 * si l'insertion échoue, le fichier est retiré du bucket (compensation), pour ne
 * jamais laisser d'orphelin (même règle que `MediaService.upload`).
 */
async function seedMedia(
  repositories: Repositories,
  storage: StorageService,
  directory: string,
  filenames: readonly string[],
): Promise<MediaPhaseReport> {
  const bucket = env.SUPABASE_STORAGE_BUCKET;
  await ensureMediaBucket(bucket);

  const seeded = await scanSeedMedia(repositories);
  const ids = new Map<string, string>();
  let uploaded = 0;
  let reused = 0;

  for (const filename of filenames) {
    const alt = seedMediaAlt(filename);

    // 1. Chemin déterministe : couvre un média créé avec la convention
    //    `pages/<nom de fichier>` (import manuel, jeu de données antérieur).
    const byPath = await repositories.media.findByPath(`${SEED_MEDIA_FOLDER}/${filename}`);
    const knownId = byPath?.id ?? seeded.index.get(alt);

    if (knownId !== undefined) {
      ids.set(filename, knownId);
      reused += 1;
      continue;
    }

    const absolutePath = join(directory, filename);
    if (!existsSync(absolutePath)) {
      throw new Error(
        `Média introuvable : « ${filename} » référencé par seed-data.ts, ` +
          `mais absent de ${directory}.`,
      );
    }

    const buffer = readFileSync(absolutePath);
    const stored = await storage.upload(
      SEED_MEDIA_FOLDER,
      { buffer, size: buffer.byteLength },
      alt,
    );

    try {
      const asset = await repositories.media.create({
        bucket: stored.bucket,
        path: stored.path,
        publicUrl: stored.publicUrl,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        alt: stored.alt,
      });

      ids.set(filename, asset.id);
      uploaded += 1;
      console.log(`  ↑ ${filename} → ${stored.path}`);
    } catch (error) {
      // Compensation : pas de fichier orphelin dans le bucket.
      try {
        await storage.remove(stored.path);
      } catch (compensationError) {
        console.error(
          `  ! Compensation impossible pour ${stored.path} : ${errorMessage(compensationError)}`,
        );
      }
      throw error;
    }
  }

  return { ids, uploaded, reused, referenced: filenames.length };
}

/* -------------------------------------------------------------------------- */
/*  Résolution des références                                                 */
/* -------------------------------------------------------------------------- */

/** Identifiant de média exigé : une référence absente doit échouer, pas passer. */
function mediaIdFor(ids: Map<string, string>, filename: string): string {
  const id = ids.get(filename);

  if (id === undefined) {
    throw new Error(
      `Média « ${filename} » absent du registre : aucun identifiant à référencer. ` +
        "Le fichier doit être téléversé avant les contenus.",
    );
  }

  return id;
}

function mediaIdsFor(ids: Map<string, string>, filenames: readonly string[]): string[] {
  return filenames.map((filename) => mediaIdFor(ids, filename));
}

/** Nom de département → identifiant, lu en base (les départements sont dynamiques). */
async function loadDepartmentIds(
  repositories: Repositories,
): Promise<Map<string, string>> {
  const { items } = await repositories.departments.list({ limit: 500, offset: 0 });
  return new Map(items.map((department) => [department.name, department.id]));
}

/**
 * Département **responsable** d'une donnée de démonstration — **jamais `null`**.
 *
 * `docs/028` D-26 et XD-15 : « un événement global au sens d'un
 * `department_id = NULL` n'existe pas », et une publication sans département n'a
 * pas de responsable (D-02, D-06). Les deux colonnes sont `NOT NULL`.
 *
 * Trois cas, et le troisième est un **arbitrage assumé** :
 *
 * 1. le nom est connu en base → son identifiant ;
 * 2. le nom est absent de `seed-data.ts` → le département de **rang 1** (le
 *    premier de la liste de référence), avec un avertissement ;
 * 3. le nom est présent mais inconnu en base → **erreur**, et le seed s'arrête.
 *
 * Le cas 2 est un choix, pas une facilité : les données de démonstration sont des
 * **mocks** que le back-office remplacera, et bloquer l'amorçage sur un nom
 * obsolète serait disproportionné. Le rattachement retenu est stable et
 * documenté, jamais un `NULL` qui violerait une contrainte métier. Le cas 3, en
 * revanche, signale une incohérence réelle entre les données et la base : la
 * masquer produirait un jeu de démonstration faux en silence.
 */
function departmentIdFor(
  departmentIds: Map<string, string>,
  name: string | null,
): string {
  const fallback = departmentIds.get(FALLBACK_DEPARTMENT_NAME);

  if (fallback === undefined) {
    throw new Error(
      `Aucun département « ${FALLBACK_DEPARTMENT_NAME} » en base : ` +
        "les départements de référence doivent être créés avant l'amorçage " +
        "(migration 0006).",
    );
  }

  if (name === null) {
    console.warn(
      `[seed] Rattachement de démonstration : aucune département déclaré, ` +
        `« ${FALLBACK_DEPARTMENT_NAME} » est retenu (donnée mock, modifiable au back-office).`,
    );
    return fallback;
  }

  const id = departmentIds.get(name);

  if (id === undefined) {
    throw new Error(
      `Département « ${name} » introuvable : seed-data.ts le référence, ` +
        "mais aucun département de ce nom n'existe en base. " +
        "Les départements de référence sont ceux de la migration 0006.",
    );
  }

  return id;
}

/**
 * Département retenu quand une donnée de démonstration n'en déclare aucun.
 *
 * « Les Serviteurs » est le premier de la liste de référence : le collège qui
 * porte la vie institutionnelle de l'église. Ce choix est un **arbitrage de
 * démonstration**, pas une information organisationnelle vérifiée, et il est
 * modifiable depuis le back-office.
 */
const FALLBACK_DEPARTMENT_NAME = "Les Serviteurs";

/* -------------------------------------------------------------------------- */
/*  Remise à zéro                                                             */
/* -------------------------------------------------------------------------- */

async function resetContentTables(
  db: Database,
): Promise<{ label: string; deleted: number }[]> {
  const cleared: { label: string; deleted: number }[] = [];

  for (const { label, table } of RESET_TABLES) {
    const before = await countRows(db, table);
    await db.delete(table);
    cleared.push({ label, deleted: before });
  }

  return cleared;
}

/**
 * Supprime les médias du seed — **fichier d'abord, ligne ensuite**, dans cet
 * ordre pour qu'un échec ne laisse jamais une ligne pointant vers un fichier
 * devenu introuvable. Le fichier est retiré même si sa ligne ne l'est pas :
 * c'est la ligne qui décide, et une ligne sans fichier serait pire.
 *
 * Seuls les médias marqués sont concernés ; un téléversement du back-office
 * survit donc à un `--reset`.
 */
async function resetSeedMedia(
  repositories: Repositories,
  storage: StorageService,
): Promise<{ rows: number; files: number }> {
  const { assets } = await scanSeedMedia(repositories);
  let rows = 0;
  let files = 0;

  for (const asset of assets) {
    try {
      await storage.remove(asset.path);
      files += 1;
    } catch (error) {
      console.warn(
        `  ! Fichier non supprimé (${asset.path}) : ${errorMessage(error)}`,
      );
    }

    if (await repositories.media.remove(asset.id)) {
      rows += 1;
    }
  }

  return { rows, files };
}

/* -------------------------------------------------------------------------- */
/*  Déroulé                                                                   */
/* -------------------------------------------------------------------------- */

function guardProduction(): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  if (process.env.ALLOW_SEED_IN_PRODUCTION === "true") {
    console.warn(
      "\n/!\\ ALLOW_SEED_IN_PRODUCTION=true : le seed tourne en production. " +
        "Ces contenus sont des données de démonstration.\n",
    );
    return;
  }

  throw new Error(
    "Seed refusé : NODE_ENV=production.\n" +
      "Ce script insère des contenus de démonstration, jamais des données réelles.\n" +
      "Pour l'autoriser explicitement : ALLOW_SEED_IN_PRODUCTION=true npm run seed",
  );
}

async function run(): Promise<void> {
  guardProduction();

  const reset = process.argv.includes("--reset");
  const deps = createContainer();
  const { db, repositories, storage } = deps;

  console.log(
    `\nSeed CCJV — NODE_ENV=${env.NODE_ENV} · bucket « ${env.SUPABASE_STORAGE_BUCKET} »` +
      `${reset ? " · --reset" : ""}`,
  );

  /* ---------------------------------------------------------------------- */
  /*  Remise à zéro optionnelle                                             */
  /* ---------------------------------------------------------------------- */

  if (reset) {
    console.log("\nRemise à zéro (--reset) :");
    for (const entry of await resetContentTables(db)) {
      console.log(
        `  · ${entry.label.padEnd(18)} ${String(entry.deleted).padStart(3)} ligne(s) supprimée(s)`,
      );
    }

    // Les médias du seed partent en dernier : les tables de contenu les
    // référencent (`media_id` en `onDelete: restrict`), elles doivent donc être
    // vidées avant.
    const mediaCleared = await resetSeedMedia(repositories, storage);
    console.log(
      `  · ${"media".padEnd(18)} ${String(mediaCleared.rows).padStart(3)} ligne(s) supprimée(s)` +
        ` · ${mediaCleared.files} fichier(s) retiré(s) du bucket`,
    );
    console.log("  · admin_profiles et comptes Supabase Auth : non touchés");
    console.log("  · médias du back-office (sans marqueur de seed) : préservés");
  }

  /* ---------------------------------------------------------------------- */
  /*  1. Médias                                                             */
  /* ---------------------------------------------------------------------- */

  console.log("\nMédias :");
  const media = await seedMedia(
    repositories,
    storage,
    resolveMediaDirectory(),
    collectMediaFilenames(seedDataset),
  );
  console.log(
    `  ${media.uploaded} téléversé(s) · ${media.reused} réutilisé(s) ` +
      `sur ${media.referenced} fichier(s) référencé(s)`,
  );

  /* ---------------------------------------------------------------------- */
  /*  2. Contenus, dans l'ordre des dépendances                             */
  /* ---------------------------------------------------------------------- */

  const steps: StepReport[] = [];

  steps.push(
    await step(db, "site_settings", siteSettings, async () => {
      const rows = await repositories.settings.upsertMany(seedDataset.siteSettings);
      return rows.length;
    }),
  );

  steps.push(
    await step(db, "social_links", socialLinks, async () => {
      let position = 0;
      for (const link of seedDataset.socialLinks) {
        await repositories.socialLinks.create({
          label: link.label,
          href: link.href,
          position,
        });
        position += 1;
      }
      return seedDataset.socialLinks.length;
    }),
  );

  steps.push(
    await step(db, "schedule_entries", scheduleEntries, async () => {
      let position = 0;
      for (const entry of seedDataset.scheduleEntries) {
        await repositories.schedule.create({
          day: entry.day,
          title: entry.title,
          timeLabel: entry.timeLabel,
          audience: entry.audience,
          isConfirmed: entry.isConfirmed,
          position,
        });
        position += 1;
      }
      return seedDataset.scheduleEntries.length;
    }),
  );

  steps.push(
    await step(db, "scriptures", scriptures, async () => {
      for (const scripture of seedDataset.scriptures) {
        await repositories.scriptures.create({
          key: scripture.key,
          text: scripture.text,
          reference: scripture.reference,
          translation: scripture.translation,
          context: scripture.context,
        });
      }
      return seedDataset.scriptures.length;
    }),
  );

  steps.push(
    await step(db, "static_pages", staticPages, async () => {
      for (const page of seedDataset.staticPages) {
        // `updatedBy` reste `null` : aucune modification humaine n'a eu lieu.
        await repositories.staticPages.upsert(page.pageKey, page.content, null);
      }
      return seedDataset.staticPages.length;
    }),
  );

  steps.push(
    await step(db, "departments", departments, async () => {
      let position = 0;
      for (const department of seedDataset.departments) {
        const slug = await uniqueSlug(department.name, (candidate) =>
          repositories.departments.slugExists(candidate),
        );

        await repositories.departments.create(
          {
            name: department.name,
            description: department.description,
            responsibleName: department.responsibleName,
            tagline: department.tagline,
            meetingSchedule: department.meetingSchedule,
            keyPoints: department.keyPoints,
            bannerMediaId: mediaIdFor(media.ids, department.banner),
            galleryMediaIds: mediaIdsFor(media.ids, department.gallery),
            position,
          },
          slug,
        );
        position += 1;
      }
      return seedDataset.departments.length;
    }),
  );

  // Les départements sont dynamiques : les événements et les responsables
  // pointent vers leurs identifiants réels, ou vers `null` (général).
  const departmentIds = await loadDepartmentIds(repositories);

  steps.push(
    await step(db, "events", events, async () => {
      for (const event of seedDataset.events) {
        const slug = await uniqueSlug(event.title, (candidate) =>
          repositories.events.slugExists(candidate),
        );

        await repositories.events.create(
          {
            title: event.title,
            excerpt: event.excerpt,
            description: event.description,
            // Le décalage en jours garde le jeu de démonstration crédible dans
            // le temps : jamais une date figée qui devient obsolète.
            eventDate: isoDateFromNow(event.dateOffsetDays),
            eventTime: event.eventTime,
            location: event.location,
            imageMediaId: mediaIdFor(media.ids, event.image),
            bannerMediaId: mediaIdFor(media.ids, event.banner),
            galleryMediaIds: mediaIdsFor(media.ids, event.gallery),
            departmentId: departmentIdFor(departmentIds, event.departmentName),
            practicalInfo: event.practicalInfo,
          },
          slug,
        );
      }
      return seedDataset.events.length;
    }),
  );

  steps.push(
    await step(db, "publications", publications, async () => {
      for (const publication of seedDataset.publications) {
        const slug = await uniqueSlug(publication.title, (candidate) =>
          repositories.publications.slugExists(candidate),
        );

        await repositories.publications.create(
          {
            title: publication.title,
            type: publication.type,
            category: publication.category,
            contentUrl: publication.contentUrl,
            coverMediaId:
              publication.cover === undefined || publication.cover === null
                ? null
                : mediaIdFor(media.ids, publication.cover),
            description: publication.description,
            body: publication.body,
            author: publication.author,
            publishedAt: isoDateFromNow(publication.dateOffsetDays),
            // Département **responsable**, obligatoire (D-02, D-06). Le jeu de
            // démonstration ne déclare pas encore de département par publication :
            // le repli documenté s'applique (donnée mock, modifiable au
            // back-office).
            departmentId: departmentIdFor(departmentIds, null),
          },
          slug,
        );
      }
      return seedDataset.publications.length;
    }),
  );

  steps.push(
    await step(db, "leaders", leaders, async () => {
      let position = 0;
      for (const leader of seedDataset.leaders) {
        await repositories.leaders.create({
          name: leader.name,
          role: leader.role,
          scope: leader.scope,
          bio: leader.bio,
          photoMediaId: mediaIdFor(media.ids, leader.photo),
          departmentId: departmentIdFor(departmentIds, leader.departmentName),
          position,
        });
        position += 1;
      }
      return seedDataset.leaders.length;
    }),
  );

  steps.push(
    await step(db, "testimonies", testimonies, async () => {
      let position = 0;
      for (const testimony of seedDataset.testimonies) {
        await repositories.testimonies.create({
          quote: testimony.quote,
          personName: testimony.personName,
          personRole: testimony.personRole,
          photoMediaId: mediaIdFor(media.ids, testimony.photo),
          position,
        });
        position += 1;
      }
      return seedDataset.testimonies.length;
    }),
  );

  steps.push(
    await step(db, "community_faces", communityFaces, async () => {
      let position = 0;
      for (const face of seedDataset.communityFaces) {
        await repositories.communityFaces.create({
          personName: face.personName,
          caption: face.caption,
          photoMediaId: mediaIdFor(media.ids, face.photo),
          position,
        });
        position += 1;
      }
      return seedDataset.communityFaces.length;
    }),
  );

  /* ---------------------------------------------------------------------- */
  /*  3. Récapitulatif                                                      */
  /* ---------------------------------------------------------------------- */

  console.log("\nRécapitulatif :");
  console.log(
    `  ${"media".padEnd(18)} ${media.uploaded} téléversé(s) · ${media.reused} réutilisé(s)` +
      ` · ${media.referenced} référence(s) de fichier`,
  );

  let insertedTotal = 0;

  for (const report of steps) {
    insertedTotal += report.inserted;
    const detail = report.skipped
      ? `ignorée — ${report.existing} ligne(s) déjà présente(s)`
      : `${report.inserted} ligne(s) insérée(s)`;

    console.log(`  ${report.label.padEnd(18)} ${detail}`);
  }

  console.log(
    `\n${insertedTotal} ligne(s) insérée(s) au total` +
      `${reset ? " après remise à zéro" : ""} · ${steps.filter((s) => s.skipped).length} table(s) ignorée(s)\n`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Point d'entrée                                                            */
/* -------------------------------------------------------------------------- */

try {
  await run();
} catch (error) {
  const [message, ...causes] = errorChain(error);
  console.error(`\nSeed interrompu : ${message}`);
  for (const cause of causes) {
    console.error(`  cause : ${cause}`);
  }
  console.error("");
  process.exitCode = 1;
} finally {
  // Le pool PostgreSQL doit être fermé dans tous les cas, sinon le processus
  // reste suspendu après la fin du script.
  await closeDatabase();
}
