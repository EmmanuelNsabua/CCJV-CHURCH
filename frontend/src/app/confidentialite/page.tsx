import { LegalPage } from "@/components/shared/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Confidentialité",
  description:
    "Politique de confidentialité du site du Centre Chrétien Jésus ma Vie : quelles données sont collectées et comment elles sont utilisées.",
  path: "/confidentialite",
});

export default function ConfidentialitePage() {
  return (
    <LegalPage
      overline="Informations légales"
      title="Politique de confidentialité"
      description="Nous collectons le strict minimum, et uniquement ce qui sert à vous accueillir."
      updatedAt="Septembre 2026"
      sections={[
        {
          title: "Principe général",
          paragraphs: [
            "Le site public du Centre Chrétien Jésus ma Vie est conçu pour être consulté librement, sans création de compte et sans collecte de données superflues.",
            "Aucun espace membre, aucune inscription et aucun paiement en ligne ne sont proposés à ce jour.",
          ],
        },
        {
          title: "Données susceptible d'être traitées",
          paragraphs: [
            "Si vous nous contactez par WhatsApp ou par nos réseaux sociaux, les informations que vous transmettez volontairement (nom, message, demande de prière) sont utilisées uniquement pour vous répondre.",
            "Les demandes de prière sont traitées de manière confidentielle par l'équipe concernée et ne sont pas publiées sans votre accord explicite.",
          ],
        },
        {
          title: "Mesure d'audience et cookies",
          paragraphs: [
            "Aucun cookie publicitaire ni traceur tiers n'est déposé sur ce site en dehors des cookies techniques strictement nécessaires à son fonctionnement.",
            "Les vidéos sont hébergées sur des plateformes externes : la consultation d'une vidéo vous conduit sur le site de cette plateforme, soumise à sa propre politique de confidentialité.",
          ],
        },
        {
          title: "Témoignages et photographies",
          paragraphs: [
            "Les témoignages et les photographies de personnes ne sont publiés qu'avec leur accord préalable.",
            "Toute personne peut demander le retrait d'un contenu la concernant en nous contactant.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            "Vous pouvez demander à consulter, corriger ou supprimer les informations vous concernant en nous écrivant.",
          ],
        },
      ]}
    />
  );
}
