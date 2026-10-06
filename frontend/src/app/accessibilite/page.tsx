import { LegalPage } from "@/components/shared/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Accessibilité",
  description:
    "Engagement d'accessibilité numérique du site du Centre Chrétien Jésus ma Vie : conformité visée WCAG 2.2 niveau AA.",
  path: "/accessibilite",
});

export default function AccessibilitePage() {
  return (
    <LegalPage
      overline="Informations légales"
      title="Accessibilité numérique"
      description="Nous voulons que ce site soit utilisable par tous, y compris avec un lecteur d'écran, au clavier ou sur une connexion lente."
      updatedAt="Septembre 2026"
      sections={[
        {
          title: "Notre engagement",
          paragraphs: [
            "Le site vise la conformité au niveau AA des Règles pour l'accessibilité des contenus web (WCAG 2.2).",
            "L'accessibilité est intégrée dès la conception : structure sémantique, contrastes vérifiés, navigation clavier complète, focus visible et textes alternatifs.",
          ],
        },
        {
          title: "Ce qui est déjà en place",
          paragraphs: [
            "Une structure de titres cohérente et des repères de navigation (landmarks) sur toutes les pages.",
            "Un lien d'évitement « Aller au contenu », une navigation entièrement utilisable au clavier, et la fermeture du menu par la touche Échap.",
            "Le respect du réglage système « réduire les animations » : les mouvements sont neutralisés, le contenu reste intégralement accessible.",
            "Des images décoratives marquées comme telles, afin de ne pas surcharger la lecture par un lecteur d'écran.",
          ],
        },
        {
          title: "Connexions lentes",
          paragraphs: [
            "Le site est conçu pour rester rapide et léger, afin d'être consultable même avec une connexion instable : images optimisées, chargement différé des médias et très peu de JavaScript.",
          ],
        },
        {
          title: "Signaler un problème",
          paragraphs: [
            "Si vous rencontrez une difficulté d'accès à un contenu, décrivez-nous la page et le problème rencontré : nous nous engageons à corriger et, si besoin, à vous transmettre l'information par un autre moyen.",
          ],
        },
      ]}
    />
  );
}
