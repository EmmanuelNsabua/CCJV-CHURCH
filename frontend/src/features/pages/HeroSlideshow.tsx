"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { images } from "@/data/images";

const HERO_SLIDES = [
  {
    src: images.portraitLarge,
    alt: "Fidèle en prière et recueillement au Centre Chrétien Jésus ma Vie",
  },
  {
    src: images.adoration,
    alt: "Temps d'adoration et de louange vivante de l'assemblée",
  },
  {
    src: images.identite,
    alt: "Communauté réunie dans la joie fraternelle à Lubumbashi",
  },
  {
    src: images.hero,
    alt: "Vue de l'assemblée lors du culte dominical",
  },
];

export function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  return (
    <div
      className="absolute inset-0 z-0 bg-ccjv-line min-[900px]:relative min-[900px]:inset-auto min-[900px]:order-2 min-[900px]:z-auto min-[900px]:min-h-svh overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Moments de culte et de vie communautaire au CCJV"
    >
      {/* Slides empilés avec fondu enchaîné doux */}
      {HERO_SLIDES.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.src + idx}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              isActive ? "opacity-100 z-1" : "opacity-0 z-0 pointer-events-none",
            )}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={idx === 0}
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        );
      })}

      {/* Overlay sombre sur mobile pour garantir un contraste parfait du texte */}
      <div
        className="absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/65 to-black/40 min-[900px]:hidden"
        aria-hidden="true"
      />

      {/* Motif architectural discret : arche évoquant les baies d'église (visible sur desktop) */}
      <span
        className="pointer-events-none absolute inset-x-8 top-8 bottom-8 z-[3] rounded-t-full border border-ccjv-cream/35 max-[900px]:hidden"
        aria-hidden="true"
      />

      {/* Indicateurs de progression discrets et accessibles (design rounded-none) */}
      <div className="absolute bottom-6 right-6 z-[4] flex items-center gap-2 bg-black/40 backdrop-blur-xs px-3 py-1.5 border border-white/20">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Afficher la photo ${idx + 1} sur ${HERO_SLIDES.length}`}
            className={cn(
              "h-1.5 transition-all duration-300 rounded-none cursor-pointer focus-visible:outline-2 focus-visible:outline-ccjv-cream",
              idx === currentIndex
                ? "w-6 bg-ccjv-cream"
                : "w-2 bg-white/40 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </div>
  );
}
