const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {fixture,scene,player,menu,control}=require('./mod-fixture.cjs');
function setup(){
 const f=fixture({dom:true}),self=player(1,1000,1000);self['Іࡈ５']=1;
 f.B.types=[];f.B.types[1]={ilmWeaponTable:[{}, {ilmBulletSpeed:1.4},{ilmBulletSpeed:1.45}]};
 scene(f,1,[self,player(2,1500,1000)]);f.mod.step(0);
 f.sample=(time,y)=>{f.setClock(time);f.mod.trackPacket(1,1,0,1000,1000,true);f.mod.trackPacket(1,2,0,1500,y,true);};
 for(const [t,y]of [[0,1000],[100,1030],[225,1060],[330,1090]])f.sample(t,y);
 f.mod.targets.mouseMapCords={x:1500,y:1090};
 return {f,self};
}
test('all four preset buttons apply and persist the calibrated values without sending commands or changing other features',()=>{
 const {f}=setup();try{
  f.mod.setSetting('zoomFactor',.8);f.mod.setSetting('RightClickDoors',true);f.mod.setSetting('autoFire',true);
  const folder=menu(f).__folders['Aim Bot'].__folders['Weapon presets'];
  const report=JSON.parse(fs.readFileSync('verification/aim-calibration-2026-11-03.json'));
  assert.equal(folder.__controllers.length,4);
  for(const key of Object.keys(report.groups)){
   const c=control(folder,key);c.object[key]();
   const saved=JSON.parse(f.storage.get('DevastILM:settings:v3'));
   for(const name of ['distanceCoefficient','bulletSpeedCoefficient','offsetCoefficient','resolverType'])assert.equal(saved[name],report.groups[key].settings[name]);
   assert.equal(saved.ImprovedAimEnabled,true);assert.equal(saved.mouseFovEnable,true);assert.equal(saved.mouseFov,key.endsWith('close')?250:450);
   assert.equal(saved.zoomFactor,.8);assert.equal(saved.RightClickDoors,true);assert.equal(saved.autoFire,true);
  }
  assert.equal(f.packets.length,0);assert.throws(()=>f.mod.applyAimPreset('toString'),/Unknown aim preset/);
  const restored=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(restored.mod.settings.resolverType,f.mod.settings.resolverType);}finally{restored.mod.dispose();}
 }finally{f.mod.dispose();}
});
test('both velocity models change the selected moving-target prediction in classic and enhanced modes',()=>{
 const {f}=setup();try{
  f.mod.setSetting('lockId',2);f.mod.setSetting('distanceCoefficient',100);
  for(const enhanced of [false,true]){
   f.mod.setSetting('ImprovedAimEnabled',enhanced);f.mod.setSetting('resolverType','linear');const linear=f.mod.aim.resolve();
   f.mod.setSetting('resolverType','smoothed');const smoothed=f.mod.aim.resolve();assert.notEqual(smoothed,linear,'Velocity model must affect timed, uneven packet samples');
  }
  assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('each preset uses the equipped gun speed immediately and retains the 50 ms transport cadence',()=>{
 const {f,self}=setup();try{
  f.mod.setSetting('AimBotEnabled',true);
  for(const key of ['ak47_close','ak47_far','laser_close','laser_far']){
   f.mod.applyAimPreset(key);self['Іࡈ５']=1;f.mod.aim.refresh();const ak=f.mod.aim.lastAngle;
   self['Іࡈ５']=2;f.mod.aim.refresh();const laser=f.mod.aim.lastAngle;assert.ok(laser<ak,'Faster native projectile must require less unrounded lead');
  }
  assert.equal(f.packets.length,8);assert.ok(f.packets.every(p=>p[0]===6&&Number.isInteger(p[1])&&p[1]>=0&&p[1]<360));
  assert.equal(f.timerPeriods.values().next().value,50);
 }finally{f.mod.dispose();}
});
test('all expanded aim GUI values are validated, including invalid choices and colors',()=>{
 const {f}=setup();try{
  const folder=menu(f).__folders['Aim Bot'];
  for(const key of ['AimBotEnabled','autoFire','mouseFovEnable','mouseFov','lockId','resolverType','visualizeResolving','visualizeResolvingColor'])assert.ok(control(folder,key));
  assert.throws(()=>f.mod.setSetting('visualizeResolvingColor','invalid'),/Invalid line color/);
  assert.throws(()=>f.mod.setSetting('resolverType','ignored'),/Invalid choice/);
  assert.throws(()=>f.mod.setSetting('bulletSpeedCoefficient',0),/out of range/);
 }finally{f.mod.dispose();}
});
