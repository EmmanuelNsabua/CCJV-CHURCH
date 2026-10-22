import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CrossMark } from "@/components/shared/CrossMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { BookOpen, Calendar, HeartHandshake, ShieldCheck, MailCheck, BellOff } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "Newsletter — Centre Chrétien Jésus ma Vie",
  description:
    "Abonnez-vous à la lettre pastorale et aux nouvelles du Centre Chrétien Jésus ma Vie à Lubumbashi. Recevez enseignements, annonces et méditations directement par courriel.",
  path: "/newsletter",
});

/**
 * Page publique de la Newsletter CCJV.
 *
 * Conforme aux règles d'architecture et d'accessibilité du projet :
 * - Next.js 15 Server Component par défaut
 * - Intégration du formulaire déclaratif via NewsletterForm
 * - Charte typographique et palettes de jetons strictes (ccjv-offwhite, ccjv-ink, ccjv-green)
 * - Structure sémantique et repères WCAG 2.2 AA
 */
export default function NewsletterPage() {
  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01. EN-TÊTE ÉDITORIAL & HERO
          ========================================================================= */}
      <section
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 pt-32 pb-16 sm:px-12 lg:px-20 lg:pt-36 lg:pb-20"
        aria-labelledby="newsletter-hero-titre"
      >
        <div className="mx-auto w-full max-w-7xl">
          <Breadcrumbs tone="light" />

          <div className="mt-4 flex items-center gap-3">
            <CrossMark size="md" className="text-ccjv-green" />
            <span className="font-sans text-xs font-bold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
              Communication & Foi
            </span>
          </div>

          <h1
            id="newsletter-hero-titre"
            className="mt-4 max-w-[22ch] font-serif text-[clamp(2.2rem,1.7rem+3vw,4.2rem)] leading-[1.08] text-ccjv-ink"
          >
            La lettre pastorale &amp; les nouvelles de l&apos;église.
          </h1>

          <p className="mt-6 max-w-[52ch] font-sans text-[clamp(1.025rem,0.95rem+0.35vw,1.2rem)] leading-[1.75] text-ccjv-ink-secondary">
            Parce que la vie en Christ se nourrit chaque jour, recevez dans votre
            boîte de réception les résumés des prédications dominicales, les
            méditations bibliques, les annonces de cultes et l&apos;actualité fraternelle
            du Centre Chrétien Jésus ma Vie à Lubumbashi.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#formulaire-newsletter"
              className="inline-flex items-center justify-center bg-ccjv-ink px-6 py-3 font-sans text-xs font-bold tracking-[0.14em] text-white uppercase transition-colors duration-200 hover:bg-ccjv-green"
            >
              M&apos;inscrire gratuitement
            </a>
            <Link
              href="/publications/actualites"
              className="inline-flex items-center justify-center border border-ccjv-line bg-transparent px-6 py-3 font-sans text-xs font-bold tracking-[0.14em] text-ccjv-ink uppercase transition-colors duration-200 hover:border-ccjv-ink hover:bg-white"
            >
              Voir les actualités
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02. CE QUE VOUS RECEVREZ (LES 3 PILIERS ÉDITORIAUX)
          ========================================================================= */}
      <section
        className="border-b border-ccjv-line bg-white px-6 py-20 sm:px-12 lg:px-20 lg:py-24"
        aria-labelledby="piliers-newsletter-titre"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-sans text-xs font-bold tracking-[0.18em] text-ccjv-green uppercase">
              Contenu de nos lettres
            </p>
            <h2
              id="piliers-newsletter-titre"
              className="mt-2 font-serif text-[clamp(1.8rem,1.4rem+1.8vw,2.8rem)] leading-[1.15] text-ccjv-ink"
            >
              Ce que nous partageons avec vous.
            </h2>
            <p className="mt-4 font-sans text-[1rem] leading-[1.7] text-ccjv-ink-secondary">
              Une édition soignée, conçue pour vous édifier et vous garder en lien
              avec la vie de notre assemblée locale.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Pilier 1 */}
            <div className="flex flex-col border border-ccjv-line bg-ccjv-offwhite p-8 transition-colors duration-200 hover:border-ccjv-ink">
              <div className="flex h-12 w-12 items-center justify-center border border-ccjv-line bg-white text-ccjv-green">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-ccjv-ink">
                Enseignements &amp; Méditations
              </h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                Les points clés des sermons dominicaux, les références bibliques
                d&apos;étude et des pensées inspirées pour affermir votre marche chrétienne
                tout au long de la semaine.
              </p>
            </div>

            {/* Pilier 2 */}
            <div className="flex flex-col border border-ccjv-line bg-ccjv-offwhite p-8 transition-colors duration-200 hover:border-ccjv-ink">
              <div className="flex h-12 w-12 items-center justify-center border border-ccjv-line bg-white text-ccjv-green">
                <Calendar className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-ccjv-ink">
                Agenda cultuel &amp; Événements
              </h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                L&apos;annonce des temps forts : cultes spéciaux, veillées
                d&apos;intercession, séminaires de formation, baptêmes et programmes
                des ministères (Jeunesse, Couples, Ecodim).
              </p>
            </div>

            {/* Pilier 3 */}
            <div className="flex flex-col border border-ccjv-line bg-ccjv-offwhite p-8 transition-colors duration-200 hover:border-ccjv-ink">
              <div className="flex h-12 w-12 items-center justify-center border border-ccjv-line bg-white text-ccjv-green">
                <HeartHandshake className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-serif text-xl font-medium text-ccjv-ink">
                Témoignages &amp; Prières
              </h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                Des récits de ce que le Seigneur accomplit parmi nous à
                Lubumbashi, des sujets d&apos;action de grâce et des requêtes communes
                pour porter ensemble l&apos;œuvre de Dieu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03. FORMULAIRE D'ABONNEMENT (SECTION INTERACTIVE)
          ========================================================================= */}
      <div id="formulaire-newsletter">
        <NewsletterForm />
      </div>

      {/* =========================================================================
          04. PAROLE D'ÉDIFICATION (VERSE SECTION)
          ========================================================================= */}
      <VerseSection
        variant="center"
        tone="dark"
        context="Parole d'espérance"
        text="Comme de l'eau fraîche pour une personne fatiguée, ainsi est une bonne nouvelle venant d'une terre lointaine."
        reference="Proverbes 25:25"
      />

      {/* =========================================================================
          05. NOS ENGAGEMENTS & TRANSPARENCE
          ========================================================================= */}
      <section
        className="border-b border-ccjv-line bg-white px-6 py-16 sm:px-12 lg:px-20 lg:py-20"
        aria-labelledby="engagements-titre"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="text-center">
            <h2
              id="engagements-titre"
              className="font-serif text-2xl text-ccjv-ink sm:text-3xl"
            >
              Nos engagements de transparence
            </h2>
            <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary sm:text-base">
              Nous respectons votre tranquillité et vos données personnelles.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-ccjv-green/40 bg-ccjv-green-soft text-ccjv-green">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-ccjv-ink">
                  Données confidentielles
                </h3>
                <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                  Votre adresse e-mail n&apos;est jamais transmise ni vendue à des tiers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-ccjv-green/40 bg-ccjv-green-soft text-ccjv-green">
                <MailCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-ccjv-ink">
                  Fréquence raisonnée
                </h3>
                <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                  Une à deux parutions par mois au maximum, pour aller à l&apos;essentiel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-ccjv-green/40 bg-ccjv-green-soft text-ccjv-green">
                <BellOff className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-ccjv-ink">
                  Désinscription libre
                </h3>
                <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                  Un lien direct au bas de chaque message permet de vous retirer à tout instant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
