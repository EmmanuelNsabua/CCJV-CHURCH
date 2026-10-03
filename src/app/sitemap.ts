import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { mainNav, legalNav } from "@/lib/nav";
import { events } from "@/data/mock/events";
import { departments } from "@/data/mock/departments";
import { publications } from "@/data/mock/publications";

/**
 * Sitemap — construit depuis l'architecture de navigation et les données,
 * afin de rester automatiquement synchronisé avec les routes réellement servies.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "/recherche", priority: 0.3 },
  ];

  // Les pôles n'ont pas de page propre : seules leurs sous-pages sont indexées.
  for (const item of mainNav) {
    for (const child of item.children ?? []) {
      staticPaths.push({ path: child.href, priority: 0.8 });
    }
  }

  for (const page of legalNav) {
    staticPaths.push({ path: page.href, priority: 0.3 });
  }

  const dynamicPaths = [
    ...events.map((event) => ({
      path: `/vie-de-leglise/evenements/${event.slug}`,
      priority: 0.6,
    })),
    ...departments.map((department) => ({
      path: `/organisation/departements/${department.slug}`,
      priority: 0.6,
    })),
    ...publications.map((publication) => ({
      path: `/publications/${publication.slug}`,
      priority: 0.6,
    })),
  ];

  return [...staticPaths, ...dynamicPaths].map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: entry.priority,
  }));
}
