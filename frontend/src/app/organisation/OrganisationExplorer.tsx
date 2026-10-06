"use client";

import { useState } from "react";
import Image from "next/image";
import { type Department } from "@/types";
import { images } from "@/data/mock/images";
import { DepartmentModal } from "./DepartmentModal";

interface OrganisationExplorerProps {
  departments: Department[];
}

export function OrganisationExplorer({ departments }: OrganisationExplorerProps) {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const handleOpenDepartment = (dept: Department) => {
    setSelectedDept(dept);
    window.history.replaceState(null, "", `#${dept.slug}`);
  };

  return (
    <>
      <div className="mt-12 space-y-12">
        {departments.map((dept, idx) => {
          const isReversed = idx % 2 === 1;

          return (
            <div
              key={dept.id}
              id={dept.slug}
              className="group scroll-mt-28 border border-ccjv-line bg-white transition-colors duration-200 hover:border-ccjv-green/40"
            >
              {/* Alias d'ancre pour compatibilité (ex: #ecodim et #enfants-ecodim) */}
              {dept.slug === "enfants-ecodim" && <div id="ecodim" className="scroll-mt-28" />}
              {dept.slug === "adultes" && <div id="adulte" className="scroll-mt-28" />}

              <div
                className={`grid grid-cols-1 items-stretch lg:grid-cols-12 ${
                  isReversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Colonne Image */}
                <div
                  className={`relative min-h-[300px] sm:min-h-[360px] lg:min-h-full lg:col-span-5 ${
                    isReversed ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <Image
                    src={dept.bannerImage ?? images.communaute}
                    alt={dept.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>

                {/* Colonne Contenu */}
                <div
                  className={`flex flex-col justify-between p-8 sm:p-12 lg:col-span-7 ${
                    isReversed ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-serif text-xl text-ccjv-green">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {dept.meetingSchedule && (
                        <span className="font-sans text-xs font-medium text-ccjv-ink-secondary bg-ccjv-cream px-3 py-1 border border-ccjv-line">
                          {dept.meetingSchedule}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-serif text-2xl sm:text-3xl text-ccjv-ink">
                      {dept.name}
                    </h3>

                    {dept.tagline && (
                      <p className="mt-2 font-serif text-base italic text-ccjv-green">
                        {dept.tagline}
                      </p>
                    )}

                    <p className="mt-4 font-sans text-[0.98rem] leading-[1.7] text-ccjv-ink-secondary">
                      {dept.description}
                    </p>

                    {dept.keyPoints && dept.keyPoints.length > 0 && (
                      <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {dept.keyPoints.slice(0, 4).map((pt) => (
                          <li
                            key={pt}
                            className="flex items-start gap-2.5 font-sans text-xs leading-[1.6] text-ccjv-ink-secondary"
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

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ccjv-line pt-6">
                    <div className="font-sans text-xs text-ccjv-ink-secondary">
                      <span className="font-semibold text-ccjv-ink">Responsable : </span>
                      {dept.responsibleName ?? "Coordination collégiale"}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDepartment(dept)}
                      className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-ccjv-green underline decoration-1 underline-offset-4 transition-colors hover:text-ccjv-black cursor-pointer"
                    >
                      Découvrir le département →
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
