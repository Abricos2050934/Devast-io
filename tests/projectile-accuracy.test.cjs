const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),path=require('node:path');
const {benchmark}=require('../tools/benchmark_projectile_accuracy.cjs');
function source(){return fs.readFileSync(process.env.DEVAST_TEST_CANDIDATE?path.join(process.env.DEVAST_TEST_CANDIDATE,'ilm-aim.js'):'mod/ballistic-model.js','utf8');}
function model(){const c=vm.createContext({});if(process.env.DEVAST_RUST_MOD)require('../tools/rust_fixture.cjs').install(c,process.env.DEVAST_RUST_MOD);else vm.runInContext(source(),c);let now=0;return {aim:c.__createBallisticAim({predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.4},()=>now),at(t){now=t;}};}
for(const interval of [80,100])test('confirmed circular motion survives '+interval+' ms packet intervals and quantization',()=>{
 const m=model();for(let i=0;i<12;i++){const at=i*interval;m.at(at+(i%3===1?5:0));m.aim.track('self',1000,1000,true,{weapon:10});m.aim.track('target',Math.round(1500+90*Math.cos(at*.0022)),Math.round(1000+90*Math.sin(at*.0022)),true);}
 const r=m.aim.resolve('self','target',{speed:1400,range:900});assert.equal(r.motionModel,'circle');assert.ok(r.valid);
 let miss=Infinity;for(let t=0;t<900/1400;t+=.001){const a=(11*interval/1000+t)*2.2,rad=r.angle*Math.PI/180;miss=Math.min(miss,Math.hypot(1500+90*Math.cos(a)-1000-1400*t*Math.cos(rad),90*Math.sin(a)-1400*t*Math.sin(rad)));}assert.ok(miss<20,`miss ${miss}`);
});
test('duplicate same-time observations cannot confirm an unconfirmed circle',()=>{
 const m=model();for(let i=0;i<5;i++){m.at(i*100);m.aim.track('target',600+90*Math.cos(i*.22),1000+90*Math.sin(i*.22),true);}
 assert.equal(m.aim.motion('target').curve,null);for(let i=0;i<20;i++)m.aim.track('target',600+90*Math.cos(.88),1000+90*Math.sin(.88),true);
 assert.equal(m.aim.motion('target').curve,null);m.at(500);m.aim.track('target',600+90*Math.cos(1.1),1000+90*Math.sin(1.1),true);assert.ok(m.aim.motion('target').curve);
});
for(const radius of [50,60])test('tight fast circle radius '+radius+' survives arc length and position rounding',()=>{
 const m=model();for(let i=0;i<12;i++){m.at(i*100);m.aim.track('self',1000,1000,true,{weapon:10});m.aim.track('target',Math.round(1450+radius*Math.cos(i*25/radius)),Math.round(1000+radius*Math.sin(i*25/radius)),true);}
 assert.equal(m.aim.resolve('self','target',{speed:1400,range:900}).motionModel,'circle');
});
test('rounding a straight diagonal path does not manufacture a curved target',()=>{
 const m=model();for(let i=0;i<20;i++){m.at(i*50+(i%3===0?4:0));m.aim.track('target',Math.round(1000+i*7.65),Math.round(1000+i*10.4),true);}assert.equal(m.aim.motion('target').curve,null);
});
test('several off-axis strafes are intercepted through late and missing packets',()=>{
 for(const omega of [2.25,3.6,5.3]){
  const m=model(),shooter=t=>({x:30*t,y:-60*t});
  const target=t=>{
   const displacement=52*Math.sin(omega*t+.6);
   return {x:440+Math.cos(.61)*displacement,y:80+Math.sin(.61)*displacement};
  };
  for(let ms=-1120;ms<=0;ms+=56){
   if(ms===-616||ms===-224)continue;
   const p=target(ms/1000),s=shooter(ms/1000);
   m.at(1200+ms+(ms<0?Math.sin(ms)*5:0));
   m.aim.track('self',Math.round(s.x),Math.round(s.y),true,{weapon:29});
   m.aim.track('target',Math.round(p.x),Math.round(p.y),true);
  }
  m.at(1275);
  const speed=950,range=800,result=m.aim.resolve('self','target',{speed,range});
  assert.equal(result.motionModel,'strafe');
  const angle=Math.round(result.angle)*Math.PI/180,origin=shooter(.075);
  let miss=Infinity;
  for(let t=0;t<=range/speed;t+=.001){
   const p=target(.075+t);
   miss=Math.min(miss,Math.hypot(p.x-origin.x-speed*t*Math.cos(angle),p.y-origin.y-speed*t*Math.sin(angle)));
  }
  assert.ok(miss<12,`frequency ${omega}: miss ${miss}`);
  const stopped=target(0);
  m.at(1280);
  m.aim.track('target',Math.round(stopped.x),Math.round(stopped.y),true);
  const afterStop=m.aim.resolve('self','target',{speed,range});
  assert.equal(afterStop.motionModel,'linear');
  assert.equal(afterStop.targetVelocity.x,0);
  assert.equal(afterStop.targetVelocity.y,0);
 }
});
test('forward travel and sideways reversals remain predictable through packet jitter and loss', () => {
 const m = model();
 const rotation = .73, frequency = 4.8, drift = 138, amplitude = 42;
 const position = time => {
  const forward = drift * time, side = amplitude * (Math.sin(frequency * time + .4) - Math.sin(.4));
  return {
   x: 480 + forward * Math.cos(rotation) - side * Math.sin(rotation),
   y: 110 + forward * Math.sin(rotation) + side * Math.cos(rotation),
  };
 };
 for (let frame = -24; frame <= 0; frame++) {
  if (frame === -17 || frame === -4) continue;
  const p = position(frame * .05);
  m.at(1500 + frame * 50 + (frame === 0 ? 0 : Math.sin(frame) * 8));
  m.aim.track('self', 0, 0, true, { weapon: 10 });
  m.aim.track('target', Math.round(p.x), Math.round(p.y), true);
 }
 m.at(1580);
 const speed = 1400, range = 900;
 const result = m.aim.resolve('self', 'target', { speed, range });
 assert.equal(result.motionModel, 'drifting-strafe');
 assert.ok(result.valid);
 const angle = Math.round(result.angle) * Math.PI / 180;
 let miss = Infinity;
 for (let time = 0; time <= range / speed; time += .001) {
  const p = position(.08 + time);
  miss = Math.min(miss, Math.hypot(p.x - speed * time * Math.cos(angle), p.y - speed * time * Math.sin(angle)));
 }
 assert.ok(miss < 7, `miss ${miss}`);

 const stopped = position(0);
 m.aim.track('target', Math.round(stopped.x), Math.round(stopped.y), true);
 const afterStop = m.aim.resolve('self', 'target', { speed, range });
 assert.equal(afterStop.motionModel, 'linear');
 assert.equal(afterStop.targetVelocity.x, 0);
 assert.equal(afterStop.targetVelocity.y, 0);
});
function circularSamples(center,radius,omega){
 const m=model(),position=t=>({x:center+radius*Math.cos(omega*t),y:radius*Math.sin(omega*t)});
 for(let ms=-960;ms<=0;ms+=80){
  const p=position(ms/1000);m.at(1000+ms);
  m.aim.track('self',0,0,true,{weapon:10});m.aim.track('target',p.x,p.y,true);
 }
 return {...m,position};
}
test('the slower projectile uses the first intersection with the curved path and respects range',()=>{
 const m=circularSamples(150,80,4),speed=250;
 const result=m.aim.resolve('self','target',{speed,range:140});
 assert.ok(result.valid);assert.equal(result.motionModel,'circle');
 let crossing=0;
 for(;crossing<.6;crossing+=.0001){const p=m.position(crossing);if(Math.hypot(p.x,p.y)<=speed*crossing)break;}
 assert.ok(Math.abs(result.flight-crossing)<.00015);
 assert.equal(m.aim.resolve('self','target',{speed,range:125}).status,'unreachable');
 assert.equal(m.aim.resolve('self','target',{speed,range:140,muzzle:250}).flight,0);
});
test('a confirmed curve remains continuous across a gap until the position is stale',()=>{
 const m=circularSamples(600,75,3.7);
 for(const age of [200,201,350]){
  m.at(1000+age);
  const speed=1400,result=m.aim.resolve('self','target',{speed,range:900});
  assert.equal(result.motionModel,'circle');
  const p=m.position(age/1000+result.flight),angle=result.angle*Math.PI/180;
  assert.ok(Math.hypot(p.x-speed*result.flight*Math.cos(angle),p.y-speed*result.flight*Math.sin(angle))<.01);
 }
 m.at(1351);assert.equal(m.aim.resolve('self','target').status,'stale-position');
});
test('fixed independent suites improve overall and circular accuracy without dropping opportunities',()=>{
 const baseline=z.gunzipSync(fs.readFileSync('recovery/projectile-accuracy-baseline.js.gz')).toString();
 const ref=JSON.parse(fs.readFileSync('recovery/projectile-accuracy-baseline.json')),hash=s=>require('node:crypto').createHash('sha256').update(s).digest('hex');
 assert.equal(hash(baseline),ref.model_sha256);assert.equal(hash(fs.readFileSync('tools/benchmark_projectile_accuracy.cjs')),ref.benchmark_sha256);
 for(const seed of [0x51a7e,0x9d12c3ab,0x6b803517]){
  const before=benchmark(baseline,seed),after=benchmark(source(),seed);assert.equal(after.overall.opportunities,800);assert.equal(after.rows.length,800);assert.ok(after.overall.percent>=before.overall.percent+5);
  assert.equal(after.overall.solutions,800);
  assert.ok(after.overall.percent>=85);
  assert.ok(after.byTrajectory.weave.percent>=90);
  for(const kind of ['tight-circle','wide-circle','orbit'])assert.ok(after.byTrajectory[kind].percent>=95,kind);
  for(const kind of ['crossing','diagonal','observed-turn'])assert.ok(after.byTrajectory[kind].percent>=before.byTrajectory[kind].percent,kind);
  for(const kind of Object.keys(after.byTrajectory)){const rows=after.rows.filter(r=>r.kind===kind);assert.equal(rows.filter(r=>r.weapon===10).length,50);assert.equal(rows.filter(r=>r.weapon===37).length,50);}
 }
});
