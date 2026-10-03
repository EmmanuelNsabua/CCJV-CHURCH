"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { primaryNav, type NavItem } from "@/lib/nav";
import { socials, site } from "@/data/mock/site";
import { images } from "@/data/mock/images";
import { CrossMark } from "@/components/shared/CrossMark";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Images associées à chaque pôle pour le volet droit */
const pillarVisuals: Record<string, { image: string; tag: string }> = {
  "Vie de l'Église": {
    image: images.communaute || "/media/ccjv-30.jpeg",
    tag: "Rassemblements & Vie communautaire",
  },
  "Communauté": {
    image: images.fraternite || "/media/ccjv-35.jpeg",
    tag: "Fraternité & Groupes de proximité",
  },
  "Organisation": {
    image: images.identite || "/media/ccjv-27.jpeg",
    tag: "Responsables & Départements actifs",
  },
  "Publications & Médias": {
    image: images.predication || "/media/ccjv-11.jpeg",
    tag: "Enseignements, Photos & Actualités",
  },
};

/**
 * Menu Plein Écran Redesigné (Desktop & Mobile) :
 * - Desktop : Piliers à gauche, volet dynamique animé à droite pour les sous-menus.
 * - Mobile : Navigation fluide par glissement de panneaux (liste → sous-menu avec retour).
 */
