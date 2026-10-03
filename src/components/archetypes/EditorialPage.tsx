import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page éditoriale.
 *
 * Intention : **développer un sujet**. La page argumente, illustre, approfondit.
 *
 * Séquence propre (ce qui la distingue des sept autres) :
 *   héros → introduction → RUPTURE VISUELLE pleine largeur → corps
 *   → citation → approfondissement → Écriture → contenus connexes
 *
 * Tous les emplacements sont optionnels sauf le héros. L'archétype porte
 * l'ORDRE et le TON ; la page porte le CONTENU.
 */
export interface EditorialPageProps {
  hero: ReactNode;
  /** Ouverture : ce dont il est question, et pourquoi. */
  intro?: ReactNode;
  /** Rupture visuelle — photographie pleine largeur entre deux temps. */
  feature?: ReactNode;
  /** Corps principal, en une ou plusieurs sections. */
  body?: ReactNode;
  /** Citation éditoriale, détachée du corps. */
  pullQuote?: ReactNode;
  /** Approfondissement : ce que le corps n'a pas dit. */
  deepening?: ReactNode;
  /** Écriture, placée là où elle conclut le propos. */
  scripture?: ReactNode;
  /** Contenus connexes — le chemin vers la suite. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function EditorialPage({
  hero,
  intro,
  feature,
  body,
  pullQuote,
  deepening,
  scripture,
  related,
  rhythm = "standard",
}: EditorialPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {hero}

      {intro && (
        <Band space={scale.open} tone="light">
          {intro}
        </Band>
      )}

      {feature && (
        <Band space={scale.close} tone="light" width="full">
          {feature}
        </Band>
      )}

      {body && (
        <Band space={scale.open} tone="tinted">
          {body}
        </Band>
      )}

      {pullQuote && (
        <Band space={scale.wide} tone="light" width="wide">
          {pullQuote}
        </Band>
      )}

      {deepening && (
        <Band space={scale.open} tone="light" rule="top">
          {deepening}
        </Band>
      )}

      {scripture && (
        <Band space={scale.wide} tone="dark">
          {scripture}
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
