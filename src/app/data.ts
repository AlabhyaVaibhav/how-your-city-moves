/* The areas, sample commuters and funny names of the city on show (see src/cities), plus transport modes. */
import { CITY } from "./city";
import type { AreaId } from "../cities";
import type { Area } from "../cities/types";
import type { ModeId } from "./modes";

export type { AreaId } from "../cities";
export type { Area, AreaKind } from "../cities/types";

export const NODES: Record<AreaId, Area> = CITY.areas;
export const AREA_IDS = Object.keys(NODES) as AreaId[];
/** True for an area of the city on show. */
export const isAreaId = (v: unknown): v is AreaId => typeof v === "string" && Object.hasOwn(NODES, v);

export { MODES, MODE_IDS, MODE_VIA, isModeId, type ModeId } from "./modes";

export interface Person {
  id: string;
  name: string;
  home: AreaId;
  office: AreaId;
  /** Minute of day they leave home. */
  out: number;
  /** One-way commute in minutes. */
  mins: number;
  /** Minute of day they leave work. */
  back: number;
  /** Missing for commuters added before modes existed. */
  mode?: ModeId;
}

export const SAMPLE: Omit<Person, "id">[] = CITY.samples;

export const FUNNY = CITY.funny;

export function funnyName(taken: readonly Person[], rnd: () => number = Math.random): string {
  const used = new Set(taken.map(p => p.name));
  const free = FUNNY.filter(n => !used.has(n));
  return free.length
    ? free[Math.floor(rnd() * free.length)]!
    : FUNNY[Math.floor(rnd() * FUNNY.length)]! + " " + (taken.length + 1);
}
