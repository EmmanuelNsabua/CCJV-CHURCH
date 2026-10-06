import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page de contenu (fiche).
 *
 * Intention : **présenter un contenu**. Article, publication, fiche de
 * département.
 *
 * Séquence propre :
 *   média en tête → métadonnées discrètes → corps de lecture étroit
 *   → galerie associée → contenus associés
 *
 * Particularité : le corps est en colonne de lecture (mesure courte) et les
 * métadonnées sont latérales sur grand écran — la lecture prime sur la mise
 * en scène.
 */
export interface DetailPageProps {
  /** Bandeau média (`HeroPhoto`, `FeatureImage` variante `full`…). */
  media: ReactNode;
  /** Titre et métadonnées de la fiche. */
  summary?: ReactNode;
  /** Corps de lecture. */
  body?: ReactNode;
  /** Complément latéral : informations pratiques, repères. */
  aside?: ReactNode;
  /** Galerie associée au contenu. */
  gallery?: ReactNode;
  /** Contenus associés (même rubrique, même département). */
  related?: ReactNode;
  relatedTitle?: string;
  rhythm?: PageRhythm;
}

export function DetailPage({
  media,
  summary,
  body,
  aside,
  gallery,
  related,
  relatedTitle,
  rhythm = "standard",
}: DetailPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {media}

      {summary && (
        <Band space={scale.close} tone="light">
          {summary}
        </Band>
      )}

      {body && (
        <Band space={scale.open} tone="light" rule="top">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">{body}</div>
            {aside && <div className="lg:col-span-4 lg:col-start-9">{aside}</div>}
          </div>
        </Band>
      )}

      {gallery && (
        <Band space={scale.open} tone="tinted">
          {gallery}
        </Band>
      )}

      {related && (
        <Band space={scale.open} tone="light" rule="top">
          {relatedTitle && (
            <h2 className="mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              {relatedTitle}
            </h2>
          )}
          {related}
        </Band>
      )}
    </>
  );
}
