// Portable browser/fixture check of the installed predictor and native hooks.
function verifyBallistics(m,n,s){
 const check=(v,text)=>{if(!v)throw Error(text);},saved={...m.settings},self=n.world[s['ᅠᏧ‍']],meta=n.world[s['ᴎ︃ᄉ']];
 const old={id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,now:Date.now,performance:performance.now,meta:meta[2],input:n.input?.angle};
 let clock=30000;const capture=n.capturePackets(),set=(key,value)=>m.setSetting(key,value),playerType=n.playerType??0;
 const fields=n.types[playerType][s.curveWeapons||'curveWeapons'];
 const weapon=Object.entries(fields).find(([,v])=>v?.[s.curveBulletSpeed||'curveBulletSpeed']===1.4&&v.path===900);
 check(weapon,'Native weapon speed/range metadata unavailable');const weaponId=Number(weapon[0]);
 function packet(type,id,generation,x,y,extra=0,state=1,entityId=0){
  if(!n.packet){m.trackPacket(type,id,generation,x,y,true,0,extra,{x,y,state,entityId});return;}
  const buffer=new ArrayBuffer(22),u8=new Uint8Array(buffer),u16=new Uint16Array(buffer);u8[2]=id;u8[3]=generation;u8[5]=type;
  u16[3]=state;u16[4]=entityId;u16[5]=x;u16[6]=y;u16[7]=x+50;u16[8]=y+50;u16[9]=extra;n.packet(buffer,u8,0);
 }
 try{
  Date.now=()=>clock;performance.now=()=>clock;n.setClock?.(clock);self.id=1;n.network.state=1;m.reconnect.sessionEnded=false;m.observeSocket(null);m.onSessionStart();m.onHandshake();
  meta[2]={[s['а༤̘']]:-1};if(n.input)n.input.angle=Math.PI;
  for(const[key,value]of Object.entries({AdaptiveAimEnabled:true,AimBotEnabled:true,AimbotSpearEnabled:false,predictionAutoSpeed:true,predictionLatencyMs:0,autoFire:false,JitterEnabled:false,mouseFovEnable:false,lockId:2,TargetTeammate:true}))set(key,value);
  for(let i=0;i<8;i++){clock=30000+i*50;n.setClock?.(clock);packet(playerType,1,1,1000+i*5,1000,weaponId<<8);packet(playerType,2,1,1400,1050+i*10);}
  m.aim.refresh();let prediction=m.aim.prediction;
  check(prediction.valid&&prediction.source==='native-weapon'&&prediction.speed===1400,'Native weapon model is disconnected');
  check(Math.abs(prediction.selfVelocity.x-100)<1e-6&&Math.abs(prediction.targetVelocity.y-200)<1e-6,'Time-based self/target velocity is incorrect');
  check(prediction.ox===1035,'Interpolation destination was used instead of server position');
  packet(n.projectileType??2,1,1,1085,1000,4,(150<<8)|1,37);m.aim.refresh();prediction=m.aim.prediction;
  check(prediction.source==='server-projectiles'&&prediction.speed===1500,'Native projectile speed did not calibrate the equipped weapon');
  if(n.packet&&n.projectileSpeedKey){const bullet=n.entities.get(1,37,1,2);check(bullet[n.projectileSpeedKey]*1000===prediction.speed,'Predictor speed differs from the actual native projectile speed');}
  for(const spin of [false,true]){
   set('JitterEnabled',spin);capture.packets.length=0;if(n.fire)n.fire();else if(m.beforeFire()!==false){capture.packets.push([4]);m.afterFire();}
   const attack=capture.packets.findIndex(p=>p[0]===4);check(attack>0&&capture.packets[attack-1][0]===6,'Physical angle did not precede the actual native shot');
   check(Math.abs(capture.packets[attack-1][1]-m.aim.lastAngle)<1e-7,'Native fire used a different angle');
   const line=m.targets.lines[0],angle=((Math.atan2(line.y2-line.y1,line.x2-line.x1)*180/Math.PI)%360+360)%360;check(Math.abs(angle-m.aim.lastAngle)<1e-7,'Prediction line differs from the shot');
   if(n.release)n.release();else m.afterRelease();
  }
  set('JitterEnabled',false);clock+=500;n.setClock?.(clock);capture.packets.length=0;m.aim.refresh();check(!m.aim.targetPlayer&&!m.controlsAimDirection,'Stale physical target kept angle ownership');
  check(!capture.packets.some(p=>p[0]===4),'Stale target emitted an automatic attack');
  return {status:'passed',native_weapon_speed_and_range:true,native_projectile_speed:true,native_speed_equality:!!n.projectileSpeedKey,packet_server_positions:true,shooter_and_target_velocity:true,fresh_angle_before_native_attack:true,jitter_priority:true,line_matches_shot:true,stale_target_releases_input:true};
 }finally{capture.restore();Date.now=old.now;performance.now=old.performance;m.settings.AimBotEnabled=false;m.settings.autoFire=false;m.onSessionStart();m.onHandshake();self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;meta[2]=old.meta;if(n.input)n.input.angle=old.input;Object.assign(m.settings,saved);}
}
module.exports={verifyBallistics};
