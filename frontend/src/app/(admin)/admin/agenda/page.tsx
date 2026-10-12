"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Edit2, MapPin, Clock } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Pagination } from "@/components/admin/tables/Pagination";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/admin/forms/Input";
import { Select } from "@/components/admin/forms/Select";
import { listAdminEvents, deleteAdminEvent } from "@/lib/api/endpoints";
import type { Event } from "@/lib/api/types";
import { formatLongDate, formatTime } from "@/lib/utils";

export default function EventsListPage() {
  const toast = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Suppression
  const [itemToDelete, setItemToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listAdminEvents({ page, limit: 100 });
      setEvents(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les événements.";
      setError(msg);
      toast.error("Erreur lors de la récupération de l'agenda.");
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminEvent(itemToDelete.id);
      toast.success(`L'événement "${itemToDelete.title}" a été supprimé.`);
      setItemToDelete(null);
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };


  const filteredData = useMemo(() => {
    return events.filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.location?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [events, search, selectedStatus]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns: ColumnDef<Event>[] = [
    {
      header: "Événement & Lieu",
      cell: (item) => (
        <div className="space-y-0.5">
          <Link
            href={`/admin/agenda/${item.id}`}
            className="font-semibold text-ccjv-ink hover:text-ccjv-green transition-colors block text-xs"
          >
            {item.title}
          </Link>
          <div className="text-[11px] text-ccjv-ink-secondary flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            <span>{item.location || "Temple Principal CCJV"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Date & Horaire",
      cell: (item) => (
        <div className="text-xs text-ccjv-ink space-y-0.5">
          <div className="font-medium">{formatLongDate(item.eventDate)}</div>
          {item.eventTime && (
            <div className="text-[11px] text-ccjv-ink-secondary flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(item.eventTime)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Statut",
      cell: (item) => (
        <Badge
          variant={item.status === "UPCOMING" ? "success" : "neutral"}
          className="text-[10px]"
        >
          {item.status === "UPCOMING" ? "À venir" : "Archivé"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/agenda/${item.id}`}
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
        title="Agenda & Événements"
        description="Gérez les cultes, réunions de prière, conférences, séminaires et activités communautaires du CCJV."
        actions={
          <Button
            href="/admin/agenda/new"
            variant="primary"
            size="sm"
            className="font-semibold"
          >
            <Plus className="h-4 w-4" />
            Programmer un événement
          </Button>
        }
      />

      {/* Barre de recherche */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder="Rechercher par titre, lieu ou description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-ccjv-ink-secondary pointer-events-none" />
        </div>

        <Select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44"
          options={[
            { label: "Tous les statuts", value: "ALL" },
            { label: "À venir", value: "UPCOMING" },
            { label: "Archivés / Passés", value: "ARCHIVED" },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
      />

      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer l'événement ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'événement "${itemToDelete?.title}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}
