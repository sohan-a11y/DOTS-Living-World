import test from "node:test";
import assert from "node:assert/strict";
import { createWorld } from "../src/world.js";
import { createAgents, stepAgents } from "../src/agents.js";

test("agent placement is deterministic, unique, and on land", () => {
  const world = createWorld({ seed: 2048 });
  const first = createAgents(world, { count: 10 });
  const second = createAgents(world, { count: 10 });
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map(agent => agent.x + "," + agent.y)).size, first.length);
  assert.ok(first.every(agent => {
    const tile = world.tiles[agent.y * world.width + agent.x];
    return tile && tile.terrain !== "water" && tile.terrain !== "shore";
  }));
});
test("simulation advances inspectable state without mutating input agents", () => {
  const world = createWorld({ seed: 73021 });
  const agents = createAgents(world, { count: 8 });
  const snapshot = JSON.stringify(agents);
  const next = stepAgents(world, agents);
  assert.notEqual(next, agents);
  assert.equal(JSON.stringify(agents), snapshot);
  assert.ok(next.every(agent => agent.ageTicks === 1));
  assert.ok(next.every(agent => Number.isFinite(agent.hunger) && agent.hunger >= 0 && agent.hunger <= 1));
  assert.ok(next.every(agent => Number.isFinite(agent.energy) && agent.energy >= 0 && agent.energy <= 1));
  assert.ok(next.every(agent => typeof agent.action === "string" && typeof agent.event === "string"));
});
test("replaying the same world and number of steps gives the same state", () => {
  const world = createWorld({ seed: 41, presetId: "crystal-ridge" });
  const run = () => {
    let agents = createAgents(world, { count: 6 });
    for (let tick = 0; tick < 24; tick += 1) agents = stepAgents(world, agents);
    return agents;
  };
  assert.deepEqual(run(), run());
});
test("agent count and invalid inputs are bounded", () => {
  const world = createWorld({ seed: 88 });
  assert.throws(() => createAgents(world, { count: -1 }), RangeError);
  assert.throws(() => createAgents(world, { count: 33 }), RangeError);
  assert.throws(() => stepAgents(null, []), TypeError);
});
