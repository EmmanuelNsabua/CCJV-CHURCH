import { beforeEach, describe, expect, it } from "@jest/globals";
import type {
  BiblicalReference,
  Teaching,
  TeachingMedia,
} from "@/domain/entities";
import type {
  BiblicalReferenceInput,
  MediaRepository,
  TeachingFilter,
  TeachingMediaInput,
  TeachingRepository,
} from "@/domain/repositories";
import { TeachingService, TeachingNotFoundError } from "@/modules/teachings/teaching.service";
import { DuplicateSlugError, ValidationError } from "@/shared/errors/app-error";

const TEACHING_ID = "11111111-2222-3333-4444-555555555555";
const MEDIA_VIDEO_ID = "22222222-3333-4444-5555-666666666666";
const MEDIA_AUDIO_ID = "33333333-4444-5555-6666-777777777777";
const MEDIA_THUMB_ID = "44444444-5555-6666-7777-888888888888";

function teachingFixture(overrides: Partial<Teaching> = {}): Teaching {
  return {
    id: TEACHING_ID,
    title: "La puissance de la foi",
    slug: "la-puissance-de-la-foi",
    speakerName: "Pasteur Jean",
    preachedAt: "2026-05-10",
    summary: "Un message puissant sur la marche par la foi.",
    description: "Description détaillée du message.",
    status: "DRAFT",
    publishedAt: null,
    createdAt: new Date("2026-05-10T10:00:00Z"),
    updatedAt: new Date("2026-05-10T10:00:00Z"),
    biblicalReferences: [],
    references: [],
    medias: [],
    ...overrides,
  };
}

class InMemoryTeachingRepository implements TeachingRepository {
  public items: Map<string, Teaching> = new Map();

  async findById(id: string): Promise<Teaching | null> {
    return this.items.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Teaching | null> {
    for (const t of this.items.values()) {
      if (t.slug === slug) return t;
    }
    return null;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    for (const t of this.items.values()) {
      if (t.slug === slug && t.id !== exceptId) return true;
    }
    return false;
  }

  async list(filter: TeachingFilter): Promise<{ items: Teaching[]; total: number }> {
    let result = Array.from(this.items.values());
    if (filter.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          t.speakerName.toLowerCase().includes(s),
      );
    }
    return { items: result, total: result.length };
  }

  async create(data: any): Promise<Teaching> {
    const teaching: Teaching = {
      id: TEACHING_ID,
      title: data.title,
      slug: data.slug,
      speakerName: data.speakerName,
      preachedAt: data.preachedAt,
      summary: data.summary ?? null,
      description: data.description ?? null,
      status: data.status ?? "DRAFT",
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      biblicalReferences: [],
      references: [],
      medias: [],
    };
    this.items.set(teaching.id, teaching);
    return teaching;
  }

