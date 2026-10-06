import { describe, expect, it, vi } from "vitest";
import { slugify, uniqueSlug } from "@/shared/utils/slug";

/**
 * Le slug est l'identifiant public d'une ressource : il apparaît dans les URL
 * du site. Une régression ici casse des liens existants — le test couvre donc
 * les accents, les apostrophes typographiques et les cas limites.
 */

describe("slugify", () => {
  it("retire les accents en conservant les lettres", () => {
    expect(slugify("Église de l'Espérance")).toBe("eglise-de-l-esperance");
    expect(slugify("Département Jeunesse")).toBe("departement-jeunesse");
    expect(slugify("ÉÀÎÔÙÇ")).toBe("eaiouc");
  });

  it("traite l'apostrophe droite et l'apostrophe typographique de la même façon", () => {
    expect(slugify("l'Éternel")).toBe("l-eternel");
    expect(slugify("l’Éternel")).toBe("l-eternel");
    // U+2018 / U+2019 / U+02BC (apostrophe modificative)
    expect(slugify("d‘accord")).toBe("d-accord");
  });

  it("met en minuscules", () => {
    expect(slugify("CULTE DU DIMANCHE")).toBe("culte-du-dimanche");
  });

  it("réduit les espaces multiples et les séparateurs à un seul tiret", () => {
    expect(slugify("Bonjour   le    monde")).toBe("bonjour-le-monde");
    expect(slugify("sainte_marie--du--ciel")).toBe("sainte-marie-du-ciel");
    expect(slugify("  espaces  autour  ")).toBe("espaces-autour");
  });

  it("supprime les séparateurs en tête et en queue", () => {
    expect(slugify("-- Église --")).toBe("eglise");
    expect(slugify("!!! Louange !!!")).toBe("louange");
  });

  it("remplace les caractères spéciaux et les emojis", () => {
    expect(slugify("Prix 100% & + d'infos !")).toBe("prix-100-d-infos");
    expect(slugify("Foi 🙏 en Dieu")).toBe("foi-en-dieu");
    expect(slugify("Noël 2026 / Édition #2")).toBe("noel-2026-edition-2");
  });

  it("conserve les chiffres, y compris en tête", () => {
    expect(slugify("2026 Année de la Foi")).toBe("2026-annee-de-la-foi");
  });

  it("retourne une chaîne vide pour une entrée vide ou sans caractère exploitable", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("!!! ??? ...")).toBe("");
    // Un alphabet non latin ne produit aucun caractère ASCII : le repli est
    // géré par `uniqueSlug` (« sans-titre »), pas par `slugify`.
    expect(slugify("Церковь")).toBe("");
  });

  it("tronque une entrée de 300 caractères à 160 caractères", () => {
    const long = "a".repeat(300);
    const slug = slugify(long);
    expect(slug).toHaveLength(160);
    expect(slug).toBe("a".repeat(160));
  });

  it("tronque une entrée longue sans laisser de tiret final", () => {
    const words = Array.from({ length: 80 }, () => "seigneur").join(" ");
    const slug = slugify(words);

    expect(slug).toHaveLength(160);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("uniqueSlug", () => {
  it("retourne le slug de base quand il est libre", async () => {
    const exists = vi.fn(async () => false);

    await expect(uniqueSlug("Église Centrale", exists)).resolves.toBe(
      "eglise-centrale",
    );
    expect(exists).toHaveBeenCalledTimes(1);
    expect(exists).toHaveBeenCalledWith("eglise-centrale");
  });

  it("suffixe à partir de 2 en cas de conflit unique", async () => {
    const taken = new Set(["eglise-centrale"]);
    const exists = vi.fn(async (candidate: string) => taken.has(candidate));

    await expect(uniqueSlug("Église Centrale", exists)).resolves.toBe(
      "eglise-centrale-2",
    );
    expect(exists).toHaveBeenCalledTimes(2);
  });

  it("incrémente le suffixe jusqu'au premier slug libre", async () => {
    const taken = new Set([
      "eglise-centrale",
      "eglise-centrale-2",
      "eglise-centrale-3",
      "eglise-centrale-4",
    ]);
    const exists = vi.fn(async (candidate: string) => taken.has(candidate));

    await expect(uniqueSlug("Église Centrale", exists)).resolves.toBe(
      "eglise-centrale-5",
    );
    expect(exists).toHaveBeenCalledTimes(5);
  });

  it("se replie sur « sans-titre » quand la base ne produit aucun slug", async () => {
    const exists = vi.fn(async () => false);

    await expect(uniqueSlug("!!! ???", exists)).resolves.toBe("sans-titre");
    expect(exists).toHaveBeenCalledWith("sans-titre");
  });

  it("utilise une base déjà normalisée sans la retoucher", async () => {
    const exists = vi.fn(async () => false);

    await expect(uniqueSlug("deja-un-slug", exists)).resolves.toBe("deja-un-slug");
  });

  it("abandonne au-delà de 100 tentatives au lieu de boucler indéfiniment", async () => {
    const exists = vi.fn(async () => true);

    await expect(uniqueSlug("Église Centrale", exists)).rejects.toThrow(
      /Impossible de générer un slug unique/,
    );
    // Le garde-fou est borné : on ne doit jamais dépasser une centaine d'appels.
    expect(exists.mock.calls.length).toBeGreaterThan(1);
    expect(exists.mock.calls.length).toBeLessThanOrEqual(100);
  });

  it("remonte l'erreur du contrôle d'existence", async () => {
    const failure = new Error("base injoignable");
    const exists = vi.fn(async () => {
      throw failure;
    });

    await expect(uniqueSlug("Église Centrale", exists)).rejects.toBe(failure);
  });
});
