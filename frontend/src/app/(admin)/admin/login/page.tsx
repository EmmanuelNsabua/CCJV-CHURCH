"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Check } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        router.replace("/admin");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Une erreur inattendue est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex flex-col md:flex-row selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          BLOC GAUCHE (~30% de l'écran) : Image en lévitation avec padding
          Ne touche pas les limites de l'écran pour donner l'impression d'être posée.
          Contient le bouton retour en haut à gauche et un texte sobre en bas à gauche.
         ========================================================================= */}
      <div className="hidden md:flex md:w-[48%] lg:w-[40%] shrink-0 h-full p-2 lg:p-3 flex-col">
        <div className="relative h-full w-full overflow-hidden border border-ccjv-line rounded-none bg-[#121212] flex flex-col justify-between p-6 lg:p-8">
          {/* Image d'ambiance avec traitement monochrome élégant */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/media/ccjv-02.jpeg"
              alt="Centre Chrétien Jésus ma Vie — Lubumbashi"
              fill
              priority
              className="object-cover grayscale contrast-125 brightness-[0.55]"
            />
            {/* Voile sombre pour garantir la lisibilité du texte et du bouton */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
          </div>

          {/* Coin supérieur gauche : Bouton retour encadré avec fond semi-transparent (70%) */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-black/70 hover:bg-black/90 text-white border border-white/20 text-xs font-sans rounded-none transition-colors backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour au site</span>
            </Link>
          </div>

          {/* Coin inférieur gauche : Texte sobre et affirmé (aucun bruit parasite) */}
          <div className="relative z-10 space-y-2">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
              Bâtir fidèlement la maison de Dieu.
            </h2>
            <p className="font-sans text-xs lg:text-sm text-white/80 leading-relaxed">
              Ministère pastoral et intendance administrative du CCJV.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ÉCRAN DE DROITE (~70% de l'écran) : Espace épuré et centré
          Accueille le formulaire avec une respiration maximale et zéro cliché parasite.
         ========================================================================= */}
      <div className="flex-1 md:w-[58%] lg:w-[60%] h-full flex flex-col justify-center items-center px-6 sm:px-14 lg:px-24 overflow-y-auto bg-white">
        {/* Lien de retour mobile (visible uniquement sur petits écrans où le bloc gauche est masqué) */}
        <div className="w-full max-w-[420px] mb-6 md:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-sans text-ccjv-ink-secondary hover:text-ccjv-green transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour au site public</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-8 my-auto py-8">
          {/* Titre & sous-titre nets */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ccjv-ink tracking-tight">
              Connexion
            </h1>
            <p className="text-sm text-ccjv-ink-secondary font-sans leading-relaxed">
              Bienvenue ! Veuillez renseigner vos identifiants pour continuer.
            </p>
          </div>

          {/* Alerte d'erreur accessible */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs font-sans flex items-start gap-2.5 rounded-none"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#b91c1c]" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Formulaire de connexion épuré */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Champ Adresse e-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-sans font-medium text-ccjv-ink"
              >
                Adresse e-mail
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@ccjv.org"
                disabled={isLoading}
                className="w-full h-11 px-3.5 bg-white border border-ccjv-line rounded-none text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/40 focus:border-ccjv-green focus:outline-2 focus:outline-ccjv-green focus:outline-offset-1 transition-colors"
              />
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-sans font-medium text-ccjv-ink"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-sans text-ccjv-ink-secondary hover:text-ccjv-green transition-colors focus-visible:outline-2 focus-visible:outline-ccjv-green cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full h-11 pl-3.5 pr-10 bg-white border border-ccjv-line rounded-none text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/40 focus:border-ccjv-green focus:outline-2 focus:outline-ccjv-green focus:outline-offset-1 transition-colors font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-0 inset-y-0 px-3 flex items-center justify-center text-ccjv-ink-secondary hover:text-ccjv-ink transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Case à cocher "Rester connecté" */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((prev) => !prev)}
                className="flex h-4 w-4 shrink-0 items-center justify-center border border-ccjv-line rounded-none bg-white focus-visible:outline-2 focus-visible:outline-ccjv-green cursor-pointer transition-colors"
              >
                {rememberMe && <Check className="h-3 w-3 text-ccjv-green stroke-[3]" />}
              </button>
              <label
                onClick={() => setRememberMe((prev) => !prev)}
                className="text-xs font-sans text-ccjv-ink-secondary select-none cursor-pointer"
              >
                Rester connecté sur cet appareil
              </label>
            </div>

            {/* Bouton de connexion plein (noir sobre) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[#121212] hover:bg-ccjv-green text-white font-sans text-sm font-medium rounded-none transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-ccjv-green"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin border-2 border-white border-r-transparent rounded-full" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <span>Se connecter</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modale d'information "Mot de passe oublié" */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md bg-white border border-ccjv-line p-6 rounded-none space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-ccjv-green">
              <Lock className="h-5 w-5" />
              <h3 className="font-serif text-lg font-bold text-ccjv-ink">
                Récupération des accès
              </h3>
            </div>
            <p className="text-xs text-ccjv-ink-secondary leading-relaxed font-sans">
              Pour des motifs de stricte sécurité et de souveraineté des données ecclésiales,
              la réinitialisation de mot de passe est gérée directement par le Super Administrateur
              du système.
            </p>
            <div className="p-3 bg-ccjv-offwhite border border-ccjv-line text-xs font-sans text-ccjv-ink space-y-1">
              <p className="font-semibold text-ccjv-ink">Contact administratif interne :</p>
              <p className="text-ccjv-ink-secondary font-mono text-[11px]">
                support-admin@ccjv.local · pasteur@ccjv.org
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-[#121212] hover:bg-ccjv-green text-white text-xs font-medium rounded-none transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
