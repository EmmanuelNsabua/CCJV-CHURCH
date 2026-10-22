/**
 * Contrat de configuration du formulaire public partagé.
 *
 * Un dépôt public (témoignage, intention de prière, et tout autre formulaire
 * éditorial à venir) est décrit par une `PublicSubmissionConfig` : une valeur
 * **déclarative, typée et sans JSX**, lue par `PublicSubmissionForm`.
 *
 * Conséquence directe : le composant partagé ne connaît **aucune** règle
 * métier. Il ne contient nulle part `if (type === "testimony")` — chaque usage
 * fournit sa configuration, ses règles de validation et son service de
 * soumission. Ajouter un troisième formulaire ne demande donc aucune
 * modification du moteur d'affichage : uniquement une configuration de plus.
 *
 * Ce que le contrat décrit :
 * - le panneau visuel de la section : grand titre + introduction, ou
 *   photographie + titre posé en bas (deux variantes explicites) ;
 * - la liste **ordonnée** des champs et leurs contraintes de saisie ;
 * - la case d'anonymat (facultative, propre à la configuration qui la déclare) ;
 * - la case de consentement (facultative, obligatoire si le contrat métier
 *   l'exige) ;
 * - les libellés d'action et les messages de retour (succès, erreur) ;
 * - les règles de validation métier non exprimables de façon déclarative ;
 * - la fonction de soumission (service ou endpoint réel de l'usage).
 *
 * Ce que le contrat ne décrit **pas** : la mise en page, les états de
 * chargement, la gestion du focus, les annonces lecteur d'écran. Ce sont des
 * responsabilités du composant, donc écrites une seule fois.
 */

/** Valeur d'un contrôle de formulaire public. */
export type SubmissionValue = string | boolean;

/** Ensemble des valeurs saisies, indexé par identifiant de champ. */
export type SubmissionValues = Readonly<Record<string, SubmissionValue>>;

/** Messages d'erreur indexés par identifiant de champ. */
export type SubmissionFieldErrors = Readonly<Record<string, string>>;

/**
 * Clé réservée : état de la case d'anonymat.
 *
 * Les configurations qui déclarent `anonymity` retrouvent ce booléen dans les
 * valeurs transmises à `submit`, sans avoir à connaître un nom de champ local.
 */
export const ANONYMITY_VALUE_KEY = "isAnonymous";

/**
 * Clé réservée : état de la case de consentement.
 *
 * Uniquement présente dans les valeurs lorsqu'une `consent` est configurée.
 */
export const CONSENT_VALUE_KEY = "consent";

/**
 * Propriétés communes à tous les champs déclaratifs.
 *
 * `width` ne décrit qu'une mise en page : deux champs `"half"` **consécutifs**
 * partagent une même ligne, ce qui évite de faire grandir le formulaire en
 * hauteur sans raison (nom et numéro, par exemple).
 */
interface BaseFieldConfig {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly required?: boolean;
  /** Message affiché lorsque le champ obligatoire est vide. */
  readonly requiredMessage?: string;
  /** Largeur dans la colonne de saisie : pleine par défaut. */
  readonly width?: "full" | "half";
}

/** Contrôle texte sur une seule ligne. */
export interface TextFieldConfig extends BaseFieldConfig {
  readonly kind: "text";
  /** Type HTML natif de l'input (text par défaut, email, tel). */
  readonly inputType?: "text" | "email" | "tel";
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
}

/** Zone de saisie multiligne (récit, intention…). */
export interface TextareaFieldConfig extends BaseFieldConfig {
  readonly kind: "textarea";
  readonly placeholder?: string;
  /** Hauteur de départ en lignes ; le champ reste redimensionnable. */
  readonly rows?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
}

/** Option d'un groupe de boutons radio. */
export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

/**
 * Groupe de choix exclusif (boutons radio natifs).
 *
 * Sert aux contrats métier qui portent un véritable choix fermé — par exemple
 * la confidentialité d'une intention de prière. Le formulaire de témoignage,
 * lui, n'expose **pas** de sélecteur de visibilité : son unique option de
 * confidentialité est la case d'anonymat.
 */
export interface ChoiceFieldConfig extends BaseFieldConfig {
  readonly kind: "choice";
  readonly options: readonly ChoiceOption[];
  /** Valeur présélectionnée ; à défaut, la première option. */
  readonly defaultValue?: string;
  /**
   * Disposition des options : empilées (défaut) ou côte à côte sur une ligne.
   * `"inline"` garde un formulaire compact quand les libellés sont courts.
   */
  readonly orientation?: "vertical" | "inline";
}

/** Champ déclaratif : mêmes contrôles de base pour tous les usages. */
export type PublicFieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | ChoiceFieldConfig;

/**
 * Case d'anonymat, **propre à la configuration qui la déclare**.
 *
 * Elle n'est jamais affichée par défaut : le formulaire de prière ne la déclare
 * pas, conformément à son contrat métier (aucun champ `isAnonymous` côté API).
 */
