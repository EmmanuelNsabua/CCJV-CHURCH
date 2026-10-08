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
 * Cycle de vie d'une publication **tel que la base le porte aujourd'hui**.
 *
 * ⚠️ Les deux valeurs ci-dessous décrivent l'**état présent** de l'énumération
 * PostgreSQL `publication_status`. `docs/032` §3.2 en fixe **trois** : la valeur
 * `'ARCHIVED'` s'ajoute par `ALTER TYPE … ADD VALUE` (D-18), et cette migration
 * appartient au Lot 4 — la même opération que `docs/033` §2.3.2 décrit pour
 * `admin_role`, à ceci près qu'aucune valeur n'est retirée.
 *
 * Tant que la migration n'est pas appliquée, la valeur n'existe pas en base :
 * l'écrire ici élargirait le type au-delà de ce que PostgreSQL accepte, et
 * l'erreur ne se produirait qu'à l'exécution. La policy juge en revanche une
 * cible **future** — elle doit donc déjà connaître `ARCHIVED`
 * (`publication.policy.ts`, `PublicationLifecycleState`).
 */
export type PublicationStatus = "DRAFT" | "PUBLISHED";

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
/*  Pagination                                                                */
/* -------------------------------------------------------------------------- */

export interface Page<T> {
  items: T[];
  total: number;
}
