import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CrossMark } from "@/components/shared/CrossMark";
import { images } from "@/data/mock/images";

/**
 * 01 — L'INVITATION (Hero V3).
 * Premier moment d'identité : photographie, typographie éditoriale, identité,
 * localisation, motif chrétien visible et information pratique. Les CTA ouvrent
 * directement le parcours « venir ».
 */
export function Hero() {
  return (
    <section
      className="relative grid min-h-svh grid-cols-1 overflow-hidden min-[900px]:grid-cols-2"
      aria-label="Bienvenue au Centre Chrétien Jésus ma Vie"
    >
      {/* Voile pour la lisibilité du header transparent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-black/60 to-transparent"
        aria-hidden="true"
      />

      {/* Conteneur Image : plein écran en arrière-plan sur mobile, colonne droite sur desktop */}
      <div className="absolute inset-0 z-0 bg-ccjv-line min-[900px]:relative min-[900px]:inset-auto min-[900px]:order-2 min-[900px]:z-auto min-[900px]:min-h-svh">
        <Image
          src={images.portraitLarge}
          alt=""
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          className="object-cover"
        />
        {/* Overlay sombre sur mobile pour garantir un contraste parfait du texte */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/40 min-[900px]:hidden"
          aria-hidden="true"
        />
        {/* Motif architectural discret : arche évoquant les baies d'église (visible sur desktop) */}
        <span
          className="pointer-events-none absolute inset-x-8 top-8 bottom-8 rounded-t-full border border-ccjv-cream/35 max-[900px]:hidden"
          aria-hidden="true"
        />
      </div>

      {/* Conteneur Texte : aligné vers le bas de l'écran (items-end), sur l'image sur mobile et colonne gauche sur desktop */}
      <div className="relative z-10 flex min-h-svh items-end bg-transparent px-[clamp(24px,5vw,72px)] pt-[120px] pb-16 text-white min-[900px]:order-1 min-[900px]:bg-ccjv-black min-[900px]:pb-20 max-[900px]:pb-20">
        <div className="max-w-[36rem]">
          <h1 className="display text-white">Bienvenue dans la maison.</h1>
          <p className="lead mt-6 text-white/85 min-[900px]:text-white/75">
            <CrossMark
              size="md"
              className="mr-3 inline-block align-middle text-ccjv-cream"
            />
            Le Centre Chrétien Jésus ma Vie est une famille spirituelle à
            Lubumbashi. On y vient comme on est : pour écouter la Parole, louer
            Dieu et marcher ensemble.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              href="/vie-de-leglise/ou-nous-trouver"
            >
              Planifier ma visite
            </Button>
            <Button variant="inverse" size="lg" href="/vie-de-leglise/ou-nous-trouver">
              Voir les horaires
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
