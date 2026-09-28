# Style and drawing kit

## The look

- **Palette:** cream ink `INK #ece2cf` strokes on charcoal. The left face (the +gy side) uses `F1 #1e1e20`, the right face (the +gx side) uses `F2 #232325`, and `DARK #151516` is for pylons, columns and signs. `AMBER #e3a93b` is an accent; use it once at most, and only if the real building really has that colour.
- **Lines:** 1 px strokes at 78% opacity for outlines. Detail lines (`bands`, `fins`, `ln`) sit at 20–35% opacity.
- **Flat faces**, with no gradients or shadows. Depth comes from the two face tones and painting order.
- **Few shapes:** about 10–40 parts. Exaggerate the one feature that makes the building recognisable.

## Coordinates

`iso(gx, gy, h)` maps grid units plus a height in px to the screen. One grid unit is 64 px along each isometric axis.
Your `draw(k, gx, gy)` is centred on `(gx, gy)`. Keep every part within about ±1.2 grid units of it.
The front of the building should face +gy, which is towards the viewer's lower left.

**Painting order:** `add(depth, g => ...)` queues a part, and parts paint in ascending `depth`. Use
roughly `gx + gy + dx + dy` of the part's front corner. Things further back get smaller numbers. If a part
wrongly covers another, split it or nudge its depth. One `add` can hold several helpers that belong together.

## Helpers (the same names and signatures as the repo's `landmarks.ts`)

| Helper | Draws |
|---|---|
| `box(g, gx, gy, w, d, h, { base, bands, fins, finOp, lf, rf, tf, noTop })` | A block with half-width `w` (along gx) and half-depth `d`. `bands` adds a floor line every N px; `fins` adds vertical lines at fractions 0–1 across each face. |
| `gable(g, gx, gy, w, d, h, rh, ov)` | A pitched-roof house or shed. The ridge runs along gx; `rh` is the roof height and `ov` the eaves overhang. |
| `sawtooth(g, gx, gy, w, d, h, teeth)` | A factory roof. |
| `tank(g, cx, cy, r, h, base)` | A cylinder: tank, silo, drum under a dome, round tower, minaret shaft. |
| `dome(g, cx, cy, r, h, base)` | A dome `h` px tall over a circle of radius `r`, with ribs and a finial. |
| `isoCircle(g, cx, cy, r, h, attrs)` | A flat ring outline: a plaza, a lake, a stadium rim. |
| `palm(g, gx, gy, h)` | A tree. |
| `poly(g, [[gx,gy,h], ...], fill, extra)` | Any flat polygon in 3D: pediments, pyramids, spires, signs. |
| `ln(g, a, b, opacity, colour, width)` | A line between two 3D points: cables, railings, ribs. |
| `L3(a, b, t)`, `lerp`, `rng(seed)` | Interpolation and seeded randomness. |

Don't chain on a helper's return value (for example `isoCircle(...).setAttribute`); the portable kit returns nothing.

## Recipes

- **Domed civic building:** long `box` wings with `bands`, a central `box`, then `tank` (drum) and `dome` on top, with small `dome`s at the corners. See `examples/vidhana-soudha.mjs`.
- **Tower or skyscraper:** stacked `box`es that get narrower (`base` = the previous top) with `fins` for mullions. Finish with a `poly` spire: four triangles to a point, drawing only the two front faces.
- **Clock tower:** a slim `box`, a ring of `poly` points on its front face at clock height (see Yeswanthpur in `landmarks.ts`), and a pyramid cap.
- **Temple gateway (gopuram):** 5–7 stacked `box`es, each narrower and shorter, with `bands`, and a barrel-shaped top from a small `gable`.
- **Mosque:** a `box` prayer hall, a central `dome` on a `tank` drum, and slim `tank` minarets each topped with a small `dome`.
- **Bridge:** a thin deck `box` raised on `base`, `box` pylons, and `ln` cables fanning from the pylon top (see KR Puram).
- **Stadium:** concentric `isoCircle`s plus a crescent of stand segments (see the Whitefield crescent in `landmarks.ts`).
- **Station or market hall:** a long low `gable` with a `box` clock tower beside it.

## Common mistakes

- **Too much detail.** At map size, anything under about 4 px disappears. Cut it.
- **Too tall.** A 150 px building towers over its neighbours. Get the proportions right, not the real height.
- **Parts drawn inside other parts.** The inner part's faces show through. Make the outer part's footprint enclose the inner one, or give the inner one a later depth only when it's genuinely in front.
- **The label hidden.** Keep everything above about 58 px below the centre.
