/*
 * Days of the week a commute happens, as a bitmask: Monday = 1 … Sunday = 64. Same encoding as
 * commutes.days in the database (supabase/migrations/20261005000000_travel_days.sql).
 */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS = 0b0011111, WEEKEND = 0b1100000, EVERY_DAY = 0b1111111;

export const isDays = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= EVERY_DAY;
export const dayCount = (mask: number) => DAYS.filter((_, i) => mask & (1 << i)).length;

/** "Mon–Fri", "Weekends", "Every day", "Mon–Wed, Sat", "Tue, Thu". */
export function daysLabel(mask: number): string {
  if (mask === EVERY_DAY) return "every day";
  if (mask === WEEKDAYS) return "Mon–Fri";
  if (mask === WEEKEND) return "weekends";
  const runs: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (!(mask & (1 << i))) continue;
    let j = i;
    while (j + 1 < 7 && mask & (1 << (j + 1))) j++;
    runs.push(j - i >= 2 ? `${DAYS[i]}–${DAYS[j]}` : j > i ? `${DAYS[i]}, ${DAYS[j]}` : DAYS[i]!);
    i = j;
  }
  return runs.join(", ");
}
