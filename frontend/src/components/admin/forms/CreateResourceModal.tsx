"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Upload,
  FileText,
  FileCode,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Textarea } from "@/components/admin/forms/Textarea";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadAdminMedia, createResource, deleteAdminMedia } from "@/lib/api/endpoints";

const PENDING_STORAGE_KEY = "ccjv_pending_resource_file";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 Mo
const LOCALSTORAGE_FILE_SIZE_LIMIT = 3 * 1024 * 1024; // 3 Mo max en localStorage pour éviter le dépassement de quota

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".epub",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
];

export interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Ko";
  const k = 1024;
  if (bytes < k * 1024) {
    return `${Math.round(bytes / k)} Ko`;
  }
  return `${(bytes / (k * 1024)).toFixed(1)} Mo`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

function getBaseFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

function getFileIcon(extension: string) {
  switch (extension) {
    case "pdf":
      return <FileText className="h-6 w-6 text-red-600 shrink-0" />;
    case "epub":
      return <BookOpen className="h-6 w-6 text-purple-600 shrink-0" />;
    case "doc":
    case "docx":
      return <FileText className="h-6 w-6 text-blue-600 shrink-0" />;
    case "ppt":
    case "pptx":
      return <FileText className="h-6 w-6 text-amber-600 shrink-0" />;
    default:
      return <FileCode className="h-6 w-6 text-ccjv-ink-secondary shrink-0" />;
  }
}

