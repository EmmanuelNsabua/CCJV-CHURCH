"use client";

import React, { useEffect, useState } from "react";
import { X, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import type { ScheduleEntry, ScheduleEntryInput } from "@/lib/api";

const DAYS_OF_WEEK = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ScheduleEntryInput) => Promise<void>;
  initialData?: ScheduleEntry | null;
  isLoading?: boolean;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: ScheduleModalProps) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [useCustomTimeLabel, setUseCustomTimeLabel] = useState(false);
  const [audience, setAudience] = useState("");
  const [timeZone, setTimeZone] = useState("Africa/Lubumbashi");
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [position, setPosition] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setSelectedDays(
        initialData.days && initialData.days.length > 0
          ? initialData.days
          : initialData.day
          ? initialData.day.split(",").map((s) => s.trim())
          : ["Dimanche"],
      );
      setStartTime(initialData.startTime || "");
      setEndTime(initialData.endTime || "");
      setTimeLabel(initialData.timeLabel || "");
      setUseCustomTimeLabel(
        Boolean(
          initialData.timeLabel &&
            !initialData.startTime &&
            !/^\d{1,2}h\d{2}/.test(initialData.timeLabel),
        ),
      );
      setAudience(initialData.audience || "");
      setTimeZone(initialData.timeZone || "Africa/Lubumbashi");
      setIsConfirmed(initialData.isConfirmed ?? true);
      setPosition(initialData.position ?? 0);
    } else {
      setTitle("");
      setSelectedDays(["Dimanche"]);
      setStartTime("08:30");
      setEndTime("11:30");
      setTimeLabel("");
      setUseCustomTimeLabel(false);
      setAudience("Tous publics");
      setTimeZone("Africa/Lubumbashi");
      setIsConfirmed(true);
      setPosition(0);
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Recalculer le libellé horaire standard si on n'est pas en mode personnalisé
  useEffect(() => {
    if (!useCustomTimeLabel && startTime) {
      const s = startTime.replace(":", "h");
      const computed = endTime ? `${s} – ${endTime.replace(":", "h")}` : s;
      setTimeLabel(computed);
    }
  }, [startTime, endTime, useCustomTimeLabel]);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev // Au moins 1 jour
        : [...prev, day],
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = "Le nom du culte ou rassemblement est obligatoire.";
    }

    if (selectedDays.length === 0) {
      errs.days = "Veuillez sélectionner au moins un jour de rencontre.";
    }

    if (!useCustomTimeLabel) {
      if (!startTime) {
        errs.startTime = "L'heure de début est obligatoire.";
      } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
        errs.startTime = "Format d'heure invalide (HH:mm).";
      }

      if (endTime) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
          errs.endTime = "Format d'heure invalide (HH:mm).";
        } else if (startTime && startTime >= endTime) {
          errs.endTime = "L'heure de fin doit être postérieure à l'heure de début.";
        }
      }
    } else if (!timeLabel.trim()) {
      errs.timeLabel = "Le libellé horaire libre est obligatoire.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: ScheduleEntryInput = {
      title: title.trim(),
      days: selectedDays,
      day: selectedDays.join(", "),
      startTime: !useCustomTimeLabel && startTime ? startTime : null,
      endTime: !useCustomTimeLabel && endTime ? endTime : null,
      timeLabel: timeLabel.trim(),
      timeZone: timeZone.trim() || "Africa/Lubumbashi",
      audience: audience.trim() || null,
      isConfirmed,
      position: Number(position) || 0,
    };

    await onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div
        className="w-full max-w-xl bg-white border border-ccjv-line rounded-none shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ccjv-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center bg-ccjv-green text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 id="schedule-modal-title" className="font-serif text-lg font-bold text-ccjv-ink">
                {isEditing ? "Modifier le rassemblement" : "Nouveau rassemblement"}
              </h2>
              <p className="text-xs text-ccjv-ink-secondary">
                Configuration des horaires et jours des cultes CCJV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-ccjv-ink-secondary hover:text-ccjv-ink p-1 transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Titre */}
          <FormField
            label="Intitulé du culte ou rassemblement"
            required
            error={errors.title}
            hint="Ex: Culte d'action de grâce, Culte de semaine, Prière matinale, Écodim"
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Culte dominical principal"
              disabled={isLoading}
            />
          </FormField>

          {/* Jours de rencontre (Multi-jours) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ccjv-ink font-sans tracking-wide flex items-center justify-between">
              <span>Jours de rencontre *</span>
              <span className="text-[11px] font-normal text-ccjv-ink-secondary">
                Sélectionnez un ou plusieurs jours
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-ccjv-green text-white border-ccjv-green"
                        : "bg-white text-ccjv-ink border-ccjv-line hover:border-ccjv-green/60"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.days && (
              <p className="text-xs font-medium text-[#b91c1c]">{errors.days}</p>
            )}
          </div>

          {/* Horaires précis ou mode libre */}
          <div className="border border-ccjv-line p-4 bg-[#fafaf7] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ccjv-ink uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-ccjv-green" />
                Créneau horaire
              </span>
              <label className="flex items-center gap-2 text-xs text-ccjv-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomTimeLabel}
                  onChange={(e) => setUseCustomTimeLabel(e.target.checked)}
                  disabled={isLoading}
                  className="rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-3.5 w-3.5"
                />
                <span>Libellé libre (ex: Dans la nuit)</span>
              </label>
            </div>

            {!useCustomTimeLabel ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Heure de début (obligatoire)"
                  required
                  error={errors.startTime}
                  hint="Format 24h (ex: 08:30)"
                >
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isLoading}
                  />
                </FormField>

                <FormField
                  label="Heure de fin (facultative)"
                  error={errors.endTime}
                  hint="Doit être après le début (ex: 11:30)"
                >
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isLoading}
                  />
                </FormField>
              </div>
            ) : (
              <FormField
                label="Libellé personnalisé"
                required
                error={errors.timeLabel}
                hint="Texte libre affiché tel quel aux visiteurs"
              >
                <Input
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  placeholder="Ex: Dans la nuit de vendredi à samedi"
                  disabled={isLoading}
                />
              </FormField>
            )}

            {/* Aperçu du libellé généré */}
            {!useCustomTimeLabel && timeLabel && (
              <p className="text-xs text-ccjv-ink font-mono bg-white p-2.5 border border-ccjv-line">
                Affichage public : <strong className="text-ccjv-green">{timeLabel}</strong>
              </p>
            )}
          </div>

          {/* Public cible & Fuseau horaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Public concerné (optionnel)"
              hint="Ex: Tous publics, Jeunesse, Femmes de foi"
            >
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Tous publics"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Fuseau horaire de référence"
              hint="Défaut : Africa/Lubumbashi (CAT / UTC+2)"
            >
              <Input
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                placeholder="Africa/Lubumbashi"
                disabled={isLoading}
              />
            </FormField>
          </div>

          {/* Ordre & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <FormField
              label="Ordre d'affichage (position)"
              hint="0 = en premier, 1, 2, 3..."
            >
              <Input
                type="number"
                min={0}
                max={999}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                disabled={isLoading}
              />
            </FormField>

            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-ccjv-ink cursor-pointer p-2.5 border border-ccjv-line bg-[#fafaf7]">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  disabled={isLoading}
                  className="rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green h-4 w-4"
                />
                <span>Horaire officiel confirmé</span>
              </label>
              {!isConfirmed && (
                <p className="text-[11px] text-[#b45309] mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  La mention « Horaire à confirmer » sera affichée.
                </p>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ccjv-line">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Enregistrement..."
                : isEditing
                ? "Enregistrer les modifications"
                : "Créer le rassemblement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
