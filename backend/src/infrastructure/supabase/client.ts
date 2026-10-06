import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Clients Supabase côté serveur.
 *
 * Le client « service role » contourne les Row Level Security : il ne doit
 * **jamais** quitter le processus serveur (`docs/004` §33 : interdit
 * `Next.js → Service Role`). Toute opération privilégiée passe donc par le
 * backend, jamais par le navigateur.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

/** Client public, utile pour les opérations non privilégiées. */
export const supabasePublic: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
