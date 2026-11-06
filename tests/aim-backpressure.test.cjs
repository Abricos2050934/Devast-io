const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
function setup(){const f=fixture();for(const [k,v]of Object.entries({AimBotEnabled:true,autoFire:true,lockId:2,mouseFovEnable:false}))f.mod.setSetting(k,v);f.socket={readyState:1,bufferedAmount:8192};f.mod.observeSocket(f.socket);f.mod.trackPacket(1,1,1,1000,1000,true);for(const x of [1500,1600,1500])f.mod.trackPacket(1,2,1,x,1200,true);return f;}
test('source refresh and packet-triggered refresh discard blocked cycles and resume the current cycle',()=>{
 const f=setup();try{for(let i=0;i<100;i++){f.setClock(1000+i*50);f.mod.trackPacket(1,2,1,1500+(i%2)*100,1200+i,true);f.mod.aim.refresh();}assert.equal(f.packets.length,0);assert.ok(f.mod.connectionInfo().automationTransport.deferred.aim>=100);f.socket.bufferedAmount=0;f.mod.aim.refresh();assert.deepEqual(f.packets.map(p=>p[0]),[6,4,5]);}finally{f.mod.dispose();}
});
test('one source autoFire cycle keeps its direction, attack and release when the first send creates a queue',()=>{
 const f=setup();try{let reads=0;Object.defineProperty(f.socket,'bufferedAmount',{get(){reads++;return f.packets.length?4096:0;}});f.mod.aim.refresh();assert.deepEqual(f.packets.map(p=>p[0]),[6,4,5]);assert.equal(reads,1);f.mod.aim.refresh();assert.equal(f.packets.length,3);}finally{f.mod.dispose();}
});
test('ordinary queued native bytes retain source cycles, while the high-water boundary pauses new cycles',()=>{
 const f=setup();try{
  assert.equal(f.mod.connectionInfo().automationTransport.aimHighWaterBytes,4096);
  for(const bytes of [1,16,128,1024,4095]){f.socket.bufferedAmount=bytes;f.packets.length=0;f.mod.aim.refresh();assert.deepEqual(f.packets.map(p=>p[0]),[6,4,5],'Fresh source cycle lost at '+bytes+' buffered bytes');}
  f.socket.bufferedAmount=4096;f.packets.length=0;f.mod.aim.refresh();assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('source callbacks and native idle rotation do not send after server death or on closed sockets',()=>{
 const f=setup();try{f.socket.bufferedAmount=0;for(const readyState of [0,2,3]){f.socket.readyState=readyState;f.mod.aim.refresh();f.mod.afterFire();f.mod.afterRelease();assert.equal(f.packets.length,0);}f.socket.readyState=1;f.mod.observeDeath([5,0,2]);f.mod.aim.refresh();f.mod.afterFire();f.mod.afterRelease();assert.equal(f.packets.length,0);}finally{f.mod.dispose();}
});
