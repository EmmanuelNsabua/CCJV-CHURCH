"use client";

import React, { useState } from "react";
import { ExternalLink, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/admin/forms/Input";
import { SocialIcon, SOCIAL_PLATFORMS, type SocialPlatform } from "@/components/common/SocialIcons";
import type { SocialLink, SocialLinkInput } from "@/lib/api";

export interface SocialCatalogFormProps {
  initialLinks: SocialLink[];
  onSaveLinks: (links: SocialLinkInput[]) => Promise<void>;
  isLoading?: boolean;
}

interface CatalogEntryState {
  id?: string;
  platform: SocialPlatform;
  label: string;
  href: string;
  isActive: boolean;
  position: number;
}

export function SocialCatalogForm({
  initialLinks,
  onSaveLinks,
  isLoading = false,
}: SocialCatalogFormProps) {
  // Initialiser les entrées pour chaque plateforme du catalogue
  const [entries, setEntries] = useState<CatalogEntryState[]>(() => {
    return SOCIAL_PLATFORMS.map((platformItem, index) => {
      const existing = initialLinks.find(
        (l) =>
          l.platform?.toLowerCase() === platformItem.id ||
          l.label.toLowerCase().includes(platformItem.id) ||
          (platformItem.id === "x" && l.label.toLowerCase().includes("twitter")),
      );

      return {
        id: existing?.id,
        platform: platformItem.id,
        label: existing?.label || platformItem.label,
        href: existing?.href || "",
        isActive: existing ? (existing.isActive ?? true) : false,
        position: existing?.position ?? index,
      };
    });
  });

  const handleUrlChange = (index: number, newHref: string) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index].href = newHref;
      // Si l'utilisateur remplit une URL et qu'elle n'était pas active, on l'active par défaut
      if (newHref.trim() && !copy[index].isActive && !copy[index].id) {
        copy[index].isActive = true;
      }
      return copy;
    });
  };

  const handleToggleActive = (index: number) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index].isActive = !copy[index].isActive;
      return copy;
    });
  };

  const handleSave = async () => {
    // Ne persister que les entrées qui ont une URL renseignée
    const payload: SocialLinkInput[] = entries
      .filter((e) => e.href.trim().length > 0)
      .map((e, idx) => ({
        platform: e.platform,
        label: e.label.trim() || e.platform,
        href: e.href.trim(),
        isActive: e.isActive,
        position: idx,
      }));

    await onSaveLinks(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-ccjv-line gap-3">
        <div>
          <h3 className="font-serif text-base font-bold text-ccjv-ink">
            Catalogue des réseaux sociaux de l&apos;église
          </h3>
          <p className="text-xs text-ccjv-ink-secondary">
            Renseignez les liens officiels de vos chaînes et pages. Les réseaux avec une URL active seront automatiquement intégrés au footer et au menu.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          size="sm"
          className="self-start sm:self-auto"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isLoading ? "Enregistrement..." : "Enregistrer les réseaux"}
        </Button>
      </div>

      <div className="space-y-3">
        {entries.map((item, index) => {
          const hasUrl = item.href.trim().length > 0;

          return (
            <div
              key={item.platform}
              className={`p-4 border transition-colors ${
                item.isActive && hasUrl
                  ? "bg-white border-ccjv-line hover:border-ccjv-green/40"
                  : "bg-[#fafaf7] border-ccjv-line/60 opacity-85"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Icône et nom de la plateforme */}
                <div className="flex items-center gap-3 w-44 shrink-0">
                  <div className="h-9 w-9 bg-white border border-ccjv-line flex items-center justify-center text-ccjv-ink shadow-xs">
                    <SocialIcon platform={item.platform} size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-ccjv-ink block">
                      {SOCIAL_PLATFORMS.find((p) => p.id === item.platform)?.label || item.label}
                    </span>
                    <span className="text-[10px] font-mono text-ccjv-ink-secondary uppercase">
                      {item.platform}
                    </span>
                  </div>
                </div>

                {/* Champ URL à remplir */}
                <div className="flex-1 space-y-1">
                  <Input
                    type="url"
                    value={item.href}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder={
                      SOCIAL_PLATFORMS.find((p) => p.id === item.platform)?.placeholder ||
                      "https://..."
                    }
                    disabled={isLoading}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                {/* Options : Actif / Masqué & Test du lien */}
                <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(index)}
                    disabled={!hasUrl || isLoading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
                      !hasUrl
                        ? "bg-ccjv-offwhite text-ccjv-ink-secondary/40 border-ccjv-line cursor-not-allowed"
                        : item.isActive
                        ? "bg-[#eaf3ea] text-[#1e7a1e] border-[#1e7a1e]/30 hover:bg-[#d8ebd8]"
                        : "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca] hover:bg-[#fee2e2]"
                    }`}
                  >
                    {item.isActive && hasUrl ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Actif en ligne</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Masqué</span>
                      </>
                    )}
                  </button>

                  {hasUrl && (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-ccjv-ink hover:text-ccjv-green p-1.5 border border-ccjv-line hover:border-ccjv-green transition-colors"
                      title="Ouvrir le lien pour tester"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
