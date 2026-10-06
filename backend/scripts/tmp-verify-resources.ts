/**
 * VÉRIFICATION TEMPORAIRE — à supprimer après exécution.
 *
 * Exerce repositories + services + serializers + routers contre la vraie base
 * Supabase (migrée mais vide : le script crée ses propres fixtures et les
 * supprime à la fin).
 */
import express from "express";
import request from "supertest";
import { eq } from "drizzle-orm";
import { db, closeDatabase } from "@/infrastructure/database/client";
import { media, publications as publicationsTable } from "@/infrastructure/database/schema";
import {
  departments as departmentsTable,
  events as eventsTable,
} from "@/infrastructure/database/schema";
import { DrizzleDepartmentRepository } from "@/infrastructure/repositories/department.repository";
import { DrizzleEventRepository } from "@/infrastructure/repositories/event.repository";
import { DrizzlePublicationRepository } from "@/infrastructure/repositories/publication.repository";
import { DepartmentService } from "@/modules/departments/department.service";
import { EventService } from "@/modules/events/event.service";
import { PublicationService } from "@/modules/publications/publication.service";
import { createDepartmentRouter } from "@/modules/departments/department.routes";
import { createEventRouter } from "@/modules/events/event.routes";
import { createPublicationRouter } from "@/modules/publications/publication.routes";
import { errorHandler, notFoundHandler } from "@/presentation/middlewares/error-handler";
import type { AdminProfileRepository } from "@/domain/repositories";
import { isoDateFromNow, toIsoDate } from "@/domain/rules/event-status";

const departmentRepo = new DrizzleDepartmentRepository(db);
const eventRepo = new DrizzleEventRepository(db);
const publicationRepo = new DrizzlePublicationRepository(db);

const departmentService = new DepartmentService(departmentRepo);
const eventService = new EventService(eventRepo, departmentRepo);
const publicationService = new PublicationService(publicationRepo);

const adminProfilesStub = {
  findById: async () => null,
  findByUsername: async () => null,
  list: async () => [],
  upsert: async () => {
    throw new Error("non utilisé");
  },
} as unknown as AdminProfileRepository;

const authDeps = { adminProfiles: adminProfilesStub };

const app = express();
app.use(express.json());
app.use("/api/v1/departments", createDepartmentRouter({ service: departmentService, authDeps }));
app.use("/api/v1/events", createEventRouter({ service: eventService, authDeps }));
app.use(
  "/api/v1/publications",
  createPublicationRouter({ service: publicationService, authDeps }),
);
app.use(notFoundHandler);
app.use(errorHandler);

let failures = 0;

function check(label: string, condition: boolean, extra?: unknown): void {
  if (!condition) failures += 1;
  const suffix = extra === undefined ? "" : ` → ${JSON.stringify(extra)}`;
  console.log(`${condition ? "OK  " : "FAIL"} ${label}${suffix}`);
}

/** Exécute une opération qui doit échouer et renvoie `code` + `name`. */
async function expectFailure(
  label: string,
  operation: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  try {
    await operation();
    check(label, false, "aucune erreur levée");
  } catch (error) {
    const code = (error as { code?: string }).code;
    const name = (error as { name?: string }).name;
    check(label, code === expectedCode, { name, code });
  }
}

const createdMediaIds: string[] = [];
const createdEventIds: string[] = [];
const createdPublicationIds: string[] = [];
const createdDepartmentIds: string[] = [];

