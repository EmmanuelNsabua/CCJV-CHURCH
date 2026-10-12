"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox } from "lucide-react";

export interface ColumnDef<T> {
  /** En-tête visible de la colonne */
  header: string;
  /** Clé d'accès direct à la propriété dans l'objet de données */
  accessorKey?: keyof T;
  /** Fonction de rendu personnalisé de la cellule */
  cell?: (item: T) => React.ReactNode;
  /** Alignement horizontal */
  align?: "left" | "center" | "right";
  /** Classes CSS complémentaires pour l'en-tête et les cellules */
  className?: string;
}

export interface DataTableProps<T> {
  /** Définition des colonnes du tableau */
  columns: ColumnDef<T>[];
  /** Données à afficher */
  data: T[];
  /** Fonction retournant la clé unique de chaque ligne */
  keyExtractor: (item: T) => string | number;
  /** État de chargement */
  isLoading?: boolean;
  /** Message d'erreur éventuel */
  error?: string | null;
  /** Composant affiché si vide */
  emptyState?: React.ReactNode;
  /** Callback lors du clic sur une ligne */
  onRowClick?: (item: T) => void;
  /** Classes CSS pour le conteneur */
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const getAlignmentClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className={cn("w-full overflow-hidden border border-ccjv-line bg-white rounded-none", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-ccjv-line bg-[#fbfbfa]">
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ccjv-ink-secondary",
                    getAlignmentClass(col.align),
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ccjv-line">
            {isLoading ? (
              // Squelettes de chargement
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={`skeleton-col-${cIdx}`} className="px-4 py-3.5">
                      <div className="h-4 bg-ccjv-line/60 rounded-none w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <p className="text-xs text-[#b91c1c] font-medium">{error}</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-ccjv-ink-secondary">
                      <Inbox className="h-8 w-8 text-ccjv-line mb-2" />
                      <EmptyState
                        title="Aucun enregistrement trouvé"
                        description="Aucune donnée ne correspond aux critères demandés."
                      />
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const key = keyExtractor(item);
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={cn(
                      "transition-colors hover:bg-[#fafaf7]",
                      isClickable && "cursor-pointer",
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          "px-4 py-3 text-xs text-ccjv-ink",
                          getAlignmentClass(col.align),
                          col.className,
                        )}
                      >
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? "")
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
