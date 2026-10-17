"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DepartmentForm } from "@/components/admin/forms/DepartmentForm";
import { getDepartment, updateDepartment, saveDepartmentActivities } from "@/lib/api";
import type { Department } from "@/types";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Loader2 } from "lucide-react";

export default function EditDepartmentPage() {
  const params = useParams();
  const idOrSlug = params.id as string;
  const router = useRouter();
  const toast = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDepartment(idOrSlug);
        if (!data) {
          setError("Département introuvable.");
        } else {
          setDepartment(data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur de chargement";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }
    if (idOrSlug) {
      load();
    }
  }, [idOrSlug, toast]);

  const handleUpdate = async ({
    department: patch,
    activities,
  }: {
    department: Record<string, unknown>;
    activities: { title: string; description?: string | null; imageMediaId?: string | null; position?: number }[];
  }) => {
    if (!department) return;
    await updateDepartment(
      department.id,
      patch as unknown as Parameters<typeof updateDepartment>[1],
    );
    await saveDepartmentActivities(department.id, activities);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-ccjv-green" />
        <p className="text-xs text-ccjv-ink-secondary">Chargement de la fiche département...</p>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-red-800">
          {error || "Ce département n'existe pas ou a été archivé."}
        </p>
        <button
          onClick={() => router.push("/admin/departments")}
          className="text-xs text-ccjv-ink underline hover:text-ccjv-green"
        >
          Retourner aux départements
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DepartmentForm
        initialData={department}
        onSubmit={handleUpdate}
        isEditing={true}
      />
    </div>
  );
}
