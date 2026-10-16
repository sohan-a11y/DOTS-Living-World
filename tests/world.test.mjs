import test from "node:test";
import assert from "node:assert/strict";
import { createWorld, getTile, terrainDescription, PRESETS } from "../src/world.js";

test("world generation is deterministic for a preset and seed", () => {
  const a = createWorld({ width: 24, height: 16, seed: 99, presetId: "moss-basin" });
  const b = createWorld({ width: 24, height: 16, seed: 99, presetId: "moss-basin" });
  assert.deepEqual(a.tiles, b.tiles);
  assert.deepEqual(a.counts, b.counts);
});

test("supported presets produce valid distinct terrain maps", () => {
  const worlds = Object.keys(PRESETS).map(presetId => createWorld({ width: 24, height: 16, seed: 99, presetId }));
  for (const world of worlds) {
    assert.equal(world.tiles.length, world.width * world.height);
    assert.equal(world.counts.water, world.tiles.filter(tile => tile.terrain === "water").length);
    assert.ok(world.counts.resources >= 0);
    assert.ok(world.tiles.every(tile => tile.elevation >= 0 && tile.elevation <= 1 && tile.moisture >= 0 && tile.moisture <= 1));
  }
  assert.notDeepEqual(worlds[0].tiles.map(t => t.terrain), worlds[1].tiles.map(t => t.terrain));
  assert.notDeepEqual(worlds[1].tiles.map(t => t.terrain), worlds[2].tiles.map(t => t.terrain));
});

test("same seed with different preset IDs changes terrain composition", () => {
  const moss = createWorld({ seed: 700, presetId: "moss-basin" });
  const ash = createWorld({ seed: 700, presetId: "ashen-frontier" });
  assert.notDeepEqual(moss.tiles.map(t => t.terrain), ash.tiles.map(t => t.terrain));
});

test("getTile finds valid coordinates and rejects out-of-bounds coordinates", () => {
  const world = createWorld({ width: 8, height: 8, seed: 11 });
  assert.equal(getTile(world, 0, 0).id, 0);
  assert.equal(getTile(world, 7, 7).id, 63);
  assert.equal(getTile(world, -1, 0), null);
  assert.equal(getTile(world, 8, 0), null);
  assert.equal(getTile(world, 2, 10), null);
});

test("terrain description includes local features where present", () => {
  assert.match(terrainDescription(null), /Outside/);
  const world = createWorld({ width: 24, height: 16, seed: 99 });
  const featured = world.tiles.find(tile => tile.resource || tile.flora);
  assert.ok(featured);
  assert.match(terrainDescription(featured), /Visible feature/);
});

test("world dimensions, seed, and preset are validated", () => {
  assert.throws(() => createWorld({ width: 4, height: 16 }), RangeError);
  assert.throws(() => createWorld({ width: 300, height: 300 }), RangeError);
  assert.throws(() => createWorld({ seed: 0 }), RangeError);
  assert.throws(() => createWorld({ seed: 4294967296 }), RangeError);
  assert.throws(() => createWorld({ seed: 12.4 }), RangeError);
  assert.throws(() => createWorld({ presetId: "unknown-world" }), RangeError);
});
