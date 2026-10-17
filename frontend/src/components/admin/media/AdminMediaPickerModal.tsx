"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  FileText,
  Video,
  Mic,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Eye,
  PlayCircle,
  Check,
} from "lucide-react";
import { Input } from "@/components/admin/forms/Input";
import { Button } from "@/components/ui/Button";
import { listAdminMedia } from "@/lib/api/endpoints";
import type { AdminMediaItem } from "@/lib/api/types";

export interface AdminMediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: AdminMediaItem) => void;
  title?: string;
  initialFilter?: "ALL" | "video" | "image" | "audio";
}

export function AdminMediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Visualiseur et Importation du Stockage (Bucket)",
  initialFilter = "ALL",
}: AdminMediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<AdminMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "video" | "image" | "audio">(initialFilter);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [inspectingMedia, setInspectingMedia] = useState<AdminMediaItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      listAdminMedia({ limit: 100 })
        .then((res) => {
          setMediaList(res.data || []);
        })
        .catch((err) => {
          console.warn("[AdminMediaPickerModal] Erreur chargement médias :", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
      setFilterType(initialFilter);
      setSearch("");
      setInspectingMedia(null);
    }
  }, [isOpen, initialFilter]);

  const filteredItems = useMemo(() => {
    return mediaList.filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.filename.toLowerCase().includes(search.toLowerCase()) ||
        item.mimeType.toLowerCase().includes(search.toLowerCase());

      let matchType = true;
      if (filterType === "video") {
        matchType = item.mimeType.startsWith("video/");
      } else if (filterType === "image") {
        matchType = item.mimeType.startsWith("image/");
      } else if (filterType === "audio") {
        matchType = item.mimeType.startsWith("audio/");
      }

      return matchSearch && matchType;
    });
  }, [mediaList, search, filterType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-ccjv-border max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* En-tête du modal */}
        <div className="p-4 border-b border-ccjv-border flex items-center justify-between bg-ccjv-surface">
          <div>
            <h3 className="text-base font-bold text-ccjv-ink flex items-center gap-2">
              <Upload className="w-4 h-4 text-ccjv-green" />
              {title}
            </h3>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              Visualisez fidèlement vos fichiers (Images, Vidéos, Audios, Textes) avant de les sélectionner.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-ccjv-surface text-ccjv-ink-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="p-3 border-b border-ccjv-border bg-ccjv-surface/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom de fichier..."
              className="text-xs flex-1 sm:max-w-xs"
            />

            {/* Onglets / Filtre de type */}
            <div className="flex items-center border border-ccjv-border bg-white text-xs">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 transition-colors ${
                  filterType === "ALL"
                    ? "bg-ccjv-ink text-white font-medium"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setFilterType("video")}
                className={`px-2.5 py-1 transition-colors border-l border-ccjv-border ${
                  filterType === "video"
                    ? "bg-ccjv-ink text-white font-medium"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                }`}
              >
                Vidéos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("image")}
                className={`px-2.5 py-1 transition-colors border-l border-ccjv-border ${
                  filterType === "image"
                    ? "bg-ccjv-ink text-white font-medium"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                }`}
              >
                Images
              </button>
              <button
                type="button"
                onClick={() => setFilterType("audio")}
                className={`px-2.5 py-1 transition-colors border-l border-ccjv-border ${
                  filterType === "audio"
                    ? "bg-ccjv-ink text-white font-medium"
                    : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                }`}
              >
                Audios
              </button>
            </div>
          </div>

          {/* Bascule Grille / Liste */}
          <div className="flex items-center gap-1 border border-ccjv-border bg-white p-0.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 ${
                viewMode === "grid"
                  ? "bg-ccjv-surface text-ccjv-ink font-bold"
                  : "text-ccjv-ink-muted hover:text-ccjv-ink"
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1 ${
                viewMode === "list"
                  ? "bg-ccjv-surface text-ccjv-ink font-bold"
                  : "text-ccjv-ink-muted hover:text-ccjv-ink"
              }`}
              title="Vue Liste"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Corps : Liste des médias filtrés */}
        <div className="p-4 overflow-y-auto flex-1 min-h-[320px] max-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <div className="w-6 h-6 border-2 border-ccjv-green border-t-transparent animate-spin rounded-full" />
              <p className="text-xs text-ccjv-ink-secondary">
                Chargement des fichiers du bucket...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
              <Upload className="w-8 h-8 text-ccjv-ink-muted stroke-[1.5]" />
              <p className="text-sm font-semibold text-ccjv-ink">
                Aucun média trouvé
              </p>
              <p className="text-xs text-ccjv-ink-secondary max-w-sm">
                Aucun fichier ne correspond à votre recherche ou à vos filtres.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            /* AFFICHAGE GRILLE AVEC APERÇUS RÉELS */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const isVideo = item.mimeType.startsWith("video/");
                const isImage = item.mimeType.startsWith("image/");
                const isAudio = item.mimeType.startsWith("audio/");

                return (
                  <div
                    key={item.id}
                    className="border border-ccjv-border bg-white group hover:border-ccjv-green hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Zone de prévisualisation */}
                    <div className="relative aspect-video bg-black/5 flex items-center justify-center overflow-hidden border-b border-ccjv-border">
                      {isImage ? (
                        <Image
                          src={item.url}
                          alt={item.filename}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : isVideo ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover opacity-80"
                            preload="metadata"
                          />
                          <PlayCircle className="w-8 h-8 text-white absolute opacity-90 drop-shadow-md" />
                        </div>
                      ) : isAudio ? (
                        <div className="flex flex-col items-center justify-center text-ccjv-ink-secondary p-2">
                          <Mic className="w-8 h-8 text-amber-600 mb-1" />
                          <span className="text-[10px] font-semibold text-amber-800">
                            Fichier Audio
                          </span>
                        </div>
                      ) : (
                        <FileText className="w-8 h-8 text-ccjv-ink-muted" />
                      )}

                      {/* Bouton d'inspection agrandie (Lightbox) */}
                      <button
                        type="button"
                        onClick={() => setInspectingMedia(item)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Agrandir / Inspecter"
                      >
                        <Eye className="w-3 h-3" />
                      </button>

                      {/* Badge type */}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-semibold uppercase tracking-wider">
                        {isVideo ? "Vidéo" : isImage ? "Image" : isAudio ? "Audio" : "Document"}
                      </div>
                    </div>

                    {/* Informations fichier et bouton de sélection */}
                    <div className="p-2 space-y-1.5">
                      <div className="text-[11px] font-semibold text-ccjv-ink truncate" title={item.filename}>
                        {item.filename}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-ccjv-ink-secondary">
                        <span>
                          {item.sizeBytes
                            ? `${(item.sizeBytes / 1024 / 1024).toFixed(1)} Mo`
                            : "—"}
                        </span>
                        <span className="truncate max-w-[100px]">{item.mimeType}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => onSelect(item)}
                        className="w-full justify-center text-[10px] py-1 h-auto font-medium"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Sélectionner
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* AFFICHAGE LISTE */
            <div className="divide-y divide-ccjv-border border border-ccjv-border bg-white text-xs">
              {filteredItems.map((item) => {
                const isVideo = item.mimeType.startsWith("video/");
                const isImage = item.mimeType.startsWith("image/");
                const isAudio = item.mimeType.startsWith("audio/");

                return (
                  <div
                    key={item.id}
                    className="p-2.5 flex items-center justify-between hover:bg-ccjv-surface transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 border border-ccjv-border bg-ccjv-surface flex items-center justify-center shrink-0 overflow-hidden">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : isVideo ? (
                          <Video className="w-4 h-4 text-emerald-600" />
                        ) : isAudio ? (
                          <Mic className="w-4 h-4 text-amber-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-ccjv-ink-muted" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-ccjv-ink truncate" title={item.filename}>
                          {item.filename}
                        </div>
                        <div className="text-[10px] text-ccjv-ink-secondary flex items-center gap-2">
                          <span className="uppercase font-bold text-[9px] text-ccjv-ink-muted">
                            {isVideo ? "Vidéo" : isImage ? "Image" : isAudio ? "Audio" : "Document"}
                          </span>
                          <span>•</span>
                          <span>
                            {item.sizeBytes
                              ? `${(item.sizeBytes / 1024 / 1024).toFixed(2)} Mo`
                              : "Taille non spécifiée"}
                          </span>
                          <span>•</span>
                          <span>Type : {item.mimeType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingMedia(item)}
                        className="p-1.5 hover:bg-ccjv-surface border border-ccjv-border text-ccjv-ink-secondary hover:text-ccjv-ink"
                        title="Aperçu rapide"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => onSelect(item)}
                        className="text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Sélectionner
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de page du modal */}
        <div className="p-3 border-t border-ccjv-border bg-ccjv-surface flex items-center justify-between text-xs text-ccjv-ink-secondary">
          <span>{filteredItems.length} fichier(s) disponible(s)</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {/* LIGHTBOX INSPECTION AGRANDIE */}
      {inspectingMedia && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border border-ccjv-border max-w-2xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-ccjv-border pb-2">
              <h4 className="font-bold text-sm text-ccjv-ink truncate" title={inspectingMedia.filename}>
                Aperçu : {inspectingMedia.filename}
              </h4>
              <button
                type="button"
                onClick={() => setInspectingMedia(null)}
                className="p-1 hover:bg-ccjv-surface"
              >
                <X className="w-4 h-4 text-ccjv-ink-secondary" />
              </button>
            </div>

            <div className="bg-black/5 border border-ccjv-border flex items-center justify-center max-h-[60vh] overflow-hidden">
              {inspectingMedia.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inspectingMedia.url}
                  alt={inspectingMedia.filename}
                  className="max-h-[55vh] object-contain"
                />
              ) : inspectingMedia.mimeType.startsWith("video/") ? (
                <video
                  src={inspectingMedia.url}
                  controls
                  className="max-h-[55vh] w-full"
                  autoPlay
                />
              ) : inspectingMedia.mimeType.startsWith("audio/") ? (
                <div className="p-8 w-full flex flex-col items-center">
                  <Mic className="w-12 h-12 text-amber-600 mb-4" />
                  <audio src={inspectingMedia.url} controls className="w-full" />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-ccjv-ink-secondary">
                  Aperçu non disponible pour ce type de fichier.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-ccjv-ink-secondary">
                {inspectingMedia.sizeBytes
                  ? `${(inspectingMedia.sizeBytes / 1024 / 1024).toFixed(2)} Mo`
                  : ""}{" "}
                · {inspectingMedia.mimeType}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectingMedia(null)}
                >
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onSelect(inspectingMedia);
                    setInspectingMedia(null);
                  }}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Sélectionner ce média
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
