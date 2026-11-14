const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
function scene(){const f=fixture();for(const[k,v]of Object.entries({AimBotEnabled:false,mouseFovEnable:false,lockId:2,offsetCoefficient:0}))f.mod.setSetting(k,v);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1000,true);f.mod.setSetting('AimBotEnabled',true);f.mod.aimModule.refreshTargets();f.packets.length=0;return f;}
const canonical=x=>(x%360+360)%360,angularError=(a,b)=>Math.abs(Math.atan2(Math.sin((a-b)*Math.PI/180),Math.cos((a-b)*Math.PI/180))*180/Math.PI);
for(const direction of [-1,1])for(const smooth of [.05,.74,1])test('legacy smoothing and sent directions follow the shortest arc for three full turns: '+direction+'/'+smooth,()=>{
 const f=scene();try{f.mod.setSetting('aimSmooth',smooth);f.mod.aim._smoothAngle=0;let reference=0;
  for(let step=1;step<=1080;step++){
   f.setClock(1000+step*50);const a=direction*step*Math.PI/180,px=1000+500*Math.cos(a),py=1000+500*Math.sin(a),bearing=Math.atan2(py-1000,px-1000)*180/Math.PI;
   const delta=Math.atan2(Math.sin((bearing-reference)*Math.PI/180),Math.cos((bearing-reference)*Math.PI/180))*180/Math.PI;reference=canonical(reference+delta*smooth);
   f.mod.trackPacket(1,2,1,px,py,true);const angle=f.mod.aim.lastAngle;
   assert.ok(angle>=0&&angle<360,'Calculated direction left the canonical domain at '+step+': '+angle);
   assert.ok(angularError(angle,reference)<1e-8,'Wrong rotation at '+step+': '+angle+' vs '+reference);
  }
  assert.ok(f.packets.length>1000);assert.ok(f.packets.every(p=>p[0]===6&&p[1]>=0&&p[1]<360));
 }finally{f.mod.dispose();}
});
test('every source angle is canonical at the wire boundary without quantizing valid fractional angles',()=>{
 const f=scene(),wire=[];try{f.B.aimSend=packet=>wire.push(packet.slice());for(const value of [0,17.125,359.999,360,720.25,-.25,-720.5]){
  f.mod.aim.send([6,value]);const sent=wire.at(-1);assert.equal(sent[0],6);assert.equal(sent[1],value>=0&&value<360?value:canonical(value));
 }const count=wire.length;for(const value of [NaN,Infinity,-Infinity])f.mod.aim.send([6,value]);assert.equal(wire.length,count);
 }finally{f.mod.dispose();}
});
test('full browser oracle also verifies the installed source at the codec boundary',()=>{
 const f=fixture(),s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘'].map(k=>[k,k]));try{const r=require('../tools/verify_aim_angle_domain.cjs').verifyAimAngleDomain(f.mod,{...f.B,playerType:1,setClock:f.setClock,capturePackets:()=>({packets:f.packets,restore(){}})},s);assert.equal(r.steps,6480);assert.equal(r.all_angles_canonical,true);}finally{f.mod.dispose();}
});
