---
name: iso-landmark
description: Finds the most iconic building of a city or neighbourhood (a Wikidata shortlist plus photos) and draws it as isometric line art in the How Bangalore moves style, output as SVG/PNG or as a landmark file for that site's map. Use when someone wants a landmark drawn for a place, wants to add a city or area to the map, or mentions isometric landmarks or line-art buildings.
---

# Iso landmark

Pick the one building people from a place would recognise at a glance, then draw it as simple
isometric line art: cream strokes on charcoal, flat faces, no logos. Works anywhere with Node 18+;
inside the how-your-city-moves repo it also adds the drawing to the live map (see [REPO.md](REPO.md)).

Scripts live in this skill's `scripts/` folder. Examples below assume you run them from the skill folder.

## Quick start

```bash
node scripts/find-landmarks.mjs "Mysuru" --images /tmp/mysuru      # ranked shortlist + photos
cp examples/vidhana-soudha.mjs /tmp/mysuru-palace.mjs               # start from the example
node scripts/render.mjs /tmp/mysuru-palace.mjs                      # → .svg (+ .png) and a size check
```

## Workflow

Copy this checklist and tick it off:

- [ ] **1. Pin the place.** City or neighbourhood, plus country if the name is ambiguous. For a neighbourhood, use `"Area, City"` or `--near lat,lng --radius 2`.
- [ ] **2. Shortlist.** `node scripts/find-landmarks.mjs "<place>" --images <tmpdir>`. The score is only a hint: it counts Wikipedia editions, so famous buildings can rank low (Vidhana Soudha comes 11th for Bengaluru).
- [ ] **3. Choose.** Apply the test below. If the person named a building, use it. Otherwise suggest your top pick with a one-line reason and two alternatives, and let them choose when they're around.
- [ ] **4. Study the photo.** Open the downloaded image. Write down 3–5 signature features that make it recognisable (silhouette, roof shape, one standout detail), and its rough proportions. Recognisable matters more than detailed.
- [ ] **5. Draw.** Write `<slug>.mjs` exporting `meta` and `draw(k, gx, gy)`, following [STYLE.md](STYLE.md) and [examples/vidhana-soudha.mjs](examples/vidhana-soudha.mjs).
- [ ] **6. Render and look.** `node scripts/render.mjs <slug>.mjs`, then open the PNG. Compare it with the photo and fix what doesn't read. Repeat until it's recognisable **and** the size check says `fits the map` (usually 2–4 rounds).
- [ ] **7. Deliver.** Outside the repo: hand over the `.mjs`, `.svg` and `.png`, plus `meta.why`. In the repo: follow [REPO.md](REPO.md).

## Choosing the iconic building

Prefer, in order:
1. **Recognised by locals at a glance**: on postcards, city logos, souvenirs, or the "places to see" list.
2. **A distinctive silhouette** that survives being drawn in about 20 shapes: domes, towers, arches, spires, a bridge.
3. **Public or civic, and visible from the street.** Not a private office or a generic mall.
4. **Buildings over parks, lakes or areas.** If a neighbourhood's identity is a lake or a market, draw the built thing people associate with it (a bridge, a gate, a clock tower).

If nothing notable is nearby, draw the neighbourhood's character instead (apartment blocks with trees, sawtooth factory sheds, a station), as the existing map does for its residential and industrial areas.

## Rules

- **Artistic interpretation only.** No logos, wordmarks, brand colours, readable signs, flags with emblems, or people.
- **Keep sacred buildings respectful and simple.** Draw the massing and the roofline; leave out deity figures and religious symbols.
- **Stay inside the budget:** about ±1.2 grid units wide, under 150 px tall, and nothing more than 58 px below the centre (that's where the label goes).
- **Deterministic:** if you want variation, use `rng(seed)`, never `Math.random()`.

## Sharing the skill

It's one self-contained folder. Zip it (`zip -r iso-landmark.zip iso-landmark`) and have the recipient unzip it into
`~/.claude/skills/` (every project) or `<project>/.claude/skills/` (one project). For PNG previews (needed in step 6),
run `npm i --no-save @resvg/resvg-js` once inside the skill folder; without it the renderer still writes the SVG.
