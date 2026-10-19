import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, UserPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import {
  adminUserParamsSchema,
  createAdminUserSchema,
  listAdminProfilesQuerySchema,
  setAdminActivationSchema,
  setAdminPasswordSchema,
  updateAdminAuthorizationSchema,
  updateAdminIdentitySchema,
} from "./admin.schema";
import { createAdminController } from "./admin.controller";
import type { AdminService } from "./admin.service";

/**
 * Routes d'administration.
 *
 * Aucune route de ce module n'est publique. Trois niveaux sont distingués :
 *
 * - `GET /admin/me` exige seulement d'être un administrateur **actif** : c'est
 *   l'appel par lequel l'interface sait qui est connecté. Aucune policy ne le
 *   gouverne : il ne vise aucune ressource, il rend le profil que la chaîne
 *   d'accès vient de charger.
 * - `GET /admin/profiles` expose l'annuaire administratif : son action est jugée
 *   par `authorize(UserPolicy, "READ")` — cellule 1.4, ouverte pour l'`ADMIN`
 *   (Q-02), donc refusée à lui.
 * - `POST /admin/users` et les deux `PATCH` gèrent les **comptes**, et ce sont
 *   les seules routes de l'API dont la décision dépend de la **cible**. Le garde
 *   ci-dessous filtre donc le type d'action, et le service tranche sur
 *   l'instance (`docs/029` §4.2, deux temps et une seule policy).
 *
 * **Une seule route supprime un compte, et elle est réservée au `SUPER_ADMIN`.**
 * La cellule 1.8 de `docs/029` était laissée en `?` (Q-24) ; le commanditaire l'a
 * arbitrée en faveur du `SUPER_ADMIN` seul. La suppression est physique et
 * irréversible — d'où les trois bornes portées par la policy (cible non
 * `SUPER_ADMIN`, pas de soi-même, refus de la base si des droits média sont
 * encore accordés).
 *
 * Ordre imposé : `authenticate` → `requireAdmin` →
 * `authorize(UserPolicy, ACTION)` → `validate` (`IMPLEMENTATION_SPEC` §6.2). La
 * validation d'une route protégée ne précède jamais son authentification.
 */

export interface AdminRouterDeps {
  service: AdminService;
  authDeps: AuthDependencies;
}

export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();
  const controller = createAdminController(deps.service);

  /** Administrateur actif : profil chargé et compte non désactivé. */
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get("/me", ...admin, controller.me);

  router.get(
    "/profiles",
    ...admin,
    authorize(UserPolicy, "READ"),
    validate({ query: listAdminProfilesQuerySchema }),
    controller.listProfiles,
  );

  /*
   * Le garde de création monte l'action `CREATE` — celle du responsable, la
   * seule que l'`ADMIN` détient (D-04). Ce n'est pas un relâchement : un
   * `ADMIN` qui demanderait un compte `ADMIN` ou `SUPER_ADMIN` franchit ce
   * garde puis est **refusé par le service** avec un `403`, sur la même policy
   * et sur la cible réellement demandée. Le second temps est indispensable ici,
   * parce que l'action dépend du corps de la requête — le garde, qui ne lit
   * jamais le corps, ne peut pas la connaître.
   */
  router.post(
    "/users",
    ...admin,
    authorize(UserPolicy, "CREATE"),
    validate({ body: createAdminUserSchema }),
    controller.createUser,
  );

  router.patch(
    "/users/:id/authorization",
    ...admin,
    authorize(UserPolicy, "UPDATE_ROLE_SCOPE"),
    validate({
      params: adminUserParamsSchema,
      body: updateAdminAuthorizationSchema,
    }),
    controller.updateAuthorization,
  );

  /*
   * Activation et désactivation partagent **une seule** action (`DEACTIVATE`) :
   * `docs/029` cellule 1.6 ne connaît qu'un droit, et une route par direction
   * laisserait croire à deux. `isActive` porte le sens dans le corps.
   */
  router.patch(
    "/users/:id/activation",
    ...admin,
    authorize(UserPolicy, "DEACTIVATE"),
    validate({ params: adminUserParamsSchema, body: setAdminActivationSchema }),
    controller.setActivation,
  );

  /*
   * Correction de l'**identité** d'un compte : nom d'utilisateur, nom affiché,
   * adresse de connexion. Action distincte de l'habilitation (1.5) et de
   * l'activation (1.6) : corriger un libellé ne doit pas exiger le droit de
   * redistribuer un rôle. La cellule correspondante est **absente** de
   * `docs/029` §2.1 ; l'hypothèse retenue (alignée sur 1.5, donc `SUPER_ADMIN`)
   * est déclarée dans la policy, avec sa mention `pending`.
   */
  router.patch(
    "/users/:id/identity",
    ...admin,
    authorize(UserPolicy, "UPDATE_IDENTITY"),
    validate({ params: adminUserParamsSchema, body: updateAdminIdentitySchema }),
    controller.updateIdentity,
  );

  /*
   * Réinitialisation administrative d'un mot de passe. Le secret ne fait que
   * traverser le serveur : il n'est ni journalisé, ni stocké, ni renvoyé (la
   * réponse est un `204` sans corps). Aucun algorithme de hachage n'existe dans
   * le projet : l'API d'administration Supabase est seule à empreindre.
   */
  router.patch(
    "/users/:id/password",
    ...admin,
    authorize(UserPolicy, "RESET_PASSWORD"),
    validate({ params: adminUserParamsSchema, body: setAdminPasswordSchema }),
    controller.setPassword,
  );

  /*
   * Changement de son **propre** mot de passe.
   *
   * Aucune policy : administrer son propre secret n'est pas administrer autrui.
   * Cette voie est indispensable, car Q-03 interdit à un `SUPER_ADMIN` de
   * s'administrer lui-même — sans elle, le seul compte suprême ne pourrait plus
   * faire tourner son mot de passe, donc serait verrouillé à la première
   * compromission. La garde reste réelle : administrateur **actif**, et cible
   * déduite du jeton vérifié.
   */
  router.patch(
    "/me/password",
    ...admin,
    validate({ body: setAdminPasswordSchema }),
    controller.changeOwnPassword,
  );

  /*
   * Suppression **définitive** d'un compte — arbitrage du commanditaire : la
   * cellule 1.8 de `docs/029` §2.1, laissée en `?` (Q-24), est ouverte au **seul
   * `SUPER_ADMIN`**.
   *
   * Trois bornes vivent dans la policy, pas ici : pas de compte `SUPER_ADMIN`
   * pour cible (Q-03 — le dernier compte suprême reste intouchable), pas de
   * suppression de son propre compte, et le refus de la base si le compte a
   * accordé des droits d'accès média (`media_access.granted_by` est en
   * `RESTRICT`), traduit en `409`.
   *
   * Cette route n'est **pas** une désactivation déguisée : elle efface le profil
   * et le compte d'authentification, sans retour possible.
   */
  router.delete(
    "/users/:id",
    ...admin,
    authorize(UserPolicy, "DELETE"),
    validate({ params: adminUserParamsSchema }),
    controller.remove,
  );

  return router;
}
