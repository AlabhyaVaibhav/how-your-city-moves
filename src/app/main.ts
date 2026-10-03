/*
 * Map page entry: settle which city to show, then load the app (or nothing, if we're moving on).
 * Only returning contributors on the default page wait for the city lookup; everyone else starts at once.
 */
import { CITY_ID, needsLookup, savedCity, settleCity } from "./city";
import { hasContributed } from "./access";
import { detectCity } from "../lib/detectCity";

async function start() {
  const detected = needsLookup(CITY_ID, location.search, savedCity()) && hasContributed() ? (await detectCity(1200)).city : null;
  if (!settleCity(detected)) await import("./app");
}
void start();
