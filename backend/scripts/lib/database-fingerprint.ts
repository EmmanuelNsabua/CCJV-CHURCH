/**
 * L'empreinte de la base : ce qui rend la phrase « transaction annulée »
 * vérifiable plutôt qu'affirmée.
 *
 * ### Pourquoi elle est ici, et non dans le vérificateur
 *
 * Une preuve n'a de valeur que si l'on sait qu'elle **sait échouer**. Un
 * vérificateur qui compare une empreinte avant/après et conclut « identique »
 * n'établit rien si cette empreinte est aveugle. En sortant cette fonction du
 * script, `npm run db:selftest` peut la confronter à un état réellement modifié
 * et exiger qu'elle le **voie** — contrôle n° 8.
 *
 * ### Ce qu'elle mesure
 *
 * 1. **Les objets** : nombre de tables, colonnes, index, contraintes, fonctions,
 *    déclencheurs et types du schéma `public`. Un `CREATE TABLE` validé par
 *    accident change ces compteurs.
 * 2. **Le contenu**, table par table, par une empreinte `md5` des lignes.
 *
 * Le second point n'est pas redondant. Compter les lignes ne suffit pas : la
 * règle des 3 archive une publication et en publie une autre, et `publications`
 * garde le même nombre de lignes avec des `status` et des `archived_at`
 * différents. Un décompte de lignes aurait déclaré « empreinte identique » après
 * la validation accidentelle de la migration 0008.
 *
 * L'empreinte de contenu agrège `to_jsonb(ligne)` **ordonné par le texte des
 * lignes elles-mêmes** : elle ne dépend donc d'aucun nom de colonne, et reste
 * calculable aussi bien avant les migrations (colonnes absentes) qu'après. Le
 * coût est linéaire, borné par la taille des tables concernées — quelques
 * dizaines de lignes dans ce projet.
 */

/** Exécute une requête SQL et renvoie ses lignes — `sql.unsafe` ou `tx.unsafe`. */
export type ExecuteurSql = (requete: string) => Promise<unknown[]>;

/**
 * Tables dont le **contenu** est comparé, ligne à ligne.
 *
 * Liste explicite et fermée : aucun nom de table extérieur n'atteint une requête.
 */
export const TABLES_EMPREINTES = [
  "admin_profiles",
  "departments",
  "department_capabilities",
  "events",
  "media",
  "media_access",
  "notifications",
  "publications",
  "site_settings",
  "static_pages",
] as const;

export interface Empreinte {
  compteurs: Record<string, number>;
  /** Empreinte du contenu, par table — `null` quand la table n'existe pas encore. */
  donnees: Record<string, string | null>;
}

const REQUETE_COMPTEURS = `
  select
    (select count(*)::int from information_schema.tables where table_schema = 'public') as tables,
    (select count(*)::int from information_schema.columns where table_schema = 'public') as colonnes,
    (select count(*)::int from pg_indexes where schemaname = 'public') as index,
    (select count(*)::int from information_schema.table_constraints where constraint_schema = 'public') as contraintes,
    (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public') as fonctions,
    (select count(*)::int from pg_trigger where not tgisinternal) as declencheurs,
    (select count(*)::int from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public') as types
`;

/** Empreinte `md5` du contenu d'une table, ou `null` si elle n'existe pas. */
export async function empreinteTable(
  executer: ExecuteurSql,
  table: string,
): Promise<string | null> {
  // `to_regclass` évite de parser une requête sur une table absente : sur une base
  // neuve, `media_access` n'existe pas encore, et la comparaison doit rester
  // possible.
  const [existence] = await executer(`select to_regclass('public.${table}') as nom`);

  if ((existence as { nom: string | null } | undefined)?.nom === null) {
    return null;
  }

  const [ligne] = await executer(
    `select md5(coalesce(string_agg(to_jsonb(x)::text, '|' order by to_jsonb(x)::text), '')) as empreinte
       from ${table} x`,
  );

  return String((ligne as { empreinte: string }).empreinte);
}

/** Les compteurs d'objets, et l'empreinte de contenu de chaque table suivie. */
export async function empreinte(executer: ExecuteurSql): Promise<Empreinte> {
  const [compteurs] = await executer(REQUETE_COMPTEURS);

  const donnees: Record<string, string | null> = {};
  for (const table of TABLES_EMPREINTES) {
    donnees[table] = await empreinteTable(executer, table);
  }

  return { compteurs: compteurs as unknown as Record<string, number>, donnees };
}

/**
 * Compare deux empreintes et **nomme** ce qui a changé.
 *
 * Seuls les **noms** de tables sont renvoyés, jamais leur contenu : le rapport
 * doit pouvoir dire « la table `site_settings` a changé » sans recopier une ligne
 * de `site_settings` dans une sortie de console.
 */
export function comparer(
  avant: Empreinte,
  apres: Empreinte,
): { identique: boolean; compteursDifferents: string[]; tablesModifiees: string[] } {
  const compteursDifferents = Object.keys(avant.compteurs).filter(
    (cle) => avant.compteurs[cle] !== apres.compteurs[cle],
  );

  const tablesModifiees = Object.keys(avant.donnees).filter(
    (table) => avant.donnees[table] !== apres.donnees[table],
  );

  return {
    identique: compteursDifferents.length === 0 && tablesModifiees.length === 0,
    compteursDifferents,
    tablesModifiees,
  };
}
