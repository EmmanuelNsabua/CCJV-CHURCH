import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Photographie mise en scène, avec légende honnête.
 *
 * Six variantes de composition — la photographie CCJV ne doit plus jamais être
 * « un rectangle à droite du texte » (docs/015 §2.3).
 */
export type FeatureImageVariant =
  | "full"
  | "wide"
  | "inset"
  | "arch"
  | "portrait"
  | "float";

export interface FeatureImageProps {
  src: string;
  /** Légende factuelle. À omettre si le contenu de la photo n'est pas vérifié. */
  caption?: string;
  variant?: FeatureImageVariant;
  /** Surcharge du ratio (classes Tailwind `aspect-*`). */
  aspect?: string;
  priority?: boolean;
  className?: string;
}

const variantFrame: Record<FeatureImageVariant, string> = {
  full: "h-[62svh] min-h-[20rem] w-full",
  wide: "aspect-16/9 w-full",
  inset: "aspect-4/3 w-full",
  arch: "aspect-3/4 w-full rounded-t-full",
  portrait: "aspect-3/4 w-full",
  float: "aspect-4/5 w-full",
};

const variantWrap: Record<FeatureImageVariant, string> = {
  full: "",
  wide: "mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,48px)]",
  inset: "mx-auto w-full max-w-[42rem]",
  arch: "mx-auto w-full max-w-[20rem]",
  portrait: "mx-auto w-full max-w-[26rem]",
  float:
    "mx-auto w-full max-w-[26rem] lg:float-right lg:mx-0 lg:ml-12 lg:w-[40%] lg:max-w-none",
};

/**
 * `full` sort volontairement du container : c'est une rupture visuelle.
 * Les autres variantes restent dans une largeur maîtrisée.
 */
export function FeatureImage({
  src,
  caption,
  variant = "wide",
  aspect,
  priority = false,
  className,
}: FeatureImageProps) {
  const isFull = variant === "full";

  const figure = (
    <figure className={cn(variant === "float" && "lg:mb-6", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-ccjv-line",
          aspect ?? variantFrame[variant],
        )}
      >
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes={
            isFull
              ? "100vw"
              : variant === "float"
                ? "(max-width: 1024px) 100vw, 34vw"
                : "(max-width: 1024px) 100vw, 70vw"
          }
          className="object-cover"
        />
      </div>

      {caption && (
        <figcaption
          className={cn(
            "mt-4 flex gap-3 border-t border-ccjv-line pt-3 font-sans text-[0.78rem] leading-relaxed text-ccjv-ink-secondary",
            isFull && "mx-auto max-w-[1200px] px-[clamp(16px,4vw,48px)]",
          )}
        >
          <span
            className="mt-2 h-px w-5 shrink-0 bg-ccjv-green"
            aria-hidden="true"
          />
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );

  if (isFull) return figure;

  return <div className={variantWrap[variant]}>{figure}</div>;
}
