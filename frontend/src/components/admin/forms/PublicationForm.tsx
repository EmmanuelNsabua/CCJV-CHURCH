"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Send } from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { AdminMediaField, type AdminMediaValue } from "@/components/admin/media/AdminMediaField";
import type { PublicationRecord, CreatePublicationPayload } from "@/lib/api/types";
import { slugify } from "@/lib/utils";

export interface PublicationFormProps {
  initialData?: PublicationRecord;
  onSubmit: (payload: CreatePublicationPayload) => Promise<void>;
  isEditing?: boolean;
}

export function PublicationForm({
  initialData,
  onSubmit,
  isEditing = false,
}: PublicationFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Média de couverture
  const resolveInitialMedia = (data?: PublicationRecord): AdminMediaValue | null => {
    const url = data?.coverImage || (data?.type === "PHOTO" ? data?.contentUrl : undefined);
    if (!url) return null;
    return {
      mediaId: data?.coverMediaId || undefined,
      url,
      title: "Image de couverture",
      mimeType: "image/jpeg",
    };
  };

  const [coverMedia, setCoverMedia] = useState<AdminMediaValue | null>(() => resolveInitialMedia(initialData));

  const [bodyParagraphs, setBodyParagraphs] = useState<string[]>(
    initialData?.body && initialData.body.length > 0
      ? initialData.body
      : ["Écrivez ici le contenu ou premier paragraphe de l'enseignement..."],
  );

  // Synchronisation si initialData arrive asynchronement
  useEffect(() => {
    if (!initialData) return;
    setTitle(initialData.title || "");
    setDescription(initialData.description || "");
    setCoverMedia(resolveInitialMedia(initialData));
    if (initialData.body && initialData.body.length > 0) {
      setBodyParagraphs(initialData.body);
    }
  }, [initialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [savingTarget, setSavingTarget] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddParagraph = () => {
    setBodyParagraphs((prev) => [...prev, ""]);
  };

  const handleParagraphChange = (index: number, text: string) => {
    setBodyParagraphs((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const handleRemoveParagraph = (index: number) => {
    if (bodyParagraphs.length <= 1) {
      toast.warning("La publication doit contenir au moins un paragraphe.");
      return;
    }
    setBodyParagraphs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Le titre est obligatoire.";
    if (bodyParagraphs.every((p) => !p.trim())) {
      newErrors.body = "Au moins un paragraphe non vide est requis.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez renseigner les champs obligatoires.");
      return;
    }

    // Règle CCJV : Auteur attribué automatiquement (Ecodume si Ecodume, sinon Presse)
    const effectiveAuthor =
      initialData?.author === "Ecodume" ||
      initialData?.departmentId === "d0000000-0000-4000-8000-000000000004"
        ? "Ecodume"
        : "Presse";

    const effectiveDepartmentId =
      effectiveAuthor === "Ecodume"
        ? "d0000000-0000-4000-8000-000000000004"
        : "d0000000-0000-4000-8000-00000000000a"; // Presse & Communication

    const effectiveSlug = initialData?.slug || slugify(title.trim());
    const effectiveCoverImage = coverMedia?.url || undefined;
    const effectiveCoverMediaId = coverMedia?.mediaId || undefined;

    const payload: CreatePublicationPayload = {
      title: title.trim(),
      slug: effectiveSlug,
      type: "TEXTE",
      category: initialData?.category || "ENSEIGNEMENT",
      departmentId: effectiveDepartmentId,
      author: effectiveAuthor,
      description: description.trim() || undefined,
      coverMediaId: effectiveCoverMediaId,
      coverImage: effectiveCoverImage,
      contentUrl: effectiveCoverImage,
      body: bodyParagraphs.filter((p) => p.trim().length > 0),
      status: targetStatus,
      publishedAt: new Date().toISOString().slice(0, 10),
    };

    setIsSaving(true);
    setSavingTarget(targetStatus);
    try {
      await onSubmit(payload);
      toast.success(
        targetStatus === "PUBLISHED"
          ? "Publication mise en ligne avec succès."
          : "Publication enregistrée en brouillon.",
      );
      router.push("/admin/publications");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
      setSavingTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          01 — EN-TÊTE HARMONISÉ (Retour, Titre, Annuler, Enregistrer, Publier)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-ccjv-line">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/publications"
            className="p-2 text-ccjv-ink-secondary hover:text-ccjv-ink bg-white border border-ccjv-line transition-colors rounded-none"
            title="Retour à la liste des publications"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-serif text-ccjv-ink">
              {isEditing ? `Modifier : ${title || "Publication"}` : "Nouvelle publication"}
            </h1>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              Renseignez le titre, le texte de l&apos;enseignement et l&apos;image de couverture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Enregistrer (Brouillon) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave("DRAFT")}
            loading={isSaving && savingTarget === "DRAFT"}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>

          {/* Bouton Publier (Mise en ligne directe) */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSave("PUBLISHED")}
            loading={isSaving && savingTarget === "PUBLISHED"}
            disabled={isSaving}
          >
            <Plus className="h-4 w-4" />
            Publier
          </Button>
        </div>
      </div>

      {/* =========================================================================
          02 — GRILLE DEUX COLONNES (Gauche STICKY à 24px, Droite DÉROULANTE)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche STICKY : INFORMATIONS TEXTUELLES */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 self-start">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Informations Principales
            </h2>

            {/* Titre de la publication plein champ (Slug et Auteur retirés du formulaire) */}
            <FormField label="Titre de la publication" required error={errors.title}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Culte du dimanche — La maison de Dieu"
                error={Boolean(errors.title)}
              />
            </FormField>

            {/* Description courte / Accroche */}
            <FormField
              label="Description courte (Accroche)"
              error={errors.description}
              hint="Court texte d'introduction apparaissant dans les listes et cartes"
            >
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Résumé concis du message ou de l'enseignement..."
                error={Boolean(errors.description)}
              />
            </FormField>
          </div>

          {/* Corps du texte (Paragraphes) */}
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  Corps du texte (Paragraphes)
                </h2>
                <p className="text-xs text-ccjv-ink-secondary mt-0.5">
                  Rédigez les paragraphes structurant l&apos;enseignement ou l&apos;article.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddParagraph}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ccjv-green hover:underline border border-ccjv-green/20 px-2.5 py-1 bg-ccjv-green-soft"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un paragraphe
              </button>
            </div>

            {errors.body && (
              <p className="text-xs text-[#b91c1c] font-medium">{errors.body}</p>
            )}

            <div className="space-y-4">
              {bodyParagraphs.map((para, index) => (
                <div
                  key={index}
                  className="p-4 bg-[#fafaf7] border border-ccjv-line space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ccjv-ink-secondary">
                      Paragraphe #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParagraph(index)}
                      className="text-ccjv-ink-secondary hover:text-[#b91c1c] p-1 transition-colors"
                      title="Supprimer ce paragraphe"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Textarea
                    rows={4}
                    value={para}
                    onChange={(e) => handleParagraphChange(index, e.target.value)}
                    placeholder={`Saisissez le contenu du paragraphe ${index + 1}...`}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddParagraph}
              className="w-full justify-center text-xs mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un autre paragraphe
            </Button>
          </div>
        </div>

        {/* Colonne droite DÉROULANTE : UNIQUEMENT MÉDIA & COUVERTURE */}
        <div className="space-y-6">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Média & Couverture
            </h2>

            <AdminMediaField
              label="Image de couverture"
              hint="Illustration principale affichée sur la carte et l'en-tête de l'article"
              value={coverMedia}
              onChange={setCoverMedia}
              acceptedTypes="image"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
