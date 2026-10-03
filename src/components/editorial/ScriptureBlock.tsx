import { VerseSection, type VerseTone, type VerseVariant } from "@/components/shared/VerseSection";

/**
  * Écriture intégrée au flux éditorial.
  * Utilise désormais le composant unifié de versets avec ses 3 variantes,
  * angles vifs (sans arrondis) et typographie noble.
  */
export type ScriptureVariant =
  | "inline"
  | "framed"
  | "marginal"
  | "wide"
  | "concluding"
  | "split"
  | "left"
  | "center"
  | "centered"
  | "both"
  | "flanked";

export interface ScriptureBlockProps {
  text: string;
  reference: string;
  variant?: ScriptureVariant;
  /** Précision éditoriale / surtitre */
  context?: string;
  /** Traduction */
  translation?: string;
  onDark?: boolean;
  tone?: VerseTone;
  backgroundColor?: string;
  photos?: string[];
  leftPhoto?: string;
  rightPhoto?: string;
  className?: string;
}

export function ScriptureBlock({
  text,
  reference,
  variant = "center",
  context,
  onDark = false,
  tone,
  backgroundColor,
  photos,
  leftPhoto,
  rightPhoto,
  className,
}: ScriptureBlockProps) {
  // Mapper les variantes vers les 3 variantes majeures
  let targetVariant: VerseVariant = "center";

  if (variant === "left" || variant === "split" || variant === "marginal" || variant === "inline") {
    targetVariant = variant === "inline" || variant === "marginal" ? "center" : "left";
  } else if (variant === "both" || variant === "flanked") {
    targetVariant = "both";
  } else if (variant === "wide") {
    targetVariant = "both";
  } else {
    targetVariant = "center";
  }

  const effectiveTone: VerseTone = tone || (onDark ? "dark" : "transparent");

  return (
    <VerseSection
      text={text}
      reference={reference}
      variant={targetVariant}
      tone={effectiveTone}
      onDark={onDark}
      backgroundColor={backgroundColor}
      context={context}
      photos={photos}
      leftPhoto={leftPhoto}
      rightPhoto={rightPhoto}
      compact
      className={className}
    />
  );
}

