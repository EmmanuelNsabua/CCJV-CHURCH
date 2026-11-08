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
import { useAuth } from "@/lib/auth/AuthContext";
import { getDepartmentBadge, ECODIM_DEPARTMENT_ID, PRESSE_DEPARTMENT_ID } from "@/lib/departments";
import { listAdminPublications, deleteAdminPublication } from "@/lib/api/endpoints";
import type { PublicationRecord } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils";

export default function PublicationsListPage() {
  const toast = useToast();
  const { adminProfile } = useAuth();
  const isGlobalAdmin = adminProfile?.role === "SUPER_ADMIN" || adminProfile?.role === "ADMIN";

  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres (sans barre de recherche)
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Suppression
  const [itemToDelete, setItemToDelete] = useState<PublicationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPublications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const deptFilter =
        adminProfile?.role === "DEPARTMENT_MANAGER" && adminProfile?.departmentId
          ? { departmentId: adminProfile.departmentId }
          : {};

      const res = await listAdminPublications({
        page: 1,
        limit: 100,
        ...deptFilter,
      });
      setPublications(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les publications.";
      setError(msg);
      toast.error("Erreur lors de la récupération des publications.");
    } finally {
      setIsLoading(false);
    }
  }, [adminProfile, toast]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminPublication(itemToDelete.id);
      toast.success(`La publication "${itemToDelete.title}" a été supprimée.`);
      setItemToDelete(null);
      fetchPublications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage
  const filteredData = useMemo(() => {
    return publications.filter((item) => {
      // Si gestionnaire de département, filtrer strictement sur son département
      if (!isGlobalAdmin && adminProfile?.departmentId) {
        if (adminProfile.departmentId === ECODIM_DEPARTMENT_ID) {
          if (item.departmentId !== ECODIM_DEPARTMENT_ID && item.scope !== "ECODIM") return false;
        } else if (item.departmentId !== adminProfile.departmentId) {
          return false;
        }
      }

      // Filtre département pour admins globaux
      if (isGlobalAdmin && selectedDepartment !== "ALL") {
        if (selectedDepartment === "ECODIM") {
          if (item.departmentId !== ECODIM_DEPARTMENT_ID && item.scope !== "ECODIM") return false;
        } else if (selectedDepartment === "PRESSE") {
          if (item.departmentId !== PRESSE_DEPARTMENT_ID) return false;
        } else if (selectedDepartment === "CCJV") {
          if (
            item.departmentId === ECODIM_DEPARTMENT_ID ||
            item.scope === "ECODIM" ||
            item.departmentId === PRESSE_DEPARTMENT_ID
          ) {
            return false;
          }
        }
      }

      const matchType = selectedType === "ALL" || item.type === selectedType;
      const matchStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "PUBLISHED" && item.status === "PUBLISHED") ||
        (selectedStatus === "DRAFT" && item.status !== "PUBLISHED");

      return matchType && matchStatus;
    });
  }, [publications, isGlobalAdmin, adminProfile, selectedDepartment, selectedType, selectedStatus]);

  // Données paginées
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Gestion des Publications"
        description="Créez, modifiez et gérez les articles, enseignements, prédications et notes bibliques du CCJV."
        actions={
          <Button
            href="/admin/publications/new"
            variant="primary"
            size="sm"
            className="font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nouvelle publication
          </Button>
        }
      />

      {/* Barre de filtres épurée (sans barre de recherche ni compteur encombrant) */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-48">
          <Select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            options={[
              { label: "Tous les formats", value: "ALL" },
              { label: "Texte / Enseignement", value: "TEXTE" },
              { label: "Vidéo / Prédication", value: "VIDEO" },
              { label: "Photo / Galerie", value: "PHOTO" },
            ]}
          />
        </div>

        <div className="w-full sm:w-44">
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
            ]}
          />
        </div>

        {isGlobalAdmin && (
          <div className="w-full sm:w-52">
            <Select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              options={[
                { label: "Tous les départements", value: "ALL" },
                { label: "Général CCJV", value: "CCJV" },
                { label: "Ecodim", value: "ECODIM" },
                { label: "Presse", value: "PRESSE" },
              ]}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Grille 2 × x des publications */}
      <AdminEntityGrid
        items={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Aucune publication trouvée"
        emptyDescription="Aucune publication ne correspond aux critères sélectionnés."
        emptyAction={
          <Button href="/admin/publications/new" size="sm" variant="primary">
            <Plus className="h-4 w-4" />
            Créer une publication
          </Button>
        }
        renderItem={(item) => {
          const resolvedImage =
            item.coverImage ||
            (item.type === "PHOTO" && item.contentUrl ? item.contentUrl : null) ||
            null;

          return (
            <AdminEntityCard
              id={item.id}
              title={item.title}
              detailHref={`/admin/publications/${item.id}`}
              imageUrl={resolvedImage}
              subtitle={item.author ? `Par ${item.author}` : undefined}
              description={item.description}
              departmentBadge={getDepartmentBadge(item.departmentId, item.scope)}
              statusBadge={{
                label: item.status === "PUBLISHED" ? "Publié" : "Brouillon",
                variant: item.status === "PUBLISHED" ? "success" : "neutral",
              }}
              dateLabel={
                item.publishedAt ? `Parution : ${formatLongDate(item.publishedAt)}` : undefined
              }
              onDelete={() => setItemToDelete(item)}
              deleteTitle="Supprimer cette publication"
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

      {/* Dialogue de confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer la publication ?"
        message={`Êtes-vous certain de vouloir supprimer définitivement "${itemToDelete?.title}" ? Cette action est irréversible.`}
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
