"use client";

import React, { useMemo } from "react";
import { Plus, Edit2, Trash2, Clock, Check, AlertTriangle, Users } from "lucide-react";
import type { ScheduleEntry } from "@/lib/api";

export interface WeeklyScheduleCalendarProps {
  entries: ScheduleEntry[];
  onAdd: (prefilledDay?: string, prefilledTime?: string) => void;
  onEdit: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
}

const DAYS_OF_WEEK = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

// Heures représentées dans la grille hebdomadaire : de 06:00 à 21:00
const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 6;
  return `${h.toString().padStart(2, "0")}:00`;
});

/**
 * Normalise l'heure pour associer un programme à sa ligne principale d'heure.
 */
function getHourSlot(timeStr?: string | null): string {
  if (!timeStr) return "08:00";
  const match = timeStr.match(/^(\d{1,2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    return `${h.toString().padStart(2, "0")}:00`;
  }
  return "08:00";
}

export function WeeklyScheduleCalendar({
  entries,
  onAdd,
  onEdit,
  onDelete,
}: WeeklyScheduleCalendarProps) {
  // Indexer les entrées par jour et heure
  const entriesByDayAndHour = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();

    for (const entry of entries) {
      // Déterminer la liste des jours pour cette entrée
      const days =
        entry.days && entry.days.length > 0
          ? entry.days
          : entry.day
          ? entry.day.split(",").map((d) => d.trim())
          : ["Dimanche"];

      const slot = getHourSlot(entry.startTime || entry.timeLabel);

      for (const day of days) {
        // Recherche insensible aux accents et à la casse
        const normalizedDay =
          DAYS_OF_WEEK.find((d) => d.toLowerCase() === day.toLowerCase()) || day;
        const key = `${normalizedDay}_${slot}`;
        const list = map.get(key) || [];
        list.push(entry);
        map.set(key, list);
      }
    }

    return map;
  }, [entries]);

  return (
    <div className="border border-ccjv-line bg-white shadow-xs overflow-hidden">
      {/* Grille du calendrier avec défilement horizontal si écran réduit */}
      <div className="overflow-x-auto min-w-[760px]">
        <table className="w-full border-collapse text-left">
          {/* En-tête : Jours de la semaine (Colonnes) */}
          <thead>
            <tr className="bg-[#fafaf7] border-b border-ccjv-line">
              <th className="w-20 p-3 text-[11px] font-bold text-ccjv-ink-secondary uppercase tracking-wider text-center border-r border-ccjv-line">
                Heure
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day}
                  className={`p-3 text-xs font-bold uppercase tracking-wider text-center border-r last:border-r-0 border-ccjv-line ${
                    day === "Dimanche"
                      ? "text-ccjv-green bg-ccjv-green/5"
                      : "text-ccjv-ink"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{day}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Lignes : Heures de la journée */}
          <tbody className="divide-y divide-ccjv-line text-xs font-sans">
            {HOURS.map((hour) => (
              <tr key={hour} className="group hover:bg-[#fafaf7]/50 transition-colors">
                {/* Colonne heure */}
                <td className="p-2.5 text-[11px] font-mono font-medium text-ccjv-ink-secondary text-center border-r border-ccjv-line bg-[#fafaf7] select-none">
                  {hour}
                </td>

                {/* 7 Colonnes pour chaque jour */}
                {DAYS_OF_WEEK.map((day) => {
                  const key = `${day}_${hour}`;
                  const slotEntries = entriesByDayAndHour.get(key) || [];
                  const isSunday = day === "Dimanche";

                  return (
                    <td
                      key={day}
                      onClick={() => {
                        if (slotEntries.length === 0) {
                          onAdd(day, hour);
                        }
                      }}
                      className={`p-1.5 border-r last:border-r-0 border-ccjv-line align-top min-h-[58px] transition-colors relative ${
                        slotEntries.length === 0
                          ? "cursor-pointer hover:bg-ccjv-green/5"
                          : ""
                      } ${isSunday ? "bg-ccjv-green/[0.02]" : ""}`}
                    >
                      {slotEntries.length > 0 ? (
                        <div className="space-y-1.5">
                          {slotEntries.map((entry) => (
                            <div
                              key={`${entry.id}-${day}`}
                              className="group/card relative bg-white border border-ccjv-line hover:border-ccjv-green p-2 shadow-xs transition-all duration-150 text-left rounded-none"
                            >
                              {/* Bande latérale verte */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ccjv-green" />

                              <div className="pl-1.5">
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="font-bold text-ccjv-ink text-xs line-clamp-2 leading-tight">
                                    {entry.title}
                                  </h4>
                                </div>

                                <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-ccjv-green font-semibold">
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                  <span>
                                    {entry.startTime
                                      ? `${entry.startTime}${entry.endTime ? ` - ${entry.endTime}` : ""}`
                                      : entry.timeLabel}
                                  </span>
                                </div>

                                {entry.audience && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-ccjv-ink-secondary truncate">
                                    <Users className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">{entry.audience}</span>
                                  </div>
                                )}

                                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-ccjv-line/60">
                                  {entry.isConfirmed ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#1e7a1e]">
                                      <Check className="h-2.5 w-2.5" /> Confirmé
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#b45309]">
                                      <AlertTriangle className="h-2.5 w-2.5" /> À confirmer
                                    </span>
                                  )}

                                  {/* Actions rapides */}
                                  <div className="flex items-center gap-1 opacity-80 group-hover/card:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(entry);
                                      }}
                                      className="p-1 text-ccjv-ink hover:text-ccjv-green transition-colors"
                                      aria-label={`Modifier ${entry.title}`}
                                    >
                                      <Edit2 className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(entry);
                                      }}
                                      className="p-1 text-ccjv-ink hover:text-[#b91c1c] transition-colors"
                                      aria-label={`Supprimer ${entry.title}`}
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-ccjv-green">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende en bas */}
      <div className="p-3 bg-[#fafaf7] border-t border-ccjv-line flex flex-wrap items-center justify-between text-xs text-ccjv-ink-secondary gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-ccjv-green inline-block" />
            <span>Rassemblement programmé</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 border border-dashed border-ccjv-line inline-block" />
            <span>Créneau libre (cliquer pour ajouter)</span>
          </span>
        </div>
        <p className="text-[11px] font-mono">
          Rythme hebdomadaire récurrent • {entries.length} rassemblement(s) actif(s)
        </p>
      </div>
    </div>
  );
}
