const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function setup(){
 const f=fixture({dom:true});f.B.input={angle:0};f.setClock(0);
 f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2,1,100,100,true);
 f.mod.setSetting('mouseFovEnable',false);
 return f;
}
test('Jitter GUI rotates standing and moving players at the chosen speed without movement commands',()=>{
 const f=setup();try{
  const gui=menu(f).__folders.Jitter;
  control(gui,'JitterEnabled').setValue(true);control(gui,'JitterSpeed').setValue(180);
  f.mod.step(0);f.mod.step(250);assert.equal(f.packets.at(-1)[1],45);
  f.world['ᅠᏧ‍'].x=40;f.mod.step(500);assert.equal(f.packets.at(-1)[1],90);
  f.mod.setSetting('JitterSpeed',360);f.mod.step(750);assert.equal(f.packets.at(-1)[1],180);
  assert.ok(f.packets.every(p=>p[0]===6));assert.equal(f.mod.jitterAngle,Math.PI);
  f.mod.setSetting('JitterEnabled',false);assert.equal(f.mod.jitterAngle,null);assert.equal(f.B.input.angle,0);
 }finally{f.mod.dispose();}
});
test('Jitter preserves ILM core but aims immediately before fire and throughout held fire, then resumes',()=>{
 const f=setup();try{
  f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('JitterEnabled',true);
  f.mod.step(0);f.mod.step(200);assert.equal(f.packets.at(-1)[1],72);
  f.setClock(200);f.mod.beforeFire();assert.equal(f.packets.at(-1)[1],45);assert.equal(f.mod.jitterAngle,null);
  f.mod.aim.mouseDown=true;f.mod.step(400);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],45);assert.equal(f.mod.jitterAngle,null);
  f.mod.aim.mouseDown=false;f.setClock(500);f.mod.step(500);f.mod.step(750);assert.equal(f.packets.at(-1)[1],90);
 }finally{f.mod.dispose();}
});
test('Jitter pauses during manual fire without aim, death, disconnect and disposal; rate is bounded',()=>{
 const f=setup();try{
  f.mod.setSetting('JitterEnabled',true);f.mod.step(0);f.packets.length=0;
  for(let t=1;t<=100;t++)f.mod.step(t);assert.equal(f.packets.length,2);
  f.mod.aim.mouseDown=true;f.mod.step(200);assert.equal(f.mod.jitterAngle,null);
  f.mod.aim.mouseDown=false;f.mod.step(250);f.network.state=64;f.mod.step(300);assert.equal(f.mod.jitterAngle,null);
  const count=f.packets.length;f.mod.aim.refresh();assert.equal(f.packets.length,count);
  f.network.state=1;f.world['ᅠᏧ‍'].id=0;f.mod.step(350);assert.equal(f.mod.jitterAngle,null);
  f.mod.dispose();f.mod.step(1000);assert.equal(f.packets.length,count);
 }finally{f.mod.dispose();}
});
test('Jitter settings persist and reject nonfinite or out of range speeds',()=>{
 const f=setup();try{
  for(const n of [0,-1,3601,NaN,Infinity])assert.throws(()=>f.mod.setSetting('JitterSpeed',n));
  f.mod.setSetting('JitterSpeed',720);const saved=Object.fromEntries(f.storage);
  const restored=fixture({dom:true,saved});try{assert.equal(restored.mod.settings.JitterSpeed,720);}finally{restored.mod.dispose();}
 }finally{f.mod.dispose();}
});
test('raw native fire patch calls shot alignment before the native attack encoder',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const context=vm.createContext({events:[],__responsiveMod:{beforeFire(){context.events.push('aim');}}});
 vm.runInContext(fs.readFileSync('mod/ilm-aim.js','utf8'),context);
 const source='function ᴎ༩༣( ) {ﾠࠂ̶=ᴉ̡̂;ιܕ︅(еϲᄄ.ᴎ︅ހ([ⲣᄇ̴]));}';context.source=source;
 const patched=vm.runInContext('__jitterPatchNativeFire(source)',context);
 vm.runInContext('var ᴉ̡̂=1,ﾠࠂ̶=0,ⲣᄇ̴=4;function ιܕ︅(){};var еϲᄄ={ᴎ︅ހ(){events.push("attack");}};'+patched+';ᴎ༩༣();',context);
 assert.deepEqual(Array.from(context.events),['aim','attack']);
 context.source='unknown';assert.throws(()=>vm.runInContext('__jitterPatchNativeFire(source)',context),/Unsupported/);
});
test('Jitter autoFire gives a turning target the ILM angle, and a missing target never restores stale aim',()=>{
 const f=setup();try{
  f.mod.setSetting('JitterEnabled',true);f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('lockId',2);
  for(const x of [80,90,80])f.mod.trackPacket(1,2,1,x,100,true);
  f.mod.setSetting('autoFire',true);f.mod.aim.refresh();
  assert.deepEqual(f.packets.slice(-3).map(p=>p[0]),[6,4,5]);assert.equal(f.mod.jitterAngle,null);
  f.mod.setSetting('autoFire',false);f.mod.setSetting('lockId',-1);f.mod.trackPacket(1,2,1,0,0,false);
  f.mod.aim.mouseDown=true;f.packets.length=0;f.mod.aim.refresh();assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
