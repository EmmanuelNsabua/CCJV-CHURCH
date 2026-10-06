import { formatLongDate, formatTime } from "@/lib/utils";
import type { Event } from "@/types";

/**
 * Événement secondaire : ligne éditoriale compacte (pas de carte), pour créer
 * une hiérarchie avec l'événement principal.
 */
export function EventRow({
  event,
  departmentName,
}: {
  event: Event;
  departmentName?: string;
}) {
  return (
    <article className="grid grid-cols-1 gap-2 border-b border-ccjv-line py-7 md:grid-cols-12 md:items-baseline md:gap-6">
      <time
        className="font-sans text-sm text-ccjv-ink-secondary md:col-span-3"
        dateTime={event.eventDate}
      >
        {formatLongDate(event.eventDate)}
      </time>
      <h3 className="font-serif text-[1.25rem] leading-snug md:col-span-6">
        {event.title}
        {departmentName && (
          <span className="mt-1 block font-sans text-xs font-semibold tracking-[0.08em] text-ccjv-green uppercase">
            {departmentName}
          </span>
        )}
      </h3>
      <p className="font-sans text-sm text-ccjv-ink-secondary md:col-span-3 md:text-right">
        {formatTime(event.eventTime)} · {event.location ?? "Lubumbashi"}
      </p>
    </article>
  );
}
