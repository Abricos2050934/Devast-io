const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function model(overrides={}){
 const context=vm.createContext({});
 const file=process.env.DEVAST_TEST_CANDIDATE?path.join(process.env.DEVAST_TEST_CANDIDATE,'ilm-aim.js'):'mod/ballistic-model.js';
 if(process.env.DEVAST_RUST_MOD)require('../tools/rust_fixture.cjs').install(context,process.env.DEVAST_RUST_MOD);else vm.runInContext(fs.readFileSync(file,'utf8'),context);
 let now=1000;const settings={predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.5,VideoAimEnabled:true,videoPingMs:90,videoPingSteps:125,videoAimSteps:2,videoDelayMs:1,videoDelaySendMs:20,...overrides};
 return {settings,aim:context.__createBallisticAim(settings,()=>now),at(value){now=value;}};
}
function close(a,b,tolerance=1e-6){assert.ok(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);}
function linear(m,{distance=350,shooterV=120,targetV=240,weapon=10}={}){
 for(let t=-200;t<=0;t+=50){m.at(1000+t);m.aim.track('self',1000+shooterV*t/1000,1000,true,{weapon});m.aim.track('target',1000+distance,1000+targetV*t/1000,true);}
}
// Advance independent trajectories from authoritative time zero. A sample
// takes half an RTT to arrive; the command takes half an RTT to go back.
// The extra 21 ms is the explicitly configured processing/queue assumption.
function miss(result,{speed,range=900,rtt=90,age=70,shooterV=120,targetV=240,distance=350,muzzle=0,side=0}){
 if(!result.valid)return Infinity;
 const launch=(age+rtt+21)/1000,angle=result.angle*Math.PI/180;
 const ox=1000+shooterV*launch+Math.cos(angle)*muzzle-Math.sin(angle)*side;
 const oy=1000+Math.sin(angle)*muzzle+Math.cos(angle)*side;
 let minimum=Infinity;
 for(let t=0;t<=range/speed;t+=.0005){const x=1000+distance,y=1000+targetV*(launch+t);minimum=Math.min(minimum,Math.hypot(x-ox-speed*Math.cos(angle)*t,y-oy-speed*Math.sin(angle)*t));}
 return minimum;
}

