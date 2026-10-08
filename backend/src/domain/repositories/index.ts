import type {
  AdminProfile,
  AdminScope,
  CommunityFace,
  Department,
  Event,
  EventStatus,
  Leader,
  MediaAsset,
  PersistedAdminRole,
  PrayerRequest,
  Publication,
  PublicationCategory,
  PublicationStatus,
  PublicationType,
  ScheduleEntry,
  Scripture,
  SiteSetting,
  SocialLink,
  StaticPage,
  Testimony,
} from "@/domain/entities";
import type { DepartmentCapability } from "@/domain/departments/capabilities";

/**
 * Contrats de persistance.
 *
 * Le domaine dépend de ces interfaces, jamais de Drizzle (`docs/004` §9,
 * principe d'inversion de dépendance). L'implémentation vit dans
 * `infrastructure/repositories`.
 *
 * Chaque contrat est volontairement ciblé (Interface Segregation) : un service
 * ne reçoit que le repository dont il a besoin, ce qui rend les tests unitaires
 * possibles sans base de données.
 */

export interface ListOptions {
  limit: number;
  offset: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

/* -------------------------------------------------------------------------- */
/*  Entrées de création et de mise à jour                                     */
/* -------------------------------------------------------------------------- */

export interface DepartmentInput {
  name: string;
  description?: string | null;
  responsibleName?: string | null;
  tagline?: string | null;
  meetingSchedule?: string | null;
  keyPoints?: string[] | null;
  bannerMediaId?: string | null;
  galleryMediaIds?: string[];
  position?: number;
}

export interface EventInput {
  title: string;
  description?: string | null;
  excerpt?: string | null;
  eventDate: string;
  eventTime?: string | null;
  location?: string | null;
  imageMediaId?: string | null;
  bannerMediaId?: string | null;
  departmentId?: string | null;
  practicalInfo?: string[] | null;
  galleryMediaIds?: string[];
}

export interface EventFilters {
  status?: EventStatus;
  departmentId?: string;
  /** Borne de comparaison pour le statut, injectable pour les tests. */
  today?: string;
}

export type EventSortColumn = "event_date" | "created_at";

export interface PublicationInput {
  title: string;
  type: PublicationType;
  category: PublicationCategory;
  status?: PublicationStatus;
  contentUrl?: string | null;
  coverMediaId?: string | null;
  description?: string | null;
  body?: string[] | null;
  author?: string | null;
  publishedAt: string;
}

export interface PublicationFilters {
  type?: PublicationType;
  category?: PublicationCategory;
  status?: PublicationStatus;
}

export type PublicationSortColumn = "published_at" | "created_at";

export interface LeaderInput {
  name: string;
  role: string;
  scope?: string | null;
  bio?: string | null;
  photoMediaId?: string | null;
  departmentId?: string | null;
  position?: number;
}

export interface TestimonyInput {
  quote: string;
  personName: string;
  personRole?: string | null;
  photoMediaId?: string | null;
  position?: number;
}

export interface CommunityFaceInput {
  personName: string;
  caption: string;
  photoMediaId?: string | null;
  position?: number;
}

export interface ScriptureInput {
  key: string;
  text: string;
  reference: string;
  translation?: string;
  context?: string | null;
}

export interface ScheduleEntryInput {
  day: string;
  title: string;
  timeLabel: string;
  audience?: string | null;
  isConfirmed?: boolean;
  position?: number;
}

export interface SocialLinkInput {
  label: string;
  href: string;
  position?: number;
}

export interface MediaInput {
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  uploadedBy?: string | null;
}

export interface PrayerRequestInput {
  requestText: string;
  requesterName?: string | null;
  requesterContact?: string | null;
  confidentiality?: "private" | "community";
}

/* -------------------------------------------------------------------------- */
/*  Contrats                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Contrat commun à toutes les ressources gérées par le back-office.
 * Les lectures publiques ne voient que les ressources publiées ; le filtrage
 * est explicite dans chaque contrat plutôt qu'implicite.
 */
export interface DepartmentRepository {
  list(options: ListOptions): Promise<ListResult<Department>>;
  findById(id: string): Promise<Department | null>;
  findByIdOrSlug(value: string): Promise<Department | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  create(data: DepartmentInput, slug: string): Promise<Department>;
  update(id: string, data: Partial<DepartmentInput>): Promise<Department | null>;
  remove(id: string): Promise<boolean>;
}

/**
 * Capacités de département — contrat **séparé** de `DepartmentRepository`.
 *
 * `docs/004` §9 et l'Interface Segregation : un service ne reçoit que ce dont il
 * a besoin. Ici la séparation a une raison plus précise que l'élégance. Une
 * capacité n'est **pas** un attribut éditorial du département : elle décide de la
 * **portée publique** d'un événement (D-25, D-26), et son écriture est
 * l'opération la plus sensible du modèle — `docs/029` §5.3 la désigne comme
 * « le vecteur d'escalade le plus direct ». La ranger dans le même contrat que
 * `update()` la rendrait accessible par toute couche qui reçoit déjà le
 * repository des départements — c'est-à-dire, à terme, par le service public.
 *
 * Le contrat est donc étroit par construction : **lire** les capacités d'un
 * département, les **accorder**, les **retirer**. Rien d'autre — et surtout pas
 * de méthode qui les modifierait au détour d'une mise à jour de fiche.
 */
export interface DepartmentCapabilityRepository {
  /**
   * Capacités d'un département.
   *
   * Sert aujourd'hui à l'outil d'exploitation, qui affiche l'état **avant** et
   * **après** un grant : un opérateur doit pouvoir constater qu'une capacité
   * était déjà accordée plutôt que de le supposer. Ce sera également la lecture
   * du chemin événementiel (Lot 6), où la portée publique d'un événement est
   * dérivée de la capacité du département (D-25, D-26).
   */
  listForDepartment(departmentId: string): Promise<DepartmentCapability[]>;

