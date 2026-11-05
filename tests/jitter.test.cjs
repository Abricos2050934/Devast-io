const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function spin(f,at){f.setClock(at);for(const [id,fn]of f.timers)if(f.timerPeriods.get(id)===50)fn();}
test('independent Jitter retains speed, native input and bounded direction cadence while standing or moving',()=>{
 const f=fixture({dom:true});try{
  f.B.input={angle:.5,x:42,y:51};const before=JSON.stringify(f.B.input),gui=menu(f);
  control(gui.__folders.Jitter,'JitterSpeed').setValue(360);control(gui.__folders.Jitter,'JitterEnabled').setValue(true);
  spin(f,0);const first=f.packets.at(-1)[1];spin(f,250);assert.equal((f.packets.at(-1)[1]-first+360)%360,90);
  f.mod.onMove(9);spin(f,500);assert.equal((f.packets.at(-1)[1]-first+360)%360,180);
  assert.equal(JSON.stringify(f.B.input),before);assert.ok(f.packets.every(p=>p[0]===6));
  f.mod.setSetting('JitterEnabled',false);const count=f.packets.length;spin(f,750);assert.equal(f.packets.length,count);
 }finally{f.mod.dispose();}
});
test('J stays bound to independent rotation; imported Jitter stays controlled by its menu',()=>{
 const f=fixture({dom:true});try{
  const gui=menu(f),dispatch=(code,target={tagName:'CANVAS'})=>{for(const fn of f.listeners.get('keydown'))fn({code,target});};
  assert.equal(f.mod.settings.JitterKey,'KeyJ');dispatch('KeyJ');assert.equal(f.mod.settings.JitterEnabled,true);assert.equal(f.mod.settings.jitterActive,false);
  dispatch('KeyJ',{tagName:'INPUT'});assert.equal(f.mod.settings.JitterEnabled,true);
  control(gui.__folders['Best Aim Bot #1'],'jitterActive').setValue(true);assert.equal(f.mod.settings.jitterActive,true);
  dispatch('KeyJ');assert.equal(f.mod.settings.JitterEnabled,false);assert.equal(f.mod.settings.jitterActive,true);
 }finally{f.mod.dispose();}
});
test('independent rotation pauses during fire and socket backlog without replaying stale directions',()=>{
 const f=fixture();try{
  f.mod.setSetting('JitterEnabled',true);f.mod.setSetting('JitterSpeed',360);const socket={readyState:1,bufferedAmount:8192};f.mod.observeSocket(socket);
  for(let at=0;at<=1000;at+=50)spin(f,at);assert.equal(f.packets.length,0);
  socket.bufferedAmount=0;spin(f,1050);assert.equal(f.packets.length,1);
  f.mod.aim.mouseDown=true;spin(f,1100);assert.equal(f.packets.length,1);
  f.mod.aim.mouseDown=false;spin(f,1300);assert.equal(f.packets.length,2);
  f.network.state=64;spin(f,1400);assert.equal(f.packets.length,2);
 }finally{f.mod.dispose();}
});
