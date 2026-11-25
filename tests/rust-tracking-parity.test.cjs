const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function close(a,b,label){
 if(a===null||b===null){assert.equal(a,b,label);return;}
 for(const key of ['x','y','vx','vy','age'])assert.ok(Math.abs(a[key]-b[key])<1e-7,label+' '+key);
 assert.equal(a.samples,b.samples,label+' samples');assert.equal(a.weapon,b.weapon,label+' weapon');
 assert.equal(!!a.curve,!!b.curve,label+' circle');
 if(a.curve)for(const key of ['cx','cy','radius','omega','angle','at','streak'])assert.ok(Math.abs(a.curve[key]-b.curve[key])<1e-7,label+' circle '+key);
}
test('Rust batch tracking preserves coalescing, circle confirmation and every history reset',()=>{
 const js=vm.createContext({}),rust=vm.createContext({});vm.runInContext(fs.readFileSync('mod/ballistic-model.js','utf8'),js);require('../tools/rust_fixture.cjs').install(rust,'rust-mod');
 for(let trace=0;trace<12;trace++){
  let now=1000;const models=[js,rust].map(c=>c.__createBallisticAim({predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.4},()=>now));
  for(let i=0;i<58;i++){
   now+=[50,50,80,100][trace%4];if(i===10||i===11)now-=trace%2?46:50;if(i===26)now+=600;if(i===31)now-=200;
   const phase=i*.17,x=500+90*Math.cos(phase),y=100+90*Math.sin(phase);let px=trace%2?Math.round(x):x,py=trace%2?Math.round(y):y;
   if(i===35){px+=3000;py+=3000;}if(i===41)px=NaN;
   const active=i!==20;const generation=i<45?1:i<50?'1':i<54?undefined:2;const meta={generation,...(i%3?{}:{weapon:i%4?10:5})};
   for(const m of models){m.track('self',0,0,true,{weapon:10});m.track('target',px,py,active,meta);}
   const label=trace+':'+i;close(models[0].motion('target'),models[1].motion('target'),label);
   const a=models[0].resolve('self','target',{speed:1400,range:900}),b=models[1].resolve('self','target',{speed:1400,range:900});
   assert.equal(a.valid,b.valid,label+' valid');assert.equal(a.motionModel,b.motionModel,label+' model');
   if(a.valid)for(const key of ['x','y','angle','flight'])assert.ok(Math.abs(a[key]-b[key])<1e-7,label+' '+key);
  }
  for(const m of models)m.reset();assert.equal(models[1].motion('target'),null);
 }
});
