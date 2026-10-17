import { cn } from "@/lib/utils";

export interface ContentUnavailableProps {
  /** Ressource momentanément inaccessible, au pluriel neutre (« Les actualités »). */
  resource?: string;
  /** Précision affichée sous le titre, si la page en a besoin. */
  description?: string;
  className?: string;
}

/**
 * **Contenu momentanément indisponible.**
 *
 * À ne pas confondre avec `EmptyState` : celui-ci dit « il n'y a rien », alors que
 * `ContentUnavailable` dit « on n'a pas pu savoir ». Les deux ne se présentent
 * jamais de la même façon, et c'est tout l'objet de cette distinction :
 *
 * - `EmptyState`  → l'API a répondu, et sa réponse est vide. C'est un **fait
 *   éditorial** : aucune publication n'a encore été publiée, aucun événement
 *   n'est programmé. Il n'y a rien à corriger ;
 * - `ContentUnavailable` → la lecture a échoué (API injoignable, délai dépassé,
 *   statut non-2xx). On ne sait pas ce qu'il y a, seulement qu'on n'a pas pu le
 *   lire.
 *
 * Une page qui présenterait le second comme le premier annoncerait une erreur
 * comme un état de contenu. Le composant ne propose pas de bouton « réessayer » :
 * les pages concernées sont rendues **côté serveur**, où un bouton ne relancerait
 * rien — la nouvelle tentative est un rechargement, et c'est ce que dit le texte.
 */
export function ContentUnavailable({
  resource = "Ce contenu",
  description,
  className,
}: ContentUnavailableProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-start gap-3 rounded-none border border-dashed border-ccjv-line bg-ccjv-offwhite px-6 py-12 text-left",
        className,
      )}
    >
      <p className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
        Information momentanément indisponible
      </p>
      <h3 className="text-[1.125rem]">{resource} n&apos;a pas pu être chargé</h3>
      <p className="max-w-[52ch] text-ccjv-ink-secondary">
        {description ??
          "Le serveur de contenu n'a pas répondu. Rien n'est perdu : rechargez la page dans quelques instants pour retrouver l'information à jour."}
      </p>
    </div>
  );
}
