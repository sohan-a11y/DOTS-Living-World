import test from "node:test";
import assert from "node:assert/strict";
import { createNcaField, stepNca, countActiveCells, NCA_CHANNELS } from "../src/nca.js";
test("NCA field has five bounded channels and a reproducible seed pattern",()=>{
 const a=createNcaField({width:20,height:12,seed:55}),b=createNcaField({width:20,height:12,seed:55});
 assert.equal(a.channels,5);assert.deepEqual(NCA_CHANNELS,["alive","pigment","nutrient","signal","age"]);
 assert.deepEqual(Array.from(a.state),Array.from(b.state));assert.deepEqual(Array.from(a.weights.input),Array.from(b.weights.input));
 assert.ok(countActiveCells(a)>0);assert.ok(Array.from(a.state).every(v=>Number.isFinite(v)&&v>=0&&v<=1));
});
test("NCA step applies shared neural updates without mutating its input",()=>{
 const field=createNcaField({width:20,height:12,seed:101}),snapshot=Array.from(field.state),next=stepNca(field,{updateRate:1});
 assert.notEqual(next,field);assert.equal(next.tick,field.tick+1);assert.deepEqual(Array.from(field.state),snapshot);
 assert.notDeepEqual(Array.from(next.state),snapshot);assert.ok(Array.from(next.state).every(v=>Number.isFinite(v)&&v>=0&&v<=1));
});
test("NCA replay produces identical states for same seed and tick count",()=>{
 const run=()=>{let f=createNcaField({width:24,height:16,seed:9981});for(let i=0;i<18;i++)f=stepNca(f,{updateRate:.6});return f;};
 const a=run(),b=run();assert.equal(a.tick,18);assert.deepEqual(Array.from(a.state),Array.from(b.state));assert.equal(countActiveCells(a),countActiveCells(b));
});
test("NCA dimensions, seed, radius and update rate are bounded",()=>{
 assert.throws(()=>createNcaField({width:4,height:12}),RangeError);assert.throws(()=>createNcaField({width:200,height:200}),RangeError);
 assert.throws(()=>createNcaField({seed:0}),RangeError);assert.throws(()=>createNcaField({seedRadius:0}),RangeError);
 const f=createNcaField();assert.throws(()=>stepNca(f,{updateRate:0}),RangeError);assert.throws(()=>stepNca(f,{updateRate:1.2}),RangeError);assert.throws(()=>stepNca(null),TypeError);
});
