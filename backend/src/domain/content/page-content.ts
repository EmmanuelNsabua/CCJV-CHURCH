import { z, type ZodType } from "zod";
import { accueilContentSchema } from "./pages/accueil";
import { quiSommesNousContentSchema } from "./pages/qui-sommes-nous";
import { evenementsContentSchema } from "./pages/evenements";
import { ouNousTrouverContentSchema } from "./pages/ou-nous-trouver";
import { faireUnDonContentSchema } from "./pages/faire-un-don";
import { communauteContentSchema } from "./pages/communaute";
import { organisationContentSchema } from "./pages/organisation";
import { departementContentSchema } from "./pages/departement";

/**
 * Registre des contenus éditables — **un contrat par `pageKey`**.
 *
 * `public.static_pages.content` est un `jsonb` : sans registre, n'importe quelle
 * forme pourrait y être écrite et le frontend se retrouverait avec un contenu
 * qu'il ne sait pas lire. Le registre est donc la source de vérité, et il porte
 * **deux comportements opposés, volontairement asymétriques** :
 *
 * - **à l'écriture**, il est strict : toute clé non reconnue est refusée
 *   (`docs/031` §3.4) ;
 * - **à la lecture**, il ne lève jamais : une ligne écrite sous un ancien
 *   contrat, ou altérée, produit un contenu partiel — jamais une erreur
 *   (`docs/031` §3.5 règle C, « tolérance de lecture obligatoire »).
 *
 * ### Pourquoi huit clés, et pas celles dont on se souvient
 *
 * `docs/031` §3.5 règle D est explicite : « Les huit `pageKey` de ce document
 * sont **la liste complète**. Ajouter une page, une section ou un champ
 * obligatoire est un acte de Phase 6, pas une extension silencieuse. » Le
 * registre précédent en déclarait six **autres** (`vie-de-leglise`,
 * `publications`…) — des clés qui ne correspondent à aucune fiche de `docs/031`,
 * et qui laissaient donc hors contrat des pages réellement servies. Le gel du
 * registre est ce qui empêche cette dérive de recommencer : la liste est ici, en
 * un seul endroit, et un test la compare au document.
 *
 * Ce que le registre ne contient pas, et ne contiendra jamais : listes
 * dynamiques (événements, publications, départements, versets), ordre des
 * sections, mise en page, HTML. Ces éléments ont leurs propres tables ou
 * appartiennent au code (`docs/031` §5, D-23).
 */
export const PAGE_CONTENT_CONTRACTS = {
  accueil: accueilContentSchema,
  "qui-sommes-nous": quiSommesNousContentSchema,
  evenements: evenementsContentSchema,
  "ou-nous-trouver": ouNousTrouverContentSchema,
  "faire-un-don": faireUnDonContentSchema,
  communaute: communauteContentSchema,
  organisation: organisationContentSchema,
  departement: departementContentSchema,
} as const;

/** Clé éditable — l'union fermée des huit pages de `docs/031`. */
export type KnownPageKey = keyof typeof PAGE_CONTENT_CONTRACTS;

/** Clés éditables, dans l'ordre de `docs/031` §3.2 (utile au back-office). */
export const knownPageKeys: readonly KnownPageKey[] = Object.keys(
  PAGE_CONTENT_CONTRACTS,
) as KnownPageKey[];

/**
 * `Object.hasOwn` plutôt qu'un simple accès : sans cela, une clé héritée du
 * prototype (`toString`, `constructor`…) serait considérée comme connue.
 */
export function isKnownPageKey(pageKey: string): pageKey is KnownPageKey {
  return Object.hasOwn(PAGE_CONTENT_CONTRACTS, pageKey);
}

/**
 * Contrat d'une page, ou `undefined` si la clé n'est pas éditable.
 *
 * `noUncheckedIndexedAccess` rend l'accès indexé faillible : c'est exactement le
 * comportement voulu ici, une clé inconnue n'a pas de contrat.
 */
export function getPageContentSchema(pageKey: string): ZodType | undefined {
  return isKnownPageKey(pageKey) ? PAGE_CONTENT_CONTRACTS[pageKey] : undefined;
}

