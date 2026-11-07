"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminMobileFullscreenMenu } from "./AdminMobileFullscreenMenu";
import { MandatoryPasswordChangeScreen } from "@/components/admin/auth/MandatoryPasswordChangeScreen";
import { Menu, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminShellProps {
  children: React.ReactNode;
}

const GLOBAL_ONLY_PREFIXES = [
  "/admin/settings",
  "/admin/administrateurs",
  "/admin/pages",
  "/admin/prayers",
  "/admin/testimonies",
  "/admin/departments",
  "/admin/logs",
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, adminProfile, user, refreshProfile } = useAuth();

  // État du menu plein écran mobile
  const [fullscreenMobileMenuOpen, setFullscreenMobileMenuOpen] = useState(false);

  // Écran de connexion exempté de la coquille d'administration
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/connexion";

  const isGlobalScope = adminProfile?.scope === "GLOBAL";
  const isGlobalOnlyRoute = GLOBAL_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Protection stricte de route : refuser l'accès aux sections globales pour les responsables de département
  useEffect(() => {
    if (!isLoading && isAuthenticated && adminProfile && !isGlobalScope && isGlobalOnlyRoute) {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, adminProfile, isGlobalScope, isGlobalOnlyRoute, router]);

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

  // Obligation de changement de mot de passe à la première connexion avant d'accéder au portail
  const mustChangePassword = Boolean(
    adminProfile?.mustChangePassword || user?.user_metadata?.mustChangePassword,
  );
  if (mustChangePassword) {
    return <MandatoryPasswordChangeScreen onSuccess={() => void refreshProfile()} />;
  }

  // Écran de blocage si un responsable tente d'accéder manuellement à une route d'administration générale
  if (isGlobalOnlyRoute && !isGlobalScope) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-ccjv-offwhite p-6">
        <div className="max-w-md w-full border border-ccjv-line bg-white p-8 text-center shadow-lg animate-in fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center bg-[#fef2f2] text-[#b91c1c] mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-ccjv-ink">Accès réservé</h2>
          <p className="mt-2 font-sans text-xs text-ccjv-ink-secondary leading-relaxed">
            Ce module est strictement réservé à l&apos;Administration Générale. Redirection vers votre espace de travail…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-ccjv-offwhite font-sans antialiased text-ccjv-ink flex">
      {/* =========================================================================
          A. DESKTOP : Sidebar Fixe h-screen à gauche (220px)
          Verrouillée en permanence, ne défile JAMAIS avec le contenu principal.
         ========================================================================= */}
      <div className="hidden md:flex w-[220px] shrink-0 h-full overflow-hidden bg-[#121212]">
        <AdminSidebar className="h-full w-[220px]" />
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
