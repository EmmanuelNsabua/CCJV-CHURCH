import { LegalPage } from "@/components/shared/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conditions d'utilisation",
  description:
    "Conditions d'utilisation du site du Centre Chrétien Jésus ma Vie (CCJV).",
  path: "/conditions",
});

export default function ConditionsPage() {
  return (
    <LegalPage
      overline="Informations légales"
      title="Conditions d'utilisation"
      description="Les règles simples qui encadrent l'usage de ce site."
      updatedAt="Septembre 2026"
      sections={[
        {
          title: "Objet du site",
          paragraphs: [
            "Ce site a pour objet de présenter le Centre Chrétien Jésus ma Vie, ses activités, ses enseignements et ses informations pratiques.",
            "Il ne constitue ni un espace membre, ni un service d'adhésion, ni une plateforme de paiement.",
          ],
        },
        {
          title: "Usage autorisé",
          paragraphs: [
            "Vous pouvez consulter, partager et citer les contenus du site à des fins personnelles ou non commerciales, en mentionnant leur source.",
            "Toute utilisation commerciale, toute reproduction intégrale ou toute modification des contenus requiert une autorisation écrite.",
          ],
        },
        {
          title: "Contenus et liens externes",
          paragraphs: [
            "Les vidéos d'enseignement sont hébergées sur des plateformes externes. Nous ne maîtrisons ni leur disponibilité ni les recommandations qu'elles affichent.",
            "Les liens externes sont fournis pour votre commodité et n'impliquent aucune approbation de leur contenu.",
          ],
        },
        {
          title: "Exactitude des informations",
          paragraphs: [
            "Les informations pratiques (horaires, lieux, programmes) sont publiées de bonne foi et peuvent évoluer. En cas de doute, contactez-nous directement.",
          ],
        },
      ]}
    />
  );
}
