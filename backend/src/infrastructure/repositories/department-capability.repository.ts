import { and, eq } from "drizzle-orm";
import type { DepartmentCapability } from "@/domain/departments/capabilities";
import { isDepartmentCapability } from "@/domain/departments/capabilities";
import type { DepartmentCapabilityRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { departmentCapabilities } from "@/infrastructure/database/schema/departments";
import { logger } from "@/infrastructure/logger";

/**
 * Persistance des capacités de département (`docs/028` D-25, `docs/032` §3.5).
 *
 * Ce repository est volontairement **le plus étroit possible** : lire, accorder,
 * retirer. Il ne connaît ni `Department`, ni son contenu éditorial — une capacité
 * n'est pas un attribut de la fiche d'un département, c'est une décision de
 * portée publique (`docs/029` §5.3).
 *
 * **La lecture refuse au lieu de convertir.** `capability` est un
 * `varchar(60)` borné par un `CHECK` ; TypeScript, lui, lit une chaîne. Toute
 * ligne dont le code n'appartient pas à la liste fermée est **journalisée et
 * écartée**, jamais interprétée :
 *
 * - la traduire en « pas de capacité » priverait silencieusement un département
 *   d'une portée qu'il détient ;
 * - la supposer `EVENT_SCOPE_GLOBAL` ouvrirait la publication à l'échelle de
 *   l'église sur la base d'une chaîne inconnue.
 *
 * Écarter une ligne inconnue est un refus **visible** : l'avertissement nomme le
 * département et le code, ce qui suffit à diagnostiquer un `CHECK` élargi sans
 * que le code applicatif l'ait été.
 */
export class DrizzleDepartmentCapabilityRepository
  implements DepartmentCapabilityRepository
{
  constructor(private readonly db: Database) {}

  async listForDepartment(departmentId: string): Promise<DepartmentCapability[]> {
    const rows = await this.db
      .select({ capability: departmentCapabilities.capability })
      .from(departmentCapabilities)
      .where(eq(departmentCapabilities.departmentId, departmentId));

    return this.interpret(rows, departmentId);
  }

  /**
   * Accorde une capacité — **idempotent**.
   *
   * `ON CONFLICT DO NOTHING` sur la clé primaire composée : rejouer un script
   * d'exploitation ne doit pas échouer, et « accorder deux fois » n'est pas une
   * faute mais un état déjà atteint (`docs/033` impose cette propriété aux étapes
   * de migration). `target` nomme explicitement la clé primaire : sans elle,
   * PostgreSQL ne saurait pas quel conflit ignorer.
   */
  async grant(data: {
    departmentId: string;
    capability: DepartmentCapability;
    grantedBy?: string | null;
  }): Promise<void> {
    await this.db
      .insert(departmentCapabilities)
      .values({
        departmentId: data.departmentId,
        capability: data.capability,
        grantedBy: data.grantedBy ?? null,
      })
      .onConflictDoNothing({
        target: [
          departmentCapabilities.departmentId,
          departmentCapabilities.capability,
        ],
      });
  }

  async revoke(
    departmentId: string,
    capability: DepartmentCapability,
  ): Promise<boolean> {
    const removed = await this.db
      .delete(departmentCapabilities)
      .where(
        and(
          eq(departmentCapabilities.departmentId, departmentId),
          eq(departmentCapabilities.capability, capability),
        ),
      )
      .returning({ departmentId: departmentCapabilities.departmentId });

    return removed.length > 0;
  }

  /** Ne conserve que les codes de la liste fermée, en signalant les autres. */
  private interpret(
    rows: readonly { capability: string }[],
    departmentId: string,
  ): DepartmentCapability[] {
    const capabilities: DepartmentCapability[] = [];

    for (const row of rows) {
      if (isDepartmentCapability(row.capability)) {
        capabilities.push(row.capability);
      } else {
        this.warnUnknown(departmentId, row.capability);
      }
    }

    return capabilities;
  }

  private warnUnknown(departmentId: string, capability: string): void {
    logger.warn(
      { departmentId, capability },
      "Capacité de département inconnue : ligne écartée (vocabulaire fermé, docs/032 §3.5)",
    );
  }
}
