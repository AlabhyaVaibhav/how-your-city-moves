/*
 * Landmarks kept in their own files, by area id. A landmark here replaces the built-in drawing in
 * ../landmarks.ts. Make new ones with the iso-landmark skill (.claude/skills/iso-landmark).
 */
import type { AreaId } from "../data";
import type { DrawLandmark } from "../landmarks";

export const LANDMARKS: Partial<Record<AreaId, DrawLandmark>> = {};
