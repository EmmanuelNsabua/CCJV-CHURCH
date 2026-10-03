import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { Reveal } from "@/components/shared/Reveal";
import { site } from "@/data/mock/site";
import { images } from "@/data/mock/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Faire un don — Centre Chrétien Jésus ma Vie",
  description:
    "Comprendre le sens du don au Centre Chrétien Jésus ma Vie à Lubumbashi : une contribution volontaire qui devient action pour l'accueil, les enfants, la louange et l'entraide.",
  path: "/vie-de-leglise/faire-un-don",
});

/**
 * Domaines d'impact réels et confirmés de CCJV.
 * Aucune statistique inventée, aucun montant artificiel.
 */
const impactDomains = [
  {
    title: "Ecodim & Les enfants",
    description:
      "Contribuer à créer des espaces où les enfants peuvent découvrir la Parole de Dieu, chanter, apprendre et grandir dans la foi avec un encadrement bienveillant.",
    image: images.ecodim || "/media/ccjv-13.jpeg",
  },
  {
    title: "Louange & Célébration",
    description:
      "Soutenir le travail de la chorale et des musiciens qui se réunissent chaque semaine pour préparer et conduire l'assemblée dans l'adoration.",
    image: images.chorale || "/media/ccjv-15.jpeg",
  },
  {
    title: "Enseignement & Édification",
    description:
      "Permettre la tenue régulière des cultes, la diffusion des enseignements bibliques et l'accueil digne de chaque visiteur.",
    image: images.predication || "/media/ccjv-11.jpeg",
  },
  {
    title: "Entraide & Présence fraternelle",
    description:
      "Manifester concrètement l'amour du Christ auprès des familles éprouvées, des personnes malades ou des personnes en situation de détresse.",
    image: images.service || "/media/ccjv-28.jpeg",
  },
];

/**
 * Chaîne de transformation : Contribution → Capacité → Action → Personnes
 */
const impactFlow = [
  {
    step: "01",
    label: "Le geste libre",
    title: "Votre contribution",
    description: "Un don volontaire remis sans contrainte, fruit d'un choix personnel et réfléchi.",
  },
  {
    step: "02",
    label: "Les moyens concrets",
    title: "La capacité d'agir",
    description: "L'église dispose des ressources nécessaires pour maintenir ses espaces, ses matériels et ses programmes.",
  },
  {
    step: "03",
    label: "Le service régulier",
    title: "L'action sur le terrain",
    description: "Célébrations, temps d'Ecodim, répétitions de la chorale, visites et soutien fraternel prennent vie.",
  },
  {
    step: "04",
    label: "La finalité humaine",
    title: "Des vies touchées",
    description: "Des enfants formés, des familles accompagnées et une communauté fortifiée dans la foi.",
  },
];

/**
 * Moyens réels de contribution à Lubumbashi
 */
const givingMethods = [
  {
    title: "Sur place, lors des cultes",
    badge: "Remise directe",
    description:
      "Les contributions (dîmes, offrandes, dons de soutien) se remettent traditionnellement lors des cultes dominicaux et des rassemblements de prière dans les enveloppes prévues à cet effet.",
    instructions: "Accessible chaque dimanche matin lors du culte au quartier Hewa Bora.",
  },
  {
    title: "Mobile Money & Virement",
    badge: "À distance",
    description:
      "Si vous êtes éloigné ou souhaitez effectuer un don par voie électronique (M-Pesa, Airtel Money, Orange Money ou virement bancaire), contactez le secrétariat pour obtenir les canaux officiels.",
    instructions: "Numéros et coordonnées officielles transmis sur simple message sécurisé.",
  },
  {
    title: "Soutenir un projet dédié",
    badge: "Projet ciblé",
    description:
      "Vous pouvez choisir d'affecter spécialement votre don à l'Ecodim (matériel pour les enfants), aux instruments de musique de la louange ou aux actions d'entraide.",
    instructions: "Précisez l'intention de votre geste lors de votre contact avec l'église.",
  },
];

const crossLinks = [
  {
    title: "Où nous trouver",
    description: "Horaires des cultes, plan d'accès et accueil à Lubumbashi.",
    href: "/vie-de-leglise/ou-nous-trouver",
  },
  {
    title: "Agenda & Événements",
    description: "Les prochaines dates et rassemblements de la communauté.",
    href: "/vie-de-leglise/evenements",
  },
  {
    title: "Les départements",
    description: "Découvrir la vie des équipes qui servent au quotidien.",
    href: "/organisation/departements",
  },
];

