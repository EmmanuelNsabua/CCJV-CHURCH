import type { Metadata } from "next";
import Image from "next/image";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerseSection } from "@/components/shared/VerseSection";
import { CrossMark } from "@/components/shared/CrossMark";
import { getDepartments, getLeaders } from "@/lib/api";
import { readOrUnavailable } from "@/lib/api/endpoints";
import { OrganisationExplorer } from "./OrganisationExplorer";

export const metadata: Metadata = pageMetadata({
  title: "Organisation & Ministères",
  description:
    "Découvrez comment le Centre Chrétien Jésus ma Vie s'organise : une communauté vivante à Lubumbashi portée par des personnes au service de Dieu et des autres.",
  path: "/organisation",
});

/**
 * Page Organisation : les départements et les responsables viennent tous deux
 * de l'API. Aucun référentiel de démonstration ne s'y substitue : une réponse
 * vide produit un état vide, une lecture impossible un état d'indisponibilité.
 */
export default async function OrganisationPage() {
  const [departmentsRead, leadersRead] = await Promise.all([
    readOrUnavailable((options) => getDepartments(options)),
    readOrUnavailable((options) => getLeaders(options)),
  ]);

  /** Départements officiels CCJV, dans l'ordre défini par le back-office. */
  const departments =
    departmentsRead.status === "ok" ? departmentsRead.data : [];
  const leaders = leadersRead.status === "ok" ? leadersRead.data : [];

  /** Le responsable visionnaire et les coordinateurs de pôles. */
  const [leadPastor, ...teamLeaders] = leaders;

  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01. HERO ÉDITORIAL : L'HUMAIN, LE SERVICE & LA COMMUNAUTÉ
          ========================================================================= */}
      <section
        data-hero-dark
        className="relative flex min-h-[85vh] w-full flex-col justify-between overflow-hidden bg-ccjv-black px-6 pt-32 pb-16 text-white sm:px-12 lg:px-20 lg:pt-36 lg:pb-20"
        aria-label="Organisation du Centre Chrétien Jésus ma Vie"
      >
        {/* Voile texturé en arrière-plan */}
        <div className="absolute inset-0 z-0">
          <Image
            src={images.assemblee}
            alt="Communauté CCJV à Lubumbashi"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ccjv-black via-ccjv-black/90 to-ccjv-black/70" />
        </div>

        {/* Corps du Hero : Titre épuré & Photographie en action */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Colonne gauche : Message fort et concis */}
          <div className="lg:col-span-6 xl:col-span-7">
            <h1 className="font-serif text-[clamp(2.4rem,1.8rem+3.2vw,4.5rem)] leading-[1.08] text-white">
              Une communauté portée par ceux qui servent.
            </h1>

            <p className="mt-6 max-w-[46ch] font-sans text-[clamp(1.05rem,0.95rem+0.35vw,1.25rem)] leading-[1.7] text-white/80">
              À CCJV, l&apos;organisation est l&apos;expression vivante d&apos;hommes et de femmes
              qui donnent de leur temps, de leurs dons et de leur cœur pour la famille de Dieu.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="primary" href="#departements">
                Nos départements
              </Button>
              <Button variant="inverse" href="#responsables">
                Les responsables
              </Button>
            </div>
          </div>

          {/* Colonne droite : Composition photographique de personnes EN ACTION */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              {/* Photo principale : Service & entraide */}
              <div className="relative col-span-7 aspect-[4/5] overflow-hidden border border-white/15 bg-ccjv-line">
                <Image
                  src={images.service || "/media/ccjv-28.jpeg"}
                  alt="Service communautaire CCJV"
                  fill
                  priority
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="object-cover"
                />
              </div>

              {/* Photos secondaires : Louange & Ecodim */}
              <div className="col-span-5 flex flex-col gap-3 sm:gap-4">
                <div className="relative aspect-square overflow-hidden border border-white/15 bg-ccjv-line">
                  <Image
                    src={images.chorale || "/media/ccjv-15.jpeg"}
                    alt="Chorale et louange CCJV"
                    fill
                    sizes="(max-width: 1024px) 40vw, 20vw"
                    className="object-cover"
                  />
                </div>

                <div className="relative aspect-square overflow-hidden border border-white/15 bg-ccjv-line">
                  <Image
                    src={images.ecodim || "/media/ccjv-13.jpeg"}
                    alt="Ministère des enfants Ecodim"
                    fill
                    sizes="(max-width: 1024px) 40vw, 20vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02. PREMIÈRE RESPIRATION BIBLIQUE : L'UNITÉ DU CORPS
          ========================================================================= */}
      <VerseSection
        text="Car, comme le corps est un et a plusieurs membres, et comme tous les membres du corps, malgré leur nombre, ne forment qu'un seul corps, ainsi en est-il de Christ."
        reference="1 Corinthiens 12:12"
        variant="centered"
        tone="cream"
      />

      {/* =========================================================================
          03. LES RESPONSABLES : UNE PRÉSENTATION HUMAINE & ÉDITORIALE
          ========================================================================= */}
      <section
        id="responsables"
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="responsables-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2
              id="responsables-titre"
              className="font-serif text-[clamp(1.9rem,1.3rem+2.2vw,3.2rem)] leading-[1.12] text-ccjv-ink"
            >
              Des femmes et des hommes au service de la communauté
            </h2>
            <p className="mt-4 font-sans text-[1.05rem] leading-[1.7] text-ccjv-ink-secondary">
              Une direction pastorale et des coordinateurs engagés pour enseigner la Parole et accompagner chaque famille.
            </p>
          </div>

          {/* Grille : Portrait pastoral dominant à gauche + Coordinateurs synthétiques à droite */}
          {leadersRead.status === "unreachable" ? (
            <ContentUnavailable className="mt-14" resource="Les responsables" />
          ) : leaders.length === 0 ? (
            <EmptyState
              className="mt-14"
              title="Aucun responsable publié pour le moment"
              description="Les responsables et coordinateurs publiés depuis le back-office apparaîtront ici."
            />
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
              {/* Responsable Visionnaire (Pasteur) */}
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                {leadPastor && (
                  <div className="border border-ccjv-line bg-ccjv-cream p-6 sm:p-8">
                    {/* Sans portrait rattaché côté API, le cadre reste vide :
                        emprunter le visage d'une autre personne serait pire. */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line">
                      {leadPastor.photo && (
                        <Image
                          src={leadPastor.photo}
                          alt={leadPastor.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="mt-6">
                      <h3 className="font-serif text-2xl text-ccjv-ink">
                        {leadPastor.name}
                      </h3>
                      <p className="mt-0.5 font-sans text-sm font-medium text-ccjv-green">
                        {leadPastor.role}
                      </p>

                      {leadPastor.bio && (
                        <p className="mt-3 font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
                          {leadPastor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Coordinateurs : Présentation visuelle pour chaque pôle */}
              <div className="lg:col-span-7">
                <h3 className="font-serif text-xl sm:text-2xl text-ccjv-ink mb-6">
                  La coordination des pôles
                </h3>

                {teamLeaders.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {teamLeaders.map((ldr) => (
                      <div
                        key={ldr.id}
                        className="flex items-center gap-3.5 border border-ccjv-line bg-white p-3.5 transition-colors hover:border-ccjv-green/40"
                      >
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden border border-ccjv-line bg-ccjv-line">
                          {ldr.photo && (
                            <Image
                              src={ldr.photo}
                              alt={ldr.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="mt-0.5 font-serif text-[0.95rem] font-semibold text-ccjv-ink truncate">
                            {ldr.name}
                          </h4>
                          <p className="font-sans text-[0.78rem] text-ccjv-ink-secondary truncate">
                            {ldr.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun coordinateur de pôle publié pour le moment"
                    description="Les coordinateurs publiés depuis le back-office apparaîtront ici."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          04. TRANSITION NARRATIVE : UNE SEULE IDÉE FORTE
          ========================================================================= */}
      <section
        className="border-b border-ccjv-line bg-ccjv-cream px-6 py-16 sm:px-12 lg:px-20 lg:py-24"
        aria-label="De la chaire au service"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14 items-center">
            {/* Citation narrative */}
            <div className="lg:col-span-7">
              <CrossMark size="sm" className="mb-4 text-ccjv-green" />
              <h2 className="font-serif text-[clamp(1.75rem,1.2rem+2vw,2.8rem)] leading-[1.18] text-ccjv-ink">
                « Une église ne se construit pas seulement depuis une chaire. »
              </h2>
              <p className="mt-4 font-serif text-xl italic text-ccjv-green">
                Elle grandit lorsque chacun trouve une manière de servir.
              </p>
            </div>

            {/* Photographie authentique de la vie fraternelle */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
                <Image
                  src={images.fraternite || "/media/ccjv-35.jpeg"}
                  alt="Vie fraternelle et accueil à CCJV Lubumbashi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
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
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="departements-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2
              id="departements-titre"
              className="font-serif text-[clamp(1.9rem,1.3rem+2.2vw,3.2rem)] leading-[1.12] text-ccjv-ink"
            >
              Des espaces pour grandir et servir
            </h2>
            <p className="mt-4 font-sans text-[1.02rem] leading-[1.65] text-ccjv-ink-secondary">
              Chaque pôle répond à une saison de vie et à un appel : enfance, louange, entraide, évangélisation et prière.
            </p>
          </div>

          {/* Rendu dynamique et épuré des départements servis par l'API */}
          {departmentsRead.status === "unreachable" ? (
            <ContentUnavailable className="mt-16" resource="Les départements" />
          ) : (
            <OrganisationExplorer departments={departments} />
          )}
        </div>
      </section>

      {/* =========================================================================
          06. DEUXIÈME RESPIRATION BIBLIQUE : LE DON ET LE SERVICE
          ========================================================================= */}
      <VerseSection
        text="Comme de bons dispensateurs des diverses grâces de Dieu, que chacun de vous mette au service des autres le don qu'il a reçu."
        reference="1 Pierre 4:10"
        variant="centered"
        tone="dark"
      />

      {/* =========================================================================
          07. CONCLUSION & APPEL : TROUVER SA PLACE
          ========================================================================= */}
      <section
        id="rejoindre"
        className="px-6 py-20 sm:px-12 lg:px-20 lg:py-28 text-center"
        aria-labelledby="rejoindre-titre"
      >
        <div className="mx-auto max-w-3xl">
          <CrossMark size="md" className="mx-auto mb-6 text-ccjv-green" />

          <h2
            id="rejoindre-titre"
            className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] leading-[1.14] text-ccjv-ink"
          >
            Et vous, où pourriez-vous trouver votre place ?
          </h2>

          <p className="mt-5 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary">
            Que ce soit dans l&apos;accueil, la louange, l&apos;encadrement des enfants ou l&apos;aide pratique,
            la porte est ouverte pour cheminer et servir Dieu ensemble.
          </p>

          {/* CTAs d'engagement clairs et aérés */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button variant="primary" size="lg" href={site.whatsappHref} external>
              Nous écrire
            </Button>
            <Button variant="outline" size="lg" href="/communaute">
              Découvrir notre communauté
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
