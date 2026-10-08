import { describe, expect, it, jest } from "@jest/globals";
import type { AdminProfile, Notification, NotificationType } from "@/domain/entities";
import type { ListResult, NotificationRepository } from "@/domain/repositories";
import { NotificationService } from "@/modules/notifications/notification.service";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Notifications (`docs/026` §Lot 7) — testées **sans base**.
 *
 * Le lot tient en une phrase de `docs/032` §3.3 : « cette interdiction est
 * **structurelle** : les colonnes n'existent pas ». Trois propriétés en découlent,
 * et ce sont elles qui sont éprouvées ici :
 *
 * 1. **un destinataire ne lit que sa boîte** — la vérification n'est pas un
 *    filtre applicatif qu'on pourrait oublier, le service impose `actor.id` ;
 * 2. **un refus ne divulgue rien** — marquer la notification d'un autre produit
 *    le **même** `404` qu'une notification inexistante (`docs/029` §4.5) ;
 * 3. **D-10 est appliqué à la lecture aussi** — une notification de prière
 *    adressée à un `SUPER_ADMIN` est écartée même si elle existait en base, et le
 *    cas est journalisé parce qu'il signale un défaut ailleurs.
 */

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const AUTRE_ADMIN_ID = "22222222-2222-4222-8222-222222222222";

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
/* -------------------------------------------------------------------------- */

