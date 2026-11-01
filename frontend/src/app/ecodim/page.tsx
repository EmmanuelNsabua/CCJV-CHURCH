import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import {
  getDepartment,
  getPublications,
  listAllEnseignements,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { images } from "@/data/images";
import { pageMetadata } from "@/lib/seo";
import { formatLongDate } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "École du Dimanche (ECODIM)",
  description:
    "Espace public de l'École du Dimanche du Centre Chrétien Jésus ma Vie : cadre scolaire ecclésiastique destiné à la formation des enfants à la vie chrétienne.",
  path: "/ecodim",
});

const AGE_GROUPS = [
  {
    grade: "Classe 1 · Éveil de la Foi",
    ages: "3 – 5 ans",
    subtitle: "Découvrir Dieu par les sens et le cœur",
    description:
      "Récits bibliques illustrés, comptines chrétiennes, coloriages et premières notions de la création et de l'amour de Jésus.",
    focus: "Mémorisation de phrases clés simples & prière guidée",
  },
  {
    grade: "Classe 2 · Les Cadets",
    ages: "6 – 8 ans",
    subtitle: "Poser les repères de l'histoire sainte",
    description:
      "Parcours chronologique de l'Ancien et du Nouveau Testament. Les enfants apprennent à ouvrir leur propre Bible et à repérer les versets.",
    focus: "Mémorisation de versets & cahier d'exercices bibliques",
  },
  {
    grade: "Classe 3 · Les Juniors",
    ages: "9 – 12 ans",
    subtitle: "Approfondir la Parole et la vivre",
    description:
      "Étude des grands personnages de la Bible, leçons de morale chrétienne pratique (famille, école, vérité), et temps de prière interactive.",
    focus: "Compréhension doctrinale de base & autonomie spirituelle",
  },
  {
    grade: "Classe 4 · Les Aînés & Ados",
    ages: "13 – 15 ans",
    subtitle: "Enraciner la foi face aux défis",
    description:
      "Échanges sur les questions existentielles, la pureté, le témoignage parmi les pairs et la préparation à l'engagement chrétien personnel.",
    focus: "Apologétique adaptée & engagement dans le service",
  },
];

const PEDAGOGICAL_PILLARS = [
  {
    icon: BookOpen,
    title: "Enseignement Biblique Rigoureux",
    description:
      "La Bible est le manuel central. Chaque leçon s'appuie sur un texte sacré expliqué fidèlement et adapté à la maturité cognitive de l'enfant.",
  },
  {
    icon: GraduationCap,
    title: "Progression Pédagogique Structurée",
    description:
      "Un cursus annuel organisé par modules thématiques, avec révisions périodiques, mémorisation de versets clés et validation des acquis.",
  },
  {
    icon: HeartHandshake,
    title: "Alliance avec les Parents",
    description:
      "L'église ne remplace pas le foyer : elle l'outille. Des fiches de révision hebdomadaires permettent aux parents de prolonger la leçon en famille.",
  },
  {
    icon: ShieldCheck,
    title: "Cadre Sécurisant & Moniteurs Formés",
    description:
      "Chaque classe est confiée à des moniteurs consacrés et formés, dans le respect strict des règles de sécurité et de bienveillance chrétienne.",
  },
];

