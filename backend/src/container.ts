import type { Database } from "@/infrastructure/database/client";
import { db } from "@/infrastructure/database/client";
import type { AdminIdentityProvider } from "@/domain/identity/admin-identity-provider";
import { supabaseAdmin } from "@/infrastructure/supabase/client";
import { SupabaseAdminIdentityProvider } from "@/infrastructure/supabase/admin-identity.provider";
import type { StorageService } from "@/infrastructure/supabase/storage";
import { storageService } from "@/infrastructure/supabase/storage";
import { logger } from "@/infrastructure/logger";

/* -------------------------------------------------------------------------- */
/*  Repositories (implémentations Drizzle)                                    */
/* -------------------------------------------------------------------------- */
import { DrizzleAdminProfileRepository } from "@/infrastructure/repositories/admin-profile.repository";
import { DrizzleCommunityFaceRepository } from "@/infrastructure/repositories/community-face.repository";
import { DrizzleDepartmentRepository } from "@/infrastructure/repositories/department.repository";
import { DrizzleDepartmentCapabilityRepository } from "@/infrastructure/repositories/department-capability.repository";
import { DrizzleEventRepository } from "@/infrastructure/repositories/event.repository";
import { DrizzleLeaderRepository } from "@/infrastructure/repositories/leader.repository";
import { DrizzleMediaRepository } from "@/infrastructure/repositories/media.repository";
import { DrizzleMediaAccessRepository } from "@/infrastructure/repositories/media-access.repository";
import { DrizzleNotificationRepository } from "@/infrastructure/repositories/notification.repository";
import { DrizzlePrayerRequestRepository } from "@/infrastructure/repositories/prayer-request.repository";
import { DrizzlePublicationRepository } from "@/infrastructure/repositories/publication.repository";
import { DrizzleScheduleRepository } from "@/infrastructure/repositories/schedule.repository";
import { DrizzleScriptureRepository } from "@/infrastructure/repositories/scripture.repository";
import { DrizzleSettingRepository } from "@/infrastructure/repositories/setting.repository";
import { DrizzleSocialLinkRepository } from "@/infrastructure/repositories/social-link.repository";
import { DrizzleStaticPageRepository } from "@/infrastructure/repositories/static-page.repository";
import { DrizzleTestimonyRepository } from "@/infrastructure/repositories/testimony.repository";

/* -------------------------------------------------------------------------- */
/*  Services applicatifs                                                      */
/* -------------------------------------------------------------------------- */
import { DepartmentService } from "@/modules/departments/department.service";
import { EventService } from "@/modules/events/event.service";
import { PublicationService } from "@/modules/publications/publication.service";
import { LeaderService } from "@/modules/leaders/leader.service";
import { TestimonyService } from "@/modules/testimonies/testimony.service";
import { CommunityFaceService } from "@/modules/community-faces/community-face.service";
import { ScriptureService } from "@/modules/scriptures/scripture.service";
import { ScheduleService } from "@/modules/schedule/schedule.service";
import { SocialLinkService } from "@/modules/social-links/social-link.service";
import { SettingService } from "@/modules/settings/setting.service";
import { StaticPageService } from "@/modules/static-pages/static-page.service";
import { MediaService } from "@/modules/media/media.service";
import { PrayerRequestService } from "@/modules/prayer-requests/prayer-request.service";
import { AdminService } from "@/modules/admin/admin.service";
import { NotificationService } from "@/modules/notifications/notification.service";
import { createNotificationRouter } from "@/modules/notifications/notification.routes";