export function CreateResourceModal({
  isOpen,
  onClose,
  onCreated,
}: CreateResourceModalProps) {
  const toast = useToast();
  const { adminProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Nettoyage complet du cache temporaire et de l'état
  const clearTemporaryState = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PENDING_STORAGE_KEY);
      }
    } catch {
      // Ignorer si localStorage n'est pas disponible
    }
    setSelectedFile(null);
    setName("");
    setDescription("");
    setStep(1);
    setValidationError(null);
    setIsPublishing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Fermeture et réinitialisation
  const handleClose = useCallback(() => {
    if (isPublishing) return;
    clearTemporaryState();
    onClose();
  }, [clearTemporaryState, isPublishing, onClose]);

  // Écoute de la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPublishing) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPublishing, handleClose]);

  // Validation d'un fichier sélectionné
  const validateAndStageFile = (file: File) => {
    setValidationError(null);

    // Vérification de taille
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(
        `Le fichier dépasse la taille maximale autorisée (${formatBytes(MAX_FILE_SIZE_BYTES)}).`,
      );
      return;
    }

    // Vérification du format
    const ext = `.${getFileExtension(file.name)}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setValidationError(
        `Format non supporté (${ext || "inconnu"}). Veuillez choisir un document PDF, EPUB, DOC, DOCX, PPT, PPTX, etc.`,
      );
      return;
    }

    setSelectedFile(file);
    setName(getBaseFilename(file.name));

    // Stockage temporaire dans localStorage (respect strict de la demande d'atomicité)
    try {
      if (typeof window !== "undefined") {
        if (file.size <= LOCALSTORAGE_FILE_SIZE_LIMIT) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              window.localStorage.setItem(
                PENDING_STORAGE_KEY,
                JSON.stringify({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  base64: reader.result,
                  savedAt: Date.now(),
                }),
              );
            } catch {
              // Si dépassement de quota localStorage, conserver le File en mémoire React
            }
          };
          reader.readAsDataURL(file);
        } else {
          // Si le fichier dépasse 3 Mo, enregistrer uniquement les métadonnées dans localStorage
          // pour éviter de saturer le quota du navigateur, tout en gardant l'objet File en mémoire
          window.localStorage.setItem(
            PENDING_STORAGE_KEY,
            JSON.stringify({
              name: file.name,
              size: file.size,
              type: file.type,
              savedAt: Date.now(),
            }),
          );
        }
      }
    } catch {
      // Ignorer silencieusement si localStorage n'est pas accessible
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setValidationError("Un seul fichier peut être téléversé à la fois.");
      return;
    }
    validateAndStageFile(files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setValidationError("Veuillez déposer un seul document à la fois.");
      return;
    }
    validateAndStageFile(files[0]);
  };

  const handleRemoveFile = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PENDING_STORAGE_KEY);
      }
    } catch {
      // Ignorer
    }
    setSelectedFile(null);
    setName("");
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Soumission atomique à l'étape 2
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedFile) {
      setValidationError("Aucun document n'a été sélectionné.");
      setStep(1);
      return;
    }

    if (!name.trim()) {
      setValidationError("Le nom du document est obligatoire.");
      return;
    }

    setIsPublishing(true);
    let uploadedMediaId: string | null = null;

    try {
      // 1. Téléversement atomique du fichier dans le bucket Supabase
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "resources");
      formData.append("alt", name.trim());

      const mediaRes = await uploadAdminMedia(formData, "resources", name.trim());
      uploadedMediaId = mediaRes.id;

      // 2. Détermination du rattachement de département (Ecodim, Presse ou Global)
      const effectiveDepartmentId =
        adminProfile?.role === "DEPARTMENT_MANAGER" && adminProfile?.departmentId
          ? adminProfile.departmentId
          : undefined;

      // 3. Insertion immédiate de la ressource dans la base de données
      await createResource({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        file: mediaRes.url,
        departmentId: effectiveDepartmentId,
      });

      // 4. Succès : nettoyage du localStorage et confirmation
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_STORAGE_KEY);
        }
      } catch {
        // Ignorer
      }

      toast.success("Ressource publiée avec succès.");
      clearTemporaryState();
      onCreated();
      onClose();
    } catch (err: unknown) {
      // Compensation en cas d'erreur sur l'enregistrement en base :
      // On tente de supprimer le média orphelin pour préserver l'atomicité
      if (uploadedMediaId) {
        try {
          await deleteAdminMedia(uploadedMediaId);
        } catch {
          // Erreur de compensation silencieuse
        }
      }

      const msg =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la publication de la ressource.";
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  const fileExt = selectedFile ? getFileExtension(selectedFile.name) : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white border border-ccjv-line rounded-none shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b border-ccjv-line px-6 py-4 bg-neutral-50/50">
          <div>
            <h2
              id="resource-modal-title"
              className="font-serif text-lg font-bold text-ccjv-ink"
            >
              Nouvelle ressource
            </h2>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              {step === 1
                ? "Étape 1 sur 2 : Sélection du document"
                : "Étape 2 sur 2 : Informations & Publication"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPublishing}
            className="text-ccjv-ink-secondary hover:text-ccjv-ink p-1 transition-colors disabled:opacity-40"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Indicateur d'étape */}
        <div className="grid grid-cols-2 h-1 bg-ccjv-line/40">
          <div className="h-full bg-ccjv-green transition-all duration-300" />
          <div
            className={`h-full transition-all duration-300 ${step === 2 ? "bg-ccjv-green" : "bg-transparent"
              }`}
          />
        </div>

        {/* Corps de la modale */}
        <div className="p-6">
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {step === 1 ? (
            /* ========================================================================= */
            /*  ÉTAPE 1 : Drag & Drop et Sélection de Fichier                            */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in duration-150">
              <input
                ref={fileInputRef}
                type="file"
                multiple={false}
                accept=".pdf,.epub,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-none p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-3 ${isDragOver
                      ? "border-ccjv-green bg-emerald-50/50 scale-[0.99]"
                      : "border-ccjv-line hover:border-ccjv-green bg-neutral-50/50"
                    }`}
                >
                  <div className="w-12 h-12 bg-white border border-ccjv-line flex items-center justify-center text-ccjv-green shadow-xs">
                    <Upload className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-ccjv-ink">
                      Glisser le document PDF, EPUB, DOC, DOCX, PPT, etc.
                    </p>
                    <p className="text-xs text-ccjv-ink-secondary mt-1">
                      ou cliquez pour parcourir vos dossiers
                    </p>
                  </div>

                  <div className="mt-2 text-[11px] text-ccjv-ink-secondary/80 max-w-xs leading-relaxed">
                    Un seul fichier • Formats acceptés : PDF, EPUB, DOC, DOCX, PPT, PPTX • Max 25 Mo
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 pointer-events-none"
                  >
                    Téléverser le document
                  </Button>
                </div>
              ) : (
                <div className="border border-ccjv-line bg-neutral-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ccjv-ink-secondary">
                      Document sélectionné
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Retirer
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-white border border-ccjv-line p-3">
                    {getFileIcon(fileExt)}
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold text-ccjv-ink truncate"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-ccjv-ink-secondary">
                        {fileExt.toUpperCase()} • {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-ccjv-green font-medium flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Fichier prêt. Cliquez sur « Suivant » pour renseigner les détails.</span>
                  </div>
                </div>
              )}

              {/* Boutons d'action Étape 1 */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ccjv-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!selectedFile}
                  onClick={() => {
                    setValidationError(null);
                    setStep(2);
                  }}
                >
                  <span>Suivant</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /*  ÉTAPE 2 : Nom & Description & Publication Atomique                       */
            /* ========================================================================= */
            <form onSubmit={handlePublish} className="space-y-4 animate-in fade-in duration-150">
              {/* Rappel du fichier choisi */}
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-neutral-50 border border-ccjv-line text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileIcon(fileExt)}
                    <div className="min-w-0">
                      <p className="font-semibold text-ccjv-ink truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-ccjv-ink-secondary">
                        {fileExt.toUpperCase()} • {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(1)}
                    disabled={isPublishing}
                    className="shrink-0 text-xs h-7 px-2"
                  >
                    Changer
                  </Button>
                </div>
              )}

              {/* Nom du document */}
              <FormField
                htmlFor="resource-name"
                label="Nom du document"
                required
                hint="Titre clair et lisible affiché aux membres et fidèles."
              >
                <Input
                  id="resource-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Guide de prière et de jeûne 2026"
                  required
                  disabled={isPublishing}
                  autoFocus
                />
              </FormField>

              {/* Description / Présentation */}
              <FormField
                htmlFor="resource-desc"
                label="Description / Présentation (facultatif)"
                hint="Brève introduction du contenu pour les fidèles."
              >
                <Textarea
                  id="resource-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ce livret accompagne le plan de lecture et d'édification du mois..."
                  disabled={isPublishing}
                />
              </FormField>

              {/* Actions Étape 2 */}
              <div className="flex items-center justify-between pt-4 border-t border-ccjv-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  disabled={isPublishing}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={isPublishing}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isPublishing}
                    disabled={isPublishing || !name.trim()}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isPublishing ? "Publication en cours..." : "Publier la ressource"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

