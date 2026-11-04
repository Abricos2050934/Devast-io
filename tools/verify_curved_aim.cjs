// Native-browser geometry check with the real weapon registry and shot handlers.
function verifyCurvedAim(m,n,s,r,e) {
 const check=(value,message)=>{if(!value)throw Error(message);},self=n.world[s['ᅠᏧ‍']];
 const settings=Object.fromEntries(['AimBotEnabled','CurvedAimEnabled','autoFire','JitterEnabled','lockId','mouseFovEnable','offsetCoefficient'].map(k=>[k,m.settings[k]]));
 const savedNow=performance.now.bind(performance),savedWeapon=e[s['Іࡈ５']],savedId=self.id,savedState=n.network.state,transport=n.capturePackets();let now=0;
 const results=[];
 const radius=160,omega=.35/radius,phase=1.2;
 function position(t,own){const angle=omega*t-(own?phase:0),rad=own?radius*1.15:radius;return {x:2000+rad*Math.cos(angle),y:2000+rad*Math.sin(angle)};}
 function miss(angle,speed){const origin=position(now,true),a=angle*Math.PI/180;let minimum=Infinity;for(let t=0;t<=900/speed;t+=.5){const p=position(now+t,false);minimum=Math.min(minimum,Math.hypot(p.x-origin.x-speed*t*Math.cos(a),p.y-origin.y-speed*t*Math.sin(a)));}return minimum;}
 try{
  performance.now=()=>now;n.network.state=1;self.id=1;
  const weapons=n.types[0]?.[s.curveWeapons];check(Array.isArray(weapons),'Native curve weapon table missing');
  const toggle=m.menu.__folders.Prediction?.__controllers.find(c=>c.property==='CurvedAimEnabled');check(!!toggle,'Curve prediction control missing');
  for(const speed of [1.4,1.45]){
   const index=weapons.findIndex(w=>w?.[s.curveBulletSpeed]===speed&&w.path===900);check(index>=0,'Native curve speed/range mapping failed');
   e[s['Іࡈ５']]=index;e[s['е̝ހ']]=0;m.setSetting('AimBotEnabled',false);m.setSetting('AimBotEnabled',true);m.setSetting('JitterEnabled',false);m.setSetting('autoFire',false);m.setSetting('lockId',2);m.setSetting('mouseFovEnable',false);m.setSetting('offsetCoefficient',.1);toggle.setValue(true);
   m.trackPacket(0,1,1,0,0,false);m.trackPacket(0,2,1,0,0,false);m.render();
   for(let i=0;i<24;i++){
    now=i*50;const a=position(now,true),b=position(now,false);
    m.trackPacket(0,1,1,Math.round(a.x),Math.round(a.y),true);m.trackPacket(0,2,1,Math.round(b.x),Math.round(b.y),true);m.aim.resolve();
   }
   now+=40;toggle.setValue(false);const legacy=m.aim.resolve();toggle.setValue(true);transport.packets.length=0;m.aim.refresh();
   check(m.curvedAimMode==='curve','Curved chasing model failed to activate on native records');
   const angle=transport.packets.at(-1)?.[1];check(Number.isFinite(angle),'No native curve direction');
   const oldMiss=miss(legacy,speed),newMiss=miss(angle,speed);check(newMiss<15&&newMiss<oldMiss,'Curve intercept did not improve chasing geometry');
   e.angle=-2;e[r['ᴑ٧ߓ']]=-1;n.update(e);check(Math.abs(e.angle-angle*Math.PI/180)<1e-7,'Curve line and self rotation diverged');
   transport.packets.length=0;n.input.angle=-2;n.network[r['ᴎ༩༣']]();check(JSON.stringify(transport.packets)===JSON.stringify([[6,angle],[4]]),'First native curve shot did not align with its line');check(n.input.angle===-2,'Curved prediction changed native movement input');
   results.push({speed,legacy_miss:oldMiss,curved_miss:newMiss,mode:m.curvedAimMode});
  }
  return {status:'passed',guns:results,shooter_and_target:'both_moving_around_same_obstacle',obstacle_collision:'not_simulated'};
 }finally{
  performance.now=savedNow;e[s['Іࡈ５']]=savedWeapon;self.id=savedId;n.network.state=savedState;transport.restore();
  for(const [key,value]of Object.entries(settings))m.setSetting(key,value);
 }
}
module.exports={verifyCurvedAim};