/* -------------------------------------------------------------------------- */
/*  Routers                                                                   */
/* -------------------------------------------------------------------------- */
import { createDepartmentRouter } from "@/modules/departments/department.routes";
import { createEventRouter } from "@/modules/events/event.routes";
import { createPublicationRouter } from "@/modules/publications/publication.routes";
import { createLeaderRouter } from "@/modules/leaders/leader.routes";
import { createTestimonyRouter } from "@/modules/testimonies/testimony.routes";
import { createCommunityFaceRouter } from "@/modules/community-faces/community-face.routes";
import { createScriptureRouter } from "@/modules/scriptures/scripture.routes";
import { createScheduleRouter } from "@/modules/schedule/schedule.routes";
import { createSocialLinkRouter } from "@/modules/social-links/social-link.routes";
import { createSettingRouter } from "@/modules/settings/setting.routes";
import { createStaticPageRouter } from "@/modules/static-pages/static-page.routes";
import { createMediaRouter } from "@/modules/media/media.routes";
import { createPrayerRequestRouter } from "@/modules/prayer-requests/prayer-request.routes";
import { createAdminRouter } from "@/modules/admin/admin.routes";

/* -------------------------------------------------------------------------- */
/*  Types du conteneur                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Dépendances exposées à la couche présentation.
 *
 * Les routers reçoivent cet objet au lieu d'instancier quoi que ce soit :
 * c'est ce qui rend l'injection explicite et les tests possibles avec des
 * doubles (`docs/004` §27, Dependency Injection).
 */
export interface AppDependencies {
  db: Database;
  storage: StorageService;
  /**
   * Port d'identité (Supabase Auth).
   *
   * Figure au premier niveau, et non dans `repositories` : ce n'est pas de la
   * persistance applicative, c'est un **fournisseur externe**, et le confondre
   * avec un repository ferait croire qu'il range des données du domaine — alors
   * qu'il ne détient que des secrets d'authentification (`docs/006` §2.2).
   */
  identities: AdminIdentityProvider;
  logger: typeof logger;
  repositories: {
    adminProfiles: DrizzleAdminProfileRepository;
    departments: DrizzleDepartmentRepository;
    /**
     * Capacités de département (D-25). Câblé au Lot 6 : c'est ce repository que
     * `EventService` interroge pour savoir si un département peut publier une
     * portée `GLOBAL`, et que l'outil d'exploitation utilise pour les accorder.
     */
    departmentCapabilities: DrizzleDepartmentCapabilityRepository;
    events: DrizzleEventRepository;
    publications: DrizzlePublicationRepository;
    leaders: DrizzleLeaderRepository;
    testimonies: DrizzleTestimonyRepository;
    communityFaces: DrizzleCommunityFaceRepository;
    scriptures: DrizzleScriptureRepository;
    schedule: DrizzleScheduleRepository;
    socialLinks: DrizzleSocialLinkRepository;
    settings: DrizzleSettingRepository;
    staticPages: DrizzleStaticPageRepository;
    media: DrizzleMediaRepository;
    mediaAccess: DrizzleMediaAccessRepository;
    notifications: DrizzleNotificationRepository;
    prayerRequests: DrizzlePrayerRequestRepository;
  };
  services: {
    departments: DepartmentService;
    events: EventService;
    publications: PublicationService;
    leaders: LeaderService;
    testimonies: TestimonyService;
    communityFaces: CommunityFaceService;
    scriptures: ScriptureService;
    schedule: ScheduleService;
    socialLinks: SocialLinkService;
    settings: SettingService;
    staticPages: StaticPageService;
    media: MediaService;
    prayerRequests: PrayerRequestService;
    admin: AdminService;
    notifications: NotificationService;
  };
}

/**
 * Point de composition unique.
 *
 * Chaque repository reçoit la connexion ; chaque service reçoit le repository
 * dont il a besoin (jamais la connexion directement) ; chaque router reçoit
 * les services et, le cas échéant, les middlewares d'autorisation.
 *
 * `overrides` permet aux tests d'injecter des doubles sans base de données.
 */
