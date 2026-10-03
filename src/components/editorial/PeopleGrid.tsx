import Image from "next/image";
import { cn } from "@/lib/utils";
import { ContentPending } from "./ContentPending";

/**
 * Annuaire de personnes.
 *
 * `feature` : la première personne est présentée en grand, les suivantes en
 * notices — la hiérarchie casse la grille uniforme de cartes.
 * `compact` : notices alignées, sans portrait dominant.
 */
export interface Person {
  id: string;
  name: string;
  role: string;
  scope?: string;
  photo?: string;
  bio?: string;
}

export interface PeopleGridProps {
  people: readonly Person[];
  variant?: "feature" | "compact";
  onDark?: boolean;
  className?: string;
}

export function PeopleGrid({
  people,
  variant = "feature",
  onDark = false,
  className,
}: PeopleGridProps) {
  if (people.length === 0) {
    return (
      <ContentPending
        what="Liste des responsables"
        hint="Les noms, fonctions et portraits des responsables doivent être fournis par l'église, avec l'accord des personnes concernées."
        className={className}
      />
    );
  }

  const line = onDark ? "border-white/15" : "border-ccjv-line";
  const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary";

  if (variant === "compact") {
    return (
      <ul className={cn("grid grid-cols-1 gap-x-12 sm:grid-cols-2", className)}>
        {people.map((person) => (
          <li
            key={person.id}
            className={cn("flex items-start gap-5 border-t py-7", line)}
          >
            {person.photo && (
              <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-ccjv-line">
                <Image
                  src={person.photo}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
            )}
            <span className="flex flex-col gap-1">
              <span
                className={cn(
                  "font-serif text-[1.15rem] leading-snug",
                  onDark && "text-white",
                )}
              >
                {person.name}
              </span>
              <span className={cn("font-sans text-[0.85rem]", muted)}>
                {person.role}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const [lead, ...rest] = people;

  return (
    <div className={className}>
      {/* Personne mise en avant */}
      <div className="grid grid-cols-1 items-center gap-10 border-b border-ccjv-line pb-14 lg:grid-cols-12 lg:gap-14">
        <figure className="lg:col-span-4">
          <div className="relative aspect-3/4 overflow-hidden bg-ccjv-line">
            {lead.photo ? (
              <Image
                src={lead.photo}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 30vw"
                className="object-cover"
              />
            ) : null}
          </div>
        </figure>

        <div className="lg:col-span-8">
          {lead.scope && (
            <p
              className={cn(
                "font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase",
                onDark ? "text-ccjv-cream" : "text-ccjv-green",
              )}
            >
              {lead.scope}
            </p>
          )}
          <h3
            className={cn(
              "mt-4 font-serif text-[clamp(1.8rem,1rem+2vw,2.75rem)] leading-[1.1]",
              onDark && "text-white",
            )}
          >
            {lead.name}
          </h3>
          <p className={cn("mt-3 font-sans text-[1.02rem]", muted)}>{lead.role}</p>
          {lead.bio && (
            <p className={cn("mt-6 max-w-[58ch] text-[1.02rem] leading-[1.72]", muted)}>
              {lead.bio}
            </p>
          )}
        </div>
      </div>

      {/* Notices */}
      {rest.length > 0 && (
        <ul className="mt-14 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          {rest.map((person) => (
            <li
              key={person.id}
              className={cn("flex items-start gap-5 border-t py-7", line)}
            >
              {person.photo && (
                <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-ccjv-line">
                  <Image
                    src={person.photo}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </span>
              )}
              <span className="flex flex-col gap-1">
                <span
                  className={cn(
                    "font-serif text-[1.15rem] leading-snug",
                    onDark && "text-white",
                  )}
                >
                  {person.name}
                </span>
                <span className={cn("font-sans text-[0.85rem]", muted)}>
                  {person.role}
                </span>
                {person.bio && (
                  <span className={cn("mt-2 font-sans text-[0.85rem] leading-relaxed", muted)}>
                    {person.bio}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
