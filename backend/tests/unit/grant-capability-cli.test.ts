import { describe, expect, it } from "@jest/globals";
import { DEPARTMENT_CAPABILITIES } from "@/domain/departments/capabilities";
import { parseCapabilityArgs } from "../../scripts/lib/capability-arguments";

/**
 * Validation des arguments du script d'attribution de capacité (`docs/028` D-25).
 *
 * Ce script est le **chemin d'écriture d'exploitation** des capacités de
 * département : `docs/029` Q-06 n'étant pas tranchée, aucune route n'écrit dans
 * `department_capabilities` (`DepartmentPolicy.canEditCapabilities` refuse
 * `EDIT_CAPABILITIES` à tout le monde). Ce qui décide donc de qui peut accorder
 * la portée globale, aujourd'hui, c'est l'accès à la machine qui détient les
 * identifiants — et la rigueur de ces refus.
 *
 * Trois propriétés sont vérifiées ici, et la troisième est une exigence de
 * `docs/032` §3.5 :
 *
 * 1. un département est **toujours** désigné (aucune capacité ne s'accorde « en
 *    général ») ;
 * 2. une capacité **inconnue est refusée** avant toute écriture, avec la liste
 *    des valeurs admises — le `CHECK` de la base refuserait aussi, mais son
 *    message ne dirait pas quoi écrire ;
 * 3. `--granted-by` est **obligatoire** : `docs/032` §3.5 conserve l'auteur du
 *    grant pour que l'autorisation soit attribuable. Une capacité sans auteur ne
 *    serait opposable à personne, et c'est précisément ce que la colonne existe
 *    pour empêcher.
 *
 * Ce test importe le script : la garde `launchedDirectly` garantit qu'aucune
 * connexion n'est ouverte et qu'aucune écriture n'a lieu à l'import.
 */

const BASE = ["--department", "8f2c1d34-5b6e-4f70-9a11-2c3d4e5f6a7b"];

describe("script de capacité — validation des arguments", () => {
  it("accepte une invocation complète et retient la capacité demandée", () => {
    const args = parseCapabilityArgs([
      ...BASE,
      "--capability",
      DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL,
      "--granted-by",
      "11111111-1111-4111-8111-111111111111",
    ]);

    expect(args.department).toBe("8f2c1d34-5b6e-4f70-9a11-2c3d4e5f6a7b");
    expect(args.capability).toBe(DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL);
    expect(args.revoke).toBe(false);
  });

  it("refuse une capacité inconnue en énumérant les valeurs admises", () => {
    expect(() =>
      parseCapabilityArgs([
        ...BASE,
        "--capability",
        "EVENT_SCOPE_EVERYTHING",
        "--granted-by",
        "x",
      ]),
    ).toThrow(/EVENT_SCOPE_GLOBAL/);
  });

  it("refuse de deviner un auteur de grant", () => {
    expect(() => parseCapabilityArgs(BASE)).toThrow(/granted-by/);
  });

  it("refuse d'agir sans département désigné", () => {
    expect(() => parseCapabilityArgs(["--granted-by", "x"])).toThrow(/department/);
  });

  it("accepte `--revoke` comme drapeau sans valeur", () => {
    const args = parseCapabilityArgs([...BASE, "--granted-by", "x", "--revoke"]);

    expect(args.revoke).toBe(true);
  });
});