export default function FaireUnDonPage() {
  const whatsappDonHref = `${site.whatsappHref}?text=${encodeURIComponent(
    "Bonjour Centre Chrétien Jésus ma Vie, je souhaite obtenir les informations et coordonnées pour faire un don ou soutenir l'œuvre de l'église.",
  )}`;

  return (
    <div className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-cream selection:text-ccjv-ink">
      {/* =========================================================================
          01 — HERO : L'INVITATION À PARTICIPER (IMAGE À GAUCHE / TEXTE À DROITE)
          ========================================================================= */}
      <section className="relative overflow-hidden border-b border-ccjv-line bg-white pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
            {/* Colonne gauche : Grande photographie authentique CCJV */}
            <div className="lg:col-span-6">
              <Reveal>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ccjv-line shadow-lg">
                  <Image
                    src={images.communaute || "/media/ccjv-30.jpeg"}
                    alt="La communauté du Centre Chrétien Jésus ma Vie réunie"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </Reveal>
            </div>

            {/* Colonne droite : Titre de sens et CTA épuré */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <Reveal delay={100}>
                <h1 className="font-serif text-[clamp(2.4rem,1.7rem+3.2vw,4.2rem)] font-normal leading-[1.08] tracking-[-0.02em] text-ccjv-ink">
                  Vous pouvez faire une différence
                </h1>

                <p className="mt-6 max-w-[48ch] font-sans text-base leading-relaxed text-ccjv-ink-secondary sm:text-lg">
                  Votre soutien volontaire contribue à faire vivre les actions, l&apos;accueil,
                  la formation des enfants et la mission de l&apos;église auprès de chacun.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
                  <a
                    href="#comment-donner"
                    className="inline-flex items-center justify-center bg-ccjv-ink px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:bg-ccjv-green"
                  >
                    Faire un don ↓
                  </a>
                  <a
                    href="#pourquoi-donner"
                    className="inline-flex items-center justify-center border border-ccjv-line bg-white px-7 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-ink uppercase transition-all duration-200 hover:border-ccjv-ink"
                  >
                    Comprendre l&apos;impact
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02 — SECTION : POURQUOI DONNER ? (UNE CONTRIBUTION QUI DEVIENT ACTION)
          ========================================================================= */}
      <section
        id="pourquoi-donner"
        className="relative scroll-mt-24 border-b border-ccjv-line bg-ccjv-offwhite py-16 lg:py-24"
        aria-labelledby="why-give-title"
      >
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <div className="flex items-center gap-3 text-ccjv-green">
                  <CrossMark size="sm" />
                  <span className="font-sans text-xs font-semibold tracking-[0.18em] uppercase">
                    Sens & Engagement
                  </span>
                </div>
                <h2
                  id="why-give-title"
                  className="mt-4 font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight text-ccjv-ink"
                >
                  Une contribution qui devient action.
                </h2>
                <p className="mt-6 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                  Au Centre Chrétien Jésus ma Vie, rien de ce qui est spirituel ne s&apos;achète :
                  l&apos;entrée au culte, l&apos;écoute de la Parole, la prière fraternelle et
                  l&apos;encadrement des enfants sont ouverts à tous sans aucune condition.
                </p>
                <p className="mt-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                  Le don est la réponse libre de personnes qui souhaitent que cette œuvre
                  continue de rayonner, de bénir et d&apos;accueillir dignement d&apos;autres personnes
                  à Lubumbashi.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={100}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="border border-ccjv-line bg-white p-6 shadow-xs">
                    <span className="font-serif text-2xl font-normal text-ccjv-green">01</span>
                    <h3 className="mt-3 font-serif text-lg font-medium text-ccjv-ink">
                      Accueillir dignement
                    </h3>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Recevoir chaque visiteur dans des conditions respectueuses, chaleureuses et ouvertes.
                    </p>
                  </div>

                  <div className="border border-ccjv-line bg-white p-6 shadow-xs">
                    <span className="font-serif text-2xl font-normal text-ccjv-green">02</span>
                    <h3 className="mt-3 font-serif text-lg font-medium text-ccjv-ink">
                      Transmettre & Former
                    </h3>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Enseigner les Écritures, équiper les croyants et accompagner les nouvelles générations.
                    </p>
                  </div>

                  <div className="border border-ccjv-line bg-white p-6 shadow-xs">
                    <span className="font-serif text-2xl font-normal text-ccjv-green">03</span>
                    <h3 className="mt-3 font-serif text-lg font-medium text-ccjv-ink">
                      Accompagner les enfants
                    </h3>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Donner à l&apos;Ecodim les ressources pédagogiques et matérielles pour leur éveil spirituel.
                    </p>
                  </div>

                  <div className="border border-ccjv-line bg-white p-6 shadow-xs">
                    <span className="font-serif text-2xl font-normal text-ccjv-green">04</span>
                    <h3 className="mt-3 font-serif text-lg font-medium text-ccjv-ink">
                      Servir & Soutenir
                    </h3>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Porter assistance aux membres dans le besoin et manifester une solidarité concrète.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — SECTION : VOTRE DON DEVIENT ACTION (COMPOSITION ÉDITORIALE ONG)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-24 border-b border-ccjv-line">
        <div className="container">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight text-ccjv-ink">
                Le chemin de votre geste
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                Comment un don financier volontaire se transforme très concrètement en impact humain et spirituel.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {impactFlow.map((item, index) => (
              <Reveal key={item.step} delay={index * 100} className="h-full">
                <div className="relative flex h-full flex-col justify-between border-t-2 border-ccjv-green bg-ccjv-offwhite p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-2xl font-semibold text-ccjv-green">
                        {item.step}
                      </span>
                      <span className="font-sans text-[0.65rem] font-semibold tracking-[0.16em] text-ccjv-ink-secondary uppercase">
                        {item.label}
                      </span>
                    </div>
                    <h3 className="mt-5 font-serif text-xl font-medium text-ccjv-ink">
                      {item.title}
                    </h3>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          04 — SECTION : DOMAINES D'IMPACT (ACTIVITÉS RÉELLES DE CCJV)
          ========================================================================= */}
      <section className="relative bg-ccjv-offwhite py-16 lg:py-24 border-b border-ccjv-line">
        <div className="container">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight text-ccjv-ink">
                Ce que votre soutien rend possible
              </h2>
              <p className="mt-3 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                Voici les piliers essentiels de l&apos;église alimentés par les contributions de chacun.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
            {impactDomains.map((domain, index) => (
              <Reveal key={domain.title} delay={index * 100} className="h-full">
                <div className="group flex h-full flex-col overflow-hidden border border-ccjv-line bg-white transition-all duration-300 hover:border-ccjv-ink">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-ccjv-line">
                    <Image
                      src={domain.image}
                      alt={domain.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-7">
                    <div>
                      <h3 className="font-serif text-2xl font-medium text-ccjv-ink">
                        {domain.title}
                      </h3>
                      <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                        {domain.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          05 — RESPIRATION BIBLIQUE (GÉNÉROSITÉ VOLONTAIRE ET DIGNE)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-cream py-16 lg:py-24 border-b border-ccjv-line">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mb-6 flex justify-center text-ccjv-green">
                <CrossMark size="md" />
              </div>
              <blockquote className="font-serif text-[clamp(1.4rem,1rem+1.8vw,2.4rem)] font-normal leading-[1.38] tracking-[-0.01em] text-ccjv-ink">
                « Que chacun donne comme il l&apos;a résolu en son cœur, sans tristesse ni contrainte ;
                car Dieu aime celui qui donne avec joie. »
              </blockquote>
              <figcaption className="mt-6 font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-ink-secondary uppercase">
                — 2 Corinthiens 9:7
              </figcaption>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06 — SECTION : DONNER EST UN CHOIX (TRANSPARENCE & RESPECT)
          ========================================================================= */}
      <section className="relative bg-white py-16 lg:py-24 border-b border-ccjv-line">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <h2 className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight text-ccjv-ink">
                  Vous êtes libre de donner
                </h2>
                <div className="mt-6 space-y-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                  <p>
                    Donner est un choix éminemment personnel et volontaire. Nous refusons
                    toute culpabilisation, pression émotionnelle ou obligation artificielle.
                  </p>
                  <p>
                    Si vous choisissez de soutenir CCJV, votre contribution participe concrètement
                    à la vie, aux actions et au rayonnement de la communauté.
                  </p>
                  <p>
                    Si vous ne le faites pas, vous êtes tout autant chez vous parmi nous, reçu avec
                    le même amour et la même joie.
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Reveal delay={100}>
                <div className="grid grid-cols-12 gap-3 sm:gap-4">
                  {/* Image principale verticale */}
                  <div className="col-span-7 relative aspect-[4/5] overflow-hidden bg-ccjv-line shadow-xs">
                    <Image
                      src={images.fraternite || "/media/ccjv-35.jpeg"}
                      alt="Rencontre fraternelle et communauté"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>

                  {/* Deux images empilées à droite */}
                  <div className="col-span-5 flex flex-col gap-3 sm:gap-4">
                    <div className="relative aspect-square w-full overflow-hidden bg-ccjv-line shadow-xs">
                      <Image
                        src={images.louange || "/media/ccjv-08.jpeg"}
                        alt="Adoration et célébration"
                        fill
                        sizes="(max-width: 1024px) 50vw, 20vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <div className="relative aspect-square w-full overflow-hidden bg-ccjv-line shadow-xs">
                      <Image
                        src={images.service || "/media/ccjv-28.jpeg"}
                        alt="Service et accueil des membres"
                        fill
                        sizes="(max-width: 1024px) 50vw, 20vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          07 — SECTION : COMMENT CONTRIBUER ? (MÉTHODES RÉELLES)
          ========================================================================= */}
      <section
        id="comment-donner"
        className="relative scroll-mt-24 bg-ccjv-offwhite py-16 lg:py-24 border-b border-ccjv-line"
        aria-labelledby="how-to-give-title"
      >
        <div className="container">
          <Reveal>
            <div className="max-w-2xl">
              <h2
                id="how-to-give-title"
                className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight text-ccjv-ink"
              >
                Comment contribuer ?
              </h2>
              <p className="mt-3 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                Des démarches simples, directes et sécurisées adaptées à votre situation.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
            {givingMethods.map((method, index) => (
              <Reveal key={method.title} delay={index * 100} className="h-full">
                <div className="flex h-full flex-col justify-between border border-ccjv-line bg-white p-7 sm:p-8">
                  <div>
                    <span className="inline-block bg-ccjv-cream px-3 py-1 font-sans text-[0.7rem] font-semibold tracking-wider text-ccjv-ink uppercase">
                      {method.badge}
                    </span>
                    <h3 className="mt-5 font-serif text-xl font-medium text-ccjv-ink">
                      {method.title}
                    </h3>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                      {method.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-ccjv-line pt-4">
                    <p className="font-sans text-xs italic text-ccjv-ink-secondary">
                      {method.instructions}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="mt-12 border border-ccjv-line bg-white p-8 sm:p-10">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <h3 className="font-serif text-2xl font-medium text-ccjv-ink">
                    Échanger avec le secrétariat
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                    Pour recevoir les coordonnées de Mobile Money ou du compte bancaire officiel,
                    ou pour toute question concernant un don, écrivez-nous directement.
                  </p>
                </div>
                <a
                  href={whatsappDonHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center bg-ccjv-ink px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:bg-ccjv-green"
                >
                  Contacter via WhatsApp →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          08 — SECTION : L'IMPACT HUMAIN & INVITATION FINALE
          ========================================================================= */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-24 border-b border-ccjv-line">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="grid grid-cols-2 gap-4 lg:col-span-6">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line">
                <Image
                  src={images.assemblee || "/media/ccjv-09.jpeg"}
                  alt="Assemblée réunie lors du culte"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line mt-6">
                <Image
                  src={images.fraternite || "/media/ccjv-35.jpeg"}
                  alt="Échanges fraternels à CCJV"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-6">
              <Reveal>
                <h2 className="font-serif text-[clamp(2.2rem,1.6rem+2.6vw,3.6rem)] font-normal tracking-[-0.02em] leading-tight text-ccjv-ink">
                  Vous pouvez prendre part à cette œuvre.
                </h2>
                <p className="mt-6 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                  Derrière chaque contribution, il y a la possibilité de maintenir des portes ouvertes,
                  d&apos;enseigner un enfant, d&apos;élever des louanges et de soutenir quelqu&apos;un
                  dans le besoin.
                </p>
                <p className="mt-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                  Si vous souhaitez vous associer à ce que Dieu accomplit à travers CCJV à Lubumbashi,
                  nous vous en remercions de tout cœur.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href={whatsappDonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-ccjv-ink px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:bg-ccjv-green"
                  >
                    Faire un don
                  </a>
                  <Link
                    href="/organisation/departements"
                    className="inline-flex items-center justify-center border border-ccjv-line bg-white px-7 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-ink uppercase transition-all duration-200 hover:border-ccjv-ink"
                  >
                    Découvrir nos départements
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          09 — CROSS-LINKS : POURSUIVRE LA DÉCOUVERTE
          ========================================================================= */}
      <section className="relative bg-ccjv-offwhite py-16 lg:py-20">
        <div className="container">
          <Reveal>
            <h2 className="font-serif text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] font-normal text-ccjv-ink">
              Poursuivre la découverte de l&apos;église
            </h2>
          </Reveal>

          <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-3">
            {crossLinks.map((link, index) => (
              <Reveal key={link.title} delay={index * 100} className="h-full">
                <Link
                  href={link.href}
                  className="group flex h-full flex-col justify-between border border-ccjv-line bg-white p-7 transition-all duration-200 hover:border-ccjv-ink hover:shadow-xs"
                >
                  <div>
                    <h3 className="font-serif text-xl font-medium text-ccjv-ink group-hover:text-ccjv-green">
                      {link.title} →
                    </h3>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      {link.description}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
