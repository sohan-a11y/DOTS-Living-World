import test from "node:test";
import assert from "node:assert/strict";
import { createField, sampleField } from "../src/field.js";

test("createField returns the requested dimensions and bounded values", () => {
  const field = createField(12, 7, 42);
  assert.equal(field.width, 12);
  assert.equal(field.height, 7);
  assert.equal(field.cells.length, 84);
  for (const cell of field.cells) {
    assert.ok(Number.isFinite(cell));
    assert.ok(cell >= 0 && cell <= 1);
  }
});

test("createField is deterministic for the same seed", () => {
  const first = createField(18, 9, 123);
  const second = createField(18, 9, 123);
  assert.deepEqual(Array.from(first.cells), Array.from(second.cells));
});

test("different seeds can produce different fields", () => {
  const first = createField(18, 9, 123);
  const second = createField(18, 9, 124);
  assert.notDeepEqual(Array.from(first.cells), Array.from(second.cells));
});

test("sampleField is bounded and responds deterministically to time", () => {
  const field = createField(10, 10, 10);
  const a = sampleField(field, 4, 5, 1000);
  const b = sampleField(field, 4, 5, 1000);
  assert.equal(a, b);
  assert.ok(a >= 0 && a <= 1);
  assert.equal(sampleField(field, 500, 500, 0), 0);
});

test("invalid field sizes are rejected", () => {
  assert.throws(() => createField(0, 10), RangeError);
  assert.throws(() => createField(10.2, 10), RangeError);
});
