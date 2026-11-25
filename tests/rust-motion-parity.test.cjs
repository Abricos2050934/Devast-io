const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('numeric Rust strafe fits retain source models and intercepts across seeded motion histories',()=>{
 const js=vm.createContext({}),rust=vm.createContext({});vm.runInContext(fs.readFileSync('mod/ballistic-model.js','utf8'),js);
 require('../tools/rust_fixture.cjs').install(rust,'rust-mod');let seed=0x4a17b;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const models=new Set();
 for(let sample=0;sample<96;sample++){
  const kind=sample%6,frequency=[2.25,3.6,4.8,5.3][sample%4],phase=.4+random()*.2,axis=.5+random()*.3,amp=42+random()*10,drift=120+random()*30;
  let now=0;const settings={predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.4};
  const pair=[js,rust].map(c=>c.__createBallisticAim({...settings},()=>now));
  for(let i=-24;i<=0;i++){
   const t=i*.05;now=1500+i*50;
   let x,y;
   if(kind===0){x=450+90*Math.cos(t*2.2);y=100+90*Math.sin(t*2.2);}
   else if(kind===1){x=450+100*t;y=100+80*t;}
   else if(kind===2){x=450;y=100;}
   else if(kind===3){x=450;y=100+(t<-.4?100*t:-100*t-80);}
   else{const side=amp*(Math.sin(frequency*t+phase)-Math.sin(phase)),forward=kind===5?drift*t:0;x=480+forward*Math.cos(axis)-side*Math.sin(axis);y=110+forward*Math.sin(axis)+side*Math.cos(axis);}
   if(sample%2){x=Math.round(x);y=Math.round(y);}
   for(const aim of pair){aim.track('self',0,0,true,{weapon:10});aim.track('target',x,y,true);}
  }
  now=1575;const [expected,actual]=pair.map(aim=>aim.resolve('self','target',{speed:1400,range:900}));
  assert.equal(actual.valid,expected.valid,'valid '+sample);assert.equal(actual.motionModel,expected.motionModel,'model '+sample);models.add(actual.motionModel);
  if(expected.valid){for(const key of ['x','y','angle','flight','ox','oy'])assert.ok(Math.abs(actual[key]-expected[key])<1e-7,`${sample} ${key}: ${actual[key]} / ${expected[key]}`);}
 }
 assert.ok(models.has('strafe'));assert.ok(models.has('drifting-strafe'));assert.ok(models.has('circle'));
});
