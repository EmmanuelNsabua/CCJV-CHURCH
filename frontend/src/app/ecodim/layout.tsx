import type { ReactNode } from "react";

/**
 * Layout de l'espace Ecodim.
 *
 * Règle architecturale stricte : la page Ecodim hérite directement du layout
 * public général (`RootLayout` via `PublicSiteChrome`).
 *
 * Aucun header ou footer spécifique ne doit être inséré ici : l'en-tête et
 * le pied de page officiels du CCJV s'appliquent de manière unifiée à l'ensemble
 * des routes publiques du domaine.
 */
export default function EcodimLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
