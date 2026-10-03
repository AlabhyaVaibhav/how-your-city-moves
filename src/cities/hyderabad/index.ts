/* Hyderabad. Area ids are stored in browsers and in the database, so never rename one. */
import { defineCity, type Anchor, type Basemap } from "../types";
import ROAD_KM from "./roadKm.json";

const R: Anchor = [11, 4, "start"], L: Anchor = [-11, 4, "end"], B: Anchor = [0, 21, "middle"], T: Anchor = [0, -12, "middle"];

export default defineCity({
  id: "hyderabad",
  name: "Hyderabad",
  official: "Hyderabad",
  country: "India",
  // `g` is the stylized isometric position (from `npm run place -- hyderabad`, then nudged by eye); `ll` is the real one
  areas: {
    hiteccity:    { label: "HITEC City", short: "HITEC", g: [3.44, 4.15], ll: [17.447, 78.376], kind: "office", look: "towers", h: 96 },
    gachibowli:   { label: "Gachibowli", short: "Gachibowli", g: [4.46, 8.62], ll: [17.440, 78.348], kind: "office", look: "towers", h: 88 },
    findistrict:  { label: "Financial District", short: "Fin. District", g: [2.94, 10.53], ll: [17.415, 78.340], kind: "office", look: "towers", h: 100 },
    begumpet:     { label: "Begumpet", short: "Begumpet", g: [5.48, 2.66], ll: [17.444, 78.462], kind: "office", look: "towers", h: 52 },
    uppal:        { label: "Uppal", short: "Uppal", g: [12.28, 2.56], ll: [17.401, 78.559], kind: "office", look: "industry" },
    secunderabad: { label: "Secunderabad", short: "Secunderabad", g: [8.26, 2.01], ll: [17.439, 78.498], kind: "home", look: "oldtown" },
    banjarahills: { label: "Banjara Hills", short: "Banjara Hills", g: [7.88, 5.16], ll: [17.416, 78.438], kind: "home", look: "suburb" },
    kukatpally:   { label: "Kukatpally", short: "Kukatpally", g: [2.97, 0.25], ll: [17.494, 78.399], kind: "home", look: "apartments" },
    kondapur:     { label: "Kondapur", short: "Kondapur", g: [0.78, 6.27], ll: [17.464, 78.364], kind: "home", look: "apartments" },
    charminar:    { label: "Old City (Charminar)", short: "Charminar", g: [11.17, 6.75], ll: [17.362, 78.474], kind: "home", look: "oldtown" },
    lbnagar:      { label: "LB Nagar", short: "LB Nagar", g: [14.15, 5.59], ll: [17.348, 78.552], kind: "home", look: "apartments" },
    miyapur:      { label: "Miyapur", short: "Miyapur", g: [-1.58, 3.76], ll: [17.497, 78.354], kind: "home", look: "apartments" },
    manikonda:    { label: "Manikonda", short: "Manikonda", g: [6.79, 7.51], ll: [17.405, 78.386], kind: "home", look: "apartments" },
  },
  defaults: { home: "kukatpally", office: "hiteccity" },
  centre: "banjarahills",
  samples: [
    { name: "Sai", home: "kukatpally", office: "hiteccity", out: 540, mins: 35, back: 1140, mode: "public" },
    { name: "Ayesha", home: "charminar", office: "begumpet", out: 555, mins: 40, back: 1110, mode: "bike" },
    { name: "Karthik", home: "miyapur", office: "findistrict", out: 510, mins: 45, back: 1170, mode: "car" },
    { name: "Lakshmi", home: "manikonda", office: "gachibowli", out: 570, mins: 15, back: 1170, mode: "bike" },
    { name: "Imran", home: "lbnagar", office: "uppal", out: 540, mins: 25, back: 1080, mode: "bike" },
    { name: "Vamsi", home: "secunderabad", office: "hiteccity", out: 510, mins: 55, back: 1110, mode: "public" },
  ],
  funny: [
    "Biryani Before Standup", "Cyber Towers Pilgrim", "ORR Speedster", "Irani Chai Regular", "Mindspace Junction Survivor", "Blue Line Loyalist",
    "Gachibowli Flyover Poet", "Osmania Biscuit Dunker", "Ameerpet Interchange Navigator", "Monsoon Flood Rafter", "Necklace Road Jogger", "Charminar Shortcut Seeker",
    "Kondapur Traffic Philosopher", "Auto Fare Negotiator", "Haleem Season Hopeful", "Bike Taxi Daredevil", "Durgam Cheruvu Bridge Selfie", "Shamshabad Airport Sprinter",
  ],
  real: {
    lat0: 17.4286, lng0: 78.4269, pxPerKm: 34.5,
    labels: { hiteccity: R, gachibowli: R, findistrict: R, begumpet: R, uppal: R, secunderabad: R, banjarahills: R, kukatpally: R, kondapur: R, charminar: R, lbnagar: R, miyapur: R, manikonda: R },
    ringLabel: "Outer Ring Road, PVNR Expressway",
  },
  roadKm: ROAD_KM,
  basemap: async () => (await import("./basemap.json")).default as Basemap,
  osm: {
    relation: 7868535,
    ring: /outer ring road|nehru outer|pvnr|p\. ?v\. ?narasimha/i,
  },
  peopleKey: "hycm-hyderabad-people",
});
