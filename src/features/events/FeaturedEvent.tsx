import Image from "next/image";
import { cn, formatLongDate, formatTime } from "@/lib/utils";
import type { Event } from "@/types";

/**
 * Événement principal : composition éditoriale dominante (photo + date + titre +
 * description + lieu/heure), au lieu d'une carte parmi trois identiques.
 */
export function FeaturedEvent({
  event,
  departmentName,
  className,
}: {
  event: Event;
  departmentName?: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10",
        className,
      )}
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-ccjv-line md:col-span-7 md:aspect-auto md:min-h-[28rem]">
        {event.imageUrl && (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-col justify-center md:col-span-5">
        <p className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
          Prochain rendez-vous
        </p>
        <time
          className="mt-6 block font-serif text-[clamp(2rem,1rem+2.6vw,3.25rem)] leading-none"
          dateTime={event.eventDate}
        >
          {formatLongDate(event.eventDate)}
        </time>
        <h3 className="mt-5 font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-4 max-w-[46ch] text-ccjv-ink-secondary">
            {event.description}
          </p>
        )}

        <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-ccjv-line pt-6">
          <div>
            <dt className="text-[0.7rem] font-semibold tracking-[0.08em] text-ccjv-ink-secondary uppercase">
              Heure
            </dt>
            <dd className="mt-1">{formatTime(event.eventTime)}</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] font-semibold tracking-[0.08em] text-ccjv-ink-secondary uppercase">
              Lieu
            </dt>
            <dd className="mt-1">{event.location ?? "Lubumbashi"}</dd>
          </div>
          {departmentName && (
            <div className="col-span-2">
              <dt className="text-[0.7rem] font-semibold tracking-[0.08em] text-ccjv-ink-secondary uppercase">
                Département
              </dt>
              <dd className="mt-1">{departmentName}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
