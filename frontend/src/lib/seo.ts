import type { Metadata } from "next";
import { site } from "@/data/mock/site";

/**
 * URL publique du site. À définir en production via `NEXT_PUBLIC_SITE_URL`.
 * (La valeur ci-dessous est un placeholder, pas le domaine réel.)
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ccjv.example.com";

export const defaultTitle = `${site.name} — ${site.location}`;

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${siteUrl}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: `${site.name} (${site.acronym})`,
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: opts.title,
      description: opts.description,
    },
  };
}
