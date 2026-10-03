/* The numbers on a commute card. Pure, so they're easy to test. */
import type { Person } from "./data";
import { MODE_VIA } from "./modes";
import { dayCount, daysLabel } from "./days";

/** Working days in a year when we don't know someone's days, the same everywhere so cards compare fairly. */
export const WORKDAYS = 240;
/** Working weeks in a year, for people who said which days they travel (240 = 5 days × 48 weeks). */
export const WORK_WEEKS = 48;

/** Things a year of commuting adds up to, by country. Hours each; the first one that comes out at 2 to 99 wins. */
const EQUIVALENTS: Record<string, [label: (n: number) => string, hours: number][]> = {
  India: [
    [n => `${n} Test matches, start to finish`, 30],
    [n => `${n} Mumbai–Delhi Rajdhani rides`, 16],
    [n => `${n} full IPL finals`, 4],
  ],
  "United States": [
    [n => `${n} flights from SFO to London`, 10.5],
    [n => `${n} Super Bowls, ads and all`, 3.7],
  ],
};

export interface CardStats {
  /** Hours a year spent commuting, both ways. */
  hours: number;
  /** The same in full 24-hour days, one decimal. */
  days: number;
  /** "11 Test matches, start to finish", or null if nothing fits. */
  equivalent: string | null;
  /** "35 min each way, by bike". */
  detail: string;
}

export function cardStats(p: Pick<Person, "mins" | "mode" | "days">, country: string): CardStats {
  const daysAYear = p.days ? dayCount(p.days) * WORK_WEEKS : WORKDAYS;
  const hours = Math.round(p.mins * 2 * daysAYear / 60);
  const days = Math.round(hours / 24 * 10) / 10;
  let equivalent: string | null = null;
  for (const [label, h] of EQUIVALENTS[country] ?? EQUIVALENTS.India!) {
    const n = Math.round(hours / h);
    if (n >= 2 && n <= 99) { equivalent = label(n); break; }
  }
  return { hours, days, equivalent, detail: `${p.mins} min each way${p.mode ? ", " + MODE_VIA[p.mode] : ""}${p.days ? ", " + daysLabel(p.days) : ""}` };
}
