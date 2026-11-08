function verifyAimOwnership(m,n,s){
 const check=(v,message)=>{if(!v)throw Error(message);},transport=n.capturePackets(),self=n.world[s['ᅠᏧ‍']],metadata=n.world[s['ᴎ︃ᄉ']];
 const keys=['AimBotEnabled','autoFire','jitterActive','JitterEnabled','mouseFovEnable','mouseFov','lockId','target','antiAimMode','hideAimbotAngle'],saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]]));
 const savedState=n.network.state,savedId=self.id,savedEnded=m.reconnect.sessionEnded,oldMeta=[metadata[1],metadata[2]],oldPerformance=performance.now;let clock=3000000;
 performance.now=()=>clock;const cases=[];
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);
  for(const id of [1,2])metadata[id]={...metadata[id],[s['а༤̘']]:-1};
  for(const index of [0,1]){
   m.aim.onDeath();m.onHandshake();
   for(const [key,value]of Object.entries({AimBotEnabled:false,autoFire:false,jitterActive:false,JitterEnabled:false,mouseFovEnable:false,lockId:-1,target:'players',hideAimbotAngle:false}))m.setSetting(key,value);
   m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1500,1000,true);m.setSetting('AimBotEnabled',true);m.aim.refresh();m.beforeFire();
   clock+=10;m.setSetting('mouseFov',80);m.setSetting('mouseFovEnable',true);m.targets.mouseMapCords={x:50000,y:50000};m.aim.refresh();
   check(m.aim.targetPlayer===null,'Fixture did not leave aim FOV');
   transport.packets.length=0;n.directionProbes[index](Math.PI/2);
   check(JSON.stringify(transport.packets)==='[[6,90]]','Native mouse direction was not admitted while aim had no target');
   transport.packets.length=0;clock+=10;m.setSetting('mouseFovEnable',false);m.aim.refresh();n.fire();
   check(JSON.stringify(transport.packets)==='[[6,0],[4]]','Reacquisition reused the mouse angle or sent duplicate alignment: '+JSON.stringify(transport.packets));
   cases.push({native_handler:index,mouse_direction:90,reacquired_direction:0,packets:transport.packets.map(p=>p.slice())});clock+=1000;
  }
  m.aim.onDeath();m.onHandshake();m.setSetting('jitterActive',true);m.setSetting('antiAimMode','Round');m.trackPacket(0,1,1,1000,1000,true);m.aim.refresh();
  check(m.aim.targetPlayer===null&&m.controlsAimDirection,'Imported targetless Jitter yielded direction ownership');
  transport.packets.length=0;for(const probe of n.directionProbes)probe(Math.PI/2);check(transport.packets.length===0,'Native mouse competed with imported Jitter');
  m.setSetting('jitterActive',false);check(!m.controlsAimDirection,'Disabling imported Jitter retained targetless ownership');
  return {status:'passed',native_handlers:2,cases,imported_jitter_exclusive_ownership:true,release_on_disable:true};
 }finally{
  performance.now=oldPerformance;transport.restore();m.setSetting('AimBotEnabled',false);m.onSessionStart();m.onHandshake();self.id=savedId;n.network.state=savedState;m.reconnect.sessionEnded=savedEnded;
  for(const id of [1,2])metadata[id]=oldMeta[id-1];for(const [key,value]of Object.entries(saved))m.setSetting(key,value);
 }
}
module.exports={verifyAimOwnership};
