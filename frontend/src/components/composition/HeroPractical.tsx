import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

/**
 * Héros Type F — page fonctionnelle.
 *
 * Pas de photographie, pas de mise en scène : l'information utile est visible
 * immédiatement. Utilisé pour les pages où le visiteur vient chercher un fait —
 * horaires, adresse, recherche, agenda.
 */
export interface PracticalFact {
  label: string;
  value: string;
  hint?: string;
  /** Lien d'action associé au fait (ex. itinéraire). */
  href?: string;
}

export interface HeroPracticalProps {
  overline: string;
  title: string;
  intro?: string;
  facts?: readonly PracticalFact[];
  /** Complément à droite des faits (contact, note). */
  aside?: ReactNode;
}

export function HeroPractical({
  overline,
  title,
  intro,
  facts,
  aside,
}: HeroPracticalProps) {
  return (
    <div className="border-b border-ccjv-line bg-ccjv-offwhite">
      <div className="container">
        <div className="pt-[calc(72px+clamp(2rem,4vw,3.25rem))] pb-[clamp(2.25rem,4vw,3.5rem)]">
          <Breadcrumbs />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                {overline}
              </p>
              <h1 className="mt-4 text-[clamp(1.9rem,1rem+2.2vw,3rem)] leading-[1.08] font-semibold">
                {title}
              </h1>
              {intro && (
                <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.6] text-ccjv-ink-secondary">
                  {intro}
                </p>
              )}
              {aside && <div className="mt-7">{aside}</div>}
            </div>

            {facts && facts.length > 0 && (
              <dl className="grid grid-cols-1 gap-x-10 gap-y-7 self-start border-t border-ccjv-line pt-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col gap-1.5">
                    <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                      {fact.label}
                    </dt>
                    <dd className="font-serif text-[1.2rem] leading-snug">
                      {fact.href ? (
                        <Link
                          href={fact.href}
                          className="underline decoration-ccjv-green decoration-1 underline-offset-4 transition-colors duration-[150ms] hover:text-ccjv-green"
                        >
                          {fact.value}
                        </Link>
                      ) : (
                        fact.value
                      )}
                    </dd>
                    {fact.hint && (
                      <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
                        {fact.hint}
                      </p>
                    )}
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
