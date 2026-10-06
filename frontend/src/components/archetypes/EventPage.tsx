import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page d'événement.
 *
 * Intention : **donner envie, puis informer**. Une fiche événement n'est ni un
 * article ni une page de service.
 *
 * Séquence propre :
 *   photographie plein cadre → résumé (date, lieu) → description
 *   → INFORMATIONS PRATIQUES en panneau → programme → galerie
 *   → événements associés
 *
 * Les informations pratiques arrivent tôt et dans un bloc identifiable : c'est
 * ce que le visiteur vient chercher après avoir été convaincu.
 */
export interface EventPageProps {
  /** Photographie d'ouverture. */
  hero: ReactNode;
  /** Titre, date, lieu — repris sous l'image pour rester lisible. */
  summary?: ReactNode;
  /** Description de l'événement. */
  description?: ReactNode;
  /** Panneau pratique : heure, lieu, accès, inscription. */
  practical?: ReactNode;
  /** Programme / déroulé, si l'église en a fourni un. */
  program?: ReactNode;
  /** Photographies de l'édition précédente ou du même temps fort. */
  gallery?: ReactNode;
  /** Autres rendez-vous. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function EventPage({
  hero,
  summary,
  description,
  practical,
  program,
  gallery,
  related,
  rhythm = "standard",
}: EventPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {hero}

      {summary && (
        <Band space={scale.close} tone="light">
          {summary}
        </Band>
      )}

      {description && (
        <Band space={scale.close} tone="light">
          {description}
        </Band>
      )}

      {practical && (
        <Band space={scale.open} tone="cream" rule="top">
          {practical}
        </Band>
      )}

      {program && (
        <Band space={scale.open} tone="light">
          {program}
        </Band>
      )}

      {gallery && (
        <Band space={scale.open} tone="light" rule="top">
          {gallery}
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
