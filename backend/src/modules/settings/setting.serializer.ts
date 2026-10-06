import type { SettingsOverview } from "./setting.service";

/**
 * Représentation API des réglages.
 *
 * `GET /settings` regroupe **deux sources** (`docs/018` §6.1) : les scalaires de
 * `site_settings`, exposés en objet clé/valeur (ils sont consommés ainsi par le
 * frontend, `site.name`, `site.whatsappHref`…), et la liste ordonnée des
 * `social_links`, exposée sous la forme attendue par `data/mock/site.ts`
 * (`label` / `href`).
 *
 * Fusionner ces deux sources dans une seule table aurait fait perdre l'ordre et
 * l'unicité des liens ; les garder séparées en base et les regrouper ici est ce
 * qui conserve les deux propriétés.
 */
export interface SettingsDto {
  settings: Record<string, string>;
  socialLinks: { label: string; href: string }[];
}

export function toSettingsDto(overview: SettingsOverview): SettingsDto {
  const settings: Record<string, string> = {};
  for (const setting of overview.settings) {
    settings[setting.key] = setting.value;
  }

  return {
    settings,
    socialLinks: overview.socialLinks.map((link) => ({
      label: link.label,
      href: link.href,
    })),
  };
}
