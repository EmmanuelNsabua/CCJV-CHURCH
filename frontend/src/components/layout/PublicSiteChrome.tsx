"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { IntroCurtain, type IntroVerse } from "@/components/layout/IntroCurtain";
import type { SocialLink } from "@/lib/api";

interface PublicSiteChromeProps {
  children: React.ReactNode;
  /**
   * Liens sociaux institutionnels, lus côté serveur (`getSettings().socialLinks`)
   * et descendus jusqu'au Footer et au menu plein écran.
   */
  socialLinks: SocialLink[];
  /** Verset du rideau d'introduction (`getScripture("rassemblement")`). */
  verse: IntroVerse | null;
  /** Réglages scalaires pour l'adresse dynamique et les métadonnées. */
  settings?: Record<string, string>;
}

/**
 * Encadre les pages publiques avec le Header, Footer, IntroCurtain et skip-link.
 * Isole hermétiquement les routes du back-office (/admin/*) pour qu'elles
 * n'héritent d'aucun de ces éléments (règle GEMINI.md §2).
 *
 * Composant client (état de menu, détection de scroll) : il ne lit jamais l'API
 * lui-même. `src/app/layout.tsx`, qui est un composant serveur, lui transmet les
 * données institutionnelles en props.
 */
export function PublicSiteChrome({
  children,
  socialLinks,
  verse,
  settings,
}: PublicSiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <IntroCurtain verse={verse} />
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Header socialLinks={socialLinks} />
      <main id="contenu">{children}</main>
      <Footer socialLinks={socialLinks} address={settings?.["site.address"]} />
    </>
  );
}
