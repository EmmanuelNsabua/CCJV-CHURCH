"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Archive,
  Trash2,
  MoveUp,
  MoveDown,
  Video,
  Mic,
  AlertCircle,
  ExternalLink,
  Upload,
  X,
  FileText,
  LayoutGrid,
  List,
  Eye,
  PlayCircle,
} from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { Button } from "@/components/ui/Button";
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
  BiblicalReferenceRecord,
  BiblicalReferenceInputPayload,
  TeachingMediaInputPayload,
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
  verseText: string;
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
  position: number;
}

interface MediaSlot {
  mediaId: string;
  title: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
}

function formatVerseString(r: {
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
}): string {
  if (r.endChapter && r.endVerse) {
    if (r.endChapter === r.startChapter) {
      return `${r.startChapter}:${r.startVerse}-${r.endVerse}`;
    }
    return `${r.startChapter}:${r.startVerse}-${r.endChapter}:${r.endVerse}`;
  }
  if (r.endVerse && r.endVerse !== r.startVerse) {
    return `${r.startChapter}:${r.startVerse}-${r.endVerse}`;
  }
  return `${r.startChapter}:${r.startVerse}`;
}

function parseVerseString(text: string): {
  startChapter: number;
  startVerse: number;
  endChapter?: number | null;
  endVerse?: number | null;
} {
  const clean = text.trim();
  // Format "16:3-17:2"
  const rangeCrossMatch = clean.match(/^(\d+):(\d+)\s*[-–]\s*(\d+):(\d+)$/);
  if (rangeCrossMatch && rangeCrossMatch[1] && rangeCrossMatch[2] && rangeCrossMatch[3] && rangeCrossMatch[4]) {
    return {
      startChapter: parseInt(rangeCrossMatch[1], 10),
      startVerse: parseInt(rangeCrossMatch[2], 10),
      endChapter: parseInt(rangeCrossMatch[3], 10),
      endVerse: parseInt(rangeCrossMatch[4], 10),
    };
  }

  // Format "16:1-5"
  const sameChapMatch = clean.match(/^(\d+):(\d+)\s*[-–]\s*(\d+)$/);
  if (sameChapMatch && sameChapMatch[1] && sameChapMatch[2] && sameChapMatch[3]) {
    const ch = parseInt(sameChapMatch[1], 10);
    return {
      startChapter: ch,
      startVerse: parseInt(sameChapMatch[2], 10),
      endChapter: ch,
      endVerse: parseInt(sameChapMatch[3], 10),
    };
  }

  // Format "16:3"
  const singleMatch = clean.match(/^(\d+):(\d+)$/);
  if (singleMatch && singleMatch[1] && singleMatch[2]) {
    return {
      startChapter: parseInt(singleMatch[1], 10),
      startVerse: parseInt(singleMatch[2], 10),
      endChapter: null,
      endVerse: null,
    };
  }

  // Format "16" (chapitre entier)
  const chapMatch = clean.match(/^(\d+)$/);
  if (chapMatch && chapMatch[1]) {
    return {
      startChapter: parseInt(chapMatch[1], 10),
      startVerse: 1,
      endChapter: null,
      endVerse: null,
    };
  }

  // Fallback avec détection de chiffres
  const digits = clean.split(/[^0-9]+/).filter(Boolean).map(Number);
  const startChapter = digits[0] && digits[0] > 0 ? digits[0] : 1;
  const startVerse = digits[1] && digits[1] > 0 ? digits[1] : 1;
  const endVerse = digits[2] && digits[2] > 0 ? digits[2] : null;

  return {
    startChapter,
    startVerse,
    endChapter: endVerse ? startChapter : null,
    endVerse,
  };
}

