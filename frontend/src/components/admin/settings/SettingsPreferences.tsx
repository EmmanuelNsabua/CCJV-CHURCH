"use client";

import React, { useState } from "react";
import { Sun, Moon, Laptop, Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PreferencesData {
  theme: "light" | "dark" | "system";
  notifications: {
    notifyPrayer: boolean;
    notifyTestimony: boolean;
    notifyWeeklyDigest: boolean;
    notifySecurityAlerts: boolean;
  };
}

export interface SettingsPreferencesProps {
  onSave: (preferences: PreferencesData) => Promise<void>;
  isLoading?: boolean;
}

export function SettingsPreferences({
  onSave,
  isLoading = false,
}: SettingsPreferencesProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [notifyPrayer, setNotifyPrayer] = useState(true);
  const [notifyTestimony, setNotifyTestimony] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);
  const [notifySecurityAlerts, setNotifySecurityAlerts] = useState(true);

  const handleSave = async () => {
    await onSave({
      theme,
      notifications: {
        notifyPrayer,
        notifyTestimony,
        notifyWeeklyDigest,
        notifySecurityAlerts,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-ccjv-line gap-3">
        <div>
          <h3 className="font-serif text-base font-bold text-ccjv-ink">
            Préférences de l&apos;interface & Notifications
          </h3>
          <p className="text-xs text-ccjv-ink-secondary">
            Personnalisez l&apos;affichage de votre espace d&apos;administration et vos préférences d&apos;alertes.
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
          {isLoading ? "Enregistrement..." : "Enregistrer les préférences"}
        </Button>
      </div>

      {/* 1. Thème d'affichage */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-ccjv-ink block">
          Thème de l&apos;espace d&apos;administration
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Clair */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 border text-left flex items-start gap-3 transition-colors ${
              theme === "light"
                ? "bg-[#fafaf7] border-ccjv-green ring-1 ring-ccjv-green"
                : "bg-white border-ccjv-line hover:border-ccjv-line/80"
            }`}
          >
            <div className="p-2 bg-white border border-ccjv-line text-ccjv-green">
              <Sun className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-ccjv-ink block">Clair (Standard)</span>
              <span className="text-[11px] text-ccjv-ink-secondary leading-tight block mt-0.5">
                Design institutionnel épuré du CCJV
              </span>
            </div>
          </button>

          {/* Sombre */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 border text-left flex items-start gap-3 transition-colors ${
              theme === "dark"
                ? "bg-[#fafaf7] border-ccjv-green ring-1 ring-ccjv-green"
                : "bg-white border-ccjv-line hover:border-ccjv-line/80"
            }`}
          >
            <div className="p-2 bg-ccjv-ink text-white">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-ccjv-ink block">Sombre</span>
              <span className="text-[11px] text-ccjv-ink-secondary leading-tight block mt-0.5">
                Contraste élevé pour travail nocturne
              </span>
            </div>
          </button>

          {/* Système */}
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 border text-left flex items-start gap-3 transition-colors ${
              theme === "system"
                ? "bg-[#fafaf7] border-ccjv-green ring-1 ring-ccjv-green"
                : "bg-white border-ccjv-line hover:border-ccjv-line/80"
            }`}
          >
            <div className="p-2 bg-[#f3f2ee] text-ccjv-ink">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-ccjv-ink block">Automatique</span>
              <span className="text-[11px] text-ccjv-ink-secondary leading-tight block mt-0.5">
                Suit les préférences de votre système
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Notifications administratives */}
      <div className="pt-4 border-t border-ccjv-line space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-ccjv-ink block flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-ccjv-green" />
          <span>Notifications & Alertes administratives</span>
        </label>

        <div className="space-y-2.5">
          <label className="flex items-start gap-3 p-3.5 border border-ccjv-line bg-white hover:bg-[#fafaf7] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPrayer}
              onChange={(e) => setNotifyPrayer(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-ccjv-ink block">
                Nouvelles intentions de prière
              </span>
              <span className="text-[11px] text-ccjv-ink-secondary block">
                Notification transmise aux intercesseurs et pasteurs lors de la soumission d&apos;une requête confidentielle.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 border border-ccjv-line bg-white hover:bg-[#fafaf7] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={notifyTestimony}
              onChange={(e) => setNotifyTestimony(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-ccjv-ink block">
                Nouveaux témoignages soumis
              </span>
              <span className="text-[11px] text-ccjv-ink-secondary block">
                Alerte de modération éditoriale dès qu&apos;un membre soumet un témoignage de grâce.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 border border-ccjv-line bg-white hover:bg-[#fafaf7] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={notifyWeeklyDigest}
              onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-ccjv-ink block">
                Rapport d&apos;activité hebdomadaire
              </span>
              <span className="text-[11px] text-ccjv-ink-secondary block">
                Résumé automatique des publications, nouveaux événements et statistiques chaque lundi matin.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 border border-ccjv-line bg-white hover:bg-[#fafaf7] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={notifySecurityAlerts}
              onChange={(e) => setNotifySecurityAlerts(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-4 w-4"
            />
            <div>
              <span className="text-xs font-semibold text-ccjv-ink block">
                Alertes de sécurité & Connexions administratives
              </span>
              <span className="text-[11px] text-ccjv-ink-secondary block">
                Journalisation des modifications sensibles et nouvelles accréditations de comptes.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
