"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type ColumnDef } from "@/components/admin/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/admin/feedback/ToastContext";
import {
  AuthorizationDialog,
  CreateAccountDialog,
  EditIdentityDialog,
  PasswordDialog,
} from "@/components/admin/users/AccountDialogs";
import {
  deleteAdminUser,
  getAdminMe,
  getDepartments,
  listAdminProfiles,
  setAdminActivation,
} from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { AdminProfile, AdminRole } from "@/lib/api/types";

/**
 * Gestion des comptes d'administration.
 *
 * L'écran **ne simule rien** : la liste vient de `GET /admin/profiles`, chaque
 * action appelle son endpoint, et la liste est **relue depuis le serveur** après
 * chaque succès. L'état local n'est jamais modifié pour donner l'illusion d'une
 * réussite.
 *
 * ### Ce que l'interface filtre — et ce qu'elle ne décide pas
 *
 * Les boutons sont masqués ou désactivés selon le rôle courant, par commodité.
 * Ce filtrage **n'autorise rien** : le backend applique `UserPolicy` sur la cible
 * réelle (`docs/029` §4.2), y compris sur une requête fabriquée à la main. Un
 * refus serveur s'affiche tel quel ; il n'est jamais contourné.
 *
 * ### Pourquoi certaines lignes n'ont aucune action
 *
 * `Q-03` n'est pas tranchée : un `SUPER_ADMIN` ne peut pas administrer un compte
 * `SUPER_ADMIN`, y compris le sien. Ces lignes restent donc en lecture seule —
 * c'est le comportement du serveur, pas un oubli d'interface. Le changement de
 * son **propre** mot de passe passe par le bouton dédié, hors de cette liste.
 */

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  DEPARTMENT_MANAGER: "Responsable de département",
};

const ROLE_BADGE: Record<AdminRole, "warning" | "info" | "neutral"> = {
  SUPER_ADMIN: "warning",
  ADMIN: "info",
  DEPARTMENT_MANAGER: "neutral",
};

interface DepartmentOption {
  id: string;
  name: string;
}

type DialogKind = "create" | "identity" | "authorization" | "password" | null;

