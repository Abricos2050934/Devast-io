const test=require('node:test'),assert=require('node:assert/strict'),{fixture,menu}=require('./mod-fixture.cjs'),{audit,reference}=require('../tools/audit_ilm_port.cjs'),{verifyIlmAim}=require('../tools/verify_ilm_aim.cjs');
test('complete original ILM declarations, menu and render survive verbatim with no other predictor',()=>{const r=audit();assert.equal(r.classes,4);assert.equal(r.methods_including_constructors,13);assert.equal(r.additional_predictors,0);const f=fixture({dom:true});try{const gui=menu(f);assert.equal(gui.__folders['Aim Bot'].__controllers.length,5);assert.equal(gui.__folders.Aimbot,undefined);assert.equal(f.mod.settings.AimbotKey,'Space');assert.equal(f.mod.settings.distanceCoefficient,300);assert.equal(f.mod.settings.spinActive,undefined);assert.equal(f.mod.aim.packetAngle,undefined);}finally{f.mod.dispose();}});
test('installed ILM states and admitted packet cycles match the independent uploaded declarations',()=>{const f=fixture(),s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','ﾠࡅ‍','а༤̘','ոᚄރ','ᴌ̗ⲟ'].map(k=>[k,k]));try{const r=verifyIlmAim(f.mod,{...f.B,playerType:1,capturePackets:()=>({packets:f.packets,restore(){}})},s,reference());assert.ok(r.comparison_points>=2000);assert.equal(r.whole_auto_fire_cycle,true);}finally{f.mod.dispose();}});
test('ILM uses only its 50 ms timer; incoming packets do not run a replacement predictor',()=>{const f=fixture();try{f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('mouseFovEnable',false);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1000,true);assert.equal(f.packets.length,0);for(const[id,fn]of f.timers)if(f.timerPeriods.get(id)===50)fn();assert.deepEqual(f.packets,[[6,0]]);f.packets.length=0;f.mod.trackPacket(1,2,1,1500,1100,true);assert.equal(f.packets.length,0);assert.equal(f.mod.aim.lastAngle,0);f.mod.aim.refresh();assert.notEqual(f.mod.aim.lastAngle,0);}finally{f.mod.dispose();}assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);});
test('old Untitled and Message15 settings cannot silently replace original ILM defaults',()=>{const f=fixture({saved:{'DevastUntitledV4:aim:v1':JSON.stringify({AimBotEnabled:true,distanceCoefficient:999}), 'DevastMessage15:aim:v1':JSON.stringify({distanceCoefficient:100})}});try{assert.equal(f.mod.settings.distanceCoefficient,300);assert.equal(f.mod.settings.AimBotEnabled,false);assert.throws(()=>f.mod.setSetting('spinActive',true));}finally{f.mod.dispose();}});
test('installed aim controls match the uploaded menu order, labels, options and numeric ranges without extra controls',()=>{
 const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm'),{GUI}=require('./dom-fixture.cjs').domFixture();
 const original=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-menu-reference.json.gz'))).blocks.find(b=>b.name==='menu').source;
 const sourceRoot=new GUI();vm.runInNewContext(original,{_0x2a1bff:sourceRoot,_0x2ea565:{}});
 const describe=folder=>JSON.parse(JSON.stringify(folder.__controllers.map(c=>({property:c.property,label:c.label,range:c.range}))));
 const f=fixture({dom:true});try{
  const gui=menu(f),expected=describe(sourceRoot.__folders['Aim Bot']);
  assert.deepEqual(describe(gui.__folders['Aim Bot']),expected);
  assert.equal(gui.__folders['ILM controls'],undefined);
  const aimProperties=new Set(Object.keys(f.mod.settings).filter(k=>['AimBotEnabled','autoFire','mouseFovEnable','mouseFov','lockId','visualizeResolving','visualizeResolvingColor'].includes(k)));
  for(const[name,folder]of Object.entries(gui.__folders))if(name!=='Aim Bot')assert.equal(folder.__controllers.some(c=>aimProperties.has(c.property)),false,name);
 }finally{f.mod.dispose();}
});
test('the unused original color setting cannot change the ILM prediction line at startup or through settings',()=>{
 const f=fixture({saved:{'DevastILMOriginal:aim:v1':JSON.stringify({visualizeResolvingColor:'#abcdef'})}});
 try{assert.equal(f.mod.targets.lines[0].color,'#EEEEEE');f.mod.setSetting('visualizeResolvingColor','#123456');assert.equal(f.mod.targets.lines[0].color,'#EEEEEE');}finally{f.mod.dispose();}
});
