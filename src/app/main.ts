/* Map page entry: settle which city to show first, then load the app (or nothing, if we're moving on). */
import { settleCity } from "./city";

if (!settleCity()) void import("./app");
