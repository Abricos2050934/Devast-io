// Normal manual attacks must not replace or reschedule original ILM prediction.
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
function setup(){
 const f=fixture({fireKey:'nativeFire'});
 f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1080,true);
 f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);
 f.B.input={angle:-2};f.shoot=()=>f.network.nativeFire();return f;
}
test('first non-Jitter shot before the first ILM tick sends only the native attack',()=>{
 const f=setup();try{
  const before=JSON.stringify(f.mod.targets.lines);f.shoot();assert.deepEqual(f.packets,[[4]]);
  assert.equal(JSON.stringify(f.mod.targets.lines),before);assert.equal(f.mod.aim.targetPlayer,null);assert.equal(f.B.input.angle,-2);
 }finally{f.mod.dispose();}
});
test('moving a target between ticks does not change aim on click; the next 50 ms tick computes it',()=>{
 const f=setup();try{
  f.mod.aim.refresh();const angle=f.mod.aim.lastAngle,line=JSON.stringify(f.mod.targets.lines);f.packets.length=0;
  f.mod.trackPacket(1,2,1,1450,1200,true);f.shoot();
  assert.deepEqual(f.packets,[[4]]);assert.equal(f.mod.aim.lastAngle,angle);assert.equal(JSON.stringify(f.mod.targets.lines),line);
  f.mod.aim.refresh();assert.notEqual(f.mod.aim.lastAngle,angle);assert.equal(f.packets.at(-1)[0],6);
 }finally{f.mod.dispose();}
});
test('held native attacks and aim toggles never calculate additional predictions between timer ticks',()=>{
 const f=setup();try{
  f.mod.aim.refresh();const angle=f.mod.aim.lastAngle;f.packets.length=0;
  f.mod.trackPacket(1,2,1,1400,1300,true);
  f.mod.setSetting('AimBotEnabled',false);f.mod.setSetting('AimBotEnabled',true);
  for(let i=0;i<20;i++){f.setClock(i*5);f.shoot();}
  assert.equal(f.packets.length,20);assert.ok(f.packets.every(p=>p.length===1&&p[0]===4));assert.equal(f.mod.aim.lastAngle,angle);
  assert.equal(f.timerPeriods.values().next().value,50);
 }finally{f.mod.dispose();}
});
