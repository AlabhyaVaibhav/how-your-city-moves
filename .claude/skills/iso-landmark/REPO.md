# Adding a landmark to the How Bangalore moves map

Use this when you're working inside the how-your-city-moves repository.

## Landmark for an existing area

1. Save the drawing as `src/app/landmarks/<areaId>.ts`. The body of `draw` is identical to your `.mjs` file; only the header changes:

   ```ts
   import type { Kit } from "../landmarks";

   export const meta = { name: "…", city: "Bengaluru", qid: "Q…", why: "…" };

   export function draw(k: Kit, gx: number, gy: number) {
     const { add, box, dome } = k;
     // …
   }
   ```
2. Register it in `src/app/landmarks/index.ts`: `import { draw as mgroad } from "./mgroad";` then add `mgroad` to `LANDMARKS`. A registered file replaces the built-in drawing for that area.
3. Check it in place: `npm run preview:map -- preview` writes `preview/map-iso-full.png` and `preview/map-iso-compact.png` (the phone crop). Look for overlaps with neighbouring landmarks and labels.
4. `npm test && npm run build`, then `npm run assets` to refresh the social preview image.

`node .claude/skills/iso-landmark/scripts/render.mjs src/app/landmarks/<areaId>.ts` renders the file on its own (Node 22.18+ runs `.ts` directly).

## A new area

Do all of the above, plus:

1. **Data:** add the area to `NODES` in `src/app/data.ts`, **at the end** so the other built-in landmarks keep their drawings. Give it:
   - `label` and `short` (the phone label)
   - a grid position `g`, placed by eye among its neighbours on the isometric map
   - `ll`: a neighbourhood centroid rounded to 3 decimals, never more precise
   - `kind`: `"home"` or `"office"`
2. **Database:** add a new migration that adds the id to `areas_known` and `submit_commute`. `tests/areas.test.ts` fails until it does.
3. **Real map:** run `npm run basemap` to refresh the road-distance table. `tests/geo.test.ts` fails until you do. If the area falls outside the real map's frame, it's pinned to the edge automatically.
4. **Layout:** check both views with `npm run preview:map -- preview iso` and `npm run preview:map -- preview real`. On phones, adjust `COMPACT_NUDGE` in `src/app/map.ts` or the label sides in `src/app/realMap.ts`.
5. **Copy:** update the area count on `/support` and `/privacy` ("twenty areas"). `/llms.txt` updates itself.
6. **PR:** open a pull request whose description says `Closes #<issue>`.

A whole new city (a different `NODES` set, basemap frame and database scope) isn't supported by the app yet.
