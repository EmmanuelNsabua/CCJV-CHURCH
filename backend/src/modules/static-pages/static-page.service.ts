import type { ZodType } from "zod";
import type { StaticPage } from "@/domain/entities";
import type { StaticPageRepository } from "@/domain/repositories";
import { getPageContentSchema } from "@/domain/content/page-content";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";

/**
 * Règles métier des pages éditables.
 *
 * Le contenu n'est jamais écrit en aveugle : il est validé par le schéma de la
 * page (`docs/018` §5). Deux refus distincts :
 * - `pageKey` inconnue → `PAGE_NOT_FOUND` (404) : le frontend ne saurait pas
 *   lire cette page ;
 * - contenu non conforme → `VALIDATION_ERROR` (400) avec le détail des champs.
 */
export class StaticPageService {
  constructor(private readonly pages: StaticPageRepository) {}

  /**
   * Schéma de la page, ou 404 si la clé n'est pas éditable.
   * `isKnownPageKey` (exporté par le registre) permet au back-office d'énumérer
   * les pages éditables sans dupliquer la liste.
   */
  private schemaFor(pageKey: string): ZodType {
    const schema = getPageContentSchema(pageKey);
    if (!schema) {
      throw new NotFoundError(
        "PAGE_NOT_FOUND",
        `Aucune page éditable ne correspond à la clé « ${pageKey} »`,
        { pageKey },
      );
    }
    return schema;
  }

  async getByKey(pageKey: string): Promise<StaticPage> {
    this.schemaFor(pageKey);

    const page = await this.pages.findByKey(pageKey);
    if (!page) {
      throw new NotFoundError(
        "PAGE_NOT_FOUND",
        `La page « ${pageKey} » n'a pas encore de contenu enregistré`,
        { pageKey },
      );
    }
    return page;
  }

  async updateContent(
    pageKey: string,
    content: Record<string, unknown>,
    updatedBy: string | null,
  ): Promise<StaticPage> {
    const schema = this.schemaFor(pageKey);

    const parsed = schema.safeParse(content);
    if (!parsed.success) {
      throw new ValidationError(
        `Contenu invalide pour la page « ${pageKey} »`,
        parsed.error.issues.map((issue) => ({
          champ: issue.path.map(String).join(".") || "(racine)",
          message: issue.message,
        })),
      );
    }

    return this.pages.upsert(pageKey, toContentRecord(parsed.data), updatedBy);
  }
}

/**
 * `safeParse` renvoie `unknown` (le schéma est typé par le registre) : on ne
 * stocke que si la valeur analysée est bien un objet — les schémas du registre
 * sont des `z.object`, un tableau ne peut donc pas passer.
 */
function toContentRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new ValidationError("Le contenu d'une page doit être un objet");
}
