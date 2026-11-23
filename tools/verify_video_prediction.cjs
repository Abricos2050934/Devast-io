// Run the experimental mode through the installed adapter and native fire hook.
function verifyVideoPrediction(m,n,s){
 const check=(value,message)=>{if(!value)throw Error(message);};
 const saved={...m.settings},self=n.world[s['ᅠᏧ‍']],meta=n.world[s['ᴎ︃ᄉ']];
 const previous={id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,meta:meta[2],now:Date.now,performance:performance.now};
 const playerType=n.playerType??0,fields=n.types[playerType][s.curveWeapons||'curveWeapons'];
 const weapon=Object.entries(fields).find(([,v])=>Object.values(v||{}).some(value=>Array.isArray(value)&&value.includes('audio/ak47-shot.mp3')))||Object.entries(fields).find(([,v])=>v?.[s.curveBulletSpeed||'curveBulletSpeed']===1.4);
 check(weapon,'Video mode needs a native gun profile');
 const capture=n.capturePackets();let clock=30000,hudPreview=null;
 function packet(id,x,y,packed){
  if(!n.packet){m.trackPacket(playerType,id,1,x,y,true,0,packed,{x,y});return;}
  const buffer=new ArrayBuffer(22),u8=new Uint8Array(buffer),u16=new Uint16Array(buffer);
  u8[2]=id;u8[3]=1;u8[5]=playerType;u16[3]=1;u16[5]=x;u16[6]=y;u16[7]=x+50;u16[8]=y+50;u16[9]=packed;
  n.packet(buffer,u8,0);
 }
 try{
  Date.now=()=>clock;performance.now=()=>clock;self.id=1;n.network.state=1;m.reconnect.sessionEnded=false;m.observeSocket(null);m.onSessionStart();m.onHandshake();
  meta[2]={[s['а༤̘']]:-1};
  for(const[key,value]of Object.entries({AdaptiveAimEnabled:true,VideoAimEnabled:true,AimBotEnabled:true,AimbotSpearEnabled:false,predictionAutoSpeed:true,predictionLatencyMs:0,videoPingMs:90,videoPingSteps:125,videoAimSteps:2,videoDelayMs:1,videoDelaySendMs:20,autoFire:false,spearAutoThrow:false,JitterEnabled:false,mouseFovEnable:false,lockId:2,TargetTeammate:true}))m.setSetting(key,value);
  for(let i=0;i<8;i++){clock=30000+i*50;n.setClock?.(clock);packet(1,1000+i*5,1000,Number(weapon[0])<<8);packet(2,1350,1050+i*10,0);}
  m.aim.refresh();let result=m.aim.prediction;
  check(result.valid&&result.video?.enabled&&result.video.source==='configured','Video forecast not connected');
  check(result.video.totalDelayMs===111&&Math.abs(result.ox-1046.1)<1e-5,'Video delay does not reach the native position forecast');
  const before=capture.packets.length;for(const value of [100,120,80])check(m.sampleAimRtt(value),'Genuine RTT sample rejected');
  check(capture.packets.length===before,'RTT collection sent a game packet');
  m.aim.refresh();result=m.aim.prediction;check(result.video.source==='measured'&&result.video.samples===3&&result.video.avgPing===100,'Measured RTT average is disconnected');
  m.setSetting('VideoAimHudEnabled',true);m.render(clock);
  const canvas=n.ctx?.canvas||m.overlay,ctx=n.ctx||canvas?.getContext('2d'),paint=[];
  check(ctx,'HUD canvas unavailable');const fill=ctx.fillText;
  try{
   ctx.fillText=function(value,x,y,...rest){paint.push({text:String(value),x,y,align:this.textAlign});return fill.apply(this,[value,x,y,...rest]);};
   m.render(clock);
   check(paint.some(row=>row.text.includes('avgPing: 100.0 ms')&&row.text.includes('3 зам.')),'Measured avgPing is absent from the left HUD');
   check(paint.some(row=>row.text.includes('deltaPing: -20.0 ms')),'HUD deltaPing is incorrect');
   check(paint.filter(row=>/avgPing:|deltaPing:|lead:/.test(row.text)).every(row=>row.x===12&&row.align==='left'),'HUD is not anchored at the left edge');
   if(n.ctx&&canvas.toDataURL)try{hudPreview=canvas.toDataURL('image/png');}catch(_){}
   m.setSetting('VideoAimHudEnabled',false);paint.length=0;m.render(clock);check(!paint.some(row=>row.text.includes('avgPing:')),'HUD toggle failed');
  }finally{ctx.fillText=fill;}
  capture.packets.length=0;if(n.fire)n.fire();else if(m.beforeFire()!==false){capture.packets.push([4]);m.afterFire();}
  const attack=capture.packets.findIndex(packet=>packet[0]===4);check(attack>0&&capture.packets[attack-1][0]===6,'Video angle does not precede the native shot');
  if(n.release)n.release();else m.afterRelease();
  m.onSessionStart();m.onHandshake();m.setSetting('AimbotSpearEnabled',true);
  for(let i=0;i<8;i++){clock=40000+i*50;n.setClock?.(clock);packet(1,1000,1000,5<<8);packet(2,1250,1000+i*10,0);}
  const angle=m.aim.spearResolve();result=m.aim.prediction;
  check(result.valid&&result.video?.enabled&&result.speed===500,'Video spear model is disconnected from the native spear profile');
  check(Math.abs(angle-((result.angle-m.settings.spearStabDeg)%360+360)%360)<1e-7,'Spear packet-angle calibration was lost');
  const folder=m.menu.__folders['Adaptive Aim'].__folders['Video Prediction — эксперимент'];
  check(folder,'Video controls missing');folder.__controllers.find(c=>c.property==='videoAimSteps').setValue(3);check(m.aimTiming().aimSteps===3,'Video control does not affect the model');
  clock+=500;n.setClock?.(clock);m.aim.spearResolve();check(!m.aim.prediction.valid&&!m.aim.targetPlayer,'Stale video target retained');
  return {status:'passed',configured_ping_is_labelled:true,measured_samples_are_explicit:true,gun_native_packets:true,spear_native_speed_and_geometry:true,native_angle_before_shot:true,controls_connected:true,stale_target_released:true,no_additional_ping_packets:true,left_hud_values_and_toggle:true,hud_preview_data_url:hudPreview};
 }finally{capture.restore();Date.now=previous.now;performance.now=previous.performance;m.onSessionStart();m.onHandshake();self.id=previous.id;n.network.state=previous.state;m.reconnect.sessionEnded=previous.ended;meta[2]=previous.meta;Object.assign(m.settings,saved);}
}
module.exports={verifyVideoPrediction};
