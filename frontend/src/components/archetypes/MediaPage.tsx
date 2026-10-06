import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page média.
 *
 * Intention : **regarder et écouter**. Enseignements, médiathèque.
 *
 * Séquence propre :
 *   héros → VIDÉO PRINCIPALE en grand → liste média éditoriale
 *   → galerie photographique → albums
 *
 * La vidéo vient avant le texte : sur ces pages, le visiteur vient pour voir.
 */
export interface MediaPageProps {
  hero: ReactNode;
  /** Contenu média mis en avant (vidéo du dernier enseignement…). */
  featured?: ReactNode;
  /** Liste média : titre, orateur, date, durée. */
  listing?: ReactNode;
  listingTitle?: string;
  /** Galerie photographique — uniquement si des photos existent. */
  gallery?: ReactNode;
  galleryTitle?: string;
  /** Regroupements thématiques (séries, albums). */
  collections?: ReactNode;
  collectionsTitle?: string;
  /** Ouverture vers les rubriques voisines. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function MediaPage({
  hero,
  featured,
  listing,
  listingTitle,
  gallery,
  galleryTitle,
  collections,
  collectionsTitle,
  related,
  rhythm = "standard",
}: MediaPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {hero}

      {featured && (
        <Band space={scale.open} tone="light" width="wide">
          {featured}
        </Band>
      )}

      {listing && (
        <Band space={scale.close} tone="light" rule="top">
          {listingTitle && (
            <h2 className="mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              {listingTitle}
            </h2>
          )}
          {listing}
        </Band>
      )}

      {gallery && (
        <Band space={scale.open} tone="dark" width="wide">
          {galleryTitle && (
            <h2 className="mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-cream uppercase">
              {galleryTitle}
            </h2>
          )}
          {gallery}
        </Band>
      )}

      {collections && (
        <Band space={scale.open} tone="light" rule="top">
          {collectionsTitle && (
            <h2 className="mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              {collectionsTitle}
            </h2>
          )}
          {collections}
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
