"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, type CacheTag } from "./client";

/**
 * Révalide à la demande un tag de cache Next.js (On-Demand ISR).
 */
export async function revalidateCacheTag(tag: CacheTag | string): Promise<void> {
  revalidateTag(tag);
}

/**
 * Révalide à la demande un chemin d'URL du site public (On-Demand ISR).
 */
export async function revalidateCachePath(path: string): Promise<void> {
  revalidatePath(path);
}

/**
 * Révalide les pages publiques des publications et actualités.
 */
export async function revalidateActualites(): Promise<void> {
  revalidateTag(CACHE_TAGS.publications);
  revalidateTag(CACHE_TAGS.actualites);
  revalidatePath("/publications/actualites");
}

/**
 * Révalide les pages publiques des enseignements et prédications.
 */
export async function revalidateEnseignements(): Promise<void> {
  revalidateTag(CACHE_TAGS.enseignements);
  revalidateTag(CACHE_TAGS.teachings);
  revalidatePath("/publications/enseignements");
}

/**
 * Révalide les pages publiques des guides et ressources documentaires.
 */
export async function revalidateRessources(): Promise<void> {
  revalidateTag(CACHE_TAGS.resources);
  revalidateTag(CACHE_TAGS.ressources);
  revalidatePath("/publications/ressources");
}

/**
 * Révalide l'ensemble du pôle publications (actualités, enseignements, ressources).
 */
export async function revalidatePublicationsHub(): Promise<void> {
  await Promise.all([
    revalidateActualites(),
    revalidateEnseignements(),
    revalidateRessources(),
  ]);
}
