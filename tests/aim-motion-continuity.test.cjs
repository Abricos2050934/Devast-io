const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function model(){
 const context=vm.createContext({}),file=process.env.DEVAST_TEST_CANDIDATE?path.join(process.env.DEVAST_TEST_CANDIDATE,'ilm-aim.js'):'mod/ballistic-model.js';
 vm.runInContext(fs.readFileSync(file,'utf8'),context);let now=0;
 const aim=context.__createBallisticAim({predictionAutoSpeed:false,bulletSpeedCoefficient:1.5,predictionLatencyMs:0},()=>now);
 return {aim,at(t,x,y){now=t;aim.track('target',x,y,true);aim.track('self',-600,0,true);return aim.motion('target');}};
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
for(const kind of ['turn','reversal','restart'])test('old movement does not return on later packets after '+kind,()=>{
 const m=model();for(let i=0;i<4;i++)m.at(i*50,i*10,0);
 const expected=kind==='turn'?{x:0,y:200}:kind==='reversal'?{x:-200,y:0}:{x:200,y:0};
 if(kind==='restart')m.at(200,30,0);
 for(let i=1;i<=5;i++){
  const t=(kind==='restart'?200:150)+i*50,x=30+expected.x*i*.05,y=expected.y*i*.05,v=m.at(t,x,y);
  close(v.vx,expected.x);close(v.vy,expected.y);
  const r=m.aim.resolve('self','target');assert.ok(r.valid);
  // Independent constant-velocity projectile/target closest approach.
  const a=r.angle*Math.PI/180,vx=1500*Math.cos(a)-expected.x,vy=1500*Math.sin(a)-expected.y;
  const flight=((x+600)*vx+y*vy)/(vx*vx+vy*vy);
  assert.ok(Math.hypot(x+600-vx*flight,y-vy*flight)<1e-5);
 }
});
test('a teleport received in the same event-loop timestamp cannot create a huge velocity',()=>{
 const m=model();m.at(0,0,0);m.at(50,10,0);const v=m.at(50,5000,5000);
 close(v.vx,0);close(v.vy,0);assert.equal(v.samples,1);
 const next=m.at(100,5010,5000);close(next.vx,200);close(next.vy,0);
});
