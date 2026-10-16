import { createField, sampleField } from "./field.js";

const canvas = document.querySelector("#world-field");
const toggle = document.querySelector("#preview-toggle");
const context = canvas?.getContext("2d", { alpha: false });

if (canvas && context && toggle) {
  const columns = 76;
  const rows = 43;
  const field = createField(columns, rows);
  let animationId = 0;
  let paused = false;
  let previousTime = 0;

  const palette = {
    void: "#0b1112",
    deep: "#11251f",
    green: "#245541",
    mint: "#68ad83",
    bright: "#a9edbd",
    cyan: "#3d8c8e",
    amber: "#b78b4f",
    violet: "#57507e"
  };

  function draw(time) {
    if (paused) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    context.fillStyle = palette.void;
    context.fillRect(0, 0, w, h);

    const cellW = w / columns;
    const cellH = h / rows;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visualTime = reducedMotion ? 0 : time;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const value = sampleField(field, x, y, visualTime);
        const ridge = Math.sin(x * 0.12 + y * 0.09);
        let color = palette.void;
        if (value > 0.69) color = ridge > 0.35 ? palette.bright : palette.mint;
        else if (value > 0.57) color = ridge > 0.1 ? palette.green : palette.cyan;
        else if (value > 0.46) color = ridge < -0.2 ? palette.violet : palette.deep;
        else if (value > 0.37) color = palette.deep;

        const pad = value > 0.60 ? 0.8 : 1.15;
        context.globalAlpha = value > 0.6 ? 0.6 + value * 0.4 : 0.35 + value * 0.6;
        context.fillStyle = color;
        context.fillRect(x * cellW + pad, y * cellH + pad, Math.max(0, cellW - pad * 2), Math.max(0, cellH - pad * 2));
      }
    }
    context.globalAlpha = 1;

    // Fine guide lines make the grid legible as a field-study interface.
    context.strokeStyle = "rgba(145, 206, 174, 0.065)";
    context.lineWidth = 0.5;
    for (let x = 0; x <= columns; x += 4) {
      context.beginPath();
      context.moveTo(x * cellW, 0);
      context.lineTo(x * cellW, h);
      context.stroke();
    }
    for (let y = 0; y <= rows; y += 4) {
      context.beginPath();
      context.moveTo(0, y * cellH);
      context.lineTo(w, y * cellH);
      context.stroke();
    }

    // This sweeping line is purely decorative; it is not a simulated agent or a world event.
    const sweepX = ((visualTime * 0.012) % (w + 90)) - 45;
    const gradient = context.createLinearGradient(sweepX - 45, 0, sweepX + 45, 0);
    gradient.addColorStop(0, "rgba(181,245,201,0)");
    gradient.addColorStop(0.5, "rgba(181,245,201,0.07)");
    gradient.addColorStop(1, "rgba(181,245,201,0)");
    context.fillStyle = gradient;
    context.fillRect(sweepX - 45, 0, 90, h);

    if (!reducedMotion) animationId = window.requestAnimationFrame(draw);
    previousTime = time;
  }

  function start() {
    if (animationId) window.cancelAnimationFrame(animationId);
    paused = false;
    toggle.setAttribute("aria-pressed", "false");
    toggle.innerHTML = 'Pause preview <span aria-hidden="true">Ⅱ</span>';
    animationId = window.requestAnimationFrame(draw);
  }

  toggle.addEventListener("click", () => {
    paused = !paused;
    if (paused) {
      window.cancelAnimationFrame(animationId);
      toggle.setAttribute("aria-pressed", "true");
      toggle.innerHTML = 'Resume preview <span aria-hidden="true">▶</span>';
    } else {
      start();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationId);
    } else if (!paused) {
      start();
    }
  });

  window.addEventListener("resize", () => {
    if (paused) draw(previousTime);
  });

  start();
}
