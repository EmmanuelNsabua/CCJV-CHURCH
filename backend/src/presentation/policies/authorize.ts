import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AdminProfile } from "@/domain/entities";
import { AuthRequiredError, ForbiddenError } from "@/shared/errors/app-error";
import { logger } from "@/infrastructure/logger";

/**
 * Point de décision **unique** de l'autorisation (`docs/029` §4.2).
 *
 * Sa raison d'être est de rendre impossible un `if (role)` dispersé dans un
 * controller : une route déclare la policy et l'action qu'elle exige, la
 * décision est prise ici, et nulle part ailleurs.
 *
 * Trois propriétés sont structurantes.
 *
 * 1. **Aucune lecture en base.** Le middleware travaille sur `req.admin`, déjà
 *    chargé par `requireAdmin`. C'est ce qui rend une policy testable
 *    unitairement, sans base de données, via `evaluate`.
 *
 * 2. **Le refus est décidé par la policy, jamais court-circuité ici.** Le
 *    middleware n'inspecte pas la ressource avant d'appeler la policy, et ne
 *    vérifie pas qu'elle existe : sinon un refus dépendant de l'existence de la
 *    ressource produirait un écart 403/404 qui révélerait l'existence d'une
 *    demande de prière — exactement ce que `docs/028` D-10 interdit. Un refus
 *    doit être **constant**, y compris quand la ressource est introuvable ou
 *    `undefined` : c'est la policy qui juge, sur une ressource absente comme sur
 *    une ressource chargée, et elle seule.
 *
 * 3. **Le motif du refus ne sort jamais du serveur.** `decision.reason` est
 *    journalisé, jamais écrit dans la réponse : deux refus de causes différentes
 *    — « vous n'êtes pas autorisé » et « cette demande n'existe pas » — doivent
 *    produire une réponse **identique** (`docs/029` §4.5, règles de non-fuite).
 *    Le message d'un refus est donc générique et fixe.
 */

/** Actions normalisées. Le vocabulaire est fermé : une route ne peut pas en inventer. */
export type PolicyAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "ARCHIVE"
  | "MANAGE_ACCESS";

/**
 * Décision d'autorisation.
 *
 * Volontairement **pas un booléen nu** : une décision porte sa raison, ce qui
 * la rend exploitable en journal d'audit et en test unitaire sans avoir à
 * reconstituer le raisonnement.
 */
export interface AuthorizationDecision {
  allowed: boolean;
  /**
   * Motif du refus. **Jamais exposé au client** : destiné aux journaux et aux
   * tests. Il est délibérément absent du corps de la réponse HTTP, qui reste
   * générique et constant quel que soit le motif.
   */
  reason?: string;
}

/**
 * Une policy est une **fonction pure** : profil, action, ressource éventuelle.
 *
 * Elle ne connaît ni Express, ni la base, ni le contexte de la requête. C'est
 * ce qui permet de la tester exhaustivement par table de cas — et un RBAC se
 * juge sur ses refus (`docs/029` §3).
 */
export type Policy<TResource = unknown> = (
  admin: AdminProfile,
  action: PolicyAction,
  resource?: TResource,
) => AuthorizationDecision;

export function allow(): AuthorizationDecision {
  return { allowed: true };
}

export function deny(reason: string): AuthorizationDecision {
  return { allowed: false, reason };
}

/**
 * Évaluation directe, sans Express.
 *
 * C'est le point d'entrée des tests unitaires de policies : on peut vérifier
 * les cellules de la matrice RBAC (`docs/029` §2) sans serveur ni jeton.
 */
export function evaluate<TResource>(
  policy: Policy<TResource>,
  admin: AdminProfile,
  action: PolicyAction,
  resource?: TResource,
): AuthorizationDecision {
  return policy(admin, action, resource);
}

/**
 * Middleware d'autorisation — à monter **après `authenticate` et
 * `requireAdmin`, avant `validate`**.
 *
 * L'ordre importe : authentifier avant d'autoriser, autoriser avant de valider.
 * Une entrée invalide présentée sans jeton doit produire **401, jamais 400** —
 * c'est une garantie de sécurité, verrouillée par les tests d'intégration.
 *
 * Le corps est `async` **sans `try/catch`** : sous Express 5, une fonction
 * asynchrone qui rejette — policy levant une erreur, ou rejetant une promesse —
 * est transmise automatiquement au middleware d'erreur. Un `try/catch` ici ne
 * ferait que dupliquer ce comportement, et risquerait surtout de transformer un
 * défaut de policy en autorisation implicite.
 *
 * @param policy  La policy à appliquer.
 * @param action  L'action exigée par la route.
 * @param extract Comment obtenir la ressource visée depuis la requête. À
 *                omettre pour une action qui ne porte sur aucune ressource
 *                (par exemple `CREATE`, ou une lecture de collection).
 *                Forme retenue : une fonction explicite plutôt qu'un champ
 *                posé sur `req`, afin qu'une policy ne dépende jamais d'un
 *                middleware amont non déclaré. L'extracteur ne doit **rien
 *                charger** : il lit ce que la requête porte déjà (paramètre
 *                d'URL, ressource posée par un middleware amont). Charger la
 *                ressource ici rouvrirait l'écart 403/404 que le point 2 ferme.
 */
export function authorize<TResource>(
  policy: Policy<TResource>,
  action: PolicyAction,
  extract?: (req: Request) => TResource | undefined,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // `requireAdmin` a déjà refusé les requêtes sans profil. Cette branche ne
    // duplique pas le contrôle : elle signale un montage incorrect de la route.
    const admin = req.admin;
    if (!admin) {
      next(new AuthRequiredError());
      return;
    }

    // Ressource transmise telle quelle, sans jugement : `undefined` reste une
    // entrée légitime, que la policy traite selon ses propres règles.
    const resource = extract ? extract(req) : undefined;

    const decision = await evaluate(policy, admin, action, resource);

    if (!decision.allowed) {
      // Le détail (rôle, action, motif) reste dans les journaux ; la ressource
      // n'y figure pas — elle peut porter des données personnelles.
      logger.warn(
        {
          userId: admin.id,
          role: admin.role,
          action,
          reason: decision.reason,
        },
        "Accès refusé : décision d'autorisation négative",
      );

      // Message fixe et générique : jamais `decision.reason`, jamais la
      // ressource. Le client apprend qu'il est refusé, pas pourquoi.
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
