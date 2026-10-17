/**
 * Modèle de données du domaine public CCJV.
 * Aligné sur docs/006 (modélisation) et le futur contrat API REST `/api/v1/*`.
 *
 * Les champs éditoriaux optionnels (bannerImage, meetingSchedule, keyPoints,
 * gallery) alimentent les fiches détaillées et restent compatibles avec une
 * future table `content` côté back-office.
 */

export type PublicationType = "VIDEO" | "PHOTO" | "TEXTE";

/**
 * État d'un événement, CALCULÉ depuis `eventDate` — jamais persisté.
 * (docs/006 : le champ `is_archived` a été supprimé du modèle.)
 */
export type EventStatus = "UPCOMING" | "ARCHIVED";

export type EventLifecycleStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

export interface DepartmentActivityItem {
  id: string;
  title: string;
  description?: string | null;
  imageMediaId?: string | null;
  imageUrl?: string | null;
  position?: number;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
  mission?: string | null;
  history?: string | null;
  activities?: DepartmentActivityItem[];
  responsibleName?: string;
  /** Image d'en-tête de la fiche département. */
  bannerImage?: string;
  /** Rythme de rencontre (ex. « Vendredi · 17:00 — Répétition générale »). */
  meetingSchedule?: string;
  /** Piliers / valeurs mis en avant sur la fiche. */
  keyPoints?: string[];
  /** Galerie photographique réelle. */
  gallery?: string[];
  /** Accroche courte affichée dans les listes. */
  tagline?: string;
  /** Verset d'ancrage biblique du département. */
  verse?: {
    text: string;
    reference: string;
  };
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate: string; // date ISO "YYYY-MM-DD"
  startDate?: string; // alias date début
  endDate?: string; // date fin obligatoire en base (>= startDate)
  eventTime?: string; // heure "HH:mm" ou placeholder
  startTime?: string | null;
  endTime?: string | null;
  location?: string;
  imageUrl?: string;
  imageMediaId?: string | null;
  bannerMediaId?: string | null;
  /** `null` = événement général de l'église (aucun département obligatoire). */
  departmentId?: string | null;
  status: EventStatus | EventLifecycleStatus;
  lifecycleStatus?: EventLifecycleStatus;
  /** Accroche éditoriale (liste / fiche). */
  excerpt?: string;
  /** Bandeau de la fiche événement. */
  bannerImage?: string;
  /** Galerie de la fiche événement. */
  gallery?: string[];
  /** Informations pratiques complémentaires. */
  practicalInfo?: string[];
}

export type PublicationAuthor = "Presse" | "Ecodume";

export interface Publication {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  /** Lien vidéo externe (YouTube/Facebook) ou chemin image. */
  contentUrl?: string;
  description?: string;
  publishedAt: string; // date ISO "YYYY-MM-DD"
  /** Rubrique éditoriale : actualité, enseignement, média, ressource. */
  category?: "ACTUALITE" | "ENSEIGNEMENT" | "MEDIA" | "RESSOURCE";
  /** Auteur éditorial : Presse ou Ecodume */
  author?: PublicationAuthor | string;
  /** Corps éditorial (publications de type TEXTE). */
  body?: string[];
}

export interface Resource {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  file: string; // URL directe ou référence stable au PDF Supabase Storage
  createdAt?: string;
  updatedAt?: string;
}

export type PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT";

export interface StaticPage {
  id: string;
  pageKey: PageKey;
  content: string;
}
