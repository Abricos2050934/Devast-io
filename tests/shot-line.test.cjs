// Exercise the same beforeFire -> native attack order as the patched native handler.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function setup(options={}){
 const f=fixture({fireKey:'nativeFire',...options});
 f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1200,true);
 f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);
 f.B.input={angle:-2};f.shoot=()=>{f.mod.beforeFire();f.network.nativeFire();};return f;
}
function direction(f){const l=f.mod.targets.lines[0];return (Math.round(Math.atan2(l.y2-l.y1,l.x2-l.x1)*180/Math.PI)+360)%360;}
function nativeAngle(f,angle=0,server=-1){
 const entity={angle,'ᴑ٧ߓ':server,'ᴎ٨ߍ':.2},op=JSON.parse(fs.readFileSync('patches/recovered-current.json')).operations.find(o=>o.id==='ilm-native-self-server-angle');
 vm.runInNewContext(op.after,{'ᅟ̗༣':entity,'ⲥ̡༤':'angle','ㅤ๘މ':f.B.input,'еϲ̇':'angle','ᴌߊ༡':{'ᴎ٨ߍ':(a,b,t)=>a+(b-a)*t},__responsiveMod:f.mod});return entity.angle;
}
test('first manual shot before any timer tick sends the ILM line direction before attack',()=>{
 const f=setup();try{
  f.shoot();assert.deepEqual(f.packets,[[6,direction(f)],[4]]);assert.equal(f.B.input.angle,-2);
  assert.equal(f.mod.aimRenderAngle,direction(f)*Math.PI/180);
 }finally{f.mod.dispose();}
});
test('native self rotation follows the actually sent direction despite a conflicting stale server angle',()=>{
 const f=setup();try{
  for(const [x,y]of [[1500,1200],[800,1300],[500,700],[1300,500]]){
   f.mod.trackPacket(1,2,1,x,y,true);f.mod.aim.refresh();
   assert.equal(nativeAngle(f,0,-1),direction(f)*Math.PI/180);
  }
  assert.equal(f.B.input.angle,-2);
 }finally{f.mod.dispose();}
});
test('a fresh burst after target movement recalculates with ILM and aligns before the attack',()=>{
 const f=setup();try{
  f.mod.aim.refresh();const prior=direction(f);f.mod.trackPacket(1,2,1,1400,1500,true);f.shoot();
  assert.notEqual(direction(f),prior);assert.deepEqual(f.packets.slice(-2),[[6,direction(f)],[4]]);
 }finally{f.mod.dispose();}
});
test('a first shot reasserts even a cached equal angle after native mouse direction changed',()=>{
 const f=setup();try{
  f.mod.aim.refresh();const angle=direction(f);f.network['ᴎᚂρ']('[6,180]');f.packets.length=0;
  f.shoot();assert.deepEqual(f.packets,[[6,angle],[4]]);
 }finally{f.mod.dispose();}
});
test('holding fire adds only one synchronization; subsequent directions remain on the 50 ms timer',()=>{
 const f=setup();try{
  f.setClock(0);f.shoot();const line=JSON.stringify(f.mod.targets.lines);f.mod.trackPacket(1,2,1,1400,1300,true);
  for(let i=1;i<=20;i++){f.setClock(i*5);f.shoot();}
  assert.equal(f.packets.filter(p=>p[0]===6).length,1);assert.equal(f.packets.filter(p=>p[0]===4).length,21);
  assert.equal(JSON.stringify(f.mod.targets.lines),line);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[0],6);
  f.setClock(300);f.packets.length=0;f.shoot();assert.deepEqual(f.packets,[[6,direction(f)],[4]]);
 }finally{f.mod.dispose();}
});
test('no target, disabled aim and disconnected sessions do not inject a direction or retain an aim render override',()=>{
 const f=setup();try{
  f.shoot();f.mod.setSetting('AimBotEnabled',false);f.packets.length=0;f.shoot();assert.deepEqual(f.packets,[[4]]);
  assert.equal(f.mod.aimRenderAngle,null);assert.equal(nativeAngle(f),-2);
  f.mod.setSetting('ShowRealAngles','always');assert.equal(nativeAngle(f),-.4);
  f.mod.setSetting('AimBotEnabled',true);f.network.state=0;f.packets.length=0;f.mod.beforeFire();assert.deepEqual(f.packets,[]);assert.equal(f.mod.aimRenderAngle,null);
  f.network.state=1;f.mod.setSetting('lockId',-1);f.mod.trackPacket(1,2,1,0,0,false);f.shoot();assert.deepEqual(f.packets,[[4]]);assert.equal(f.mod.aimRenderAngle,null);
 }finally{f.mod.dispose();}
});
test('dat.GUI toggle writes invalidate cached directions even though onChange observes the new object value',()=>{
 const f=setup({dom:true});try{
  f.mod.setSetting('AimBotEnabled',false);f.B.input.angle=0;const c=control(menu(f).__folders.Jitter,'JitterEnabled');
  c.setValue(true);f.setClock(0);f.mod.step(0);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0]]);
  c.setValue(false);f.network['ᴎᚂρ']('[6,90]');c.setValue(true);f.setClock(50);f.mod.step(50);f.mod.aim.refresh();
  assert.deepEqual(f.packets,[[6,0],[6,90],[6,0]]);
 }finally{f.mod.dispose();}
});
