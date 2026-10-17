import { PageHeader } from "./PageHeader";
import { Section } from "./Section";
import { VerseSection } from "./VerseSection";
import { getScripture } from "@/lib/api";
/*
 * `readOrUnavailable` n'est pas réexporté par le barrel `@/lib/api` ; il est
 * importé depuis son module d'origine plutôt que de modifier un fichier hors
 * périmètre. C'est le même client, aucune couche parallèle.
 */
import { readOrUnavailable } from "@/lib/api/endpoints";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

/**
 * Gabarit commun des pages transversales (mentions, confidentialité,
 * conditions, accessibilité) : lecture longue, sobre et aérée.
 *
 * Composant **serveur** : le verset de clôture est lu depuis l'API
 * (`getScripture("parole")`), jamais codé en dur. Si la lecture échoue ou si le
 * verset n'est pas configuré côté back-office, la section est simplement omise —
 * aucun texte biblique de remplacement n'est inventé.
 */
export async function LegalPage({
  overline,
  title,
  description,
  sections,
  updatedAt,
}: {
  overline: string;
  title: string;
  description: string;
  sections: LegalSection[];
  updatedAt: string;
}) {
  const resultat = await readOrUnavailable((o) => getScripture("parole", o));
  const verset = resultat.status === "ok" ? resultat.data : null;

  return (
    <>
      <PageHeader
        overline={overline}
        title={title}
        description={description}
      />

      <Section>
        <div className="mx-auto max-w-[62rem]">
          <p className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">
            Dernière mise à jour : {updatedAt}
          </p>

          <div className="mt-12 flex flex-col gap-12">
            {sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`sec-${index}`}>
                <h2
                  id={`sec-${index}`}
                  className="font-serif text-[1.35rem] leading-snug"
                >
                  {section.title}
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="max-w-[70ch] text-[1rem] leading-[1.75] text-ccjv-ink-secondary"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>

      {verset && (
        <VerseSection
          context="Marcher dans la vérité"
          text={verset.text}
          reference={verset.reference}
          tone="dark"
        />
      )}
    </>
  );
}
