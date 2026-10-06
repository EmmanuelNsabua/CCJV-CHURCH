import Link from "next/link";
import NextImage from "next/image";
import { departments } from "@/data/mock/departments";
import { leaders, leadPastor } from "@/data/mock/leaders";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { CrossMark } from "@/components/shared/CrossMark";
import { OrganisationExplorer } from "./OrganisationExplorer";

export const metadata = pageMetadata({
  title: "Organisation",
  description:
    "Découvrez comment le Centre Chrétien Jésus ma Vie s'organise : une communauté vivante à Lubumbashi portée par des personnes au service de Dieu et des autres.",
  path: "/organisation",
});

export default function OrganisationPage() {
  const teamLeaders = leaders.filter((l) => l.id !== leadPastor.id);

  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink">
      {/* =========================================================================
          1. HERO ÉDITORIAL IMMERSIF
          ========================================================================= */}
      <section
        data-hero-dark
        className="relative flex min-h-[90vh] w-full flex-col justify-between overflow-hidden bg-ccjv-black px-6 pt-32 pb-16 text-white sm:px-12 lg:px-20 lg:pt-40 lg:pb-24"
      >
        {/* Photographie d'ambiance avec superposition éditoriale */}
        <div className="absolute inset-0 z-0">
          <NextImage
            src={images.assemblee}
            alt="Assemblée du Centre Chrétien Jésus ma Vie à Lubumbashi"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ccjv-black via-ccjv-black/70 to-ccjv-black/50" />
        </div>

        {/* En-tête de section */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-ccjv-green-light" aria-hidden="true" />
            <p className="font-sans text-xs font-semibold tracking-[0.24em] text-ccjv-green-light uppercase">
              Organisation & Ministères
            </p>
          </div>

          <h1 className="mt-8 max-w-[18ch] font-serif text-[clamp(2.4rem,1.8rem+3.4vw,4.5rem)] leading-[1.08] text-white">
            Une communauté portée par ceux qui servent
          </h1>

          <p className="mt-8 max-w-[58ch] font-sans text-[clamp(1.05rem,0.95rem+0.4vw,1.25rem)] leading-[1.7] text-white/80">
            À CCJV, l&apos;organisation n&apos;est pas une structure administrative froide.
            Elle est l&apos;expression vivante d&apos;hommes et de femmes qui donnent de leur
            temps, de leurs dons et de leur cœur pour prendre soin de chacun.
          </p>
        </div>

        {/* Barre de repères / Navigation d'ancrage rapide */}
        <div className="relative z-10 mx-auto mt-16 w-full max-w-7xl border-t border-white/15 pt-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            <a
              href="#vision"
              className="group flex flex-col justify-between border-l border-white/15 pl-4 transition-colors hover:border-ccjv-green-light"
            >
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-white/50 uppercase group-hover:text-ccjv-green-light">
                01 · Fondement
              </span>
              <span className="mt-2 font-serif text-lg text-white">
                La vision pastorale
              </span>
            </a>

            <a
              href="#departements"
              className="group flex flex-col justify-between border-l border-white/15 pl-4 transition-colors hover:border-ccjv-green-light"
            >
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-white/50 uppercase group-hover:text-ccjv-green-light">
                02 · Piliers
              </span>
              <span className="mt-2 font-serif text-lg text-white">
                Les départements actifs
              </span>
            </a>

            <a
              href="#responsables"
              className="group flex flex-col justify-between border-l border-white/15 pl-4 transition-colors hover:border-ccjv-green-light"
            >
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-white/50 uppercase group-hover:text-ccjv-green-light">
                03 · Coordination
              </span>
              <span className="mt-2 font-serif text-lg text-white">
                Les visages du service
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FONDEMENT : LA VISION PASTORALE & LE SERVICE
          ========================================================================= */}
      <section id="vision" className="border-b border-ccjv-line px-6 py-20 sm:px-12 lg:px-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                Direction spirituelle
              </span>
              <h2 className="mt-4 font-serif text-[clamp(1.85rem,1.2rem+2vw,3rem)] leading-[1.12]">
                Servir, avant de conduire
              </h2>
              <div className="mt-8 space-y-6 font-sans text-[1.02rem] leading-[1.75] text-ccjv-ink-secondary">
                <p>
                  Le Centre Chrétien Jésus ma Vie a débuté avec une conviction simple :
                  l&apos;Église n&apos;appartient pas à un homme, mais à Christ. Ceux qui
                  en assument la conduite sont avant tout des serviteurs appelés à nourrir,
                  écouter et fortifier la communauté.
                </p>
                <p>
                  Depuis la fondation de l&apos;église le 17 mars 2023, le Pasteur
                  Manasse Mwamba et l&apos;équipe veillent à ce que chaque assemblée,
                  chaque enseignement et chaque initiative soient ancrés dans la fidélité
                  aux Écritures et l&apos;amour fraternel.
                </p>
              </div>

              <div className="mt-10 border-t border-ccjv-line pt-6">
                <p className="font-serif text-base text-ccjv-ink italic">
                  « Le plus grand parmi vous sera votre serviteur. »
                </p>
                <p className="mt-1 font-sans text-xs tracking-wider text-ccjv-green uppercase">
                  Matthieu 23:11
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              {/* Carte éditoriale du Pasteur Visionnaire */}
              <div className="relative border border-ccjv-line bg-ccjv-cream p-8 sm:p-12">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-12 sm:items-center">
                  <div className="relative aspect-4/5 w-full overflow-hidden bg-ccjv-line sm:col-span-5">
                    <NextImage
                      src={leadPastor.photo ?? images.portraitLarge}
                      alt={leadPastor.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 sm:pl-4">
                    <span className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                      {leadPastor.scope}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl sm:text-3xl text-ccjv-ink">
                      {leadPastor.name}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-ccjv-green font-medium">
                      {leadPastor.role}
                    </p>
                    <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                      {leadPastor.bio}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. RESPIRATION BIBLIQUE (LE SENS DU CORPS ET DES DONS)
          ========================================================================= */}
      <section className="border-b border-ccjv-line bg-ccjv-green px-6 py-20 text-white sm:px-12 lg:px-20 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-8 w-8 items-center justify-center">
            <CrossMark className="h-6 w-6 text-ccjv-green-light" />
          </div>
          <blockquote className="font-serif text-[clamp(1.4rem,1.1rem+1.4vw,2.2rem)] leading-[1.3] italic text-white/95">
            « Il y a diversité de dons, mais le même Esprit ; diversité de
            ministères, mais le même Seigneur ; diversité d&apos;opérations, mais le
            même Dieu qui opère tout en tous. »
          </blockquote>
          <p className="mt-6 font-sans text-xs font-semibold tracking-[0.22em] text-ccjv-green-light uppercase">
            1 Corinthiens 12:4–6
          </p>
        </div>
      </section>

      {/* =========================================================================
          4. LES DÉPARTEMENTS DYNAMIQUES (LES PILIERS VIVANTS)
          ========================================================================= */}
      <section id="departements" className="border-b border-ccjv-line px-6 py-20 sm:px-12 lg:px-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 border-b border-ccjv-line pb-8 sm:flex-row sm:items-end">
            <div>
              <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                Pôles & Ministères
              </span>
              <h2 className="mt-3 font-serif text-[clamp(1.85rem,1.2rem+2vw,3rem)] leading-[1.12]">
                Les départements de l&apos;église
              </h2>
            </div>
            <p className="max-w-[42ch] font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
              Chaque département répond à un besoin spécifique : enseignement,
              enfance, louange et accompagnement communautaire.
            </p>
          </div>

          <OrganisationExplorer departments={departments} />
        </div>
      </section>

      {/* =========================================================================
          5. LES VISAGES DU SERVICE (QUI VEILLE SUR QUOI)
          ========================================================================= */}
      <section id="responsables" className="border-b border-ccjv-line bg-ccjv-cream px-6 py-20 sm:px-12 lg:px-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                Coordination
              </span>
              <h2 className="mt-4 font-serif text-[clamp(1.85rem,1.2rem+2vw,3rem)] leading-[1.12]">
                Qui veille sur chaque domaine
              </h2>
              <p className="mt-6 font-sans text-[1.02rem] leading-[1.75] text-ccjv-ink-secondary">
                Derrière chaque culte, chaque accueil et chaque temps d&apos;enseignement,
                il y a des personnes dévouées qui coordonnent les services avec simplicité
                et fidélité.
              </p>

              <div className="mt-8 border border-ccjv-line bg-white p-6">
                <p className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                  Pour vous orienter
                </p>
                <p className="mt-2 font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
                  Vous cherchez à entrer en contact avec un responsable ou à poser
                  une question relative à un pôle ? L&apos;équipe d&apos;accueil vous
                  oriente dès votre arrivée.
                </p>
                <div className="mt-4">
                  <Button variant="outline" href={site.whatsappHref} external className="w-full sm:w-auto">
                    Contacter l&apos;équipe d&apos;accueil
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border-t border-ccjv-line">
                {teamLeaders.map((ldr) => (
                  <div
                    key={ldr.id}
                    className="flex flex-col justify-between gap-4 border-b border-ccjv-line py-6 sm:flex-row sm:items-center"
                  >
                    <div>
                      <span className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                        {ldr.scope ?? "Ministère"}
                      </span>
                      <h3 className="mt-1 font-serif text-xl text-ccjv-ink">
                        {ldr.name}
                      </h3>
                      <p className="mt-0.5 font-sans text-sm text-ccjv-ink-secondary">
                        {ldr.role}
                      </p>
                    </div>

                    {ldr.bio && (
                      <p className="max-w-[34ch] font-sans text-xs leading-relaxed text-ccjv-ink-secondary sm:text-right">
                        {ldr.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SERVIR À SON TOUR (INVITATION & PARTICIPATION)
          ========================================================================= */}
      <section className="px-6 py-20 sm:px-12 lg:px-20 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
            Engagement & Bénévolat
          </span>
          <h2 className="mt-4 font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] leading-[1.14]">
            Trouver sa place et servir à son tour
          </h2>
          <p className="mx-auto mt-6 max-w-[56ch] font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary">
            L&apos;Église grandit grâce à l&apos;apport de chacun. Si vous désirez mettre
            vos compétences, votre voix ou votre disponibilité au service de la
            communauté, nous serons heureux de vous accueillir.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            <div className="border border-ccjv-line bg-ccjv-cream p-6">
              <span className="font-serif text-2xl text-ccjv-green">01</span>
              <h3 className="mt-3 font-serif text-lg text-ccjv-ink">
                Repérer un pôle
              </h3>
              <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                Parcourez les départements ci-dessus et identifiez le domaine qui
                résonne avec votre cœur et vos dons.
              </p>
            </div>

            <div className="border border-ccjv-line bg-ccjv-cream p-6">
              <span className="font-serif text-2xl text-ccjv-green">02</span>
              <h3 className="mt-3 font-serif text-lg text-ccjv-ink">
                Échanger simplement
              </h3>
              <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                Prenez contact avec le responsable du département lors d&apos;un culte ou
                via notre formulaire de message.
              </p>
            </div>

            <div className="border border-ccjv-line bg-ccjv-cream p-6">
              <span className="font-serif text-2xl text-ccjv-green">03</span>
              <h3 className="mt-3 font-serif text-lg text-ccjv-ink">
                Cheminer ensemble
              </h3>
              <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                Commencez progressivement, découvrez l&apos;équipe et participez
                à la vie active de la maison de Dieu.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button variant="primary" href={site.whatsappHref} external>
              Proposer mon aide / Écrire à l&apos;église
            </Button>
            <Button variant="outline" href="/communaute/parcours-nouveau">
              Découvrir le parcours nouveau
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
