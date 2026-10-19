"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Play, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaItem, MediaKind } from "./mediaCatalogue";
import { MediaViewer } from "./MediaViewer";

/**
 * Catalogue visuel de la Médiathèque.
 *
 * Le contenu de la page, c'est lui : les médias occupent la surface, les
 * commandes restent discrètes. Tout le filtrage est local — aucune requête
 * réseau au changement de filtre, donc aucune perte du contexte de navigation.
 *
 * Choix tenus ici :
 * - **colonnes déterminées par la largeur disponible** (`auto-fill` +
 *   `minmax`), jamais par un nombre fixe identique sur tous les écrans ;
 * - cadrage `object-cover` volontaire et **hauteur constante** (`aspect-[4/3]`)
 *   pour que la grille reste lisible sans déformer les fichiers ;
 * - `next/image` : images redimensionnées et servies au bon format, chargement
 *   différé des tuiles hors écran ;
 * - une tuile dont l'image échoue montre un remplacement discret et **ne casse
 *   pas la grille** ;
 * - affichage progressif : le DOM reste léger sur un gros catalogue, sans
 *   jamais empêcher l'accès à l'ensemble des médias.
 */
export interface MediaCatalogProps {
  readonly items: readonly MediaItem[];
}

type KindFilter = "all" | MediaKind;

/** Taille du premier lot affiché, puis incrément du chargement progressif. */
const BATCH_SIZE = 30;

/** Normalisation de recherche : casse et accents ignorés. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const FILTERS: ReadonlyArray<{ value: KindFilter; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Vidéos" },
];

/** Tuile d'un média — état d'échec local, pour ne jamais casser la grille. */
function MediaTile({
  item,
  onOpen,
  registerOpener,
}: {
  readonly item: MediaItem;
  readonly onOpen: () => void;
  readonly registerOpener: (element: HTMLButtonElement | null) => void;
}) {
  const [failed, setFailed] = useState(false);

  const caption = item.origin;

  return (
    <li>
      <button
        ref={registerOpener}
        type="button"
        onClick={onOpen}
        aria-label={
          item.kind === "video"
            ? `Lire la vidéo : ${caption}`
            : `Agrandir la photo : ${caption}`
        }
        className="group block w-full cursor-pointer text-left"
      >
        <span className="relative block aspect-4/3 w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
          {failed || !item.thumbnailUrl ? (
            <span
              className="absolute inset-0 flex items-center justify-center bg-ccjv-black/85 px-3 text-center font-sans text-[0.75rem] leading-snug text-white/80"
              aria-hidden="true"
            >
              {failed ? "Média indisponible" : caption}
            </span>
          ) : (
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
              onError={() => setFailed(true)}
              className="object-cover transition-[opacity] duration-200 group-hover:opacity-90"
            />
          )}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-200 group-hover:border-ccjv-green/60"
          />

          {item.kind === "video" && (
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center bg-ccjv-black/75 text-white"
            >
              <Play className="h-3.5 w-3.5" />
            </span>
          )}
        </span>

        <span className="mt-2 block truncate font-sans text-[0.72rem] leading-snug text-ccjv-ink-secondary">
          {caption}
        </span>
      </button>
    </li>
  );
}

export function MediaCatalog({ items }: MediaCatalogProps) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /** Tuiles du média ouvert, pour rendre le focus à l'endroit d'où l'on vient. */
  const openersRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const lastOpenedRef = useRef<number | null>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query);

    return items.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (!needle) return true;

      const haystack = normalize(
        [item.origin, item.date ?? "", item.kind === "video" ? "video" : "photo"].join(" "),
      );
      return haystack.includes(needle);
    });
  }, [items, kind, query]);

  // Un changement de critère repart du premier lot.
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [kind, query]);

  const closeViewer = useCallback(() => {
    setOpenIndex(null);
    // Retour du focus sur la tuile d'origine : le visiteur retrouve sa place.
    const opener = lastOpenedRef.current;
    lastOpenedRef.current = null;
    if (opener !== null) {
      openersRef.current.get(opener)?.focus();
    }
  }, []);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleItems.length;

  const filtersDisabled = items.length === 0;

  return (
    <div>
      {/* Zone B — commandes du catalogue, immédiatement au-dessus de la grille.
          La barre reste accessible pendant le défilement, calée sous l'en-tête
          fixe du site (72 px sur mobile, 80 px au-delà). */}
      <div className="sticky top-[72px] z-20 -mx-6 mb-6 border-y border-ccjv-line bg-ccjv-offwhite/95 px-6 py-3 backdrop-blur-sm sm:-mx-12 sm:top-[80px] sm:px-12 lg:-mx-20 lg:px-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filtrer les médias par type"
            className="flex flex-wrap items-center gap-2"
          >
            {FILTERS.map((filter) => {
              const active = kind === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  disabled={filtersDisabled}
                  onClick={() => setKind(filter.value)}
                  className={cn(
                    "inline-flex h-9 items-center border px-4 font-sans text-[0.8rem] font-medium transition-colors",
                    active
                      ? "border-ccjv-green bg-ccjv-green text-white"
                      : "border-ccjv-line bg-transparent text-ccjv-ink hover:border-ccjv-ink",
                    filtersDisabled && "pointer-events-none opacity-40",
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:max-w-xs sm:flex-1 sm:justify-end">
            <label htmlFor="media-search" className="sr-only">
              Rechercher un média par provenance
            </label>
            <div className="relative w-full sm:max-w-[15rem]">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ccjv-ink-secondary"
              />
              <input
                id="media-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={filtersDisabled}
                placeholder="Rechercher…"
                className="h-9 w-full border border-ccjv-line bg-white pl-8 pr-3 font-sans text-[0.8rem] text-ccjv-ink placeholder:text-ccjv-ink-secondary/70 disabled:opacity-40"
              />
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mb-4 font-sans text-[0.78rem] text-ccjv-ink-secondary">
        {filtered.length === 0
          ? "Aucun média ne correspond aux critères actuels."
          : `${filtered.length} média${filtered.length > 1 ? "s" : ""}${
              filtered.length > visibleItems.length
                ? ` · ${visibleItems.length} affichés`
                : ""
            }`}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-ccjv-line bg-white px-6 py-12 text-center">
          <p className="font-sans text-[0.95rem] text-ccjv-ink">
            Aucun média ne correspond à votre recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              setKind("all");
              setQuery("");
            }}
            className="mt-4 inline-flex h-10 items-center border border-ccjv-ink px-5 font-sans text-[0.8rem] font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] sm:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
            {visibleItems.map((item, index) => (
              <MediaTile
                key={item.id}
                item={item}
                registerOpener={(element) => {
                  if (element) openersRef.current.set(index, element);
                  else openersRef.current.delete(index);
                }}
                onOpen={() => {
                  lastOpenedRef.current = index;
                  setOpenIndex(index);
                }}
              />
            ))}
          </ul>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + BATCH_SIZE)}
                className="inline-flex h-11 items-center border border-ccjv-ink px-6 font-sans text-[0.82rem] font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green"
              >
                Afficher plus de médias ({filtered.length - visibleItems.length})
              </button>
            </div>
          )}
        </>
      )}

      {openIndex !== null && (
        <MediaViewer
          items={filtered}
          index={openIndex}
          onClose={closeViewer}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
}
