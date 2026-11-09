"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/data/site";
import { FullscreenMenu } from "./FullscreenMenu";
import type { SocialLink } from "@/lib/api";

/** Routes connues disposant d'un Hero sombre immersif ou photo au sommet */
const darkHeroRoutes = [
  "/",
  "/qui-sommes-nous",
  "/communaute",
  "/vie-de-leglise/evenements",
  "/organisation",
  "/publications/actualites",
  "/actualites",
];

/** Routes qui doivent TOUJOURS avoir la barre de navigation opaque dès la position 0 */
const alwaysOpaqueRoutes = [
  "/publications/mediatheque",
  "/publications/ressources",
  "/publications/enseignements",
  "/recherche",
];

/**
 * Header flottant en forme de barre détachée des bordures de l'écran :
 * - Opacité 0 au sommet de page lorsque le Hero est une photo
 * - Fond blanc avec bordure dès qu'on scrolle
 * - Logo église à gauche, barre de recherche et bouton « Menu » (sans hamburger) à droite.
 */
export function Header({ socialLinks }: { socialLinks: SocialLink[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkHero, setIsDarkHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Détection des pages devant être toujours opaques
  const isAlwaysOpaque = alwaysOpaqueRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

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
        cls.includes("text-white") ||
        cls.includes("hero-dark");
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/recherche?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/recherche");
    }
  };

  const isSolid = scrolled || isAlwaysOpaque;
  const isWhiteText = !isSolid && isDarkHero;

  return (
    <>
      <header
        className={cn(
          "fixed top-3 sm:top-4 inset-x-3 sm:inset-x-6 lg:inset-x-8 max-w-7xl mx-auto z-60 transition-[background-color,color,border-color,box-shadow] duration-300 ease-out rounded-none",
          isSolid
            ? "border border-ccjv-line bg-white/95 backdrop-blur-md text-ccjv-ink shadow-md"
            : isWhiteText
              ? "bg-transparent text-white border border-transparent"
              : "border border-ccjv-line bg-white/95 backdrop-blur-md text-ccjv-ink shadow-md",
        )}
      >
        <div className="flex px-4 sm:px-6 py-2 sm:py-2.5 items-center justify-between">
          <Link
            href="/"
            className="flex min-h-10 items-center"
            aria-label={`${site.name} — retour à l'accueil`}
          >
            <div className="relative h-11 w-11 sm:h-12 sm:w-12">
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

          <div className="flex items-center gap-3 sm:gap-4">
            <form
              onSubmit={handleSearchSubmit}
              className={cn(
                "relative flex items-center transition-all duration-200 border rounded-none",
                isSolid || !isWhiteText
                  ? "bg-neutral-100/90 border-ccjv-line focus-within:border-ccjv-green focus-within:bg-white text-ccjv-ink"
                  : "bg-white/10 border-white/30 focus-within:bg-black/50 focus-within:border-white text-white backdrop-blur-xs",
              )}
            >
              <input
                type="search"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher dans les publications"
                className={cn(
                  "w-24 sm:w-44 md:w-56 px-3 py-1.5 text-xs sm:text-sm bg-transparent outline-none",
                  isSolid || !isWhiteText
                    ? "placeholder:text-ccjv-ink-secondary text-ccjv-ink"
                    : "placeholder:text-white/70 text-white",
                )}
              />
              <button
                type="submit"
                aria-label="Lancer la recherche"
                className={cn(
                  "px-2.5 py-1.5 transition-opacity hover:opacity-80 cursor-pointer",
                  isSolid || !isWhiteText ? "text-ccjv-ink-secondary" : "text-white",
                )}
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <button
              ref={menuButtonRef}
              type="button"
              className={cn(
                "inline-flex items-center justify-center font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase px-4 sm:px-5 py-2 transition-all duration-200 rounded-none cursor-pointer",
                isSolid || !isWhiteText
                  ? "bg-ccjv-green hover:bg-ccjv-green/90 text-white shadow-xs"
                  : "bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-xs",
              )}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={openMenu}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      <FullscreenMenu
        open={menuOpen}
        onClose={closeMenu}
        socialLinks={socialLinks}
      />
    </>
  );
}
