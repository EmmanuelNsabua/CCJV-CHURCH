import { and, eq, inArray } from "drizzle-orm";
import type {
  MediaAccess,
  MediaAccessRights,
  MediaGranteeType,
} from "@/domain/entities";
import type { MediaAccessRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { mediaAccess } from "@/infrastructure/database/schema/media";
import type { MediaAccessRow } from "@/infrastructure/database/schema/media";
import { ConflictError, InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des droits d'accès aux médias (`docs/032` §3.4).
 *
 * ### Ce que la base refuse, et que ce repository ne rattrape pas
 *
 * Trois garanties sont portées par le schéma, et le code ne les réimplémente pas :
 *
 * - **aucun partage par défaut** — les colonnes valent `false`, et seules les
 *   lignes créées par `grant` existent ;
 * - **un département ne peut pas recevoir `DELETE`** (`media_access_department_no_delete`,
 *   XD-07) ;
 * - **une ligne n'existe pas sans droit** (`media_access_at_least_one_right`).
 *
 * Les dupliquer ici créerait deux autorités pour une même règle. Ce que ce
 * repository traduit, en revanche, c'est **l'erreur de la base en refus métier** :
 * une violation de contrainte est une décision, pas une panne.
 *
 * ### Pas de `ON CONFLICT DO NOTHING`
 *
 * Contrairement à l'attribution d'une capacité de département — idempotente parce
 * qu'un opérateur doit pouvoir rejouer son script — `grant` **échoue** si le
 * couple (média, destinataire) existe déjà. La différence n'est pas stylistique :
 * une capacité est un état (« ce département peut… »), un accès média est une
 * **décision attribuée** (`granted_by`, `granted_at`). Écraser silencieusement
 * une autorisation antérieure effacerait son auteur, c'est-à-dire précisément ce
 * que `docs/029` §2.6 conserve comme preuve.
 */
export class DrizzleMediaAccessRepository implements MediaAccessRepository {
  constructor(private readonly db: Database) {}

  async listForMedia(mediaId: string): Promise<MediaAccess[]> {
    const rows = await this.db
      .select()
      .from(mediaAccess)
      .where(eq(mediaAccess.mediaId, mediaId));

    return rows.map(toEntity);
  }

  async listForMediaIds(
    mediaIds: readonly string[],
  ): Promise<Map<string, MediaAccess[]>> {
    const result = new Map<string, MediaAccess[]>();
    // `inArray` avec une liste vide produirait `IN ()`, que PostgreSQL refuse.
    if (mediaIds.length === 0) return result;

    const rows = await this.db
      .select()
      .from(mediaAccess)
      .where(inArray(mediaAccess.mediaId, [...mediaIds]));

    for (const row of rows) {
      const access = toEntity(row);
      const current = result.get(access.mediaId);
      if (current) {
        current.push(access);
      } else {
        result.set(access.mediaId, [access]);
      }
    }

    return result;
  }

  async findFor(
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
  ): Promise<MediaAccess | null> {
    const [row] = await this.db
      .select()
      .from(mediaAccess)
      .where(
        and(
          eq(mediaAccess.mediaId, mediaId),
          eq(mediaAccess.granteeType, granteeType),
          eq(mediaAccess.granteeId, granteeId),
        ),
      )
      .limit(1);

    return row ? toEntity(row) : null;
  }

  async grant(data: {
    mediaId: string;
    granteeType: MediaGranteeType;
    granteeId: string;
    rights: MediaAccessRights;
    grantedBy: string;
  }): Promise<MediaAccess> {
    try {
      const [row] = await this.db
        .insert(mediaAccess)
        .values({
          mediaId: data.mediaId,
          granteeType: data.granteeType,
          granteeId: data.granteeId,
          canUse: data.rights.canUse,
          canManage: data.rights.canManage,
          canDelete: data.rights.canDelete,
          grantedBy: data.grantedBy,
        })
        .returning();

      if (!row) {
        throw new InternalError("Le droit d'accès n'a pas pu être enregistré");
      }

      return toEntity(row);
    } catch (error) {
      throw translate(error, data.granteeType);
    }
  }

  async updateRights(
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
    rights: MediaAccessRights,
  ): Promise<MediaAccess | null> {
    try {
      const [row] = await this.db
        .update(mediaAccess)
        .set({
          canUse: rights.canUse,
          canManage: rights.canManage,
          canDelete: rights.canDelete,
          // Écrit par le repository, jamais par l'appelant : la base porte
          // `CHECK (updated_at >= granted_at)`, qu'une horloge d'appelant
          // pourrait violer sans le vouloir.
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mediaAccess.mediaId, mediaId),
            eq(mediaAccess.granteeType, granteeType),
            eq(mediaAccess.granteeId, granteeId),
          ),
        )
        .returning();

      return row ? toEntity(row) : null;
    } catch (error) {
      throw translate(error, granteeType);
    }
  }

  async revoke(
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
  ): Promise<boolean> {
    const removed = await this.db
      .delete(mediaAccess)
      .where(
        and(
          eq(mediaAccess.mediaId, mediaId),
          eq(mediaAccess.granteeType, granteeType),
          eq(mediaAccess.granteeId, granteeId),
        ),
      )
      .returning({ id: mediaAccess.id });

    return removed.length > 0;
  }
}

/**
 * Traduit une erreur PostgreSQL en refus métier.
 *
 * Le service ne doit jamais laisser remonter une contrainte sous forme de `500` :
 * ce n'est pas une panne, c'est une règle qui s'applique. `docs/029` §4.5 en fait
 * une exigence générale — « un refus ne doit jamais être rendu par une erreur
 * `500` : c'est un défaut de policy, pas une panne » — et la même logique vaut
 * pour une contrainte de schéma.
 *
 * | Contrainte violée | Ce que cela signifie |
 * | --- | --- |
 * | `media_access_department_no_delete` | un département ne peut jamais porter `DELETE` (XD-07) |
 * | `media_access_at_least_one_right` | une ligne de droits vide n'est pas une autorisation |
 * | `media_access_department_unique` / `media_access_profile_unique` | ce destinataire a déjà une ligne : elle se **modifie**, elle ne se duplique pas |
 * | `foreign_key_violation` | le destinataire n'existe pas (trigger `media_access_check_grantee`) |
 */
function translate(error: unknown, granteeType: MediaGranteeType): Error {
  const message = error instanceof Error ? error.message : String(error);

  const README: [RegExp, string][] = [
    [
      /media_access_department_no_delete/,
      "Un accès accordé à un département ne peut jamais porter DELETE (docs/028 XD-07, D-21)",
    ],
    [
      /media_access_at_least_one_right/,
      "Un accès qui n'accorde aucun droit n'est pas une autorisation : il se retire par révocation",
    ],
    [
      /media_access_(department|profile)_unique/,
      granteeType === "DEPARTMENT"
        ? "Ce département dispose déjà d'un accès à ce média : modifiez-le au lieu de le dupliquer"
        : "Ce profil dispose déjà d'un accès à ce média : modifiez-le au lieu de le dupliquer",
    ],
    [
      /inexistant|foreign_key_violation/,
      granteeType === "DEPARTMENT"
        ? "Le département destinataire n'existe pas"
        : "Le profil destinataire n'existe pas",
    ],
    [/media_access_timestamps_order/, "Horodatage incohérent"],
  ];

  for (const [pattern, translated] of README) {
    if (pattern.test(message)) {
      return new ConflictError("CONFLICT", translated, { grille: "media_access" });
    }
  }

  // Tout le reste est réellement anormal : on le laisse remonter tel quel, pour
  // que le middleware d'erreur en fasse un `500` et que le journal le porte.
  return error instanceof Error ? error : new Error(message);
}

function toEntity(row: MediaAccessRow): MediaAccess {
  return {
    id: row.id,
    mediaId: row.mediaId,
    granteeType: row.granteeType,
    granteeId: row.granteeId,
    canUse: row.canUse,
    canManage: row.canManage,
    canDelete: row.canDelete,
    grantedBy: row.grantedBy,
    grantedAt: row.grantedAt,
    updatedAt: row.updatedAt,
  };
}
