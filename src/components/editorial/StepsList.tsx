import { cn } from "@/lib/utils";

/**
 * Parcours en étapes.
 *
 * `vertical` convient aux dispositifs à suivre dans l'ordre (parcours nouveaux) ;
 * `horizontal` aux enchaînements courts (venir pour la première fois).
 */
export interface Step {
  title: string;
  text: string;
}

export interface StepsListProps {
  steps: readonly Step[];
  variant?: "vertical" | "horizontal";
  onDark?: boolean;
  className?: string;
}

export function StepsList({
  steps,
  variant = "vertical",
  onDark = false,
  className,
}: StepsListProps) {
  const line = onDark ? "border-white/15" : "border-ccjv-line";
  const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary";
  const accent = onDark ? "text-ccjv-cream" : "text-ccjv-green";

  if (variant === "horizontal") {
    return (
      <ol className={cn("grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {steps.map((step, index) => (
          <li key={step.title} className={cn("border-t pt-6", line)}>
            <p className={cn("font-serif text-[1.4rem] leading-none", accent)} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className={cn("mt-4 font-serif text-[1.15rem]", onDark && "text-white")}>
              {step.title}
            </h3>
            <p className={cn("mt-3 font-sans text-[0.9rem] leading-relaxed", muted)}>
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn("relative border-l pl-10 max-md:pl-8", line, className)}>
      {steps.map((step, index) => (
        <li key={step.title} className="relative pb-14 last:pb-0">
          <span
            className={cn(
              "absolute top-1 -left-[41px] flex h-6 w-6 items-center justify-center border font-sans text-[0.68rem] font-semibold max-md:-left-[33px]",
              onDark
                ? "border-white/25 bg-ccjv-black text-ccjv-cream"
                : "border-ccjv-line bg-ccjv-offwhite text-ccjv-green",
            )}
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <h3 className={cn("font-serif text-[1.3rem]", onDark && "text-white")}>
            {step.title}
          </h3>
          <p className={cn("mt-3 max-w-[58ch] leading-[1.7]", muted)}>
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
