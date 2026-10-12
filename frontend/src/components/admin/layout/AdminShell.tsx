"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminMobileFullscreenMenu } from "./AdminMobileFullscreenMenu";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // État du menu plein écran mobile
  const [fullscreenMobileMenuOpen, setFullscreenMobileMenuOpen] = useState(false);

  // Écran de connexion exempté de la coquille d'administration
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/connexion";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Fermer automatiquement le menu mobile si la route change
  useEffect(() => {
    setFullscreenMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-ccjv-offwhite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin border-2 border-ccjv-green border-r-transparent rounded-none" />
          <p className="text-xs text-ccjv-ink-secondary font-mono uppercase tracking-wider">
            Chargement de la session CCJV...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-ccjv-offwhite font-sans antialiased text-ccjv-ink flex">
      {/* =========================================================================
          A. DESKTOP : Sidebar Fixe h-screen à gauche (270px)
          Verrouillée en permanence, ne défile JAMAIS avec le contenu principal.
         ========================================================================= */}
      <div className="hidden md:flex w-[270px] shrink-0 h-full overflow-hidden bg-[#121212]">
        <AdminSidebar className="h-full w-[270px]" />
      </div>

      {/* =========================================================================
          MAIN SCREEN (À droite, Topbar fixe et zone de défilement indépendante)
         ========================================================================= */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        {/* Topbar fixe (Recherche à gauche, Notifications & Profil à droite) */}
        <AdminTopbar />

        {/* Zone de contenu principale : SEUL élément qui défile */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* =========================================================================
          B. MOBILE : Bouton FAB en bas à droite (Menu Hamburger)
         ========================================================================= */}
      <button
        type="button"
        onClick={() => setFullscreenMobileMenuOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-5 right-5 z-50 md:hidden flex h-13 w-13 items-center justify-center rounded-none shadow-xl border transition-all active:scale-95 cursor-pointer",
          fullscreenMobileMenuOpen
            ? "bg-[#b91c1c] text-white border-white/20"
            : "bg-[#121212] hover:bg-ccjv-green text-white border-white/20",
        )}
        aria-label={fullscreenMobileMenuOpen ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation"}
      >
        {fullscreenMobileMenuOpen ? (
          <X className="h-6 w-6 stroke-[2.2]" />
        ) : (
          <Menu className="h-6 w-6 stroke-[2.2]" />
        )}
      </button>

      {/* =========================================================================
          B. MOBILE : Menu plein écran (Fullscreen Menu) avec grille de modules
         ========================================================================= */}
      <AdminMobileFullscreenMenu
        isOpen={fullscreenMobileMenuOpen}
        onClose={() => setFullscreenMobileMenuOpen(false)}
      />
    </div>
  );
}
