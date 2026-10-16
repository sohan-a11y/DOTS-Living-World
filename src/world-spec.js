export const WORLD_SPEC_VERSION = 1;
const PRESETS = Object.freeze(["moss-basin", "crystal-ridge", "ashen-frontier"]);
const TOP_KEYS = ["version", "presetId", "seed", "inhabitantCount", "nca", "rationale"];
const NCA_KEYS = ["enabled", "showOverlay", "seedRadius", "updateRate"];
const record = v => v !== null && typeof v === "object" && !Array.isArray(v);
const exactKeys = (v, keys) => { const a=Object.keys(v).sort(),b=[...keys].sort();return a.length===b.length&&a.every((k,i)=>k===b[i]); };
const seedOK = v => Number.isSafeInteger(v) && v >= 1 && v <= 4294967295;

export function validateWorldSpec(spec) {
  if (!record(spec) || !exactKeys(spec, TOP_KEYS)) throw new TypeError("World spec must contain only version, presetId, seed, inhabitantCount, nca, and rationale.");
  if (spec.version !== WORLD_SPEC_VERSION) throw new RangeError("Unsupported world spec version.");
  if (!PRESETS.includes(spec.presetId)) throw new RangeError("Unsupported world preset.");
  if (!seedOK(spec.seed)) throw new RangeError("Seed must be an integer from 1 to 4294967295.");
  if (!Number.isInteger(spec.inhabitantCount) || spec.inhabitantCount < 0 || spec.inhabitantCount > 32) throw new RangeError("Inhabitant count must be an integer from 0 to 32.");
  if (!record(spec.nca) || !exactKeys(spec.nca, NCA_KEYS)) throw new TypeError("NCA spec must contain only enabled, showOverlay, seedRadius, and updateRate.");
  if (typeof spec.nca.enabled !== "boolean" || typeof spec.nca.showOverlay !== "boolean") throw new TypeError("NCA enabled and showOverlay must be boolean values.");
  if (!Number.isInteger(spec.nca.seedRadius) || spec.nca.seedRadius < 1 || spec.nca.seedRadius > 6) throw new RangeError("NCA seed radius must be an integer from 1 to 6.");
  if (typeof spec.nca.updateRate !== "number" || !Number.isFinite(spec.nca.updateRate) || spec.nca.updateRate < .05 || spec.nca.updateRate > 1) throw new RangeError("NCA update rate must be from 0.05 to 1.");
  if (!Array.isArray(spec.rationale) || spec.rationale.length > 8 || !spec.rationale.every(v => typeof v === "string" && v.length > 0 && v.length <= 180)) throw new TypeError("Rationale must be an array of up to 8 short explanation strings.");
  return spec;
}

export function compileWorldPrompt(prompt, defaults = {}) {
  if (typeof prompt !== "string" || !prompt.trim()) throw new TypeError("Describe the world before compiling a specification.");
  if (prompt.length > 600) throw new RangeError("World instructions must be 600 characters or fewer.");
  const text = prompt.trim().toLowerCase();
  const presetDefault = PRESETS.includes(defaults.presetId) ? defaults.presetId : "moss-basin";
  const seedDefault = seedOK(defaults.seed) ? defaults.seed : 73021;
  const countDefault = Number.isInteger(defaults.inhabitantCount) && defaults.inhabitantCount >= 0 && defaults.inhabitantCount <= 32 ? defaults.inhabitantCount : 8;
  const dn = record(defaults.nca) ? defaults.nca : {};
  const rationale = [];
  let presetId=presetDefault, seed=seedDefault, inhabitantCount=countDefault;
  let enabled=dn.enabled !== false, showOverlay=dn.showOverlay !== false;
  let seedRadius=Number.isInteger(dn.seedRadius)&&dn.seedRadius>=1&&dn.seedRadius<=6?dn.seedRadius:2;
  let updateRate=typeof dn.updateRate==="number"&&Number.isFinite(dn.updateRate)?dn.updateRate:.55;

  if (/\b(crystal|icy|ice|mountain|ridge|cold)\b/i.test(text)) { presetId="crystal-ridge"; rationale.push("Selected Crystal Ridge from the crystal, ice, mountain, or ridge wording."); }
  else if (/\b(ashen|ash|volcanic|dry|desert|arid|barren)\b/i.test(text)) { presetId="ashen-frontier"; rationale.push("Selected Ashen Frontier from the dry, ash, or volcanic wording."); }
  else if (/\b(moss|wet|lush|forest|swamp|green|basin|meadow)\b/i.test(text)) { presetId="moss-basin"; rationale.push("Selected Moss Basin from the moss, wet, lush, or forest wording."); }
  else rationale.push("No preset keyword was recognized; kept the current preset.");

  const sm=text.match(/\bseed(?:\s*(?:is|=|:))?\s+(\d{1,10})\b/i);
  if(sm){seed=Number(sm[1]);rationale.push("Read the requested seed from the instruction.");}
  else rationale.push("No seed was specified; kept the current seed.");
  const cm=text.match(/\b(\d{1,2})\s*(?:inhabitants?|agents?|characters?|creatures?)\b/i);
  if(cm){inhabitantCount=Number(cm[1]);rationale.push("Read the requested inhabitant count from the instruction.");}
  else rationale.push("No population count was specified; kept the current count.");
  const rm=text.match(/\b(?:seed|growth|starter)\s+radius\s*(?:(?:is|=|:|of)\s*)?(\d{1,2})\b/i);
  if(rm){seedRadius=Number(rm[1]);rationale.push("Set the NCA seed radius from the instruction.");}
  const ur=text.match(/\bupdate\s+rate\s*(?:(?:is|=|:|of|to)\s*)?(0?\.\d+|1(?:\.0+)?)\b/i);
  if(ur){updateRate=Number(ur[1]);rationale.push("Set the NCA update rate from the instruction.");}
  if (/\b(?:disable|turn off|switch off|stop)\s+(?:the\s+)?nca\s+(?:engine|simulation|field)\b|\bnca\s+(?:off|disabled)\b/i.test(text)) {
    enabled=false;showOverlay=false;rationale.push("Disabled NCA stepping and its visual overlay.");
  } else {
    if (/\b(?:hide|turn off|switch off)\s+(?:the\s+)?(?:nca\s+)?(?:cells|overlay)\b|\bnca\s+overlay\s+(?:off|hidden)\b/i.test(text)) { showOverlay=false;rationale.push("Turned off the NCA overlay while preserving the engine setting."); }
    if (/\b(?:show|enable|turn on)\s+(?:the\s+)?(?:nca\s+)?(?:cells|overlay)\b|\bnca\s+overlay\s+(?:on|visible)\b/i.test(text)) { showOverlay=true;enabled=true;rationale.push("Enabled the NCA overlay."); }
  }
  return validateWorldSpec({version:WORLD_SPEC_VERSION,presetId,seed,inhabitantCount,nca:{enabled,showOverlay:enabled&&showOverlay,seedRadius,updateRate},rationale:rationale.slice(0,8)});
}
