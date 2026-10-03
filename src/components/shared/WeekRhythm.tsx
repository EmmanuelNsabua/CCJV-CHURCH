export interface RhythmItem {
  day: string;
  title: string;
  time: string;
  audience?: string;
}

/**
 * Les horaires comme rythme de vie de l'église — pas comme une donnée
 * administrative : listes éditoriales, grands titres, le temps mis en scène.
 */
export function WeekRhythm({ items }: { items: readonly RhythmItem[] }) {
  return (
    <ul className="border-t border-ccjv-line">
      {items.map((item) => (
        <li
          key={`${item.day}-${item.title}`}
          className="grid grid-cols-1 gap-2 border-b border-ccjv-line py-8 md:grid-cols-12 md:items-baseline md:gap-6"
        >
          <p className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase md:col-span-3">
            {item.day}
          </p>
          <h3 className="font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight md:col-span-6">
            {item.title}
            {item.audience && (
              <span className="mt-1 block font-sans text-sm font-normal text-ccjv-ink-secondary">
                {item.audience}
              </span>
            )}
          </h3>
          <p className="font-sans text-[1.05rem] text-ccjv-ink-secondary md:col-span-3 md:text-right">
            {item.time}
          </p>
        </li>
      ))}
    </ul>
  );
}
