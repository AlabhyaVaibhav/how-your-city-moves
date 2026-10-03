/*
 * Landmarks kept in their own files, by area id. A landmark here replaces the built-in drawing in
 * ../landmarks.ts. Make new ones with the iso-landmark skill (.claude/skills/iso-landmark).
 */
import type { AreaId } from "../data";
import type { DrawLandmark } from "../landmarks";
import { draw as colaba } from "./colaba";
import { draw as cp } from "./cp";
import { draw as charminar } from "./charminar";
import { draw as howrah } from "./howrah";
import { draw as pinkcity } from "./pinkcity";
import { draw as peth } from "./peth";
import { draw as chennaicentral } from "./chennaicentral";
import { draw as fidi } from "./fidi";

export const LANDMARKS: Partial<Record<AreaId, DrawLandmark>> = {
  colaba, cp, charminar, howrah, pinkcity, peth, chennaicentral, fidi,
};
