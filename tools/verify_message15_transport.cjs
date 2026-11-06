function verifyMessage15Transport(m,n,s,r,reference){
 const check=(v,text)=>{if(!v)throw Error(text);},transport=n.capturePackets(),self=n.world[s['ᅠᏧ‍']],oldId=self.id,oldState=n.network.state,ended=m.reconnect.sessionEnded;
 const keys=['AimBotEnabled','autoFire','lockId','jitterActive','hideAimbotAngle','JitterEnabled','resolverType','mouseFovEnable'],saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]]));
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.onHandshake();
  for(const [key,value]of Object.entries({AimBotEnabled:true,autoFire:true,lockId:2,jitterActive:false,hideAimbotAngle:false,JitterEnabled:false,resolverType:'linear',mouseFovEnable:false}))m.setSetting(key,value);
  const queuedCases=[1,16,128,1024,4095],expected=[],normalize=p=>p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p;
  const create=new Function('MOD','World','Client','window','Entitie','__ENTITIE_BULLET__','KeyboardEvent',reference.blocks.filter(b=>['GetAllTargetsCon','GetTarget','AimbotCon','JitterCon','LinesCon','_lineIntersect'].includes(b.label)).map(b=>b.source).join('\n')+'\nvar GetAllTargets=new GetAllTargetsCon(),Aimbot=new AimbotCon(),Jitter=new JitterCon();return {targets:GetAllTargets,aim:Aimbot};');
  const source=create({...m.settings},{PLAYER:{id:1,team:-1},players:Array.from({length:1000},()=>({team:-1}))},{state:1,sendPacket:text=>expected.push(normalize(JSON.parse(text)))},{Math,JSON,dispatchEvent(){}},{units:[],border:[]},2,KeyboardEvent);
  const realNow=Date.now;let clock=1000;Date.now=()=>clock;
  try{
   for(const bytes of queuedCases){
    m.aim.onDeath();m.onHandshake();source.aim.onDeath();source.aim.dead=false;m.observeSocket({readyState:1,bufferedAmount:bytes});transport.packets.length=expected.length=0;
    for(const [id,x,y]of [[1,1000,1000],[2,1500,1200],[2,1600,1200],[2,1500,1200]]){
     clock+=50;m.trackPacket(0,id,1,x,y,true);source.targets.players[id].update(x,y);
     check(JSON.stringify(transport.packets)===JSON.stringify(expected),'Small queue dropped or changed uploaded aim packets: '+bytes+' bytes');
     check(m.aim.lastAngle===source.aim.lastAngle,'Small queue changed the uploaded aim angle');
    }
   }
  }finally{Date.now=realNow;}
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
  return {status:'passed',small_queue_source_parity:true,small_queue_cases:queuedCases,aim_high_water_bytes:4096,blocked_cycles_dropped:true,whole_attack_release_cycle:true,non_open_sockets:true,server_death_sends_no_commands:true,session_lifecycle:true};
 }finally{transport.restore();m.observeSocket(null);self.id=oldId;n.network.state=oldState;m.reconnect.sessionEnded=ended;for(const [k,v]of Object.entries(saved))m.setSetting(k,v);}
}
module.exports={verifyMessage15Transport};
