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
  ArrowRight,
  Quote,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import {
  getEvents,
  getPublications,
  listAllEnseignements,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { ECODIM_DEPARTMENT_ID } from "@/lib/departments";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { formatLongDate } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "École du Dimanche (ECODIM)",
  description:
    "Espace public de l'École du Dimanche du Centre Chrétien Jésus ma Vie : cadre scolaire ecclésiastique dédié à l'instruction et à l'éveil spirituel des enfants à Lubumbashi.",
  path: "/ecodim",
});

const AGE_CLASSES = [
  {
    grade: "Classe 1",
    name: "Éveil de la Foi",
    ages: "3 – 5 ans",
    subtitle: "Découvrir l'amour de Dieu par le cœur",
    description:
      "Récits bibliques illustrés, chants, coloriages guidés et premières notions de la création et de la bonté de Jésus.",
    objective: "Mémorisation de courtes prières & éveil bienveillant",
  },
  {
    grade: "Classe 2",
    name: "Les Cadets",
    ages: "6 – 8 ans",
    subtitle: "Découvrir la Bible et son histoire",
    description:
      "Repères chronologiques de l'histoire sainte. Les enfants apprennent à ouvrir leur propre Bible et à retenir les versets clés.",
    objective: "Apprentissage des livres bibliques & versets repères",
  },
  {
    grade: "Classe 3",
    name: "Les Juniors",
    ages: "9 – 12 ans",
    subtitle: "Comprendre la Parole et la vivre au quotidien",
    description:
      "Étude des grands personnages de la foi, leçons pratiques pour la vie à l'école et en famille, temps de prière fraternelle.",
    objective: "Autonomie de lecture biblique & mise en pratique",
  },
  {
    grade: "Classe 4",
    name: "Les Aînés & Ados",
    ages: "13 – 15 ans",
    subtitle: "Enraciner sa foi face aux choix de la vie",
    description:
      "Réponses bibliques aux questions existentielles des adolescents, amitié, intégrité et préparation à un engagement personnel.",
    objective: "Enracinement doctrinal & témoignage de vie chrétienne",
  },
];

