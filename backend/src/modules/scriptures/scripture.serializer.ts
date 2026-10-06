import type { Scripture } from "@/domain/entities";

/**
 * Représentation API d'un verset.
 *
 * `key`, `text`, `reference` et `translation` sont les champs consommés par le
 * frontend (`data/mock/verses.ts`) : la traduction est exposée pour être
 * affichée, comme l'exige `docs/015` §5.
 *
 * Les horodatages sont sérialisés en ISO 8601 complet (`docs/004` §34).
 */
export interface ScriptureDto {
  id: string;
  key: string;
  text: string;
  reference: string;
  translation: string;
  context: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toScriptureDto(scripture: Scripture): ScriptureDto {
  return {
    id: scripture.id,
    key: scripture.key,
    text: scripture.text,
    reference: scripture.reference,
    translation: scripture.translation,
    context: scripture.context,
    createdAt: scripture.createdAt.toISOString(),
    updatedAt: scripture.updatedAt.toISOString(),
  };
}
