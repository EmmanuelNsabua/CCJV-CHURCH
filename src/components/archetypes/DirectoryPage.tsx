import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page d'annuaire.
 *
 * Intention : **présenter des personnes**. Responsables, départements.
 *
 * Séquence propre :
 *   héros → introduction → VISAGE PRINCIPAL en grand
 *   → annuaire → répartition des responsabilités → contenus connexes
 *
 * Une personne est mise en avant avant la liste : un annuaire n'est pas une
 * grille de vignettes, c'est une équipe qui se présente.
 */
export interface DirectoryPageProps {
  hero: ReactNode;
  /** Ce que fait cette équipe, en quelques lignes. */
  intro?: ReactNode;
  /** Personne principale (`PortraitPanel`). */
  lead?: ReactNode;
  /** Annuaire (`PeopleGrid`). */
  directory?: ReactNode;
  directoryTitle?: string;
  /** Comment le service est organisé. */
  responsibilities?: ReactNode;
  responsibilitiesTitle?: string;
  /** Chemins vers les pages voisines. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function DirectoryPage({
  hero,
  intro,
  lead,
  directory,
  directoryTitle,
  responsibilities,
  responsibilitiesTitle,
  related,
  rhythm = "standard",
}: DirectoryPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {hero}

      {intro && (
        <Band space={scale.close} tone="light">
          {intro}
        </Band>
      )}

      {lead && (
        <Band space={scale.open} tone="light" rule="top">
          {lead}
        </Band>
      )}

      {directory && (
        <Band space={scale.open} tone="cream">
          {directoryTitle && (
            <h2 className="mb-12 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              {directoryTitle}
            </h2>
          )}
          {directory}
        </Band>
      )}

      {responsibilities && (
        <Band space={scale.open} tone="light">
          {responsibilitiesTitle && (
            <h2 className="mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)]">
              {responsibilitiesTitle}
            </h2>
          )}
          {responsibilities}
        </Band>
      )}

      {related && (
        <Band space={scale.open} tone="tinted" rule="top">
          {related}
        </Band>
      )}
    </>
  );
}
