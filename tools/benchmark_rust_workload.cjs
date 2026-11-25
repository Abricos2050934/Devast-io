// Synthetic whole-frame CPU replay: packets, aim tick, world collection and HUD.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{spawnSync}=require('node:child_process');
if(!process.argv.includes('--single')){
 const report={scope:'synthetic CPU frame replay, not real device FPS',stress:process.env.DEVAST_STRESS==='1',frames_per_scene:process.env.DEVAST_STRESS==='1'?180:60,rows:[]};
 for(const backend of ['js','rust']){const env={...process.env};delete env.DEVAST_TEST_CANDIDATE;if(backend==='rust')env.DEVAST_RUST_MOD=process.env.DEVAST_RUST_MOD||'rust-mod';else delete env.DEVAST_RUST_MOD;const r=spawnSync(process.execPath,[__filename,'--single'],{env,encoding:'utf8'});if(r.status)throw Error(r.stderr||r.stdout);report.rows.push({backend,...JSON.parse(r.stdout)});}
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}else{
 const {fixture,scene,player}=require('../tests/mod-fixture.cjs'),rows=[];
 const stats=values=>{const a=values.slice().sort((a,b)=>a-b);return {median:a[Math.floor(a.length/2)],p95:a[Math.floor((a.length-1)*.95)],max:a.at(-1)};};
 const stress=process.env.DEVAST_STRESS==='1';
 const profiles=stress?['visuals','fast-loot','slow-loot','video','spear','legacy']:['off','aim'];
 for(const [players,buildings]of (stress?[[30,600],[90,2000]]:[[12,200],[30,600],[48,1000]]))for(const profile of profiles){
  const enabled=profile!=='off';
  const f=fixture({adaptive:true,dom:true});
  try{
   // The fixture stores callbacks but does not remove fired one-shot timers.
   // Model browser timeout expiry, otherwise recursive aim timeouts multiply.
   const oneShots=new Set([...f.timers.keys()].filter(id=>f.timerPeriods.get(id)!==50));
   const timeout=f.window.setTimeout;
   f.window.setTimeout=(fn,delay)=>{const id=timeout(fn,delay);oneShots.add(id);return id;};
   f.B.synchronizedRender=true;f.B.nativePlayerLabels=true;f.B.types={1:{curveWeapons:{10:{curveBulletSpeed:1.4,path:900}}}};
   const actors=Array.from({length:players},(_,i)=>player(i+1,1000+i*8,1000));scene(f,1,actors);
   scene(f,3,Array.from({length:buildings},(_,i)=>({id:i,x:10000+(i%100)*100,y:10000+Math.floor(i/100)*100,'е̝ހ':0,'Іࡈ５':0,'αބ̞':100+i%100,'ᴀܛ٤':100+Math.floor(i/100),'ᴘ४１':2})));
   for(let id=1;id<=players;id++)f.world['ᴎ︃ᄉ'][id]={'ο̏︇':'P'+id,'а༤̘':-1};
   f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('AimBotEnabled',enabled);
   if(stress){
    scene(f,2,Array.from({length:1024},(_,id)=>({id,x:1005+id%50,y:1005+id%20,'е̝ހ':0,'Іࡈ５':6})));
    Object.assign(f.world['ᅠᏧ‍'],{'ε︁ᚂ':1,'օⲥᚁ':1,'α०ᚂ':3,'ρⲅ️':4,'ᴎ︆ࡉ':5,'ᴉᄁ͏':1,'ᴘϲ๓':Array.from({length:100},()=>[6,1]),'ᅠܓ̃':100});
    f.network['іߐ̸']=()=>0;
    f.mod.aim.mouseDown=true;
    f.B.karma[0]={};f.B.graphics['ᴑ̸ᴘ']=()=>{};
    for(let id=1;id<=players;id++)f.world['ᴎ︃ᄉ'][id]['ᴑᴄ̉']=0;
    for(const key of ['ShowPlayerHitbox','PlayersListEnabled','XrayBuildings','AutoBuiledEnabled','AutoTakeEnabled','AntiKickEnabled','JitterEnabled','AntiAimbot','ShowMines','ShowWires','ShowNamesOnMap','KarmaAboveHead','ShowBuildingOwner','RightClickDoors','LootDataEnabled'])f.mod.setSetting(key,true);
    f.mod.setSetting('SpamChatText','benchmark');f.mod.setSetting('SpamChatEnabled',true);
    if(profile!=='visuals')f.mod.setSetting(profile==='slow-loot'?'SAutoLootEnabled':'FAutoLootEnabled',true);
    if(profile==='video')f.mod.setSetting('VideoAimEnabled',true);
    if(profile==='legacy')f.mod.setSetting('AdaptiveAimEnabled',false);
    if(profile==='spear')f.mod.setSetting('AimbotSpearEnabled',true);
    f.mod.setSetting('autoFire',true);f.mod.setSetting('spearAutoThrow',true);
   }
   const measurements={frame:[],packets:[],aim:[],render:[],step:[]};
   let validPredictionFrames=0;
   const due=new Map();
   for(let frame=0;frame<(stress?180:60);frame++){
    const now=1000+frame*1000/60;f.setClock(now);const start=performance.now();let t=start;
    if(frame%3===0){for(let id=1;id<=players;id++){const a=actors[id-1],phase=(now-1000)/1000*2.2+id*.23;a.x=id===1?1000:1300+id*2+90*Math.cos(phase);a.y=id===1?1000:1000+90*Math.sin(phase);if(id===1)Object.assign(f.world['ᅠᏧ‍'],{x:a.x,y:a.y});const w=profile==='spear'?5:10;f.mod.trackPacket(1,id,id,Math.round(a.x),Math.round(a.y),true,w,w<<8);}}
    const packetMs=performance.now()-t;t=performance.now();if(stress){for(const [id,fn]of [...f.timers]){if(!due.has(id))due.set(id,now+(f.timerPeriods.get(id)||1));if(now>=due.get(id)){const period=f.timerPeriods.get(id)||1;if(oneShots.delete(id)){f.timers.delete(id);f.timerPeriods.delete(id);due.delete(id);}else due.set(id,now+Math.max(1,period));fn();}}}else if(frame%3===0)f.mod.aimModule.refreshTargets();const aimMs=performance.now()-t;
    t=performance.now();f.mod.render(now);const renderMs=performance.now()-t;t=performance.now();f.mod.step(now);const stepMs=performance.now()-t;
    if(frame>=15){measurements.frame.push(performance.now()-start);measurements.render.push(renderMs);measurements.step.push(stepMs);if(frame%3===0){measurements.packets.push(packetMs);measurements.aim.push(aimMs);}}
    if(f.mod.aim.prediction?.valid)validPredictionFrames++;
    // Test doubles record canvas calls and packets; avoid benchmarking growth
    // of those diagnostic arrays instead of the bounded production workload.
    f.dom.calls.length=0;f.packets.length=0;
   }
   if(f.mod.diagnostics.errors.length)throw Error(profile+': '+f.mod.diagnostics.errors.join(';'));
   rows.push({players,buildings,profile,aim_enabled:enabled,valid_prediction_frames:validPredictionFrames,...Object.fromEntries(Object.entries(measurements).map(([k,v])=>[k,stats(v)]))});
  }finally{f.mod.dispose();}
 }
 console.log(JSON.stringify({rows}));
}
