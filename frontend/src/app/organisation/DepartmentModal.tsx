"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { type Department } from "@/types";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";

interface DepartmentModalProps {
  departments: Department[];
  selectedDepartment: Department | null;
  onClose: () => void;
  onSelect: (dept: Department) => void;
}

/**
 * Volet contextuel (Drawer) de présentation détaillée d'un département :
 * - S'ouvre sur la page /organisation sans naviguer vers une autre route
 * - Restitue photo, accroche, description, rythme de rencontre, responsable,
 *   piliers et galerie tels que l'API les fournit
 * - Supporte la navigation au clavier (Escape), le verrouillage du scroll et les ancres d'URL
 *
 * Chaque bloc n'est rendu que lorsque son champ existe côté API : un champ
 * absent (`undefined`) fait disparaître le bloc, il n'est jamais remplacé par
 * une valeur de démonstration.
 */
export function DepartmentModal({
  departments,
  selectedDepartment,
  onClose,
  onSelect,
}: DepartmentModalProps) {
  const [activeDept, setActiveDept] = useState<Department | null>(selectedDepartment);

  useEffect(() => {
    setActiveDept(selectedDepartment);
  }, [selectedDepartment]);

  // Écoute de l'ancre URL au chargement et au changement de hash (#adultes, #ecodim, #enfants-ecodim, #chorale)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (!hash) return;

      const found = departments.find(
        (d) =>
          d.slug.toLowerCase() === hash ||
          (hash === "ecodim" && d.slug.includes("ecodim")) ||
          (hash === "adultes" && d.slug.includes("adultes")) ||
          (hash === "chorale" && d.slug.includes("chorale")),
      );

      if (found) {
        setActiveDept(found);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [departments]);

  // Verrouillage du défilement lorsque le volet est ouvert
  useEffect(() => {
    if (!activeDept) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDept]);

  const handleClose = () => {
    setActiveDept(null);
    onClose();
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  if (!activeDept) return null;

  const whatsappMessage = encodeURIComponent(
    `Bonjour Centre Chrétien Jésus ma Vie, je souhaite obtenir des informations pour participer ou rejoindre le département « ${activeDept.name} ».`,
  );
  const whatsappUrl = `${site.whatsappHref}?text=${whatsappMessage}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-modal-title"
      className="fixed inset-0 z-50 flex justify-end bg-ccjv-black/70 backdrop-blur-xs transition-opacity duration-300"
      onClick={handleClose}
    >
      {/* Conteneur du Volet / Drawer Éditorial */}
      <div
        className="relative flex h-full w-full max-w-2xl flex-col justify-between overflow-y-auto bg-ccjv-offwhite text-ccjv-ink shadow-2xl transition-transform duration-300 sm:border-l sm:border-ccjv-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête fixe avec bouton de fermeture */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ccjv-line bg-ccjv-offwhite/95 px-6 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-ccjv-green" aria-hidden="true" />
            <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              Département CCJV
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="group flex items-center gap-2 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase transition-colors hover:text-ccjv-ink cursor-pointer"
            aria-label="Fermer la fiche"
          >
            <span>Fermer</span>
            <span className="flex h-7 w-7 items-center justify-center border border-ccjv-line bg-white text-base transition-colors group-hover:border-ccjv-ink">
              ✕
            </span>
          </button>
        </div>

        {/* Contenu éditorial défilant */}
        <div className="flex-1 px-6 py-8 sm:px-10 sm:py-10">
          {/* Image de bannière du département */}
          {activeDept.bannerImage && (
            <div className="relative mb-8 aspect-16/9 w-full overflow-hidden border border-ccjv-line bg-ccjv-cream">
              <Image
                src={activeDept.bannerImage}
                alt={activeDept.name}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Titre & Accroche */}
          <h2
            id="dept-modal-title"
            className="font-serif text-[clamp(1.8rem,1.4rem+1.8vw,2.8rem)] leading-[1.12] text-ccjv-ink"
          >
            {activeDept.name}
          </h2>

          {activeDept.tagline && (
            <p className="mt-2 font-serif text-lg italic text-ccjv-green">
              {activeDept.tagline}
            </p>
          )}

          {/* Vocation / Description */}
          {activeDept.description && (
            <div className="mt-6 font-sans text-[1.02rem] leading-[1.75] text-ccjv-ink-secondary">
              <p>{activeDept.description}</p>
            </div>
          )}

          {/* Repères essentiels (Horaires, Responsable, Adresse) */}
          <div className="mt-8 border-y border-ccjv-line py-6">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {activeDept.meetingSchedule && (
                <div>
                  <dt className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                    Rythme & Horaires
                  </dt>
                  <dd className="mt-1 font-sans text-sm text-ccjv-ink">
                    {activeDept.meetingSchedule}
                  </dd>
                </div>
              )}

              {activeDept.responsibleName && (
                <div>
                  <dt className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                    Responsable
                  </dt>
                  <dd className="mt-1 font-sans text-sm text-ccjv-ink">
                    {activeDept.responsibleName}
                  </dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                  Lieu de rassemblement
                </dt>
                <dd className="mt-1 font-sans text-sm text-ccjv-ink-secondary">
                  {site.address}
                </dd>
              </div>
            </dl>
          </div>

          {/* Ce qui structure ce département / Piliers */}
          {activeDept.keyPoints && activeDept.keyPoints.length > 0 && (
            <div className="mt-8">
              <h3 className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Ce qui structure ce département
              </h3>
              <ul className="mt-4 space-y-3">
                {activeDept.keyPoints.map((point, pIdx) => (
                  <li
                    key={point}
                    className="flex items-start gap-3.5 border-b border-ccjv-line/60 pb-3 text-[0.95rem] leading-relaxed text-ccjv-ink-secondary"
                  >
                    <span className="font-serif text-sm font-bold text-ccjv-green">
                      {String(pIdx + 1).padStart(2, "0")}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Galerie d'ambiance */}
          {activeDept.gallery && activeDept.gallery.length > 0 && (
            <div className="mt-10">
              <h3 className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                La vie en images
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activeDept.gallery.slice(0, 6).map((imgUrl, gIdx) => (
                  <div
                    key={imgUrl + gIdx}
                    className="relative aspect-4/3 overflow-hidden border border-ccjv-line bg-ccjv-line"
                  >
                    <Image
                      src={imgUrl}
                      alt={`${activeDept.name} — photo ${gIdx + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment participer */}
          <div className="mt-10 border-t border-ccjv-line pt-8">
            <h3 className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Participer à ce département
            </h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
              Pour vous intégrer ou poser vos questions, écrivez-nous ou
              adressez-vous directement à l&apos;équipe d&apos;accueil lors de votre venue.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Button variant="primary" href={whatsappUrl} external>
                Écrire au sujet de ce département
              </Button>
            </div>
          </div>

          {/* Commutateur rapide vers un autre département */}
          <div className="mt-12 border-t border-ccjv-line pt-6">
            <p className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
              Explorer un autre département :
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {departments
                .filter((d) => d.id !== activeDept.id)
                .map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelect(d)}
                    className="border border-ccjv-line bg-white px-3.5 py-1.5 font-sans text-xs font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green cursor-pointer"
                  >
                    {d.name} →
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
