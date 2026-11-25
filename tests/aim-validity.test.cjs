const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
function setup(){const f=fixture();f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('lockId',2);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1200,1000,true);return f;}
test('removed target stops auto attacks and returns the source native fallback',()=>{const f=setup();try{f.mod.trackPacket(1,2,1,0,0,false);f.packets.length=0;f.mod.setSetting('autoFire',true);for(let i=0;i<50;i++)f.mod.aim.refresh();assert.deepEqual(f.packets,[]);assert.equal(f.mod.nativePacketAngle(90),90);}finally{f.mod.dispose();}});
test('missing self coordinates, self locks and server death emit no automated combat',()=>{for(const invalid of ['own','self','death']){const f=setup();try{if(invalid==='own')f.mod.trackPacket(1,1,1,0,0,false);if(invalid==='self'){f.mod.setSetting('lockId',1);f.mod.aimModule.refreshTargets();}if(invalid==='death')f.mod.observeDeath([5,0,2]);f.packets.length=0;f.mod.setSetting('autoFire',true);f.mod.aim.refresh();f.mod.afterFire();assert.deepEqual(f.packets,[],invalid);}finally{f.mod.dispose();}}});
test('rapid reconnect clears histories and reused IDs start without previous positions',()=>{const f=setup();try{f.mod.trackPacket(13,0,17,1100,1000,true);f.mod.onSessionStart();f.mod.onHandshake();f.packets.length=0;f.mod.aim.refresh();assert.deepEqual(f.packets,[]);for(const group of [f.mod.targets.players,f.mod.targets.ghouls])assert.equal(group.some(t=>t?.active),false);f.mod.trackPacket(1,1,1,4000,4000,true);f.mod.trackPacket(1,2,1,4500,4000,true);assert.equal(f.mod.targets.players[2].prevX[0],-1);assert.equal(f.packets.at(-1)[0],6);}finally{f.mod.dispose();}});
test('a ghoul with self numeric UID remains a distinct target',()=>{const f=fixture();try{f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('target','ghouls');f.mod.setSetting('mouseFovEnable',false);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(13,0,1,1100,1000,true);assert.equal(f.mod.aim.targetPlayer,f.mod.targets.ghouls[1]);assert.equal(f.packets.at(-1)[0],6);}finally{f.mod.dispose();}});
test('a live socket retains a stationary target through a manual shot, but not after receive traffic stops',()=>{const f=fixture({adaptive:true});try{
  const handlers={},socket={readyState:1,addEventListener(type,fn){handlers[type]=fn;},removeEventListener(){}};
  f.mod.observeSocket(socket);handlers.message();
  for(const[key,value]of Object.entries({AimBotEnabled:true,mouseFovEnable:false,lockId:2}))f.mod.setSetting(key,value);
  f.mod.trackPacket(1,1,1,1000,1000,true,0,0);f.mod.trackPacket(1,2,1,1300,1100,true,0,0);
  f.setClock(1450);handlers.message();f.mod.aim.refresh();assert.equal(f.mod.aim.targetPlayer?.id,2);
  assert.equal(f.mod.beforeFire(),true);assert.equal(f.mod.aim.targetPlayer?.id,2);
  f.setClock(2301);f.mod.aim.refresh();assert.equal(f.mod.aim.targetPlayer,null);
}finally{f.mod.dispose();}});
test('cursor selection uses the game canvas rectangle instead of raw viewport coordinates',()=>{const f=fixture({adaptive:true,dom:true});try{
  f.B.view=()=>({x:-800,y:-600,scale:1,ctx:f.dom.canvas.getContext('2d')});
  f.mod.setSetting('AimBotEnabled',true);f.mod.trackPacket(1,1,1,1000,1000,true,0,0);f.mod.trackPacket(1,2,1,1300,1100,true,0,0);
  for(const fn of f.listeners.get('mousemove'))fn({clientX:260,clientY:270});
  f.mod.step(1000);f.mod.aim.refresh();
  assert.equal(f.mod.targets.mouseMapCords.x,1300);assert.equal(f.mod.targets.mouseMapCords.y,1100);assert.equal(f.mod.aim.targetPlayer?.id,2);
}finally{f.mod.dispose();}});
