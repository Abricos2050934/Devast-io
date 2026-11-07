function verifyNativeAimTransport(m,n,s){
 const check=(v,message)=>{if(!v)throw Error(message);},self=n.world[s['ᅠᏧ‍']],metadata=n.world[s['ᴎ︃ᄉ']],initialClock=n.idleProbe.read(),oldPerformance=performance.now;
 const keys=['AimBotEnabled','autoFire','jitterActive','JitterEnabled','mouseFovEnable','lockId','target','hideAimbotAngle'],settings=Object.fromEntries(keys.map(k=>[k,m.settings[k]])),oldId=self.id,oldState=n.network.state,oldEnded=m.reconnect.sessionEnded,oldMeta=[metadata[1],metadata[2]];
 let clock=50,capture=null;performance.now=()=>clock;
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket({readyState:1,bufferedAmount:0});m.onSessionStart();m.onHandshake();
  for(const id of [1,2])metadata[id]={...metadata[id],[s['а༤̘']]:-1};
  for(const [key,value]of Object.entries({AimBotEnabled:false,autoFire:false,jitterActive:false,JitterEnabled:false,mouseFovEnable:false,lockId:2,target:'players',hideAimbotAngle:false}))m.setSetting(key,value);
  m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1500,1000,true);m.setSetting('AimBotEnabled',true);
  check(m.connectionInfo().aimTransport.nativeSenderAvailable,'Reviewed native aim transport is missing');
  capture=n.capturePackets();n.idleProbe.restore({now:0,activity:0});
  for(clock=50;clock<=initialClock.limit*2+1000;clock+=50){n.idleProbe.setNow(clock);m.trackPacket(0,2,1,1000+500*Math.cos(clock/1000),1000+500*Math.sin(clock/1000),true);n.idleProbe.ping();}
  const directions=capture.packets.filter(p=>p[0]===6).length,heartbeats=capture.packets.filter(p=>p[0]===0).length;
  check(directions>100&&heartbeats>=2,'Sustained aim suppressed native idle packets: '+JSON.stringify({directions,heartbeats,clock:n.idleProbe.read()}));
  n.idleProbe.setNow(clock+1000);n.fire();check(n.idleProbe.read().activity===clock+1000,'Real native fire stopped updating the activity timer');
  capture.restore();capture=null;
  const wireCases=[];
  for(const seed of [[0,0],[0,1],[18,52]]){
   const frame=seed.concat([6,42,5,0,11,200,77,18]),wire=n.captureWire(frame);
   try{wire.normal([6,42]);wire.aim([6,42]);check(JSON.stringify(wire.inputs)==='[[6,42],[6,42]]','Aim bridge changed codec arguments');check(wire.bytes.length===2&&JSON.stringify(wire.bytes[0])===JSON.stringify(wire.bytes[1]),'Aim bridge changed native binary/encryption output');wireCases.push({seed,bytes:wire.bytes[0].length,equal:true});}finally{wire.restore();}
  }
  return {status:'passed',idle_period_ms:initialClock.limit,sustained_duration_ms:initialClock.limit*2+1000,directions,heartbeats,real_input_updates_activity:true,wire_cases:wireCases};
 }finally{
  capture?.restore();performance.now=oldPerformance;n.idleProbe.restore(initialClock);m.observeSocket(null);m.setSetting('AimBotEnabled',false);m.onSessionStart();m.onHandshake();self.id=oldId;n.network.state=oldState;m.reconnect.sessionEnded=oldEnded;
  for(const id of [1,2])metadata[id]=oldMeta[id-1];for(const [key,value]of Object.entries(settings))m.setSetting(key,value);
 }
}
module.exports={verifyNativeAimTransport};
