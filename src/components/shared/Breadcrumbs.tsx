"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getBreadcrumbs } from "@/lib/nav";

/**
 * Fil d'Ariane — dérivé de l'architecture de navigation (`lib/nav.ts`),
 * donc jamais désynchronisé des routes réelles.
 */
export function Breadcrumbs({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);

  if (crumbs.length === 0) return null;

  const isDark = tone === "dark";

  return (
    <nav aria-label="Fil d'Ariane" className={cn("mb-6", className)}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-2 font-sans text-xs",
          isDark ? "text-white/60" : "text-ccjv-ink-secondary",
        )}
      >
        <li>
          <Link
            href="/"
            className={cn(
              "transition-colors duration-[150ms] hover:underline",
              isDark ? "hover:text-ccjv-cream" : "hover:text-ccjv-green",
            )}
          >
            Accueil
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          // Un pôle sans page produit une miette de regroupement : elle situe le
          // visiteur sans l'envoyer vers une route inexistante.
          const isLink = Boolean(crumb.href) && !isLast;
          return (
            <li
              key={crumb.href ?? crumb.label}
              className="flex items-center gap-2"
            >
              <span aria-hidden="true" className="opacity-40">
                /
              </span>
              {isLink ? (
                <Link
                  href={crumb.href as string}
                  className={cn(
                    "transition-colors duration-[150ms] hover:underline",
                    isDark ? "hover:text-ccjv-cream" : "hover:text-ccjv-green",
                  )}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    isLast
                      ? isDark
                        ? "text-white/85"
                        : "text-ccjv-ink"
                      : isDark
                        ? "text-white/70"
                        : "text-ccjv-ink-secondary",
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
