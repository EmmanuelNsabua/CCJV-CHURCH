import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";
import type { SocialLink } from "@/lib/api";
import { SocialIcon } from "@/components/common/SocialIcons";

/**
 * Pictogramme d'un réseau social, résolu via le registre SocialIcon.
 */
function socialGlyph(label: string, platform?: string | null) {
  return <SocialIcon platform={platform || label} size={20} />;
}

export interface FooterProps {
  socialLinks: SocialLink[];
  address?: string;
}

export function Footer({ socialLinks, address }: FooterProps) {
  const year = new Date().getFullYear();
  const physicalAddress = address && address.trim().length > 0 ? address : site.address;

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
                <Link href="/organisation" className="transition-colors duration-150 hover:text-white">
                  Organisation
                </Link>
              </li>
              <li>
                <Link href="/organisation#adultes" className="text-white/60 transition-colors duration-150 hover:text-white pl-2">
                  · Adultes
                </Link>
              </li>
              <li>
                <Link href="/organisation#enfants-ecodim" className="text-white/60 transition-colors duration-150 hover:text-white pl-2">
                  · Ecodim (Enfants)
                </Link>
              </li>
              <li>
                <Link href="/organisation#chorale" className="text-white/60 transition-colors duration-150 hover:text-white pl-2">
                  · Chorale
                </Link>
              </li>
              <li>
                <Link href="/organisation#responsables" className="transition-colors duration-150 hover:text-white">
                  Les visages du service
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
                <Link href="/communaute#groupes-de-maison" className="transition-colors duration-150 hover:text-white">
                  Groupes de maison
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
              {physicalAddress}
            </p>

            {/* Réseaux sociaux — libellés et liens configurés dans le back-office */}
            {socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-white/80">
                {socialLinks.map((social) => {
                  const glyph = socialGlyph(social.label, social.platform);
                  return (
                    <a
                      key={`${social.label}-${social.href}`}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.label} ${site.acronym}`}
                      className="transition-colors duration-150 hover:text-white"
                    >
                      {glyph ?? (
                        <span className="font-sans text-xs">{social.label}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}

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
                <Link href="/communaute#priere" className="transition-colors duration-150 hover:text-white">
                  Prière & Intercession
                </Link>
              </li>
              <li>
                <Link href="/communaute#temoignages" className="transition-colors duration-150 hover:text-white">
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
                <Link href="/communaute#parcours-nouveau" className="transition-colors duration-150 hover:text-white">
                  Planifier une visite
                </Link>
              </li>
              <li>
                <Link href="/vie-de-leglise/ou-nous-trouver" className="transition-colors duration-150 hover:text-white">
                  Nous localiser
                </Link>
              </li>
              <li>
                <Link href="/communaute#priere" className="transition-colors duration-150 hover:text-white">
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


