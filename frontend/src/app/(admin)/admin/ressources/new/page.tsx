"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ResourceForm } from "@/components/admin/forms/ResourceForm";
import { createResource } from "@/lib/api/endpoints";
import type { CreateResourcePayload } from "@/lib/api/types";

export default function NewResourcePage() {
  const handleCreate = async (payload: CreateResourcePayload) => {
    await createResource(payload);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/ressources"
          className="inline-flex items-center gap-1.5 text-xs text-ccjv-ink-secondary hover:text-ccjv-green transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux ressources
        </Link>
      </div>

      <AdminPageHeader
        title="Ajouter une nouvelle ressource"
        description="Mettez à disposition de l'assemblée un guide d'étude, plan de lecture ou livret PDF en accès libre."
      />

      <ResourceForm onSubmit={handleCreate} />
    </div>
  );
}
