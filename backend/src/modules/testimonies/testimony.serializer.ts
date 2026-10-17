import type { Testimony } from "@/domain/entities";

/**
 * Sérialisation `Testimony` → contrat d'API (`IMPLEMENTATION_SPEC.md` §7) :
 * `photo` ← `photoUrl`, `name` ← `personName`, `role` ← `personRole`.
 * `position` est ajouté pour l'ordonnancement depuis le back-office.
 */
export interface PublicTestimonyDto {
  id: string;
  content: string;
  quote: string;
  authorName: string | null;
  name: string | null;
  photo: string | null;
  isAnonymous: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface AdminTestimonyDto {
  id: string;
  content: string;
  quote: string;
  authorName: string | null;
  name: string | null;
  isAnonymous: boolean;
  status: string;
  isFeatured: boolean;
  photo: string | null;
  photoMediaId: string | null;
  consentedAt: string | null;
  publishedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type TestimonyDto = AdminTestimonyDto;

/**
 * Sérialisation publique stricte :
 * Si `isAnonymous` est vrai, `authorName` et `name` sont impérativement NULL.
 * La photo n'est retournée que si le témoignage est effectivement publié.
 */
export function toPublicTestimonyDto(testimony: Testimony): PublicTestimonyDto {
  const isAnonymous = testimony.isAnonymous === true;
  const isPublished = testimony.status === "PUBLISHED";
  const displayName = isAnonymous
    ? "Anonyme"
    : testimony.authorName || testimony.personName || "Anonyme";
  const textContent = testimony.content || testimony.quote || "";

  return {
    id: testimony.id,
    content: textContent,
    quote: textContent,
    authorName: isAnonymous ? null : displayName,
    name: displayName,
    photo: isPublished ? (testimony.photoUrl ?? null) : null,
    isAnonymous,
    isFeatured: testimony.isFeatured,
    publishedAt: testimony.publishedAt ? testimony.publishedAt.toISOString() : null,
    createdAt: testimony.createdAt.toISOString(),
  };
}

/**
 * Sérialisation complète pour le back-office / modération.
 */
export function toAdminTestimonyDto(testimony: Testimony): AdminTestimonyDto {
  const textContent = testimony.content || testimony.quote || "";
  const name = testimony.authorName || testimony.personName || null;

  return {
    id: testimony.id,
    content: textContent,
    quote: textContent,
    authorName: name,
    name,
    isAnonymous: testimony.isAnonymous,
    status: testimony.status,
    isFeatured: testimony.isFeatured,
    photo: testimony.photoUrl,
    photoMediaId: testimony.photoMediaId,
    consentedAt: testimony.consentedAt ? testimony.consentedAt.toISOString() : null,
    publishedAt: testimony.publishedAt ? testimony.publishedAt.toISOString() : null,
    reviewedBy: testimony.reviewedBy,
    reviewedAt: testimony.reviewedAt ? testimony.reviewedAt.toISOString() : null,
    adminNotes: testimony.adminNotes,
    position: testimony.position,
    createdAt: testimony.createdAt.toISOString(),
    updatedAt: testimony.updatedAt.toISOString(),
  };
}

export function toTestimonyDto(testimony: Testimony): AdminTestimonyDto {
  return toAdminTestimonyDto(testimony);
}
