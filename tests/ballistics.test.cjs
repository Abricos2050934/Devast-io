const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function model(){
 const context=vm.createContext({});
 const source=fs.readFileSync(process.env.DEVAST_TEST_CANDIDATE?require('path').join(process.env.DEVAST_TEST_CANDIDATE,'ilm-aim.js'):'mod/ilm-aim.js','utf8');
 vm.runInContext(source,context);let now=0;
 const settings={bulletSpeedCoefficient:1.5,predictionAutoSpeed:true,predictionLatencyMs:0};
 return {aim:context.__createBallisticAim(settings,()=>now),settings,at(t){now=t;}};
}
function close(actual,expected,tolerance=1e-7){assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);}
function samples(m,sv={x:0,y:0},tv={x:0,y:200},position={x:600,y:0}){
 for(const t of [0,50,100,150,200]){m.at(t);m.aim.track('self',sv.x*t/1000,sv.y*t/1000,true,{weapon:10});m.aim.track('target',position.x+tv.x*t/1000,position.y+tv.y*t/1000,true);}
}
test('a stationary target is intercepted at distance divided by speed',()=>{
 const m=model();samples(m,{x:0,y:0},{x:0,y:0});const r=m.aim.resolve('self','target');
 assert.ok(r.valid);close(r.distance,600);close(r.flight,.4);close(r.angle,0);
});
test('transverse motion uses the actual interception time, rather than distance / speed alone',()=>{
 const m=model();samples(m,{x:0,y:0},{x:0,y:300},{x:600,y:-60});const r=m.aim.resolve('self','target');
 close(r.flight,600/Math.sqrt(1500**2-300**2));close(r.y,300*r.flight);close(Math.sin(r.angle*Math.PI/180),.2);
});
test('approaching and receding targets have different physical flight times',()=>{
 for(const vx of [-300,300]){const m=model();samples(m,{x:0,y:0},{x:vx,y:0},{x:600-vx*.2,y:0});const r=m.aim.resolve('self','target');close(r.flight,600/(1500-vx));}
});
test('movement of the shooter changes the launch origin during packet age and network delay',()=>{
 const m=model();m.settings.predictionLatencyMs=100;samples(m,{x:0,y:200},{x:0,y:100},{x:600,y:100});m.at(250);
 const r=m.aim.resolve('self','target');close(r.oy,70);assert.ok(r.valid);close(r.selfVelocity.y,200);
 close(r.y,100+100*(.2+.15+r.flight));
 // Bullets keep their server-specified world velocity; shooter walking is not
 // incorrectly subtracted from the target velocity for the whole bullet flight.
 close((r.y-r.oy)/Math.hypot(r.x-r.ox,r.y-r.oy),Math.sin(r.angle*Math.PI/180));
});
test('the same path sampled at different server rates gives the same angle',()=>{
 const results=[];
 for(const times of [[0,50,100,150,200],[0,40,80,120,160,200],[0,65,130,200]]){
  const m=model();for(const t of times){m.at(t);m.aim.track('self',t*.1,0,true);m.aim.track('target',600,t*.2,true);}results.push(m.aim.resolve('self','target').angle);
 }
 for(const angle of results)close(angle,results[0]);
});
test('a stable circular path predicts the curved interception rather than its old tangent',()=>{
 const m=model();for(let i=0;i<=8;i++){const t=i*.05;m.at(t*1000);m.aim.track('self',0,0,true);m.aim.track('target',600+160*(Math.cos(t)-1),160*Math.sin(t),true);}
 const r=m.aim.resolve('self','target');assert.ok(r.valid);assert.equal(r.motionModel,'circle');
 close(r.x,600+160*(Math.cos(.4+r.flight)-1),1e-5);close(r.y,160*Math.sin(.4+r.flight),1e-5);
});
for(const duplicateGap of [0,1,7])test('coalesced packets cannot confirm a circular path at '+duplicateGap+'ms',()=>{
 const m=model(),position=t=>[600+160*(Math.cos(t/1000)-1),160*Math.sin(t/1000)];
 for(let t=0;t<=300;t+=50){m.at(t);m.aim.track('self',0,0,true);m.aim.track('target',...position(t),true);}
 assert.equal(m.aim.resolve('self','target').motionModel,'linear');
 for(let i=0;i<12;i++){
  m.at(300+duplicateGap);m.aim.track('target',...position(300+duplicateGap),true);
  assert.equal(m.aim.resolve('self','target').motionModel,'linear','Duplicate observations are not independent windows');
 }
 m.at(350);m.aim.track('self',0,0,true);m.aim.track('target',...position(350),true);
 assert.equal(m.aim.resolve('self','target').motionModel,'circle');
});
test('zero-time duplicate packets do not manufacture an infinite velocity',()=>{
 const m=model();m.aim.track('a',0,0,true);m.aim.track('a',100,50,true);const v=m.aim.motion('a');close(v.vx,0);close(v.vy,0);assert.equal(v.samples,1);
});
test('a continuous dense packet stream still accumulates timed motion observations',()=>{
 const m=model();
 for(let t=0;t<=200;t++){
  m.at(t);m.aim.track('self',0,0,true);m.aim.track('target',600,t*.2,true);
 }
 const v=m.aim.motion('target');assert.ok(v.samples>=4);close(v.vy,200);
 const r=m.aim.resolve('self','target');assert.ok(r.valid);close(r.targetVelocity.y,200);
});
test('a stop and a reversal discard the obsolete motion direction immediately',()=>{
 const m=model();samples(m);m.at(250);m.aim.track('target',600,40,true);close(m.aim.motion('target').vy,0);
 m.at(300);m.aim.track('target',600,30,true);close(m.aim.motion('target').vy,-200);
});
test('teleports, generation reuse and long gaps restart velocity estimation',()=>{
 const m=model();samples(m);m.at(250);m.aim.track('target',5000,5000,true);close(m.aim.motion('target').vx,0);
 m.at(300);m.aim.track('target',5010,5000,true,{generation:1});
 m.at(350);m.aim.track('target',5020,5000,true,{generation:2});close(m.aim.motion('target').vx,0);
 m.at(1000);m.aim.track('target',5100,5000,true);close(m.aim.motion('target').vx,0);
});
test('stale, removed and reset targets are not reported as valid intercepts',()=>{
 const m=model();samples(m);m.at(551);assert.equal(m.aim.resolve('self','target').valid,false);
 m.aim.track('target',0,0,false);assert.equal(m.aim.motion('target'),null);m.aim.reset();assert.equal(m.aim.motion('self'),null);
});
test('a target faster than the bullet and moving away is unreachable',()=>{
 const m=model();m.settings.bulletSpeedCoefficient=.5;samples(m,{x:0,y:0},{x:1000,y:0});const r=m.aim.resolve('self','target');assert.equal(r.valid,false);assert.equal(r.status,'unreachable');
});
test('quadratic degeneracy, tangency and negative intercept times remain finite',()=>{
 const {aim}=model();close(aim.intercept(100,0,-100,0,100),.5);assert.equal(aim.intercept(100,0,100,0,100),null);
 assert.equal(aim.intercept(100,100,200,0,100),null);assert.equal(aim.intercept(0,0,0,0,100),0);
 assert.equal(aim.intercept(1,1,0,0,NaN),null);
});
test('projectile speed averages distinct server projectiles and keeps weapons separate',()=>{
 const m=model();for(const [id,speed]of [['a',1400],['b',1500],['c',1600]])m.aim.projectile(id,10,speed);
 m.aim.projectile('a',10,9999);m.aim.projectile('d',11,2000);close(m.aim.speedFor(10).speed,1500);close(m.aim.speedFor(11).speed,2000);
 assert.equal(m.aim.speedFor(10).samples,3);assert.equal(m.aim.speedFor(10).source,'server-projectiles');
});
test('old speed calibration expires and manual speed takes effect when automatic calibration is disabled',()=>{
 const m=model();m.aim.projectile('a',10,1000);m.settings.predictionAutoSpeed=false;m.settings.bulletSpeedCoefficient=2;close(m.aim.speedFor(10).speed,2000);
 m.settings.predictionAutoSpeed=true;m.at(300001);close(m.aim.speedFor(10).speed,2000);
});
function adaptiveScene(){
 const f=fixture({dom:true,adaptive:true});f.B.categories.projectile=3;f.B.input={angle:0};
 f.B.types={1:{curveWeapons:{10:{curveBulletSpeed:1.4,path:900},11:{curveBulletSpeed:1.5,path:1100}}}};
 f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('mouseFovEnable',false);
 for(const t of [0,50,100,150,200]){f.setClock(t);f.mod.trackPacket(1,1,1,1000,1000,true,0,10<<8);f.mod.trackPacket(1,2,1,1600,1000+t*.2,true,0,0);}
 return f;
}
test('the installed adaptive default uses native weapon speed and range immediately',()=>{
 const f=adaptiveScene();assert.equal(f.mod.settings.AdaptiveAimEnabled,true);f.mod.aim.refresh();const r=f.mod.aim.prediction;
 assert.ok(r.valid);assert.equal(r.source,'native-weapon');assert.equal(r.speed,1400);
 f.mod.trackPacket(1,2,1,3000,1000,true,0,0);f.mod.aim.refresh();assert.equal(f.mod.aim.targetPlayer,null);assert.equal(f.mod.aim.prediction.status,'unreachable');f.mod.dispose();
});
test('actual GUI controls change speed, delay, automatic calibration and mode, and persist',()=>{
 const f=adaptiveScene(),folder=menu(f).__folders['Adaptive Aim'];
 control(folder,'predictionAutoSpeed').setValue(false);control(folder,'bulletSpeedCoefficient').setValue(1);f.mod.aim.refresh();const a=f.mod.aim.lastAngle;
 control(folder,'bulletSpeedCoefficient').setValue(2);f.mod.aim.refresh();assert.ok(f.mod.aim.lastAngle<a);
 const b=f.mod.aim.lastAngle;control(folder,'predictionLatencyMs').setValue(150);f.mod.aim.refresh();assert.ok(f.mod.aim.lastAngle>b);
 control(folder,'AdaptiveAimEnabled').setValue(false);const g=fixture({adaptive:true,saved:Object.fromEntries(f.storage)});assert.equal(g.mod.settings.AdaptiveAimEnabled,false);assert.equal(g.mod.settings.predictionLatencyMs,150);
 assert.throws(()=>f.mod.setSetting('predictionLatencyMs',501));assert.throws(()=>f.mod.setSetting('bulletSpeedCoefficient',NaN));f.mod.dispose();g.mod.dispose();
});
test('native packed projectile speed calibrates only our distinct projectiles, separately by equipped weapon',()=>{
 const f=adaptiveScene();f.mod.trackPacket(3,2,1,0,0,true,0,0,{state:(100<<8)|1,entityId:37});f.mod.aim.refresh();assert.equal(f.mod.aim.prediction.source,'native-weapon');
 f.mod.trackPacket(3,1,1,0,0,true,0,0,{state:(150<<8)|1,entityId:37});f.mod.trackPacket(3,1,1,0,0,true,0,0,{state:(200<<8)|1,entityId:37});f.mod.aim.refresh();
 assert.equal(f.mod.aim.prediction.source,'server-projectiles');assert.equal(f.mod.aim.prediction.speed,1500);assert.equal(f.mod.aim.prediction.samples,1);
 f.mod.trackPacket(1,1,1,1000,1000,true,0,11<<8);f.mod.aim.refresh();assert.equal(f.mod.aim.prediction.source,'native-weapon');f.mod.dispose();
});
test('adaptive position tracking uses server coordinates while preserving the source endpoint history',()=>{
 const f=adaptiveScene();f.setClock(250);f.mod.trackPacket(1,1,1,9000,9000,true,0,10<<8,{x:1000,y:1000});f.mod.trackPacket(1,2,1,9500,9500,true,0,0,{x:1600,y:1050});f.mod.aim.refresh();
 close(f.mod.aim.prediction.ox,1000);assert.ok(f.mod.aim.prediction.distance<610);assert.equal(f.mod.targets.players[1].x,9000);f.mod.dispose();
});
for(const jitter of [false,true])test('fresh physical direction precedes manual attack with Jitter='+jitter,()=>{
 const f=adaptiveScene();f.mod.setSetting('JitterEnabled',jitter);f.mod.aim.refresh();const before=f.mod.aim.lastAngle;
 f.setClock(250);f.mod.trackPacket(1,2,1,1600,1080,true,0,0);f.packets.length=0;assert.equal(f.mod.beforeFire(),true);f.packets.push([4]);
 assert.notEqual(f.mod.aim.lastAngle,before);const line=f.mod.targets.lines[0],angle=((Math.atan2(line.y2-line.y1,line.x2-line.x1)*180/Math.PI)%360+360)%360;
 close(f.packets[0][1],angle);assert.deepEqual(f.packets.map(p=>p[0]),[6,4]);f.mod.dispose();
});
test('stale targets cannot emit automatic attacks or keep direction ownership',()=>{
 const f=adaptiveScene();f.mod.setSetting('autoFire',true);f.setClock(1000);f.packets.length=0;f.mod.aim.refresh();assert.equal(f.mod.aim.targetPlayer,null);assert.equal(f.mod.controlsAimDirection,false);assert.ok(f.packets.every(p=>p[0]!==4));f.mod.dispose();
});
test('physical aim keeps native backpressure and identity protections',()=>{
 const f=adaptiveScene();f.storage.set('token','keep');f.storage.set('tokenId','123');f.mod.observeSocket({readyState:1,bufferedAmount:50000,addEventListener(){},removeEventListener(){}});
 f.packets.length=0;assert.equal(f.mod.beforeFire(),false);assert.equal(f.packets.length,0);
 f.mod.onSessionStart();f.mod.onHandshake();assert.equal(f.mod.aim.prediction.valid,false);assert.equal(f.storage.get('token'),'keep');assert.equal(f.storage.get('tokenId'),'123');f.mod.dispose();
});
test('a dense packet batch cannot multiply adaptive idle aim traffic beyond 20 directions per second',()=>{
 const f=adaptiveScene();f.mod.setSetting('predictionAutoSpeed',false);f.packets.length=0;
 for(let i=0;i<1000;i++){f.setClock(1000+i);f.mod.trackPacket(1,1,1,1000,1000,true,0,10<<8);f.mod.trackPacket(1,2,1,1500,1000+Math.floor(i/5),true,0,0);f.mod.aim.refresh();}
 assert.ok(f.packets.filter(p=>p[0]===6).length<=20);assert.ok(!f.packets.some(p=>p[0]===4));f.mod.dispose();
});
test('portable native browser fixture also verifies the installed adapter',()=>{
 const f=adaptiveScene(),s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','ﾠࡅ‍','а༤̘','ոᚄރ','ᴌ̗ⲟ'].map(k=>[k,k]));
 try{const r=require('../tools/verify_ballistics.cjs').verifyBallistics(f.mod,{...f.B,playerType:1,projectileType:3,setClock:f.setClock,capturePackets:()=>({packets:f.packets,restore(){}})},s);assert.equal(r.status,'passed');}finally{f.mod.dispose();}
});
test('independent projectile simulation measures interception error across distance, walk speed and direction',()=>{
 let improved=0,legacyMiss=0,physicalMiss=0,count=0;
 for(const distance of [150,400,800,1400])for(const vy of [-300,-150,150,300])for(const selfVx of [-200,0,200]){
  const m=model();samples(m,{x:selfVx,y:0},{x:0,y:vy},{x:distance,y:0});const r=m.aim.resolve('self','target');assert.ok(r.valid);
  // Independent ray/constant-velocity closest approach, using integer wire angles.
  function miss(angle){const rad=Math.round(angle)*Math.PI/180,dx=1500*Math.cos(rad),dy=1500*Math.sin(rad)-vy,rx=distance-selfVx*.2,ry=vy*.2,t=Math.max(0,(rx*dx+ry*dy)/(dx*dx+dy*dy));return Math.hypot(dx*t-rx,dy*t-ry);}
  const actual=miss(r.angle),legacy=miss(Math.atan2(vy*.2+(Math.hypot(distance-selfVx*.2,vy*.2)/300+.1)*vy*.05,distance-selfVx*.2)*180/Math.PI);
  if(actual<legacy)improved++;if(actual>24)physicalMiss++;if(legacy>24)legacyMiss++;count++;
 }
 assert.equal(count,48);assert.equal(physicalMiss,0);assert.ok(improved>=44);assert.ok(legacyMiss>=20);
});
test('quantized projectile simulation improves over both current BBY defaults and its tuned profile',()=>{
 const r=require('../tools/benchmark_ballistics.cjs').benchmark();
 assert.equal(r.overall.adaptive.shots,108);assert.ok(r.models.circle>0);
 for(const mode of ['original','tuned']){assert.ok(r.overall.adaptive.meanMiss<r.overall[mode].meanMiss);assert.ok(r.predictable.adaptive.within20>r.predictable[mode].within20);}
});
