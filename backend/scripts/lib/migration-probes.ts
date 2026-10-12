import type { TransactionSql } from "postgres";
import type { Sonde } from "./probe-harness";

/**
 * Le catalogue des sondes de migration — **données pures**, sans connexion.
 *
 * Il vit dans `scripts/lib/` pour une raison précise : un catalogue enfermé dans
 * `verify-migrations.ts` ne serait éprouvable qu'en ouvrant un pool PostgreSQL,
 * donc jamais éprouvé. Ici, `tests/unit/probe-harness.test.ts` le charge, vérifie
 * que chaque refus nomme sa règle, et confronte chaque motif au message **réel**
 * que la base a produit — sans base.
 */

/** Identifiants d'amorçage : trois lignes existantes, lues par le vérificateur. */
export interface ContexteSondes {
  mediaId: string;
  deptId: string;
  profileId: string;
}

/** Destinataire qui n'existe dans aucune table — les triggers doivent le refuser. */
const DESTINATAIRE_INEXISTANT = "00000000-0000-4000-8000-000000000000";

/** Les trois migrations dont dépendent les sondes, et leurs tables. */
export const MIGRATION_MEDIA = "0003_medical_blue_blade.sql";
export const MIGRATION_CAPACITES = "0002_easy_magik.sql";
export const MIGRATION_PARAMETRES = "0005_late_hiroim.sql";
export const MIGRATION_NOTIFICATIONS = "0004_complete_guardian.sql";

/** Migration dont les sondes de notifications dépendent en outre (rôle `ADMIN`). */
export const RECONSTRUCTION_DES_ROLES = "0001_lowly_frightful_four.sql";

/**
 * Le catalogue, construit autour de trois identifiants réels.
 *
 * Les motifs sont **ancrés sur le nom de la contrainte ou du trigger**, et non
 * sur un fragment de phrase : c'est ce qui permet de dire *quelle* règle a
 * refusé. Volontairement, aucun motif n'est une alternative ouverte (`/refusé/`,
 * `/duplicate key/`) : une telle formulation rendrait la sonde complaisante, et
 * c'est précisément ce qui a masqué l'avortement de transaction du Lot 5.
 */
