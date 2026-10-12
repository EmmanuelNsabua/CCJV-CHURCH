"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Eye, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface PrayerItem {
  id: string;
  senderName: string;
  subject: string;
  isAnonymous: boolean;
  status: "PENDING" | "PRAYED" | "ARCHIVED";
  createdAt: string;
}

const mockPrayers: PrayerItem[] = [
  {
    id: "1",
    senderName: "Frère Emmanuel",
    subject: "Action de grâce pour la guérison et protection divine",
    isAnonymous: false,
    status: "PENDING",
    createdAt: "11 Oct 2026",
  },
  {
    id: "2",
    senderName: "Anonyme",
    subject: "Prière pour les études et la direction de Dieu",
    isAnonymous: true,
    status: "PRAYED",
    createdAt: "09 Oct 2026",
  },
  {
    id: "3",
    senderName: "Sœur Grâce",
    subject: "Intercession pour la famille et la paix",
    isAnonymous: false,
    status: "PRAYED",
    createdAt: "05 Oct 2026",
  },
];

export default function AdminPrayersPage() {
  const { role } = useAuth();
  const [prayers] = useState<PrayerItem[]>(mockPrayers);

  const columns: ColumnDef<PrayerItem>[] = [
    {
      header: "Demandeur",
      cell: (item) => (
        <div className="font-sans">
          <p className="font-semibold text-ccjv-ink text-sm">
            {item.isAnonymous ? "Intention anonyme" : item.senderName}
          </p>
          <p className="text-[11px] text-ccjv-ink-secondary font-mono">{item.createdAt}</p>
        </div>
      ),
    },
    {
      header: "Sujet d'intercession",
      cell: (item) => (
        <span className="text-xs text-ccjv-ink line-clamp-1">{item.subject}</span>
      ),
    },
    {
      header: "Statut",
      cell: (item) => {
        if (item.status === "PRAYED") {
          return (
            <Badge variant="success" className="text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Portée en prière
            </Badge>
          );
        }
        return (
          <Badge variant="warning" className="text-[10px]">
            <Clock className="h-3 w-3 mr-1" /> En attente
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      cell: () => (
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Eye className="h-3.5 w-3.5 mr-1" /> Consulter
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Intentions de Prières"
        description="Gestion des requêtes d'intercession déposées par la communauté."
      />

      {role === "SUPER_ADMIN" && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 rounded-none">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
          <p>
            <strong>Note cryptographique :</strong> Par contrainte de stricte confidentialité (Lot 8 & GEMINI.md),
            les intentions privées chiffrées sont exclusivement accessibles par l&apos;équipe pastorale accréditée.
          </p>
        </div>
      )}

      <div className="bg-white border border-ccjv-line p-4 sm:p-6 rounded-none">
        <DataTable
          columns={columns}
          data={prayers}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
