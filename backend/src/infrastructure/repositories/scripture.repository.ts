import { eq } from "drizzle-orm";
import type { Scripture } from "@/domain/entities";
import type { ScriptureInput, ScriptureRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { scriptures } from "@/infrastructure/database/schema";
import type { ScriptureRow } from "@/infrastructure/database/schema/editorial";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des versets.
 *
 * La clé (`rassemblement`, `louange`, `parole`…) est l'identifiant d'URL : c'est
 * elle que les pages utilisent, pas l'`id`.
 */

function toScripture(row: ScriptureRow): Scripture {
  return {
    id: row.id,
    key: row.key,
    text: row.text,
    reference: row.reference,
    translation: row.translation,
    context: row.context,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Une écriture sans ligne retournée est une anomalie, pas un cas métier. */
function firstRow<T>(rows: T[], operation: string): T {
  const row = rows[0];
  if (row === undefined) {
    throw new InternalError(`Écriture non confirmée par la base : ${operation}`);
  }
  return row;
}

export class DrizzleScriptureRepository implements ScriptureRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<Scripture[]> {
    const rows = await this.db.select().from(scriptures).orderBy(scriptures.key);
    return rows.map(toScripture);
  }

  async findByKey(key: string): Promise<Scripture | null> {
    const rows = await this.db
      .select()
      .from(scriptures)
      .where(eq(scriptures.key, key))
      .limit(1);

    const row = rows[0];
    return row ? toScripture(row) : null;
  }

  async create(data: ScriptureInput): Promise<Scripture> {
    // `translation` n'est transmise que si elle est fournie : sinon la valeur
    // par défaut de la colonne s'applique (Louis Segond 1910).
    const values: typeof scriptures.$inferInsert = {
      key: data.key,
      text: data.text,
      reference: data.reference,
      context: data.context ?? null,
    };
    if (data.translation !== undefined) {
      values.translation = data.translation;
    }

    const rows = await this.db.insert(scriptures).values(values).returning();
    return toScripture(firstRow(rows, "création du verset"));
  }

  async update(key: string, data: Partial<ScriptureInput>): Promise<Scripture | null> {
    const values: Partial<typeof scriptures.$inferInsert> = {};
    if (data.key !== undefined) values.key = data.key;
    if (data.text !== undefined) values.text = data.text;
    if (data.reference !== undefined) values.reference = data.reference;
    if (data.translation !== undefined) values.translation = data.translation;
    if (data.context !== undefined) values.context = data.context;

    // `updated_at` est posé par `$onUpdate` : un `set` vide produirait une
    // requête invalide, on retourne donc l'état courant sans rien écrire.
    if (Object.keys(values).length === 0) {
      return this.findByKey(key);
    }

    const rows = await this.db
      .update(scriptures)
      .set(values)
      .where(eq(scriptures.key, key))
      .returning();

    const row = rows[0];
    return row ? toScripture(row) : null;
  }

  async remove(key: string): Promise<boolean> {
    const rows = await this.db
      .delete(scriptures)
      .where(eq(scriptures.key, key))
      .returning({ id: scriptures.id });

    return rows.length > 0;
  }
}
