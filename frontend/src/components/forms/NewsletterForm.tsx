"use client";

import { Button } from "@/components/ui/Button";
import { images } from "@/data/images";
import {
  PublicSubmissionForm,
  readTextValue,
  type PublicSubmissionConfig,
  type SubmissionValues,
} from "@/components/forms/publicSubmission";

/** Expression régulière de contrôle du format d'adresse électronique. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Configuration déclarative du formulaire d'abonnement à la newsletter.
 *
 * Repose intégralement sur l'architecture partagée `PublicSubmissionForm`
 * (accessibilité WCAG 2.2 AA, contrôles natifs stylisés, retours d'état).
 */
const CONFIG: PublicSubmissionConfig = {
  id: "newsletter",
  title: "S'abonner à la lettre pastorale & aux nouvelles",
  visual: {
    kind: "image",
    eyebrow: "Lettre pastorale & Nouvelles",
    image: {
      src: images.assemblee || "/media/ccjv-09.jpeg",
      alt: "Assemblée du Centre Chrétien Jésus ma Vie réunie en adoration et prière",
    },
  },
  fields: [
    {
      kind: "text",
      id: "firstName",
      label: "Prénom",
      hint: "Facultatif.",
      placeholder: "Ex. Rachel",
      autoComplete: "given-name",
      maxLength: 80,
      width: "half",
    },
    {
      kind: "text",
      id: "lastName",
      label: "Nom de famille",
      hint: "Facultatif.",
      placeholder: "Ex. Kabongo",
      autoComplete: "family-name",
      maxLength: 80,
      width: "half",
    },
    {
      kind: "text",
      inputType: "email",
      id: "email",
      label: "Adresse e-mail",
      hint: "Obligatoire. Nous ne transmettons jamais votre adresse à des tiers.",
      placeholder: "votre.adresse@domaine.cd",
      autoComplete: "email",
      required: true,
      requiredMessage: "Merci d'indiquer votre adresse e-mail.",
      maxLength: 150,
      width: "full",
    },
    {
      kind: "choice",
      id: "preference",
      label: "Vos préférences de réception",
      hint: "Vous pouvez ajuster ce choix ou vous désinscrire à tout moment.",
      defaultValue: "all",
      orientation: "vertical",
      options: [
        {
          value: "all",
          label: "Toutes les parutions (Recommandé)",
          description:
            "Enseignements dominicaux, méditations pastorales, actualités et grands rendez-vous de l'église.",
        },
        {
          value: "teachings",
          label: "Enseignements & Méditations",
          description:
            "Uniquement les résumés des prédications et les réflexions spirituelles.",
        },
        {
          value: "events",
          label: "Vie de l'Église & Événements",
          description:
            "Uniquement l'agenda des cultes spéciaux, conférences, veillées et programmes des départements.",
        },
      ],
    },
  ],
  consent: {
    label:
      "J'accepte de recevoir les communications électroniques d'édification et d'information du Centre Chrétien Jésus ma Vie. Je pourrai me désinscrire à tout moment par le lien figurant au bas de chaque courriel.",
    required: true,
    errorMessage:
      "Veuillez cocher cette case pour valider votre consentement à recevoir nos courriels.",
  },
  submitLabel: "Confirmer mon inscription",
  submittingLabel: "Enregistrement en cours…",
  success: {
    title: "Bienvenue dans notre lettre pastorale",
    message:
      "Votre inscription a bien été enregistrée. Vous recevrez prochainement nos prédications, méditations et annonces fraternelles. Pensez à vérifier votre dossier d'indésirables ou spams lors de la première réception.",
    resetLabel: "Inscrire une autre adresse",
  },
  errorMessages: {
    generic:
      "L'enregistrement de votre inscription n'a pas pu aboutir. Vérifiez votre connexion et réessayez.",
  },
  validate: (values: SubmissionValues) => {
    const email = readTextValue(values, "email").trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return {
        fieldErrors: {
          email:
            "Veuillez renseigner une adresse e-mail valide (ex. prenom.nom@domaine.cd).",
        },
      };
    }
    return {};
  },
  submit: async (values: SubmissionValues) => {
    const email = readTextValue(values, "email").trim();
    const firstName = readTextValue(values, "firstName").trim();
    const lastName = readTextValue(values, "lastName").trim();
    const preference = readTextValue(values, "preference");

    // Simulation de réseau réaliste
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          localStorage.getItem("ccjv_newsletter_subscribers") || "[]",
        );
        stored.push({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          preference,
          subscribedAt: new Date().toISOString(),
        });
        localStorage.setItem(
          "ccjv_newsletter_subscribers",
          JSON.stringify(stored),
        );
      } catch {
        // Quota ou mode navigation privée restreint : sans blocage
      }
    }
  },
};

export interface NewsletterFormProps {
  readonly className?: string;
}

/**
 * Composant de formulaire public d'abonnement à la lettre pastorale CCJV.
 */
export function NewsletterForm({ className }: NewsletterFormProps) {
  return (
    <PublicSubmissionForm
      config={CONFIG}
      className={className}
      renderSuccessExtra={() => (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="outline" size="sm" href="/publications/actualites">
            Consulter les actualités
          </Button>
          <Button variant="outline" size="sm" href="/publications/enseignements">
            Écouter les enseignements
          </Button>
        </div>
      )}
    />
  );
}
