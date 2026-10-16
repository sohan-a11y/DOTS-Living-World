export const NCA_CHANNELS = Object.freeze(["alive", "pigment", "nutrient", "signal", "age"]);
const CHANNELS=NCA_CHANNELS.length, INPUT_FEATURES=CHANNELS*3, HIDDEN=12;
const UPDATE_SCALES=Object.freeze([0.15,0.075,0.045,0.09,0.035]);
function randomGenerator(seed){let state=seed>>>0;return()=>{state=(state+0x6d2b79f5)>>>0;let value=state;value=Math.imul(value^(value>>>15),value|1);value^=value+Math.imul(value^(value>>>7),value|61);return((value^(value>>>14))>>>0)/4294967296;};}
function clamp(v){return Math.max(0,Math.min(1,v));}
function validSeed(seed){return Number.isSafeInteger(seed)&&seed>=1&&seed<=4294967295;}
function makeWeights(seed){
 const random=randomGenerator(seed^0xB5297A4D);
 const input=new Float32Array(HIDDEN*INPUT_FEATURES),inputBias=new Float32Array(HIDDEN),output=new Float32Array(CHANNELS*HIDDEN),outputBias=new Float32Array(CHANNELS);
 for(let i=0;i<input.length;i++)input[i]=(random()-.5)*.24;
 for(let i=0;i<inputBias.length;i++)inputBias[i]=(random()-.5)*.05;
 for(let i=0;i<output.length;i++)output[i]=(random()-.5)*.24;
 for(let i=0;i<outputBias.length;i++)outputBias[i]=(random()-.5)*.04;
 const set=(neuron,feature,weight)=>{input[neuron*INPUT_FEATURES+feature]=weight;};
 for(let neuron=0;neuron<6;neuron++){input.fill(0,neuron*INPUT_FEATURES,(neuron+1)*INPUT_FEATURES);inputBias[neuron]=0;}
 set(0,1,3);inputBias[0]=-.35; set(1,0,2);inputBias[1]=-.5; set(2,2,3); set(3,2,-3); set(4,10,2);inputBias[4]=-.2; set(5,7,2);inputBias[5]=-.3;
 output.fill(0,0,HIDDEN);
 output[0]=.85;output[1]=-.24;output[2]=.25;output[3]=-.05;output[4]=.12;output[5]=.06;outputBias[0]=-.02;
 return{input,inputBias,output,outputBias};
}
function cellNoise(seed,tick,index){let v=(seed^Math.imul(tick+1,0x9e3779b1)^Math.imul(index+1,0x85ebca77))>>>0;v^=v>>>16;v=Math.imul(v,0x7feb352d);v^=v>>>15;v=Math.imul(v,0x846ca68b);v^=v>>>16;return(v>>>0)/4294967296;}
export function createNcaField({width=64,height=36,seed=73021,seedRadius=2}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||width*height>16384)throw new RangeError("NCA dimensions must be at least 8×8 and no more than 16,384 cells.");
 if(!validSeed(seed))throw new RangeError("NCA seed must be an integer from 1 to 4294967295.");
 if(!Number.isInteger(seedRadius)||seedRadius<1||seedRadius>6)throw new RangeError("Seed radius must be an integer from 1 to 6.");
 const state=new Float32Array(width*height*CHANNELS),random=randomGenerator(seed^0x68bc21eb),cx=Math.floor(width/2),cy=Math.floor(height/2);
 for(let i=0;i<width*height;i++){state[i*CHANNELS+2]=.42+random()*.12;state[i*CHANNELS+3]=random()*.025;}
 for(let y=Math.max(0,cy-seedRadius);y<=Math.min(height-1,cy+seedRadius);y++)for(let x=Math.max(0,cx-seedRadius);x<=Math.min(width-1,cx+seedRadius);x++){
  const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy>seedRadius*seedRadius)continue;const b=(y*width+x)*CHANNELS;
  state[b]=1;state[b+1]=clamp(.35+(dx+seedRadius)/(seedRadius*4));state[b+2]=.68;state[b+3]=.72;state[b+4]=.05;
 }
 return{width,height,seed:seed>>>0,tick:0,channels:CHANNELS,channelNames:NCA_CHANNELS,state,weights:makeWeights(seed)};
}
export function stepNca(field,{updateRate=.5}={}){
 if(!field||!Number.isInteger(field.width)||!Number.isInteger(field.height)||!(field.state instanceof Float32Array)||field.state.length!==field.width*field.height*CHANNELS||!field.weights)throw new TypeError("stepNca requires a field created by createNcaField.");
 if(typeof updateRate!=="number"||!Number.isFinite(updateRate)||updateRate<=0||updateRate>1)throw new RangeError("NCA updateRate must be greater than 0 and at most 1.");
 const{width,height,state,weights}=field,next=new Float32Array(state.length),features=new Float32Array(INPUT_FEATURES),hidden=new Float32Array(HIDDEN),outputs=new Float32Array(CHANNELS),nextTick=field.tick+1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const index=y*width+x,b=index*CHANNELS;next.set(state.subarray(b,b+CHANNELS),b);
  if(cellNoise(field.seed,nextTick,index)>=updateRate)continue;
  for(let ch=0;ch<CHANNELS;ch++){
   const center=state[b+ch];let sum=0,count=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;sum+=state[(ny*width+nx)*CHANNELS+ch];count++;}
   const mean=count?sum/count:0;features[ch*3]=center;features[ch*3+1]=mean;features[ch*3+2]=mean-center;
  }
  for(let neuron=0;neuron<HIDDEN;neuron++){let total=weights.inputBias[neuron],offset=neuron*INPUT_FEATURES;for(let j=0;j<INPUT_FEATURES;j++)total+=weights.input[offset+j]*features[j];hidden[neuron]=Math.tanh(total);}
  for(let ch=0;ch<CHANNELS;ch++){let total=weights.outputBias[ch],offset=ch*HIDDEN;for(let j=0;j<HIDDEN;j++)total+=weights.output[offset+j]*hidden[j];outputs[ch]=Math.tanh(total);}
  for(let ch=0;ch<CHANNELS;ch++)next[b+ch]=clamp(state[b+ch]+outputs[ch]*UPDATE_SCALES[ch]);
  if(next[b]<.015&&features[1]<.025)next[b]=0;
 }
 return{...field,state:next,tick:nextTick};
}
export function countActiveCells(field,threshold=.12){
 if(!field||!(field.state instanceof Float32Array)||!Number.isFinite(threshold)||threshold<0||threshold>1)throw new RangeError("countActiveCells requires an NCA field and a threshold from 0 to 1.");
 let count=0;for(let i=0;i<field.width*field.height;i++)if(field.state[i*CHANNELS]>=threshold)count++;return count;
}
