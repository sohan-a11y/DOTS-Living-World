import test from "node:test";
import assert from "node:assert/strict";
import { compileWorldPrompt, validateWorldSpec } from "../src/world-spec.js";
const defaults={presetId:"moss-basin",seed:73021,inhabitantCount:8,nca:{enabled:true,showOverlay:true,seedRadius:2,updateRate:.55}};

test("natural-language prompt compiles into a deterministic bounded declarative spec",()=>{
 const prompt="Make a cold crystal ridge with seed 31415 and 12 inhabitants, seed radius of 3, update rate of 0.8";
 const a=compileWorldPrompt(prompt,defaults),b=compileWorldPrompt(prompt,defaults);
 assert.deepEqual(a,b);assert.equal(a.presetId,"crystal-ridge");assert.equal(a.seed,31415);
 assert.equal(a.inhabitantCount,12);assert.equal(a.nca.seedRadius,3);assert.equal(a.nca.updateRate,.8);
 assert.deepEqual(validateWorldSpec(a),a);
});
test("supported preset keywords map only to the three known presets",()=>{
 assert.equal(compileWorldPrompt("Build a dry volcanic world",defaults).presetId,"ashen-frontier");
 assert.equal(compileWorldPrompt("Create a lush mossy forest",defaults).presetId,"moss-basin");
 assert.equal(compileWorldPrompt("Use a blue sky",defaults).presetId,"moss-basin");
});
test("NCA overlay can be hidden without disabling the engine",()=>{
 const a=compileWorldPrompt("Hide the NCA overlay",defaults);
 assert.equal(a.nca.enabled,true);assert.equal(a.nca.showOverlay,false);
 const b=compileWorldPrompt("Show NCA cells",{...defaults,nca:a.nca});
 assert.equal(b.nca.enabled,true);assert.equal(b.nca.showOverlay,true);
});
test("explicit NCA disable turns off stepping and overlay",()=>{
 const spec=compileWorldPrompt("Disable the NCA engine",defaults);
 assert.equal(spec.nca.enabled,false);assert.equal(spec.nca.showOverlay,false);
});
test("unknown keys and out-of-range values are rejected",()=>{
 const valid=compileWorldPrompt("Use seed 12 and 4 inhabitants",defaults);
 assert.throws(()=>validateWorldSpec({...valid,execute:"alert(1)"}),TypeError);
 assert.throws(()=>compileWorldPrompt("Use seed 0",defaults),RangeError);
 assert.throws(()=>compileWorldPrompt("Use seed 9999999999",defaults),RangeError);
 assert.throws(()=>compileWorldPrompt("Create 40 inhabitants",defaults),RangeError);
 assert.throws(()=>compileWorldPrompt("Seed radius 9",defaults),RangeError);
 assert.throws(()=>compileWorldPrompt("Update rate 0.01",defaults),RangeError);
 assert.throws(()=>compileWorldPrompt("x".repeat(601),defaults),RangeError);
 assert.throws(()=>compileWorldPrompt("   ",defaults),TypeError);
});
