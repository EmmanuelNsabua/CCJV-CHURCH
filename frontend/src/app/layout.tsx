import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { PublicSiteChrome } from "@/components/layout/PublicSiteChrome";
import { getScripture, getSettings } from "@/lib/api";
import type { SocialLink } from "@/lib/api";
/*
 * `readOrUnavailable` n'est pas réexporté par le barrel `@/lib/api` ; il est
 * importé depuis son module d'origine plutôt que de modifier un fichier hors
 * périmètre. C'est le même client, aucune couche parallèle.
 */
import { readOrUnavailable } from "@/lib/api/endpoints";
import { defaultTitle, siteUrl } from "@/lib/seo";
import { site } from "@/data/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s — ${site.name}`,
  },
  description:
    "Le Centre Chrétien Jésus ma Vie est une église vivante à Lubumbashi : cultes, communauté, enseignements et accueil de chacun.",
  openGraph: {
    siteName: `${site.name} (${site.acronym})`,
    locale: "fr_FR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

/**
 * Script exécuté pendant l'analyse du HTML, AVANT le premier rendu :
 * masque le rideau d'introduction dès la 2ᵉ visite de la session (aucun flash)
 * et pose le drapeau à la première visite. Défensif (try/catch).
 */
const introScript = `try{var e=document.documentElement;if(sessionStorage.getItem("ccjv-intro")==="1"){e.classList.add("intro-seen")}else{sessionStorage.setItem("ccjv-intro","1")}}catch(t){}`;

/**
 * Racine du site public.
 *
 * `PublicSiteChrome` (Header, menu plein écran, rideau d'introduction, Footer)
 * est un composant client : ses données institutionnelles — liens sociaux et
 * verset du rideau — sont donc lues **ici, côté serveur**, puis descendent en
 * props. Aucun appel réseau n'est fait dans le navigateur.
 *
 * Aucun repli de démonstration : une lecture impossible laisse la donnée
 * absente (`socialLinks` vide, verset `null`) et l'élément concerné n'est pas
 * rendu — il n'est jamais remplacé par un contenu inventé.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [reglages, verset] = await Promise.all([
    readOrUnavailable((o) => getSettings(o)),
    readOrUnavailable((o) => getScripture("rassemblement", o)),
  ]);

  const socialLinks: SocialLink[] =
    reglages.status === "ok" && reglages.data !== null
      ? reglages.data.socialLinks
      : [];

  return (
    <html lang="fr" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <PublicSiteChrome
          socialLinks={socialLinks}
          verse={verset.status === "ok" ? verset.data : null}
        >
          {children}
        </PublicSiteChrome>
      </body>
    </html>
  );
}
