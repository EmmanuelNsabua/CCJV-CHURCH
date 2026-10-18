"use client";

import { submitPublicTestimony } from "@/lib/api";
import { images } from "@/data/images";
import {
  ANONYMITY_VALUE_KEY,
  CONSENT_VALUE_KEY,
  PublicSubmissionForm,
  readBooleanValue,
  readTextValue,
  type PublicSubmissionConfig,
} from "@/components/forms/publicSubmission";

/**
 * Dépôt public d'un témoignage.
 *
 * Ce module n'est plus un formulaire : c'est la **configuration** du formulaire
 * public partagé pour ce contrat métier précis. Toute la présentation et les
 * interactions communes (champs, focus, chargement, retours) vivent dans
 * `PublicSubmissionForm`.
 *
 * Contrat métier repris de `POST /testimonies/submit` :
 * - `content` obligatoire, de 10 à 5 000 caractères (le serveur applique les
 *   mêmes bornes) ;
 * - `authorName` **facultatif**, 120 caractères au plus ;
 * - `isAnonymous` explicite, décoché par défaut ;
 * - `consent` **obligatoire** : le serveur refuse une soumission sans
 *   consentement, et horodate cet accord de son côté ;
 * - `photoMediaId` non exposé : le formulaire public actuel ne propose pas de
 *   photo, et aucun mécanisme de téléversement public n'existe pour ce flux.
 *   L'ajouter relèverait d'un lot distinct (validation et stockage dédiés).
 *
 * La date de dépôt n'est jamais transmise : elle est générée par le serveur.
 * Une soumission réussie ne vaut pas publication — elle crée un témoignage à
 * l'état `PENDING`, soumis à modération.
 */

/**
 * Unique option de confidentialité du témoignage.
 *
 * Aucun sélecteur de visibilité, aucun bouton radio « nom public / privé / limité » :
 * une seule case, décochée par défaut, qui demande le dépôt anonyme.
 */
const ANONYMITY_LABEL =
  "Je souhaite que ce témoignage reste anonyme lors de sa publication";

const CONSENT_LABEL =
  "J'autorise l'équipe pastorale du Centre Chrétien Jésus ma Vie à modérer et éventuellement publier ce témoignage pour l'édification publique des fidèles.";

const CONFIG: PublicSubmissionConfig = {
  id: "temoignage",
  title: "Partager ce que Dieu a fait",
  /**
   * Variante « image » : photographie avec le titre posé en bas, sans
   * paragraphe — la section vit d'elle-même, sans texte d'introduction.
   */
  visual: {
    kind: "image",
    image: {
      // Visuel non utilisé ailleurs sur /communaute (la section « Fraternité »
      // emploie déjà `ccjv-35`) : un même portrait ne doit pas servir deux fois
      // sur une même page.
      src: images.portraitLarge,
      alt: "Vie communautaire au Centre Chrétien Jésus ma Vie",
    },
  },

  fields: [
    {
      kind: "text",
      id: "authorName",
      label: "Votre nom ou votre prénom",
      hint: "Facultatif. Laissez vide si vous préférez ne pas signer.",
      autoComplete: "name",
      maxLength: 120,
      placeholder: "Ex. Sœur Dorcas",
    },
    {
      kind: "textarea",
      id: "content",
      label: "Votre témoignage",
      hint: "Quelques phrases suffisent. Écrivez simplement ce que le Seigneur a accompli dans votre vie.",
      placeholder:
        "Racontez ce que vous avez vécu : le contexte, ce qui a changé, ce que vous voulez partager à l'assemblée…",
      rows: 8,
      required: true,
      minLength: 10,
      maxLength: 5000,
      requiredMessage:
        "Merci d'écrire votre témoignage avant de l'envoyer.",
    },
  ],

  anonymity: {
    label: ANONYMITY_LABEL,
    // Le nom est masqué et vidé tant que l'anonymat est demandé : ce qui reste
    // à l'écran correspond exactement à ce qui sera transmis.
    hidesFields: ["authorName"],
  },

  consent: {
    label: CONSENT_LABEL,
    required: true,
    errorMessage:
      "Merci de cocher cette autorisation : sans elle, l'équipe pastorale ne peut pas examiner votre témoignage.",
  },

  submitLabel: "Transmettre mon témoignage",
  submittingLabel: "Transmission en cours…",

  success: {
    title: "Votre témoignage nous est parvenu",
    message:
      "Merci de nous avoir confié ce que Dieu a fait pour vous. Votre récit a bien été reçu ; il sera lu et examiné par l'équipe pastorale, puis publié sur le site si elle le juge utile à l'édification de l'assemblée. Sa mise en ligne n'est donc pas immédiate.",
    resetLabel: "Partager un autre témoignage",
  },

  errorMessages: {
    generic:
      "Votre témoignage n'a pas pu être transmis. Vérifiez votre connexion, puis réessayez : vos réponses sont conservées.",
  },

  submit: async (values) => {
    const isAnonymous = readBooleanValue(values, ANONYMITY_VALUE_KEY);
    const authorName = readTextValue(values, "authorName").trim();

    await submitPublicTestimony({
      // Un dépôt anonyme ne porte aucune identité, même si un nom avait été
      // saisi avant de cocher la case.
      authorName: isAnonymous ? null : authorName || null,
      content: readTextValue(values, "content").trim(),
      isAnonymous,
      consent: readBooleanValue(values, CONSENT_VALUE_KEY),
    });
  },
};

export function PublicTestimonyForm({ className }: { className?: string }) {
  return <PublicSubmissionForm config={CONFIG} className={className} />;
}
