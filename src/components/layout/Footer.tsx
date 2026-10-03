import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/mock/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ccjv-black text-white selection:bg-white selection:text-black">
      <div className="container max-w-[1380px] py-16 lg:py-24">
        {/* ============================================================
            Grille principale optimisée 12 colonnes (2 / 2 / 4 / 2 / 2)
            Élimine les vides et met en valeur le logo central
            ============================================================ */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">
          {/* Colonne 1 : L'ÉGLISE EN MOUVEMENT (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-sans text-xs font-bold tracking-[0.16em] text-white uppercase">
              L&apos;Église
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5 font-sans text-[0.88rem] text-white/75">
              <li>
                <Link href="/" className="transition-colors duration-150 hover:text-white">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/qui-sommes-nous" className="transition-colors duration-150 hover:text-white">
                  Qui sommes-nous
                </Link>
              </li>
              <li>
                <Link href="/organisation/responsables" className="transition-colors duration-150 hover:text-white">
                  Les visages de l&apos;église
                </Link>
              </li>
              <li>
                <Link href="/organisation/poles" className="transition-colors duration-150 hover:text-white">
                  Organisations
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 : VIVRE ENSEMBLE (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-sans text-xs font-bold tracking-[0.16em] text-white uppercase">
              Vivre ensemble
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5 font-sans text-[0.88rem] text-white/75">
              <li>
                <Link href="/vie-de-leglise/evenements" className="transition-colors duration-150 hover:text-white">
                  Nos événements
                </Link>
              </li>
              <li>
                <Link href="/communaute/groupes-de-maison" className="transition-colors duration-150 hover:text-white">
                  Groupe de maison
                </Link>
              </li>
              <li>
                <Link href="/vie-de-leglise/faire-un-don" className="transition-colors duration-150 hover:text-white">
                  Faire un don
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 (Centre) : Logo plus grand, Adresse, Réseaux & Actions (4 cols) */}
          <div className="flex flex-col items-center text-center sm:col-span-2 lg:col-span-4 order-first lg:order-none mb-6 lg:mb-0 px-2 lg:px-4 lg:-ml-8">
            <Link
              href="/"
              className="inline-block"
              aria-label={`${site.name} — Accueil`}
            >
              <div className="relative h-36 w-36 sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-52 lg:w-52">
                <Image
                  src="/logo_2.png"
                  alt={site.name}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 768px) 180px, 220px"
                />
              </div>
            </Link>

            {/* Adresse */}
            <p className="mt-4 max-w-[32ch] font-sans text-xs leading-relaxed text-white/70">
              {site.address}
            </p>

            {/* Réseaux sociaux */}
            <div className="mt-4 flex items-center justify-center gap-5 text-white/80">
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@ecodim_ccjv"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok CCJV"
                className="transition-colors duration-150 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68a6.34 6.34 0 0 0 10.86 4.47 6.27 6.27 0 0 0 1.9-4.47V8.71a8.28 8.28 0 0 0 4.83 1.54v-3.56h-1Z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube CCJV"
                className="transition-colors duration-150 hover:text-white"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/ecodim_ccjv/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram CCJV"
                className="transition-colors duration-150 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>

            {/* Boutons d'action côte à côte (Newsletter & Nous Écrire) */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/publications/actualites"
                className="inline-flex items-center justify-center bg-white px-5 py-2.5 font-sans text-xs font-bold tracking-[0.14em] text-black uppercase transition-all duration-200 hover:bg-ccjv-cream"
              >
                NEWSLETTER
              </Link>
              <Link
                href="/vie-de-leglise/ou-nous-trouver"
                className="inline-flex items-center justify-center border border-white bg-black px-5 py-2.5 font-sans text-xs font-bold tracking-[0.14em] text-white uppercase transition-all duration-200 hover:bg-white/10"
              >
                NOUS ÉCRIRE
              </Link>
            </div>
          </div>

          {/* Colonne 4 : NOURRIR SA FOI (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-sans text-xs font-bold tracking-[0.16em] text-white uppercase">
              Nourrir sa foi
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5 font-sans text-[0.88rem] text-white/75">
              <li>
                <Link href="/publications/enseignements" className="transition-colors duration-150 hover:text-white">
                  Enseignements
                </Link>
              </li>
              <li>
                <Link href="/publications/ressources" className="transition-colors duration-150 hover:text-white">
                  Médiathèque
                </Link>
              </li>
              <li>
                <Link href="/publications/actualites" className="transition-colors duration-150 hover:text-white">
                  Actualités & blog
                </Link>
              </li>
              <li>
                <Link href="/publications/ressources" className="transition-colors duration-150 hover:text-white">
                  Guides d&apos;étude & Ressources
                </Link>
              </li>
              <li>
                <Link href="/communaute/priere-et-intercession" className="transition-colors duration-150 hover:text-white">
                  Prière & Intercession
                </Link>
              </li>
              <li>
                <Link href="/communaute/temoignages" className="transition-colors duration-150 hover:text-white">
                  Témoignages
                </Link>
              </li>
              <li>
                <Link href="/vie-de-leglise/faq" className="transition-colors duration-150 hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 5 : RESTER EN LIEN (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-sans text-xs font-bold tracking-[0.16em] text-white uppercase">
              Rester en lien
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5 font-sans text-[0.88rem] text-white/75">
              <li>
                <Link href="/communaute/parcours-nouveau" className="transition-colors duration-150 hover:text-white">
                  Planifier une visite
                </Link>
              </li>
              <li>
                <Link href="/vie-de-leglise/ou-nous-trouver" className="transition-colors duration-150 hover:text-white">
                  Nous localiser
                </Link>
              </li>
              <li>
                <Link href="/communaute/priere-et-intercession" className="transition-colors duration-150 hover:text-white">
                  Demander une prière
                </Link>
              </li>
              <li>
                <Link href="/vie-de-leglise/ou-nous-trouver" className="transition-colors duration-150 hover:text-white">
                  Signaler un problème
                </Link>
              </li>
              <li>
                <Link href="/qui-sommes-nous" className="transition-colors duration-150 hover:text-white">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/publications/ressources" className="transition-colors duration-150 hover:text-white">
                  Recherche
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ============================================================
          Barre inférieure (3 zones : Mentions / Copyright / Conditions)
          ============================================================ */}
      <div className="border-t border-white/20">
        <div className="container max-w-[1380px] flex flex-col gap-4 py-6 font-sans text-[0.78rem] text-white/65 md:flex-row md:items-center md:justify-between">
          {/* Liens légaux gauche */}
          <div className="flex items-center gap-6">
            <Link href="/mentions-legales" className="transition-colors duration-150 hover:text-white">
              Mentions légales
            </Link>
            <Link href="/politique-de-confidentialite" className="transition-colors duration-150 hover:text-white">
              Confidentialité
            </Link>
          </div>

          {/* Copyright centre */}
          <p className="text-center text-white/50">
            © {year} CCJV Tous Droits Réservés.
          </p>

          {/* Liens légaux droite */}
          <div className="flex items-center gap-6 md:justify-end">
            <Link href="/conditions-generales" className="transition-colors duration-150 hover:text-white">
              Conditions
            </Link>
            <Link href="/accessibilite" className="transition-colors duration-150 hover:text-white">
              Accessibilité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


