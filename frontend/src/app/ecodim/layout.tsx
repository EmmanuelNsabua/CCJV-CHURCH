import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Users } from "lucide-react";

export default function EcodimLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ccjv-paper text-ccjv-ink flex flex-col">
      {/* Barre supérieure spécifique Ecodim — Passerelle avec le site général */}
      <header className="border-b border-ccjv-line bg-ccjv-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-ink-secondary hover:text-ccjv-green transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au site CCJV</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-medium tracking-tight text-ccjv-ink">
                École du Dimanche · CCJV
              </span>
              <span className="hidden sm:inline-block font-sans text-[0.65rem] tracking-[0.16em] uppercase px-2 py-0.5 bg-ccjv-green text-ccjv-paper font-semibold rounded-none">
                Ecodim
              </span>
            </div>
          </div>

          {/* Navigation thématique interne à l'espace Ecodim */}
          <nav
            aria-label="Navigation Ecodim"
            className="flex items-center space-x-1 sm:space-x-6 overflow-x-auto border-t border-ccjv-line/60 py-2.5 scrollbar-none text-xs font-sans tracking-wider uppercase"
          >
            <Link
              href="/ecodim"
              className="whitespace-nowrap px-3 py-1 font-semibold text-ccjv-green hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              Accueil Ecodim
            </Link>
            <Link
              href="/ecodim#pedagogie"
              className="whitespace-nowrap px-3 py-1 text-ccjv-ink-secondary hover:text-ccjv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              Vision & Pédagogie
            </Link>
            <Link
              href="/ecodim#classes"
              className="whitespace-nowrap px-3 py-1 text-ccjv-ink-secondary hover:text-ccjv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              Classes & Niveaux
            </Link>
            <Link
              href="/publications/enseignements?scope=ECODIM"
              className="whitespace-nowrap px-3 py-1 text-ccjv-ink-secondary hover:text-ccjv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              Enseignements
            </Link>
            <Link
              href="/publications?scope=ECODIM"
              className="whitespace-nowrap px-3 py-1 text-ccjv-ink-secondary hover:text-ccjv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              Publications & Rentrées
            </Link>
            <Link
              href="/ecodim#parents"
              className="whitespace-nowrap px-3 py-1 text-ccjv-ink-secondary hover:text-ccjv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green"
            >
              Espace Parents
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenu principal de l'espace Ecodim */}
      <main className="flex-1">{children}</main>

      {/* Pied de page spécifique Ecodim */}
      <footer className="border-t border-ccjv-line bg-ccjv-surface/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="font-serif text-lg font-medium text-ccjv-ink mb-2">
                École du Dimanche (ECODIM)
              </p>
              <p className="font-sans text-xs text-ccjv-ink-secondary leading-relaxed">
                Ministère d'édification et de formation chrétienne des enfants du Centre Chrétien Jésus ma Vie à Lubumbashi.
              </p>
            </div>

            <div>
              <p className="font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-ink mb-3">
                Ressources et accès rapide
              </p>
              <ul className="space-y-2 text-xs font-sans text-ccjv-ink-secondary">
                <li>
                  <Link href="/publications/enseignements?scope=ECODIM" className="hover:text-ccjv-green">
                    • Enseignements et histoires bibliques Ecodim
                  </Link>
                </li>
                <li>
                  <Link href="/publications?scope=ECODIM" className="hover:text-ccjv-green">
                    • Publications et annonces des activités
                  </Link>
                </li>
                <li>
                  <Link href="/qui-sommes-nous" className="hover:text-ccjv-green">
                    • Qui sommes-nous (CCJV)
                  </Link>
                </li>
                <li>
                  <Link href="/vie-de-leglise/ou-nous-trouver" className="hover:text-ccjv-green">
                    • Horaires des cultes dominicaux
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-ink mb-3">
                Partenariat éducatif
              </p>
              <p className="font-sans text-xs text-ccjv-ink-secondary leading-relaxed mb-4">
                « Instruis l&apos;enfant selon la voie qu&apos;il doit suivre ; et quand il sera vieux, il ne s&apos;en détournera pas. » — Proverbes 22:6
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-green hover:underline"
              >
                ← Retour au site principal du CCJV
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-ccjv-line/60 flex flex-col sm:flex-row items-center justify-between text-[0.72rem] font-sans text-ccjv-ink-secondary">
            <p>© {new Date().getFullYear()} Centre Chrétien Jésus ma Vie — Lubumbashi, RDC. Tous droits réservés.</p>
            <p className="mt-2 sm:mt-0">Cadre scolaire ecclésiastique pour l&apos;édification dans la foi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

