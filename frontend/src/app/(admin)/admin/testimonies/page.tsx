"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Check,
  X,
  Archive,
  Star,
  Pencil,
  Trash2,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { FormField } from "@/components/admin/forms/FormField";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Input } from "@/components/admin/forms/Input";
import {
  getAdminTestimonies,
  updateTestimonyStatus,
  setTestimonyFeatured,
  updateTestimony,
  deleteTestimony,
  type AdminTestimony,
  type TestimonyStatus,
} from "@/lib/api";
import { formatLongDate } from "@/lib/utils";

type TabStatus = "ALL" | TestimonyStatus;

export default function AdminTestimoniesPage() {
  const toast = useToast();

  const [testimonies, setTestimonies] = useState<AdminTestimony[]>([]);
  const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modale d'édition / correction éditoriale
  const [editingItem, setEditingItem] = useState<AdminTestimony | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modale de confirmation de suppression
  const [itemToDelete, setItemToDelete] = useState<AdminTestimony | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // État de chargement par action ponctuelle
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchTestimonies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminTestimonies({
        page: 1,
        limit: 100,
        status: activeTab === "ALL" ? undefined : activeTab,
      });
      setTestimonies(res.data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de charger les témoignages.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchTestimonies();
  }, [fetchTestimonies]);

  // Statut update
  const handleStatusChange = async (
    id: string,
    newStatus: TestimonyStatus,
    notes?: string,
  ) => {
    setActionLoadingId(id);
    try {
      await updateTestimonyStatus(id, newStatus, notes);
      toast.success(
        newStatus === "PUBLISHED"
          ? "Témoignage validé et publié sur le site public."
          : newStatus === "REJECTED"
            ? "Témoignage rejeté."
            : newStatus === "ARCHIVED"
              ? "Témoignage archivé."
              : "Témoignage replacé en attente.",
      );
      fetchTestimonies();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du statut.";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Hero selection
  const handleToggleHero = async (item: AdminTestimony) => {
    setActionLoadingId(item.id);
    try {
      await setTestimonyFeatured(item.id, !item.isFeatured);
      toast.success(
        !item.isFeatured
          ? "Témoignage sélectionné pour la section Hero d'accueil."
          : "Témoignage retiré de la section Hero.",
      );
      fetchTestimonies();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de la sélection Hero.";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open edit modal
  const openEditModal = (item: AdminTestimony) => {
    setEditingItem(item);
    setEditContent(item.content || item.quote || "");
    setEditAuthorName(item.authorName || item.name || "");
    setEditAdminNotes(item.adminNotes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      await updateTestimony(editingItem.id, {
        content: editContent.trim(),
        authorName: editingItem.isAnonymous ? null : editAuthorName.trim() || null,
        adminNotes: editAdminNotes.trim() || null,
      });
      toast.success("Témoignage corrigé et mis à jour avec succès.");
      setEditingItem(null);
      fetchTestimonies();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du témoignage.";
      toast.error(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Supprimer définitivement
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTestimony(itemToDelete.id);
      toast.success("Témoignage définitivement supprimé.");
      setItemToDelete(null);
      fetchTestimonies();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du témoignage.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Badges de statut selon le Design System
  const renderStatusBadge = (status: TestimonyStatus) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge variant="success" className="text-[10px]">
            <Check className="h-3 w-3 mr-1" /> Publié
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning" className="text-[10px]">
            <Clock className="h-3 w-3 mr-1" /> En attente
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="error" className="text-[10px]">
            <X className="h-3 w-3 mr-1" /> Rejeté
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge variant="neutral" className="text-[10px]">
            <Archive className="h-3 w-3 mr-1" /> Archivé
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Modération des Témoignages"
        description="Boîte de réception, révision éditoriale et sélection Hero des récits d'édification soumis par les fidèles."
      />

      {/* Onglets de filtrage par statut */}
      <div className="border-b border-ccjv-line flex flex-wrap items-center gap-6">
        {[
          { key: "ALL", label: "Tous" },
          { key: "PENDING", label: "En attente" },
          { key: "PUBLISHED", label: "Publiés" },
          { key: "REJECTED", label: "Rejetés" },
          { key: "ARCHIVED", label: "Archivés" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TabStatus)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-ccjv-green text-ccjv-green"
                : "border-transparent text-ccjv-ink-secondary hover:text-ccjv-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Liste des témoignages */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-ccjv-line">
          <p className="text-xs text-ccjv-ink-secondary">Chargement des témoignages...</p>
        </div>
      ) : testimonies.length === 0 ? (
        <div className="p-12 text-center bg-white border border-ccjv-line">
          <MessageSquare className="h-8 w-8 mx-auto text-ccjv-ink-secondary mb-2 opacity-40" />
          <p className="text-sm font-semibold text-ccjv-ink">Aucun témoignage trouvé</p>
          <p className="text-xs text-ccjv-ink-secondary mt-1">
            Aucun témoignage ne correspond à ce filtre pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonies.map((item) => {
            const isActionLoading = actionLoadingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white border border-ccjv-line p-5 rounded-none transition-all ${
                  item.isFeatured ? "ring-1 ring-amber-400 bg-amber-50/20" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Corps du témoignage */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(item.status)}

                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          Hero d&apos;accueil
                        </span>
                      )}

                      {item.isAnonymous ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5">
                          <ShieldCheck className="h-3 w-3 text-slate-500" />
                          Anonyme garanti
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ccjv-ink">
                          <User className="h-3.5 w-3.5 text-ccjv-ink-secondary" />
                          {item.authorName || item.name || "Fidèle de l'assemblée"}
                        </span>
                      )}

                      <span className="text-[11px] text-ccjv-ink-secondary">
                        · Soumis le {formatLongDate(item.createdAt.slice(0, 10))}
                      </span>
                    </div>

                    <p className="text-sm text-ccjv-ink leading-relaxed whitespace-pre-wrap font-serif italic bg-ccjv-offwhite p-4 border-l-2 border-ccjv-green">
                      « {item.content || item.quote} »
                    </p>

                    {item.adminNotes && (
                      <div className="text-xs bg-amber-50 border border-amber-200 p-2.5 text-amber-900">
                        <span className="font-semibold">Note interne :</span> {item.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions de modération */}
                  <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                    {/* Bouton Hero */}
                    <button
                      type="button"
                      onClick={() => handleToggleHero(item)}
                      disabled={isActionLoading}
                      title={
                        item.isFeatured
                          ? "Retirer de la section Hero"
                          : "Mettre en avant sur la section Hero"
                      }
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border transition-colors ${
                        item.isFeatured
                          ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                          : "bg-white border-ccjv-line text-ccjv-ink-secondary hover:text-amber-600 hover:border-amber-400"
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.isFeatured
                            ? "fill-amber-500 text-amber-500"
                            : "text-ccjv-ink-secondary"
                        }`}
                      />
                      <span>{item.isFeatured ? "En vedette (Hero)" : "Mettre en Hero"}</span>
                    </button>

                    {/* Actions de statut */}
                    <div className="flex items-center gap-1">
                      {item.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, "PUBLISHED")}
                          disabled={isActionLoading}
                          title="Valider et publier"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-ccjv-green text-white hover:bg-ccjv-green/90 transition-colors font-semibold"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Publier</span>
                        </button>
                      )}

                      {item.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, "REJECTED")}
                          disabled={isActionLoading}
                          title="Rejeter ce témoignage"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Rejeter</span>
                        </button>
                      )}

                      {item.status !== "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, "PENDING")}
                          disabled={isActionLoading}
                          title="Replacer en attente"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1.5 border border-ccjv-line text-ccjv-ink-secondary hover:bg-ccjv-offwhite transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>En attente</span>
                        </button>
                      )}

                      {item.status !== "ARCHIVED" ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, "ARCHIVED")}
                          disabled={isActionLoading}
                          title="Archiver ce témoignage"
                          className="p-1.5 border border-ccjv-line text-ccjv-ink-secondary hover:bg-ccjv-offwhite transition-colors"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, "PENDING")}
                          disabled={isActionLoading}
                          title="Désarchiver"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1.5 border border-ccjv-line text-ccjv-ink-secondary hover:bg-ccjv-offwhite transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Désarchiver</span>
                        </button>
                      )}

                      {/* Éditer / Corriger */}
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        disabled={isActionLoading}
                        title="Corriger le texte ou ajouter une note"
                        className="p-1.5 border border-ccjv-line text-ccjv-ink-secondary hover:text-ccjv-ink hover:bg-ccjv-offwhite transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Supprimer définitivement */}
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        disabled={isActionLoading}
                        title="Supprimer définitivement"
                        className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de correction éditoriale */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white border border-ccjv-line max-w-xl w-full p-6 space-y-5 rounded-none shadow-xl">
            <h3 className="text-base font-bold font-serif text-ccjv-ink">
              Correction éditoriale du témoignage
            </h3>

            {!editingItem.isAnonymous && (
              <FormField label="Nom ou signature du témoin">
                <Input
                  value={editAuthorName}
                  onChange={(e) => setEditAuthorName(e.target.value)}
                  placeholder="Nom du témoin"
                />
              </FormField>
            )}

            <FormField
              label="Contenu du récit (correction orthographique & typographique)"
              required
            >
              <Textarea
                rows={6}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Récit du témoignage..."
              />
            </FormField>

            <FormField
              label="Note interne d'administration (facultative)"
              hint="Visible uniquement par les modérateurs du back-office."
            >
              <Input
                value={editAdminNotes}
                onChange={(e) => setEditAdminNotes(e.target.value)}
                placeholder="Ex. Témoignage vérifié lors du culte de dimanche."
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-ccjv-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                disabled={isSavingEdit}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editContent.trim()}
              >
                {isSavingEdit ? "Enregistrement..." : "Enregistrer les corrections"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer définitivement le témoignage"
        message="Êtes-vous certain de vouloir supprimer définitivement ce témoignage de la base de données ? Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
