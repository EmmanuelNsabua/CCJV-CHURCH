"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from "lucide-react";
import { formatLongDate } from "@/lib/utils";
import type { PublicationRecord, Event } from "@/lib/api/types";
import { ECODIM_DEPARTMENT_ID } from "@/lib/departments";

export interface ActualitesViewProps {
  publications: PublicationRecord[];
  upcomingEvents: Event[];
}

function isEcodimPublication(pub: PublicationRecord): boolean {
  return (
    pub.scope === "ECODIM" ||
    pub.departmentId === ECODIM_DEPARTMENT_ID ||
    pub.author === "Ecodim" ||
    /ecod/i.test(pub.title || "")
  );
}

function truncateText(text?: string | null, maxLength = 130): string {
  if (!text) return "";
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + "…";
}

function resolvePublicationImage(pub: PublicationRecord): string {
  if (pub.coverImage) return pub.coverImage;
  if (pub.contentUrl && pub.type === "PHOTO") return pub.contentUrl;
  if (isEcodimPublication(pub)) {
    return "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/3ac64c4e-feb1-41f3-8ca9-4a7a35fd1915.jpg";
  }
  return "https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/23ec1d87-668f-4b03-8305-42a47ceabad5.jpg";
}

export function ActualitesView({
  publications,
  upcomingEvents,
}: ActualitesViewProps) {
  // 1. Sélection des 3 publications les plus récentes pour « À la une »
  const featured = publications.slice(0, 3);
  const [activeSlide, setActiveSlide] = useState(0);

  // 2. Grille des publications restantes (excluant les 3 de « À la une »)
  // Si le nombre total est <= 3, on affiche les publications disponibles dans la grille
  const remaining = publications.length > 3 ? publications.slice(3) : publications;

  // Filtre par onglet pour la grille : Tous | Presse | Ecodim
  const [selectedTab, setSelectedTab] = useState<"TOUS" | "PRESSE" | "ECODIM">("TOUS");

  const filteredGridItems = remaining.filter((item) => {
    if (selectedTab === "TOUS") return true;
    const isEcodim = isEcodimPublication(item);
    if (selectedTab === "ECODIM") return isEcodim;
    if (selectedTab === "PRESSE") return !isEcodim;
    return true;
  });

  const nextSlide = () => {
    if (featured.length === 0) return;
    setActiveSlide((prev) => (prev + 1) % featured.length);
  };

  const prevSlide = () => {
    if (featured.length === 0) return;
    setActiveSlide((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <div className="bg-ccjv-offwhite min-h-screen">
      {/* ===================================================================== */}
      {/* 1. HERO SECTION PLEIN ÉCRAN AVEC PHOTO & TEXTE EN BAS À DROITE        */}
      {/* ===================================================================== */}
      <section
        className="relative w-full min-h-screen sm:h-[75vh] min-h-[480px] max-h-[720px] overflow-hidden bg-ccjv-black text-white hero-dark"
        data-hero-dark
      >
        <Image
          src="https://fcdyqwconmymcznsaykw.supabase.co/storage/v1/object/public/ccjv-media/pages/23ec1d87-668f-4b03-8305-42a47ceabad5.jpg"
          alt="Actualités au Centre Chrétien Jésus ma Vie"
          fill
          priority
          className="object-cover object-center brightness-70"
          sizes="100vw"
        />
        {/* Dégradés d'ombrage pour une lisibilité parfaite */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-transparent to-transparent" />

        {/* Titre et texte situés dans le coin droit inférieur (sans bouton, sans badge) */}
        <div className="absolute bottom-10 right-4 sm:bottom-14 sm:right-10 md:bottom-16 md:right-16 text-right max-w-2xl px-4">
          <h1 className="font-sans text-base sm:text-lg md:text-xl text-white/95 font-medium leading-relaxed drop-shadow-md">
            Actualités
          </h1>
          <p className="mt-3 sm:mt-4 font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
            Suivez nos actualités quotidiennes au Centre Chrétien Jésus ma Vie.
          </p>
        </div>
      </section>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-20 sm:space-y-28">
        {/* ===================================================================== */}
        {/* 2. SECTION « À LA UNE » (Coulissante avec 3 publications récentes)    */}
        {/* ===================================================================== */}
        {featured.length > 0 && (
          <section aria-labelledby="featured-news-title" className="space-y-6">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
              <h2
                id="featured-news-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-ccjv-ink"
              >
                À la une
              </h2>

              {/* Contrôles du slider */}
              {featured.length > 1 && (
                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-ccjv-ink-secondary font-medium">
                    0{activeSlide + 1} / 0{featured.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={prevSlide}
                      aria-label="Publication précédente"
                      className="p-2 border border-ccjv-line bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 text-ccjv-ink" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Publication suivante"
                      className="p-2 border border-ccjv-line bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4 text-ccjv-ink" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slider de la Une : 60% photo / 40% texte avec alternance gauche/droite */}
            <div className="relative overflow-hidden">
              {featured.map((item, index) => {
                if (index !== activeSlide) return null;

                const isEcodim = isEcodimPublication(item);
                // Alternance : slide 0 = photo gauche / texte droite ; slide 1 = texte gauche / photo droite
                const isPhotoLeft = index % 2 === 0;
                const photoUrl = resolvePublicationImage(item);

                return (
                  <article
                    key={item.id}
                    className={`flex flex-col ${isPhotoLeft ? "lg:flex-row" : "lg:flex-row-reverse"
                      } border border-ccjv-line bg-white shadow-sm overflow-hidden animate-in fade-in duration-300`}
                  >
                    {/* Bloc Média / Photo (60%) */}
                    <div className="relative w-full lg:w-[60%] min-h-[300px] sm:min-h-[420px] lg:min-h-[460px] bg-neutral-100 overflow-hidden shrink-0">
                      <Image
                        src={photoUrl}
                        alt={item.title}
                        fill
                        priority={index === 0}
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                    </div>

                    {/* Bloc Texte (40%) avec coloration conditionnelle : vert pour Presse, blanc/texte vert pour Ecodim */}
                    <div
                      className={`w-full lg:w-[40%] p-8 sm:p-10 lg:p-12 flex flex-col justify-between ${isEcodim
                        ? "bg-white text-ccjv-green"
                        : "bg-ccjv-green text-white"
                        }`}
                    >
                      <div>
                        {/* Étiquette Département */}
                        <span
                          className={`inline-block font-sans text-xs font-bold uppercase tracking-wider px-3 py-1 mb-6 rounded-none ${isEcodim
                            ? "bg-emerald-50 text-ccjv-green border border-emerald-200"
                            : "bg-white/20 text-white border border-white/30"
                            }`}
                        >
                          {isEcodim ? "Ecodim" : "Presse"}
                        </span>

                        <time
                          dateTime={item.publishedAt}
                          className={`block font-sans text-xs mb-3 ${isEcodim ? "text-ccjv-ink-secondary" : "text-white/80"
                            }`}
                        >
                          {formatLongDate(item.publishedAt)}
                        </time>

                        <Link href={`/publications/${item.slug}`} className="group block">
                          <h3
                            className={`font-serif text-2xl sm:text-3xl lg:text-[1.85rem] font-bold leading-tight transition-opacity group-hover:opacity-90 ${isEcodim ? "text-ccjv-green" : "text-white"
                              }`}
                          >
                            {item.title}
                          </h3>
                        </Link>

                        {item.description && (
                          <p
                            className={`mt-4 text-sm sm:text-base leading-relaxed line-clamp-4 ${isEcodim ? "text-ccjv-ink" : "text-white/95"
                              }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-8">
                        <Link
                          href={`/publications/${item.slug}`}
                          className={`inline-flex items-center gap-2 font-sans text-sm font-semibold tracking-wide transition-all group ${isEcodim
                            ? "text-ccjv-green hover:translate-x-1"
                            : "text-white hover:translate-x-1"
                            }`}
                        >
                          <span>Lire l&apos;actualité</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* 3. GRILLE DES ACTUALITÉS (3 * X, étiquettes, limitation de texte)    */}
        {/* ===================================================================== */}
        <section aria-labelledby="all-news-title" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ccjv-line pb-4">
            <div>
              <h2
                id="all-news-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-ccjv-ink"
              >
                Toutes les actualités
              </h2>
              <p className="text-xs sm:text-sm text-ccjv-ink-secondary mt-1">
                Parcourez les publications et annonces de notre communauté.
              </p>
            </div>

            {/* Onglets de filtrage : Tous | Presse | Ecodim */}
            <div className="flex items-center gap-2 border border-ccjv-line p-1 bg-white">
              <button
                type="button"
                onClick={() => setSelectedTab("TOUS")}
                className={`px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${selectedTab === "TOUS"
                  ? "bg-ccjv-green text-white"
                  : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                  }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("PRESSE")}
                className={`px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${selectedTab === "PRESSE"
                  ? "bg-ccjv-green text-white"
                  : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                  }`}
              >
                Presse
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("ECODIM")}
                className={`px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${selectedTab === "ECODIM"
                  ? "bg-ccjv-green text-white"
                  : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                  }`}
              >
                Ecodim
              </button>
            </div>
          </div>

          {filteredGridItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGridItems.map((item) => {
                const isEcodim = isEcodimPublication(item);
                const photoUrl = resolvePublicationImage(item);
                const cleanDescription = truncateText(item.description, 130);

                return (
                  <article
                    key={item.id}
                    className="group flex flex-col bg-white border border-ccjv-line hover:border-ccjv-green transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md"
                  >
                    {/* Image avec étiquette dans le coin supérieur gauche */}
                    <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100">
                      <span
                        className={`absolute top-3 left-3 z-10 font-sans text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-none shadow-xs ${isEcodim
                          ? "bg-amber-600 text-white"
                          : "bg-ccjv-green text-white"
                          }`}
                      >
                        {isEcodim ? "Ecodim" : "Presse"}
                      </span>

                      <Image
                        src={photoUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    {/* Contenu textuel avec longueur contrainte */}
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <time
                          dateTime={item.publishedAt}
                          className="font-sans text-xs text-ccjv-ink-secondary block"
                        >
                          {formatLongDate(item.publishedAt)}
                        </time>

                        <Link href={`/publications/${item.slug}`} className="block mt-2">
                          <h3
                            className="font-serif text-xl font-bold text-ccjv-ink leading-snug line-clamp-2 group-hover:text-ccjv-green transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </h3>
                        </Link>

                        {cleanDescription && (
                          <p className="mt-3 text-sm text-ccjv-ink-secondary leading-relaxed line-clamp-3">
                            {cleanDescription}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-ccjv-line/60">
                        <Link
                          href={`/publications/${item.slug}`}
                          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-ccjv-green group-hover:translate-x-1 transition-transform"
                        >
                          <span>Lire l&apos;actualité</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-ccjv-line">
              <p className="font-serif text-lg text-ccjv-ink">
                Aucune actualité dans cette rubrique
              </p>
              <p className="text-xs text-ccjv-ink-secondary mt-1">
                Sélectionnez un autre filtre pour consulter les autres publications.
              </p>
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* 4. LES ÉVÉNEMENTS À VENIR (3 maximum les plus proches, masqué si vide)*/}
        {/* ===================================================================== */}
        {upcomingEvents.length > 0 && (
          <section aria-labelledby="events-section-title" className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
              <h2
                id="events-section-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-ccjv-ink"
              >
                Événements à venir
              </h2>
              <Link
                href="/vie-de-leglise/evenements"
                className="font-sans text-xs sm:text-sm font-bold tracking-wider uppercase text-ccjv-green hover:underline inline-flex items-center gap-1"
              >
                <span>Voir plus</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.slice(0, 3).map((event) => {
                const dateRaw = event.startDate || event.eventDate || "";
                const dateFormatted = dateRaw ? formatLongDate(dateRaw) : "Date à venir";

                return (
                  <article
                    key={event.id}
                    className="group bg-white border border-ccjv-line hover:border-ccjv-green transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between p-6"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-sans text-ccjv-green font-semibold uppercase tracking-wider">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{dateFormatted}</span>
                      </div>

                      <Link href={`/vie-de-leglise/evenements/${event.slug}`} className="block mt-3">
                        <h3 className="font-serif text-xl font-bold text-ccjv-ink leading-snug group-hover:text-ccjv-green transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                      </Link>

                      {event.excerpt && (
                        <p className="mt-3 text-sm text-ccjv-ink-secondary leading-relaxed line-clamp-3">
                          {event.excerpt}
                        </p>
                      )}

                      <div className="mt-4 space-y-1.5 text-xs text-ccjv-ink-secondary font-sans">
                        {event.eventTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-ccjv-ink-secondary" />
                            <span>{event.eventTime}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-ccjv-ink-secondary" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-ccjv-line/60">
                      <Link
                        href={`/vie-de-leglise/evenements/${event.slug}`}
                        className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-ccjv-green group-hover:translate-x-1 transition-transform"
                      >
                        <span>Détails de l&apos;événement</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

