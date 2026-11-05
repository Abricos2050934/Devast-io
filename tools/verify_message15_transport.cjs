function verifyMessage15Transport(m,n,s,r){
 const check=(v,text)=>{if(!v)throw Error(text);},transport=n.capturePackets(),self=n.world[s['ᅠᏧ‍']],oldId=self.id,oldState=n.network.state,ended=m.reconnect.sessionEnded;
 const keys=['AimBotEnabled','autoFire','lockId','jitterActive','hideAimbotAngle','JitterEnabled'],saved=Object.fromEntries(keys.map(k=>[k,m.settings[k]]));
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.onHandshake();
  for(const [key,value]of Object.entries({AimBotEnabled:true,autoFire:true,lockId:2,jitterActive:false,hideAimbotAngle:false,JitterEnabled:false}))m.setSetting(key,value);
  const socket={readyState:1,bufferedAmount:8192};m.observeSocket(socket);transport.packets.length=0;
  m.trackPacket(0,1,1,1000,1000,true);for(const x of [1500,1600,1500])m.trackPacket(0,2,1,x,1200,true);
  for(let i=0;i<30;i++)m.aim.refresh();check(transport.packets.length===0,'Imported aim queued commands on blocked transport');
  let reads=0;Object.defineProperty(socket,'bufferedAmount',{configurable:true,get(){reads++;return transport.packets.length?128:0;}});
  m.aim.refresh();check(JSON.stringify(transport.packets.map(p=>p[0]))==='[6,4,5]','Imported source attack/release was split');check(reads===1,'Imported cycle did not snapshot transport once');
  m.aim.refresh();check(transport.packets.length===3,'Imported source extended the socket queue');
  for(const state of [0,2,3]){socket.readyState=state;transport.packets.length=0;m.aim.refresh();check(!transport.packets.length,'Imported aim sent on a non-open socket');}
  socket.readyState=1;Object.defineProperty(socket,'bufferedAmount',{value:0,writable:true,configurable:true});
  transport.packets.length=0;m.observeDeath([5,0,2]);m.aim.refresh();m.afterFire();m.afterRelease();check(!transport.packets.length,'Server death generated imported combat commands');
  m.onSessionStart();check(m.aim.dead&&!m.targets.players[1].active,'Session start retained stale source history');m.onHandshake();check(!m.aim.dead,'Native handshake did not reactivate the source engine');
  return {status:'passed',blocked_cycles_dropped:true,whole_attack_release_cycle:true,non_open_sockets:true,server_death_sends_no_commands:true,session_lifecycle:true};
 }finally{transport.restore();m.observeSocket(null);self.id=oldId;n.network.state=oldState;m.reconnect.sessionEnded=ended;for(const [k,v]of Object.entries(saved))m.setSetting(k,v);}
}
module.exports={verifyMessage15Transport};
