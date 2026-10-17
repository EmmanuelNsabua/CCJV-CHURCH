"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { AdminEntityGrid, AdminEntityCard } from "@/components/admin/cards";
import { Pagination } from "@/components/admin/tables/Pagination";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/admin/forms/Select";
import { listEnseignements, deleteEnseignement } from "@/lib/api/endpoints";
import type { EnseignementRecord } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils";

export default function EnseignementsListPage() {
  const toast = useToast();

  const [teachings, setTeachings] = useState<EnseignementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre (sans barre de recherche)
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Suppression
  const [itemToDelete, setItemToDelete] = useState<EnseignementRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeachings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listEnseignements({
        page: 1,
        limit: 100,
      });
      setTeachings(res.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les enseignements.";
      setError(msg);
      toast.error("Erreur lors de la récupération des enseignements.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeachings();
  }, [fetchTeachings]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEnseignement(itemToDelete.id);
      toast.success(`L'enseignement "${itemToDelete.title}" a été supprimé.`);
      setItemToDelete(null);
      fetchTeachings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage local
  const filteredData = useMemo(() => {
    return teachings.filter((item) => {
      if (selectedStatus === "ALL") return true;
      return item.status === selectedStatus;
    });
  }, [teachings, selectedStatus]);

  // Données paginées
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Gestion des Enseignements"
        description="Gérez les prédications dominicales, études bibliques, séries doctrinales et repères scripturaires du CCJV."
        actions={
          <Button
            href="/admin/enseignements/new"
            variant="primary"
            size="sm"
            className="font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nouvel enseignement
          </Button>
        }
      />

      {/* Barre de filtre épurée (sans barre de recherche) */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Tous les statuts", value: "ALL" },
              { label: "Publiés", value: "PUBLISHED" },
              { label: "Brouillons", value: "DRAFT" },
              { label: "Archivés", value: "ARCHIVED" },
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Grille 2 × x des enseignements */}
      <AdminEntityGrid
        items={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Aucun enseignement trouvé"
        emptyDescription="Aucun enseignement ne correspond au statut sélectionné."
        emptyAction={
          <Button href="/admin/enseignements/new" size="sm" variant="primary">
            <Plus className="h-4 w-4" />
            Ajouter un enseignement
          </Button>
        }
        renderItem={(item) => {
          // Résolution de l'image de couverture / miniature associée
          const primaryMedia = item.medias?.find(
            (m) => m.isPrimary || m.role === "THUMBNAIL",
          );
          const resolvedImage =
            primaryMedia?.media?.publicUrl ||
            (primaryMedia as unknown as { url?: string })?.url ||
            item.medias?.[0]?.media?.publicUrl ||
            (item.medias?.[0] as unknown as { url?: string })?.url ||
            null;

          return (
            <AdminEntityCard
              id={item.id}
              title={item.title}
              detailHref={`/admin/enseignements/${item.id}`}
              imageUrl={resolvedImage}
              subtitle={item.speakerName ? `Par ${item.speakerName}` : undefined}
              description={item.summary}
              statusBadge={{
                label:
                  item.status === "PUBLISHED"
                    ? "Publié"
                    : item.status === "ARCHIVED"
                    ? "Archivé"
                    : "Brouillon",
                variant:
                  item.status === "PUBLISHED"
                    ? "success"
                    : item.status === "ARCHIVED"
                    ? "warning"
                    : "neutral",
              }}
              dateLabel={
                item.preachedAt
                  ? `Parution : ${formatLongDate(item.preachedAt.slice(0, 10))}`
                  : undefined
              }
              onDelete={() => setItemToDelete(item)}
              deleteTitle="Supprimer cet enseignement"
              deleteAriaLabel={`Supprimer ${item.title}`}
              viewLabel="Voir plus"
            />
          );
        }}
      />

      {/* Pagination */}
      {!isLoading && filteredData.length > pageSize && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer l'enseignement ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'enseignement "${itemToDelete?.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}
