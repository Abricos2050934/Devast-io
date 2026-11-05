// Real aim histories and the production socket adapter; no game server required.
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
function setup(autoFire=false){
 const f=fixture();f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.trackPacket(1,2,0,1500,1000,true);
 f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('lockId',2);f.mod.setSetting('autoFire',autoFire);
 f.socket={readyState:1,bufferedAmount:8192};f.mod.observeSocket(f.socket);return f;
}
for(const autoFire of [false,true])test('moving-target aim drops blocked cycles, with autoFire='+autoFire+', and resumes only the current state',()=>{
 const f=setup(autoFire);try{
  let computed=0,prior=null;
  for(let n=0;n<100;n++){
   f.setClock(n*50);f.mod.trackPacket(1,2,0,1500+(n%2)*100,1000+n*5,true);f.mod.aim.refresh();
   if(prior!==f.mod.aim.lastAngle)computed++;prior=f.mod.aim.lastAngle;
  }
  assert.ok(computed>80,'The blocked socket stopped aim calculation');
  assert.equal(f.packets.length,0,'Aim/autoFire added commands to an existing socket queue');
  assert.equal(f.mod.connectionInfo().automationTransport.deferred.aim,100);
  f.socket.bufferedAmount=0;f.setClock(5000);f.mod.aim.refresh();
  const angle=(Math.round(f.mod.aim.lastAngle)%360+360)%360;
  assert.deepEqual(f.packets,autoFire?[[6,angle],[4],[5]]:[[6,angle]],'Recovery replayed an obsolete aim/fire cycle');
  assert.equal(f.mod.diagnostics.commands,autoFire?3:1);
 }finally{f.mod.dispose();}
});
test('one admitted autoFire cycle retains direction, attack, release when its first packet creates a queue',()=>{
 const f=setup(true);try{
  for(const x of [1500,1600,1500])f.mod.trackPacket(1,2,0,x,1200,true);
  let reads=0;
  Object.defineProperty(f.socket,'bufferedAmount',{get(){reads++;return f.packets.length?128:0;}});
  f.mod.aim.refresh();
  assert.deepEqual(f.packets.map(p=>p[0]),[6,4,5],'Per-packet backpressure split an admitted attack/release cycle');
  assert.equal(reads,1,'Read queue readiness once per automatic cycle');
  f.mod.aim.refresh();assert.equal(f.packets.length,3,'Next cycle extended the newly queued batch');
 }finally{f.mod.dispose();}
});
test('manual shot alignment waits for a writable socket and the first resumed burst reasserts its direction',()=>{
 const f=setup();try{
  f.socket.bufferedAmount=0;f.setClock(0);f.mod.aim.refresh();
  f.socket.bufferedAmount=8192;f.setClock(10);f.mod.beforeFire();
  assert.equal(f.packets.length,1,'Shot alignment forced another angle into the blocked queue');
  f.mod.trackPacket(1,2,0,1300,1500,true);f.socket.bufferedAmount=0;f.setClock(20);f.mod.beforeFire();
  assert.equal(f.packets.length,2);assert.notEqual(f.packets[0][1],f.packets[1][1]);
  assert.equal(f.mod.aimRenderAngle,f.packets[1][1]*Math.PI/180);
 }finally{f.mod.dispose();}
});
test('closed and connecting sockets never receive aim/fire or forced shot-alignment packets',()=>{
 for(const readyState of [0,2,3]){
  const f=setup(true);try{
   f.socket.readyState=readyState;f.socket.bufferedAmount=0;
   f.mod.aim.refresh();f.mod.beforeFire();
   assert.equal(f.packets.length,0,'Unexpected send in socket state '+readyState);
  }finally{f.mod.dispose();}
 }
});
