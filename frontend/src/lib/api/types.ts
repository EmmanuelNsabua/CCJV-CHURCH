/**
 * Types de réponse de l'API REST CCJV (`/api/v1`).
 *
 * Principe : l'API est **déjà alignée** sur `src/types/index.ts` pour les trois
 * ressources structurantes du site (`Department`, `Event`, `Publication`). Ces
 * types sont donc réutilisés tels quels — jamais redéclarés — et ce module ne
 * contient que :
 *  - les enveloppes de transport de l'API (collection paginée, erreur) ;
 *  - les ressources qui n'existaient pas encore dans `src/types` ;
 *  - les quelques champs **additifs** que l'API expose en plus du contrat
 *    frontend (`status` et `coverImage` des publications, `position` des listes
 *    ordonnées), qui ne cassent aucun composant existant.
 */

import type {
  Department,
  DepartmentActivityItem,
  Event,
  EventLifecycleStatus,
  EventStatus,
  PageKey,
  Publication,
  PublicationAuthor,
  PublicationType,
  Resource,
} from "@/types";

export type {
  Department,
  DepartmentActivityItem,
  Event,
  EventLifecycleStatus,
  EventStatus,
  PageKey,
  Publication,
  PublicationAuthor,
  PublicationType,
  Resource,
};

/** Rubrique éditoriale d'une publication (actualité, enseignement, média, ressource). */
export type PublicationCategory = NonNullable<Publication["category"]>;

/** État de publication, visible du seul back-office (jamais exposé en lecture publique). */
export type PublicationStatus = "DRAFT" | "PUBLISHED";

/**
 * Réponse de collection de l'API (`docs/004` §34) :
 * `{ data: [], meta: { page, limit, total, totalPages } }`.
 *
 * Les endpoints acceptent aussi, par tolérance, un tableau nu : un proxy qui
 * aplatirait l'enveloppe ne doit pas vider les pages du site.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CollectionResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Corps d'erreur normalisé : `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Publication telle que l'API la renvoie : le contrat `Publication` du
 * frontend, complété des deux champs additifs du serializer serveur.
 *
 * - `status` : `DRAFT` / `PUBLISHED` — nécessaire au back-office ; la lecture
 *   publique ne renvoie jamais que des publications publiées ;
 * - `coverImage` : URL résolue du média de couverture, utile quand une
 *   publication PHOTO n'a pas de `contentUrl`.
 *
 * Ce type reste assignable à `Publication` : les composants éditoriaux
 * (`TeachingCard`, `MediaFeature`…) l'acceptent sans modification.
 */
