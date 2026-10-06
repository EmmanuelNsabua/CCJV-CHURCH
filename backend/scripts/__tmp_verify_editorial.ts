/**
 * VÉRIFICATION TEMPORAIRE — à supprimer après exécution.
 *
 * Contrôle les cinq ressources éditoriales contre la base Supabase réelle,
 * puis remet la base exactement dans l'état initial.
 */
import { eq } from "drizzle-orm";
import request from "supertest";
import { createApp } from "@/app";
import { closeDatabase, db } from "@/infrastructure/database/client";
import { siteSettings, staticPages } from "@/infrastructure/database/schema";
import { DrizzleScheduleRepository } from "@/infrastructure/repositories/schedule.repository";
import { DrizzleScriptureRepository } from "@/infrastructure/repositories/scripture.repository";
import { DrizzleSettingRepository } from "@/infrastructure/repositories/setting.repository";
import { DrizzleSocialLinkRepository } from "@/infrastructure/repositories/social-link.repository";
import { DrizzleStaticPageRepository } from "@/infrastructure/repositories/static-page.repository";
import { ScheduleService } from "@/modules/schedule/schedule.service";
import { ScriptureService } from "@/modules/scriptures/scripture.service";
import { SettingService } from "@/modules/settings/setting.service";
import { SocialLinkService } from "@/modules/social-links/social-link.service";
import { StaticPageService } from "@/modules/static-pages/static-page.service";
import { getPageContentSchema, isKnownPageKey, knownPageKeys } from "@/domain/content/page-content";
import { ALLOWED_SETTING_KEYS, isAllowedSettingKey } from "@/modules/settings/setting.schema";
import { seedDataset } from "@/infrastructure/database/seed-data";

const SCRIPTURE_KEY = "verification-temporaire";
const failures: string[] = [];

