import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Galerie narrative.
 *
 * `mosaic` compose une grille asymétrique dont la première image domine ;
 * `strip` propose un défilement horizontal avec accroche ; `columns` répartit
 * les images en colonnes de hauteurs inégales.
 *
 * À n'utiliser que lorsqu'il y a réellement plusieurs photographies à montrer.
 */
export type PhotoGalleryVariant = "mosaic" | "strip" | "columns";

export interface PhotoGalleryProps {
  images: readonly string[];
  captions?: readonly string[];
  variant?: PhotoGalleryVariant;
  className?: string;
}

export function PhotoGallery({
  images,
  captions,
  variant = "mosaic",
  className,
}: PhotoGalleryProps) {
  if (images.length === 0) return null;

  if (variant === "strip") {
    return (
      <ul
        className={cn(
          "-mx-[clamp(16px,4vw,48px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(16px,4vw,48px)] pb-4",
          className,
        )}
      >
        {images.map((src, index) => (
          <li
            key={src}
            className="w-[76vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]"
          >
            <div className="relative aspect-4/5 overflow-hidden bg-ccjv-line">
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 76vw, 30vw"
                className="object-cover"
              />
            </div>
            {captions?.[index] && (
              <p className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] text-ccjv-ink-secondary">
                {captions[index]}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "columns") {
    return (
      <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-3", className)}>
        {images.map((src, index) => (
          <figure
            key={src}
            className={cn(index % 3 === 1 && "lg:mt-12", index % 2 === 1 && "mt-6")}
          >
            <div
              className={cn(
                "relative overflow-hidden bg-ccjv-line",
                index % 3 === 0 ? "aspect-3/4" : "aspect-square",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 1024px) 45vw, 30vw"
                className="object-cover"
              />
            </div>
            {captions?.[index] && (
              <figcaption className="mt-3 font-sans text-[0.74rem] leading-relaxed text-ccjv-ink-secondary">
                {captions[index]}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    );
  }

  // mosaic — grille asymétrique, la première photographie domine
  const [lead, ...rest] = images;
  const supporting = rest.slice(0, 4);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-5 lg:grid-cols-12 lg:gap-6",
        className,
      )}
    >
      <figure className="col-span-2 lg:col-span-7 lg:row-span-2">
        <div className="relative aspect-4/3 h-full overflow-hidden bg-ccjv-line lg:aspect-auto lg:min-h-[30rem]">
          <Image
            src={lead}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        {captions?.[0] && (
          <figcaption className="mt-3 font-sans text-[0.76rem] text-ccjv-ink-secondary">
            {captions[0]}
          </figcaption>
        )}
      </figure>

      {supporting.map((src, index) => (
        <figure key={src} className="lg:col-span-5">
          <div
            className={cn(
              "relative overflow-hidden bg-ccjv-line",
              index === 0 ? "aspect-16/10" : "aspect-4/3",
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 1024px) 50vw, 35vw"
              className="object-cover"
            />
          </div>
          {captions?.[index + 1] && (
            <figcaption className="mt-3 font-sans text-[0.76rem] text-ccjv-ink-secondary">
              {captions[index + 1]}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
