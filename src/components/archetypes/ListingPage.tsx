import type { ReactNode } from "react";
import { Band } from "@/components/composition/Band";
import { rhythmScale, type PageRhythm } from "./rhythm";

/**
 * ARCHÉTYPE — Page d'index.
 *
 * Intention : **indexer**. Actualités, agenda, ressources.
 *
 * Séquence propre :
 *   en-tête compact → ÉLÉMENT PRINCIPAL mis en avant → liste éditoriale
 *   → archives → contenus connexes
 *
 * Aucun héros éditorial : l'information utile vient en premier, l'élément
 * principal n'est pas une vignette parmi d'autres mais une ouverture.
 */
export interface ListingPageProps {
  /** En-tête compact (`HeroPractical`, `HeroEditorial` allégé…). */
  header: ReactNode;
  /** Élément principal — un seul, présenté en grand. */
  lead?: ReactNode;
  /** Corps de liste (lignes éditoriales, grille éditoriale…). */
  list?: ReactNode;
  /** Intitulé de la liste, affiché au-dessus. */
  listTitle?: string;
  /** Entrées plus anciennes, traitées différemment de la liste courante. */
  archives?: ReactNode;
  archivesTitle?: string;
  /** Ouverture vers les autres rubriques. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}

export function ListingPage({
  header,
  lead,
  list,
  listTitle,
  archives,
  archivesTitle,
  related,
  rhythm = "dense",
}: ListingPageProps) {
  const scale = rhythmScale[rhythm];

  return (
    <>
      {header}

      {lead && (
        <Band space={scale.open} tone="light" width="wide">
          {lead}
        </Band>
      )}

      {list && (
        <Band space={scale.close} tone="light">
          {listTitle && (
            <h2 className="mb-10 border-b border-ccjv-line pb-4 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              {listTitle}
            </h2>
          )}
          {list}
        </Band>
      )}

      {archives && (
        <Band space={scale.close} tone="tinted" rule="top">
          {archivesTitle && (
            <h2 className="mb-8 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-ink-secondary uppercase">
              {archivesTitle}
            </h2>
          )}
          {archives}
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
