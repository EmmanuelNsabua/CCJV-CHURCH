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

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate: string; // date ISO "YYYY-MM-DD"
  eventTime?: string; // heure "HH:mm" ou placeholder
  location?: string;
  imageUrl?: string;
  /** `null` = événement général de l'église. */
  departmentId?: string | null;
  status: EventStatus;
  /** Accroche éditoriale (liste / fiche). */
  excerpt?: string;
  /** Bandeau de la fiche événement. */
  bannerImage?: string;
  /** Galerie de la fiche événement. */
  gallery?: string[];
  /** Informations pratiques complémentaires. */
  practicalInfo?: string[];
}

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
  /** Auteur / orateur. */
  author?: string;
  /** Corps éditorial (publications de type TEXTE). */
  body?: string[];
}

export type PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT";

export interface StaticPage {
  id: string;
  pageKey: PageKey;
  content: string;
}
