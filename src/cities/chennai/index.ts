/* Chennai. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "chennai",
  name: "Chennai",
  official: "Chennai",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- chennai`, then nudged by eye); `ll` is the real one
  areas: {
    sholinganallur: { label: "Sholinganallur (OMR)", short: "Sholinganallur", g: [11.21, 6.87], ll: [12.901, 80.228], kind: "office", look: "towers", h: 84 },
    taramani:       { label: "Taramani (TIDEL Park)", short: "Taramani", g: [8.74, 3.05], ll: [12.989, 80.248], kind: "office", look: "towers", h: 76 },
    guindy:         { label: "Guindy Industrial Estate", short: "Guindy", g: [4.34, 5.53], ll: [13.007, 80.213], kind: "office", look: "industry" },
    ambattur:       { label: "Ambattur Industrial Estate", short: "Ambattur", g: [-0.39, 3.13], ll: [13.098, 80.162], kind: "office", look: "industry" },
    chennaicentral: { label: "Chennai Central / Parrys", short: "Central", g: [6.32, -3.23], ll: [13.083, 80.275], kind: "office", look: "oldtown" },
    siruseri:       { label: "SIPCOT Siruseri", short: "Siruseri", g: [10.12, 9.25], ll: [12.826, 80.219], kind: "office", look: "towers", h: 70 },
    tnagar:         { label: "T. Nagar", short: "T. Nagar", g: [5.27, 0.66], ll: [13.042, 80.234], kind: "home", look: "oldtown" },
    adyar:          { label: "Adyar", short: "Adyar", g: [11, 1.85], ll: [13.004, 80.255], kind: "home", look: "suburb" },
    velachery:      { label: "Velachery", short: "Velachery", g: [7.18, 4.93], ll: [12.976, 80.221], kind: "home", look: "apartments" },
    tambaram:       { label: "Tambaram", short: "Tambaram", g: [4.13, 11.01], ll: [12.925, 80.118], kind: "home", look: "apartments" },
    annanagar:      { label: "Anna Nagar", short: "Anna Nagar", g: [1.93, 1.99], ll: [13.085, 80.210], kind: "home", look: "apartments" },
    mylapore:       { label: "Mylapore", short: "Mylapore", g: [8.57, -0.58], ll: [13.034, 80.268], kind: "home", look: "oldtown" },
    porur:          { label: "Porur", short: "Porur", g: [1.51, 6.13], ll: [13.035, 80.158], kind: "home", look: "apartments" },
  },
  defaults: { home: "velachery", office: "sholinganallur" },
  centre: "tnagar",
  samples: [
    { name: "Divya", home: "velachery", office: "sholinganallur", out: 540, mins: 35, back: 1110, mode: "car" },
    { name: "Arun", home: "tambaram", office: "siruseri", out: 510, mins: 50, back: 1140, mode: "public" },
    { name: "Meenakshi", home: "mylapore", office: "chennaicentral", out: 555, mins: 30, back: 1080, mode: "public" },
    { name: "Vignesh", home: "annanagar", office: "ambattur", out: 540, mins: 25, back: 1080, mode: "bike" },
    { name: "Janani", home: "adyar", office: "taramani", out: 570, mins: 15, back: 1170, mode: "bike" },
    { name: "Prakash", home: "porur", office: "guindy", out: 510, mins: 30, back: 1110, mode: "bike" },
  ],
  funny: [
    "Filter Kaapi Purist", "OMR Monk", "Kathipara Cloverleaf Navigator", "Share Auto Strategist", "MRTS Mystery Solver", "Sea Breeze Waiter",
    "Marina Morning Walker", "Electric Train Regular", "Velachery Flood Veteran", "Sambar Before Standup", "TIDEL Park Lifer", "Metro Blue Line Loyalist",
    "GST Road Philosopher", "Kodambakkam Bridge Survivor", "Murukku Hoarder", "Madras Day Romantic", "December Season Rasika", "Bike Taxi Daredevil",
  ],
  real: {
    lat0: 13.0004, lng0: 80.2161, pxPerKm: 29.9,
    labels: { sholinganallur: R, taramani: R, guindy: L, ambattur: R, chennaicentral: R, siruseri: R, tnagar: R, adyar: R, velachery: R, tambaram: R, annanagar: R, mylapore: R, porur: R },
    ringLabel: "OMR, GST Road, ECR",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 1766358,
    ring: /outer ring road|rajiv gandhi salai|old mahabalipuram|grand southern trunk|\bgst\b|east coast road|\bomr\b|\becr\b/i,
    coast: true,
    rail: true,
  },
  peopleKey: "hycm-chennai-people",
});
