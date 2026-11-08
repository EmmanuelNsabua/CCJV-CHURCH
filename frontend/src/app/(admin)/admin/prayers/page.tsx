"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/admin/forms/Select";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Eye, CheckCircle2, Clock, ShieldAlert, Trash2, HeartHandshake, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getAdminPrayerRequests,
  markPrayerRequestPrayed,
  deletePrayerRequest,
  type PrayerRequestRecord,
} from "@/lib/api";
import { formatLongDate } from "@/lib/utils";

export default function AdminPrayersPage() {
  const { role } = useAuth();
  const toast = useToast();

  const [prayers, setPrayers] = useState<PrayerRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre statut
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal de consultation détaillée
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerRequestRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal de confirmation de suppression
  const [itemToDelete, setItemToDelete] = useState<PrayerRequestRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminPrayerRequests({ limit: 100 });
      setPrayers(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des intentions.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const handleMarkPrayed = async (prayer: PrayerRequestRecord) => {
    setIsUpdatingStatus(true);
    try {
      await markPrayerRequestPrayed(prayer.id);
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === prayer.id ? { ...p, status: "PRAYED", handledAt: new Date().toISOString() } : p,
        ),
      );
      if (selectedPrayer && selectedPrayer.id === prayer.id) {
        setSelectedPrayer((prev) =>
          prev ? { ...prev, status: "PRAYED", handledAt: new Date().toISOString() } : null,
        );
      }
      toast.success("L'intention a été marquée comme portée en prière.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour.";
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deletePrayerRequest(itemToDelete.id);
      setPrayers((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      if (selectedPrayer?.id === itemToDelete.id) {
        setSelectedPrayer(null);
      }
      toast.success("L'intention de prière a été supprimée.");
      setItemToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPrayers = useMemo(() => {
    if (statusFilter === "NEW") {
      return prayers.filter((p) => p.status === "NEW");
    }
    if (statusFilter === "PRAYED") {
      return prayers.filter((p) => p.status === "PRAYED");
    }
    return prayers;
  }, [prayers, statusFilter]);

  const columns: ColumnDef<PrayerRequestRecord>[] = [
    {
      header: "Demandeur",
      cell: (item) => (
        <div className="font-sans">
          <p className="font-semibold text-ccjv-ink text-sm">
            {item.requesterName || "Intention anonyme"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-ccjv-ink-secondary">
              {formatLongDate(item.createdAt.slice(0, 10))}
            </span>
            {item.confidentiality === "private" ? (
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 text-amber-800 bg-amber-50">
                Confidentielle
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                Communauté
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Sujet / Requête",
      cell: (item) => (
        <p className="text-xs text-ccjv-ink line-clamp-2 max-w-md leading-relaxed">
          {item.requestText}
        </p>
      ),
    },
    {
      header: "Statut",
      cell: (item) => {
        if (item.status === "PRAYED") {
          return (
            <Badge variant="success" className="text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Portée en prière
            </Badge>
          );
        }
        return (
          <Badge variant="warning" className="text-[10px]">
            <Clock className="h-3 w-3 mr-1" /> En attente
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedPrayer(item)}
            title="Lire l'intention complète"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Consulter
          </Button>
          {item.status === "NEW" && (
            <Button
              variant="primary"
              size="sm"
              className="h-7 text-xs bg-ccjv-green hover:bg-[#166534]"
              onClick={() => handleMarkPrayed(item)}
              title="Marquer comme portée en prière"
            >
              <HeartHandshake className="h-3.5 w-3.5 mr-1" /> Prier
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
            onClick={() => setItemToDelete(item)}
            title="Supprimer la requête"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Intentions de Prières"
        description="Gestion pastorale des requêtes d'intercession déposées par la communauté."
      />

      {role === "SUPER_ADMIN" && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 rounded-none">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
          <p>
            <strong>Note de souveraineté pastorale :</strong> Conformément aux spécifications cryptographiques (docs/030 &amp; Lot 8),
            la consultation spirituelle détaillée des intentions de prière est réservée aux comptes pastoraux (ADMIN).
          </p>
        </div>
      )}

      {/* Barre de filtrage */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-center justify-between gap-4">
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "Toutes les intentions", value: "ALL" },
              { label: "En attente d'intercession", value: "NEW" },
              { label: "Portées en prière", value: "PRAYED" },
            ]}
          />
        </div>
        <p className="text-xs text-ccjv-ink-secondary">
          {filteredPrayers.length} intention{filteredPrayers.length > 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs">
          {error}
        </div>
      )}

      <div className="bg-white border border-ccjv-line p-4 sm:p-6 rounded-none">
        <DataTable
          columns={columns}
          data={filteredPrayers}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyState={
            <div className="p-8 text-center text-xs text-ccjv-ink-secondary">
              Aucune intention de prière trouvée.
            </div>
          }
        />
      </div>

      {/* Modal de lecture complète de la prière */}
      {selectedPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-ccjv-line w-full max-w-xl rounded-none shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-ccjv-line flex items-center justify-between bg-ccjv-sand/20">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-ccjv-green" />
                <h3 className="font-serif font-bold text-lg text-ccjv-ink">
                  Intention de Prière
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrayer(null)}
                className="p-1 text-ccjv-ink-secondary hover:text-ccjv-ink"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-ccjv-line/60">
                <div>
                  <p className="text-xs text-ccjv-ink-secondary">Demandeur</p>
                  <p className="font-semibold text-ccjv-ink text-sm">
                    {selectedPrayer.requesterName || "Intention anonyme"}
                  </p>
                  {selectedPrayer.requesterContact && (
                    <p className="text-xs text-ccjv-green font-mono mt-0.5">
                      {selectedPrayer.requesterContact}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-ccjv-ink-secondary">Date de dépôt</p>
                  <p className="text-xs font-medium text-ccjv-ink">
                    {formatLongDate(selectedPrayer.createdAt.slice(0, 10))}
                  </p>
                  <div className="mt-1">
                    {selectedPrayer.status === "PRAYED" ? (
                      <Badge variant="success" className="text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Portée en prière
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1" /> En attente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ccjv-ink-secondary mb-2">
                  Requête d&apos;intercession
                </p>
                <div className="p-4 bg-[#fafaf7] border border-ccjv-line text-sm text-ccjv-ink leading-relaxed whitespace-pre-wrap font-serif">
                  « {selectedPrayer.requestText} »
                </div>
              </div>

              {selectedPrayer.handledAt && (
                <p className="text-xs text-ccjv-green italic">
                  Prise en charge et portée en prière le {formatLongDate(selectedPrayer.handledAt.slice(0, 10))}.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-ccjv-line bg-gray-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPrayer(null)}
              >
                Fermer
              </Button>
              <div className="flex items-center gap-2">
                {selectedPrayer.status === "NEW" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isUpdatingStatus}
                    onClick={() => handleMarkPrayed(selectedPrayer)}
                    className="bg-ccjv-green hover:bg-[#166534]"
                  >
                    <HeartHandshake className="h-4 w-4 mr-1.5" />
                    Marquer comme portée en prière
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer la demande de prière"
        message="Êtes-vous sûr de vouloir supprimer définitivement cette intention de prière ?"
        confirmLabel="Supprimer"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
