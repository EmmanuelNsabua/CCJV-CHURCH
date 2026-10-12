import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { departments, getDepartmentBySlug } from "@/data/mock/departments";
import { leaders } from "@/data/mock/leaders";
import { site } from "@/data/mock/site";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CrossMark } from "@/components/shared/CrossMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { PhotoDuo } from "@/components/editorial/PhotoDuo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Pré-génération statique des 10 départements réels CCJV */
export async function generateStaticParams() {
  return departments.map((dept) => ({
    slug: dept.slug,
  }));
}

/** Métadonnées SEO dynamiques par département */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);

  if (!department) {
    return {};
  }

  return pageMetadata({
    title: `${department.name} — Centre Chrétien Jésus ma Vie`,
    description:
      department.tagline ||
      department.description ||
      `Découvrez la mission et la vie du département ${department.name} au Centre Chrétien Jésus ma Vie à Lubumbashi.`,
    path: `/${department.slug}`,
  });
}

/**
 * Profil éditorial d'un département CCJV :
 * - Moins de texte, plus d'impact visuel
 * - Photographie dominante et authentique
 * - Aucune numérotation décorative superficielle
 * - Template hautement flexible et résilient selon les données disponibles
 */
export default async function DepartmentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);

  if (!department) {
    notFound();
  }

  /** Résolution des coordinateurs rattachés à ce département */
  const departmentLeaders = leaders.filter((ldr) => {
    if (!ldr.scope) return false;
    const scopeLower = ldr.scope.toLowerCase();
    const deptNameLower = department.name.toLowerCase();
    const deptSlugLower = department.slug.toLowerCase();

    return (
      deptNameLower.includes(scopeLower) ||
      scopeLower.includes(deptNameLower.split(" ")[0].toLowerCase()) ||
      scopeLower.includes(deptSlugLower) ||
      (department.responsibleName && ldr.name.toLowerCase().includes(department.responsibleName.toLowerCase()))
    );
  });

  const primaryLeader = departmentLeaders[0];
  const secondaryLeader = departmentLeaders[1];

  /** Galerie photographique réelle du département */
  const galleryImages = department.gallery && department.gallery.length > 0
    ? department.gallery
    : [];

  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01. HERO COMPACT & ÉDITORIAL : NOM + IDENTITÉ + PHOTO
          ========================================================================= */}
      <section
        data-hero-dark
        className="relative flex min-h-[70vh] w-full flex-col justify-end overflow-hidden bg-ccjv-black px-6 pt-32 pb-16 text-white sm:px-12 lg:px-20 lg:pt-36 lg:pb-20"
        aria-label={department.name}
      >
        {/* Photographie de fond avec voile sombre */}
        <div className="absolute inset-0 z-0">
          <Image
            src={department.bannerImage ?? "/media/ccjv-09.jpeg"}
            alt={department.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ccjv-black via-ccjv-black/75 to-ccjv-black/40" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          {/* Fil d'Ariane épuré */}
          <Breadcrumbs tone="dark" />

          <p className="mt-4 font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-cream uppercase">
            Espace & Service
          </p>

          <h1 className="mt-3 max-w-[22ch] font-serif text-[clamp(2.4rem,1.8rem+3.2vw,4.4rem)] leading-[1.06] text-white">
            {department.name}
          </h1>

          {department.tagline && (
            <p className="mt-5 max-w-[48ch] font-serif text-[clamp(1.15rem,0.95rem+0.5vw,1.45rem)] italic text-white/90">
              « {department.tagline} »
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button variant="primary" href="#mission">
              Découvrir la mission ↓
            </Button>
            <Button
              variant="outline"
              href={site.whatsappHref}
              external
              className="border-white/35 text-white hover:bg-white/10"
            >
              Nous écrire
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02. NOTRE MISSION : IMAGE + TITRE + PHRASE FORTE (PEU DE TEXTE)
          ========================================================================= */}
      <section
        id="mission"
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="mission-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Photographie dominante */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
                <Image
                  src={department.bannerImage ?? "/media/ccjv-15.jpeg"}
                  alt={`Vie du pôle ${department.name}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Accroche narrative claire */}
            <div className="lg:col-span-6">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                Ce que nous portons
              </span>

              <h2
                id="mission-titre"
                className="mt-3 font-serif text-[clamp(1.85rem,1.25rem+2vw,2.9rem)] leading-[1.14] text-ccjv-ink"
              >
                Servir Dieu, bâtir les vies et affermir la communauté.
              </h2>

              <p className="mt-5 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary max-w-[48ch]">
                {department.description}
              </p>

              <div className="mt-8">
                <Button variant="outline" href={site.whatsappHref} external>
                  Prendre contact avec l&apos;équipe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03. LA VIE DU DÉPARTEMENT & HORAIRES : SANS NUMÉROTATION ARTIFICIELLE
          ========================================================================= */}
      {((department.keyPoints && department.keyPoints.length > 0) || department.meetingSchedule) && (
        <section
          id="activites"
          className="border-b border-ccjv-line bg-ccjv-cream px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
          aria-labelledby="activites-titre"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
              {/* Axes de service sans numérotation décorative */}
              <div className="lg:col-span-7">
                <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                  La vie du pôle
                </span>
                <h2
                  id="activites-titre"
                  className="mt-3 font-serif text-[clamp(1.85rem,1.2rem+1.8vw,2.75rem)] leading-[1.15] text-ccjv-ink"
                >
                  Comment s&apos;exprime notre engagement
                </h2>

                {department.keyPoints && department.keyPoints.length > 0 && (
                  <div className="mt-10 divide-y divide-ccjv-line border-y border-ccjv-line">
                    {department.keyPoints.map((point) => (
                      <div key={point} className="py-5">
                        <p className="font-sans text-[1.02rem] leading-[1.65] text-ccjv-ink">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bloc synthétique des rencontres */}
              {department.meetingSchedule && (
                <div className="lg:col-span-5 lg:sticky lg:top-28">
                  <div className="border border-ccjv-line bg-white p-8 sm:p-10">
                    <CrossMark size="sm" className="text-ccjv-green mb-4" />
                    <h3 className="font-serif text-2xl text-ccjv-ink">
                      Temps de rassemblement
                    </h3>
                    <p className="mt-3 font-sans text-sm leading-[1.7] text-ccjv-ink-secondary">
                      Pour répéter, prier, servir ou accueillir les nouveaux membres :
                    </p>

                    <div className="mt-6 border-l-2 border-ccjv-green pl-4 py-1.5 bg-ccjv-offwhite">
                      <p className="font-sans text-sm font-semibold text-ccjv-green">
                        {department.meetingSchedule}
                      </p>
                    </div>

                    <p className="mt-4 font-sans text-xs text-ccjv-ink-secondary">
                      Lieu : CCJV Lubumbashi (Temple principal & salles dédiées)
                    </p>

                    <div className="mt-8 pt-6 border-t border-ccjv-line">
                      <Button
                        variant="outline"
                        size="md"
                        href="/vie-de-leglise/ou-nous-trouver"
                        className="w-full justify-center text-sm"
                      >
                        Plan d&apos;accès & localisation →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          04. RESPIRATION BIBLIQUE : SOBRE & ANCRÉE
          ========================================================================= */}
      {department.verse && (
        <VerseSection
          text={department.verse.text}
          reference={department.verse.reference}
          variant="centered"
          tone="dark"
        />
      )}

      {/* =========================================================================
          05. MOMENT PHOTOGRAPHIQUE : GALERIE AUTHENTIQUE
          ========================================================================= */}
      {galleryImages.length >= 2 && (
        <section
          className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
          aria-labelledby="galerie-titre"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                En images
              </span>
              <h2
                id="galerie-titre"
                className="mt-3 font-serif text-[clamp(1.85rem,1.2rem+1.8vw,2.75rem)] leading-[1.15] text-ccjv-ink"
              >
                Vivre et servir ensemble
              </h2>
            </div>

            <div className="mt-12">
              {galleryImages.length === 2 ? (
                <PhotoDuo
                  left={{ src: galleryImages[0] }}
                  right={{ src: galleryImages[1] }}
                  variant="offset"
                />
              ) : (
                <PhotoGallery images={galleryImages} variant="columns" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          06. PERSONNES & RESPONSABLES : PRÉSENTATION HUMAINE & ÉDITORIALE
          ========================================================================= */}
      {(primaryLeader || department.responsibleName) && (
        <section
          className="border-b border-ccjv-line bg-white px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
          aria-labelledby="responsable-titre"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                Accompagnement
              </span>
              <h2
                id="responsable-titre"
                className="mt-3 font-serif text-[clamp(1.85rem,1.2rem+1.8vw,2.75rem)] leading-[1.15] text-ccjv-ink"
              >
                La coordination du pôle
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
              {primaryLeader ? (
                <div className="flex flex-col sm:flex-row gap-6 border border-ccjv-line bg-ccjv-offwhite p-6 sm:p-8">
                  <div className="relative aspect-[3/4] w-full sm:w-44 shrink-0 overflow-hidden bg-ccjv-line">
                    <Image
                      src={primaryLeader.photo ?? "/media/ccjv-04.jpeg"}
                      alt={primaryLeader.name}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-green uppercase">
                      {primaryLeader.scope ?? department.name}
                    </span>
                    <h3 className="mt-1 font-serif text-2xl text-ccjv-ink">
                      {primaryLeader.name}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-ccjv-ink-secondary">
                      {primaryLeader.role}
                    </p>
                    {primaryLeader.bio && (
                      <p className="mt-4 font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
                        {primaryLeader.bio}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-ccjv-line bg-ccjv-offwhite p-8">
                  <span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-green uppercase">
                    Responsable
                  </span>
                  <h3 className="mt-2 font-serif text-2xl text-ccjv-ink">
                    {department.responsibleName}
                  </h3>
                  <p className="mt-2 font-sans text-sm text-ccjv-ink-secondary">
                    Coordination & service pour le département {department.name}.
                  </p>
                </div>
              )}

              {secondaryLeader && (
                <div className="flex flex-col sm:flex-row gap-6 border border-ccjv-line bg-ccjv-offwhite p-6 sm:p-8">
                  <div className="relative aspect-[3/4] w-full sm:w-44 shrink-0 overflow-hidden bg-ccjv-line">
                    <Image
                      src={secondaryLeader.photo ?? "/media/ccjv-25.jpeg"}
                      alt={secondaryLeader.name}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-green uppercase">
                      {secondaryLeader.scope ?? department.name}
                    </span>
                    <h3 className="mt-1 font-serif text-2xl text-ccjv-ink">
                      {secondaryLeader.name}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-ccjv-ink-secondary">
                      {secondaryLeader.role}
                    </p>
                    {secondaryLeader.bio && (
                      <p className="mt-4 font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
                        {secondaryLeader.bio}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          07. CONCLUSION & APPEL SOUVERAIN : TROUVER SA PLACE
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
            Une place vous attend parmi nous.
          </h2>

          <p className="mt-5 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary">
            Que vous souhaitiez participer aux activités de {department.name} ou mettre vos dons au service de l&apos;église,
            la porte est ouverte.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button variant="primary" size="lg" href={site.whatsappHref} external>
              Nous écrire
            </Button>
            <Button variant="outline" size="lg" href="/organisation">
              Voir tous les départements
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
