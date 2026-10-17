"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { AdminMediaField, type AdminMediaValue } from "@/components/admin/media/AdminMediaField";
import type { Department, DepartmentActivityItem } from "@/types";
import { slugify } from "@/lib/utils";

export interface DepartmentFormProps {
  initialData?: Department;
  onSubmit: (payload: {
    department: Record<string, unknown>;
    activities: { title: string; description?: string | null; imageMediaId?: string | null; position?: number }[];
  }) => Promise<void>;
  isEditing?: boolean;
}

export function DepartmentForm({
  initialData,
  onSubmit,
  isEditing = false,
}: DepartmentFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialData?.slug));
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [responsibleName, setResponsibleName] = useState(initialData?.responsibleName || "");
  const [meetingSchedule, setMeetingSchedule] = useState(initialData?.meetingSchedule || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [mission, setMission] = useState(initialData?.mission || "");
  const [history, setHistory] = useState(initialData?.history || "");

  // Bannière
  const [bannerMedia, setBannerMedia] = useState<AdminMediaValue | null>(
    initialData?.bannerImage
      ? {
          url: initialData.bannerImage,
          title: "Bannière actuelle",
        }
      : null,
  );

  // Activités
  const [activities, setActivities] = useState<
    Array<{
      id?: string;
      title: string;
      description: string;
      imageMedia: AdminMediaValue | null;
    }>
  >(
    (initialData?.activities || []).map((act: DepartmentActivityItem) => ({
      id: act.id,
      title: act.title,
      description: act.description || "",
      imageMedia: act.imageUrl
        ? {
            mediaId: act.imageMediaId || undefined,
            url: act.imageUrl,
            title: act.title,
          }
        : null,
    })),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual && !isEditing) {
      setSlug(slugify(val));
    }
  };

  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        imageMedia: null,
      },
    ]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveActivity = (index: number, direction: "up" | "down") => {
    setActivities((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleActivityChange = (
    index: number,
    field: "title" | "description" | "imageMedia",
    value: string | AdminMediaValue | null,
  ) => {
    setActivities((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Le nom du département est obligatoire.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Veuillez renseigner les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const departmentPayload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        tagline: tagline.trim() || null,
        responsibleName: responsibleName.trim() || null,
        meetingSchedule: meetingSchedule.trim() || null,
        description: description.trim() || null,
        mission: mission.trim() || null,
        history: history.trim() || null,
        bannerMediaId: bannerMedia?.mediaId || null,
      };

      const activitiesPayload = activities
        .filter((act) => act.title.trim().length > 0)
        .map((act, idx) => ({
          title: act.title.trim(),
          description: act.description.trim() || null,
          imageMediaId: act.imageMedia?.mediaId || null,
          position: idx + 1,
        }));

      await onSubmit({
        department: departmentPayload,
        activities: activitiesPayload,
      });

      toast.success(
        isEditing
          ? "Département mis à jour avec succès."
          : "Nouveau département créé avec succès.",
      );
      router.push("/admin/departments");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du département.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-150">
      {/* En-tête formulaire avec fil d'ariane et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ccjv-line pb-6">
        <div>
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1.5 text-xs text-ccjv-ink-secondary hover:text-ccjv-ink mb-2 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la liste des départements
          </Link>
          <h1 className="text-2xl font-serif font-bold text-ccjv-ink">
            {isEditing ? `Modifier : ${name || "le département"}` : "Nouveau Département"}
          </h1>
          <p className="text-xs text-ccjv-ink-secondary mt-1">
            Définissez l&apos;identité, la mission, l&apos;histoire et les activités du pôle de service.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && slug && (
            <Link
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ccjv-ink-secondary hover:text-ccjv-green border border-ccjv-line px-3 py-2 bg-white"
            >
              <span>Aperçu public</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="font-semibold"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne principale (Contenu éditorial) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Identité & Vision */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-2">
              1. Identité et Vision
            </h2>

            <FormField
              label="Nom du département ou ministère"
              required
              error={formErrors.name}
              hint="Exemple : La Chorale Grand Groupe, Intercession, Protocole..."
            >
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex. Chorale Sainte-Cécile"
              />
            </FormField>

            <FormField
              label="Slug (identifiant d'URL)"
              hint="Généré automatiquement à partir du nom si laissé vide."
            >
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                placeholder="chorale-sainte-cecile"
              />
            </FormField>

            <FormField
              label="Phrase d'accroche (Tagline)"
              hint="Courte phrase résumant la devise ou le cœur du ministère."
            >
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex. Louer l'Éternel de tout cœur et porter la prière communautaire."
              />
            </FormField>

            <FormField
              label="Description générale"
              hint="Aperçu synthétique affiché dans les listes et en tête de fiche."
            >
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentez brièvement le rôle du pôle au sein de l'assemblée..."
              />
            </FormField>

            <FormField
              label="Mission & Vocation"
              hint="Objectifs spirituels, vision doctrinale et portée du ministère."
            >
              <Textarea
                rows={4}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Décrivez ce que porte le département, ses fondements bibliques et sa mission au quotidien..."
              />
            </FormField>

            <FormField
              label="Histoire & Origines"
              hint="Récit de création du département, témoignages fondateurs ou étapes de développement."
            >
              <Textarea
                rows={4}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder="Racontez la genèse de ce département au sein du Centre Chrétien Jésus ma Vie..."
              />
            </FormField>
          </div>

          {/* Activités du département */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  2. Activités & Services du pôle
                </h2>
                <p className="text-xs text-ccjv-ink-secondary mt-0.5">
                  Présentez les sous-activités concrètes (ex: Répétitions, Formations, Sorties, Accueil).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddActivity}
                className="font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter une activité
              </Button>
            </div>

            {activities.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-ccjv-line bg-ccjv-offwhite">
                <p className="text-xs text-ccjv-ink-secondary">
                  Aucune activité structurée pour le moment. Cliquez sur « Ajouter une activité » pour en enrichir la fiche.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((act, index) => (
                  <div
                    key={act.id || `act-${index}`}
                    className="border border-ccjv-line p-4 bg-ccjv-offwhite space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-ccjv-line/60 pb-2">
                      <span className="text-xs font-semibold text-ccjv-ink uppercase">
                        Activité #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveActivity(index, "up")}
                          disabled={index === 0}
                          title="Monter"
                          className="p-1 hover:bg-white text-ccjv-ink disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveActivity(index, "down")}
                          disabled={index === activities.length - 1}
                          title="Descendre"
                          className="p-1 hover:bg-white text-ccjv-ink disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveActivity(index)}
                          title="Supprimer cette activité"
                          className="p-1 hover:bg-red-50 text-red-600 ml-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Titre de l'activité" required>
                        <Input
                          value={act.title}
                          onChange={(e) =>
                            handleActivityChange(index, "title", e.target.value)
                          }
                          placeholder="Ex. Répétition générale"
                        />
                      </FormField>

                      <FormField label="Description synthétique">
                        <Input
                          value={act.description}
                          onChange={(e) =>
                            handleActivityChange(index, "description", e.target.value)
                          }
                          placeholder="Ex. Tous les vendredis soirs..."
                        />
                      </FormField>
                    </div>

                    <AdminMediaField
                      label="Illustration de l'activité (facultative)"
                      value={act.imageMedia}
                      onChange={(media) =>
                        handleActivityChange(index, "imageMedia", media)
                      }
                      acceptedTypes="image"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne latérale (Médias & Coordination) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coordination & Responsable */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-2">
              3. Coordination
            </h2>

            <FormField
              label="Responsable du pôle"
              hint="Personnage cité à titre de référence pour les membres."
            >
              <Input
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ex. Frère David Mukendi"
              />
            </FormField>

            <FormField
              label="Rythme & Horaires de rencontre"
              hint="Jour et heure habituels de rassemblement du pôle."
            >
              <Input
                value={meetingSchedule}
                onChange={(e) => setMeetingSchedule(e.target.value)}
                placeholder="Ex. Vendredi · 17:00 — Répétition générale"
              />
            </FormField>
          </div>

          {/* Photographie d'en-tête */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-2">
              4. Photographie d&apos;en-tête
            </h2>

            <AdminMediaField
              label="Bannière d'en-tête (Hero)"
              hint="Grande image représentative du département affichée en haut de page."
              value={bannerMedia}
              onChange={setBannerMedia}
              acceptedTypes="image"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
