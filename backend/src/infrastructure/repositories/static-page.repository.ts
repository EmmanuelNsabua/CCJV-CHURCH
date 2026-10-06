import { eq, sql } from "drizzle-orm";
import type { StaticPage } from "@/domain/entities";
import type { StaticPageRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { staticPages } from "@/infrastructure/database/schema";
import type { StaticPageRow } from "@/infrastructure/database/schema/editorial";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des pages éditables.
 *
 * `content` est un `jsonb` **déjà validé** par le schéma de la page
 * (`domain/content/page-content.ts`) avant d'arriver ici : le repository ne
 * juge pas le contenu, il le stocke.
 */

function asContent(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toStaticPage(row: StaticPageRow): StaticPage {
  return {
    id: row.id,
    pageKey: row.pageKey,
    content: asContent(row.content),
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleStaticPageRepository implements StaticPageRepository {
  constructor(private readonly db: Database) {}

  async findByKey(pageKey: string): Promise<StaticPage | null> {
    const rows = await this.db
      .select()
      .from(staticPages)
      .where(eq(staticPages.pageKey, pageKey))
      .limit(1);

    const row = rows[0];
    return row ? toStaticPage(row) : null;
  }

  /**
   * Écriture idempotente : `page_key` est unique, une première écriture crée la
   * ligne, les suivantes la remplacent. `updated_by` reçoit l'administrateur
   * courant, ce qui rend la dernière modification traçable.
   */
  async upsert(
    pageKey: string,
    content: Record<string, unknown>,
    updatedBy: string | null,
  ): Promise<StaticPage> {
    const rows = await this.db
      .insert(staticPages)
      .values({ pageKey, content, updatedBy })
      .onConflictDoUpdate({
        target: staticPages.pageKey,
        set: {
          // `excluded` doit rester non qualifié dans un `ON CONFLICT DO UPDATE` :
          // Drizzle préfixerait sinon la colonne par le nom de la table.
          content: sql`excluded.${sql.identifier(staticPages.content.name)}`,
          updatedBy: sql`excluded.${sql.identifier(staticPages.updatedBy.name)}`,
          // `$onUpdate` n'est pas appliqué sur `onConflictDoUpdate`.
          updatedAt: sql`now()`,
        },
      })
      .returning();

    const row = rows[0];
    if (row === undefined) {
      throw new InternalError("Écriture non confirmée par la base : page statique");
    }
    return toStaticPage(row);
  }
}