test('screenshot defaults remain explicit configured values until genuine RTT samples exist',()=>{
 const m=model();const t=m.aim.timingInfo();assert.equal(t.source,'configured');assert.equal(t.samples,0);assert.equal(t.avgPing,90);assert.equal(t.currentPing,null);assert.equal(t.leadMs,90);assert.equal(t.totalDelayMs,111);assert.equal(t.aimSteps,2);
 for(let i=0;i<100;i++)m.aim.timingInfo();assert.equal(m.aim.timingInfo().samples,0);
});
test('the RTT window keeps the latest 125 samples and reflects a changed window immediately',()=>{
 const m=model();for(let value=1;value<=130;value++)assert.equal(m.aim.sampleRtt(value),true);
 let t=m.aim.timingInfo();assert.equal(t.source,'measured');assert.equal(t.samples,125);close(t.avgPing,68);close(t.deltaPing,62);
 m.settings.videoPingSteps=2;t=m.aim.timingInfo();assert.equal(t.samples,2);close(t.avgPing,129.5);close(t.deltaPing,.5);
});
test('invalid, stale and previous-clock RTT data cannot become measured lead',()=>{
 const m=model();for(const value of [NaN,Infinity,-1,2001])assert.equal(m.aim.sampleRtt(value),false);
 m.aim.sampleRtt(140);m.at(11001);assert.equal(m.aim.timingInfo().source,'configured');
 m.aim.sampleRtt(120);m.at(900);m.aim.sampleRtt(80);assert.equal(m.aim.timingInfo().samples,1);assert.equal(m.aim.timingInfo().avgPing,80);
 linear(m);m.aim.resetTiming();assert.ok(m.aim.motion('self'));assert.equal(m.aim.timingInfo().samples,0);
 m.aim.sampleRtt(100);m.aim.reset();assert.equal(m.aim.motion('self'),null);assert.equal(m.aim.timingInfo().source,'configured');
});
test('receipt age and user compensation are counted exactly once in the launch time',()=>{
 const m=model({predictionLatencyMs:20});linear(m);m.at(1070);const r=m.aim.resolve('self','target',{speed:1400,range:900});assert.ok(r.valid);close(r.ox,1000+120*.201);close(r.y,1000+240*(.201+r.flight));assert.equal(r.video.totalDelayMs,131);
});
for(const speed of [500,1400,1450])test(`video prediction intercepts independent motion at ${speed} units/s`,()=>{
 const m=model();linear(m);m.at(1070);const r=m.aim.resolve('self','target',{speed,range:900});assert.ok(r.valid);assert.ok(miss(r,{speed})<.4);assert.equal(r.video.aimSteps,2);
});
test('measured latency reduces the miss in a delayed crossing compared with uncompensated aim',()=>{
 const legacy=model({VideoAimEnabled:false}),video=model();linear(legacy);linear(video);legacy.at(1070);video.at(1070);video.aim.sampleRtt(180);
 const old=legacy.aim.resolve('self','target',{speed:1400,range:900}),improved=video.aim.resolve('self','target',{speed:1400,range:900});
 assert.ok(miss(old,{speed:1400,rtt:180})>30);assert.ok(miss(improved,{speed:1400,rtt:180})<.4);assert.equal(improved.video.source,'measured');
});
test('step count controls actual refinement work; an insufficient approximation uses the exact fallback',()=>{
 const m=model({videoAimSteps:1});linear(m,{distance:220,targetV:400});m.at(1070);
 const first=m.aim.resolve('self','target',{speed:500,range:600});assert.ok(first.valid);assert.equal(first.video.iterations,1);assert.equal(first.video.exactFallback,true);
 m.settings.videoAimSteps=4;const fourth=m.aim.resolve('self','target',{speed:500,range:600});assert.ok(fourth.valid);assert.equal(fourth.video.iterations,4);assert.equal(fourth.video.exactFallback,false);assert.ok(miss(fourth,{speed:500,range:600,distance:220,targetV:400})<.4);
});
test('spear lateral launch geometry intersects the target along the actual projectile ray',()=>{
 const m=model();linear(m,{distance:300,weapon:5});m.at(1070);
 const r=m.aim.resolve('self','target',{speed:500,range:560,muzzle:22,side:-39});assert.ok(r.valid);assert.ok(miss(r,{speed:500,range:560,distance:300,muzzle:22,side:-39})<.4);
 const a=r.angle*Math.PI/180;close(r.ox,1000+120*.181+22*Math.cos(a)+39*Math.sin(a));close(r.oy,1000+22*Math.sin(a)-39*Math.cos(a));
});
test('a negative spear hand offset remains a signed launch offset rather than being clamped away',()=>{
 const m=model();linear(m,{distance:300,weapon:5});m.at(1070);
 const r=m.aim.resolve('self','target',{speed:500,range:560,forward:-30,side:-39});assert.ok(r.valid);assert.ok(miss(r,{speed:500,range:560,distance:300,muzzle:-30,side:-39})<.4);
 const a=r.angle*Math.PI/180;close(r.ox,1000+120*.181-30*Math.cos(a)+39*Math.sin(a));
 assert.equal(m.aim.intercept(100,0,0,0,500,-30),null);
});
test('unreachable, stale and invalid profiles never manufacture a shot',()=>{
 const m=model();linear(m,{targetV:1000});m.at(1070);assert.equal(m.aim.resolve('self','target',{speed:100,range:600}).valid,false);
 assert.equal(m.aim.resolve('self','target',{speed:500,range:600,side:NaN}).valid,false);
 m.at(1500);assert.equal(m.aim.resolve('self','target',{speed:1500}).status,'stale-position');
});
function scene({spear=false}={}){
 const f=fixture({adaptive:true,dom:true});f.B.input={angle:0};f.B.types={1:{curveWeapons:{5:{curveBulletSpeed:.5,path:600},10:{curveBulletSpeed:1.4,path:900}}}};
 for(const[k,v]of Object.entries({VideoAimEnabled:true,AimBotEnabled:true,AimbotSpearEnabled:spear,mouseFovEnable:false,lockId:2,autoFire:false,spearAutoThrow:false}))f.mod.setSetting(k,v);
 for(let i=0;i<5;i++){f.setClock(1000+i*50);f.mod.trackPacket(1,1,1,1000,1000,true,0,(spear?5:10)<<8);f.mod.trackPacket(1,2,1,1300,1000+i*10,true,0,0);}
 f.mod.aim.refresh();return f;
}
test('the installed spear path uses the video model and sends its corrected angle before native fire',()=>{
 const f=scene({spear:true});try{
  const angle=f.mod.aim.spearResolve(),r=f.mod.aim.prediction;assert.ok(r.valid&&r.video.enabled);assert.equal(r.speed,500);close(angle,((r.angle-f.mod.settings.spearStabDeg)%360+360)%360);
  f.packets.length=0;assert.equal(f.mod.beforeFire(),true);assert.equal(f.packets.at(-1)[0],6);close(f.packets.at(-1)[1],f.mod.aim.lastAngle);
  const line=f.mod.targets.lines[1];close(line.x1,f.mod.aim.prediction.ox);close(line.x2,f.mod.aim.prediction.x);
 }finally{f.mod.dispose();}
});
test('video mode holds a valid target, obeys explicit lock and releases removed targets',()=>{
 const f=scene();try{
  f.world['ᴎ︃ᄉ'][3]={'ο̏︇':'Third','а༤̘':-1};f.mod.trackPacket(1,3,1,1080,1000,true);f.mod.setSetting('lockId',-1);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
  f.mod.setSetting('lockId',3);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,3);
  f.mod.setSetting('lockId',-1);f.mod.trackPacket(1,3,1,0,0,false);f.mod.aim.resolve();assert.equal(f.mod.aim.targetPlayer.id,2);
 }finally{f.mod.dispose();}
});
test('automatic spear throws retain exactly the calibrated manual direction',()=>{
 const f=scene({spear:true});try{
  for(const correction of [.5,2.5,10]){
   f.mod.setSetting('spearStabDeg',correction);f.mod.setSetting('spearAutoThrow',true);
   const expected=f.mod.aim.spearResolve();f.packets.length=0;f.mod.aimModule.tick();
   const attack=f.packets.findIndex(p=>p[0]===4);assert.ok(attack>0,'Automatic throw missing');
   assert.equal(f.packets[attack-1][0],6);close(f.packets[attack-1][1],expected);
   f.packets.length=0;assert.equal(f.mod.beforeFire(),true);close(f.packets.at(-1)[1],expected);
  }
 }finally{f.mod.dispose();}
});
test('a removed or stale video spear target clears both lines and cannot auto throw',()=>{
 for(const removed of [true,false]){
  const f=scene({spear:true});try{
   f.mod.setSetting('spearAutoThrow',true);f.mod.aim.spearResolve();
   assert.notEqual(f.mod.targets.lines[1].x1,-1);
   if(removed)f.mod.trackPacket(1,2,1,0,0,false);else f.setClock(1800);
   f.packets.length=0;f.mod.aimModule.tick();assert.equal(f.mod.aim.targetPlayer,null);
   assert.equal(f.mod.aim.prediction.valid,false);assert.ok(!f.packets.some(p=>p[0]===4));
   for(const line of f.mod.targets.lines)assert.deepEqual([line.x1,line.y1,line.x2,line.y2],[-1,-1,-1,-1]);
  }finally{f.mod.dispose();}
 }
});
test('switching prediction modes drops the old target and forecast without changing saved controls',()=>{
 const f=scene({spear:true});try{
  const saved=Object.fromEntries(['spearStabDeg','distanceCoefficient','aimSmooth','spearAutoThrow'].map(k=>[k,f.mod.settings[k]]));
  for(const [key,value]of [['VideoAimEnabled',false],['VideoAimEnabled',true],['AdaptiveAimEnabled',false]]){
   f.mod.aim.spearResolve();f.mod.setSetting(key,value);
   assert.equal(f.mod.aim.targetPlayer,null);assert.equal(f.mod.aim.prediction.valid,false);
   for(const line of f.mod.targets.lines)assert.deepEqual([line.x1,line.y1,line.x2,line.y2],[-1,-1,-1,-1]);
   for(const [k,v]of Object.entries(saved))assert.equal(f.mod.settings[k],v);
  }
 }finally{f.mod.dispose();}
});
test('RTT ingestion adds no packets and resets on a new socket or session',()=>{
 const f=scene();try{
  const count=f.packets.length;assert.equal(f.mod.sampleAimRtt(130),true);assert.equal(f.mod.aimTiming().source,'measured');assert.equal(f.packets.length,count);
  const socket={readyState:1,addEventListener(){},removeEventListener(){}};f.mod.observeSocket(socket);assert.equal(f.mod.aimTiming().source,'configured');
  f.mod.sampleAimRtt(120);f.mod.observeSocket(socket);assert.equal(f.mod.aimTiming().source,'measured');f.mod.onSessionStart();assert.equal(f.mod.aimTiming().source,'configured');
 }finally{f.mod.dispose();}assert.equal(f.mod.sampleAimRtt(100),false);
});
test('video settings are editable through the menu, bounded and saved',()=>{
 const f=scene();try{
  const root=menu(f),folder=root.__folders['Adaptive Aim'].__folders['Video Prediction — эксперимент'];assert.ok(folder);
  control(folder,'videoPingMs').setValue(135);control(folder,'videoAimSteps').setValue(4);assert.equal(f.mod.settings.videoPingMs,135);assert.equal(f.mod.aimTiming().aimSteps,4);
  const saved=JSON.parse(f.storage.get('DevastILM:settings:v3'));assert.equal(saved.videoPingMs,135);assert.equal(saved.VideoAimEnabled,true);
  assert.throws(()=>f.mod.setSetting('videoAimSteps',100),/out of range/);assert.throws(()=>f.mod.setSetting('videoAimSteps',2.5),/integer/);assert.equal(f.mod.settings.videoAimSteps,4);
 }finally{f.mod.dispose();}
});
test('the portable browser verifier exercises the installed video mode',()=>{
 const f=scene();try{
  menu(f);
  const symbols=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘','curveWeapons','curveBulletSpeed'].map(k=>[k,k]));
  f.context.native={world:f.world,network:f.network,types:f.B.types,playerType:1,setClock:f.setClock,capturePackets:()=>({packets:f.packets,restore(){}})};
  f.context.symbols=symbols;
  const source=require('../tools/verify_video_prediction.cjs').verifyVideoPrediction.toString();
  const result=vm.runInContext('('+source+')(mod,native,symbols)',f.context);
  assert.equal(result.status,'passed');
 }finally{f.mod.dispose();}
});
