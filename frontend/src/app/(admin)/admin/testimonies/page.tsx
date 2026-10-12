"use client";

import React, { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { getTestimonies } from "@/lib/api/endpoints";
import type { Testimony } from "@/lib/api/types";
import { Check } from "lucide-react";

export default function AdminTestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTestimonies();
        setTestimonies(data);
      } catch (err) {
        console.warn("Erreur chargement témoignages :", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: ColumnDef<Testimony>[] = [
    {
      header: "Auteur / Témoin",
      cell: (item) => (
        <div className="font-sans">
          <p className="font-semibold text-ccjv-ink text-sm">{item.name}</p>
          <p className="text-[11px] text-ccjv-ink-secondary">{item.role || "Membre de l'assemblée"}</p>
        </div>
      ),
    },
    {
      header: "Témoignage",
      cell: (item) => (
        <div className="max-w-md">
          <p className="text-xs text-ccjv-ink italic line-clamp-2">« {item.quote} »</p>
        </div>
      ),
    },
    {
      header: "Statut",
      cell: () => (
        <Badge variant="success" className="text-[10px]">
          <Check className="h-3 w-3 mr-1" /> Publié
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Témoignages de la Communauté"
        description="Consultation et intendance des récits édifiants partagés par les fidèles."
      />

      <div className="bg-white border border-ccjv-line p-4 sm:p-6 rounded-none">
        <DataTable
          columns={columns}
          data={testimonies}
          keyExtractor={(item) => item.id}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
