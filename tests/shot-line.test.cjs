const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene,player}=require('./mod-fixture.cjs');
function setup(){
 const f=fixture({dom:true}),self=player(1,1000,1000);self['Іࡈ５']=1;
 f.B.types=[];f.B.types[1]={ilmWeaponTable:[{}, {ilmBulletSpeed:1.4},{ilmBulletSpeed:1.45}]};
 scene(f,1,[self,player(2,1500,1000)]);f.mod.step(0);f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);
 f.sample=(t,x,y)=>{f.setClock(t);f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.trackPacket(1,2,0,x,y,true);};
 // The patched native handler calls beforeFire before encoding its attack.
 f.shoot=()=>{f.mod.beforeFire();f.network['ᴎᚂρ']('[4]');};
 return {f,self};
}
function lineAngle(f){const p=f.mod.targets.lines[0];return (Math.round(Math.atan2(p.y2-p.y1,p.x2-p.x1)*180/Math.PI)+360)%360;}
test('first manual shot before any aim tick sends the line angle before attack, for both guns with Jitter off',()=>{
 for(const weapon of [1,2]){
  const {f,self}=setup();try{
   self['Іࡈ５']=weapon;f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);
   f.B.input={angle:-2};f.shoot();assert.deepEqual(f.packets,[[6,lineAngle(f)],[4]]);assert.equal(f.B.input.angle,-2);
  }finally{f.mod.dispose();}
 }
});
test('a fresh shot after target movement corrects the previous sent angle without waiting for the next timer tick',()=>{
 const {f}=setup();try{
  f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);f.mod.aim.refresh();const previous=f.packets.at(-1)[1];
  f.sample(300,1450,1200);f.packets.length=0;f.shoot();
  assert.notEqual(lineAngle(f),previous);assert.deepEqual(f.packets,[[6,lineAngle(f)],[4]]);
 }finally{f.mod.dispose();}
});
test('first-shot synchronization deduplicates an already matching angle, and holding fire adds no angle flood',()=>{
 const {f}=setup();try{
  f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);f.mod.aim.refresh();f.packets.length=0;
  f.shoot();assert.deepEqual(f.packets,[[4]]);
  for(let i=1;i<=20;i++){f.setClock(200+i*5);f.shoot();}
  assert.equal(f.packets.length,21);assert.ok(f.packets.every(p=>p[0]===4));
  f.sample(350,1500,1140);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[0],6);assert.equal(f.timerPeriods.values().next().value,50);
 }finally{f.mod.dispose();}
});
test('disabled aim and disconnected sessions do not inject a manual-shot direction',()=>{
 const {f}=setup();try{
  f.sample(0,1500,1000);f.mod.setSetting('AimBotEnabled',false);f.shoot();assert.deepEqual(f.packets,[[4]]);
  f.mod.setSetting('AimBotEnabled',true);f.network.state=0;f.packets.length=0;f.mod.beforeFire();assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('switching aim off and on between frames invalidates the old direction before a fresh shot',()=>{
 const {f}=setup();try{
  f.sample(0,1500,1000);f.shoot();f.packets.length=0;
  f.mod.setSetting('AimBotEnabled',false);f.B.input={angle:Math.PI};f.mod.setSetting('AimBotEnabled',true);
  f.shoot();assert.deepEqual(f.packets,[[6,lineAngle(f)],[4]]);
 }finally{f.mod.dispose();}
});
