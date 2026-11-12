// Offline calibration of the installed engine, never a substitute for live
// server hit measurements. Native registry speeds: AK47 1.4, laser SMG 1.45.
const fs=require('node:fs'),path=require('node:path'),{fixture}=require('../tests/mod-fixture.cjs');
function datasets(){
 const result=[];
 for(const speed of [1.4,1.45])for(const kind of ['crossing','diagonal','turning','chase'])for(const distance of [250,425,600])for(const age of [0,40,80]){
  const r=kind==='chase'?160:120,omega=.35/r,phase=distance===250?.4:distance===425?.85:1.3;
  const target=t=>kind==='crossing'?{x:1000+distance,y:1000+.4*t}:kind==='diagonal'?{x:1000+distance+.2*t,y:1000+.3*t}:{x:1400+r*Math.cos(phase+omega*t),y:1000+r*Math.sin(phase+omega*t)};
  const own=t=>kind==='chase'?{x:1400+r*1.15*Math.cos(phase+omega*t-1.2),y:1000+r*1.15*Math.sin(phase+omega*t-1.2)}:{x:1000+.05*t,y:1000};
  const frames=[];for(let i=0;i<10;i++){
   const t=i*50,frame={at:5000+t,own:own(t-age),target:target(t-age)};
   if(i>=6){const origin=own(t);frame.future=[];for(let dt=0;dt<=900/speed;dt+=5){const p=target(t+dt);frame.future.push([p.x-origin.x,p.y-origin.y,speed*dt]);}}
   frames.push(frame);
  }
  result.push({speed,kind,distance,age,split:distance===425?'holdout':'training',frames});
 }
 return result;
}
function calibrate(){
 const f=fixture(),m=f.mod,scenes=datasets(),profiles=[],defaults={...m.settings};
 const score=(profile,split)=>{
  const misses=[];for(const scene of scenes){if(scene.split!==split)continue;
   m.settings.AimBotEnabled=false;m.onSessionStart();m.onHandshake();Object.assign(m.settings,defaults,profile,{AimBotEnabled:true,autoFire:false,jitterActive:false,AimbotSpearEnabled:false,mouseFovEnable:false,lockId:2,hideAimbotAngle:false});
   for(const frame of scene.frames){f.setClock(frame.at);m.trackPacket(1,1,1,frame.own.x,frame.own.y,true);m.trackPacket(1,2,1,frame.target.x,frame.target.y,true);
    if(frame.future){const a=m.aim.lastAngle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);let best=Infinity;for(const[x,y,d]of frame.future)best=Math.min(best,Math.hypot(x-d*c,y-d*s));misses.push(best);}
   }
  }
  const sorted=misses.slice().sort((a,b)=>a-b);return {shots:misses.length,within20:misses.filter(n=>n<=20).length,meanMiss:misses.reduce((a,b)=>a+b,0)/misses.length,p95Miss:sorted[Math.floor((sorted.length-1)*.95)]};
 };
 try{
  for(const distanceCoefficient of [50,60,70,80,100,140,200])for(const offsetCoefficient of [0,.5,.8,1,1.2,1.5])for(const leadCap of [80,160,280,400,500])for(const aimSmooth of [.5,.74,.9,1]){
   const settings={distanceCoefficient,offsetCoefficient,leadCap,aimSmooth};profiles.push({settings,training:score(settings,'training')});
  }
  const tried=new Set(profiles.map(p=>JSON.stringify(p.settings)));
  for(const distanceCoefficient of [60,70,80,90,100])for(const offsetCoefficient of [1,1.1,1.2,1.3,1.4])for(const leadCap of [200,240,280,320,400])for(const aimSmooth of [.85,.9,.95,1]){
   const settings={distanceCoefficient,offsetCoefficient,leadCap,aimSmooth};if(!tried.has(JSON.stringify(settings)))profiles.push({settings,training:score(settings,'training')});
  }
  profiles.sort((a,b)=>b.training.within20-a.training.within20||a.training.meanMiss-b.training.meanMiss);
  const winner=profiles[0];winner.holdout=score(winner.settings,'holdout');const baseline={settings:Object.fromEntries(Object.keys(winner.settings).map(k=>[k,defaults[k]]))};baseline.training=score(baseline.settings,'training');baseline.holdout=score(baseline.settings,'holdout');
  return {schema:1,engine:'message27-bby',method:'actual installed engine; select on training cases, evaluate on separate distance/phase cases',profiles:profiles.length,scenes:scenes.length,units:'world coordinates; time in milliseconds',nativeWeaponSpeeds:{ak47:1.4,laserSubmachine:1.45},simulatedObservationAgeMs:[0,40,80],simulatedHitRadius:20,trajectoryKinds:['crossing','diagonal','turning','chase'],limitations:['Synthetic trajectories, not measured server hits.','No obstacle collision, spread, muzzle offsets or unknown server timing.','No universally best profile across all weapons, ping and future target turns.','Selection, visuals, spear and Jitter controls are checked separately; they are not optimized by this gun-only score.'],baseline,winner,top10:profiles.slice(0,10)};
 }finally{m.dispose();}
}
module.exports={calibrate,datasets};
if(require.main===module){const result=calibrate(),out=process.argv[2]||'verification/message27-aim-tuning.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({report:out,profiles:result.profiles,baseline:result.baseline,winner:result.winner},null,2));}