export default async function EcodimPage() {
  const [teachingsRead, publicationsRead, eventsRead] = await Promise.all([
    readOrUnavailable((options) => listAllEnseignements({ scope: "ECODIM" }, options)),
    readOrUnavailable((options) => getPublications({ scope: "ECODIM", limit: 3 }, options)),
    readOrUnavailable((options) => getEvents({ departmentId: ECODIM_DEPARTMENT_ID, limit: 3 }, options)),
  ]);

  const teachings = teachingsRead.status === "ok" ? teachingsRead.data.slice(0, 3) : [];
  const publications = publicationsRead.status === "ok" ? publicationsRead.data : [];
  const events = eventsRead.status === "ok" ? eventsRead.data : [];

  return (
    <div className="bg-[#FAF7F2] text-ccjv-ink font-sans selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          SECTION A — INTRODUCTION VISUELLE FORTE (INSPIRÉE DE LA RÉFÉRENCE TRIVISION)
         ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* En-tête typographique étendu — centré verticalement et horizontalement */}
        <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto flex flex-col items-center justify-center text-center">
          {/* Grand titre imposant occupant la largeur */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ccjv-ink leading-[1.06] mt-20">
            Former les esprits,{" "}
            <span className="text-ccjv-green italic font-normal">
              enraciner les cœurs
            </span>{" "}
            dans la foi.
          </h1>

          {/* Texte descriptif centré */}
          <div className="flex flex-col items-center justify-center pt-2 w-full">
            <p className="max-w-3xl text-base sm:text-lg text-ccjv-ink-secondary leading-relaxed font-sans mx-auto text-center">
              L&apos;Ecodim accueille les enfants chaque dimanche matin pendant le culte général pour leur transmettre
              les fondements immuables des Écritures dans un cadre pédagogique structuré, joyeux et protecteur.
            </p>
          </div>
        </div>

        {/* Rangée de quatre photographies authentiques (Composition référence TriVision) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
          <div className="group relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-white shadow-xs">
            <Image
              src={images.foi}
              alt="Enfants réunis à l'École du Dimanche CCJV"
              fill
              priority
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
              <p className="text-[11px] font-sans font-semibold tracking-wider uppercase">Éveil de la Foi</p>
            </div>
          </div>

          <div className="group relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-white shadow-xs">
            <Image
              src={images.adoration}
              alt="Louange et écoute de la parole de Dieu"
              fill
              priority
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
              <p className="text-[11px] font-sans font-semibold tracking-wider uppercase">Louange & Prière</p>
            </div>
          </div>

          <div className="group relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-white shadow-xs">
            <Image
              src={images.communaute}
              alt="Fraternité et communion des enfants"
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
              <p className="text-[11px] font-sans font-semibold tracking-wider uppercase">Communion fraternelle</p>
            </div>
          </div>

          <div className="group relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-white shadow-xs">
            <Image
              src={images.identite}
              alt="Étude assidue et mémorisation de la Bible"
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
              <p className="text-[11px] font-sans font-semibold tracking-wider uppercase">Étude des Écritures</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B — SECTION ÉDITORIALE EN DEUX COLONNES (MISSION & RESPIRATION)
         ========================================================================= */}
      <section id="pedagogie" className="py-16 sm:py-24 bg-white border-y border-ccjv-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Colonne gauche : Grande photographie avec badge stylisé */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] border border-ccjv-line overflow-hidden bg-ccjv-offwhite shadow-sm">
                <Image
                  src={images.ecodim}
                  alt="Cadre pédagogique et ecclésiastique de l'Ecodim"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Colonne droite : Titre éditorial & explications concises */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ccjv-ink leading-tight">
                Une pédagogie spirituelle pour éclairer chaque avenir.
              </h2>
              <blockquote className="font-serif text-sm text-ccjv-ink">
                « Instruis l&apos;enfant selon la voie qu&apos;il doit suivre ; et quand il sera vieux, il ne s&apos;en détournera pas. »
                <cite className="block not-italic font-sans text-xs font-semibold text-ccjv-green mt-1">
                  — Proverbes 22:6
                </cite>
              </blockquote>
              <div className="pt-2">
                <Button variant="outline" href="/publications/enseignements?scope=ECODIM">
                  Voir les enseignements
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C — COMPOSITION PHOTOGRAPHIQUE ASYMÉTRIQUE (VIE À L'ECODIM)
         ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ccjv-green block">
            Au cœur de nos rencontres
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ccjv-ink">
            La vie à l&apos;Ecodim au fil des dimanches
          </h2>
          <p className="text-sm text-ccjv-ink-secondary">
            Des moments d&apos;apprentissage vivant, d&apos;écoute attentive et de fraternité partagée.
          </p>
        </div>

        {/* Triptyque asymétrique harmonieux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
          {/* Image 1 : Verticale */}
          <div className="relative aspect-[3/4] border border-ccjv-line bg-white overflow-hidden shadow-xs">
            <Image
              src={images.adoration}
              alt="Rassemblement des enfants et chants de louange"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider">Louange et Joie</p>
            </div>
          </div>

          {/* Image 2 : Centrale, plus haute et mise en valeur */}
          <div className="relative aspect-[4/5] md:aspect-[3/4] md:-translate-y-4 border-2 border-ccjv-green/40 bg-white overflow-hidden shadow-md">
            <Image
              src={images.ecodim}
              alt="Enfants écoutant attentivement la leçon biblique"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-5 text-white">
              <span className="inline-block px-2 py-0.5 bg-ccjv-green text-white text-[10px] font-bold uppercase mb-1">
                Point focal
              </span>
              <p className="text-sm font-semibold uppercase tracking-wider">Enseignement Biblique</p>
            </div>
          </div>

          {/* Image 3 : Complémentaire */}
          <div className="relative aspect-[3/4] border border-ccjv-line bg-white overflow-hidden shadow-xs">
            <Image
              src={images.communaute}
              alt="Partage et accompagnement des moniteurs"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider">Accompagnement Fraternel</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION D — GRAND PANNEAU ÉDITORIAL AVEC CHIFFRES RÉELS & CLASSES D'ÂGE
         ========================================================================= */}
      <section id="classes" className="py-16 sm:py-24 bg-[#F2EDE2] border-y border-ccjv-line scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Panneau d'informations chiffrées réelles (Inspiré du panneau TriVision) */}
          <div className="bg-white border border-ccjv-line p-8 sm:p-14 shadow-sm relative overflow-hidden">
            {/* Décoration typographique subtile en filigrane */}
            <div className="absolute -right-6 -bottom-8 select-none pointer-events-none opacity-5 font-serif text-[180px] font-black text-ccjv-ink leading-none">
              ECODIM
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ccjv-ink">
                  Un cadre scolaire ecclésiastique structuré.
                </h2>
                <p className="text-sm sm:text-base text-ccjv-ink-secondary leading-relaxed max-w-xl">
                  Pour respecter le rythme cognitif et spirituel de chaque enfant, l&apos;Ecodim organise ses séances
                  par petits groupes guidés par des moniteurs formés et consacrés.
                </p>
                <div className="pt-2">
                  <Button variant="primary" href="#parents">
                    Comment inscrire mon enfant ?
                  </Button>
                </div>
              </div>

              {/* Chiffres réels et attestés uniquement */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t lg:border-t-0 lg:border-l border-ccjv-line pt-6 lg:pt-0 lg:pl-10">
                <div className="space-y-1">
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-ccjv-green block leading-none">
                    4
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">Classes d&apos;âge</p>
                  <p className="text-[11px] text-ccjv-ink-secondary">De 3 ans jusqu&apos;à 15 ans révolus</p>
                </div>

                <div className="space-y-1">
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-ccjv-green block leading-none">
                    08h30
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-ccjv-ink">Chaque dimanche</p>
                  <p className="text-[11px] text-ccjv-ink-secondary">Accueil pendant le culte général</p>
                </div>

              </div>
            </div>
          </div>

          {/* Grille détaillée des 4 classes d'âge */}
          <div>
            <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ccjv-ink">
                Nos quatre cycles d&apos;apprentissage
              </h3>
              <p className="text-xs text-ccjv-ink-secondary">
                Une progression spirituelle adaptée à la maturité de chaque tranche d&apos;âge.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {AGE_CLASSES.map((cls) => (
                <div
                  key={cls.name}
                  className="bg-white border border-ccjv-line p-6 flex flex-col justify-between hover:border-ccjv-green transition-colors shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-ccjv-line pb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ccjv-green">
                        {cls.grade}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-ccjv-ink text-white">
                        {cls.ages}
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-ccjv-ink leading-snug">
                      {cls.name}
                    </h4>
                    <p className="text-xs font-medium text-ccjv-green">
                      {cls.subtitle}
                    </p>
                    <p className="text-xs text-ccjv-ink-secondary leading-relaxed">
                      {cls.description}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION E — TÉMOIGNAGES & PAROLES DE PARENTS ET MONITEURS
         ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ccjv-green block">
            Échos de la communauté
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ccjv-ink">
            Paroles de parents & de moniteurs
          </h2>
          <p className="text-sm text-ccjv-ink-secondary">
            L&apos;impact de la formation chrétienne dans la vie des enfants et des familles.
          </p>
        </div>

        {/* Alternance de cartes textuelles et de photographies (Référence TriVision) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Carte 1 : Témoignage texte parent */}
          <div className="p-6 bg-white border border-ccjv-line flex flex-col justify-between shadow-2xs">
            <Quote className="h-6 w-6 text-ccjv-green/40 mb-3" />
            <p className="font-serif text-sm text-ccjv-ink italic leading-relaxed">
              « Voir nos enfants rentrer à la maison en chantant des cantiques et en récitant leurs versets avec joie
              est notre plus belle bénédiction de parents. »
            </p>
            <div className="pt-4 mt-4 border-t border-ccjv-line">
              <p className="text-xs font-bold text-ccjv-ink">Frère Joël M.</p>
              <p className="text-[11px] text-ccjv-ink-secondary">Parent d&apos;élèves aux Cadets</p>
            </div>
          </div>

          {/* Carte 2 : Photographie portrait */}
          <div className="relative aspect-[3/4] md:aspect-auto border border-ccjv-line bg-ccjv-offwhite overflow-hidden shadow-2xs">
            <Image
              src={images.portraitA}
              alt="Enfant attentif et épanoui à l'église"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
          </div>

          {/* Carte 3 : Témoignage texte moniteur */}
          <div className="p-6 bg-white border border-ccjv-line flex flex-col justify-between shadow-2xs">
            <Quote className="h-6 w-6 text-ccjv-green/40 mb-3" />
            <p className="font-serif text-sm text-ccjv-ink italic leading-relaxed">
              « À l&apos;Ecodim, nous ne gardons pas simplement des enfants : nous déposons la semence éternelle de la
              Parole de Dieu qui portera du fruit pour toute leur vie. »
            </p>
            <div className="pt-4 mt-4 border-t border-ccjv-line">
              <p className="text-xs font-bold text-ccjv-ink">Frère Jacques K.</p>
              <p className="text-[11px] text-ccjv-ink-secondary">Moniteur Ecodim</p>
            </div>
          </div>

          {/* Carte 4 : Photographie portrait */}
          <div className="relative aspect-[3/4] md:aspect-auto border border-ccjv-line bg-ccjv-offwhite overflow-hidden shadow-2xs">
            <Image
              src={images.portraitB}
              alt="Joie et sanctification dans la jeunesse chrétienne"
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION F — ENSEIGNEMENTS & ACTUALITÉS ECODIM (DONNÉES DYNAMIQUES)
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-t border-ccjv-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ccjv-line pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-ccjv-green block">
                Ressources spirituelles en ligne
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ccjv-ink mt-1">
                Enseignements & Récits Ecodim
              </h2>
            </div>
            <Link
              href="/publications/enseignements?scope=ECODIM"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
            >
              <span>Tous les enseignements Ecodim</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {teachingsRead.status === "unreachable" ? (
            <ContentUnavailable resource="Les enseignements Ecodim" />
          ) : teachings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {teachings.map((teaching) => (
                <div
                  key={teaching.id}
                  className="border border-ccjv-line p-6 bg-[#FAF7F2] flex flex-col justify-between hover:border-ccjv-green transition-colors"
                >
                  <div className="space-y-3">
                    <span className="text-[11px] text-ccjv-ink-secondary block font-mono">
                      {formatLongDate(teaching.preachedAt)}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-ccjv-ink">
                      {teaching.title}
                    </h3>
                    {teaching.summary && (
                      <p className="text-xs text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                        {teaching.summary}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-ccjv-line/60 mt-6 flex items-center justify-between text-xs">
                    <span className="text-ccjv-ink-secondary">Par {teaching.speakerName}</span>
                    <Link
                      href={`/publications/enseignements/${teaching.id}`}
                      className="font-semibold text-ccjv-green hover:underline"
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
              description="Les récits et messages enregistrés apparaîtront ici dès leur publication depuis le back-office."
            />
          )}

          {/* Bloc Publications Ecodim */}
          {publications.length > 0 && (
            <div className="pt-8 border-t border-ccjv-line space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-ccjv-green block">
                    Vie & Activités
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-ccjv-ink mt-1">
                    Publications & Actualités Ecodim
                  </h3>
                </div>
                <Link
                  href="/publications?scope=ECODIM"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                >
                  <span>Toutes les publications</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {publications.map((pub) => (
                  <div
                    key={pub.id}
                    className="border border-ccjv-line p-6 bg-[#FAF7F2] flex flex-col justify-between hover:border-ccjv-green transition-colors"
                  >
                    <div className="space-y-3">
                      <span className="text-[11px] text-ccjv-ink-secondary block font-mono">
                        {formatLongDate(pub.publishedAt)}
                      </span>
                      <h4 className="font-serif text-base font-bold text-ccjv-ink line-clamp-2">
                        {pub.title}
                      </h4>
                      {pub.description && (
                        <p className="text-xs text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                          {pub.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-ccjv-line/60 mt-6 flex items-center justify-between text-xs">
                      <span className="text-ccjv-ink-secondary">{pub.author || "Ecodim"}</span>
                      <Link
                        href={`/publications/${pub.id}`}
                        className="font-semibold text-ccjv-green hover:underline"
                      >
                        Lire →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloc Événements / Rencontres Ecodim */}
          {events.length > 0 && (
            <div className="pt-8 border-t border-ccjv-line space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-ccjv-green block">
                    Agenda du département
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-ccjv-ink mt-1">
                    Prochains Rendez-vous & Séminaires
                  </h3>
                </div>
                <Link
                  href="/vie-de-leglise/agenda"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                >
                  <span>Tout l&apos;agenda</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="border border-ccjv-line p-6 bg-[#FAF7F2] flex flex-col justify-between hover:border-ccjv-green transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-ccjv-green font-bold uppercase tracking-wider">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatLongDate(evt.eventDate)}</span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-ccjv-ink line-clamp-2">
                        {evt.title}
                      </h4>
                      {(evt.excerpt || evt.description) && (
                        <p className="text-xs text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                          {evt.excerpt || evt.description}
                        </p>
                      )}
                    </div>
                    {evt.location && (
                      <div className="pt-4 border-t border-ccjv-line/60 mt-6 text-xs text-ccjv-ink-secondary">
                        Lieu : {evt.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION G — ESPACE PARENTS & ACCUEIL DU DIMANCHE (INFORMATIONS PRATIQUES)
         ========================================================================= */}
      <section id="parents" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
        <div className="border border-ccjv-line bg-white p-8 sm:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-ccjv-green block">
                Guide des familles
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ccjv-ink">
                Comment confier votre enfant ce dimanche ?
              </h2>
              <p className="text-sm text-ccjv-ink-secondary leading-relaxed max-w-2xl">
                Dès votre arrivée au Centre Chrétien Jésus ma Vie pour le culte dominical, nos moniteurs vous accueillent
                dans le hall d&apos;entrée pour enregistrer votre enfant et l&apos;accompagner vers sa salle de classe.
                À la fin du culte, les parents récupèrent personnellement leurs enfants.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-ccjv-green shrink-0" />
                  <span>Accueil dès 08h15</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-ccjv-green shrink-0" />
                  <span>Protocole de sécurité strict</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-ccjv-green shrink-0" />
                  <span>Moniteurs formés et consacrés</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Button
                variant="primary"
                href="/vie-de-leglise/ou-nous-trouver"
                size="md"
                className="w-full sm:w-48 text-center justify-center"
              >
                Où nous trouver
              </Button>
              <Button
                variant="outline"
                href={site.whatsappHref}
                external
                size="md"
                className="w-full sm:w-48 text-center justify-center"
              >
                Nous écrire
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
