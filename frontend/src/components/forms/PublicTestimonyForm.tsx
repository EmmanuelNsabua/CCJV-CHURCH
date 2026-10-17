"use client";

import React, { useState } from "react";
import { CrossMark } from "@/components/shared/CrossMark";
import { Button } from "@/components/ui/Button";
import { submitPublicTestimony } from "@/lib/api";

export function PublicTestimonyForm() {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!content.trim()) {
      setErrorMessage("Veuillez partager le récit de votre témoignage.");
      return;
    }

    if (!consent) {
      setErrorMessage(
        "Vous devez accepter la modération et la publication éventuelle pour soumettre votre témoignage.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPublicTestimony({
        authorName: isAnonymous ? null : authorName.trim() || null,
        content: content.trim(),
        isAnonymous,
        consent,
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'envoi de votre témoignage. Veuillez réessayer.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAuthorName("");
    setContent("");
    setIsAnonymous(false);
    setConsent(false);
    setIsSubmitted(false);
    setErrorMessage(null);
  };

  if (isSubmitted) {
    return (
      <div className="border border-ccjv-line bg-white p-8 sm:p-12 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-ccjv-green/30 bg-ccjv-green/10 text-ccjv-green">
          <CrossMark size="md" />
        </div>
        <h3 className="font-serif text-2xl text-ccjv-ink">
          Merci pour votre témoignage
        </h3>
        <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary max-w-md mx-auto">
          Votre récit a bien été transmis à l&apos;équipe pastorale. Après révision
          et modération, il pourra être publié pour encourager et fortifier
          l&apos;assemblée.
        </p>
        <div className="mt-8">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Partager un autre témoignage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-ccjv-line bg-white p-6 sm:p-10 space-y-6"
    >
      <div className="border-b border-ccjv-line pb-4">
        <h3 className="font-serif text-xl sm:text-2xl text-ccjv-ink">
          Partager ce que Dieu a fait
        </h3>
        <p className="mt-1 font-sans text-xs sm:text-sm text-ccjv-ink-secondary">
          Un témoignage vivant édifie toute l&apos;église. Racontez une délivrance,
          une guérison, une provision ou une grâce reçue.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Case anonyme */}
      <div className="p-3 bg-ccjv-offwhite border border-ccjv-line">
        <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-ccjv-ink">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded-none accent-ccjv-green focus:outline-ccjv-green cursor-pointer"
          />
          <span>
            Je souhaite que ce témoignage reste <strong>anonyme</strong> lors de sa publication.
          </span>
        </label>
      </div>

      {/* Nom du témoin si non anonyme */}
      {!isAnonymous && (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-ccjv-ink">
            Votre nom complet ou prénom
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Ex. Sœur Dorcas"
            className="w-full border border-ccjv-line bg-white px-3.5 py-2.5 text-xs text-ccjv-ink focus:border-ccjv-green focus:outline-2 focus:outline-ccjv-green"
          />
        </div>
      )}

      {/* Récit du témoignage */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-ccjv-ink">
          Votre témoignage <span className="text-ccjv-green">*</span>
        </label>
        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Racontez simplement ce que le Seigneur a accompli dans votre vie..."
          required
          className="w-full border border-ccjv-line bg-white p-3.5 text-xs text-ccjv-ink leading-relaxed focus:border-ccjv-green focus:outline-2 focus:outline-ccjv-green"
        />
      </div>

      {/* Consentement obligatoire */}
      <div className="pt-2 border-t border-ccjv-line">
        <label className="flex items-start gap-3 cursor-pointer text-xs text-ccjv-ink-secondary leading-normal">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded-none accent-ccjv-green focus:outline-ccjv-green cursor-pointer"
          />
          <span>
            J&apos;autorise l&apos;équipe pastorale du Centre Chrétien Jésus ma Vie
            à modérer et éventuellement publier ce témoignage pour
            l&apos;édification publique des fidèles. <span className="text-ccjv-green">*</span>
          </span>
        </label>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full justify-center font-semibold text-xs uppercase tracking-wider"
          disabled={isSubmitting || !consent || !content.trim()}
        >
          {isSubmitting ? "Transmission en cours..." : "Transmettre mon témoignage"}
        </Button>
      </div>
    </form>
  );
}
