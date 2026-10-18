import type { SocialLink } from "@/domain/entities";

/**
 * Représentation API d'un lien social.
 *
 * `label` et `href` sont exactement les champs consommés par le frontend
 * (`data/mock/site.ts`, `socials`). `position` est exposé pour que le
 * back-office puisse réordonner la liste sans requête supplémentaire.
 */
export interface SocialLinkDto {
  id: string;
  platform: string | null;
  label: string;
  href: string;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** Forme réduite utilisée dans la réponse regroupée de `GET /settings`. */
export interface SocialLinkSummaryDto {
  platform: string | null;
  label: string;
  href: string;
}

export function toSocialLinkDto(link: SocialLink): SocialLinkDto {
  return {
    id: link.id,
    platform: link.platform ?? null,
    label: link.label,
    href: link.href,
    isActive: link.isActive ?? true,
    position: link.position,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export function toSocialLinkSummaryDto(link: SocialLink): SocialLinkSummaryDto {
  return { platform: link.platform ?? null, label: link.label, href: link.href };
}
