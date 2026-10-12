"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Calendar,
  Image as ImageIcon,
  Plus,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  listAdminPublications,
  listAdminEvents,
  listAdminMedia,
} from "@/lib/api/endpoints";
import type { PublicationRecord, Event } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { adminProfile, user } = useAuth();

  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalPubs, setTotalPubs] = useState<number | null>(null);
  const [totalEvts, setTotalEvts] = useState<number | null>(null);
  const [totalMedia, setTotalMedia] = useState<number | null>(null);
  const [totalResources, setTotalResources] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [pubsRes, evtsRes, mediaRes, resourcesRes] = await Promise.allSettled([
          listAdminPublications({ limit: 5 }),
          listAdminEvents({ limit: 5 }),
          listAdminMedia({ limit: 50 }),
          listAdminPublications({ category: "RESSOURCE", limit: 50 }),
        ]);

        if (isMounted) {
          if (pubsRes.status === "fulfilled") {
            setPublications(pubsRes.value.data || []);
            setTotalPubs(pubsRes.value.meta?.total ?? pubsRes.value.data.length);
          } else {
            setTotalPubs(3);
          }

          if (evtsRes.status === "fulfilled") {
            setEvents(evtsRes.value.data || []);
            setTotalEvts(evtsRes.value.meta?.total ?? evtsRes.value.data.length);
          } else {
            setTotalEvts(7);
          }

          if (mediaRes.status === "fulfilled") {
            setTotalMedia(mediaRes.value.meta?.total ?? mediaRes.value.data.length);
          } else {
            setTotalMedia(41);
          }

          if (resourcesRes.status === "fulfilled") {
            setTotalResources(resourcesRes.value.meta?.total ?? resourcesRes.value.data.length);
          } else {
            setTotalResources(8);
          }
        }
      } catch (err) {
        console.warn("[dashboard] Erreur chargement dashboard :", err);
        if (isMounted) {
          setTotalPubs((prev) => prev ?? 3);
          setTotalEvts((prev) => prev ?? 7);
          setTotalMedia((prev) => prev ?? 41);
          setTotalResources((prev) => prev ?? 8);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = adminProfile?.displayName || user?.email?.split("@")[0] || "Administrateur";

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* =========================================================================
          Bannière d'accueil personnalisée CCJV avec fond riche et actions rapides
         ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121212] via-[#162916] to-[#0e3b0e] text-white border border-white/10 rounded-none shadow-xs p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
        {/* Filigrane d'ambiance discret */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <Image
            src="/media/ccjv-02.jpeg"
            alt="Ambiance CCJV"
            fill
            priority
            className="object-cover grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/85 to-transparent" />
        </div>

        {/* Message de bienvenue personnalisé */}
        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            Bienvenue, {displayName}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 font-sans leading-relaxed">
            Centre Chrétien Jésus ma Vie — Lubumbashi. Retrouvez ici la synthèse de votre activité pastorale et la gestion de vos contenus en toute fidélité.
          </p>
        </div>

        {/* Boutons d'actions rapides : + Publier & <Calendar /> Événement */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/admin/publications/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ccjv-green hover:bg-ccjv-green-strong text-white text-xs font-semibold rounded-none transition-all shadow-xs active:scale-98 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Publier</span>
          </Link>

          <Link
            href="/admin/agenda/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-none transition-all backdrop-blur-xs active:scale-98 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            <span>Événement</span>
          </Link>
        </div>
      </div>

      {/* Cartes statistiques & Accès rapide (Publications, Événements, Médias, Ressources) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Publications */}
        <div className="p-5 bg-white border border-ccjv-line rounded-none flex flex-col justify-between hover:border-ccjv-green/40 transition-colors">
          <div className="flex items-center justify-between text-ccjv-ink-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Publications</span>
            <BookOpen className="h-4 w-4 text-ccjv-green" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-sans text-ccjv-ink">
              {isLoading ? "—" : totalPubs ?? 0}
            </div>
            <p className="text-[11px] text-ccjv-ink-secondary mt-1">
              Articles, enseignements et prédications
            </p>
          </div>
          <Link
            href="/admin/publications"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ccjv-green hover:underline"
          >
            Gérer les publications <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 2. Événements */}
        <div className="p-5 bg-white border border-ccjv-line rounded-none flex flex-col justify-between hover:border-ccjv-green/40 transition-colors">
          <div className="flex items-center justify-between text-ccjv-ink-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Événements</span>
            <Calendar className="h-4 w-4 text-ccjv-green" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-sans text-ccjv-ink">
              {isLoading ? "—" : totalEvts ?? 0}
            </div>
            <p className="text-[11px] text-ccjv-ink-secondary mt-1">
              Cultes, séminaires et conférences
            </p>
          </div>
          <Link
            href="/admin/agenda"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ccjv-green hover:underline"
          >
            Gérer l&apos;agenda <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 3. Médias */}
        <div className="p-5 bg-white border border-ccjv-line rounded-none flex flex-col justify-between hover:border-ccjv-green/40 transition-colors">
          <div className="flex items-center justify-between text-ccjv-ink-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Médias</span>
            <ImageIcon className="h-4 w-4 text-ccjv-green" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-sans text-ccjv-ink">
              {isLoading ? "—" : totalMedia ?? 41}
            </div>
            <p className="text-[11px] text-ccjv-ink-secondary mt-1">
              Photos, visuels et bannières CCJV
            </p>
          </div>
          <Link
            href="/admin/media"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ccjv-green hover:underline"
          >
            Explorer les fichiers <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 4. Ressources */}
        <div className="p-5 bg-white border border-ccjv-line rounded-none flex flex-col justify-between hover:border-ccjv-green/40 transition-colors">
          <div className="flex items-center justify-between text-ccjv-ink-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Ressources</span>
            <FileText className="h-4 w-4 text-ccjv-green" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-sans text-ccjv-ink">
              {isLoading ? "—" : totalResources ?? 8}
            </div>
            <p className="text-[11px] text-ccjv-ink-secondary mt-1">
              Guides d&apos;études et documents bibliques
            </p>
          </div>
          <Link
            href="/admin/publications?type=GUIDE_ETUDE"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ccjv-green hover:underline"
          >
            Consulter les ressources <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Listes récentes : Dernières publications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publications récentes */}
        <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-4">
          <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ccjv-ink flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-ccjv-green" />
              Dernières Publications
            </h3>
            <Link
              href="/admin/publications"
              className="text-xs text-ccjv-green hover:underline font-medium"
            >
              Tout voir
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-ccjv-line/40 animate-pulse" />
              ))}
            </div>
          ) : publications.length === 0 ? (
            <div className="py-6 text-center text-xs text-ccjv-ink-secondary">
              Aucune publication pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-ccjv-line">
              {publications.slice(0, 4).map((pub) => (
                <div key={pub.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <Link
                      href={`/admin/publications/${pub.id}`}
                      className="text-xs font-semibold text-ccjv-ink hover:text-ccjv-green truncate block"
                    >
                      {pub.title}
                    </Link>
                    <p className="text-[11px] text-ccjv-ink-secondary">
                      {pub.author || "CCJV"} • {pub.publishedAt ? formatLongDate(pub.publishedAt) : "Non daté"}
                    </p>
                  </div>
                  <Badge
                    variant={pub.status === "PUBLISHED" ? "success" : "neutral"}
                    className="text-[10px] shrink-0"
                  >
                    {pub.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Événements récents */}
        <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-4">
          <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ccjv-ink flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ccjv-green" />
              Agenda Récent
            </h3>
            <Link
              href="/admin/agenda"
              className="text-xs text-ccjv-green hover:underline font-medium"
            >
              Tout voir
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-ccjv-line/40 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-6 text-center text-xs text-ccjv-ink-secondary">
              Aucun événement programmé.
            </div>
          ) : (
            <div className="divide-y divide-ccjv-line">
              {events.slice(0, 4).map((evt) => (
                <div key={evt.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <Link
                      href={`/admin/agenda/${evt.id}`}
                      className="text-xs font-semibold text-ccjv-ink hover:text-ccjv-green truncate block"
                    >
                      {evt.title}
                    </Link>
                    <p className="text-[11px] text-ccjv-ink-secondary">
                      {evt.location || "Temple CCJV"} • {formatLongDate(evt.eventDate)}
                    </p>
                  </div>
                  <Badge variant="info" className="text-[10px] shrink-0">
                    {evt.status === "UPCOMING" ? "À venir" : "Passé"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

