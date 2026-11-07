const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs'),{reference}=require('../tools/audit_message15.cjs'),{verifyAimSearch}=require('../tools/verify_aim_search.cjs');
test('dense search avoids roster metadata sweeps and immediately applies clan changes',()=>{
 const f=fixture();try{const s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','ﾠࡅ‍','а༤̘','ոᚄރ','ᴌ̗ⲟ'].map(k=>[k,k]));const r=verifyAimSearch(f.mod,f.B,s,1);assert.equal(r.status,'passed');assert.equal(r.clanless_metadata_reads,1);assert.equal(r.competitive_clan_metadata_reads,4);}finally{f.mod.dispose();}
});
test('optimized target search matches the independent source with ties, fractional FOV, removals and different target classes',()=>{
 const f=fixture();const settings={...f.mod.settings,AimBotEnabled:false,jitterActive:false,autoFire:false};const world={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};
 const create=new Function('MOD','World','Client','window','Entitie','__ENTITIE_BULLET__','KeyboardEvent',reference().blocks.filter(b=>['GetAllTargetsCon','GetTarget','AimbotCon','JitterCon','LinesCon','_lineIntersect'].includes(b.label)).map(b=>b.source).join('\n')+'\nvar GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();return {targets:GetAllTargets,aim:Aimbot};');
 const old=create(settings,world,{state:1,sendPacket(){}},{Math,JSON,dispatchEvent(){}},{units:[],border:[]},2,class{});let seed=91357,comparisons=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const identity=(engine,t)=>!t?null:(engine.targets.players[t.id]===t?'player:':'ghoul:')+t.id;
 function track(type,id,x,y,active=true){f.mod.trackPacket(type===13?13:1,type===13?0:id,type===13?id:1,x,y,active);const t=(type===13?old.targets.ghouls:old.targets.players)[id];if(active)t.update(x,y);else t.setInactive();}
 try{
  for(const[k,v]of Object.entries(settings))f.mod.setSetting(k,v);
  f.world['ﾠࡅ‍'][0]={'ոᚄރ':7};f.world['ﾠࡅ‍'][1]={'ոᚄރ':8};
  for(let id=1;id<=20;id++){track(1,id,1000+id*10,1000);track(13,id,1000,1000+id*10);const team=id%3-1;world.players[id].team=team;f.world['ᴎ︃ᄉ'][id]={'а༤̘':team,'ᴌ̗ⲟ':team===0?7:8};}
  for(let step=0;step<300;step++){
   const type=step%2?1:13,id=2+step%19;
   track(type,id,1000+Math.floor(random()*100)/3,1000+Math.floor(random()*100)/3,step%11!==0);
   world.PLAYER.team=step%3-1;f.world['ᴎ︃ᄉ'][1]={'а༤̘':world.PLAYER.team,'ᴌ̗ⲟ':world.PLAYER.team===0?7:8};
   const point={x:1000+Math.floor(random()*60)/3,y:1000+Math.floor(random()*60)/3};
   for(const target of ['players','ghouls','all']){
    f.mod.setSetting('target',target);settings.target=target;
    for(const limit of [0,1,1.1,2,10.5,40,2500]){
     assert.equal(identity(f.mod,f.mod.aim.findNearestPlayerTo(point,limit)),identity(old,old.aim.findNearestPlayerTo(point,limit)),`query ${step}, ${target}, FOV ${limit}`);comparisons++;
    }
   }
  }
  assert.equal(comparisons,6300);
 }finally{f.mod.dispose();}
});
