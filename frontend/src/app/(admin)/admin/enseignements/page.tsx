"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Edit2, ExternalLink, Video, Mic, AlertCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Pagination } from "@/components/admin/tables/Pagination";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/admin/forms/Input";
import { Select } from "@/components/admin/forms/Select";
import { listEnseignements, deleteEnseignement } from "@/lib/api/endpoints";
import type { EnseignementRecord } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils";

export default function EnseignementsListPage() {
  const toast = useToast();

  const [teachings, setTeachings] = useState<EnseignementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<EnseignementRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeachings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listEnseignements({
        page: 1,
        limit: 50,
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
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.speakerName.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [teachings, search, selectedStatus]);

  // Données paginées
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Colonnes DataTable
  const columns: ColumnDef<EnseignementRecord>[] = [
    {
      header: "Titre & Orateur",
      accessorKey: "title",
      cell: (item) => (
        <div className="space-y-0.5">
          <Link
            href={`/admin/enseignements/${item.id}`}
            className="font-semibold text-ccjv-ink hover:text-ccjv-green transition-colors block text-xs"
          >
            {item.title}
          </Link>
          <div className="text-[11px] text-ccjv-ink-secondary">
            Orateur : <span className="font-medium text-ccjv-ink">{item.speakerName}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Date de prédication",
      cell: (item) => (
        <span className="text-xs text-ccjv-ink font-medium">
          {item.preachedAt ? formatLongDate(item.preachedAt) : "—"}
        </span>
      ),
    },
    {
      header: "Média principal",
      cell: (item) => {
        const primary = item.medias?.find((m) => m.isPrimary);
        if (!primary) {
          return (
            <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-none border border-amber-200 w-fit">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Aucun média</span>
            </div>
          );
        }
        if (primary.role === "VIDEO") {
          return (
            <div className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200 w-fit">
              <Video className="w-3 h-3 shrink-0" />
              <span>Vidéo principale</span>
            </div>
          );
        }
        if (primary.role === "AUDIO") {
          return (
            <div className="flex items-center gap-1 text-[11px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-200 w-fit">
              <Mic className="w-3 h-3 shrink-0" />
              <span>Audio principal</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-none border border-amber-200 w-fit">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Miniature seule</span>
          </div>
        );
      },
    },
    {
      header: "Statut",
      cell: (item) => {
        const variant =
          item.status === "PUBLISHED"
            ? "success"
            : item.status === "ARCHIVED"
            ? "neutral"
            : "warning";
        const label =
          item.status === "PUBLISHED"
            ? "Publié"
            : item.status === "ARCHIVED"
            ? "Archivé"
            : "Brouillon";

        return (
          <Badge variant={variant} className="text-[10px]">
            {label}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.status === "PUBLISHED" && (
            <a
              href={`/publications/enseignements/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-ccjv-ink-muted hover:text-ccjv-green hover:bg-ccjv-surface transition-colors"
              title="Voir sur le site public"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Link
            href={`/admin/enseignements/${item.id}`}
            className="p-1.5 text-ccjv-ink-muted hover:text-ccjv-green hover:bg-ccjv-surface transition-colors"
            title="Modifier l'enseignement"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setItemToDelete(item)}
            className="p-1.5 text-ccjv-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Supprimer l'enseignement"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Enseignements"
        description="Gérez les prédications, sermons du culte, références bibliques et médias associés."
        actions={
          <Link href="/admin/enseignements/new">
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Nouvel enseignement</span>
            </Button>
          </Link>
        }
      />

      {/* Barre de filtres */}
      <div className="p-3 bg-white border border-ccjv-border flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ccjv-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par titre ou orateur..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-44 text-xs"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DRAFT">Brouillons</option>
            <option value="PUBLISHED">Publiés</option>
            <option value="ARCHIVED">Archivés</option>
          </Select>
        </div>
      </div>

      {/* Tableau des données */}
      <div className="bg-white border border-ccjv-border">
        <DataTable
          columns={columns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          error={error}
          emptyState={
            <div className="p-8 text-center text-xs text-ccjv-ink-secondary">
              {search || selectedStatus !== "ALL"
                ? "Aucun enseignement ne correspond à vos filtres."
                : "Aucun enseignement enregistré pour le moment."}
            </div>
          }
        />
        {totalPages > 1 && (
          <div className="p-3 border-t border-ccjv-border">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer l'enseignement ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${itemToDelete?.title}" ? Cette action retirera également les références bibliques et liaisons de médias associées.`}
        confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}
