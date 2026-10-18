"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  Share2,
  Phone,
  Sliders,
  ShieldAlert,
  Save,
  RotateCcw,
  Plus,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Select } from "@/components/admin/forms/Select";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { MapLocationPicker } from "@/components/admin/settings/MapLocationPicker";
import { WeeklyScheduleCalendar } from "@/components/admin/settings/WeeklyScheduleCalendar";
import { ScheduleModal } from "@/components/admin/settings/ScheduleModal";
import { SocialCatalogForm } from "@/components/admin/settings/SocialCatalogForm";
import { SettingsPreferences } from "@/components/admin/settings/SettingsPreferences";
import { UnsavedChangesModal } from "@/components/admin/settings/UnsavedChangesModal";
import {
  getSettings,
  updateSettings,
  getSchedule,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  createSocialLink,
  updateSocialLink,
  type ScheduleEntry,
  type ScheduleEntryInput,
  type SocialLink,
  type SocialLinkInput,
} from "@/lib/api";

export type SettingsSection =
  | "preferences"
  | "address"
  | "schedule"
  | "social"
  | "contact";

interface SectionNavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: SectionNavItem[] = [
  {
    id: "preferences",
    label: "Préférences",
    icon: Sliders,
    description: "Thème d'affichage et alertes de notification",
  },
  {
    id: "address",
    label: "Adresse & Localisation",
    icon: MapPin,
    description: "Adresse physique et pointage géographique sur la carte",
  },
  {
    id: "schedule",
    label: "Horaires de l'église",
    icon: Clock,
    description: "Fuseau horaire et calendrier hebdomadaire récurrent",
  },
  {
    id: "social",
    label: "Réseaux sociaux",
    icon: Share2,
    description: "Catalogue des chaînes et pages officielles",
  },
  {
    id: "contact",
    label: "Gestion des contacts",
    icon: Phone,
    description: "E-mail de support et numéro WhatsApp",
  },
];

const TIMEZONE_OPTIONS = [
  { value: "Africa/Lubumbashi", label: "UTC + 02:00 – Afrique Centrale (CAT, Lubumbashi)" },
  { value: "Africa/Kinshasa", label: "UTC + 01:00 – Afrique de l'Ouest (WAT, Kinshasa)" },
  { value: "Africa/Johannesburg", label: "UTC + 02:00 – Afrique du Sud (SAST)" },
  { value: "Europe/Paris", label: "UTC + 01:00 / UTC + 02:00 – Europe Centrale (CET)" },
  { value: "UTC", label: "UTC + 00:00 – Temps Universel Coordonné (GMT)" },
];

