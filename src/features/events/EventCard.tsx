import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDay, formatMonthShort, formatTime } from "@/lib/utils";
import type { Event } from "@/types";

export interface EventCardProps {
  event: Event;
  /** Nom du département associé (résolu depuis les données, jamais codé en dur). */
  departmentName?: string;
  className?: string;
}

export function EventCard({ event, departmentName, className }: EventCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-none border border-ccjv-line bg-white transition-colors duration-[250ms] hover:border-ccjv-green",
        className,
      )}
    >
      {event.imageUrl && (
        <div className="relative aspect-[16/10] overflow-hidden bg-ccjv-line">
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <time
            className="flex min-w-[52px] flex-col items-center justify-center rounded-none border border-ccjv-ink px-3 py-2 leading-none"
            dateTime={event.eventDate}
            aria-hidden="true"
          >
            <span className="font-serif text-[1.5rem] font-semibold">
              {formatDay(event.eventDate)}
            </span>
            <span className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]">
              {formatMonthShort(event.eventDate)}
            </span>
          </time>
          <Badge variant={event.status === "UPCOMING" ? "default" : "outline"}>
            {event.status === "UPCOMING" ? "À venir" : "Passé"}
          </Badge>
        </div>

        <h3 className="text-[1.3rem]">{event.title}</h3>
        {event.description && (
          <p className="text-[0.9rem] text-ccjv-ink-secondary">
            {event.description}
          </p>
        )}

        <dl className="mt-auto grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 border-t border-ccjv-line pt-4">
          <div>
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ccjv-ink-secondary">
              Heure
            </dt>
            <dd className="mt-1 text-[0.9rem]">{formatTime(event.eventTime)}</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ccjv-ink-secondary">
              Lieu
            </dt>
            <dd className="mt-1 text-[0.9rem]">
              {event.location ?? "Lubumbashi"}
            </dd>
          </div>
          {departmentName && (
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ccjv-ink-secondary">
                Département
              </dt>
              <dd className="mt-1 text-[0.9rem]">{departmentName}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
