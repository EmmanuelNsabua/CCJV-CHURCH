import { describe, expect, it, jest } from "@jest/globals";
import type {
  AdminProfile,
  MediaAccess,
  MediaAccessRights,
  MediaAsset,
  MediaGranteeType,
} from "@/domain/entities";
import type {
  MediaAccessRepository,
  MediaRepository,
} from "@/domain/repositories";
import { MediaService } from "@/modules/media/media.service";
import type { StorageService } from "@/infrastructure/supabase/storage";
import type { MediaReferenceRepository } from "@/infrastructure/repositories/media.repository";
import { AppError, isAppError } from "@/shared/errors/app-error";

/**
 * Droits d'accès aux médias (`docs/028` D-21, D-22), testés **sans base**.
 *
 * `docs/026` §Lot 5 fixe le critère de ce volet : « média global + accès Presse +
 * accès Ecodume, et les refus ». Les refus sont testés en premier, comme partout
 * dans ce projet — et deux d'entre eux viennent de `docs/028` **mot pour mot** :
 *
 * - XD-07 : « un `DEPARTMENT_MANAGER` ne peut **jamais** supprimer un média » ;
 * - XD-08 : « un `DEPARTMENT_MANAGER` ne peut **jamais** s'accorder à lui-même un
 *   `MediaAccess` ».
 *
 * Le canal est celui de `docs/029` §6.1 : appel direct du service avec des
 * doubles. Les policies sont déjà éprouvées par `policies.test.ts` ; ce qui est
 * vérifié ici, c'est que le **service s'y adosse** — qu'aucune décision n'est
 * prise dans un controller, et qu'aucun chemin ne contourne la couche
 * d'autorisation.
 */

const MEDIA_ID = "11111111-1111-4111-8111-111111111111";
const DEPARTMENT_A = "22222222-2222-4222-8222-222222222222";
const DEPARTMENT_B = "33333333-3333-4333-8333-333333333333";
const ADMIN_ID = "44444444-4444-4444-8444-444444444444";

/* -------------------------------------------------------------------------- */
/*  Fabriques                                                                 */
/* -------------------------------------------------------------------------- */

