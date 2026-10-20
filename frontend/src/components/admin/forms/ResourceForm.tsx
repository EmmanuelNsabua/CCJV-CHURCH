"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { uploadAdminMedia } from "@/lib/api/endpoints";
import type { Resource, CreateResourcePayload, UpdateResourcePayload } from "@/lib/api/types";

export interface ResourceFormProps {
  initialData?: Resource | null;
  onSubmit: (payload: CreateResourcePayload) => Promise<Resource | void>;
  onReplaceFile?: (fileUrl: string) => Promise<Resource | void>;
}

export function ResourceForm({
  initialData,
  onSubmit,
  onReplaceFile,
}: ResourceFormProps) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fileUrl, setFileUrl] = useState(initialData?.file || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Veuillez sélectionner un document au format PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    // `resources` : seul dossier du Storage qui accepte un document. Le dossier
    // `pages` n'admet que des images et renvoyait « type de fichier non
    // autorisé » (415) pour tout PDF.
    formData.append("folder", "resources");
    formData.append("alt", file.name);

    setIsUploading(true);
    try {
      const res = await uploadAdminMedia(formData, "resources");
      setFileUrl(res.url);
      if (!name) {
        // Pré-remplir le nom avec le nom de fichier sans extension si vide
        setName(file.name.replace(/\.pdf$/i, ""));
      }
      toast.success("Document PDF téléversé avec succès.");

      // Si nous sommes en édition et qu'une fonction de remplacement de fichier est fournie
      if (initialData?.id && onReplaceFile) {
        await onReplaceFile(res.url);
        toast.info("Le fichier de la ressource a été immédiatement mis à jour.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi du PDF.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom de la ressource est obligatoire.");
      return;
    }

    if (!fileUrl.trim()) {
      setError("Le fichier PDF est obligatoire. Téléversez un document ou renseignez son URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateResourcePayload = {
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        file: fileUrl.trim(),
      };

      await onSubmit(payload);
      toast.success(initialData ? "Ressource mise à jour avec succès." : "Ressource créée avec succès.");
      router.push("/admin/ressources");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-ccjv-line rounded-none p-6 space-y-6">
        <h2 className="font-serif text-lg font-bold text-ccjv-ink border-b border-ccjv-line pb-3">
          {initialData ? "Détails & Modification de la ressource" : "Informations de la ressource"}
        </h2>

        {/* Nom */}
        <FormField
          htmlFor="name"
          label="Nom du document"
          required
          hint="Ex : Guide de prière et de jeûne 2026, Plan de lecture biblique..."
        >
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Guide d'étude sur l'épître aux Romains"
            required
          />
        </FormField>

        {/* Description */}
        <FormField
          htmlFor="description"
          label="Description / Présentation (facultatif)"
          hint="Brève présentation du contenu pour les fidèles."
        >
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ce guide accompagne la série d'enseignements du mois..."
          />
        </FormField>

        {/* Fichier PDF */}
        <div className="space-y-2 border-t border-ccjv-line pt-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ccjv-ink">
            Document PDF <span className="text-red-600">*</span>
          </label>
          <p className="text-xs text-ccjv-ink-secondary">
            Téléversez un document PDF ou saisissez l'URL d'un fichier déjà stocké.
          </p>

          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="application/pdf,.pdf"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isUploading}
              disabled={isUploading || isSubmitting}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Téléversement..." : "Sélectionner un PDF"}
            </Button>

            <div className="flex-1">
              <Input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://.../document.pdf"
                required
              />
            </div>
          </div>

          {fileUrl && (
            <div className="mt-3 p-3 bg-[#f7fbf7] border border-[#1e7a1e]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-ccjv-green font-medium truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{fileUrl}</span>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-ccjv-green hover:underline shrink-0 ml-3"
              >
                Tester le lien ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions de validation */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/ressources")}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isSubmitting}
          disabled={isSubmitting || isUploading}
        >
          <CheckCircle2 className="h-4 w-4" />
          {initialData ? "Enregistrer les modifications" : "Publier la ressource"}
        </Button>
      </div>
    </form>
  );
}