export interface AnonymityConfig {
  readonly label: string;
  readonly hint?: string;
  /**
   * Champs masqués **et vidés** tant que l'anonymat est demandé.
   *
   * Le nom saisi avant de cocher la case est effacé : ce qui est affiché
   * correspond exactement à ce qui sera transmis, et aucune identité résiduelle
   * ne peut être déposée par inadvertance.
   */
  readonly hidesFields?: readonly string[];
}

/** Case de consentement obligatoire, lorsqu'un contrat métier l'impose. */
export interface ConsentConfig {
  readonly label: string;
  /** Décochée par défaut ; obligatoire sauf mention contraire explicite. */
  readonly required?: boolean;
  readonly errorMessage?: string;
}

/** Panneau de confirmation affiché après une soumission réussie. */
export interface SuccessConfig {
  readonly title: string;
  /** Doit distinguer la **réception** de la publication effective. */
  readonly message: string;
  readonly resetLabel: string;
}

/**
 * Messages d'erreur technique.
 *
 * Aucun message brut du serveur n'est affiché : le formulaire ne relaie jamais
 * un détail interne, une trace ou un secret (cahier §19).
 */
export interface ErrorMessagesConfig {
  readonly generic: string;
  /** Cas particulier du plafond anti-abus (`429 RATE_LIMITED`). */
  readonly rateLimited?: string;
}

/** Résultat d'une validation métier complémentaire. */
export interface ValidationOutcome {
  readonly fieldErrors?: SubmissionFieldErrors;
  /** Message global (recoupement de champs, règle transverse…). */
  readonly formError?: string;
}

/**
 * Panneau visuel de la colonne gauche — deux variantes explicites.
 *
 * - `"editorial"` : sur-titre, grand titre et paragraphe d'introduction. C'est
 *   la variante du dépôt d'intention de prière.
 * - `"image"` : une photographie avec le titre posé **en bas**, et **aucun**
 *   paragraphe. C'est la variante du dépôt de témoignage.
 *
 * Le titre reste porté par la configuration (`title`) dans les deux cas : c'est
 * lui qui nomme le formulaire pour les lecteurs d'écran.
 */
export type SubmissionVisualConfig =
  | {
      readonly kind: "editorial";
      /** Sur-titre au-dessus du grand titre. */
      readonly eyebrow?: string;
      /** Paragraphe d'introduction sous le titre. */
      readonly intro: string;
    }
  | {
      readonly kind: "image";
      /** Sur-titre posé au-dessus du titre, sur le voile de l'image. */
      readonly eyebrow?: string;
      /** Visuel de la colonne gauche. */
      readonly image: { readonly src: string; readonly alt: string };
    };

/** Configuration complète d'un formulaire public. */
export interface PublicSubmissionConfig {
  /**
   * Préfixe des identifiants DOM de l'instance (`id`, `for`, `aria-*`).
   *
   * Il doit rester distinct des identifiants déjà portés par la page hôte. Le
   * titre du formulaire est lui-même identifié `${id}-form-titre` — et non
   * `${id}-titre` — pour ne pas heurter l'`aria-labelledby` d'une autre section
   * (par exemple le titre de rubrique `<h2 id="priere-titre">`).
   */
  readonly id: string;
  /** Grand titre de la section ; nomme aussi le formulaire. */
  readonly title: string;
  /** Variante du panneau de gauche (titre + paragraphe, ou image + titre). */
  readonly visual: SubmissionVisualConfig;
  /**
   * Champs dans l'ordre d'affichage. Une colonne unique ; deux champs
   * `width: "half"` consécutifs partagent la même ligne.
   */
  readonly fields: readonly PublicFieldConfig[];
  readonly anonymity?: AnonymityConfig;
  readonly consent?: ConsentConfig;
  readonly submitLabel: string;
  readonly submittingLabel: string;
  readonly success: SuccessConfig;
  readonly errorMessages: ErrorMessagesConfig;
  /**
   * Règles métier non exprimables par la configuration déclarative.
   *
   * Les contraintes courantes (`required`, `minLength`, `maxLength`, choix
   * exclusif) sont déjà prises en charge : ce crochet ne sert qu'aux règles de
   * recoupement. Le serveur reste l'autorité finale.
   */
  readonly validate?: (values: SubmissionValues) => ValidationOutcome;
  /**
   * Soumission réelle : service ou endpoint existant de l'usage.
   *
   * Toute anomalie doit être propagée (échec) ; le formulaire se charge de la
   * présentation et de la conservation des données saisies.
   */
  readonly submit: (values: SubmissionValues) => Promise<void>;
}

/** Lecture typée d'une valeur texte (chaîne vide si le champ est booléen). */
export function readTextValue(
  values: SubmissionValues,
  key: string,
): string {
  const value = values[key];
  return typeof value === "string" ? value : "";
}

/** Lecture typée d'une valeur booléenne (case à cocher). */
export function readBooleanValue(
  values: SubmissionValues,
  key: string,
): boolean {
  return values[key] === true;
}
