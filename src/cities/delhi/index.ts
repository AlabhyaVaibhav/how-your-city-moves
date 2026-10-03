/* Delhi NCR. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "delhi",
  name: "Delhi NCR",
  official: "Delhi NCR",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- delhi`, then nudged by eye); `ll` is the real one
  areas: {
    cp:              { label: "Connaught Place", short: "CP", g: [3.33, 1.96], ll: [28.632, 77.219], kind: "office", look: "oldtown", region: "Delhi" },
    cybercity:       { label: "Cyber City, Gurugram", short: "Cyber City", g: [3.49, 10.42], ll: [28.495, 77.089], kind: "office", look: "towers", h: 104, region: "Gurugram" },
    noida:           { label: "Noida Sector 62", short: "Noida 62", g: [6.54, -0.66], ll: [28.627, 77.373], kind: "office", look: "towers", h: 78, region: "Noida" },
    nehruplace:      { label: "Nehru Place", short: "Nehru Place", g: [3.02, 6.02], ll: [28.549, 77.252], kind: "office", look: "towers", h: 58, region: "Delhi" },
    okhla:           { label: "Okhla Industrial Area", short: "Okhla", g: [6.25, 3.94], ll: [28.530, 77.272], kind: "office", look: "industry", region: "Delhi" },
    aerocity:        { label: "Aerocity", short: "Aerocity", g: [3.94, 5.1], ll: [28.549, 77.120], kind: "office", look: "towers", h: 56, region: "Delhi" },
    dwarka:          { label: "Dwarka", short: "Dwarka", g: [-0.14, 7.46], ll: [28.592, 77.046], kind: "home", look: "apartments", region: "Delhi" },
    rohini:          { label: "Rohini", short: "Rohini", g: [-1.56, 3.85], ll: [28.715, 77.115], kind: "home", look: "apartments", region: "Delhi" },
    laxminagar:      { label: "Laxmi Nagar", short: "Laxmi Ngr", g: [4.69, 0.56], ll: [28.630, 77.278], kind: "home", look: "oldtown", region: "Delhi" },
    saket:           { label: "Saket", short: "Saket", g: [10.34, 5.61], ll: [28.524, 77.206], kind: "home", look: "apartments", region: "Delhi" },
    vasantkunj:      { label: "Vasant Kunj", short: "Vasant Kunj", g: [6.98, 7.5], ll: [28.520, 77.158], kind: "home", look: "suburb", region: "Delhi" },
    ghaziabad:       { label: "Ghaziabad", short: "Ghaziabad", g: [6.69, -3.57], ll: [28.665, 77.440], kind: "home", look: "apartments", region: "Ghaziabad" },
    faridabad:       { label: "Faridabad", short: "Faridabad", g: [13.26, 5.53], ll: [28.408, 77.318], kind: "home", look: "apartments", region: "Faridabad" },
    janakpuri:       { label: "Janakpuri", short: "Janakpuri", g: [0.88, 6.31], ll: [28.629, 77.081], kind: "home", look: "suburb", region: "Delhi" },
    karolbagh:       { label: "Karol Bagh", short: "Karol Bagh", g: [0.98, 2.94], ll: [28.652, 77.190], kind: "home", look: "oldtown", region: "Delhi" },
    golfcourseroad:  { label: "Golf Course Road", short: "Golf Crs Rd", g: [7.43, 10.49], ll: [28.450, 77.099], kind: "office", look: "towers", h: 90, region: "Gurugram" },
    sohnaroad:       { label: "Sohna Road", short: "Sohna Rd", g: [9.5, 9.95], ll: [28.414, 77.042], kind: "home", look: "apartments", region: "Gurugram" },
    newgurgaon:      { label: "New Gurgaon", short: "New Ggn", g: [7.16, 12.72], ll: [28.402, 76.955], kind: "home", look: "apartments", region: "Gurugram" },
    manesar:         { label: "IMT Manesar", short: "Manesar", g: [5.89, 13.49], ll: [28.364, 76.925], kind: "office", look: "industry", region: "Gurugram" },
    noida18:         { label: "Noida Sector 18", short: "Noida 18", g: [7.86, 3.25], ll: [28.571, 77.323], kind: "office", look: "towers", h: 60, region: "Noida" },
    noidaexpressway: { label: "Noida Expressway (Sec 125–135)", short: "Expressway", g: [10.72, 3.22], ll: [28.512, 77.377], kind: "office", look: "towers", h: 84, region: "Noida" },
    greaternoida:    { label: "Greater Noida", short: "Gr. Noida", g: [12.73, 2.47], ll: [28.463, 77.508], kind: "home", look: "apartments", region: "Greater Noida" },
    grnoidawest:     { label: "Greater Noida West", short: "GN West", g: [9.12, -1.15], ll: [28.609, 77.438], kind: "home", look: "apartments", region: "Greater Noida" },
  },
  defaults: { home: "dwarka", office: "cybercity" },
  centre: "cp",
  samples: [
    { name: "Ishaan", home: "dwarka", office: "cybercity", out: 540, mins: 45, back: 1140, mode: "car" },
    { name: "Simran", home: "rohini", office: "cp", out: 510, mins: 55, back: 1080, mode: "public" },
    { name: "Faiz", home: "laxminagar", office: "noida", out: 540, mins: 35, back: 1110, mode: "public" },
    { name: "Tanvi", home: "saket", office: "nehruplace", out: 570, mins: 20, back: 1170, mode: "bike" },
    { name: "Gaurav", home: "faridabad", office: "okhla", out: 480, mins: 40, back: 1050, mode: "bike" },
    { name: "Meher", home: "vasantkunj", office: "aerocity", out: 555, mins: 20, back: 1140, mode: "car" },
    { name: "Rhea", home: "grnoidawest", office: "noidaexpressway", out: 540, mins: 40, back: 1110, mode: "car" },
    { name: "Vivek", home: "sohnaroad", office: "golfcourseroad", out: 570, mins: 30, back: 1140, mode: "car" },
  ],
  funny: [
    "Rajiv Chowk Interchange Survivor", "Blue Line Loyalist", "DND Flyway Speedster", "Gurgaon Toll Philosopher", "Chhole Bhature Before Standup", "AQI App Refresher",
    "Ring Road Monk", "E-Rickshaw Daredevil", "Odd-Even Strategist", "Kashmere Gate Navigator", "Yellow Line Sardine", "Aerocity Lounge Lizard",
    "Paranthe Wali Gali Regular", "Fog Season Veteran", "Metro Card Topper-Upper", "CP Inner Circle Orbiter", "Cyber Hub Lunch Queue", "Noida Extension Optimist",
    "IFFCO Chowk Survivor", "Golf Course Road Dreamer", "Pari Chowk Navigator",
  ],
  real: {
    lat0: 28.55, lng0: 77.215, pxPerKm: 15.5,
    labels: { cp: R, cybercity: R, noida: R, nehruplace: R, okhla: R, aerocity: R, dwarka: R, rohini: R, laxminagar: B, saket: R, vasantkunj: L, ghaziabad: L, faridabad: R, janakpuri: R, karolbagh: R, golfcourseroad: R, sohnaroad: R, newgurgaon: R, manesar: R, noida18: R, noidaexpressway: R, greaternoida: L, grnoidawest: L },
    ringLabel: "Ring Roads, DND, Barapullah",
    boundaryLabel: "Delhi state border",
    legendTop: true,
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 1942586,
    ring: /\bring road\b|dnd|dwarka expressway|barapullah/i,
    rivers: true,
  },
  peopleKey: "hycm-delhi-people",
});
