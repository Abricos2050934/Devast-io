const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {fixture}=require('./mod-fixture.cjs'),{audit,reference}=require('../tools/audit_message15.cjs');
test('all five imported classes, 24 methods, 15 blocks and 23 defaults remain verbatim; retired engines are absent',()=>{
 assert.deepEqual(audit(),{status:'passed',source_sha256:'bee8d9034627b24e8f5919617dff3ed23e946da253b35dcf1805056b5fa7e4a5',classes:5,methods:24,exact_blocks:15,exact_defaults:23});
});
test('installed histories, source formulas and packet cycles match the independent uploaded core',()=>{
 const blocks=reference().blocks.filter(b=>['GetAllTargetsCon','GetTarget','AimbotCon','JitterCon','LinesCon','_lineIntersect'].includes(b.label)).map(b=>b.source).join('\n');let comparisons=0;
 for(let scene=0;scene<24;scene++){
  const f=fixture();let now=1000;const packets=[];const world={PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))};
  f.mod.observeSocket({readyState:1,bufferedAmount:[0,1,16,128,1024,4095][scene%6]});
  const normalize=p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p;
  const context=vm.createContext({MOD:{...f.mod.settings},World:world,Client:{state:1,sendPacket:text=>{const p=JSON.parse(text);if(p.every(x=>typeof x==='number'&&Number.isFinite(x)))packets.push(normalize(p));}},window:{Math,JSON,dispatchEvent(){}},Entitie:{units:[],border:[]},__ENTITIE_BULLET__:2,KeyboardEvent:class{},Date:{now:()=>now}});
  vm.runInContext(blocks+'\nvar GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();',context);
  const old={targets:context.GetAllTargets,aim:context.Aimbot};
  function set(k,v){f.mod.setSetting(k,v);context.MOD[k]=v;}
  function state(e){return JSON.stringify({lastId:e.targets.lastId,lastAngle:e.aim.lastAngle,target:e.aim.targetPlayer?.id,dead:e.aim.dead,mouseDown:e.aim.mouseDown,lines:e.targets.lines,players:e.targets.players.filter(p=>p?.active),ghouls:e.targets.ghouls.filter(p=>p?.active)});}
  function compare(label){assert.equal(state(f.mod),state(old),label);assert.equal(JSON.stringify(f.packets),JSON.stringify(packets),label+' packets');f.packets.length=packets.length=0;comparisons++;}
  function track(type,id,uid,x,y,active=true){now+=50;f.setClock(now);f.mod.trackPacket(type,id,uid,x,y,active);const p=type===13?old.targets.ghouls[uid]:old.targets.players[id];if(active)p.update(x,y);else p.setInactive();compare('scene '+scene+' track '+type+'/'+id+'/'+uid);}
  try{
   for(const [key,value]of Object.entries({AimBotEnabled:true,autoFire:scene%3===0,target:['players','ghouls','all'][scene%3],mouseFovEnable:scene%2===0,mouseFov:2000,lockId:[-1,0,2,120][scene%4],distanceCoefficient:100+scene*20,offsetCoefficient:(scene%4)*.1,bulletSpeedCoefficient:1+scene%14,resolverType:scene%2?'trygonometrical':'linear',visualizeResolving:true,ShowAimTrace:scene%4===0,hideAimbotAngle:scene%4===1,jitterActive:false}))set(key,value);
   f.world['ﾠࡅ‍'][0]={'ոᚄރ':7};
   for(const id of [1,2]){const team=(scene%(id===1?7:14)===0)?0:-1;Object.assign(f.world['ᴎ︃ᄉ'][id],{'а༤̘':team,'ᴌ̗ⲟ':7});world.players[id].team=team;if(id===1)world.PLAYER.team=team;}
   for(const e of [f.mod,old])e.targets.mouseMapCords={x:1400,y:1100};
   for(let step=0;step<12;step++){
    track(1,1,1,1000+step*3,1000+step);track(1,2,1,1400+(step%3)*15,1100+step*12);track(1,3,1,1600-step*9,1200-step*4);track(13,0,17,1250+step*5,1300-step*7);
    if(step===5)track(1,2,1,0,0,false);f.mod.aim.refresh();old.aim.refresh();compare('refresh '+scene+'/'+step);
   }
   f.mod.aim.onDeath();old.aim.onDeath();compare('death '+scene);
  }finally{f.mod.dispose();}
 }
 assert.ok(comparisons>1400);
});
test('source direction timer, refresh-on-packet and source death reset are installed and disposed',()=>{
 const f=fixture();try{
  assert.ok([...f.timerPeriods.values()].includes(1));assert.ok([...f.timerPeriods.values()].includes(50));
  f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('lockId',2);
  f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1200,1000,true);assert.equal(f.packets.at(-1)[0],6);
  const before=f.packets.length;for(const [id,fn]of f.timers)if(f.timerPeriods.get(id)===1)fn();assert.ok(f.packets.length>before);
  f.mod.onSessionStart();assert.equal(f.mod.aim.dead,true);assert.equal(f.mod.targets.players[1].active,false);f.mod.onHandshake();assert.equal(f.mod.aim.dead,false);
 }finally{f.mod.dispose();}assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);
});
