async function verifyDisposedNative(page,symbols){
 return page.evaluate(s=>{
  const check=(v,t)=>{if(!v)throw Error(t);},m=window.__devastMod,n=window.__updateProbe;
  n.network.state=1;n.world[s['ᅠᏧ‍']].id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);
  const capture=n.capturePackets(),timeout=window.setTimeout;let timers=0;
  try{
   for(const key of ['AdaptiveAimEnabled','JitterEnabled','AntiAimbot','autoFire'])m.setSetting(key,false);
   m.setSetting('AimBotEnabled',true);m.setSetting('mouseFovEnable',false);m.setSetting('lockId',2);m.setSetting('aimSmooth',1);n.world[s['ᴎ︃ᄉ']][2]={[s['а༤̘']]:-1};n.input.angle=Math.PI/2;
   m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1400,1000,true);capture.packets.length=0;
   m.dispose();check(JSON.stringify(capture.packets)==='[[6,90]]','Cleanup did not restore the native pointer direction');capture.packets.length=0;
   const before=m.diagnostics.commands;
   window.setTimeout=function(...args){timers++;return timeout.apply(this,args);};
   check(m.beforeFire()===true,'Disposed mod blocked the native fire hook');n.fire();n.release();
   check(JSON.stringify(capture.packets)==='[[4],[5]]','Native fire/release failed after disposal');
   capture.packets.length=0;for(const probe of n.directionProbes)probe(Math.PI/2);
   check(JSON.stringify(capture.packets)==='[[6,90],[6,90]]','Disposed mod retained direction ownership');
   for(let i=0;i<10;i++){m.afterFire();m.afterRelease();m.aimModule.afterFire();m.aim.scheduleRefresh();m.onHandshake();m.onSessionStart();check(m.onMove(5)===true,'Disposed movement hook blocked native movement');}
   check(timers===0&&m.diagnostics.commands===before,'Disposed hooks restarted mod activity');
   return {status:'passed',pointer_restored:true,native_fire:true,native_release:true,native_directions:true,mod_timers_not_restarted:true};
  }finally{window.setTimeout=timeout;capture.restore();}
 },symbols);
}
module.exports={verifyDisposedNative};
