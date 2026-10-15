import type {
  BiblicalReference,
  Teaching,
  TeachingMedia,
} from "@/domain/entities";

export interface BiblicalReferenceDto {
  id: string;
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter: number | null;
  endVerse: number | null;
  position: number;
  formatted: string;
}

export interface TeachingMediaDto {
  id: string;
  mediaId: string;
  role: "VIDEO" | "AUDIO" | "THUMBNAIL";
  isPrimary: boolean;
  position: number;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  alt?: string | null;
}

export interface TeachingDto {
  id: string;
  title: string;
  slug: string | null;
  speakerName: string;
  preachedAt: string;
  summary: string | null;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  biblicalReferences: BiblicalReferenceDto[];
  medias: TeachingMediaDto[];
  primaryMedia?: TeachingMediaDto;
}

export function formatBiblicalReference(ref: {
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
}): string {
  const { book, startChapter, startVerse, endChapter, endVerse } = ref;

  if (endChapter && endChapter !== startChapter) {
    if (endVerse) {
      return `${book} ${startChapter}:${startVerse}–${endChapter}:${endVerse}`;
    }
    return `${book} ${startChapter}:${startVerse}–${endChapter}`;
  }

  if (endVerse && endVerse !== startVerse) {
    return `${book} ${startChapter}:${startVerse}–${endVerse}`;
  }

  return `${book} ${startChapter}:${startVerse}`;
}

export function toBiblicalReferenceDto(
  ref: BiblicalReference,
): BiblicalReferenceDto {
  return {
    id: ref.id,
    book: ref.book,
    startChapter: ref.startChapter,
    startVerse: ref.startVerse,
    endChapter: ref.endChapter,
    endVerse: ref.endVerse,
    position: ref.position,
    formatted: formatBiblicalReference(ref),
  };
}

export function toTeachingMediaDto(media: TeachingMedia): TeachingMediaDto {
  return {
    id: media.id,
    mediaId: media.mediaId,
    role: media.role,
    isPrimary: media.isPrimary,
    position: media.position,
    url: media.publicUrl,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    alt: media.alt,
  };
}

export function toTeachingDto(teaching: Teaching): TeachingDto {
  const referencesDto = teaching.biblicalReferences.map(
    toBiblicalReferenceDto,
  );
  const mediasDto = teaching.medias.map(toTeachingMediaDto);
  const primaryMedia = mediasDto.find((m) => m.isPrimary);

  return {
    id: teaching.id,
    title: teaching.title,
    slug: teaching.slug,
    speakerName: teaching.speakerName,
    preachedAt: teaching.preachedAt,
    summary: teaching.summary,
    description: teaching.description,
    status: teaching.status,
    publishedAt: teaching.publishedAt
      ? teaching.publishedAt.toISOString()
      : null,
    createdAt: teaching.createdAt.toISOString(),
    updatedAt: teaching.updatedAt.toISOString(),
    biblicalReferences: referencesDto,
    medias: mediasDto,
    primaryMedia,
  };
}
