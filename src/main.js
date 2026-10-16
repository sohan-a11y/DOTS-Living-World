import { createWorld, getTile, terrainDescription } from "./world.js";
import { createAgents, stepAgents } from "./agents.js";

const $ = (id) => document.getElementById(id);
const canvas = $("world-field");
const ctx = canvas && canvas.getContext("2d", { alpha: false });
const playButton = $("preview-toggle");
const presetInput = $("world-preset");
const seedInput = $("world-seed");
const speedInput = $("world-speed");
const metrics = {
  preset: $("metric-preset"), seed: $("metric-seed"), tiles: $("metric-tiles"),
  water: $("metric-water"), resources: $("metric-resources"), zoom: $("metric-zoom"),
  title: $("world-state-title"), subtitle: $("world-state-subtitle"),
  coordinate: $("tile-coordinate"), tileName: $("tile-name"), tileDescription: $("tile-description"),
  inhabitants: $("metric-inhabitants"), tick: $("metric-tick")
};

if (canvas && ctx && playButton && presetInput && seedInput && speedInput) {
  let world = createWorld();
  let agents = createAgents(world);
  let simulationTick = 0;
  let simulationAccumulator = 0;
  let selectedAgentId = null;
  let camera = { x: 0, y: 0, zoom: 1 };
  let selected = { x: 32, y: 18 };
  let paused = false;
  let time = 0;
  let last = 0;
  let raf = 0;
  let drag = null;
  let dragged = false;
  let reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const colors = {
    background: "#08100f",
    water: ["#123b43", "#164a51", "#1d5660"],
    shore: ["#9a805d", "#b1966c"],
    moss: ["#285b45", "#2f6a4a", "#397653"],
    meadow: ["#426c49", "#4c7950", "#557f56"],
    rock: ["#515e59", "#616e66", "#69776c"],
    crystal: ["#3b777b", "#4d9693", "#76c8bd"],
    ash: ["#353d3b", "#414946", "#515957"],
    resource: "#e4bd7d", flora: "#8cd49b", selected: "#e8ffef",
    grid: "rgba(220,247,228,.11)"
  };

  function transform(w, h) {
    const scale = Math.max(2, Math.min(w / (world.width + 4), h / (world.height + 4)) * camera.zoom);
    return { scale, left: w / 2 + camera.x - world.width * scale / 2, top: h / 2 + camera.y - world.height * scale / 2 };
  }

  function updateInspector() {
    metrics.preset.textContent = world.preset.name.toUpperCase();
    metrics.seed.textContent = String(world.seed);
    metrics.tiles.textContent = world.tiles.length.toLocaleString();
    metrics.water.textContent = world.counts.water.toLocaleString();
    metrics.resources.textContent = world.counts.resources.toLocaleString();
    metrics.zoom.textContent = Math.round(camera.zoom * 100) + "%";
    metrics.inhabitants.textContent = String(agents.length);
    metrics.tick.textContent = simulationTick.toLocaleString();
    const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
    if (selectedAgent) {
      metrics.title.textContent = "Inhabitant selected";
      metrics.subtitle.textContent = selectedAgent.name + " · " + selectedAgent.action;
      metrics.coordinate.textContent = "x " + selectedAgent.x + " · y " + selectedAgent.y;
      metrics.tileName.textContent = selectedAgent.name + " · " + selectedAgent.role;
      metrics.tileDescription.textContent = selectedAgent.event + " Hunger " + Math.round(selectedAgent.hunger * 100) + "%; energy " + Math.round(selectedAgent.energy * 100) + "%; " + selectedAgent.steps + " movement steps.";
      return;
    }
    metrics.title.textContent = "Preset world active";
    metrics.subtitle.textContent = world.preset.name + " · local rule-based agents";
    const tile = getTile(world, selected.x, selected.y);
    const names = { water: "Water", shore: "Shoreline", moss: "Moss shelf", meadow: "Open meadow", rock: "Rock ridge", crystal: "Crystal outcrop", ash: "Ashen ground" };
    metrics.coordinate.textContent = tile ? "x " + tile.x + " · y " + tile.y : "outside field";
    metrics.tileName.textContent = tile ? (names[tile.terrain] || "Terrain tile") : "No tile selected";
    metrics.tileDescription.textContent = terrainDescription(tile);
  }

  function draw(stamp = time) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cw = Math.max(1, Math.floor(rect.width * dpr));
    const ch = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, rect.width, rect.height);
    const view = transform(rect.width, rect.height);
    const scale = view.scale;
    const left = view.left;
    const top = view.top;

    ctx.fillStyle = "rgba(101,217,157,.035)";
    for (let x = 0; x < rect.width; x += 28) for (let y = 0; y < rect.height; y += 28) ctx.fillRect(x, y, 1, 1);

    for (const tile of world.tiles) {
      const x = left + tile.x * scale;
      const y = top + tile.y * scale;
      if (x + scale < 0 || y + scale < 0 || x > rect.width || y > rect.height) continue;
      const variants = colors[tile.terrain] || colors.meadow;
      const variant = Math.min(2, Math.floor(tile.variation * 3));
      ctx.fillStyle = tile.terrain === "water"
        ? colors.water[(variant + Math.floor(stamp * .01 + tile.x * .15 + tile.y * .07)) % colors.water.length]
        : variants[variant % variants.length];
      ctx.fillRect(x + .3, y + .3, Math.max(.5, scale - .65), Math.max(.5, scale - .65));
      if (scale >= 7) {
        ctx.fillStyle = "rgba(7,16,13,.16)";
        ctx.fillRect(x + scale * .1, y + scale * .72, scale * .8, scale * .13);
        ctx.fillStyle = "rgba(230,255,238,.08)";
        ctx.fillRect(x + scale * .1, y + scale * .1, scale * .8, Math.max(.7, scale * .07));
      }
      if (tile.flora && scale >= 5) {
        const px = x + scale * (.35 + tile.variation * .25);
        const py = y + scale * (.3 + tile.variation * .2);
        ctx.fillStyle = colors.flora;
        ctx.globalAlpha = .75;
        ctx.fillRect(px, py, Math.max(1, scale * .24), Math.max(1, scale * .4));
        ctx.fillRect(px - scale * .1, py + scale * .05, Math.max(1, scale * .4), Math.max(1, scale * .14));
        ctx.globalAlpha = 1;
      }
      if (tile.resource && scale >= 5) {
        const cx = x + scale * .52, cy = y + scale * .52, r = Math.max(1.1, scale * .16);
        ctx.fillStyle = colors.resource;
        ctx.fillRect(cx - r, cy - r * 1.5, r * 2, r * 3);
        ctx.fillRect(cx - r * 1.5, cy - r, r * 3, r * 2);
      }
    }
    if (scale > 5) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = .45;
      ctx.beginPath();
      for (let x = 0; x <= world.width; x++) { const px = left + x * scale; ctx.moveTo(px, top); ctx.lineTo(px, top + world.height * scale); }
      for (let y = 0; y <= world.height; y++) { const py = top + y * scale; ctx.moveTo(left, py); ctx.lineTo(left + world.width * scale, py); }
      ctx.stroke();
    }
    const tile = getTile(world, selected.x, selected.y);
    if (tile) {
      ctx.strokeStyle = colors.selected; ctx.lineWidth = 1.5;
      ctx.strokeRect(left + tile.x * scale + 1, top + tile.y * scale + 1, Math.max(0, scale - 2), Math.max(0, scale - 2));
      ctx.fillStyle = "rgba(220,255,232,.09)";
      ctx.fillRect(left + tile.x * scale, top + tile.y * scale, scale, scale);
    }
    for (const agent of agents) {
      const cx = left + (agent.x + .5) * scale;
      const cy = top + (agent.y + .5) * scale;
      if (cx < -scale || cy < -scale || cx > rect.width + scale || cy > rect.height + scale) continue;
      const head = Math.max(1.2, scale * .17);
      const torsoW = Math.max(1.4, scale * .34);
      const torsoH = Math.max(1.7, scale * .29);
      const legW = Math.max(1, scale * .12);
      const topY = cy - scale * .34;
      ctx.fillStyle = "rgba(0,0,0,.34)";
      ctx.fillRect(cx - scale * .26, cy + scale * .38, scale * .52, Math.max(1, scale * .09));
      ctx.fillStyle = agent.color;
      ctx.fillRect(cx - head / 2, topY, head, head);
      ctx.fillRect(cx - torsoW / 2, cy - scale * .08, torsoW, torsoH);
      ctx.fillRect(cx - torsoW * .94, cy - scale * .04, Math.max(1, scale * .11), torsoH * .68);
      ctx.fillRect(cx + torsoW * .83, cy - scale * .04, Math.max(1, scale * .11), torsoH * .68);
      ctx.fillRect(cx - legW * 1.35, cy + scale * .18, legW, scale * .21);
      ctx.fillRect(cx + legW * .35, cy + scale * .18, legW, scale * .21);
      ctx.fillStyle = "rgba(6,13,11,.65)";
      ctx.fillRect(cx - head * .2, topY + head * .38, Math.max(.7, head * .16), Math.max(.7, head * .16));
      if (agent.id === selectedAgentId) {
        ctx.strokeStyle = "#f2d9a2"; ctx.lineWidth = Math.max(1, scale * .07);
        ctx.beginPath(); ctx.ellipse(cx, cy + scale * .04, scale * .47, scale * .55, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#f2d9a2"; ctx.font = "9px ui-monospace, monospace"; ctx.textAlign = "center";
        ctx.fillText(agent.name, cx, topY - 3);
      }
    }
  }

  function requestDraw() {
    if (paused || reducedMotion || document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { draw(time); raf = 0; });
    } else draw(time);
  }

  function tick(stamp) {
    if (paused || document.hidden) { raf = 0; return; }
    if (!last) last = stamp;
    const delta = Math.min(64, stamp - last) * Number(speedInput.value || 1);
    time += delta;
    simulationAccumulator += delta;
    let stepped = false;
    while (simulationAccumulator >= 420) {
      simulationAccumulator -= 420;
      agents = stepAgents(world, agents);
      simulationTick += 1;
      stepped = true;
    }
    last = stamp;
    if (stepped) updateInspector();
    draw(time);
    if (!reducedMotion) raf = requestAnimationFrame(tick);
    else raf = 0;
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    paused = false;
    playButton.setAttribute("aria-pressed", "false");
    playButton.innerHTML = 'Pause field <span aria-hidden="true">Ⅱ</span>';
    last = 0;
    if (reducedMotion) requestDraw(); else raf = requestAnimationFrame(tick);
  }

  function stop() {
    paused = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    playButton.setAttribute("aria-pressed", "true");
    playButton.innerHTML = 'Resume field <span aria-hidden="true">▶</span>';
    requestDraw();
  }

  function loadWorld() {
    const seed = Number(seedInput.value);
    if (!Number.isSafeInteger(seed) || seed < 1 || seed > 4294967295) {
      seedInput.setCustomValidity("Enter a whole number from 1 to 4294967295.");
      seedInput.reportValidity();
      return;
    }
    seedInput.setCustomValidity("");
    world = createWorld({ seed, presetId: presetInput.value });
    agents = createAgents(world);
    simulationTick = 0;
    simulationAccumulator = 0;
    selectedAgentId = null;
    selected = { x: Math.floor(world.width / 2), y: Math.floor(world.height / 2) };
    camera = { x: 0, y: 0, zoom: 1 };
    time = 0;
    updateInspector();
    requestDraw();
  }

  function zoomAt(zoom, px, py) {
    const rect = canvas.getBoundingClientRect();
    const before = transform(rect.width, rect.height);
    const wx = (px - before.left) / before.scale;
    const wy = (py - before.top) / before.scale;
    camera.zoom = Math.max(.55, Math.min(3.2, zoom));
    const next = transform(rect.width, rect.height).scale;
    camera.x = px - wx * next - rect.width / 2 + world.width * next / 2;
    camera.y = py - wy * next - rect.height / 2 + world.height * next / 2;
    updateInspector(); requestDraw();
  }
  function zoomCenter(factor) {
    const rect = canvas.getBoundingClientRect();
    zoomAt(camera.zoom * factor, rect.width / 2, rect.height / 2);
  }
  function selectAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const view = transform(rect.width, rect.height);
    const x = Math.floor((clientX - rect.left - view.left) / view.scale);
    const y = Math.floor((clientY - rect.top - view.top) / view.scale);
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    let picked = null;
    let pickedDistance = Infinity;
    for (const agent of agents) {
      const ax = view.left + (agent.x + .5) * view.scale;
      const ay = view.top + (agent.y + .18) * view.scale;
      const distance = Math.hypot(localX - ax, localY - ay);
      if (distance < view.scale * .52 && distance < pickedDistance) { picked = agent; pickedDistance = distance; }
    }
    if (picked) { selectedAgentId = picked.id; selected = { x: picked.x, y: picked.y }; updateInspector(); requestDraw(); return; }
    if (getTile(world, x, y)) { selectedAgentId = null; selected = { x, y }; updateInspector(); requestDraw(); }
  }

  playButton.addEventListener("click", () => paused ? start() : stop());
  $("generate-world").addEventListener("click", loadWorld);
  presetInput.addEventListener("change", loadWorld);
  seedInput.addEventListener("keydown", event => { if (event.key === "Enter") loadWorld(); });
  $("zoom-in").addEventListener("click", () => zoomCenter(1.2));
  $("zoom-out").addEventListener("click", () => zoomCenter(1 / 1.2));
  $("reset-view").addEventListener("click", () => { camera = { x: 0, y: 0, zoom: 1 }; updateInspector(); requestDraw(); });
  speedInput.addEventListener("change", requestDraw);
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY };
    dragged = false; canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", event => {
    if (!drag) return;
    if (Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 4) dragged = true;
    camera.x += event.clientX - drag.lastX; camera.y += event.clientY - drag.lastY;
    drag.lastX = event.clientX; drag.lastY = event.clientY;
    if (dragged) requestDraw();
  });
  canvas.addEventListener("pointerup", event => {
    if (!drag) return;
    if (!dragged) selectAt(event.clientX, event.clientY);
    drag = null; canvas.classList.remove("is-dragging");
  });
  canvas.addEventListener("pointercancel", () => { drag = null; canvas.classList.remove("is-dragging"); });
  canvas.addEventListener("wheel", event => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    zoomAt(camera.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  canvas.addEventListener("keydown", event => {
    const step = 24;
    if (event.key === "ArrowLeft") camera.x += step;
    else if (event.key === "ArrowRight") camera.x -= step;
    else if (event.key === "ArrowUp") camera.y += step;
    else if (event.key === "ArrowDown") camera.y -= step;
    else if (event.key === "+" || event.key === "=") camera.zoom = Math.min(3.2, camera.zoom * 1.15);
    else if (event.key === "-") camera.zoom = Math.max(.55, camera.zoom / 1.15);
    else return;
    event.preventDefault(); updateInspector(); requestDraw();
  });
  window.addEventListener("resize", requestDraw);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && !paused && !reducedMotion) { last = 0; raf = requestAnimationFrame(tick); }
  });
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", () => {
    reducedMotion = motionQuery.matches;
    if (paused || reducedMotion) { if (raf) cancelAnimationFrame(raf); raf = 0; requestDraw(); }
    else start();
  });

  presetInput.value = world.preset.id;
  updateInspector();
  start();
}