export function createContainer(
  overrides: Partial<
    Pick<AppDependencies, "db" | "storage" | "repositories" | "identities">
  > = {},
): AppDependencies {
  const database = overrides.db ?? db;
  const storage = overrides.storage ?? storageService;
  // Port d'identité : Supabase Auth. Injecté, jamais importé par un service —
  // c'est ce qui rend les règles d'habilitation testables sans réseau.
  const identities =
    overrides.identities ?? new SupabaseAdminIdentityProvider(supabaseAdmin);

  const repositories =
    overrides.repositories ??
    ({
      adminProfiles: new DrizzleAdminProfileRepository(database),
      departments: new DrizzleDepartmentRepository(database),
      departmentCapabilities: new DrizzleDepartmentCapabilityRepository(database),
      events: new DrizzleEventRepository(database),
      publications: new DrizzlePublicationRepository(database),
      leaders: new DrizzleLeaderRepository(database),
      testimonies: new DrizzleTestimonyRepository(database),
      communityFaces: new DrizzleCommunityFaceRepository(database),
      scriptures: new DrizzleScriptureRepository(database),
      schedule: new DrizzleScheduleRepository(database),
      socialLinks: new DrizzleSocialLinkRepository(database),
      settings: new DrizzleSettingRepository(database),
      staticPages: new DrizzleStaticPageRepository(database),
      media: new DrizzleMediaRepository(database),
      mediaAccess: new DrizzleMediaAccessRepository(database),
      notifications: new DrizzleNotificationRepository(database),
      prayerRequests: new DrizzlePrayerRequestRepository(database),
    } satisfies AppDependencies["repositories"]);

  const services = {
    departments: new DepartmentService(repositories.departments),
    events: new EventService(
      repositories.events,
      repositories.departments,
      repositories.departmentCapabilities,
    ),
    publications: new PublicationService(repositories.publications),
    leaders: new LeaderService(repositories.leaders),
    testimonies: new TestimonyService(repositories.testimonies),
    communityFaces: new CommunityFaceService(repositories.communityFaces),
    scriptures: new ScriptureService(repositories.scriptures),
    schedule: new ScheduleService(repositories.schedule),
    socialLinks: new SocialLinkService(repositories.socialLinks),
    settings: new SettingService(repositories.settings, repositories.socialLinks),
    staticPages: new StaticPageService(repositories.staticPages),
    media: new MediaService(repositories.media, storage, repositories.mediaAccess),
    prayerRequests: new PrayerRequestService(repositories.prayerRequests),
    admin: new AdminService(
      repositories.adminProfiles,
      repositories.departments,
      identities,
    ),
    notifications: new NotificationService(repositories.notifications),
  } satisfies AppDependencies["services"];

  return { db: database, storage, identities, logger, repositories, services };
}

/**
 * Fabrique des routers, dans l'ordre de montage.
 * Chaque entrée expose une fabrique qui reçoit les dépendances déjà construites.
 */
export function createRouters(deps: AppDependencies) {
  const authDeps = { adminProfiles: deps.repositories.adminProfiles };

  return {
    departments: createDepartmentRouter({ service: deps.services.departments, authDeps }),
    events: createEventRouter({ service: deps.services.events, authDeps }),
    publications: createPublicationRouter({
      service: deps.services.publications,
      authDeps,
    }),
    leaders: createLeaderRouter({ service: deps.services.leaders, authDeps }),
    testimonies: createTestimonyRouter({ service: deps.services.testimonies, authDeps }),
    communityFaces: createCommunityFaceRouter({
      service: deps.services.communityFaces,
      authDeps,
    }),
    scriptures: createScriptureRouter({ service: deps.services.scriptures, authDeps }),
    schedule: createScheduleRouter({ service: deps.services.schedule, authDeps }),
    socialLinks: createSocialLinkRouter({
      service: deps.services.socialLinks,
      authDeps,
    }),
    settings: createSettingRouter({ service: deps.services.settings, authDeps }),
    staticPages: createStaticPageRouter({
      service: deps.services.staticPages,
      authDeps,
    }),
    media: createMediaRouter({ service: deps.services.media, authDeps }),
    prayerRequests: createPrayerRequestRouter({
      service: deps.services.prayerRequests,
      authDeps,
    }),
    admin: createAdminRouter({ service: deps.services.admin, authDeps }),
    notifications: createNotificationRouter({
      service: deps.services.notifications,
      authDeps,
    }),
  };
}

export type Routers = ReturnType<typeof createRouters>;
