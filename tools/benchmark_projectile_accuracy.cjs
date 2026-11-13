// Seeded independent world-space simulation. This is not a server hit counter.
const fs=require('node:fs'),vm=require('node:vm');
const kinds=['crossing','diagonal','tight-circle','wide-circle','orbit','observed-turn','weave','surprise-reversal'];
function cases(seed,count=800){
 let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 return Array.from({length:count},(_,i)=>({kind:kinds[i%kinds.length],speed:Math.floor(i/kinds.length)%2?1450:1400,weapon:Math.floor(i/kinds.length)%2?37:10,range:900,distance:180+random()*480,velocity:160+random()*100,phase:random()*Math.PI*2,interval:[40,50,80,100][Math.floor(random()*4)],age:[0,35,70][Math.floor(random()*3)],rtt:[0,60,120][Math.floor(random()*3)],jitter:random()*8,walk:(random()-.5)*240}));
}
function trajectory(c,t){
 const {kind,distance:d,velocity:v,phase}=c;
 if(kind==='tight-circle'||kind==='wide-circle'||kind==='orbit'){
  const radius=kind==='tight-circle'?90:kind==='wide-circle'?240:160,w=v/radius;
  return {x:1000+d+radius*(Math.cos(phase+w*t)-Math.cos(phase)),y:1000+radius*(Math.sin(phase+w*t)-Math.sin(phase))};
 }
 if(kind==='diagonal')return {x:1000+d+t*v*.55,y:1000+t*v*.8};
 if(kind==='observed-turn')return t<-.15?{x:1000+d+v*(t+.15),y:1000}:{x:1000+d,y:1000+v*(t+.15)};
 if(kind==='weave')return {x:1000+d,y:1000+70*(Math.sin(phase+3*t)-Math.sin(phase))};
 if(kind==='surprise-reversal')return {x:1000+d,y:1000+v*(t<=.12?t:.24-t)};
 return {x:1000+d,y:1000+v*t};
}
function shooter(c,t){return c.kind==='orbit'?{x:1000+140*(Math.cos(c.phase+t)-Math.cos(c.phase)),y:1000+140*(Math.sin(c.phase+t)-Math.sin(c.phase))}:{x:1000+c.walk*t,y:1000+50*t};}
function benchmark(source,seed=0x51a7e,count=800){
 const context=vm.createContext({});vm.runInContext(source,context);const rows=[];
 for(const [index,c]of cases(seed,count).entries()){
  let now=0;const settings={predictionAutoSpeed:true,predictionLatencyMs:c.rtt,bulletSpeedCoefficient:1.5},aim=context.__createBallisticAim(settings,()=>now);
  let lastSnapshot=null;
  for(let at=-800;at<=0;at+=c.interval){
   // Ensure the final authoritative sample is at t=0 at every server rate.
   const time=Math.min(0,at+800% c.interval),p=trajectory(c,time/1000),s=shooter(c,time/1000);
   now=1000+time+(time===0?0:Math.sin(index*17+time)*c.jitter);
   aim.track('self',Math.round(s.x),Math.round(s.y),true,{weapon:c.weapon});aim.track('target',Math.round(p.x),Math.round(p.y),true);lastSnapshot=time;
  }
  // The grid above can end before zero for a non-divisor interval.
  if(lastSnapshot!==0){const p=trajectory(c,0),s=shooter(c,0);now=1000;aim.track('self',Math.round(s.x),Math.round(s.y),true,{weapon:c.weapon});aim.track('target',Math.round(p.x),Math.round(p.y),true);}
  now=1000+c.age;const r=aim.resolve('self','target',{speed:c.speed,range:c.range}),launchTime=(c.age+c.rtt)/1000,origin=shooter(c,launchTime);
  let miss=Infinity;
  if(r.valid){
   // Conservatively quantize to whole degrees for this simulation. The
   // native codec also accepts fractions; server angle precision is unknown.
   // Neither predictor point nor flight time advances the simulated truth.
   const angle=Math.floor((r.angle%360+360)%360)*Math.PI/180,dx=c.speed*Math.cos(angle),dy=c.speed*Math.sin(angle);
   for(let t=0;t<=c.range/c.speed;t+=.001){const target=trajectory(c,launchTime+t);miss=Math.min(miss,Math.hypot(target.x-origin.x-dx*t,target.y-origin.y-dy*t));}
  }
  rows.push({...c,valid:r.valid,model:r.motionModel||null,miss:Number.isFinite(miss)?miss:null,within20:miss<=20});
 }
 const summary=rs=>({opportunities:rs.length,solutions:rs.filter(x=>x.valid).length,within20:rs.filter(x=>x.within20).length,percent:100*rs.filter(x=>x.within20).length/rs.length,meanMissWithNoSolutionPenalty:rs.reduce((sum,r)=>sum+(r.miss??900),0)/rs.length});
 return {scope:'synthetic 20-world-unit closest-approach tolerance, not an authoritative hitbox or live percentage',seed,count,latency:'explicit correction equals simulated RTT; automatic RTT is not inferred',noise:'one-unit position quantization and 0–8 ms packet arrival jitter',obstacles:'absent; server collision and spread not modeled',overall:summary(rows),byTrajectory:Object.fromEntries(kinds.map(k=>[k,summary(rows.filter(r=>r.kind===k))])),byInterval:Object.fromEntries([40,50,80,100].map(k=>[k,summary(rows.filter(r=>r.interval===k))])),rows};
}
module.exports={benchmark,cases,trajectory,shooter};
if(require.main===module){const source=fs.readFileSync(process.argv[2]||'mod/ballistic-model.js','utf8'),report=benchmark(source);if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));}
