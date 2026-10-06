import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page d'information.
 *
 * Intention : **rendre service**. Horaires, adresse, recherche, vie de l'Église.
 *
 * Séquence propre :
 *   en-tête pratique (informations visibles d'emblée) → contenu de contexte
 *   → FAITS en grille → étapes / marche à suivre → contact
 *
 * Pas de photographie d'ouverture, pas de verset d'ouverture : le visiteur qui
 * cherche une heure ou une adresse doit l'avoir sans scroller.
 */
export interface InformationPageProps {
  /** En-tête pratique (`HeroPractical`). */
  header: ReactNode;
  /** Contexte : pourquoi ces informations, à qui elles servent. */
  context?: ReactNode;
  /** Faits structurés (`KeyFacts`, `WeekRhythm`, panneau d'horaires). */
  facts?: ReactNode;
  factsTitle?: string;
  /** Marche à suivre (venir pour la première fois, demander un don…). */
  steps?: ReactNode;
  stepsTitle?: string;
  /** Contact / accès / accompagnement. */
  contact?: ReactNode;
  /** Photographie de contexte, une seule, si elle aide vraiment. */
  photo?: ReactNode;
  /** Ouverture vers le reste du site. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function InformationPage({
  header,
  context,
  facts,
  factsTitle,
  steps,
  stepsTitle,
  contact,
  photo,
  related,
  rhythm = "dense",
}: InformationPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {header}

      {context && (
        <Band space={scale.open} tone="light">
          {context}
        </Band>
      )}

      {facts && (
        <Band space={scale.close} tone="light" rule="top">
          {factsTitle && (
            <h2 className="mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)]">
              {factsTitle}
            </h2>
          )}
          {facts}
        </Band>
      )}

      {photo && (
        <Band space={scale.close} tone="light" width="full">
          {photo}
        </Band>
      )}

      {steps && (
        <Band space={scale.open} tone="tinted">
          {stepsTitle && (
            <h2 className="mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)]">
              {stepsTitle}
            </h2>
          )}
          {steps}
        </Band>
      )}

      {contact && (
        <Band space={scale.open} tone="cream" rule="top">
          {contact}
        </Band>
      )}

      {related && (
        <Band space={scale.close} tone="light" rule="top">
          {related}
        </Band>
      )}
    </>
  );
}
