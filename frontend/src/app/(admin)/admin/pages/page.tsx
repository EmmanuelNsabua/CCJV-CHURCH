"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { PAGES_REGISTRY } from "@/lib/admin/pagesRegistry";
import { FileText, ExternalLink, ArrowRight, Sparkles, Layers, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/admin/forms/Input";


export default function PagesDirectoryPage() {
  const [search, setSearch] = useState("");

  const pagesList = Object.values(PAGES_REGISTRY).filter((p) => {
    if (!search) return true;
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Édition des Pages du Site"
        description="Aperçu interactif et modification en temps réel des textes, titres, versets et messages statiques des 8 pages principales du CCJV."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              8 Pages Référencées
            </Badge>
          </div>
        }
      />

      {/* Barre de recherche rapide */}
      <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder="Rechercher une page par nom, slug ou description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-ccjv-ink-secondary pointer-events-none" />
        </div>
      </div>

      {/* Grille des 8 pages éditables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagesList.map((page) => {
          const staticSectionsCount = page.sections.filter((s) => !s.isDynamic).length;
          const dynamicSectionsCount = page.sections.filter((s) => s.isDynamic).length;

          return (
            <div
              key={page.slug}
              className="bg-white border border-ccjv-line rounded-none flex flex-col justify-between p-6 hover:border-ccjv-green transition-all duration-200 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-ccjv-green-soft text-ccjv-green border border-ccjv-green/20">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-mono text-ccjv-ink-secondary uppercase">
                      /{page.slug}
                    </span>
                  </div>
                  <Link
                    href={page.publicPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ccjv-ink-secondary hover:text-ccjv-green p-1 transition-colors"
                    title="Voir sur le site public"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                <div>
                  <h2 className="text-base font-bold text-ccjv-ink group-hover:text-ccjv-green transition-colors font-sans">
                    {page.title}
                  </h2>
                  <p className="text-xs text-ccjv-ink-secondary mt-1.5 line-clamp-2 leading-relaxed">
                    {page.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="neutral" className="text-[10px]">
                    <Sparkles className="h-2.5 w-2.5 mr-1 text-ccjv-green" />
                    {staticSectionsCount} section{staticSectionsCount > 1 ? "s" : ""} statique{staticSectionsCount > 1 ? "s" : ""}
                  </Badge>
                  {dynamicSectionsCount > 0 && (
                    <Badge variant="info" className="text-[10px]">
                      <Layers className="h-2.5 w-2.5 mr-1" />
                      {dynamicSectionsCount} bloc{dynamicSectionsCount > 1 ? "s" : ""} dynamique{dynamicSectionsCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ccjv-line flex items-center justify-between">
                <span className="text-[11px] text-ccjv-ink-secondary">
                  Aperçu & Édition
                </span>
                <Link
                  href={`/admin/pages/${page.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ccjv-green hover:underline"
                >
                  Ouvrir l'éditeur <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
