import { DrizzleAdminProfileRepository } from "@/infrastructure/repositories/admin-profile.repository";
import { DrizzleDepartmentCapabilityRepository } from "@/infrastructure/repositories/department-capability.repository";
import { DrizzleDepartmentRepository } from "@/infrastructure/repositories/department.repository";
import { closeDatabase, db } from "@/infrastructure/database/client";
import type { DepartmentCapability } from "@/domain/departments/capabilities";
import { logger } from "@/infrastructure/logger";
import { parseCapabilityArgs, type CapabilityCliArgs } from "./lib/capability-arguments";

/**
 * Attribution d'une **capacité de département** (`docs/028` D-25).
 *
 * ### Pourquoi ce script existe
 *
 * `docs/029` Q-06 — « qui édite les capacités de département ? » — **n'est pas
 * tranchée**, et `docs/029` §5.3 explique pourquoi la question est délicate :
 * « un responsable qui pourrait modifier les capacités de son propre département
 * s'attribuerait la portée globale : c'est le vecteur d'escalade le plus direct
 * du modèle ». En conséquence, `DepartmentPolicy.canEditCapabilities` refuse
 * `EDIT_CAPABILITIES` à **tout le monde**, et aucune route n'écrit dans
 * `department_capabilities`.
 *
 * Il reste pourtant un besoin réel : sans capacité, **aucun** département ne
 * peut publier un événement à portée globale (D-25, D-26), et la fonctionnalité
 * serait inatteignable. Ce script est donc le chemin d'écriture **d'exploitation**
 * — pas un chemin applicatif, pas un rôle.
 *
 * Ce n'est pas un contournement du RBAC, et la distinction tient à trois
 * propriétés :
 *
 * 1. **Il n'est pas exposé par l'API.** Il s'exécute avec les identifiants de
 *    l'exploitant, sur la machine qui les détient — le même niveau de confiance
 *    qu'une migration.
 * 2. **Il exige l'auteur du grant** (`--granted-by`). `docs/032` §3.5 conserve
 *    `granted_by` précisément pour que la première écriture soit **attribuable** ;
 *    une capacité posée à la main en SQL n'aurait pas d'auteur.
 * 3. **Il est idempotent.** Le rejeu ne produit ni erreur ni doublon
 *    (`ON CONFLICT DO NOTHING`), comme toute étape d'exploitation
 *    (`docs/033`).
 *
 * Le jour où Q-06 est tranchée, une route dédiée remplacera ce script — et lui
 * seul deviendra inutile, pas la table.
 *
 * ### Usage
 *
 * ```text
 * npx tsx scripts/grant-department-capability.ts \
 *   --department <uuid-ou-slug> \
 *   --capability EVENT_SCOPE_GLOBAL \
 *   --granted-by <uuid-du-profil-administrateur> \
 *   [--revoke]
 * ```
 *
 * `--granted-by` désigne un profil **existant** dans `admin_profiles` :
 * `granted_by` est une clé étrangère en `RESTRICT`, et une valeur inventée
 * échouerait au moment de l'écriture — mieux vaut le dire avant.
 */

interface CliArgs {
  department: string;
  capability: DepartmentCapability;
  grantedBy: string;
  revoke: boolean;
}

/**
 * Lit les arguments — la validation elle-même vit dans
 * `./lib/capability-arguments`, qui n'importe **rien** de l'infrastructure et
 * reste donc testable sans ouvrir de connexion.
 */
function parseArgs(argv: readonly string[]): CapabilityCliArgs {
  return parseCapabilityArgs(argv);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const departments = new DrizzleDepartmentRepository(db);
  const capabilities = new DrizzleDepartmentCapabilityRepository(db);
  const adminProfiles = new DrizzleAdminProfileRepository(db);

  const department = await departments.findByIdOrSlug(args.department);
  if (department === null) {
    throw new Error(
      `Aucun département ne correspond à « ${args.department} ».`,
    );
  }

  const author = await adminProfiles.findById(args.grantedBy);
  if (author === null) {
    throw new Error(
      `Aucun profil administrateur ne porte l'identifiant « ${args.grantedBy} ». ` +
        "`granted_by` référence `admin_profiles.id` : l'auteur doit exister.",
    );
  }

  // État **avant** : un opérateur doit constater ce qui est déjà accordé plutôt
  // que le supposer. C'est aussi ce qui rend le rejeu lisible — « déjà accordée »
  // et « vient d'être accordée » ne se confondent pas dans le journal.
  const before = await capabilities.listForDepartment(department.id);
  const wasAlreadyGranted = before.includes(args.capability);

  if (args.revoke) {
    const removed = await capabilities.revoke(department.id, args.capability);
    logger.info(
      {
        department: department.slug,
        capability: args.capability,
        before,
        removed,
      },
      removed
        ? "Capacité retirée"
        : "Capacité absente : rien à retirer (le retrait est idempotent)",
    );
    return;
  }

  await capabilities.grant({
    departmentId: department.id,
    capability: args.capability,
    grantedBy: author.id,
  });

  logger.info(
    {
      department: department.slug,
      capability: args.capability,
      grantedBy: author.username,
      wasAlreadyGranted,
    },
    wasAlreadyGranted
      ? "Capacité déjà accordée : aucun changement (idempotent)"
      : "Capacité accordée",
  );
}

/**
 * N'exécute l'action que si le fichier est **lancé directement**.
 *
 * Sans cette garde, importer ce module — depuis un test, un outil ou un futur
 * script d'orchestration — ouvrirait une connexion et écrirait en base. Un effet
 * de bord à l'import est un piège : la garde coûte quatre lignes. La lecture des
 * arguments, elle, vit dans `./lib/capability-arguments`, qui n'importe rien de
 * l'infrastructure et s'éprouve donc hors ligne.
 */
const launchedDirectly =
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("scripts/grant-department-capability.ts");

if (launchedDirectly) {
  main()
    .catch((error: unknown) => {
      logger.error({ err: error }, "Attribution de capacité interrompue");
      process.exitCode = 1;
    })
    .finally(() => closeDatabase());
}
