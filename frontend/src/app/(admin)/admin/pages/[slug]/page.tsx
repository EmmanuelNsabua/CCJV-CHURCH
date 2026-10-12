"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Lock,
  ArrowUpRight,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { PAGES_REGISTRY, type EditableSectionDef } from "@/lib/admin/pagesRegistry";
import { getPage, updateStaticPageContent } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";


type ViewportMode = "desktop" | "tablet" | "mobile";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PageVisualEditor({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const pageConfig = PAGES_REGISTRY[slug];
  const toast = useToast();

  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [activeSectionId, setActiveSectionId] = useState<string>(
    pageConfig?.sections[0]?.id || "hero",
  );
  const [content, setContent] = useState<Record<string, string>>(
    pageConfig?.defaultContent || {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Charger le contenu depuis le backend
  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      if (!pageConfig) return;
      setIsLoading(true);
      try {
        const pageData = await getPage(slug);
        if (isMounted && pageData?.content && Object.keys(pageData.content).length > 0) {
          const stringContent: Record<string, string> = {};
          for (const [k, v] of Object.entries(pageData.content)) {
            if (typeof v === "string") stringContent[k] = v;
          }
          setContent((prev) => ({ ...prev, ...stringContent }));
        }
      } catch (err) {
        console.warn("[page-editor] Données distantes non disponibles, utilisation des valeurs par défaut :", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [slug, pageConfig]);

  if (!pageConfig) {
    return (
      <div className="p-8 bg-white border border-ccjv-line text-center space-y-4">
        <p className="text-sm font-semibold text-[#b91c1c]">Page introuvable dans le catalogue.</p>
        <Button href="/admin/pages" variant="outline" size="sm">
          Retour aux pages
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-16 bg-white border border-ccjv-line flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-ccjv-green" />
        <p className="text-xs text-ccjv-muted font-mono uppercase tracking-wider">
          Chargement de la configuration de la page...
        </p>
      </div>
    );
  }

  const activeSection = pageConfig.sections.find((s) => s.id === activeSectionId);

  const handleFieldChange = (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStaticPageContent(slug, content);
      setHasUnsavedChanges(false);
      toast.success("Page mise à jour et publiée avec succès.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la page.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };


  const getViewportWidth = () => {
    switch (viewport) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "max-w-full";
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 flex flex-col h-[calc(100vh-100px)]">
      {/* Barre de contrôle supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-ccjv-line p-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="p-1.5 text-ccjv-ink-secondary hover:text-ccjv-ink border border-ccjv-line hover:bg-[#fafaf7] transition-colors"
            title="Retour au catalogue"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-ccjv-ink font-sans">
                {pageConfig.title}
              </h1>
              {hasUnsavedChanges && (
                <span className="h-2 w-2 rounded-full bg-[#b45309]" title="Modifications non enregistrées" />
              )}
            </div>
            <p className="text-[11px] text-ccjv-ink-secondary">
              Éditeur visuel interactif CCJV
            </p>
          </div>
        </div>

        {/* Sélecteur de viewport responsive */}
        <div className="flex items-center gap-1 bg-ccjv-offwhite p-1 border border-ccjv-line self-center">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={cn(
              "p-1.5 text-xs font-medium flex items-center gap-1 transition-colors",
              viewport === "desktop"
                ? "bg-white text-ccjv-green shadow-xs font-semibold"
                : "text-ccjv-ink-secondary hover:text-ccjv-ink",
            )}
            title="Vue Ordinateur"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden md:inline text-[11px]">Bureau</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={cn(
              "p-1.5 text-xs font-medium flex items-center gap-1 transition-colors",
              viewport === "tablet"
                ? "bg-white text-ccjv-green shadow-xs font-semibold"
                : "text-ccjv-ink-secondary hover:text-ccjv-ink",
            )}
            title="Vue Tablette"
          >
            <Tablet className="h-4 w-4" />
            <span className="hidden md:inline text-[11px]">Tablette</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={cn(
              "p-1.5 text-xs font-medium flex items-center gap-1 transition-colors",
              viewport === "mobile"
                ? "bg-white text-ccjv-green shadow-xs font-semibold"
                : "text-ccjv-ink-secondary hover:text-ccjv-ink",
            )}
            title="Vue Smartphone"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden md:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Actions d'enregistrement */}
        <div className="flex items-center gap-2">
          <Button
            href={pageConfig.publicPath}
            external
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voir la page</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            className="font-semibold"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Disposition 3 Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* ZONE 1 : Navigateur de sections (Colonne Gauche - 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-ccjv-line p-4 flex flex-col overflow-y-auto rounded-none">
          <div className="pb-3 border-b border-ccjv-line mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
              Sections de la page
            </h2>
            <p className="text-[11px] text-ccjv-ink-secondary mt-0.5">
              Sélectionnez une section pour l'éditer.
            </p>
          </div>

          <div className="space-y-1.5 flex-1">
            {pageConfig.sections.map((section) => {
              const isActive = section.id === activeSectionId;
              const isDynamic = Boolean(section.isDynamic);

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "w-full text-left p-3 border transition-all text-xs flex flex-col gap-1.5",
                    isActive
                      ? "border-ccjv-green bg-ccjv-green-soft text-ccjv-ink font-semibold"
                      : "border-ccjv-line hover:border-ccjv-ink/40 bg-white text-ccjv-ink-secondary",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-ccjv-ink">
                      {section.title}
                    </span>
                    {isDynamic ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] font-medium uppercase">
                        Dynamique
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-ccjv-green-soft text-ccjv-green border border-ccjv-green/20 font-medium uppercase">
                        Statique
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ccjv-ink-secondary line-clamp-1">
                    {section.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ZONE 2 : Aperçu Public Interactif (Colonne Centrale - 5 cols) */}
        <div className="lg:col-span-5 bg-[#e8e7e3] border border-ccjv-line p-4 flex flex-col items-center justify-start overflow-y-auto rounded-none">
          <div className="w-full flex items-center justify-between pb-2 mb-2 text-[11px] text-ccjv-ink-secondary uppercase tracking-wider font-semibold border-b border-ccjv-line/60">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-ccjv-green" />
              Aperçu en direct
            </span>
            <span>{viewport.toUpperCase()}</span>
          </div>

          <div
            className={cn(
              "w-full bg-white border border-ccjv-line shadow-sm transition-all duration-200 overflow-hidden",
              getViewportWidth(),
            )}
          >
            {/* Header simulé de la page publique */}
            <div className="border-b border-ccjv-line p-4 bg-ccjv-offwhite flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-ccjv-green text-white flex items-center justify-center font-serif text-[10px] font-bold">
                  C
                </div>
                <span className="font-serif text-xs font-bold tracking-tight">CCJV</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-ccjv-ink-secondary">
                <span>Accueil</span>
                <span>Église</span>
                <span>Enseignements</span>
              </div>
            </div>

            {/* Contenu rendu dynamique de la page */}
            <div className="p-6 space-y-6">
              {/* Rendu dynamique selon la page */}
              {pageConfig.slug === "accueil" && (
                <div className="space-y-6">
                  {/* Section Hero */}
                  <div
                    onClick={() => setActiveSectionId("hero")}
                    className={cn(
                      "p-4 border transition-colors cursor-pointer space-y-3",
                      activeSectionId === "hero"
                        ? "border-ccjv-green ring-2 ring-ccjv-green/20 bg-ccjv-green-soft/10"
                        : "border-dashed border-ccjv-line hover:border-ccjv-green/60",
                    )}
                  >
                    <div className="inline-block px-2 py-0.5 bg-ccjv-green-soft text-ccjv-green text-[10px] font-semibold uppercase tracking-wider">
                      {content["hero.badge"] || "CCJV Lubumbashi"}
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-ccjv-ink leading-tight">
                      {content["hero.title"] || "Une église vivante"}
                    </h2>
                    <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
                      {content["hero.subtitle"]}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="h-8 px-3 bg-ccjv-green text-white text-xs font-medium flex items-center">
                        {content["hero.ctaPrimaryText"] || "Découvrir"}
                      </div>
                      <div className="h-8 px-3 border border-ccjv-ink text-ccjv-ink text-xs font-medium flex items-center">
                        {content["hero.ctaSecondaryText"] || "Intercession"}
                      </div>
                    </div>
                  </div>

                  {/* Verset */}
                  <div
                    onClick={() => setActiveSectionId("verset")}
                    className={cn(
                      "p-4 border transition-colors cursor-pointer bg-ccjv-offwhite space-y-2 text-center",
                      activeSectionId === "verset"
                        ? "border-ccjv-green ring-2 ring-ccjv-green/20"
                        : "border-dashed border-ccjv-line hover:border-ccjv-green/60",
                    )}
                  >
                    <blockquote className="font-serif italic text-xs text-ccjv-ink">
                      « {content["verset.verseText"]} »
                    </blockquote>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ccjv-green">
                      — {content["verset.verseReference"]}
                    </p>
                  </div>

                  {/* Présentation */}
                  <div
                    onClick={() => setActiveSectionId("presentation")}
                    className={cn(
                      "p-4 border transition-colors cursor-pointer space-y-2",
                      activeSectionId === "presentation"
                        ? "border-ccjv-green ring-2 ring-ccjv-green/20"
                        : "border-dashed border-ccjv-line hover:border-ccjv-green/60",
                    )}
                  >
                    <h3 className="font-serif text-sm font-bold text-ccjv-ink">
                      {content["presentation.sectionTitle"]}
                    </h3>
                    <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
                      {content["presentation.paragraph1"]}
                    </p>
                    <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
                      {content["presentation.paragraph2"]}
                    </p>
                  </div>

                  {/* Blocs dynamiques indicatifs */}
                  <div
                    onClick={() => setActiveSectionId("upcoming_events")}
                    className={cn(
                      "p-3 bg-[#eff6ff] border border-[#bfdbfe] text-xs space-y-1 cursor-pointer",
                      activeSectionId === "upcoming_events" && "ring-2 ring-[#1d4ed8]",
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[#1d4ed8]">
                      <Layers className="h-3.5 w-3.5" />
                      Bloc Dynamique : Cultes & Agenda
                    </div>
                    <p className="text-[11px] text-ccjv-ink-secondary">
                      Ce bloc affiche 3 événements synchronisés depuis le module Agenda.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveSectionId("recent_publications")}
                    className={cn(
                      "p-3 bg-[#eff6ff] border border-[#bfdbfe] text-xs space-y-1 cursor-pointer",
                      activeSectionId === "recent_publications" && "ring-2 ring-[#1d4ed8]",
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[#1d4ed8]">
                      <Layers className="h-3.5 w-3.5" />
                      Bloc Dynamique : Publications Récentes
                    </div>
                    <p className="text-[11px] text-ccjv-ink-secondary">
                      Ce bloc affiche les enseignements récents synchronisés depuis le module Publications.
                    </p>
                  </div>
                </div>
              )}

              {/* Rendu générique pour les autres pages */}
              {pageConfig.slug !== "accueil" && (
                <div className="space-y-6">
                  <div
                    onClick={() => setActiveSectionId("hero")}
                    className={cn(
                      "p-4 border transition-colors cursor-pointer space-y-2",
                      activeSectionId === "hero"
                        ? "border-ccjv-green ring-2 ring-ccjv-green/20"
                        : "border-dashed border-ccjv-line hover:border-ccjv-green/60",
                    )}
                  >
                    {content["hero.badge"] && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-ccjv-green">
                        {content["hero.badge"]}
                      </span>
                    )}
                    <h2 className="font-serif text-lg font-bold text-ccjv-ink">
                      {content["hero.title"] || pageConfig.title}
                    </h2>
                    <p className="text-xs text-ccjv-ink-secondary">
                      {content["hero.subtitle"]}
                    </p>
                  </div>

                  {pageConfig.sections
                    .filter((s) => s.id !== "hero")
                    .map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setActiveSectionId(s.id)}
                        className={cn(
                          "p-4 border transition-colors cursor-pointer space-y-2",
                          s.isDynamic
                            ? "bg-[#eff6ff] border-[#bfdbfe]"
                            : activeSectionId === s.id
                            ? "border-ccjv-green ring-2 ring-ccjv-green/20 bg-white"
                            : "border-dashed border-ccjv-line bg-white hover:border-ccjv-green/60",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-ccjv-ink">{s.title}</h3>
                          {s.isDynamic && (
                            <span className="text-[10px] text-[#1d4ed8] font-semibold uppercase">
                              Dynamique
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ccjv-ink-secondary">{s.description}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ZONE 3 : Inspecteur & Éditeur de Champs (Colonne Droite - 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-ccjv-line p-5 flex flex-col overflow-y-auto rounded-none">
          {activeSection ? (
            <div className="space-y-5">
              <div className="pb-3 border-b border-ccjv-line">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-ccjv-ink font-sans">
                    {activeSection.title}
                  </h2>
                </div>
                <p className="text-xs text-ccjv-ink-secondary mt-1">
                  {activeSection.description}
                </p>
              </div>

              {/* Si la section est dynamique : avertissement clair + redirection */}
              {activeSection.isDynamic ? (
                <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] space-y-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-[#1d4ed8] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#1d4ed8]">
                        Bloc de contenu administré séparément
                      </p>
                      <p className="text-[11px] text-ccjv-ink leading-relaxed">
                        Ce bloc est synchronisé automatiquement avec les données réelles du backend.
                        Pour ajouter, modifier ou supprimer des éléments de cette section, utilisez le module dédié.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={activeSection.managementRoute}
                    className="inline-flex items-center justify-center gap-1.5 w-full h-9 bg-[#1d4ed8] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors"
                  >
                    <span>{activeSection.managementLabel}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                /* Si la section est statique : formulaire d'édition de champs */
                <div className="space-y-4">
                  {(activeSection as EditableSectionDef).fields.map((field) => (
                    <FormField
                      key={field.key}
                      label={field.label}
                      hint={field.hint}
                    >
                      {field.type === "textarea" ? (
                        <Textarea
                          rows={4}
                          value={content[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <Input
                          type={field.type === "url" ? "url" : "text"}
                          value={content[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                    </FormField>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-ccjv-ink-secondary">
              Sélectionnez une section à gauche pour commencer l'édition.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
