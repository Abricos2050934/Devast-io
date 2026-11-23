// Independent projectile travel; a synthetic tolerance is not a server hitbox.
const fs=require('node:fs'),vm=require('node:vm');
const {cases,trajectory,shooter}=require('./benchmark_projectile_accuracy.cjs');
function benchmark(source,seed=0x713b1,count=480){
 const context=vm.createContext({});vm.runInContext(source,context);const rows=[];
 for(const[index,original]of cases(seed,count).entries()){
  const weapon=[5,10,37][index%3],speed={5:500,10:1400,37:1450}[weapon],range=weapon===5?560:900;
  const c={...original,weapon,speed,range,distance:180+(original.distance-180)*.55,rtt:[60,90,130,180][Math.floor(index/3)%4]};
  const results={};
  for(const mode of ['uncompensated','known-delay-reference','video']){
   let now=10000;
   const settings={predictionAutoSpeed:true,predictionLatencyMs:mode==='known-delay-reference'?c.rtt+21:0,bulletSpeedCoefficient:1.5,VideoAimEnabled:mode==='video',videoPingMs:90,videoPingSteps:125,videoAimSteps:2,videoDelayMs:1,videoDelaySendMs:20};
   const aim=context.__createBallisticAim(settings,()=>now),events=[];
   if(mode==='video')for(let i=0;i<125;i++)events.push({at:10000-(124-i)*50,rtt:c.rtt+6*Math.sin(index*13+i)});
   const ticks=[];for(let at=-800;at<=0;at+=c.interval)ticks.push(Math.min(0,at+800%c.interval));if(ticks.at(-1)!==0)ticks.push(0);
   for(const t of ticks)events.push({at:10000+t+(t===0?0:Math.sin(index*17+t)*c.jitter),time:t});
   for(const event of events.sort((a,b)=>a.at-b.at)){
    now=event.at;
    if(event.rtt!==undefined){aim.sampleRtt(event.rtt);continue;}
    const p=trajectory(c,event.time/1000),s=shooter(c,event.time/1000);
    aim.track('self',Math.round(s.x),Math.round(s.y),true,{weapon});aim.track('target',Math.round(p.x),Math.round(p.y),true);
   }
   now=10000+c.age;const r=aim.resolve('self','target',{speed,range});
   const launch=(c.age+c.rtt+21)/1000,origin=shooter(c,launch);let miss=Infinity;
   if(r.valid){const angle=Math.floor((r.angle%360+360)%360)*Math.PI/180;
    for(let t=0;t<=range/speed;t+=.001){const target=trajectory(c,launch+t);miss=Math.min(miss,Math.hypot(target.x-origin.x-speed*Math.cos(angle)*t,target.y-origin.y-speed*Math.sin(angle)*t));}
   }
   results[mode]={valid:r.valid,miss:Number.isFinite(miss)?miss:null,within20:miss<=20,exactFallback:r.video?.exactFallback??null};
  }
  rows.push({...c,results});
 }
 const summary=items=>Object.fromEntries(['uncompensated','known-delay-reference','video'].map(mode=>[mode,{opportunities:items.length,solutions:items.filter(row=>row.results[mode].valid).length,within20:items.filter(row=>row.results[mode].within20).length,percent:100*items.filter(row=>row.results[mode].within20).length/items.length}]));
 return {scope:'Synthetic projectile closest approach within 20 world units; not a live hit rate.',seed,count,network:'Known simulated RTT; half inbound, half outbound; 21 ms additional queue/processing. Video mode receives 125 simulated RTT observations with zero-centered jitter.',limitations:'No obstacles, spread, authoritative collision or damage; all opportunities, including unsolved cases, remain in the denominator.',overall:summary(rows),byWeapon:Object.fromEntries([5,10,37].map(w=>[w,summary(rows.filter(row=>row.weapon===w))])),rows};
}
module.exports={benchmark};
if(require.main===module){const report=benchmark(fs.readFileSync(process.argv[2]||'mod/ballistic-model.js','utf8'));if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));}
