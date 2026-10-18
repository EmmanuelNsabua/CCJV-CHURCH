"use client";

import React from "react";
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
  Layers,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  typeParam?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const adminNavSections: NavSection[] = [
  {
    items: [
      {
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
        label: "Publications",
        href: "/admin/publications",
        icon: BookOpen,
      },
      {
        label: "Enseignements",
        href: "/admin/enseignements",
        icon: GraduationCap,
      },
      {
        label: "Agenda",
        href: "/admin/agenda",
        icon: Calendar,
      },
      {
        label: "Médiathèque",
        href: "/admin/media",
        icon: ImageIcon,
      },
      {
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
        label: "Prières",
        href: "/admin/prayers",
        icon: HeartHandshake,
      },
      {
        label: "Témoignages",
        href: "/admin/testimonies",
        icon: MessageSquareQuote,
      },
      {
        label: "Départements",
        href: "/admin/departments",
        icon: Users,
      },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      {
        label: "Éditeur de pages",
        href: "/admin/pages",
        icon: Layers,
      },
      {
        label: "Administrateurs",
        href: "/admin/administrateurs",
        icon: Shield,
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
        "flex h-full w-[270px] flex-col justify-between bg-[#121212] text-white select-none border-r border-white/10 overflow-y-auto",
        className,
      )}
    >
      {/* =========================================================================
          En-tête Sidebar : LOGO OFFICIEL CCJV (Emblème + Ligne + Typographie)
         ========================================================================= */}
      <div className="flex flex-col shrink-0">
        <div className="flex items-center justify-between py-3 px-3.5">
          <Link
            href="/admin"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            onClick={onCloseMobile}
          >
            {/* Logo officiel CCJV (Temple & Bible ouverte) */}
            <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Centre Chrétien Jésus ma Vie"
                width={58}
                height={58}
                className="h-16 w-auto object-contain"
                priority
              />
            </div>

            {/* Ligne de séparation verticale fine */}
            <div className="h-12 w-[0.5px] bg-white shrink-0" />

            {/* Typographie de marque officielle */}
            <div className="flex flex-col justify-center min-w-0 select-none">
              <span className="font-serif text-[8px] tracking-[0.14em] text-white/90 uppercase leading-none font-medium">
                Centre Chrétien
              </span>
              <span className="font-serif text-[12px] font-bold tracking-[0.06em] text-white uppercase leading-tight mt-1">
                Jésus ma Vie
              </span>
              <span className="font-sans text-[11px] text-[#ede4c8] leading-none mt-1 font-normal tracking-wide">
                Administration
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-none transition-colors ml-1"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* =========================================================================
            Navigation Groupée (Sticky Scrollbar)
           ========================================================================= */}
        <nav className="p-3 space-y-3">
          {adminNavSections.map((section, idx) => (
            <div key={section.title || idx} className="space-y-1">
              {section.title && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-white/45">
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-xs font-sans rounded-none transition-all duration-150 group",
                          active
                            ? "bg-ccjv-green text-white font-medium shadow-xs"
                            : "text-white/75 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                            active ? "text-white" : "text-white/60 group-hover:text-white",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
