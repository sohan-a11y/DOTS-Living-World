/**
 * Deterministic procedural field used only as decorative artwork in v0.1.
 * This is not a Neural Cellular Automaton and does not model agents.
 */
export function createField(width, height, seed = 73021) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new RangeError("Field dimensions must be positive integers.");
  }
  let state = seed >>> 0;
  const random = () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const cells = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const centerX = (x - width * 0.53) / Math.max(1, width * 0.5);
      const centerY = (y - height * 0.48) / Math.max(1, height * 0.5);
      const ridge = Math.sin(x * 0.19) * 0.16 + Math.cos(y * 0.21) * 0.13;
      const basin = Math.max(0, 1 - Math.sqrt(centerX * centerX + centerY * centerY));
      const noise = (random() - 0.5) * 0.6;
      cells[y * width + x] = Math.max(0, Math.min(1, 0.25 + ridge + basin * 0.28 + noise));
    }
  }
  return { width, height, cells, seed: seed >>> 0 };
}

export function sampleField(field, x, y, time = 0) {
  const index = y * field.width + x;
  const base = field.cells[index] ?? 0;
  const shimmer = Math.sin(time * 0.001 + x * 0.08 + y * 0.06) * 0.025;
  return Math.max(0, Math.min(1, base + shimmer));
}
