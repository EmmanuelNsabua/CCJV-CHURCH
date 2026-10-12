"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Select } from "@/components/admin/forms/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Event, EventStatus } from "@/lib/api/types";
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
  const [status, setStatus] = useState<EventStatus>(initialData?.status || "UPCOMING");
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId || "d0000000-0000-4000-8000-000000000001",
  );
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [location, setLocation] = useState(initialData?.location || "Temple Principal CCJV, Lubumbashi");
  const [eventDate, setEventDate] = useState(
    initialData?.eventDate ? initialData.eventDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [eventTime, setEventTime] = useState(initialData?.eventTime || "09:00");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");

  useEffect(() => {
    getDepartments()
      .then((items) => {
        if (items && items.length > 0) {
          setDepartments(items.map((d) => ({ id: d.id, name: d.name })));
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_DEPARTMENTS is already set
      });
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Le titre est obligatoire.";
    if (!eventDate) newErrors.eventDate = "La date de l'événement est obligatoire.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      departmentId,
      description: description.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      status,
      location: location.trim() || undefined,
      eventDate,
      eventTime: eventTime.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await onSubmit(payload);
      toast.success(isEditing ? "Événement mis à jour." : "Événement programmé avec succès.");
      router.push("/admin/agenda");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }

  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-ccjv-line">
        <Link
          href="/admin/agenda"
          className="inline-flex items-center gap-1.5 text-xs text-ccjv-ink-secondary hover:text-ccjv-green transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'agenda
        </Link>

        <div className="flex items-center gap-3">
          <Button href="/admin/agenda" variant="outline" size="sm" disabled={isSaving}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isSaving} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isEditing ? "Mettre à jour" : "Enregistrer l'événement"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Détails de l'Événement
            </h2>

            <FormField label="Titre de l'événement" required error={errors.title}>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="Ex: Culte d'actions de grâces"
                error={Boolean(errors.title)}
              />
            </FormField>

            <FormField label="Accroche courte (Optionnel)">
              <Input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ex: Célébration dominicale et louange prophétique"
              />
            </FormField>

            <FormField label="Description détaillée">
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez le thème, l'orateur invité ou le déroulement..."
              />
            </FormField>

            <FormField label="Lieu / Emplacement">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Temple Principal CCJV, Lubumbashi"
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Date & Horaires
            </h2>

            <FormField label="Date de l'événement" required error={errors.eventDate}>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                error={Boolean(errors.eventDate)}
              />
            </FormField>

            <FormField label="Heure de début">
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </FormField>

            <FormField label="Statut">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                options={[
                  { label: "À venir", value: "UPCOMING" },
                  { label: "Archivé / Passé", value: "ARCHIVED" },
                ]}
              />
            </FormField>

            <FormField label="Département organisateur">
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={departments.map((d) => ({
                  label: d.name,
                  value: d.id,
                }))}
              />
            </FormField>

            <FormField label="Affiche ou visuel (URL)">
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </FormField>
          </div>
        </div>
      </div>
    </form>
  );
}
