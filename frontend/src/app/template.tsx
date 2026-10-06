/**
 * Transition de navigation (§35).
 *
 * Un `template.tsx` est re-monté par Next.js à chaque changement de route :
 * l'animation d'entrée est donc rejouée naturellement, sans JavaScript
 * supplémentaire ni surveillance d'événements de navigation.
 *
 * Le langage reste commun (fondu + léger déplacement) et s'appuie sur le même
 * temps/easing que l'introduction — voir `.page-enter` dans `globals.css`.
 */
export default function Template({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="page-enter">{children}</div>;
}
