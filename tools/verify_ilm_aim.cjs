// Independent execution of the five original declarations from the ILM upload.
function verifyIlmAim(m,n,s,reference){
 const check=(v,t)=>{if(!v)throw Error(t);},nativeWorld=n.world,self=nativeWorld[s['ᅠᏧ‍']],metadata=nativeWorld[s['ᴎ︃ᄉ']],clans=nativeWorld[s['ﾠࡅ‍']];
 const saved={...m.settings},oldId=self.id,oldState=n.network.state,oldReconnect={...m.reconnect},oldMeta=[1,2,3,120].map(id=>[id,metadata[id]]),oldClan=clans[0],capture=n.capturePackets(),expected=[];
 const settings={...m.settings},world={PLAYER:{id:1,team:-1},players:Array.from({length:65536},()=>({team:-1}))};
 const create=new Function('settings','world','send','const _0x225287=()=>{throw Error("Live decoder")},_0x349c=_0x225287;const _0x2ea565=settings,_0x10898e=world,_0x4c996c=send;'+reference.blocks.map(b=>b.source).join('\n')+';const _0x6cc5f2=new _0x3e2cd1(),_0x41e779=new _0x4b5d6f();return {targets:_0x6cc5f2,aim:_0x41e779,tick:_0x4a7389};');
 const ref=create(settings,world,p=>expected.push(p[0]===6?[6,(Math.round(p[1])%360+360)%360]:p.slice()));let points=0;
 const state=e=>JSON.stringify({lastId:e.targets.lastId,angle:e.aim.lastAngle,target:e.aim.targetPlayer?.id,lines:e.targets.lines,players:e.targets.players.filter(t=>t.active),ghouls:e.targets.ghouls.filter(t=>t.active)});
 function compare(label){check(state(m)===state(ref),'Original ILM state differs: '+label);check(JSON.stringify(capture.packets)===JSON.stringify(expected),'Original ILM packets differ '+label+': '+JSON.stringify({actual:capture.packets,source:expected}));capture.packets.length=expected.length=0;points++;}
 function track(type,id,x,y,active=true){m.trackPacket(type===13?13:(n.playerType??0),type===13?0:id,type===13?id:1,x,y,active);const p=(type===13?ref.targets.ghouls:ref.targets.players)[id];if(active)p.update(x,y);else p.setInactive();compare('packet '+type+'/'+id);}
 try{
  n.network.state=1;self.id=1;m.reconnect.sessionEnded=false;m.observeSocket(null);clans[0]={[s['ոᚄރ']]:7};
  for(let scene=0;scene<48;scene++){
   // Controlled fresh histories for each independent scene, not an algorithm change.
   for(const e of [m,ref]){for(const p of [...e.targets.players,...e.targets.ghouls])if(p.active)p.setInactive();e.aim.targetPlayer=null;e.aim.lastAngle=0;e.targets.lastId=0;e.targets.mouseMapCords={x:1400,y:1100};for(const line of e.targets.lines)line.reset();}
   m.onHandshake();self.id=world.PLAYER.id=1;
   for(const[k,v]of Object.entries({AimBotEnabled:scene%7!==0,autoFire:scene%3===0,target:['players','ghouls','all'][scene%3],lockId:[-1,0,2,120][scene%4],mouseFovEnable:scene%2===0,mouseFov:scene%5===0?50:12345,distanceCoefficient:100+scene*10,offsetCoefficient:(scene%4)*.2,visualizeResolving:scene%3!==1})){m.setSetting(k,v);settings[k]=v;}
   const own=scene%4===0?0:-1;world.PLAYER.team=own;
   for(const id of [1,2,3,120]){const team=id===1?own:(id===2&&scene%6===0?0:-1);metadata[id]={[s['а༤̘']]:team,[s['ᴌ̗ⲟ']]:7};world.players[id].team=team;}
   capture.packets.length=expected.length=0;
   for(let step=0;step<8;step++){
    track(0,1,1000+step*5,1000);track(0,2,1400+(step%3)*15,1100+step*12);track(0,3,1600-step*9,1200-step*4);track(0,120,1800,1250);track(13,17,1250+step*5,1300-step*7);
    m.aim.refresh();ref.tick();compare('timer '+scene+'/'+step);
    if(step===4){m.afterFire();m.afterRelease();compare('manual native callbacks');}
   }
   self.id=world.PLAYER.id=0;m.aim.refresh();ref.tick();compare('original id=0 reset');
  }
  self.id=1;m.onHandshake();m.reconnect.sessionEnded=false;for(const[k,v]of Object.entries({AimBotEnabled:true,autoFire:true,target:'players',lockId:2,mouseFovEnable:false}))m.setSetting(k,v);
  m.trackPacket(n.playerType??0,1,1,1000,1000,true);m.trackPacket(n.playerType??0,2,1,1500,1100,true);m.trackPacket(n.playerType??0,2,1,1600,1100,true);m.trackPacket(n.playerType??0,2,1,1500,1100,true);
  const socket={readyState:1,bufferedAmount:8192};m.observeSocket(socket);capture.packets.length=0;m.aim.refresh();check(capture.packets.length===0,'Blocked ILM tick sent packets');
  for(const bytes of [1,16,128,1024,4095]){socket.bufferedAmount=bytes;capture.packets.length=0;m.aim.refresh();check(JSON.stringify(capture.packets.map(p=>p[0]))==='[6,4,5]','Small queue changed original ILM cycle');}
  capture.packets.length=0;let reads=0;Object.defineProperty(socket,'bufferedAmount',{configurable:true,get(){reads++;return capture.packets.length?4096:0;}});m.aim.refresh();check(reads===1&&JSON.stringify(capture.packets.map(p=>p[0]))==='[6,4,5]','ILM release was split from attack');
  let nativeOwnership=false;
  if(n.directionProbes?.length){
   socket.readyState=1;Object.defineProperty(socket,'bufferedAmount',{value:0,configurable:true});m.observeSocket(socket);m.setSetting('autoFire',false);
   for(const probe of n.directionProbes){capture.packets.length=0;probe(Math.PI/2);check(capture.packets.length===0,'Native pointer fought ILM');}
   m.setSetting('AimBotEnabled',false);for(const probe of n.directionProbes){capture.packets.length=0;probe(Math.PI/2);check(JSON.stringify(capture.packets)==='[[6,90]]','Disabling ILM did not return native mouse control');}nativeOwnership=true;
  }
  capture.packets.length=0;m.observeDeath([5,0,2]);m.aim.refresh();m.afterFire();m.afterRelease();check(capture.packets.length===0,'Server death generated ILM commands');
  return {status:'passed',upload_sha256:reference.upload_sha256,scenes:48,comparison_points:points,exact_states:true,exact_normalized_packets:true,original_timer_ms:50,whole_auto_fire_cycle:true,small_queue_admission:true,native_direction_ownership:nativeOwnership,server_death_sends_no_commands:true};
 }finally{capture.restore();m.observeSocket(null);Object.assign(m.reconnect,oldReconnect);m.onHandshake();self.id=oldId;n.network.state=oldState;for(const[id,value]of oldMeta)metadata[id]=value;clans[0]=oldClan;for(const[k,v]of Object.entries(saved))m.setSetting(k,v);}
}
module.exports={verifyIlmAim};
