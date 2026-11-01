"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  HeartHandshake,
  User,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Save,
  RefreshCw,
  Info,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DepartmentNavTabs } from "@/components/admin/departments/DepartmentNavTabs";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import {
  getCommunityFaces,
  createCommunityFace,
  updateCommunityFace,
  deleteCommunityFace,
  getLeaders,
  type CommunityFace,
  type Leader,
} from "@/lib/api";

interface SelectedFaceItem {
  id?: string;
  leaderId?: string;
  name: string;
  caption: string;
  photoUrl: string | null;
  photoMediaId?: string | null;
}

export default function CommunityFacesAdminPage() {
  const toast = useToast();

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [existingFaces, setExistingFaces] = useState<CommunityFace[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedFaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal d'ajout de visage depuis le référentiel des leaders
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [chosenLeaderId, setChosenLeaderId] = useState<string>("");
  const [customCaption, setCustomCaption] = useState<string>("");

  const isVisionary = (l: Leader) => {
    const role = (l.role || "").toLowerCase();
    const name = (l.name || "").toLowerCase();
    return (
      role.includes("visionnaire") ||
      role.includes("pasteur principal") ||
      name.includes("manasse")
    );
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allLeaders, faces] = await Promise.all([
        getLeaders({ limit: 100 }),
        getCommunityFaces(),
      ]);
      setLeaders(allLeaders || []);
      setExistingFaces(faces || []);

      // Initialiser la sélection à partir des visages existants
      const initial: SelectedFaceItem[] = (faces || []).map((f) => {
        const matchingLeader = (allLeaders || []).find(
          (l) =>
            l.name.toLowerCase().trim() === f.name.toLowerCase().trim() ||
            (l.photoUrl && l.photoUrl === f.photo),
        );
        return {
          id: f.id,
          leaderId: matchingLeader?.id,
          name: f.name,
          caption: f.caption,
          photoUrl: f.photo,
          photoMediaId: matchingLeader?.photoMediaId ?? null,
        };
      });
      setSelectedItems(initial);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des visages et leaders.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Leaders éligibles : non-visionnaires et non déjà sélectionnés
  const eligibleLeaders = useMemo(() => {
    const selectedNames = new Set(
      selectedItems.map((i) => i.name.toLowerCase().trim()),
    );
    return leaders.filter(
      (l) => !isVisionary(l) && !selectedNames.has(l.name.toLowerCase().trim()),
    );
  }, [leaders, selectedItems]);

  const count = selectedItems.length;
  const isCountValid = count >= 3 && count <= 6;

  const handleOpenPicker = () => {
    if (count >= 6) {
      toast.warning("La section autorise un maximum de 6 visages.");
      return;
    }
    if (eligibleLeaders.length === 0) {
      toast.warning(
        "Tous les leaders éligibles sont déjà sélectionnés ou aucun leader n'est disponible.",
      );
      return;
    }
    const first = eligibleLeaders[0];
    setChosenLeaderId(first.id);
    setCustomCaption(first.role || "Serviteur");
    setIsPickerOpen(true);
  };

  const handleConfirmAddLeader = () => {
    const l = leaders.find((x) => x.id === chosenLeaderId);
    if (!l) return;

    setSelectedItems((prev) => [
      ...prev,
      {
        leaderId: l.id,
        name: l.name,
        caption: customCaption.trim() || l.role || "Serviteur",
        photoUrl: l.photoUrl || l.photo || null,
        photoMediaId: l.photoMediaId ?? null,
      },
    ]);
    setIsPickerOpen(false);
  };

  const handleRemove = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    setSelectedItems((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleCaptionChange = (index: number, val: string) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], caption: val };
      return copy;
    });
  };

  const handleSave = async () => {
    if (count < 3 || count > 6) {
      toast.error(
        `Le nombre de visages doit être compris entre 3 et 6 (actuellement ${count}).`,
      );
      return;
    }

    setIsSaving(true);
    try {
      // 1. Supprimer les visages qui ont été retirés
      const currentIds = new Set(
        selectedItems.map((i) => i.id).filter(Boolean) as string[],
      );
      const toDelete = existingFaces.filter((f) => !currentIds.has(f.id));
      for (const f of toDelete) {
        await deleteCommunityFace(f.id);
      }

      // 2. Mettre à jour ou créer les entrées ordonnées
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        if (item.id) {
          // Mise à jour de la position et de la légende
          await updateCommunityFace(item.id, {
            personName: item.name,
            caption: item.caption,
            position: i,
          });
        } else {
          // Création
          await createCommunityFace({
            personName: item.name,
            caption: item.caption,
            photoMediaId: item.photoMediaId ?? null,
            position: i,
          });
        }
      }

      toast.success(
        "Les visages de notre communauté ont été enregistrés et mis à jour sur la page d'accueil.",
      );
      fetchData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Les visages de notre communauté"
        description="Configuration de la section scrollytelling de la page d'accueil (sélection de 3 à 6 leaders hors Pasteur Principal)."
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading || isSaving}
              title="Actualiser"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!isCountValid || isSaving}
              className="font-semibold"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Enregistrement..." : "Enregistrer la sélection"}
            </Button>
          </div>
        }
      />

      <DepartmentNavTabs />

      {/* Bannière d'état et règles éditoriales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-start gap-3">
          <Info className="h-5 w-5 text-ccjv-green shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
              Règle éditoriale
            </p>
            <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
              La sélection doit comporter entre <strong>3 et 6 personnes</strong> issues du référentiel des leaders. Le Leader Visionnaire (Pasteur Principal) en est exclu par principe.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-start gap-3">
          {isCountValid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
              Statut du quota
            </p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-ccjv-ink">
                {count} / 6
              </span>
              <Badge variant={isCountValid ? "success" : "warning"}>
                {count < 3
                  ? `Manque ${3 - count} minimum`
                  : count > 6
                  ? `Dépassement de ${count - 6}`
                  : "Quota conforme"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-ccjv-line rounded-none flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">
              Ajouter un serviteur
            </p>
            <p className="text-xs text-ccjv-ink-secondary mt-0.5">
              Depuis le référentiel des leaders
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenPicker}
            disabled={count >= 6 || eligibleLeaders.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Liste ordonnée des visages */}
      <div className="bg-white border border-ccjv-line rounded-none p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ccjv-ink">
            Ordre d&apos;apparition dans le scrollytelling ({count})
          </h2>
          <span className="text-xs text-ccjv-ink-secondary">
            Utilisez les flèches pour réordonner les portraits
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <HeartHandshake className="h-10 w-10 text-ccjv-ink-secondary/30 mx-auto" />
            <p className="text-sm font-semibold text-ccjv-ink">
              Aucun visage sélectionné.
            </p>
            <p className="text-xs text-ccjv-ink-secondary max-w-md mx-auto">
              Cliquez sur « Ajouter » pour choisir parmi les leaders enregistrés dans le référentiel central.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenPicker}
              disabled={eligibleLeaders.length === 0}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Sélectionner un premier leader
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-ccjv-line bg-ccjv-offwhite"
              >
                {/* Numéro et Portrait */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-6 text-center font-mono font-bold text-xs text-ccjv-ink-secondary">
                    #{index + 1}
                  </span>
                  <div className="relative w-14 h-14 shrink-0 bg-white border border-ccjv-line flex items-center justify-center overflow-hidden">
                    {item.photoUrl ? (
                      <Image
                        src={item.photoUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <User className="h-6 w-6 text-ccjv-ink-secondary/40" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-sm text-ccjv-ink truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.caption}
                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                        placeholder="Légende ou rôle affiché"
                        className="h-7 text-xs max-w-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Commandes d'ordonnancement et suppression */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1.5 border border-ccjv-line bg-white text-ccjv-ink hover:bg-ccjv-offwhite disabled:opacity-30 disabled:hover:bg-white"
                    title="Monter"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, "down")}
                    disabled={index === selectedItems.length - 1}
                    className="p-1.5 border border-ccjv-line bg-white text-ccjv-ink hover:bg-ccjv-offwhite disabled:opacity-30 disabled:hover:bg-white"
                    title="Descendre"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50 ml-2"
                    title="Retirer de la sélection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Sélection d'un Leader */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-ccjv-line w-full max-w-md p-6 space-y-5 rounded-none shadow-xl">
            <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
              <h2 className="text-base font-serif font-bold text-ccjv-ink">
                Choisir un leader du CCJV
              </h2>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="text-ccjv-ink-secondary hover:text-ccjv-ink p-1"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <FormField
                label="Sélectionner le leader"
                hint="Seuls les leaders éligibles (hors Pasteur Principal) non encore sélectionnés apparaissent."
              >
                <select
                  value={chosenLeaderId}
                  onChange={(e) => {
                    setChosenLeaderId(e.target.value);
                    const sel = leaders.find((x) => x.id === e.target.value);
                    if (sel) {
                      setCustomCaption(sel.role || "Serviteur");
                    }
                  }}
                  className="w-full bg-white border border-ccjv-line px-3 py-2 text-xs font-sans text-ccjv-ink focus:outline-2 focus:outline-ccjv-green rounded-none"
                >
                  {eligibleLeaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.role}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Légende affichée"
                hint="Texte accompagnant le portrait dans le scrollytelling."
              >
                <Input
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  placeholder="Ex. Responsable de la Louange"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-ccjv-line">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmAddLeader}
                disabled={!chosenLeaderId}
                className="font-semibold"
              >
                Ajouter à la sélection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

