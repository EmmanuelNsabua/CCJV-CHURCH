"use client";

import React, { useEffect, useState } from "react";
import { X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { SocialIcon, SOCIAL_PLATFORMS, type SocialPlatform } from "@/components/common/SocialIcons";
import type { SocialLink, SocialLinkInput } from "@/lib/api";

export interface SocialLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: SocialLinkInput) => Promise<void>;
  initialData?: SocialLink | null;
  isLoading?: boolean;
}

export function SocialLinkModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: SocialLinkModalProps) {
  const isEditing = Boolean(initialData);

  const [platform, setPlatform] = useState<SocialPlatform>("youtube");
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const p = (initialData.platform as SocialPlatform) || "other";
      setPlatform(p);
      setLabel(initialData.label || "");
      setHref(initialData.href || "");
      setIsActive(initialData.isActive ?? true);
      setPosition(initialData.position ?? 0);
    } else {
      setPlatform("youtube");
      setLabel("YouTube CCJV");
      setHref("");
      setIsActive(true);
      setPosition(0);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handlePlatformChange = (p: SocialPlatform) => {
    setPlatform(p);
    const catalogItem = SOCIAL_PLATFORMS.find((item) => item.id === p);
    if (!label || SOCIAL_PLATFORMS.some((item) => item.label === label || `${item.label} CCJV` === label)) {
      setLabel(catalogItem ? `${catalogItem.label} CCJV` : "Réseau social");
    }
    if (!href && catalogItem) {
      setHref(catalogItem.placeholder);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!label.trim()) {
      errs.label = "Le libellé visible est obligatoire.";
    }

    if (!href.trim()) {
      errs.href = "L'adresse URL du réseau est obligatoire.";
    } else {
      try {
        const parsed = new URL(href.trim());
        if (!["https:", "http:"].includes(parsed.protocol)) {
          errs.href = "L'URL doit commencer par https:// ou http://";
        }
      } catch {
        errs.href = "Format d'adresse URL invalide (ex: https://...).";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: SocialLinkInput = {
      platform,
      label: label.trim(),
      href: href.trim(),
      isActive,
      position: Number(position) || 0,
    };

    await onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white border border-ccjv-line rounded-none shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ccjv-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center bg-ccjv-green text-white">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="social-modal-title" className="font-serif text-lg font-bold text-ccjv-ink">
                {isEditing ? "Modifier le réseau social" : "Nouveau lien social"}
              </h2>
              <p className="text-xs text-ccjv-ink-secondary">
                Catalogue officiel affiché sur le site public
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-ccjv-ink-secondary hover:text-ccjv-ink p-1 transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Sélection de la plateforme */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ccjv-ink font-sans tracking-wide">
              Plateforme du réseau *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {SOCIAL_PLATFORMS.map((item) => {
                const isSelected = platform === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePlatformChange(item.id)}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center p-2.5 border text-xs font-medium gap-1.5 transition-colors ${
                      isSelected
                        ? "bg-ccjv-green text-white border-ccjv-green"
                        : "bg-white text-ccjv-ink border-ccjv-line hover:border-ccjv-green/60"
                    }`}
                  >
                    <SocialIcon platform={item.id} size={18} className="shrink-0" />
                    <span className="truncate max-w-full text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Libellé visible */}
          <FormField
            label="Libellé visible (Label)"
            required
            error={errors.label}
            hint="Texte d'accessibilité et d'affichage (ex: YouTube CCJV)"
          >
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="YouTube CCJV"
              disabled={isLoading}
            />
          </FormField>

          {/* URL du réseau */}
          <FormField
            label="Lien HTTPS (URL)"
            required
            error={errors.href}
            hint="Adresse web complète commençant par https://"
          >
            <div className="relative">
              <Input
                type="url"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://www.youtube.com/@CCJV_officiel"
                disabled={isLoading}
              />
            </div>
          </FormField>

          {/* Statut & Ordre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <FormField
              label="Ordre d'affichage"
              hint="0 = premier, 1, 2, 3..."
            >
              <Input
                type="number"
                min={0}
                max={999}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                disabled={isLoading}
              />
            </FormField>

            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-ccjv-ink cursor-pointer p-2.5 border border-ccjv-line bg-[#fafaf7]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isLoading}
                  className="rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-4 w-4"
                />
                <span>Réseau actif (visible en ligne)</span>
              </label>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ccjv-line">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Enregistrement..."
                : isEditing
                ? "Enregistrer"
                : "Ajouter le réseau"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
