const AGENT_NAMES = Object.freeze(["Ari", "Bram", "Cleo", "Dara", "Eli", "Fern", "Gio", "Hale", "Ira", "Juno", "Koa", "Lumi"]);
const ROLES = Object.freeze(["Forager", "Scout", "Keeper", "Wanderer"]);
const COLORS = Object.freeze(["#f0c58a", "#94d8c4", "#c2adff", "#f09b8e", "#9cc9f5", "#e5df8a"]);

function randomFor(agent) {
  agent.rngState = (Math.imul(agent.rngState >>> 0, 1664525) + 1013904223) >>> 0;
  return agent.rngState / 4294967296;
}
function land(tile) { return tile && tile.terrain !== "water" && tile.terrain !== "shore"; }

function nearestFood(world, agent) {
  let best = null;
  let bestScore = Infinity;
  for (const tile of world.tiles) {
    if (!land(tile) || (!tile.resource && !tile.flora)) continue;
    const distance = Math.abs(tile.x - agent.x) + Math.abs(tile.y - agent.y);
    const score = distance + (tile.resource ? -1.5 : 1);
    if (score < bestScore) { best = tile; bestScore = score; }
  }
  return best ? { x: best.x, y: best.y, kind: "food" } : null;
}
function randomLandTarget(world, agent) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const tile = world.tiles[Math.floor(randomFor(agent) * world.tiles.length)];
    if (land(tile) && (tile.x !== agent.x || tile.y !== agent.y)) return { x: tile.x, y: tile.y, kind: "wander" };
  }
  return null;
}
function nextStep(world, agent, target) {
  const start = agent.y * world.width + agent.x;
  const destination = target.y * world.width + target.x;
  if (start === destination) return null;
  const parent = new Int32Array(world.tiles.length);
  parent.fill(-1);
  parent[start] = start;
  const queue = new Int32Array(world.tiles.length);
  let read = 0, write = 0;
  queue[write++] = start;
  const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
  while (read < write) {
    const index = queue[read++];
    if (index === destination) break;
    const x = index % world.width, y = Math.floor(index / world.width);
    for (const [dx,dy] of offsets) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
      const next = ny * world.width + nx;
      if (parent[next] !== -1 || !land(world.tiles[next])) continue;
      parent[next] = index;
      queue[write++] = next;
    }
  }
  if (parent[destination] === -1) return null;
  let cursor = destination;
  while (parent[cursor] !== start && cursor !== start) cursor = parent[cursor];
  return { x: cursor % world.width, y: Math.floor(cursor / world.width) };
}

export function createAgents(world, { count = 8 } = {}) {
  if (!world || !Array.isArray(world.tiles) || !Number.isInteger(count) || count < 0 || count > 32) {
    throw new RangeError("Agent count must be an integer from 0 to 32 and a generated world is required.");
  }
  let state = (world.seed ^ 0x9e3779b9) >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const candidates = world.tiles.filter(land);
  if (count > candidates.length) throw new RangeError("The world does not contain enough land tiles for unique starting positions.");
  const agents = [];
  for (let i = 0; i < count; i += 1) {
    const [tile] = candidates.splice(Math.floor(random() * candidates.length), 1);
    agents.push({
      id: "inhabitant-" + (i + 1),
      name: AGENT_NAMES[i % AGENT_NAMES.length] + "-" + String(i + 1).padStart(2, "0"),
      role: ROLES[i % ROLES.length], color: COLORS[i % COLORS.length],
      x: tile.x, y: tile.y, hunger: 0.18 + random() * 0.24, energy: 0.68 + random() * 0.28,
      ageTicks: 0, steps: 0, action: "exploring",
      event: "Arrived in " + world.preset.name + ".", target: null,
      rngState: Math.floor(random() * 4294967295) >>> 0
    });
  }
  return agents;
}

function stepOne(world, agent) {
  agent.hunger = Math.min(1, agent.hunger + 0.012);
  agent.energy = Math.max(0, agent.energy - 0.004);
  agent.ageTicks += 1;
  const tile = world.tiles[agent.y * world.width + agent.x];
  if (agent.hunger >= 0.42 && (!agent.target || agent.target.kind !== "food")) agent.target = nearestFood(world, agent);
  if (agent.target && agent.target.kind === "food" && agent.target.x === agent.x && agent.target.y === agent.y) {
    agent.hunger = Math.max(0, agent.hunger - (tile && tile.resource ? 0.30 : 0.18));
    agent.energy = Math.min(1, agent.energy + 0.045);
    agent.action = "foraging";
    agent.event = "Foraged at " + agent.x + ", " + agent.y + "; hunger decreased.";
    agent.target = null;
    return;
  }
  if (agent.energy < 0.48 && tile && (tile.terrain === "moss" || tile.terrain === "meadow") && agent.hunger < 0.62) {
    agent.energy = Math.min(1, agent.energy + 0.075);
    agent.action = "resting";
    agent.event = "Resting on " + tile.terrain + " ground to recover energy.";
    agent.target = null;
    return;
  }
  if (!agent.target) agent.target = randomLandTarget(world, agent);
  if (!agent.target) {
    agent.action = "blocked";
    agent.event = "No reachable destination was found; waiting for the next tick.";
    return;
  }
  if (agent.target.x === agent.x && agent.target.y === agent.y) {
    agent.target = null;
    agent.action = "exploring";
    agent.event = "Reached a nearby destination and is choosing where to go next.";
    return;
  }
  const next = nextStep(world, agent, agent.target);
  if (!next) {
    agent.target = null;
    agent.action = "exploring";
    agent.event = "Could not reach that destination; choosing another.";
    return;
  }
  agent.x = next.x; agent.y = next.y; agent.steps += 1;
  agent.action = agent.target.kind === "food" ? "seeking food" : "exploring";
  agent.event = agent.target.kind === "food"
    ? "Moving toward a food marker at " + agent.target.x + ", " + agent.target.y + "."
    : "Exploring the surrounding land.";
}
export function stepAgents(world, agents) {
  if (!world || !Array.isArray(world.tiles) || !Array.isArray(agents)) {
    throw new TypeError("stepAgents requires a generated world and an agent array.");
  }
  const next = agents.map(agent => ({ ...agent, target: agent.target ? { ...agent.target } : null }));
  for (const agent of next) stepOne(world, agent);
  return next;
}
