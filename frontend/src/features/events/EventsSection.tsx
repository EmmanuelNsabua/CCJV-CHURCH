import Link from "next/link";
import { cn } from "@/lib/utils";
import { getDepartmentName } from "@/data/mock/departments";
import { upcomingEvents } from "@/data/mock/events";
import type { Event } from "@/types";

export interface EventsSectionProps {
  /** Titre principal (colonne gauche) */
  title?: string;
  /** Description / sous-titre (colonne gauche) */
  description?: string;
  /** Texte du bouton d'action */
  ctaLabel?: string;
  /** Lien du bouton d'action */
  ctaHref?: string;
  /** Liste des événements à afficher */
  events?: Event[];
  /** Nombre maximum d'événements affichés */
  maxEvents?: number;
  /** Ton de fond */
  tone?: "offwhite" | "light" | "cream" | "white" | "tinted" | "dark";
  /** Couleur de fond personnalisée */
  backgroundColor?: string;
  className?: string;
}

const toneStyles = {
  offwhite: "bg-ccjv-offwhite text-ccjv-ink",
  light: "bg-ccjv-offwhite text-ccjv-ink",
  cream: "bg-ccjv-cream text-ccjv-ink",
  white: "bg-white text-ccjv-ink",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  dark: "bg-ccjv-black text-white",
};

/**
 * Extrait le mois court et le jour à partir d'une date ISO
 */
function getEventDateParts(isoDate: string) {
  try {
    const date = new Date(isoDate);
    const month = date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase();
    const day = date.toLocaleDateString("fr-FR", { day: "numeric" });
    return { month, day };
  } catch {
    return { month: "EVT", day: "•" };
  }
}

/**
 * Section Événements moderne en 2 colonnes selon la maquette :
 * - Gauche : Titre fort, description, bouton d'engagement (CTA)
 * - Droite : Liste avec date empilée (Mois / Jour), surtitre, titre et flèche d'action
 * - Strictement sans arrondis et conforme à la typographie CCJV
 */
export function EventsSection({
  title = "Ce qui se passe bientôt",
  description = "Rejoignez-nous et grandissons ensemble ! Découvrez nos prochains rassemblements, cultes, retraites et temps forts.",
  ctaLabel = "VOIR TOUT L'AGENDA",
  ctaHref = "/vie-de-leglise/evenements",
  events = upcomingEvents,
  maxEvents = 3,
  tone = "offwhite",
  backgroundColor,
  className,
}: EventsSectionProps) {
  const displayedEvents = events.slice(0, maxEvents);
  const isDark = tone === "dark";

  return (
    <section
      style={backgroundColor ? { backgroundColor } : undefined}
      className={cn(
        "relative py-16 md:py-24",
        !backgroundColor && toneStyles[tone],
        className,
      )}
      aria-labelledby="events-section-title"
    >
      <div className="container">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ============================================================
              Colonne gauche : En-tête éditorial et Bouton CTA
              ============================================================ */}
          <div className="flex flex-col justify-start lg:col-span-5 lg:sticky lg:top-28">
            <h2
              id="events-section-title"
              className={cn(
                "font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-bold tracking-[-0.02em] leading-[1.12]",
                isDark ? "text-white" : "text-ccjv-ink",
              )}
            >
              {title}
            </h2>

            {description && (
              <p
                className={cn(
                  "mt-6 max-w-[40ch] font-sans text-[0.98rem] leading-[1.65]",
                  isDark ? "text-white/75" : "text-ccjv-ink-secondary",
                )}
              >
                {description}
              </p>
            )}

            {ctaLabel && (
              <div className="mt-8 md:mt-10">
                <Link
                  href={ctaHref}
                  className={cn(
                    "inline-flex items-center justify-center px-7 py-3.5 font-sans text-xs font-semibold tracking-[0.16em] uppercase transition-all duration-300",
                    isDark
                      ? "bg-white text-ccjv-black hover:bg-ccjv-cream"
                      : "bg-ccjv-ink text-white hover:bg-ccjv-green",
                  )}
                >
                  {ctaLabel}
                </Link>
              </div>
            )}
          </div>

          {/* ============================================================
              Colonne droite : Liste épurée des événements
              ============================================================ */}
          <div className="lg:col-span-7">
            <div
              className={cn(
                "divide-y",
                isDark ? "divide-white/15" : "divide-ccjv-line",
              )}
            >
              {displayedEvents.map((event) => {
                const { month, day } = getEventDateParts(event.eventDate);
                const department = getDepartmentName(event.departmentId);

                return (
                  <Link
                    key={event.id}
                    href={`/vie-de-leglise/evenements/${event.slug}`}
                    className={cn(
                      "group flex items-center justify-between gap-6 py-7 md:py-8 transition-colors duration-200",
                      isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]",
                    )}
                  >
                    {/* Bloc Date (Mois / Jour) */}
                    <div className="flex w-14 flex-shrink-0 flex-col items-center text-center">
                      <span
                        className={cn(
                          "w-full border-b pb-1 font-sans text-[0.78rem] font-semibold tracking-[0.14em] uppercase",
                          isDark
                            ? "border-white/25 text-white/70"
                            : "border-ccjv-ink/30 text-ccjv-ink-secondary",
                        )}
                      >
                        {month}
                      </span>
                      <span
                        className={cn(
                          "pt-1 font-serif text-2xl md:text-3xl font-bold leading-tight",
                          isDark ? "text-white" : "text-ccjv-ink",
                        )}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Bloc Informations (Catégorie & Titre) */}
                    <div className="flex-1 pl-2 md:pl-4">
                      <p
                        className={cn(
                          "font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase",
                          isDark ? "text-ccjv-cream" : "text-ccjv-green",
                        )}
                      >
                        {department || "ÉVÉNEMENT"}
                      </p>
                      <h3
                        className={cn(
                          "mt-1 font-serif text-[clamp(1.2rem,0.9rem+0.8vw,1.55rem)] font-semibold leading-snug transition-colors duration-200",
                          isDark
                            ? "text-white group-hover:text-ccjv-cream"
                            : "text-ccjv-ink group-hover:text-ccjv-green",
                        )}
                      >
                        {event.title}
                      </h3>
                      {event.location && (
                        <p
                          className={cn(
                            "mt-1 font-sans text-xs",
                            isDark ? "text-white/55" : "text-ccjv-ink-secondary",
                          )}
                        >
                          {event.eventTime && `${event.eventTime} · `}
                          {event.location}
                        </p>
                      )}
                    </div>

                    {/* Flèche d'action */}
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center transition-transform duration-300 group-hover:translate-x-1.5",
                        isDark ? "text-white" : "text-ccjv-ink",
                      )}
                      aria-hidden="true"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
