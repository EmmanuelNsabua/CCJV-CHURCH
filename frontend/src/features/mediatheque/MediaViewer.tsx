"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * Utilise React Portal pour être montée au sommet de document.body (z-[200]),
 * évitant tout piégeage sous le Header ou d'autres contextes d'empilement.
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
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);

  const item = items[index];
  const hasPrevious = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    setMounted(true);
  }, []);

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
  }, [mounted]);

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

  if (!mounted || !item) return null;

  const metadata = [item.origin, item.date ? readableDate(item.date) : null]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Média ${index + 1} sur ${items.length} — ${item.origin}`}
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 text-white backdrop-blur-md select-none animate-in fade-in duration-150"
    >
      {/* Barre supérieure : compteur, fermeture explicite. */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8 border-b border-white/10 z-[210] bg-black/40">
        <p className="font-sans text-xs tracking-wider text-white/70 uppercase tabular-nums">
          {index + 1} / {items.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center border border-white/30 text-white transition-colors hover:border-white hover:bg-white/15 cursor-pointer rounded-none focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Fermer la visionneuse"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      {/* Zone média : proportions conservées, jamais de déformation. */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-8 overflow-hidden"
        onClick={(e) => {
          // Fermer au clic sur le fond sombre (en dehors de l'image ou de la vidéo)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {failed ? (
          <div className="max-w-md border border-white/25 px-6 py-8 text-center bg-black/60">
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
                className="max-h-[70vh] w-full border border-white/15 bg-black"
              >
                Votre navigateur ne prend pas en charge la lecture vidéo.
              </video>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full max-h-[calc(100vh-160px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              onError={() => setFailed(true)}
              className="max-h-[calc(100vh-170px)] max-w-[90vw] w-auto h-auto object-contain select-none shadow-2xl"
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
            "absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/25 bg-black/60 text-white transition-colors sm:left-6 cursor-pointer rounded-none",
            hasPrevious
              ? "hover:border-white hover:bg-white/20"
              : "pointer-events-none opacity-20",
          )}
        >
          <ChevronLeft aria-hidden="true" className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          aria-label="Média suivant"
          className={cn(
            "absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/25 bg-black/60 text-white transition-colors sm:right-6 cursor-pointer rounded-none",
            hasNext
              ? "hover:border-white hover:bg-white/20"
              : "pointer-events-none opacity-20",
          )}
        >
          <ChevronRight aria-hidden="true" className="h-6 w-6" />
        </button>
      </div>

      {/* Métadonnées réellement disponibles : provenance, et date si elle existe. */}
      <div className="px-4 py-3 text-center sm:px-6 border-t border-white/10 bg-black/40">
        <p className="font-sans text-xs text-white/90 font-medium">{metadata}</p>
        {item.kind === "video" && (
          <p className="mt-0.5 font-sans text-[0.7rem] tracking-wider text-white/60 uppercase">
            Vidéo
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
