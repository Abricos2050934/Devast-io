const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),path=require('node:path');
const {benchmark}=require('../tools/benchmark_projectile_accuracy.cjs');
function source(){return fs.readFileSync(process.env.DEVAST_TEST_CANDIDATE?path.join(process.env.DEVAST_TEST_CANDIDATE,'ilm-aim.js'):'mod/ballistic-model.js','utf8');}
function model(){const c=vm.createContext({});vm.runInContext(source(),c);let now=0;return {aim:c.__createBallisticAim({predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.4},()=>now),at(t){now=t;}};}
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
test('fixed independent suites improve overall and circular accuracy without dropping opportunities',()=>{
 const baseline=z.gunzipSync(fs.readFileSync('recovery/projectile-accuracy-baseline.js.gz')).toString();
 const ref=JSON.parse(fs.readFileSync('recovery/projectile-accuracy-baseline.json')),hash=s=>require('node:crypto').createHash('sha256').update(s).digest('hex');
 assert.equal(hash(baseline),ref.model_sha256);assert.equal(hash(fs.readFileSync('tools/benchmark_projectile_accuracy.cjs')),ref.benchmark_sha256);
 for(const seed of [0x51a7e,0x9d12c3ab,0x6b803517]){
  const before=benchmark(baseline,seed),after=benchmark(source(),seed);assert.equal(after.overall.opportunities,800);assert.equal(after.rows.length,800);assert.ok(after.overall.percent>=before.overall.percent+5);
  for(const kind of ['tight-circle','wide-circle','orbit'])assert.ok(after.byTrajectory[kind].percent>=95,kind);
  for(const kind of ['crossing','diagonal','observed-turn'])assert.ok(after.byTrajectory[kind].percent>=before.byTrajectory[kind].percent,kind);
  for(const kind of Object.keys(after.byTrajectory)){const rows=after.rows.filter(r=>r.kind===kind);assert.equal(rows.filter(r=>r.weapon===10).length,50);assert.equal(rows.filter(r=>r.weapon===37).length,50);}
 }
});
