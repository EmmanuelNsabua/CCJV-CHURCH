import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-none border border-ccjv-line bg-ccjv-offwhite px-6 py-12 text-left",
        className,
      )}
    >
      <h3 className="text-[1.125rem]">{title}</h3>
      {description && (
        <p className="max-w-[52ch] text-ccjv-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