export function FullscreenMenu({ open, onClose }: FullscreenMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Pôle actif sur Desktop : null par défaut (aucun sous-menu ouvert à l'ouverture)
  const [activeDesktopPillar, setActiveDesktopPillar] = useState<NavItem | null>(null);

  // Navigation Mobile
  const [activeMobilePillar, setActiveMobilePillar] = useState<NavItem | null>(null);
  const [displayedMobilePillar, setDisplayedMobilePillar] = useState<NavItem | null>(null);

  const handleOpenMobileSubmenu = (item: NavItem) => {
    setDisplayedMobilePillar(item);
    setActiveMobilePillar(item);
  };

  const handleCloseMobileSubmenu = () => {
    setActiveMobilePillar(null);
  };

  // Verrouillage du scroll et réinitialisation
  useEffect(() => {
    if (!open) {
      setActiveMobilePillar(null);
      setDisplayedMobilePillar(null);
      setActiveDesktopPillar(null);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus initial, Échap et piège de focus
  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeMobilePillar) {
          handleCloseMobileSubmenu();
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
        "fixed inset-0 z-[100] overflow-y-auto bg-ccjv-black text-white transition-opacity duration-[500ms] ease-ccjv",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation principale"
      inert={!open}
    >
      <div className="flex min-h-full flex-col justify-between px-[clamp(24px,5vw,72px)] pt-20 pb-12">
        {/* =========================================================================
            VUE DESKTOP : PILIERS À GAUCHE / SOUS-MENUS DYNAMIQUES À DROITE
            ========================================================================= */}
        <div className="mx-auto hidden w-full max-w-[1320px] flex-1 items-center md:flex my-auto">
          <div className="grid w-full grid-cols-12 items-start gap-12 lg:gap-16">
            {/* Colonne gauche : Liste verticale des Piliers */}
            <nav
              className="col-span-5 lg:col-span-5 border-r border-white/12 pr-8 lg:pr-12"
              aria-label="Piliers du menu principal"
            >
              <p className="mb-6 font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-ccjv-cream uppercase">
                Menu
              </p>

              <ul className="flex flex-col divide-y divide-white/10">
                {primaryNav.map((item, index) => {
                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isSelected = activeDesktopPillar?.label === item.label;

                  return (
                    <li
                      key={item.href ?? item.label}
                      className={cn(
                        "py-4 first:pt-0 last:pb-0 transition-all duration-[400ms] ease-ccjv",
                        open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                      )}
                      style={open ? { transitionDelay: `${30 + index * 40}ms` } : undefined}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDesktopPillar((prev) =>
                              prev?.label === item.label ? null : item,
                            )
                          }
                          className={cn(
                            "group flex w-full items-center justify-between text-left transition-all duration-200 py-1.5 px-3 -mx-3",
                            isSelected
                              ? "bg-white/5 text-ccjv-cream"
                              : "text-white/70 hover:text-white hover:bg-white/[0.02]",
                          )}
                        >
                          <div className="flex items-baseline gap-4">
                            <span
                              className={cn(
                                "font-sans text-[0.75rem] font-semibold tracking-[0.14em] transition-colors",
                                isSelected ? "text-ccjv-cream" : "text-white/40 group-hover:text-ccjv-cream",
                              )}
                              aria-hidden="true"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span
                              className={cn(
                                "font-serif text-[clamp(1.45rem,1.1rem+1.2vw,2.1rem)] leading-tight transition-colors",
                                isSelected ? "text-ccjv-cream font-medium" : "text-white/85 group-hover:text-white",
                              )}
                            >
                              {item.label}
                            </span>
                          </div>

                          <span
                            className={cn(
                              "font-sans text-lg transition-all duration-200",
                              isSelected
                                ? "translate-x-0 text-ccjv-cream opacity-100"
                                : "-translate-x-1 text-white/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-0",
                            )}
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={item.href ?? "/"}
                          onClick={onClose}
                          className="group flex w-full items-center justify-between text-left py-1.5 px-3 -mx-3 transition-all duration-200 text-white/70 hover:text-white hover:bg-white/[0.02]"
                        >
                          <div className="flex items-baseline gap-4">
                            <span
                              className="font-sans text-[0.75rem] font-semibold tracking-[0.14em] text-white/40 group-hover:text-ccjv-cream transition-colors"
                              aria-hidden="true"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="font-serif text-[clamp(1.45rem,1.1rem+1.2vw,2.1rem)] leading-tight text-white/85 group-hover:text-white transition-colors">
                              {item.label}
                            </span>
                          </div>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Colonne droite : Volet dynamique animé des sous-menus */}
            <div className="col-span-7 lg:col-span-7 pl-2 lg:pl-6">
              {activeDesktopPillar && activeDesktopPillar.children && activeDesktopPillar.children.length > 0 ? (
                <div
                  key={activeDesktopPillar.label}
                  className="menu-submenu-in flex flex-col justify-between"
                >
                  {/* En-tête du pôle actif */}
                  <div className="border-b border-white/15 pb-6">
                    <h3 className="font-serif text-[clamp(1.8rem,1.4rem+1.4vw,2.5rem)] font-medium text-white leading-tight">
                      {activeDesktopPillar.label}
                    </h3>

                    {activeDesktopPillar.description && (
                      <p className="mt-2 font-sans text-sm text-white/60 max-w-[48ch]">
                        {activeDesktopPillar.description}
                      </p>
                    )}
                  </div>

                  {/* Grille / Liste des sous-menus */}
                  <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    {activeDesktopPillar.children.map((child, cIdx) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className="group flex flex-col justify-between border border-white/12 bg-white/[0.03] p-5 transition-all duration-200 hover:border-ccjv-cream hover:bg-white/[0.08]"
                        style={{ animationDelay: `${cIdx * 50}ms` }}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-[0.7rem] font-semibold tracking-[0.14em] text-ccjv-cream">
                              {String(cIdx + 1).padStart(2, "0")}
                            </span>
                            <span
                              className="text-sm text-white/40 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ccjv-cream"
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </div>
                          <h4 className="mt-3 font-serif text-xl font-medium text-white transition-colors group-hover:text-ccjv-cream">
                            {child.label}
                          </h4>
                          {child.description && (
                            <p className="mt-2 font-sans text-xs leading-relaxed text-white/50">
                              {child.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Aperçu visuel en bas du sous-menu */}
                  {pillarVisuals[activeDesktopPillar.label] && (
                    <div className="mt-8 flex items-center gap-5 border-t border-white/10 pt-6">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-white/10 border border-white/15">
                        <Image
                          src={pillarVisuals[activeDesktopPillar.label].image}
                          alt={activeDesktopPillar.label}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif text-sm text-white/80">
                          Découvrir la vie de cette section à Lubumbashi
                        </span>
                        <span className="font-sans text-xs text-white/45 mt-0.5">
                          Centre Chrétien Jésus ma Vie — Quartier Hewa Bora
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Panneau d'accueil si un lien direct est sélectionné */
                <div
                  key="welcome-panel"
                  className="menu-submenu-in flex flex-col justify-center border border-white/12 bg-white/[0.02] p-8 lg:p-12"
                >
                  <CrossMark size="md" className="text-ccjv-cream mb-6" />
                  <h3 className="font-serif text-2xl lg:text-3xl font-normal text-white leading-snug">
                    Centre Chrétien Jésus ma Vie
                  </h3>
                  <p className="mt-4 font-sans text-sm leading-relaxed text-white/65 max-w-[46ch]">
                    Une communauté vivante réunie à Lubumbashi pour adorer Dieu,
                    transmettre la foi et servir dans l&apos;amour fraternel.
                  </p>
                  <div className="mt-8 border-t border-white/12 pt-6">
                    <p className="font-sans text-xs text-ccjv-cream">
                      {site.location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            VUE MOBILE : GLISSEMENT FLUIDE EN 2 ÉTAPES
            ========================================================================= */}
        <div className="mx-auto w-full max-w-[480px] overflow-hidden md:hidden my-auto py-6">
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
                activeMobilePillar ? "pointer-events-none opacity-0" : "opacity-100",
              )}
              aria-hidden={Boolean(activeMobilePillar)}
            >
              <nav aria-label="Menu mobile principal">
                <p className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-cream uppercase">
                  Menu
                </p>
                <ul className="flex flex-col divide-y divide-white/12 border-y border-white/12">
                  {primaryNav.map((item, index) => (
                    <li key={item.href ?? item.label} className="py-4">
                      {item.children && item.children.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenMobileSubmenu(item)}
                          className="group flex w-full items-center justify-between text-left"
                        >
                          <div className="flex items-baseline gap-3">
                            <span
                              className="font-sans text-[0.75rem] font-semibold tracking-[0.12em] text-ccjv-cream"
                              aria-hidden="true"
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="font-serif text-[clamp(1.35rem,4.8vw,1.8rem)] leading-tight text-white transition-colors group-hover:text-ccjv-cream">
                              {item.label}
                            </span>
                          </div>
                          <span
                            className="font-sans text-lg text-ccjv-cream/70 transition-transform group-hover:translate-x-1 group-hover:text-ccjv-cream"
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
                          <span className="font-serif text-[clamp(1.35rem,4.8vw,1.8rem)] leading-tight text-white transition-colors group-hover:text-ccjv-cream">
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
                activeMobilePillar ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={!activeMobilePillar}
            >
              {displayedMobilePillar && (
                <nav aria-label={`Sous-menu ${displayedMobilePillar.label}`}>
                  {/* Bouton retour */}
                  <button
                    type="button"
                    onClick={handleCloseMobileSubmenu}
                    className="group mb-6 inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-cream uppercase transition-colors hover:text-white"
                  >
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:-translate-x-1"
                    >
                      ←
                    </span>
                    <span>Retour au menu</span>
                  </button>

                  {/* Titre du pôle */}
                  <div className="border-b border-white/15 pb-5">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-sans text-[0.75rem] font-semibold tracking-[0.12em] text-ccjv-cream/70"
                        aria-hidden="true"
                      >
                        {String(
                          primaryNav.findIndex(
                            (p) => p.label === displayedMobilePillar.label,
                          ) + 1,
                        ).padStart(2, "0")}
                      </span>
                      <span className="font-serif text-[clamp(1.5rem,5.2vw,2rem)] font-semibold leading-tight text-white">
                        {displayedMobilePillar.label}
                      </span>
                    </div>
                    {displayedMobilePillar.description && (
                      <p className="mt-2 pl-7 font-sans text-xs text-white/55">
                        {displayedMobilePillar.description}
                      </p>
                    )}
                  </div>

                  {/* Liste des sous-menus */}
                  {displayedMobilePillar.children &&
                    displayedMobilePillar.children.length > 0 && (
                      <ul className="mt-5 flex flex-col divide-y divide-white/10">
                        {displayedMobilePillar.children.map((child, cIndex) => (
                          <li
                            key={child.href}
                            className="py-3.5 first:pt-0 last:pb-0"
                          >
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className="group block"
                            >
                              <div className="flex items-baseline justify-between gap-3">
                                <div className="flex items-baseline gap-3">
                                  <span
                                    className="font-sans text-[0.7rem] font-semibold tracking-[0.12em] text-ccjv-cream/70"
                                    aria-hidden="true"
                                  >
                                    {String(cIndex + 1).padStart(2, "0")}
                                  </span>
                                  <span className="font-serif text-base font-medium text-white/95 transition-colors group-hover:text-ccjv-cream">
                                    {child.label}
                                  </span>
                                </div>
                                <span className="text-xs text-white/40 group-hover:text-ccjv-cream">
                                  →
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

        {/* =========================================================================
            PIED DU MENU : RÉSEAUX & INFOS INSTITUTIONNELLES
            ========================================================================= */}
        <div className="mx-auto mt-8 flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-6 border-t border-white/12 pt-6">
          <div className="flex flex-wrap items-center gap-6">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs text-ccjv-cream underline underline-offset-4 hover:text-white"
              >
                {social.label}
              </a>
            ))}
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-ccjv-cream underline underline-offset-4 hover:text-white"
            >
              WhatsApp
            </a>
          </div>
          <p className="font-sans text-xs text-white/50">{site.location}</p>
        </div>
      </div>

      {/* Bouton Fermer */}
      <button
        ref={closeRef}
        type="button"
        className="absolute top-5 right-[clamp(16px,4vw,48px)] inline-flex min-h-[44px] items-center gap-2 px-3 text-white transition-colors hover:text-ccjv-cream"
        onClick={onClose}
        aria-label="Fermer le menu"
      >
        <span className="text-[1.8rem] leading-none" aria-hidden="true">
          ✕
        </span>
        <span className="font-sans text-xs font-semibold tracking-wider uppercase max-sm:hidden">
          Fermer
        </span>
      </button>
    </div>
  );
}
