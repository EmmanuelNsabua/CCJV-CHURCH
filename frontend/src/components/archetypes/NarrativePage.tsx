import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page narrative.
 *
 * Intention : **raconter**. La page progresse dans le temps ou dans une
 * expérience ; elle se lit, elle ne se survole pas.
 *
 * Séquence propre :
 *   héros → prologue → CHAPITRES alternés (photo gauche/droite)
 *   → photographie de rupture → chronologie → épilogue
 *
 * Le rythme est volontairement plus ample que celui de la page éditoriale :
 * le récit a besoin de silence.
 */
export interface NarrativePageProps {
  hero: ReactNode;
  /** Prologue : d'où l'on part. */
  prologue?: ReactNode;
  /** Chapitres numérotés (`Chapter`), dans l'ordre du récit. */
  chapters?: ReactNode;
  /** Photographie pleine largeur, comme un temps de respiration. */
  feature?: ReactNode;
  /** Repères datés (`Timeline`). */
  chronology?: ReactNode;
  /** Écriture ou parole qui referme le récit. */
  epilogue?: ReactNode;
  /** Suite naturelle. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function NarrativePage({
  hero,
  prologue,
  chapters,
  feature,
  chronology,
  epilogue,
  related,
  rhythm = "serene",
}: NarrativePageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {hero}

      {prologue && (
        <Band space={scale.open} tone="light">
          {prologue}
        </Band>
      )}

      {chapters && (
        <Band space={scale.wide} tone="light" rule="top">
          <div className="flex flex-col gap-[clamp(3.5rem,8vw,7rem)]">{chapters}</div>
        </Band>
      )}

      {feature && (
        <Band space="flush" tone="light" width="full">
          {feature}
        </Band>
      )}

      {chronology && (
        <Band space={scale.wide} tone="cream">
          {chronology}
        </Band>
      )}

      {epilogue && (
        <Band space={scale.wide} tone="dark">
          {epilogue}
        </Band>
      )}

      {related && (
        <Band space={scale.open} tone="light" rule="top">
          {related}
        </Band>
      )}
    </>
  );
}
