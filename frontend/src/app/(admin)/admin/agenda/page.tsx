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
import { listAdminEvents, deleteAdminEvent } from "@/lib/api/endpoints";
import type { Event } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils";

export default function EventsListPage() {
  const toast = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre (sans barre de recherche)
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
      const res = await listAdminEvents({ page: 1, limit: 100 });
      setEvents(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les événements.";
      setError(msg);
      toast.error("Erreur lors de la récupération de l'agenda.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
      if (selectedStatus === "ALL") return true;
      if (selectedStatus === "PUBLISHED") return item.status === "PUBLISHED" || item.lifecycleStatus === "PUBLISHED";
      if (selectedStatus === "DRAFT") return item.status === "DRAFT" || item.lifecycleStatus === "DRAFT";
      if (selectedStatus === "CANCELLED") return item.status === "CANCELLED" || item.lifecycleStatus === "CANCELLED";
      return item.status === selectedStatus;
    });
  }, [events, selectedStatus]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Agenda & Événements"
        description="Gérez les cultes, réunions, séminaires et temps forts de la communauté."
        actions={
          <Button
            href="/admin/agenda/new"
            variant="primary"
            size="sm"
            className="font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nouvel événement
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
              { label: "Annulés", value: "CANCELLED" },
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Grille 2 × x des événements */}
      <AdminEntityGrid
        items={paginatedData}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Aucun événement trouvé"
        emptyDescription="Aucun événement ne correspond aux critères sélectionnés."
        emptyAction={
          <Button href="/admin/agenda/new" size="sm" variant="primary">
            <Plus className="h-4 w-4" />
            Ajouter un événement
          </Button>
        }
        renderItem={(item) => {
          const isCancelled = item.status === "CANCELLED" || item.lifecycleStatus === "CANCELLED";
          const isPublished = item.status === "PUBLISHED" || item.lifecycleStatus === "PUBLISHED";
          const resolvedImage = item.imageUrl || item.bannerImage || null;

          return (
            <AdminEntityCard
              id={item.id}
              title={item.title}
              detailHref={`/admin/agenda/${item.id}`}
              imageUrl={resolvedImage}
              subtitle={item.location ? `Lieu : ${item.location}` : undefined}
              description={item.excerpt || item.description}
              statusBadge={{
                label: isCancelled ? "Annulé" : isPublished ? "Publié" : "Brouillon",
                variant: isCancelled ? "error" : isPublished ? "success" : "neutral",
              }}
              dateLabel={
                item.eventDate
                  ? `Date : ${formatLongDate(item.eventDate)}${item.eventTime ? ` · ${item.eventTime}` : ""}`
                  : undefined
              }
              onDelete={() => setItemToDelete(item)}
              deleteTitle="Supprimer cet événement"
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

      {/* Confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer l'événement ?"
        message={`Êtes-vous certain de vouloir supprimer l'événement "${itemToDelete?.title}" ? Cette action est irréversible.`}
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