export interface PublicationRecord extends Publication {
  status: PublicationStatus;
  coverImage?: string;
  coverMediaId?: string | null;
  departmentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Responsable / serviteur de l'église (`GET /leaders`). */
export interface Leader {
  id: string;
  name: string;
  role: string;
  /** Domaine veillé (département, service) — `null` si non renseigné. */
  scope: string | null;
  bio: string | null;
  /** URL publique du portrait — `null` si aucune photo n'est rattachée. */
  photo: string | null;
  /** `null` = responsable transversal, hors département. */
  departmentId: string | null;
  position: number;
}

/**
 * Témoignage publié (`GET /testimonies`).
 *
 * `photo` est déclarée non nulle ici : l'API la renvoie `string | null`, et
 * `getTestimonies()` **écarte** les entrées sans portrait, car un témoignage
 * s'affiche sur cette page sous la forme « visage + parole » (le composant
 * `Image` refuse une source absente).
 */
export interface Testimony {
  id: string;
  photo: string;
  quote: string;
  name: string;
  role?: string | null;
  position?: number;
}

export type TestimonyStatus = "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export interface AdminTestimony {
  id: string;
  content: string;
  quote?: string;
  authorName: string | null;
  name?: string | null;
  isAnonymous: boolean;
  status: TestimonyStatus;
  isFeatured: boolean;
  photo: string | null;
  photoMediaId?: string | null;
  consentedAt?: string | null;
  publishedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  adminNotes?: string | null;
  position?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentArchive {
  id: string;
  originalDepartmentId: string;
  name: string;
  slug: string;
  snapshot: Record<string, unknown>;
  archivedBy: string | null;
  archivedAt: string;
  reason: string | null;
}


/** Visage de la communauté (`GET /community-faces`) — même règle que `Testimony`. */
export interface CommunityFace {
  id: string;
  photo: string;
  name: string;
  caption: string;
  position?: number;
}

/** Verset éditorial (`GET /scriptures`). */
export interface Scripture {
  id: string;
  /** Clé stable consommée par le frontend (`rassemblement`, `parole`…). */
  key: string;
  text: string;
  reference: string;
  translation: string;
  context: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Entrée du rythme hebdomadaire (`GET /schedule`). */
export interface ScheduleEntry {
  id: string;
  day: string;
  days?: string[] | null;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  /** Libellé d'horaire déjà mis en forme (ex. « 16h30 – 18h30 »). */
  timeLabel: string;
  timeZone?: string | null;
  audience: string | null;
  /** Horaire confirmé par CCJV, par opposition à un horaire provisoire. */
  isConfirmed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntryInput {
  title: string;
  day?: string;
  days?: string[];
  startTime?: string | null;
  endTime?: string | null;
  timeLabel?: string;
  timeZone?: string;
  audience?: string | null;
  isConfirmed?: boolean;
  position?: number;
}

/** Lien social (`GET /social-links` ou dans `GET /settings`). */
export interface SocialLink {
  id?: string;
  platform?: string | null;
  label: string;
  href: string;
  isActive?: boolean;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialLinkInput {
  platform?: string | null;
  label: string;
  href: string;
  isActive?: boolean;
  position?: number;
}

/**
 * Réglages institutionnels (`GET /settings`) : scalaires clé/valeur de
 * `site_settings` et liste ordonnée des liens sociaux, regroupés en une seule
 * réponse par le serializer serveur.
 */
export interface SiteSettings {
  settings: Record<string, string>;
  socialLinks: SocialLink[];
}

/**
 * Page éditable du site (`GET /pages/:pageKey`).
 *
 * À ne pas confondre avec `StaticPage` de `src/types` (dont `content` est une
 * simple chaîne) : ici `content` est un objet de **champs textuels nommés**,
 * tel que le stocke le registre `domain/content/page-content.ts` du backend.
 */
export interface EditablePage {
  id: string;
  pageKey: PageKey | string;
  content: Record<string, unknown>;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_MANAGER";

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminMediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string;
  createdAt: string;
}

export interface CreatePublicationPayload {
  title: string;
  slug?: string;
  type: PublicationType;
  category?: string;
  departmentId?: string;
  author?: string;
  description?: string;
  coverMediaId?: string | null;
  coverImage?: string | null;
  contentUrl?: string;
  body?: string[];
  status?: PublicationStatus;
  publishedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Enseignements (Sermons / Prédications)                                    */
/* -------------------------------------------------------------------------- */

export type TeachingStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TeachingMediaRole = "VIDEO" | "AUDIO" | "THUMBNAIL";

/**
 * Référence biblique d'un enseignement (`GET /enseignements`).
 *
 * Reproduit `BiblicalReferenceDto` (`teaching.serializer.ts`) — **pas** la vue
 * d'administration : le serveur ne renvoie ni `teachingId`, ni `createdAt`, mais
 * une forme déjà mise en forme (`formatted`), qu'il ne faut pas recalculer.
 * Les références arrivent **triées par `position`** par le serveur.
 */
export interface BiblicalReferenceRecord {
  id: string;
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter: number | null;
  endVerse: number | null;
  position: number;
  /** Forme lisible produite par le serveur (« Jean 3:16–17 »). */
  formatted: string;
}

/**
 * Association d'un média de la bibliothèque centrale à un enseignement.
 *
 * Reproduit `TeachingMediaDto` : les champs sont **à plat** (`url`, `mimeType`),
 * le média central n'est pas imbriqué. `url` peut manquer si le fichier n'est
 * plus résolvable : un affichage ne doit jamais supposer sa présence.
 */
export interface TeachingMediaRecord {
  id: string;
  mediaId: string;
  role: TeachingMediaRole;
  isPrimary: boolean;
  position: number;
  /** URL publique du média ; absente si le fichier est introuvable. */
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  alt?: string | null;
}

/**
 * Enseignement tel que l'API publique le renvoie (`TeachingDto`).
 *
 * `slug` est nullable : la route de détail accepte indifféremment le slug ou
 * l'identifiant, un lien public doit donc prévoir la retombée sur `id`.
 */
export interface EnseignementRecord {
  id: string;
  title: string;
  slug: string | null;
  speakerName: string;
  preachedAt: string;
  summary: string | null;
  description: string | null;
  status: TeachingStatus;
  /** Date de **publication** ISO 8601 — critère de récence éditoriale. */
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  biblicalReferences: BiblicalReferenceRecord[];
  medias: TeachingMediaRecord[];
  /** Média marqué principal par le back-office, s'il existe. */
  primaryMedia?: TeachingMediaRecord;
}

export interface CreateTeachingPayload {
  title: string;
  slug?: string;
  speakerName: string;
  preachedAt: string;
  summary?: string | null;
  description?: string | null;
  status?: TeachingStatus;
}

export interface UpdateTeachingPayload {
  title?: string;
  slug?: string;
  speakerName?: string;
  preachedAt?: string;
  summary?: string | null;
  description?: string | null;
  status?: TeachingStatus;
}

export interface BiblicalReferenceInputPayload {
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
  position?: number;
}

export interface TeachingMediaInputPayload {
  mediaId: string;
  role: TeachingMediaRole;
  isPrimary?: boolean;
  position?: number;
}

/* -------------------------------------------------------------------------- */
/*  Événements & Ressources (Payloads)                                        */
/* -------------------------------------------------------------------------- */

export interface CreateEventPayload extends Record<string, unknown> {
  title: string;
  slug?: string;
  description?: string | null;
  excerpt?: string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  imageMediaId?: string | null;
  bannerMediaId?: string | null;
  status?: EventLifecycleStatus;
  departmentId?: string | null;
  visibilityScope?: "DEPARTMENT" | "GLOBAL";
  practicalInfo?: string[] | null;
  galleryMediaIds?: string[];
}

export interface UpdateEventPayload extends Record<string, unknown> {
  title?: string;
  slug?: string;
  description?: string | null;
  excerpt?: string | null;
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string;
  imageMediaId?: string | null;
  bannerMediaId?: string | null;
  status?: EventLifecycleStatus;
  departmentId?: string | null;
  visibilityScope?: "DEPARTMENT" | "GLOBAL";
  practicalInfo?: string[] | null;
  galleryMediaIds?: string[];
}

export interface CreateResourcePayload extends Record<string, unknown> {
  name: string;
  slug?: string;
  description?: string | null;
  file: string; // URL directe ou référence stable au PDF Supabase Storage
}

export interface UpdateResourcePayload extends Record<string, unknown> {
  name?: string;
  slug?: string;
  description?: string | null;
  file?: string;
}


