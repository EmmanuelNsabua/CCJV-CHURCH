import Link from "next/link";
import Image from "next/image";
import { type Department } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";

interface OrganisationExplorerProps {
  departments: Department[];
}

/**
 * Présentation éditoriale et épurée des départements :
 * - Alternance visuelle rythmée (Image Gauche / Texte Droite puis inversement)
 * - Densité maîtrisée : Numéro + Titre + Phrase d'accroche + Grande Photographie + CTA
 * - Les détails riches (piliers, horaires, galerie) sont accessibles dans le volet contextuel
 *
 * Composant **de présentation** : il ne lit jamais l'API lui-même. La page
 * serveur lui transmet les départements réels ; chaque bloc n'est rendu que si
 * le champ correspondant (`tagline`, `description`, `bannerImage`) existe.
 */
export function OrganisationExplorer({ departments }: OrganisationExplorerProps) {
  if (departments.length === 0) {
    return (
      <EmptyState
        className="mt-16"
        title="Aucun département publié pour le moment"
        description="Les départements et ministères publiés depuis le back-office apparaîtront ici."
      />
    );
  }

  return (
    <div className="mt-16 space-y-16 lg:space-y-24">
      {departments.map((dept, idx) => {
        const isReversed = idx % 2 === 1;

        return (
          <article
            key={dept.id}
            id={dept.slug}
            className="group scroll-mt-28 border border-ccjv-line bg-white transition-all duration-300 hover:border-ccjv-green/40"
          >
            {/* Alias d'ancre pour compatibilité (#ecodim, #adultes, etc.) */}
            {dept.slug === "enfants-ecodim" && <div id="ecodim" className="scroll-mt-28" />}
            {dept.slug === "adultes" && <div id="adulte" className="scroll-mt-28" />}

            <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
              {/* Colonne Image dominante — absente si l'API ne fournit pas d'image d'en-tête */}
              {dept.bannerImage && (
                <div
                  className={`relative min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] lg:col-span-6 xl:col-span-5 ${
                    isReversed ? "lg:order-2" : "lg:order-1"
                  } bg-ccjv-line overflow-hidden`}
                >
                  <Image
                    src={dept.bannerImage}
                    alt={dept.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
              )}

              {/* Colonne Contenu : Ultra-épurée & lisible */}
              <div
                className={`flex flex-col justify-between p-8 sm:p-12 lg:p-16 ${
                  dept.bannerImage
                    ? "lg:col-span-6 xl:col-span-7"
                    : "lg:col-span-12"
                } ${isReversed ? "lg:order-1" : "lg:order-2"}`}
              >
                <div>
                  {/* Numérotation sobre */}
                  <span className="font-serif text-2xl sm:text-3xl font-normal text-ccjv-green">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <h3 className="mt-4 font-serif text-[clamp(1.85rem,1.3rem+1.6vw,2.75rem)] leading-[1.12] text-ccjv-ink">
                    {dept.name}
                  </h3>

                  {(dept.tagline || dept.description) && (
                    <p className="mt-4 font-sans text-[1.05rem] leading-[1.7] text-ccjv-ink-secondary max-w-[46ch]">
                      {dept.tagline || dept.description}
                    </p>
                  )}
                </div>

                {/* CTA vers l'expérience dédiée /[slug] */}
                <div className="mt-10 pt-6 border-t border-ccjv-line">
                  <Link
                    href={`/${dept.slug}`}
                    className="inline-flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-ink uppercase transition-colors hover:text-ccjv-green cursor-pointer"
                  >
                    <span>Découvrir</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
