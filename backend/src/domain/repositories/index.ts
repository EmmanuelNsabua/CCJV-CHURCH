import type {
  AdminProfile,
  AdminScope,
  CommunityFace,
  Department,
  DepartmentActivity,
  DepartmentArchive,
  Event,
  EventStatus,
  Leader,
  MediaAccess,
  MediaAccessRights,
  MediaAsset,
  MediaGranteeType,
  Notification,
  NotificationType,
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
  TestimonyStatus,
  Teaching,
  BiblicalReference,
  TeachingMedia,
  TeachingStatus,
  TeachingMediaRole,
  EventLifecycleStatus,
  Resource,
} from "@/domain/entities";
import type { DepartmentCapability, EventVisibilityScope } from "@/domain/departments/capabilities";

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

export interface DepartmentActivityInput {
  id?: string;
  title: string;
  description?: string | null;
  imageMediaId?: string | null;
  position?: number;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
  mission?: string | null;
  history?: string | null;
  responsibleName?: string | null;
  tagline?: string | null;
  meetingSchedule?: string | null;
  keyPoints?: string[] | null;
  bannerMediaId?: string | null;
  galleryMediaIds?: string[];
  activities?: DepartmentActivityInput[];
  position?: number;
}

export interface EventInput {
  title: string;
  description?: string | null;
  excerpt?: string | null;
  /** Date de début (alias eventDate). */
  startDate?: string;
  eventDate: string;
  /** Date de fin obligatoire, >= startDate. */
  endDate?: string;
  /** Heure de début facultative (alias eventTime). */
  startTime?: string | null;
  eventTime?: string | null;
  /** Heure de fin facultative et indépendante. */
  endTime?: string | null;
  location?: string | null;
  imageMediaId?: string | null;
  bannerMediaId?: string | null;
  /** Statut éditorial (DRAFT, PUBLISHED, CANCELLED). */
  status?: EventLifecycleStatus;
  /** Département facultatif (aucun département organisateur requis). */
  departmentId?: string | null;
  visibilityScope?: EventVisibilityScope;
  practicalInfo?: string[] | null;
  galleryMediaIds?: string[];
}

export interface EventFilters {
  status?: EventStatus | EventLifecycleStatus;
  lifecycleStatus?: EventLifecycleStatus;
  departmentId?: string;
  /** Borne de comparaison pour le statut, injectable pour les tests. */
  today?: string;
  /** Vues calculées : 'UPCOMING' (fin >= today) ou 'ARCHIVED' (fin < today). */
  view?: "UPCOMING" | "ARCHIVED" | "ALL";
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
  /**
   * Département **responsable**, obligatoire (D-02, D-06).
   *
   * La règle des 3 étant globale (`docs/035` §1), ce champ n'entre pas dans le
   * quota — mais il détermine **qui peut modifier** la publication (égalité
   * départementale de `PublicationPolicy`) et ce que voit un responsable.
   */
  departmentId: string;
  /**
   * Date d'archivage : **jamais fournie par un client**.
   *
   * Elle est écrite par la règle des 3, dans la transaction qui archive
   * (`docs/035` §1). Elle figure dans l'entrée parce que le service l'écrit après
   * avoir lu l'état courant sous verrou — pas parce qu'une requête HTTP pourrait
   * la proposer.
   */
  archivedAt?: Date | null;
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
  photoMediaId?: string | null;
  departmentId?: string | null;
  position?: number;
}

export interface TestimonyInput {
  content?: string;
  quote?: string;
  authorName?: string | null;
  personName?: string;
  isAnonymous?: boolean;
  status?: TestimonyStatus;
  isFeatured?: boolean;
  photoMediaId?: string | null;
  consentedAt?: Date | null;
  publishedAt?: Date | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  adminNotes?: string | null;
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
  days?: string[] | null;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  timeLabel: string;
  timeZone?: string | null;
  audience?: string | null;
  isConfirmed?: boolean;
  position?: number;
}

