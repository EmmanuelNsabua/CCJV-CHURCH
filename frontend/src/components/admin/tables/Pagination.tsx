"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem =
    totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-1 text-xs text-ccjv-ink-secondary font-sans",
        className,
      )}
    >
      <div>
        {startItem !== null && endItem !== null && totalItems !== null ? (
          <p>
            Affichage de <span className="font-semibold text-ccjv-ink">{startItem}</span> à{" "}
            <span className="font-semibold text-ccjv-ink">{endItem}</span> sur{" "}
            <span className="font-semibold text-ccjv-ink">{totalItems}</span> résultats
          </p>
        ) : (
          <p>
            Page <span className="font-semibold text-ccjv-ink">{currentPage}</span> sur{" "}
            <span className="font-semibold text-ccjv-ink">{totalPages}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex h-8 items-center gap-1 border border-ccjv-line bg-white px-2.5 text-xs text-ccjv-ink hover:border-ccjv-ink disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            // Ne montrer que quelques pages si totalPages > 6
            if (
              totalPages > 6 &&
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(pageNum - currentPage) > 1
            ) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <span key={pageNum} className="px-1 text-ccjv-ink-secondary">
                    …
                  </span>
                );
              }
              return null;
            }

            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-8 min-w-[32px] px-2 text-xs font-medium border transition-colors",
                  isActive
                    ? "border-ccjv-green bg-ccjv-green text-white font-semibold"
                    : "border-ccjv-line bg-white text-ccjv-ink hover:border-ccjv-ink",
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex h-8 items-center gap-1 border border-ccjv-line bg-white px-2.5 text-xs text-ccjv-ink hover:border-ccjv-ink disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
