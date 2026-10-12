"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Select } from "@/components/admin/forms/Select";
import { Checkbox } from "@/components/admin/forms/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { PublicationRecord, CreatePublicationPayload, PublicationType } from "@/lib/api/types";
import { getDepartments } from "@/lib/api";
import { slugify } from "@/lib/utils";

const DEFAULT_DEPARTMENTS = [
  { id: "d0000000-0000-4000-8000-00000000000a", name: "Presse & Communication" },
  { id: "d0000000-0000-4000-8000-000000000001", name: "Les Serviteurs" },
  { id: "d0000000-0000-4000-8000-000000000002", name: "La Chorale Grand Groupe CCVJ" },
  { id: "d0000000-0000-4000-8000-000000000003", name: "La Chorale de Cano Vocal" },
  { id: "d0000000-0000-4000-8000-000000000004", name: "L'Ecodume" },
  { id: "d0000000-0000-4000-8000-000000000005", name: "Affaires Sociales" },
  { id: "d0000000-0000-4000-8000-000000000006", name: "Hygiène et Ancienneté" },
  { id: "d0000000-0000-4000-8000-000000000007", name: "Protocole" },
  { id: "d0000000-0000-4000-8000-000000000008", name: "Évangélisation" },
  { id: "d0000000-0000-4000-8000-000000000009", name: "Intercession" },
];

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
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);
  const [type, setType] = useState<PublicationType>(initialData?.type || "TEXTE");
  const [category, setCategory] = useState<string>(initialData?.category || "ENSEIGNEMENT");
  const [departmentId, setDepartmentId] = useState<string>(
    initialData?.departmentId || "d0000000-0000-4000-8000-00000000000a",
  );
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [author, setAuthor] = useState(initialData?.author || "Pasteur Principal");
  const [description, setDescription] = useState(initialData?.description || "");
  const [contentUrl, setContentUrl] = useState(initialData?.contentUrl || initialData?.coverImage || "");
  const [isPublished, setIsPublished] = useState(
    initialData?.status ? initialData.status === "PUBLISHED" : true,
  );
  const [bodyParagraphs, setBodyParagraphs] = useState<string[]>(
    initialData?.body && initialData.body.length > 0
      ? initialData.body
      : ["Écrivez ici le contenu ou premier paragraphe de l'enseignement..."],
  );

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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Le titre est obligatoire.";
    if (!author.trim()) newErrors.author = "L'auteur est obligatoire.";
    if (type === "TEXTE" && bodyParagraphs.every((p) => !p.trim())) {
      newErrors.body = "Au moins un paragraphe non vide est requis.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    const payload: CreatePublicationPayload = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      type,
      category: category.trim(),
      departmentId,
      author: author.trim(),
      description: description.trim() || undefined,
      contentUrl: contentUrl.trim() || undefined,
      body: type === "TEXTE" ? bodyParagraphs.filter((p) => p.trim().length > 0) : undefined,
      status: isPublished ? "PUBLISHED" : "DRAFT",
      publishedAt: new Date().toISOString().slice(0, 10),
    };

    setIsSaving(true);
    try {
      await onSubmit(payload);
      toast.success(
        isEditing
          ? "Publication mise à jour avec succès."
          : "Publication créée avec succès.",
      );
      router.push("/admin/publications");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la publication.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }

  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Barre d'action supérieure */}
      <div className="flex items-center justify-between pb-4 border-b border-ccjv-line">
        <Link
          href="/admin/publications"
          className="inline-flex items-center gap-1.5 text-xs text-ccjv-ink-secondary hover:text-ccjv-green transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste des publications
        </Link>

        <div className="flex items-center gap-3">
          <Button
            href="/admin/publications"
            variant="outline"
            size="sm"
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSaving}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isEditing ? "Enregistrer les modifications" : "Publier / Créer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Principale (Contenu & Rédaction) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Informations Principales
            </h2>

            <FormField label="Titre de la publication" required error={errors.title}>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: La puissance de la foi agissante"
                error={Boolean(errors.title)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Identifiant URL (Slug)"
                hint="Généré automatiquement à partir du titre"
              >
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="la-puissance-de-la-foi"
                />
              </FormField>

              <FormField label="Auteur / Orateur" required error={errors.author}>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Pasteur Emmanuel"
                  error={Boolean(errors.author)}
                />
              </FormField>
            </div>

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

          {/* Paragraphes du corps (pour type TEXTE) */}
          {type === "TEXTE" && (
            <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                    Corps du texte (Paragraphes)
                  </h2>
                  <p className="text-xs text-ccjv-ink-secondary mt-0.5">
                    Rédigez les paragraphes structurant l'enseignement ou l'article.
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
          )}
        </div>

        {/* Colonne Latérale (Paramètres & Métadonnées) */}
        <div className="space-y-6">
          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Publication & Visibilité
            </h2>

            <div className="pt-1">
              <Checkbox
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                label="Mettre en ligne immédiatement"
                hint="Si décoché, la publication sera enregistrée comme brouillon."
              />
            </div>

            <FormField label="Format de publication">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as PublicationType)}
                options={[
                  { label: "Texte / Enseignement", value: "TEXTE" },
                  { label: "Vidéo / Prédication", value: "VIDEO" },
                  { label: "Galerie / Photo", value: "PHOTO" },
                ]}
              />
            </FormField>

            <FormField label="Rubrique éditoriale">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { label: "Enseignement", value: "ENSEIGNEMENT" },
                  { label: "Actualité", value: "ACTUALITE" },
                  { label: "Média", value: "MEDIA" },
                  { label: "Ressource", value: "RESSOURCE" },
                ]}
              />
            </FormField>

            <FormField label="Département de rattachement">
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={departments.map((d) => ({
                  label: d.name,
                  value: d.id,
                }))}
              />
            </FormField>
          </div>

          <div className="bg-white border border-ccjv-line p-6 rounded-none space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-line pb-3">
              Média & Couverture
            </h2>

            <FormField
              label="URL du média ou de couverture"
              hint="Lien YouTube, image de couverture ou fichier média"
            >
              <Input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://..."
              />
            </FormField>
          </div>
        </div>
      </div>
    </form>
  );
}