export interface SocialLinkInput {
  platform?: string | null;
  label: string;
  href: string;
  isActive?: boolean;
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
  archiveAndDelete(
    id: string,
    options: { archivedBy?: string | null; reason?: string | null },
  ): Promise<DepartmentArchive>;
  /**
   * Archives conservées des départements supprimés.
   *
   * Lecture seule et paginée : la table grandit à chaque suppression et
   * contient des instantanés complets, donc jamais de lecture « tout » .
   */
  listArchives(options: ListOptions): Promise<ListResult<DepartmentArchive>>;
  remove(id: string): Promise<boolean>;
  listActivities(departmentId: string): Promise<DepartmentActivity[]>;
  saveActivities(
    departmentId: string,
    activities: DepartmentActivityInput[],
  ): Promise<DepartmentActivity[]>;
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
  publish(id: string): Promise<Event | null>;
  revertToDraft(id: string): Promise<Event | null>;
  cancel(id: string): Promise<Event | null>;
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
  publish(id: string, publishedAt?: string): Promise<Publication | null>;
  revertToDraft(id: string): Promise<Publication | null>;
  remove(id: string): Promise<boolean>;
  listFeatured(limit?: number): Promise<Publication[]>;
  listArchives(options: ListOptions): Promise<ListResult<Publication>>;
  /** Publie ou archive : une écriture **en attente**, jamais saisie par un client. */
  applyLifecycle(
    id: string,
    change: { status: "PUBLISHED" | "ARCHIVED"; at: Date },
  ): Promise<Publication | null>;
  publishWithQuota(id: string, publishedAt: string): Promise<Publication | null>;
}

/* -------------------------------------------------------------------------- */
/*  Ressources                                                                */
/* -------------------------------------------------------------------------- */

export interface ResourceInput {
  name: string;
  description?: string | null;
  file: string;
}

export interface ResourceFilters {
  search?: string;
}

export interface ResourceRepository {
  list(options: ListOptions, filters?: ResourceFilters): Promise<ListResult<Resource>>;
  findById(id: string): Promise<Resource | null>;
  findBySlug(slug: string): Promise<Resource | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  create(data: ResourceInput, slug: string): Promise<Resource>;
  update(id: string, data: Partial<ResourceInput>): Promise<Resource | null>;
  replaceFile(id: string, file: string): Promise<Resource | null>;
  remove(id: string): Promise<boolean>;
}

export interface LeaderRepository {
  list(options: ListOptions): Promise<ListResult<Leader>>;
  listByDepartment(departmentId: string): Promise<Leader[]>;
  findById(id: string): Promise<Leader | null>;
  create(data: LeaderInput): Promise<Leader>;
  update(id: string, data: Partial<LeaderInput>): Promise<Leader | null>;
  remove(id: string): Promise<boolean>;
}

export interface TestimonyFilters {
  status?: TestimonyStatus;
  isFeatured?: boolean;
}

export interface TestimonyRepository {
  list(options: ListOptions, filters?: TestimonyFilters): Promise<ListResult<Testimony>>;
  listPublic(options: ListOptions): Promise<ListResult<Testimony>>;
  listHeroFeatured(limit?: number): Promise<Testimony[]>;
  findById(id: string): Promise<Testimony | null>;
  create(data: TestimonyInput): Promise<Testimony>;
  update(id: string, data: Partial<TestimonyInput>): Promise<Testimony | null>;
  updateStatus(
    id: string,
    status: TestimonyStatus,
    meta?: { reviewedBy?: string | null; reviewedAt?: Date; adminNotes?: string | null },
  ): Promise<Testimony | null>;
  setFeatured(id: string, isFeatured: boolean): Promise<Testimony | null>;
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

/**
 * Droits d'accès aux médias (`docs/028` D-21, D-22, `docs/032` §3.4).
 *
 * Contrat **séparé** de `MediaRepository`, et la séparation porte une décision :
 * un média n'appartient à personne (X27 : pas de `media.department_id`), son
 * accès est une **autorisation explicite**. Ranger les droits dans le même
 * contrat que le média laisserait croire qu'ils sont un attribut du fichier —
 * c'est-à-dire exactement le rattachement que D-22 interdit.
 *
 * Aucune méthode n'accorde quoi que ce soit « par défaut » : `grant` est un acte
 * délibéré, et il n'existe aucun chemin qui créerait une ligne de droits au
 * moment du téléversement (XD-09).
 */
export interface MediaAccessRepository {
  /** Droits d'un média, tous destinataires confondus. */
  listForMedia(mediaId: string): Promise<MediaAccess[]>;

