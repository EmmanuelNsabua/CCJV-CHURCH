import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Maillage éditorial — le chemin naturel vers la suite.
 *
 * `doors`  : entrées illustrées, pour orienter vers d'autres pôles
 * `list`   : liste éditoriale à filets, pour « aller plus loin » dans un pôle
 * `inline` : simple ligne de liens, pour les fiches de détail
 */
export type CrossLinksVariant = "doors" | "list" | "inline";

export interface CrossLink {
  href: string;
  label: string;
  description?: string;
  image?: string;
}

export interface CrossLinksProps {
  items: readonly CrossLink[];
  variant?: CrossLinksVariant;
  onDark?: boolean;
  className?: string;
}

export function CrossLinks({
  items,
  variant = "list",
  onDark = false,
  className,
}: CrossLinksProps) {
  if (items.length === 0) return null;

  const line = onDark ? "border-white/15" : "border-ccjv-line";
  const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary";
  const accent = onDark ? "text-ccjv-cream" : "text-ccjv-green";

  if (variant === "inline") {
    return (
      <ul className={cn("flex flex-wrap gap-x-8 gap-y-3", className)}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "font-sans text-[0.95rem] font-medium underline decoration-1 underline-offset-4 transition-colors duration-[150ms]",
                onDark
                  ? "decoration-white/30 hover:text-ccjv-cream"
                  : "decoration-ccjv-green/40 hover:text-ccjv-green",
              )}
            >
              {item.label} →
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "doors") {
    return (
      <ul className={cn("grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group flex h-full flex-col">
              {item.image && (
                <span className="relative aspect-4/3 w-full overflow-hidden bg-ccjv-line">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.03]"
                  />
                </span>
              )}
              <span className={cn("mt-5 flex items-center gap-3 border-t pt-5", line)}>
                <span
                  className={cn(
                    "font-serif text-[1.3rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green",
                    onDark && "text-white",
                  )}
                >
                  {item.label}
                </span>
              </span>
              {item.description && (
                <span className={cn("mt-3 font-sans text-[0.92rem] leading-relaxed", muted)}>
                  {item.description}
                </span>
              )}
              <span className={cn("mt-5 font-sans text-[0.85rem] font-medium", accent)}>
                Découvrir →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  // list
  return (
    <ul className={cn("border-t", line, className)}>
      {items.map((item) => (
        <li key={item.href} className={cn("border-b", line)}>
          <Link
            href={item.href}
            className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
          >
            <span
              className={cn(
                "font-serif text-[1.25rem] transition-colors duration-[250ms] group-hover:text-ccjv-green",
                onDark && "text-white",
              )}
            >
              {item.label}
            </span>
            {item.description && (
              <span className={cn("max-w-[52ch] font-sans text-[0.9rem]", muted)}>
                {item.description}
              </span>
            )}
            <span className={cn("font-sans text-[0.85rem] font-medium", accent)} aria-hidden="true">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
