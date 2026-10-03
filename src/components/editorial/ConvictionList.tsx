import { cn } from "@/lib/utils";
import { ContentPending } from "./ContentPending";

/**
 * Liste de convictions développées.
 *
 * Une conviction n'est pas une carte : c'est un article de foi numéroté, avec
 * son développement et, si le texte le porte, l'Écriture qui l'établit.
 */
export interface Conviction {
  title: string;
  text: string;
  /** Références bibliques associées (ex. « Jean 3:16 »). */
  references?: string[];
}

export interface ConvictionListProps {
  items: readonly Conviction[];
  /** Ce qui manque lorsqu'aucune conviction n'a encore été fournie par CCJV. */
  pendingWhat?: string;
  onDark?: boolean;
  className?: string;
}

export function ConvictionList({
  items,
  pendingWhat,
  onDark = false,
  className,
}: ConvictionListProps) {
  if (items.length === 0) {
    return (
      <ContentPending
        what={pendingWhat ?? "Confession de foi CCJV"}
        hint="Les convictions ci-dessus doivent être rédigées et validées par la direction de l'église : elles engagent la doctrine enseignée à CCJV."
        className={className}
      />
    );
  }

  const line = onDark ? "border-white/15" : "border-ccjv-line";
  const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary";

  return (
    <ol className={cn("border-t", line, className)}>
      {items.map((item, index) => (
        <li
          key={item.title}
          className={cn(
            "grid grid-cols-1 gap-4 border-b py-9 md:grid-cols-12 md:gap-8",
            line,
          )}
        >
          <p
            className={cn(
              "font-serif text-[1.6rem] leading-none text-ccjv-green md:col-span-1",
              onDark && "text-ccjv-cream",
            )}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </p>

          <h3
            className={cn(
              "font-serif text-[1.25rem] md:col-span-3",
              onDark && "text-white",
            )}
          >
            {item.title}
          </h3>

          <div className="md:col-span-8">
            <p className={cn("max-w-[62ch] leading-[1.7]", muted)}>{item.text}</p>
            {item.references && item.references.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {item.references.map((reference) => (
                  <li
                    key={reference}
                    className={cn(
                      "font-sans text-[0.7rem] font-semibold tracking-[0.14em] uppercase",
                      onDark ? "text-ccjv-cream" : "text-ccjv-green",
                    )}
                  >
                    {reference}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
