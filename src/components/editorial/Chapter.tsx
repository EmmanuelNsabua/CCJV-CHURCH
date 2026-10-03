import Image from "next/image";
import { cn } from "@/lib/utils";
import { PullQuote } from "./PullQuote";

/**
 * Chapitre narratif.
 *
 * Le récit se déplie en chapitres numérotés, la photographie change de côté à
 * chaque occurrence (`side`), ce qui installe un rythme de lecture au lieu d'une
 * succession de blocs identiques.
 */
export interface ChapterProps {
  index: number;
  title: string;
  paragraphs: readonly string[];
  image?: string;
  imageCaption?: string;
  /** Côté de la photographie. Alterner d'un chapitre à l'autre. */
  side?: "left" | "right";
  quote?: { text: string; attribution?: string };
  className?: string;
}

export function Chapter({
  index,
  title,
  paragraphs,
  image,
  imageCaption,
  side = "right",
  quote,
  className,
}: ChapterProps) {
  const imageFirst = side === "left" && Boolean(image);

  return (
    <article
      className={cn(
        "grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14",
        className,
      )}
    >
      {imageFirst && (
        <figure className="lg:col-span-5">
          <ChapterImage src={image as string} caption={imageCaption} />
        </figure>
      )}

      <div className={cn(image ? "lg:col-span-7" : "lg:col-span-8 lg:col-start-4")}>
        <div className="flex items-baseline gap-5">
          <span
            className="font-serif text-[1.5rem] leading-none text-ccjv-green"
            aria-hidden="true"
          >
            {String(index).padStart(2, "0")}
          </span>
          <span className="h-px flex-1 bg-ccjv-line" aria-hidden="true" />
        </div>

        <h3 className="mt-6 font-serif text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.15]">
          {title}
        </h3>

        <div className="prose-body mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-ccjv-ink-secondary">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        {quote && (
          <PullQuote
            text={quote.text}
            attribution={quote.attribution}
            align="marginal"
            className="mt-8 max-w-[52ch]"
          />
        )}
      </div>

      {!imageFirst && image && (
        <figure className="lg:col-span-5">
          <ChapterImage src={image} caption={imageCaption} />
        </figure>
      )}
    </article>
  );
}

function ChapterImage({ src, caption }: { src: string; caption?: string }) {
  return (
    <>
      <div className="relative aspect-4/5 overflow-hidden bg-ccjv-line">
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 38vw"
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] leading-relaxed text-ccjv-ink-secondary">
          {caption}
        </figcaption>
      )}
    </>
  );
}