/* -------------------------------------------------------------------------- */
/*  Lecture tolérante                                                         */
/* -------------------------------------------------------------------------- */

/** Contenu relu, prêt à être servi — jamais une erreur, jamais une exception. */
export type ReadPageContent = Record<string, unknown>;

/**
 * Relit un contenu stocké **sans jamais lever** (`docs/031` §3.5 règle C).
 *
 * Trois étapes, dans cet ordre :
 *
 * 1. **normalisation de version** — `docs/031` §3.5 règle B prévoit
 *    `normalizePageContent(pageKey, content)`, qui appliquera les migrations
 *    `v1 → v2 → …` le jour où un contrat changera de structure. Aucun contrat
 *    n'ayant encore changé, cette étape est aujourd'hui l'identité — et elle est
 *    écrite ici, à sa place, plutôt que laissée à un futur `if` disséminé.
 * 2. **validation tolérante** — `safeParse` d'abord : si le contenu est
 *    conforme, il est renvoyé tel quel. Sinon, **champ par champ**, seuls les
 *    champs valides sont conservés.
 * 3. **repli** — les champs écartés ne sont pas remplacés par une valeur
 *    inventée : ils sont **absents**, et le frontend reprend sa constante de
 *    code pour eux. `docs/031` §4.3 est catégorique : « Le texte manquant n'est
 *    jamais remplacé par un texte inventé », et `docs/016` §5 interdit d'inventer
 *    un contenu de quelque nature que ce soit.
 *
 * Une clé inconnue **stockée** en base (donnée ancienne, écriture directe) est
 * également écartée : elle ne peut pas être servie, sinon le contrat cesserait
 * d'être la seule description de ce qui sort de l'API.
 *
 * Ce que cette fonction garantit, et qui est le point : **aucune page ne renvoie
 * `500` à cause de son contenu** (`docs/031` §4.3 règle 3).
 */
export function readPageContent(pageKey: string, raw: unknown): ReadPageContent {
  const schema = getPageContentSchema(pageKey);

  // Clé inconnue, ou contenu qui n'est pas un objet : le contenu est vide, et
  // c'est un état légitime — la page se rendra entièrement avec ses textes de
  // code (docs/031 §4.1, lignes 1 et 2).
  if (!schema || !isPlainObject(raw)) return {};

  const normalized = normalizePageContent(pageKey, raw);

  const direct = schema.safeParse(normalized);
  if (direct.success) return toRecord(direct.data);

  // Le contrat est un `z.strictObject` : `.shape` donne le schéma de chaque
  // champ, ce qui permet de juger les champs **indépendamment** les uns des
  // autres. Un seul champ fautif ne doit pas emporter tout le contenu de la page.
  if (!(schema instanceof z.ZodObject)) return {};

  const shape = schema.shape as Record<string, ZodType>;
  const kept: ReadPageContent = {};

  for (const [key, value] of Object.entries(normalized)) {
    const field = shape[key];
    if (!field) continue;

    const result = field.safeParse(value);
    if (result.success) kept[key] = result.data;
  }

  return kept;
}

/**
 * Point d'application des migrations de contrat (`docs/031` §3.5 règle B).
 *
 * Aujourd'hui l'identité : aucun contrat n'a changé de structure, et le
 * registre est **gelé** (règle D). La fonction existe pour que le premier
 * changement structurel (`v1 → v2`) ait un endroit où se brancher — un
 * `jsonb` dont on ne sait plus quel contrat l'a produit est exactement ce que la
 * règle C interdit d'ignorer.
 */
export function normalizePageContent(
  _pageKey: string,
  content: ReadPageContent,
): ReadPageContent {
  return content;
}

/** Objet simple : ni `null`, ni tableau, ni instance exotique. */
function isPlainObject(value: unknown): value is ReadPageContent {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `safeParse` renvoie `unknown` : on ne sert que ce qui est bien un objet. */
function toRecord(value: unknown): ReadPageContent {
  return isPlainObject(value) ? value : {};
}
