"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Shield,
  LogOut,
  ExternalLink,
  Check,
  X,
  BookOpen,
  Calendar,
  Layers,
  Users,
  FileText,
  GraduationCap,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface AdminTopbarProps {
  className?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Nouvelle requête de prière reçue",
    time: "Il y a 10 min",
    read: false,
    type: "info",
  },
  {
    id: "2",
    title: "Culte dominical publié avec succès",
    time: "Il y a 2 h",
    read: false,
    type: "success",
  },
  {
    id: "3",
    title: "Sauvegarde des contenus statiques validée",
    time: "Hier",
    read: true,
    type: "info",
  },
];

export function AdminTopbar({ className }: AdminTopbarProps) {
  const router = useRouter();
  const { adminProfile, user, signOut } = useAuth();
  const role = adminProfile?.role || "ADMIN";

  // États pour les menus interactifs
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Raccourci Ctrl+K / Cmd+K pour la recherche
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Liste des raccourcis de recherche rapide
  const searchResults = [
    { title: "Publications", href: "/admin/publications", icon: BookOpen, cat: "Contenu" },
    { title: "Enseignements", href: "/admin/enseignements", icon: GraduationCap, cat: "Contenu" },
    { title: "Agenda & Cultes", href: "/admin/agenda", icon: Calendar, cat: "Contenu" },
    { title: "Médiathèque", href: "/admin/media", icon: ImageIcon, cat: "Contenu" },
    { title: "Ressources", href: "/admin/ressources", icon: FileText, cat: "Contenu" },
    { title: "Éditeur de pages", href: "/admin/pages", icon: Layers, cat: "Configuration" },
    { title: "Départements", href: "/admin/departments", icon: Users, cat: "Communauté" },
  ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex h-[64px] w-full items-center justify-between border-b border-ccjv-line bg-white px-4 sm:px-6 lg:px-8",
          className,
        )}
      >
        {/* =========================================================================
            À GAUCHE : Logo (mobile) + Barre de recherche
           ========================================================================= */}
        <div className="flex items-center gap-3 flex-1 max-w-sm sm:max-w-md">
          {/* Logo visible sur mobile uniquement */}
          <Link href="/admin" className="flex md:hidden items-center gap-2 shrink-0">
            <div className="h-7 w-7 bg-ccjv-green flex items-center justify-center font-bold text-white text-xs font-serif rounded-none">
              C
            </div>
            <span className="font-serif text-sm font-bold tracking-tight text-ccjv-ink">
              CCJV
            </span>
          </Link>

          {/* Barre de recherche positionnée à gauche */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between h-9 px-3 text-xs text-ccjv-ink-secondary hover:text-ccjv-ink bg-ccjv-offwhite hover:bg-[#f0ede6] border border-ccjv-line rounded-none transition-colors cursor-pointer text-left"
            title="Rechercher (Ctrl+K)"
            aria-label="Rechercher"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="h-3.5 w-3.5 text-ccjv-ink-secondary shrink-0" />
              <span className="font-sans truncate">Rechercher...</span>
            </div>
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono bg-white border border-ccjv-line text-ccjv-ink-secondary rounded-none shrink-0 ml-2">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* =========================================================================
            À DROITE : NOTIFICATIONS + PROFIL
           ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* 2. NOTIFICATIONS */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className="relative flex items-center justify-center h-9 w-9 text-ccjv-ink-secondary hover:text-ccjv-ink bg-white hover:bg-ccjv-offwhite border border-ccjv-line rounded-none transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center bg-[#b91c1c] text-white text-[9px] font-mono font-bold rounded-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Menu déroulant Notifications */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-ccjv-line rounded-none shadow-lg z-50 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between p-3.5 border-b border-ccjv-line bg-ccjv-offwhite">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xs text-ccjv-ink">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <Badge variant="error" className="text-[9px] px-1.5 py-0">
                        {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] font-sans text-ccjv-green hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="divide-y divide-ccjv-line/60 max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "p-3 text-xs flex flex-col gap-1 transition-colors hover:bg-ccjv-offwhite",
                        !notif.read && "bg-ccjv-green-soft/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-ccjv-ink leading-snug">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-none bg-ccjv-green shrink-0 mt-1" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-ccjv-ink-secondary">
                        {notif.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-ccjv-line bg-ccjv-offwhite text-center">
                  <span className="text-[11px] font-sans text-ccjv-ink-secondary">
                    Notifications administratives du système
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. PROFIL */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 h-9 px-2 sm:px-2.5 bg-white hover:bg-ccjv-offwhite border border-ccjv-line rounded-none transition-colors cursor-pointer"
              aria-label="Menu profil utilisateur"
            >
              <div className="flex h-6 w-6 items-center justify-center bg-ccjv-green text-white font-sans text-xs font-semibold rounded-none">
                {adminProfile?.displayName?.charAt(0).toUpperCase() || "A"}
              </div>
              <span className="hidden md:inline text-xs font-medium text-ccjv-ink max-w-[120px] truncate">
                {adminProfile?.displayName || user?.email?.split("@")[0]}
              </span>
            </button>

            {/* Menu déroulant Profil */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-ccjv-line rounded-none shadow-lg z-50 animate-in fade-in-50 duration-150">
                <div className="p-3.5 border-b border-ccjv-line bg-ccjv-offwhite">
                  <p className="font-semibold text-xs text-ccjv-ink truncate">
                    {adminProfile?.displayName || "Administrateur"}
                  </p>
                  <p className="text-[11px] font-mono text-ccjv-ink-secondary truncate">
                    {user?.email}
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant={role === "SUPER_ADMIN" ? "warning" : "info"}
                      className="text-[9px]"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {role === "SUPER_ADMIN" ? "SUPER ADMINISTRATEUR" : "ADMINISTRATEUR"}
                    </Badge>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-ccjv-ink hover:bg-ccjv-offwhite transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-ccjv-ink-secondary" />
                    <span>Voir le site public</span>
                  </Link>
                </div>

                <div className="p-1 border-t border-ccjv-line">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-[#b91c1c] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MODALE DE RECHERCHE RAPIDE (Triggerée par le bouton ou Ctrl+K)
         ========================================================================= */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-ccjv-line rounded-none shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-ccjv-line px-4 bg-white">
              <Search className="h-4 w-4 text-ccjv-ink-secondary shrink-0 mr-2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une section, un culte, un article..."
                className="w-full h-12 text-sm text-ccjv-ink bg-transparent focus:outline-none placeholder:text-ccjv-ink-secondary/50 font-sans"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-ccjv-ink-secondary hover:text-ccjv-ink"
                aria-label="Fermer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-ccjv-line/40">
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between p-2.5 text-xs text-left hover:bg-ccjv-offwhite rounded-none transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-ccjv-ink-secondary group-hover:text-ccjv-green" />
                        <span className="font-medium text-ccjv-ink group-hover:text-ccjv-green">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-ccjv-ink-secondary/70 uppercase">
                        {item.cat}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-ccjv-ink-secondary">
                  Aucun résultat correspondant pour « {searchQuery} »
                </div>
              )}
            </div>

            <div className="p-2.5 bg-ccjv-offwhite border-t border-ccjv-line text-[11px] font-mono text-ccjv-ink-secondary flex items-center justify-between">
              <span>Navigation au clavier</span>
              <span>Échap pour fermer</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
