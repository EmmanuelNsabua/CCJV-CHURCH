"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn, formatLongDate } from "@/lib/utils";
import type { MediaItem } from "./mediaCatalogue";

/**
 * Visionneuse plein écran du catalogue.
 *
 * Un seul média à la fois, dans le contexte du filtre courant : la liste reçue
 * est **déjà filtrée** par l'appelant, donc les commandes précédent/suivant ne
 * font jamais basculer d'une vidéo vers une photo.
 *
 * Accessibilité :
 * - `role="dialog"` + `aria-modal`, nommé par la provenance du média ;
 * - focus initial sur la commande de fermeture, piège de tabulation, retour du
 *   focus à la tuile d'origine (assuré par l'appelant) ;
 * - fermeture par la touche `Échap`, navigation par les flèches gauche/droite ;
 * - défilement de la page verrouillé pendant l'ouverture, sans changer la
 *   position de lecture du catalogue.
 *
 * Lecture : le lecteur réel du média est monté, jamais un faux lecteur. Une
 * vidéo n'est jamais lancée automatiquement — aucun son ne peut surprendre le
 * visiteur à l'ouverture.
 */
export interface MediaViewerProps {
  readonly items: readonly MediaItem[];
  readonly index: number;
  readonly onClose: () => void;
  readonly onNavigate: (index: number) => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Date lisible ; tolère une date seule comme un horodatage ISO complet. */
function readableDate(iso: string): string {
  return formatLongDate(iso.slice(0, 10));
}

export function MediaViewer({
  items,
  index,
  onClose,
  onNavigate,
}: MediaViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);

  const item = items[index];
  const hasPrevious = index > 0;
  const hasNext = index < items.length - 1;

  const goPrevious = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index < items.length - 1) onNavigate(index + 1);
  }, [index, items.length, onNavigate]);

  // Un média différent = un chargement différent : l'état d'échec est remis à zéro.
  useEffect(() => {
    setFailed(false);
  }, [item?.src]);

  // Focus initial sur la fermeture : le clavier sait immédiatement comment sortir.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Clavier : Échap ferme, les flèches parcourent le filtre courant.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key !== "Tab") return;

      // Piège de tabulation : le focus ne sort pas du dialogue.
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious, onClose]);

  // Verrouille le défilement de la page derrière la visionneuse.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!item) return null;

  const metadata = [item.origin, item.date ? readableDate(item.date) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Média ${index + 1} sur ${items.length} — ${item.origin}`}
      className="fixed inset-0 z-[80] flex flex-col bg-ccjv-black/95 text-white"
    >
      {/* Barre supérieure : compteur, fermeture explicite. */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="font-sans text-[0.78rem] tracking-[0.08em] text-white/70 tabular-nums">
          {index + 1} / {items.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center border border-white/30 text-white transition-colors hover:border-white hover:bg-white/10"
          aria-label="Fermer la visionneuse"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      {/* Zone média : proportions conservées, jamais de déformation. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-8">
        {failed ? (
          <div className="max-w-md border border-white/25 px-6 py-8 text-center">
            <p className="font-sans text-[0.95rem] text-white">
              Ce média n&apos;a pas pu être chargé.
            </p>
            <a
              href={item.src}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-sans text-[0.82rem] text-ccjv-cream underline underline-offset-4 hover:text-white"
            >
              Ouvrir le fichier dans un nouvel onglet
              <span aria-hidden="true"> ↗</span>
            </a>
          </div>
        ) : item.kind === "video" ? (
          <div className="w-full max-w-4xl">
            {item.youtubeId ? (
              <div className="relative aspect-video w-full border border-white/15">
                <iframe
                  src={`https://www.youtube.com/embed/${item.youtubeId}?rel=0`}
                  title={item.alt}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            ) : (
              <video
                controls
                preload="metadata"
                src={item.src}
                aria-label={item.alt}
                onError={() => setFailed(true)}
                className="max-h-[70vh] w-full border border-white/15 bg-ccjv-black"
              >
                Votre navigateur ne prend pas en charge la lecture vidéo.
              </video>
            )}
          </div>
        ) : (
          <div className="relative h-full w-full">
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="100vw"
              priority
              onError={() => setFailed(true)}
              className="object-contain"
            />
          </div>
        )}

        {/* Navigation dans le filtre courant. */}
        <button
          type="button"
          onClick={goPrevious}
          disabled={!hasPrevious}
          aria-label="Média précédent"
          className={cn(
            "absolute left-1 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/25 bg-ccjv-black/40 text-white transition-colors sm:left-4",
            hasPrevious
              ? "hover:border-white hover:bg-white/15"
              : "pointer-events-none opacity-30",
          )}
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          aria-label="Média suivant"
          className={cn(
            "absolute right-1 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/25 bg-ccjv-black/40 text-white transition-colors sm:right-4",
            hasNext
              ? "hover:border-white hover:bg-white/15"
              : "pointer-events-none opacity-30",
          )}
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      {/* Métadonnées réellement disponibles : provenance, et date si elle existe. */}
      <div className="px-4 py-4 text-center sm:px-6 sm:py-5">
        <p className="font-sans text-[0.85rem] text-white/85">{metadata}</p>
        {item.kind === "video" && (
          <p className="mt-1 font-sans text-[0.72rem] tracking-[0.1em] text-white/50 uppercase">
            Vidéo
          </p>
        )}
      </div>
    </div>
  );
}
