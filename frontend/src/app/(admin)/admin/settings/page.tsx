"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Shield, Server, LogOut, CheckCircle2 } from "lucide-react";


export default function AdminSettingsPage() {
  const { user, adminProfile, signOut } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ccjv-api-production.up.railway.app";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fcdyqwconmymcznsaykw.supabase.co";

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
      <AdminPageHeader
        title="Paramètres & Profil"
        description="Informations de compte, autorisations de sécurité et statut de l'environnement CCJV."
      />

      {/* Profil de l'utilisateur */}
      <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-6">
        <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-ccjv-green text-white flex items-center justify-center font-bold text-lg font-serif">
              {adminProfile?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <h2 className="text-base font-bold text-ccjv-ink font-sans">
                {adminProfile?.displayName || user?.email?.split("@")[0] || "Administrateur CCJV"}
              </h2>
              <p className="text-xs text-ccjv-ink-secondary">{user?.email}</p>
            </div>
          </div>

          <Badge variant={adminProfile?.role === "ADMIN" ? "default" : "info"} className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {adminProfile?.role === "ADMIN" ? "Administrateur Système" : "Équipe Pastorale"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#fafaf7] border border-ccjv-line space-y-1">
            <span className="text-[10px] uppercase font-bold text-ccjv-ink-secondary">
              Identifiant utilisateur (UUID)
            </span>
            <p className="font-mono text-ccjv-ink truncate">{user?.id || "N/A"}</p>
          </div>

          <div className="p-3.5 bg-[#fafaf7] border border-ccjv-line space-y-1">
            <span className="text-[10px] uppercase font-bold text-ccjv-ink-secondary">
              Rôle d'accréditation
            </span>
            <p className="font-medium text-ccjv-ink">
              {adminProfile?.role || "ADMIN"} (Accès complet)
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="danger" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </div>

      {/* État de l'infrastructure et de l'API */}
      <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-ccjv-green" />
          Environnement & Connectivité API
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 border border-ccjv-line bg-[#fafaf7]">
            <div className="space-y-0.5">
              <span className="font-semibold text-ccjv-ink">Serveur REST Backend (Railway)</span>
              <p className="text-[11px] text-ccjv-ink-secondary font-mono">{apiUrl}</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-[#1e7a1e] font-semibold bg-[#eaf3ea] px-2 py-0.5 border border-[#1e7a1e]/20">
              <CheckCircle2 className="h-3 w-3" /> Connecté
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border border-ccjv-line bg-[#fafaf7]">
            <div className="space-y-0.5">
              <span className="font-semibold text-ccjv-ink">Authentification (Supabase Auth)</span>
              <p className="text-[11px] text-ccjv-ink-secondary font-mono">{supabaseUrl}</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-[#1e7a1e] font-semibold bg-[#eaf3ea] px-2 py-0.5 border border-[#1e7a1e]/20">
              <CheckCircle2 className="h-3 w-3" /> Actif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
