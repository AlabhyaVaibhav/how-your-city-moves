/* Card spotlight + subtle 3D tilt that follows the pointer. Mouse/pen only; off for reduced motion. */
export function initTilt(reduce: boolean) {
  document.querySelectorAll<HTMLElement>(".card").forEach(card => {
    const amt = Number(card.dataset.tilt || 0);
    card.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (px * 100) + "%"); card.style.setProperty("--my", (py * 100) + "%");
      if (amt && !reduce) card.style.transform = `perspective(1100px) rotateX(${(.5 - py) * amt}deg) rotateY(${(px - .5) * amt}deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}
