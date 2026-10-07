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
export type PublicationStatus = "DRAFT" | "PUBLISHED";

/**
 * Rôle technique d'un profil (`docs/028` D-01).
 *
 * Trois rôles arrêtés, et **aucun rôle de département** : « Responsable Presse »
 * et « Responsable Ecodume » sont deux **instances** de `DEPARTMENT_MANAGER`,
 * différenciées par leur `department_id` (D-02).
 *
 * ⚠️ **Membre hérité, transitoire.** `ROLE_ADMIN` — la valeur unique de
 * l'implémentation V1 — a été **retirée de l'énumération PostgreSQL**
 * `admin_role` par le Lot 1a. Elle subsiste ici, et uniquement ici, parce que
 * les policies la passent encore à `requireRole`
 * (`presentation/middlewares/auth.ts` et les 16 fichiers de routes) et que les
 * tests la posent en valeur de profil — deux périmètres qui relèvent
 * respectivement des lots 1b et 1c. La retirer maintenant casserait la
 * compilation avant que ces lots ne l'aient traitée ; **elle doit disparaître
 * de cette union avec eux**. Le schéma, lui, ne la connaît plus.
 */
export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DEPARTMENT_MANAGER"
  | "ROLE_ADMIN";

/**
 * Rôles **persistables** : ceux que l'énumération PostgreSQL `admin_role`
 * accepte réellement. Écrire `ROLE_ADMIN` en base est impossible — ce type
 * l'interdit à la compilation, là où `AdminRole` le tolère encore pour les
 * besoins de la transition (cf. supra).
 */
export type PersistedAdminRole = Exclude<AdminRole, "ROLE_ADMIN">;

/**
 * Périmètre d'action d'un profil (`user_scope`, `docs/028` D-02).
 *
 * `PRIVATE` désigne le périmètre des données privées — les demandes de prière,
 * dont la lecture est refusée au `SUPER_ADMIN` (D-03, D-10).
 */
export type UserScope = "GLOBAL" | "DEPARTMENT" | "PRIVATE";

export type PrayerConfidentiality = "private" | "community";
export type PrayerStatus = "NEW" | "PRAYED";

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
  departmentId: string | null;
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
/*  Pagination                                                                */
/* -------------------------------------------------------------------------- */

export interface Page<T> {
  items: T[];
  total: number;
}
