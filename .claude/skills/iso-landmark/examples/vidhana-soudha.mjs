// Worked example. Render with: node ../scripts/render.mjs vidhana-soudha.mjs
export const meta = {
  name: "Vidhana Soudha",
  label: "Vidhana Soudha",
  city: "Bengaluru",
  qid: "Q283257",
  why: "Seat of Karnataka's legislature; its domed, columned front is on postcards, stamps and the city's skyline.",
  features: ["long arcaded wings", "columned central portico", "big central dome with four small domes", "domed end towers", "grand steps"],
};

/** Everything below `const {...} = k` pastes unchanged into landmarks.ts. */
export function draw(k, gx, gy) {
  const { add, box, tank, dome, poly, DARK } = k;

  // long wings, arcades shown as bands, and a domed tower at each end
  add(gx + gy - 1.3, g => { box(g, gx - 1.0, gy - .15, .14, .3, 40, { bands: 8 }); tank(g, gx - 1.0, gy - .15, .1, 6, 40); dome(g, gx - 1.0, gy - .15, .1, 12, 46); });
  add(gx + gy - .9, g => box(g, gx - .62, gy - .15, .26, .26, 26, { bands: 7, fins: [.2, .4, .6, .8], finOp: .2 }));
  add(gx + gy + .5, g => box(g, gx + .62, gy - .15, .26, .26, 26, { bands: 7, fins: [.2, .4, .6, .8], finOp: .2 }));
  add(gx + gy + .9, g => { box(g, gx + 1.0, gy - .15, .14, .3, 40, { bands: 8 }); tank(g, gx + 1.0, gy - .15, .1, 6, 40); dome(g, gx + 1.0, gy - .15, .1, 12, 46); });

  // central block with the big dome on a drum, and four small domes at its corners
  add(gx + gy - .1, g => {
    box(g, gx, gy - .05, .34, .36, 42, { bands: 10 });
    tank(g, gx, gy - .05, .17, 8, 42);
    dome(g, gx, gy - .05, .17, 24, 50);
  });
  [[-.26, -.33], [.26, -.33], [-.26, .23], [.26, .23]].forEach(([dx, dy]) =>
    add(gx + gy + dx + dy + .2, g => dome(g, gx + dx, gy + dy, .055, 9, 42)));

  // portico: a row of columns under a deep entablature
  add(gx + gy + .45, g => {
    for (let i = 0; i < 6; i++) box(g, gx - .27 + i * .108, gy + .42, .022, .022, 30, { base: 4, lf: DARK, rf: DARK, tf: DARK });
    box(g, gx, gy + .42, .32, .05, 7, { base: 34 });
    poly(g, [[gx - .06, gy + .47, 4], [gx + .06, gy + .47, 4], [gx + .06, gy + .47, 20], [gx - .06, gy + .47, 20]], DARK);
  });

  // the grand flight of steps
  [0, 1, 2, 3].forEach(i => add(gx + gy + .6 + i * .01, g => box(g, gx, gy + .5 + i * .07, .3 - i * .02, .035, 4 - i, { tf: k.F1 })));
}
