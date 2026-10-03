"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { site } from "@/data/mock/site";
import { FullscreenMenu } from "./FullscreenMenu";

/**
 * Header contextuel : transparent au-dessus du Hero (accueil), solide dès qu'on
 * scrolle ou sur les pages internes. Le nom complet se replie vers le sigle
 * « CCJV » lorsque le header devient solide.
 */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  // Pages avec un Hero sombre plein écran / immersif au sommet
  const hasDarkHero =
    pathname === "/" ||
    pathname === "/qui-sommes-nous" ||
    pathname.startsWith("/qui-sommes-nous/") ||
    pathname === "/publications/mediatheque" ||
    pathname === "/vie-de-leglise/evenements" ||
    pathname.startsWith("/vie-de-leglise/evenements/") ||
    pathname === "/organisation/responsables" ||
    pathname.startsWith("/organisation/departements/") ||
    pathname === "/communaute/temoignages";

  const solid = !hasDarkHero || scrolled;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,color,border-color] duration-250ms ease-ccjv",
          solid
            ? "border-b border-ccjv-line bg-ccjv-offwhite text-ccjv-ink"
            : "bg-transparent text-white",
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
                  "object-contain transition-[filter] duration-250 ease-ccjv",
                  solid ? "invert" : "invert-0",
                )}
                sizes="48px"
              />
            </div>
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-11 items-center gap-3 rounded-none px-3"
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
