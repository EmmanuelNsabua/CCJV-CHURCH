import { sql, closeDatabase } from "@/infrastructure/database/client";

const tables = [
  "media",
  "departments",
  "department_media",
  "events",
  "event_media",
  "publications",
  "admin_profiles",
];

const rows = await sql<{ table: string; n: number }[]>`
  select 'media' as table, count(*)::int as n from media
  union all select 'departments', count(*)::int from departments
  union all select 'department_media', count(*)::int from department_media
  union all select 'events', count(*)::int from events
  union all select 'event_media', count(*)::int from event_media
  union all select 'publications', count(*)::int from publications
  union all select 'admin_profiles', count(*)::int from admin_profiles
`;
console.log(rows.map((r) => `${r.table}=${r.n}`).join("  "));
console.log("tables attendues:", tables.length);
await closeDatabase();
