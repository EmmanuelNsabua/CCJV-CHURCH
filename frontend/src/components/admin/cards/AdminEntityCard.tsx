"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminCardStatusVariant = "success" | "neutral" | "warning" | "error";

export interface AdminCardStatus {
  label: string;
  variant?: AdminCardStatusVariant;
}

export interface AdminEntityCardProps {
  id: string;
  title: string;
  detailHref: string;
  subtitle?: React.ReactNode;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  statusBadge?: AdminCardStatus;
  dateLabel?: string;
  onDelete?: () => void;
  deleteTitle?: string;
  deleteAriaLabel?: string;
  viewLabel?: string;
  className?: string;
}

const statusVariants: Record<AdminCardStatusVariant, string> = {
  success: "bg-[#eaf3ea] text-[#1e7a1e] border border-[#1e7a1e]/30",
  neutral: "bg-[#f3f2ee] text-[#5e5d59] border border-[#e5e2d9]",
  warning: "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]",
  error: "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]",
};

export function AdminEntityCard({
  id: _id,
  title,
  detailHref,
  subtitle,
  description,
  imageUrl,
  imageAlt,
  statusBadge,
  dateLabel,
  onDelete,
  deleteTitle = "Supprimer cet élément",
  deleteAriaLabel,
  viewLabel = "Voir plus",
  className,
}: AdminEntityCardProps) {
  // Troncature sécurisée de la chaîne pour éviter tout débordement
  const maxDescLength = 140;
  const cleanDesc = description?.trim() || "";
  const truncatedDescription =
    cleanDesc.length > maxDescLength
      ? cleanDesc.slice(0, maxDescLength).trim() + "…"
      : cleanDesc;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between bg-white border border-ccjv-line rounded-none overflow-hidden transition-all duration-200 hover:border-ccjv-green/60 hover:shadow-sm",
        className,
      )}
    >
      {/* =========================================================================
          01 — ZONE MÉDIA (Image au format 16/9 + Badge absolu sans arrondis)
         ========================================================================= */}
      <div className="relative w-full aspect-[16/9] bg-ccjv-line/40 overflow-hidden border-b border-ccjv-line">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f8f7f4] to-[#ebe7de] text-ccjv-ink-secondary/60">
            <ImageIcon className="h-8 w-8 text-ccjv-line stroke-[1.5]" />
          </div>
        )}

        {/* Badge de statut absolu en haut à droite sans les arrondis (rounded-none) */}
        {statusBadge && (
          <div
            className={cn(
              "absolute top-3 right-3 z-10 rounded-none px-2.5 py-1 font-sans text-[0.68rem] font-bold uppercase tracking-[0.1em] shadow-xs",
              statusVariants[statusBadge.variant || "neutral"],
            )}
          >
            {statusBadge.label}
          </div>
        )}
      </div>

      {/* =========================================================================
          02 — ZONE CONTENU (Titre, Prédicateur/Auteur, Résumé, Parution)
         ========================================================================= */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-4">
        <div>
          {/* Titre */}
          <Link
            href={detailHref}
            className="block font-serif text-lg font-bold text-ccjv-ink hover:text-ccjv-green transition-colors leading-snug line-clamp-2"
          >
            {title}
          </Link>

          {/* Prédicateur / Auteur / Lieu */}
          {subtitle && (
            <p className="text-xs text-ccjv-ink-secondary mt-1.5 font-medium">
              {subtitle}
            </p>
          )}

          {/* Résumé avec longueur max maîtrisée */}
          {truncatedDescription && (
            <p className="text-xs text-ccjv-ink-secondary leading-relaxed mt-2.5 line-clamp-2">
              {truncatedDescription}
            </p>
          )}

          {/* Date de parution */}
          {dateLabel && (
            <div className="flex items-center gap-1.5 text-xs text-ccjv-ink-secondary mt-3 pt-1">
              <Calendar className="h-3.5 w-3.5 text-ccjv-green shrink-0" />
              <span>{dateLabel}</span>
            </div>
          )}
        </div>

        {/* =======================================================================
            03 — ACTIONS DU BAS (Bouton Modifier <Pencil /> + Bouton Supprimer <Trash2 />)
           ======================================================================= */}
        <div className="pt-3.5 border-t border-ccjv-line flex items-center justify-end gap-2">
          <Link
            href={detailHref}
            title="Modifier cet élément"
            aria-label={`Modifier ${title}`}
            className="inline-flex items-center justify-center p-2 text-ccjv-ink-secondary hover:text-ccjv-green hover:bg-[#eaf3ea] border border-ccjv-line hover:border-ccjv-green/40 transition-colors rounded-none"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title={deleteTitle}
              aria-label={deleteAriaLabel || `Supprimer ${title}`}
              className="inline-flex items-center justify-center p-2 text-ccjv-ink-secondary hover:text-red-700 hover:bg-red-50 border border-ccjv-line hover:border-red-300 transition-colors rounded-none"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
