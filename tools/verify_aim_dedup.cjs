// Compare dense receive scenes in both selectable predictors; no server ban
// or packet-rate threshold is inferred from this deterministic client test.
function verifyAimDedup(m,n,s){
 const check=(v,t)=>{if(!v)throw Error(t);},self=n.world[s['ᅠᏧ‍']],meta=n.world[s['ᴎ︃ᄉ']],saved={...m.settings},old={id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,now:Date.now,performance:performance.now,meta:Array.from({length:25},(_,i)=>[i+1,meta[i+1]]),types:n.types?.[n.playerType??0]?.[s.curveWeapons]};
 let clock=50000;const capture=n.capturePackets(),results=[],set=(k,v)=>m.setSetting(k,v),at=t=>{clock=t;n.setClock?.(clock);};
 try{
  Date.now=()=>clock;performance.now=()=>clock;n.network.state=1;self.id=1;m.observeSocket(null);m.reconnect.sessionEnded=false;
  for(let id=1;id<=25;id++)meta[id]={[s['а༤̘']]:-1};
  if(n.types?.[n.playerType??0])n.types[n.playerType??0][s.curveWeapons]={10:{[s.curveBulletSpeed]:1.4,path:900}};
  for(const[k,v]of Object.entries({AimBotEnabled:true,JitterEnabled:false,AimbotSpearEnabled:false,autoFire:false,mouseFovEnable:false,lockId:2,aimSmooth:1,hideAimbotAngle:false,hidePlayerAngle:false}))set(k,v);
  for(const adaptive of [false,true])for(const players of [1,12,24]){
   m.onSessionStart();m.onHandshake();set('AdaptiveAimEnabled',adaptive);at(clock+1000);const start=clock;
   m.trackPacket(n.playerType??0,1,1,1000,1000,true,0,10<<8);capture.packets.length=0;
   const before=m.diagnostics.deduplicatedAngles;
   for(let frame=0;frame<40;frame++){at(start+50+frame*50);m.trackPacket(n.playerType??0,1,1,1000,1000,true,0,10<<8);for(let id=2;id<=players+1;id++)m.trackPacket(n.playerType??0,id,1,1400+id*10,1000+frame*5,true,0,0);}
   const directions=capture.packets.filter(p=>p[0]===6).length;
   check(directions===40,'Dense scene grew direction traffic: '+JSON.stringify({adaptive,players,directions}));
   results.push({adaptive,players,directions,seconds:2,identicalRemoved:m.diagnostics.deduplicatedAngles-before});
  }
  // A real native shot must reassert its direction even when numerically equal.
  capture.packets.length=0;for(let i=0;i<3;i++){if(n.fire)n.fire();else{check(m.beforeFire()!==false,'Shot alignment rejected');capture.packets.push([4]);m.afterFire();}}
  for(let i=0;i<capture.packets.length;i++)if(capture.packets[i][0]===4)check(i>0&&capture.packets[i-1][0]===6,'Dedup removed required shot alignment');
  // Native cursor movement after target loss invalidates the cached direction.
  set('AdaptiveAimEnabled',false);set('offsetCoefficient',0);m.aimModule.refreshTargets();const priorAngle=m.aim.lastAngle;m.afterRelease();m.trackPacket(n.playerType??0,2,1,0,0,false);check(!m.controlsAimDirection,'Lost target retained direction ownership');
  if(n.directionProbes)for(const probe of n.directionProbes)probe(Math.PI/2);
  capture.packets.length=0;at(clock+50);m.trackPacket(n.playerType??0,2,1,1420,1195,true);check(m.aim.lastAngle===priorAngle&&capture.packets.some(p=>p[0]===6),'Equal-angle reacquisition reused a stale native direction');
  return {status:'passed',predictors:2,dense_cases:results.length,results,shot_alignment_forced:true,reacquisition_invalidates_cache:true};
 }finally{capture.restore();Date.now=old.now;performance.now=old.performance;m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;for(const[id,value]of old.meta)meta[id]=value;if(n.types?.[n.playerType??0])n.types[n.playerType??0][s.curveWeapons]=old.types;Object.assign(m.settings,saved);}
}
module.exports={verifyAimDedup};
