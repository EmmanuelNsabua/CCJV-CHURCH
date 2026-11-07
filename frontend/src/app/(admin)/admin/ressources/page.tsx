"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { AdminEntityGrid, AdminResourceCard } from "@/components/admin/cards";
import { Pagination } from "@/components/admin/tables/Pagination";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/admin/forms/Select";
import { useAuth } from "@/lib/auth/AuthContext";
import { getResources, deleteResource, archiveResource } from "@/lib/api/endpoints";
import type { Resource } from "@/lib/api/types";

export default function RessourcesAdminListPage() {
  const toast = useToast();
  const { adminProfile } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre (ordre de tri, sans barre de recherche)
  const [sortOrder, setSortOrder] = useState<string>("RECENT");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Suppression
  const [itemToDelete, setItemToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const deptFilter =
        adminProfile?.role === "DEPARTMENT_MANAGER" && adminProfile?.departmentId
          ? { departmentId: adminProfile.departmentId }
          : {};

      const res = await getResources({
        page: 1,
        limit: 100,
        ...deptFilter,
      });
      setResources(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les ressources.";
      setError(msg);
      toast.error("Erreur lors de la récupération des ressources.");
    } finally {
      setIsLoading(false);
    }
  }, [adminProfile, toast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleArchive = async (item: Resource) => {
    try {
      const nextArchived = !item.isArchived;
      await archiveResource(item.id, nextArchived);
      setResources((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, isArchived: nextArchived } : r)),
      );
      toast.success(
        nextArchived
          ? `Le document "${item.name}" a été archivé.`
          : `Le document "${item.name}" a été désarchivé.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'archivage.";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(itemToDelete.id);
      toast.success(`La ressource "${itemToDelete.name}" a été supprimée.`);
      setItemToDelete(null);
      fetchResources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage et tri
  const sortedData = useMemo(() => {
    const list = [...resources];
    if (sortOrder === "ANCIEN") {
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
    } else if (sortOrder === "ALPHABETIQUE") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // RECENT par défaut
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }
    return list;
  }, [resources, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Gestion des Ressources"
        description="Guides d'études, livrets de jeûne, plans de lecture et documents PDF proposés en téléchargement libre."
        actions={
          <Button
            href="/admin/ressources/new"
            variant="primary"
            size="sm"
            className="font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nouvelle ressource
          </Button>
        }
      />

      {/* Barre de filtres épurée (sans barre de recherche) */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-center gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Plus récentes", value: "RECENT" },
              { label: "Plus anciennes", value: "ANCIEN" },
              { label: "Ordre alphabétique (A-Z)", value: "ALPHABETIQUE" },
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Grille des cartes horizontales de ressources */}
      <AdminEntityGrid
        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        items={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Aucune ressource pour le moment"
        emptyDescription="Cliquez sur « Nouvelle ressource » pour mettre un document PDF en ligne."
        emptyAction={
          <Button href="/admin/ressources/new" size="sm" variant="primary">
            <Plus className="h-4 w-4" />
            Ajouter une ressource
          </Button>
        }
        renderItem={(item) => (
          <AdminResourceCard
            key={item.id}
            id={item.id}
            name={item.name}
            file={item.file}
            description={item.description}
            createdAt={item.createdAt}
            isArchived={item.isArchived}
            onArchive={() => handleArchive(item)}
            onDelete={() => setItemToDelete(item)}
            editHref={`/admin/ressources/${item.id}`}
            detailHref={`/admin/ressources/${item.id}`}
          />
        )}
      />

      {/* Pagination */}
      {!isLoading && sortedData.length > pageSize && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer la ressource"
        message={`Êtes-vous certain de vouloir supprimer définitivement la ressource "${itemToDelete?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
