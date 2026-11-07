"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/admin/feedback/ToastContext";
import { CreateAccountDialog } from "@/components/admin/users/AccountDialogs";
import {
  deleteAdminUser,
  getAdminMe,
  getDepartments,
  listAdminProfiles,
  setAdminActivation,
  setAdminPassword,
  updateAdminAuthorization,
  updateAdminIdentity,
  uploadAdminAvatar,
} from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { AdminProfile, AdminRole } from "@/lib/api/types";

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  DEPARTMENT_MANAGER: "Responsable département",
};

const ROLE_BADGE: Record<AdminRole, "warning" | "info" | "neutral"> = {
  SUPER_ADMIN: "warning",
  ADMIN: "info",
  DEPARTMENT_MANAGER: "neutral",
};

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (typeof err.details === "object" && err.details !== null) {
      const d = err.details as any;
      if (Array.isArray(d.issues) && d.issues.length > 0) {
        return d.issues
          .map((i: any) => `${i.champ ? i.champ + " : " : ""}${i.message || i.erreur}`)
          .filter(Boolean)
          .join(" — ");
      }
      if (Array.isArray(d) && d.length > 0) {
        return d
          .map((i: any) => `${i.champ ? i.champ + " : " : ""}${i.message || i.erreur}`)
          .filter(Boolean)
          .join(" — ");
      }
      if (d.message) return d.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Une erreur inattendue est survenue.";
}

interface DepartmentOption {
  id: string;
  name: string;
}

