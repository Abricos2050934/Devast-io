const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu}=require('./mod-fixture.cjs');
const SAVE='DevastILM:settings:v3';
test('retired aim algorithms, presets and settings are absent from the installed mod',()=>{
 const f=fixture({dom:true});try{
  assert.equal(f.mod.settings.resolverType,'linear');assert.equal(Object.hasOwn(f.mod.settings,'ImprovedAimEnabled'),false);
  assert.equal(f.context.__createAdaptiveAim,undefined);assert.equal(f.context.__aimWeaponPresets,undefined);assert.equal(f.mod.applyAimPreset,undefined);
  assert.throws(()=>f.mod.setSetting('ImprovedAimEnabled',true),/Invalid setting/);
  assert.equal(menu(f).__folders['Aim Bot'].__controllers.length,5);assert.deepEqual(Object.keys(menu(f).__folders['Aim Bot'].__folders),[]);
 }finally{f.mod.dispose();}
});
test('old predictor settings reset to original ILM once, preserving other features, loot and identity',()=>{
 const prior={ImprovedAimEnabled:true,AimBotEnabled:true,AimbotKey:'KeyZ',resolverType:'smoothed',distanceCoefficient:330,bulletSpeedCoefficient:8,offsetCoefficient:1.6,mouseFov:450,zoomFactor:.8,JitterEnabled:true,JitterSpeed:720,JitterKey:'KeyJ',RightClickDoors:false,ShowWires:false};
 const f=fixture({saved:{[SAVE]:JSON.stringify(prior),[SAVE+':ilm2']:'1',[SAVE+':loot']:JSON.stringify({steel:false}),token:'keep-token',tokenId:'keep-id',userId:'keep-user',accountToken:'keep-account'}});
 try{
  for(const [key,value]of Object.entries({AimBotEnabled:false,AimbotKey:'Space',resolverType:'linear',distanceCoefficient:300,bulletSpeedCoefficient:4,offsetCoefficient:.1,mouseFov:12345}))assert.equal(f.mod.settings[key],value,key);
  for(const key of ['zoomFactor','JitterEnabled','JitterSpeed','JitterKey','RightClickDoors','ShowWires'])assert.equal(f.mod.settings[key],prior[key]);
  for(const [key,value]of [['token','keep-token'],['tokenId','keep-id'],['userId','keep-user'],['accountToken','keep-account']])assert.equal(f.storage.get(key),value);
  assert.equal(f.mod.loot.steel.acquire,false);assert.equal(JSON.parse(f.storage.get(SAVE+':aim-before-original-v1')).distanceCoefficient,330);
  assert.equal(Object.hasOwn(JSON.parse(f.storage.get(SAVE)),'ImprovedAimEnabled'),false);assert.equal(f.packets.length,0);
  f.mod.setSetting('distanceCoefficient',570);f.mod.setSetting('offsetCoefficient',1.3);
  const again=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(again.mod.settings.distanceCoefficient,570);assert.equal(again.mod.settings.offsetCoefficient,1.3);}finally{again.mod.dispose();}
 }finally{f.mod.dispose();}
});
test('weapon data and elapsed time cannot alter original ILM prediction',()=>{
 const f=fixture();try{
  f.mod.trackPacket(1,1,1,1000,1000,true);
  for(const y of [1000,1040,1080])f.mod.trackPacket(1,2,1,1500,y,true);
  f.mod.setSetting('lockId',2);const expected=f.mod.aim.resolve(),line=JSON.stringify(f.mod.targets.lines);
  Object.defineProperty(f.B,'types',{get(){throw Error('ILM must not consult weapon speeds');}});
  for(const time of [0,50,1000,10000]){f.setClock(time);assert.equal(f.mod.aim.resolve(),expected);assert.equal(JSON.stringify(f.mod.targets.lines),line);}
 }finally{f.mod.dispose();}
});
