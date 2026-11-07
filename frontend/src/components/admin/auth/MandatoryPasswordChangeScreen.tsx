"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { changeOwnPassword } from "@/lib/api/endpoints";
import { getSupabaseClient } from "@/lib/supabase/client";

interface MandatoryPasswordChangeScreenProps {
  onSuccess: () => void;
}

export function MandatoryPasswordChangeScreen({
  onSuccess,
}: MandatoryPasswordChangeScreenProps) {
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPassword = newPassword.trim();
    if (trimmedPassword.length < 8) {
      setError("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (trimmedPassword !== confirmPassword.trim()) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Mise à jour via l'API REST Express
      await changeOwnPassword(trimmedPassword);

      // 2. Mise à jour directe de la session Supabase et réinitialisation de mustChangePassword
      const supabase = getSupabaseClient();
      await supabase.auth.updateUser({
        password: trimmedPassword,
        data: { mustChangePassword: false },
      });

      onSuccess();
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement de votre nouveau mot de passe. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ccjv-offwhite p-4">
      <div className="w-full max-w-md border border-ccjv-line bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 pb-4 border-b border-ccjv-line">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ccjv-green text-white font-serif font-bold text-sm">
            C
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-ccjv-ink">
              Changement de mot de passe obligatoire
            </h2>
            <p className="font-sans text-[11px] text-ccjv-ink-secondary">
              Première connexion au portail CCJV
            </p>
          </div>
        </div>

        <div className="mt-4 border border-ccjv-line bg-ccjv-offwhite/80 p-3.5 text-xs text-ccjv-ink-secondary leading-relaxed">
          <span className="font-semibold text-ccjv-ink block mb-1">Sécurité de votre compte :</span>
          Vous êtes connecté avec un mot de passe temporaire par défaut. Pour protéger l&apos;accès à votre compte, vous devez définir votre propre mot de passe avant d&apos;accéder aux écrans du back-office.
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="border border-[#b91c1c]/30 bg-[#fef2f2] p-3 text-xs text-[#b91c1c] leading-relaxed">
              {error}
            </div>
          )}

          <div>
            <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
              Nouveau mot de passe <span className="text-[#b91c1c]">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                required
                minLength={8}
                className="h-10 w-full border border-ccjv-line bg-white pl-3 pr-10 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
              />
              <button
                type="button"
                aria-label={showNew ? "Masquer" : "Afficher"}
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ccjv-ink-secondary hover:text-ccjv-ink p-1 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
              Confirmer le mot de passe <span className="text-[#b91c1c]">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                required
                minLength={8}
                className="h-10 w-full border border-ccjv-line bg-white pl-3 pr-10 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
              />
              <button
                type="button"
                aria-label={showConfirm ? "Masquer" : "Afficher"}
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ccjv-ink-secondary hover:text-ccjv-ink p-1 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || newPassword.trim().length < 8}
              className="w-full h-10 bg-ccjv-green font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ccjv-green-strong disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? "Enregistrement…" : "Enregistrer et continuer"}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-3 border-t border-ccjv-line text-center">
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-xs text-ccjv-ink-secondary hover:text-[#b91c1c] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

