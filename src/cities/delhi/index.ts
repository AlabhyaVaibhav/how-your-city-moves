/* Delhi. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "delhi",
  name: "Delhi",
  official: "Delhi",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- delhi`, then nudged by eye); `ll` is the real one
  areas: {
    cp:         { label: "Connaught Place", short: "CP", g: [4.4, 1.68], ll: [28.632, 77.219], kind: "office", look: "oldtown" },
    cybercity:  { label: "Cyber City, Gurugram", short: "Cyber City", g: [5.56, 11.22], ll: [28.495, 77.089], kind: "office", look: "towers", h: 104 },
    noida:      { label: "Noida Sector 62", short: "Noida 62", g: [9.63, 0.03], ll: [28.627, 77.373], kind: "office", look: "towers", h: 78 },
    nehruplace: { label: "Nehru Place", short: "Nehru Place", g: [6.98, 4.26], ll: [28.549, 77.252], kind: "office", look: "towers", h: 58 },
    okhla:      { label: "Okhla Industrial Area", short: "Okhla", g: [9.98, 3.83], ll: [28.530, 77.272], kind: "office", look: "industry" },
    aerocity:   { label: "Aerocity", short: "Aerocity", g: [5.26, 5.98], ll: [28.549, 77.120], kind: "office", look: "towers", h: 56 },
    dwarka:     { label: "Dwarka", short: "Dwarka", g: [1.29, 8.89], ll: [28.592, 77.046], kind: "home", look: "apartments" },
    rohini:     { label: "Rohini", short: "Rohini", g: [-0.89, 3.7], ll: [28.715, 77.115], kind: "home", look: "apartments" },
    laxminagar: { label: "Laxmi Nagar", short: "Laxmi Ngr", g: [6.82, 0.66], ll: [28.630, 77.278], kind: "home", look: "oldtown" },
    saket:      { label: "Saket", short: "Saket", g: [8.74, 7.37], ll: [28.524, 77.206], kind: "home", look: "apartments" },
    vasantkunj: { label: "Vasant Kunj", short: "Vasant Kunj", g: [7.03, 9.12], ll: [28.520, 77.158], kind: "home", look: "suburb" },
    ghaziabad:  { label: "Ghaziabad", short: "Ghaziabad", g: [6.73, -2.86], ll: [28.665, 77.440], kind: "home", look: "apartments" },
    faridabad:  { label: "Faridabad", short: "Faridabad", g: [12.67, 6.7], ll: [28.408, 77.318], kind: "home", look: "apartments" },
    janakpuri:  { label: "Janakpuri", short: "Janakpuri", g: [2, 6.16], ll: [28.629, 77.081], kind: "home", look: "suburb" },
    karolbagh:  { label: "Karol Bagh", short: "Karol Bagh", g: [2.46, 3.18], ll: [28.652, 77.190], kind: "home", look: "oldtown" },
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
  ],
  funny: [
    "Rajiv Chowk Interchange Survivor", "Blue Line Loyalist", "DND Flyway Speedster", "Gurgaon Toll Philosopher", "Chhole Bhature Before Standup", "AQI App Refresher",
    "Ring Road Monk", "E-Rickshaw Daredevil", "Odd-Even Strategist", "Kashmere Gate Navigator", "Yellow Line Sardine", "Aerocity Lounge Lizard",
    "Paranthe Wali Gali Regular", "Fog Season Veteran", "Metro Card Topper-Upper", "CP Inner Circle Orbiter", "Cyber Hub Lunch Queue", "Noida Extension Optimist",
  ],
  real: {
    lat0: 28.5811, lng0: 77.2105, pxPerKm: 25.7,
    labels: { cp: R, cybercity: R, noida: R, nehruplace: R, okhla: R, aerocity: R, dwarka: R, rohini: R, laxminagar: R, saket: R, vasantkunj: R, ghaziabad: L, faridabad: R, janakpuri: R, karolbagh: R },
    ringLabel: "Ring Roads, DND, Barapullah",
    boundaryLabel: "Delhi state border",
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
