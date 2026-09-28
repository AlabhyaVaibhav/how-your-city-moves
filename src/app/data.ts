/* Places, sample commuters and funny names. `g` is the stylized isometric position; `ll` is the real one. */

export type AreaKind = "home" | "office";

export interface Area {
  label: string;
  /** Shorter label used on narrow screens. */
  short: string;
  /** Isometric grid position [gx, gy]. */
  g: [number, number];
  /** Neighbourhood centroid [lat, lng], rounded to about 100 m. Never anything more precise. */
  ll: [number, number];
  kind: AreaKind;
  h?: number;
}

const RAW_NODES = {
  manyata:      { label: "Manyata Tech Park",      short: "Manyata",      g: [4, 0],        ll: [13.048, 77.621], kind: "office", h: 96 },
  mgroad:       { label: "MG Road",                short: "MG Road",      g: [3.5, 3.5],    ll: [12.975, 77.607], kind: "office", h: 82 },
  indiranagar:  { label: "Indiranagar",            short: "Indiranagar",  g: [6, 3],        ll: [12.973, 77.641], kind: "home" },
  jpnagar:      { label: "JP Nagar",               short: "JP Nagar",     g: [2.5, 7],      ll: [12.910, 77.587], kind: "home" },
  koramangala:  { label: "Koramangala",            short: "Koramangala",  g: [5, 5.5],      ll: [12.936, 77.624], kind: "home" },
  marathahalli: { label: "Marathahalli",           short: "Marathahalli", g: [8.6, 5],      ll: [12.955, 77.698], kind: "office", h: 66 },
  whitefield:   { label: "Whitefield",             short: "Whitefield",   g: [10, 3],       ll: [12.970, 77.750], kind: "office", h: 106 },
  hsr:          { label: "HSR Layout",             short: "HSR",          g: [6.5, 7],      ll: [12.912, 77.639], kind: "home" },
  electronic:   { label: "Electronic City",        short: "E-City",       g: [5.5, 10],     ll: [12.844, 77.669], kind: "office", h: 88 },
  // added last so every earlier landmark keeps its exact drawing
  kalyannagar:  { label: "Kalyan Nagar",           short: "Kalyan Ngr",   g: [7.2, 0.4],    ll: [13.022, 77.640], kind: "home" },
  // outlying areas are pulled in towards the centre so the map stays readable
  peenya:       { label: "Peenya",                 short: "Peenya",       g: [-0.61, 3.74], ll: [13.033, 77.527], kind: "office" },
  yeswanthpur:  { label: "Yeswanthpur",            short: "Yeswanthpur",  g: [1.19, 3.19],  ll: [13.022, 77.553], kind: "office" },
  dobaspet:     { label: "Dobaspet",               short: "Dobaspet",     g: [-2.63, 3.88], ll: [13.227, 77.243], kind: "office" },
  jayanagar:    { label: "Jayanagar",              short: "Jayanagar",    g: [2.9, 4.91],   ll: [12.929, 77.582], kind: "home" },
  bommasandra:  { label: "Bommasandra",            short: "Bommasandra",  g: [8, 10],       ll: [12.816, 77.692], kind: "office" },
  chandapura:   { label: "Chandapura",             short: "Chandapura",   g: [7.11, 13.36], ll: [12.800, 77.706], kind: "home" },
  attibele:     { label: "Attibele",               short: "Attibele",     g: [11.8, 8.2],   ll: [12.778, 77.771], kind: "home" },
  sarjapur:     { label: "Sarjapur Road",          short: "Sarjapur",     g: [9.59, 8.07],  ll: [12.910, 77.685], kind: "office" },
  varthur:      { label: "Varthur",                short: "Varthur",      g: [12.5, 3.4],   ll: [12.941, 77.747], kind: "home" },
  krpuram:      { label: "KR Puram / Tin Factory", short: "KR Puram",     g: [9.92, -0.08], ll: [13.002, 77.683], kind: "home" },
} satisfies Record<string, Area>;

export type AreaId = keyof typeof RAW_NODES;
export const NODES: Record<AreaId, Area> = RAW_NODES;
export const AREA_IDS = Object.keys(NODES) as AreaId[];
export const isAreaId = (v: unknown): v is AreaId => typeof v === "string" && Object.hasOwn(NODES, v);

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
}

export const SAMPLE: Omit<Person, "id">[] = [
  { name: "Anita", home: "koramangala", office: "mgroad",       out: 555, mins: 35, back: 1110 },
  { name: "Rahul", home: "indiranagar", office: "manyata",      out: 525, mins: 40, back: 1080 },
  { name: "Divya", home: "hsr",         office: "electronic",   out: 510, mins: 50, back: 1140 },
  { name: "Kabir", home: "jpnagar",     office: "whitefield",   out: 450, mins: 80, back: 1110 },
  { name: "Meera", home: "koramangala", office: "marathahalli", out: 570, mins: 45, back: 1170 },
  { name: "Arjun", home: "hsr",         office: "mgroad",       out: 600, mins: 40, back: 1200 },
];

export const FUNNY = [
  "Silk Board Survivor", "Filter Coffee Fiend", "Auto Meter Skeptic", "ORR Monk", "Namma Metro Loyalist", "Pothole Cartographer",
  "Traffic Jam Philosopher", "Bike Taxi Daredevil", "Dosa Before Standup", "Rapido Regular", "One More Minute Madam", "Umbrella In July",
  "Signal Jumper (reformed)", "Podcast Finisher", "Sarjapur Nomad", "Late By Design", "Hebbal Flyover Poet", "Maggi In The Pantry",
];

export function funnyName(taken: readonly Person[], rnd: () => number = Math.random): string {
  const used = new Set(taken.map(p => p.name));
  const free = FUNNY.filter(n => !used.has(n));
  return free.length
    ? free[Math.floor(rnd() * free.length)]!
    : FUNNY[Math.floor(rnd() * FUNNY.length)]! + " " + (taken.length + 1);
}
