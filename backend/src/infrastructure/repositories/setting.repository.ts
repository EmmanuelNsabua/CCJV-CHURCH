import { sql } from "drizzle-orm";
import type { SiteSetting } from "@/domain/entities";
import type { SettingRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { siteSettings } from "@/infrastructure/database/schema";
import type { SiteSettingRow } from "@/infrastructure/database/schema/editorial";

/**
 * Persistance des réglages institutionnels scalaires.
 *
 * La table n'est volontairement qu'un magasin clé/valeur : la liste blanche des
 * clés est appliquée par le service (domaine applicatif), pas ici, pour que la
 * règle reste testable sans base de données.
 */

function toSiteSetting(row: SiteSettingRow): SiteSetting {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSettingRepository implements SettingRepository {
  constructor(private readonly db: Database) {}

  async listAll(): Promise<SiteSetting[]> {
    const rows = await this.db.select().from(siteSettings).orderBy(siteSettings.key);
    return rows.map(toSiteSetting);
  }

  /**
   * `upsert` en masse : une seule requête pour tout le corps reçu.
   *
   * `$onUpdate` n'est pas appliqué par Drizzle sur `onConflictDoUpdate` :
   * `updated_at` est donc posé explicitement.
   */
  async upsertMany(values: Record<string, string>): Promise<SiteSetting[]> {
    const entries = Object.entries(values);
    if (entries.length === 0) {
      return [];
    }

    const rows = await this.db
      .insert(siteSettings)
      .values(entries.map(([key, value]) => ({ key, value })))
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          // Drizzle qualifie les colonnes (`"site_settings"."value"`) : dans une
          // clause `ON CONFLICT DO UPDATE`, `excluded` doit rester non qualifié.
          value: sql`excluded.${sql.identifier(siteSettings.value.name)}`,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return rows.map(toSiteSetting);
  }
}
