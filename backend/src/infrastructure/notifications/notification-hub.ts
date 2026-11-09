import { EventEmitter } from "node:events";
import type { Response } from "express";
import type { AdminProfile } from "@/domain/entities";

export interface RealtimeNotification {
  id: string;
  type: "publication" | "teaching" | "event" | "resource" | "prayer_request" | "testimony" | "settings" | "system_error";
  title: string;
  message: string;
  actorId?: string | null;
  actorName?: string | null;
  departmentId?: string | null;
  targetRoles?: string[];
  targetDepartmentId?: string | null;
  statusCode?: number;
  path?: string;
  createdAt: string;
}

interface SseClient {
  id: string;
  res: Response;
  admin: AdminProfile;
}

class NotificationHub extends EventEmitter {
  private clients = new Map<string, SseClient>();
  private history: RealtimeNotification[] = [];
  private readonly maxHistory = 100;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Heartbeat toutes les 20 secondes pour maintenir les connexions ouvertes
    this.heartbeatInterval = setInterval(() => {
      this.broadcastHeartbeat();
    }, 20000);
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  public registerClient(clientId: string, res: Response, admin: AdminProfile): () => void {
    const client: SseClient = { id: clientId, res, admin };
    this.clients.set(clientId, client);

    // Initial SSE connection handshake
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`: connected as ${admin.username}\n\n`);

    // Clean up on client disconnect
    const cleanup = () => {
      this.clients.delete(clientId);
    };

    return cleanup;
  }

  public publish(notification: Omit<RealtimeNotification, "id" | "createdAt">): RealtimeNotification {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    // Stockage dans l'historique récent
    this.history.unshift(fullNotification);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Envoi aux clients connectés éligibles
    for (const client of this.clients.values()) {
      if (this.canReceive(client.admin, fullNotification)) {
        try {
          client.res.write(`data: ${JSON.stringify(fullNotification)}\n\n`);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }

    return fullNotification;
  }

  public getHistoryFor(admin: AdminProfile): RealtimeNotification[] {
    return this.history.filter((n) => this.canReceive(admin, n));
  }

  private canReceive(admin: AdminProfile, notification: RealtimeNotification): boolean {
    // Règle 1: L'auteur ne reçoit JAMAIS sa propre notification (il a son feedback local dans l'UI)
    if (notification.actorId && admin.id === notification.actorId) {
      return false;
    }

    // Règle 2: Erreurs système (400, 500) -> SUPER_ADMIN uniquement
    if (notification.type === "system_error") {
      return admin.role === "SUPER_ADMIN";
    }

    // Règle 3: Prières et Témoignages -> SUPER_ADMIN et ADMIN
    if (notification.type === "prayer_request" || notification.type === "testimony") {
      return admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
    }

    // Règle 4: Paramètres du site -> SUPER_ADMIN et ADMIN
    if (notification.type === "settings") {
      return admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
    }

    // Règle 5: Publications, enseignements, agenda, ressources
    // SUPER_ADMIN et ADMIN voient tout
    if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
      return true;
    }

    // Pour DEPARTMENT_MANAGER: reçoit si la notification concerne son propre département
    if (admin.role === "DEPARTMENT_MANAGER" && admin.departmentId) {
      if (notification.departmentId && notification.departmentId === admin.departmentId) {
        return true;
      }
      if (notification.targetDepartmentId && notification.targetDepartmentId === admin.departmentId) {
        return true;
      }
    }

    return false;
  }

  private broadcastHeartbeat(): void {
    for (const client of this.clients.values()) {
      try {
        client.res.write(": heartbeat\n\n");
      } catch {
        this.clients.delete(client.id);
      }
    }
  }
}

export const notificationHub = new NotificationHub();

