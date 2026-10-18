"use client";

import { useState } from "react";
import { Mic, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeachingMediaRecord } from "@/lib/api/types";

/**
 * Lecteur d'un média audio ou vidéo d'enseignement.
 *
 * Contraintes tenues ici :
 * - la source est **celle du média central** (`media.url`), jamais une URL
 *   codée en dur ni une référence de démonstration ;
 * - aucun chargement automatique : le visiteur décide de lancer la lecture
 *   (bande passante limitée, cf. `docs/006` §22) ;
 * - un fichier absent, un codec non pris en charge ou une URL expirée
 *   n'emporte **pas** la page : le lecteur bascule sur un message lisible et un
 *   lien direct vers le fichier ;
 * - le lecteur est nommé pour les technologies d'assistance.
 *
 * Le modèle métier ne porte pas de piste de sous-titres : aucun `<track>` n'est
 * donc inventé ici.
 */
export interface TeachingMediaPlayerProps {
  readonly media: TeachingMediaRecord;
  /** Titre de l'enseignement, pour nommer le lecteur. */
  readonly title: string;
  readonly className?: string;
}

function UnavailableMedia({ url }: { url?: string }) {
  return (
    <div className="border border-ccjv-line bg-ccjv-offwhite px-5 py-6 text-center">
      <p className="font-sans text-[0.9rem] text-ccjv-ink">
        Ce média n&apos;a pas pu être chargé.
      </p>
      <p className="mt-1.5 font-sans text-[0.8rem] leading-relaxed text-ccjv-ink-secondary">
        Le fichier est peut-être momentanément indisponible. Vous pouvez réessayer
        dans un instant.
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-sans text-[0.8rem] font-medium text-ccjv-green underline underline-offset-4 hover:text-ccjv-green-strong"
        >
          Ouvrir le fichier dans un nouvel onglet
          <span aria-hidden="true"> ↗</span>
        </a>
      )}
    </div>
  );
}

export function TeachingMediaPlayer({
  media,
  title,
  className,
}: TeachingMediaPlayerProps) {
  const [failed, setFailed] = useState(false);

  if (!media.url || failed) {
    return (
      <div className={className}>
        <UnavailableMedia url={media.url} />
      </div>
    );
  }

  if (media.role === "VIDEO") {
    return (
      <div
        className={cn("overflow-hidden border border-ccjv-line bg-ccjv-black", className)}
      >
        <video
          controls
          preload="metadata"
          src={media.url}
          aria-label={`Vidéo — ${title}`}
          onError={() => setFailed(true)}
          className="block max-h-[32rem] w-full bg-ccjv-black"
        >
          Votre navigateur ne prend pas en charge la lecture vidéo.{" "}
          <a href={media.url}>Ouvrir le fichier</a>
        </video>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-ccjv-line bg-ccjv-offwhite px-5 py-6 sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-ccjv-green/30 bg-ccjv-green-soft text-ccjv-green"
        >
          <Mic className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-sans text-[0.8rem] font-semibold tracking-[0.12em] text-ccjv-green uppercase">
            Enregistrement audio
          </p>
          <p className="truncate font-sans text-[0.9rem] text-ccjv-ink">
            {media.alt?.trim() || title}
          </p>
        </div>
      </div>

      <audio
        controls
        preload="metadata"
        src={media.url}
        aria-label={`Audio — ${title}`}
        onError={() => setFailed(true)}
        className="mt-4 w-full"
      >
        Votre navigateur ne prend pas en charge la lecture audio.{" "}
        <a href={media.url}>Ouvrir le fichier</a>
      </audio>
    </div>
  );
}

/** Pastille « disponible en vidéo / audio », jamais affichée sans média réel. */
export function MediaAvailabilityBadge({
  role,
  className,
}: {
  readonly role: "VIDEO" | "AUDIO";
  readonly className?: string;
}) {
  const Icon = role === "VIDEO" ? Video : Mic;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-ccjv-line bg-ccjv-offwhite px-2 py-1 font-sans text-[0.7rem] font-medium tracking-[0.06em] text-ccjv-ink-secondary uppercase",
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-ccjv-green" />
      {role === "VIDEO" ? "Vidéo" : "Audio"}
    </span>
  );
}
