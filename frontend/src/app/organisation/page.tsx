import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDepartments, getLeaders } from "@/lib/api";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CrossMark } from "@/components/shared/CrossMark";
import { OrganisationExplorer } from "./OrganisationExplorer";

export const metadata: Metadata = pageMetadata({
  title: "Organisation & Ministères",
  description:
    "Découvrez comment le Centre Chrétien Jésus ma Vie s'organise : une communauté vivante à Lubumbashi portée par des personnes au service de Dieu et des autres.",
  path: "/organisation",
});

export default async function OrganisationPage() {
  const [departments, leaders] = await Promise.all([
    getDepartments(),
    getLeaders(),
  ]);

  /** Le responsable visionnaire (Pasteur principal) et l'équipe de coordination */
  const [leadPastor, ...teamLeaders] = leaders;

  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01. HERO ÉDITORIAL DÉDIÉ : L'HUMAIN, LE SERVICE & LA COMMUNAUTÉ
          ========================================================================= */}
      <section
        data-hero-dark
        className="relative flex min-h-[92vh] w-full flex-col justify-between overflow-hidden bg-ccjv-black px-6 pt-32 pb-16 text-white sm:px-12 lg:px-20 lg:pt-36 lg:pb-20"
        aria-label="Organisation du Centre Chrétien Jésus ma Vie"
      >
        {/* Voile de fond texturé et photographique subtil */}
        <div className="absolute inset-0 z-0">
          <Image
            src={images.assemblee}
            alt="Communauté CCJV rassemblée à Lubumbashi"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ccjv-black via-ccjv-black/90 to-ccjv-black/70" />
        </div>

        {/* Corps du Hero : Texte à gauche & Composition photographique en action à droite */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Colonne gauche : Titre fort & Narration de service */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-ccjv-cream" aria-hidden="true" />
              <p className="font-sans text-xs font-semibold tracking-[0.24em] text-ccjv-cream uppercase">
                Organisation & Vie de l&apos;Église
              </p>
            </div>

            <h1 className="mt-6 font-serif text-[clamp(2.3rem,1.7rem+3vw,4.2rem)] leading-[1.1] text-white">
              Une communauté portée par ceux qui servent.
            </h1>

            <p className="mt-6 max-w-[50ch] font-sans text-[clamp(1.05rem,0.95rem+0.35vw,1.25rem)] leading-[1.7] text-white/80">
              À CCJV, l&apos;organisation n&apos;est pas un organigramme
              administratif figé. Elle est l&apos;expression vivante d&apos;hommes
              et de femmes qui donnent de leur temps, de leurs dons et de leur
              cœur pour prendre soin de chacun et faire grandir la famille de Dieu.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="primary" href="#departements">
                Découvrir les départements ↓
              </Button>
              <Button variant="inverse" href="#responsables">
                Les visages du service
              </Button>
            </div>
          </div>

          {/* Colonne droite : Composition photographique de personnes EN ACTION */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              {/* Photo 1 : Service et entraide (grande colonne) */}
              <div className="relative col-span-7 aspect-[4/5] overflow-hidden border border-white/15 bg-ccjv-line">
                <Image
                  src={images.service || "/media/ccjv-28.jpeg"}
                  alt="Service communautaire au Centre Chrétien Jésus ma Vie"
                  fill
                  priority
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="object-cover"
                />
                <span
                  className="pointer-events-none absolute inset-x-3 bottom-3 font-sans text-[0.68rem] font-semibold tracking-[0.16em] text-white uppercase drop-shadow-md"
                  aria-hidden="true"
                >
                  Entraide & Service
                </span>
              </div>

              {/* Photos 2 & 3 : Louange & Enfants (colonne droite empilée) */}
              <div className="col-span-5 flex flex-col gap-3 sm:gap-4">
                <div className="relative aspect-square overflow-hidden border border-white/15 bg-ccjv-line">
                  <Image
                    src={images.chorale || "/media/ccjv-15.jpeg"}
                    alt="Chorale et louange CCJV"
                    fill
                    sizes="(max-width: 1024px) 40vw, 20vw"
                    className="object-cover"
                  />
                  <span
                    className="pointer-events-none absolute inset-x-2 bottom-2 font-sans text-[0.62rem] font-semibold tracking-[0.14em] text-white uppercase drop-shadow-md"
                    aria-hidden="true"
                  >
                    Louange
                  </span>
                </div>

                <div className="relative aspect-square overflow-hidden border border-white/15 bg-ccjv-line">
                  <Image
                    src={images.ecodim || "/media/ccjv-13.jpeg"}
                    alt="Ministère des enfants Ecodim"
                    fill
                    sizes="(max-width: 1024px) 40vw, 20vw"
                    className="object-cover"
                  />
                  <span
                    className="pointer-events-none absolute inset-x-2 bottom-2 font-sans text-[0.62rem] font-semibold tracking-[0.14em] text-white uppercase drop-shadow-md"
                    aria-hidden="true"
                  >
                    Ecodim
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repères / Navigation d'ancrage rapide */}
        <div className="relative z-10 mx-auto mt-14 w-full max-w-7xl border-t border-white/15 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
            <a
              href="#responsables"
              className="group flex flex-col justify-between border-l border-white/15 pl-4 transition-colors hover:border-ccjv-cream"
            >
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-white/50 uppercase group-hover:text-ccjv-cream">
                01 · Direction & Service
              </span>
              <span className="mt-1 font-serif text-base text-white">
                Les responsables
              </span>
            </a>

            <a
              href="#departements"
              className="group flex flex-col justify-between border-l border-white/15 pl-4 transition-colors hover:border-ccjv-cream"
            >
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-white/50 uppercase group-hover:text-ccjv-cream">
                02 · Ministères actifs
              </span>
              <span className="mt-1 font-serif text-base text-white">
                Les départements
              </span>
            </a>

            <a
              href="#rejoindre"
              className="group flex flex-col justify-between border-l border-white/15 pl-4 transition-colors hover:border-ccjv-cream"
            >
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-white/50 uppercase group-hover:text-ccjv-cream">
                03 · Participation
              </span>
              <span className="mt-1 font-serif text-base text-white">
                Trouver sa place
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02. RESPIRATION BIBLIQUE 1 : L'UNITÉ DANS LE CORPS DE CHRIST
          ========================================================================= */}
      <section
        className="relative overflow-hidden bg-ccjv-green py-20 text-white sm:py-28"
        aria-label="Méditation biblique sur l'unité"
      >
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex justify-center text-ccjv-cream">
            <CrossMark size="lg" />
          </div>

          <blockquote className="font-serif text-[clamp(1.35rem,1.05rem+1.5vw,2.25rem)] font-normal leading-[1.4] text-white">
            « Car, comme le corps est un et a plusieurs membres, et comme tous
            les membres du corps, malgré leur nombre, ne forment qu&apos;un seul
            corps, ainsi en est-il de Christ. Il y a diversité de dons, mais le
            même Esprit ; diversité de ministères, mais le même Seigneur. »
          </blockquote>

          <figcaption className="mt-6 font-sans text-xs font-semibold tracking-[0.24em] text-ccjv-cream uppercase">
            1 Corinthiens 12:12, 4–5
          </figcaption>
        </div>
      </section>

      {/* =========================================================================
          03. LES RESPONSABLES : DES SERVITEURS AU CŒUR DE LA COMMUNAUTÉ
          ========================================================================= */}
      <section
        id="responsables"
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-32"
        aria-labelledby="responsables-titre"
      >
        <div className="mx-auto max-w-7xl">
          {/* En-tête de section */}
          <div className="max-w-3xl">
            <h2
              id="responsables-titre"
              className="font-serif text-[clamp(1.9rem,1.3rem+2.2vw,3.2rem)] leading-[1.12] text-ccjv-ink"
            >
              Des femmes et des hommes au service de la communauté
            </h2>
            <p className="mt-5 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary">
              La conduite de CCJV ne repose pas sur une hiérarchie distante,
              mais sur des personnes engagées qui enseignent la Parole,
              accompagnent les familles et veillent sur chaque étape de la vie de l&apos;église.
            </p>
          </div>

          {/* Grille éditoriale : Pasteur visionnaire & Équipe de coordination */}
          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            {/* Colonne gauche : Portrait et vision pastorale */}
            <div className="lg:col-span-5">
              {leadPastor ? (
                <div className="border border-ccjv-line bg-ccjv-cream p-6 sm:p-8">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line">
                    <Image
                      src={leadPastor.photo ?? images.portraitLarge}
                      alt={leadPastor.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-6">
                    <span className="font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                      {leadPastor.scope ?? "Direction spirituelle"}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl text-ccjv-ink">
                      {leadPastor.name}
                    </h3>
                    <p className="mt-0.5 font-sans text-sm font-medium text-ccjv-green">
                      {leadPastor.role}
                    </p>

                    {leadPastor.bio && (
                      <p className="mt-4 font-sans text-sm leading-[1.7] text-ccjv-ink-secondary">
                        {leadPastor.bio}
                      </p>
                    )}

                    <div className="mt-6 border-t border-ccjv-line/70 pt-4">
                      <p className="font-serif text-sm italic text-ccjv-ink">
                        « Le plus grand parmi vous sera votre serviteur. »
                      </p>
                      <p className="mt-1 font-sans text-[0.7rem] font-semibold tracking-wider text-ccjv-green uppercase">
                        Matthieu 23:11
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Direction pastorale"
                  description="La présentation pastorale sera affichée dès que les informations seront synchronisées."
                />
              )}
            </div>

            {/* Colonne droite : Liste éditoriale des coordinateurs de pôles */}
            <div className="lg:col-span-7">
              <h3 className="font-serif text-2xl text-ccjv-ink mb-6">
                La coordination des ministères
              </h3>
              <p className="font-sans text-sm leading-[1.65] text-ccjv-ink-secondary mb-8">
                Chaque domaine est coordonné avec soin pour assurer un accueil
                chaleureux, une louange consacrée et un encadrement adapté aux petits comme aux grands.
              </p>

              {teamLeaders.length > 0 ? (
                <div className="divide-y divide-ccjv-line border-y border-ccjv-line">
                  {teamLeaders.map((ldr) => (
                    <div
                      key={ldr.id}
                      className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-12 sm:items-center"
                    >
                      {/* Vignette photo portrait */}
                      <div className="sm:col-span-3">
                        <div className="relative aspect-square w-20 overflow-hidden border border-ccjv-line bg-ccjv-line sm:w-24">
                          <Image
                            src={ldr.photo ?? images.portraitB}
                            alt={ldr.name}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* Détails du responsable */}
                      <div className="sm:col-span-9">
                        <span className="font-sans text-[0.68rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                          {ldr.scope ?? "Coordination"}
                        </span>
                        <h4 className="mt-1 font-serif text-lg text-ccjv-ink">
                          {ldr.name}
                        </h4>
                        <p className="font-sans text-xs font-medium text-ccjv-green">
                          {ldr.role}
                        </p>
                        {ldr.bio && (
                          <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                            {ldr.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-ccjv-line bg-ccjv-cream p-8">
                  <p className="font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                    L&apos;ensemble de nos départements est animé par des équipes
                    bénévoles dévouées. Vous pouvez vous adresser à l&apos;équipe
                    d&apos;accueil lors de votre venue pour rencontrer les personnes en charge.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          04. TRANSITION NARRATIVE : DE LA CHAIRE À L'ENSEMBLE DU CORPS
          ========================================================================= */}
      <section
        className="border-b border-ccjv-line bg-ccjv-cream px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-label="Transition narrative"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-center">
            {/* Message narratif fort */}
            <div className="lg:col-span-6">
              <CrossMark size="sm" className="mb-4 text-ccjv-green" />
              <h2 className="font-serif text-[clamp(1.75rem,1.2rem+2vw,2.8rem)] leading-[1.18] text-ccjv-ink">
                « Une église ne se construit pas seulement depuis une chaire. »
              </h2>
              <p className="mt-5 font-serif text-xl italic text-ccjv-green">
                Elle grandit lorsque chacun trouve une manière de servir.
              </p>
              <p className="mt-4 font-sans text-[0.98rem] leading-[1.7] text-ccjv-ink-secondary">
                L&apos;église n&apos;est pas un spectacle auquel on assiste en spectateur :
                c&apos;est une famille où chaque voix, chaque sourire à l&apos;entrée
                et chaque geste discret contribuent à refléter l&apos;amour de Christ à Lubumbashi.
              </p>
            </div>

            {/* Mosaïque photographique de la communauté en action */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-ccjv-line">
                  <Image
                    src={images.fraternite || "/media/ccjv-35.jpeg"}
                    alt="Accueil et communion fraternelle à CCJV"
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-ccjv-line">
                  <Image
                    src={images.predication || "/media/ccjv-11.jpeg"}
                    alt="Enseignement et partage de la Parole"
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          05. LES DÉPARTEMENTS DYNAMIQUES : DES ESPACES POUR GRANDIR ET SERVIR
          ========================================================================= */}
      <section
        id="departements"
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-32"
        aria-labelledby="departements-titre"
      >
        <div className="mx-auto max-w-7xl">
          {/* En-tête de section */}
          <div className="flex flex-col justify-between gap-6 border-b border-ccjv-line pb-8 sm:flex-row sm:items-end">
            <div>
              <h2
                id="departements-titre"
                className="font-serif text-[clamp(1.9rem,1.3rem+2.2vw,3.2rem)] leading-[1.12] text-ccjv-ink"
              >
                Des espaces pour grandir et servir
              </h2>
            </div>
            <p className="max-w-[44ch] font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
              Chaque département répond à un appel particulier : éveil spirituel
              des enfants, édification des adultes, louange consacrée et fraternité active.
            </p>
          </div>

          {/* Explorateur de départements dynamique avec volet intégré */}
          {departments.length > 0 ? (
            <OrganisationExplorer departments={departments} />
          ) : (
            <EmptyState
              className="mt-12"
              title="Les départements sont en cours de mise à jour"
              description="Les pôles et ministères de l'église seront consultables très prochainement."
            />
          )}
        </div>
      </section>

      {/* =========================================================================
          06. RESPIRATION BIBLIQUE 2 : LE DON ET LE SERVICE
          ========================================================================= */}
      <section
        className="border-b border-ccjv-line bg-ccjv-black py-20 text-white sm:py-28"
        aria-label="Méditation biblique sur le don"
      >
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex justify-center text-ccjv-cream">
            <CrossMark size="lg" />
          </div>

          <blockquote className="font-serif text-[clamp(1.35rem,1.05rem+1.5vw,2.25rem)] font-normal leading-[1.4] text-white">
            « Comme de bons dispensateurs des diverses grâces de Dieu, que
            chacun de vous mette au service des autres le don qu&apos;il a reçu. »
          </blockquote>

          <figcaption className="mt-6 font-sans text-xs font-semibold tracking-[0.24em] text-ccjv-cream uppercase">
            1 Pierre 4:10
          </figcaption>
        </div>
      </section>

      {/* =========================================================================
          07. CONCLUSION & APPEL : ET VOUS, OÙ POURRIEZ-VOUS TROUVER VOTRE PLACE ?
          ========================================================================= */}
      <section
        id="rejoindre"
        className="px-6 py-20 sm:px-12 lg:px-20 lg:py-32"
        aria-labelledby="rejoindre-titre"
      >
        <div className="mx-auto max-w-5xl text-center">
          <h2
            id="rejoindre-titre"
            className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] leading-[1.14] text-ccjv-ink"
          >
            Et vous, où pourriez-vous trouver votre place ?
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary">
            Il n&apos;y a pas de petit service dans la maison de Dieu. Que vous
            ayez à cœur d&apos;accueillir, d&apos;enseigner les plus jeunes, de
            chanter ou d&apos;apporter votre aide pratique, nous serons heureux de
            vous accompagner.
          </p>

          {/* Les 3 étapes pour cheminer */}
          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            <div className="border border-ccjv-line bg-ccjv-cream p-6">
              <span className="font-serif text-2xl text-ccjv-green">01</span>
              <h3 className="mt-3 font-serif text-lg text-ccjv-ink">
                Découvrir nos pôles
              </h3>
              <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                Parcourez les départements ci-dessus et repérez le domaine qui
                correspond à vos dons et à votre sensibilité.
              </p>
            </div>

            <div className="border border-ccjv-line bg-ccjv-cream p-6">
              <span className="font-serif text-2xl text-ccjv-green">02</span>
              <h3 className="mt-3 font-serif text-lg text-ccjv-ink">
                Échanger simplement
              </h3>
              <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                Prenez contact avec les responsables ou l&apos;équipe
                d&apos;accueil un dimanche pour poser toutes vos questions.
              </p>
            </div>

            <div className="border border-ccjv-line bg-ccjv-cream p-6">
              <span className="font-serif text-2xl text-ccjv-green">03</span>
              <h3 className="mt-3 font-serif text-lg text-ccjv-ink">
                Participer à votre rythme
              </h3>
              <p className="mt-2 font-sans text-xs leading-[1.65] text-ccjv-ink-secondary">
                Intégrez l&apos;équipe en toute simplicité et expérimentez la
                joie de servir Dieu au sein d&apos;une vraie famille.
              </p>
            </div>
          </div>

          {/* Boutons d'action pour le passage à l'étape suivante */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button variant="primary" href={site.whatsappHref} external>
              Écrire pour participer / servir
            </Button>
            <Button variant="outline" href="/communaute/parcours-nouveau">
              Découvrir le parcours nouveau →
            </Button>
          </div>

          <p className="mt-8">
            <Link
              href="/vie-de-leglise/ou-nous-trouver"
              className="font-sans text-xs text-ccjv-ink-secondary underline underline-offset-4 hover:text-ccjv-green"
            >
              Voir nos horaires de culte et notre adresse à Lubumbashi →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
