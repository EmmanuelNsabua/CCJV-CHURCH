"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, User, UserPlus, Pencil } from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { AdminMediaField, type AdminMediaValue } from "@/components/admin/media/AdminMediaField";
import { LeaderModal, type DepartmentLeaderData } from "@/components/admin/forms/LeaderModal";
import type { Department, DepartmentActivityItem } from "@/types";
import { slugify } from "@/lib/utils";
import { getLeaders } from "@/lib/api";

export interface DepartmentFormSubmitPayload {
  department: Record<string, unknown>;
  activities: { title: string; description?: string | null; imageMediaId?: string | null; position?: number }[];
  leader?: DepartmentLeaderData | null;
  removedLeaderId?: string | null;
}

export interface DepartmentFormProps {
  initialData?: Department;
  onSubmit: (payload: DepartmentFormSubmitPayload) => Promise<void>;
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
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [meetingSchedule, setMeetingSchedule] = useState(initialData?.meetingSchedule || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [mission, setMission] = useState(initialData?.mission || "");
  const [history, setHistory] = useState(initialData?.history || "");

  // Leader / Responsable du pôle
  const initialLeader: DepartmentLeaderData | null = initialData?.leaders?.[0]
    ? {
        id: initialData.leaders[0].id,
        name: initialData.leaders[0].name,
        role: initialData.leaders[0].role,
        photoMediaId: initialData.leaders[0].photoMediaId,
        photoUrl: initialData.leaders[0].photoUrl,
      }
    : initialData?.responsibleName
      ? {
          name: initialData.responsibleName,
          role: "Responsable du pôle",
          photoMediaId: null,
          photoUrl: null,
        }
      : null;

  const [leader, setLeader] = useState<DepartmentLeaderData | null>(initialLeader);
  const [removedLeaderId, setRemovedLeaderId] = useState<string | null>(null);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);

  useEffect(() => {
    if (initialData?.id && !initialData.leaders?.length) {
      getLeaders({ departmentId: initialData.id })
        .then((ldrs) => {
          if (ldrs && ldrs.length > 0) {
            const first = ldrs[0];
            setLeader({
              id: first.id,
              name: first.name,
              role: first.role,
              photoUrl: first.photo ?? null,
            });
          }
        })
        .catch(() => {});
    }
  }, [initialData?.id, initialData?.leaders]);

  const handleSaveLeader = (data: DepartmentLeaderData) => {
    setLeader(data);
    if (removedLeaderId === data.id) {
      setRemovedLeaderId(null);
    }
  };

  const handleRemoveLeader = () => {
    if (leader?.id) {
      setRemovedLeaderId(leader.id);
    }
    setLeader(null);
  };

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
    if (!isEditing || !slug) {
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
        slug: slug.trim() || slugify(name.trim()),
        tagline: tagline.trim() || null,
        responsibleName: leader ? leader.name : null,
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
        leader,
        removedLeaderId,
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
    <>
      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-150">
      {/* En-tête formulaire avec fil d'ariane et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ccjv-line pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/departments"
            className="p-2 text-ccjv-ink-secondary hover:text-ccjv-ink bg-white border border-ccjv-line transition-colors rounded-none"
            title="Retour aux départements"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-ccjv-ink">
              {isEditing ? `Modifier : ${name || "le département"}` : "Nouveau Département"}
            </h1>
            <p className="text-xs text-ccjv-ink-secondary mt-1">
              Définissez l&apos;identité, la mission, l&apos;histoire et les activités du pôle de service.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              Identité et Vision
            </h2>

            <FormField
              label="Nom du département"
              required
              error={formErrors.name}
              hint=""
            >
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex. Chorale Sainte-Cécile"
              />
            </FormField>

            <FormField
              label="Phrase d'accroche"
              hint=""
            >
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex. Louer l'Éternel de tout cœur et porter la prière communautaire."
              />
            </FormField>

            <FormField
              label="Description"
              hint=""
            >
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentez brièvement le rôle du pôle au sein de l'assemblée..."
              />
            </FormField>

            <FormField
              label="Mission"
              hint=""
            >
              <Textarea
                rows={4}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Décrivez ce que porte le département, ses fondements bibliques et sa mission au quotidien..."
              />
            </FormField>

            <FormField
              label="Histoire"
              hint=""
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
                  Activités & Services du pôle
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddActivity}
                className="text-[11px] rounded-none hover:border-ccjv-green"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
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
                          title="Supprimer"
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
              Coordination
            </h2>

            {/* Zone Responsable du pôle (hauteur fixe) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ccjv-ink hidden">
                  Responsable du pôle
                </label>
                {leader && (
                  <button
                    type="button"
                    onClick={() => setIsLeaderModalOpen(true)}
                    className="text-xs text-ccjv-green hover:underline flex items-center gap-1 font-medium"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </button>
                )}
              </div>

              {/* Conteneur à hauteur fixe (120px) */}
              <div className="h-[120px] w-full">
                {!leader ? (
                  <div className="h-full w-full border border-dashed border-ccjv-line bg-ccjv-offwhite p-4 flex flex-col items-center justify-center gap-2 text-center">
                    <p className="text-xs text-ccjv-ink-secondary">
                      Aucun responsable assigné à ce pôle.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLeaderModalOpen(true)}
                      className="hover:border-ccjv-green text-[11px] mt-2 rounded-none"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5 text-ccjv-green" />
                      Ajouter
                    </Button>
                  </div>
                ) : (
                  <div className="h-full w-full border border-ccjv-line bg-white p-3 flex items-center justify-between gap-3 shadow-2xs">
                    {/* Flux horizontal : Photo -> Identités (nom et rôle) */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Photo à gauche */}
                      <div className="relative w-16 h-16 shrink-0 border border-ccjv-line bg-ccjv-offwhite flex items-center justify-center overflow-hidden">
                        {leader.photoUrl ? (
                          <Image
                            src={leader.photoUrl}
                            alt={leader.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <User className="h-7 w-7 text-ccjv-ink-secondary/50" />
                        )}
                      </div>

                      {/* Identités : Nom et Rôle */}
                      <div className="min-w-0">
                        <div className="inline-block bg-ccjv-green/10 text-ccjv-green text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 mb-1">
                          Responsable
                        </div>
                        <p className="font-bold text-sm text-ccjv-ink leading-tight truncate">
                          {leader.name}
                        </p>
                        <p className="text-xs text-ccjv-ink-secondary mt-0.5 line-clamp-2">
                          {leader.role || "Responsable du pôle"}
                        </p>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsLeaderModalOpen(true)}
                        title="Modifier"
                        className="p-1.5 border border-ccjv-line bg-white hover:bg-ccjv-offwhite text-ccjv-ink hover:text-ccjv-green transition-colors"
                        aria-label="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLeader}
                        title="Retirer ce responsable"
                        className="p-1.5 border border-ccjv-line bg-white hover:bg-red-50 text-red-600 hover:border-red-200 transition-colors"
                        aria-label="Retirer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photographie d'en-tête */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-2">
              Photographie d&apos;en-tête
            </h2>

            <AdminMediaField
              label=""
              hint=""
              value={bannerMedia}
              onChange={setBannerMedia}
              acceptedTypes="image"
            />
          </div>
        </div>
      </div>
    </form>

    {/* Modale flottante d'ajout / modification de responsable (rendue hors de la balise <form>) */}
    <LeaderModal
      isOpen={isLeaderModalOpen}
      onClose={() => setIsLeaderModalOpen(false)}
      onSave={handleSaveLeader}
      initialData={leader}
    />
  </>
);
}
