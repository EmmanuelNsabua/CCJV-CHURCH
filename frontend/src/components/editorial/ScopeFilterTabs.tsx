import Link from "next/link";

export interface ScopeFilterTabsProps {
  activeScope: "CCJV" | "ECODIM";
  baseHref?: string;
  ccjvLabel?: string;
  ecodimLabel?: string;
  counts?: {
    ccjv?: number;
    ecodim?: number;
  };
}

export function ScopeFilterTabs({
  activeScope,
  baseHref = "",
  ccjvLabel = "CCJV (Général)",
  ecodimLabel = "ECODIM (Enfants)",
  counts,
}: ScopeFilterTabsProps) {
  const isCcjv = activeScope === "CCJV";
  const isEcodim = activeScope === "ECODIM";

  const ccjvHref = baseHref ? `${baseHref}?scope=CCJV` : "?scope=CCJV";
  const ecodimHref = baseHref ? `${baseHref}?scope=ECODIM` : "?scope=ECODIM";

  return (
    <nav
      aria-label="Sélection du périmètre"
      className="inline-flex border border-ccjv-line p-1 bg-ccjv-surface/50 rounded-none mb-8"
    >
      <Link
        href={ccjvHref}
        scroll={false}
        className={`px-5 py-2.5 font-sans text-xs font-semibold tracking-wider uppercase transition-colors rounded-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green ${isCcjv
            ? "bg-ccjv-green text-ccjv-paper shadow-sm"
            : "text-ccjv-ink-secondary hover:text-ccjv-ink hover:bg-ccjv-surface"
          }`}
        aria-current={isCcjv ? "page" : undefined}
      >
        <span>{ccjvLabel}</span>
        {counts?.ccjv !== undefined && (
          <span
            className={`ml-2 text-[0.7rem] px-1.5 py-0.5 rounded-none ${isCcjv
                ? "bg-black/20 text-ccjv-paper"
                : "bg-ccjv-line/60 text-ccjv-ink-secondary"
              }`}
          >
            {counts.ccjv}
          </span>
        )}
      </Link>

      <Link
        href={ecodimHref}
        scroll={false}
        className={`px-5 py-2.5 font-sans text-xs font-semibold tracking-wider uppercase transition-colors rounded-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green ${isEcodim
            ? "bg-ccjv-green text-ccjv-paper shadow-sm"
            : "text-ccjv-ink-secondary hover:text-ccjv-ink hover:bg-ccjv-surface"
          }`}
        aria-current={isEcodim ? "page" : undefined}
      >
        <span>{ecodimLabel}</span>
        {counts?.ecodim !== undefined && (
          <span
            className={`ml-2 text-[0.7rem] px-1.5 py-0.5 rounded-none ${isEcodim
                ? "bg-black/20 text-ccjv-paper"
                : "bg-ccjv-line/60 text-ccjv-ink-secondary"
              }`}
          >
            {counts.ecodim}
          </span>
        )}
      </Link>
    </nav>
  );
}

