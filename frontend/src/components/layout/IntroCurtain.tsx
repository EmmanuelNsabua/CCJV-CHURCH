import { CrossMark } from "@/components/shared/CrossMark";
import { site } from "@/data/site";

/**
 * Verset affiché par le rideau d'introduction.
 *
 * Volontairement réduit aux deux champs rendus : la valeur vient de
 * `getScripture("rassemblement")` via `src/app/layout.tsx` (composant serveur),
 * puisque le chrome du site est rendu côté client.
 */
export interface IntroVerse {
  text: string;
  reference: string;
}

/**
 * Séquence d'introduction de la première visite (§34.1).
 *
 * Contraintes respectées :
 * - **SSR-safe** : rendu côté serveur, aucune attente de JS, le contenu de la
 *   page est déjà dans le DOM (aucun blocage du rendu ni du LCP) ;
 * - **Une seule fois par session** (`.intro-seen` posé par le script inline) ;
 * - **`prefers-reduced-motion`** : la règle globale rend l'animation
 *   instantanée, le rideau disparaît immédiatement ;
 * - courte (≈ 1,9 s) et purement `opacity` / `visibility`.
 *
 * `verse` vaut `null` quand l'API n'a pas fourni le verset : le rideau reste
 * joué (croix + sigle), simplement sans citation — aucun verset de
 * remplacement n'est inventé.
 */
export function IntroCurtain({ verse }: { verse: IntroVerse | null }) {
  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="mx-auto flex max-w-[44rem] flex-col items-center px-6 text-center">
        <CrossMark size="lg" className="text-ccjv-cream" />
        {verse && (
          <>
            <p className="mt-9 font-serif text-[clamp(1.35rem,0.8rem+2vw,2.25rem)] leading-[1.35] font-normal text-white">
              «&nbsp;{verse.text}&nbsp;»
            </p>
            <p className="mt-7 font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-cream uppercase">
              {verse.reference}
            </p>
          </>
        )}
        <p className="mt-14 font-serif text-sm font-semibold tracking-[0.34em] text-white/45 uppercase">
          {site.acronym}
        </p>
      </div>
    </div>
  );
}
