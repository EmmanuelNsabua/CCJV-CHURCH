"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/feedback/ConfirmModal";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Terminal,
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { getSystemLogs, clearSystemLogs } from "@/lib/api/endpoints";
import type {
  SystemLogEntry,
  SystemLogLevel,
  SystemLogStats,
} from "@/lib/api/types";

export default function AdminLogsPage() {
  const toast = useToast();
  const { role, isLoading: authLoading } = useAuth();

  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [stats, setStats] = useState<SystemLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SystemLogLevel | "ALL">("ALL");

  // Inspection détaillée
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Vider les logs
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getSystemLogs({ limit: 150 });
      setLogs(res.data || []);
      setStats(res.meta || null);
      setConnectionError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des logs.";
      if (!silent) {
        console.warn("[AdminLogs] Erreur :", err);
        setConnectionError(msg);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      fetchLogs();
    }
  }, [role, fetchLogs]);

  // Polling temps réel (toutes les 3.5 secondes lorsque live est activé)
  useEffect(() => {
    if (!isLive || role !== "SUPER_ADMIN") return;

    const interval = setInterval(() => {
      fetchLogs(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [isLive, role, fetchLogs]);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await clearSystemLogs();
      toast.success("Le journal des logs a été réinitialisé.");
      setIsClearModalOpen(false);
      fetchLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la réinitialisation.";
      toast.error(msg);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ccjv-system-logs-${new Date().toISOString().slice(0, 19)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.info("Exportation des logs téléchargée.");
    } catch {
      toast.error("Impossible d'exporter les logs.");
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info("Détails copiés dans le presse-papier.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtrage combiné (niveau + recherche texte)
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedLevel !== "ALL" && log.level !== selectedLevel) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const inMessage = log.message.toLowerCase().includes(query);
        const inPath = log.path?.toLowerCase().includes(query);
        const inMethod = log.method?.toLowerCase().includes(query);
        const inActor = log.actor?.name?.toLowerCase().includes(query);
        const inError = log.errorDetails?.message?.toLowerCase().includes(query);
        const inIp = log.ip?.toLowerCase().includes(query);
        const inStatus = String(log.statusCode || "").includes(query);
        if (!inMessage && !inPath && !inMethod && !inActor && !inError && !inIp && !inStatus) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedLevel, searchQuery]);

  // Si l'utilisateur n'est pas SUPER_ADMIN, blocage hermétique immédiat
  if (!authLoading && role !== "SUPER_ADMIN") {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white border border-ccjv-line text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-[#b91c1c] mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ccjv-ink">
          Accès strictement restreint
        </h2>
        <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
          Le module de journalisation système et d&apos;audit en temps réel est réservé exclusivement au{" "}
          <strong className="text-ccjv-ink">Super Administrateur</strong>.
          Votre profil administratif actuel ({role || "Non défini"}) ne dispose pas des privilèges nécessaires pour consulter ces données.
        </p>
        <div className="pt-2">
          <Button href="/admin" variant="primary" size="sm">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Logs système & Audit en temps réel"
        description="Surveillance en direct des requêtes API, des actions administratives et des échecs d'exécution."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode En Direct / Pause */}
            <Button
              type="button"
              variant={isLive ? "primary" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="gap-2"
            >
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  <span>Flux en direct</span>
                  <Pause className="h-3.5 w-3.5 ml-1 opacity-70" />
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-ccjv-ink-secondary" />
                  <span>Reprendre le flux</span>
                </>
              )}
            </Button>

            {/* Rafraîchir manuellement */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              loading={isLoading}
              title="Actualiser les logs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            {/* Exporter JSON */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={logs.length === 0}
              title="Exporter les logs en JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>

            {/* Vider les logs */}
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              disabled={logs.length === 0}
              title="Vider le journal"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vider</span>
            </Button>
          </div>
        }
      />

      {/* Cartes KPI d'état de l'application */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-ccjv-line p-3.5 space-y-1">
          <div className="flex items-center justify-between text-ccjv-ink-secondary">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Événements</span>
            <Activity className="h-4 w-4 text-ccjv-ink-secondary" />
          </div>
          <p className="font-serif text-2xl font-bold text-ccjv-ink">
            {stats?.total ?? logs.length}
          </p>
          <p className="text-[10px] text-ccjv-ink-secondary">Événements en mémoire</p>
        </div>

        <div className="bg-white border border-[#b91c1c]/30 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#b91c1c]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Échecs & Erreurs (5xx)</span>
            <AlertOctagon className="h-4 w-4 text-[#b91c1c]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#b91c1c]">
            {stats?.errorCount ?? logs.filter((l) => l.level === "error").length}
          </p>
          <p className="text-[10px] text-[#b91c1c]/80">Actions en échec ou anomalies</p>
        </div>

        <div className="bg-white border border-[#d97706]/30 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[#d97706]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Avertissements (4xx)</span>
            <AlertTriangle className="h-4 w-4 text-[#d97706]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#d97706]">
            {stats?.warnCount ?? logs.filter((l) => l.level === "warn").length}
          </p>
          <p className="text-[10px] text-[#d97706]/80">Validations, 403, 404</p>
        </div>

        <div className="bg-white border border-ccjv-green/30 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-ccjv-green">
            <span className="text-[11px] font-mono uppercase tracking-wider">Actions réussies</span>
            <CheckCircle2 className="h-4 w-4 text-ccjv-green" />
          </div>
          <p className="font-serif text-2xl font-bold text-ccjv-green">
            {stats?.infoCount ?? logs.filter((l) => l.level === "info").length}
          </p>
          <p className="text-[10px] text-ccjv-green/80">Mutations & requêtes saines</p>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="bg-white border border-ccjv-line p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Onglets de filtrage par niveau */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "Tous", count: logs.length },
            {
              key: "error",
              label: "Erreurs",
              count: logs.filter((l) => l.level === "error").length,
              color: "text-[#b91c1c]",
            },
            {
              key: "warn",
              label: "Avertissements",
              count: logs.filter((l) => l.level === "warn").length,
              color: "text-[#d97706]",
            },
            {
              key: "info",
              label: "Succès & Infos",
              count: logs.filter((l) => l.level === "info").length,
              color: "text-ccjv-green",
            },
          ].map((tab) => {
            const isActive = selectedLevel === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedLevel(tab.key as SystemLogLevel | "ALL")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-none border cursor-pointer ${
                  isActive
                    ? "bg-ccjv-green text-white border-ccjv-green"
                    : "bg-white text-ccjv-ink border-ccjv-line hover:bg-ccjv-offwhite"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-ccjv-line/70 text-ccjv-ink-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Champ de recherche */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ccjv-ink-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer (URL, méthode, statut, IP, erreur)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-ccjv-line rounded-none focus:outline-none focus:border-ccjv-green text-ccjv-ink placeholder:text-ccjv-ink-secondary"
          />
        </div>
      </div>

      {/* Terminal / Flux de logs */}
      <div className="bg-[#111827] border border-ccjv-line text-white font-mono rounded-none overflow-hidden shadow-xs">
        {/* En-tête du Terminal */}
        <div className="bg-[#1f2937] px-4 py-2.5 border-b border-gray-700 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-ccjv-green" />
            <span className="font-semibold text-white tracking-wider">CONSOLE D&apos;AUDIT &amp; FLUX TEMPS RÉEL</span>
            <span className="text-[10px] text-gray-400">
              ({filteredLogs.length} ligne{filteredLogs.length > 1 ? "s" : ""})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {isLive ? (
              <span className="text-ccjv-green flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ccjv-green animate-pulse" />
                Écoute active
              </span>
            ) : (
              <span className="text-gray-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-500" />
                Flux en pause
              </span>
            )}
          </div>
        </div>

        {/* Liste des entrées de log */}
        {isLoading && logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-ccjv-green" />
            <p>Connexion au flux des événements d&apos;audit...</p>
          </div>
        ) : connectionError && logs.length === 0 ? (
          <div className="p-8 text-center text-xs space-y-3">
            <Activity className="h-6 w-6 mx-auto text-amber-400" />
            <p className="text-gray-200 font-semibold">
              En attente de synchronisation du serveur Render
            </p>
            <p className="text-gray-400 max-w-md mx-auto text-[11px] leading-relaxed">
              Le code du module backend vient d&apos;être mis à jour sur GitHub. Dès que Render a terminé le déploiement du conteneur, les logs apparaîtront automatiquement en direct ici.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs()}
                className="text-xs border-gray-700 hover:border-gray-500 text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Vérifier la connexion
              </Button>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <Activity className="h-6 w-6 mx-auto text-gray-600" />
            <p>Aucun événement ne correspond aux critères de recherche actuels.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/80 max-h-[620px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const dateObj = new Date(log.timestamp);
              const timeStr = dateObj.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                fractionalSecondDigits: 3,
              });

              const isError = log.level === "error" || (log.statusCode && log.statusCode >= 500);
              const isWarn = log.level === "warn" || (log.statusCode && log.statusCode >= 400 && log.statusCode < 500);

              return (
                <div
                  key={log.id}
                  className={`text-xs transition-colors ${
                    isError
                      ? "bg-red-950/20 hover:bg-red-950/40"
                      : isWarn
                        ? "bg-amber-950/20 hover:bg-amber-950/40"
                        : "hover:bg-gray-800/50"
                  }`}
                >
                  {/* Ligne principale du log */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 gap-2 cursor-pointer select-text"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-white shrink-0 mt-0.5 sm:mt-0"
                        aria-label="Afficher les détails"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Horodatage précis */}
                      <span className="text-[11px] text-gray-400 font-mono shrink-0">
                        {timeStr}
                      </span>

                      {/* Badge niveau */}
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 font-bold uppercase rounded-none tracking-wider shrink-0 ${
                          isError
                            ? "bg-red-900/80 text-red-200 border border-red-700"
                            : isWarn
                              ? "bg-amber-900/80 text-amber-200 border border-amber-700"
                              : "bg-emerald-900/70 text-emerald-200 border border-emerald-700"
                        }`}
                      >
                        {log.level}
                      </span>

                      {/* Méthode HTTP */}
                      {log.method && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none shrink-0 ${
                            log.method === "GET"
                              ? "text-blue-400"
                              : log.method === "POST"
                                ? "text-emerald-400"
                                : log.method === "PATCH" || log.method === "PUT"
                                  ? "text-amber-400"
                                  : "text-red-400"
                          }`}
                        >
                          {log.method}
                        </span>
                      )}

                      {/* Code HTTP */}
                      {log.statusCode && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 shrink-0 ${
                            log.statusCode >= 500
                              ? "text-red-400"
                              : log.statusCode >= 400
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      )}

                      {/* Message descriptif */}
                      <span className="truncate text-gray-200 font-sans sm:font-mono text-xs">
                        {log.message}
                      </span>
                    </div>

                    {/* Méta droite : Acteur + Durée */}
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-gray-400 pl-6 sm:pl-0">
                      {log.actor?.name && (
                        <span className="text-gray-300 truncate max-w-[120px]" title={log.actor.name}>
                          {log.actor.name}
                        </span>
                      )}
                      {log.durationMs !== undefined && (
                        <span className="text-gray-500 font-mono text-[10px]">
                          {log.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vue détaillée dépliée (JSON, stack trace, headers) */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-950/80 border-t border-gray-800 space-y-3 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                        <span className="text-[11px] font-mono text-gray-400">
                          Identifiant d&apos;événement : <strong className="text-gray-200">{log.id}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(JSON.stringify(log, null, 2), log.id);
                          }}
                          className="flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-none transition-colors"
                        >
                          {copiedId === log.id ? (
                            <>
                              <Check className="h-3 w-3 text-ccjv-green" />
                              <span className="text-ccjv-green">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copier JSON</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Détail d'erreur spécifique si présent */}
                      {log.errorDetails && (
                        <div className="bg-red-950/40 border border-red-800 p-3 space-y-2">
                          <p className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                            <AlertOctagon className="h-4 w-4" />
                            Détail de l&apos;échec applicatif :
                          </p>
                          <p className="text-xs text-red-200 font-mono">
                            {log.errorDetails.code ? `[${log.errorDetails.code}] ` : ""}
                            {log.errorDetails.message}
                          </p>
                          {log.errorDetails.stack && (
                            <pre className="text-[10px] text-red-300/80 bg-black/60 p-2 overflow-x-auto max-h-40 font-mono border border-red-900/40">
                              {log.errorDetails.stack}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Grille des métadonnées du log */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                        <div className="bg-gray-900/60 p-2 border border-gray-800">
                          <span className="text-gray-400 block text-[10px]">Chemin API :</span>
                          <span className="text-gray-200 font-mono truncate block">{log.path || "N/A"}</span>
                        </div>
                        <div className="bg-gray-900/60 p-2 border border-gray-800">
                          <span className="text-gray-400 block text-[10px]">Adresse IP :</span>
                          <span className="text-gray-200 font-mono">{log.ip || "127.0.0.1"}</span>
                        </div>
                        <div className="bg-gray-900/60 p-2 border border-gray-800">
                          <span className="text-gray-400 block text-[10px]">Acteur :</span>
                          <span className="text-gray-200 truncate block">
                            {log.actor ? `${log.actor.name || "Admin"} (${log.actor.role || "Rôle inconnu"})` : "Anonyme"}
                          </span>
                        </div>
                        <div className="bg-gray-900/60 p-2 border border-gray-800">
                          <span className="text-gray-400 block text-[10px]">Horodatage ISO :</span>
                          <span className="text-gray-200 font-mono text-[10px] truncate block">{log.timestamp}</span>
                        </div>
                      </div>

                      {/* Payload JSON brut complet */}
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 mb-1 font-mono">Payload brut :</p>
                        <pre className="text-[10.5px] font-mono bg-black/80 text-emerald-400 p-2.5 overflow-x-auto max-h-48 border border-gray-800">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Boîte de dialogue de confirmation pour vider les logs */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Réinitialiser le journal des logs ?"
        message="Êtes-vous sûr de vouloir vider le journal des logs en mémoire ? Cette action est immédiate et irréversible."
        confirmLabel="Vider les logs"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={isClearing}
        onConfirm={handleClearLogs}
        onClose={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}

