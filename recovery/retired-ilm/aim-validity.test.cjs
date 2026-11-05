const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
function setup(){
 const f=fixture();f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.trackPacket(1,2,0,1200,1000,true);
 f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);return f;
}
test('removed locked target cannot turn the player toward its cleared coordinates or trigger autoFire',()=>{
 const f=setup();try{
  f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0]]);
  f.mod.trackPacket(1,2,0,0,0,false);f.mod.setSetting('autoFire',true);
  for(let n=0;n<50;n++){f.setClock(n*50);f.mod.aim.refresh();}
  assert.deepEqual(f.packets,[[6,0]],'Removed target generated stale aim or automatic attacks');
  assert.equal(f.mod.controlsAimDirection,false,'Native mouse input was suppressed for a missing target');
 }finally{f.mod.dispose();}
});
test('own coordinates are required before emitting any aim or automatic attack',()=>{
 const f=fixture();try{
  f.mod.trackPacket(1,2,0,1200,1000,true);f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('autoFire',true);
  f.mod.aim.refresh();f.mod.beforeFire();assert.deepEqual(f.packets,[]);
  f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.aim.refresh();assert.equal(f.packets[0]?.[0],6);
  f.mod.trackPacket(1,1,0,0,0,false);const count=f.packets.length;f.mod.aim.refresh();f.mod.beforeFire();assert.equal(f.packets.length,count);
 }finally{f.mod.dispose();}
});
test('no target leaves the original angle in core state but does not inject it into native transport',()=>{
 const f=fixture();try{
  f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.setSetting('AimBotEnabled',true);f.mod.aim.lastAngle=137;f.mod.aim.refresh();
  assert.equal(f.mod.aim.lastAngle,137);assert.deepEqual(f.packets,[]);assert.equal(f.mod.controlsAimDirection,false);
 }finally{f.mod.dispose();}
});
test('target reacquisition reasserts an equal angle after native input resumed',()=>{
 const f=setup();try{
  f.mod.aim.refresh();assert.equal(f.mod.controlsAimDirection,true);
  f.mod.trackPacket(1,2,0,0,0,false);assert.equal(f.mod.controlsAimDirection,false);
  f.network['ᴎᚂρ']('[6,90]');f.mod.trackPacket(1,2,0,1200,1000,true);f.mod.aim.refresh();
  assert.deepEqual(f.packets,[[6,0],[6,90],[6,0]],'Direction coalescing hid native input during target loss');
 }finally{f.mod.dispose();}
});
test('self locks are invalid but ghouls remain targetable',()=>{
 const f=setup();try{
  f.mod.setSetting('lockId',1);f.mod.aim.refresh();assert.deepEqual(f.packets,[]);
  f.mod.setSetting('lockId',-1);f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('target','ghouls');f.mod.trackPacket(13,0,17,1100,1000,true);f.mod.aim.refresh();assert.equal(f.packets[0]?.[0],6);
 }finally{f.mod.dispose();}
});
test('server death observation sends nothing and stops subsequent automatic aim/fire even before native state changes',()=>{
 const f=setup();try{
  f.mod.aim.refresh();const count=f.packets.length;
  f.mod.observeDeath(new Uint8Array([5,0,2]));assert.equal(f.packets.length,count);
  f.mod.setSetting('autoFire',true);f.mod.setSetting('JitterEnabled',true);
  for(let n=0;n<50;n++){f.setClock(n*50);f.mod.aim.refresh();f.mod.beforeFire();f.mod.step(n*50);}
  assert.equal(f.packets.length,count,'Terminated session kept sending combat commands');assert.equal(f.mod.controlsAimDirection,false);
  assert.equal(f.mod.connectionInfo().sessionEnded,true);
 }finally{f.mod.dispose();}
});