export default function AdminAccountsPage() {
  const toast = useToast();

  const [me, setMe] = useState<AdminProfile | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Menu contextuel ouvert
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeModalTarget, setActiveModalTarget] = useState<AdminProfile | null>(null);
  const [habilitationTarget, setHabilitationTarget] = useState<AdminProfile | null>(null);
  const [modifierTarget, setModifierTarget] = useState<AdminProfile | null>(null);

  // Cache busting pour les avatars rafraîchis
  const [avatarTimestamps, setAvatarTimestamps] = useState<Record<string, number>>({});

  const loadProfiles = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const collection = await listAdminProfiles({ page: 1, limit: 100 });
      setProfiles(collection.data);
      setLoadError(null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setLoadError(
          error.status === 401
            ? "Votre session a expiré. Reconnectez-vous."
            : "Votre rôle ne permet pas de consulter l'annuaire : cette lecture est réservée au super administrateur.",
        );
      } else {
        setLoadError(
          "L'annuaire des comptes n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez.",
        );
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles(true);
  }, [loadProfiles]);

  useEffect(() => {
    let cancelled = false;
    getAdminMe()
      .then((profile) => {
        if (!cancelled) setMe(profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDepartments()
      .then((items) => {
        if (!cancelled) {
          setDepartments(items.map((item) => ({ id: item.id, name: item.name })));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-context-menu]")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const role = me?.role;
  const mayCreate = role === "SUPER_ADMIN" || role === "ADMIN";
  const mayRead = role === "SUPER_ADMIN" || role === "ADMIN";
  const mayDelete = role === "SUPER_ADMIN";

  const isRowAdministrable = useCallback(
    (target: AdminProfile): boolean => {
      if (target.role === "SUPER_ADMIN") return false;
      if (role === "ADMIN" && target.role === "ADMIN") return false;
      if (target.id === me?.id) return false;
      return true;
    },
    [role, me?.id],
  );

  const visibleProfiles = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return profiles;

    return profiles.filter((profile) =>
      normalize(
        [
          profile.username,
          profile.displayName ?? "",
          profile.email ?? "",
          ROLE_LABEL[profile.role],
        ].join(" "),
      ).includes(needle),
    );
  }, [profiles, query]);

  // Résolution du libellé de département
  const resolveDepartmentName = (profile: AdminProfile): string => {
    if (profile.role !== "DEPARTMENT_MANAGER" && profile.scope !== "DEPARTMENT") {
      return "Global";
    }
    if (!profile.departmentId) return "Non assigné";

    const dept = departments.find((d) => d.id === profile.departmentId);
    if (dept) {
      if (/ecod/i.test(dept.name)) return "Ecodim";
      if (/presse/i.test(dept.name)) return "Presse";
      return dept.name;
    }
    if (profile.departmentId === "d0000000-0000-4000-8000-000000000004") return "Ecodim";
    if (profile.departmentId === "d0000000-0000-4000-8000-00000000000a") return "Presse";
    return "Département inconnu";
  };

  // Téléversement d'avatar
  const handleAvatarUpload = async (profileId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadAdminAvatar(profileId, formData);
      setAvatarTimestamps((prev) => ({ ...prev, [profileId]: Date.now() }));
      toast.success("Photo de profil mise à jour avec succès.");
      void loadProfiles();
    } catch {
      toast.error("Impossible de téléverser la photo. Format image JPEG, PNG ou WebP requis (< 5 Mo).");
    }
  };

  // Suppression définitive (SUPER_ADMIN)
  const handleDelete = async (profile: AdminProfile) => {
    const first = window.confirm(
      `Supprimer DÉFINITIVEMENT le compte « ${profile.username} » ?\n\nLe profil et le compte d'authentification seront effacés. Cette action est IRRÉVERSIBLE.`,
    );
    if (!first) return;

    try {
      await deleteAdminUser(profile.id);
      toast.success(`Le compte « ${profile.username} » a été supprimé.`, "Compte supprimé");
      void loadProfiles();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message, "Suppression impossible");
      } else {
        toast.error("Le compte n'a pas pu être supprimé.", "Suppression refusée");
      }
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Comptes administrateurs"
        description="Créer les comptes, corriger leurs informations, régler leur habilitation et gérer leurs accès."
        actions={
          mayCreate ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex h-9 items-center gap-2 bg-ccjv-green px-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ccjv-green-strong cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Créer un compte
            </button>
          ) : undefined
        }
      />

      {!isLoading && !mayRead && !me && (
        <p className="border border-ccjv-line bg-white px-4 py-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
          Votre profil administratif n&apos;a pas pu être lu : aucune action n&apos;est proposée tant que la session n&apos;est pas rétablie.
        </p>
      )}

      {/* Barre de recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-ccjv-line bg-white p-4">
        <div className="relative w-full sm:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ccjv-ink-secondary"
          />
          <label htmlFor="account-search" className="sr-only">
            Rechercher un compte par nom, adresse ou rôle
          </label>
          <input
            id="account-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un compte par nom, adresse, rôle…"
            className="h-10 w-full border border-ccjv-line bg-white pl-9 pr-3 font-sans text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/70 focus:outline-none focus:border-ccjv-green"
          />
        </div>

        <p aria-live="polite" className="font-sans text-xs font-medium text-ccjv-ink-secondary">
          {isLoading ? "Chargement…" : `${visibleProfiles.length} compte${visibleProfiles.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Grille de cartes (2 colonnes sur tablette/desktop, 1 colonne sur mobile) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border border-ccjv-line bg-white p-5 animate-pulse flex items-start gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-ccjv-line/40 shrink-0" />
              <div className="space-y-2.5 flex-1">
                <div className="h-5 bg-ccjv-line/40 w-3/4" />
                <div className="h-4 bg-ccjv-line/40 w-1/2" />
                <div className="h-4 bg-ccjv-line/40 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="border border-ccjv-line bg-white p-12 text-center">
          <p className="font-sans text-sm text-ccjv-ink">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadProfiles(true)}
            className="mt-4 inline-flex h-9 items-center gap-2 border border-ccjv-ink px-4 font-sans text-xs font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      ) : visibleProfiles.length === 0 ? (
        <div className="border border-ccjv-line bg-white p-12 text-center">
          <p className="font-sans text-sm text-ccjv-ink-secondary">
            {query ? "Aucun compte ne correspond à cette recherche." : "Aucun compte administrateur enregistré."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {visibleProfiles.map((item) => {
            const isMe = item.id === me?.id;
            const canAdmin = isRowAdministrable(item);
            const ts = avatarTimestamps[item.id] || "";
            const avatarSrc = item.avatarUrl ? `${item.avatarUrl}${ts ? `?t=${ts}` : ""}` : null;

            return (
              <div
                key={item.id}
                className="relative border border-ccjv-line bg-white p-5 flex flex-col justify-between hover:border-ccjv-green/40 transition-colors shadow-2xs"
              >
                {/* En-tête de la carte : Photo à gauche, Identité à droite, Menu à 3 points au coin supérieur droit */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* 2.1 Espace Photo à gauche */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-ccjv-offwhite border border-ccjv-line flex items-center justify-center overflow-hidden">
                      <AvatarImage
                        src={avatarSrc}
                        alt={item.displayName || item.username}
                      />
                    </div>

                    {/* Bouton de modification de la photo au survol */}
                    <label
                      title="Changer la photo de profil"
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-sans font-medium transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      <span>Modifier</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleAvatarUpload(item.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {/* 2.2 Champs d'identité à droite */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg font-semibold text-ccjv-ink truncate">
                        {item.displayName || item.username}
                      </h3>
                      {isMe && (
                        <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-ccjv-green border border-ccjv-green/30 bg-ccjv-green-soft px-1.5 py-0.2">
                          Vous
                        </span>
                      )}
                    </div>

                    {/* Son adresse (adresse mail) */}
                    <p className="font-sans text-xs text-ccjv-ink-secondary truncate mt-0.5">
                      {item.email ?? "Adresse non résolue"}
                    </p>

                    {/* Son rôle */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <Badge variant={ROLE_BADGE[item.role]} className="text-[10px] font-medium">
                        <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                        {ROLE_LABEL[item.role]}
                      </Badge>

                      {/* État : Actif ou Désactivé */}
                      {item.isActive === false ? (
                        <Badge variant="error" className="text-[10px]">
                          <UserX className="mr-1 h-3 w-3" aria-hidden="true" /> Désactivé
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          <UserCheck className="mr-1 h-3 w-3" aria-hidden="true" /> Actif
                        </Badge>
                      )}
                    </div>

                    {/* Son département */}
                    <div className="mt-2 font-sans text-xs flex items-center gap-1">
                      <span className="text-ccjv-ink-secondary">Département :</span>
                      <span className="font-medium text-ccjv-ink">
                        {resolveDepartmentName(item)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coin supérieur droit : Bouton menu contextuel à 3 points */}
                <div className="absolute top-3 right-3" data-context-menu>
                  <button
                    type="button"
                    aria-label="Options du compte"
                    aria-expanded={openMenuId === item.id}
                    onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                    className="p-1.5 text-ccjv-ink-secondary hover:text-ccjv-ink hover:bg-ccjv-offwhite border border-transparent hover:border-ccjv-line transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Menu contextuel déroulant */}
                  {openMenuId === item.id && (
                    <div className="absolute right-0 top-8 z-30 w-48 border border-ccjv-line bg-white shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
                      {/* 1. Option Actif / Inactif avec voyant vert / rouge */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setActiveModalTarget(item);
                        }}
                        disabled={!canAdmin && !isMe}
                        className="w-full text-left px-4 py-2.5 font-sans text-xs text-ccjv-ink hover:bg-ccjv-offwhite flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        <span className="font-medium">
                          {item.isActive !== false ? "Actif" : "Inactif"}
                        </span>
                        {item.isActive !== false ? (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                            title="Compte actif"
                            aria-label="Actif"
                          />
                        ) : (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                            title="Compte inactif"
                            aria-label="Inactif"
                          />
                        )}
                      </button>

                      {/* 2. Option Habilitation */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setHabilitationTarget(item);
                        }}
                        disabled={!canAdmin}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-ccjv-ink hover:bg-ccjv-offwhite flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span>Habilitation</span>
                        <Shield className="w-3.5 h-3.5 text-ccjv-ink-secondary" />
                      </button>

                      {/* 3. Option Modifier */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setModifierTarget(item);
                        }}
                        disabled={!canAdmin && !isMe}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-ccjv-ink hover:bg-ccjv-offwhite flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span>Modifier</span>
                        <User className="w-3.5 h-3.5 text-ccjv-ink-secondary" />
                      </button>

                      {/* Option Supprimer (réservée au SUPER_ADMIN sur les comptes gérables) */}
                      {mayDelete && canAdmin && (
                        <div className="border-t border-ccjv-line mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              void handleDelete(item);
                            }}
                            className="w-full text-left px-4 py-2 font-sans text-xs text-[#b91c1c] hover:bg-[#fef2f2] flex items-center justify-between cursor-pointer"
                          >
                            <span>Supprimer</span>
                            <Trash2 className="w-3.5 h-3.5 text-[#b91c1c]" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE 1 : Activer / Désactiver                                           */}
      {/* ========================================================================= */}
      {activeModalTarget && (
        <ActivationModal
          target={activeModalTarget}
          onClose={() => setActiveModalTarget(null)}
          onConfirm={async () => {
            const nextActiveState = activeModalTarget.isActive === false;
            try {
              await setAdminActivation(activeModalTarget.id, nextActiveState);
              toast.success(
                nextActiveState ? "Le compte a été activé avec succès." : "Le compte a été désactivé avec succès.",
              );
              setActiveModalTarget(null);
              void loadProfiles();
            } catch {
              toast.error("Impossible de modifier l'état du compte. Vérifiez vos permissions.");
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODALE 2 : Habilitation                                                   */}
      {/* ========================================================================= */}
      {habilitationTarget && (
        <HabilitationModal
          target={habilitationTarget}
          actorRole={role}
          departments={departments}
          onClose={() => setHabilitationTarget(null)}
          onSuccess={() => {
            toast.success("L'habilitation a été mise à jour.");
            setHabilitationTarget(null);
            void loadProfiles();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODALE 3 : Modifier (Nom complet, Adresse mail, Mot de passe)              */}
      {/* ========================================================================= */}
      {modifierTarget && (
        <ModifierModal
          target={modifierTarget}
          onClose={() => setModifierTarget(null)}
          onSuccess={() => {
            toast.success("Les informations ont été modifiées avec succès.");
            setModifierTarget(null);
            void loadProfiles();
          }}
        />
      )}

      {/* Modale de création d'un compte */}
      <CreateAccountDialog
        isOpen={isCreateOpen}
        role={role ?? "DEPARTMENT_MANAGER"}
        departments={departments}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newProfile) => {
          toast.success(`Le compte « ${newProfile.username} » a été créé.`, "Compte créé");
          void loadProfiles();
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Composant d'affichage de la photo d'avatar avec fallback sur erreur 404   */
/* -------------------------------------------------------------------------- */

function AvatarImage({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <User className="w-10 h-10 text-ccjv-ink-secondary/50" aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  MODALE 1 : Confirmation Activation / Désactivation                         */
/* -------------------------------------------------------------------------- */

function ActivationModal({
  target,
  onClose,
  onConfirm,
}: {
  target: AdminProfile;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCurrentlyActive = target.isActive !== false;
  const name = target.displayName || target.username;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="border border-ccjv-line bg-white p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-100">
        <h3 className="font-serif text-xl font-semibold text-ccjv-ink">
          {isCurrentlyActive ? "Désactiver cet agent ?" : "Activer cet agent ?"}
        </h3>
        <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary leading-relaxed">
          {isCurrentlyActive
            ? `Voulez-vous vraiment désactiver l'accès de « ${name} » ? Ce compte ne pourra plus se connecter au back-office tant qu'il ne sera pas réactivé.`
            : `Voulez-vous activer le compte de « ${name} » ? L'accès au back-office sera immédiatement rétabli.`}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="h-9 px-4 border border-ccjv-line font-sans text-xs font-medium text-ccjv-ink hover:bg-ccjv-offwhite transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onConfirm();
              } finally {
                setIsSubmitting(false);
              }
            }}
            className={`h-9 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors cursor-pointer ${
              isCurrentlyActive
                ? "bg-[#b91c1c] hover:bg-[#991b1b]"
                : "bg-ccjv-green hover:bg-ccjv-green-strong"
            }`}
          >
            {isSubmitting ? "En cours…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MODALE 2 : Habilitation (Rôle & Département)                               */
/* -------------------------------------------------------------------------- */

function HabilitationModal({
  target,
  actorRole,
  departments,
  onClose,
  onSuccess,
}: {
  target: AdminProfile;
  actorRole?: AdminRole;
  departments: DepartmentOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState<AdminRole>(target.role);

  // Identification des deux départements autorisés : Ecodim et Presse
  const ecodimDept = departments.find(
    (d) => /ecod/i.test(d.name) || d.id === "d0000000-0000-4000-8000-000000000004",
  ) ?? { id: "d0000000-0000-4000-8000-000000000004", name: "Ecodim" };

  const presseDept = departments.find(
    (d) => /presse/i.test(d.name) || d.id === "d0000000-0000-4000-8000-00000000000a",
  ) ?? { id: "d0000000-0000-4000-8000-00000000000a", name: "Presse" };

  const initialDeptId = target.departmentId ?? ecodimDept.id;
  const [departmentId, setDepartmentId] = useState<string>(initialDeptId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le bouton Confirmer ne s'active QUE s'il y a une modification
  const isModified = useMemo(() => {
    if (role !== target.role) return true;
    if (role === "DEPARTMENT_MANAGER") {
      return (departmentId || null) !== (target.departmentId || null);
    }
    return false;
  }, [role, departmentId, target.role, target.departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModified || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateAdminAuthorization(target.id, {
        role,
        departmentId: role === "DEPARTMENT_MANAGER" ? departmentId : null,
      });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible d'enregistrer l'habilitation. Vérifiez vos permissions.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="border border-ccjv-line bg-white p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-3 border-b border-ccjv-line">
          <h3 className="font-serif text-xl font-semibold text-ccjv-ink">
            Régler l&apos;habilitation
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ccjv-ink-secondary hover:text-ccjv-ink cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="border border-[#b91c1c]/30 bg-[#fef2f2] p-3 text-xs text-[#b91c1c]">
              {error}
            </div>
          )}

          {/* Champ 1 : Rôle */}
          <div>
            <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
              Rôle attribué
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="h-10 w-full border border-ccjv-line bg-white px-3 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
            >
              {/* Le rôle Super Administrateur ne peut être donné que par le Super Administrateur */}
              {actorRole === "SUPER_ADMIN" && (
                <option value="SUPER_ADMIN">Super administrateur</option>
              )}
              <option value="ADMIN">Administrateur</option>
              <option value="DEPARTMENT_MANAGER">Responsable département</option>
            </select>
          </div>

          {/* Champ 2 : Département (proposé uniquement si Responsable département) */}
          {role === "DEPARTMENT_MANAGER" && (
            <div>
              <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
                Département de rattachement
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="h-10 w-full border border-ccjv-line bg-white px-3 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
              >
                <option value={ecodimDept.id}>Ecodim</option>
                <option value={presseDept.id}>Presse</option>
              </select>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-ccjv-line">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-9 px-4 border border-ccjv-line font-sans text-xs font-medium text-ccjv-ink hover:bg-ccjv-offwhite transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isModified || isSubmitting}
              className="h-9 px-5 bg-ccjv-green font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ccjv-green-strong disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Enregistrement…" : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MODALE 3 : Modifier (Nom complet, Adresse mail, Mot de passe)              */
/* -------------------------------------------------------------------------- */

function ModifierModal({
  target,
  onClose,
  onSuccess,
}: {
  target: AdminProfile;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [displayName, setDisplayName] = useState(target.displayName ?? "");
  const [email, setEmail] = useState(target.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État de confirmation d'avertissement irréversible
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Détection de modification
  const isModified = useMemo(() => {
    const nameChanged = displayName.trim() !== (target.displayName ?? "").trim();
    const emailChanged = email.trim() !== (target.email ?? "").trim();
    const passwordChanged = password.length > 0;
    return nameChanged || emailChanged || passwordChanged;
  }, [displayName, email, password, target.displayName, target.email]);

  // Exécution réelle des modifications après confirmation de l'avertissement
  const executeChanges = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const trimmedName = displayName.trim();
      const trimmedEmail = email.trim();
      const nameChanged = trimmedName !== (target.displayName ?? "").trim();
      const emailChanged = trimmedEmail.length > 0 && trimmedEmail !== (target.email ?? "").trim();

      // 1. Mise à jour de l'identité uniquement pour les champs réellement modifiés
      if (nameChanged || emailChanged) {
        const payload: { displayName?: string | null; email?: string } = {};
        if (nameChanged) payload.displayName = trimmedName || null;
        if (emailChanged) payload.email = trimmedEmail;
        await updateAdminIdentity(target.id, payload);
      }

      // 2. Mise à jour du mot de passe s'il a été renseigné
      if (password.trim().length > 0) {
        await setAdminPassword(target.id, password.trim());
      }

      setShowWarningModal(false);
      onSuccess();
    } catch (err) {
      setShowWarningModal(false);
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="border border-ccjv-line bg-white p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-3 border-b border-ccjv-line">
            <h3 className="font-serif text-xl font-semibold text-ccjv-ink">
              Modifier le compte
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-ccjv-ink-secondary hover:text-ccjv-ink cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isModified) setShowWarningModal(true);
            }}
            className="mt-4 space-y-4"
          >
            {error && (
              <div className="border border-[#b91c1c]/30 bg-[#fef2f2] p-3 text-xs text-[#b91c1c] leading-relaxed">
                {error}
              </div>
            )}

            {/* Champ 1 : Nom complet */}
            <div>
              <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
                Nom complet
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex. Emmanuel Nsabua"
                className="h-10 w-full border border-ccjv-line bg-white px-3 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
              />
            </div>

            {/* Champ 2 : Adresse mail */}
            <div>
              <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
                Adresse mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex. pasteur@ccjv.org"
                required
                className="h-10 w-full border border-ccjv-line bg-white px-3 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
              />
            </div>

            {/* Champ 3 : Mot de passe avec bouton pour voir/masquer */}
            <div>
              <label className="block font-sans text-xs font-semibold text-ccjv-ink mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas modifier"
                  minLength={8}
                  className="h-10 w-full border border-ccjv-line bg-white pl-3 pr-10 font-sans text-sm text-ccjv-ink focus:outline-none focus:border-ccjv-green"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ccjv-ink-secondary hover:text-ccjv-ink p-1 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 font-sans text-[11px] text-ccjv-ink-secondary">
                Renseignez ce champ uniquement si vous souhaitez définir un nouveau mot de passe (min. 8 caractères).
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-ccjv-line">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 border border-ccjv-line font-sans text-xs font-medium text-ccjv-ink hover:bg-ccjv-offwhite transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!isModified || isSubmitting}
                className="h-9 px-5 bg-ccjv-green font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ccjv-green-strong disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modale d'avertissement informant que cette opération ne sera pas réversible */}
      {showWarningModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="border border-ccjv-line bg-white p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <h4 className="font-serif text-lg font-semibold text-[#b91c1c]">
              Avertissement : opération irréversible
            </h4>
            <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary leading-relaxed">
              Attention : cette opération va modifier les identifiants d&apos;accès et les paramètres du compte. Cette action n&apos;est pas réversible. Souhaitez-vous vraiment appliquer ces modifications ?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowWarningModal(false)}
                className="h-9 px-4 border border-ccjv-line font-sans text-xs font-medium text-ccjv-ink hover:bg-ccjv-offwhite transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void executeChanges()}
                className="h-9 px-5 bg-[#b91c1c] font-sans text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#991b1b] transition-colors cursor-pointer"
              >
                {isSubmitting ? "Application…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Normalisation de recherche : casse et accents ignorés. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
