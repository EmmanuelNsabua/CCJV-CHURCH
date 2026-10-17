"use client";

import React, { useEffect, useState, use } from "react";
import { PublicationForm } from "@/components/admin/forms/PublicationForm";
import { getAdminPublication, updateAdminPublication } from "@/lib/api/endpoints";
import type { PublicationRecord, CreatePublicationPayload } from "@/lib/api/types";
import { useToast } from "@/components/admin/feedback/ToastContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPublicationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const toast = useToast();

  const [publication, setPublication] = useState<PublicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAdminPublication(resolvedParams.id);
        if (isMounted) {
          setPublication(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Impossible de charger la publication demandée.";
          setError(msg);
          toast.error("Erreur de chargement.");
        }
      } finally {

        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, toast]);

  const handleUpdate = async (payload: CreatePublicationPayload) => {
    if (!publication) return;
    const updated = await updateAdminPublication(publication.id, payload as unknown as Record<string, unknown>);
    setPublication(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-ccjv-line/40 animate-pulse w-1/3" />
        <div className="h-64 bg-ccjv-line/20 animate-pulse" />
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="p-8 bg-white border border-ccjv-line text-center space-y-4">
        <p className="text-sm font-medium text-[#b91c1c]">{error || "Publication non trouvée."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PublicationForm
        initialData={publication}
        onSubmit={handleUpdate}
        isEditing={true}
      />
    </div>
  );
}