export default function AdminSettingsPage() {
  const { adminProfile } = useAuth();
  const toast = useToast();

  const isDepartmentManager = adminProfile?.role === "DEPARTMENT_MANAGER";

  // Section active
  const [activeSection, setActiveSection] = useState<SettingsSection>("schedule");
  // Navigation mobile : "menu" ou "detail"
  const [mobileView, setMobileView] = useState<"menu" | "detail">("menu");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Données initiales enregistrées en base (pour détecter les modifications non enregistrées)
  const [initialSettings, setInitialSettings] = useState<Record<string, string>>({});
  // État local éditable des réglages scalaires
  const [currentSettings, setCurrentSettings] = useState<Record<string, string>>({});

  // Horaires
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  // Liens sociaux
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  // Modales
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);
  const [prefilledDay, setPrefilledDay] = useState<string | undefined>();
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>();

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "schedule" | "social";
    id: string;
    title: string;
  } | null>(null);

  // Détection des modifications non enregistrées sur les scalaires de la section active
  const isCurrentSectionDirty = useMemo(() => {
    if (activeSection === "address") {
      const keys = [
        "site.address",
        "site.addressLine1",
        "site.addressLine2",
        "site.addressLine3",
        "site.latitude",
        "site.longitude",
        "site.name",
        "site.acronym",
      ];
      return keys.some(
        (k) => (currentSettings[k] ?? "") !== (initialSettings[k] ?? ""),
      );
    }
    if (activeSection === "contact") {
      const keys = ["site.supportEmail", "site.whatsappNumber", "site.whatsappHref"];
      return keys.some(
        (k) => (currentSettings[k] ?? "") !== (initialSettings[k] ?? ""),
      );
    }
    if (activeSection === "schedule") {
      return (
        (currentSettings["site.timezone"] ?? "Africa/Lubumbashi") !==
        (initialSettings["site.timezone"] ?? "Africa/Lubumbashi")
      );
    }
    return false;
  }, [activeSection, currentSettings, initialSettings]);

  // Avertissement de fermeture d'onglet du navigateur si des modifications sont en attente
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCurrentSectionDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isCurrentSectionDirty]);

  // Chargement des données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, scheduleRes] = await Promise.all([
        getSettings(),
        getSchedule(),
      ]);

      if (settingsRes) {
        setInitialSettings(settingsRes.settings || {});
        setCurrentSettings(settingsRes.settings || {});
        setSocialLinks(settingsRes.socialLinks || []);
      }
      if (scheduleRes) {
        setScheduleEntries(scheduleRes);
      }
    } catch {
      toast.error("Impossible de charger les paramètres de l'église.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Changement de valeur dans les scalaires
  const handleFieldChange = (key: string, value: string) => {
    setCurrentSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "site.whatsappNumber") {
        const clean = value.replace(/\D/g, "");
        if (clean) next["site.whatsappHref"] = `https://wa.me/${clean}`;
      }
      return next;
    });
  };

  // Sauvegarde des champs scalaires de la section active
  const handleSaveActiveSection = async () => {
    setIsSaving(true);
    try {
      let keysToSave: string[] = [];
      if (activeSection === "address") {
        keysToSave = [
          "site.address",
          "site.addressLine1",
          "site.addressLine2",
          "site.addressLine3",
          "site.latitude",
          "site.longitude",
          "site.name",
          "site.acronym",
        ];
      } else if (activeSection === "contact") {
        keysToSave = ["site.supportEmail", "site.whatsappNumber", "site.whatsappHref"];
      } else if (activeSection === "schedule") {
        keysToSave = ["site.timezone"];
      }

      const payload: Record<string, string> = {};
      for (const k of keysToSave) {
        payload[k] = currentSettings[k] ?? "";
      }

      const res = await updateSettings(payload);
      if (res && res.settings) {
        setInitialSettings((prev) => ({ ...prev, ...res.settings }));
        setCurrentSettings((prev) => ({ ...prev, ...res.settings }));
      }
      toast.success("Paramètres enregistrés avec succès.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de sauvegarde.";
      toast.error(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Protection contre la perte de données
  const [pendingNavigation, setPendingNavigation] = useState<{
    targetSection?: SettingsSection;
    targetUrl?: string;
    backToMobileMenu?: boolean;
  } | null>(null);

  // Intercepter les clics sur les liens de navigation sortants (ex: AdminSidebar) quand il y a des modifications non enregistrées
  useEffect(() => {
    if (!isCurrentSectionDirty) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin === window.location.origin) {
          if (url.pathname !== window.location.pathname) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigation({ targetUrl: href });
          }
        }
      } catch {
        // Ignorer les URLs non standard
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isCurrentSectionDirty]);

  // Annuler les modifications non enregistrées de la section active
  const handleDiscardChanges = () => {
    setCurrentSettings(initialSettings);
  };

  // Tentative de navigation vers une autre section
  const handleRequestSectionChange = (target: SettingsSection) => {
    if (target === activeSection) {
      setMobileView("detail");
      return;
    }

    if (isCurrentSectionDirty) {
      setPendingNavigation({ targetSection: target });
      return;
    }

    setActiveSection(target);
    setMobileView("detail");
  };

  // Tentative de retour au menu mobile
  const handleRequestMobileBackToMenu = () => {
    if (isCurrentSectionDirty) {
      setPendingNavigation({ backToMobileMenu: true });
      return;
    }
    setMobileView("menu");
  };

  // Confirmation sauvegarde avant navigation
  const handleSaveAndProceed = async () => {
    try {
      await handleSaveActiveSection();
      if (pendingNavigation?.targetSection) {
        setActiveSection(pendingNavigation.targetSection);
        setMobileView("detail");
      } else if (pendingNavigation?.backToMobileMenu) {
        setMobileView("menu");
      } else if (pendingNavigation?.targetUrl) {
        window.location.href = pendingNavigation.targetUrl;
      }
    } finally {
      setPendingNavigation(null);
    }
  };

  // Confirmation abandon avant navigation
  const handleDiscardAndProceed = () => {
    handleDiscardChanges();
    if (pendingNavigation?.targetSection) {
      setActiveSection(pendingNavigation.targetSection);
      setMobileView("detail");
    } else if (pendingNavigation?.backToMobileMenu) {
      setMobileView("menu");
    } else if (pendingNavigation?.targetUrl) {
      window.location.href = pendingNavigation.targetUrl;
    }
    setPendingNavigation(null);
  };

  // CRUD Schedule
  const handleAddSchedule = (day?: string, time?: string) => {
    setEditingSchedule(null);
    setPrefilledDay(day);
    setPrefilledTime(time);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (entry: ScheduleEntry) => {
    setEditingSchedule(entry);
    setPrefilledDay(undefined);
    setPrefilledTime(undefined);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (input: ScheduleEntryInput) => {
    try {
      if (editingSchedule) {
        const updated = await updateScheduleEntry(editingSchedule.id, input);
        setScheduleEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
        toast.success("Rassemblement mis à jour.");
      } else {
        const created = await createScheduleEntry(input);
        setScheduleEntries((prev) => [...prev, created]);
        toast.success("Nouveau rassemblement programmé.");
      }
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la programmation.";
      toast.error(msg);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteScheduleEntry(id);
      setScheduleEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Rassemblement retiré du calendrier.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de suppression.";
      toast.error(msg);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Sauvegarde des réseaux sociaux depuis le catalogue
  const handleSaveSocialCatalog = async (links: SocialLinkInput[]) => {
    setIsSaving(true);
    try {
      // Mettre à jour ou créer chaque lien
      const updatedList: SocialLink[] = [];
      for (const linkInput of links) {
        const existing = socialLinks.find(
          (l) => l.platform?.toLowerCase() === linkInput.platform?.toLowerCase(),
        );

        if (existing?.id) {
          const updated = await updateSocialLink(existing.id, linkInput);
          updatedList.push(updated);
        } else {
          const created = await createSocialLink(linkInput);
          updatedList.push(created);
        }
      }

      setSocialLinks(updatedList);
      toast.success("Catalogue des réseaux sociaux actualisé.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Écran d'interdiction RBAC pour les responsables de département
  if (isDepartmentManager) {
    return (
      <div className="space-y-6 max-w-4xl">
        <AdminPageHeader
          title="Paramètres de l'église"
          description="Configuration générale et paramètres institutionnels du CCJV."
        />
        <div className="bg-white border border-[#b91c1c]/20 p-8 rounded-none flex flex-col items-center text-center space-y-4">
          <div className="h-14 w-14 bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center border border-[#fecaca]">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold font-serif text-ccjv-ink">
            Accès réservé à l&apos;Administration Générale
          </h2>
          <p className="text-xs text-ccjv-ink-secondary max-w-md leading-relaxed">
            Conformément à la politique de sécurité et à la matrice RBAC du CCJV (X25 / Règle 029),
            les paramètres institutionnels de l&apos;église sont exclusivement accessibles
            aux administrateurs généraux (SUPER_ADMIN et ADMIN).
          </p>
          <Badge variant="error" className="text-xs font-mono">
            403 FORBIDDEN — DEPARTMENT_MANAGER NON AUTORISÉ
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl">
      {/* En-tête de page inspiré de la maquette Figma */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ccjv-ink">
          Paramètres
        </h1>
        <p className="font-sans text-xs text-ccjv-ink-secondary max-w-2xl leading-relaxed">
          Gérez l&apos;adresse physique, les horaires de culte, le catalogue des réseaux sociaux, vos canaux d&apos;assistance et les préférences du système.
        </p>
      </div>

      {/* Conteneur principal (Layout 2 colonnes style Figma) */}
      <div className="border border-ccjv-line bg-white rounded-none shadow-xs min-h-[620px] relative overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* ================================================================ */}
          {/* COLONNE GAUCHE : Menu latéral des sections                      */}
          {/* Sur mobile : affiché en plein écran quand mobileView === 'menu'  */}
          {/* ================================================================ */}
          <aside
            className={`w-full md:w-64 border-r border-ccjv-line shrink-0 bg-white p-3 flex flex-col justify-between transition-all duration-300 ${
              mobileView === "detail"
                ? "max-md:hidden"
                : "max-md:block max-md:min-h-[550px] animate-in slide-in-from-left-6 duration-300 ease-out"
            }`}
          >
            <div className="space-y-2">
              <div className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-ccjv-ink-secondary">
                Sections du module
              </div>

              <nav className="space-y-1.5" aria-label="Sections des paramètres">
                {SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  const Icon = section.icon;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleRequestSectionChange(section.id)}
                      className={`w-full text-left px-3.5 py-3 text-xs font-semibold rounded-none transition-all flex items-center justify-between group ${
                        isActive
                          ? "bg-ccjv-green text-white font-bold shadow-xs"
                          : "text-ccjv-ink hover:bg-[#fafaf7] hover:text-ccjv-green"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-ccjv-ink-secondary group-hover:text-ccjv-green"}`} />
                        <div>
                          <div className="leading-tight">{section.label}</div>
                          <div className={`text-[10px] md:hidden mt-0.5 line-clamp-1 ${isActive ? "text-white/80" : "text-ccjv-ink-secondary"}`}>
                            {section.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 md:hidden ${isActive ? "text-white" : "text-ccjv-ink-secondary"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Pied du menu latéral */}
            <div className="pt-4 border-t border-ccjv-line/80 px-2 text-[11px] text-ccjv-ink-secondary space-y-1">
              <p className="font-semibold text-ccjv-ink">Centre Chrétien Jésus ma Vie</p>
              <p className="text-[10px]">Version 1.0 • Back-Office certifié</p>
            </div>
          </aside>

          {/* ================================================================ */}
          {/* ZONE DROITE : Contenu de la section active                      */}
          {/* Sur mobile : glisse de droite à gauche avec bouton retour        */}
          {/* ================================================================ */}
          <main
            className={`flex-1 p-5 md:p-8 bg-white transition-all duration-300 ${
              mobileView === "menu"
                ? "max-md:hidden"
                : "max-md:block animate-in slide-in-from-right-8 duration-300 ease-out"
            }`}
          >
            {/* Barre de retour mobile */}
            <div className="md:hidden pb-4 mb-4 border-b border-ccjv-line flex items-center justify-between">
              <button
                type="button"
                onClick={handleRequestMobileBackToMenu}
                className="inline-flex items-center gap-2 text-xs font-bold text-ccjv-ink hover:text-ccjv-green transition-colors py-1 px-2 border border-ccjv-line bg-[#fafaf7]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux sections</span>
              </button>
              <span className="text-xs font-semibold text-ccjv-green font-mono">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </span>
            </div>

            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-8 w-8 border-2 border-ccjv-green border-t-transparent animate-spin rounded-full" />
                <p className="text-xs text-ccjv-ink-secondary">
                  Chargement des paramètres de l&apos;église...
                </p>
              </div>
            ) : (
              <>
                {/* -------------------------------------------------------------- */}
                {/* 1. SECTION : PRÉFÉRENCES                                        */}
                {/* -------------------------------------------------------------- */}
                {activeSection === "preferences" && (
                  <SettingsPreferences
                    onSave={async () => {
                      toast.success("Vos préférences d'interface ont été enregistrées.");
                    }}
                    isLoading={isSaving}
                  />
                )}

            {/* -------------------------------------------------------------- */}
            {/* 2. SECTION : ADRESSE & LOCALISATION                             */}
            {/* -------------------------------------------------------------- */}
            {activeSection === "address" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-ccjv-line gap-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-ccjv-ink">
                      Adresse officielle et localisation GPS
                    </h3>
                    <p className="text-xs text-ccjv-ink-secondary">
                      Renseignez l&apos;adresse textuelle et positionnez le point exact sur la carte pour l&apos;itinéraire des visiteurs.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveActiveSection}
                    disabled={isSaving}
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {isSaving ? "Enregistrement..." : "Enregistrer l'adresse"}
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Adresse principale */}
                  <FormField
                    label="Adresse physique complète"
                    required
                    hint="Utilisée pour le pied de page et les mentions légales (ex: 2244, Avenue Djoloko, Quartier Hewa Bora, Lubumbashi, RDC)"
                  >
                    <Input
                      value={currentSettings["site.address"] || ""}
                      onChange={(e) => handleFieldChange("site.address", e.target.value)}
                      placeholder="2244, Avenue Djoloko, Quartier Hewa Bora, Lubumbashi, RDC"
                      disabled={isSaving}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Ligne 1 (Voie et numéro)" hint="ex: 2244, Avenue Djoloko">
                      <Input
                        value={currentSettings["site.addressLine1"] || ""}
                        onChange={(e) => handleFieldChange("site.addressLine1", e.target.value)}
                        placeholder="2244, Avenue Djoloko"
                        disabled={isSaving}
                      />
                    </FormField>

                    <FormField label="Ligne 2 (Quartier)" hint="ex: Quartier Hewa Bora">
                      <Input
                        value={currentSettings["site.addressLine2"] || ""}
                        onChange={(e) => handleFieldChange("site.addressLine2", e.target.value)}
                        placeholder="Quartier Hewa Bora"
                        disabled={isSaving}
                      />
                    </FormField>

                    <FormField label="Ligne 3 (Ville & Pays)" hint="ex: Lubumbashi, RDC">
                      <Input
                        value={currentSettings["site.addressLine3"] || ""}
                        onChange={(e) => handleFieldChange("site.addressLine3", e.target.value)}
                        placeholder="Lubumbashi, Haut-Katanga, RDC"
                        disabled={isSaving}
                      />
                    </FormField>
                  </div>

                  {/* Coordonnées GPS manuelles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormField label="Latitude GPS (décimale)" hint="ex: -11.66089">
                      <Input
                        value={currentSettings["site.latitude"] || ""}
                        onChange={(e) => handleFieldChange("site.latitude", e.target.value)}
                        placeholder="-11.66089"
                        disabled={isSaving}
                      />
                    </FormField>

                    <FormField label="Longitude GPS (décimale)" hint="ex: 27.47938">
                      <Input
                        value={currentSettings["site.longitude"] || ""}
                        onChange={(e) => handleFieldChange("site.longitude", e.target.value)}
                        placeholder="27.47938"
                        disabled={isSaving}
                      />
                    </FormField>
                  </div>

                  {/* Carte interactive pour placer le point géographique exact */}
                  <div className="pt-4 border-t border-ccjv-line">
                    <MapLocationPicker
                      latitude={currentSettings["site.latitude"]}
                      longitude={currentSettings["site.longitude"]}
                      address={currentSettings["site.address"]}
                      onChange={(lat, lng) => {
                        handleFieldChange("site.latitude", lat.toString());
                        handleFieldChange("site.longitude", lng.toString());
                      }}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/* 3. SECTION : HORAIRES DE L'ÉGLISE (FIDÉLITÉ FIGMA)              */}
            {/* -------------------------------------------------------------- */}
            {activeSection === "schedule" && (
              <div className="space-y-6">
                {/* Barre supérieure identique à la capture Figma */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-ccjv-line gap-4">
                  {/* Gauche : Fuseau horaire */}
                  <div className="w-full sm:w-80">
                    <label className="text-xs font-semibold text-ccjv-ink font-sans tracking-wide block mb-1">
                      Fuseau horaire
                    </label>
                    <Select
                      value={currentSettings["site.timezone"] || "Africa/Lubumbashi"}
                      onChange={(e) => {
                        handleFieldChange("site.timezone", e.target.value);
                      }}
                      disabled={isSaving}
                    >
                      {TIMEZONE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Droite : Boutons d'annulation / répétition et bouton vert Ajouter un programme */}
                  <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-4">
                    {/* Boutons annuler / rétablir */}
                    <div className="flex items-center border border-ccjv-line bg-white">
                      <button
                        type="button"
                        onClick={handleDiscardChanges}
                        disabled={!isCurrentSectionDirty || isSaving}
                        className="p-2 text-ccjv-ink hover:bg-[#fafaf7] hover:text-ccjv-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-ccjv-line"
                        title="Annuler les modifications récentes"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveActiveSection}
                        disabled={!isCurrentSectionDirty || isSaving}
                        className="p-2 text-ccjv-ink hover:bg-[#fafaf7] hover:text-ccjv-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Enregistrer le fuseau horaire"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Bouton Ajouter un programme (vert plein rectangulaire Figma) */}
                    <Button
                      type="button"
                      onClick={() => handleAddSchedule()}
                      size="sm"
                      className="bg-ccjv-green hover:bg-[#166534] text-white font-bold h-10 px-4"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span>Ajouter un programme</span>
                    </Button>
                  </div>
                </div>

                {/* Calendrier Heures (Lignes) Jours (Colonnes) sans date */}
                <WeeklyScheduleCalendar
                  entries={scheduleEntries}
                  onAdd={handleAddSchedule}
                  onEdit={handleEditSchedule}
                  onDelete={(entry) =>
                    setDeleteConfirm({
                      type: "schedule",
                      id: entry.id,
                      title: entry.title,
                    })
                  }
                />
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/* 4. SECTION : RÉSEAUX SOCIAUX                                    */}
            {/* -------------------------------------------------------------- */}
            {activeSection === "social" && (
              <SocialCatalogForm
                initialLinks={socialLinks}
                onSaveLinks={handleSaveSocialCatalog}
                isLoading={isSaving}
              />
            )}

            {/* -------------------------------------------------------------- */}
            {/* 5. SECTION : GESTION DES CONTACTS                               */}
            {/* -------------------------------------------------------------- */}
            {activeSection === "contact" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-ccjv-line gap-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-ccjv-ink">
                      Canaux de contact et assistance des visiteurs
                    </h3>
                    <p className="text-xs text-ccjv-ink-secondary">
                      Renseignez l&apos;adresse de support et le numéro WhatsApp officiel de la communauté.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveActiveSection}
                    disabled={isSaving}
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {isSaving ? "Enregistrement..." : "Enregistrer les contacts"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Adresse de support */}
                  <div className="space-y-4 border border-ccjv-line p-5 bg-[#fafaf7]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
                        Adresse de support (E-mail)
                      </h4>
                    </div>

                    <FormField
                      label="Adresse e-mail institutionnelle"
                      hint="Utilisée pour recevoir les questions et messages des visiteurs"
                    >
                      <Input
                        type="email"
                        value={currentSettings["site.supportEmail"] || ""}
                        onChange={(e) =>
                          handleFieldChange("site.supportEmail", e.target.value)
                        }
                        placeholder="contact@ccjv-church.org"
                        disabled={isSaving}
                      />
                    </FormField>

                    {currentSettings["site.supportEmail"] && (
                      <div className="pt-1">
                        <a
                          href={`mailto:${currentSettings["site.supportEmail"]}`}
                          className="inline-flex items-center gap-1.5 text-xs text-ccjv-green font-semibold hover:underline"
                        >
                          <span>Tester l&apos;envoi d&apos;e-mail ↗</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Numéro WhatsApp */}
                  <div className="space-y-4 border border-ccjv-line p-5 bg-[#fafaf7]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
                        Assistance WhatsApp
                      </h4>
                    </div>

                    <FormField
                      label="Numéro WhatsApp international"
                      hint="Avec indicatif pays (ex: +243 999 123 456 ou +243810000000)"
                    >
                      <Input
                        value={currentSettings["site.whatsappNumber"] || ""}
                        onChange={(e) =>
                          handleFieldChange("site.whatsappNumber", e.target.value)
                        }
                        placeholder="+243 999 000 000"
                        disabled={isSaving}
                      />
                    </FormField>

                    <FormField
                      label="Lien direct WhatsApp calculé"
                      hint="Généré automatiquement (https://wa.me/...)"
                    >
                      <Input
                        value={currentSettings["site.whatsappHref"] || ""}
                        onChange={(e) =>
                          handleFieldChange("site.whatsappHref", e.target.value)
                        }
                        placeholder="https://wa.me/243999000000"
                        disabled={isSaving}
                      />
                    </FormField>

                    {currentSettings["site.whatsappHref"] && (
                      <div className="pt-1">
                        <a
                          href={currentSettings["site.whatsappHref"]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-ccjv-green font-semibold hover:underline"
                        >
                          <span>Tester l&apos;ouverture directe sur WhatsApp ↗</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </>
            )}
          </main>
        </div>
      </div>

      {/* Modale d'ajout / modification de culte */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
          setPrefilledDay(undefined);
          setPrefilledTime(undefined);
        }}
        onSubmit={handleSaveSchedule}
        initialData={
          editingSchedule ||
          (prefilledDay || prefilledTime
            ? ({
                id: "",
                title: "",
                day: prefilledDay || "Dimanche",
                days: prefilledDay ? [prefilledDay] : ["Dimanche"],
                startTime: prefilledTime || "08:30",
                endTime: "",
                timeLabel: "",
                audience: "Tous publics",
                isConfirmed: true,
                position: 0,
                createdAt: "",
                updatedAt: "",
              } as ScheduleEntry)
            : null)
        }
      />

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        title="Supprimer ce rassemblement ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement « ${deleteConfirm?.title} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        onConfirm={() => {
          if (!deleteConfirm) return;
          handleDeleteSchedule(deleteConfirm.id);
        }}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* Modale de protection contre la perte de modifications */}
      <UnsavedChangesModal
        isOpen={Boolean(pendingNavigation)}
        onSaveAndProceed={handleSaveAndProceed}
        onDiscardAndProceed={handleDiscardAndProceed}
        onCancel={() => setPendingNavigation(null)}
        isLoading={isSaving}
      />
    </div>
  );
}
