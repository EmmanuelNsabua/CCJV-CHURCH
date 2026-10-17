"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Select } from "@/components/admin/forms/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { AdminMediaField, type AdminMediaValue } from "@/components/admin/media/AdminMediaField";
import type { Event, EventLifecycleStatus } from "@/lib/api/types";
import { getDepartments } from "@/lib/api";
import { slugify } from "@/lib/utils";

const DEFAULT_DEPARTMENTS = [
  { id: "d0000000-0000-4000-8000-000000000001", name: "Les Serviteurs" },
  { id: "d0000000-0000-4000-8000-000000000002", name: "La Chorale Grand Groupe CCVJ" },
  { id: "d0000000-0000-4000-8000-000000000003", name: "La Chorale de Cano Vocal" },
  { id: "d0000000-0000-4000-8000-000000000004", name: "L'Ecodume" },
  { id: "d0000000-0000-4000-8000-000000000005", name: "Affaires Sociales" },
  { id: "d0000000-0000-4000-8000-000000000006", name: "Hygiène et Ancienneté" },
  { id: "d0000000-0000-4000-8000-000000000007", name: "Protocole" },
  { id: "d0000000-0000-4000-8000-000000000008", name: "Évangélisation" },
  { id: "d0000000-0000-4000-8000-000000000009", name: "Intercession" },
  { id: "d0000000-0000-4000-8000-00000000000a", name: "Presse & Communication" },
];

export interface EventFormProps {
  initialData?: Event;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isEditing?: boolean;
}

