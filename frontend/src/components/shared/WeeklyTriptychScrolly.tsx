"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { images } from "@/data/images";

export interface TriptychItem {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
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
    eyebrow: "Dimanche · 08h30 à 11h30",
    description:
      "Le grand rassemblement de la communauté CCJV : louange fervente, adoration sincère et proclamation fidèle des Écritures pour nourrir et fortifier la foi de chacun.",
    image: images.assemblee,
    imageAlt: "Assemblée réunie pour le culte dominical au CCJV",
    bgColor: "#FAF9F5", // Nuance blanc cassé chaleureuse
  },
  {
    id: "ecole-du-dimanche",
    number: "02",
    title: "Ecole du dimanche",
    eyebrow: "Ecodim · Dimanche à 08h30",
    description:
      "Un cadre bienveillant et joyeux où les enfants découvrent l'Évangile à leur mesure, portés par des moniteurs dévoués, des récits vivants et des chants d'éveil spirituel.",
    image: images.ecodim,
    imageAlt: "Enfants et moniteurs de l'école du dimanche CCJV",
    bgColor: "#F5EFE4", // Nuance crème enveloppante
  },
  {
    id: "priere-du-mercredi",
    number: "03",
    title: "Prière du mercredi",
    eyebrow: "Milieu de semaine · 16h30 à 18h30",
    description:
      "Une halte spirituelle au cœur de la semaine dédiée à l'intercession commune, au recueillement et aux supplications pour les familles, l'église et la nation.",
    image: images.louange,
    imageAlt: "Temps de prière et d'intercession communautaire",
    bgColor: "#EDF3ED", // Nuance vert sauge apaisante
  },
];

interface WeeklyTriptychScrollyProps {
  items?: TriptychItem[];
  sectionEyebrow?: string;
  sectionSubtitle?: string;
  className?: string;
}

/**
 * 🏛️ WeeklyTriptychScrolly — Section Scrollytelling CCJV
 *
 * Spécifications respectées :
 * 1. Triptyque de 3 images verticales : Au scroll, l'image active s'élargit progressivement
 *    (flex-grow 3 contre 1) pour dominer l'espace, les deux autres se réduisent avec une transition fluide.
 * 2. Bloc de texte fixe avec masque : Chaque paire [Titre + Description] émerge depuis le bas
 *    via un conteneur en overflow:hidden, sans chevauchement avec l'élément précédent.
 * 3. Ambiance visuelle : Modification douce et continue de la couleur de fond de toute la section.
 */
