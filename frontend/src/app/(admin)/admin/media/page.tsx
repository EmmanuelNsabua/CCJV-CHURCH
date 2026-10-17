"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Trash2,
  Check,
  ExternalLink,
} from "lucide-react";
import { listAdminMedia, uploadAdminMedia, deleteAdminMedia } from "@/lib/api/endpoints";
import type { AdminMediaItem } from "@/lib/api/types";
import { Select } from "@/components/admin/forms/Select";

export default function MediaLibraryPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mediaList, setMediaList] = useState<AdminMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<AdminMediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listAdminMedia({ limit: 100 });
      setMediaList(res.data || []);
    } catch (err: unknown) {
      console.warn("[media] Erreur chargement médias :", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "pages");
    formData.append("alt", file.name);

    setIsUploading(true);
    try {
      const uploaded = await uploadAdminMedia(formData);
      toast.success(`Fichier "${uploaded.filename || file.name}" téléversé avec succès.`);
      fetchMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du téléversement du fichier.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info("Lien copié dans le presse-papier.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminMedia(itemToDelete.id);
      toast.success("Média supprimé.");
      setItemToDelete(null);
      fetchMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    if (selectedMediaType === "ALL") return true;
    if (selectedMediaType === "IMAGE") {
      return (
        m.mimeType?.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(m.filename || m.url || "")
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Médiathèque CCJV"
        description="Téléversez et gérez les photos, bannières, portraits pastoraux et documents de l'église."
        actions={
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isUploading}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Téléverser un fichier
            </Button>
          </div>
        }
      />

      {/* Barre de filtre (sans barre de recherche) 
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value)}
            options={[
              { label: "Tous les types de fichiers", value: "ALL" },
              { label: "Images uniquement (JPEG, PNG, WebP...)", value: "IMAGE" },
            ]}
          />
        </div>
        <div className="text-xs text-ccjv-ink-secondary">
          {filteredMedia.length} fichier{filteredMedia.length > 1 ? "s" : ""}
        </div>
      </div>*/}

      {/* Grille des médias */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-ccjv-line/40 animate-pulse" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-12 bg-white border border-ccjv-line text-center space-y-3">
          <ImageIcon className="h-8 w-8 text-ccjv-line mx-auto" />
          <p className="text-xs text-ccjv-ink-secondary">
            Aucun fichier trouvé dans la médiathèque.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Téléverser votre premier média
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group bg-white border border-ccjv-line rounded-none overflow-hidden flex flex-col justify-between hover:border-ccjv-green transition-all"
            >
              {/* Image thumbnail / preview */}
              <div className="aspect-video bg-[#fafaf7] relative overflow-hidden flex items-center justify-center border-b border-ccjv-line">
                {item.mimeType?.startsWith("image/") || item.url?.match(/\.(jpeg|jpg|png|webp|gif)/i) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.filename || "Média CCJV"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-ccjv-ink-secondary">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[10px] uppercase font-mono">
                      {item.mimeType?.split("/")[1] || "DOC"}
                    </span>
                  </div>
                )}
              </div>

              {/* Détails et actions */}
              <div className="p-2.5 space-y-2">
                <p className="text-[11px] font-semibold text-ccjv-ink truncate" title={item.filename || item.url}>
                  {item.filename || "Fichier CCJV"}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-ccjv-line/60">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="text-[10px] text-ccjv-ink-secondary hover:text-ccjv-green flex items-center gap-1 p-1 transition-colors"
                    title="Copier le lien"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3 w-3 text-ccjv-green" />
                        <span className="text-ccjv-green font-medium">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copier URL</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-ccjv-ink-secondary hover:text-ccjv-ink transition-colors"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1 text-ccjv-ink-secondary hover:text-[#b91c1c] transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation suppression */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Supprimer le fichier ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${itemToDelete?.filename || "ce fichier"}" ?`}
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