  /**
   * Droits de **plusieurs** médias en une requête.
   *
   * Existe pour un cas réel et non par anticipation : la lecture du registre
   * (cellule 5.2) rend une **collection**, et la policy doit savoir, média par
   * média, ce que l'acteur a le droit d'y voir. Une requête par média ferait un
   * N+1 sur une page de vingt.
   */
  listForMediaIds(mediaIds: readonly string[]): Promise<Map<string, MediaAccess[]>>;

  /** La ligne de droits d'un couple (média, destinataire), ou `null`. */
  findFor(
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
  ): Promise<MediaAccess | null>;

  /**
   * Accorde des droits. Échoue si le couple existe déjà — l'unicité est garantie
   * par la base (deux index uniques partiels), et un `ON CONFLICT` masquerait une
   * double intention plutôt que de la signaler.
   */
  grant(data: {
    mediaId: string;
    granteeType: MediaGranteeType;
    granteeId: string;
    rights: MediaAccessRights;
    grantedBy: string;
  }): Promise<MediaAccess>;

  /**
   * Réécrit les trois droits d'une ligne existante.
   *
   * `updatedAt` est écrit par le repository : la base porte
   * `CHECK (updated_at >= granted_at)`, et une horloge fournie par l'appelant
   * pourrait la violer.
   */
  updateRights(
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
    rights: MediaAccessRights,
  ): Promise<MediaAccess | null>;

  /** Retire tous les droits d'un destinataire (action `REVOKE`, `docs/029` §2.6). */
  revoke(
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
  ): Promise<boolean>;
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

/**
 * Notifications (`docs/032` §3.3).
 *
 * Contrat **étroit** : lire sa boîte, marquer comme lue, créer. Il n'existe
 * volontairement **aucune** méthode de suppression : la rétention des
 * notifications n'est tranchée nulle part (`docs/029` Q-17), et
 * `NotificationPolicy.DELETE` refuse tout le monde. Une méthode absente ne peut
 * pas être appelée par erreur.
 *
 * `listForRecipient` prend le destinataire en **paramètre obligatoire**, jamais
 * une option : une lecture de notifications sans destinataire serait une lecture
 * de toutes les notifications, c'est-à-dire une fuite entre administrateurs. Le
 * contrat rend cet oubli impossible plutôt que de compter sur la vigilance.
 */
export interface NotificationRepository {
  /** Boîte de réception d'**un** administrateur, les plus récentes d'abord. */
  listForRecipient(
    recipientUserId: string,
    options: ListOptions,
    filters: { unreadOnly?: boolean },
  ): Promise<ListResult<Notification>>;

  findById(id: string): Promise<Notification | null>;

  /** Nombre de notifications non lues — indicateur de boîte de réception. */
  countUnread(recipientUserId: string): Promise<number>;

  create(data: {
    recipientUserId: string;
    type: NotificationType;
    referenceId?: string | null;
  }): Promise<Notification>;

  /** Marque comme lue ; `false` si la notification n'existe pas ou l'était déjà. */
  markAsRead(id: string): Promise<Notification | null>;
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

  /**
   * Réécrit **l'habilitation** d'un profil existant : rôle, scope, rattachement.
   *
   * Opération distincte d'`upsert`, et la séparation est structurante. `upsert`
   * crée ou remplace un profil à partir d'un identifiant fourni par l'appelant —
   * c'est l'amorçage, un acte d'exploitation. Ici, il s'agit de **redistribuer
   * un pouvoir** sur un compte qui existe déjà, ce que `docs/029` cellule 1.5
   * réserve au `SUPER_ADMIN` (l'`ADMIN` y est en `?` Q-02, donc refusé).
   *
   * La cohérence rôle ↔ scope ↔ département n'est pas vérifiée ici : elle est
   * portée par la contrainte `admin_profiles_scope_coherence` (`docs/032` §3.1),
   * que la base applique à l'écriture. Le service la vérifie **avant** pour
   * rendre un refus lisible, mais c'est la base qui garantit.
   *
   * Renvoie `null` si le profil n'existe pas — jamais une erreur : l'appelant
   * décide si l'absence est un `404` (une route) ou un cas normal (un script).
   */
  updateAuthorization(
    id: string,
    data: { role: PersistedAdminRole; scope: AdminScope; departmentId?: string | null },
  ): Promise<AdminProfile | null>;

