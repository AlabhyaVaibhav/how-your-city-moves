/* Bengaluru: the first city. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "bangalore",
  name: "Bangalore",
  official: "Bengaluru",
  country: "India",
  // `g` is the stylized isometric position; `ll` is the real one
  areas: {
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
  },
  defaults: { home: "koramangala", office: "mgroad" },
  centre: "mgroad",
  samples: [
    { name: "Anita", home: "koramangala", office: "mgroad",       out: 555, mins: 35, back: 1110, mode: "bike" },
    { name: "Rahul", home: "indiranagar", office: "manyata",      out: 525, mins: 40, back: 1080, mode: "car" },
    { name: "Divya", home: "hsr",         office: "electronic",   out: 510, mins: 50, back: 1140, mode: "public" },
    { name: "Kabir", home: "jpnagar",     office: "whitefield",   out: 450, mins: 80, back: 1110, mode: "public" },
    { name: "Meera", home: "koramangala", office: "marathahalli", out: 570, mins: 45, back: 1170, mode: "bike" },
    { name: "Arjun", home: "hsr",         office: "mgroad",       out: 600, mins: 40, back: 1200, mode: "cycle" },
  ],
  funny: [
    "Silk Board Survivor", "Filter Coffee Fiend", "Auto Meter Skeptic", "ORR Monk", "Namma Metro Loyalist", "Pothole Cartographer",
    "Traffic Jam Philosopher", "Bike Taxi Daredevil", "Dosa Before Standup", "Rapido Regular", "One More Minute Madam", "Umbrella In July",
    "Signal Jumper (reformed)", "Podcast Finisher", "Sarjapur Nomad", "Late By Design", "Hebbal Flyover Poet", "Maggi In The Pantry",
  ],
  real: {
    lat0: 12.9135, lng0: 77.65, pxPerKm: 20.7,
    // which side of its marker each label sits, chosen so nothing overlaps
    labels: {
      manyata: R, mgroad: L, indiranagar: R, jpnagar: L, koramangala: R, marathahalli: R, whitefield: R, hsr: B,
      electronic: R, kalyannagar: R, peenya: L, yeswanthpur: B, dobaspet: R, jayanagar: L, bommasandra: L,
      chandapura: R, attibele: R, sarjapur: R, varthur: R, krpuram: R,
    },
    labelsCompact: { peenya: T, attibele: L, whitefield: T, varthur: B },
    ringLabel: "Outer Ring Road, NICE Road",
  },
  compactNudge: {
    whitefield: [30, -8], marathahalli: [-16, 30], indiranagar: [26, -10], koramangala: [-24, 4], jpnagar: [8, 0],
    jayanagar: [-34, -6], dobaspet: [24, 0], chandapura: [20, 0], krpuram: [-10, 0], varthur: [-10, 0],
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 7902476, // "Bengaluru", admin_level 7
    ring: /outer ring road|\bNICE\b|nandi infrastructure/i,
  },
  // unchanged from the single-city site so existing commuters carry over
  peopleKey: "blr-moves-v2",
});
