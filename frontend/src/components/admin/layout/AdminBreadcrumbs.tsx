"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex items-center text-xs font-sans", className)}>
      <ol className="flex items-center gap-1.5 text-ccjv-ink-secondary">
        <li>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 hover:text-ccjv-green transition-colors"
            title="Accueil administration"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Administration</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-ccjv-line" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-ccjv-green transition-colors max-w-[140px] sm:max-w-[200px] truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-ccjv-ink max-w-[140px] sm:max-w-[200px] truncate"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
