"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Plus, User, Pencil, Trash2, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DepartmentNavTabs } from "@/components/admin/departments/DepartmentNavTabs";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { AdminMediaPickerModal } from "@/components/admin/media/AdminMediaPickerModal";
import {
  getLeaders,
  createLeader,
  updateLeader,
  deleteLeader,
  getDepartments,
  getCommunityFaces,
  type Leader,
  type Department,
  type CommunityFace,
  type AdminMediaItem,
} from "@/lib/api";

export default function LeadersAdminPage() {
  const toast = useToast();

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [communityFaces, setCommunityFaces] = useState<CommunityFace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal d'ajout / modification de leader
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [position, setPosition] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoMediaId, setPhotoMediaId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Modal de suppression
  const [leaderToDelete, setLeaderToDelete] = useState<Leader | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ldrs, depts, faces] = await Promise.all([
        getLeaders({ limit: 100 }),
        getDepartments(),
        getCommunityFaces(),
      ]);
      setLeaders(ldrs || []);
      setDepartments(depts || []);
      setCommunityFaces(faces || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de charger le référentiel des leaders.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Carte de correspondance departmentId -> Nom du département
  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const openCreateModal = () => {
    setEditingLeader(null);
    setName("");
    setRole("Responsable");
    setDepartmentId("");
    setPosition(leaders.length);
    setPhotoUrl(null);
    setPhotoMediaId(null);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (leader: Leader) => {
    setEditingLeader(leader);
    setName(leader.name);
    setRole(leader.role);
    setDepartmentId(leader.departmentId || "");
    setPosition(leader.position ?? 0);
    setPhotoUrl(leader.photoUrl || leader.photo || null);
    setPhotoMediaId(leader.photoMediaId || null);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleMediaSelect = (item: AdminMediaItem) => {
    setPhotoMediaId(item.id);
    setPhotoUrl(item.url);
    setIsMediaPickerOpen(false);
  };

  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Le nom complet est obligatoire.";
    if (!role.trim()) errs.role = "Le rôle ou ministère est obligatoire.";

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      if (editingLeader) {
        await updateLeader(editingLeader.id, {
          name: name.trim(),
          role: role.trim(),
          departmentId: departmentId || null,
          photoMediaId: photoMediaId || null,
          position,
        });
        toast.success(`Le leader « ${name.trim()} » a été mis à jour avec succès.`);
      } else {
        await createLeader({
          name: name.trim(),
          role: role.trim(),
          departmentId: departmentId || null,
          photoMediaId: photoMediaId || null,
          position,
        });
        toast.success(`Le leader « ${name.trim()} » a été créé avec succès.`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!leaderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLeader(leaderToDelete.id);
      toast.success(`Le leader « ${leaderToDelete.name} » a été supprimé.`);
      setLeaderToDelete(null);
      fetchData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du leader.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Analyse des dépendances avant suppression
  const getDeletionWarnings = (leader: Leader) => {
    const warnings: string[] = [];

    // Dépendance 1 : Responsable de département actif
    const assignedDept = departments.find(
      (d) =>
        d.id === leader.departmentId ||
        d.responsibleName?.toLowerCase().trim() === leader.name.toLowerCase().trim(),
    );
    if (assignedDept) {
      warnings.push(
        `Ce leader est associé comme responsable du département « ${assignedDept.name} ».`,
      );
    }

    // Dépendance 2 : Visages de la communauté
    const isInFaces = communityFaces.some(
      (f) =>
        f.name.toLowerCase().trim() === leader.name.toLowerCase().trim() ||
        (leader.photoUrl && f.photo === leader.photoUrl),
    );
    if (isInFaces) {
      warnings.push(
        `Ce leader figure parmi « Les visages de notre communauté » sur la page d'accueil. Actuellement, ${communityFaces.length} visage(s) sont configurés (le seuil minimum est de 3).`,
      );
    }

    return warnings;
  };

  const columns: ColumnDef<Leader>[] = [
    {
      header: "Portrait",
      align: "center",
      className: "w-16",
      cell: (item) => {
        const photo = item.photoUrl || item.photo;
        return (
          <div className="relative w-10 h-10 mx-auto bg-ccjv-offwhite border border-ccjv-line flex items-center justify-center overflow-hidden">
            {photo ? (
              <Image
                src={photo}
                alt={item.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <User className="h-5 w-5 text-ccjv-ink-secondary/50" />
            )}
          </div>
        );
      },
    },
    {
      header: "Nom complet",
      accessorKey: "name",
      className: "font-semibold text-ccjv-ink",
      cell: (item) => (
        <div>
          <span className="font-bold text-sm text-ccjv-ink">{item.name}</span>
        </div>
      ),
    },
    {
      header: "Rôle / Ministère",
      accessorKey: "role",
      cell: (item) => (
        <span className="text-xs text-ccjv-ink-secondary">{item.role}</span>
      ),
    },
    {
      header: "Département rattaché",
      cell: (item) => {
        if (!item.departmentId) {
          return (
            <Badge variant="outline" className="text-[10px]">
              Non rattaché
            </Badge>
          );
        }
        const deptName = departmentMap.get(item.departmentId);
        return deptName ? (
          <Badge variant="neutral" className="text-[11px] font-medium">
            {deptName}
          </Badge>
        ) : (
          <span className="text-xs text-ccjv-ink-secondary">Inconnu</span>
        );
      },
    },
    {
      header: "Position",
      accessorKey: "position",
      align: "center",
      className: "w-20 text-xs font-mono text-ccjv-ink-secondary",
    },
    {
      header: "Actions",
      align: "right",
      className: "w-28",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="p-1.5 text-ccjv-ink-secondary hover:text-ccjv-green hover:bg-ccjv-offwhite transition-colors"
            title="Modifier le leader"
            aria-label={`Modifier ${item.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setLeaderToDelete(item)}
            className="p-1.5 text-ccjv-ink-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Supprimer le leader"
            aria-label={`Supprimer ${item.name}`}
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
        title="Leaders & Responsables"
        description="Référentiel centralisé des serviteurs, pasteurs et responsables de départements."
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              title="Actualiser la liste"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="font-semibold"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau leader
            </Button>
          </div>
        }
      />

      <DepartmentNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Tableau des leaders */}
      <DataTable
        columns={columns}
        data={leaders}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyState={
          <div className="p-8 text-center space-y-3">
            <User className="h-10 w-10 text-ccjv-ink-secondary/40 mx-auto" />
            <p className="text-sm font-semibold text-ccjv-ink">
              Aucun leader dans le référentiel pour le moment.
            </p>
            <p className="text-xs text-ccjv-ink-secondary">
              Créez les fiches des responsables pour pouvoir les assigner aux départements et aux visages de la communauté.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Créer un premier leader
            </Button>
          </div>
        }
      />

      {/* Modal Ajout / Modification */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-ccjv-line w-full max-w-lg p-6 space-y-5 rounded-none shadow-xl">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
              <h2 className="text-base font-serif font-bold text-ccjv-ink">
                {editingLeader ? `Modifier : ${editingLeader.name}` : "Nouveau Leader"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-ccjv-ink-secondary hover:text-ccjv-ink p-1"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeader} className="space-y-4">
              <FormField
                label="Nom complet"
                required
                error={formErrors.name}
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Frère Jacques Kalala"
                />
              </FormField>

              <FormField
                label="Rôle ou Ministère"
                required
                error={formErrors.role}
              >
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex. Responsable de la Louange, Ancien..."
                />
              </FormField>

              <FormField
                label="Département rattaché (facultatif)"
                hint="Associez ce leader à un pôle de service pour synchroniser son affichage."
              >
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-white border border-ccjv-line px-3 py-2 text-xs font-sans text-ccjv-ink focus:outline-2 focus:outline-ccjv-green rounded-none"
                >
                  <option value="">-- Aucun département rattaché --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Ordre d'affichage (position)"
                hint="Valeur numérique (0 = premier)."
              >
                <Input
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(parseInt(e.target.value, 10) || 0)}
                  min={0}
                />
              </FormField>

              {/* Photo officielle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ccjv-ink">
                  Photo officielle
                </label>
                <div className="flex items-center gap-4 border border-ccjv-line p-3 bg-ccjv-offwhite">
                  <div className="relative w-16 h-16 shrink-0 bg-white border border-ccjv-line flex items-center justify-center overflow-hidden">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt="Aperçu photo"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <User className="h-8 w-8 text-ccjv-ink-secondary/40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="text-xs"
                      >
                        {photoUrl ? "Changer la photo" : "Choisir une photo"}
                      </Button>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(null);
                            setPhotoMediaId(null);
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-ccjv-ink-secondary">
                      Format portrait recommandé pour les sections du site.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ccjv-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  className="font-semibold"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer le leader"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <AdminMediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          accept={["image"]}
          title="Sélectionner la photo officielle du leader"
        />
      )}

      {/* Modal Confirmation Suppression avec vérification des dépendances */}
      {leaderToDelete && (
        <ConfirmModal
          isOpen={!!leaderToDelete}
          onClose={() => setLeaderToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title={`Supprimer le leader « ${leaderToDelete.name} » ?`}
          message={[
            "Êtes-vous sûr de vouloir supprimer définitivement ce leader du référentiel ? Cette action est irréversible.",
            ...getDeletionWarnings(leaderToDelete),
          ].join("\n\n")}
          confirmLabel={isDeleting ? "Suppression..." : "Confirmer la suppression"}
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
