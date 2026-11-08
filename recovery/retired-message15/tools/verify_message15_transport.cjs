function verifyMessage15Transport(m,n,s,r,reference){
 const check=(v,text)=>{if(!v)throw Error(text);},transport=n.capturePackets(),self=n.world[s['ᅠᏧ‍']],oldId=self.id,oldState=n.network.state,ended=m.reconnect.sessionEnded;
 const keys=['AimBotEnabled','autoFire','lockId','jitterActive','hideAimbotAngle','JitterEnabled','resolverType','mouseFovEnable'],saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]]));
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.onHandshake();
  for(const [key,value]of Object.entries({AimBotEnabled:true,autoFire:true,lockId:2,jitterActive:false,hideAimbotAngle:false,JitterEnabled:false,resolverType:'linear',mouseFovEnable:false}))m.setSetting(key,value);
  const queuedCases=[1,16,128,1024,4095],expected=[],normalize=p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p;
  const create=new Function('MOD','World','Client','window','Entitie','__ENTITIE_BULLET__','KeyboardEvent',reference.blocks.filter(b=>['GetAllTargetsCon','GetTarget','AimbotCon','JitterCon','LinesCon','_lineIntersect'].includes(b.label)).map(b=>b.source).join('\n')+'\nvar GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();return {targets:GetAllTargets,aim:Aimbot};');
  const sourceSettings={...m.settings};const source=create(sourceSettings,{PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))},{state:1,sendPacket:text=>expected.push(normalize(JSON.parse(text)))},{Math,JSON,dispatchEvent(){}},{units:[],border:[]},2,KeyboardEvent);
  const realNow=Date.now,realPerformanceNow=performance.now;let clock=1000000;Date.now=()=>clock;performance.now=()=>clock;
  try{
   for(const bytes of queuedCases){
    m.aim.onDeath();m.onHandshake();source.aim.onDeath();source.aim.dead=false;m.observeSocket({readyState:1,bufferedAmount:bytes});transport.packets.length=expected.length=0;
    for(const [id,x,y]of [[1,1000,1000],[2,1500,1200],[2,1600,1200],[2,1500,1200]]){
     clock+=50;m.trackPacket(0,id,1,x,y,true);source.targets.players[id].update(x,y);
     if(id===2)check(transport.packets.some(p=>p[0]===6),'Small queue suppressed all fresh aim: '+bytes+' bytes');
     check(m.aim.lastAngle===source.aim.lastAngle,'Small queue changed the uploaded aim angle');
    }
   }
  }finally{Date.now=realNow;performance.now=realPerformanceNow;}
  const socket={readyState:1,bufferedAmount:8192};m.observeSocket(socket);transport.packets.length=0;
  m.trackPacket(0,1,1,1000,1000,true);for(const x of [1500,1600,1500])m.trackPacket(0,2,1,x,1200,true);
  for(let i=0;i<30;i++)m.aim.refresh();check(transport.packets.length===0,'Imported aim queued commands on blocked transport');
  let reads=0;Object.defineProperty(socket,'bufferedAmount',{configurable:true,get(){reads++;return transport.packets.length?4096:0;}});
  m.aim.refresh();check(JSON.stringify(transport.packets.map(p=>p[0]))==='[6,4,5]','Imported source attack/release was split');check(reads===1,'Imported cycle did not snapshot transport once');
  m.aim.refresh();check(transport.packets.length===3,'Imported source extended the socket queue');
  for(const state of [0,2,3]){socket.readyState=state;transport.packets.length=0;m.aim.refresh();check(!transport.packets.length,'Imported aim sent on a non-open socket');}
  socket.readyState=1;Object.defineProperty(socket,'bufferedAmount',{value:0,writable:true,configurable:true});
  transport.packets.length=0;m.observeDeath([5,0,2]);m.aim.refresh();m.afterFire();m.afterRelease();check(!transport.packets.length,'Server death generated imported combat commands');
  m.onSessionStart();check(m.aim.dead&&!m.targets.players[1].active,'Session start retained stale source history');m.onHandshake();check(!m.aim.dead,'Native handshake did not reactivate the source engine');
  const testNow=performance.now;let at=2000000;performance.now=()=>at;
  let stationaryDirections=0,movingDirections=0,autoFirePairs=0,immediateComparisons=0;
  try{
   m.reconnect.sessionEnded=false;m.onHandshake();m.observeSocket({readyState:1,bufferedAmount:0});
   for(const [key,value]of Object.entries({AimBotEnabled:false,autoFire:false,lockId:2,jitterActive:false,JitterEnabled:false,hideAimbotAngle:true,mouseFovEnable:false}))m.setSetting(key,value);
   m.trackPacket(0,1,1,1000,1000,true);m.trackPacket(0,2,1,1400,1100,true);m.setSetting('AimBotEnabled',true);transport.packets.length=0;
   for(let i=0;i<10000;i+=4){at=2000000+i;m.aim.refresh();m.aim.refresh();if(i%100===0)m.trackPacket(0,2,1,1400,1100,true);}
   stationaryDirections=transport.packets.filter(p=>p[0]===6).length;check(stationaryDirections===1,'Stationary aim repeated identical wire directions');
   m.setSetting('AimBotEnabled',false);m.setSetting('AimBotEnabled',true);transport.packets.length=0;
   const realDateNow=Date.now;Date.now=()=>at;
   try{
    // Reset both histories, then compare each sub-50 ms update to the independently
    // extracted source, including the last direction actually sent to the wire.
    m.aim.onDeath();m.onHandshake();source.aim.onDeath();source.aim.dead=false;
    Object.assign(sourceSettings,{...m.settings});
    for(const [id,x,y]of [[1,1000,1000],[2,1500,1000]]){m.trackPacket(0,id,1,x,y,true);source.targets.players[id].update(x,y);}
    // Retain the initial wire direction: the first unchanged sample may be deduplicated.
    for(let i=0;i<10000;i+=10){at=2100000+i;const x=1000+500*Math.cos(i/250),y=1000+500*Math.sin(i/250);m.trackPacket(0,2,1,x,y,true);source.targets.players[2].update(x,y);for(let j=0;j<5;j++)m.aim.refresh();
     check(m.aim.lastAngle===source.aim.lastAngle,'Fresh calculation differs from independent Message15');
     check(transport.packets.filter(p=>p[0]===6).at(-1)?.[1]===normalize([6,source.aim.lastAngle])[1],'Fresh Message15 direction was delayed at '+i+' ms: '+JSON.stringify({wire:transport.packets.filter(p=>p[0]===6).at(-1),source:source.aim.lastAngle}));immediateComparisons++;
    }
   }finally{Date.now=realDateNow;}
   movingDirections=transport.packets.filter(p=>p[0]===6).length;check(movingDirections>900,'Moving target retained the old direction throttle');
   m.setSetting('autoFire',true);let previous=-Infinity;
   for(let i=0;i<10000;i+=10){at=2200000+i;const before=transport.packets.length;m.trackPacket(0,2,1,1400+(i%20?100:0),1100+i/10,true);for(let j=0;j<5;j++)m.aim.refresh();const pair=transport.packets.slice(before).filter(p=>p[0]!==6).map(p=>p[0]);if(pair.length){check(JSON.stringify(pair)==='[4,5]','Automatic attack/release pair was split or repeated');check(at-previous>=50,'Automatic fire exceeded cadence');previous=at;autoFirePairs++;}}
   check(autoFirePairs===200,'Automatic fire did not resume correctly');m.setSetting('autoFire',false);
   at+=10;m.trackPacket(0,2,1,1000,1500,true);transport.packets.length=0;n.fire();check(transport.packets[0]?.[0]===6&&transport.packets[1]?.[0]===4,'Native manual shot was not aligned before attack');
  }finally{performance.now=testNow;}
  const idleState=n.idleProbe.read();try{transport.packets.length=0;n.idleProbe.setNow(idleState.activity+idleState.limit+1);n.idleProbe.ping();check(transport.packets.some(p=>p[0]===0),'Native idle ping stopped after direction coalescing');}finally{n.idleProbe.restore(idleState);}
  return {status:'passed',small_queue_admission:true,immediate_directions:{status:'passed',independent_source_comparisons:immediateComparisons,changed_directions_immediate:true,auto_fire_interval_ms:50,auto_fire_pairs_in_10s:autoFirePairs,stationary_directions_in_10s:stationaryDirections,moving_directions_in_10s:movingDirections,manual_shot_priority:true,native_idle_ping:true},small_queue_cases:queuedCases,aim_high_water_bytes:4096,blocked_cycles_dropped:true,whole_attack_release_cycle:true,non_open_sockets:true,server_death_sends_no_commands:true,session_lifecycle:true};
 }finally{transport.restore();m.observeSocket(null);self.id=oldId;n.network.state=oldState;m.reconnect.sessionEnded=ended;for(const [k,v]of Object.entries(saved))m.setSetting(k,v);}
}
module.exports={verifyMessage15Transport};
