import type { Scripture } from "@/domain/entities";
import type { ScriptureInput, ScriptureRepository } from "@/domain/repositories";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";
import { DEFAULT_SCRIPTURE_TRANSLATION } from "./scripture.schema";

/**
 * Règles métier des versets.
 *
 * Aucun import d'Express, aucun accès Drizzle : le service ne connaît que le
 * contrat `ScriptureRepository` (`docs/004` §9), ce qui le rend testable sans
 * base de données. Aucun contenu biblique n'est écrit en dur ici — le texte vient
 * de la base, jamais du code.
 */
export class ScriptureService {
  constructor(private readonly scriptures: ScriptureRepository) {}

  async list(): Promise<Scripture[]> {
    return this.scriptures.list();
  }

  async getByKey(key: string): Promise<Scripture> {
    const scripture = await this.scriptures.findByKey(key);
    if (!scripture) {
      throw new NotFoundError(
        "SCRIPTURE_NOT_FOUND",
        `Aucun verset n'est enregistré pour la clé « ${key} »`,
        { key },
      );
    }
    return scripture;
  }

  async create(input: ScriptureInput): Promise<Scripture> {
    // `key` est unique en base : on détecte le conflit avant l'écriture pour
    // renvoyer une erreur métier plutôt qu'une violation de contrainte SQL.
    const existing = await this.scriptures.findByKey(input.key);
    if (existing) {
      throw new ConflictError(
        "CONFLICT",
        `La clé « ${input.key} » est déjà utilisée par un autre verset`,
        { key: input.key },
      );
    }

    return this.scriptures.create({
      ...input,
      translation: input.translation ?? DEFAULT_SCRIPTURE_TRANSLATION,
    });
  }

  async update(key: string, input: Partial<ScriptureInput>): Promise<Scripture> {
    const updated = await this.scriptures.update(key, input);
    if (!updated) {
      throw new NotFoundError(
        "SCRIPTURE_NOT_FOUND",
        `Aucun verset n'est enregistré pour la clé « ${key} »`,
        { key },
      );
    }
    return updated;
  }

  async remove(key: string): Promise<void> {
    const removed = await this.scriptures.remove(key);
    if (!removed) {
      throw new NotFoundError(
        "SCRIPTURE_NOT_FOUND",
        `Aucun verset n'est enregistré pour la clé « ${key} »`,
        { key },
      );
    }
  }
}
