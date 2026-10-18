"use client";

import { Button } from "@/components/ui/Button";
import {
  PublicSubmissionForm,
  readTextValue,
  type PublicSubmissionConfig,
  type SubmissionValues,
} from "@/components/forms/publicSubmission";
import { submitPublicPrayerRequest } from "@/lib/api";
import type { PrayerConfidentiality } from "@/lib/api";
import { site } from "@/data/site";

/**
 * Verset d'encouragement affiché après l'envoi d'une demande.
 *
 * Fourni par la page appelante, qui est un composant serveur et le lit depuis
 * l'API (`getScripture`). Aucun texte biblique n'est codé en dur ici : sans
 * verset configuré côté back-office, le bloc n'est simplement pas rendu.
 */
export interface PrayerRequestVerse {
  text: string;
  reference: string;
}

/**
 * Dépôt public d'une intention de prière.
 *
 * Même composant partagé que le témoignage, **configuration distincte** — et
 * aucun copier-coller du témoignage :
 * - le contrat métier de `POST /prayer-requests` ne connaît que
 *   `requestText`, `requesterName`, `requesterContact` et `confidentiality` ;
 * - il n'existe **aucun champ `isAnonymous`** : la case d'anonymat n'est donc
 *   pas configurée, conformément à `docs/030` et au schéma serveur ;
 * - la confidentialité est un choix fermé à deux valeurs, celui de l'enum
 *   PostgreSQL `prayer_confidentiality`, présélectionné sur `private` ;
 * - aucun consentement n'est demandé : le serveur n'en attend pas, et un champ
 *   inconnu serait refusé par le `z.strictObject` du schéma.
 *
 * La date de dépôt et l'identifiant sont générés côté serveur. Une demande
 * reçue n'est jamais publiée : les routes de lecture sont réservées à
 * l'administration.
 */

/** Valeurs acceptées par l'enum `prayer_confidentiality`. */
const CONFIDENTIALITY_VALUES: readonly PrayerConfidentiality[] = [
  "private",
  "community",
];

function toConfidentiality(value: string): PrayerConfidentiality {
  return CONFIDENTIALITY_VALUES.includes(value as PrayerConfidentiality)
    ? (value as PrayerConfidentiality)
    : "private";
}

const CONFIG: PublicSubmissionConfig = {
  id: "priere",
  title: "Confier une intention à l'équipe d'intercession",
  /** Variante « éditoriale » : grand titre et paragraphe à gauche. */
  visual: {
    kind: "editorial",
    eyebrow: "Intention de prière",
    intro:
      "Écrivez ce que vous traversez ou ce pour quoi vous souhaitez que nous priions. Quelques mots suffisent. Votre demande est transmise à l'équipe pastorale : elle n'est jamais publiée sur Internet ni sur les réseaux sociaux.",
  },

  fields: [
    // Nom et numéro partagent une ligne : deux champs courts côte à côte
    // gardent la section dans la hauteur de l'écran.
    {
      kind: "text",
      id: "requesterName",
      label: "Nom",
      hint: "Facultatif.",
      autoComplete: "given-name",
      maxLength: 120,
      width: "half",
    },
    {
      kind: "text",
      id: "requesterContact",
      label: "Numéro",
      hint: "Facultatif — pour un mot d'encouragement.",
      autoComplete: "tel",
      maxLength: 120,
      width: "half",
    },
    {
      kind: "textarea",
      id: "requestText",
      label: "Votre intention de prière",
      hint: "Soyez simple : une situation, un prénom, un besoin. Vous n'avez rien à expliquer longuement.",
      placeholder: "Écrivez votre demande ici…",
      rows: 5,
      required: true,
      maxLength: 1000,
      requiredMessage:
        "Merci d'écrire votre intention de prière avant de l'envoyer.",
    },
    {
      // Choix fermé du contrat métier (`prayer_confidentiality`) : conservé,
      // mais compacté sur une ligne pour ne pas allonger le formulaire.
      kind: "choice",
      id: "confidentiality",
      label: "Confidentialité de votre demande",
      orientation: "inline",
      options: [
        { value: "private", label: "Confidentiel" },
        { value: "community", label: "Porter en assemblée" },
      ],
      defaultValue: "private",
    },
  ],

  submitLabel: "Transmettre ma demande de prière",
  submittingLabel: "Transmission en cours…",

  success: {
    title: "Votre demande a bien été reçue",
    message:
      "Merci de nous accorder votre confiance. Votre intention est enregistrée et sera portée dans la prière par l'équipe d'intercession. Elle ne sera ni publiée sur Internet ni diffusée sur les réseaux sociaux.",
    resetLabel: "Déposer une autre demande",
  },

  errorMessages: {
    generic:
      "Votre demande n'a pas pu être transmise. Vérifiez votre connexion, puis réessayez : ce que vous avez écrit est conservé.",
    rateLimited:
      "Trop de demandes ont été envoyées depuis cette connexion. Merci de réessayer dans une heure — ou de nous écrire directement sur WhatsApp.",
  },

  submit: async (values) => {
    const name = readTextValue(values, "requesterName").trim();
    const contact = readTextValue(values, "requesterContact").trim();

    await submitPublicPrayerRequest({
      requestText: readTextValue(values, "requestText").trim(),
      confidentiality: toConfidentiality(
        readTextValue(values, "confidentiality"),
      ),
      // Le schéma serveur refuse `null` sur ces deux champs facultatifs :
      // ils sont omis tant qu'ils sont vides.
      ...(name ? { requesterName: name } : {}),
      ...(contact ? { requesterContact: contact } : {}),
    });
  },
};

/** Lien WhatsApp pré-rempli, seconde voie de contact pour le visiteur. */
function whatsappHref(values: SubmissionValues): string {
  const name = readTextValue(values, "requesterName").trim();
  const request = readTextValue(values, "requestText").trim();

  const lines = [
    "Bonjour Centre Chrétien Jésus ma Vie,",
    "Je souhaite vous confier une intention de prière :",
    "",
  ];
  if (name) lines.push(`De la part de : ${name}`);
  lines.push(
    request
      ? `Demande : ${request}`
      : "Je préfère vous écrire directement ici.",
  );

  return `${site.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function PrayerRequestForm({
  verse = null,
  className,
}: {
  verse?: PrayerRequestVerse | null;
  className?: string;
}) {
  const renderSuccessExtra = (values: SubmissionValues) => (
    <div className="flex flex-col items-start gap-5">
      {verse && (
        <blockquote className="max-w-[44ch] border-l-2 border-ccjv-green pl-5">
          <p className="font-serif text-[1.05rem] leading-[1.65] italic text-ccjv-ink">
            «&nbsp;{verse.text}&nbsp;»
          </p>
          <footer className="mt-2 font-sans text-[0.75rem] font-semibold tracking-[0.12em] text-ccjv-ink-secondary uppercase">
            {verse.reference}
          </footer>
        </blockquote>
      )}

      <Button variant="ghost" size="md" href={whatsappHref(values)} external>
        Nous écrire
      </Button>
    </div>
  );

  return (
    <PublicSubmissionForm
      config={CONFIG}
      className={className}
      renderSuccessExtra={renderSuccessExtra}
    />
  );
}
