"use client";

import { useState } from "react";
import { CrossMark } from "@/components/shared/CrossMark";
import { site } from "@/data/mock/site";

export function PrayerRequestForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [request, setRequest] = useState("");
  const [confidentiality, setConfidentiality] = useState<"private" | "community">("private");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setSubmitting(true);
    // Simulation d'envoi fluide et asynchrone
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setName("");
    setContact("");
    setRequest("");
    setConfidentiality("private");
    setSubmitted(false);
  };

  const whatsappPrefilledHref = `${site.whatsappHref}?text=${encodeURIComponent(
    `Bonjour Centre Chrétien Jésus ma Vie,\nJe souhaite vous confier une intention de prière :\n\n${
      name ? `De la part de : ${name}\n` : ""
    }${request ? `Demande : ${request}` : "Je préfère vous écrire directement ici."}`,
  )}`;

  if (submitted) {
    return (
      <div className="border border-ccjv-line bg-white p-8 md:p-12 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-ccjv-green/30 bg-ccjv-green/10 text-ccjv-green">
          <CrossMark size="md" />
        </div>

        <h3 className="font-serif text-2xl md:text-3xl font-normal text-ccjv-ink">
          Votre demande a bien été reçue.
        </h3>

        <p className="mt-4 mx-auto max-w-[50ch] font-sans text-base leading-relaxed text-ccjv-ink-secondary">
          Merci de nous accorder votre confiance. Notre équipe d&apos;intercession
          la portera fidèlement dans la prière dès aujourd&apos;hui.
        </p>

        <p className="mt-4 font-serif text-base italic text-ccjv-green">
          « Que la paix de Dieu, qui surpasse toute intelligence, garde votre
          cœur et vos pensées. »
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-11 items-center justify-center border border-ccjv-line bg-ccjv-offwhite px-6 font-sans text-xs font-semibold tracking-wider text-ccjv-ink uppercase transition-colors hover:border-ccjv-green hover:text-ccjv-green"
          >
            Déposer une autre demande
          </button>
          <a
            href={whatsappPrefilledHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center border border-ccjv-green bg-ccjv-green px-6 font-sans text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-ccjv-green-dark"
          >
            Confirmer sur WhatsApp →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-ccjv-line bg-white p-6 sm:p-10 md:p-12"
    >
      <div className="space-y-6">
        {/* Champ Demande de prière (Principal) */}
        <div>
          <label
            htmlFor="prayer-request"
            className="block font-sans text-xs font-semibold tracking-wider text-ccjv-ink uppercase"
          >
            Votre intention de prière <span className="text-ccjv-green">*</span>
          </label>
          <p className="mt-1 font-sans text-xs text-ccjv-ink-secondary">
            Quelques mots suffisent. Écrivez simplement ce que vous vivez ou ce
            pour quoi vous souhaitez que nous priions.
          </p>
          <textarea
            id="prayer-request"
            required
            rows={5}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Écrivez votre demande ici..."
            className="mt-2.5 block w-full rounded-none border border-ccjv-line bg-ccjv-offwhite/50 p-4 font-sans text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 focus:border-ccjv-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-ccjv-green"
          />
        </div>

        {/* Ligne Prénom & Contact */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prayer-name"
              className="block font-sans text-xs font-semibold tracking-wider text-ccjv-ink uppercase"
            >
              Votre prénom ou nom (facultatif)
            </label>
            <input
              type="text"
              id="prayer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Laissez vide pour rester anonyme"
              className="mt-2 block w-full rounded-none border border-ccjv-line bg-ccjv-offwhite/50 px-4 py-3 font-sans text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 focus:border-ccjv-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-ccjv-green"
            />
          </div>

          <div>
            <label
              htmlFor="prayer-contact"
              className="block font-sans text-xs font-semibold tracking-wider text-ccjv-ink uppercase"
            >
              WhatsApp ou téléphone (facultatif)
            </label>
            <input
              type="text"
              id="prayer-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Pour un message d'encouragement"
              className="mt-2 block w-full rounded-none border border-ccjv-line bg-ccjv-offwhite/50 px-4 py-3 font-sans text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 focus:border-ccjv-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-ccjv-green"
            />
          </div>
        </div>

        {/* Options de confidentialité */}
        <div className="border-t border-ccjv-line pt-6">
          <label className="block font-sans text-xs font-semibold tracking-wider text-ccjv-ink uppercase">
            Confidentialité de votre demande
          </label>
          <div className="mt-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="confidentiality"
                value="private"
                checked={confidentiality === "private"}
                onChange={() => setConfidentiality("private")}
                className="mt-0.5 h-4 w-4 text-ccjv-green border-ccjv-line focus:ring-ccjv-green rounded-none"
              />
              <span className="font-sans text-xs sm:text-sm text-ccjv-ink">
                <strong>Confidentiel :</strong> Partagé strictement avec l&apos;équipe
                pastorale d&apos;intercession.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="confidentiality"
                value="community"
                checked={confidentiality === "community"}
                onChange={() => setConfidentiality("community")}
                className="mt-0.5 h-4 w-4 text-ccjv-green border-ccjv-line focus:ring-ccjv-green rounded-none"
              />
              <span className="font-sans text-xs sm:text-sm text-ccjv-ink">
                <strong>Porter en assemblée :</strong> Mentionnée lors des temps de
                prière communautaires (sans nom de famille).
              </span>
            </label>
          </div>
        </div>

        {/* Engagement de sécurité et discrétion */}
        <div className="bg-ccjv-offwhite p-4 text-xs font-sans text-ccjv-ink-secondary leading-relaxed border-l-2 border-ccjv-green">
          <strong className="text-ccjv-ink">Engagement CCJV :</strong> Votre
          demande ne sera jamais publiée sur Internet ni sur les réseaux
          sociaux. Le respect de votre vie privée et de votre dignité est
          absolu.
        </div>

        {/* Bouton d'action principal */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !request.trim()}
            className="inline-flex w-full h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Transmission en cours..." : "Transmettre ma demande de prière"}
          </button>
        </div>
      </div>
    </form>
  );
}