function check(label: string, ok: boolean, extra: unknown = ""): void {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${extra === "" ? "" : ` — ${String(extra)}`}`);
  if (!ok) failures.push(label);
}

async function expectError(label: string, run: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await run();
    check(label, false, "aucune erreur levée");
  } catch (error) {
    const actual = (error as { code?: string }).code;
    check(label, actual === code, `code=${String(actual)}`);
  }
}

async function main(): Promise<void> {
  const scriptures = new DrizzleScriptureRepository(db);
  const schedule = new DrizzleScheduleRepository(db);
  const socialLinks = new DrizzleSocialLinkRepository(db);
  const settings = new DrizzleSettingRepository(db);
  const pages = new DrizzleStaticPageRepository(db);

  const scriptureService = new ScriptureService(scriptures);
  const scheduleService = new ScheduleService(schedule);
  const socialLinkService = new SocialLinkService(socialLinks);
  const settingService = new SettingService(settings, socialLinks);
  const staticPageService = new StaticPageService(pages);

  /* ------------------------------------------------------------------ */
  /*  Registre de pages                                                  */
  /* ------------------------------------------------------------------ */
  check("isKnownPageKey('accueil')", isKnownPageKey("accueil"));
  check("isKnownPageKey('inconnue') === false", !isKnownPageKey("inconnue"));
  check("getPageContentSchema('toString') === undefined", getPageContentSchema("toString") === undefined);

  /* ------------------------------------------------------------------ */
  /*  0. Cohérence avec le jeu de données de référence (seed-data.ts)    */
  /* ------------------------------------------------------------------ */
  const seedKeys = Object.keys(seedDataset.siteSettings).sort();
  check(
    "liste blanche == clés de site_settings du seed",
    JSON.stringify(seedKeys) === JSON.stringify([...ALLOWED_SETTING_KEYS].sort()),
    seedKeys.filter((k) => !isAllowedSettingKey(k)).join(",") || "identiques",
  );

  for (const page of seedDataset.staticPages) {
    const schema = getPageContentSchema(page.pageKey);
    check(
      `seed pageContentSchemas['${page.pageKey}'] accepte le contenu de référence`,
      schema !== undefined && schema.safeParse(page.content).success,
    );
  }
  check(
    "les clés de page du seed sont exactement celles du registre",
    JSON.stringify(seedDataset.staticPages.map((p) => p.pageKey).sort()) ===
      JSON.stringify(knownPageKeys.slice().sort()),
  );

  /* ------------------------------------------------------------------ */
  /*  1. Scriptures                                                      */
  /* ------------------------------------------------------------------ */
  await scriptures.remove(SCRIPTURE_KEY);
  const created = await scriptureService.create({
    key: SCRIPTURE_KEY,
    text: "Texte de vérification temporaire.",
    reference: "Livre 1:1",
  });
  check("scripture.create -> translation par défaut", created.translation === "Louis Segond 1910");
  check("scripture.create -> id uuid", /^[0-9a-f-]{36}$/.test(created.id));

  const read = await scriptureService.getByKey(SCRIPTURE_KEY);
  check("scripture.getByKey", read.text === created.text && read.key === SCRIPTURE_KEY);

  const updated = await scriptureService.update(SCRIPTURE_KEY, { context: "Vérification" });
  check("scripture.update", updated.context === "Vérification");

  const listed = await scriptureService.list();
  check("scripture.list contient la clé", listed.some((s) => s.key === SCRIPTURE_KEY));
  check(
    "scripture.list ne renvoie aucun texte inventé",
    listed.every((s) => s.text.length > 0 && s.reference.length > 0),
  );

  await expectError(
    "scripture.getByKey inconnue -> SCRIPTURE_NOT_FOUND",
    () => scriptureService.getByKey("cle-inexistante"),
    "SCRIPTURE_NOT_FOUND",
  );
  await expectError(
    "scripture.create clé dupliquée -> CONFLICT",
    () => scriptureService.create({ key: SCRIPTURE_KEY, text: "x", reference: "y" }),
    "CONFLICT",
  );

  await scriptureService.remove(SCRIPTURE_KEY);
  const afterDelete = await scriptures.findByKey(SCRIPTURE_KEY);
  check("scripture.remove puis lecture -> null", afterDelete === null);

  /* ------------------------------------------------------------------ */
  /*  2. Schedule et social-links (lecture + cycle complet)              */
  /* ------------------------------------------------------------------ */
  const scheduleList = await scheduleService.list();
  check("schedule.list (positions croissantes)", scheduleList.every((e, i) => i === 0 || (scheduleList[i - 1]?.position ?? 0) <= e.position), `${scheduleList.length} entrées`);

  const entry = await scheduleService.create({
    day: "Test",
    title: "Vérification temporaire",
    timeLabel: "Dans la nuit",
    isConfirmed: true,
    position: 9999,
  });
  check("schedule.create", entry.isConfirmed && entry.timeLabel === "Dans la nuit");
  const entryUpdated = await scheduleService.update(entry.id, { isConfirmed: false });
  check("schedule.update", entryUpdated.isConfirmed === false);
  await expectError(
    "schedule.update id inconnu -> SCHEDULE_ENTRY_NOT_FOUND",
    () => scheduleService.update("00000000-0000-4000-8000-000000000000", { title: "x" }),
    "SCHEDULE_ENTRY_NOT_FOUND",
  );
  await scheduleService.remove(entry.id);
  check("schedule.remove", (await schedule.findById(entry.id)) === null);

  const link = await socialLinkService.create({
    label: "Vérification",
    href: "https://example.com/verification",
    position: 9999,
  });
  check("social-link.create", link.href === "https://example.com/verification");
  const linkUpdated = await socialLinkService.update(link.id, { label: "Vérification 2" });
  check("social-link.update", linkUpdated.label === "Vérification 2");
  await expectError(
    "social-link.remove id inconnu -> SOCIAL_LINK_NOT_FOUND",
    () => socialLinkService.remove("00000000-0000-4000-8000-000000000000"),
    "SOCIAL_LINK_NOT_FOUND",
  );
  await socialLinkService.remove(link.id);
  check("social-link.remove", (await socialLinks.findById(link.id)) === null);

  /* ------------------------------------------------------------------ */
  /*  3. Settings                                                        */
  /* ------------------------------------------------------------------ */
  const beforeSettings = await settings.listAll();
  const beforeByName = new Map(beforeSettings.map((s) => [s.key, s.value]));

  await settingService.update({ "site.name": "NOM DE VÉRIFICATION" });
  const overview = await settingService.getOverview();
  const nameAfter = overview.settings.find((s) => s.key === "site.name")?.value;
  check("settings.update applique la valeur", nameAfter === "NOM DE VÉRIFICATION");
  check(
    "settings.getOverview regroupe socialLinks",
    Array.isArray(overview.socialLinks) && overview.socialLinks.every((l) => typeof l.href === "string"),
    `${overview.socialLinks.length} liens`,
  );

  await expectError(
    "settings.update clé inconnue -> VALIDATION_ERROR",
    () => settingService.update({ "site.inconnue": "x" }),
    "VALIDATION_ERROR",
  );

  // Restauration de l'état initial du réglage écrit par le test.
  for (const key of ["site.name"]) {
    const previous = beforeByName.get(key);
    if (previous === undefined) {
      await db.delete(siteSettings).where(eq(siteSettings.key, key));
    } else {
      await db.update(siteSettings).set({ value: previous }).where(eq(siteSettings.key, key));
    }
  }

  /* ------------------------------------------------------------------ */
  /*  4. Pages statiques                                                 */
  /* ------------------------------------------------------------------ */
  const beforePages = await db
    .select()
    .from(staticPages)
    .where(eq(staticPages.pageKey, "accueil"));

  await staticPageService.updateContent(
    "accueil",
    { heroTitle: "Titre de vérification", heroIntro: "Introduction de vérification." },
    null,
  );
  const page = await staticPageService.getByKey("accueil");
  check("page.getByKey('accueil')", page.content.heroTitle === "Titre de vérification");

  await expectError(
    "page.getByKey('page-inexistante') -> PAGE_NOT_FOUND",
    () => staticPageService.getByKey("page-inexistante"),
    "PAGE_NOT_FOUND",
  );
  await expectError(
    "page.updateContent('page-inexistante') -> PAGE_NOT_FOUND",
    () => staticPageService.updateContent("page-inexistante", { title: "x" }, null),
    "PAGE_NOT_FOUND",
  );
  await expectError(
    "page.updateContent contenu non conforme -> VALIDATION_ERROR",
    () => staticPageService.updateContent("accueil", { heroTitle: "titre seul" }, null),
    "VALIDATION_ERROR",
  );

  // Restauration : contenu précédent conservé, sinon ligne supprimée.
  const previousPage = beforePages[0];
  if (previousPage) {
    await db
      .update(staticPages)
      .set({
        content: previousPage.content,
        updatedBy: previousPage.updatedBy,
        updatedAt: previousPage.updatedAt,
      })
      .where(eq(staticPages.pageKey, "accueil"));
    const restored = await staticPageService.getByKey("accueil");
    check(
      "page restaurée à l'identique",
      JSON.stringify(restored.content) === JSON.stringify(previousPage.content),
    );
  } else {
    await db.delete(staticPages).where(eq(staticPages.pageKey, "accueil"));
    check("page de test supprimée (aucune page préexistante)", true);
  }

  /* ------------------------------------------------------------------ */
  /*  5. Contrôle final : aucune donnée de test restante                 */
  /* ------------------------------------------------------------------ */
  const finalScriptures = await scriptures.findByKey(SCRIPTURE_KEY);
  const finalSettings = await settings.listAll();
  const finalPages = await db
    .select()
    .from(staticPages)
    .where(eq(staticPages.pageKey, "accueil"));

  check("aucun verset de test restant", finalScriptures === null);
  check(
    "site_settings inchangé",
    JSON.stringify(finalSettings.map((s) => [s.key, s.value]).sort()) ===
      JSON.stringify(beforeSettings.map((s) => [s.key, s.value]).sort()),
  );
  check(
    "static_pages inchangé",
    JSON.stringify(finalPages.map((p) => [p.pageKey, p.content])) ===
      JSON.stringify(beforePages.map((p) => [p.pageKey, p.content])),
  );

  /* ------------------------------------------------------------------ */
  /*  6. Vérification HTTP (montage des routers, séparation public/admin) */
  /* ------------------------------------------------------------------ */
  const app = createApp();

  const scripturesHttp = await request(app).get("/api/v1/scriptures");
  check(
    "GET /api/v1/scriptures -> 200 { data: [] }",
    scripturesHttp.status === 200 && Array.isArray(scripturesHttp.body.data),
    `status=${scripturesHttp.status}`,
  );

  const scheduleHttp = await request(app).get("/api/v1/schedule");
  check(
    "GET /api/v1/schedule -> 200 { data: [] }",
    scheduleHttp.status === 200 && Array.isArray(scheduleHttp.body.data),
    `status=${scheduleHttp.status}`,
  );

  const linksHttp = await request(app).get("/api/v1/social-links");
  check(
    "GET /api/v1/social-links -> 200 { data: [] }",
    linksHttp.status === 200 && Array.isArray(linksHttp.body.data),
    `status=${linksHttp.status}`,
  );

  const settingsHttp = await request(app).get("/api/v1/settings");
  check(
    "GET /api/v1/settings -> 200 { settings, socialLinks }",
    settingsHttp.status === 200 &&
      typeof settingsHttp.body.settings === "object" &&
      Array.isArray(settingsHttp.body.socialLinks),
    `status=${settingsHttp.status}`,
  );

  const unknownPageHttp = await request(app).get("/api/v1/pages/page-inexistante");
  check(
    "GET /api/v1/pages/page-inexistante -> 404 PAGE_NOT_FOUND",
    unknownPageHttp.status === 404 && unknownPageHttp.body.error?.code === "PAGE_NOT_FOUND",
    `status=${unknownPageHttp.status} code=${String(unknownPageHttp.body.error?.code)}`,
  );

  const writeNoAuth = await request(app)
    .patch("/api/v1/settings")
    .send({ settings: { "site.name": "x" } });
  check(
    "PATCH /api/v1/settings sans jeton -> 401 AUTH_REQUIRED",
    writeNoAuth.status === 401 && writeNoAuth.body.error?.code === "AUTH_REQUIRED",
    `status=${writeNoAuth.status} code=${String(writeNoAuth.body.error?.code)}`,
  );

  const createNoAuth = await request(app)
    .post("/api/v1/scriptures")
    .send({ key: "test", text: "t", reference: "r" });
  check(
    "POST /api/v1/scriptures sans jeton -> 401 AUTH_REQUIRED",
    createNoAuth.status === 401 && createNoAuth.body.error?.code === "AUTH_REQUIRED",
    `status=${createNoAuth.status} code=${String(createNoAuth.body.error?.code)}`,
  );

  const deleteNoAuth = await request(app).delete(
    "/api/v1/social-links/00000000-0000-4000-8000-000000000000",
  );
  check(
    "DELETE /api/v1/social-links/:id sans jeton -> 401 AUTH_REQUIRED",
    deleteNoAuth.status === 401 && deleteNoAuth.body.error?.code === "AUTH_REQUIRED",
    `status=${deleteNoAuth.status} code=${String(deleteNoAuth.body.error?.code)}`,
  );

  const invalidUuid = await request(app)
    .patch("/api/v1/schedule/pas-un-uuid")
    .send({ title: "x" });
  check(
    "PATCH /api/v1/schedule/:id non-uuid sans jeton -> 401 (authentification d'abord)",
    invalidUuid.status === 401,
    `status=${invalidUuid.status}`,
  );

  console.log(
    failures.length === 0
      ? "\nTOUT EST VERT"
      : `\n${failures.length} ÉCHEC(S) : ${failures.join(" | ")}`,
  );
  if (failures.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("ERREUR NON MAÎTRISÉE", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDatabase();
  });
