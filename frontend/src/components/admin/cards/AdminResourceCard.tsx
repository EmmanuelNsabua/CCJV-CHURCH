"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Archive, Pencil, Trash2, Calendar, ExternalLink } from "lucide-react";
import { cn, formatLongDate } from "@/lib/utils";

export interface AdminResourceCardProps {
  id: string;
  name: string;
  file: string;
  description?: string | null;
  createdAt?: string;
  coverUrl?: string | null;
  departmentName?: string | null;
  isArchived?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
  editHref?: string;
  detailHref?: string;
  className?: string;
}

export function AdminResourceCard({
  id,
  name,
  file,
  description,
  createdAt,
  coverUrl,
  departmentName,
  isArchived = false,
  onArchive,
  onDelete,
  editHref,
  detailHref,
  className,
}: AdminResourceCardProps) {
  // Troncature sécurisée du titre à 55 caractères max
  const maxTitleLength = 55;
  const cleanTitle = name?.trim() || "Sans titre";
  const displayTitle =
    cleanTitle.length > maxTitleLength
      ? cleanTitle.slice(0, maxTitleLength).trim() + "…"
      : cleanTitle;

  // Détection propre du type de document (PDF, ePUB, etc.)
  const fileExtension = useMemo(() => {
    if (!file) return "PDF";
    const clean = file.split("?")[0].toLowerCase();
    if (clean.endsWith(".epub")) return "ePUB";
    if (clean.endsWith(".docx") || clean.endsWith(".doc")) return "DOCX";
    if (clean.endsWith(".xlsx") || clean.endsWith(".xls")) return "XLSX";
    return "PDF";
  }, [file]);

  const targetHref = detailHref || editHref || `/admin/ressources/${id}`;

  const formattedDate = useMemo(() => {
    if (!createdAt) return null;
    return formatLongDate(createdAt.slice(0, 10));
  }, [createdAt]);

  return (
    <article
      className={cn(
        "group relative flex flex-col sm:flex-row items-stretch bg-white border border-ccjv-line rounded-none overflow-hidden transition-all duration-200 hover:border-ccjv-green/60 hover:shadow-xs",
        isArchived && "opacity-85 bg-neutral-50/70",
        className,
      )}
    >
      {/* =========================================================================
          01 — ZONE GAUCHE : MINIATURE / APERÇU OU ICÔNE DOCUMENT
         ========================================================================= */}
      <div className="relative w-full sm:w-28 md:w-32 shrink-0 aspect-[16/10] sm:aspect-auto min-h-[100px] bg-gradient-to-br from-[#f8f7f4] to-[#ebe7de] border-b sm:border-b-0 sm:border-r border-ccjv-line flex flex-col items-center justify-center p-3 select-none">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, 130px"
            className="object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 flex items-center justify-center bg-white border border-ccjv-line/80 shadow-2xs text-ccjv-green">
              <FileText className="h-5 w-5 stroke-[1.75]" />
            </div>
            <span className="mt-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-ccjv-green/10 text-ccjv-green border border-ccjv-green/20 rounded-none">
              {fileExtension}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          02 — ZONE DROITE : INFORMATIONS & ACTIONS D'ADMINISTRATION
         ========================================================================= */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">
        {/* Entête : Titre & Boutons d'actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={targetHref}
              className="font-serif text-base sm:text-lg font-bold text-ccjv-ink hover:text-ccjv-green transition-colors leading-snug line-clamp-2 block"
              title={cleanTitle}
            >
              {displayTitle}
            </Link>

            {description && (
              <p className="text-xs text-ccjv-ink-secondary/90 line-clamp-2 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Coin supérieur droit : Actions Archiver, Modifier, Supprimer */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {/* Archiver / Désarchiver */}
            <button
              type="button"
              onClick={onArchive}
              aria-label={isArchived ? `Désarchiver ${name}` : `Archiver ${name}`}
              title={isArchived ? "Désarchiver ce document" : "Archiver ce document"}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-none border border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-ccjv-green focus-visible:outline-offset-2 cursor-pointer",
                isArchived
                  ? "text-amber-800 bg-amber-100 hover:bg-amber-200 border-amber-300"
                  : "text-ccjv-ink-secondary hover:text-ccjv-ink hover:bg-ccjv-line/40",
              )}
            >
              <Archive className="h-4 w-4" />
            </button>

            {/* Modifier */}
            <Link
              href={targetHref}
              aria-label={`Modifier ${name}`}
              title="Modifier ce document"
              className="h-8 w-8 flex items-center justify-center rounded-none text-ccjv-ink-secondary hover:text-ccjv-ink hover:bg-ccjv-line/40 transition-colors border border-transparent focus-visible:outline-2 focus-visible:outline-ccjv-green focus-visible:outline-offset-2 cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
            </Link>

            {/* Supprimer */}
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Supprimer ${name}`}
              title="Supprimer ce document"
              className="h-8 w-8 flex items-center justify-center rounded-none text-ccjv-ink-secondary hover:text-red-700 hover:bg-red-50 transition-colors border border-transparent focus-visible:outline-2 focus-visible:outline-ccjv-green focus-visible:outline-offset-2 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pied de carte : Métadonnées (Format, Date d'ajout, Badges, Lien direct) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 mt-auto border-t border-ccjv-line/60 text-xs text-ccjv-ink-secondary">
          <span className="font-semibold text-ccjv-ink uppercase text-[11px] bg-neutral-100 px-2 py-0.5 border border-ccjv-line">
            {fileExtension}
          </span>

          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-ccjv-ink-secondary">
              <Calendar className="h-3.5 w-3.5 text-ccjv-ink-secondary/70 shrink-0" />
              <span>Ajouté le : {formattedDate}</span>
            </span>
          )}

          {departmentName && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-ccjv-green/10 text-ccjv-green border border-ccjv-green/20 rounded-none">
              {departmentName}
            </span>
          )}

          {isArchived && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded-none">
              Archivé
            </span>
          )}

          {file && (
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-ccjv-green hover:underline font-semibold focus-visible:outline-2 focus-visible:outline-ccjv-green"
              title="Ouvrir le fichier dans un nouvel onglet"
            >
              <span>Consulter</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