  async update(id: string, data: any): Promise<Teaching> {
    const existing = this.items.get(id);
    if (!existing) throw new Error("Not found");
    // Le repository Drizzle n'écrit que les clés **définies** : ce double doit
    // faire de même, sinon il masquerait une écriture accidentelle à `undefined`.
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) patch[key] = value;
    }
    const updated: Teaching = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async updateBiblicalReferences(
    teachingId: string,
    references: BiblicalReferenceInput[],
  ): Promise<BiblicalReference[]> {
    const existing = this.items.get(teachingId);
    if (!existing) throw new Error("Not found");
    const refs: BiblicalReference[] = references.map((r, idx) => ({
      id: `ref-${idx}`,
      teachingId,
      book: r.book,
      startChapter: r.startChapter,
      startVerse: r.startVerse,
      endChapter: r.endChapter ?? null,
      endVerse: r.endVerse ?? null,
      position: r.position ?? idx,
      createdAt: new Date(),
    }));
    existing.biblicalReferences = refs;
    existing.references = refs;
    this.items.set(teachingId, existing);
    return refs;
  }

  async updateMedias(
    teachingId: string,
    medias: TeachingMediaInput[],
  ): Promise<TeachingMedia[]> {
    const existing = this.items.get(teachingId);
    if (!existing) throw new Error("Not found");
    const mapped: TeachingMedia[] = medias.map((m, idx) => ({
      id: `tm-${idx}`,
      teachingId,
      mediaId: m.mediaId,
      role: m.role,
      isPrimary: m.isPrimary ?? false,
      position: m.position ?? idx,
      createdAt: new Date(),
      media: {
        id: m.mediaId,
        title: "Test Media",
        publicUrl: `https://example.com/media/${m.mediaId}`,
        mimeType: m.role === "VIDEO" ? "video/mp4" : m.role === "AUDIO" ? "audio/mpeg" : "image/jpeg",
        fileSizeBytes: 1000,
        alt: null,
      },
    }));
    existing.medias = mapped;
    this.items.set(teachingId, existing);
    return mapped;
  }

  async publish(id: string, publishedAt: Date): Promise<Teaching> {
    const existing = this.items.get(id);
    if (!existing) throw new Error("Not found");
    const updated: Teaching = {
      ...existing,
      status: "PUBLISHED",
      publishedAt,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async archive(id: string): Promise<Teaching> {
    const existing = this.items.get(id);
    if (!existing) throw new Error("Not found");
    const updated: Teaching = {
      ...existing,
      status: "ARCHIVED",
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}

class InMemoryMediaRepository implements Partial<MediaRepository> {
  private knownIds = new Set([MEDIA_VIDEO_ID, MEDIA_AUDIO_ID, MEDIA_THUMB_ID]);

  async findById(id: string): Promise<any | null> {
    if (!this.knownIds.has(id)) return null;
    return {
      id,
      title: "Sample media",
      storagePath: `sample/${id}.mp4`,
      publicUrl: `https://storage.ccjv.local/${id}.mp4`,
      mimeType: id === MEDIA_VIDEO_ID ? "video/mp4" : id === MEDIA_AUDIO_ID ? "audio/mpeg" : "image/jpeg",
      fileSizeBytes: 1024,
      departmentId: null,
      uploadedByAdminId: null,
      alt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

describe("TeachingService — Tests unitaires métier", () => {
  let teachingRepo: InMemoryTeachingRepository;
  let mediaRepo: InMemoryMediaRepository;
  let service: TeachingService;

  beforeEach(() => {
    teachingRepo = new InMemoryTeachingRepository();
    mediaRepo = new InMemoryMediaRepository();
    service = new TeachingService(teachingRepo, mediaRepo as unknown as MediaRepository);
  });

  describe("Création et validations de base", () => {
    it("refuse une date de prédication absente ou invalide", async () => {
      await expect(
        service.create({
          title: "Sermon",
          speakerName: "Orateur",
          preachedAt: "invalid-date",
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.create({
          title: "Sermon",
          speakerName: "Orateur",
          preachedAt: "2026-02-31", // Date inexistante
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("refuse un titre vide ou composé uniquement d'espaces", async () => {
      await expect(
        service.create({
          title: "   ",
          speakerName: "Orateur",
          preachedAt: "2026-05-10",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("refuse un orateur vide", async () => {
      await expect(
        service.create({
          title: "Sermon",
          speakerName: "   ",
          preachedAt: "2026-05-10",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("génère automatiquement un slug unique lors de la création", async () => {
      const created = await service.create({
        title: "La Foi qui Triomphe",
        speakerName: "Pasteur Moïse",
        preachedAt: "2026-05-10",
      });

      expect(created.slug).toBe("la-foi-qui-triomphe");
      expect(created.status).toBe("DRAFT");
    });

    it("suffixe un slug personnalisé déjà pris (l'adresse reste unique)", async () => {
      teachingRepo.items.set(
        "existing-id",
        teachingFixture({ id: "existing-id", slug: "mon-slug" }),
      );

      const created = await service.create({
        title: "Autre titre",
        slug: "mon-slug",
        speakerName: "Pasteur",
        preachedAt: "2026-05-10",
      });
      // Le titre reste libre : c'est l'adresse qui est rendue unique.
      expect(created.slug).toBe("mon-slug-2");
    });
  });

  describe("Validation des références bibliques", () => {
    beforeEach(() => {
      teachingRepo.items.set(TEACHING_ID, teachingFixture());
    });

    it("accepte une référence biblique simple et valide", async () => {
      const refs = await service.updateBiblicalReferences(TEACHING_ID, [
        {
          book: "Hébreux",
          startChapter: 11,
          startVerse: 1,
          endChapter: 11,
          endVerse: 6,
          position: 0,
        },
      ]);

      expect(refs).toHaveLength(1);
      expect(refs[0]?.book).toBe("Hébreux");
      expect(refs[0]?.startVerse).toBe(1);
    });

    it("refuse un livre biblique vide", async () => {
      await expect(
        service.updateBiblicalReferences(TEACHING_ID, [
          {
            book: "   ",
            startChapter: 1,
            startVerse: 1,
          },
        ]),
      ).rejects.toThrow(ValidationError);
    });

    it("refuse des chapitres ou versets non positifs", async () => {
      await expect(
        service.updateBiblicalReferences(TEACHING_ID, [
          {
            book: "Genèse",
            startChapter: 0,
            startVerse: 1,
          },
        ]),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.updateBiblicalReferences(TEACHING_ID, [
          {
            book: "Genèse",
            startChapter: 1,
            startVerse: -5,
          },
        ]),
      ).rejects.toThrow(ValidationError);
    });

    it("refuse une plage où le chapitre de fin est antérieur au début", async () => {
      await expect(
        service.updateBiblicalReferences(TEACHING_ID, [
          {
            book: "Romains",
            startChapter: 8,
            startVerse: 1,
            endChapter: 7,
            endVerse: 10,
          },
        ]),
      ).rejects.toThrow(ValidationError);
    });

    it("refuse une plage dans le même chapitre où le verset de fin est antérieur au début", async () => {
      await expect(
        service.updateBiblicalReferences(TEACHING_ID, [
          {
            book: "Jean",
            startChapter: 3,
            startVerse: 16,
            endChapter: 3,
            endVerse: 10,
          },
        ]),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Validation des médias et règles de publication", () => {
    beforeEach(() => {
      teachingRepo.items.set(TEACHING_ID, teachingFixture());
    });

    it("refuse l'association d'un média qui n'existe pas dans la médiathèque centrale", async () => {
      await expect(
        service.updateMedias(TEACHING_ID, [
          {
            mediaId: "00000000-0000-0000-0000-000000000000",
            role: "VIDEO",
            isPrimary: true,
          },
        ]),
      ).rejects.toThrow();
    });

    it("refuse de désigner plusieurs médias principaux", async () => {
      await expect(
        service.updateMedias(TEACHING_ID, [
          {
            mediaId: MEDIA_VIDEO_ID,
            role: "VIDEO",
            isPrimary: true,
          },
          {
            mediaId: MEDIA_AUDIO_ID,
            role: "AUDIO",
            isPrimary: true,
          },
        ]),
      ).rejects.toThrow(ValidationError);
    });

    it("refuse la publication si AUCUN média n'est associé", async () => {
      await expect(service.publish(TEACHING_ID)).rejects.toThrow(ValidationError);
    });

    it("autorise la publication si une image (THUMBNAIL) est associée", async () => {
      await service.updateMedias(TEACHING_ID, [
        {
          mediaId: MEDIA_THUMB_ID,
          role: "THUMBNAIL",
          isPrimary: true,
        },
      ]);

      const published = await service.publish(TEACHING_ID);
      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedAt).toBeInstanceOf(Date);
    });

    it("autorise la publication si un média VIDEO principal est présent", async () => {
      await service.updateMedias(TEACHING_ID, [
        {
          mediaId: MEDIA_VIDEO_ID,
          role: "VIDEO",
          isPrimary: true,
        },
        {
          mediaId: MEDIA_THUMB_ID,
          role: "THUMBNAIL",
          isPrimary: false,
        },
      ]);

      const published = await service.publish(TEACHING_ID);
      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedAt).toBeInstanceOf(Date);
    });

    it("autorise la publication si un média AUDIO principal est présent", async () => {
      await service.updateMedias(TEACHING_ID, [
        {
          mediaId: MEDIA_AUDIO_ID,
          role: "AUDIO",
          isPrimary: true,
        },
      ]);

      const published = await service.publish(TEACHING_ID);
      expect(published.status).toBe("PUBLISHED");
    });
  });

  describe("Publication : la seule porte est la transition contrôlée", () => {
    it("refuse de créer un enseignement directement publié", async () => {
      await expect(
        service.create({
          title: "Sermon déjà publié",
          speakerName: "Orateur",
          preachedAt: "2026-05-10",
          status: "PUBLISHED",
        }),
      ).rejects.toThrow(ValidationError);

      // Aucune ligne n'a été créée : le refus n'est pas un demi-succès.
      expect(teachingRepo.items.size).toBe(0);
    });

    it("refuse une mise à jour qui publie sans média principal", async () => {
      teachingRepo.items.set(TEACHING_ID, teachingFixture());

      await expect(
        service.update(TEACHING_ID, { status: "PUBLISHED" }),
      ).rejects.toThrow(ValidationError);

      const unchanged = teachingRepo.items.get(TEACHING_ID);
      expect(unchanged?.status).toBe("DRAFT");
      expect(unchanged?.publishedAt).toBeNull();
    });

    it("publie par la mise à jour en appliquant la règle de média et la date serveur", async () => {
      teachingRepo.items.set(TEACHING_ID, teachingFixture());
      await service.updateMedias(TEACHING_ID, [
        { mediaId: MEDIA_AUDIO_ID, role: "AUDIO", isPrimary: true },
      ]);

      const updated = await service.update(TEACHING_ID, {
        title: "Titre corrigé",
        status: "PUBLISHED",
      });

      expect(updated.status).toBe("PUBLISHED");
      expect(updated.publishedAt).toBeInstanceOf(Date);
      expect(updated.title).toBe("Titre corrigé");
    });

    it("ne modifie pas la date de publication d'un enseignement déjà publié", async () => {
      const firstPublication = new Date("2026-05-20T08:00:00Z");
      teachingRepo.items.set(
        TEACHING_ID,
        teachingFixture({ status: "PUBLISHED", publishedAt: firstPublication }),
      );

      const updated = await service.update(TEACHING_ID, {
        speakerName: "Autre orateur",
        status: "PUBLISHED",
      });

      expect(updated.status).toBe("PUBLISHED");
      expect(updated.publishedAt).toEqual(firstPublication);
    });
  });

  describe("Transitions de statut et visibilité publique", () => {
    it("masque les brouillons et archives aux requêtes publiques sans profil admin", async () => {
      teachingRepo.items.set(
        "draft-1",
        teachingFixture({ id: "draft-1", slug: "draft-1", status: "DRAFT" }),
      );
      teachingRepo.items.set(
        "pub-1",
        teachingFixture({ id: "pub-1", slug: "pub-1", status: "PUBLISHED" }),
      );
      teachingRepo.items.set(
        "arch-1",
        teachingFixture({ id: "arch-1", slug: "arch-1", status: "ARCHIVED" }),
      );

      // Appel public
      const publicList = await service.list({}, undefined);
      expect(publicList.items).toHaveLength(1);
      expect(publicList.items[0]?.id).toBe("pub-1");

      // Consultation unitaire d'un brouillon par le public -> 404
      await expect(service.get("draft-1", undefined)).rejects.toThrow(
        TeachingNotFoundError,
      );
    });

    it("permet à un administrateur d'accéder aux brouillons", async () => {
      teachingRepo.items.set(
        "draft-1",
        teachingFixture({ id: "draft-1", slug: "draft-1", status: "DRAFT" }),
      );

      const adminActor = {
        id: "admin-id",
        username: "admin",
        displayName: "Admin",
        scope: "GLOBAL" as const,
        role: "ADMIN" as const,
        departmentId: null,
        fullName: "Admin",
        email: "admin@ccjv.local",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const found = await service.get("draft-1", adminActor);
      expect(found.id).toBe("draft-1");
    });

    it("permet l'archivage et retire l'enseignement de la liste active publique", async () => {
      teachingRepo.items.set(
        TEACHING_ID,
        teachingFixture({ status: "PUBLISHED" }),
      );

      const archived = await service.archive(TEACHING_ID);
      expect(archived.status).toBe("ARCHIVED");

      const publicList = await service.list({}, undefined);
      expect(publicList.items).toHaveLength(0);
    });
  });
});
