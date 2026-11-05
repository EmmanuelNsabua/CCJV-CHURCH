import { randomUUID } from "node:crypto";

export type LogLevel = "error" | "warn" | "info" | "debug";
export type LogSource = "http" | "auth" | "business" | "system";

export interface LogActor {
  id: string;
  name?: string | null;
  role?: string;
  scope?: string;
}

export interface LogErrorDetails {
  code?: string;
  message: string;
  stack?: string;
  champ?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  message: string;
  actor?: LogActor | null;
  ip?: string;
  userAgent?: string;
  errorDetails?: LogErrorDetails | null;
  metadata?: Record<string, unknown>;
}

export interface LogFilterOptions {
  level?: LogLevel | "ALL";
  search?: string;
  limit?: number;
  since?: string;
}

export interface LogStoreStats {
  total: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  systemStatus: "healthy" | "degraded" | "critical";
  lastUpdated: string;
}

class LogStore {
  private readonly maxCapacity: number = 1000;
  private logs: LogEntry[] = [];

  constructor() {
    // Initialiser avec un log de démarrage système
    this.addLog({
      level: "info",
      source: "system",
      message: "CCJV Church API — Moteur de journalisation d'audit temps réel démarré.",
      metadata: {
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
      },
    });
  }

  addLog(entry: Omit<LogEntry, "id" | "timestamp">): LogEntry {
    const fullEntry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);

    // Maintenir la capacité mémoire bornée
    if (this.logs.length > this.maxCapacity) {
      this.logs.length = this.maxCapacity;
    }

    return fullEntry;
  }

  getLogs(options: LogFilterOptions = {}): { data: LogEntry[]; meta: LogStoreStats } {
    let result = this.logs;

    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      if (!Number.isNaN(sinceTime)) {
        result = result.filter(
          (log) => new Date(log.timestamp).getTime() > sinceTime,
        );
      }
    }

    if (options.level && options.level !== "ALL") {
      result = result.filter((log) => log.level === options.level);
    }

    if (options.search && options.search.trim()) {
      const term = options.search.trim().toLowerCase();
      result = result.filter((log) => {
        return (
          log.message.toLowerCase().includes(term) ||
          log.path?.toLowerCase().includes(term) ||
          log.method?.toLowerCase().includes(term) ||
          log.actor?.name?.toLowerCase().includes(term) ||
          log.actor?.role?.toLowerCase().includes(term) ||
          log.errorDetails?.message?.toLowerCase().includes(term) ||
          log.ip?.toLowerCase().includes(term)
        );
      });
    }

    const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
    const paginated = result.slice(0, limit);

    return {
      data: paginated,
      meta: this.getStats(),
    };
  }

  getStats(): LogStoreStats {
    let errorCount = 0;
    let warnCount = 0;
    let infoCount = 0;

    for (const log of this.logs) {
      if (log.level === "error") errorCount++;
      else if (log.level === "warn") warnCount++;
      else if (log.level === "info") infoCount++;
    }

    let systemStatus: LogStoreStats["systemStatus"] = "healthy";
    if (errorCount > 20) systemStatus = "critical";
    else if (errorCount > 0 || warnCount > 10) systemStatus = "degraded";

    return {
      total: this.logs.length,
      errorCount,
      warnCount,
      infoCount,
      systemStatus,
      lastUpdated: new Date().toISOString(),
    };
  }

  clearLogs(): void {
    this.logs = [];
    this.addLog({
      level: "info",
      source: "system",
      message: "Journal d'audit réinitialisé par le Super Administrateur.",
    });
  }
}

export const logStore = new LogStore();
