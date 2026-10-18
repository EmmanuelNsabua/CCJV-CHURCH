"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Image as ImageIcon, PlayCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminMediaPickerModal } from "./AdminMediaPickerModal";
import type { AdminMediaItem } from "@/lib/api/types";

export interface AdminMediaValue {
  mediaId?: string;
  url: string;
  title?: string;
  mimeType?: string;
}

export interface AdminMediaFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value?: AdminMediaValue | null;
  onChange: (val: AdminMediaValue | null) => void;
  acceptedTypes?: "ALL" | "video" | "image" | "audio";
}

export function AdminMediaField({
  label,
  hint,
  required = false,
  error,
  value,
  onChange,
  acceptedTypes = "image",
}: AdminMediaFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (item: AdminMediaItem) => {
    onChange({
      mediaId: item.id,
      url: item.url,
      title: item.filename,
      mimeType: item.mimeType,
    });
    setIsModalOpen(false);
  };

  const isVideo = value?.mimeType?.startsWith("video/") || Boolean(value?.url?.match(/\.(mp4|webm|mov)$/i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {value?.url && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-ccjv-green hover:underline flex items-center gap-1 font-medium"
          >
            <Upload className="w-3 h-3" />
            <span>Remplacer</span>
          </button>
        )}
      </div>

      {value?.url ? (
        <div className="border border-ccjv-border bg-white p-3 space-y-2.5 rounded-none">
          <div className="relative aspect-video w-full bg-black/5 overflow-hidden border border-ccjv-border">
            {isVideo ? (
              <video
                src={value.url}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <Image
                src={value.url}
                alt={value.title || "Média associé"}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-ccjv-border/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-1.5 py-0.5 bg-ccjv-surface text-ccjv-ink text-[10px] font-bold uppercase">
                {isVideo ? "Vidéo" : "Image"}
              </span>
              <span className="font-semibold text-ccjv-ink truncate max-w-[200px]" title={value.title || value.url}>
                {value.title || value.url}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-ccjv-ink-muted hover:text-red-600 p-1 transition-colors"
              title="Retirer ce média"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-ccjv-border hover:border-ccjv-green/60 bg-[#fafaf7] hover:bg-white p-6 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-10 h-10 bg-white border border-ccjv-border group-hover:border-ccjv-green/40 flex items-center justify-center text-ccjv-ink-secondary group-hover:text-ccjv-green transition-colors">
            <ImageIcon className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-[11px] text-ccjv-ink-secondary group-hover:text-ccjv-green transition-colors">
              Sélectionner depuis la médiathèque
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e?.stopPropagation();
              setIsModalOpen(true);
            }}
            className="text-[11px] mt-2 rounded-none"
          >
            <Upload className="w-3 h-3 mr-1" />
            Parcourir les médias
          </Button>
        </div>
      )}

      {hint && <p className="text-[11px] text-ccjv-ink-secondary">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <AdminMediaPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        initialFilter={acceptedTypes}
      />
    </div>
  );
}
