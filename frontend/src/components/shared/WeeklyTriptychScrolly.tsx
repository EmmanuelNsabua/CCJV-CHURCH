"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { images } from "@/data/images";

export interface TriptychItem {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bgColor: string;
}

const DEFAULT_ITEMS: TriptychItem[] = [
  {
    id: "culte-dominical",
    number: "01",
    title: "Culte dominical",
    description:
      "Le grand rassemblement de la communauté CCJV : louange fervente, adoration sincère et proclamation fidèle des Écritures pour nourrir et fortifier la foi de chacun.",
    image: images.assemblee,
    imageAlt: "Assemblée réunie pour le culte dominical au CCJV",
    bgColor: "#FAF9F5",
  },
  {
    id: "ecole-du-dimanche",
    number: "02",
    title: "Ecole du dimanche",
    description:
      "Un cadre bienveillant et joyeux où les enfants découvrent l'Évangile à leur mesure, portés par des moniteurs dévoués, des récits vivants et des chants d'éveil spirituel.",
    image: images.ecodim,
    imageAlt: "Enfants et moniteurs de l'école du dimanche CCJV",
    bgColor: "#F5EFE4",
  },
  {
    id: "priere-du-mercredi",
    number: "03",
    title: "Prière du mercredi",
    description:
      "Une halte spirituelle au cœur de la semaine dédiée à l'intercession commune, au recueillement et aux supplications pour les familles, l'église et la nation.",
    image: images.louange,
    imageAlt: "Temps de prière et d'intercession communautaire",
    bgColor: "#EDF3ED",
  },
];

interface WeeklyTriptychScrollyProps {
  items?: TriptychItem[];
  className?: string;
}

/**
 * 🏛️ WeeklyTriptychScrolly — Section Scrollytelling CCJV
 *
 * Spécifications strictes :
 * 1. SECTION DE GAUCHE STICKY : La colonne triptyque suit le défilement (position: sticky)
 *    et reste ancrée au centre de l'écran pendant que le visiteur scrolle.
 * 2. SECTION DE DROITE DÉFILANTE (SCROLL) : Les 3 blocs de texte défilent verticalement au scroll naturel.
 * 3. SYNCHRONISATION EN TEMPS RÉEL :
 *    - L'image du bloc centré s'élargit progressivement (flex-grow 2.8 vs 1), les deux autres rétrécissent.
 *    - La couleur de fond de toute la section s'adapte doucement (#FAF9F5, #F5EFE4, #EDF3ED).
 *    - Émergence masquée (overflow: hidden) du titre actif sans chevauchement.
 */
