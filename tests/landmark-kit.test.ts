import { describe, expect, it } from "vitest";
import { parseHTML } from "linkedom";
import { makeKit } from "../src/app/landmarks";
// the iso-landmark skill's portable kit and worked example
import { createScene } from "../.claude/skills/iso-landmark/scripts/iso-kit.mjs";
import { draw as vidhanaSoudha } from "../.claude/skills/iso-landmark/examples/vidhana-soudha.mjs";

describe("landmark kit", () => {
  it("matches the skill's portable kit, so drawings move between them unchanged", () => {
    const repo = Object.keys(makeKit(() => {})).sort();
    const portable = Object.keys(createScene()).filter(k => k !== "paint" && k !== "el").sort();
    expect(portable).toEqual(repo);
  });

  it("draws the skill's example with the repo's helpers", () => {
    const { document } = parseHTML("<svg></svg>");
    const svg = document.querySelector("svg")!;
    const parts: { k: number; draw: (g: Element) => void }[] = [];
    vidhanaSoudha(makeKit((k, d) => parts.push({ k, draw: d })), 5, 5);
    parts.sort((a, b) => a.k - b.k).forEach(p => p.draw(svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"))));
    expect(parts.length).toBeGreaterThan(5);
    expect(svg.querySelectorAll("polygon").length).toBeGreaterThan(20);
  });
});
