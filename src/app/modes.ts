/* Ways of getting to work. Its own module so city definitions can use it without importing the current city. */

/** How someone gets to work. Keys are what's stored and sent; keep in step with the modes_known check in supabase/migrations. */
export const MODES = {
  walk:   "Walk",
  cycle:  "Cycle",
  bike:   "Bike",
  car:    "Car",
  public: "Public transport",
} as const;
export type ModeId = keyof typeof MODES;
/** Mode as it reads mid-sentence: "Koramangala to MG Road, by bike". */
export const MODE_VIA: Record<ModeId, string> = {
  walk: "on foot", cycle: "by cycle", bike: "by bike", car: "by car", public: "by public transport",
};
export const MODE_IDS = Object.keys(MODES) as ModeId[];
export const isModeId = (v: unknown): v is ModeId => typeof v === "string" && Object.hasOwn(MODES, v);