export function WeeklyTriptychScrolly({
  items = DEFAULT_ITEMS,
  className,
}: WeeklyTriptychScrollyProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Détection de prefers-reduced-motion pour l'accessibilité WCAG AA
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Détection du bloc actuellement centré dans le viewport
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight / 2;
        let closestIndex = 0;
        let minDistance = Infinity;

        itemRefs.current.forEach((el, index) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const itemCenter = rect.top + rect.height / 2;
          const distance = Math.abs(itemCenter - viewportCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        setActiveIndex((prev) => (prev !== closestIndex ? closestIndex : prev));
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Clic sur une image du triptyque : scroll doux vers le bloc correspondant
  const scrollToItem = useCallback(
    (index: number) => {
      const targetElement = itemRefs.current[index];
      if (!targetElement) return;

      targetElement.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    },
    [reducedMotion]
  );

  const activeBgColor = items[activeIndex]?.bgColor || "#FAF9F5";

  return (
    <section
      className={cn(
        "relative w-full py-10 lg:py-16 transition-colors duration-800",
        className
      )}
      style={{
        backgroundColor: activeBgColor,
        transition: reducedMotion
          ? "none"
          : "background-color 800ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-label="Rythme de vie de l'assemblée CCJV"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative grid grid-cols-1 lg:grid-cols-12 lg:gap-14 xl:gap-20">
          {/* ===================================================================
              SECTION DE GAUCHE : TRIPTYQUE STICKY PENDANT LE DÉFILEMENT
              =================================================================== */}
          <div className="relative h-full self-stretch lg:col-span-7">
            <div
              className="sticky top-20 z-10 flex w-full items-center justify-center py-4 sm:top-24 lg:top-28 lg:py-0"
              style={{ position: "sticky" }}
            >
              <div
                className="flex h-[260px] w-full flex-row gap-3 sm:h-[320px] md:gap-3 lg:h-[380px] xl:h-[420px]"
                role="tablist"
                aria-label="Triptyque photographique"
              >
                {items.map((item, index) => {
                  const isActive = activeIndex === index;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      id={`triptych-tab-${item.id}`}
                      aria-selected={isActive}
                      onClick={() => scrollToItem(index)}
                      className={cn(
                        "group relative h-full min-w-0 cursor-pointer overflow-hidden rounded-none border text-left outline-none select-none",
                        "border-ccjv-line/80 focus-visible:outline-2 focus-visible:outline-ccjv-green focus-visible:outline-offset-2",
                        isActive
                          ? "border-ccjv-green/40 shadow-sm"
                          : "hover:border-ccjv-ink/30"
                      )}
                      style={{
                        flexGrow: isActive ? (reducedMotion ? 3 : 2.8) : 1,
                        flexShrink: 1,
                        flexBasis: "0%",
                        transition: reducedMotion
                          ? "none"
                          : "flex-grow 700ms cubic-bezier(0.16, 1, 0.3, 1), border-color 400ms ease",
                      }}
                      aria-label={`Afficher ${item.title}`}
                    >
                      {/* Image avec ajustement dynamique de netteté */}
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 768px) 33vw, (max-width: 1200px) 45vw, 600px"
                        className={cn(
                          "object-cover object-center transition-all duration-700 ease-out",
                          isActive
                            ? "scale-100 brightness-100 contrast-100"
                            : "scale-105 brightness-[0.78] contrast-95 group-hover:brightness-90"
                        )}
                        priority={index === 0}
                      />

                      {/* Voile sombre pour sublimer le volet actif */}
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-0 transition-opacity duration-700",
                          isActive
                            ? "opacity-0"
                            : "bg-black/25 opacity-100 group-hover:opacity-10"
                        )}
                      />

                      {/* Liseré discret d'activation à la base */}
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 h-1 bg-ccjv-green transition-transform duration-500",
                          isActive ? "scale-x-100" : "scale-x-0"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===================================================================
              SECTION DE DROITE : BLOCS DE TEXTE QUI SCROLLENT
              =================================================================== */}
          <div className="flex flex-col lg:col-span-5">
            {items.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className="flex min-h-[45vh] flex-col justify-center py-12 sm:min-h-[50vh] lg:min-h-[60vh] xl:min-h-[65vh] lg:py-0"
                >
                  <div
                    className={cn(
                      "transition-opacity duration-700",
                      isActive ? "opacity-100" : "opacity-30"
                    )}
                  >
                    {/* Conteneur masqué en overflow: hidden pour le titre */}
                    <div className="overflow-hidden py-1">
                      <h3
                        className={cn(
                          "font-serif text-4xl font-bold tracking-tight text-ccjv-ink sm:text-5xl xl:text-6xl",
                          "transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          reducedMotion
                            ? "translate-y-0"
                            : isActive
                              ? "translate-y-0"
                              : "translate-y-full"
                        )}
                      >
                        {item.title}
                      </h3>
                    </div>

                    {/* Conteneur masqué en overflow: hidden pour la description */}
                    <div className="mt-6 overflow-hidden">
                      <p
                        className={cn(
                          "max-w-xl font-sans text-base leading-relaxed text-ccjv-ink-secondary sm:text-lg lg:text-xl",
                          "transition-transform duration-700 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          reducedMotion
                            ? "translate-y-0"
                            : isActive
                              ? "translate-y-0"
                              : "translate-y-6"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
