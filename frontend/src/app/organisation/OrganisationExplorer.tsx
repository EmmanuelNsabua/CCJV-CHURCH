"use client";

import { useState } from "react";
import Image from "next/image";
import { type Department } from "@/types";
import { images } from "@/data/mock/images";
import { DepartmentModal } from "./DepartmentModal";

interface OrganisationExplorerProps {
  departments: Department[];
}

/**
 * Présentation éditoriale des départements :
 * - Alternance visuelle des compositions (Image Gauche / Texte Droite puis inversement)
 * - Strictement sans arrondis, géométrie CCJV pure
 * - CTA interactif qui ouvre le volet sans rechargement ni changement de page
 * - Synchronisation transparente des ancres (#adultes, #enfants-ecodim, #chorale)
 */
export function OrganisationExplorer({ departments }: OrganisationExplorerProps) {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const handleOpenDepartment = (dept: Department) => {
    setSelectedDept(dept);
    window.history.replaceState(null, "", `#${dept.slug}`);
  };

  return (
    <>
      <div className="mt-14 space-y-16">
        {departments.map((dept, idx) => {
          const isReversed = idx % 2 === 1;

          return (
            <article
              key={dept.id}
              id={dept.slug}
              className="group scroll-mt-28 border border-ccjv-line bg-white transition-[border-color,box-shadow] duration-300 hover:border-ccjv-green/40 hover:shadow-xs"
            >
              {/* Alias d'ancre pour compatibilité (#ecodim, #adultes, etc.) */}
              {dept.slug === "enfants-ecodim" && <div id="ecodim" className="scroll-mt-28" />}
              {dept.slug === "adultes" && <div id="adulte" className="scroll-mt-28" />}

              <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
                {/* Colonne Image de grande taille */}
                <div
                  className={`relative min-h-[300px] sm:min-h-[380px] lg:min-h-full lg:col-span-5 ${
                    isReversed ? "lg:order-2" : "lg:order-1"
                  } bg-ccjv-line`}
                >
                  <Image
                    src={dept.bannerImage ?? images.communaute}
                    alt={dept.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden"
                    aria-hidden="true"
                  />
                </div>

                {/* Colonne Contenu Éditorial */}
                <div
                  className={`flex flex-col justify-between p-8 sm:p-12 lg:col-span-7 ${
                    isReversed ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div>
                    {/* Numérotation & Horaire */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-serif text-2xl font-bold text-ccjv-green">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      {dept.meetingSchedule && (
                        <span className="border border-ccjv-line bg-ccjv-cream px-3 py-1 font-sans text-xs font-medium text-ccjv-ink-secondary">
                          {dept.meetingSchedule}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-serif text-[clamp(1.75rem,1.2rem+1.4vw,2.5rem)] leading-tight text-ccjv-ink">
                      {dept.name}
                    </h3>

                    {dept.tagline && (
                      <p className="mt-2 font-serif text-base italic text-ccjv-green">
                        {dept.tagline}
                      </p>
                    )}

                    <p className="mt-5 font-sans text-[0.98rem] leading-[1.75] text-ccjv-ink-secondary">
                      {dept.description}
                    </p>

                    {/* Piliers et actions clés */}
                    {dept.keyPoints && dept.keyPoints.length > 0 && (
                      <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {dept.keyPoints.slice(0, 4).map((pt) => (
                          <li
                            key={pt}
                            className="flex items-start gap-2.5 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary"
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ccjv-green"
                              aria-hidden="true"
                            />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Pied de carte : Responsable & CTA d'exploration */}
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ccjv-line pt-6">
                    <div className="font-sans text-xs text-ccjv-ink-secondary">
                      <span className="font-semibold text-ccjv-ink">Responsable : </span>
                      {dept.responsibleName ?? "Coordination d'équipe"}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDepartment(dept)}
                      className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink uppercase transition-colors hover:text-ccjv-green cursor-pointer"
                    >
                      <span>Découvrir le département</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Volet contextuel interactif (Drawer) */}
      <DepartmentModal
        departments={departments}
        selectedDepartment={selectedDept}
        onClose={() => setSelectedDept(null)}
        onSelect={(dept) => setSelectedDept(dept)}
      />
    </>
  );
}
