"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Calendar,
  Image as ImageIcon,
  FileText,
  HeartHandshake,
  MessageSquareQuote,
  Users,
  Layers,
  Shield,
  Settings,
  X,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

interface AdminMobileFullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GridMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  category: string;
}

const gridMenuItems: GridMenuItem[] = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard, category: "Accueil" },
  { label: "Publications", href: "/admin/publications", icon: BookOpen, category: "Contenus" },
  { label: "Enseignements", href: "/admin/enseignements", icon: GraduationCap, category: "Contenus" },
  { label: "Agenda & Cultes", href: "/admin/agenda", icon: Calendar, category: "Contenus" },
  { label: "Médiathèque", href: "/admin/media", icon: ImageIcon, category: "Contenus" },
  { label: "Guides d'études", href: "/admin/publications?type=GUIDE_ETUDE", icon: FileText, category: "Contenus" },
  { label: "Prières", href: "/admin/prayers", icon: HeartHandshake, category: "Communauté" },
  { label: "Témoignages", href: "/admin/testimonies", icon: MessageSquareQuote, category: "Communauté" },
  { label: "Départements", href: "/admin/departments", icon: Users, category: "Communauté" },
  { label: "Éditeur de pages", href: "/admin/pages", icon: Layers, category: "Configuration" },
  { label: "Administrateurs", href: "/admin/administrateurs", icon: Shield, category: "Configuration" },
  { label: "Paramètres", href: "/admin/settings", icon: Settings, category: "Configuration" },
];

export function AdminMobileFullscreenMenu({
  isOpen,
  onClose,
}: AdminMobileFullscreenMenuProps) {
  const pathname = usePathname();
  const { adminProfile, user, signOut } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 bg-[#fafaf7] flex flex-col p-4 sm:p-6 overflow-y-auto md:hidden animate-in fade-in duration-200"
    >
      {/* En-tête du menu plein écran */}
      <div className="flex items-center justify-between pb-4 border-b border-ccjv-line">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-ccjv-green flex items-center justify-center font-bold text-white text-xs font-serif rounded-none">
            C
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-ccjv-ink tracking-tight">
              CCJV-CHURCH
            </h2>
            <p className="text-[10px] font-mono text-ccjv-ink-secondary uppercase tracking-widest -mt-0.5">
              Menu de navigation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-ccjv-ink hover:bg-ccjv-offwhite border border-ccjv-line rounded-none transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Grille des menus (12 tuiles tactiles) */}
      <div className="my-auto py-6">
        <p className="text-[11px] font-mono uppercase text-ccjv-ink-secondary tracking-wider mb-3 text-center">
          Sélectionnez un module
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gridMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "p-4 border rounded-none flex flex-col items-center justify-center text-center gap-2 transition-all group",
                  isActive
                    ? "bg-ccjv-green text-white border-ccjv-green shadow-xs"
                    : "bg-white border-ccjv-line text-ccjv-ink hover:border-ccjv-green hover:bg-white active:bg-ccjv-offwhite",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-ccjv-green",
                  )}
                />
                <span className="font-sans text-xs font-semibold leading-tight line-clamp-1">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-mono uppercase tracking-wider",
                    isActive ? "text-white/80" : "text-ccjv-ink-secondary/70",
                  )}
                >
                  {item.category}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pied de page du menu mobile */}
      <div className="pt-4 border-t border-ccjv-line space-y-3">
        <div className="flex items-center justify-between text-xs text-ccjv-ink-secondary">
          <span className="truncate font-medium text-ccjv-ink">
            {adminProfile?.displayName || user?.email}
          </span>
          <span className="text-[10px] font-mono uppercase">
            {adminProfile?.role || "ADMIN"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-sans text-ccjv-ink hover:bg-ccjv-offwhite border border-ccjv-line rounded-none transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Site public</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              signOut();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-sans text-[#b91c1c] hover:bg-[#fef2f2] border border-[#fecaca] rounded-none transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