export function createProbeCatalogue(contexte: ContexteSondes): Sonde[] {
  const { mediaId, deptId, profileId } = contexte;

  return [
    /* --- Droits d'accès aux médias (0003) --------------------------------- */
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : grant valide (département, USE)",
      attendu: "accepté",
      run: (t: TransactionSql) =>
        t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profileId})`,
    },
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : grant sans aucun droit (XD-09)",
      attendu: "refusé",
      motif: /media_access_at_least_one_right/,
      run: (t: TransactionSql) =>
        t`insert into media_access (media_id, grantee_type, grantee_id, granted_by) values (${mediaId}, 'ADMIN_PROFILE', ${profileId}, ${profileId})`,
    },
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : département portant DELETE (XD-07)",
      attendu: "refusé",
      motif: /media_access_department_no_delete/,
      run: (t: TransactionSql) =>
        t`insert into media_access (media_id, grantee_type, grantee_id, can_delete, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profileId})`,
    },
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : destinataire inexistant (trigger)",
      attendu: "refusé",
      motif: /media_access: département [0-9a-f-]{36} inexistant/,
      run: (t: TransactionSql) =>
        t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${mediaId}, 'DEPARTMENT', ${DESTINATAIRE_INEXISTANT}, true, ${profileId})`,
    },
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : profil portant DELETE (autorisé, D-21)",
      attendu: "accepté",
      run: (t: TransactionSql) =>
        t`insert into media_access (media_id, grantee_type, grantee_id, can_delete, granted_by) values (${mediaId}, 'ADMIN_PROFILE', ${profileId}, true, ${profileId})`,
    },
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : seconde ligne, même département (unicité partielle)",
      attendu: "refusé",
      motif: /media_access_department_unique/,
      // Les **deux** insertions vivent dans le même `SAVEPOINT` : la première doit
      // donc réellement subsister pour que la seconde heurte l'index. Au Lot 5,
      // cette sonde avait été écrite dans une transaction déjà avortée — la
      // première ligne avait été annulée et il n'y avait **rien** à heurter.
      run: async (t: TransactionSql) => {
        await t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profileId})`;
        await t`insert into media_access (media_id, grantee_type, grantee_id, can_manage, granted_by) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profileId})`;
      },
    },
    {
      requires: MIGRATION_MEDIA,
      label: "accès média : horodatage incohérent",
      attendu: "refusé",
      motif: /media_access_timestamps_order/,
      run: (t: TransactionSql) =>
        t`insert into media_access (media_id, grantee_type, grantee_id, can_use, granted_by, granted_at, updated_at) values (${mediaId}, 'DEPARTMENT', ${deptId}, true, ${profileId}, now(), now() - interval '1 day')`,
    },

    /* --- Capacités de département (0002) ---------------------------------- */
    {
      requires: MIGRATION_CAPACITES,
      label: "capacité : vocabulaire fermé — PUBLICATION_SCOPE accepté",
      attendu: "accepté",
      run: (t: TransactionSql) =>
        t`insert into department_capabilities (department_id, capability) values (${deptId}, 'PUBLICATION_SCOPE')`,
    },
    {
      requires: MIGRATION_CAPACITES,
      label: "capacité : code hors vocabulaire refusé (docs/032 §3.5)",
      attendu: "refusé",
      motif: /department_capabilities_known_capability/,
      run: (t: TransactionSql) =>
        t`insert into department_capabilities (department_id, capability) values (${deptId}, 'EVENT_SCOPE_EVERYTHING')`,
    },
    {
      requires: MIGRATION_CAPACITES,
      label: "capacité : doublon pour le même département",
      attendu: "refusé",
      motif: /department_capabilities_department_id_capability_pk/,
      run: async (t: TransactionSql) => {
        await t`insert into department_capabilities (department_id, capability) values (${deptId}, 'EVENT_SCOPE_GLOBAL')`;
        await t`insert into department_capabilities (department_id, capability) values (${deptId}, 'EVENT_SCOPE_GLOBAL')`;
      },
    },

    /* --- Paramètres (0005) ------------------------------------------------ */
    {
      requires: MIGRATION_PARAMETRES,
      label: "paramètres : clé ordinaire acceptée",
      attendu: "accepté",
      run: (t: TransactionSql) =>
        t`insert into site_settings (key, value) values ('church_name', 'Centre Chrétien Jésus ma Vie')`,
    },
    {
      requires: MIGRATION_PARAMETRES,
      label: "paramètres : clé de secours REFUSÉE (docs/030 §5.5, D-10)",
      attendu: "refusé",
      motif: /site_settings_no_prayer_secret/,
      run: (t: TransactionSql) =>
        t`insert into site_settings (key, value) values ('recovery_key_share_1', 'fragment')`,
    },
    {
      requires: MIGRATION_PARAMETRES,
      label: "paramètres : secret de prière refusé, même en casse mixte",
      attendu: "refusé",
      motif: /site_settings_no_prayer_secret/,
      run: (t: TransactionSql) =>
        t`insert into site_settings (key, value) values ('Prayer_Crypto_Backup', 'x')`,
    },

    /* --- Notifications (0004) --------------------------------------------- */
    {
      requires: MIGRATION_NOTIFICATIONS,
      label: "notification : destinataire inexistant (trigger)",
      attendu: "refusé",
      motif: /notifications: destinataire [0-9a-f-]{36} inexistant/,
      run: (t: TransactionSql) =>
        t`insert into notifications (recipient_user_id, type) values ('00000000-0000-4000-8000-0000000000ff', 'KEY_REGISTERED')`,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Messages réels — la matière du contrôle des motifs                        */
/* -------------------------------------------------------------------------- */

/**
 * Message **réellement observé** pour chaque sonde attendant un refus.
 *
 * Relevés à l'exécution de `npm run db:verify` sur la base du projet, et non
 * reconstitués de mémoire. Ils servent à `tests/unit/probe-harness.test.ts` :
 * un motif qui ne reconnaît pas le message de sa propre sonde est un motif faux,
 * et cela se voit **sans base**.
 *
 * Le dernier n'est produit par aucune sonde : c'est le message d'une transaction
 * avortée, celui qui a fabriqué quatre refus imaginaires au Lot 5.
 */
export const MESSAGES_OBSERVES: Readonly<Record<string, string>> = {
  "accès média : grant sans aucun droit (XD-09)":
    'new row for relation "media_access" violates check constraint "media_access_at_least_one_right"',
  "accès média : département portant DELETE (XD-07)":
    'new row for relation "media_access" violates check constraint "media_access_department_no_delete"',
  "accès média : destinataire inexistant (trigger)":
    "media_access: département 00000000-0000-4000-8000-000000000000 inexistant",
  "accès média : seconde ligne, même département (unicité partielle)":
    'duplicate key value violates unique constraint "media_access_department_unique"',
  "accès média : horodatage incohérent":
    'new row for relation "media_access" violates check constraint "media_access_timestamps_order"',
  "capacité : code hors vocabulaire refusé (docs/032 §3.5)":
    'new row for relation "department_capabilities" violates check constraint "department_capabilities_known_capability"',
  "capacité : doublon pour le même département":
    'duplicate key value violates unique constraint "department_capabilities_department_id_capability_pk"',
  "paramètres : clé de secours REFUSÉE (docs/030 §5.5, D-10)":
    'new row for relation "site_settings" violates check constraint "site_settings_no_prayer_secret"',
  "paramètres : secret de prière refusé, même en casse mixte":
    'new row for relation "site_settings" violates check constraint "site_settings_no_prayer_secret"',
  "notification : destinataire inexistant (trigger)":
    "notifications: destinataire 00000000-0000-4000-8000-0000000000ff inexistant",
};

/**
 * Message d'une transaction avortée par une violation antérieure — **aucune
 * sonde ne doit jamais l'accepter comme un refus**.
 */
export const MESSAGE_TRANSACTION_AVORTEE =
  "current transaction is aborted, commands ignored until end of transaction block";

/** Code PostgreSQL de ce même avortement. */
export const CODE_TRANSACTION_AVORTEE = "25P02";
