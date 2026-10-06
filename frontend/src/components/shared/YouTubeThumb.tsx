"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Vignette d'une vidéo YouTube.
 *
 * Repli automatique : `maxresdefault` n'existe pas pour toutes les vidéos —
 * en cas d'échec on bascule sur `hqdefault`, toujours disponible.
 * Aucune iframe, aucune vidéo chargée : seule l'image est appelée.
 */
export function YouTubeThumb({
  videoId,
  alt = "",
  sizes = "(max-width: 768px) 100vw, 58vw",
  className,
}: {
  videoId: string;
  alt?: string;
  sizes?: string;
  className?: string;
}) {
  const [quality, setQuality] = useState<"max" | "hq">("max");

  return (
    <Image
      src={`https://i.ytimg.com/vi/${videoId}/${quality === "max" ? "maxresdefault" : "hqdefault"}.jpg`}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setQuality("hq")}
    />
  );
}
