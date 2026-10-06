import type { SiteSetting, SocialLink } from "@/domain/entities";
import type { SettingRepository, SocialLinkRepository } from "@/domain/repositories";
import { ValidationError } from "@/shared/errors/app-error";
import { ALLOWED_SETTING_KEYS, isAllowedSettingKey } from "./setting.schema";

/**
 * Résultat regroupé de `/settings` : deux sources, deux formes.
 * Le service ne connaît pas la forme de la réponse HTTP — c'est le serializer
 * qui décide comment ces entités sont exposées.
 */
export interface SettingsOverview {
  settings: SiteSetting[];
  socialLinks: SocialLink[];
}

/**
 * Règles métier des réglages institutionnels.
 *
 * Ce service dépend de **deux** repositories : les scalaires (`site_settings`) et
 * les liens sociaux (`social_links`), parce qu'une seule réponse publique les
 * regroupe. Les lire en parallèle évite deux allers-retours séquentiels.
 */
export class SettingService {
  constructor(
    private readonly settings: SettingRepository,
    private readonly socialLinks: SocialLinkRepository,
  ) {}

  async getOverview(): Promise<SettingsOverview> {
    const [settings, socialLinks] = await Promise.all([
      this.settings.listAll(),
      this.socialLinks.list(),
    ]);

    return { settings, socialLinks };
  }

  /**
   * Mise à jour en masse des scalaires.
   *
   * La liste blanche est **fermée** : une clé inconnue fait échouer toute
   * l'opération plutôt que d'être ignorée silencieusement — écrire une clé que
   * personne ne lit serait un faux succès.
   */
  async update(values: Record<string, string>): Promise<SettingsOverview> {
    const keys = Object.keys(values);

    if (keys.length === 0) {
      throw new ValidationError("Aucun réglage à mettre à jour", {
        allowedKeys: ALLOWED_SETTING_KEYS,
      });
    }

    const unknownKeys = keys.filter((key) => !isAllowedSettingKey(key));
    if (unknownKeys.length > 0) {
      throw new ValidationError(
        `Clé de réglage non autorisée : ${unknownKeys.join(", ")}`,
        { unknownKeys, allowedKeys: ALLOWED_SETTING_KEYS },
      );
    }

    await this.settings.upsertMany(values);

    // On renvoie l'état complet relu : la réponse contient aussi les clés qui
    // n'étaient pas dans la requête.
    return this.getOverview();
  }
}
