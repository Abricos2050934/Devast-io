// Native codec and socket path with a fixture player. No live connection.
function verifyMovementOwnership(m,n,s){
 const check=(value,message)=>{if(!value)throw Error(message);},self=n.world[s['ᅠᏧ‍']],old={id:self.id,state:n.network.state};
 const capture=n.capturePackets(),packets=capture.packets;
 function strafe(mask){m.onMove(mask);m.setSetting('AntiAimbot',true);m.aimModule.antiTick();check(packets.some(p=>p[0]===2),'Strafe did not use the native codec');packets.length=0;}
 try{
  self.id=1;n.network.state=1;m.reconnect.awaitingPlay=false;m.reconnect.sessionEnded=false;m.observeSocket(null);
  strafe(5);m.setSetting('AntiAimbot',false);check(JSON.stringify(packets)==='[[2,5]]','Disabling strafe lost the physical direction');
  m.setSetting('AntiAimbot',false);check(packets.length===1,'Disabling strafe repeated the restore');packets.length=0;
  strafe(1);m.onMove(4);m.setSetting('AntiAimbot',false);check(packets.length===0,'A native direction was overwritten after strafe');
  strafe(5);m.settings.AntiAimbot=false;m.step(performance.now());check(JSON.stringify(packets)==='[[2,5]]','Settings reset kept strafe movement');packets.length=0;
  strafe(0);m.dispose();check(JSON.stringify(packets)==='[[2,0]]','Disposal kept the last strafe direction');
  m.dispose();check(packets.length===1&&m.beforeFire()===true,'Disposal repeated a command or blocked native fire');
  return {status:'passed',scope:'native codec and fixture socket; no live server',restores_physical_mask:true,native_move_supersedes:true,settings_reset_restores:true,dispose_restores_once:true};
 }finally{n.network.state=old.state;self.id=old.id;capture.restore();}
}
module.exports={verifyMovementOwnership};
