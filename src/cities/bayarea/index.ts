/* San Francisco Bay Area. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "bayarea",
  name: "Bay Area",
  title: "How the Bay Area moves",
  official: "San Francisco Bay Area",
  country: "United States",
  units: "mi",
  // `g` is the stylized isometric position (from `npm run place -- bayarea`, then nudged by eye); `ll` is the real one
  areas: {
    fidi:         { label: "Financial District, SF", short: "FiDi", g: [0.82, 4.98], ll: [37.795, -122.400], kind: "office", look: "towers", h: 110 },
    soma:         { label: "SoMa", short: "SoMa", g: [-1.09, 6.5], ll: [37.778, -122.405], kind: "office", look: "towers", h: 80 },
    mountainview: { label: "Mountain View", short: "Mtn View", g: [9.65, 6.24], ll: [37.390, -122.082], kind: "office", look: "towers", h: 46 },
    paloalto:     { label: "Palo Alto", short: "Palo Alto", g: [6.67, 10.12], ll: [37.443, -122.143], kind: "office", look: "towers", h: 40 },
    menlopark:    { label: "Menlo Park", short: "Menlo Park", g: [7.22, 7.25], ll: [37.452, -122.178], kind: "office", look: "towers", h: 38 },
    cupertino:    { label: "Cupertino", short: "Cupertino", g: [13.46, 6.85], ll: [37.323, -122.032], kind: "office", look: "towers", h: 36 },
    sunnyvale:    { label: "Sunnyvale", short: "Sunnyvale", g: [11.37, 4.53], ll: [37.369, -122.036], kind: "office", look: "towers", h: 44 },
    sanjose:      { label: "Downtown San Jose", short: "San Jose", g: [14.41, 4.15], ll: [37.336, -121.890], kind: "office", look: "towers", h: 70 },
    oakland:      { label: "Oakland", short: "Oakland", g: [4.06, 1.35], ll: [37.804, -122.271], kind: "home", look: "apartments" },
    berkeley:     { label: "Berkeley", short: "Berkeley", g: [0.87, 1.6], ll: [37.872, -122.272], kind: "home", look: "suburb" },
    mission:      { label: "Mission District", short: "Mission", g: [3.3, 4.03], ll: [37.760, -122.415], kind: "home", look: "apartments" },
    sunset:       { label: "Sunset District", short: "Sunset", g: [1.62, 9.09], ll: [37.753, -122.495], kind: "home", look: "suburb" },
    fremont:      { label: "Fremont", short: "Fremont", g: [9.75, 1.49], ll: [37.548, -121.989], kind: "home", look: "suburb" },
    sanmateo:     { label: "San Mateo", short: "San Mateo", g: [4.39, 7.85], ll: [37.563, -122.326], kind: "home", look: "suburb" },
    walnutcreek:  { label: "Walnut Creek", short: "Walnut Crk", g: [4.48, -1.67], ll: [37.906, -122.065], kind: "home", look: "suburb" },
  },
  defaults: { home: "mission", office: "fidi" },
  centre: "fidi",
  samples: [
    { name: "Maya", home: "mission", office: "soma", out: 540, mins: 20, back: 1080, mode: "cycle" },
    { name: "Jordan", home: "oakland", office: "fidi", out: 510, mins: 35, back: 1050, mode: "public" },
    { name: "Priyanka", home: "fremont", office: "sanjose", out: 480, mins: 40, back: 1050, mode: "car" },
    { name: "Ethan", home: "sunset", office: "mountainview", out: 450, mins: 75, back: 1050, mode: "public" },
    { name: "Lucia", home: "sanmateo", office: "paloalto", out: 510, mins: 30, back: 1080, mode: "car" },
    { name: "Kenji", home: "berkeley", office: "menlopark", out: 480, mins: 70, back: 1020, mode: "car" },
  ],
  funny: [
    "Caltrain Bullet Believer", "Bay Bridge Toll Payer", "101 Monk", "Oat Milk Latte Optimist", "BART Seat Hunter", "Fog Layer Commuter",
    "Shuttle Bus Lifer", "Scooter Daredevil", "280 Scenic Route Snob", "Dumpling Before Standup", "Ferry Building Regular", "Muni Mystery Solver",
    "Hybrid Schedule Strategist", "Burrito Before Standup", "Golden Gate Cyclist", "Carpool Lane Opportunist", "Robotaxi Early Adopter", "Sourdough Starter Parent",
  ],
  real: {
    lat0: 37.6061, lng0: -122.1999, pxPerKm: 13.1,
    labels: { fidi: R, soma: R, mountainview: R, paloalto: R, menlopark: R, cupertino: R, sunnyvale: R, sanjose: R, oakland: R, berkeley: R, mission: R, sunset: R, fremont: R, sanmateo: R, walnutcreek: R },
    ringLabel: "US 101, I-280, I-880, the bridges",
    boundaryLabel: "",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 111968,
    ring: /\bus 101\b|\bi 280\b|\bi 880\b|\bi 80\b|\bi 580\b|bay bridge|golden gate bridge|bayshore freeway|junipero serra/i,
    coast: true,
    rail: true,
  },
  peopleKey: "hycm-bayarea-people",
});
