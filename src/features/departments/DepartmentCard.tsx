import { cn } from "@/lib/utils";
import type { Department } from "@/types";

export interface DepartmentCardProps {
  department: Department;
  className?: string;
}

export function DepartmentCard({ department, className }: DepartmentCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-none border border-ccjv-line bg-white p-6 transition-colors duration-[250ms] hover:border-ccjv-green",
        className,
      )}
    >
      <h3 className="text-[1.3rem]">{department.name}</h3>
      {department.description && (
        <p className="text-[0.95rem] text-ccjv-ink-secondary">
          {department.description}
        </p>
      )}
      {department.responsibleName && (
        <p className="mt-auto flex flex-col gap-1 border-t border-ccjv-line pt-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ccjv-ink-secondary">
            Responsable
          </span>
          <span className="text-[0.9rem]">{department.responsibleName}</span>
        </p>
      )}
    </article>
  );
}