function actor(role: AdminProfile["role"], id = ADMIN_ID): AdminProfile {
  const isManager = role === "DEPARTMENT_MANAGER";
  return {
    id,
    username: role.toLowerCase(),
    displayName: null,
    role,
    scope: isManager ? "DEPARTMENT" : "GLOBAL",
    departmentId: isManager ? "33333333-3333-4333-8333-333333333333" : null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

const admin = actor("ADMIN");
const superAdmin = actor("SUPER_ADMIN", "99999999-9999-4999-8999-999999999999");
const manager = actor("DEPARTMENT_MANAGER");

function notification(
  id: string,
  recipientUserId: string,
  type: NotificationType = "PRAYER_REQUEST_RECEIVED",
  isRead = false,
): Notification {
  return {
    id,
    recipientUserId,
    type,
    referenceId: "req-1",
    isRead,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

/** Double en mémoire du contrat `NotificationRepository`. */
function fakeNotifications(seed: readonly Notification[] = []) {
  const store = new Map(seed.map((item) => [item.id, item]));

  const repository: NotificationRepository = {
    async listForRecipient(recipientUserId, options, filters) {
      const filtered = [...store.values()]
        .filter((item) => item.recipientUserId === recipientUserId)
        .filter((item) => (filters.unreadOnly ? !item.isRead : true));

      const page: ListResult<Notification> = {
        items: filtered.slice(options.offset, options.offset + options.limit),
        total: filtered.length,
      };
      return page;
    },
    async findById(id) {
      return store.get(id) ?? null;
    },
    async countUnread(recipientUserId) {
      return [...store.values()].filter(
        (item) => item.recipientUserId === recipientUserId && !item.isRead,
      ).length;
    },
    async create(data) {
      const created = notification(`notif-${store.size + 1}`, data.recipientUserId, data.type);
      store.set(created.id, created);
      return created;
    },
    async markAsRead(id) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated = { ...existing, isRead: true };
      store.set(id, updated);
      return updated;
    },
  };

  return { repository, store };
}

function build(repository: NotificationRepository) {
  return new NotificationService(repository);
}

function expectAppError(received: unknown, code: AppError["code"], status: number): AppError {
  expect(isAppError(received)).toBe(true);
  const error = received as AppError;
  expect(error.code).toBe(code);
  expect(error.statusCode).toBe(status);
  return error;
}

async function capture(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

const QUERY = { page: 1, limit: 20, unreadOnly: false };

/* -------------------------------------------------------------------------- */
/*  Boîte de réception                                                        */
/* -------------------------------------------------------------------------- */

describe("notifications — chacun lit la sienne", () => {
  it("ne rend que les notifications du profil authentifié", async () => {
    const { repository } = fakeNotifications([
      notification("n1", ADMIN_ID),
      notification("n2", AUTRE_ADMIN_ID),
    ]);
    const service = build(repository);

    const page = await service.list(admin, QUERY);

    expect(page.items.map((item) => item.id)).toEqual(["n1"]);
  });

  /**
   * Le service **impose** `actor.id` : il n'existe aucun paramètre permettant de
   * demander la boîte d'un autre. Ce test fixe cette propriété au niveau du
   * contrat — c'est elle qui rend l'oubli de filtrage impossible plutôt que
   * improbable.
   */
  it("transmet toujours l'identifiant de l'acteur comme destinataire", async () => {
    const { repository } = fakeNotifications();
    const listForRecipient = jest.spyOn(repository, "listForRecipient");
    const service = build(repository);

    await service.list(admin, QUERY);

    expect(listForRecipient).toHaveBeenCalledWith(
      ADMIN_ID,
      expect.anything(),
      expect.anything(),
    );
  });

  it("compte les non-lues du seul profil authentifié", async () => {
    const { repository } = fakeNotifications([
      notification("n1", ADMIN_ID),
      notification("n2", ADMIN_ID, "KEY_REVOKED", true),
      notification("n3", AUTRE_ADMIN_ID),
    ]);
    const service = build(repository);

    await expect(service.unreadCount(admin)).resolves.toBe(1);
  });

  it("exige un profil authentifié", async () => {
    const { repository } = fakeNotifications();
    const service = build(repository);

    expectAppError(await capture(service.list(undefined, QUERY)), "AUTH_REQUIRED", 401);
  });
});

/* -------------------------------------------------------------------------- */
/*  D-10 — le refus tient aussi à la lecture                                  */
/* -------------------------------------------------------------------------- */

describe("notifications — D-10 à la lecture", () => {
  /**
   * `NotificationPolicy` refuse toute notification de prière au `SUPER_ADMIN`
   * (D-10, X19). Le trigger de la base interdit déjà ces lignes ; si l'une
   * apparaissait malgré tout — désactivation du trigger, écriture directe,
   * régression — elle doit être **écartée**, pas servie.
   */
  it("écarte TOUTE notification du domaine des prières pour un SUPER_ADMIN", async () => {
    const { repository } = fakeNotifications([
      notification("n1", superAdmin.id, "PRAYER_REQUEST_RECEIVED"),
      notification("n2", superAdmin.id, "KEY_REVOKED"),
      notification("n3", superAdmin.id, "RECOVERY_KEY_CHANGED"),
    ]);
    const service = build(repository);

    const page = await service.list(superAdmin, QUERY);

    // **Correction d'une lecture antérieure.** J'avais d'abord laissé au
    // `SUPER_ADMIN` les notifications de sécurité des clés, en déduisant qu'il
    // « devait pouvoir constater une révocation ». Le texte dit l'inverse :
    // `docs/032` §3.3 — transcription du trigger de la base — écrit que ces
    // notifications vont « à TOUS les Admins et **JAMAIS** au `SUPER_ADMIN` »
    // (`docs/030` §4.7, §6.2). Le domaine des prières, cycle de vie des clés
    // compris, lui est entièrement fermé.
    expect(page.items).toEqual([]);
  });

  it("écarte aussi le marquage comme lue d'une telle notification", async () => {
    const { repository } = fakeNotifications([
      notification("n1", superAdmin.id, "PRAYER_REQUEST_RECEIVED"),
    ]);
    const service = build(repository);

    expectAppError(
      await capture(service.markAsRead(superAdmin, "n1")),
      "FORBIDDEN",
      403,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  Marquage comme lue                                                        */
/* -------------------------------------------------------------------------- */

describe("notifications — marquage comme lue", () => {
  it("marque une notification de son propre compte", async () => {
    const { repository } = fakeNotifications([notification("n1", ADMIN_ID)]);
    const service = build(repository);

    const updated = await service.markAsRead(admin, "n1");

    expect(updated.isRead).toBe(true);
  });

  it("est idempotent : marquer une notification déjà lue ne lève pas", async () => {
    const { repository } = fakeNotifications([notification("n1", ADMIN_ID, "KEY_REVOKED", true)]);
    const service = build(repository);

    await expect(service.markAsRead(admin, "n1")).resolves.toMatchObject({ isRead: true });
  });

  /**
   * **Le refus ne divulgue rien.** Une notification adressée à un autre et une
   * notification inexistante produisent la **même** réponse : distinguer `403` et
   * `404` dirait « cette notification existe, mais pas pour vous » — l'oracle que
   * `docs/029` §4.5 interdit.
   */
  it("répond le MÊME 404 pour une notification d'autrui et une notification inexistante", async () => {
    const { repository } = fakeNotifications([notification("n1", AUTRE_ADMIN_ID)]);
    const service = build(repository);

    const autrui = expectAppError(
      await capture(service.markAsRead(admin, "n1")),
      "NOTIFICATION_NOT_FOUND",
      404,
    );
    const inexistante = expectAppError(
      await capture(service.markAsRead(admin, "inconnue")),
      "NOTIFICATION_NOT_FOUND",
      404,
    );

    expect(autrui.message).toBe(inexistante.message);
    expect(autrui.statusCode).toBe(inexistante.statusCode);
  });

  it("un responsable n'accède à aucune notification de prière", async () => {
    // Même s'il en existait une pour lui — ce que le trigger de la base refuse —
    // la policy la refuserait : D-10 la réserve aux ADMIN.
    const { repository } = fakeNotifications([
      notification("n1", manager.id, "PRAYER_REQUEST_RECEIVED"),
    ]);
    const service = build(repository);

    const page = await service.list(manager, QUERY);
    expect(page.items).toEqual([]);

    expectAppError(await capture(service.markAsRead(manager, "n1")), "FORBIDDEN", 403);
  });
});

/* -------------------------------------------------------------------------- */
/*  Ce que la notification ne porte pas                                        */
/* -------------------------------------------------------------------------- */

describe("notifications — aucun contenu, et c'est structurel", () => {
  it("l'entité n'offre aucun champ où loger un contenu de prière", async () => {
    const { repository } = fakeNotifications([notification("n1", ADMIN_ID)]);
    const service = build(repository);

    const [item] = (await service.list(admin, QUERY)).items;

    // La liste des clés est vérifiée **exhaustivement** : un champ ajouté plus
    // tard (un extrait, un prénom, une longueur) ferait échouer ce test avant
    // d'atteindre une réponse HTTP.
    expect(Object.keys(item ?? {}).sort()).toEqual([
      "createdAt",
      "id",
      "isRead",
      "recipientUserId",
      "referenceId",
      "type",
    ]);
  });
});
