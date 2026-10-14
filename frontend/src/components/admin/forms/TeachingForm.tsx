"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Globe,
  Archive,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Video,
  Mic,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Library,
  X,
} from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Select } from "@/components/admin/forms/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/admin/feedback/ToastContext";
import {
  createEnseignement,
  updateEnseignement,
  updateEnseignementReferences,
  updateEnseignementMedias,
  publishEnseignement,
  archiveEnseignement,
  listAdminMedia,
} from "@/lib/api/endpoints";
import type {
  EnseignementRecord,
  BiblicalReferenceInputPayload,
  TeachingMediaInputPayload,
  TeachingMediaRole,
  AdminMediaItem,
} from "@/lib/api/types";
import { slugify } from "@/lib/utils";

export interface TeachingFormProps {
  initialData?: EnseignementRecord;
  isEditing?: boolean;
}

interface BiblicalRefDraft {
  id?: string;
  book: string;
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
  position: number;
}

interface MediaItemDraft {
  id?: string;
  mediaId: string;
  role: TeachingMediaRole;
  isPrimary: boolean;
  position: number;
  title?: string;
  url?: string;
  mimeType?: string;
}

export function TeachingForm({ initialData, isEditing = false }: TeachingFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Métadonnées générales
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);
  const [speakerName, setSpeakerName] = useState(initialData?.speakerName || "");
  const [preachedAt, setPreachedAt] = useState(
    initialData?.preachedAt
      ? initialData.preachedAt.substring(0, 10)
      : new Date().toISOString().substring(0, 10),
  );
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState(initialData?.status || "DRAFT");

  // Références bibliques
  const [references, setReferences] = useState<BiblicalRefDraft[]>(
    initialData?.references?.map((r, idx) => ({
      id: r.id,
      book: r.book,
      startChapter: r.startChapter,
      startVerse: r.startVerse,
      endChapter: r.endChapter,
      endVerse: r.endVerse,
      position: r.position ?? idx,
    })) || [],
  );

  // Médias associés
  const [medias, setMedias] = useState<MediaItemDraft[]>(
    initialData?.medias?.map((m, idx) => ({
      id: m.id,
      mediaId: m.mediaId,
      role: m.role,
      isPrimary: m.isPrimary,
      position: m.position ?? idx,
      title: m.media?.title || "Média central",
      url: m.media?.publicUrl,
      mimeType: m.media?.mimeType,
    })) || [],
  );

  // Bibliothèque centrale pour sélection
  const [centralMediaList, setCentralMediaList] = useState<AdminMediaItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilterType, setMediaFilterType] = useState<"ALL" | "video" | "audio" | "image">("ALL");

  // États de chargement et erreurs
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    listAdminMedia({ limit: 100 })
      .then((res) => {
        setCentralMediaList(res.data || []);
      })
      .catch((err) => {
        console.warn("[TeachingForm] Erreur chargement médiathèque :", err);
      });
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  // Ajout / manipulation de références bibliques
  const handleAddReference = () => {
    setReferences((prev) => [
      ...prev,
      {
        book: "Hébreux",
        startChapter: 1,
        startVerse: 1,
        endChapter: null,
        endVerse: null,
        position: prev.length,
      },
    ]);
  };

  const handleUpdateReference = <K extends keyof BiblicalRefDraft>(
    index: number,
    field: K,
    value: BiblicalRefDraft[K],
  ) => {
    setReferences((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = { ...target, [field]: value };
      return next;
    });
  };

  const handleRemoveReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveReference = (index: number, direction: "up" | "down") => {
    setReferences((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, position: idx }));
    });
  };

  // Manipulation des médias
  const handleSelectMediaFromLibrary = (item: AdminMediaItem) => {
    // Déterminer le rôle par défaut selon le type mime
    let defaultRole: TeachingMediaRole = "VIDEO";
    if (item.mimeType.startsWith("audio/")) {
      defaultRole = "AUDIO";
    } else if (item.mimeType.startsWith("image/")) {
      defaultRole = "THUMBNAIL";
    }

    // Si aucun média principal n'existe encore et que ce n'est pas une miniature, en faire le média principal
    const hasPrimary = medias.some((m) => m.isPrimary);
    const willBePrimary = !hasPrimary && defaultRole !== "THUMBNAIL";

    setMedias((prev) => [
      ...prev,
      {
        mediaId: item.id,
        role: defaultRole,
        isPrimary: willBePrimary,
        position: prev.length,
        title: item.filename,
        url: item.url,
        mimeType: item.mimeType,
      },
    ]);
    setIsMediaModalOpen(false);
  };

  const handleSetPrimaryMedia = (index: number) => {
    setMedias((prev) =>
      prev.map((item, idx) => ({
        ...item,
        isPrimary: idx === index,
      })),
    );
  };

  const handleUpdateMediaRole = (index: number, role: TeachingMediaRole) => {
    setMedias((prev) => {
      const next = [...prev];
      const isThumb = role === "THUMBNAIL";
      next[index] = {
        ...next[index],
        role,
        // Une miniature ne peut pas être média principal
        isPrimary: isThumb ? false : next[index].isPrimary,
      };
      return next;
    });
  };

  const handleRemoveMedia = (index: number) => {
    setMedias((prev) => prev.filter((_, i) => i !== index));
  };

  // Vérification de la condition impérative de publication :
  // Au moins un média principal audio ou vidéo valide
  const primaryMedia = useMemo(() => {
    return medias.find(
      (m) => m.isPrimary && (m.role === "VIDEO" || m.role === "AUDIO"),
    );
  }, [medias]);

  const canBePublished = Boolean(primaryMedia);

  // Validation formulaire
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est obligatoire";
    if (!speakerName.trim()) errs.speakerName = "Le nom de l'orateur est obligatoire";
    if (!preachedAt.trim()) errs.preachedAt = "La date de prédication est obligatoire";

    // Vérifier les références
    for (let i = 0; i < references.length; i++) {
      const r = references[i];
      if (!r.book.trim()) {
        errs[`ref_${i}_book`] = "Le nom du livre est obligatoire";
      }
      if (!r.startChapter || r.startChapter <= 0) {
        errs[`ref_${i}_startChapter`] = "Chapitre > 0 requis";
      }
      if (!r.startVerse || r.startVerse <= 0) {
        errs[`ref_${i}_startVerse`] = "Verset > 0 requis";
      }
      if (r.endChapter && r.endChapter < r.startChapter) {
        errs[`ref_${i}_endChapter`] = "Le chapitre de fin doit être >= au début";
      }
      if (
        r.endChapter === r.startChapter &&
        r.endVerse &&
        r.endVerse < r.startVerse
      ) {
        errs[`ref_${i}_endVerse`] = "Le verset de fin doit être >= au verset de début";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Sauvegarde principale (brouillon ou mise à jour normale)
  const handleSave = async (publishAfter = false) => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire.");
      return;
    }

    if (publishAfter && !canBePublished) {
      toast.error(
        "Publication impossible : vous devez associer au moins un média principal de type Audio ou Vidéo.",
      );
      return;
    }

    setIsSaving(true);
    try {
      let savedTeachingId = initialData?.id;

      if (isEditing && savedTeachingId) {
        // Mise à jour métadonnées
        await updateEnseignement(savedTeachingId, {
          title: title.trim(),
          slug: slug.trim(),
          speakerName: speakerName.trim(),
          preachedAt: preachedAt.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
        });
      } else {
        // Création
        const created = await createEnseignement({
          title: title.trim(),
          slug: slug.trim() || undefined,
          speakerName: speakerName.trim(),
          preachedAt: preachedAt.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
          status: "DRAFT",
        });
        savedTeachingId = created.id;
      }

      // Mise à jour atomique des références bibliques
      const refsPayload: BiblicalReferenceInputPayload[] = references.map(
        (r, idx) => ({
          book: r.book.trim(),
          startChapter: Number(r.startChapter),
          startVerse: Number(r.startVerse),
          endChapter: r.endChapter ? Number(r.endChapter) : null,
          endVerse: r.endVerse ? Number(r.endVerse) : null,
          position: idx,
        }),
      );
      await updateEnseignementReferences(savedTeachingId, refsPayload);

      // Mise à jour des associations de médias
      const mediasPayload: TeachingMediaInputPayload[] = medias.map(
        (m, idx) => ({
          mediaId: m.mediaId,
          role: m.role,
          isPrimary: m.isPrimary,
          position: idx,
        }),
      );
      await updateEnseignementMedias(savedTeachingId, mediasPayload);

      // Publication si demandée
      if (publishAfter) {
        await publishEnseignement(savedTeachingId);
        toast.success("Enseignement publié avec succès !");
      } else {
        toast.success(
          isEditing
            ? "Enseignement mis à jour avec succès."
            : "Brouillon d'enseignement enregistré avec succès.",
        );
      }

      router.push("/admin/enseignements");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Action explicite d'archivage
  const handleArchive = async () => {
    if (!initialData?.id) return;
    setIsArchiving(true);
    try {
      await archiveEnseignement(initialData.id);
      setStatus("ARCHIVED");
      toast.success("Enseignement archivé avec succès.");
      router.push("/admin/enseignements");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'archivage";
      toast.error(msg);
    } finally {
      setIsArchiving(false);
    }
  };

  // Médias filtrés pour le modal de sélection
  const filteredCentralMedias = useMemo(() => {
    return centralMediaList.filter((m) => {
      const matchSearch =
        !mediaSearch ||
        m.filename.toLowerCase().includes(mediaSearch.toLowerCase());
      const matchType =
        mediaFilterType === "ALL" ||
        (mediaFilterType === "video" && m.mimeType.startsWith("video/")) ||
        (mediaFilterType === "audio" && m.mimeType.startsWith("audio/")) ||
        (mediaFilterType === "image" && m.mimeType.startsWith("image/"));
      return matchSearch && matchType;
    });
  }, [centralMediaList, mediaSearch, mediaFilterType]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ccjv-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/enseignements"
            className="p-2 text-ccjv-ink-muted hover:text-ccjv-ink bg-white border border-ccjv-border transition-colors rounded-none"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-serif text-ccjv-ink">
                {isEditing ? `Modifier : ${initialData?.title}` : "Nouvel enseignement"}
              </h1>
              <Badge
                variant={
                  status === "PUBLISHED"
                    ? "success"
                    : status === "ARCHIVED"
                    ? "neutral"
                    : "warning"
                }
                className="text-[10px]"
              >
                {status === "PUBLISHED"
                  ? "Publié"
                  : status === "ARCHIVED"
                  ? "Archivé"
                  : "Brouillon"}
              </Badge>
            </div>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              Renseignez les métadonnées, références bibliques et les médias vidéo/audio.
            </p>
          </div>
        </div>

        {/* Boutons d'action principaux */}
        <div className="flex items-center gap-2">
          {isEditing && initialData?.status === "PUBLISHED" && (
            <a
              href={`/publications/enseignements/${initialData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ccjv-ink border border-ccjv-border bg-white hover:bg-ccjv-surface transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voir sur le site</span>
            </a>
          )}

          {isEditing && status !== "ARCHIVED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving || isSaving}
              className="text-xs text-amber-800 border-amber-300 hover:bg-amber-50"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              {isArchiving ? "Archivage..." : "Archiver"}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? "Enregistrement..." : "Enregistrer brouillon"}
          </Button>

          {status !== "PUBLISHED" && (
            <div
              title={
                !canBePublished
                  ? "Associez au moins un média Audio ou Vidéo principal pour publier"
                  : "Publier directement l'enseignement"
              }
            >
              <Button
                type="button"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={isSaving || !canBePublished}
                className="text-xs"
              >
                <Globe className="w-3.5 h-3.5 mr-1" />
                Publier l'enseignement
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alerte média requis pour publication */}
      {!canBePublished && (
        <div className="p-3 bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <span className="font-semibold">Condition de publication :</span>{" "}
            Pour publier cet enseignement sur le site public, vous devez lui associer au moins un média principal de type <strong>Vidéo</strong> ou <strong>Audio</strong>. Vous pouvez l'enregistrer comme brouillon en attendant.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Informations générales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 border border-ccjv-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-border pb-2">
              1. Informations Générales
            </h2>

            <FormField label="Titre de la prédication *" error={errors.title}>
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Ex. La puissance de la foi agissante"
                className="text-sm"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nom de l'orateur *" error={errors.speakerName}>
                <Input
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="Ex. Pasteur Jean-Claude"
                  className="text-sm"
                />
              </FormField>

              <FormField label="Date de prédication *" error={errors.preachedAt}>
                <Input
                  type="date"
                  value={preachedAt}
                  onChange={(e) => setPreachedAt(e.target.value)}
                  className="text-sm"
                />
              </FormField>
            </div>

            <FormField
              label="Slug de l'URL"
              hint="Identifiant lisible utilisé dans l'adresse de la page publique"
              error={errors.slug}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="la-puissance-de-la-foi-agissante"
                  className="text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSlug(slugify(title));
                    setAutoSlug(true);
                  }}
                  className="text-xs whitespace-nowrap"
                >
                  Régénérer
                </Button>
              </div>
            </FormField>

            <FormField
              label="Résumé court"
              hint="Bref extrait affiché dans les listes et cartes de présentation"
            >
              <Textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Synthèse en deux phrases du sermon..."
                className="text-sm"
              />
            </FormField>

            <FormField
              label="Description éditoriale / Notes de message"
              hint="Texte complet ou résumé des points principaux abordés"
            >
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Points clés, contexte et réflexions de la prédication..."
                className="text-sm"
              />
            </FormField>
          </div>

          {/* Section Références bibliques multiples */}
          <div className="bg-white p-5 border border-ccjv-border space-y-4">
            <div className="flex items-center justify-between border-b border-ccjv-border pb-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  2. Références Bibliques ({references.length})
                </h2>
                <p className="text-[11px] text-ccjv-ink-secondary">
                  Ajoutez les passages bibliques au cœur de cette prédication (ordre conservé).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReference}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un passage</span>
              </Button>
            </div>

            {references.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-ccjv-border bg-ccjv-surface text-xs text-ccjv-ink-secondary">
                Aucune référence biblique ajoutée pour l'instant. Cliquez sur « Ajouter un passage ».
              </div>
            ) : (
              <div className="space-y-3">
                {references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-ccjv-border bg-ccjv-surface/40 flex flex-col md:flex-row items-center gap-3"
                  >
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveReference(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 hover:bg-ccjv-surface text-ccjv-ink-secondary disabled:opacity-30"
                        title="Monter"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveReference(idx, "down")}
                        disabled={idx === references.length - 1}
                        className="p-1 hover:bg-ccjv-surface text-ccjv-ink-secondary disabled:opacity-30"
                        title="Descendre"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Livre *
                        </label>
                        <Input
                          value={ref.book}
                          onChange={(e) =>
                            handleUpdateReference(idx, "book", e.target.value)
                          }
                          placeholder="Ex. Hébreux"
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Chap. début *
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={ref.startChapter}
                          onChange={(e) =>
                            handleUpdateReference(
                              idx,
                              "startChapter",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Verset début *
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={ref.startVerse}
                          onChange={(e) =>
                            handleUpdateReference(
                              idx,
                              "startVerse",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Chap. fin
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={ref.endChapter ?? ""}
                          onChange={(e) =>
                            handleUpdateReference(
                              idx,
                              "endChapter",
                              e.target.value ? parseInt(e.target.value, 10) : null,
                            )
                          }
                          placeholder="Opt."
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Verset fin
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={ref.endVerse ?? ""}
                          onChange={(e) =>
                            handleUpdateReference(
                              idx,
                              "endVerse",
                              e.target.value ? parseInt(e.target.value, 10) : null,
                            )
                          }
                          placeholder="Opt."
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveReference(idx)}
                      className="p-1.5 text-ccjv-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer la référence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : Médias & Rôles */}
        <div className="space-y-6">
          <div className="bg-white p-5 border border-ccjv-border space-y-4">
            <div className="flex items-center justify-between border-b border-ccjv-border pb-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  3. Médias ({medias.length})
                </h2>
                <p className="text-[11px] text-ccjv-ink-secondary">
                  Vidéo, enregistrement audio et miniature.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMediaModalOpen(true)}
                className="text-xs flex items-center gap-1"
              >
                <Library className="w-3.5 h-3.5" />
                <span>Choisir média</span>
              </Button>
            </div>

            {/* Statut média principal */}
            <div className="p-3 bg-ccjv-surface border border-ccjv-border">
              <span className="text-[11px] font-semibold text-ccjv-ink block mb-1">
                Média principal pour la diffusion :
              </span>
              {primaryMedia ? (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {primaryMedia.role === "VIDEO" ? "Vidéo" : "Audio"} :{" "}
                    {primaryMedia.title || primaryMedia.mediaId.substring(0, 8)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Aucun média Audio/Vidéo principal désigné.</span>
                </div>
              )}
            </div>

            {/* Liste des médias associés */}
            {medias.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-ccjv-border bg-ccjv-surface text-xs text-ccjv-ink-secondary">
                Aucun média associé. Cliquez sur « Choisir média » pour puiser dans la médiathèque centrale.
              </div>
            ) : (
              <div className="space-y-3">
                {medias.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border transition-colors ${
                      item.isPrimary
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-ccjv-border bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {item.role === "VIDEO" && (
                          <Video className="w-4 h-4 text-emerald-700 shrink-0" />
                        )}
                        {item.role === "AUDIO" && (
                          <Mic className="w-4 h-4 text-blue-700 shrink-0" />
                        )}
                        {item.role === "THUMBNAIL" && (
                          <ImageIcon className="w-4 h-4 text-amber-700 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-ccjv-ink truncate max-w-[180px]">
                            {item.title || item.mediaId}
                          </p>
                          <p className="text-[10px] text-ccjv-ink-secondary font-mono truncate max-w-[180px]">
                            {item.mediaId}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="text-ccjv-ink-muted hover:text-red-600 p-1"
                        title="Détacher ce média"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-ccjv-border/60">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Rôle
                        </label>
                        <Select
                          value={item.role}
                          onChange={(e) =>
                            handleUpdateMediaRole(
                              idx,
                              e.target.value as TeachingMediaRole,
                            )
                          }
                          className="text-xs py-1"
                        >
                          <option value="VIDEO">Vidéo</option>
                          <option value="AUDIO">Audio</option>
                          <option value="THUMBNAIL">Miniature</option>
                        </Select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                          Média principal ?
                        </label>
                        {item.role === "THUMBNAIL" ? (
                          <span className="text-[11px] text-ccjv-ink-muted block py-1">
                            Non permis
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryMedia(idx)}
                            className={`w-full py-1 text-xs border text-center transition-colors ${
                              item.isPrimary
                                ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                                : "bg-white text-ccjv-ink border-ccjv-border hover:bg-ccjv-surface"
                            }`}
                          >
                            {item.isPrimary ? "★ Principal" : "Définir"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de sélection dans la médiathèque centrale */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-ccjv-border max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-ccjv-border flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-ccjv-ink">
                  Bibliothèque Centrale des Médias
                </h3>
                <p className="text-[11px] text-ccjv-ink-secondary">
                  Sélectionnez une ressource déjà stockée pour l'associer à l'enseignement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="p-1 hover:bg-ccjv-surface text-ccjv-ink-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filtres du modal */}
            <div className="p-3 border-b border-ccjv-border bg-ccjv-surface flex flex-col md:flex-row gap-2">
              <Input
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Rechercher par nom de fichier..."
                className="text-xs flex-1"
              />
              <Select
                value={mediaFilterType}
                onChange={(e) =>
                  setMediaFilterType(
                    e.target.value as "ALL" | "video" | "audio" | "image",
                  )
                }
                className="text-xs w-full md:w-36"
              >
                <option value="ALL">Tous types</option>
                <option value="video">Vidéos</option>
                <option value="audio">Audios</option>
                <option value="image">Images</option>
              </Select>
            </div>

            {/* Liste des médias du modal */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-ccjv-border">
              {filteredCentralMedias.length === 0 ? (
                <div className="text-center py-8 text-xs text-ccjv-ink-secondary">
                  Aucun média trouvé. Vous pouvez en téléverser un depuis la section Médiathèque.
                </div>
              ) : (
                filteredCentralMedias.map((m) => (
                  <div
                    key={m.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-ccjv-surface px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {m.mimeType.startsWith("video/") ? (
                        <div className="w-8 h-8 bg-emerald-100 flex items-center justify-center text-emerald-700">
                          <Video className="w-4 h-4" />
                        </div>
                      ) : m.mimeType.startsWith("audio/") ? (
                        <div className="w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-700">
                          <Mic className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-amber-100 flex items-center justify-center text-amber-700">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-ccjv-ink truncate max-w-sm">
                          {m.filename}
                        </p>
                        <p className="text-[10px] text-ccjv-ink-secondary">
                          {m.mimeType} • {(m.sizeBytes / 1024 / 1024).toFixed(1)} Mo
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectMediaFromLibrary(m)}
                      className="text-xs"
                    >
                      Choisir
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
