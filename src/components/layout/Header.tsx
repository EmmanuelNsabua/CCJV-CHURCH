"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { site } from "@/data/mock/site";
import { FullscreenMenu } from "./FullscreenMenu";

/** Routes connues disposant d'un Hero sombre immersif au sommet */
const darkHeroRoutes = [
  "/",
  "/qui-sommes-nous",
  "/communaute/groupes-de-maison",
  "/communaute/parcours-nouveau",
  "/communaute/priere-et-intercession",
  "/communaute/temoignages",
  "/vie-de-leglise/evenements",
  "/publications/mediatheque",
  "/organisation/responsables",
  "/organisation/departements",
];

/**
 * Header contextuel :
 * - Transparent au sommet de page (adapté au fond clair ou sombre du Hero)
 * - Devient solide (`bg-ccjv-offwhite` + bordure fine) dès que l'on scrolle (> 24px)
 * - Comportement fluide et unifié sur l'ensemble des pages du site.
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkHero, setIsDarkHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Détection du scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Détection dynamique du thème du Hero au changement de page
  useEffect(() => {
    const isKnownDarkRoute = darkHeroRoutes.some(
      (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
    );

    if (isKnownDarkRoute) {
      setIsDarkHero(true);
      return;
    }

    // Détection via le DOM pour les pages dynamiques ou nouvellement ajoutées
    const topSection = document.querySelector(
      "main > section:first-of-type, section:first-of-type, [data-hero-dark]",
    );

    if (topSection) {
      const cls = topSection.className || "";
      const hasDarkClasses =
        cls.includes("bg-ccjv-black") ||
        cls.includes("bg-black") ||
        cls.includes("text-white");
      setIsDarkHero(hasDarkClasses);
    } else {
      setIsDarkHero(false);
    }
  }, [pathname]);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const isSolid = scrolled;
  const isWhiteText = !isSolid && isDarkHero;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,color,border-color,box-shadow] duration-300 ease-out",
          isSolid
            ? "border-b border-ccjv-line bg-ccjv-offwhite/95 backdrop-blur-md text-ccjv-ink shadow-xs"
            : isWhiteText
              ? "bg-transparent text-white border-b border-transparent"
              : "bg-transparent text-ccjv-ink border-b border-transparent",
        )}
      >
        <div className="container flex h-18 items-center justify-between">
          <Link
            href="/"
            className="flex min-h-11 items-center"
            aria-label={`${site.name} — retour à l'accueil`}
          >
            <div className="relative h-14 w-14 sm:h-16 sm:w-16">
              <Image
                src="/logo_2.png"
                alt={site.name}
                fill
                priority
                className={cn(
                  "object-contain transition-[filter] duration-300 ease-out",
                  isSolid || !isDarkHero ? "invert" : "invert-0",
                )}
                sizes="48px"
              />
            </div>
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-11 items-center gap-3 rounded-none px-3 transition-opacity hover:opacity-80"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={openMenu}
          >
            <span className="font-sans text-[0.9rem] font-medium max-md:hidden">
              Menu
            </span>
            <span
              className="inline-flex w-6 flex-col gap-1.5"
              aria-hidden="true"
            >
              <span className="block h-0.5 w-full bg-current" />
              <span className="block h-0.5 w-full bg-current" />
            </span>
          </button>
        </div>
      </header>

      <FullscreenMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
