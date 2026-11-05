"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  UserCheck,
  Layers,
  Sliders,
  Shield,
  MapPin,
  Clock,
  Share2,
  Phone,
  ChevronRight,
  ChevronLeft,
  X,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AdminRole } from "@/lib/api/types";

export interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  typeParam?: string;
  subItems?: SubNavItem[];
  requiredRole?: AdminRole;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const adminNavSections: NavSection[] = [
  {
    items: [
      {
        id: "overview",
        label: "Vue d'ensemble",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: "CONTENUS",
    items: [
      {
        id: "publications",
        label: "Publications",
        href: "/admin/publications",
        icon: BookOpen,
      },
      {
        id: "teachings",
        label: "Enseignements",
        href: "/admin/enseignements",
        icon: GraduationCap,
      },
      {
        id: "agenda",
        label: "Agenda",
        href: "/admin/agenda",
        icon: Calendar,
      },
      {
        id: "media",
        label: "Médiathèque",
        href: "/admin/media",
        icon: ImageIcon,
      },
      {
        id: "resources",
        label: "Ressources",
        href: "/admin/ressources",
        icon: FileText,
      },
    ],
  },
  {
    title: "COMMUNAUTÉ",
    items: [
      {
        id: "prayers",
        label: "Prières",
        href: "/admin/prayers",
        icon: HeartHandshake,
      },
      {
        id: "testimonies",
        label: "Témoignages",
        href: "/admin/testimonies",
        icon: MessageSquareQuote,
      },
      {
        id: "departments",
        label: "Départements",
        href: "/admin/departments",
        icon: Users,
        subItems: [
          { label: "Départements & Pôles", href: "/admin/departments", icon: Users },
          { label: "Leaders & Responsables", href: "/admin/departments/leaders", icon: UserCheck },
          { label: "Visages communautaires", href: "/admin/departments/community-faces", icon: HeartHandshake },
        ],
      },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      {
        id: "pages",
        label: "Éditeur de pages",
        href: "/admin/pages",
        icon: Layers,
      },
      {
        id: "settings",
        label: "Paramètres",
        href: "/admin/settings",
        icon: Sliders,
        subItems: [
          { label: "Préférences", href: "/admin/settings?section=preferences", icon: Sliders },
          { label: "Adresse & Localisation", href: "/admin/settings?section=address", icon: MapPin },
          { label: "Horaires de l'église", href: "/admin/settings?section=schedule", icon: Clock },
          { label: "Réseaux sociaux", href: "/admin/settings?section=social", icon: Share2 },
          { label: "Gestion des contacts", href: "/admin/settings?section=contact", icon: Phone },
        ],
      },
      {
        id: "admins",
        label: "Administrateurs",
        href: "/admin/administrateurs",
        icon: Shield,
      },
      {
        id: "logs",
        label: "Logs système",
        href: "/admin/logs",
        icon: Terminal,
        requiredRole: "SUPER_ADMIN",
      },
    ],
  },
];

export interface AdminSidebarProps {
  onCloseMobile?: () => void;
  className?: string;
}

export function AdminSidebar({ onCloseMobile, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");
  const { role } = useAuth();

  // Navigation filtrée strictement selon le rôle (les modules exclus, ex: Logs pour non-superadmin, sont masqués)
  const filteredNavSections = useMemo(() => {
    return adminNavSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.requiredRole || item.requiredRole === role,
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [role]);

  // Initialisation intelligente selon la route courante
  const [activeSubMenuId, setActiveSubMenuId] = useState<string | null>(() => {
    for (const section of filteredNavSections) {
      for (const item of section.items) {
        if (item.subItems && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
          return item.id;
        }
      }
    }
    return null;
  });

  const prevPathRef = useRef(pathname);

  // Synchronisation avec les changements réels d'URL
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      let matchedSubId: string | null = null;
      for (const section of filteredNavSections) {
        for (const item of section.items) {
          if (item.subItems && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
            matchedSubId = item.id;
            break;
          }
        }
      }
      setActiveSubMenuId(matchedSubId);
    }
  }, [pathname, filteredNavSections]);

  // Récupère l'élément parent dont on affiche le sous-menu (s'il existe)
  const activeItemWithSub = useMemo(() => {
    if (!activeSubMenuId) return null;
    for (const section of filteredNavSections) {
      for (const item of section.items) {
        if (item.id === activeSubMenuId && item.subItems) {
          return item;
        }
      }
    }
    return null;
  }, [activeSubMenuId, filteredNavSections]);

  const isSubItemActive = (subHref: string, parentHref: string) => {
    if (subHref.includes("?")) {
      const [subPath, subQuery] = subHref.split("?");
      if (pathname !== subPath) return false;
      const subParams = new URLSearchParams(subQuery);
      for (const [key, value] of subParams.entries()) {
        const currentVal = searchParams.get(key);
        if (currentVal !== value) {
          // Si la sous-page demandée est "preferences" et qu'aucun query param ?section= n'est dans l'URL
          if (key === "section" && value === "preferences" && !currentVal) {
            continue;
          }
          return false;
        }
      }
      return true;
    }

    if (subHref === parentHref) {
      return pathname === parentHref && !searchParams.get("section");
    }
    return pathname === subHref || pathname.startsWith(`${subHref}/`);
  };

  const isItemActive = (item: NavItem) => {
    if (item.typeParam) {
      return pathname.startsWith("/admin/publications") && currentType === item.typeParam;
    }
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <aside
      className={cn(
        "flex h-full w-[220px] flex-col justify-between bg-[#121212] text-white select-none border-r border-white/10 overflow-y-auto",
        className,
      )}
    >
      <div className="flex flex-col shrink-0">
        {/* =========================================================================
            En-tête Sidebar : LOGO OFFICIEL CCJV (Compact & Propre)
           ========================================================================= */}
        <div className="flex items-center justify-between py-2.5 px-3 border-b border-white/10">
          <Link
            href="/admin"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity min-w-0"
            onClick={onCloseMobile}
          >
            {/* Logo officiel CCJV (Temple & Bible ouverte) */}
            <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Centre Chrétien Jésus ma Vie"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>

            {/* Ligne de séparation verticale fine */}
            <div className="h-7 w-[0.5px] bg-white/30 shrink-0" />

            {/* Typographie de marque officielle */}
            <div className="flex flex-col justify-center min-w-0 select-none">
              <span className="font-serif text-[7.5px] tracking-[0.12em] text-white/80 uppercase leading-none font-medium truncate">
                Centre Chrétien
              </span>
              <span className="font-serif text-[11px] font-bold tracking-[0.04em] text-white uppercase leading-tight mt-0.5 truncate">
                Jésus ma Vie
              </span>
              <span className="font-sans text-[9.5px] text-[#ede4c8] leading-none mt-0.5 font-normal tracking-wide truncate">
                Administration
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-none transition-colors ml-1 cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* =========================================================================
            Navigation : Mode Drill-Down (Sous-menu Vercel-style OU Menu Principal)
           ========================================================================= */}
        {activeItemWithSub ? (
          /* -----------------------------------------------------------------------
             VUE SOUS-MENU : Remplace la navigation principale (Pattern Vercel)
             ----------------------------------------------------------------------- */
          <div className="p-2 space-y-2">
            {/* Bouton Retour vers le Menu Principal */}
            <button
              type="button"
              onClick={() => setActiveSubMenuId(null)}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-none transition-colors group cursor-pointer border border-transparent hover:border-white/10"
              aria-label="Retour au menu principal"
            >
              <ChevronLeft className="h-4 w-4 text-white/50 group-hover:text-white transition-transform group-hover:-translate-x-0.5 shrink-0" />
              <span className="truncate">{activeItemWithSub.label}</span>
            </button>

            <div className="h-[1px] bg-white/10 mx-1" />

            {/* Liste des Sous-menus */}
            <nav className="space-y-1">
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-white/45">
                Navigation
              </div>
              <ul className="space-y-0.5">
                {activeItemWithSub.subItems?.map((sub) => {
                  const isSubActive = isSubItemActive(sub.href, activeItemWithSub.href);
                  const SubIcon = sub.icon;

                  return (
                    <li key={sub.href}>
                      <Link
                        href={sub.href}
                        onClick={onCloseMobile}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 text-xs font-sans rounded-none transition-all duration-150 group",
                          isSubActive
                            ? "bg-ccjv-green text-white font-medium shadow-xs"
                            : "text-white/75 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        {SubIcon ? (
                          <SubIcon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105",
                              isSubActive ? "text-white" : "text-white/60 group-hover:text-white",
                            )}
                          />
                        ) : (
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0 ml-1 mr-1",
                              isSubActive ? "bg-white" : "bg-white/40 group-hover:bg-white",
                            )}
                          />
                        )}
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        ) : (
          /* -----------------------------------------------------------------------
             VUE PRINCIPALE : Liste complète des rubriques et modules
             ----------------------------------------------------------------------- */
          <nav className="p-2 space-y-2.5">
            {filteredNavSections.map((section, idx) => (
              <div key={section.title || idx} className="space-y-1">
                {section.title && (
                  <div className="px-2.5 pt-1 pb-0.5 text-[9.5px] font-mono font-semibold uppercase tracking-wider text-white/40">
                    {section.title}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;
                    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);

                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (hasSubItems) {
                              setActiveSubMenuId(item.id);
                            }
                            if (onCloseMobile) {
                              onCloseMobile();
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 text-xs font-sans rounded-none transition-all duration-150 group",
                            active
                              ? "bg-ccjv-green text-white font-medium shadow-xs"
                              : "text-white/75 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                                active ? "text-white" : "text-white/60 group-hover:text-white",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {/* Chevron indicateur de sous-menu (Style Vercel) */}
                          {hasSubItems && (
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ml-1",
                                active ? "text-white/90" : "text-white/40 group-hover:text-white/80",
                              )}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
