import { HeroCentered } from "@/components/composition/HeroCentered";
import { EditorialPage } from "@/components/archetypes/EditorialPage";
import { Prose } from "@/components/editorial/Prose";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { StepsList } from "@/components/editorial/StepsList";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { Button } from "@/components/ui/Button";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Faire un don",
  description:
    "Soutenir l'œuvre du Centre Chrétien Jésus ma Vie : ce qu'un don sert, comment le remettre aujourd'hui et ce que nous ne pouvons pas encore afficher.",
  path: "/vie-de-leglise/faire-un-don",
});

/**
 * Ce qu'un don sert dans la vie de l'église.
 * Présentation qualitative : aucun montant, aucun objectif chiffré, aucune
 * affectation budgétaire n'est inventé ici.
 */
const purposes = [
  {
    title: "L'accueil",
    text: "Recevoir dignement chaque personne qui pousse la porte, membre ou visiteur, et lui faire une place dans l'assemblée.",
  },
  {
    title: "Les enfants",
    text: "Faire vivre l'Ecodim, le ministère des enfants né le 2 juillet 2023 : le matériel, les activités et l'accompagnement des plus jeunes.",
  },
  {
    title: "La louange",
    text: "Soutenir le travail de la chorale, qui répète trois fois par semaine pour conduire l'assemblée dans l'adoration.",
  },
  {
    title: "L'entraide",
    text: "Venir en aide aux familles éprouvées : la maladie, le deuil, les besoins urgents.",
  },
];

/** Les moyens réellement disponibles aujourd'hui — rien de plus. */
const ways = [
  {
    title: "Sur place, à l'église",
    text: "Les contributions se remettent sur place, lors des célébrations. C'est aujourd'hui le moyen le plus direct de donner.",
  },
  {
    title: "Poser une question d'abord",
    text: "Écrivez-nous sur WhatsApp : nous vous indiquerons ce qui est possible et comment procéder, sans engagement de votre part.",
  },
  {
    title: "Soutenir un besoin précis",
    text: "Si vous souhaitez que votre don aille vers un besoin particulier, dites-le nous : nous vous répondrons ce qui peut être fait, et ce qui ne peut pas l'être.",
  },
];

const related: CrossLink[] = [
  {
    href: "/vie-de-leglise/ou-nous-trouver",
    label: "Où nous trouver",
    description: "Adresse, horaires et contact de l'église.",
  },
  {
    href: "/organisation/departements",
    label: "Les départements",
    description: "Ce que l'église organise, semaine après semaine.",
  },
  {
    href: "/vie-de-leglise/evenements",
    label: "L'agenda",
    description: "Les prochaines dates de la communauté.",
  },
];

