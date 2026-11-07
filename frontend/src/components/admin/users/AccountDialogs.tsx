"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/admin/forms/FormField";
import { Input } from "@/components/admin/forms/Input";
import { Select } from "@/components/admin/forms/Select";
import {
  changeOwnPassword,
  createAdminUser,
  setAdminPassword,
  updateAdminAuthorization,
  updateAdminIdentity,
  type CreateAdminUserPayload,
} from "@/lib/api/endpoints";
import type { AdminProfile, AdminRole } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { formatPersonName } from "@/lib/utils";

/**
 * Dialogues de gestion des comptes d'administration.
 *
 * Un seul habillage (`AccountDialog`) pour les quatre formulaires : le
 * back-office n'a pas de bibliothèque de modale, et en ajouter une pour quatre
 * formulaires serait disproportionné.
 *
 * Règles communes tenues ici et vérifiables :
 * - `role="dialog"` + `aria-modal` + titre lié (`aria-labelledby`) ;
 * - focus initial dans le panneau, piège de tabulation, fermeture par `Échap` ;
 * - le bouton de validation est désactivé pendant l'envoi : aucune double
 *   soumission ;
 * - **aucun succès simulé** : l'état local ne change qu'après réponse de l'API,
 *   et l'appelant recharge la liste depuis le serveur ;
 * - les erreurs de l'API sont affichées telles quelles quand elles sont
 *   compréhensibles (messages de validation), et **jamais un secret**.
 */

/* -------------------------------------------------------------------------- */
/*  Habillage commun                                                          */
/* -------------------------------------------------------------------------- */

