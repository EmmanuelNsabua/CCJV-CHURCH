"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CrossMark } from "./CrossMark";
import type { Testimony } from "@/data/mock/testimonies";

/**
 * Carrousel de témoignages : **chaque visage porte sa parole**.
 *
 * Implémentation volontairement légère et accessible :
 * - défilement natif + `scroll-snap` (tactile, fluide, sans calcul de transform) ;
 * - aucune lecture automatique (WCAG 2.2.2 : pas de mouvement imposé) ;
 * - commandes clavier/focusables, `aria-current` sur la pastille active ;
 * - `prefers-reduced-motion` respecté (défilement instantané, voir globals.css).
 */
export function TestimonyCarousel({
  testimonies,
}: {
  testimonies: Testimony[];
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = track.children[index] as HTMLElement | undefined;
    if (!target) return;
    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: "smooth",
    });
    setActive(index);
  }, []);

  // Synchronise la pastille active avec le défilement réel (doigt, molette…).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const cards = Array.from(track.children) as HTMLElement[];
      const center = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter =
          card.offsetLeft - track.offsetLeft + card.clientWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < minDistance) {
          minDistance = distance;
          closest = index;
        }
      });

      setActive(closest);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const move = (direction: -1 | 1) => {
    const next = Math.min(
      Math.max(active + direction, 0),
      testimonies.length - 1,
    );
    goTo(next);
  };

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {testimonies.map((testimony) => (
          <li
            key={testimony.id}
            className="w-[86%] shrink-0 snap-center sm:w-[62%] lg:w-[48%]"
          >
            <article className="flex h-full flex-col gap-6 border-t-2 border-ccjv-green pt-6 sm:flex-row sm:gap-7">
              <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-t-full bg-ccjv-line sm:w-44">
                <Image
                  src={testimony.photo}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 86vw, 176px"
                  className="object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-col">
                <CrossMark size="sm" className="text-ccjv-green" />
                <blockquote className="mt-5 font-serif text-[clamp(1.05rem,0.9rem+0.7vw,1.4rem)] leading-[1.5] italic">
                  «&nbsp;{testimony.quote}&nbsp;»
                </blockquote>
                <p className="mt-5 font-sans text-sm font-semibold">
                  {testimony.name}
                </p>
                <p className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">
                  {testimony.role}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {/* Commandes */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <ul className="flex items-center gap-2">
          {testimonies.map((testimony, index) => (
            <li key={testimony.id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Témoignage ${index + 1} sur ${testimonies.length}`}
                aria-current={index === active}
                className={cn(
                  "h-2 rounded-full transition-all duration-[250ms]",
                  index === active
                    ? "w-8 bg-ccjv-green"
                    : "w-2 bg-ccjv-line hover:bg-ccjv-ink-secondary",
                )}
              />
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={active === 0}
            aria-label="Témoignage précédent"
            className="flex h-11 w-11 items-center justify-center border border-ccjv-line text-ccjv-ink transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ccjv-line disabled:hover:text-ccjv-ink"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={active === testimonies.length - 1}
            aria-label="Témoignage suivant"
            className="flex h-11 w-11 items-center justify-center border border-ccjv-line text-ccjv-ink transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ccjv-line disabled:hover:text-ccjv-ink"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