  /**
   * Active ou désactive un profil. `null` si le profil n'existe pas.
   *
   * Ne touche **pas** au rôle ni au périmètre : `docs/028` D-03 distingue la
   * révocation d'accès de la gestion des habilitations, et confondre les deux
   * ferait perdre l'habilitation au moment précis où l'on veut seulement couper
   * l'accès — au point qu'une réactivation ne saurait plus quel rôle rendre.
   */
  setActive(id: string, isActive: boolean): Promise<AdminProfile | null>;

  /**
   * Réécrit l'identité **applicative** d'un profil : nom d'utilisateur, nom
   * affiché.
   *
   * À ne pas confondre avec `updateAuthorization` (qui redistribue un pouvoir)
   * ni avec l'adresse de connexion (qui appartient au fournisseur d'identité).
   * Corriger un libellé ne doit pas exiger la permission de changer un rôle, et
   * inversement.
   *
   * `undefined` laisse le champ tel quel ; `null` efface explicitement le nom
   * affiché. Renvoie `null` si le profil n'existe pas.
   */
  updateProfile(
    id: string,
    data: { username?: string; displayName?: string | null },
  ): Promise<AdminProfile | null>;

  /**
   * Supprime **physiquement** un profil (`SUPER_ADMIN` uniquement).
   *
   * `false` si le profil n'existait pas. Une suppression retenue par une
   * référence — `media_access.granted_by` est en `RESTRICT` — remonte comme un
   * **conflit métier** (`409`), jamais comme une panne : l'appelant peut alors
   * expliquer quoi faire.
   */
  remove(id: string): Promise<boolean>;
}

/* -------------------------------------------------------------------------- */
/*  Enseignements (TeachingRepository)                                        */
/* -------------------------------------------------------------------------- */

export interface CreateTeachingInput {
  title: string;
  slug?: string | null;
  speakerName: string;
  preachedAt: string;
  summary?: string | null;
  description?: string | null;
  status?: TeachingStatus;
}

export interface UpdateTeachingInput {
  title?: string;
  slug?: string | null;
  speakerName?: string;
  preachedAt?: string;
  summary?: string | null;
  description?: string | null;
  status?: TeachingStatus;
}

export interface BiblicalReferenceInput {
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
  position?: number;
}

export interface TeachingMediaInput {
  mediaId: string;
  role: TeachingMediaRole;
  isPrimary?: boolean;
  position?: number;
}

export interface TeachingFilter {
  status?: TeachingStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TeachingRepository {
  findById(id: string): Promise<Teaching | null>;
  findBySlug(slug: string): Promise<Teaching | null>;
  /**
   * Un slug est-il déjà utilisé ?
   *
   * `exceptId` exclut la ligne en cours de mise à jour. `teachings.slug` n'est
   * pas unique en base (deux enseignements peuvent porter le même titre) : le
   * service est donc seul garant de l'unicité de l'**adresse**.
   */
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  list(filter?: TeachingFilter): Promise<{ items: Teaching[]; total: number }>;
  create(data: CreateTeachingInput): Promise<Teaching>;
  update(id: string, data: UpdateTeachingInput): Promise<Teaching>;
  updateBiblicalReferences(
    teachingId: string,
    references: BiblicalReferenceInput[],
  ): Promise<BiblicalReference[]>;
  updateMedias(
    teachingId: string,
    medias: TeachingMediaInput[],
  ): Promise<TeachingMedia[]>;
  publish(id: string, publishedAt: Date): Promise<Teaching>;
  archive(id: string): Promise<Teaching>;
  delete(id: string): Promise<boolean>;
}

