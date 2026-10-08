import {
  DEPARTMENT_CAPABILITIES,
  KNOWN_DEPARTMENT_CAPABILITIES,
  isDepartmentCapability,
  type DepartmentCapability,
} from "@/domain/departments/capabilities";

/**
 * Lecture des arguments du script d'attribution de capacité (`docs/028` D-25).
 *
 * **Pourquoi ce module existe séparément du script.** Le script d'exploitation
 * importe la connexion à la base ; sa lecture d'arguments, elle, est du calcul
 * pur. Les garder ensemble rendait la validation **intestable sans ouvrir un
 * pool PostgreSQL** — et un test qui ouvre une connexion pour vérifier un
 * message d'erreur finit par être supprimé. Ici, les refus s'éprouvent hors
 * ligne, et le script ne garde que ce qu'il est seul à pouvoir faire : écrire.
 *
 * Les trois refus ci-dessous sont des règles, pas du confort :
 *
 * - un **département** est toujours désigné — aucune capacité ne s'accorde « en
 *   général », ce qui reviendrait à ouvrir la portée globale à tout le monde ;
 * - une **capacité inconnue** est refusée avant l'écriture, avec la liste des
 *   valeurs admises. Le `CHECK` de `docs/032` §3.5 refuserait aussi, mais son
 *   message ne dirait pas quoi écrire ;
 * - l'**auteur du grant** est obligatoire. `docs/032` §3.5 conserve `granted_by`
 *   pour que l'autorisation soit attribuable : une capacité sans auteur ne serait
 *   opposable à personne, et c'est exactement ce que la colonne existe pour
 *   empêcher.
 */

export interface CapabilityCliArgs {
  department: string;
  /**
   * Capacité **déjà validée** contre la liste fermée.
   *
   * Le type le dit : aucun appelant en aval n'a à se demander si la chaîne reçue
   * est une capacité connue.
   */
  capability: DepartmentCapability;
  /** `admin_profiles.id` de l'auteur — la valeur écrite dans `granted_by`. */
  grantedBy: string;
  revoke: boolean;
}

export function parseCapabilityArgs(argv: readonly string[]): CapabilityCliArgs {
  const values = new Map<string, string>();
  let revoke = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token || !token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(key, next);
      index += 1;
    } else if (key === "revoke") {
      // Drapeau sans valeur : seul `--revoke` est reconnu. Un `--autre` sans
      // valeur est ignoré plutôt que deviné.
      revoke = true;
    }
  }

  const department = values.get("department");
  if (!department) {
    throw new Error("Département requis : `--department <uuid|slug>`.");
  }

  const capability =
    values.get("capability") ?? DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL;
  if (!isDepartmentCapability(capability)) {
    throw new Error(
      `Capacité inconnue « ${capability} ». Valeurs admises : ${KNOWN_DEPARTMENT_CAPABILITIES.join(", ")} (docs/032 §3.5).`,
    );
  }

  const grantedBy = values.get("granted-by");
  if (!grantedBy) {
    throw new Error(
      "Auteur du grant requis : `--granted-by <uuid du profil administrateur>`. " +
        "docs/032 §3.5 conserve l'auteur pour que le grant soit attribuable ; " +
        "une capacité sans auteur ne serait opposable à personne.",
    );
  }

  return { department, capability, grantedBy, revoke };
}