async function insertMedia(label: string): Promise<{ id: string; publicUrl: string }> {
  const publicUrl = `https://example.supabase.co/storage/v1/object/public/ccjv-media/verification/${label}.jpg`;
  const [row] = await db
    .insert(media)
    .values({
      bucket: "ccjv-media",
      path: `verification/${label}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      publicUrl,
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      alt: `Média de vérification ${label}`,
    })
    .returning({ id: media.id });

  if (row === undefined) throw new Error("insertion média impossible");
  createdMediaIds.push(row.id);
  return { id: row.id, publicUrl };
}

async function main(): Promise<void> {
  const today = toIsoDate(new Date());

  /* ------------------------------- FIXTURES -------------------------------- */

  const mediaBanner = await insertMedia("banner");
  const mediaGallery1 = await insertMedia("galerie-1");
  const mediaGallery2 = await insertMedia("galerie-2");
  const mediaGallery3 = await insertMedia("galerie-3");
  const mediaCover = await insertMedia("couverture");
  const [mBanner, mGallery1, mGallery2, mGallery3, mCover] = [
    mediaBanner.id,
    mediaGallery1.id,
    mediaGallery2.id,
    mediaGallery3.id,
    mediaCover.id,
  ] as [string, string, string, string, string];

  const depA = await departmentService.create({
    name: "Vérification Chorale",
    description: "Département de vérification.",
    tagline: "Temporaire",
    responsibleName: "Testeur",
    meetingSchedule: "Lundi 16h30–18h30",
    keyPoints: ["Pilier un", "Pilier deux"],
    bannerMediaId: mBanner,
    galleryMediaIds: [mGallery1, mGallery2, mGallery3],
    position: 0,
  });
  createdDepartmentIds.push(depA.id);
  check("slug généré depuis le nom", depA.slug === "verification-chorale", depA.slug);
  check("bannière résolue par le repository", depA.bannerImageUrl === mediaBanner.publicUrl, depA.bannerImageUrl);
  check(
    "galerie résolue dans l'ordre des positions",
    depA.galleryUrls.length === 3 &&
      depA.galleryUrls[0] === mediaGallery1.publicUrl &&
      depA.galleryUrls[1] === mediaGallery2.publicUrl &&
      depA.galleryUrls[2] === mediaGallery3.publicUrl,
    depA.galleryUrls.map((u) => u.split("/").pop()),
  );
  check("keyPoints conservés", depA.keyPoints?.length === 2);

  // Même nom : `uniqueSlug` doit suffixer.
  const depB = await departmentService.create({ name: "Vérification Chorale" });
  createdDepartmentIds.push(depB.id);
  check("uniqueSlug() suffixe un slug déjà pris", depB.slug === "verification-chorale-2", depB.slug);

  await expectFailure(
    "slug explicite déjà pris → DUPLICATE_SLUG",
    () => departmentService.create({ name: "Autre", slug: "verification-chorale" }),
    "DUPLICATE_SLUG",
  );

  const evUpcoming = await eventService.create({
    title: "Vérification culte à venir",
    excerpt: "Accroche",
    description: "Événement de vérification.",
    eventDate: isoDateFromNow(30),
    eventTime: "09:30",
    location: "Temple",
    imageMediaId: mGallery1,
    bannerMediaId: mBanner,
    galleryMediaIds: [mGallery2, mGallery3],
    departmentId: depA.id,
    practicalInfo: ["Info un", "Info deux"],
  });
  createdEventIds.push(evUpcoming.id);
  check("statut calculé UPCOMING", evUpcoming.status === "UPCOMING");
  check("eventDate reste une chaîne", typeof evUpcoming.eventDate === "string", evUpcoming.eventDate);
  check("imageUrl résolue", evUpcoming.imageUrl !== null, evUpcoming.imageUrl);
  check("bannerImageUrl résolue", evUpcoming.bannerImageUrl !== null);
  check("galleryUrls résolues (2)", evUpcoming.galleryUrls.length === 2, evUpcoming.galleryUrls.length);

  const evArchived = await eventService.create({
    title: "Vérification événement passé",
    eventDate: isoDateFromNow(-10),
    departmentId: depA.id,
  });
  createdEventIds.push(evArchived.id);
  check("statut calculé ARCHIVED", evArchived.status === "ARCHIVED");

  const evToday = await eventService.create({
    title: "Vérification événement du jour",
    eventDate: today,
  });
  createdEventIds.push(evToday.id);
  check("événement du jour = UPCOMING (borne incluse)", evToday.status === "UPCOMING");

  await expectFailure(
    "département inexistant → DEPARTMENT_NOT_FOUND",
    () =>
      eventService.create({
        title: "Vérification sans département",
        eventDate: isoDateFromNow(5),
        departmentId: "11111111-1111-4111-8111-111111111111",
      }),
    "DEPARTMENT_NOT_FOUND",
  );

  /* --------------------------- LISTES ET FILTRES --------------------------- */

  const depPage = await departmentService.list({ page: 1, limit: 1 });
  check("list() : total séparé du nombre d'items", depPage.total === 2 && depPage.items.length === 1, {
    total: depPage.total,
    returned: depPage.items.length,
  });

  const upcoming = await eventRepo.list(
    { limit: 50, offset: 0 },
    { status: "UPCOMING", departmentId: depA.id },
    { column: "event_date", direction: "asc" },
  );
  check(
    "filtre status=UPCOMING + departmentId (1 seul des 2 événements du département est à venir)",
    upcoming.total === 1 && upcoming.items[0]?.id === evUpcoming.id,
    { total: upcoming.total, id: upcoming.items[0]?.id },
  );

  const archived = await eventRepo.list(
    { limit: 50, offset: 0 },
    { status: "ARCHIVED" },
    { column: "event_date", direction: "desc" },
  );
  check("filtre status=ARCHIVED", archived.total === 1 && archived.items[0]?.id === evArchived.id);
  check("ARCHIVED : event_date < today", archived.items.every((e) => e.eventDate < today));

  const allUpcoming = await eventRepo.list(
    { limit: 50, offset: 0 },
    { status: "UPCOMING" },
    { column: "event_date", direction: "asc" },
  );
  const allEvents = await eventRepo.list({ limit: 50, offset: 0 }, {}, { column: "event_date", direction: "asc" });
  check("UPCOMING + ARCHIVED = total (mêmes filtres pour le count)", allUpcoming.total + archived.total === allEvents.total, {
    upcoming: allUpcoming.total,
    archived: archived.total,
    all: allEvents.total,
  });
  check("l'événement du jour est bien UPCOMING", allUpcoming.items.some((e) => e.id === evToday.id));
  check(
    "tri ascendant respecté",
    allEvents.items.every((e, i) => i === 0 || (allEvents.items[i - 1]?.eventDate ?? "") <= e.eventDate),
  );

  const descEvents = await eventRepo.list({ limit: 50, offset: 0 }, {}, { column: "event_date", direction: "desc" });
  check("tri descendant respecté", descEvents.items[0]?.id === allEvents.items[allEvents.items.length - 1]?.id);

  // Borne `today` injectée : rien n'est « à venir » si la borne est lointaine.
  const farPast = await eventRepo.list(
    { limit: 50, offset: 0 },
    { status: "UPCOMING", today: isoDateFromNow(3650) },
    { column: "event_date", direction: "asc" },
  );
  check("`today` injecté pilote le filtre ET le statut", farPast.total === 0, farPast.total);
  const farFuture = await eventRepo.list(
    { limit: 50, offset: 0 },
    { status: "ARCHIVED", today: isoDateFromNow(-3650) },
    { column: "event_date", direction: "asc" },
  );
  check("`today` injecté : tout devient ARCHIVED", farFuture.total === 0, farFuture.total);

  const bySlug = await eventRepo.findByIdOrSlug(evUpcoming.slug);
  const byUuid = await eventRepo.findByIdOrSlug(evUpcoming.id);
  check("findByIdOrSlug(slug) === findByIdOrSlug(uuid)", bySlug?.id === byUuid?.id && byUuid?.id === evUpcoming.id);
  check("findById(slug) ne lève pas (null)", (await eventRepo.findById("culte-dominical")) === null);

  /* ------------------------------ PUBLICATIONS ----------------------------- */

  const pubVideo = await publicationService.create({
    title: "Vérification enseignement vidéo",
    type: "VIDEO",
    category: "ENSEIGNEMENT",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "Pasteur",
    publishedAt: isoDateFromNow(-2),
  });
  createdPublicationIds.push(pubVideo.id);
  check("publication VIDEO créée", pubVideo.type === "VIDEO" && pubVideo.status === "PUBLISHED");

  const pubPhoto = await publicationService.create({
    title: "Vérification album photo",
    type: "PHOTO",
    category: "MEDIA",
    coverMediaId: mCover,
    publishedAt: isoDateFromNow(-5),
  });
  createdPublicationIds.push(pubPhoto.id);
  check("PHOTO acceptée avec couverture seule", pubPhoto.coverImageUrl !== null, pubPhoto.coverImageUrl);

  const pubTexte = await publicationService.create({
    title: "Vérification actualité texte",
    type: "TEXTE",
    category: "ACTUALITE",
    body: ["Premier paragraphe.", "Deuxième paragraphe."],
    publishedAt: isoDateFromNow(-1),
  });
  createdPublicationIds.push(pubTexte.id);
  check("TEXTE accepté avec body", pubTexte.body?.length === 2);

  const pubDraft = await publicationService.create({
    title: "Vérification brouillon",
    type: "TEXTE",
    category: "RESSOURCE",
    status: "DRAFT",
    body: ["Contenu brouillon."],
    publishedAt: isoDateFromNow(0),
  });
  createdPublicationIds.push(pubDraft.id);
  check("brouillon créé", pubDraft.status === "DRAFT");

  await expectFailure(
    "VIDEO sans contentUrl → VALIDATION_ERROR",
    () => publicationService.create({ title: "Vérification vidéo sans lien", type: "VIDEO", category: "MEDIA", publishedAt: isoDateFromNow(0) }),
    "VALIDATION_ERROR",
  );
  await expectFailure(
    "TEXTE sans body → VALIDATION_ERROR",
    () => publicationService.create({ title: "Vérification texte vide", type: "TEXTE", category: "ACTUALITE", publishedAt: isoDateFromNow(0) }),
    "VALIDATION_ERROR",
  );
  await expectFailure(
    "PHOTO sans contenu ni couverture → VALIDATION_ERROR",
    () => publicationService.create({ title: "Vérification photo vide", type: "PHOTO", category: "MEDIA", publishedAt: isoDateFromNow(0) }),
    "VALIDATION_ERROR",
  );
  await expectFailure(
    "PATCH qui vide le lien d'une VIDEO → VALIDATION_ERROR",
    () => publicationService.update(pubVideo.slug, { contentUrl: null }),
    "VALIDATION_ERROR",
  );

  const publicList = await publicationService.list({ page: 1, limit: 50, sort: { column: "published_at", direction: "desc" } });
  check("liste publique : aucun brouillon", !publicList.items.some((p) => p.id === pubDraft.id), publicList.total);
  check("liste publique : 3 publications", publicList.total === 3, publicList.total);
  check(
    "tri décroissant par défaut",
    publicList.items.every((p, i) => i === 0 || (publicList.items[i - 1]?.publishedAt ?? "") >= p.publishedAt),
  );
  check("publishedAt reste YYYY-MM-DD", publicList.items.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt)));

  const onlyVideos = await publicationService.list({ page: 1, limit: 50, type: "VIDEO", sort: { column: "published_at", direction: "desc" } });
  check("filtre type=VIDEO", onlyVideos.total === 1 && onlyVideos.items[0]?.id === pubVideo.id);
  const onlyResources = await publicationService.list({ page: 1, limit: 50, category: "RESSOURCE", sort: { column: "published_at", direction: "desc" } });
  check("filtre category=RESSOURCE ne renvoie pas le brouillon", onlyResources.total === 0, onlyResources.total);

  await expectFailure(
    "lecture publique d'un brouillon → PUBLICATION_NOT_FOUND",
    () => publicationService.get(pubDraft.slug),
    "PUBLICATION_NOT_FOUND",
  );
  check("lecture publique d'une publication", (await publicationService.get(pubTexte.slug)).id === pubTexte.id);
  check("lecture publique par UUID", (await publicationService.get(pubTexte.id)).id === pubTexte.id);

  const republished = await publicationService.update(pubDraft.id, { status: "PUBLISHED" });
  check("PATCH : republication d'un brouillon", republished.status === "PUBLISHED");
  check("publication republiée visible", (await publicationService.get(pubDraft.slug)).id === pubDraft.id);

  /* --------------------- SUPPRESSION D'UN DÉPARTEMENT ---------------------- */

  check("suppression du département", await departmentRepo.remove(depA.id));
  const orphan = await eventRepo.findById(evUpcoming.id);
  check("l'événement survit", orphan !== null);
  check("departmentId repassé à null (set null)", orphan?.departmentId === null, orphan?.departmentId);
  check("galerie du département supprimée en cascade", (await departmentRepo.findById(depA.id)) === null);
  check("slug libéré après suppression", !(await departmentRepo.slugExists("verification-chorale")));

  /* ------------------------------- ROUTERS --------------------------------- */

  // La publication republiée plus haut repasse en brouillon : les routes
  // publiques ne doivent jamais la laisser sortir.
  await publicationService.update(pubDraft.id, { status: "DRAFT" });

  const listRes = await request(app).get("/api/v1/departments?page=1&limit=10");
  check("GET /departments → 200", listRes.status === 200, listRes.status);
  check("GET /departments → { data, meta }", Array.isArray(listRes.body.data) && typeof listRes.body.meta.total === "number", listRes.body.meta);
  check("GET /departments → meta.totalPages", listRes.body.meta.totalPages === 1, listRes.body.meta);

  const itemRes = await request(app).get(`/api/v1/departments/${depB.slug}`);
  check("GET /departments/:slug → 200", itemRes.status === 200 && itemRes.body.id === depB.id, itemRes.status);
  const dtoKeys = Object.keys(itemRes.body);
  check("DTO département conforme au frontend", ["id", "name", "slug"].every((k) => dtoKeys.includes(k)), dtoKeys);

  const missingRes = await request(app).get("/api/v1/departments/inconnu-total");
  check("GET département inconnu → 404 DEPARTMENT_NOT_FOUND", missingRes.status === 404 && missingRes.body.error.code === "DEPARTMENT_NOT_FOUND", missingRes.body);

  const badQuery = await request(app).get("/api/v1/events?status=PAS_UN_STATUT");
  check("GET /events?status=invalide → 400 VALIDATION_ERROR", badQuery.status === 400 && badQuery.body.error.code === "VALIDATION_ERROR", badQuery.body);

  const badSort = await request(app).get("/api/v1/events?sort=description");
  check("GET /events?sort=colonne libre → 400", badSort.status === 400, badSort.body);

  const eventsRes = await request(app).get("/api/v1/events?status=UPCOMING&sort=-event_date");
  check("GET /events?status=UPCOMING&sort=-event_date → 200", eventsRes.status === 200, eventsRes.status);
  check("GET /events : statuts calculés", eventsRes.body.data.every((e: { status: string }) => e.status === "UPCOMING"), eventsRes.body.data.map((e: { status: string }) => e.status));
  check("GET /events : eventTime en HH:MM", eventsRes.body.data.every((e: { eventTime?: string }) => e.eventTime === undefined || /^\d{2}:\d{2}$/.test(e.eventTime)), eventsRes.body.data.map((e: { eventTime?: string }) => e.eventTime));

  const publicationsRes = await request(app).get("/api/v1/publications?limit=50&sort=-published_at");
  check("GET /publications → 200", publicationsRes.status === 200, publicationsRes.status);
  check("GET /publications : brouillon absent", !publicationsRes.body.data.some((p: { slug: string }) => p.slug === pubDraft.slug));
  check(
    "GET /publications : ordre décroissant par défaut (sans sort)",
    (await request(app).get("/api/v1/publications?limit=50")).body.data.every(
      (p: { publishedAt: string }, i: number, all: { publishedAt: string }[]) => i === 0 || (all[i - 1]?.publishedAt ?? "") >= p.publishedAt,
    ),
  );
  check("GET /publications : tri ascendant sur demande", (await request(app).get("/api/v1/publications?sort=published_at")).body.data.every(
    (p: { publishedAt: string }, i: number, all: { publishedAt: string }[]) => i === 0 || (all[i - 1]?.publishedAt ?? "") <= p.publishedAt,
  ));

  const draftRes = await request(app).get(`/api/v1/publications/${pubDraft.slug}`);
  check("GET /publications/:slug republiée → 200", draftRes.status === 200, draftRes.status);

  for (const [label, verb, url] of [
    ["POST /departments", "post", "/api/v1/departments"],
    ["PATCH /departments/:id", "patch", "/api/v1/departments/x"],
    ["DELETE /departments/:id", "delete", "/api/v1/departments/x"],
    ["POST /events", "post", "/api/v1/events"],
    ["PATCH /events/:id", "patch", "/api/v1/events/x"],
    ["DELETE /events/:id", "delete", "/api/v1/events/x"],
    ["POST /publications", "post", "/api/v1/publications"],
    ["PATCH /publications/:id", "patch", "/api/v1/publications/x"],
    ["DELETE /publications/:id", "delete", "/api/v1/publications/x"],
  ] as const) {
    const res = await request(app)[verb](url).send({});
    check(`${label} sans jeton → 401 AUTH_REQUIRED`, res.status === 401 && res.body.error.code === "AUTH_REQUIRED", {
      status: res.status,
      code: res.body?.error?.code,
    });
  }

  /* -------------------------------- NETTOYAGE ------------------------------ */

  console.log("\nNettoyage…");
}

main()
  .catch((error: unknown) => {
    failures += 1;
    console.error("ERREUR", error);
  })
  .finally(async () => {
    for (const id of createdPublicationIds) {
      await db.delete(publicationsTable).where(eq(publicationsTable.id, id));
    }
    for (const id of createdEventIds) {
      await db.delete(eventsTable).where(eq(eventsTable.id, id));
    }
    for (const id of createdDepartmentIds) {
      await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    }
    for (const id of createdMediaIds) {
      await db.delete(media).where(eq(media.id, id));
    }

    const leftover = await db.select({ id: media.id }).from(media).limit(1);
    const leftoverEvents = await db.select({ id: eventsTable.id }).from(eventsTable).limit(1);
    const leftoverDepartments = await db.select({ id: departmentsTable.id }).from(departmentsTable).limit(1);
    console.log(
      `Restes → media=${leftover.length} events=${leftoverEvents.length} departments=${leftoverDepartments.length}`,
    );

    console.log(failures === 0 ? "\nTOUT EST VERT" : `\n${failures} VÉRIFICATION(S) EN ÉCHEC`);
    await closeDatabase();
    process.exit(failures === 0 ? 0 : 1);
  });