function actor(role: AdminProfile["role"], overrides: Partial<AdminProfile> = {}): AdminProfile {
  const isManager = role === "DEPARTMENT_MANAGER";
  return {
    id: role === "SUPER_ADMIN" ? "99999999-9999-4999-8999-999999999999" : ADMIN_ID,
    username: role.toLowerCase(),
    displayName: null,
    role,
    scope: isManager ? "DEPARTMENT" : "GLOBAL",
    departmentId: isManager ? DEPARTMENT_A : null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const superAdmin = actor("SUPER_ADMIN");
const admin = actor("ADMIN");
const managerA = actor("DEPARTMENT_MANAGER");
const managerB = actor("DEPARTMENT_MANAGER", { departmentId: DEPARTMENT_B });

const RIGHTS_USE: MediaAccessRights = { canUse: true, canManage: false, canDelete: false };
const RIGHTS_ALL: MediaAccessRights = { canUse: true, canManage: true, canDelete: true };

function asset(): MediaAsset {
  return {
    id: MEDIA_ID,
    bucket: "ccjv-media",
    path: "pages/ccjv-01.jpeg",
    publicUrl: "https://example.test/ccjv-01.jpeg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
    width: 800,
    height: 600,
    alt: null,
    uploadedBy: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

/** Double en mémoire du contrat `MediaAccessRepository`. */
function fakeAccess(seed: readonly MediaAccess[] = []) {
  const key = (type: MediaGranteeType, id: string) => `${type}:${id}`;
  const store = new Map<string, MediaAccess>(
    seed.map((row) => [key(row.granteeType, row.granteeId), row]),
  );
  let compteur = 0;

  const repository: MediaAccessRepository = {
    async listForMedia(mediaId) {
      return [...store.values()].filter((row) => row.mediaId === mediaId);
    },
    async listForMediaIds(mediaIds) {
      const result = new Map<string, MediaAccess[]>();
      for (const row of store.values()) {
        if (!mediaIds.includes(row.mediaId)) continue;
        result.set(row.mediaId, [...(result.get(row.mediaId) ?? []), row]);
      }
      return result;
    },
    async findFor(mediaId, granteeType, granteeId) {
      const row = store.get(key(granteeType, granteeId));
      return row && row.mediaId === mediaId ? row : null;
    },
    async grant(data) {
      compteur += 1;
      const created: MediaAccess = {
        id: `access-${compteur}`,
        mediaId: data.mediaId,
        granteeType: data.granteeType,
        granteeId: data.granteeId,
        ...data.rights,
        grantedBy: data.grantedBy,
        grantedAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };
      store.set(key(data.granteeType, data.granteeId), created);
      return created;
    },
    async updateRights(mediaId, granteeType, granteeId, rights) {
      const existing = store.get(key(granteeType, granteeId));
      if (!existing || existing.mediaId !== mediaId) return null;
      const updated: MediaAccess = { ...existing, ...rights };
      store.set(key(granteeType, granteeId), updated);
      return updated;
    },
    async revoke(mediaId, granteeType, granteeId) {
      const existing = store.get(key(granteeType, granteeId));
      if (!existing || existing.mediaId !== mediaId) return false;
      store.delete(key(granteeType, granteeId));
      return true;
    },
  };

  return { repository, store };
}

function granted(
  granteeType: MediaGranteeType,
  granteeId: string,
  rights: MediaAccessRights = RIGHTS_USE,
): MediaAccess {
  return {
    id: `access-${granteeId}`,
    mediaId: MEDIA_ID,
    granteeType,
    granteeId,
    ...rights,
    grantedBy: ADMIN_ID,
    grantedAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function build(access = fakeAccess()) {
  const findById = jest.fn(
    async (_id: string): Promise<MediaAsset | null> => asset(),
  );
  const media = { findById } as unknown as MediaReferenceRepository;
  const storage = {} as unknown as StorageService;

  return {
    service: new MediaService(media, storage, access.repository),
    access,
    findById,
  };
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

/* -------------------------------------------------------------------------- */
/*  XD-07, XD-08 — les deux refus absolus                                     */
/* -------------------------------------------------------------------------- */

describe("accès média — les refus de docs/028", () => {
  it("XD-08 — un responsable ne s'accorde jamais un accès à lui-même", async () => {
    const { service, access } = build();

    const error = expectAppError(
      await capture(
        service.grantAccess(managerA, MEDIA_ID, {
          granteeType: "ADMIN_PROFILE",
          granteeId: managerA.id,
          rights: RIGHTS_USE,
        }),
      ),
      "FORBIDDEN",
      403,
    );

    expect(error.message).not.toMatch(/XD-08|D-22/);
    // **Rien** n'a été écrit : un refus qui laisserait une ligne derrière lui
    // serait pire qu'un refus tardif.
    expect(access.store.size).toBe(0);
  });

  it("D-22 — un responsable n'accorde aucun accès, même à son propre département", async () => {
    const { service, access } = build();

    expectAppError(
      await capture(
        service.grantAccess(managerA, MEDIA_ID, {
          granteeType: "DEPARTMENT",
          granteeId: DEPARTMENT_A,
          rights: RIGHTS_USE,
        }),
      ),
      "FORBIDDEN",
      403,
    );
    expect(access.store.size).toBe(0);
  });

  it("D-22 / cellule 6.4 — un responsable ne retire aucun accès", async () => {
    const seeded = fakeAccess([granted("DEPARTMENT", DEPARTMENT_A)]);
    const { service } = build(seeded);

    expectAppError(
      await capture(service.revokeAccess(managerA, MEDIA_ID, "DEPARTMENT", DEPARTMENT_A)),
      "FORBIDDEN",
      403,
    );
    // L'accès est intact : un refus partiel laisserait un état incohérent.
    expect(seeded.store.size).toBe(1);
  });

  it("cellule 6.1 / Q-11 — un responsable ne lit pas la table des autorisations", async () => {
    const { service } = build(fakeAccess([granted("DEPARTMENT", DEPARTMENT_B)]));

    expectAppError(await capture(service.listAccess(managerA, MEDIA_ID)), "FORBIDDEN", 403);
  });

  it("cellule 6.3 — un responsable ne modifie pas les droits", async () => {
    const seeded = fakeAccess([granted("DEPARTMENT", DEPARTMENT_A)]);
    const { service } = build(seeded);

    expectAppError(
      await capture(
        service.updateAccess(managerA, MEDIA_ID, "DEPARTMENT", DEPARTMENT_A, RIGHTS_ALL),
      ),
      "FORBIDDEN",
      403,
    );
    expect(seeded.store.get(`DEPARTMENT:${DEPARTMENT_A}`)?.canDelete).toBe(false);
  });

  /**
   * XD-07 porte sur le **droit accordé**, pas sur le rôle qui l'accorde : le
   * `SUPER_ADMIN` lui-même ne peut pas donner `DELETE` à un département. C'est
   * confirmé en base par `media_access_department_no_delete` — deux verrous, un
   * seul effet.
   */
  it("XD-07 — même le SUPER_ADMIN ne peut pas accorder DELETE à un département", async () => {
    const { service, access } = build();

    expectAppError(
      await capture(
        service.grantAccess(superAdmin, MEDIA_ID, {
          granteeType: "DEPARTMENT",
          granteeId: DEPARTMENT_A,
          rights: RIGHTS_ALL,
        }),
      ),
      "FORBIDDEN",
      403,
    );
    expect(access.store.size).toBe(0);
  });

  it("aucun droit vide n'est enregistré", async () => {
    const { service, access } = build();

    expectAppError(
      await capture(
        service.grantAccess(admin, MEDIA_ID, {
          granteeType: "DEPARTMENT",
          granteeId: DEPARTMENT_A,
          rights: { canUse: false, canManage: false, canDelete: false },
        }),
      ),
      "FORBIDDEN",
      403,
    );
    expect(access.store.size).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/*  Ce que l'ADMIN peut faire — et le cas normal des deux départements        */
/* -------------------------------------------------------------------------- */

describe("accès média — le cas normal (média global, Presse et Ecodume)", () => {
  it("l'ADMIN accorde USE à un département, puis MANAGE à un autre", async () => {
    const { service, access } = build();

    await service.grantAccess(admin, MEDIA_ID, {
      granteeType: "DEPARTMENT",
      granteeId: DEPARTMENT_A,
      rights: RIGHTS_USE,
    });
    await service.grantAccess(admin, MEDIA_ID, {
      granteeType: "DEPARTMENT",
      granteeId: DEPARTMENT_B,
      rights: { canUse: false, canManage: true, canDelete: false },
    });

    // Deux lignes indépendantes sur **le même** média : c'est le cas que
    // `docs/026` §Lot 5 demande d'éprouver explicitement. Le média n'appartient
    // à aucun des deux (X27), et chacun a exactement les droits qui lui ont été
    // accordés — ni plus, ni par déduction.
    expect(access.store.size).toBe(2);
    expect(access.store.get(`DEPARTMENT:${DEPARTMENT_A}`)?.canManage).toBe(false);
    expect(access.store.get(`DEPARTMENT:${DEPARTMENT_B}`)?.canUse).toBe(false);
  });

  it("l'ADMIN accorde DELETE à un profil nommément désigné", async () => {
    // Le `CHECK` de la base n'interdit `DELETE` qu'aux **départements** : un
    // grant personnel accordé par l'ADMIN peut le porter (docs/032 §3.4).
    const { service, access } = build();

    const created = await service.grantAccess(admin, MEDIA_ID, {
      granteeType: "ADMIN_PROFILE",
      granteeId: "55555555-5555-4555-8555-555555555555",
      rights: RIGHTS_ALL,
    });

    expect(created.canDelete).toBe(true);
    expect(access.store.size).toBe(1);
  });

  it("l'ADMIN modifie les droits d'une ligne existante", async () => {
    const { service } = build(fakeAccess([granted("DEPARTMENT", DEPARTMENT_A)]));

    const updated = await service.updateAccess(admin, MEDIA_ID, "DEPARTMENT", DEPARTMENT_A, {
      canUse: true,
      canManage: true,
      canDelete: false,
    });

    expect(updated.canUse).toBe(true);
    expect(updated.canManage).toBe(true);
  });

  it("l'ADMIN retire un accès : la ligne disparaît, elle ne se vide pas", async () => {
    const seeded = fakeAccess([granted("DEPARTMENT", DEPARTMENT_A)]);
    const { service } = build(seeded);

    await service.revokeAccess(admin, MEDIA_ID, "DEPARTMENT", DEPARTMENT_A);

    // `media_access_at_least_one_right` interdit une ligne vide : le retrait est
    // une suppression de ligne (`docs/029` §2.6), pas une mise à zéro.
    expect(seeded.store.size).toBe(0);
  });

  it("l'ADMIN lit les droits d'un média", async () => {
    const { service } = build(
      fakeAccess([granted("DEPARTMENT", DEPARTMENT_A), granted("DEPARTMENT", DEPARTMENT_B)]),
    );

    const access = await service.listAccess(admin, MEDIA_ID);

    expect(access).toHaveLength(2);
    expect(access.map((row) => row.granteeId).sort()).toEqual([DEPARTMENT_A, DEPARTMENT_B]);
  });
});

/* -------------------------------------------------------------------------- */
/*  Résolution et code d'erreur                                               */
/* -------------------------------------------------------------------------- */

describe("accès média — média et droits introuvables", () => {
  it("répond MEDIA_NOT_FOUND sur un média inexistant, avant toute décision", async () => {
    const { service, findById } = build();
    findById.mockResolvedValue(null);

    expectAppError(
      await capture(service.grantAccess(admin, MEDIA_ID, {
        granteeType: "DEPARTMENT",
        granteeId: DEPARTMENT_A,
        rights: RIGHTS_USE,
      })),
      "MEDIA_NOT_FOUND",
      404,
    );
  });

  it("répond MEDIA_ACCESS_NOT_FOUND sur un retrait sans droits existants", async () => {
    const { service } = build();

    expectAppError(
      await capture(service.revokeAccess(admin, MEDIA_ID, "DEPARTMENT", DEPARTMENT_A)),
      "MEDIA_ACCESS_NOT_FOUND",
      404,
    );
  });

  it("répond MEDIA_ACCESS_NOT_FOUND sur une modification sans droits existants", async () => {
    const { service } = build();

    expectAppError(
      await capture(
        service.updateAccess(admin, MEDIA_ID, "DEPARTMENT", DEPARTMENT_A, RIGHTS_USE),
      ),
      "MEDIA_ACCESS_NOT_FOUND",
      404,
    );
  });
});
