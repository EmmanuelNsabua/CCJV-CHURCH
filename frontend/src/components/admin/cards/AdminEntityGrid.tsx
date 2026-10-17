"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox } from "lucide-react";

export interface AdminEntityGridProps<T> {
  items: T[];
  keyExtractor: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

export function AdminEntityGrid<T>({
  items,
  keyExtractor,
  renderItem,
  isLoading = false,
  emptyTitle = "Aucun élément trouvé",
  emptyDescription = "Aucun élément ne correspond aux filtres sélectionnés.",
  emptyAction,
  className,
}: AdminEntityGridProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5", className)}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-48 bg-white border border-ccjv-line rounded-none p-5 animate-pulse flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-4 w-24 bg-ccjv-line/60" />
              <div className="h-6 w-3/4 bg-ccjv-line/70" />
              <div className="h-4 w-1/2 bg-ccjv-line/40" />
            </div>
            <div className="h-8 border-t border-ccjv-line/50 pt-2 flex justify-between items-center">
              <div className="h-4 w-20 bg-ccjv-line/50" />
              <div className="h-4 w-12 bg-ccjv-line/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-ccjv-line rounded-none p-12 text-center">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5", className)}>
      {items.map((item) => (
        <React.Fragment key={keyExtractor(item)}>
          {renderItem(item)}
        </React.Fragment>
      ))}
    </div>
  );
}
