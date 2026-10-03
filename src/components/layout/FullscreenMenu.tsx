"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { primaryNav, type NavItem } from "@/lib/nav";
import { socials, site } from "@/data/mock/site";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mega menu plein écran (Desktop **et** Mobile — élément identitaire CCJV).
 * - Sur Desktop : vue en grille avec tous les piliers et leurs sous-pages.
 * - Sur Mobile : navigation par étapes (liste des piliers, puis sous-menu dédié avec bouton retour).
 */
export function FullscreenMenu({ open, onClose }: FullscreenMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeMobilePillar, setActiveMobilePillar] = useState<NavItem | null>(
    null,
  );
  const [displayedPillar, setDisplayedPillar] = useState<NavItem | null>(null);

  const handleOpenSubmenu = (item: NavItem) => {
    setDisplayedPillar(item);
    setActiveMobilePillar(item);
  };

  const handleCloseSubmenu = () => {
    setActiveMobilePillar(null);
  };

  // Verrouillage du scroll et réinitialisation du sous-menu mobile.
  useEffect(() => {
    if (!open) {
      setActiveMobilePillar(null);
      setDisplayedPillar(null);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus initial, Échap et piège de focus.
  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeMobilePillar) {
          handleCloseSubmenu();
        } else {
          onClose();
        }
        return;
      }
      if (event.key !== "Tab") return;

      const overlay = overlayRef.current;
      if (!overlay) return;

      const focusables = Array.from(
        overlay.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.getAttribute("aria-disabled") !== "true");

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, activeMobilePillar]);

  return (
    <div
      ref={overlayRef}
      id="site-menu"
      className={cn(
        "fixed inset-0 z-[100] overflow-y-auto bg-ccjv-black text-white transition-opacity duration-[550ms] ease-ccjv",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation principale"
      inert={!open}
    >
      <div className="flex min-h-full flex-col justify-center px-[clamp(24px,6vw,64px)] py-24">
        {/* ===================== VUE DESKTOP (Grille) ===================== */}
        <nav
          className="mx-auto hidden w-full max-w-[1200px] md:block"
          aria-label="Pages du site (desktop)"
        >
          <ul className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
            {primaryNav.map((item, index) => (
              <li
                key={item.href ?? item.label}
                className={cn(
                  "border-t border-white/12 pt-6 transition-[opacity,transform] duration-[550ms] ease-ccjv",
                  open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                )}
                style={
                  open ? { transitionDelay: `${40 + index * 45}ms` } : undefined
                }
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-baseline gap-3"
                  >
                    <span
                      className="font-sans text-[0.7rem] font-semibold tracking-[0.12em] text-ccjv-cream"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-[clamp(1.4rem,0.9rem+1.4vw,2rem)] leading-tight transition-colors duration-[150ms] group-hover:text-ccjv-cream">
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  /* Pôle de regroupement : il n'a pas de page, donc pas de lien. */
                  <p className="flex items-baseline gap-3">
                    <span
                      className="font-sans text-[0.7rem] font-semibold tracking-[0.12em] text-ccjv-cream/70"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-[clamp(1.4rem,0.9rem+1.4vw,2rem)] leading-tight text-white/85">
                      {item.label}
                    </span>
                  </p>
                )}

                {item.description && (
                  <p className="mt-2 font-sans text-sm text-white/50">
                    {item.description}
                  </p>
                )}

                {item.children && item.children.length > 0 && (
                  <ul className="mt-5 flex flex-col gap-3 border-l border-white/15 pl-5">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className="group block"
                        >
                          <span className="font-sans text-sm font-medium text-white/90 transition-colors duration-[150ms] group-hover:text-ccjv-cream">
                            {child.label}
                          </span>
                          {child.description && (
                            <span className="mt-0.5 block font-sans text-xs text-white/45">
                              {child.description}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* ===================== VUE MOBILE AVEC GLISSEMENT FLUIDE ===================== */}
        <div className="mx-auto w-full max-w-[480px] overflow-hidden md:hidden">
          <div
            className={cn(
              "flex w-[200%] transition-transform duration-[380ms] ease-ccjv",
              activeMobilePillar ? "-translate-x-1/2" : "translate-x-0",
            )}
          >
            {/* Panneau 1 : Liste des piliers */}
            <div
              className={cn(
                "w-1/2 pr-4 transition-opacity duration-300",
                activeMobilePillar
                  ? "pointer-events-none opacity-0"
                  : "opacity-100",
              )}
              aria-hidden={Boolean(activeMobilePillar)}
            >
              <nav aria-label="Menu mobile principal">
                <p className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-cream uppercase">
                  Menu
                </p>
                <ul className="flex flex-col divide-y divide-white/12 border-y border-white/12">
                  {primaryNav.map((item, index) => (
                    <li key={item.href ?? item.label} className="py-4.5">
                      {item.children && item.children.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSubmenu(item)}
                          className="group flex w-full items-center justify-between text-left"
                        >
                          <div className="flex items-baseline gap-3">
                            <span
                              className="font-sans text-[0.75rem] font-semibold tracking-[0.12em] text-ccjv-cream"
                              aria-hidden="true"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="font-serif text-[clamp(1.4rem,5vw,1.85rem)] leading-tight text-white transition-colors group-hover:text-ccjv-cream">
                              {item.label}
                            </span>
                          </div>
                          <span
                            className="font-sans text-xl text-ccjv-cream/70 transition-transform group-hover:translate-x-1 group-hover:text-ccjv-cream"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={item.href ?? "/"}
                          onClick={onClose}
                          className="group flex items-baseline gap-3 text-left"
                        >
                          <span
                            className="font-sans text-[0.75rem] font-semibold tracking-[0.12em] text-ccjv-cream"
                            aria-hidden="true"
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-serif text-[clamp(1.4rem,5vw,1.85rem)] leading-tight text-white transition-colors group-hover:text-ccjv-cream">
                            {item.label}
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Panneau 2 : Sous-menu dédié */}
            <div
              className={cn(
                "w-1/2 pl-4 transition-opacity duration-300",
                activeMobilePillar
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              aria-hidden={!activeMobilePillar}
            >
              {displayedPillar && (
                <nav aria-label={`Sous-menu ${displayedPillar.label}`}>
                  {/* Bouton retour */}
                  <button
                    type="button"
                    onClick={handleCloseSubmenu}
                    className="group mb-8 inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-cream uppercase transition-colors hover:text-white"
                  >
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:-translate-x-1"
                    >
                      ←
                    </span>
                    <span>Retour</span>
                  </button>

                  {/* Titre du pôle — regroupement, donc non cliquable */}
                  <div className="border-b border-white/15 pb-6">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span
                          className="font-sans text-[0.75rem] font-semibold tracking-[0.12em] text-ccjv-cream/70"
                          aria-hidden="true"
                        >
                          {String(
                            primaryNav.findIndex(
                              (p) => p.label === displayedPillar.label,
                            ) + 1,
                          ).padStart(2, "0")}
                        </span>
                        <span className="font-serif text-[clamp(1.55rem,5.5vw,2.1rem)] font-semibold leading-tight text-white">
                          {displayedPillar.label}
                        </span>
                      </div>
                      {displayedPillar.description && (
                        <p className="mt-2 pl-7 font-sans text-sm text-white/55">
                          {displayedPillar.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sous-menus en bas */}
                  {displayedPillar.children &&
                    displayedPillar.children.length > 0 && (
                      <ul className="mt-6 flex flex-col divide-y divide-white/10">
                        {displayedPillar.children.map((child, cIndex) => (
                          <li
                            key={child.href}
                            className="py-4 first:pt-0 last:pb-0"
                          >
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className="group block"
                            >
                              <div className="flex items-baseline gap-3">
                                <span
                                  className="font-sans text-[0.7rem] font-semibold tracking-[0.12em] text-ccjv-cream/70"
                                  aria-hidden="true"
                                >
                                  {String(cIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="font-serif text-[clamp(1.25rem,4.2vw,1.55rem)] font-medium leading-tight text-white/95 transition-colors group-hover:text-ccjv-cream">
                                  {child.label}
                                </span>
                              </div>
                              {child.description && (
                                <p className="mt-1 pl-6 font-sans text-xs text-white/50">
                                  {child.description}
                                </p>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Footer du menu */}
        <div className="mx-auto mt-16 flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-6 border-t border-white/12 pt-6">
          <div className="flex flex-wrap items-center gap-6">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ccjv-cream underline underline-offset-4 hover:text-white"
              >
                {social.label}
              </a>
            ))}
          </div>
          <p className="font-sans text-xs text-white/50">{site.location}</p>
        </div>
      </div>

      <button
        ref={closeRef}
        type="button"
        className="absolute top-4 right-[clamp(16px,4vw,48px)] inline-flex min-h-[44px] items-center gap-2 px-3 text-white hover:text-ccjv-cream"
        onClick={onClose}
      >
        <span className="text-[1.9rem] leading-none" aria-hidden="true">
          ×
        </span>
        <span className="font-sans text-[0.85rem] max-sm:hidden">Fermer</span>
      </button>
    </div>
  );
}
