const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
function setup(){const f=fixture();f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.trackPacket(1,2,0,1500,1000,true);f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);return f;}
test('five minutes of unchanged aim retain 6000 calculation ticks but send only one native direction',()=>{
 const f=setup();try{
  for(let t=0;t<300000;t+=50){f.setClock(t);f.mod.aim.refresh();}
  assert.deepEqual(f.packets,[[6,0]]);assert.equal(f.mod.diagnostics.deduplicatedAngles,5999);assert.equal(f.timerPeriods.values().next().value,50);
  assert.equal(f.mod.targets.lines[0].x2,1500);assert.equal(f.mod.targets.lines[0].y2,1000);
 }finally{f.mod.dispose();}
});
test('a changed target direction is sent on the next calculation tick and repeated ticks retain it',()=>{
 const f=setup();try{
  f.setClock(0);f.mod.aim.refresh();f.setClock(50);f.mod.trackPacket(1,2,0,1000,1500,true);f.mod.aim.refresh();
  const angle=(Math.round(f.mod.aim.lastAngle)%360+360)%360;assert.deepEqual(f.packets,[[6,0],[6,angle]]);
  f.mod.aim.refresh();assert.equal(f.packets.length,2);
 }finally{f.mod.dispose();}
});
test('angle coalescing never drops attack or release commands',()=>{
 const f=setup();try{
  f.mod.setSetting('autoFire',true);f.mod.aim.wannaFire=()=>true;f.mod.aim.refresh();f.mod.aim.refresh();
  assert.deepEqual(f.packets,[[6,0],[4],[5],[4],[5]]);
 }finally{f.mod.dispose();}
});
test('a new player ID and re-enabling aim invalidate the remembered direction',()=>{
 const f=setup();try{
  f.mod.aim.refresh();f.world['ᅠᏧ‍'].id=3;f.mod.trackPacket(1,3,0,1000,1000,true);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0],[6,0]]);
  f.mod.setSetting('AimBotEnabled',false);f.mod.setSetting('AimBotEnabled',true);f.mod.aim.refresh();assert.equal(f.packets.length,3);
 }finally{f.mod.dispose();}
});
test('slow Jitter also coalesces equal integer angles while its local visual rotation continues',()=>{
 const f=fixture();try{
  f.B.input={angle:0};f.mod.setSetting('JitterEnabled',true);f.mod.setSetting('JitterSpeed',1);
  for(let t=0;t<=10000;t+=50){f.setClock(t);f.mod.step(t);f.mod.aim.refresh();}
  assert.equal(f.packets.length,11);assert.deepEqual(f.packets.map(p=>p[1]),Array.from({length:11},(_,i)=>i));
  assert.ok(Math.abs(f.mod.jitterAngle-10*Math.PI/180)<1e-8);assert.equal(f.B.input.angle,0);
 }finally{f.mod.dispose();}
});
test('turning Jitter off and on invalidates its angle even when native mouse movement happened between frames',()=>{
 const f=fixture();try{
  f.B.input={angle:0};f.setClock(0);f.mod.setSetting('JitterEnabled',true);f.mod.step(0);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0]]);
  f.mod.setSetting('JitterEnabled',false);f.B.input.angle=Math.PI/2;f.network['ᴎᚂρ']('[6,90]');
  f.B.input.angle=0;f.mod.setSetting('JitterEnabled',true);f.mod.step(1);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0],[6,90],[6,0]]);
 }finally{f.mod.dispose();}
});
