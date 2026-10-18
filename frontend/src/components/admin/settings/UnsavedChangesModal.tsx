"use client";

import React from "react";
import { AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndProceed: () => Promise<void>;
  onDiscardAndProceed: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UnsavedChangesModal({
  isOpen,
  onSaveAndProceed,
  onDiscardAndProceed,
  onCancel,
  isLoading = false,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
    >
      <div
        className="w-full max-w-md bg-white border border-ccjv-line rounded-none shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fffbeb] border border-[#fde68a] text-[#b45309]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 id="unsaved-modal-title" className="font-serif text-lg font-bold text-ccjv-ink">
              Modifications non enregistrées
            </h3>
            <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
              Vous avez des modifications en cours dans cette section qui ne sont pas encore enregistrées.
              Souhaitez-vous enregistrer vos modifications avant de quitter ?
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-ccjv-line flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="text-xs"
          >
            Rester sur la page
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDiscardAndProceed}
            disabled={isLoading}
            className="text-xs text-[#b91c1c] hover:bg-[#fef2f2]"
          >
            Ignorer et quitter
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onSaveAndProceed}
            disabled={isLoading}
            className="text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? "Enregistrement..." : "Enregistrer et continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
