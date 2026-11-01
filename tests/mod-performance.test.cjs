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
