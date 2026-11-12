// Real transport checks; the native browser supplies its actual fire handler,
// codec bridge, direction send sites and self renderer.
function verifyJitter(m,n,s){
 const check=(ok,label)=>{if(!ok)throw Error(label);},self=n.world[s['ᅠᏧ‍']],metadata=n.world[s['ᴎ︃ᄉ']],saved={...m.settings},old={id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,now:Date.now,meta:metadata[2]};
 let clock=20000;const capture=n.capturePackets();
 const set=(key,value)=>m.setSetting(key,value),advance=ms=>{clock+=ms;n.setClock?.(clock);},angles=()=>capture.packets.filter(p=>p[0]===6);
 try{
  Date.now=()=>clock;n.setClock?.(clock);n.network.state=1;self.id=1;m.observeSocket(null);m.reconnect.sessionEnded=false;m.onSessionStart();m.onHandshake();
  metadata[2]={[s['а༤̘']]:-1};
  for(const[key,value]of Object.entries({AimBotEnabled:true,AimbotSpearEnabled:false,jitterActive:true,autoFire:false,mouseFovEnable:false,lockId:2,hideAimbotAngle:false,hidePlayerAngle:false,aimSmooth:1,antiAimMode:'Round2',jitterOffset:0,stopJittersOnStop:false,ShowRealAngles:'withAim'}))set(key,value);
  m.trackPacket(n.playerType??0,1,1,1000,1000,true);m.trackPacket(n.playerType??0,2,1,1400,1000,true);
  capture.packets.length=0;m.aimModule.jitterTick();const first=angles().at(-1)?.[1];check(Number.isFinite(first),'Jitter did not send an idle angle');
  advance(100);m.aimModule.jitterTick();check(angles().at(-1)[1]!==first,'Round2 did not rotate');check(Number.isFinite(m.jitterAngle),'Local Jitter rotation is not displayed');
  if(n.entities?.get&&n.update){const e=n.entities.get(1,0,1,0),angle=e.angle;e[s['ᴘ४１']]=1;n.update(e);check(Math.abs(e.angle-m.jitterAngle)<1e-8,'Native player did not display Jitter rotation');e.angle=angle;}
  if(n.directionProbes){capture.packets.length=0;for(const probe of n.directionProbes)probe(2);check(!angles().length,'Native cursor overwrote idle Jitter');}
  capture.packets.length=0;if(n.fire)n.fire();else{m.beforeFire();capture.packets.push([4]);m.afterFire();}
  const attack=capture.packets.findIndex(p=>p[0]===4);check(attack>0&&capture.packets[attack-1][0]===6&&Math.abs(capture.packets[attack-1][1])<1e-8,'Manual shot was sent before its target angle');
  capture.packets.length=0;advance(100);m.aimModule.jitterTick();check(!angles().length,'Jitter overwrote held manual fire');
  m.trackPacket(n.playerType??0,2,1,1400,1100,true);check(angles().some(p=>p[1]>0&&p[1]<90),'Held manual aim did not follow the moving target');
  if(n.directionProbes){capture.packets.length=0;for(const probe of n.directionProbes)probe(2);check(!angles().length,'Cursor overwrote held target angle');}
  m.afterRelease();advance(200);capture.packets.length=0;m.aimModule.jitterTick();check(angles().length===1,'Jitter did not resume after release');
  set('autoFire',true);capture.packets.length=0;m.aim.refresh();const auto=capture.packets.findIndex(p=>p[0]===4);check(auto>0&&capture.packets[auto-1][0]===6,'Automatic shot lacks a preceding target angle');
  capture.packets.length=0;advance(100);m.aimModule.jitterTick();check(!angles().length,'Jitter interfered with automatic fire');
  set('autoFire',false);m.afterRelease();advance(200);set('stopJittersOnStop',true);m.aimModule.jitterTick();advance(200);capture.packets.length=0;m.aimModule.jitterTick();check(!angles().length,'StopJittersOnStop did not pause standing rotation');
  set('stopJittersOnStop',false);capture.packets.length=0;m.aimModule.jitterTick();check(angles().length===1,'Standing rotation failed with stop option disabled');
  set('jitterActive',false);check(!m.controlsJitterDirection&&m.jitterAngle===null,'Disabling Jitter did not release the native cursor');
  set('jitterActive',true);m.observeDeath([5,0,2]);capture.packets.length=0;m.aimModule.jitterTick();m.beforeFire();check(!capture.packets.length,'Jitter sent after server death');
  return {status:'passed',manual_angle_before_attack:true,automatic_angle_before_attack:true,held_fire_tracks_target:true,cursor_cannot_overwrite:true,resumes_on_release:true,standing_and_stop_option:true,local_rotation:true,death_stops_packets:true};
 }finally{capture.restore();Date.now=old.now;m.settings.jitterActive=false;m.settings.autoFire=false;m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;metadata[2]=old.meta;Object.assign(m.settings,saved);m.setSetting('AimBotEnabled',saved.AimBotEnabled);}
}
module.exports={verifyJitter};
