/**
 * Entités du domaine CCJV.
 *
 * Ces types sont **indépendants de toute infrastructure** : ils n'importent ni
 * Drizzle, ni Express, ni Supabase (`docs/004` §8). Les repositories traduisent
 * les lignes SQL vers ces formes ; la présentation les sérialise vers l'API.
 *
 * Leur forme est délibérément alignée sur `src/types/index.ts` du frontend :
 * c'est le contrat existant, il est implémenté et ne doit pas être cassé.
 * Une seule différence structurelle : les entités portent des **identifiants de
 * média** en interne, et l'API expose des **URL** — la conversion est faite par
 * la couche présentation (docs/018 §4.5).
 */

/* -------------------------------------------------------------------------- */
/*  État calculé d'un événement                                               */
/* -------------------------------------------------------------------------- */

/**
 * Jamais persisté (`docs/006` §5). Calculé depuis `eventDate` :
 * `UPCOMING` si la date est aujourd'hui ou plus tard, sinon `ARCHIVED`.
 */
export type EventStatus = "UPCOMING" | "ARCHIVED";

export type PublicationType = "VIDEO" | "PHOTO" | "TEXTE";
export type PublicationCategory =
  | "ACTUALITE"
  | "ENSEIGNEMENT"
  | "MEDIA"
  | "RESSOURCE";
/**
 * Cycle de vie d'une publication (D-18, D-20, `docs/032` §3.2).
 *
 * **Trois états, et non deux.** `ARCHIVED` est un état **métier persistant**, pas
 * un filtre d'affichage ni une suppression : c'est ce que la règle globale des 3
 * (`docs/035`) produit lorsqu'une quatrième publication paraît — la plus ancienne
 * est archivée **définitivement**. La transition `ARCHIVED → PUBLISHED` **n'existe
 * pas** (D-18, XD-14), et aucune valeur ne doit jamais être retirée de
 * l'énumération PostgreSQL.
 *
 * Le type décrit désormais exactement ce que porte la base : l'énumération a été
 * étendue par la migration 0007 (`ADD VALUE 'ARCHIVED'`), ce qui lève la
 * distinction transitoire qui existait entre ce que le schéma acceptait et ce que
 * le domaine jugeait.
 */
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Alias historique, conservé pour les lecteurs qui l'importent.
 *
 * Les deux types ont **convergé** : l'énumération PostgreSQL porte les trois états,
 * il n'y a donc plus lieu de distinguer « ce qui est écrivable maintenant » de « ce
 * que la règle juge ». Garder l'alias évite de toucher une dizaine d'imports pour un
 * renommage sans contenu ; le supprimer serait un nettoyage cosmétique à faire lors
 * d'une prochaine revue, pas une correction.
 */
export type PublicationLifecycleState = PublicationStatus;

/**
 * Rôle technique d'un profil (`docs/028` D-01).
 *
 * Trois rôles arrêtés, et **aucun rôle de département** : « Responsable »
 * d'un département et « Responsable » d'un autre sont deux **instances** de
 * `DEPARTMENT_MANAGER`, différenciées par leur `department_id` (D-02). Le RBAC
 * ne code donc **jamais** le nom d'un département (`docs/028` D-09, XD-06,
 * invariant I12 de `021` §11).
 *
 * ⚠️ **`ROLE_ADMIN` a disparu.** La valeur unique de l'implémentation V1 n'existe
 * plus ni ici, ni dans l'énumération PostgreSQL `admin_role` (Lot 1a, D-05 : le
 * compte de production devient `ADMIN`). Elle a survécu une itération comme
 * **membre transitoire** de cette union, le temps que les routes cessent de la
 * réclamer ; le Lot 1c les a toutes converties à la chaîne
 * `requireAuthenticatedAdmin` + `authorize(Policy, ACTION)`, et le membre est
 * parti avec elles. Le laisser aurait maintenu un rôle que la base refuse
 * d'écrire — un type qui ment sur ce qui est persistable.
 */
export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_MANAGER";

/**
 * Rôles **persistables** : ceux que l'énumération PostgreSQL `admin_role`
 * accepte réellement.
 *
 * Depuis la disparition de `ROLE_ADMIN`, cet alias désigne exactement
 * `AdminRole`. Il est **conservé** parce qu'il nomme une distinction qui, elle,
 * demeure : un type de rôle *métier* et un type de rôle *écrivable* ne sont pas
 * la même promesse, et le jour où l'un des deux bougerait, c'est ici que la
 * divergence devrait s'exprimer — plutôt que dans les vingt fichiers qui
 * importent aujourd'hui `PersistedAdminRole` pour écrire en base.
 */
export type PersistedAdminRole = AdminRole;

