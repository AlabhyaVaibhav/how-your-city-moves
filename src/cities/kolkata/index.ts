/* Kolkata. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "kolkata",
  name: "Kolkata",
  official: "Kolkata",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- kolkata`, then nudged by eye); `ll` is the real one
  areas: {
    sectorv:    { label: "Salt Lake Sector V", short: "Sector V", g: [8.25, 2.52], ll: [22.572, 88.433], kind: "office", look: "towers", h: 80 },
    newtown:    { label: "New Town / Rajarhat", short: "New Town", g: [9.4, 0.2], ll: [22.581, 88.474], kind: "office", look: "towers", h: 92 },
    dalhousie:  { label: "BBD Bagh (Dalhousie)", short: "Dalhousie", g: [3.38, 5.62], ll: [22.572, 88.350], kind: "office", look: "oldtown" },
    parkstreet: { label: "Park Street", short: "Park St", g: [5.33, 9.08], ll: [22.553, 88.352], kind: "office", look: "towers", h: 50 },
    howrah:     { label: "Howrah", short: "Howrah", g: [1.43, 7.14], ll: [22.585, 88.343], kind: "home", look: "oldtown" },
    behala:     { label: "Behala", short: "Behala", g: [4.67, 11.85], ll: [22.499, 88.311], kind: "home", look: "apartments" },
    garia:      { label: "Garia", short: "Garia", g: [11.35, 8.19], ll: [22.463, 88.385], kind: "home", look: "apartments" },
    dumdum:     { label: "Dum Dum", short: "Dum Dum", g: [4.46, 2.17], ll: [22.621, 88.398], kind: "home", look: "oldtown" },
    jadavpur:   { label: "Jadavpur", short: "Jadavpur", g: [9.24, 9.52], ll: [22.497, 88.371], kind: "home", look: "apartments" },
    ballygunge: { label: "Ballygunge", short: "Ballygunge", g: [6.86, 7], ll: [22.527, 88.364], kind: "home", look: "suburb" },
    barasat:    { label: "Barasat", short: "Barasat", g: [6.18, -3.37], ll: [22.722, 88.481], kind: "home", look: "apartments" },
  },
  defaults: { home: "behala", office: "sectorv" },
  centre: "parkstreet",
  samples: [
    { name: "Ananya", home: "behala", office: "sectorv", out: 540, mins: 60, back: 1110, mode: "public" },
    { name: "Sourav", home: "dumdum", office: "dalhousie", out: 570, mins: 40, back: 1080, mode: "public" },
    { name: "Rimjhim", home: "ballygunge", office: "parkstreet", out: 600, mins: 20, back: 1170, mode: "car" },
    { name: "Debashis", home: "howrah", office: "dalhousie", out: 555, mins: 25, back: 1080, mode: "public" },
    { name: "Tanya", home: "garia", office: "newtown", out: 510, mins: 55, back: 1140, mode: "car" },
    { name: "Arnab", home: "barasat", office: "sectorv", out: 510, mins: 50, back: 1140, mode: "public" },
  ],
  funny: [
    "Yellow Taxi Negotiator", "Howrah Bridge Pedestrian", "Tram Nostalgic", "Adda Overrunner", "Phuchka Before Standup", "Sector V Lifer",
    "Metro Line 1 Veteran", "Shared Auto Tactician", "Rosogolla Diplomat", "EM Bypass Monk", "Durga Pujo Route Planner", "Ferry Ghat Regular",
    "Ultadanga Flyover Poet", "Mishti Doi Hoarder", "Monsoon Rickshaw Rider", "Fish Market Early Bird", "Park Street Night Owl", "New Town Cyclist",
  ],
  real: {
    lat0: 22.5629, lng0: 88.3875, pxPerKm: 29.0,
    labels: { sectorv: R, newtown: R, dalhousie: R, parkstreet: R, howrah: R, behala: R, garia: R, dumdum: R, jadavpur: R, ballygunge: R, barasat: R },
    ringLabel: "EM Bypass, VIP Road, the bridges",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 9381363,
    ring: /eastern metropolitan bypass|e\.? ?m\.? bypass|vidyasagar setu|rabindra setu|howrah bridge|vip road/i,
    rivers: true,
    rail: true,
  },
  peopleKey: "hycm-kolkata-people",
});
