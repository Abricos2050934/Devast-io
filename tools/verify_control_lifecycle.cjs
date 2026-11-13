// Bound background traffic even when targets change; release automated movement.
function verifyControlLifecycle(m,n,s){
 const check=(v,t)=>{if(!v)throw Error(t);},self=n.world[s['ᅠᏧ‍']],meta=n.world[s['ᴎ︃ᄉ']],saved={...m.settings},type=n.playerType??0;
 const old={id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,now:Date.now,performance:performance.now,move:m.targets.myLastMoveDirection,meta:Array.from({length:25},(_,i)=>[i+1,meta[i+1]]),weapons:n.types?.[type]?.[s.curveWeapons]};
 let clock=100000;const capture=n.capturePackets(),set=(k,v)=>m.setSetting(k,v),at=t=>{clock=t;n.setClock?.(clock);};
 try{
  Date.now=()=>clock;performance.now=()=>clock;n.setClock?.(clock);self.id=1;n.network.state=1;m.observeSocket(null);m.reconnect.sessionEnded=false;m.onSessionStart();m.onHandshake();
  for(let id=1;id<=25;id++)meta[id]={[s['а༤̘']]:-1};
  if(n.types?.[type])n.types[type][s.curveWeapons]={10:{[s.curveBulletSpeed]:1.4,path:900}};
  for(const[k,v]of Object.entries({AdaptiveAimEnabled:true,AimBotEnabled:true,JitterEnabled:false,AntiAimbot:false,autoFire:false,AimbotSpearEnabled:false,mouseFovEnable:false,lockId:-1,aimStick:0,aimHoldMs:0,hideAimbotAngle:false,hidePlayerAngle:false,FAutoLootEnabled:false,SAutoLootEnabled:false,AutoBuiledEnabled:false,AutoTakeEnabled:false,AntiKickEnabled:false,SpamChatEnabled:false}))set(k,v);
  m.trackPacket(type,1,1,1000,1000,true,0,10<<8);capture.packets.length=0;let last=null,switches=0;
  for(let frame=0;frame<40;frame++){
   at(100050+frame*50);m.trackPacket(type,1,1,1000,1000,true,0,10<<8);
   for(let id=2;id<=25;id++){const angle=id*.2,r=700-frame*10-id*1.1;m.trackPacket(type,id,1,1000+r*Math.cos(angle),1000+r*Math.sin(angle),true,0,0);const target=m.aim.targetPlayer?.id;if(target!==last){switches++;last=target;}}
  }
  const directions=capture.packets.filter(p=>p[0]===6).length;check(switches>=100&&directions>0&&directions<=40,'Target switches bypassed the adaptive 50ms budget: '+JSON.stringify({switches,directions}));
  // A real shot bypasses that idle budget, retaining immediate alignment.
  capture.packets.length=0;if(n.fire)n.fire();else if(m.beforeFire()!==false){capture.packets.push([4]);m.afterFire();}
  const attack=capture.packets.findIndex(p=>p[0]===4);check(attack>0&&capture.packets[attack-1][0]===6&&Math.abs(capture.packets[attack-1][1]-m.aim.lastAngle)<1e-7,'Traffic cap delayed manual shot alignment');m.afterRelease();
  set('AimBotEnabled',false);set('AdaptiveAimEnabled',false);capture.packets.length=0;const moves=[];
  for(const mask of [0,5]){m.onMove(mask);set('AntiAimbot',true);m.aimModule.antiTick();check(capture.packets.at(-1)?.[0]===2&&capture.packets.at(-1)[1]!==mask,'Strafe fixture did not own movement');set('AntiAimbot',false);check(JSON.stringify(capture.packets.at(-1))===JSON.stringify([2,mask]),'Disabling Strafe did not restore native movement');moves.push(mask);}
  m.onMove(0);set('AntiAimbot',true);m.aimModule.antiTick();m.observeSocket({readyState:1,bufferedAmount:4096});capture.packets.length=0;set('AntiAimbot',false);check(!capture.packets.length,'Movement restore grew a blocked automatic queue');
  const tick=()=>{if(n.timers){for(const[id,fn]of n.timers)if(n.timerPeriods?.get(id)===50)fn();}else m.step(clock);};
  m.observeSocket(null);at(clock+50);tick();
  check(JSON.stringify(capture.packets)===JSON.stringify([[2,0]]),'Pending movement restore did not resume exactly once');
  const before=capture.packets.length;tick();check(capture.packets.length===before,'Movement restoration repeated');
  return {status:'passed',adaptive_global_interval_ms:50,target_switches:switches,background_directions:directions,duration_ms:2000,shot_alignment_immediate:true,strafe_restores:moves,pending_restore_once:true};
 }finally{
  m.settings.AimBotEnabled=false;m.settings.AntiAimbot=false;m.onSessionStart();m.onHandshake();capture.restore();Date.now=old.now;performance.now=old.performance;self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;m.targets.myLastMoveDirection=old.move;for(const[id,value]of old.meta)meta[id]=value;if(n.types?.[type])n.types[type][s.curveWeapons]=old.weapons;Object.assign(m.settings,saved);
 }
}
module.exports={verifyControlLifecycle};
