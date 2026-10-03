"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Délai (ms) pour un effet de cascade. */
  delay?: number;
}

/**
 * Révélation au scroll, avec progressive enhancement :
 * - sans JS ou avec `prefers-reduced-motion`, le contenu reste visible ;
 * - sinon, il apparaît lorsque l'élément entre dans le viewport.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      return;
    }

    el.setAttribute("data-reveal", "pending");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute("data-reveal", "visible");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
