"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Mic,
  Copy,
  Trash2,
  Check,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { listAdminMedia, uploadAdminMedia, deleteAdminMedia } from "@/lib/api/endpoints";
import type { AdminMediaItem } from "@/lib/api/types";
import { mediaKindOf, type MediaKind } from "@/lib/media-kind";

type MediaFilterKind = "ALL" | Exclude<MediaKind, "document">;

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 Ko";
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function MediaLibraryPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mediaList, setMediaList] = useState<AdminMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<MediaFilterKind>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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

  // Exclusion stricte des documents et ressources PDF (réservés à l'espace Ressources)
  const allMediaItems = useMemo(() => {
    return mediaList.filter((m) => {
      const kind = mediaKindOf(m.mimeType, m.filename || m.url);
      if (kind === "document") return false;
      const lower = (m.filename || m.url || "").toLowerCase();
      if (lower.endsWith(".pdf") || m.mimeType?.includes("pdf")) return false;
      return true;
    });
  }, [mediaList]);

  // Statistiques de comptage par catégorie
  const counts = useMemo(() => {
    let images = 0;
    let videos = 0;
    let audios = 0;
    for (const m of allMediaItems) {
      const kind = mediaKindOf(m.mimeType, m.filename || m.url);
      if (kind === "image") images++;
      else if (kind === "video") videos++;
      else if (kind === "audio") audios++;
    }
    return {
      ALL: allMediaItems.length,
      image: images,
      video: videos,
      audio: audios,
    };
  }, [allMediaItems]);

  // Filtrage combiné : onglet + recherche textuelle
  const filteredMedia = useMemo(() => {
    return allMediaItems.filter((m) => {
      const kind = mediaKindOf(m.mimeType, m.filename || m.url);
      if (activeFilter !== "ALL" && kind !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = (m.filename || "").toLowerCase().includes(query);
        const matchesUrl = (m.url || "").toLowerCase().includes(query);
        if (!matchesName && !matchesUrl) return false;
      }
      return true;
    });
  }, [allMediaItems, activeFilter, searchQuery]);

  // Importation multiple de médias
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);

    // Filtrer pour n'importer que des images, vidéos ou sons
    const validFiles = filesArray.filter((file) => {
      const kind = mediaKindOf(file.type, file.name);
      return kind === "image" || kind === "video" || kind === "audio";
    });

    if (validFiles.length === 0) {
      toast.error(
        "Veuillez sélectionner uniquement des images, vidéos ou fichiers audio. Les documents PDF doivent être ajoutés dans l'espace Ressources.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (validFiles.length < filesArray.length) {
      toast.info(
        `${filesArray.length - validFiles.length} fichier(s) document/PDF ignoré(s) car réservé(s) aux Ressources.`,
      );
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    // Concurrency pool de 2 pour un téléversement fluide et robuste
    const CONCURRENCY = 2;
    let nextIndex = 0;

    const uploadWorker = async () => {
      while (nextIndex < validFiles.length) {
        const currentIndex = nextIndex++;
        const file = validFiles[currentIndex];
        setUploadProgress({
          current: currentIndex + 1,
          total: validFiles.length,
          currentFile: file.name,
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "pages");
        formData.append("alt", file.name);

        try {
          await uploadAdminMedia(formData);
          successCount++;
        } catch (err) {
          console.error(`[Upload] Échec pour ${file.name}:`, err);
          failCount++;
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, validFiles.length) },
      () => uploadWorker(),
    );
    await Promise.all(workers);

    setIsUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (failCount === 0) {
      toast.success(
        validFiles.length === 1
          ? `Média "${validFiles[0].name}" téléversé avec succès.`
          : `${successCount} médias téléversés avec succès.`,
      );
    } else if (successCount > 0) {
      toast.warning(`${successCount} média(s) téléversé(s), ${failCount} échec(s).`);
    } else {
      toast.error("Erreur lors du téléversement des fichiers.");
    }

    fetchMedia();
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

  const filterTabs: { key: MediaFilterKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "ALL", label: "Tous les médias", icon: Filter },
    { key: "image", label: "Images", icon: ImageIcon },
    { key: "video", label: "Vidéos", icon: Video },
    { key: "audio", label: "Audios / Sons", icon: Mic },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Médiathèque CCJV"
        description="Téléversez et gérez les photos, bannières, vidéos et enregistrements audio de l'église."
        actions={
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*"
              multiple
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
              {isUploading && uploadProgress
                ? `Téléversement (${uploadProgress.current}/${uploadProgress.total})...`
                : "Importer des médias"}
            </Button>
          </div>
        }
      />

      {/* Barre de progression pendant l'importation multiple */}
      {isUploading && uploadProgress && (
        <div className="p-4 bg-white border border-ccjv-green/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-2.5 w-2.5 rounded-full bg-ccjv-green animate-ping shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ccjv-ink">
                Téléversement en cours : {uploadProgress.current} sur {uploadProgress.total} média(s)
              </p>
              <p className="text-[11px] text-ccjv-ink-secondary truncate max-w-md">
                En cours : {uploadProgress.currentFile}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-56 bg-ccjv-line h-2 rounded-none overflow-hidden shrink-0">
            <div
              className="bg-ccjv-green h-full transition-all duration-200"
              style={{
                width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Barre de filtres et recherche */}
      <div className="bg-white border border-ccjv-line p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Onglets par type de média */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const count = counts[tab.key];
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-none border ${
                  isActive
                    ? "bg-ccjv-green text-white border-ccjv-green"
                    : "bg-white text-ccjv-ink border-ccjv-line hover:bg-ccjv-offwhite"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-ccjv-line/70 text-ccjv-ink-secondary"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ccjv-ink-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un média..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-ccjv-line rounded-none focus:outline-none focus:border-ccjv-green text-ccjv-ink placeholder:text-ccjv-ink-secondary"
          />
        </div>
      </div>

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
            {allMediaItems.length === 0
              ? "Aucun média (image, vidéo, son) trouvé dans la médiathèque."
              : "Aucun média ne correspond aux critères sélectionnés."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Importer des médias
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => {
            const kind = mediaKindOf(item.mimeType, item.filename || item.url);

            return (
              <div
                key={item.id}
                className="group bg-white border border-ccjv-line rounded-none overflow-hidden flex flex-col justify-between hover:border-ccjv-green transition-all"
              >
                {/* Aperçu visuel selon le type de média */}
                <div className="aspect-video bg-[#fafaf7] relative overflow-hidden flex items-center justify-center border-b border-ccjv-line">
                  {kind === "image" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.url}
                      alt={item.filename || "Média CCJV"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : kind === "video" ? (
                    <div className="w-full h-full bg-[#111827] flex flex-col items-center justify-center text-white relative">
                      <Video className="h-8 w-8 text-white/80 group-hover:scale-110 transition-transform" />
                      <span className="absolute top-2 right-2 text-[9px] font-mono uppercase bg-black/75 text-white px-1.5 py-0.5 rounded-none tracking-wider">
                        Vidéo
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#fdfbf7] flex flex-col items-center justify-center text-ccjv-ink relative">
                      <Mic className="h-8 w-8 text-ccjv-green group-hover:scale-110 transition-transform" />
                      <span className="absolute top-2 right-2 text-[9px] font-mono uppercase bg-ccjv-green/10 text-ccjv-green px-1.5 py-0.5 rounded-none font-semibold tracking-wider">
                        Audio
                      </span>
                    </div>
                  )}
                </div>

                {/* Détails et actions */}
                <div className="p-2.5 space-y-1.5">
                  <p
                    className="text-[11px] font-semibold text-ccjv-ink truncate"
                    title={item.filename || item.url}
                  >
                    {item.filename || "Média CCJV"}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-ccjv-ink-secondary">
                    <span className="uppercase font-mono text-[9px]">
                      {kind === "image" ? "Image" : kind === "video" ? "Vidéo" : "Audio"}
                    </span>
                    <span>{formatBytes(item.sizeBytes)}</span>
                  </div>

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
            );
          })}
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
