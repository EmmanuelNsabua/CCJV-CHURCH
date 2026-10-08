import { asc, eq, sql } from "drizzle-orm";
import type { AdminProfile, AdminScope, PersistedAdminRole } from "@/domain/entities";
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
   *
   * `role`, `scope` et `departmentId` sont **explicites et obligatoires** (le
   * rôle et le scope) : le schéma ne leur porte aucune valeur par défaut
   * (`docs/032` §3.3). Une habilitation ne doit jamais être implicite — D-01
   * fait du rôle une décision, et D-02 lie le scope au rattachement.
   */
  async upsert(data: {
    id: string;
    username: string;
    displayName?: string | null;
    role: PersistedAdminRole;
    scope: AdminScope;
    departmentId?: string | null;
  }): Promise<AdminProfile> {
    const username = data.username.trim();
    const displayName = data.displayName ?? null;
    const departmentId = data.departmentId ?? null;

    const [row] = await this.db
      .insert(adminProfiles)
      .values({
        id: data.id,
        username,
        displayName,
        role: data.role,
        scope: data.scope,
        departmentId,
      })
      .onConflictDoUpdate({
        target: adminProfiles.id,
        set: {
          username,
          displayName,
          role: data.role,
          scope: data.scope,
          departmentId,
          updatedAt: new Date(),
        },
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

  /**
   * Réécrit l'habilitation d'un profil (rôle, scope, rattachement).
   *
   * `updatedAt` est rafraîchi explicitement : `$onUpdate` ne se déclenche que
   * sur les colonnes gérées par Drizzle, et une modification d'habilitation doit
   * laisser une trace temporelle — c'est le seul indice d'audit disponible tant
   * que `audit_log` n'est pas en place (Lot 17 de `docs/032`).
   *
   * Aucune vérification de cohérence ici : la contrainte
   * `admin_profiles_scope_coherence` la porte en base. La dupliquer créerait deux
   * autorités pour une même règle, et la seconde finirait par diverger.
   */
  async updateAuthorization(
    id: string,
    data: {
      role: PersistedAdminRole;
      scope: AdminScope;
      departmentId?: string | null;
    },
  ): Promise<AdminProfile | null> {
    const [row] = await this.db
      .update(adminProfiles)
      .set({
        role: data.role,
        scope: data.scope,
        departmentId: data.departmentId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(adminProfiles.id, id))
      .returning();

    return row ? toEntity(row) : null;
  }

  /**
   * Active ou désactive un profil, **sans** toucher à son habilitation.
   *
   * `isActive` est la seule colonne écrite : un compte révoqué puis réactivé
   * retrouve exactement le rôle et le périmètre qu'il avait. C'est ce que
   * `docs/028` D-03 attend d'une « désactivation » — couper l'accès, pas effacer
   * l'habilitation.
   */
  async setActive(id: string, isActive: boolean): Promise<AdminProfile | null> {
    const [row] = await this.db
      .update(adminProfiles)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(adminProfiles.id, id))
      .returning();

    return row ? toEntity(row) : null;
  }
}

function toEntity(row: AdminProfileRow): AdminProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    // Le scope et le rattachement ne sont pas décoratifs : `docs/029` §4.3 en
    // fait deux des quatre clauses de toute décision d'autorisation. Les omettre
    // ici priverait chaque policy de ses données — et un `DEPARTMENT_MANAGER`
    // deviendrait indistinguable d'un rôle global.
    scope: row.scope,
    departmentId: row.departmentId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