export function WeeklyTriptychScrolly({
  items = DEFAULT_ITEMS,
  sectionEyebrow = "La foi prend forme",
  sectionSubtitle = "Le rythme vivant de notre assemblée",
  className,
}: WeeklyTriptychScrollyProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  // Détection du scroll pour la synchronisation scrollytelling
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!containerRef.current || ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        if (!containerRef.current) {
          ticking = false;
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const totalScrollable =
          containerRef.current.offsetHeight - window.innerHeight;

        if (totalScrollable > 0) {
          const scrollOffset = -rect.top;
          const progress = Math.min(
            Math.max(scrollOffset / totalScrollable, 0),
            1
          );

          // Découpage en tranches équitables pour chaque élément
          const stepSize = 1 / items.length;
          const rawIndex = Math.min(
            Math.floor(progress / stepSize),
            items.length - 1
          );

          setActiveIndex((prev) => (prev !== rawIndex ? rawIndex : prev));
        }

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
  }, [items.length]);

  // Navigation manuelle par clic (clavier ou pointer)
  const selectItem = useCallback(
    (index: number) => {
      setActiveIndex(index);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop;
      const containerTop = rect.top + currentScrollY;
      const totalScrollable =
        containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable > 0) {
        // Centrage dans la zone de scroll du step visé
        const stepFraction = (index + 0.5) / items.length;
        const targetScroll = containerTop + stepFraction * totalScrollable;
        window.scrollTo({
          top: targetScroll,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    },
    [items.length, reducedMotion]
  );

  const activeBgColor = items[activeIndex]?.bgColor || "#FAF9F5";

  return (
    <section
      ref={containerRef}
      className={cn("relative min-h-[270vh] w-full", className)}
      style={{
        backgroundColor: activeBgColor,
        transition: reducedMotion
          ? "none"
          : "background-color 800ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-label="Moments forts et rythme de la foi au CCJV"
    >
      {/* Conteneur Sticky plein écran */}
      <div className="sticky top-0 flex h-screen min-h-[600px] w-full items-center justify-center overflow-hidden py-10 lg:py-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20">
            {/* ===================================================================
                À GAUCHE : TRIPTYQUE DE TROIS IMAGES VERTICALES
                =================================================================== */}
            <div className="w-full lg:col-span-7">
              <div
                className="flex h-[360px] w-full flex-row gap-3 sm:h-[440px] md:gap-4 lg:h-[540px] xl:h-[600px]"
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
                      aria-controls={`triptych-panel-${item.id}`}
                      onClick={() => selectItem(index)}
                      className={cn(
                        "group relative h-full min-w-0 cursor-pointer overflow-hidden rounded-none border text-left outline-none select-none",
                        "border-ccjv-line/80 focus-visible:outline-2 focus-visible:outline-ccjv-green focus-visible:outline-offset-2",
                        isActive ? "border-ccjv-green/40 shadow-sm" : "hover:border-ccjv-ink/30"
                      )}
                      style={{
                        flexGrow: isActive ? (reducedMotion ? 3 : 2.8) : 1,
                        flexShrink: 1,
                        flexBasis: "0%",
                        transition: reducedMotion
                          ? "none"
                          : "flex-grow 700ms cubic-bezier(0.16, 1, 0.3, 1), border-color 400ms ease",
                      }}
                    >
                      {/* Image avec zoom subtil au survol inactif */}
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

                      {/* Voile sombre pour accentuer la primauté de l'image active */}
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-0 transition-opacity duration-700",
                          isActive ? "opacity-0" : "bg-black/25 opacity-100 group-hover:opacity-10"
                        )}
                      />

                      {/* Numérotation et libellé vertical discret sur les volets inactifs */}
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 p-3 sm:p-4 transition-all duration-500",
                          isActive
                            ? "pointer-events-none opacity-0 translate-y-3"
                            : "opacity-100 translate-y-0"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-white/90 drop-shadow sm:text-xs">
                            {item.number}
                          </span>
                          <span className="hidden font-serif text-xs font-medium text-white/95 drop-shadow md:inline-block truncate">
                            {item.title}
                          </span>
                        </div>
                      </div>

                      {/* Indicateur d'état actif : Liseré de base */}
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

            {/* ===================================================================
                À DROITE : BLOC DE TEXTE FIXE AVEC ÉMERGENCE MASQUÉE (OVERFLOW HIDDEN)
                =================================================================== */}
            <div className="flex flex-col justify-center lg:col-span-5">
              {/* Surtitre institutionnel & indicateurs de progression */}
              <div className="mb-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-2 w-2 bg-ccjv-green" />
                  <span className="font-sans text-xs font-semibold tracking-widest text-ccjv-ink uppercase">
                    {sectionEyebrow}
                  </span>
                </div>

                {/* Dépouillement minimaliste : Barre de navigation et compteur */}
                <div className="flex items-center justify-between border-b border-ccjv-line/60 pb-3 pt-1">
                  <span className="font-serif text-sm italic text-ccjv-ink-secondary">
                    {sectionSubtitle}
                  </span>

                  <div className="flex items-center gap-2" aria-hidden="true">
                    {items.map((it, idx) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => selectItem(idx)}
                        className={cn(
                          "h-1 cursor-pointer rounded-none transition-all duration-500",
                          activeIndex === idx
                            ? "w-8 bg-ccjv-green"
                            : "w-3 bg-ccjv-line hover:bg-ccjv-ink-secondary/50"
                        )}
                        aria-label={`Afficher ${it.title}`}
                      />
                    ))}
                    <span className="ml-2 font-mono text-xs font-semibold text-ccjv-ink-secondary">
                      0{activeIndex + 1} / 0{items.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conteneur masqué en overflow: hidden garantissant zéro chevauchement */}
              <div
                className="relative min-h-[220px] w-full overflow-hidden sm:min-h-[240px] lg:min-h-[280px]"
                aria-live="polite"
              >
                <div className="grid grid-cols-1 grid-rows-1">
                  {items.map((item, index) => {
                    const isActive = activeIndex === index;
                    const isPast = index < activeIndex;
                    const isFuture = index > activeIndex;

                    return (
                      <article
                        key={item.id}
                        id={`triptych-panel-${item.id}`}
                        role="tabpanel"
                        aria-labelledby={`triptych-tab-${item.id}`}
                        aria-hidden={!isActive}
                        className={cn(
                          "col-start-1 row-start-1 flex flex-col justify-start",
                          // Émergence depuis le bas pour le suivant, sortie par le haut pour le précédent
                          reducedMotion
                            ? isActive
                              ? "opacity-100"
                              : "pointer-events-none opacity-0"
                            : cn(
                                "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                isActive && "pointer-events-auto translate-y-0 opacity-100",
                                isPast && "pointer-events-none -translate-y-full opacity-0",
                                isFuture && "pointer-events-none translate-y-full opacity-0"
                              )
                        )}
                      >
                        {/* Horaires / Contexte */}
                        <div className="font-sans text-xs font-semibold tracking-wider text-ccjv-green uppercase">
                          {item.eyebrow}
                        </div>

                        {/* Titre actif */}
                        <h3 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ccjv-ink sm:text-4xl xl:text-5xl">
                          {item.title}
                        </h3>

                        {/* Description synchronisée */}
                        <p className="mt-5 font-sans text-base leading-relaxed text-ccjv-ink-secondary sm:text-lg">
                          {item.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