export default async function EcodimHomePage() {
  const [deptRead, teachingsRead, publicationsRead] = await Promise.all([
    readOrUnavailable((options) => getDepartment("enfants-ecodim", options)),
    readOrUnavailable((options) => listAllEnseignements({ scope: "ECODIM" }, options)),
    readOrUnavailable((options) => getPublications({ scope: "ECODIM", limit: 4 }, options)),
  ]);

  const department = deptRead.status === "ok" ? deptRead.data : null;
  const teachings = teachingsRead.status === "ok" ? teachingsRead.data.slice(0, 3) : [];
  const publications = publicationsRead.status === "ok" ? publicationsRead.data : [];

  return (
    <div className="space-y-20 pb-24">
      {/* 01 — HERO ÉDUCATIF & ECCLÉSIASTIQUE */}
      <section className="relative border-b border-ccjv-line bg-ccjv-surface/40 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 border border-ccjv-line bg-ccjv-paper px-3 py-1 font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-green rounded-none">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Cadre Scolaire Ecclésiastique CCJV</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-ccjv-ink leading-[1.08]">
                Former la jeunesse à la vie chrétienne.
              </h1>

              <p className="font-sans text-base sm:text-lg text-ccjv-ink-secondary leading-relaxed max-w-[55ch]">
                L&apos;École du Dimanche accueille les enfants chaque dimanche matin pendant le culte
                pour leur transmettre les Écritures, les instruire dans la foi et les accompagner pas à pas
                dans leur relation personnelle avec Jésus-Christ.
              </p>

              {/* Verset d'ancrage pédagogique */}
              <blockquote className="border-l-2 border-ccjv-green pl-4 py-1 italic font-serif text-sm sm:text-base text-ccjv-ink">
                « Instruis l&apos;enfant selon la voie qu&apos;il doit suivre ; et quand il sera vieux, il ne s&apos;en détournera pas. »
                <cite className="block not-italic font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-green mt-1">
                  — Proverbes 22:6
                </cite>
              </blockquote>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="primary" href="#classes">
                  Découvrir les classes →
                </Button>
                <Button variant="outline" href="/publications/enseignements?scope=ECODIM">
                  Consulter les enseignements Ecodim
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] sm:aspect-[5/4] border border-ccjv-line bg-ccjv-surface overflow-hidden rounded-none shadow-sm">
                <Image
                  src={images.ecodim}
                  alt="Enfants attentifs réunis à l'École du Dimanche du CCJV"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — LA DÉMARCHE PÉDAGOGIQUE */}
      <section id="pedagogie" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-2xl mb-12">
          <p className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase mb-2">
            Notre philosophie éducative
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-ccjv-ink">
            Une pédagogie spirituelle ordonnée et vivante
          </h2>
          <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary leading-relaxed">
            Loin d&apos;une simple garderie, l&apos;Ecodim est une institution ecclésiale d&apos;apprentissage biblique.
            Chaque enfant y trouve un environnement propice à l&apos;éveil de l&apos;intelligence et du cœur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PEDAGOGICAL_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="border border-ccjv-line p-6 bg-ccjv-surface/20 rounded-none flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 flex items-center justify-center bg-ccjv-green text-ccjv-paper mb-5 rounded-none">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-ccjv-ink mb-2">
                    {pillar.title}
                  </h3>
                  <p className="font-sans text-xs text-ccjv-ink-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 03 — LES CLASSES ET GROUPES D'ÂGE */}
      <section id="classes" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border-t border-ccjv-line pt-16">
          <div className="max-w-2xl mb-12">
            <p className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase mb-2">
              Organisation par cycles
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-ccjv-ink">
              Quatre classes adaptées à chaque étape de croissance
            </h2>
            <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary leading-relaxed">
              Pour respecter le rythme de compréhension de chaque enfant, les leçons et les ateliers
              sont répartis par tranches d&apos;âge homogènes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {AGE_GROUPS.map((group, index) => (
              <div
                key={group.grade}
                className="border border-ccjv-line p-8 bg-ccjv-surface/30 rounded-none space-y-4 hover:border-ccjv-green transition-colors"
              >
                <div className="flex items-center justify-between border-b border-ccjv-line pb-3">
                  <span className="font-sans text-xs font-bold tracking-wider uppercase text-ccjv-green">
                    {group.grade}
                  </span>
                  <span className="font-sans text-xs font-semibold px-2.5 py-1 bg-ccjv-ink text-ccjv-paper rounded-none">
                    {group.ages}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-medium text-ccjv-ink">
                    {group.subtitle}
                  </h3>
                  <p className="mt-2 font-sans text-xs sm:text-sm text-ccjv-ink-secondary leading-relaxed">
                    {group.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-ccjv-line/60 flex items-center gap-2 font-sans text-xs text-ccjv-ink-secondary">
                  <span className="font-semibold text-ccjv-ink">Objectif clé :</span>
                  <span>{group.focus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — ENSEIGNEMENTS RÉCENTS ECODIM (DONNÉES EN LIGNE) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-ccjv-line pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase mb-2">
                Leçons et prédications jeunesse
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-ccjv-ink">
                Enseignements dispensés à l&apos;Ecodim
              </h2>
            </div>
            <Link
              href="/publications/enseignements?scope=ECODIM"
              className="font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-green hover:underline whitespace-nowrap"
            >
              Tous les enseignements Ecodim →
            </Link>
          </div>

          {teachingsRead.status === "unreachable" ? (
            <ContentUnavailable resource="Les enseignements Ecodim" />
          ) : teachings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teachings.map((teaching) => (
                <div
                  key={teaching.id}
                  className="border border-ccjv-line p-6 bg-ccjv-surface/20 rounded-none flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="font-sans text-[0.72rem] text-ccjv-ink-secondary block">
                      {formatLongDate(teaching.preachedAt)}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-ccjv-ink">
                      {teaching.title}
                    </h3>
                    {teaching.summary && (
                      <p className="font-sans text-xs text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                        {teaching.summary}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-ccjv-line/60 mt-6 flex items-center justify-between">
                    <span className="font-sans text-xs text-ccjv-ink-secondary">
                      Par {teaching.speakerName}
                    </span>
                    <Link
                      href={`/publications/enseignements/${teaching.id}`}
                      className="font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                    >
                      Écouter →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun enseignement Ecodim publié pour le moment"
              description="Les récits et messages enregistrés pour l'Ecodim apparaîtront ici dès leur publication."
            />
          )}
        </div>
      </section>

      {/* 05 — PUBLICATIONS & PROJETS ECODIM */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-ccjv-line pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase mb-2">
                Vie scolaire ecclésiastique
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-ccjv-ink">
                Actualités et activités de l&apos;Ecodim
              </h2>
            </div>
            <Link
              href="/publications?scope=ECODIM"
              className="font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-green hover:underline whitespace-nowrap"
            >
              Toutes les publications Ecodim →
            </Link>
          </div>

          {publicationsRead.status === "unreachable" ? (
            <ContentUnavailable resource="Les publications Ecodim" />
          ) : publications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {publications.map((pub) => (
                <div
                  key={pub.id}
                  className="border border-ccjv-line p-5 bg-ccjv-surface/20 rounded-none flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="font-sans text-[0.7rem] text-ccjv-ink-secondary block">
                      {formatLongDate(pub.publishedAt)}
                    </span>
                    <h3 className="font-serif text-base font-medium text-ccjv-ink leading-snug">
                      {pub.title}
                    </h3>
                    {pub.description && (
                      <p className="font-sans text-xs text-ccjv-ink-secondary line-clamp-2">
                        {pub.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 mt-4 border-t border-ccjv-line/40">
                    <Link
                      href={`/publications/${pub.slug}`}
                      className="font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                    >
                      Consulter →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune annonce pour le moment"
              description="Les rentrées scolaires, fêtes chrétiennes des enfants et activités paraîtront ici."
            />
          )}
        </div>
      </section>

      {/* 06 — ESPACE PARENTS & INFOS PRATIQUES */}
      <section id="parents" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="border border-ccjv-line bg-ccjv-surface/40 p-8 sm:p-12 rounded-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase block">
                Espace Parents & Partenariat Éducatif
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-ccjv-ink">
                Comment inscrire votre enfant le dimanche ?
              </h2>
              <p className="font-sans text-sm text-ccjv-ink-secondary leading-relaxed max-w-[65ch]">
                Dès votre arrivée à l&apos;église pour le culte de 09h00 ou 11h30, présentez-vous au bureau d&apos;accueil
                Ecodim dans le hall principal. Nos moniteurs enregistrent votre enfant et vous indiquent sa classe.
                À la fin du culte, les parents récupèrent leurs enfants directement dans leurs salles respectives.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ccjv-green shrink-0" />
                  <span>Accueil : 15 min avant chaque culte</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-ccjv-green shrink-0" />
                  <span>Badge de sécurité remis aux parents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-ccjv-green shrink-0" />
                  <span>Moniteurs formés et consacrés</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-4">
              <Button variant="primary" href="/vie-de-leglise/ou-nous-trouver">
                Voir l&apos;adresse et l&apos;accès →
              </Button>
              <Link
                href="/"
                className="font-sans text-xs font-semibold tracking-wider uppercase text-ccjv-ink-secondary hover:text-ccjv-green transition-colors"
              >
                Retour à l&apos;accueil général du CCJV
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

