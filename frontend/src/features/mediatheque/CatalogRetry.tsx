"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Bouton « Réessayer » de la Médiathèque.
 *
 * La lecture des médias se fait côté serveur : recharger la page est le seul
 * moyen fidèle de retenter l'appel. `router.refresh()` réexécute le rendu serveur
 * **sans** perdre la position de défilement ni l'historique, contrairement à un
 * `location.reload()`.
 */
export function CatalogRetry() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attempt, setAttempt] = useState(0);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setAttempt((value) => value + 1);
        startTransition(() => router.refresh());
      }}
      className="inline-flex h-11 items-center border border-ccjv-ink px-6 font-sans text-[0.82rem] font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green disabled:cursor-wait disabled:opacity-60"
      aria-live="polite"
    >
      {isPending
        ? "Nouvelle tentative…"
        : attempt > 0
          ? "Réessayer à nouveau"
          : "Réessayer"}
    </button>
  );
}
