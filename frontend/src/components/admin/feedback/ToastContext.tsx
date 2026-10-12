"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-[#eaf3ea]",
    border: "border-[#1e7a1e]/30",
    text: "text-[#1e7a1e]",
    icon: <CheckCircle2 className="h-5 w-5 text-[#1e7a1e] shrink-0" aria-hidden="true" />,
  },
  error: {
    bg: "bg-[#fef2f2]",
    border: "border-[#fecaca]",
    text: "text-[#b91c1c]",
    icon: <XCircle className="h-5 w-5 text-[#b91c1c] shrink-0" aria-hidden="true" />,
  },
  warning: {
    bg: "bg-[#fffbeb]",
    border: "border-[#fde68a]",
    text: "text-[#b45309]",
    icon: <AlertTriangle className="h-5 w-5 text-[#b45309] shrink-0" aria-hidden="true" />,
  },
  info: {
    bg: "bg-[#eff6ff]",
    border: "border-[#bfdbfe]",
    text: "text-[#1d4ed8]",
    icon: <Info className="h-5 w-5 text-[#1d4ed8] shrink-0" aria-hidden="true" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback((message: string, title?: string) => showToast({ type: "success", message, title }), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast({ type: "error", message, title }), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast({ type: "warning", message, title }), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast({ type: "info", message, title }), [showToast]);

  const value = useMemo(
    () => ({ showToast, success, error, warning, info, removeToast }),
    [showToast, success, error, warning, info, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-50 flex max-w-md w-full flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start justify-between gap-3 p-4 border rounded-none shadow-md transition-all duration-200",
                style.bg,
                style.border,
              )}
            >
              <div className="flex items-start gap-3">
                {style.icon}
                <div className="flex flex-col">
                  {toast.title && <p className={cn("text-sm font-semibold", style.text)}>{toast.title}</p>}
                  <p className="text-xs text-ccjv-ink mt-0.5">{toast.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-ccjv-ink-secondary hover:text-ccjv-ink p-1 -mr-1 -mt-1 transition-colors"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider.");
  }
  return context;
}
