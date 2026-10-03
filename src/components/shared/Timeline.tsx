import { cn } from "@/lib/utils";

export interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

/**
 * L'histoire de CCJV mise en scène comme une narration, pas comme deux lignes
 * de texte : grandes dates en Lora, ligne verticale, progression dans le temps.
 */
export function Timeline({
  items,
  className,
}: {
  items: readonly TimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn("relative border-l border-ccjv-line", className)}>
      {items.map((item) => (
        <li key={item.date} className="relative pb-16 pl-10 last:pb-0 max-md:pb-12 max-md:pl-8">
          <span
            className="absolute top-3 -left-[5px] h-2.5 w-2.5 rounded-full bg-ccjv-green"
            aria-hidden="true"
          />
          <p className="font-serif text-[clamp(1.75rem,1rem+2.4vw,3rem)] leading-none text-ccjv-green">
            {item.date}
          </p>
          <h3 className="mt-4 font-serif text-[1.35rem]">{item.title}</h3>
          <p className="mt-3 max-w-[54ch] text-ccjv-ink-secondary">
            {item.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
