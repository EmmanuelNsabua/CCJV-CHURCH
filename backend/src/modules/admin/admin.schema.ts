import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas d'entrée du module d'administration.
 *
 * `GET /admin/me` ne reçoit aucun identifiant : le profil courant est déduit du
 * jeton vérifié — jamais d'un paramètre d'URL — ce qui interdit de lire le profil
 * d'un autre administrateur.
 *
 * Depuis le Lot 2, ce module porte aussi la **gestion des comptes** (`POST
 * /admin/users`, `PATCH /admin/users/:id/…`), dont les schémas sont déclarés
 * ci-dessous. Ce sont les seules entrées du module qui désignent un **autre**
 * compte que le sien, et elles sont donc aussi les seules dont la décision
 * dépend de la cible — d'où le second temps d'autorisation dans le service
 * (`docs/029` §4.2).
 */

/* -------------------------------------------------------------------------- */
/*  Gestion des comptes                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Les **trois** rôles techniques de `docs/028` D-01, et aucun autre.
 *
 * `SUPER_ADMIN` figure bien dans cette énumération, et c'est fidèle à la cellule
 * 1.3 de `docs/029` §2.1 (« `CREATE` compte `SUPER_ADMIN` : `SUPER_ADMIN` ✔,
 * `ADMIN` ✘ ») : la voie existe dans le contrat, mais elle est **refusée à
 * l'`ADMIN`** par `UserPolicy.CREATE_SUPER_ADMIN`, et un refus de policy est un
 * `403`, pas un `400` — c'est exactement la séquence que `docs/023` §6 déroule.
 *
 * Le compte suprême lui-même n'est pas créé par cette route en pratique : tant
 * qu'aucun profil `SUPER_ADMIN` n'existe (l'identité est désignée par
 * l'organisation, hors application), aucune requête ne peut satisfaire la
 * condition. `scripts/create-admin.ts` refuse explicitement, lui aussi, de le
 * fabriquer.
 */
const manageableRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "DEPARTMENT_MANAGER",
]);

/**
 * Mot de passe initial.
 *
 * ⚠️ **Aucun document n'arrête la façon dont un compte reçoit son premier
 * identifiant.** `docs/023` §6 écrit seulement `AuthProvider.createUser(identity)`
 * et ne dit rien du secret ; `docs/006` §2.2 se contente de déléguer la garde du
 * mot de passe à Supabase. Deux mécanismes sont donc laissés ouverts ici :
 * l'appelant peut fournir un mot de passe **provisoire**, ou le serveur en
 * génère un — et dans ce second cas l'administrateur doit le transmettre par un
 * canal sûr, ou le titulaire passer par la récupération de compte.
 *
 * La borne de 12 caractères n'est pas arbitraire : `docs/030` §5 retient
 * « ≥ 12 caractères ou ≥ 4 mots aléatoires » comme politique de phrase secrète
 * pour les données les plus sensibles du système. Aligner le minimum des comptes
 * d'administration sur celui-là est le choix le moins permissif disponible — et
 * il reste une **borne basse**, pas une politique de mot de passe complète.
 */
const passwordSchema = z
  .string()
  .min(12, "Le mot de passe provisoire doit contenir au moins 12 caractères")
  .max(200, "Le mot de passe provisoire est trop long");

/**
 * Création d'un compte d'administration.
 *
 * La dépendance `role` ↔ `departmentId` est vérifiée **ici** autant que par la
 * contrainte `admin_profiles_scope_coherence` (`docs/032` §3.1) : un
 * `DEPARTMENT_MANAGER` porte un département, un rôle système n'en porte aucun
 * (D-02). Le validateur rend un `400` lisible ; la base reste l'autorité, et un
 * chemin qui contournerait Zod ne gagnerait rien.
 */
export const createAdminUserSchema = z
  .object({
    email: z.email("Adresse électronique invalide").max(254),
    username: z
      .string()
      .trim()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères"),
    displayName: z
      .string()
      .trim()
      .max(120, "Le nom affiché ne peut pas dépasser 120 caractères")
      .nullish(),
    role: manageableRoleSchema,
    /**
     * Département de rattachement — **obligatoire** pour un responsable, et
     * refusé pour un rôle système.
     */
    departmentId: z.uuid("L'identifiant de département doit être un UUID").nullish(),
    password: passwordSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const isManager = value.role === "DEPARTMENT_MANAGER";

    if (isManager && !value.departmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message:
          "Un DEPARTMENT_MANAGER doit être rattaché à un département (docs/028 D-02) : son périmètre est ce rattachement.",
      });
    }

    if (!isManager && value.departmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message:
          "Un rôle système porte un périmètre GLOBAL et aucun département : rattacher un ADMIN ou un SUPER_ADMIN à un département violerait admin_profiles_scope_coherence (docs/032 §3.1).",
      });
    }
  });

export type CreateAdminUserBody = z.infer<typeof createAdminUserSchema>;

/**
 * Modification de l'habilitation : rôle, périmètre, rattachement.
 *
 * Les trois champs sont **obligatoires**, et non partiels. `docs/029` cellule 1.5
 * décrit une action qui réécrit une habilitation, et la contrainte de cohérence
 * `admin_profiles_scope_coherence` porte sur le **triplet** : accepter une
 * modification partielle obligerait à relire l'état courant pour deviner les
 * champs manquants, et c'est précisément ainsi qu'on produit un profil incohérent
 * pendant la fenêtre qui sépare la lecture de l'écriture.
 */
export const updateAdminAuthorizationSchema = z
  .object({
    role: manageableRoleSchema,
    departmentId: z.uuid("L'identifiant de département doit être un UUID").nullish(),
  })
  .superRefine((value, ctx) => {
    const isManager = value.role === "DEPARTMENT_MANAGER";

    if (isManager && !value.departmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message:
          "Un DEPARTMENT_MANAGER doit être rattaché à un département (docs/028 D-02).",
      });
    }

    if (!isManager && value.departmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message: "Un rôle système porte un périmètre GLOBAL et aucun département.",
      });
    }
  });

export type UpdateAdminAuthorizationBody = z.infer<
  typeof updateAdminAuthorizationSchema
>;

/** Identifiant de profil dans l'URL. */
export const adminUserParamsSchema = z.object({
  id: z.uuid("L'identifiant de profil doit être un UUID"),
});

export type AdminUserParams = z.infer<typeof adminUserParamsSchema>;

/**
 * Activation / désactivation.
 *
 * `isActive` est transmis explicitement plutôt que déduit d'un verbe HTTP : la
 * désactivation et la réactivation sont la **même** habilitation, et une route
 * par direction laisserait croire à deux droits distincts — alors que
 * `docs/029` cellule 1.6 ne connaît qu'une action.
 */
export const setAdminActivationSchema = z.object({
  isActive: z.boolean(),
});

export type SetAdminActivationBody = z.infer<typeof setAdminActivationSchema>;

/**
 * *Query* de `GET /admin/profiles` : pagination commune, bornes identiques au
 * reste de l'API (`page` ≥ 1, `limit` 1–100).
 *
 * Alias de la pagination commune, donc **strict** : c'est la convention de
 * toutes les collections, admin comprise.
 */
export const listAdminProfilesQuerySchema = paginationQuerySchema;

export type ListAdminProfilesQuery = z.infer<typeof listAdminProfilesQuerySchema>;
