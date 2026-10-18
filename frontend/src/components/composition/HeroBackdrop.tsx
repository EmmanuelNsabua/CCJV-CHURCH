import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "@/components/shared/Reveal";

/**
 * Héros « toile de fond » — pleine hauteur, photographie en filigrane sombre.
 *
 * Structure reprise de `/qui-sommes-nous` : la page s'ouvre sur un écran entier,
 * la photographie affleure sous un voile très dense (opacité 25 %), et le titre
 * vient se poser **en bas** du cadre, suivi d'une phrase d'ouverture en serif.
 *
 * Ce héros ne convient qu'aux pages d'atmosphère — il ne pousse aucun contenu
 * utilitaire, il installe un registre. C'est pourquoi il est réservé à la
 * Médiathèque, où l'image est le sujet même.
 */
export interface HeroBackdropProps {
  /**
   * Titre de la page (`h1`).
   *
   * Accepte du balisage : la page de référence glisse un accent italique crème
   * au milieu de sa phrase (« Notre histoire <em>&</em> notre foi »). Le composant
   * laisse ce choix éditorial à l'appelant.
   */
  title: ReactNode;
  /** Phrase d'ouverture, en serif léger sous le titre. */
  intro?: ReactNode;
  /** Photographie de fond (chemin local ou URL absolue). */
  image: string;
  /**
   * Texte alternatif.
   *
   * La photographie est un fond décoratif dont le sens est déjà porté par le
   * titre : laisser vide est légitime. Renseigner une valeur ne se justifie que
   * si l'image porte une information propre.
   */
  imageAlt?: string;
}

export function HeroBackdrop({
  title,
  intro,
  image,
  imageAlt = "",
}: HeroBackdropProps) {
  return (
    <section className="relative flex min-h-screen min-h-[100svh] flex-col justify-end overflow-hidden bg-ccjv-black text-white">
      {/* Image de fond en filigrane sombre */}
      <div className="absolute inset-0 z-0 opacity-25">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="container relative z-10 pt-32 pb-20 lg:pb-28">
        <Reveal>
          <h1 className="font-serif text-[clamp(2.5rem,1.5rem+4.5vw,5.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white">
            {title}
          </h1>

          {intro && (
            <p className="mt-8 max-w-[46ch] font-serif text-[clamp(1.15rem,0.95rem+0.8vw,1.6rem)] font-light leading-relaxed text-white/85">
              {intro}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
