import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { mainNav, legalNav } from "@/lib/nav";
import {
  getDepartments,
  getEvents,
  getPublications,
  readOrUnavailable,
} from "@/lib/api/endpoints";

/**
 * Sitemap — architecture de navigation pour les routes statiques, API pour les
 * routes dynamiques (publications, événements, départements).
 *
 * Règle : un sitemap **partiel** vaut toujours mieux qu'un sitemap vide. Si l'API
 * est injoignable au moment du build, les lectures échouent (`unreachable`) et
 * seules leurs entrées manquent : les routes statiques restent déclarées, et le
 * prochain build les complétera. Aucun slug n'est inventé pour combler un trou.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "/recherche", priority: 0.3 },
  ];

  // Pôles avec page propre et sous-pages réelles
  for (const item of mainNav) {
    if (item.href && item.href !== "/" && !item.href.includes("#")) {
      staticPaths.push({ path: item.href, priority: 0.8 });
    }
    for (const child of item.children ?? []) {
      if (child.href && !child.href.includes("#")) {
        staticPaths.push({ path: child.href, priority: 0.8 });
      }
    }
  }

  for (const page of legalNav) {
    staticPaths.push({ path: page.href, priority: 0.3 });
  }

  const [departments, events, publications] = await Promise.all([
    readOrUnavailable((options) => getDepartments(options)),
    readOrUnavailable((options) => getEvents({ limit: 100 }, options)),
    readOrUnavailable((options) => getPublications({ limit: 100 }, options)),
  ]);

  const dynamicPaths: Array<{ path: string; priority: number }> = [];

  if (departments.status === "ok") {
    dynamicPaths.push(
      ...departments.data.map((department) => ({
        path: `/${department.slug}`,
        priority: 0.7,
      })),
    );
  }

  if (events.status === "ok") {
    dynamicPaths.push(
      ...events.data.map((event) => ({
        path: `/vie-de-leglise/evenements/${event.slug}`,
        priority: 0.6,
      })),
    );
  }

  if (publications.status === "ok") {
    dynamicPaths.push(
      ...publications.data.map((publication) => ({
        path: `/publications/${publication.slug}`,
        priority: 0.6,
      })),
    );
  }

  return [...staticPaths, ...dynamicPaths].map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: entry.priority,
  }));
}
