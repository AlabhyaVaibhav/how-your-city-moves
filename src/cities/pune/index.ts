/* Pune. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "pune",
  name: "Pune",
  official: "Pune",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- pune`, then nudged by eye); `ll` is the real one
  areas: {
    hinjewadi:       { label: "Hinjewadi IT Park", short: "Hinjewadi", g: [-0.89, 6.71], ll: [18.591, 73.739], kind: "office", look: "towers", h: 92 },
    magarpatta:      { label: "Magarpatta City", short: "Magarpatta", g: [11.82, 4.11], ll: [18.515, 73.927], kind: "office", look: "towers", h: 70 },
    kharadi:         { label: "Kharadi (EON IT Park)", short: "Kharadi", g: [8.81, 1.59], ll: [18.551, 73.941], kind: "office", look: "towers", h: 84 },
    pimprichinchwad: { label: "Pimpri-Chinchwad", short: "PCMC", g: [0.85, 1.96], ll: [18.629, 73.800], kind: "office", look: "industry" },
    shivajinagar:    { label: "Shivajinagar", short: "Shivajinagar", g: [5.86, 7.37], ll: [18.531, 73.847], kind: "office", look: "towers", h: 54 },
    peth:            { label: "Old Pune (the Peths)", short: "Peths", g: [7.81, 6.69], ll: [18.517, 73.856], kind: "home", look: "oldtown" },
    kothrud:         { label: "Kothrud", short: "Kothrud", g: [8.05, 10.09], ll: [18.507, 73.807], kind: "home", look: "apartments" },
    baner:           { label: "Baner", short: "Baner", g: [2.25, 7.22], ll: [18.559, 73.786], kind: "home", look: "apartments" },
    wakad:           { label: "Wakad", short: "Wakad", g: [0, 4.56], ll: [18.599, 73.764], kind: "home", look: "apartments" },
    aundh:           { label: "Aundh", short: "Aundh", g: [3.56, 4.68], ll: [18.558, 73.807], kind: "home", look: "apartments" },
    vimannagar:      { label: "Viman Nagar", short: "Viman Ngr", g: [6.02, 1.81], ll: [18.567, 73.914], kind: "home", look: "apartments" },
    koregaonpark:    { label: "Koregaon Park", short: "Koregaon Pk", g: [8.66, 4.07], ll: [18.536, 73.893], kind: "home", look: "suburb" },
    wagholi:         { label: "Wagholi", short: "Wagholi", g: [8.62, -1.64], ll: [18.580, 73.983], kind: "home", look: "apartments" },
    katraj:          { label: "Katraj", short: "Katraj", g: [10.85, 8.56], ll: [18.452, 73.858], kind: "home", look: "apartments" },
  },
  defaults: { home: "kothrud", office: "hinjewadi" },
  centre: "shivajinagar",
  samples: [
    { name: "Aditi", home: "kothrud", office: "hinjewadi", out: 510, mins: 55, back: 1110, mode: "car" },
    { name: "Rohan", home: "wakad", office: "hinjewadi", out: 540, mins: 25, back: 1140, mode: "bike" },
    { name: "Sneha", home: "koregaonpark", office: "kharadi", out: 570, mins: 30, back: 1170, mode: "bike" },
    { name: "Omkar", home: "katraj", office: "shivajinagar", out: 540, mins: 40, back: 1080, mode: "public" },
    { name: "Pallavi", home: "vimannagar", office: "magarpatta", out: 555, mins: 25, back: 1110, mode: "car" },
    { name: "Nikhil", home: "peth", office: "pimprichinchwad", out: 480, mins: 50, back: 1050, mode: "public" },
  ],
  funny: [
    "Hinjewadi Phase 3 Pilgrim", "Chitale Bakarwadi Hoarder", "1-to-4 Siesta Defender", "Puneri Pati Scholar", "FC Road Flaneur", "Misal Pav Maximalist",
    "Katraj Tunnel Veteran", "Expressway Weekender", "Chandni Chowk Flyover Survivor", "Pune Metro Early Adopter", "Rain Jacket Optimist", "Kharadi Bypass Monk",
    "Wakad Bridge Philosopher", "Sinhagad Sunday Hiker", "Magarpatta Cyclist", "PMPML Loyalist", "Amruttulya Regular", "Two-Wheeler Parking Hunter",
  ],
  real: {
    lat0: 18.5494, lng0: 73.8516, pxPerKm: 44.6,
    labels: { hinjewadi: R, magarpatta: R, kharadi: R, pimprichinchwad: R, shivajinagar: R, peth: R, kothrud: R, baner: R, wakad: R, aundh: R, vimannagar: R, koregaonpark: R, wagholi: R, katraj: R },
    ringLabel: "Expressway, western bypass (NH 48)",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 10351626,
    ring: /mumbai.?(pune|bengaluru|bangalore)|pune.?(mumbai|bengaluru|bangalore)|katraj.?dehu|ring road|\bnh ?48\b/i,
    rivers: true,
  },
  peopleKey: "hycm-pune-people",
});
