"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CrossMark } from "./CrossMark";
import type { CommunityFace } from "@/data/mock/community";

/**
 * Section « Communauté » — scrollytelling.
 *
 * **Desktop** : colonne de droite = les portraits défilent verticalement
 * (coins droits, pleine largeur de colonne) ; colonne de gauche = légende
 * **sticky** (nom + courte description) qui reste fixe pendant le défilement
 * et change doucement à chaque image (fondu + glissement, cf. `.face-caption`).
 *
 * **Mobile** : composition indépendante (§37) — liste verticale où chaque
 * visage porte directement sa légende, sans sticky.
 *
 * Détection de l'image active par `IntersectionObserver` sur une bande
 * centrale du viewport : pas d'écouteur de scroll, aucun calcul par frame.
 */
export function CommunityFaces({ faces }: { faces: CommunityFace[] }) {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter(
      (node): node is HTMLDivElement => node !== null,
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      // Bande étroite au centre de l'écran : une seule image active à la fois.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const current = faces[active];

  return (
    <>
      {/* ---------- Desktop : sticky scroll ---------- */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-12 lg:gap-16">
        {/* Légende sticky */}
        <div>
          <div className="sticky top-[calc(68px+7vh)] flex min-h-[72vh] flex-col justify-center">
            <CrossMark size="md" className="text-ccjv-green" />

            {current && (
              <div key={current.id} className="face-caption mt-8">
                <p className="font-serif text-[clamp(2rem,1rem+2.6vw,3.25rem)] leading-[1.1]">
                  {current.name}
                </p>
                <p className="lead mt-5 max-w-[34ch]">{current.caption}</p>
              </div>
            )}

            {/* Progression */}
            <ol className="mt-12 flex items-center gap-2">
              {faces.map((face, index) => (
                <li key={face.id}>
                  <span
                    className={cn(
                      "block h-[3px] transition-all duration-[400ms] ease-ccjv",
                      index === active
                        ? "w-10 bg-ccjv-green"
                        : "w-4 bg-ccjv-line",
                    )}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Portraits qui défilent */}
        <div className="flex flex-col gap-10">
          {faces.map((face, index) => (
            <div
              key={face.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              data-index={index}
              className="relative h-[72vh] w-full overflow-hidden bg-ccjv-line"
            >
              <Image
                src={face.photo}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Mobile : liste verticale ---------- */}
      <ul className="flex flex-col gap-12 md:hidden">
        {faces.map((face) => (
          <li key={face.id}>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-ccjv-line">
              <Image
                src={face.photo}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <p className="mt-5 font-serif text-[1.6rem] leading-tight">
              {face.name}
            </p>
            <p className="mt-2 text-ccjv-ink-secondary">{face.caption}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
