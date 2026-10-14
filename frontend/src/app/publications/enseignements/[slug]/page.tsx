import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnseignement } from "@/lib/api/endpoints";
import { formatLongDate } from "@/lib/utils";
import { ArrowLeft, BookOpen, Calendar, User, Video, Mic, FileText, Download } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

interface EnseignementDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EnseignementDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const teaching = await getEnseignement(slug);
  if (!teaching) {
    return pageMetadata({
      title: "Enseignement introuvable",
      description: "La prédication demandée n'existe pas ou n'est plus publiée.",
      path: "/publications/enseignements",
    });
  }

  return pageMetadata({
    title: `${teaching.title} — Prédication`,
    description:
      teaching.summary ||
      `Prédication par ${teaching.speakerName} au Centre Chrétien Jésus ma Vie.`,
    path: `/publications/enseignements/${teaching.slug}`,
  });
}

export default async function EnseignementDetailPage({
  params,
}: EnseignementDetailPageProps) {
  const { slug } = await params;
  const teaching = await getEnseignement(slug);

  if (!teaching) {
    notFound();
  }

  // Média principal
  const primaryMedia = teaching.medias?.find((m) => m.isPrimary);
  const secondaryMedias = teaching.medias?.filter((m) => !m.isPrimary) || [];

  return (
    <article className="min-h-screen bg-ccjv-surface/30">
      {/* Barre de retour */}
      <div className="border-b border-ccjv-line bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <Link
            href="/publications/enseignements"
            className="inline-flex items-center gap-2 text-xs font-medium text-ccjv-ink-secondary hover:text-ccjv-green transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Toutes les prédications</span>
          </Link>
        </div>
      </div>

      <header className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-ccjv-ink-secondary mb-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-ccjv-green uppercase tracking-wider text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            Prêché le {formatLongDate(teaching.preachedAt)}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {teaching.speakerName}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ccjv-ink leading-tight">
          {teaching.title}
        </h1>

        {teaching.summary && (
          <p className="mt-4 text-base sm:text-lg text-ccjv-ink-secondary max-w-3xl leading-relaxed">
            {teaching.summary}
          </p>
        )}
      </header>

      {/* Lecteur Média Principal */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        {primaryMedia?.media?.publicUrl ? (
          <div className="bg-black border border-ccjv-line overflow-hidden shadow-lg">
            {primaryMedia.role === "VIDEO" ? (
              <video
                controls
                className="w-full max-h-[550px] aspect-video object-contain bg-black"
                src={primaryMedia.media.publicUrl}
              >
                Votre navigateur ne prend pas en charge la lecture vidéo.
              </video>
            ) : (
              <div className="p-8 sm:p-12 bg-gradient-to-br from-ccjv-ink to-ccjv-ink-secondary text-white flex flex-col items-center justify-center text-center">
                <Mic className="w-12 h-12 text-ccjv-green mb-4" />
                <h3 className="font-serif text-xl font-bold mb-2">
                  Enregistrement audio du message
                </h3>
                <p className="text-xs text-white/70 mb-6">
                  {primaryMedia.media.title || teaching.title}
                </p>
                <audio
                  controls
                  className="w-full max-w-lg"
                  src={primaryMedia.media.publicUrl}
                >
                  Votre navigateur ne prend pas en charge la lecture audio.
                </audio>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-ccjv-surface border border-ccjv-line text-center text-sm text-ccjv-ink-secondary">
            Média de diffusion en cours de traitement.
          </div>
        )}
      </section>

      {/* Contenu, Références Bibliques et Notes */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Colonne principale : description / notes */}
          <div className="lg:col-span-8 space-y-8">
            {teaching.description && (
              <div className="bg-white p-6 sm:p-8 border border-ccjv-line">
                <h2 className="font-serif text-xl font-bold text-ccjv-ink mb-4 pb-2 border-b border-ccjv-line">
                  Notes et extrait du message
                </h2>
                <div className="prose prose-sm max-w-none text-ccjv-ink leading-relaxed whitespace-pre-line">
                  {teaching.description}
                </div>
              </div>
            )}

            {/* Ressources complémentaires associées */}
            {secondaryMedias.length > 0 && (
              <div className="bg-white p-6 border border-ccjv-line space-y-3">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  Ressources complémentaires
                </h3>
                <ul className="divide-y divide-ccjv-line">
                  {secondaryMedias.map((sm) => (
                    <li key={sm.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {sm.role === "VIDEO" && <Video className="w-4 h-4 text-ccjv-green" />}
                        {sm.role === "AUDIO" && <Mic className="w-4 h-4 text-blue-600" />}
                        {sm.role === "THUMBNAIL" && <FileText className="w-4 h-4 text-amber-600" />}
                        <span className="font-medium text-ccjv-ink">
                          {sm.media?.title || sm.mediaId}
                        </span>
                      </div>
                      {sm.media?.publicUrl && (
                        <a
                          href={sm.media.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-ccjv-green hover:underline font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Colonne latérale : Références bibliques étudiées */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-ccjv-line space-y-4">
              <div className="flex items-center gap-2 border-b border-ccjv-line pb-2">
                <BookOpen className="w-4 h-4 text-ccjv-green" />
                <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-ccjv-ink">
                  Passages bibliques
                </h2>
              </div>

              {teaching.references && teaching.references.length > 0 ? (
                <ul className="space-y-2.5">
                  {teaching.references.map((ref) => (
                    <li
                      key={ref.id}
                      className="p-3 bg-ccjv-surface border border-ccjv-line font-serif text-sm text-ccjv-ink font-semibold"
                    >
                      {ref.book} {ref.startChapter}:{ref.startVerse}
                      {ref.endChapter && ref.endChapter !== ref.startChapter
                        ? `–${ref.endChapter}:${ref.endVerse ?? ""}`
                        : ref.endVerse && ref.endVerse !== ref.startVerse
                        ? `–${ref.endVerse}`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ccjv-ink-secondary">
                  Aucun passage particulier spécifié pour cette prédication.
                </p>
              )}
            </div>

            <div className="p-4 bg-ccjv-surface border border-ccjv-line text-xs text-ccjv-ink-secondary space-y-2">
              <p className="font-semibold text-ccjv-ink">Centre Chrétien Jésus ma Vie</p>
              <p>
                Culte d&apos;enseignement et de louange célébré à Lubumbashi, RDC.
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
