import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Home, MapPin, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Badge / Surtitre */}
        <p className="font-sans text-xs font-bold tracking-[0.22em] text-ccjv-green uppercase">
          Erreur 404 · Page introuvable
        </p>

        {/* Grand chiffre élégant */}
        <h1 className="mt-4 font-serif text-6xl sm:text-7xl lg:text-8xl font-normal text-ccjv-ink tracking-tight">
          404
        </h1>

        {/* Titre et explication */}
        <h2 className="mt-4 font-serif text-2xl sm:text-3xl text-ccjv-ink font-semibold">
          Ce chemin ne mène à aucun contenu
        </h2>
        <p className="mt-4 max-w-lg mx-auto font-sans text-sm sm:text-base text-ccjv-ink-secondary leading-relaxed">
          La page que vous recherchez n&apos;existe pas, a été déplacée ou son adresse
          a été modifiée. Nous vous invitons à retrouver votre chemin parmi les rubriques
          essentielles du site.
        </p>

        {/* Formulaire de recherche rapide */}
        <div className="mt-8 max-w-md mx-auto">
          <form action="/recherche" method="GET" className="relative flex items-center border border-ccjv-line bg-ccjv-offwhite rounded-none">
            <input
              type="search"
              name="q"
              placeholder="Rechercher un culte, une actualité, un message…"
              aria-label="Rechercher sur le site"
              className="w-full px-4 py-3 text-sm bg-transparent outline-none text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 font-sans"
            />
            <button
              type="submit"
              aria-label="Lancer la recherche"
              className="px-4 py-3 bg-ccjv-green hover:bg-ccjv-green/90 text-white font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center gap-1.5"
            >
              <Search className="h-4 w-4" />
              <span>Chercher</span>
            </button>
          </form>
        </div>

        {/* Liens d'accès direct recommandés */}
        <div className="mt-12 pt-8 border-t border-ccjv-line">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ccjv-ink-secondary mb-6">
            Accès rapides
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              href="/"
              className="p-4 border border-ccjv-line bg-white hover:bg-ccjv-offwhite hover:border-ccjv-green transition-all group flex items-start gap-3 rounded-none"
            >
              <Home className="h-5 w-5 text-ccjv-green shrink-0 mt-0.5" />
              <div>
                <span className="font-serif text-base font-bold text-ccjv-ink group-hover:text-ccjv-green transition-colors block">
                  Page d&apos;accueil
                </span>
                <span className="font-sans text-xs text-ccjv-ink-secondary">
                  Retourner au portail principal de l&apos;église
                </span>
              </div>
            </Link>

            <Link
              href="/publications/actualites"
              className="p-4 border border-ccjv-line bg-white hover:bg-ccjv-offwhite hover:border-ccjv-green transition-all group flex items-start gap-3 rounded-none"
            >
              <Calendar className="h-5 w-5 text-ccjv-green shrink-0 mt-0.5" />
              <div>
                <span className="font-serif text-base font-bold text-ccjv-ink group-hover:text-ccjv-green transition-colors block">
                  Actualités
                </span>
                <span className="font-sans text-xs text-ccjv-ink-secondary">
                  Suivre la vie de la communauté et les annonces
                </span>
              </div>
            </Link>

            <Link
              href="/publications/enseignements"
              className="p-4 border border-ccjv-line bg-white hover:bg-ccjv-offwhite hover:border-ccjv-green transition-all group flex items-start gap-3 rounded-none"
            >
              <BookOpen className="h-5 w-5 text-ccjv-green shrink-0 mt-0.5" />
              <div>
                <span className="font-serif text-base font-bold text-ccjv-ink group-hover:text-ccjv-green transition-colors block">
                  Enseignements
                </span>
                <span className="font-sans text-xs text-ccjv-ink-secondary">
                  Écouter et revoir les prédications du dimanche
                </span>
              </div>
            </Link>

            <Link
              href="/vie-de-leglise/ou-nous-trouver"
              className="p-4 border border-ccjv-line bg-white hover:bg-ccjv-offwhite hover:border-ccjv-green transition-all group flex items-start gap-3 rounded-none"
            >
              <MapPin className="h-5 w-5 text-ccjv-green shrink-0 mt-0.5" />
              <div>
                <span className="font-serif text-base font-bold text-ccjv-ink group-hover:text-ccjv-green transition-colors block">
                  Cultes & Horaires
                </span>
                <span className="font-sans text-xs text-ccjv-ink-secondary">
                  Culte dominical 08h30 - 11h30 et adresse
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Bouton retour en arrière */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Revenir à l&apos;accueil du Centre Chrétien Jésus ma Vie</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

