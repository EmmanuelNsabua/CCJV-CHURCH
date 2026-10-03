import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  overline?: string;
  title: string;
  description?: string;
  /** `true` pour une section sombre (texte clair). */
  dark?: boolean;
  align?: "left" | "center";
  id?: string;
  className?: string;
}

export function SectionHeading({
  overline,
  title,
  description,
  dark = false,
  align = "left",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 flex max-w-[64ch] flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {overline && <p className="overline">{overline}</p>}
      <h2 id={id} className={cn("text-ccjv-ink", dark && "text-white")}>
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-[1.0625rem] leading-[1.6] text-ccjv-ink-secondary",
            dark && "text-white/70",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
