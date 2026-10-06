"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export interface ParallaxImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  /**
   * Facteur de vitesse de défilement :
   * 0.1 à 0.18 = effet fluide, naturel et subtil.
   * L'image se déplace plus lentement que son conteneur, créant une profondeur optique.
   */
  speed?: number;
  className?: string;
  imageClassName?: string;
}

/**
 * Composant de photographie avec effet Parallax physique au scroll :
 * - Performance matérielle optimale (transform3d + will-change) ;
 * - Défilement actif uniquement quand l'image est dans le viewport (IntersectionObserver) ;
 * - Respect strict de `prefers-reduced-motion` ;
 * - Strictement aucun zoom artificiel au survol.
 */
export function ParallaxImage({
  src,
  alt,
  fill = true,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  speed = 0.12,
  className,
  imageClassName,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      inner.style.transform = "none";
      return;
    }

    let isVisible = false;
    let rafId: number | null = null;

    const updatePosition = () => {
      if (!isVisible || !container || !inner) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elemCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;

      // Calcul du décalage parallax (en pixels)
      const offset = (elemCenter - viewportCenter) * speed;

      inner.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      rafId = null;
    };

    const onScroll = () => {
      if (isVisible && rafId === null) {
        rafId = window.requestAnimationFrame(updatePosition);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            updatePosition();
          }
        });
      },
      { rootMargin: "50px 0px 50px 0px" },
    );

    observer.observe(container);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Position initiale
    updatePosition();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-ccjv-line", className)}
    >
      {/* Conteneur intérieur avec marge de sécurité verticale de 20% pour le décalage */}
      <div
        ref={innerRef}
        className="absolute -top-[10%] -bottom-[10%] left-0 right-0 w-full h-[120%] will-change-transform pointer-events-none"
      >
        <Image
          src={src}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          className={cn("object-cover select-none", imageClassName)}
        />
      </div>
    </div>
  );
}

/**
 * Conteneur Parallax générique pour animer n'importe quel contenu/image
 */
export function ParallaxContainer({
  children,
  speed = 0.12,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      inner.style.transform = "none";
      return;
    }

    let isVisible = false;
    let rafId: number | null = null;

    const updatePosition = () => {
      if (!isVisible || !container || !inner) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elemCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;

      const offset = (elemCenter - viewportCenter) * speed;

      inner.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      rafId = null;
    };

    const onScroll = () => {
      if (isVisible && rafId === null) {
        rafId = window.requestAnimationFrame(updatePosition);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            updatePosition();
          }
        });
      },
      { rootMargin: "50px 0px 50px 0px" },
    );

    observer.observe(container);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    updatePosition();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        ref={innerRef}
        className="absolute -top-[10%] -bottom-[10%] left-0 right-0 w-full h-[120%] will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
