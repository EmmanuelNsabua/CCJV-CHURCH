import { LegalPage } from "@/components/shared/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mentions légales",
  description:
    "Mentions légales du site du Centre Chrétien Jésus ma Vie (CCJV), Lubumbashi, République démocratique du Congo.",
  path: "/mentions-legales",
});

/**
 * ⚠️ Contenu de démonstration : les informations d'éditeur et d'hébergeur
 * doivent être complétées et vérifiées par CCJV avant mise en production.
 */
export default function MentionsLegalesPage() {
  return (
    <LegalPage
      overline="Informations légales"
      title="Mentions légales"
      description="Informations relatives à l'éditeur du site et à son hébergement."
      updatedAt="Septembre 2026"
      sections={[
        {
          title: "Éditeur du site",
          paragraphs: [
            "Le présent site est édité par le Centre Chrétien Jésus ma Vie (CCJV), église locale établie à Lubumbashi, en République démocratique du Congo.",
            "Adresse : information à compléter. Contact : information à compléter.",
            "Le contenu éditorial du site est produit et validé par la direction de l'église.",
          ],
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Le site public est hébergé sur une infrastructure cloud (frontend et API séparés).",
            "Les coordonnées précises de l'hébergeur seront complétées avant la mise en production.",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "Les textes, photographies et éléments graphiques présents sur ce site sont la propriété du Centre Chrétien Jésus ma Vie, sauf mention contraire.",
            "Toute reproduction sans autorisation écrite est interdite.",
          ],
        },
        {
          title: "Signalement",
          paragraphs: [
            "Pour signaler une erreur, un contenu inapproprié ou un problème d'accessibilité, vous pouvez nous écrire directement depuis la page Contact.",
          ],
        },
      ]}
    />
  );
}
