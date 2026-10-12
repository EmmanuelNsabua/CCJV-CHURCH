"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { IntroCurtain } from "@/components/layout/IntroCurtain";

interface PublicSiteChromeProps {
  children: React.ReactNode;
}

/**
 * Encadre les pages publiques avec le Header, Footer, IntroCurtain et skip-link.
 * Isole hermétiquement les routes du back-office (/admin/*) pour qu'elles
 * n'héritent d'aucun de ces éléments (règle GEMINI.md §2).
 */
export function PublicSiteChrome({ children }: PublicSiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <IntroCurtain />
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}