interface AccountDialogProps {
  readonly title: string;
  readonly description?: string;
  readonly isOpen: boolean;
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly submitLabel: string;
  readonly isDanger?: boolean;
  readonly onClose: () => void;
  readonly onBack?: () => void;
  readonly backLabel?: string;
  readonly onSubmit: () => void;
  readonly children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function AccountDialog({
  title,
  description,
  isOpen,
  isSubmitting,
  error,
  submitLabel,
  isDanger = false,
  onClose,
  onBack,
  backLabel,
  onSubmit,
  children,
}: AccountDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    // Focus initial : le premier champ, ou le panneau à défaut.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === lastEl) {
        event.preventDefault();
        firstEl.focus();
      } else if (event.shiftKey && active === firstEl) {
        event.preventDefault();
        lastEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-[560px] border border-ccjv-line bg-white p-7 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ccjv-line/70 pb-3">
          <div>
            <h3 id={titleId} className="font-serif text-base font-bold text-ccjv-ink">
              {title}
            </h3>
            {description && (
              <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fermer"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-ccjv-ink-secondary transition-colors hover:text-ccjv-ink disabled:opacity-40"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="mt-5 space-y-4"
        >
          {children}

          {error && (
            <p
              role="alert"
              className="border border-[#b91c1c]/30 bg-[#fef2f2] px-3 py-2 font-sans text-xs leading-relaxed text-[#7f1d1d]"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ccjv-line/70 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center border border-ccjv-line px-4 font-sans text-xs font-medium text-ccjv-ink transition-colors hover:border-ccjv-ink hover:bg-ccjv-offwhite disabled:opacity-40 cursor-pointer"
              >
                {backLabel ?? "Précédent"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center border border-ccjv-line px-4 font-sans text-xs font-medium text-ccjv-ink transition-colors hover:border-ccjv-ink disabled:opacity-40 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "inline-flex h-10 items-center px-5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isDanger
                  ? "bg-[#b91c1c] hover:bg-[#991b1b]"
                  : "bg-ccjv-green hover:bg-ccjv-green-strong",
              )}
            >
              {isSubmitting ? "Envoi…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Message lisible d'une erreur d'API, sans détail interne. */
function readableError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Vous n'avez pas la permission d'effectuer cette opération.";
    }
    if (error.status === 409) {
      return "Cette adresse électronique est déjà utilisée par un autre compte.";
    }
    if (error.status === 401) {
      return "Votre session a expiré. Reconnectez-vous.";
    }
    // Les messages de validation du serveur sont destinés à l'utilisateur.
    return error.message;
  }
  return "L'opération n'a pas pu aboutir. Vérifiez votre connexion, puis réessayez.";
}

/* -------------------------------------------------------------------------- */
/*  Création                                                                  */
/* -------------------------------------------------------------------------- */

interface CreateAccountDialogProps {
  readonly isOpen: boolean;
  readonly role: AdminRole;
  readonly departments: readonly { id: string; name: string }[];
  readonly onClose: () => void;
  readonly onCreated: (profile: AdminProfile) => void;
}

/**
 * Création d'un compte en deux étapes avec transition fluide :
 * 1. Identité (Nom complet, Adresse email)
 * 2. Responsabilité (Habilitation, Département pour les responsables)
 * Mot de passe défini par défaut à 'ccjvadmin' avec modification obligatoire à la 1re connexion.
 */
export function CreateAccountDialog({
  isOpen,
  role,
  departments,
  onClose,
  onCreated,
}: CreateAccountDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountRole, setAccountRole] = useState<AdminRole>("DEPARTMENT_MANAGER");

  // Résolution stricte des départements Ecodim et Presse
  const ecodimDept = departments.find(
    (d) => /ecod/i.test(d.name) || d.id === "d0000000-0000-4000-8000-000000000004",
  ) ?? { id: "d0000000-0000-4000-8000-000000000004", name: "Ecodim" };

  const presseDept = departments.find(
    (d) => /presse/i.test(d.name) || d.id === "d0000000-0000-4000-8000-00000000000a",
  ) ?? { id: "d0000000-0000-4000-8000-00000000000a", name: "Presse" };

  const [departmentId, setDepartmentId] = useState<string>(ecodimDept.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setEmail("");
    setDisplayName("");
    setAccountRole("DEPARTMENT_MANAGER");
    setDepartmentId(ecodimDept.id);
    setError(null);
  }, [isOpen, role, ecodimDept.id]);

  const isManager = accountRole === "DEPARTMENT_MANAGER";

  const handleNextStep = () => {
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Le nom complet est obligatoire.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Veuillez saisir une adresse électronique valide.");
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (isManager && !departmentId) {
      setError("Veuillez sélectionner le département de rattachement.");
      return;
    }

    const formattedName = formatPersonName(displayName);
    const slugName = formattedName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const generatedUsername = (slugName.length >= 3 ? slugName : `${emailPrefix}-admin`).slice(0, 50);

    const payload: CreateAdminUserPayload = {
      email: email.trim(),
      username: generatedUsername,
      displayName: formattedName,
      role: accountRole,
      departmentId: isManager ? (departmentId || ecodimDept.id) : null,
      password: "ccjvadmin",
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createAdminUser(payload);
      onCreated(created);
      onClose();
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountDialog
      isOpen={isOpen}
      title="Créer un administrateur"
      description={
        step === 1
          ? "Étape 1 sur 2 : Identité de l'agent"
          : "Étape 2 sur 2 : Habilitation et affectation"
      }
      isSubmitting={isSubmitting}
      error={error}
      submitLabel={step === 1 ? "Suivant →" : isSubmitting ? "Création…" : "Créer l'administrateur"}
      onClose={onClose}
      onBack={step === 2 ? () => setStep(1) : undefined}
      backLabel="← Précédent"
      onSubmit={() => {
        if (step === 1) {
          handleNextStep();
        } else {
          void handleSubmit();
        }
      }}
    >
      {step === 1 ? (
        <div key="step-1" className="space-y-4 animate-in fade-in duration-200">
          <FormField label="Nom complet" required hint="La première lettre sera mise en majuscule automatiquement.">
            <Input
              value={displayName}
              autoComplete="off"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ex. Gaëtan Kabamba"
              required
            />
          </FormField>

          <FormField label="Adresse email de connexion" required hint="Sera utilisée comme identifiant de connexion.">
            <Input
              type="email"
              value={email}
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ex. gaetan@ccjv.org"
              required
            />
          </FormField>
        </div>
      ) : (
        <div key="step-2" className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-ccjv-offwhite border border-ccjv-line p-3 text-xs flex items-center justify-between">
            <span className="text-ccjv-ink-secondary">Identité :</span>
            <span className="font-semibold text-ccjv-ink">{formatPersonName(displayName)} ({email})</span>
          </div>

          <FormField
            label="Habilitation (Rôle)"
            required
            hint={
              role === "ADMIN"
                ? "En tant qu'administrateur, vous pouvez affecter des responsables de département ou administrateurs."
                : "Un Super administrateur peut créer tous les rôles."
            }
          >
            <Select
              value={accountRole}
              onChange={(event) => setAccountRole(event.target.value as AdminRole)}
            >
              <option value="DEPARTMENT_MANAGER">Responsable département</option>
              <option value="ADMIN">Administrateur</option>
              {role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super administrateur</option>}
            </Select>
          </FormField>

          {isManager && (
            <FormField label="Département" required hint="Choisissez parmi les départements autorisés.">
              <Select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
              >
                <option value={ecodimDept.id}>Ecodim</option>
                <option value={presseDept.id}>Presse</option>
              </Select>
            </FormField>
          )}

          <div className="border border-ccjv-line bg-ccjv-offwhite/80 p-3 text-xs text-ccjv-ink-secondary leading-relaxed">
            <span className="font-semibold text-ccjv-ink">Mot de passe temporaire : </span>
            Le mot de passe initial par défaut est <code className="bg-white px-1.5 py-0.5 border border-ccjv-line font-mono font-bold text-ccjv-green">ccjvadmin</code>.
            L&apos;administrateur aura l&apos;obligation stricte de le modifier dès sa toute première connexion avant d&apos;accéder aux écrans du back-office.
          </div>
        </div>
      )}
    </AccountDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Identité                                                                  */
/* -------------------------------------------------------------------------- */

interface EditIdentityDialogProps {
  readonly isOpen: boolean;
  readonly target: AdminProfile | null;
  readonly onClose: () => void;
  readonly onSaved: (profile: AdminProfile) => void;
}

export function EditIdentityDialog({
  isOpen,
  target,
  onClose,
  onSaved,
}: EditIdentityDialogProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !target) return;
    setUsername(target.username);
    setDisplayName(target.displayName ?? "");
    setEmail(target.email ?? "");
    setError(null);
  }, [isOpen, target]);

  const handleSubmit = async () => {
    if (!target) return;

    const payload: { username?: string; displayName?: string | null; email?: string } = {};
    if (username.trim() && username.trim() !== target.username) payload.username = username.trim();
    if (displayName.trim() !== (target.displayName ?? "")) {
      payload.displayName = displayName.trim() || null;
    }
    if (email.trim() && email.trim() !== (target.email ?? "")) payload.email = email.trim();

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await updateAdminIdentity(target.id, payload);
      onSaved(saved);
      onClose();
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountDialog
      isOpen={isOpen}
      title="Modifier les informations du compte"
      description="L'adresse de connexion est gérée par le service d'authentification ; le nom d'utilisateur reste interne."
      isSubmitting={isSubmitting}
      error={error}
      submitLabel="Enregistrer"
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
    >
      <FormField label="Adresse électronique de connexion">
        <Input
          type="email"
          value={email}
          autoComplete="off"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Non résolue"
        />
      </FormField>

      <FormField label="Nom d'utilisateur" required>
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </FormField>

      <FormField label="Nom affiché" hint="Facultatif.">
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </FormField>
    </AccountDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Habilitation                                                              */
/* -------------------------------------------------------------------------- */

interface AuthorizationDialogProps {
  readonly isOpen: boolean;
  readonly target: AdminProfile | null;
  /** Rôle de l'acteur connecté : borne les rôles qu'il peut écrire. */
  readonly actorRole: AdminRole | undefined;
  readonly departments: readonly { id: string; name: string }[];
  readonly onClose: () => void;
  readonly onSaved: (profile: AdminProfile) => void;
}

export function AuthorizationDialog({
  isOpen,
  target,
  actorRole,
  departments,
  onClose,
  onSaved,
}: AuthorizationDialogProps) {
  /**
   * Un `ADMIN` administre les responsables de département, et **ne peut pas
   * écrire un rôle système** : le sélecteur est donc borné au responsable
   * (docs/028 D-03, D-04). La policy applique la même règle côté serveur, y
   * compris sur une requête fabriquée à la main.
   */
  const isActorAdmin = actorRole === "ADMIN";
  const [role, setRole] = useState<AdminRole>("DEPARTMENT_MANAGER");
  const [departmentId, setDepartmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !target) return;
    setRole(target.role);
    setDepartmentId(target.departmentId ?? "");
    setError(null);
  }, [isOpen, target]);

  const isManager = role === "DEPARTMENT_MANAGER";

  const handleSubmit = async () => {
    if (!target) return;
    if (isManager && !departmentId) {
      setError("Un responsable de département doit être rattaché à un département.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await updateAdminAuthorization(target.id, {
        role,
        departmentId: isManager ? departmentId : null,
      });
      onSaved(saved);
      onClose();
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountDialog
      isOpen={isOpen}
      title="Modifier l'habilitation"
      description={
        isActorAdmin
          ? "En tant qu'administrateur, vous gérez les responsables de département : le rôle ne peut pas être élevé."
          : "Le rôle et le périmètre déterminent ce que ce compte pourra faire dans le back-office."
      }
      isSubmitting={isSubmitting}
      error={error}
      submitLabel="Enregistrer l'habilitation"
      isDanger={!isManager}
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
    >
      <FormField label="Rôle" required>
        <Select
          value={role}
          disabled={isActorAdmin}
          onChange={(event) => setRole(event.target.value as AdminRole)}
        >
          <option value="DEPARTMENT_MANAGER">Responsable de département</option>
          {!isActorAdmin && <option value="ADMIN">Administrateur</option>}
          {!isActorAdmin && (
            <option value="SUPER_ADMIN">Super administrateur</option>
          )}
        </Select>
      </FormField>

      {isActorAdmin && (
        <p className="font-sans text-[0.72rem] leading-relaxed text-ccjv-ink-secondary">
          Un administrateur ne peut pas attribuer un rôle qu&apos;il ne détient pas
          (docs/028 D-03, D-04).
        </p>
      )}

      {isManager && (
        <FormField label="Département de rattachement" required>
          <Select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">— Choisir un département —</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </FormField>
      )}
    </AccountDialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mot de passe                                                              */
/* -------------------------------------------------------------------------- */

interface PasswordDialogProps {
  readonly isOpen: boolean;
  /** Compte visé ; `null` = son propre compte. */
  readonly target: AdminProfile | null;
  readonly onClose: () => void;
}

/**
 * Définition d'un mot de passe.
 *
 * Le secret reste dans l'état local le temps de la requête, puis est effacé au
 * démontage du champ — il n'est ni journalisé, ni réaffiché, ni renvoyé par
 * l'API. La double saisie évite une faute de frappe qui enfermerait le titulaire
 * hors de son compte.
 */
export function PasswordDialog({ isOpen, target, onClose }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPassword("");
    setConfirmation("");
    setError(null);
    setDone(false);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (password.length < 12) {
      setError("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux saisies ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (target) {
        await setAdminPassword(target.id, password);
      } else {
        await changeOwnPassword(password);
      }
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountDialog
      isOpen={isOpen}
      title={target ? "Réinitialiser le mot de passe" : "Changer mon mot de passe"}
      description={
        target
          ? `Le nouveau mot de passe de « ${target.username} » sera transmis au service d'authentification, qui le chiffre. Il ne sera jamais réaffiché.`
          : "Votre nouveau mot de passe sera transmis au service d'authentification. Les sessions déjà ouvertes restent valides jusqu'à expiration."
      }
      isSubmitting={isSubmitting}
      error={error}
      submitLabel={target ? "Réinitialiser" : "Changer"}
      isDanger
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
    >
      {done ? (
        <p className="border border-ccjv-green/30 bg-ccjv-green-soft px-3 py-2 font-sans text-xs leading-relaxed text-ccjv-green">
          Le mot de passe a été modifié. Communiquez-le au titulaire par un canal
          sûr : il ne s&apos;affichera plus.
        </p>
      ) : (
        <>
          <FormField label="Nouveau mot de passe" required hint="12 caractères minimum.">
            <Input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>

          <FormField label="Confirmation" required>
            <Input
              type="password"
              value={confirmation}
              autoComplete="new-password"
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </FormField>
        </>
      )}
    </AccountDialog>
  );
}
