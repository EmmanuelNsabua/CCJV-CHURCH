/**
 * Architecture de navigation — source unique pour : le header, le mega menu
 * plein écran, les breadcrumbs, le footer, la recherche et le sitemap.
 *
 * PRINCIPE (palier 1) : **un pôle n'est pas une destination**.
 * « Qui sommes-nous », « Vie de l'Église », « Communauté », « Organisation » et
 * « Publications & Médias » regroupent des pages, mais n'en sont pas une : ils
 * n'ont donc pas de `href`. Seul l'accueil possède une page propre.
 *
 * Conséquence à respecter partout : un `NavItem` sans `href` est un libellé de
 * regroupement — jamais un lien, jamais une entrée de sitemap, jamais une
 * miette cliquable.
 *
 * `ready` marque les destinations réellement implémentées.
 */

export interface NavChild {
  href: string;
  label: string;
  /** Accroche courte affichée dans le mega menu. */
  description?: string;
  ready?: boolean;
}

export interface NavItem {
  /**
   * `undefined` = pôle de regroupement. Le libellé situe le visiteur mais ne
   * mène nulle part : il ne doit jamais être rendu comme un lien.
   */
  href?: string;
  label: string;
  description?: string;
  ready?: boolean;
  children?: NavChild[];
}

export const mainNav: NavItem[] = [
  { href: "/", label: "Accueil", ready: true },
  {
    href: "/qui-sommes-nous",
    label: "Qui sommes-nous",
    description: "Notre histoire, notre foi et notre vision.",
    ready: true,
  },
  {
    label: "Vie de l'Église",
    description: "Quand et où nous rassembler.",
    ready: true,
    children: [
      {
        href: "/vie-de-leglise/evenements",
        label: "Nos événements",
        description: "Cultes, rencontres et temps forts.",
        ready: true,
      },
      {
        href: "/vie-de-leglise/ou-nous-trouver",
        label: "Où nous trouver",
        description: "Adresse, horaires, accès et contact.",
        ready: true,
      },
      {
        href: "/vie-de-leglise/faire-un-don",
        label: "Faire un don",
        description: "Soutenir l'œuvre de l'église.",
        ready: true,
      },
    ],
  },
  {
    label: "Communauté",
    description: "Des personnes, pas des rubriques.",
    ready: true,
    children: [
      {
        href: "/communaute/groupes-de-maison",
        label: "Groupes de maison",
        description: "La fraternité de proximité.",
        ready: true,
      },
      {
        href: "/communaute/parcours-nouveaux",
        label: "Parcours nouveaux",
        description: "Vos premiers pas parmi nous.",
        ready: true,
      },
      {
        href: "/communaute/priere",
        label: "Prière",
        description: "Déposer une demande de prière.",
        ready: true,
      },
      {
        href: "/communaute/temoignages",
        label: "Témoignages",
        description: "Ce que Dieu a fait parmi nous.",
        ready: true,
      },
    ],
  },
  {
    label: "Organisation",
    description: "Responsables et départements.",
    ready: true,
    children: [
      {
        href: "/organisation/responsables",
        label: "Responsables",
        description: "Ceux qui servent l'église.",
        ready: true,
      },
      {
        href: "/organisation/departements",
        label: "Départements",
        description: "Adultes, Ecodim, chorale et plus.",
        ready: true,
      },
    ],
  },
  {
    label: "Publications & Médias",
    description: "Actualités, enseignements, médiathèque.",
    ready: true,
    children: [
      {
        href: "/publications/actualites",
        label: "Actualités",
        description: "Nouvelles et annonces.",
        ready: true,
      },
      {
        href: "/publications/enseignements",
        label: "Enseignements",
        description: "Sermons et prédications.",
        ready: true,
      },
      {
        href: "/publications/mediatheque",
        label: "Médiathèque",
        description: "Photos et vidéos.",
        ready: true,
      },
      {
        href: "/publications/ressources",
        label: "Ressources",
        description: "Guides et documents.",
        ready: true,
      },
    ],
  },
];

/** Entrées réellement disponibles (header, mega menu, footer, recherche). */
export const primaryNav: NavItem[] = mainNav
  .filter((item) => item.ready)
  .map((item) => ({
    ...item,
    children: item.children?.filter((child) => child.ready),
  }));

/**
 * Toutes les destinations réellement servies, à plat.
 * Les pôles sans page en sont naturellement exclus.
 */
export const allDestinations: NavChild[] = mainNav.flatMap((item) => [
  ...(item.href ? [{ href: item.href, label: item.label }] : []),
  ...(item.children ?? []),
]);

/** Pages transversales (footer, breadcrumbs, sitemap). */
export const legalNav: NavChild[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions" },
  { href: "/accessibilite", label: "Accessibilité" },
  { href: "/recherche", label: "Recherche" },
];

/**
 * Miette de fil d'Ariane. `href` absent = étape de regroupement : elle situe le
 * visiteur sans être cliquable, puisqu'un pôle n'a pas de page.
 */
export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Construit le fil d'Ariane d'une route à partir de `mainNav`.
 * Retourne [] si la route n'appartient à aucune section.
 */
export function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === "/") return [];

  for (const item of mainNav) {
    if (item.href === "/") continue;

    for (const child of item.children ?? []) {
      // Couvre la sous-page et ses détails (ex. /evenements/[slug]).
      if (pathname === child.href || pathname.startsWith(`${child.href}/`)) {
        return [
          { label: item.label },
          { href: child.href, label: child.label },
        ];
      }
    }

    // Page de détail rattachée directement au pôle (ex. /publications/[slug]) :
    // aucun enfant ne correspond, mais le premier segment de route est le même.
    const pillarSegment = item.children?.[0]?.href.split("/")[1];
    if (pillarSegment && pathname.startsWith(`/${pillarSegment}/`)) {
      return [{ label: item.label }];
    }
  }

  // Pages transversales (mentions, confidentialité, recherche…).
  const transversal = legalNav.find((page) => page.href === pathname);
  if (transversal) {
    return [{ href: transversal.href, label: transversal.label }];
  }

  return [];
}