export default function FaireUnDonPage() {
  return (
    <EditorialPage
      rhythm="standard"
      hero={
        <HeroCentered
          overline="Vie de l'Église"
          title="Donner, sans y être obligé"
          intro="Un don n'achète rien ici : ni l'entrée au culte, ni l'accompagnement des enfants, ni une place dans l'assemblée. Il s'agit d'autre chose — participer librement à une œuvre qui nous dépasse."
          tone="cream"
        />
      }
      intro={
        <>
          <h2 className="max-w-[24ch] text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
            Pourquoi donner
          </h2>
          <Prose dropcap large width="narrow" className="mt-7">
            <p>
              Le Centre Chrétien Jésus ma Vie ne fait pas payer ce qu&apos;elle
              donne. Le culte, la Parole, la prière, l&apos;accompagnement des
              enfants : rien de tout cela ne s&apos;achète, et rien de tout cela
              ne dépend d&apos;un don.
            </p>
            <p>
              Donner, dans une église, n&apos;est donc ni un droit d&apos;entrée
              ni une cotisation. C&apos;est la réponse libre de quelqu&apos;un
              qui a reçu, et qui souhaite que d&apos;autres reçoivent à leur
              tour.
            </p>
            <p>
              Un don n&apos;est jamais une condition pour être accueilli ici. Si
              vous ne donnez pas, vous êtes chez vous de la même manière. Si
              vous donnez, c&apos;est librement — et c&apos;est cette liberté
              qui donne au geste toute sa valeur.
            </p>
          </Prose>

          <ScriptureBlock
            variant="wide"
            className="mt-16"
            context="Ce que dit l'Écriture"
            text={verses.ouvrage.text}
            reference={verses.ouvrage.reference}
          />
        </>
      }
      body={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              À quoi cela sert
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Ce que le don soutient
            </h2>
            <p className="mt-6 max-w-[42ch] text-ccjv-ink-secondary">
              Voici les domaines que les dons servent dans la vie de
              l&apos;église. Aucun montant n&apos;est suggéré, aucun objectif
              chiffré n&apos;est fixé.
            </p>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <dl>
              {purposes.map((purpose, index) => (
                <div
                  key={purpose.title}
                  className="grid grid-cols-1 gap-3 border-t border-ccjv-line py-8 sm:grid-cols-12 sm:gap-6"
                >
                  <dt className="flex items-baseline gap-4 sm:col-span-5">
                    <span
                      className="font-serif text-[1.35rem] leading-none text-ccjv-green"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-[1.25rem] leading-snug">
                      {purpose.title}
                    </span>
                  </dt>
                  <dd className="text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary sm:col-span-7">
                    {purpose.text}
                  </dd>
                </div>
              ))}
            </dl>

            <ContentPending
              variant="inline"
              className="mt-8"
              what="Répartition des dons par poste"
              hint="Les postes détaillés et leur part respective, à fournir par CCJV, remplaceront cette présentation générale."
            />
          </div>
        </div>
      }
      deepening={
        <>
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Comment donner
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
                Les moyens disponibles aujourd&apos;hui
              </h2>
              <Prose className="mt-6" width="narrow">
                <p>
                  Aucun paiement en ligne n&apos;est ouvert pour le moment. Nous
                  préférons vous le dire clairement plutôt que d&apos;afficher
                  un bouton qui ne fonctionne pas encore.
                </p>
              </Prose>
              <div className="mt-7">
                <Button variant="primary" href={site.whatsappHref} external>
                  Écrire à l&apos;église
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <StepsList steps={ways} />
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 border-t border-ccjv-line pt-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Transparence
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
                Ce que nous ne pouvons pas encore afficher
              </h2>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <Prose width="narrow">
                <p>
                  Nous n&apos;affichons ni numéro de compte, ni montant
                  suggéré, ni répartition chiffrée : ces éléments ne nous ont
                  pas été communiqués par l&apos;église. Ils prendront place ici
                  le jour où ils seront arrêtés — l&apos;emplacement est
                  réservé, et il le restera tant qu&apos;il sera vide.
                </p>
                <p>
                  Ce que vous pouvez savoir dès maintenant : les dons ne
                  conditionnent aucune place dans l&apos;église, et toute
                  question sur leur usage peut être posée directement — par
                  WhatsApp ou sur place, lors d&apos;une célébration.
                </p>
              </Prose>

              <div className="mt-8 flex flex-col gap-6">
                <ContentPending
                  what="Coordonnées de don CCJV"
                  hint="Numéro de compte ou de mobile money, intitulé exact du bénéficiaire et moyens acceptés."
                />
                <ContentPending
                  what="Rapport d'usage des dons"
                  hint="Si CCJV souhaite publier un point périodique sur l'emploi des contributions, il prendra place ici."
                />
              </div>
            </div>
          </div>

          <div className="mt-16">
            <FeatureImage src={images.service} variant="wide" />
          </div>
        </>
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-8 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Poursuivre la découverte de l&apos;église
          </h2>
          <CrossLinks items={related} variant="list" />
        </>
      }
    />
  );
}
