"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Shield, UserCheck } from "lucide-react";

interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_MANAGER";
  scope: string;
  status: "ACTIF" | "INVITE";
}

const mockAdminUsers: AdminUserRow[] = [
  {
    id: "1",
    email: "superadmin@ccjv.local",
    username: "superadmin",
    role: "SUPER_ADMIN",
    scope: "GLOBAL",
    status: "ACTIF",
  },
  {
    id: "2",
    email: "admin@ccjv.local",
    username: "admin",
    role: "ADMIN",
    scope: "GLOBAL",
    status: "ACTIF",
  },
];

export default function AdminUsersPage() {
  const columns: ColumnDef<AdminUserRow>[] = [
    {
      header: "Utilisateur",
      cell: (item) => (
        <div>
          <p className="font-semibold text-ccjv-ink text-sm">{item.username}</p>
          <p className="text-xs text-ccjv-ink-secondary font-mono">{item.email}</p>
        </div>
      ),
    },
    {
      header: "Rôle",
      cell: (item) => {
        if (item.role === "SUPER_ADMIN") {
          return (
            <Badge variant="warning" className="text-[10px]">
              <Shield className="h-3 w-3 mr-1" /> SUPER_ADMIN
            </Badge>
          );
        }
        return (
          <Badge variant="info" className="text-[10px]">
            <Shield className="h-3 w-3 mr-1" /> ADMIN
          </Badge>
        );
      },
    },
    {
      header: "Périmètre",
      cell: (item) => <span className="text-xs font-mono text-ccjv-ink">{item.scope}</span>,
    },
    {
      header: "État",
      cell: () => (
        <Badge variant="success" className="text-[10px]">
          <UserCheck className="h-3 w-3 mr-1" /> Actif
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Annuaire des Administrateurs"
        description="Gestion des comptes habilités et des rôles d'accès du CCJV."
      />

      <div className="bg-white border border-ccjv-line p-4 sm:p-6 rounded-none">
        <DataTable
          columns={columns}
          data={mockAdminUsers}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
