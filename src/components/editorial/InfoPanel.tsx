import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Panneau pratique : lieu, horaires, accès, contact.
 *
 * Pensé pour être LU d'un coup d'œil — un visiteur qui vient pour une adresse ou
 * une heure ne doit jamais avoir à chercher dans un paragraphe.
 */
export interface InfoGroup {
  title: string;
  items: readonly { label?: string; value: string; hint?: string }[];
}

export interface InfoPanelProps {
  groups: readonly InfoGroup[];
  /** Note ou réserve affichée sous les groupes. */
  note?: string;
  onDark?: boolean;
  /** Complément à droite (bouton WhatsApp, lien itinéraire). */
  aside?: ReactNode;
  className?: string;
}

export function InfoPanel({
  groups,
  note,
  onDark = false,
  aside,
  className,
}: InfoPanelProps) {
  const line = onDark ? "border-white/15" : "border-ccjv-line";
  const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary";
  const accent = onDark ? "text-ccjv-cream" : "text-ccjv-green";

  return (
    <div className={className}>
      <dl
        className={cn(
          "grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-3",
        )}
      >
        {groups.map((group) => (
          <div key={group.title} className={cn("border-t pt-7", line)}>
            <dt className={cn("font-sans text-[0.68rem] font-semibold tracking-[0.2em] uppercase", accent)}>
              {group.title}
            </dt>
            <dd className="mt-6 flex flex-col gap-6">
              {group.items.map((item) => (
                <div key={`${group.title}-${item.value}`} className="flex flex-col gap-1">
                  {item.label && (
                    <span className={cn("font-sans text-[0.8rem]", muted)}>
                      {item.label}
                    </span>
                  )}
                  <span className="font-serif text-[1.18rem] leading-snug">
                    {item.value}
                  </span>
                  {item.hint && (
                    <span className={cn("font-sans text-[0.82rem] leading-relaxed", muted)}>
                      {item.hint}
                    </span>
                  )}
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      {(note || aside) && (
        <div
          className={cn(
            "mt-12 grid grid-cols-1 gap-8 border-t pt-8 lg:grid-cols-12",
            line,
          )}
        >
          {note && (
            <p className={cn("max-w-[58ch] font-sans text-[0.88rem] leading-relaxed lg:col-span-8", muted)}>
              {note}
            </p>
          )}
          {aside && <div className="lg:col-span-4 lg:justify-self-end">{aside}</div>}
        </div>
      )}
    </div>
  );
}

/** Lien d'itinéraire — jamais un faux plan intégré. */
export function DirectionsLink({
  href,
  label = "Ouvrir l'itinéraire",
  onDark = false,
}: {
  href: string;
  label?: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 font-sans text-[0.9rem] font-medium underline decoration-1 underline-offset-4",
        onDark
          ? "decoration-white/30 hover:text-ccjv-cream"
          : "decoration-ccjv-green/40 hover:text-ccjv-green",
      )}
    >
      {label} →
    </Link>
  );
}
