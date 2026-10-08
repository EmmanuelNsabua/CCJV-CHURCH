import { describe, expect, it } from "@jest/globals";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/modules/departments/department.schema";

/**
 * Contrat d'entrée du module « départements » — et le refus qui compte.
 *
 * `capabilities` n'est **pas** un champ de saisie : une capacité de département
 * décide de la portée publique des événements (`docs/028` D-25, D-26), et
 * `docs/029` Q-06 — « qui édite les capacités ? » — n'est pas tranchée. Un
 * responsable qui pourrait modifier les capacités de son propre département
 * s'attribuerait la portée globale : `docs/029` §5.3 en fait « le vecteur
 * d'escalade le plus direct du modèle ».
 *
 * Le refus est **explicite** plutôt que silencieux, et c'est tout l'objet de ce
 * test. Un objet Zod, par défaut, *retire* les clés inconnues : un client
 * envoyant `capabilities` aurait reçu un `200` sur un département inchangé, et
 * aurait cru l'opération réussie. Pour une donnée d'autorisation, un faux succès
 * est le pire des retours — il laisse croire qu'un droit a été accordé.
 */

const VALID_DEPARTMENT = { name: "Chorale" };

describe("schémas de département — les capacités ne sont pas éditables", () => {
  it("accepte une création ordinaire", () => {
    const result = createDepartmentSchema.safeParse(VALID_DEPARTMENT);

    expect(result.success).toBe(true);
  });

  it("refuse `capabilities` à la création, avec un motif exploitable", () => {
    const result = createDepartmentSchema.safeParse({
      ...VALID_DEPARTMENT,
      capabilities: ["EVENT_SCOPE_GLOBAL"],
    });

    expect(result.success).toBe(false);
    const issue = result.error?.issues[0];
    expect(issue?.path).toEqual(["capabilities"]);
    expect(issue?.message).toMatch(/D-25/);
    expect(issue?.message).toMatch(/Q-06/);
  });

  it("refuse `capabilities` à la mise à jour, quelle que soit la charge utile", () => {
    for (const payload of [
      ["EVENT_SCOPE_GLOBAL"],
      [],
      "EVENT_SCOPE_GLOBAL",
      null,
    ]) {
      const result = updateDepartmentSchema.safeParse({ capabilities: payload });
      expect(`${JSON.stringify(payload)}:${result.success}`).toBe(
        `${JSON.stringify(payload)}:false`,
      );
    }
  });

  it("laisse passer une mise à jour partielle légitime", () => {
    const result = updateDepartmentSchema.safeParse({
      name: "Chorale Sainte-Cécile",
      tagline: "Chanter pour l'Éternel.",
    });

    expect(result.success).toBe(true);
  });

  it("n'accepte pas un slug en mise à jour : une URL publique ne change pas", () => {
    const result = updateDepartmentSchema.safeParse({ slug: "nouveau-slug" });

    // Le slug est retiré par Zod (clé inconnue) : la mise à jour réussit, mais
    // la valeur ne peut pas atteindre le repository, dont le contrat
    // (`Partial<DepartmentInput>`) ignore `slug` par construction.
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("slug");
  });
});
