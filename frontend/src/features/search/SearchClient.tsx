"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface SearchEntry {
  href: string;
  title: string;
  description: string;
  kind: string;
}

/**
 * Recherche interne — filtrage côté client sur un index statique.
 *
 * Aucun backend n'est requis : l'index est construit au rendu serveur à partir
 * des données réelles (navigation, événements, départements, publications).
 * Le filtrage passe par `useMemo` : pas de requête réseau, pas de debounce
 * nécessaire, coût négligeable même sur appareil modeste.
 */
export function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return entries
      .filter((entry) =>
        `${entry.title} ${entry.description} ${entry.kind}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 30);
  }, [entries, query]);

  const hasQuery = query.trim().length >= 2;

  return (
    <div>
      <label
        htmlFor="recherche-site"
        className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase"
      >
        Que cherchez-vous ?
      </label>
      <input
        id="recherche-site"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Événements, départements, enseignements…"
        autoComplete="off"
        className="mt-4 w-full border border-ccjv-line bg-white px-5 py-4 font-sans text-[1.05rem] text-ccjv-ink transition-colors duration-[250ms] outline-none placeholder:text-ccjv-ink-secondary/60 focus:border-ccjv-green"
      />

      <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
        Saisissez au moins deux caractères. {entries.length} contenus sont
        référencés sur le site.
      </p>

      {hasQuery &&
        (results.length > 0 ? (
          <ul className="mt-10 border-t border-ccjv-line">
            {results.map((entry) => (
              <li key={entry.href} className="border-b border-ccjv-line">
                <Link
                  href={entry.href}
                  className="group grid grid-cols-1 gap-1 py-6 md:grid-cols-12 md:items-baseline md:gap-6"
                >
                  <span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-green uppercase md:col-span-3">
                    {entry.kind}
                  </span>
                  <span className="font-serif text-[1.25rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green md:col-span-9">
                    {entry.title}
                  </span>
                  {entry.description && (
                    <span className="text-[0.92rem] text-ccjv-ink-secondary md:col-span-9 md:col-start-4">
                      {entry.description}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p
            role="status"
            className="mt-10 border-t border-ccjv-line pt-8 text-ccjv-ink-secondary"
          >
            Aucun résultat pour «&nbsp;{query.trim()}&nbsp;». Essayez un autre
            mot, ou parcourez nos rubriques depuis le menu.
          </p>
        ))}
    </div>
  );
}
