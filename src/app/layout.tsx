import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { IntroCurtain } from "@/components/layout/IntroCurtain";
import { defaultTitle, siteUrl } from "@/lib/seo";
import { site } from "@/data/mock/site";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${lora.variable}`}>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <IntroCurtain />
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