export function EventForm({ initialData, onSubmit, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");

  // Statut du cycle de vie : DRAFT | PUBLISHED | CANCELLED
  const initialStatus: EventLifecycleStatus =
    initialData?.lifecycleStatus ||
    (initialData?.status === "PUBLISHED" || initialData?.status === "DRAFT" || initialData?.status === "CANCELLED"
      ? (initialData.status as EventLifecycleStatus)
      : "DRAFT");

  const [status, setStatus] = useState<EventLifecycleStatus>(initialStatus);

  // Département organisateur facultatif
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId || "",
  );
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);

  // Lieu obligatoire
  const [location, setLocation] = useState(
    initialData?.location || "Temple Principal CCJV, Lubumbashi",
  );

  // Dates obligatoires avec endDate >= startDate
  const todayIso = new Date().toISOString().slice(0, 10);
  const rawStartDate = initialData?.startDate || initialData?.eventDate;
  const [startDate, setStartDate] = useState(
    rawStartDate ? rawStartDate.slice(0, 10) : todayIso,
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? initialData.endDate.slice(0, 10)
      : rawStartDate
        ? rawStartDate.slice(0, 10)
        : todayIso,
  );

  // Heures indépendantes et facultatives
  const [startTime, setStartTime] = useState(
    initialData?.startTime || initialData?.eventTime || "",
  );
  const [endTime, setEndTime] = useState(initialData?.endTime || "");

  // Résolution du média affiche / miniature
  const resolveInitialMedia = (data?: Event): AdminMediaValue | null => {
    const url = data?.imageUrl || data?.bannerImage;
    if (!url) return null;
    return {
      mediaId: data?.imageMediaId || undefined,
      url,
      title: "Affiche de l'événement",
      mimeType: "image/jpeg",
    };
  };

  const [imageMedia, setImageMedia] = useState<AdminMediaValue | null>(() => resolveInitialMedia(initialData));

  // Synchronisation si initialData arrive asynchronement
  useEffect(() => {
    if (!initialData) return;
    setTitle(initialData.title || "");
    setSlug(initialData.slug || "");
    setDescription(initialData.description || "");
    setExcerpt(initialData.excerpt || "");
    const initSt: EventLifecycleStatus =
      initialData.lifecycleStatus ||
      (initialData.status === "PUBLISHED" || initialData.status === "DRAFT" || initialData.status === "CANCELLED"
        ? (initialData.status as EventLifecycleStatus)
        : "DRAFT");
    setStatus(initSt);
    setDepartmentId(initialData.departmentId || "");
    setLocation(initialData.location || "Temple Principal CCJV, Lubumbashi");
    const rawSt = initialData.startDate || initialData.eventDate;
    if (rawSt) setStartDate(rawSt.slice(0, 10));
    if (initialData.endDate) setEndDate(initialData.endDate.slice(0, 10));
    setStartTime(initialData.startTime || initialData.eventTime || "");
    setEndTime(initialData.endTime || "");
    setImageMedia(resolveInitialMedia(initialData));
  }, [initialData]);

  useEffect(() => {
    getDepartments()
      .then((items) => {
        if (items && items.length > 0) {
          setDepartments(items.map((d) => ({ id: d.id, name: d.name })));
        }
      })
      .catch(() => {
        // Garder DEFAULT_DEPARTMENTS
      });
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Règle CCJV : si l'événement est déjà publié, il faut repasser par le brouillon pour le modifier
  const isCurrentlyPublished = isEditing && initialStatus === "PUBLISHED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Le titre est obligatoire.";
    if (!startDate) newErrors.startDate = "La date de début est obligatoire.";
    if (!endDate) newErrors.endDate = "La date de fin est obligatoire.";
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = "La date de fin ne peut pas être antérieure à la date de début.";
    }
    if (!location.trim()) newErrors.location = "Le lieu est obligatoire.";

    if (status === "PUBLISHED" && !imageMedia?.url) {
      newErrors.imageUrl = "Une affiche ou miniature issue de la bibliothèque est obligatoire pour publier l'événement.";
    }

    if (isCurrentlyPublished && status === "PUBLISHED") {
      newErrors.status = "Veuillez repasser l'événement en brouillon avant de pouvoir enregistrer ses modifications.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(
        newErrors.status || "Veuillez corriger les erreurs indiquées dans le formulaire.",
      );
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      departmentId: departmentId.trim() ? departmentId.trim() : null,
      description: description.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      status,
      location: location.trim(),
      startDate,
      eventDate: startDate,
      endDate,
      startTime: startTime.trim() || null,
      eventTime: startTime.trim() || null,
      endTime: endTime.trim() || null,
      imageUrl: imageMedia?.url || undefined,
      imageMediaId: imageMedia?.mediaId || undefined,
    };

    setIsSaving(true);
    try {
      await onSubmit(payload);
      toast.success(isEditing ? "Événement mis à jour." : "Événement enregistré avec succès.");
      router.push("/admin/agenda");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =========================================================================
          01 — EN-TÊTE SUPÉRIEUR HARMONISÉ (Design de TeachingForm)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-ccjv-line">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/agenda"
            className="p-2 text-ccjv-ink-secondary hover:text-ccjv-ink bg-white border border-ccjv-line transition-colors rounded-none"
            title="Retour à l'agenda"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-serif text-ccjv-ink">
              {isEditing ? `Modifier : ${title || "Événement"}` : "Nouvel événement"}
            </h1>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              Renseignez les détails du culte ou de l&apos;activité, les dates et l&apos;affiche de l&apos;événement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button href="/admin/agenda" variant="outline" size="sm" disabled={isSaving}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isSaving} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isEditing ? "Enregistrer" : "Publier"}
          </Button>
        </div>
      </div>

      {isCurrentlyPublished && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-none flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Cet événement est actuellement publié</p>
              <p className="text-xs text-amber-700 mt-1">
                Conformément aux règles de gestion de l&apos;église, toute modification exige son passage préalable en brouillon.
              </p>
            </div>
          </div>
          {status === "PUBLISHED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("DRAFT");
                toast.info("Statut basculé en Brouillon. Vous pouvez maintenant modifier l'événement.");
              }}
            >
              Passer en Brouillon
            </Button>
          )}
        </div>
      )}

      {/* =========================================================================
          02 — GRILLE DEUX COLONNES (Gauche STICKY avec marge, Droite DÉROULANTE)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche STICKY : INFORMATIONS TEXTUELLES (distance idéale sous la topbar) */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-0 self-start">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Détails de l&apos;Événement
            </h2>

            <FormField label="Titre de l'événement" required error={errors.title}>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="Ex: Conférence Annuelle de la Grâce"
                error={Boolean(errors.title)}
              />
            </FormField>

            <FormField label="Lieu" required error={errors.location}>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Temple Principal CCJV, Lubumbashi"
                error={Boolean(errors.location)}
              />
            </FormField>

            <FormField label="Description détaillée">
              <Textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez le thème, l'orateur invité ou le déroulement..."
              />
            </FormField>
          </div>
        </div>

        {/* Colonne droite DÉROULANTE : AFFICHE & CALENDRIER */}
        <div className="space-y-6">
          {/* Bloc Affiche / Miniature avec prévisualisation et Bucket */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Affiche & Miniature
            </h2>

            <AdminMediaField
              label="Affiche ou miniature de l'événement"
              hint="Illustration principale affichée sur la carte de l'agenda et l'en-tête"
              required={status === "PUBLISHED"}
              error={errors.imageUrl}
              value={imageMedia}
              onChange={setImageMedia}
              acceptedTypes="image"
            />
          </div>

          {/* Bloc Calendrier, Horaires et Statut */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Calendrier & Horaires
            </h2>

            <FormField label="Date de début :" required error={errors.startDate}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                error={Boolean(errors.startDate)}
              />
            </FormField>

            <FormField label="Date de fin :">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={Boolean(errors.endDate)}
              />
            </FormField>

            <FormField label="Heure :">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </div>
    </form>
  );
}
