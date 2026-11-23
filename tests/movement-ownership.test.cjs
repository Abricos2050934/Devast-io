const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');

function strafe(f,physical=0){
 f.mod.onMove(physical);
 f.mod.setSetting('AntiAimbot',true);
 f.mod.aimModule.antiTick();
 assert.ok(f.packets.some(packet=>packet[0]===2));
 f.packets.length=0;
}
for(const physical of [0,1,5,10])test('disabling strafe restores physical movement '+physical+' exactly once',()=>{
 const f=fixture();
 try{
  strafe(f,physical);f.mod.setSetting('AntiAimbot',false);
  assert.deepEqual(f.packets,[[2,physical]]);
  f.mod.setSetting('AntiAimbot',false);f.mod.step(2000);assert.equal(f.packets.length,1);
 }finally{f.mod.dispose();}
});
test('native movement supersedes strafe and needs no extra restoration packet',()=>{
 const f=fixture();
 try{
  strafe(f,1);f.mod.onMove(4);f.mod.setSetting('AntiAimbot',false);
  assert.deepEqual(f.packets,[]);
 }finally{f.mod.dispose();}
});
test('direct setting reset restores movement on the next step without repeating it',()=>{
 const f=fixture();
 try{
  strafe(f,5);f.mod.settings.AntiAimbot=false;f.mod.step(2000);f.mod.step(3000);
  assert.deepEqual(f.packets,[[2,5]]);
 }finally{f.mod.dispose();}
});
test('disposal releases owned movement while retaining ordinary native firing',()=>{
 const f=fixture();
 strafe(f,0);f.mod.dispose();
 assert.deepEqual(f.packets,[[2,0]]);assert.equal(f.mod.beforeFire(),true);
 f.mod.dispose();assert.equal(f.packets.length,1);assert.equal(f.timers.size,0);
});
test('disabling unused strafe produces no movement command',()=>{
 const f=fixture();
 try{f.mod.setSetting('AntiAimbot',true);f.mod.setSetting('AntiAimbot',false);assert.deepEqual(f.packets,[]);}finally{f.mod.dispose();}
});
test('death and a replaced socket cannot restore an earlier session movement',()=>{
 for(const end of ['death','replacement']){
  const f=fixture();
  try{
   strafe(f,5);
   if(end==='death')f.mod.observeDeath();else f.mod.observeSocket({readyState:1,bufferedAmount:0});
   f.mod.setSetting('AntiAimbot',false);assert.deepEqual(f.packets,[],end);
  }finally{f.mod.dispose();}
 }
});
for(const readyState of [0,2,3])test('restoration skips non-open socket '+readyState,()=>{
 const f=fixture();
 try{
  const socket={readyState:1,bufferedAmount:0};f.mod.observeSocket(socket);strafe(f,5);socket.readyState=readyState;
  f.mod.setSetting('AntiAimbot',false);assert.deepEqual(f.packets,[]);
 }finally{f.mod.dispose();}
});
test('GUI toggle restores movement even though the controller already wrote false',()=>{
 const {menu,control}=require('./mod-fixture.cjs'),f=fixture({dom:true});
 try{
  const gui=menu(f);strafe(f,5);control(gui.__folders['Anti-Aim / Strafe'],'AntiAimbot').setValue(false);
  assert.deepEqual(f.packets,[[2,5]]);
 }finally{f.mod.dispose();}
});
test('reobserving the same socket retains owned movement until the toggle is disabled',()=>{
 const f=fixture();
 try{
  const socket={readyState:1,bufferedAmount:0};f.mod.observeSocket(socket);strafe(f,5);f.mod.observeSocket(socket);
  f.mod.setSetting('AntiAimbot',false);assert.deepEqual(f.packets,[[2,5]]);
 }finally{f.mod.dispose();}
});
test('invalid physical masks restore a valid stationary command',()=>{
 const f=fixture();
 try{strafe(f,3.5);f.mod.setSetting('AntiAimbot',false);assert.deepEqual(f.packets,[[2,0]]);}finally{f.mod.dispose();}
});
