const TERRAIN = Object.freeze({
  WATER: "water", SHORE: "shore", MOSS: "moss", MEADOW: "meadow",
  ROCK: "rock", CRYSTAL: "crystal", ASH: "ash"
});

export const PRESETS = Object.freeze({
  "moss-basin": {
    id: "moss-basin", name: "Moss Basin",
    subtitle: "A damp lowland with winding water and mossy shelves.",
    waterline: 0.35, moisture: 0.58, ridge: 0.66, palette: "moss"
  },
  "crystal-ridge": {
    id: "crystal-ridge", name: "Crystal Ridge",
    subtitle: "A high rocky plateau with cold pools and crystal outcrops.",
    waterline: 0.29, moisture: 0.43, ridge: 0.57, palette: "crystal"
  },
  "ashen-frontier": {
    id: "ashen-frontier", name: "Ashen Frontier",
    subtitle: "Dry dark terrain, exposed rock, and isolated resource seams.",
    waterline: 0.23, moisture: 0.25, ridge: 0.49, palette: "ash"
  }
});

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothNoise(width, height, seed, passes = 3) {
  const random = randomGenerator(seed);
  let current = Array.from({ length: width * height }, () => random());
  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Array(current.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = current[y * width + x] * 4;
        let weight = 4;
        const neighbors = [[-1,0,2],[1,0,2],[0,-1,2],[0,1,2],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
        for (const item of neighbors) {
          const nx = Math.max(0, Math.min(width - 1, x + item[0]));
          const ny = Math.max(0, Math.min(height - 1, y + item[1]));
          total += current[ny * width + nx] * item[2];
          weight += item[2];
        }
        next[y * width + x] = total / weight;
      }
    }
    current = next;
  }
  return current;
}

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

export function createWorld({ width = 64, height = 36, seed = 73021, presetId = "moss-basin" } = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 8 || height < 8 || width * height > 65536) {
    throw new RangeError("World dimensions must be integers with at least 8 cells per side and at most 65,536 total tiles.");
  }
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 4294967295) {
    throw new RangeError("Seed must be an integer from 1 to 4294967295.");
  }
  const preset = PRESETS[presetId];
  if (!preset) throw new RangeError("Unknown world preset.");

  const elevation = smoothNoise(width, height, seed ^ 0xA511E9B3, 4);
  const moisture = smoothNoise(width, height, seed ^ 0x63D83595, 3);
  const features = randomGenerator(seed ^ 0xB5297A4D);
  const tiles = [];
  const counts = { water: 0, resources: 0, moss: 0, crystal: 0, ash: 0 };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const nx = (x / (width - 1) - 0.5) * 2;
      const ny = (y / (height - 1) - 0.5) * 2;
      const radial = Math.sqrt(nx * nx * 0.76 + ny * ny);
      const ridgeWave = Math.sin(x * 0.13 + seed * 0.00007) * 0.045
        + Math.cos(y * 0.19 - seed * 0.00005) * 0.035;
      const terrainHeight = clamp(elevation[index] * 0.78 + 0.13 + ridgeWave
        + (preset.palette === "crystal" ? 0.11 : 0)
        - (preset.palette === "moss" ? Math.max(0, 0.22 - radial * 0.16) : 0));
      const wetness = clamp(moisture[index] * 0.7 + preset.moisture * 0.3
        - (preset.palette === "ash" ? 0.22 : 0));
      const dice = features();
      let terrain;
      if (terrainHeight < preset.waterline + 0.045) terrain = TERRAIN.WATER;
      else if (terrainHeight < preset.waterline + 0.09) terrain = TERRAIN.SHORE;
      else if (preset.palette === "crystal" && terrainHeight > preset.ridge && dice > 0.43) terrain = TERRAIN.CRYSTAL;
      else if (preset.palette === "ash" && (wetness < 0.29 || terrainHeight > preset.ridge)) terrain = TERRAIN.ASH;
      else if (terrainHeight > preset.ridge + 0.12) terrain = TERRAIN.ROCK;
      else if (wetness > 0.53) terrain = TERRAIN.MOSS;
      else terrain = TERRAIN.MEADOW;

      const resourceRoll = features();
      const resource = terrain !== TERRAIN.WATER && terrain !== TERRAIN.SHORE
        && resourceRoll > (preset.palette === "ash" ? 0.91 : 0.955);
      const flora = (terrain === TERRAIN.MOSS || terrain === TERRAIN.MEADOW)
        && features() > (preset.palette === "moss" ? 0.65 : 0.80);
      if (terrain === TERRAIN.WATER) counts.water += 1;
      if (resource) counts.resources += 1;
      if (terrain === TERRAIN.MOSS) counts.moss += 1;
      if (terrain === TERRAIN.CRYSTAL) counts.crystal += 1;
      if (terrain === TERRAIN.ASH) counts.ash += 1;
      tiles.push({ x, y, terrain, elevation: terrainHeight, moisture: wetness, resource, flora, variation: features(), id: index });
    }
  }
  return { width, height, seed: seed >>> 0, preset, tiles, counts };
}

export function getTile(world, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= world.width || y >= world.height) return null;
  return world.tiles[y * world.width + x] ?? null;
}

export function terrainDescription(tile) {
  if (!tile) return "Outside the mapped world.";
  const descriptions = {
    water: "A water tile. It separates nearby land and shapes the route through this preset.",
    shore: "A shallow transition between land and water.",
    moss: "Moist ground with a higher chance of supporting low vegetation.",
    meadow: "Open ground with moderate moisture and clear paths through the terrain.",
    rock: "Elevated rocky terrain that breaks up open routes.",
    crystal: "A crystal outcrop used to distinguish highland regions in this preset.",
    ash: "Dry, dark ground characteristic of the Ashen Frontier."
  };
  const features = [];
  if (tile.resource) features.push("resource marker");
  if (tile.flora) features.push("vegetation marker");
  const suffix = features.length ? " Visible feature: " + features.join(" and ") + "." : "";
  return (descriptions[tile.terrain] ?? "Unknown terrain.") + suffix;
}
