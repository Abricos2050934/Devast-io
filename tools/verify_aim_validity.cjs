// Runs in the native browser fixture with its actual sender and direction handlers.
function verifyAimValidity(m,n,s,r) {
 const check=(v,message)=>{if(!v)throw Error(message);};
 const self=n.world[s['ᅠᏧ‍']],savedId=self.id,savedState=n.network.state,clock=n.idleProbe.read();
 const keys=['AimBotEnabled','autoFire','JitterEnabled','lockId','mouseFovEnable'];
 const settings=Object.fromEntries(keys.map(k=>[k,m.settings[k]])),transport=n.capturePackets();
 try{
  n.network.state=1;self.id=1;m.setSetting('JitterEnabled',false);m.setSetting('AimBotEnabled',true);m.setSetting('autoFire',false);m.setSetting('lockId',2);
  m.trackPacket(0,1,1,0,0,false);m.trackPacket(0,2,1,0,0,false);
  m.trackPacket(0,2,1,1200,1000,true);m.aim.refresh();m.beforeFire();check(transport.packets.length===0,'Aim used absent self coordinates');
  m.trackPacket(0,1,1,1000,1000,true);m.aim.refresh();check(JSON.stringify(transport.packets)==='[[6,0]]'&&m.controlsAimDirection,'Valid target failed to acquire direction');
  m.trackPacket(0,2,1,0,0,false);m.setSetting('autoFire',true);transport.packets.length=0;
  for(let i=0;i<50;i++)m.aim.refresh();m.beforeFire();
  check(transport.packets.length===0&&!m.controlsAimDirection,'Removed target still generated combat packets');
  // Incoming opcode 5 is game-over. This actual native outgoing 5 is the
  // release command, and must not be removed from a press/release cycle.
  n.release();check(JSON.stringify(transport.packets)==='[[5]]','Native release opcode changed');
  check(!m.connectionInfo().sessionEnded,'Native release was treated as incoming death');
  transport.packets.length=0;
  n.idleProbe.setNow(clock.now+1000);n.input.angle=Math.PI/2;n.network[s['ѕ᠋༢']]();n.network[s['ρ٨٨']]();
  check(transport.packets.some(p=>p[0]===6),'Native pointer direction stayed suppressed after losing the target');
  transport.packets.length=0;m.setSetting('autoFire',false);m.trackPacket(0,2,1,1200,1000,true);m.aim.refresh();
  check(JSON.stringify(transport.packets)==='[[6,0]]','Reacquisition hid an equal angle after native pointer control resumed');
  m.trackPacket(0,1,1,0,0,false);transport.packets.length=0;m.aim.refresh();m.beforeFire();check(transport.packets.length===0,'Removed self slot still generated aim');
  m.trackPacket(0,1,1,1000,1000,true);m.setSetting('lockId',1);m.aim.refresh();check(transport.packets.length===0&&!m.controlsAimDirection,'Self lock generated a direction');
  return {status:'passed',removed_target:true,missing_or_removed_self:true,native_pointer_resumes:true,reacquisition_reasserts:true,self_lock_rejected:true,outgoing_5_is_native_release:true};
 }finally{
  transport.restore();n.idleProbe.restore(clock);self.id=savedId;n.network.state=savedState;
  for(const [k,v]of Object.entries(settings))m.setSetting(k,v);
 }
}
module.exports={verifyAimValidity};
