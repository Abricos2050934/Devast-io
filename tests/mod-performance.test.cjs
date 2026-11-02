const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene,player,menu}=require('./mod-fixture.cjs');
test('removed HUD text and AIM BOT label cannot return from old saved settings',()=>{
 const f=fixture({dom:true,saved:{BestModMenuConfig:JSON.stringify({ShowGauges:true}), 'BestModMenuConfig:ilm2':'1'}});
 scene(f,1,[player(1),player(2,100,100)]);f.mod.setSetting('AimBotEnabled',true);f.mod.step(0);
 assert.equal(Object.hasOwn(f.mod.settings,'ShowGauges'),false);
 assert.ok(!menu(f).__folders.Visuals.__controllers.some(c=>c.property==='ShowGauges'));
 assert.ok(!f.dom.calls.some(c=>['fillText','strokeText'].includes(c.name)&&(/HP:|Food:|Stamina:|Water:|Warmth:|AIM BOT/.test(String(c.args[0])))));
 f.mod.dispose();
});
test('a dense aim scan reads self once and uses no linear clan lookup, while metadata changes apply on the next resolve',()=>{
 const f=fixture();for(let i=1;i<=120;i++){f.world['ᴎ︃ᄉ'][i]={'а༤̘':-1};f.mod.trackPacket(1,i,0,i*100,i*50,true);}
 let reads=0;const self=f.world['ᅠᏧ‍'];Object.defineProperty(f.world,'ᅠᏧ‍',{get(){reads++;return self;}});
 f.world['ﾠࡅ‍'].indexOf=()=>{throw Error('Linear clan lookup');};f.mod.setSetting('mouseFovEnable',false);
 f.mod.aim.resolve();assert.equal(reads,1);assert.equal(f.mod.aim.targetPlayer.id,2);
 f.world['ﾠࡅ‍'][0]={'ոᚄރ':7};for(const id of [1,2])Object.assign(f.world['ᴎ︃ᄉ'][id],{'а༤̘':0,'ᴌ̗ⲟ':7});
 f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,3);
 f.world['ᴎ︃ᄉ'][2]['ᴌ̗ⲟ']=6;f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);f.mod.dispose();
});
test('ILM angle mode renders only its four original lines in a dense scene',()=>{
 const f=fixture({dom:true});scene(f,1,Array.from({length:120},(_,i)=>player(i+1,i*20,i*30)));
 for(let i=1;i<=120;i++)f.world['ᴎ︃ᄉ'][i]={'а༤̘':-1};
 f.mod.setSetting('visualizeResolving',false);f.mod.setSetting('AimBotEnabled',true);f.mod.step(0);
 assert.equal(f.dom.calls.filter(c=>c.name==='lineTo').length,4);f.mod.dispose();
});
test('dense metadata slots preserve extended player IDs, ghoul UIDs and fresh clan membership',()=>{
 const f=fixture();try{
  f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2048,1,200,200,true);
  f.mod.trackPacket(13,0,998,100,100,true);f.mod.setSetting('target','all');f.mod.setSetting('mouseFovEnable',false);
  f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer,f.mod.targets.ghouls[998]);
  f.world['ﾠࡅ‍'][0]={'ոᚄރ':7};
  for(const id of [1,998])f.world['ᴎ︃ᄉ'][id]={'а༤̘':0,'ᴌ̗ⲟ':7};
  f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer,f.mod.targets.players[2048]);
  f.world['ᴎ︃ᄉ'][998]['ᴌ̗ⲟ']=6;f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer,f.mod.targets.ghouls[998]);
 }finally{f.mod.dispose();}
});
test('building owner labels read cursor layout once per frame even with hundreds of buildings',()=>{
 const f=fixture({dom:true});try{
  f.B.items[0]={'ࡀ︂̄':7};f.world['ᴎ︃ᄉ'][2]['ο̏︇']='Owner';
  scene(f,3,Array.from({length:200},(_,i)=>({id:i,x:100+i,y:100,'е̝ހ':0,'Іࡈ５':0,'αބ̞':i===0?-1:i,'ᴀܛ٤':-1,'ᴘ४１':i===0?2:3})));
  let reads=0;const rect=f.dom.canvas.getBoundingClientRect;
  f.dom.canvas.getBoundingClientRect=()=>{reads++;return rect();};
  f.mod.step(0);assert.ok(reads<=3,'Layout was read '+reads+' times');
  assert.ok(f.dom.calls.some(c=>c.name==='fillText'&&c.args[0]==='Owner #2'));
  // A changed canvas position must be picked up on the very next frame.
  reads=0;f.dom.calls.length=0;f.dom.canvas.getBoundingClientRect=()=>{reads++;return {...rect(),left:-200};};
  f.mod.step(20);assert.ok(reads<=3);assert.ok(!f.dom.calls.some(c=>c.name==='fillText'&&c.args[0]==='Owner #2'));
 }finally{f.mod.dispose();}
});
test('frame entity collection reuses records while preserving removal, replacement and pooled type changes',()=>{
 const f=fixture();try{
  const first={x:10,y:20,'е̝ހ':0},second={x:30,y:40,'е̝ހ':0};scene(f,3,[first,second]);f.mod.step(0);
  const records=f.mod.records,a=records[0],b=records[1];f.mod.step(20);assert.equal(f.mod.records,records);assert.equal(records[0],a);assert.equal(records[1],b);
  second['е̝ހ']=1;f.mod.step(40);assert.equal(records.length,1);assert.equal(records[0],a);
  scene(f,3,[]);scene(f,4,[first]);f.mod.step(60);assert.equal(records[0],a);assert.equal(records[0].type,4);
  const replacement={x:50,y:60,'е̝ހ':0};scene(f,4,[replacement]);f.mod.step(80);assert.notEqual(records[0],a);assert.equal(records[0].e.x,replacement.x);assert.equal(records[0].e.y,replacement.y);
  f.network.state=0;f.mod.step(100);assert.equal(records.length,0);
 }finally{f.mod.dispose();}
});
test('movement report separates browser frame timing from automation traffic and ignores hidden-tab gaps',()=>{
 const f=fixture();try{
  const tick=f.frames.values().next().value;for(let i=0;i<=130;i++)tick(i*20);
  let report=f.mod.connectionInfo();assert.equal(report.animationTiming.samples,120);assert.equal(report.animationTiming.fpsEstimate,50);assert.equal(report.animationTiming.p95GapMs,20);
  f.document.hidden=true;tick(5000);f.document.hidden=false;tick(10000);tick(10020);assert.equal(f.mod.connectionInfo().animationTiming.fpsEstimate,50);
  f.mod.setSetting('AutoBuiledEnabled',true);f.mod.step(10040);report=f.mod.connectionInfo();assert.equal(report.automationSettings.autoBuild,true);assert.ok(report.modCommandsByOpcode[14]>0);
  report.modCommandsByOpcode[14]=99999;assert.notEqual(f.mod.connectionInfo().modCommandsByOpcode[14],99999);
 }finally{f.mod.dispose();}
});
test('owner overlay resolves item metadata only for the hovered tile, while preserving the label',()=>{
 const f=fixture({dom:true});try{
  let reads=0;Object.defineProperty(f.B.items,0,{get(){reads++;return {'ࡀ︂̄':7};}});f.world['ᴎ︃ᄉ'][2]['ο̏︇']='Owner';
  scene(f,3,Array.from({length:1000},(_,i)=>({id:i,x:100+i,y:100,'е̝ހ':0,'Іࡈ５':0,'αބ̞':i===0?-1:i,'ᴀܛ٤':-1,'ᴘ४１':2})));
  f.mod.step(0);assert.equal(reads,1);assert.ok(f.dom.calls.some(c=>c.name==='fillText'&&c.args[0]==='Owner #2'));
  reads=0;f.mod.setSetting('ShowBuildingOwner',false);f.mod.step(20);assert.equal(reads,0);
 }finally{f.mod.dispose();}
});
test('status HUD avoids rewriting unchanged layout styles but responds to resizing',()=>{
 const f=fixture({dom:true});try{
  f.mod.step(0);const styles=f.mod.functionList.style;let writes=0;f.mod.functionList.style=new Proxy(styles,{set(target,key,value){writes++;target[key]=value;return true;}});
  for(let t=20;t<=200;t+=20)f.mod.step(t);assert.equal(writes,0);
  const rect=f.dom.canvas.getBoundingClientRect;f.dom.canvas.getBoundingClientRect=()=>({...rect(),height:80});f.mod.step(220);assert.ok(writes>0);assert.equal(f.mod.functionList.style.fontSize,'13px');
 }finally{f.mod.dispose();}
});
test('loot without building tile coordinates does not add owner-overlay layout reads',()=>{
 const f=fixture({dom:true});try{
  f.mod.setSetting('mouseFovEnable',false);scene(f,2,[{id:1,x:10,y:20,'е̝ހ':0,'Іࡈ５':6}]);let reads=0;
  const rect=f.dom.canvas.getBoundingClientRect;f.dom.canvas.getBoundingClientRect=()=>{reads++;return rect();};f.mod.step(0);assert.equal(reads,1);
 }finally{f.mod.dispose();}
});
test('aim snapshot reads each active metadata ID once and never sweeps inactive roster slots',()=>{
 const f=fixture();try{
  const self=f.world['ᴎ︃ᄉ'][1],enemy=f.world['ᴎ︃ᄉ'][2];let selfReads=0,enemyReads=0,inactiveReads=0;
  Object.defineProperty(f.world['ᴎ︃ᄉ'],1,{get(){selfReads++;return self;}});Object.defineProperty(f.world['ᴎ︃ᄉ'],2,{get(){enemyReads++;return enemy;}});
  for(let i=3;i<=120;i++)Object.defineProperty(f.world['ᴎ︃ᄉ'],i,{get(){inactiveReads++;return 0;},configurable:true});
  f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2,1,100,100,true);f.mod.trackPacket(13,0,2,200,200,true);
  f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('target','all');f.mod.aim.resolve();
  assert.equal(selfReads,1);assert.equal(enemyReads,1);assert.equal(inactiveReads,0);assert.equal(f.mod.aim.targetPlayer,f.mod.targets.players[2]);
 }finally{f.mod.dispose();}
});
test('aim snapshot refreshes vanished metadata and reused clan membership on every resolve',()=>{
 const f=fixture();try{
  f.world['ﾠࡅ‍'][0]={'ոᚄރ':7};for(const id of [1,2])f.world['ᴎ︃ᄉ'][id]={'а༤̘':0,'ᴌ̗ⲟ':7};
  f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2,1,100,100,true);f.mod.trackPacket(1,3,1,200,200,true);f.mod.setSetting('mouseFovEnable',false);
  f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,3);
  f.world['ᴎ︃ᄉ'].length=2;f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
  f.world['ᴎ︃ᄉ'][2]={'а༤̘':0,'ᴌ̗ⲟ':7};f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,3);
 }finally{f.mod.dispose();}
});
test('disabled aim and a locked target avoid preparing a full candidate scan',()=>{
 const f=fixture();try{
  f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2,1,100,100,true);
  Object.defineProperty(f.mod.targets.players,Symbol.iterator,{value(){throw Error('Unexpected full scan');},configurable:true});
  f.mod.aim.refresh();f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],45);
 }finally{f.mod.dispose();}
});
