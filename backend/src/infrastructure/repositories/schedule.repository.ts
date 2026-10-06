import { asc, eq } from "drizzle-orm";
import type { ScheduleEntry } from "@/domain/entities";
import type { ScheduleEntryInput, ScheduleRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { scheduleEntries } from "@/infrastructure/database/schema";
import type { ScheduleEntryRow } from "@/infrastructure/database/schema/editorial";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance du rythme hebdomadaire.
 *
 * L'ordre d'affichage est porté par `position` (croissant) et non par le jour :
 * la communauté peut avoir plusieurs entrées le même jour, et certaines
 * rencontres ont lieu « dans la nuit ».
 */

function toScheduleEntry(row: ScheduleEntryRow): ScheduleEntry {
  return {
    id: row.id,
    day: row.day,
    title: row.title,
    timeLabel: row.timeLabel,
    audience: row.audience,
    isConfirmed: row.isConfirmed,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function firstRow<T>(rows: T[], operation: string): T {
  const row = rows[0];
  if (row === undefined) {
    throw new InternalError(`Écriture non confirmée par la base : ${operation}`);
  }
  return row;
}

export class DrizzleScheduleRepository implements ScheduleRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<ScheduleEntry[]> {
    const rows = await this.db
      .select()
      .from(scheduleEntries)
      .orderBy(asc(scheduleEntries.position), asc(scheduleEntries.createdAt));

    return rows.map(toScheduleEntry);
  }

  async findById(id: string): Promise<ScheduleEntry | null> {
    const rows = await this.db
      .select()
      .from(scheduleEntries)
      .where(eq(scheduleEntries.id, id))
      .limit(1);

    const row = rows[0];
    return row ? toScheduleEntry(row) : null;
  }

  async create(data: ScheduleEntryInput): Promise<ScheduleEntry> {
    const rows = await this.db
      .insert(scheduleEntries)
      .values({
        day: data.day,
        title: data.title,
        timeLabel: data.timeLabel,
        audience: data.audience ?? null,
        isConfirmed: data.isConfirmed ?? false,
        position: data.position ?? 0,
      })
      .returning();

    return toScheduleEntry(firstRow(rows, "création de l'horaire"));
  }

  async update(
    id: string,
    data: Partial<ScheduleEntryInput>,
  ): Promise<ScheduleEntry | null> {
    const values: Partial<typeof scheduleEntries.$inferInsert> = {};
    if (data.day !== undefined) values.day = data.day;
    if (data.title !== undefined) values.title = data.title;
    if (data.timeLabel !== undefined) values.timeLabel = data.timeLabel;
    if (data.audience !== undefined) values.audience = data.audience;
    if (data.isConfirmed !== undefined) values.isConfirmed = data.isConfirmed;
    if (data.position !== undefined) values.position = data.position;

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const rows = await this.db
      .update(scheduleEntries)
      .set(values)
      .where(eq(scheduleEntries.id, id))
      .returning();

    const row = rows[0];
    return row ? toScheduleEntry(row) : null;
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(scheduleEntries)
      .where(eq(scheduleEntries.id, id))
      .returning({ id: scheduleEntries.id });

    return rows.length > 0;
  }
}
