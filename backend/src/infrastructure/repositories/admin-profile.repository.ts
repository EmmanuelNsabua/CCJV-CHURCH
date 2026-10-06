import { asc, eq, sql } from "drizzle-orm";
import type { AdminProfile } from "@/domain/entities";
import type { AdminProfileRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import type { AdminProfileRow } from "@/infrastructure/database/schema/admin";
import { adminProfiles } from "@/infrastructure/database/schema/admin";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des profils administratifs (Drizzle / PostgreSQL).
 *
 * Aucun secret ne transite ici : le mot de passe reste chez Supabase Auth
 * (`docs/006` §2.2). Cette table ne porte que l'identité applicative, le rôle
 * et l'état d'activation.
 *
 * `findByUsername` est le point d'entrée des scripts d'administration
 * (`admin:create`) : la comparaison est **normalisée en minuscules**, en
 * cohérence avec l'index unique `lower(username)` du schéma.
 */
export class DrizzleAdminProfileRepository implements AdminProfileRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<AdminProfile | null> {
    const [row] = await this.db
      .select()
      .from(adminProfiles)
      .where(eq(adminProfiles.id, id))
      .limit(1);

    return row ? toEntity(row) : null;
  }

  /**
   * Recherche insensible à la casse et aux espaces de bordure.
   * Les deux côtés passent par `lower()` : « Admin », « ADMIN » et « admin »
   * désignent le même compte.
   */
  async findByUsername(username: string): Promise<AdminProfile | null> {
    const normalized = username.trim().toLowerCase();
    if (normalized.length === 0) return null;

    const [row] = await this.db
      .select()
      .from(adminProfiles)
      .where(sql`lower(${adminProfiles.username}) = ${normalized}`)
      .limit(1);

    return row ? toEntity(row) : null;
  }

  /**
   * Crée ou met à jour le profil rattaché à un utilisateur Supabase Auth.
   *
   * `username` est conservé tel que fourni (seuls les bords sont nettoyés) :
   * c'est l'unicité qui est insensible à la casse, pas la valeur stockée.
   * `isActive` n'est **pas** réécrit à `true` lors d'une mise à jour : relancer
   * le script ne doit pas réactiver silencieusement un accès révoqué.
   */
  async upsert(data: {
    id: string;
    username: string;
    displayName?: string | null;
    role?: "ROLE_ADMIN";
  }): Promise<AdminProfile> {
    const username = data.username.trim();
    const displayName = data.displayName ?? null;
    const role = data.role ?? "ROLE_ADMIN";

    const [row] = await this.db
      .insert(adminProfiles)
      .values({ id: data.id, username, displayName, role })
      .onConflictDoUpdate({
        target: adminProfiles.id,
        set: { username, displayName, role, updatedAt: new Date() },
      })
      .returning();

    if (!row) {
      throw new InternalError("Le profil administratif n'a pas pu être enregistré");
    }

    return toEntity(row);
  }

  async list(): Promise<AdminProfile[]> {
    const rows = await this.db
      .select()
      .from(adminProfiles)
      .orderBy(asc(adminProfiles.username));

    return rows.map(toEntity);
  }
}

function toEntity(row: AdminProfileRow): AdminProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
