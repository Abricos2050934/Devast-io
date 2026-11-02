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
test('ILM angle mode adds no extra rays for a dense scene',()=>{
 const f=fixture({dom:true});scene(f,1,Array.from({length:120},(_,i)=>player(i+1,i*20,i*30)));
 for(let i=1;i<=120;i++)f.world['ᴎ︃ᄉ'][i]={'а༤̘':-1};
 f.mod.setSetting('visualizeResolving',false);f.mod.setSetting('AimBotEnabled',true);f.mod.step(0);
 assert.equal(f.dom.calls.filter(c=>c.name==='lineTo').length,0);f.mod.dispose();
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
