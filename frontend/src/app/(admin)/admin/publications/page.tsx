"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Pagination } from "@/components/admin/tables/Pagination";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/admin/forms/Input";
import { Select } from "@/components/admin/forms/Select";
import { listAdminPublications, deleteAdminPublication } from "@/lib/api/endpoints";
import type { PublicationRecord } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils";

export default function PublicationsListPage() {
  const toast = useToast();

  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<PublicationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPublications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listAdminPublications({
        page,
        limit: 100,
      });
      setPublications(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les publications.";
      setError(msg);
      toast.error("Erreur lors de la récupération des publications.");
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

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
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.author?.toLowerCase().includes(search.toLowerCase());

      const matchType = selectedType === "ALL" || item.type === selectedType;
      const matchStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "PUBLISHED" && item.status === "PUBLISHED") ||
        (selectedStatus === "DRAFT" && item.status !== "PUBLISHED");

      return matchSearch && matchType && matchStatus;
    });
  }, [publications, search, selectedType, selectedStatus]);


  // Données paginées
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Colonnes DataTable
  const columns: ColumnDef<PublicationRecord>[] = [
    {
      header: "Titre & Auteur",
      accessorKey: "title",
      cell: (item) => (
        <div className="space-y-0.5">
          <Link
            href={`/admin/publications/${item.id}`}
            className="font-semibold text-ccjv-ink hover:text-ccjv-green transition-colors block text-xs"
          >
            {item.title}
          </Link>
          <div className="text-[11px] text-ccjv-ink-secondary">
            Par <span className="font-medium text-ccjv-ink">{item.author || "CCJV"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Type & Catégorie",
      cell: (item) => (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-ccjv-ink">{item.category || "Général"}</span>
          <span className="text-[10px] text-ccjv-ink-secondary uppercase tracking-wider">
            {item.type}
          </span>
        </div>
      ),
    },
    {
      header: "Statut",
      cell: (item) => (
        <Badge
          variant={item.status === "PUBLISHED" ? "success" : "neutral"}
          className="text-[10px]"
        >
          {item.status === "PUBLISHED" ? "Publié" : "Brouillon"}
        </Badge>
      ),
    },
    {
      header: "Date de parution",
      cell: (item) => (
        <span className="text-xs text-ccjv-ink-secondary">
          {item.publishedAt ? formatLongDate(item.publishedAt) : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/publications/${item.id}`}
            className="p-1.5 text-ccjv-ink-secondary hover:text-ccjv-green hover:bg-[#fafaf7] transition-colors"
            title="Modifier"
            aria-label={`Modifier ${item.title}`}
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setItemToDelete(item)}
            className="p-1.5 text-ccjv-ink-secondary hover:text-[#b91c1c] hover:bg-[#fef2f2] transition-colors"
            title="Supprimer"
            aria-label={`Supprimer ${item.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

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

      {/* Barre de recherche et filtres */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder="Rechercher par titre, auteur ou description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-ccjv-ink-secondary pointer-events-none" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <Select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
            options={[
              { label: "Tous les formats", value: "ALL" },
              { label: "Texte / Enseignement", value: "TEXTE" },
              { label: "Vidéo / Prédication", value: "VIDEO" },
              { label: "Photo / Galerie", value: "PHOTO" },
            ]}
          />

          <Select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-36"
            options={[
              { label: "Tous les statuts", value: "ALL" },
              { label: "Publiés", value: "PUBLISHED" },
              { label: "Brouillons", value: "DRAFT" },
            ]}
          />
        </div>
      </div>

      {/* Tableau de données */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Dialogue de confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer la publication ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${itemToDelete?.title}" ? Cette action est irréversible.`}
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
