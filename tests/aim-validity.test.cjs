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
  assert.equal(f.mod.controlsAimDirection,true,'Native mouse overwrote ILM while enabled');
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
  assert.equal(f.mod.aim.lastAngle,137);assert.deepEqual(f.packets,[]);assert.equal(f.mod.controlsAimDirection,true);
 }finally{f.mod.dispose();}
});
test('target reacquisition reasserts the source angle while mouse direction remains suppressed',()=>{
 const f=setup();try{
  f.mod.aim.refresh();assert.equal(f.mod.controlsAimDirection,true);
  f.mod.trackPacket(1,2,0,0,0,false);assert.equal(f.mod.controlsAimDirection,true);
  f.mod.trackPacket(1,2,0,1200,1000,true);f.mod.aim.refresh();
  assert.deepEqual(f.packets,[[6,0],[6,0]],'Reacquisition changed original timer output');
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
  f.mod.setSetting('autoFire',true);
  for(let n=0;n<50;n++){f.setClock(n*50);f.mod.aim.refresh();f.mod.beforeFire();f.mod.step(n*50);}
  assert.equal(f.packets.length,count,'Terminated session kept sending combat commands');assert.equal(f.mod.controlsAimDirection,false);
  assert.equal(f.mod.connectionInfo().sessionEnded,true);
 }finally{f.mod.dispose();}
});

test('a handshake before the next timer tick cannot reuse entities from the previous session',()=>{
 const f=setup();try{f.mod.trackPacket(13,0,17,1100,1000,true);f.mod.aim.refresh();f.packets.length=0;
  f.mod.onSessionStart();f.mod.onHandshake();f.mod.aim.refresh();
  assert.equal(f.mod.targets.players.some(t=>t.active),false);assert.equal(f.mod.targets.ghouls.some(t=>t.active),false);assert.deepEqual(f.packets,[]);assert.equal(f.mod.controlsAimDirection,true);
  f.mod.trackPacket(1,1,1,4000,4000,true);f.mod.trackPacket(1,2,1,4500,4000,true);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0]]);assert.equal(f.mod.targets.players[2].prevX[0],-1);
 }finally{f.mod.dispose();}
});
test('reused ghoul UID starts a new history and is not selected before a new position arrives',()=>{
 const f=setup();try{f.mod.setSetting('lockId',-1);f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('target','ghouls');f.mod.trackPacket(13,0,17,1100,1000,true);f.mod.aim.refresh();
  f.mod.onSessionStart();f.mod.onHandshake();f.mod.trackPacket(1,1,1,4000,4000,true);f.packets.length=0;f.mod.aim.refresh();assert.deepEqual(f.packets,[]);
  f.mod.trackPacket(13,0,17,4500,4000,true);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0]]);assert.equal(f.mod.targets.ghouls[17].prevX[0],-1);
 }finally{f.mod.dispose();}
});
