import Image from "next/image";
import { cn } from "@/lib/utils";
import { images as defaultImages } from "@/data/mock/images";

export type VerseTone =
  | "dark"
  | "light"
  | "cream"
  | "green"
  | "offwhite"
  | "white"
  | "tinted"
  | "transparent";

export type VerseVariant =
  | "left"
  | "split"
  | "center"
  | "centered"
  | "both"
  | "flanked";

const toneClass: Record<VerseTone, string> = {
  dark: "bg-ccjv-black text-white",
  light: "bg-ccjv-offwhite text-ccjv-ink",
  offwhite: "bg-ccjv-offwhite text-ccjv-ink",
  cream: "bg-ccjv-cream text-ccjv-ink",
  green: "bg-ccjv-green text-white",
  white: "bg-white text-ccjv-ink",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  transparent: "bg-transparent text-inherit",
};

export interface VerseSectionProps {
  text: string;
  reference: string;
  /**
   * 3 Variantes de mise en page :
   * 1. 'left' | 'split' : Image/mosaïque à gauche, texte à droite
   * 2. 'center' | 'centered' : Sans image, texte au centre
   * 3. 'both' | 'flanked' : Images à gauche et à droite, texte au centre
   */
  variant?: VerseVariant;
  /** Ton prédéfini CCJV */
  tone?: VerseTone;
  /** Couleur de fond explicite (code hexadécimal, variable CSS ou valeur CSS) */
  backgroundColor?: string;
  /** Forcer le mode sombre */
  onDark?: boolean;
  /** Surtitre / contexte éditorial */
  context?: string;
  /** Photos pour la variante 'left' (mosaïque de 2 à 4 photos) */
  photos?: string[];
  /** Photo spécifique pour la colonne gauche (variante 'both') */
  leftPhoto?: string;
  /** Photo spécifique pour la colonne droite (variante 'both') */
  rightPhoto?: string;
  /** Mode compact pour intégration en sous-colonne */
  compact?: boolean;
  className?: string;
}

/**
 * Composant unifié pour l'affichage des versets bibliques.
 * - 3 variantes : 1 (image gauche / texte droite), 2 (sans image / centre), 3 (images gauche & droite / centre)
 * - Formes à angles vifs (strictement aucun arrondi)
 * - Police Lora (serif) pour le verset et Inter (sans-serif) pour la référence
 * - Couleur de fond entièrement paramétrable
 */
