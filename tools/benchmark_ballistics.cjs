// Independent world-space projectile simulation. No downloaded game is run.
const fs=require('node:fs'),vm=require('node:vm'),{fixture}=require('../tests/mod-fixture.cjs');
function benchmark(){
 const context=vm.createContext({});vm.runInContext(fs.readFileSync('mod/ballistic-model.js','utf8'),context);
 const groups={original:[],tuned:[],adaptive:[]},models={},examples=[];
 const profiles={original:{distanceCoefficient:80,offsetCoefficient:.8,leadCap:280,aimSmooth:.74},tuned:{distanceCoefficient:60,offsetCoefficient:1,leadCap:200,aimSmooth:1}};
 for(const distance of [250,425,600])for(const age of [0,40,80])for(const walk of [-160,0,160])for(const kind of ['crossing','diagonal','circle','unannounced-turn']){
  const own=t=>({x:1000+walk*t,y:1000+60*t});
  const target=t=>kind==='circle'?{x:1000+distance+160*(Math.cos(1.25*t)-1),y:1000+160*Math.sin(1.25*t)}:kind==='diagonal'?{x:1000+distance+130*t,y:1000+180*t}:{x:1000+distance,y:1000+220*(kind==='unannounced-turn'&&t>.45?.9-t:t)};
  const legacy=Object.fromEntries(Object.keys(profiles).map(k=>[k,fixture()]));
  let clock=0;const adaptive=context.__createBallisticAim({predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.5},()=>clock);
  try{
   for(const[k,f]of Object.entries(legacy)){for(const[key,value]of Object.entries({...profiles[k],mouseFovEnable:false,lockId:2,AimBotEnabled:true}))f.mod.setSetting(key,value);}
   for(const at of [0,50,100,150,200,250,300,350,400]){
    clock=at;const s=own(at/1000),t=target(at/1000),sx=Math.round(s.x),sy=Math.round(s.y),tx=Math.round(t.x),ty=Math.round(t.y);
    adaptive.track('self',sx,sy,true,{weapon:10});adaptive.track('target',tx,ty,true);
    for(const f of Object.values(legacy)){f.setClock(at);f.mod.trackPacket(1,1,1,sx,sy,true,0,10<<8);f.mod.trackPacket(1,2,1,tx,ty,true,0,0);}
   }
   clock=400+age;const physical=adaptive.resolve('self','target',{speed:1400,range:900}),angles={};
   if(!physical.valid)throw Error('Unexpected unreachable benchmark target');angles.adaptive=physical.angle;models[physical.motionModel]=(models[physical.motionModel]||0)+1;
   for(const[k,f]of Object.entries(legacy)){f.setClock(clock);angles[k]=f.mod.aim.resolve();}
   const launch=own(clock/1000);
   for(const[k,angle]of Object.entries(angles)){
    const rad=Math.round(angle)*Math.PI/180;let miss=Infinity;
    // The simulator advances the real bullet from the actual future shooter
    // position. It never uses the predictor's intercept time or point.
    for(let time=0;time<=900/1400;time+=.001){const actual=target(clock/1000+time),x=launch.x+1400*Math.cos(rad)*time,y=launch.y+1400*Math.sin(rad)*time;miss=Math.min(miss,Math.hypot(actual.x-x,actual.y-y));}
    groups[k].push({kind,miss});
   }
   examples.push({distance,age,walk,kind,model:physical.motionModel,miss:Object.fromEntries(Object.keys(groups).map(k=>[k,groups[k].at(-1).miss]))});
  }finally{for(const f of Object.values(legacy))f.mod.dispose();}
 }
 const summarize=rows=>({shots:rows.length,within20:rows.filter(r=>r.miss<=20).length,meanMiss:rows.reduce((s,r)=>s+r.miss,0)/rows.length,maxMiss:Math.max(...rows.map(r=>r.miss))});
 return {status:'passed',scope:'deterministic simulation, not live server hits',speed:1400,range:900,positionQuantization:1,angleQuantization:1,models,overall:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,summarize(v)])),predictable:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,summarize(v.filter(r=>r.kind!=='unannounced-turn'))])),byTrajectory:Object.fromEntries(['crossing','diagonal','circle','unannounced-turn'].map(kind=>[kind,Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,summarize(v.filter(r=>r.kind===kind))]))])),examples};
}
module.exports={benchmark};
if(require.main===module){const report=benchmark(),path=process.argv[2];if(path)fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,examples:undefined}));}
