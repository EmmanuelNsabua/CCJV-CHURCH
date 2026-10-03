import Link from "next/link";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export interface HubDoor {
  href: string;
  label: string;
  description: string;
}

/**
 * « Portes » d'un hub : chaque sous-page est présentée avec une accroche.
 * Évite la carte uniforme et donne une raison d'entrer sur chaque page.
 */
export function HubDoors({
  doors,
  columns = 2,
  className,
}: {
  doors: readonly HubDoor[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-10",
        columns === 3 ? "md:grid-cols-3 md:gap-8" : "md:grid-cols-2 md:gap-12",
        className,
      )}
    >
      {doors.map((door, index) => (
        <Reveal key={door.href} delay={index * 70}>
          <Link
            href={door.href}
            className="group flex h-full flex-col border-t-2 border-ccjv-green pt-6"
          >
            <p className="font-serif text-[clamp(1.4rem,1rem+1.2vw,2rem)] leading-tight transition-colors duration-[250ms] group-hover:text-ccjv-green">
              {door.label}
            </p>
            <p className="mt-3 max-w-[46ch] text-ccjv-ink-secondary">
              {door.description}
            </p>
            <span className="mt-6 font-sans text-sm font-medium text-ccjv-green">
              Découvrir →
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
