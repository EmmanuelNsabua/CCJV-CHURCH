"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";
import { getDepartments } from "@/lib/api/endpoints";
import type { Department } from "@/lib/api/types";
import Link from "next/link";

export default function DepartmentsListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les départements.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const columns: ColumnDef<Department>[] = [
    {
      header: "Département & Ministère",
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-ccjv-ink">{item.name}</div>
          <div className="text-[11px] text-ccjv-ink-secondary font-mono">
            slug: {item.slug}
          </div>
        </div>
      ),
    },
    {
      header: "Description / Vocation",
      cell: (item) => (
        <p className="text-xs text-ccjv-ink-secondary line-clamp-2 max-w-lg">
          {item.description || "Aucune description renseignée."}
        </p>
      ),
    },
    {
      header: "Statut",
      cell: () => (
        <Badge variant="success" className="text-[10px]">
          Actif
        </Badge>
      ),
    },
    {
      header: "Lien public",
      align: "right",
      cell: (item) => (
        <Link
          href={`/organisation#${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-ccjv-green hover:underline"
        >
          <span>Voir</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Départements & Ministères"
        description="Pôles d'activité et ministères de service du Centre Chrétien Jésus ma Vie (Louange, Intercession, Jeunesse, Accueil...)."
      />

      <DataTable
        columns={columns}
        data={departments}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
