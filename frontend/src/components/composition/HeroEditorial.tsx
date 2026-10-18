import { Reveal } from "@/components/shared/Reveal";
import { ParallaxImage } from "@/components/shared/ParallaxImage";

/**
 * Héros éditorial — « photographie à gauche, titre à droite ».
 *
 * Structure reprise de `/vie-de-leglise/ou-nous-trouver`, dont elle constitue
 * désormais le modèle commun des pages de rubrique (Enseignements, Guides
 * d'étude, Actualités) :
 *
 *   bandeau clair pleine largeur
 *   └─ grande photographie (colonne 6) · titre + introduction + action (colonne 6)
 *
 * Volontairement dépouillé : aucun sur-titre, aucun fil d'Ariane, aucune
 * décoration. L'image installe le sujet, le titre le nomme, l'introduction
 * l'explique en deux phrases, l'action conduit au contenu. Les trois pages qui
 * l'emploient partagent donc exactement la même charpente.
 */
export interface HeroEditorialProps {
  /** Titre de la page — rendu en `h1`, unique par page. */
  title: string;
  /** Introduction courte : ce que le visiteur trouve sur cette page. */
  intro?: string;
  /** Photographie d'ouverture (chemin local ou URL absolue). */
  image: string;
  /** Texte alternatif : décrit le rôle de la photographie, sans broder. */
  imageAlt: string;
  /**
   * Action principale.
   *
   * Doit mener quelque part de réel : ancre interne vers le contenu de la page,
   * ou route existante. Jamais un bouton sans effet.
   */
  action?: { label: string; href: string };
}

export function HeroEditorial({
  title,
  intro,
  image,
  imageAlt,
  action,
}: HeroEditorialProps) {
  return (
    <section className="relative overflow-hidden border-b border-ccjv-line bg-white pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          {/* Colonne gauche : la photographie ouvre la page. */}
          <div className="lg:col-span-6">
            <Reveal>
              <ParallaxImage
                src={image}
                alt={imageAlt}
                priority
                speed={0.1}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[4/3] w-full shadow-lg"
              />
            </Reveal>
          </div>

          {/* Colonne droite : titre, introduction, action. */}
          <div className="flex flex-col justify-center lg:col-span-6">
            <Reveal delay={100}>
              <h1 className="font-serif text-[clamp(2.5rem,1.8rem+3.5vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-ccjv-ink">
                {title}
              </h1>

              {intro && (
                <p className="mt-6 max-w-[46ch] font-sans text-[1rem] leading-[1.75] text-ccjv-ink-secondary">
                  {intro}
                </p>
              )}

              {action && (
                <div className="mt-8 sm:mt-10">
                  <a
                    href={action.href}
                    className="inline-flex items-center justify-center bg-ccjv-ink px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:bg-ccjv-green"
                  >
                    {action.label}
                  </a>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
