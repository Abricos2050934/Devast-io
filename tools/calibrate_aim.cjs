// Deterministic offline projectile simulation. No game/server code is executed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parse}=require('./parser.cjs');
const root=path.resolve(__dirname,'..');
function predictor(source){
 const fn=parse(source,{ecmaVersion:'latest'}).body.find(n=>n.id?.name==='__createAdaptiveAim');
 return vm.runInNewContext('('+source.slice(fn.start,fn.end)+')',{});
}
const current=predictor(fs.readFileSync(path.join(root,'mod/ilm-aim.js'),'utf8'));
const previous=predictor(JSON.parse(fs.readFileSync(path.join(root,'recovery/aim-prediction-before-tuning.json'))).source);
const baseSettings={ImprovedAimEnabled:true,resolverType:'linear',distanceCoefficient:300,bulletSpeedCoefficient:4,offsetCoefficient:.1,visualizeResolving:false};
function motion(kind,t,phase,turn){
 switch(kind){
  case 'stationary':return {x:0,y:0};
  case 'strafe':return {x:0,y:.34*t};
  case 'diagonal':return {x:.2*t,y:.24*t};
  case 'approach':return {x:-.28*t,y:.12*t};
  case 'stop':return {x:.12*Math.min(t,turn),y:.32*Math.min(t,turn)};
  case 'reverse':return {x:0,y:.34*(t<turn?t:2*turn-t)};
  case 'weave':return {x:.14*t,y:65*Math.sin(t/190+phase)};
  case 'accelerate':return {x:.00008*t*t,y:.18*t};
 }
}
function scenes(speed,range,holdout=false){
 const test=holdout===true,dev=holdout==='development';
 const all=[],phase=test?1.21:dev?.73:.17,intervals=test?[65,135]:dev?[75,125]:[50,100,150];
 const distances=range==='close'?(test?[145,315]:dev?[160,290]:[100,220,350]):(test?[535,805]:dev?[560,770]:[500,675,850]);
 for(const kind of ['stationary','strafe','diagonal','approach','stop','reverse','weave','accelerate'])
 for(const interval of intervals)for(const distance of distances)for(const lag of test?[25,95]:dev?[35,85]:[45,75])
 for(const commandDelay of test?[10,50]:dev?[15,45]:[20,40])for(const ownSpeed of [0,.2]){
  const arrivals=Array.from({length:6},(_,i)=>i*interval+(i%2?7:-5)+5),now=arrivals[5]+(test?47:dev?37:23),turn=now+(test?65:dev?55:80);
  const own=t=>({x:1000+ownSpeed*t,y:1000+ownSpeed*.3*t});
  const ownNow=own(now),atNow=motion(kind,now,phase,turn);
  const target=t=>{const p=motion(kind,t,phase,turn);return {x:ownNow.x+distance+p.x-atNow.x,y:ownNow.y+p.y-atNow.y};};
  const samples=arrivals.map(time=>({time,own:own(time-lag),target:target(time-lag)}));
  const firing=own(now+commandDelay),future=[];
  for(let flight=0;flight<=900/speed;flight+=8)future.push({flight,...target(now+commandDelay+flight)});
  all.push({kind,distance,interval,lag,commandDelay,now,samples,firing,future});
 }
 return all;
}
function error(factory,settings,speed,scene){
 let clock=0;const predict=factory(()=>clock),self={id:1,active:true},target={id:2,active:true};
 for(const sample of scene.samples){clock=sample.time;Object.assign(self,sample.own);Object.assign(target,sample.target);predict.observe(self);predict.observe(target);}
 clock=scene.now;const aim={targetPlayer:target,lastAngle:0},targets={players:[null,self],lines:[{reset(){}}]};
 const angle=predict.resolve(aim,targets,1,settings,speed,0)*Math.PI/180;
 const vx=Math.cos(angle)*speed,vy=Math.sin(angle)*speed;let minimum=Infinity;
 for(const p of scene.future)minimum=Math.min(minimum,Math.hypot(scene.firing.x+vx*p.flight-p.x,scene.firing.y+vy*p.flight-p.y));
 return minimum;
}
function measure(factory,settings,speed,cases){
 const errors=cases.map(scene=>error(factory,settings,speed,scene)).sort((a,b)=>a-b);
 return {scenes:errors.length,rms:Math.sqrt(errors.reduce((s,x)=>s+x*x,0)/errors.length),p95:errors[Math.floor((errors.length-1)*.95)],hits:errors.filter(e=>e<=38).length,hitRadius:38};
}
function calibrate(){
 const groups={};
 for(const [weapon,speed]of [['ak47',1.4],['laser',1.45]])for(const range of ['close','far']){
  const train=[...scenes(speed,range),...scenes(speed,range,'development')],holdout=scenes(speed,range,true);let best;
  for(const resolverType of ['linear','smoothed'])for(const distanceCoefficient of [270,300,330])for(const offsetCoefficient of [0,.1,.4,.8,1.2,1.6,2,2.4]){
   const settings={...baseSettings,resolverType,distanceCoefficient,offsetCoefficient},score=measure(current,settings,speed,train);
   if(!best||score.hits>best.training.hits||score.hits===best.training.hits&&score.rms<best.training.rms-1e-9)best={settings,training:score};
  }
  groups[weapon+'_'+range]={speed,path:900,...best,holdout:measure(current,best.settings,speed,holdout),previous:measure(previous,baseSettings,speed,holdout)};
 }
 return {schema:1,method:'Grid search across two development folds maximizes hits within radius 38, then minimizes RMS; final evaluation uses a third set of distances, intervals, latency and phases',candidatesPerGroup:48,groups,limits:['Offline model; live accuracy not measured','Assumed receive delays 25–95 ms and command delays 10–50 ms in the final holdout','No spread, obstacles, armor or unknown server behavior; target direction changes are not predictable']};
}
if(require.main===module){const result=calibrate(),file=path.resolve(process.argv[2]||'build/aim-tuning/calibration.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
module.exports={calibrate,measure,scenes,predictor,baseSettings};