export default function AdminAccountsPage() {
  const toast = useToast();

  const [me, setMe] = useState<AdminProfile | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);

  /**
   * Relit l'annuaire depuis le serveur.
   *
   * `isInitial` distingue le premier chargement (squelette) d'un rechargement
   * après action (aucun saut de mise en page).
   */
  const loadProfiles = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const collection = await listAdminProfiles({ page: 1, limit: 100 });
      setProfiles(collection.data);
      setLoadError(null);
    } catch (error) {
      // Un refus d'accès n'est pas une panne : il est présenté comme tel.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setLoadError(
          error.status === 401
            ? "Votre session a expiré. Reconnectez-vous."
            : "Votre rôle ne permet pas de consulter l'annuaire : cette lecture est réservée au super administrateur (docs/029, cellule 1.4 — Q-02 non tranchée).",
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

  /* Le profil courant est la seule chose dont dépend le reste de l'écran : il
     est relu séparément pour que la page reste utilisable si l'annuaire, lui,
     est refusé (ADMIN). */
  useEffect(() => {
    let cancelled = false;
    getAdminMe()
      .then((profile) => {
        if (!cancelled) setMe(profile);
      })
      .catch(() => {
        // Sans profil courant, aucune action n'est proposée : l'écran reste
        // en lecture seule plutôt que de deviner un rôle.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Départements : nécessaires au rattachement d'un responsable.
  useEffect(() => {
    let cancelled = false;
    getDepartments()
      .then((items) => {
        if (!cancelled) {
          setDepartments(items.map((item) => ({ id: item.id, name: item.name })));
        }
      })
      .catch(() => {
        // Une liste vide empêche seulement de choisir un département.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Permissions d'affichage — le serveur reste l'autorité                  */
  /* ---------------------------------------------------------------------- */

  const role = me?.role;
  const mayCreate = role === "SUPER_ADMIN" || role === "ADMIN";
  /** 1.4 — arbitrée : l'`ADMIN` consulte l'annuaire. */
  const mayRead = role === "SUPER_ADMIN" || role === "ADMIN";
  /** 1.5 — arbitrée : l'`ADMIN` gère les responsables (borné par ligne). */
  const mayAuthorize = role === "SUPER_ADMIN" || role === "ADMIN";
  /** 1.6 — arbitrée : l'`ADMIN` suspend les responsables (borné par ligne). */
  const mayDeactivate = role === "SUPER_ADMIN" || role === "ADMIN";
  /** 1.8 — arbitrée : suppression réservée au `SUPER_ADMIN`. */
  const mayDelete = role === "SUPER_ADMIN";
  /** Cellules absentes de la matrice : hypothèse restrictive (SUPER_ADMIN). */
  const mayEditIdentity = role === "SUPER_ADMIN";
  const mayResetPassword = role === "SUPER_ADMIN";

  /**
   * Une ligne est-elle administrable ?
   *
   * Trois exclusions, toutes appliquées côté serveur — l'interface ne fait que
   * ne pas proposer une action qui serait refusée :
   * - Q-03 / XD-03 : jamais un compte `SUPER_ADMIN` (le dernier accès
   *   d'administration reste donc protégé) ;
   * - D-04 : un `ADMIN` n'administre pas un pair `ADMIN` ;
   * - jamais **son propre** compte (désactivation ou suppression = verrouillage).
   */
  const isRowAdministrable = useCallback(
    (row: AdminProfile): boolean => {
      if (row.role === "SUPER_ADMIN") return false;
      if (role === "ADMIN" && row.role === "ADMIN") return false;
      if (row.id === me?.id) return false;
      return true;
    },
    [role, me?.id],
  );

  /* ---------------------------------------------------------------------- */
  /*  Recherche locale — l'API n'offre aucun filtre sur cette collection     */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /*  Actions                                                               */
  /* ---------------------------------------------------------------------- */

  const handleActivation = async (profile: AdminProfile, isActive: boolean) => {
    // Confirmation pour l'opération à fort impact : couper un accès.
    if (
      !isActive &&
      !window.confirm(
        `Désactiver « ${profile.username} » ?\n\nL'accès est révoqué immédiatement : le compte ne pourra plus se connecter et ses jetons en cours cesseront d'être acceptés. L'habilitation est conservée et pourra être réactivée.`,
      )
    ) {
      return;
    }

    setPendingActivationId(profile.id);
    try {
      await setAdminActivation(profile.id, isActive);
      toast.success(
        isActive ? "Le compte a été réactivé." : "Le compte a été désactivé.",
        isActive ? "Accès rétabli" : "Accès révoqué",
      );
      await loadProfiles();
    } catch {
      toast.error(
        "L'état du compte n'a pas pu être modifié. Vérifiez vos permissions, puis réessayez.",
        "Opération refusée",
      );
    } finally {
      setPendingActivationId(null);
    }
  };

  const afterSave = async (message: string) => {
    toast.success(message, "Compte mis à jour");
    await loadProfiles();
  };

  /**
   * Suppression **définitive** — double confirmation.
   *
   * L'opération est irréversible et traverse deux systèmes (profil puis compte
   * d'authentification) : une simple boîte de dialogue se fermerait trop vite.
   * Le nom d'utilisateur est donc exigé, ce qui empêche aussi une suppression
   * déclenchée par erreur sur la mauvaise ligne.
   */
  const handleDelete = async (profile: AdminProfile) => {
    const first = window.confirm(
      `Supprimer DÉFINITIVEMENT le compte « ${profile.username} » ?\n\n` +
        "Le profil et le compte d'authentification seront effacés. Cette action est IRRÉVERSIBLE " +
        "et différente d'une désactivation : elle ne peut pas être annulée.",
    );
    if (!first) return;

    const typed = window.prompt(
      `Confirmation finale : saisissez le nom d'utilisateur « ${profile.username} » pour supprimer ce compte.`,
    );
    if (typed === null) return;
    if (typed.trim() !== profile.username) {
      toast.error(
        "Le nom saisi ne correspond pas : aucune suppression n'a été effectuée.",
        "Suppression annulée",
      );
      return;
    }

    try {
      await deleteAdminUser(profile.id);
      toast.success(
        `Le compte « ${profile.username} » a été supprimé.`,
        "Compte supprimé",
      );
      await loadProfiles();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Conflit métier : le serveur explique quoi faire, on ne le reformule pas.
        toast.error(error.message, "Suppression impossible");
      } else {
        toast.error(
          "Le compte n'a pas pu être supprimé. Vérifiez vos permissions, puis réessayez.",
          "Suppression refusée",
        );
      }
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Colonnes                                                              */
  /* ---------------------------------------------------------------------- */

  const columns: ColumnDef<AdminProfile>[] = [
    {
      header: "Compte",
      cell: (item) => (
        <div>
          <p className="flex items-center gap-2 font-sans text-sm font-semibold text-ccjv-ink">
            {item.username}
            {item.id === me?.id && (
              <span className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.1em] text-ccjv-ink-secondary">
                vous
              </span>
            )}
          </p>
          <p className="font-mono text-[0.72rem] text-ccjv-ink-secondary">
            {item.email ?? "adresse non résolue"}
          </p>
          {item.displayName && (
            <p className="font-sans text-[0.72rem] text-ccjv-ink-secondary">
              {item.displayName}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Rôle",
      cell: (item) => (
        <Badge variant={ROLE_BADGE[item.role]} className="text-[10px]">
          <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
          {item.role}
        </Badge>
      ),
    },
    {
      header: "Périmètre",
      cell: (item) => {
        if (item.scope === "DEPARTMENT" || item.role === "DEPARTMENT_MANAGER") {
          const department = departments.find((entry) => entry.id === item.departmentId);
          return (
            <span className="font-sans text-xs text-ccjv-ink">
              {department?.name ?? "Département inconnu"}
            </span>
          );
        }
        return <span className="font-mono text-xs text-ccjv-ink-secondary">GLOBAL</span>;
      },
    },
    {
      header: "État",
      cell: (item) =>
        item.isActive === false ? (
          <Badge variant="error" className="text-[10px]">
            <UserX className="mr-1 h-3 w-3" aria-hidden="true" /> Désactivé
          </Badge>
        ) : (
          <Badge variant="success" className="text-[10px]">
            <UserCheck className="mr-1 h-3 w-3" aria-hidden="true" /> Actif
          </Badge>
        ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (item) => {
        if (!isRowAdministrable(item)) {
          return (
            <span
              className="font-sans text-[0.72rem] text-ccjv-ink-secondary"
              title="Q-03 : administrer un compte SUPER_ADMIN depuis l'application n'est pas arbitré — refus par défaut."
            >
              Lecture seule
            </span>
          );
        }

        const busy = pendingActivationId === item.id;
        const actionClass =
          "inline-flex h-8 items-center gap-1.5 border border-ccjv-line px-2.5 font-sans text-[0.72rem] font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green";

        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {mayEditIdentity && (
              <button
                type="button"
                onClick={() => {
                  setSelected(item);
                  setDialog("identity");
                }}
                className={actionClass}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" /> Modifier
              </button>
            )}

            {mayAuthorize && (
              <button
                type="button"
                onClick={() => {
                  setSelected(item);
                  setDialog("authorization");
                }}
                className={actionClass}
              >
                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Habilitation
              </button>
            )}

            {mayResetPassword && (
              <button
                type="button"
                onClick={() => {
                  setSelected(item);
                  setDialog("password");
                }}
                className={actionClass}
              >
                <KeyRound className="h-3 w-3" aria-hidden="true" /> Mot de passe
              </button>
            )}

            {mayDeactivate && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleActivation(item, item.isActive === false)}
                className={
                  item.isActive === false
                    ? "inline-flex h-8 items-center gap-1.5 border border-ccjv-green px-2.5 font-sans text-[0.72rem] font-medium text-ccjv-green transition-colors hover:bg-ccjv-green-soft disabled:opacity-50"
                    : "inline-flex h-8 items-center gap-1.5 border border-[#b91c1c]/40 px-2.5 font-sans text-[0.72rem] font-medium text-[#b91c1c] transition-colors hover:border-[#b91c1c] hover:bg-[#fef2f2] disabled:opacity-50"
                }
              >
                {busy ? (
                  <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : item.isActive === false ? (
                  <UserCheck className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <UserX className="h-3 w-3" aria-hidden="true" />
                )}
                {item.isActive === false ? "Réactiver" : "Désactiver"}
              </button>
            )}

            {mayDelete && (
              <button
                type="button"
                onClick={() => void handleDelete(item)}
                title="Suppression définitive : le profil et le compte d'authentification sont effacés."
                className="inline-flex h-8 items-center gap-1.5 border border-[#b91c1c]/40 px-2.5 font-sans text-[0.72rem] font-medium text-[#b91c1c] transition-colors hover:border-[#b91c1c] hover:bg-[#fef2f2]"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" /> Supprimer
              </button>
            )}
          </div>
        );
      },
    },
  ];

  /* ---------------------------------------------------------------------- */
  /*  Rendu                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Comptes administrateurs"
        description="Créer les comptes, corriger leurs informations, régler leur habilitation et gérer leurs accès."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setDialog("password");
              }}
              className="inline-flex h-9 items-center gap-2 border border-ccjv-line px-3 font-sans text-xs font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Mon mot de passe
            </button>

            {mayCreate && (
              <button
                type="button"
                onClick={() => setDialog("create")}
                className="inline-flex h-9 items-center gap-2 bg-ccjv-green px-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ccjv-green-strong"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Créer un compte
              </button>
            )}
          </div>
        }
      />

      {/* La lecture de l'annuaire est réservée : le dire avant le tableau. */}
      {!isLoading && !mayRead && !me && (
        <p className="border border-ccjv-line bg-white px-4 py-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
          Votre profil administratif n&apos;a pas pu être lu : aucune action
          n&apos;est proposée tant que la session n&apos;est pas rétablie.
        </p>
      )}

      {!isLoading && role === "ADMIN" && (
        <p className="border border-ccjv-line bg-white px-4 py-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
          Votre rôle vous permet de consulter l&apos;annuaire, de gérer les{" "}
          <strong>responsables de département</strong> (rattachement, suspension)
          et d&apos;en créer. La modification des informations d&apos;un compte, la
          réinitialisation de mot de passe et la suppression restent réservées au
          super administrateur, et personne n&apos;administre un compte
          <strong> SUPER_ADMIN</strong> (docs/029, arbitrage du 19/10/2026).
        </p>
      )}

      <div className="border border-ccjv-line bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ccjv-ink-secondary"
            />
            <label htmlFor="account-search" className="sr-only">
              Rechercher un compte par nom, adresse ou rôle
            </label>
            <input
              id="account-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un compte…"
              className="h-10 w-full border border-ccjv-line bg-white pl-9 pr-3 font-sans text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/70"
            />
          </div>

          <p aria-live="polite" className="font-sans text-xs text-ccjv-ink-secondary">
            {isLoading
              ? "Chargement…"
              : `${visibleProfiles.length} compte${visibleProfiles.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={visibleProfiles}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          error={null}
          emptyState={
            <div className="px-4 py-10 text-center">
              <p className="max-w-[52ch] mx-auto font-sans text-sm leading-relaxed text-ccjv-ink">
                {loadError
                  ? loadError
                  : query
                    ? "Aucun compte ne correspond à cette recherche."
                    : "Aucun compte d'administration enregistré."}
              </p>
              {loadError && (
                <button
                  type="button"
                  onClick={() => void loadProfiles(true)}
                  className="mt-4 inline-flex h-9 items-center gap-2 border border-ccjv-ink px-4 font-sans text-xs font-medium text-ccjv-ink transition-colors hover:border-ccjv-green hover:text-ccjv-green"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Réessayer
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Dialogues — un seul monté à la fois, état remis à zéro à l'ouverture. */}
      <CreateAccountDialog
        isOpen={dialog === "create"}
        role={role ?? "DEPARTMENT_MANAGER"}
        departments={departments}
        onClose={() => setDialog(null)}
        onCreated={(profile) => {
          toast.success(`Le compte « ${profile.username} » a été créé.`, "Compte créé");
          void loadProfiles();
        }}
      />

      <EditIdentityDialog
        isOpen={dialog === "identity"}
        target={selected}
        onClose={() => setDialog(null)}
        onSaved={() => void afterSave("Les informations du compte ont été mises à jour.")}
      />

      <AuthorizationDialog
        isOpen={dialog === "authorization"}
        target={selected}
        actorRole={role}
        departments={departments}
        onClose={() => setDialog(null)}
        onSaved={() => void afterSave("L'habilitation du compte a été mise à jour.")}
      />

      <PasswordDialog
        isOpen={dialog === "password"}
        target={selected}
        onClose={() => {
          setDialog(null);
          setSelected(null);
        }}
      />
    </div>
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
