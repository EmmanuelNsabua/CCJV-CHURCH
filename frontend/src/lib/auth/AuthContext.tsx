"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { setApiAuthTokenProvider } from "@/lib/api/client";
import { getAdminMe } from "@/lib/api/endpoints";
import type { AdminProfile, AdminRole } from "@/lib/api/types";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  token: string | null;
  adminProfile: AdminProfile | null;
  role: AdminRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => getSupabaseClient(), []);

  // Synchronise le token pour le client HTTP API REST
  useEffect(() => {
    setApiAuthTokenProvider(() => {
      // Si une session en mémoire existe
      if (session?.access_token) return session.access_token;
      // Sinon récupération synchrone ou asynchrone depuis supabase
      return supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null);
    });
  }, [session, supabase]);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getAdminMe();
      setAdminProfile(profile);
    } catch (err) {
      console.warn("[auth] Impossible de charger le profil admin :", err);
      setAdminProfile(null);
    }
  }, []);


  // Initialisation de session au montage
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.access_token) {
            await fetchProfile();
          }
        }
      } catch (err) {
        console.warn("[auth] Erreur lors de l'initialisation de session :", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.access_token) {
        await fetchProfile();
      } else {
        setAdminProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message || "Identifiants invalides." };
        }

        setSession(data.session);
        setUser(data.user);

        if (data.session?.access_token) {
          await fetchProfile();
        }

        setIsLoading(false);
        return { error: null };
      } catch (err: unknown) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : "Erreur de connexion inattendue.";
        return { error: msg };
      }
    },

    [supabase, fetchProfile],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[auth] Erreur lors de la déconnexion :", err);
    } finally {
      setSession(null);
      setUser(null);
      setAdminProfile(null);
      setIsLoading(false);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (session?.access_token) {
      await fetchProfile();
    }
  }, [session, fetchProfile]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      session,
      token: session?.access_token ?? null,
      adminProfile,
      role: adminProfile?.role ?? null,
      isLoading,
      isAuthenticated: Boolean(session?.access_token),
      signIn,
      signOut,
      refreshProfile,
    };
  }, [user, session, adminProfile, isLoading, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }
  return context;
}
