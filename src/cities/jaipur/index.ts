/* Jaipur. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "jaipur",
  name: "Jaipur",
  official: "Jaipur",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- jaipur`, then nudged by eye); `ll` is the real one
  areas: {
    pinkcity:      { label: "Pink City (Old City)", short: "Pink City", g: [6.24, -0.5], ll: [26.924, 75.827], kind: "office", look: "oldtown" },
    cscheme:       { label: "C-Scheme", short: "C-Scheme", g: [6.28, 2.98], ll: [26.907, 75.800], kind: "office", look: "towers", h: 56 },
    sitapura:      { label: "Sitapura Industrial Area", short: "Sitapura", g: [14.93, 5.38], ll: [26.783, 75.846], kind: "office", look: "industry" },
    mwc:           { label: "Mahindra World City", short: "World City", g: [5.36, 12.23], ll: [26.807, 75.630], kind: "office", look: "towers", h: 60 },
    vki:           { label: "VKI Area", short: "VKI", g: [2.24, 0.57], ll: [26.987, 75.774], kind: "office", look: "industry" },
    vaishalinagar: { label: "Vaishali Nagar", short: "Vaishali Ngr", g: [3.76, 4.96], ll: [26.911, 75.743], kind: "home", look: "suburb" },
    mansarovar:    { label: "Mansarovar", short: "Mansarovar", g: [6.7, 6.87], ll: [26.866, 75.758], kind: "home", look: "apartments" },
    jagatpura:     { label: "Jagatpura", short: "Jagatpura", g: [11.91, 3.54], ll: [26.831, 75.838], kind: "home", look: "apartments" },
    malviyanagar:  { label: "Malviya Nagar", short: "Malviya Ngr", g: [9.22, 4.95], ll: [26.854, 75.815], kind: "home", look: "apartments" },
    rajapark:      { label: "Raja Park", short: "Raja Park", g: [9.16, 1.43], ll: [26.892, 75.828], kind: "home", look: "suburb" },
    jhotwara:      { label: "Jhotwara", short: "Jhotwara", g: [0.8, 3.01], ll: [26.950, 75.740], kind: "home", look: "oldtown" },
  },
  defaults: { home: "mansarovar", office: "sitapura" },
  centre: "cscheme",
  samples: [
    { name: "Kunal", home: "mansarovar", office: "sitapura", out: 510, mins: 40, back: 1080, mode: "bike" },
    { name: "Riya", home: "malviyanagar", office: "cscheme", out: 570, mins: 20, back: 1110, mode: "bike" },
    { name: "Vikram", home: "vaishalinagar", office: "mwc", out: 480, mins: 45, back: 1080, mode: "car" },
    { name: "Pooja", home: "rajapark", office: "pinkcity", out: 600, mins: 15, back: 1200, mode: "public" },
    { name: "Hemant", home: "jhotwara", office: "vki", out: 510, mins: 20, back: 1050, mode: "bike" },
    { name: "Anjali", home: "jagatpura", office: "sitapura", out: 540, mins: 15, back: 1080, mode: "cycle" },
  ],
  funny: [
    "Pink City Bazaar Navigator", "Ring Road Speedster", "Pyaaz Kachori Regular", "Low-Floor Bus Loyalist", "Jaipur Metro Early Adopter", "Tonk Road Philosopher",
    "Kite Season Dodger", "Dal Baati Before Standup", "Amer Fort Weekender", "Lassiwala Loyalist", "JLN Marg Monk", "E-Rickshaw Daredevil",
    "Sitapura Shift Veteran", "Chai Tapri Strategist", "Johari Bazaar Haggler", "Summer Afternoon Survivor", "MI Road Stroller", "Ghewar Hoarder",
  ],
  real: {
    lat0: 26.8829, lng0: 75.7817, pxPerKm: 23,
    labels: { pinkcity: R, cscheme: R, sitapura: R, mwc: R, vki: R, vaishalinagar: R, mansarovar: R, jagatpura: R, malviyanagar: R, rajapark: R, jhotwara: R },
    ringLabel: "Ring Road, Tonk Road, JLN Marg",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 7923743,
    ring: /ring road|tonk road|ajmer road|jawahar ?lal nehru marg|jln marg/i,
  },
  peopleKey: "hycm-jaipur-people",
});
