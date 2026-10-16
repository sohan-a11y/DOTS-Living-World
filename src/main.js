import { createWorld, getTile, terrainDescription } from "./world.js";
import { createAgents, stepAgents } from "./agents.js";
import { createNcaField, stepNca, countActiveCells } from "./nca.js";
import { compileWorldPrompt, validateWorldSpec } from "./world-spec.js";

const $ = (id) => document.getElementById(id);
const canvas = $("world-field");
const ctx = canvas && canvas.getContext("2d", { alpha: false });
const playButton = $("preview-toggle");
const presetInput = $("world-preset");
const seedInput = $("world-seed");
const speedInput = $("world-speed");
const ncaOverlayInput = $("nca-overlay");
const ncaResetButton = $("nca-reset");
const ncaStepButton = $("nca-step");
const worldPromptInput = $("world-prompt");
const compileSpecButton = $("compile-world-spec");
const compileAiSpecButton = $("compile-world-spec-ai");
const applySpecButton = $("apply-world-spec");
const specPreview = $("world-spec-json");
const specStatus = $("world-spec-status");
const metrics = {
  preset: $("metric-preset"), seed: $("metric-seed"), tiles: $("metric-tiles"),
  water: $("metric-water"), resources: $("metric-resources"), zoom: $("metric-zoom"),
  title: $("world-state-title"), subtitle: $("world-state-subtitle"),
  coordinate: $("tile-coordinate"), tileName: $("tile-name"), tileDescription: $("tile-description"),
  inhabitants: $("metric-inhabitants"), tick: $("metric-tick"),
  ncaCells: $("metric-nca-cells"), ncaTick: $("metric-nca-tick"), ncaStatus: $("metric-nca-status")
};

