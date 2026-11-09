"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, PublicationRecord } from "@/lib/api";

export interface ActualitesViewProps {
  featuredPublications: PublicationRecord[];
  archivePublications: PublicationRecord[];
  upcomingEvents: Event[];
}

function getDeptInfo(pub: PublicationRecord): { label: "ECODIM" | "PRESSE"; isEcodim: boolean } {
  const authorStr = (pub.author ?? "").toLowerCase();
  const isEcodim =
    pub.scope === "ECODIM" ||
    pub.departmentId === "d0000000-0000-4000-8000-000000000004" ||
    authorStr.includes("ecodim");

  return {
    label: isEcodim ? "ECODIM" : "PRESSE",
    isEcodim,
  };
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function ActualitesView({
  featuredPublications,
  archivePublications,
  upcomingEvents,
}: ActualitesViewProps) {
  // Carrousel À la une
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = featuredPublications.length;

  const nextSlide = () => {
    if (totalSlides > 0) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }
  };

  const prevSlide = () => {
    if (totalSlides > 0) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  // Filtre Tous / Presse / Ecodim
  const [selectedDept, setSelectedDept] = useState<"ALL" | "PRESSE" | "ECODIM">("ALL");

  const filteredArchive = useMemo(() => {
    if (selectedDept === "ALL") return archivePublications;
    return archivePublications.filter((pub) => {
      const { isEcodim } = getDeptInfo(pub);
      return selectedDept === "ECODIM" ? isEcodim : !isEcodim;
    });
  }, [archivePublications, selectedDept]);

  const activeFeatured = featuredPublications[currentSlide] ?? null;
  const activeDept = activeFeatured ? getDeptInfo(activeFeatured) : null;
  const isAlternate = currentSlide % 2 !== 0;

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Section plein écran avec photo en fond */}
      <section
        data-hero-dark
        className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col justify-end bg-neutral-900 text-white overflow-hidden"
      >
        <Image
          src="/hero-publications.jpg"
          alt="Actualités CCJV"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/20 pb-8">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white">
                Actualités
              </h1>
            </div>
            <div className="max-w-md md:text-right">
              <p className="font-sans text-base sm:text-lg text-neutral-200 leading-relaxed font-light">
                Suivez nos actualités quotidiennes au Centre Chrétien Jésus ma Vie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Section À la une : carte divisée 60% photo / 40% texte alterné et coulissant */}
      {featuredPublications.length > 0 && activeFeatured && activeDept && (
        <section className="py-12 sm:py-16 bg-neutral-50/50 border-b border-ccjv-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ccjv-green">
                  À la une
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ccjv-ink mt-1">
                  Les dernières nouvelles
                </h2>
              </div>

              {/* Contrôles du slider */}
              {totalSlides > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-ccjv-ink-secondary mr-2">
                    0{currentSlide + 1} / 0{totalSlides}
                  </span>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Publication précédente"
                    className="p-2 border border-ccjv-line bg-white hover:bg-neutral-100 text-ccjv-ink transition-colors cursor-pointer rounded-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Publication suivante"
                    className="p-2 border border-ccjv-line bg-white hover:bg-neutral-100 text-ccjv-ink transition-colors cursor-pointer rounded-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Carte 60/40 alternée */}
            <div className="border border-ccjv-line bg-white shadow-xs overflow-hidden">
              <div
                className={cn(
                  "grid grid-cols-1 lg:grid-cols-12 min-h-[420px]",
                  isAlternate ? "lg:flex-row-reverse" : "",
                )}
              >
                {/* 60% Média (Photo ou Vidéo) */}
                <div
                  className={cn(
                    "relative min-h-[260px] lg:min-h-[420px] bg-neutral-900",
                    isAlternate ? "lg:col-span-7 lg:order-2" : "lg:col-span-7 lg:order-1",
                  )}
                >
                  <Image
                    src={activeFeatured.coverImage || activeFeatured.contentUrl || "/hero-publications.jpg"}
                    alt={activeFeatured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={cn(
                        "px-3 py-1 font-sans text-xs font-bold tracking-wider uppercase shadow-xs",
                        activeDept.isEcodim
                          ? "bg-white text-ccjv-green border border-ccjv-green"
                          : "bg-ccjv-green text-white",
                      )}
                    >
                      {activeDept.label}
                    </span>
                  </div>
                </div>

                {/* 40% Texte avec couleur dynamique :
                    Fond vert pour Presse, Fond blanc avec texte vert pour Ecodim */}
                <div
                  className={cn(
                    "p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-colors duration-300",
                    isAlternate ? "lg:col-span-5 lg:order-1" : "lg:col-span-5 lg:order-2",
                    activeDept.isEcodim
                      ? "bg-white text-ccjv-green border-t lg:border-t-0"
                      : "bg-ccjv-green text-white",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={cn(
                          "text-xs font-medium uppercase tracking-wider",
                          activeDept.isEcodim ? "text-ccjv-ink-secondary" : "text-white/80",
                        )}
                      >
                        {formatDate(activeFeatured.publishedAt)}
                      </span>
                    </div>

                    <h3
                      className={cn(
                        "font-serif text-2xl sm:text-3xl font-bold leading-snug line-clamp-3",
                        activeDept.isEcodim ? "text-ccjv-green" : "text-white",
                      )}
                    >
                      {activeFeatured.title}
                    </h3>

                    {activeFeatured.description && (
                      <p
                        className={cn(
                          "mt-4 text-sm sm:text-base leading-relaxed line-clamp-4",
                          activeDept.isEcodim ? "text-neutral-700" : "text-white/90",
                        )}
                      >
                        {activeFeatured.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-current/20">
                    <Link
                      href={`/publications/actualites/${activeFeatured.id || activeFeatured.slug}`}
                      className={cn(
                        "inline-flex items-center gap-2 font-sans text-sm font-semibold tracking-wider uppercase transition-opacity hover:opacity-85",
                        activeDept.isEcodim ? "text-ccjv-green" : "text-white",
                      )}
                    >
                      <span>Voir plus</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Grille des actualités avec filtres (Tous, Presse, Ecodim) */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ccjv-line pb-4 mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl text-ccjv-ink">
              Toutes nos actualités
            </h2>

            {/* Onglets selon le croquis : Tous | Presse | Ecodim */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setSelectedDept("ALL")}
                className={cn(
                  "font-sans text-sm tracking-wide transition-colors pb-1 cursor-pointer",
                  selectedDept === "ALL"
                    ? "font-bold text-ccjv-green border-b-2 border-ccjv-green"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink",
                )}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedDept("PRESSE")}
                className={cn(
                  "font-sans text-sm tracking-wide transition-colors pb-1 cursor-pointer",
                  selectedDept === "PRESSE"
                    ? "font-bold text-ccjv-green border-b-2 border-ccjv-green"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink",
                )}
              >
                Presse
              </button>
              <button
                type="button"
                onClick={() => setSelectedDept("ECODIM")}
                className={cn(
                  "font-sans text-sm tracking-wide transition-colors pb-1 cursor-pointer",
                  selectedDept === "ECODIM"
                    ? "font-bold text-ccjv-green border-b-2 border-ccjv-green"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink",
                )}
              >
                Ecodim
              </button>
            </div>
          </div>

          {filteredArchive.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredArchive.map((pub) => {
                const dept = getDeptInfo(pub);
                return (
                  <article
                    key={pub.id}
                    className="border border-ccjv-line bg-white flex flex-col justify-between group hover:border-ccjv-green transition-colors duration-200 shadow-2xs"
                  >
                    <div>
                      {/* Image avec étiquette coin supérieur gauche */}
                      <div className="relative aspect-[16/10] w-full bg-neutral-100 overflow-hidden">
                        <Image
                          src={pub.coverImage || pub.contentUrl || "/hero-publications.jpg"}
                          alt={pub.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 z-10">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 font-sans text-[11px] font-bold tracking-wider uppercase shadow-xs",
                              dept.isEcodim
                                ? "bg-white text-ccjv-green border border-ccjv-green"
                                : "bg-ccjv-green text-white",
                            )}
                          >
                            {dept.label}
                          </span>
                        </div>
                      </div>

                      {/* Contenu textuel avec limitation de caractères pour ne pas casser le design */}
                      <div className="p-5 sm:p-6">
                        <span className="font-sans text-xs text-ccjv-ink-secondary">
                          {formatDate(pub.publishedAt)}
                        </span>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-ccjv-ink mt-2 line-clamp-2 leading-snug group-hover:text-ccjv-green transition-colors">
                          {pub.title}
                        </h3>
                        {pub.description && (
                          <p className="mt-3 font-sans text-xs sm:text-sm text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                            {pub.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 pt-0 border-t border-neutral-100 mt-4">
                      <Link
                        href={`/publications/actualites/${pub.id || pub.slug}`}
                        className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-green hover:underline mt-4"
                      >
                        <span>Lire</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-ccjv-line bg-neutral-50/50 p-10 text-center text-ccjv-ink-secondary">
              <p className="text-base font-serif">Aucune actualité disponible dans cette rubrique.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Les événements à venir (max 3 les plus proches non dépassés) */}
      {upcomingEvents.length > 0 && (
        <section className="py-12 sm:py-16 bg-neutral-50 border-t border-ccjv-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-4 mb-8">
              <div>
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ccjv-green">
                  Agenda
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ccjv-ink mt-1">
                  Événements à venir
                </h2>
              </div>
              <Link
                href="/vie-de-leglise/evenements"
                className="font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
              >
                Voir plus →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((evt) => (
                <article
                  key={evt.id}
                  className="border border-ccjv-line bg-white p-5 flex flex-col justify-between hover:border-ccjv-green transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-ccjv-green mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(evt.startDate || evt.eventDate)}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-ccjv-ink line-clamp-2">
                      {evt.title}
                    </h3>
                    {(evt.startTime || evt.eventTime) && (
                      <div className="flex items-center gap-2 text-xs text-ccjv-ink-secondary mt-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{evt.startTime || evt.eventTime}</span>
                      </div>
                    )}
                    {evt.location && (
                      <div className="flex items-center gap-2 text-xs text-ccjv-ink-secondary mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">{evt.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <Link
                      href={`/vie-de-leglise/evenements/${evt.slug}`}
                      className="font-sans text-xs font-semibold text-ccjv-green hover:underline"
                    >
                      Détails de l'événement →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