  /**
   * Accorde une capacité, de façon **idempotente**.
   *
   * `ON CONFLICT DO NOTHING` plutôt qu'une erreur : accorder deux fois la même
   * capacité n'est pas une faute de l'appelant, c'est un état désiré déjà
   * atteint. Les scripts d'exploitation doivent pouvoir être rejoués sans échouer
   * — c'est exactement ce que `docs/033` exige d'une étape de migration.
   *
   * `grantedBy` est conservé (`granted_by`, `RESTRICT`) : `docs/032` §3.5 le
   * déclare facultatif, mais l'attribution est ce qui rend un grant auditable.
   */
  grant(data: {
    departmentId: string;
    capability: DepartmentCapability;
    grantedBy?: string | null;
  }): Promise<void>;

  /** Retire une capacité. `false` si elle n'était pas accordée. */
  revoke(departmentId: string, capability: DepartmentCapability): Promise<boolean>;
}

export interface EventRepository {
  list(
    options: ListOptions,
    filters: EventFilters,
    sort: { column: EventSortColumn; direction: "asc" | "desc" },
  ): Promise<ListResult<Event>>;
  findById(id: string): Promise<Event | null>;
  findByIdOrSlug(value: string): Promise<Event | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  create(data: EventInput, slug: string): Promise<Event>;
  update(id: string, data: Partial<EventInput>): Promise<Event | null>;
  remove(id: string): Promise<boolean>;
}

export interface PublicationRepository {
  list(
    options: ListOptions,
    filters: PublicationFilters,
    sort: { column: PublicationSortColumn; direction: "asc" | "desc" },
  ): Promise<ListResult<Publication>>;
  findById(id: string): Promise<Publication | null>;
  findByIdOrSlug(value: string, includeDrafts: boolean): Promise<Publication | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  create(data: PublicationInput, slug: string): Promise<Publication>;
  update(id: string, data: Partial<PublicationInput>): Promise<Publication | null>;
  remove(id: string): Promise<boolean>;
}

export interface LeaderRepository {
  list(options: ListOptions): Promise<ListResult<Leader>>;
  findById(id: string): Promise<Leader | null>;
  create(data: LeaderInput): Promise<Leader>;
  update(id: string, data: Partial<LeaderInput>): Promise<Leader | null>;
  remove(id: string): Promise<boolean>;
}

export interface TestimonyRepository {
  list(options: ListOptions): Promise<ListResult<Testimony>>;
  findById(id: string): Promise<Testimony | null>;
  create(data: TestimonyInput): Promise<Testimony>;
  update(id: string, data: Partial<TestimonyInput>): Promise<Testimony | null>;
  remove(id: string): Promise<boolean>;
}

export interface CommunityFaceRepository {
  list(options: ListOptions): Promise<ListResult<CommunityFace>>;
  findById(id: string): Promise<CommunityFace | null>;
  create(data: CommunityFaceInput): Promise<CommunityFace>;
  update(id: string, data: Partial<CommunityFaceInput>): Promise<CommunityFace | null>;
  remove(id: string): Promise<boolean>;
}

export interface ScriptureRepository {
  list(): Promise<Scripture[]>;
  findByKey(key: string): Promise<Scripture | null>;
  create(data: ScriptureInput): Promise<Scripture>;
  update(key: string, data: Partial<ScriptureInput>): Promise<Scripture | null>;
  remove(key: string): Promise<boolean>;
}

export interface ScheduleRepository {
  list(): Promise<ScheduleEntry[]>;
  findById(id: string): Promise<ScheduleEntry | null>;
  create(data: ScheduleEntryInput): Promise<ScheduleEntry>;
  update(id: string, data: Partial<ScheduleEntryInput>): Promise<ScheduleEntry | null>;
  remove(id: string): Promise<boolean>;
}

export interface SocialLinkRepository {
  list(): Promise<SocialLink[]>;
  findById(id: string): Promise<SocialLink | null>;
  create(data: SocialLinkInput): Promise<SocialLink>;
  update(id: string, data: Partial<SocialLinkInput>): Promise<SocialLink | null>;
  remove(id: string): Promise<boolean>;
}

export interface SettingRepository {
  listAll(): Promise<SiteSetting[]>;
  upsertMany(values: Record<string, string>): Promise<SiteSetting[]>;
}

export interface StaticPageRepository {
  findByKey(pageKey: string): Promise<StaticPage | null>;
  upsert(
    pageKey: string,
    content: Record<string, unknown>,
    updatedBy: string | null,
  ): Promise<StaticPage>;
}

export interface MediaRepository {
  list(options: ListOptions): Promise<ListResult<MediaAsset>>;
  findById(id: string): Promise<MediaAsset | null>;
  findByPath(path: string): Promise<MediaAsset | null>;
  create(data: MediaInput): Promise<MediaAsset>;
  remove(id: string): Promise<boolean>;
  /** Nombre de références à ce média (galeries, couvertures, portraits). */
  countReferences(mediaId: string): Promise<number>;
}

export interface PrayerRequestRepository {
  list(
    options: ListOptions,
    filters: { status?: "NEW" | "PRAYED" },
  ): Promise<ListResult<PrayerRequest>>;
  findById(id: string): Promise<PrayerRequest | null>;
  create(data: PrayerRequestInput): Promise<PrayerRequest>;
  markHandled(id: string): Promise<PrayerRequest | null>;
  remove(id: string): Promise<boolean>;
}

export interface AdminProfileRepository {
  findById(id: string): Promise<AdminProfile | null>;
  findByUsername(username: string): Promise<AdminProfile | null>;
  upsert(data: {
    id: string;
    username: string;
    displayName?: string | null;
    /**
     * `PersistedAdminRole` et non `AdminRole` : le schéma ne connaît plus
     * `ROLE_ADMIN`, et un enum PostgreSQL à valeur inexistante refuse
     * l'écriture (cf. `docs/028` D-01, D-05).
     */
    role: PersistedAdminRole;
    /** D-02 : `GLOBAL` pour un rôle système, `DEPARTMENT` pour un responsable. */
    scope: AdminScope;
    /** D-02 : un seul département, et seulement pour un `DEPARTMENT_MANAGER`. */
    departmentId?: string | null;
  }): Promise<AdminProfile>;
  list(): Promise<AdminProfile[]>;
}
