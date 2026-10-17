import { describe, expect, it } from "@jest/globals";
import type { Resource } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  ResourceFilters,
  ResourceInput,
  ResourceRepository,
} from "@/domain/repositories";
import { ResourceService } from "@/modules/resources/resource.service";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";

function fakeResourceRepository(seed: Resource[] = []): ResourceRepository {
  const store = new Map<string, Resource>(seed.map((r) => [r.id, r]));
  const slugs = new Set(seed.map((r) => r.slug));

  return {
    async list(
      options: ListOptions,
      filters?: ResourceFilters,
    ): Promise<ListResult<Resource>> {
      const search = filters?.search?.trim().toLowerCase();
      const items = Array.from(store.values());
      const filtered = search
        ? items.filter((r: Resource) => {
            const inName = r.name.toLowerCase().includes(search);
            const inDesc = r.description ? r.description.toLowerCase().includes(search) : false;
            return inName || inDesc;
          })
        : items;

      return {
        items: filtered.slice(options.offset, options.offset + options.limit),
        total: filtered.length,
      };
    },

    async findById(id: string): Promise<Resource | null> {
      return store.get(id) ?? null;
    },

    async findBySlug(slug: string): Promise<Resource | null> {
      for (const r of store.values()) {
        if (r.slug === slug) return r;
      }
      return null;
    },

    async slugExists(slug: string): Promise<boolean> {
      return slugs.has(slug);
    },

    async create(data: ResourceInput, slug: string): Promise<Resource> {
      const created: Resource = {
        id: "12345678-1234-1234-1234-123456789abc",
        name: data.name,
        slug,
        description: data.description ?? null,
        file: data.file,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(created.id, created);
      slugs.add(slug);
      return created;
    },

    async update(id: string, data: Partial<ResourceInput>): Promise<Resource | null> {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Resource = {
        ...existing,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.file !== undefined ? { file: data.file } : {}),
        updatedAt: new Date(),
      };
      store.set(id, updated);
      return updated;
    },

    async replaceFile(id: string, file: string): Promise<Resource | null> {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Resource = {
        ...existing,
        file,
        updatedAt: new Date(),
      };
      store.set(id, updated);
      return updated;
    },

    async remove(id: string): Promise<boolean> {
      return store.delete(id);
    },
  };
}

describe("ResourceService — Règles métier des ressources", () => {
  it("crée une ressource avec un fichier PDF valide et un slug généré", async () => {
    const repo = fakeResourceRepository();
    const service = new ResourceService(repo);

    const created = await service.create({
      name: "Guide de prière 2026",
      description: "Livret de jeûne et prière pour l'église",
      file: "https://example.com/storage/guide-2026.pdf",
    });

    expect(created.name).toBe("Guide de prière 2026");
    expect(created.slug).toBe("guide-de-priere-2026");
    expect(created.file).toBe("https://example.com/storage/guide-2026.pdf");
  });

  it("rejette tout fichier qui n'est pas un document PDF avec ValidationError", async () => {
    const repo = fakeResourceRepository();
    const service = new ResourceService(repo);

    await expect(
      service.create({
        name: "Image de couverture",
        file: "https://example.com/storage/photo.jpg",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("remplace directement le fichier PDF d'une ressource", async () => {
    const repo = fakeResourceRepository();
    const service = new ResourceService(repo);

    const initial = await service.create({
      name: "Statuts de l'église",
      file: "https://example.com/storage/v1.pdf",
    });

    const updated = await service.replaceFile(initial.id, {
      file: "https://example.com/storage/v2-final.pdf",
    });

    expect(updated.file).toBe("https://example.com/storage/v2-final.pdf");
    expect(updated.name).toBe("Statuts de l'église");
  });

  it("permet la consultation par identifiant ou par slug", async () => {
    const repo = fakeResourceRepository();
    const service = new ResourceService(repo);

    const ressource = await service.create({
      name: "Programme annuel",
      file: "https://example.com/storage/programme.pdf",
    });

    const parId = await service.get(ressource.id);
    expect(parId.id).toBe(ressource.id);

    const parSlug = await service.get("programme-annuel");
    expect(parSlug.id).toBe(ressource.id);
  });

  it("lève une NotFoundError si la ressource demandée n'existe pas", async () => {
    const repo = fakeResourceRepository();
    const service = new ResourceService(repo);

    await expect(service.get("slug-inexistant")).rejects.toThrow(NotFoundError);
  });
});
