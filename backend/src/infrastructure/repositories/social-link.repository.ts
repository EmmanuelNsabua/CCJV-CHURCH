import { asc, eq } from "drizzle-orm";
import type { SocialLink } from "@/domain/entities";
import type { SocialLinkInput, SocialLinkRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { socialLinks } from "@/infrastructure/database/schema";
import type { SocialLinkRow } from "@/infrastructure/database/schema/editorial";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des réseaux sociaux.
 *
 * Liste ordonnée : elle a sa propre table, précisément pour ne pas dériver vers
 * un magasin clé/valeur générique (`docs/018` §4.3).
 */

function toSocialLink(row: SocialLinkRow): SocialLink {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function firstRow<T>(rows: T[], operation: string): T {
  const row = rows[0];
  if (row === undefined) {
    throw new InternalError(`Écriture non confirmée par la base : ${operation}`);
  }
  return row;
}

export class DrizzleSocialLinkRepository implements SocialLinkRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<SocialLink[]> {
    const rows = await this.db
      .select()
      .from(socialLinks)
      .orderBy(asc(socialLinks.position), asc(socialLinks.label));

    return rows.map(toSocialLink);
  }

  async findById(id: string): Promise<SocialLink | null> {
    const rows = await this.db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.id, id))
      .limit(1);

    const row = rows[0];
    return row ? toSocialLink(row) : null;
  }

  async create(data: SocialLinkInput): Promise<SocialLink> {
    const rows = await this.db
      .insert(socialLinks)
      .values({
        label: data.label,
        href: data.href,
        position: data.position ?? 0,
      })
      .returning();

    return toSocialLink(firstRow(rows, "création du lien social"));
  }

  async update(id: string, data: Partial<SocialLinkInput>): Promise<SocialLink | null> {
    const values: Partial<typeof socialLinks.$inferInsert> = {};
    if (data.label !== undefined) values.label = data.label;
    if (data.href !== undefined) values.href = data.href;
    if (data.position !== undefined) values.position = data.position;

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const rows = await this.db
      .update(socialLinks)
      .set(values)
      .where(eq(socialLinks.id, id))
      .returning();

    const row = rows[0];
    return row ? toSocialLink(row) : null;
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(socialLinks)
      .where(eq(socialLinks.id, id))
      .returning({ id: socialLinks.id });

    return rows.length > 0;
  }
}
