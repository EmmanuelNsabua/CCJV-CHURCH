"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Archive, Layers } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { AdminEntityGrid, AdminEntityCard } from "@/components/admin/cards";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getDepartments,
  deleteDepartment,
  getDepartmentArchives,
  type DepartmentArchive,
} from "@/lib/api";
import type { Department } from "@/types";
import { formatLongDate } from "@/lib/utils";

export default function DepartmentsListPage() {
  const toast = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [archives, setArchives] = useState<DepartmentArchive[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVES">("ACTIVE");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suppression / Archivage
  const [deptToArchive, setDeptToArchive] = useState<Department | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de charger les départements.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchArchives = useCallback(async () => {
    try {
      const data = await getDepartmentArchives();
      setArchives(data || []);
    } catch (err: unknown) {
      console.warn("Impossible de charger les archives :", err);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchArchives();
  }, [fetchDepartments, fetchArchives]);

  const handleArchiveConfirm = async () => {
    if (!deptToArchive) return;
    setIsArchiving(true);
    try {
      await deleteDepartment(
        deptToArchive.id,
        archiveReason.trim() || "Archivage administratif depuis le back-office",
      );
      toast.success(
        `Le département « ${deptToArchive.name} » a été archivé et retiré avec succès. Un snapshot complet a été conservé.`,
      );
      setDeptToArchive(null);
      setArchiveReason("");
      fetchDepartments();
      fetchArchives();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'archivage du département.";
      toast.error(msg);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Départements & Ministères"
        description="Gestion des pôles de service du Centre Chrétien Jésus ma Vie : vision, histoire, activités et galeries."
        actions={
          <div className="flex items-center gap-3">
            <Button
              href="/admin/departments/new"
              variant="primary"
              size="sm"
              className="font-semibold"
            >
              <Plus className="h-4 w-4" />
              Nouveau département
            </Button>
          </div>
        }
      />

      {/* Onglets Actifs / Archives */}
      <div className="border-b border-ccjv-line flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("ACTIVE")}
            className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === "ACTIVE"
                ? "border-ccjv-green text-ccjv-green"
                : "border-transparent text-ccjv-ink-secondary hover:text-ccjv-ink"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Départements actifs ({departments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ARCHIVES")}
            className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === "ARCHIVES"
                ? "border-ccjv-green text-ccjv-green"
                : "border-transparent text-ccjv-ink-secondary hover:text-ccjv-ink"
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Archives conservées ({archives.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Vue 1 : Départements actifs (Grille 2 × x) */}
      {activeTab === "ACTIVE" && (
        <AdminEntityGrid
          items={departments}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="Aucun département actif"
          emptyDescription="Ajoutez un pôle de service pour commencer à présenter les ministères de l'église."
          emptyAction={
            <Button href="/admin/departments/new" size="sm" variant="primary">
              <Plus className="h-4 w-4" />
              Créer un département
            </Button>
          }
          renderItem={(item) => (
            <AdminEntityCard
              id={item.id}
              title={item.name}
              detailHref={`/admin/departments/${item.id}`}
              imageUrl={item.bannerImage || null}
              subtitle={
                item.responsibleName
                  ? `Responsable : ${item.responsibleName}`
                  : "Coordination collective"
              }
              description={item.tagline || item.description}
              statusBadge={{
                label: "Actif",
                variant: "success",
              }}
              onDelete={() => setDeptToArchive(item)}
              deleteTitle="Archiver et supprimer ce département"
              deleteAriaLabel={`Archiver et supprimer ${item.name}`}
              viewLabel="Modifier"
            />
          )}
        />
      )}

      {/* Vue 2 : Départements archivés (Snapshots JSON sécurisés) */}
      {activeTab === "ARCHIVES" && (
        <div className="space-y-4">
          <div className="p-4 bg-ccjv-offwhite border border-ccjv-line text-xs text-ccjv-ink-secondary">
            Les départements archivés font l&apos;objet d&apos;un snapshot JSON complet de leurs données et relations au moment du retrait. Les fichiers et photographies du bucket restent conservés.
          </div>

          {archives.length === 0 ? (
            <div className="p-12 text-center bg-white border border-ccjv-line">
              <Archive className="h-8 w-8 mx-auto text-ccjv-ink-secondary mb-2 opacity-50" />
              <p className="text-xs text-ccjv-ink font-semibold">Aucune archive</p>
              <p className="text-[11px] text-ccjv-ink-secondary mt-1">
                Aucun département n&apos;a été archivé pour l&apos;instant.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ccjv-line border border-ccjv-line bg-white">
              {archives.map((arch) => (
                <div key={arch.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ccjv-ink">{arch.name}</span>
                      <Badge variant="neutral" className="text-[10px]">Archivé</Badge>
                    </div>
                    <p className="text-xs text-ccjv-ink-secondary font-mono">
                      Slug original : {arch.slug}
                    </p>
                    {arch.reason && (
                      <p className="text-xs text-ccjv-ink italic">
                        Motif : « {arch.reason} »
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-ccjv-ink-secondary text-right shrink-0">
                    <p>Archivé le : {formatLongDate(arch.archivedAt.slice(0, 10))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modale de confirmation d'archivage préalable */}
      <ConfirmModal
        isOpen={Boolean(deptToArchive)}
        onClose={() => {
          setDeptToArchive(null);
          setArchiveReason("");
        }}
        onConfirm={handleArchiveConfirm}
        title="Archivage préalable & Suppression"
        message={`Êtes-vous certain de vouloir retirer le département « ${deptToArchive?.name} » ? Cette action est sécurisée : l'ensemble des données (activités, configuration, coordination) sera archivé sous forme de snapshot JSON complet dans la table department_archives, et tous les fichiers médias stockés dans le bucket resteront intacts.`}
        confirmLabel="Archiver et supprimer"
        isLoading={isArchiving}
        variant="danger"
      />
    </div>
  );
}
