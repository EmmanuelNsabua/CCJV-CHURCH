import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn, formatLongDate } from "@/lib/utils";
import type { Publication, PublicationType } from "@/types";

const typeLabel: Record<PublicationType, string> = {
  VIDEO: "Vidéo",
  PHOTO: "Photo",
  TEXTE: "Texte",
};

export interface PublicationCardProps {
  publication: Publication;
  className?: string;
}

export function PublicationCard({
  publication,
  className,
}: PublicationCardProps) {
  const { type, contentUrl, title } = publication;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-none border border-ccjv-line bg-white transition-colors duration-[250ms] hover:border-ccjv-green",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ccjv-line">
        {type === "PHOTO" && contentUrl ? (
          <Image
            src={contentUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : type === "VIDEO" && contentUrl ? (
          <Link
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ccjv-black text-white"
            aria-label={`Voir la vidéo : ${title}`}
          >
            <span
              className="inline-flex h-14 w-14 items-center justify-center border border-ccjv-cream text-[1.1rem] text-ccjv-cream transition-colors duration-[250ms] group-hover:bg-ccjv-cream group-hover:text-ccjv-black"
              aria-hidden="true"
            >
              ▶
            </span>
          </Link>
        ) : type === "VIDEO" ? (
          <div className="absolute inset-0 flex cursor-default flex-col items-center justify-center gap-3 bg-ccjv-black text-white">
            <span
              className="inline-flex h-14 w-14 items-center justify-center border border-ccjv-cream text-[1.1rem] text-ccjv-cream"
              aria-hidden="true"
            >
              ▶
            </span>
            <span className="text-[0.7rem] uppercase tracking-[0.04em] opacity-70">
              Lorem ipsum dolor sit amet
            </span>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-ccjv-green-soft text-ccjv-green"
            aria-hidden="true"
          >
            <span className="font-serif text-[2.5rem]">¶</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{typeLabel[type]}</Badge>
          <time
            className="text-[0.75rem] text-ccjv-ink-secondary"
            dateTime={publication.publishedAt}
          >
            {formatLongDate(publication.publishedAt)}
          </time>
        </div>
        <h3 className="text-[1.2rem]">{title}</h3>
        {publication.description && (
          <p className="text-[0.9rem] text-ccjv-ink-secondary">
            {publication.description}
          </p>
        )}
      </div>
    </article>
  );
}
