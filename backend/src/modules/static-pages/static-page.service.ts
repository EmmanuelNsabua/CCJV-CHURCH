import type { ZodType } from "zod";
import type { StaticPage } from "@/domain/entities";
import type { StaticPageRepository } from "@/domain/repositories";
import { getPageContentSchema, readPageContent } from "@/domain/content/page-content";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { formatIssues } from "@/shared/http/issues";

/**
 * Règles métier des pages éditables.
 *
 * Le contenu n'est jamais écrit en aveugle : il est validé par le contrat de la
 * page (`docs/031` §3.2). Deux refus distincts à l'écriture :
 * - `pageKey` inconnue → `PAGE_NOT_FOUND` (404) : le frontend ne saurait pas
 *   lire cette page ;
 * - contenu non conforme → `VALIDATION_ERROR` (400) avec le détail des champs.
 *
 * **La lecture, elle, ne refuse rien.** Elle applique la tolérance de
 * `docs/031` §3.5 règle C : le contenu est normalisé puis filtré champ par
 * champ, et ce qui n'est pas lisible est **omis** — le frontend reprend alors sa
 * constante de code. Une ligne écrite sous un ancien contrat ne peut donc pas
 * empêcher une page de se rendre, ni provoquer un `500`.
 *
 * Cette asymétrie est le cœur du lot : **strict à l'entrée, tolérant à la
 * sortie**. Un backend strict des deux côtés casserait le site à la première
 * évolution de contrat ; tolérant des deux côtés, il laisserait écrire
 * n'importe quoi.
 */
export class StaticPageService {
  constructor(private readonly pages: StaticPageRepository) {}

  /**
   * Contrat de la page, ou 404 si la clé n'est pas éditable.
   * `knownPageKeys` (exporté par le registre) permet au back-office d'énumérer
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

  /**
   * Lecture publique, **tolérante**.
   *
   * Le contenu servi est celui que le contrat accepte de reconnaître : les
   * champs illisibles sont absents plutôt que remplacés, et la page garde ses
   * textes de code pour eux (`docs/031` §4.3 : « Le texte manquant n'est jamais
   * remplacé par un texte inventé »).
   */
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

    return { ...page, content: readPageContent(pageKey, page.content) };
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
        // Le format des détails est celui du middleware de validation, réutilisé
        // tel quel : `docs/031` §3.4 exige que `details` **nomme** la clé fautive
        // (« `sections` », ou la faute de frappe « `heroTittle` »), y compris
        // quand le refus vient d'une clé non reconnue — cas où Zod ne remplit pas
        // `path` et où un format écrit à la main produirait `(racine)`.
        formatIssues(parsed.error),
      );
    }

    const stored = await this.pages.upsert(pageKey, toContentRecord(parsed.data), updatedBy);

    // Ce qui est renvoyé est **relu** par le chemin de lecture, comme le fera la
    // prochaine requête : la réponse d'écriture et la lecture publique disent
    // ainsi exactement la même chose, et ne peuvent pas diverger.
    return { ...stored, content: readPageContent(pageKey, stored.content) };
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
