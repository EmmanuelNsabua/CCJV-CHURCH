"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  // Esc key listener & Focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Auto focus cancel button for non-destructive default
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="w-full max-w-md bg-white border border-ccjv-line rounded-none shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-ccjv-ink-secondary hover:text-ccjv-ink p-1 transition-colors disabled:opacity-40"
          aria-label="Fermer la boîte de dialogue"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-2.5 shrink-0 ${
              variant === "danger"
                ? "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
                : "bg-ccjv-green-soft text-ccjv-green border border-ccjv-green/20"
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="space-y-2 flex-1">
            <h2 id="confirm-modal-title" className="text-base font-semibold text-ccjv-ink font-sans">
              {title}
            </h2>
            <p id="confirm-modal-desc" className="text-xs text-ccjv-ink-secondary leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-ccjv-line">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[36px] px-4 text-xs font-medium border border-ccjv-line text-ccjv-ink bg-transparent hover:border-ccjv-ink transition-colors disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