if (canvas && ctx && playButton && presetInput && seedInput && speedInput) {
  let world = createWorld();
  let agents = createAgents(world);
  let ncaField = createNcaField({ width: world.width, height: world.height, seed: world.seed });
  let ncaOverlayVisible = ncaOverlayInput ? ncaOverlayInput.checked : true;
  let ncaEnabled = true;
  let ncaSeedRadius = 2;
  let ncaUpdateRate = 0.55;
  let inhabitantCount = 8;
  let compiledSpec = null;
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
    metrics.ncaCells.textContent = countActiveCells(ncaField).toLocaleString();
    metrics.ncaTick.textContent = ncaField.tick.toLocaleString();
    metrics.ncaStatus.textContent = !ncaEnabled ? "NCA DISABLED" : ncaOverlayVisible ? "OVERLAY ON" : "OVERLAY OFF";
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
    if (ncaOverlayVisible) {
      for (let y = 0; y < ncaField.height; y++) {
        for (let x = 0; x < ncaField.width; x++) {
          const index = (y * ncaField.width + x) * ncaField.channels;
          const alive = ncaField.state[index];
          if (alive < 0.025) continue;
          const pigment = ncaField.state[index + 1], nutrient = ncaField.state[index + 2], signal = ncaField.state[index + 3];
          const px = left + x * scale, py = top + y * scale;
          if (px + scale < 0 || py + scale < 0 || px > rect.width || py > rect.height) continue;
          const red = Math.round(64 + pigment * 94), green = Math.round(143 + signal * 95), blue = Math.round(171 + nutrient * 78);
          const alpha = Math.min(0.84, 0.18 + alive * 0.54 + signal * 0.12);
          ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
          ctx.fillRect(px + 0.6, py + 0.6, Math.max(0.8, scale - 1.2), Math.max(0.8, scale - 1.2));
          if (scale >= 7) { ctx.strokeStyle = `rgba(220,255,251,${Math.min(0.75, alive * 0.4)})`; ctx.lineWidth = 0.5; ctx.strokeRect(px + 1, py + 1, Math.max(0, scale - 2), Math.max(0, scale - 2)); }
        }
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
      const unit = Math.max(1.05, Math.min(1.65, scale / 7));
      const headSize = 5.2 * unit;
      const torsoW = 7.2 * unit;
      const torsoH = 7.5 * unit;
      const armW = 2.8 * unit;
      const legW = 2.8 * unit;
      const groundY = cy + Math.max(2, scale * .22);
      const topY = groundY - 22 * unit;
      if (cx < -20 * unit || cy < -26 * unit || cx > rect.width + 20 * unit || cy > rect.height + 12 * unit) continue;

      // Dark badge and colored halo keep characters legible on every terrain palette.
      ctx.fillStyle = "rgba(3,9,8,.78)";
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 10 * unit, 9 * unit, 13 * unit, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = agent.id === selectedAgentId ? "#fff0bd" : agent.color;
      ctx.globalAlpha = agent.id === selectedAgentId ? 1 : .82;
      ctx.lineWidth = Math.max(1, unit * .65);
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 10 * unit, 9 * unit, 13 * unit, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(cx - 6 * unit, groundY - 1.5 * unit, 12 * unit, 2.2 * unit);

      // Chunky, original sprite: square head, torso, arms, and two legs.
      const block = (x, y, w, h, fill) => {
        ctx.fillStyle = "#07100d";
        ctx.fillRect(x - .7 * unit, y - .7 * unit, w + 1.4 * unit, h + 1.4 * unit);
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, h);
      };
      block(cx - headSize / 2, topY, headSize, headSize, "#e2c6a0");
      block(cx - torsoW / 2, topY + 6.1 * unit, torsoW, torsoH, agent.color);
      block(cx - torsoW / 2 - armW - .6 * unit, topY + 6.5 * unit, armW, 6.5 * unit, agent.color);
      block(cx + torsoW / 2 + .6 * unit, topY + 6.5 * unit, armW, 6.5 * unit, agent.color);
      block(cx - 3.2 * unit, topY + 14.2 * unit, legW, 6.5 * unit, "#c1d3c7");
      block(cx + .6 * unit, topY + 14.2 * unit, legW, 6.5 * unit, "#c1d3c7");
      ctx.fillStyle = "#13221b";
      ctx.fillRect(cx - 1.2 * unit, topY + 2.1 * unit, .9 * unit, .9 * unit);
      ctx.fillRect(cx + .4 * unit, topY + 2.1 * unit, .9 * unit, .9 * unit);

      if (agent.id === selectedAgentId) {
        ctx.fillStyle = "#f2d9a2";
        ctx.font = "bold 10px ui-monospace, monospace";
        ctx.textAlign = "center";
        const label = agent.name;
        const labelWidth = ctx.measureText(label).width + 10;
        ctx.fillStyle = "rgba(5,12,10,.94)";
        ctx.fillRect(cx - labelWidth / 2, topY - 17, labelWidth, 13);
        ctx.fillStyle = "#f2d9a2";
        ctx.fillText(label, cx, topY - 7);
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
      if (ncaEnabled) ncaField = stepNca(ncaField, { updateRate: ncaUpdateRate });
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
    agents = createAgents(world, { count: inhabitantCount });
    ncaField = createNcaField({ width: world.width, height: world.height, seed: world.seed, seedRadius: ncaSeedRadius });
    ncaOverlayVisible = ncaEnabled && (ncaOverlayInput ? ncaOverlayInput.checked : true);
    if (ncaOverlayInput) ncaOverlayInput.disabled = !ncaEnabled;
    if (ncaStepButton) ncaStepButton.disabled = !ncaEnabled;
    if (ncaResetButton) ncaResetButton.disabled = !ncaEnabled;
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
      if (distance < Math.max(13, view.scale * .95) && distance < pickedDistance) { picked = agent; pickedDistance = distance; }
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
  if (ncaOverlayInput) ncaOverlayInput.addEventListener("change", () => { ncaOverlayVisible = ncaEnabled && ncaOverlayInput.checked; updateInspector(); requestDraw(); });
  if (ncaResetButton) ncaResetButton.addEventListener("click", () => { if (!ncaEnabled) return; ncaField = createNcaField({ width: world.width, height: world.height, seed: world.seed, seedRadius: ncaSeedRadius }); updateInspector(); requestDraw(); });
  if (ncaStepButton) ncaStepButton.addEventListener("click", () => { if (!ncaEnabled) return; ncaField = stepNca(ncaField, { updateRate: 1 }); updateInspector(); requestDraw(); });
  if (compileSpecButton && worldPromptInput && specPreview && specStatus && applySpecButton) {
    function currentWorldDefaults() {
      return {
        presetId: presetInput.value,
        seed: Number(seedInput.value) || world.seed,
        inhabitantCount,
        nca: { enabled: ncaEnabled, showOverlay: ncaOverlayVisible, seedRadius: ncaSeedRadius, updateRate: ncaUpdateRate }
      };
    }
    function renderCompiledSpec(spec, source) {
      compiledSpec = validateWorldSpec(spec);
      specPreview.textContent = JSON.stringify(compiledSpec, null, 2);
      applySpecButton.disabled = false;
      specStatus.textContent = source + " specification ready. Review the JSON, then apply it. No settings change before you press Apply to world.";
    }
    compileSpecButton.addEventListener("click", () => {
      try {
        renderCompiledSpec(compileWorldPrompt(worldPromptInput.value, currentWorldDefaults()), "Local");
      } catch (error) {
        compiledSpec = null; specPreview.textContent = "{ }"; applySpecButton.disabled = true;
        specStatus.textContent = error instanceof Error ? error.message : "Could not compile that world specification locally.";
      }
    });
    if (compileAiSpecButton) compileAiSpecButton.addEventListener("click", async () => {
      if (compileAiSpecButton.disabled) return;
      compileAiSpecButton.disabled = true;
      compileSpecButton.disabled = true;
      const originalText = compileAiSpecButton.textContent;
      compileAiSpecButton.textContent = "Asking AI…";
      specStatus.textContent = "Sending the instruction and current supported settings to the server-side model. The world will not change until you apply the result.";
      try {
        const response = await fetch("/api/world-spec", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ prompt: worldPromptInput.value, defaults: currentWorldDefaults() })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(payload.error || "The AI compiler is unavailable. Use Compile locally or try again.");
          error.code = payload.code;
          throw error;
        }
        renderCompiledSpec(payload.spec, "AI");
        specStatus.textContent = "AI specification compiled and schema-validated" + (payload.model ? " with " + payload.model : "") + ". Review the JSON, then apply it.";
      } catch (error) {
        compiledSpec = null;
        specPreview.textContent = "{ }";
        applySpecButton.disabled = true;
        specStatus.textContent = error instanceof Error ? error.message : "The AI compiler failed. Use Compile locally or try again.";
      } finally {
        compileAiSpecButton.disabled = false;
        compileSpecButton.disabled = false;
        compileAiSpecButton.textContent = originalText;
      }
    });
    applySpecButton.addEventListener("click", () => {
      if (!compiledSpec) return;
      try {
        const spec = validateWorldSpec(compiledSpec);
        presetInput.value = spec.presetId; seedInput.value = String(spec.seed); inhabitantCount = spec.inhabitantCount;
        ncaEnabled = spec.nca.enabled; ncaSeedRadius = spec.nca.seedRadius; ncaUpdateRate = spec.nca.updateRate;
        if (ncaOverlayInput) ncaOverlayInput.checked = spec.nca.showOverlay;
        ncaOverlayVisible = ncaEnabled && spec.nca.showOverlay;
        loadWorld();
        specStatus.textContent = "Applied specification: " + spec.presetId + ", seed " + spec.seed + ", " + spec.inhabitantCount + " inhabitants.";
      } catch (error) { specStatus.textContent = error instanceof Error ? error.message : "The specification could not be applied."; }
    });
  }
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
  if (specPreview) specPreview.textContent = "{ }";
  if (applySpecButton) applySpecButton.disabled = true;
  updateInspector();
  start();
}
