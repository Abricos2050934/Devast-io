// Independent circular-motion oracle for the installed legacy engine at the
// native codec boundary. It uses atan2(sin(delta), cos(delta)) for shortest arcs.
function verifyAimAngleDomain(m,n,s){
 const check=(v,t)=>{if(!v)throw Error(t);},self=n.world[s['ᅠᏧ‍']],meta=n.world[s['ᴎ︃ᄉ']];
 const old={settings:{...m.settings},id:self.id,state:n.network.state,ended:m.reconnect.sessionEnded,metadata:[meta[1],meta[2]],date:Date.now,performance:performance.now};
 let clock=700000,steps=0,worstError=0,capture;
 const canonical=x=>(x%360+360)%360;
 const error=(a,b)=>Math.abs(Math.atan2(Math.sin((a-b)*Math.PI/180),Math.cos((a-b)*Math.PI/180))*180/Math.PI);
 try{
  Date.now=()=>clock;performance.now=()=>clock;self.id=1;n.network.state=1;m.reconnect.sessionEnded=false;m.observeSocket(null);
  for(const id of [1,2])meta[id]={[s['а༤̘']]:-1};
  capture=n.capturePackets();
  for(const direction of [-1,1])for(const smooth of [.05,.74,1]){
   m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();
   Object.assign(m.settings,{AdaptiveAimEnabled:false,AimBotEnabled:false,AimbotSpearEnabled:false,JitterEnabled:false,AntiAimbot:false,autoFire:false,hideAimbotAngle:direction<0,mouseFovEnable:false,lockId:2,offsetCoefficient:0,aimSmooth:smooth});
   clock+=1000;n.setClock?.(clock);m.trackPacket(n.playerType??0,1,1,1000,1000,true);m.trackPacket(n.playerType??0,2,1,1500,1000,true);m.settings.AimBotEnabled=true;m.aim._smoothAngle=0;
   let expected=0;
   for(let step=1;step<=1080;step++){
    clock+=50;n.setClock?.(clock);const rad=direction*step*Math.PI/180,x=1000+500*Math.cos(rad),y=1000+500*Math.sin(rad),bearing=Math.atan2(y-1000,x-1000)*180/Math.PI;
    const delta=Math.atan2(Math.sin((bearing-expected)*Math.PI/180),Math.cos((bearing-expected)*Math.PI/180))*180/Math.PI;expected=canonical(expected+delta*smooth);
    m.trackPacket(n.playerType??0,2,1,x,y,true);const angle=m.aim.lastAngle,gap=error(angle,expected);worstError=Math.max(worstError,gap);
    check(angle>=0&&angle<360,'Legacy angle escaped canonical domain at '+direction+'/'+smooth+'/'+step);
    check(gap<1e-8,'Legacy aim took the wrong arc at '+direction+'/'+smooth+'/'+step);steps++;
   }
  }
  const sustained=capture.packets.length;check(sustained>=6480,'Circular fixture did not emit source directions');
  check(capture.packets.every(p=>p[0]===6&&p[1]>=0&&p[1]<360),'Noncanonical angle reached the native codec');
  for(const value of [17.125,359.999,360,720.25,-.25,-720.5]){
   m.aim.send([6,value]);const packet=capture.packets.at(-1);check(packet[0]===6&&packet[1]===(value>=0&&value<360?value:canonical(value)),'Source boundary changed valid fractional precision');
  }
  const before=capture.packets.length;for(const value of [NaN,Infinity,-Infinity])m.aim.send([6,value]);check(capture.packets.length===before,'Non-finite source angle was sent');
  return {status:'passed',scope:'native codec-input capture; no live server enforcement test',steps,sustained_directions:sustained,rotations_per_scene:3,smoothing_values:[.05,.74,1],both_directions:true,short_arc_oracle:true,all_angles_canonical:true,fractional_precision_retained:true,invalid_angles_rejected:true,worst_oracle_error_degrees:worstError};
 }finally{
  capture?.restore();Date.now=old.date;performance.now=old.performance;m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();self.id=old.id;n.network.state=old.state;m.reconnect.sessionEnded=old.ended;[meta[1],meta[2]]=old.metadata;Object.assign(m.settings,old.settings);m.observeSocket(null);
 }
}
module.exports={verifyAimAngleDomain};
