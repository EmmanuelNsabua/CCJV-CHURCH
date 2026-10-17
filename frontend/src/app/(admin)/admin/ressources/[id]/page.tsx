"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Calendar, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ResourceForm } from "@/components/admin/forms/ResourceForm";
import { getResource, updateResource, replaceResourceFile } from "@/lib/api/endpoints";
import type { Resource, UpdateResourcePayload } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { formatLongDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResourceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const toast = useToast();

  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getResource(resolvedParams.id);
        if (isMounted) {
          setResource(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Impossible de charger la ressource demandée.";
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

  const handleUpdate = async (payload: UpdateResourcePayload) => {
    if (!resource) return;
    const updated = await updateResource(resource.id, payload);
    setResource(updated);
  };

  const handleReplaceFile = async (newFileUrl: string) => {
    if (!resource) return;
    const updated = await replaceResourceFile(resource.id, newFileUrl);
    setResource(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-ccjv-line" />
        <div className="h-10 w-3/4 bg-ccjv-line" />
        <div className="h-64 bg-white border border-ccjv-line" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="space-y-4">
        <div className="p-8 bg-white border border-ccjv-line text-center space-y-3">
          <p className="text-sm text-red-600 font-medium">
            {error || "Ressource introuvable."}
          </p>
          <Link
            href="/admin/ressources"
            className="inline-flex items-center gap-1 text-xs text-ccjv-green hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour à la liste des ressources
          </Link>
        </div>
      </div>
    );
  }

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
        title={resource.name}
        description="Consultez les détails de la ressource ou modifiez son nom, sa description et son fichier PDF."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="info">Document PDF</Badge>
            <a
              href={resource.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#f3f2ee] hover:bg-[#e5e2d9] text-ccjv-ink border border-ccjv-line px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-ccjv-green" />
              Télécharger le PDF
            </a>
          </div>
        }
      />

      {/* Résumé des métadonnées en lecture */}
      <div className="p-5 bg-white border border-ccjv-line rounded-none flex flex-wrap items-center gap-6 text-xs text-ccjv-ink-secondary">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ccjv-green" />
          <span>Slug public :</span>
          <span className="font-mono text-ccjv-ink font-semibold">{resource.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-ccjv-green" />
          <span>Ajouté le :</span>
          <span className="text-ccjv-ink font-medium">
            {resource.createdAt ? formatLongDate(resource.createdAt.slice(0, 10)) : "—"}
          </span>
        </div>
        <div>
          <a
            href={`/publications/ressources`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ccjv-green hover:underline inline-flex items-center gap-1 font-medium"
          >
            Voir la page publique des ressources <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Formulaire d'édition */}
      <ResourceForm
        initialData={resource}
        onSubmit={handleUpdate}
        onReplaceFile={handleReplaceFile}
      />
    </div>
  );
}