/**
 * Périmètre d'action d'un profil (`admin_scope`, `docs/028` D-02, `docs/032` §2.1).
 *
 * **Deux valeurs, jamais trois.** `docs/032` §2.1 est normatif : « `PRIVATE` est
 * un périmètre de **ressource**, jamais un scope de profil ». Le périmètre privé
 * des demandes de prière (D-03, D-10) n'est donc **pas** déclaré ici : il est
 * porté par la ressource et décidé par `PrayerPolicy`. L'inscrire sur le profil
 * ferait dépendre le refus opposé au `SUPER_ADMIN` d'une donnée modifiable en
 * base, alors que D-03 exige une garantie **cryptographique**.
 */
export type AdminScope = "GLOBAL" | "DEPARTMENT";

export type PrayerConfidentiality = "private" | "community";
export type PrayerStatus = "NEW" | "PRAYED";

/**
 * Portée **publique** d'un événement (`docs/028` D-26, `docs/032` §3.2).
 *
 * Déclarée ici, avec l'entité qu'elle qualifie — et non dans le vocabulaire des
 * capacités de département : `capabilities.ts` importe déjà `Department`, donc
 * l'importer en retour fermerait un cycle de modules. La valeur et la règle qui la
 * décide sont deux choses distinctes, et elles vivent là où chacune sert.
 */
export type EventVisibilityScope = "DEPARTMENT" | "GLOBAL";

/* -------------------------------------------------------------------------- */
/*  Médias                                                                    */
/* -------------------------------------------------------------------------- */

export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  uploadedBy: string | null;
  createdAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Droits d'accès aux médias                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Les **trois droits indépendants** d'un accès média (`docs/028` D-21, `docs/032`
 * §3.4).
 *
 * Ils sont trois, et **aucun ne se déduit d'un autre** : « pas de hiérarchie
 * `DELETE ⊃ MANAGE ⊃ USE`» (D-21). Le système teste donc **explicitement** la
 * permission demandée, et le schéma le garantit de son côté avec trois colonnes
 * booléennes indépendantes — « aucun drapeau agrégé, aucun niveau, aucun
 * ordinal ».
 *
 * Ce type vit dans le domaine et non dans la policy : la persistance, le service
 * et la policy jugent les **mêmes** droits, et deux déclarations jumelles
 * finiraient par diverger — la policy autoriserait ce que le repository refuse.
 */
export interface MediaAccessRights {
  canUse: boolean;
  canManage: boolean;
  canDelete: boolean;
}

/** Type de destinataire d'un accès média (`docs/032` §3.2, `media_grantee_type`). */
export type MediaGranteeType = "DEPARTMENT" | "ADMIN_PROFILE";

/**
 * Ligne de droits d'accès (`public.media_access`, `docs/032` §3.4).
 *
 * `granteeId` désigne **un département ou un profil** selon `granteeType` : la
 * colonne est polymorphe et n'a **aucune clé étrangère** — une FK conditionnelle
 * n'existe pas en SQL. L'intégrité de la cible est portée par un trigger
 * PostgreSQL (`media_access_check_grantee`) que `docs/033` M-H1 crée avec la
 * table ; `docs/033` R-NT1 signale honnêtement que ce trigger reste
 * « contournable par désactivation », et laisse la question ouverte.
 *
 * `grantedBy` n'est pas décoratif : `docs/029` §2.6 en fait la **preuve de qui a
 * autorisé quoi**. La FK est en `RESTRICT` — supprimer l'auteur d'un grant est
 * refusé tant que le grant subsiste, sinon l'autorisation deviendrait
 * inattribuable.
 */
