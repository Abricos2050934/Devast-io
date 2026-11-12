const test=require('node:test'),assert=require('node:assert/strict'),{fixture,scene}=require('./mod-fixture.cjs');
const drops=()=>Array.from({length:100},(_,i)=>({id:10+i,x:10,y:0,'е̝ހ':0,'Іࡈ５':6}));
test('fast loot caps a dense high-FPS scene, rotates fairly, and never replays delayed cycles',()=>{
 const f=fixture();try{f.B.synchronizedRender=true;scene(f,2,drops());f.mod.setSetting('FAutoLootEnabled',true);
  let before=0;for(let frame=0;frame<306;frame++){const now=frame*1000/153;f.setClock(now);f.mod.render(now);assert.ok(f.packets.length-before<=8);before=f.packets.length;}
  assert.ok(f.packets.length<=640);assert.equal(new Set(f.packets.map(p=>p[1])).size,100);
  before=f.packets.length;f.setClock(30000);f.mod.render(30000);assert.equal(f.packets.length-before,8);f.mod.render(30001);assert.equal(f.packets.length-before,8);
  f.mod.observeSocket({readyState:1,bufferedAmount:100});f.mod.render(31000);assert.equal(f.packets.length-before,8);
  f.mod.observeSocket({readyState:1,bufferedAmount:0});f.setClock(32000);f.mod.render(32000);assert.equal(f.packets.length-before,16);
 }finally{f.mod.dispose();}
});
test('session report retains earlier aim activity after the two-second combat window and redacts payloads',()=>{
 const f=fixture({saved:{token:'private-account-token'}});try{
  f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1000,true);f.mod.setSetting('mouseFovEnable',false);
  f.setClock(2000);f.mod.setSetting('AimBotEnabled',true);(f.mod.aimModule.refreshTargets(),f.mod.aim.refresh());f.setClock(3000);f.mod.setSetting('AimBotEnabled',false);
  f.setClock(1200000);f.mod.observeDeath(new Uint8Array([5,0,1]));const r=f.mod.connectionInfo();
  assert.equal(r.combatNow.angle,0);assert.ok(r.modTraffic.seconds.some(b=>b.byOpcode[6]));assert.ok(r.modTraffic.settingsChanges.some(e=>e.settings.AimBotEnabled));
  assert.equal(r.modTraffic.settingsChanges.at(-1).settings.AimBotEnabled,false);assert.ok(!JSON.stringify(r).includes('private-account-token'));
  r.modTraffic.seconds[0].byOpcode[6]=999;r.modTraffic.settingsChanges[0].settings.AimBotEnabled=42;
  const fresh=f.mod.connectionInfo();assert.notEqual(fresh.modTraffic.seconds[0].byOpcode[6],999);assert.notEqual(fresh.modTraffic.settingsChanges[0].settings.AimBotEnabled,42);
 }finally{f.mod.dispose();}
});
test('traffic retention stays bounded over forty minutes and idle reads expire old buckets',()=>{
 const f=fixture();try{scene(f,2,[drops()[0]]);f.mod.setSetting('FAutoLootEnabled',true);
  for(let second=1;second<=2400;second++){f.setClock(second*1000);f.mod.render(second*1000);}
  let r=f.mod.connectionInfo();assert.equal(r.modTraffic.seconds.length,1800);assert.equal(r.modTraffic.seconds.at(-1).at,2400000);assert.equal(r.modTraffic.seconds[0].at,601000);
  f.mod.setSetting('FAutoLootEnabled',false);f.setClock(4200001);r=f.mod.connectionInfo();assert.equal(r.modTraffic.seconds.length,0);assert.equal(r.modTraffic.lifetimePeak.commands,1);
 }finally{f.mod.dispose();}
});

test('automated chat contributes opcode counts without recording message contents or rejected sends',()=>{
 const f=fixture();try{const text='private-chat-message';let result=1000;f.network['іߐ̸']=()=>result;
  f.mod.setSetting('SpamChatText',text);f.mod.setSetting('SpamChatEnabled',true);f.setClock(1000);f.mod.step(1000);
  assert.equal(f.mod.connectionInfo().modCommandsByOpcode[1],undefined);
  result=0;f.setClock(3000);f.mod.step(3000);f.setClock(8000);f.mod.step(8000);
  const r=f.mod.connectionInfo();assert.equal(r.modCommandsByOpcode[1],2);assert.equal(r.modTraffic.seconds.reduce((n,b)=>n+(b.byOpcode[1]||0),0),2);assert.ok(!JSON.stringify(r).includes(text));
 }finally{f.mod.dispose();}
});
