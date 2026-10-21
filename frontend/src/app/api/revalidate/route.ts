import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Route API de revalidation à la demande (On-Demand ISR).
 * Utilisable via appel HTTP POST ou webhook backend.
 *
 * Paramètres d'URL ou corps JSON :
 * - `tag` : nom du tag de cache à invalider (ex: 'publications', 'teachings', 'resources')
 * - `path` : chemin de la page à révalider (ex: '/publications/actualites')
 * - `secret` : clé secrète de sécurité (comparée à process.env.REVALIDATION_SECRET si défini)
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ message: "Secret de revalidation invalide" }, { status: 401 });
  }

  let bodyTag: string | undefined;
  let bodyPath: string | undefined;

  try {
    const json = (await request.json()) as Record<string, unknown>;
    if (typeof json === "object" && json !== null) {
      if (typeof json.tag === "string") bodyTag = json.tag;
      if (typeof json.path === "string") bodyPath = json.path;
    }
  } catch {
    // Corps non JSON ou absent : on exploite les query params
  }

  const tag = request.nextUrl.searchParams.get("tag") ?? bodyTag;
  const path = request.nextUrl.searchParams.get("path") ?? bodyPath;

  if (!tag && !path) {
    return NextResponse.json(
      { message: "Spécifiez au moins un paramètre 'tag' ou 'path' à révalider" },
      { status: 400 },
    );
  }

  if (tag) {
    revalidateTag(tag);
  }
  if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tag: tag ?? null,
    path: path ?? null,
    now: new Date().toISOString(),
  });
}