export interface MediaAccess extends MediaAccessRights {
  id: string;
  mediaId: string;
  granteeType: MediaGranteeType;
  granteeId: string;
  grantedBy: string;
  grantedAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Départements et événements                                                */
/* -------------------------------------------------------------------------- */

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  responsibleName: string | null;
  tagline: string | null;
  meetingSchedule: string | null;
  keyPoints: string[] | null;
  bannerMediaId: string | null;
  /** URL publique résolue, exposée par l'API (le frontend attend `bannerImage`). */
  bannerImageUrl: string | null;
  galleryUrls: string[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  /** Date ISO `YYYY-MM-DD` — jamais un objet `Date` (pas de décalage de fuseau). */
  eventDate: string;
  /** Heure `HH:MM:SS` ou `HH:MM`. */
  eventTime: string | null;
  location: string | null;
  imageMediaId: string | null;
  bannerMediaId: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  galleryUrls: string[];
  /** Département **responsable** : non nul (D-26, XD-15). */
  departmentId: string;
  /** **Qui est concerné** — distinct du département responsable (D-26). */
  visibilityScope: EventVisibilityScope;
  practicalInfo: string[] | null;
  /** Calculé, jamais stocké. */
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Publications                                                              */
/* -------------------------------------------------------------------------- */

export interface Publication {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  category: PublicationCategory;
  status: PublicationStatus;
  contentUrl: string | null;
  /** URL du média de couverture résolue, si un média est associé. */
  coverImageUrl: string | null;
  description: string | null;
  body: string[] | null;
  author: string | null;
  publishedAt: string;
  /** Département **responsable** (D-02, D-06) — non nul. */
  departmentId: string;
  /** Date d'archivage : renseignée par la règle des 3, sinon `null` (D-18). */
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Personnes                                                                 */
/* -------------------------------------------------------------------------- */

export interface Leader {
  id: string;
  name: string;
  role: string;
  scope: string | null;
  bio: string | null;
  photoMediaId: string | null;
  photoUrl: string | null;
  departmentId: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimony {
  id: string;
  quote: string;
  personName: string;
  personRole: string | null;
  photoMediaId: string | null;
  photoUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityFace {
  id: string;
  personName: string;
  caption: string;
  photoMediaId: string | null;
  photoUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
  /**
   * Périmètre du rôle (D-02). `GLOBAL` pour `SUPER_ADMIN` et `ADMIN`,
   * `DEPARTMENT` pour un `DEPARTMENT_MANAGER`.
   *
   * Les policies le lisent comme un **fait** : `docs/029` §4.3 en fait l'une des
   * quatre clauses de la décision, à côté du rôle, de l'égalité départementale
   * et des règles de ressource. La cohérence rôle ↔ scope ↔ département est
   * garantie en base par `admin_profiles_scope_coherence` (`docs/032` §3.1), et
   * non par une vérification applicative qui pourrait être contournée.
   */
  scope: AdminScope;
  /** Département de rattachement (D-02) : non nul si et seulement si `scope = DEPARTMENT`. */
  departmentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Contenu éditable                                                          */
/* -------------------------------------------------------------------------- */

export interface StaticPage {
  id: string;
  pageKey: string;
  content: Record<string, unknown>;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scripture {
  id: string;
  key: string;
  text: string;
  reference: string;
  translation: string;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleEntry {
  id: string;
  day: string;
  title: string;
  timeLabel: string;
  audience: string | null;
  isConfirmed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSetting {
  key: string;
  value: string;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Demandes de prière                                                        */
/* -------------------------------------------------------------------------- */

export interface PrayerRequest {
  id: string;
  requestText: string;
  requesterName: string | null;
  requesterContact: string | null;
  confidentiality: PrayerConfidentiality;
  status: PrayerStatus;
  handledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Types de notification (`docs/032` §3.2, `docs/030` §6.2).
 *
 * Liste **fermée et minimale** : `docs/032` refuse d'y ajouter « une valeur
 * générique de notification métier » faute de décision. Les quatre valeurs
 * viennent toutes d'un texte — une pour le dépôt d'une demande de prière, trois
 * pour le cycle de vie des clés.
 */
export type NotificationType =
  | "PRAYER_REQUEST_RECEIVED"
  | "KEY_REGISTERED"
  | "KEY_REVOKED"
  | "RECOVERY_KEY_CHANGED";

/**
 * Notification adressée à **un** administrateur (`docs/032` §3.3).
 *
 * Ce que cette entité **ne porte pas**, et c'est structurel : aucun contenu,
 * aucun nom, aucun extrait, aucune longueur, aucune liste de destinataires.
 * `referenceId` est un identifiant, jamais un fragment de texte — la table ne
 * possède même pas les colonnes qui permettraient l'inverse.
 *
 * La conséquence est visible dans le type : il n'existe aucun champ où loger une
 * donnée de prière. Une notification dit « quelque chose est arrivé », elle ne
 * dit jamais quoi.
 */
export interface Notification {
  id: string;
  /** Destinataire unique (`notifications.recipient_user_id`). */
  recipientUserId: string;
  type: NotificationType;
  /** Identifiant référencé (polymorphe, sans FK). Jamais un contenu. */
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Enseignements (Sermons / Prédications)                                    */
/* -------------------------------------------------------------------------- */

export type TeachingStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TeachingMediaRole = "VIDEO" | "AUDIO" | "THUMBNAIL";

export interface BiblicalReference {
  id: string;
  teachingId: string;
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter: number | null;
  endVerse: number | null;
  position: number;
  createdAt: Date;
}

export interface TeachingMedia {
  id: string;
  teachingId: string;
  mediaId: string;
  role: TeachingMediaRole;
  isPrimary: boolean;
  position: number;
  createdAt: Date;
  publicUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  alt?: string | null;
}

export interface Teaching {
  id: string;
  title: string;
  slug: string;
  speakerName: string;
  preachedAt: string;
  summary: string | null;
  description: string | null;
  status: TeachingStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  biblicalReferences: BiblicalReference[];
  references?: BiblicalReference[];
  medias: TeachingMedia[];
}

export type Enseignement = Teaching;

/* -------------------------------------------------------------------------- */
/*  Pagination                                                                */
/* -------------------------------------------------------------------------- */

export interface Page<T> {
  items: T[];
  total: number;
}
