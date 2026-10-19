import type { Metadata } from "next";
import {
  getDepartments,
  getEvents,
  getPublications,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { pageMetadata } from "@/lib/seo";
import { MediaCatalog } from "@/features/mediatheque/MediaCatalog";
import {
  buildMediaCatalogue,
  countByKind,
  type MediaItem,
} from "@/features/mediatheque/mediaCatalogue";
import { CatalogRetry } from "@/features/mediatheque/CatalogRetry";

export const metadata: Metadata = pageMetadata({
  title: "Médiathèque",
  description:
    "Photos et vidéos de la vie de la communauté au Centre Chrétien Jésus ma Vie : cultes, célébrations et rencontres, à parcourir et à revoir.",
  path: "/publications/mediatheque",
});

/**
 * Page Médiathèque — **catalogue de médias**, pas page de présentation.
 *
 * ## D'où viennent les médias
 *
 * Uniquement de sources publiques déjà servies par l'API, sans nouvel endpoint
 * et sans ouvrir le registre des médias (`/api/v1/media` reste strictement
 * administratif, `docs/018` §6.2) :
 *
 * - galeries photographiques des départements (`GET /departments`) ;
 * - galeries des événements (`GET /events`), avec leur date ;
 * - publications de type `PHOTO` (`GET /publications?type=PHOTO`) ;
 * - publications de type `VIDEO` hors rubrique `ENSEIGNEMENT`.
 *
 * Les enseignements, actualités rédigées, ressources PDF, témoignages et sujets
 * de prière sont **hors périmètre** : aucun ne figure dans le catalogue.
 *
 * ## Panne ou absence
 *
 * Chaque lecture est évaluée séparément par `readOrUnavailable` : « l'API n'a
 * pas répondu » n'est pas « il n'y a aucun média ». Une seule lecture en échec
 * rend le catalogue indisponible plutôt que de l'afficher incomplet — une
 * galerie partielle présentée comme complète serait un mensonge silencieux.
 */
export default async function MediathequePage() {
  const [departmentsRead, eventsRead, photosRead, videosRead] = await Promise.all([
    readOrUnavailable((options) => getDepartments(options)),
    readOrUnavailable((options) => getEvents({ limit: 100 }, options)),
    readOrUnavailable((options) =>
      getPublications({ type: "PHOTO", limit: 100 }, options),
    ),
    readOrUnavailable((options) =>
      getPublications({ type: "VIDEO", limit: 100 }, options),
    ),
  ]);

  const unavailable =
    departmentsRead.status === "unreachable" ||
    eventsRead.status === "unreachable" ||
    photosRead.status === "unreachable" ||
    videosRead.status === "unreachable";

  const items: MediaItem[] = unavailable
    ? []
    : buildMediaCatalogue({
        departments: departmentsRead.status === "ok" ? departmentsRead.data : [],
        events: eventsRead.status === "ok" ? eventsRead.data : [],
        photoPublications: photosRead.status === "ok" ? photosRead.data : [],
        videoPublications: videosRead.status === "ok" ? videosRead.data : [],
      });

  const { photos, videos } = countByKind(items);
  const summary =
    items.length === 0
      ? null
      : [
          `${items.length} média${items.length > 1 ? "s" : ""}`,
          photos > 0 ? `${photos} photo${photos > 1 ? "s" : ""}` : null,
          videos > 0 ? `${videos} vidéo${videos > 1 ? "s" : ""}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* Zone A — en-tête compact : il ne retarde pas l'accès au catalogue. */}
      <section className="border-b border-ccjv-line px-6 pt-28 pb-8 sm:px-12 lg:px-20 lg:pt-32 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Publications &amp; Médias
          </p>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h1 className="font-serif text-[clamp(2.1rem,1.4rem+2.4vw,3.3rem)] font-normal leading-[1.08] tracking-[-0.02em]">
              Médiathèque
            </h1>

            {summary && (
              <p className="font-sans text-[0.82rem] text-ccjv-ink-secondary">
                {summary}
              </p>
            )}
          </div>

          <p className="mt-3 max-w-[62ch] font-sans text-[0.95rem] leading-relaxed text-ccjv-ink-secondary">
            Parcourez les photos et les vidéos de la vie de la communauté :
            cultes, célébrations, rencontres et temps de service.
          </p>
        </div>
      </section>

      {/* Zones B et C — commandes puis catalogue. */}
      <section
        aria-label="Catalogue des médias"
        className="px-6 py-8 sm:px-12 lg:px-20 lg:py-10"
      >
        <div className="mx-auto w-full max-w-7xl">
          {unavailable ? (
            <div className="border border-ccjv-line bg-white px-6 py-12 text-center">
              <p className="font-serif text-[1.15rem] text-ccjv-ink">
                La médiathèque n&apos;a pas pu être chargée.
              </p>
              <p className="mx-auto mt-2 max-w-[52ch] font-sans text-[0.88rem] leading-relaxed text-ccjv-ink-secondary">
                Le serveur n&apos;a pas répondu. Les médias restent intacts :
                réessayez dans un instant.
              </p>
              <div className="mt-6">
                <CatalogRetry />
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="border border-ccjv-line bg-white px-6 py-14 text-center">
              <p className="font-serif text-[1.2rem] text-ccjv-ink">
                La médiathèque ne contient pas encore de médias disponibles.
              </p>
              <p className="mx-auto mt-3 max-w-[54ch] font-sans text-[0.9rem] leading-relaxed text-ccjv-ink-secondary">
                Les photographies et vidéos apparaîtront ici dès qu&apos;elles
                seront publiées depuis le back-office.
              </p>
            </div>
          ) : (
            <MediaCatalog items={items} />
          )}
        </div>
      </section>
    </main>
  );
}