export function TeachingForm({ initialData, isEditing = false }: TeachingFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Métadonnées générales
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [speakerName, setSpeakerName] = useState(initialData?.speakerName || "");
  const [preachedAt, setPreachedAt] = useState(
    initialData?.preachedAt
      ? initialData.preachedAt.substring(0, 10)
      : new Date().toISOString().substring(0, 10),
  );
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState(initialData?.status || "DRAFT");

  // Références bibliques (avec champ texte unique pour les versets)
  const resolveReferences = (data?: EnseignementRecord): BiblicalRefDraft[] => {
    const rawRefs =
      data?.references ||
      (data as unknown as { biblicalReferences?: BiblicalReferenceRecord[] })?.biblicalReferences ||
      [];
    return rawRefs.map((r, idx) => ({
      id: r.id,
      book: r.book,
      verseText: formatVerseString(r),
      startChapter: r.startChapter,
      startVerse: r.startVerse,
      endChapter: r.endChapter,
      endVerse: r.endVerse,
      position: r.position ?? idx,
    }));
  };

  const resolveVideoSlot = (data?: EnseignementRecord): MediaSlot | null => {
    const v = data?.medias?.find((m) => {
      const mime = m.media?.mimeType || (m as unknown as { mimeType?: string }).mimeType;
      return m.role === "VIDEO" || mime?.startsWith("video/");
    });
    if (!v) return null;
    const url = v.media?.publicUrl || (v as unknown as { url?: string }).url;
    if (!url) return null;
    return {
      mediaId: v.mediaId,
      title: v.media?.title || (v as unknown as { title?: string }).title || "Vidéo principale",
      url,
      mimeType: v.media?.mimeType || (v as unknown as { mimeType?: string }).mimeType || "video/mp4",
      sizeBytes: v.media?.fileSizeBytes || (v as unknown as { sizeBytes?: number }).sizeBytes,
    };
  };

  const resolveImageSlot = (data?: EnseignementRecord): MediaSlot | null => {
    const img = data?.medias?.find((m) => {
      const mime = m.media?.mimeType || (m as unknown as { mimeType?: string }).mimeType;
      return m.role === "THUMBNAIL" || mime?.startsWith("image/");
    });
    if (!img) return null;
    const url = img.media?.publicUrl || (img as unknown as { url?: string }).url;
    if (!url) return null;
    return {
      mediaId: img.mediaId,
      title: img.media?.title || (img as unknown as { title?: string }).title || "Miniature de couverture",
      url,
      mimeType: img.media?.mimeType || (img as unknown as { mimeType?: string }).mimeType || "image/jpeg",
      sizeBytes: img.media?.fileSizeBytes || (img as unknown as { sizeBytes?: number }).sizeBytes,
    };
  };

  const resolveAudioSlot = (data?: EnseignementRecord): MediaSlot | null => {
    const a = data?.medias?.find((m) => {
      const mime = m.media?.mimeType || (m as unknown as { mimeType?: string }).mimeType;
      return m.role === "AUDIO" || mime?.startsWith("audio/");
    });
    if (!a) return null;
    const url = a.media?.publicUrl || (a as unknown as { url?: string }).url;
    if (!url) return null;
    return {
      mediaId: a.mediaId,
      title: a.media?.title || (a as unknown as { title?: string }).title || "Enregistrement audio",
      url,
      mimeType: a.media?.mimeType || (a as unknown as { mimeType?: string }).mimeType || "audio/mpeg",
      sizeBytes: a.media?.fileSizeBytes || (a as unknown as { sizeBytes?: number }).sizeBytes,
    };
  };

  const [references, setReferences] = useState<BiblicalRefDraft[]>(() => resolveReferences(initialData));

  // Sous-sections de médias dédiées
  // 1. Vidéo
  const initialVideo = initialData?.medias?.find((m) => {
    const mime = m.media?.mimeType || (m as unknown as { mimeType?: string }).mimeType;
    return m.role === "VIDEO" || mime?.startsWith("video/");
  });
  const [videoSlot, setVideoSlot] = useState<MediaSlot | null>(() => resolveVideoSlot(initialData));
  const [useVideoAsThumbnail, setUseVideoAsThumbnail] = useState<boolean>(
    Boolean(initialVideo?.isPrimary && !initialData?.medias?.some((m) => m.role === "THUMBNAIL")),
  );

  // 2. Image / Miniature
  const [imageSlot, setImageSlot] = useState<MediaSlot | null>(() => resolveImageSlot(initialData));

  // 3. Audio (Optionnel)
  const [audioSlot, setAudioSlot] = useState<MediaSlot | null>(() => resolveAudioSlot(initialData));

  // Synchronisation si initialData arrive ou se met à jour
  useEffect(() => {
    if (!initialData) return;
    setTitle(initialData.title || "");
    setSlug(initialData.slug || "");
    setSpeakerName(initialData.speakerName || "");
    if (initialData.preachedAt) {
      setPreachedAt(initialData.preachedAt.substring(0, 10));
    }
    setSummary(initialData.summary || "");
    setDescription(initialData.description || "");
    setStatus(initialData.status || "DRAFT");
    setReferences(resolveReferences(initialData));
    setVideoSlot(resolveVideoSlot(initialData));
    setImageSlot(resolveImageSlot(initialData));
    setAudioSlot(resolveAudioSlot(initialData));
    const initVid = initialData.medias?.find((m) => {
      const mime = m.media?.mimeType || (m as unknown as { mimeType?: string }).mimeType;
      return m.role === "VIDEO" || mime?.startsWith("video/");
    });
    setUseVideoAsThumbnail(
      Boolean(initVid?.isPrimary && !initialData.medias?.some((m) => m.role === "THUMBNAIL")),
    );
  }, [initialData]);

  // Bibliothèque centrale pour sélection
  const [centralMediaList, setCentralMediaList] = useState<AdminMediaItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalTargetSlot, setModalTargetSlot] = useState<"visual" | "video" | "image" | "audio">("visual");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilterType, setMediaFilterType] = useState<"ALL" | "visual" | "video" | "audio" | "image">("ALL");
  const [modalViewMode, setModalViewMode] = useState<"grid" | "list">("grid");

  // Aperçu agrandi (Lightbox inspecteur)
  const [inspectingMedia, setInspectingMedia] = useState<AdminMediaItem | null>(null);

  // Alerte mémorisée
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // États de chargement et erreurs
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("ccjv_dismiss_teaching_pub_warning");
      if (dismissed === "true") {
        setIsAlertDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismissAlert = () => {
    setIsAlertDismissed(true);
    try {
      localStorage.setItem("ccjv_dismiss_teaching_pub_warning", "true");
    } catch {
      // ignore
    }
  };

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
    if (!initialData?.slug) {
      setSlug(slugify(val));
    }
  };

  // Ajout / manipulation de références bibliques
  const handleAddReference = () => {
    setReferences((prev) => [
      ...prev,
      {
        book: "Romains",
        verseText: "1:1",
        startChapter: 1,
        startVerse: 1,
        endChapter: null,
        endVerse: null,
        position: prev.length,
      },
    ]);
  };

  const handleUpdateReferenceBook = (index: number, book: string) => {
    setReferences((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = { ...target, book };
      return next;
    });
  };

  const handleUpdateReferenceVerseText = (index: number, verseText: string) => {
    setReferences((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const parsed = parseVerseString(verseText);
      next[index] = {
        ...target,
        verseText,
        startChapter: parsed.startChapter,
        startVerse: parsed.startVerse,
        endChapter: parsed.endChapter,
        endVerse: parsed.endVerse,
      };
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
      const target = copy[targetIndex];
      if (!temp || !target) return prev;
      copy[index] = target;
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, position: idx }));
    });
  };

  // Ouverture du modal de sélection selon le type
  const openMediaModalFor = (slotType: "visual" | "video" | "image" | "audio") => {
    setModalTargetSlot(slotType);
    setMediaFilterType(slotType);
    setMediaSearch("");
    setIsMediaModalOpen(true);
  };

  // Attribution d'un média sélectionné au slot ciblé
  const handleAssignMedia = (item: AdminMediaItem) => {
    const slotData: MediaSlot = {
      mediaId: item.id,
      title: item.filename,
      url: item.url,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
    };

    if (modalTargetSlot === "visual") {
      if (item.mimeType.startsWith("video/")) {
        setVideoSlot(slotData);
        setImageSlot(null);
      } else {
        setImageSlot(slotData);
        setVideoSlot(null);
      }
    } else if (modalTargetSlot === "video") {
      setVideoSlot(slotData);
    } else if (modalTargetSlot === "image") {
      setImageSlot(slotData);
    } else if (modalTargetSlot === "audio") {
      setAudioSlot(slotData);
    }

    setIsMediaModalOpen(false);
  };

  // RÈGLE MÉTIER DES MÉDIAS :
  // 1. Vidéo ou Image peuvent servir de miniature.
  // 2. Audio est optionnel, mais Vidéo OU Image sont obligatoires.
  const hasVideo = Boolean(videoSlot);
  const hasImage = Boolean(imageSlot);
  const hasRequiredMedia = hasVideo || hasImage;

  // SUIVI DES DONNÉES ET ACTIVATION DES BOUTONS :
  // "l'utilisateur doit avoir le choix entre publier et enregistrer,
  // donc les deux boutons doivent être disponibles qu'au moment où l'utilisateur aura rempli toutes les données nécessaires."
  const isTitleFilled = Boolean(title.trim());
  const isSpeakerFilled = Boolean(speakerName.trim());
  const isDateFilled = Boolean(preachedAt.trim());

  const areReferencesValid = useMemo(() => {
    return references.every((r) => r.book.trim() && r.verseText.trim());
  }, [references]);

  const canSaveOrPublish = Boolean(
    isTitleFilled &&
    isSpeakerFilled &&
    isDateFilled &&
    hasRequiredMedia &&
    areReferencesValid,
  );

  // Validation formulaire
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est obligatoire";
    if (!speakerName.trim()) errs.speakerName = "Le nom de l'orateur est obligatoire";
    if (!preachedAt.trim()) errs.preachedAt = "La date de prédication est obligatoire";

    if (!hasRequiredMedia) {
      errs.medias = "Vous devez associer au moins une Vidéo ou une Image.";
    }

    // Vérifier les références
    for (let i = 0; i < references.length; i++) {
      const r = references[i];
      if (!r) continue;
      if (!r.book.trim()) {
        errs[`ref_${i}_book`] = "Le nom du livre est obligatoire";
      }
      if (!r.verseText.trim()) {
        errs[`ref_${i}_verse`] = "Le verset est obligatoire (ex. 16:3)";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Assemblage du payload de médias pour le backend
  const buildMediasPayload = (): TeachingMediaInputPayload[] => {
    const payload: TeachingMediaInputPayload[] = [];
    let pos = 0;

    // Détermination du média principal (pour diffusion et affichage) :
    // Le média annexé (Vidéo ou Image) joue le rôle de miniature et de flux.
    // Priorité à la Vidéo si présente, sinon à l'Image si présente, sinon à l'Audio
    const primaryIsVideo = Boolean(videoSlot);
    const primaryIsImage = !videoSlot && Boolean(imageSlot);
    const primaryIsAudio = !videoSlot && !imageSlot && Boolean(audioSlot);

    if (videoSlot) {
      payload.push({
        mediaId: videoSlot.mediaId,
        role: "VIDEO",
        isPrimary: primaryIsVideo,
        position: pos++,
      });
    }

    if (imageSlot && (!useVideoAsThumbnail || !videoSlot)) {
      payload.push({
        mediaId: imageSlot.mediaId,
        role: "THUMBNAIL",
        isPrimary: primaryIsImage,
        position: pos++,
      });
    }

    if (audioSlot) {
      payload.push({
        mediaId: audioSlot.mediaId,
        role: "AUDIO",
        isPrimary: primaryIsAudio,
        position: pos++,
      });
    }

    return payload;
  };

  // Sauvegarde principale
  const handleSave = async (publishAfter = false) => {
    if (!validateForm()) {
      toast.error("Veuillez remplir toutes les informations requises.");
      return;
    }

    if (publishAfter && !hasRequiredMedia) {
      toast.error(
        "Pour publier cet enseignement sur le site public, vous devez lui associer un média de type Vidéo ou Image.",
      );
      return;
    }

    setIsSaving(true);
    try {
      let savedTeachingId = initialData?.id;
      const effectiveSlug = slug.trim() || slugify(title.trim());

      if (isEditing && savedTeachingId) {
        await updateEnseignement(savedTeachingId, {
          title: title.trim(),
          slug: effectiveSlug,
          speakerName: speakerName.trim(),
          preachedAt: preachedAt.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
        });
      } else {
        const created = await createEnseignement({
          title: title.trim(),
          slug: effectiveSlug,
          speakerName: speakerName.trim(),
          preachedAt: preachedAt.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
          status: "DRAFT",
        });
        savedTeachingId = created.id;
      }

      // Mise à jour des références bibliques
      const refsPayload: BiblicalReferenceInputPayload[] = references
        .filter((r) => r.book.trim().length > 0)
        .map((r, idx) => {
          const startChapter = Number(r.startChapter) > 0 ? Number(r.startChapter) : 1;
          const startVerse = Number(r.startVerse) > 0 ? Number(r.startVerse) : 1;
          let endChapter = r.endChapter && Number(r.endChapter) > 0 ? Number(r.endChapter) : null;
          let endVerse = r.endVerse && Number(r.endVerse) > 0 ? Number(r.endVerse) : null;

          if (endChapter !== null && endChapter < startChapter) {
            endChapter = startChapter;
          }
          const effectiveEndChap = endChapter ?? startChapter;
          if (effectiveEndChap === startChapter && endVerse !== null && endVerse < startVerse) {
            endVerse = null;
          }

          return {
            book: r.book.trim(),
            startChapter,
            startVerse,
            endChapter,
            endVerse,
            position: idx,
          };
        });
      await updateEnseignementReferences(savedTeachingId, refsPayload);

      // Mise à jour des médias associés
      const mediasPayload = buildMediasPayload();
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

  const filteredCentralMedias = useMemo(() => {
    return centralMediaList.filter((m) => {
      const matchSearch =
        !mediaSearch ||
        m.filename.toLowerCase().includes(mediaSearch.toLowerCase());
      const matchType =
        mediaFilterType === "ALL" ||
        (mediaFilterType === "visual" &&
          (m.mimeType.startsWith("video/") || m.mimeType.startsWith("image/"))) ||
        (mediaFilterType === "video" && m.mimeType.startsWith("video/")) ||
        (mediaFilterType === "audio" && m.mimeType.startsWith("audio/")) ||
        (mediaFilterType === "image" && m.mimeType.startsWith("image/"));
      return matchSearch && matchType;
    });
  }, [centralMediaList, mediaSearch, mediaFilterType]);

  return (
    <div className="space-y-6">
      {/* En-tête : sans badge Brouillon */}
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
            <h1 className="text-xl font-bold font-serif text-ccjv-ink">
              {isEditing ? `Modifier : ${initialData?.title}` : "Nouvel enseignement"}
            </h1>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              Renseignez les métadonnées, références bibliques et les médias vidéo/audio.
            </p>
          </div>
        </div>

        {/* Actions principales : Enregistrer et Publier débloqués quand toutes les données sont remplies */}
        <div className="flex items-center gap-2">

          {/* Bouton Enregistrer : actif dès que les données nécessaires sont complétées */}
          <div
            title={
              !canSaveOrPublish
                ? "Remplissez le titre, l'orateur, la date et au moins un média (Vidéo ou Image) pour enregistrer"
                : "Enregistrer les modifications"
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving || !canSaveOrPublish}
              className="text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>

          {/* Bouton Publier : actif avec icône Plus dès que les données nécessaires sont complétées */}
          {status !== "PUBLISHED" && (
            <div
              title={
                !canSaveOrPublish
                  ? "Remplissez le titre, l'orateur, la date et au moins un média pour publier"
                  : "Publier directement sur le site public"
              }
            >
              <Button
                type="button"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={isSaving || !canSaveOrPublish}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Publier
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alerte conditionnelle dismissable avec bouton "J'ai compris" et croix */}
      {!hasRequiredMedia && !isAlertDismissed && (
        <div className="p-3 bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <span className="font-semibold">Condition de publication :</span>{" "}
              Pour publier cet enseignement sur le site public, vous devez lui associer au moins un média de type <strong>Vidéo</strong> ou <strong>Image</strong> (qui joue le rôle de miniature et de flux visuel ; l&apos;audio étant optionnel).
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismissAlert}
              className="px-2.5 py-1 text-[11px] font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}

      {/* Grille : Colonne gauche (Informations générales) et Colonne droite (Médias + Références) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : INFORMATIONS GÉNÉRALES (sticky à distance idéale sous la topbar) */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-0 self-start">
          <div className="bg-white p-5 border border-ccjv-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink border-b border-ccjv-border pb-2">
              INFORMATIONS GÉNÉRALES
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
              label="Description éditoriale / Notes de message"
              hint=""
            >
              <Textarea
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Points clés, contexte et réflexions de la prédication..."
                className="text-sm"
              />
            </FormField>
          </div>
        </div>

        {/* Colonne droite : MÉDIAS avec sous-sections Audio, Vidéo, Image puis RÉFÉRENCES BIBLIQUES */}
        <div className="space-y-6">
          {/* Section MÉDIAS (sans numéro) */}
          <div className="bg-white p-5 border border-ccjv-border space-y-5">
            <div className="border-b border-ccjv-border pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  MÉDIAS
                </h2>
              </div>
            </div>

            {/* SOUS-SECTION FUSIONNÉE : VIDÉO OU IMAGE */}
            <div className="border border-ccjv-border bg-ccjv-surface/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-ccjv-ink">
                    Média
                  </span>
                </div>
                {(videoSlot || imageSlot) && (
                  <button
                    type="button"
                    onClick={() => openMediaModalFor("visual")}
                    className="text-xs text-ccjv-green hover:underline flex items-center gap-1 font-medium"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Remplacer</span>
                  </button>
                )}
              </div>

              {videoSlot ? (
                <div className="space-y-2.5">
                  <div className="overflow-hidden border border-ccjv-border bg-black">
                    <video
                      src={videoSlot.url}
                      controls
                      className="w-full h-32 object-cover"
                      preload="metadata"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        VIDÉO
                      </span>
                      <span className="font-semibold text-ccjv-ink truncate max-w-[180px]" title={videoSlot.title}>
                        {videoSlot.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoSlot(null)}
                      className="text-ccjv-ink-muted hover:text-red-600 p-1"
                      title="Retirer la vidéo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Option miniature par la vidéo */}
                  <label className="flex items-center gap-2 text-xs text-ccjv-ink cursor-pointer pt-1 border-t border-ccjv-border/60">
                    <input
                      type="checkbox"
                      checked={useVideoAsThumbnail}
                      onChange={(e) => setUseVideoAsThumbnail(e.target.checked)}
                      className="rounded-none border-ccjv-border text-ccjv-green focus:ring-ccjv-green"
                    />
                    <span>Utiliser cette vidéo comme miniature</span>
                  </label>
                </div>
              ) : imageSlot ? (
                <div className="space-y-2.5">
                  <div className="overflow-hidden border border-ccjv-border bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSlot.url}
                      alt={imageSlot.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold">
                        IMAGE
                      </span>
                      <span className="font-semibold text-ccjv-ink truncate max-w-[180px]" title={imageSlot.title}>
                        {imageSlot.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageSlot(null)}
                      className="text-ccjv-ink-muted hover:text-red-600 p-1"
                      title="Retirer l'image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => openMediaModalFor("visual")}
                  className="p-5 border border-dashed border-ccjv-border hover:border-ccjv-green text-center cursor-pointer transition-colors text-xs text-ccjv-ink-secondary bg-white"
                >
                  <div className="flex items-center justify-center gap-2 mb-1.5 opacity-70">
                   <PlayCircle className="w-4 h-4 text-emerald-700" />
                  </div>
                  <p className="font-semibold text-ccjv-ink">Choisir un média</p>
                  <p className="text-[11px] text-ccjv-ink-secondary mt-0.5">Cliquez pour importer depuis le stockage</p>
                </div>
              )}
            </div>

            {/* SOUS-SECTION 3 : AUDIO */}
            <div className="border border-ccjv-border bg-ccjv-surface/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-ccjv-ink">
                    Audio
                  </span>
                </div>
              </div>

              {audioSlot ? (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white border border-ccjv-border">
                    <div className="flex items-center gap-2 mb-1 text-[11px] font-medium">
                      <Mic className="w-3.5 h-3.5 text-blue-300" />
                      <span className="truncate">{audioSlot.title}</span>
                    </div>
                    <audio controls src={audioSlot.url} className="w-full h-8" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ccjv-ink-secondary truncate max-w-[200px]">
                      Fichier audio associé
                    </span>
                    <button
                      type="button"
                      onClick={() => setAudioSlot(null)}
                      className="text-ccjv-ink-muted hover:text-red-600 p-1"
                      title="Retirer l'audio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => openMediaModalFor("audio")}
                  className="p-4 border border-dashed border-ccjv-border hover:border-ccjv-green text-center cursor-pointer transition-colors text-xs text-ccjv-ink-secondary bg-white"
                >
                  <Mic className="w-5 h-5 text-ccjv-ink-muted mx-auto mb-1 opacity-70" />
                  <p className="font-medium text-ccjv-ink">Aucun audio associé</p>
                  <p className="text-[11px] text-ccjv-ink-secondary">Optionnel : écoute du sermon en streaming</p>
                </div>
              )}
            </div>
          </div>

          {/* Section RÉFÉRENCES BIBLIQUES (sans numéro, avec un seul champ texte pour le verset) */}
          <div className="bg-white p-5 border border-ccjv-border space-y-4">
            <div className="flex items-center justify-between border-b border-ccjv-border pb-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  RÉFÉRENCES BIBLIQUES ({references.length})
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReference}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </Button>
            </div>

            {references.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-ccjv-border bg-ccjv-surface text-xs text-ccjv-ink-secondary">
                Aucun passage biblique ajouté.
              </div>
            ) : (
              <div className="space-y-3">
                {references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-ccjv-border bg-ccjv-surface/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
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

                      <button
                        type="button"
                        onClick={() => handleRemoveReference(idx)}
                        className="p-1 text-ccjv-ink-muted hover:text-red-600 transition-colors"
                        title="Supprimer la référence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Livre biblique */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                        Livre biblique *
                      </label>
                      <Input
                        type="text"
                        value={ref.book}
                        onChange={(e) =>
                          handleUpdateReferenceBook(idx, e.target.value)
                        }
                        placeholder="Ex. Romains, Jean, Psaumes"
                        className="text-xs"
                      />
                    </div>

                    {/* UN SEUL CHAMP DE TEXTE POUR LE VERSET (sans spinners / boutons numériques) */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-ccjv-ink-secondary block mb-1">
                        Verset(s) *
                      </label>
                      <Input
                        type="text"
                        value={ref.verseText}
                        onChange={(e) =>
                          handleUpdateReferenceVerseText(idx, e.target.value)
                        }
                        placeholder="Ex. 16:3 ou 1:1-8 ou 3:16-17"
                        className="text-xs"
                      />
                      <span className="text-[10px] text-ccjv-ink-muted mt-0.5 block">
                        Format libre : 16:3 ou plage 1:1-8
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL / VISUALISEUR ÉTENDU POUR L'IMPORTATION DEPUIS LE BUCKET */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-ccjv-border max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            {/* En-tête du modal */}
            <div className="p-4 border-b border-ccjv-border flex items-center justify-between bg-ccjv-surface">
              <div>
                <h3 className="text-base font-bold text-ccjv-ink flex items-center gap-2">
                  <Upload className="w-4 h-4 text-ccjv-green" />
                  Visualiseur et Importation du Stockage (Bucket)
                </h3>
                <p className="text-xs text-ccjv-ink-secondary mt-0.5">
                  Visualisez fidèlement vos fichiers (Images, Vidéos, Audios, Textes) avant de les sélectionner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="p-1.5 hover:bg-ccjv-surface text-ccjv-ink-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="p-3 border-b border-ccjv-border bg-ccjv-surface/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <Input
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Rechercher par nom de fichier..."
                  className="text-xs flex-1 sm:max-w-xs"
                />

                {/* Onglets / Filtre de type */}
                <div className="flex items-center border border-ccjv-border bg-white text-xs">
                  <button
                    type="button"
                    onClick={() => setMediaFilterType("ALL")}
                    className={`px-2.5 py-1 transition-colors ${
                      mediaFilterType === "ALL"
                        ? "bg-ccjv-ink text-white font-medium"
                        : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilterType("video")}
                    className={`px-2.5 py-1 transition-colors border-l border-ccjv-border ${
                      mediaFilterType === "video"
                        ? "bg-ccjv-ink text-white font-medium"
                        : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                    }`}
                  >
                    Vidéos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilterType("image")}
                    className={`px-2.5 py-1 transition-colors border-l border-ccjv-border ${
                      mediaFilterType === "image"
                        ? "bg-ccjv-ink text-white font-medium"
                        : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                    }`}
                  >
                    Images
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilterType("audio")}
                    className={`px-2.5 py-1 transition-colors border-l border-ccjv-border ${
                      mediaFilterType === "audio"
                        ? "bg-ccjv-ink text-white font-medium"
                        : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                    }`}
                  >
                    Audios
                  </button>
                </div>
              </div>

              {/* Bascule Grille / Liste */}
              <div className="flex items-center gap-1 border border-ccjv-border bg-white p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalViewMode("grid")}
                  className={`p-1 text-xs transition-colors ${
                    modalViewMode === "grid"
                      ? "bg-ccjv-ink text-white"
                      : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                  }`}
                  title="Affichage Grille"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setModalViewMode("list")}
                  className={`p-1 text-xs transition-colors ${
                    modalViewMode === "list"
                      ? "bg-ccjv-ink text-white"
                      : "text-ccjv-ink-secondary hover:text-ccjv-ink"
                  }`}
                  title="Affichage Liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps du visualiseur */}
            <div className="p-4 overflow-y-auto flex-1">
              {filteredCentralMedias.length === 0 ? (
                <div className="text-center py-12 text-xs text-ccjv-ink-secondary">
                  <Upload className="w-8 h-8 text-ccjv-ink-muted mx-auto mb-2 opacity-50" />
                  <p>Aucun fichier correspondant trouvé dans le stockage.</p>
                </div>
              ) : modalViewMode === "grid" ? (
                /* Mode GRILLE avec visualiseur riche et direct */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredCentralMedias.map((m) => {
                    const isImg = m.mimeType.startsWith("image/");
                    const isVid = m.mimeType.startsWith("video/");
                    const isAud = m.mimeType.startsWith("audio/");

                    const isCurrentlySelected =
                      (modalTargetSlot === "visual" &&
                        (videoSlot?.mediaId === m.id || imageSlot?.mediaId === m.id)) ||
                      (modalTargetSlot === "video" && videoSlot?.mediaId === m.id) ||
                      (modalTargetSlot === "image" && imageSlot?.mediaId === m.id) ||
                      (modalTargetSlot === "audio" && audioSlot?.mediaId === m.id);

                    return (
                      <div
                        key={m.id}
                        className={`group border overflow-hidden bg-white transition-all flex flex-col justify-between ${
                          isCurrentlySelected
                            ? "ring-2 ring-ccjv-green border-ccjv-green"
                            : "border-ccjv-border hover:border-ccjv-green hover:shadow-md"
                        }`}
                      >
                        {/* Zone d'aperçu dynamique réel */}
                        <div className="relative w-full h-40 bg-black/5 flex items-center justify-center overflow-hidden">
                          {isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.url}
                              alt={m.filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : isVid ? (
                            <div className="w-full h-full bg-black relative flex items-center justify-center">
                              <video
                                src={m.url}
                                className="w-full h-full object-cover opacity-85"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Video className="w-9 h-9 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          ) : isAud ? (
                            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 flex flex-col items-center justify-center p-3 text-white">
                              <Mic className="w-8 h-8 text-blue-300 mb-2" />
                              <audio
                                controls
                                src={m.url}
                                className="w-full h-7 mt-1 scale-90"
                                preload="none"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-ccjv-ink-secondary">
                              <FileText className="w-8 h-8 text-ccjv-ink-muted mb-1" />
                              <span className="text-[10px] font-mono">{m.mimeType}</span>
                            </div>
                          )}

                          {/* Bouton d'inspection / aperçu plein écran */}
                          <button
                            type="button"
                            onClick={() => setInspectingMedia(m)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white transition-colors"
                            title="Inspecter en plein écran"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isCurrentlySelected && (
                            <div className="absolute top-2 left-2 bg-ccjv-green text-white px-2 py-0.5 text-[10px] font-bold shadow">
                              Actif
                            </div>
                          )}
                        </div>

                        {/* Métadonnées et bouton de sélection */}
                        <div className="p-3 border-t border-ccjv-border flex items-center justify-between gap-2 bg-white">
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-ccjv-ink truncate" title={m.filename}>
                              {m.filename}
                            </p>
                            <p className="text-[10px] text-ccjv-ink-secondary">
                              {(m.sizeBytes / 1024 / 1024).toFixed(1)} Mo • {m.mimeType.split("/")[1]?.toUpperCase()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={isCurrentlySelected ? "outline" : "primary"}
                            onClick={() => handleAssignMedia(m)}
                            className="text-[11px] h-7 px-2.5 shrink-0"
                          >
                            {isCurrentlySelected ? "Assigné" : "Choisir"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Mode LISTE avec visualiseur compact */
                <div className="divide-y divide-ccjv-border border border-ccjv-border">
                  {filteredCentralMedias.map((m) => {
                    const isImg = m.mimeType.startsWith("image/");
                    const isVid = m.mimeType.startsWith("video/");
                    const isAud = m.mimeType.startsWith("audio/");

                    const isCurrentlySelected =
                      (modalTargetSlot === "visual" &&
                        (videoSlot?.mediaId === m.id || imageSlot?.mediaId === m.id)) ||
                      (modalTargetSlot === "video" && videoSlot?.mediaId === m.id) ||
                      (modalTargetSlot === "image" && imageSlot?.mediaId === m.id) ||
                      (modalTargetSlot === "audio" && audioSlot?.mediaId === m.id);

                    return (
                      <div
                        key={m.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-ccjv-surface transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-14 h-14 bg-black/5 shrink-0 overflow-hidden flex items-center justify-center border border-ccjv-border">
                            {isImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
                            ) : isVid ? (
                              <Video className="w-6 h-6 text-emerald-700" />
                            ) : isAud ? (
                              <Mic className="w-6 h-6 text-blue-700" />
                            ) : (
                              <FileText className="w-6 h-6 text-ccjv-ink-muted" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-ccjv-ink truncate">{m.filename}</p>
                            <p className="text-[10px] text-ccjv-ink-secondary">
                              {m.mimeType} • {(m.sizeBytes / 1024 / 1024).toFixed(1)} Mo
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInspectingMedia(m)}
                            className="p-1.5 text-ccjv-ink-secondary hover:text-ccjv-ink border border-ccjv-border"
                            title="Aperçu agrandi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            type="button"
                            size="sm"
                            variant={isCurrentlySelected ? "outline" : "primary"}
                            onClick={() => handleAssignMedia(m)}
                            className="text-xs"
                          >
                            {isCurrentlySelected ? "Assigné" : "Choisir"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pied du modal */}
            <div className="p-3 border-t border-ccjv-border bg-ccjv-surface flex items-center justify-between">
              <span className="text-xs text-ccjv-ink-secondary">
                {filteredCentralMedias.length} fichier(s) disponible(s)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMediaModalOpen(false)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX D'INSPECTION COMPLÈTE (APERÇU AGRANDI DU FICHIER) */}
      {inspectingMedia && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border border-ccjv-border max-w-2xl w-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-ccjv-border flex items-center justify-between bg-ccjv-surface">
              <div className="truncate mr-2">
                <p className="text-xs font-bold text-ccjv-ink truncate">{inspectingMedia.filename}</p>
                <p className="text-[10px] text-ccjv-ink-secondary">{inspectingMedia.mimeType}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingMedia(null)}
                className="p-1 hover:bg-ccjv-border transition-colors"
              >
                <X className="w-4 h-4 text-ccjv-ink" />
              </button>
            </div>

            <div className="p-4 bg-black/10 flex items-center justify-center max-h-[60vh] overflow-auto">
              {inspectingMedia.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inspectingMedia.url}
                  alt={inspectingMedia.filename}
                  className="max-h-[50vh] max-w-full object-contain"
                />
              ) : inspectingMedia.mimeType.startsWith("video/") ? (
                <video
                  src={inspectingMedia.url}
                  controls
                  autoPlay
                  className="max-h-[50vh] max-w-full bg-black"
                />
              ) : inspectingMedia.mimeType.startsWith("audio/") ? (
                <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white w-full rounded-none">
                  <div className="flex items-center gap-3 mb-4">
                    <Mic className="w-8 h-8 text-blue-300" />
                    <div>
                      <p className="text-sm font-bold">{inspectingMedia.filename}</p>
                      <p className="text-xs text-blue-200">Lecture audio complète</p>
                    </div>
                  </div>
                  <audio controls src={inspectingMedia.url} autoPlay className="w-full" />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-ccjv-ink-secondary">
                  <FileText className="w-12 h-12 text-ccjv-ink-muted mx-auto mb-2" />
                  <p className="font-semibold text-ccjv-ink">{inspectingMedia.filename}</p>
                  <p className="text-[11px] text-ccjv-ink-secondary mt-1">Fichier documentaire / texte</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-ccjv-border bg-ccjv-surface flex items-center justify-between">
              <a
                href={inspectingMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ccjv-green hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir le fichier direct</span>
              </a>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectingMedia(null)}
                  className="text-xs"
                >
                  Fermer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleAssignMedia(inspectingMedia);
                    setInspectingMedia(null);
                  }}
                  className="text-xs"
                >
                  Choisir ce média
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
