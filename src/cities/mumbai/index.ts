/* Mumbai. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "mumbai",
  name: "Mumbai",
  official: "Mumbai",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- mumbai`, then nudged by eye); `ll` is the real one
  areas: {
    colaba:     { label: "Colaba / Fort", short: "Colaba", g: [8.92, 10.92], ll: [18.922, 72.832], kind: "office", look: "oldtown" },
    lowerparel: { label: "Lower Parel", short: "Lower Parel", g: [5.03, 12.81], ll: [18.995, 72.830], kind: "office", look: "towers", h: 100 },
    bkc:        { label: "Bandra Kurla Complex", short: "BKC", g: [6.83, 8.09], ll: [19.066, 72.866], kind: "office", look: "towers", h: 90 },
    andheri:    { label: "Andheri East (MIDC)", short: "Andheri E", g: [5.0, 4.77], ll: [19.115, 72.870], kind: "office", look: "industry" },
    powai:      { label: "Powai", short: "Powai", g: [6.47, 4.2], ll: [19.118, 72.906], kind: "office", look: "towers", h: 76 },
    malad:      { label: "Malad / Goregaon", short: "Malad", g: [0.98, 6.27], ll: [19.181, 72.835], kind: "office", look: "towers", h: 68 },
    airoli:     { label: "Airoli (Navi Mumbai)", short: "Airoli", g: [8.43, 0.83], ll: [19.157, 72.996], kind: "office", look: "towers", h: 62 },
    bandra:     { label: "Bandra West", short: "Bandra", g: [2.4, 8.92], ll: [19.059, 72.836], kind: "home", look: "apartments" },
    dadar:      { label: "Dadar", short: "Dadar", g: [5.41, 9.62], ll: [19.018, 72.844], kind: "home", look: "oldtown" },
    thane:      { label: "Thane", short: "Thane", g: [6.65, 1.72], ll: [19.197, 72.972], kind: "home", look: "apartments" },
    borivali:   { label: "Borivali", short: "Borivali", g: [2.48, 4.3], ll: [19.230, 72.857], kind: "home", look: "apartments" },
    ghatkopar:  { label: "Ghatkopar", short: "Ghatkopar", g: [10.33, 3.83], ll: [19.086, 72.908], kind: "home", look: "apartments" },
    chembur:    { label: "Chembur", short: "Chembur", g: [9.33, 7.21], ll: [19.062, 72.900], kind: "home", look: "apartments" },
    virar:      { label: "Virar", short: "Virar", g: [-2.34, 4.53], ll: [19.455, 72.811], kind: "home", look: "apartments" },
    kalyan:     { label: "Kalyan", short: "Kalyan", g: [8.35, -1.92], ll: [19.243, 73.130], kind: "home", look: "apartments" },
  },
  defaults: { home: "thane", office: "bkc" },
  centre: "dadar",
  samples: [
    { name: "Priya", home: "borivali", office: "lowerparel", out: 480, mins: 75, back: 1140, mode: "public" },
    { name: "Aamir", home: "thane", office: "bkc", out: 510, mins: 60, back: 1110, mode: "public" },
    { name: "Kavya", home: "bandra", office: "bkc", out: 570, mins: 20, back: 1170, mode: "car" },
    { name: "Sanjay", home: "virar", office: "andheri", out: 420, mins: 95, back: 1080, mode: "public" },
    { name: "Neha", home: "chembur", office: "powai", out: 540, mins: 30, back: 1140, mode: "bike" },
    { name: "Rustom", home: "dadar", office: "colaba", out: 555, mins: 40, back: 1110, mode: "public" },
  ],
  funny: [
    "Virar Fast Warrior", "Local Train Door Hanger", "Dabbawala Apprentice", "Vada Pav Strategist", "Monsoon Waterlogging Navigator", "Western Express Monk",
    "Borivali Slow Believer", "Cutting Chai Connoisseur", "Sea Link Speedster", "Kaali-Peeli Negotiator", "Metro Line 1 Regular", "Dadar Platform Sprinter",
    "BEST Bus Philosopher", "Bandstand Sunset Jogger", "Ghatkopar Skywalk Pilgrim", "Andheri Subway Swimmer", "Marine Drive Sunset Chaser", "Season Pass Veteran",
  ],
  real: {
    lat0: 19.1269, lng0: 72.8929, pxPerKm: 20.2,
    labels: { colaba: R, lowerparel: R, bkc: R, andheri: L, powai: R, malad: R, airoli: R, bandra: L, dadar: R, thane: R, borivali: R, ghatkopar: R, chembur: B, virar: R, kalyan: R },
    ringLabel: "Express highways, Sea Link, Coastal Road",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 7964376,
    ring: /eastern express|western express|sea link|coastal road|eastern freeway|santacruz.?chembur/i,
    coast: true,
    rail: true,
  },
  peopleKey: "hycm-mumbai-people",
});