export function VerseSection({
  text,
  reference,
  variant = "left",
  tone = "offwhite",
  backgroundColor,
  onDark,
  context,
  photos,
  leftPhoto,
  rightPhoto,
  compact = false,
  className,
}: VerseSectionProps) {
  // Normalisation de la variante
  const isLeft = variant === "left" || variant === "split";
  const isCenter = variant === "center" || variant === "centered";
  const isBoth = variant === "both" || variant === "flanked";

  // Déterminer si le ton est sombre pour assurer un contraste parfait
  const isDarkTone =
    onDark ??
    (tone === "dark" ||
      tone === "green" ||
      (backgroundColor &&
        (backgroundColor.toLowerCase().includes("black") ||
          backgroundColor.toLowerCase().includes("121212") ||
          backgroundColor.toLowerCase().includes("#000") ||
          backgroundColor.toLowerCase().includes("#1"))));

  const onDeepTone = Boolean(isDarkTone);

  // Photos par défaut
  const displayPhotos =
    photos && photos.length >= 2
      ? photos
      : [
          defaultImages.communaute || "/media/ccjv-30.jpeg",
          defaultImages.fraternite || "/media/ccjv-35.jpeg",
          defaultImages.assemblee || "/media/ccjv-09.jpeg",
          defaultImages.louange || "/media/ccjv-08.jpeg",
        ];

  const leftImg = leftPhoto || displayPhotos[0] || "/media/ccjv-30.jpeg";
  const rightImg = rightPhoto || displayPhotos[2] || "/media/ccjv-09.jpeg";

  const inlineStyle = backgroundColor ? { backgroundColor } : undefined;

  // Rendu de l'icône de citation
  const renderQuoteIcon = () => (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center border",
        onDeepTone
          ? "border-white/30 text-ccjv-cream bg-white/5"
          : "border-ccjv-ink/20 text-ccjv-green bg-ccjv-green/5",
      )}
      aria-hidden="true"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="opacity-90"
      >
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.18zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.18z" />
      </svg>
    </div>
  );

  return (
    <section
      style={inlineStyle}
      className={cn(
        "relative overflow-hidden",
        compact ? "py-10 md:py-14" : "py-16 md:py-24",
        !backgroundColor && toneClass[tone],
        onDeepTone ? "text-white" : "text-ccjv-ink",
        className,
      )}
      aria-label="Parole biblique et méditation"
    >
      <div className="container relative z-10">
        {/* ============================================================
            VARIANTE 1 : Image/Mosaïque à gauche / Texte à droite
            ============================================================ */}
        {isLeft && (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Mosaïque photo gauche (strictement sans arrondis) */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-6">
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line">
                  <Image
                    src={displayPhotos[0]}
                    alt="Vie d'église CCJV"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                {displayPhotos[1] && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-ccjv-line">
                    <Image
                      src={displayPhotos[1]}
                      alt="Rencontre fraternelle CCJV"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4 md:gap-4 md:pt-6">
                {displayPhotos[2] && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-ccjv-line">
                    <Image
                      src={displayPhotos[2]}
                      alt="Célébration et louange CCJV"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                )}
                {displayPhotos[3] && (
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line">
                    <Image
                      src={displayPhotos[3]}
                      alt="Moment de culte CCJV"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Texte et référence droite */}
            <div className="flex flex-col justify-center lg:col-span-6 lg:pl-6">
              <div className="mb-6">{renderQuoteIcon()}</div>

              {context && (
                <p
                  className={cn(
                    "mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase",
                    onDeepTone ? "text-ccjv-cream" : "text-ccjv-green",
                  )}
                >
                  {context}
                </p>
              )}

              <blockquote
                className={cn(
                  "font-serif text-[clamp(1.25rem,0.9rem+1.6vw,2.15rem)] font-normal leading-[1.42] tracking-[-0.01em]",
                  onDeepTone ? "text-white/95" : "text-ccjv-ink",
                )}
              >
                {text}
              </blockquote>

              <figcaption
                className={cn(
                  "mt-6 flex items-center font-sans text-sm md:text-base font-medium tracking-wide",
                  onDeepTone ? "text-white/75" : "text-ccjv-ink-secondary",
                )}
              >
                <span>— {reference}</span>
              </figcaption>
            </div>
          </div>
        )}

        {/* ============================================================
            VARIANTE 2 : Sans image / Texte au centre
            ============================================================ */}
        {isCenter && (
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-6">{renderQuoteIcon()}</div>

            {context && (
              <p
                className={cn(
                  "mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase",
                  onDeepTone ? "text-ccjv-cream" : "text-ccjv-green",
                )}
              >
                {context}
              </p>
            )}

            <blockquote
              className={cn(
                "font-serif text-[clamp(1.35rem,1rem+1.8vw,2.35rem)] font-normal leading-[1.42] tracking-[-0.01em]",
                onDeepTone ? "text-white/95" : "text-ccjv-ink",
              )}
            >
              {text}
            </blockquote>

            <figcaption
              className={cn(
                "mt-6 flex items-center justify-center font-sans text-sm md:text-base font-medium tracking-wide",
                onDeepTone ? "text-white/75" : "text-ccjv-ink-secondary",
              )}
            >
              <span>— {reference}</span>
            </figcaption>
          </div>
        )}

        {/* ============================================================
            VARIANTE 3 : Image à gauche et à droite / Texte au centre
            ============================================================ */}
        {isBoth && (
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Image colonne gauche (sans arrondi) */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line shadow-sm">
                <Image
                  src={leftImg}
                  alt="Vie de l'église CCJV"
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Colonne centrale : Citation, verset et référence */}
            <div className="flex flex-col items-center text-center lg:col-span-6 px-2 sm:px-4">
              <div className="mb-6">{renderQuoteIcon()}</div>

              {context && (
                <p
                  className={cn(
                    "mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase",
                    onDeepTone ? "text-ccjv-cream" : "text-ccjv-green",
                  )}
                >
                  {context}
                </p>
              )}

              <blockquote
                className={cn(
                  "font-serif text-[clamp(1.25rem,0.9rem+1.5vw,2.05rem)] font-normal leading-[1.42] tracking-[-0.01em]",
                  onDeepTone ? "text-white/95" : "text-ccjv-ink",
                )}
              >
                {text}
              </blockquote>

              <figcaption
                className={cn(
                  "mt-6 flex items-center justify-center font-sans text-sm md:text-base font-medium tracking-wide",
                  onDeepTone ? "text-white/75" : "text-ccjv-ink-secondary",
                )}
              >
                <span>— {reference}</span>
              </figcaption>
            </div>

            {/* Image colonne droite (sans arrondi) */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line shadow-sm">
                <Image
                  src={rightImg}
                  alt="Célébration CCJV"
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Affichage des deux images sur mobile en diptyque compact sous le texte */}
            <div className="grid grid-cols-2 gap-3 lg:hidden mt-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-ccjv-line">
                <Image
                  src={leftImg}
                  alt="Vie de l'église CCJV"
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-ccjv-line">
                <Image
                  src={rightImg}
                  alt="Célébration CCJV"
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


