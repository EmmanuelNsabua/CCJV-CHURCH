"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { User, Image as ImageIcon, X } from "lucide-react";
import { AdminMediaPickerModal } from "@/components/admin/media/AdminMediaPickerModal";
import type { AdminMediaItem } from "@/lib/api/types";
import type { AdminMediaValue } from "@/components/admin/media/AdminMediaField";

export interface DepartmentLeaderData {
  id?: string;
  name: string;
  role: string;
  photoMediaId?: string | null;
  photoUrl?: string | null;
}

interface LeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leader: DepartmentLeaderData) => void;
  initialData?: DepartmentLeaderData | null;
}

export function LeaderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: LeaderModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [photoMedia, setPhotoMedia] = useState<AdminMediaValue | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || "");
        setRole(initialData.role || "");
        setPhotoMedia(
          initialData.photoUrl
            ? {
                mediaId: initialData.photoMediaId || undefined,
                url: initialData.photoUrl,
                title: initialData.name,
              }
            : null,
        );
      } else {
        setName("");
        setRole("");
        setPhotoMedia(null);
      }
      setErrors({});
      setIsPickerOpen(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e && "preventDefault" in e) {
      e.preventDefault();
    }
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Le nom complet est obligatoire.";
    }
    if (!role.trim()) {
      newErrors.role = "Le rôle est obligatoire.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      role: role.trim(),
      photoMediaId: photoMedia?.mediaId || null,
      photoUrl: photoMedia?.url || null,
    });

    onClose();
  };

  const handleSelectMedia = (item: AdminMediaItem) => {
    setPhotoMedia({
      mediaId: item.id,
      url: item.url,
      title: item.filename,
    });
    setIsPickerOpen(false);
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoMedia(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leader-modal-title"
      >
        <div className="bg-white border border-ccjv-line w-full max-w-[580px] p-7 rounded-none space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* En-tête : Icône + Titre + Ligne séparatrice */}
          <div className="border-b border-ccjv-line/70 pb-3">
            <div className="flex items-center gap-2.5">
              <User className="h-5 w-5 text-ccjv-ink stroke-[1.75]" />
              <h3
                id="leader-modal-title"
                className="text-base font-serif font-bold text-ccjv-ink"
              >
                {initialData ? "Modifier le responsable" : "Ajouter un responsable"}
              </h3>
            </div>
          </div>

          {/* Formulaire : 2 colonnes horizontales */}
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-[130px_1fr] gap-6 items-center">
              {/* Colonne gauche : Cadre Photo de profil */}
              <div
                onClick={() => setIsPickerOpen(true)}
                className={`relative w-[130px] h-[130px] border border-dashed rounded-none flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors overflow-hidden group select-none ${
                  photoMedia?.url
                    ? "border-ccjv-line bg-white"
                    : "border-ccjv-line bg-[#f8f9fa] hover:border-ccjv-green hover:bg-ccjv-offwhite"
                }`}
                title="Cliquez pour sélectionner une photo depuis la médiathèque"
              >
                {photoMedia?.url ? (
                  <>
                    <Image
                      src={photoMedia.url}
                      alt={name || "Photo de profil"}
                      fill
                      className="object-cover"
                      sizes="130px"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium">
                      <span>Changer</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white transition-colors"
                      title="Retirer la photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-ccjv-ink-secondary/60 group-hover:text-ccjv-green transition-colors">
                      <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] text-ccjv-ink-secondary group-hover:text-ccjv-green transition-colors">
                      Photo de profil
                    </span>
                  </>
                )}
              </div>

              {/* Colonne droite : Champs Nom complet & Rôle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ccjv-ink mb-1.5">
                    Nom complet <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.name;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Ex : Pasteur David Mukendi"
                    className={`w-full px-3 py-2 text-xs border rounded-none bg-white text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 focus:outline-hidden focus:ring-1 focus:ring-ccjv-green focus:border-ccjv-green ${
                      errors.name ? "border-red-500" : "border-ccjv-line"
                    }`}
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ccjv-ink mb-1.5">
                    Rôle <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (errors.role) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.role;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Ex : Responsable du département"
                    className={`w-full px-3 py-2 text-xs border rounded-none bg-white text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 focus:outline-hidden focus:ring-1 focus:ring-ccjv-green focus:border-ccjv-green ${
                      errors.role ? "border-red-500" : "border-ccjv-line"
                    }`}
                  />
                  {errors.role && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.role}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pied : Boutons Annuler et Ajouter */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-ccjv-ink bg-white border border-ccjv-line hover:bg-ccjv-offwhite rounded-none transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-ccjv-green hover:bg-ccjv-green/90 rounded-none transition-colors"
              >
                {initialData ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de média relié à la boîte photo */}
      <AdminMediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectMedia}
        title="Choisir la photo du responsable"
        initialFilter="image"
      />
    </>
  );
}
