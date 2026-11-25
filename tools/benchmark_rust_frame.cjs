// Repeatable synthetic CPU workload; these numbers are not live-server FPS.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{spawnSync}=require('node:child_process');
if(!process.argv.includes('--single')){
 const rows=[];
 for(const backend of ['js','rust']){
  const env={...process.env};delete env.DEVAST_TEST_CANDIDATE;
  if(backend==='rust')env.DEVAST_RUST_MOD=process.env.DEVAST_RUST_MOD||'rust-mod';else delete env.DEVAST_RUST_MOD;
  const r=spawnSync(process.execPath,[__filename,'--single'],{env,encoding:'utf8'});
  if(r.status!==0)throw Error(r.stderr||r.stdout);rows.push({backend,...JSON.parse(r.stdout)});
 }
 const report={scope:'synthetic per-operation CPU time in milliseconds; not game FPS',rows};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}else{
 const {fixture,scene,player}=require('../tests/mod-fixture.cjs');const rows=[];
 for(const count of [30,90]){
  const f=fixture({adaptive:true,dom:true});
  try{
   f.B.synchronizedRender=true;f.B.nativePlayerLabels=true;
   f.B.types={1:{curveWeapons:{10:{curveBulletSpeed:1.4,path:900}}}};
   Object.assign(f.world['ᅠᏧ‍'],{x:1000,y:1000});
   scene(f,1,Array.from({length:count},(_,i)=>player(i+1,1000+i*5,1000+i*3)));
   let at=1000;f.setClock(at);
   for(let id=1;id<=count;id++){
    f.world['ᴎ︃ᄉ'][id]={'ο̏︇':'Player'+id,'а༤̘':-1};
    f.mod.trackPacket(1,id,id,1000+(id-1)*5,1000+(id-1)*3,true,10,10<<8);
   }
   f.mod.setSetting('mouseFovEnable',false);
   for(const enabled of [false,true]){
    f.mod.setSetting('AimBotEnabled',enabled);
    for(const [operation,fn]of [['render',i=>f.mod.render(at+i*16)],['resolve',()=>f.mod.aim.resolve()],['moving_packet',i=>{at+=50;f.setClock(at);f.mod.trackPacket(1,2,2,1010+i*3,1010+i*2,true,10,10<<8)}]]){
     // Refresh every observation outside the timed section so target/self
     // expiry from the preceding packet workload cannot skip real prediction.
     for(let id=1;id<=count;id++)f.mod.trackPacket(1,id,id,1000+(id-1)*5,1000+(id-1)*3,true,10,10<<8);
     for(let i=0;i<5;i++)fn(i);const samples=[];
     for(let i=5;i<30;i++){const t=performance.now();fn(i);samples.push(performance.now()-t);}
     if(operation==='resolve'&&!f.mod.aim.prediction.valid)throw Error('Benchmark did not execute a valid prediction');
     samples.sort((a,b)=>a-b);rows.push({players:count,aim_enabled:enabled,operation,median:samples[12],p95:samples[23],max:samples[24],...(operation==='resolve'?{valid_prediction:true}:{})});
    }
   }
  }finally{f.mod.dispose();}
 }
 const vm=require('node:vm'),context=vm.createContext({});
 if(process.env.DEVAST_RUST_MOD)require('./rust_fixture.cjs').install(context,process.env.DEVAST_RUST_MOD);
 else vm.runInContext(fs.readFileSync('mod/ballistic-model.js','utf8'),context);
 const motion=[];
 for(const kind of ['strafe','drifting-strafe']){
  const cold=[],warm=[];
  for(let run=0;run<8;run++){
   let now=0;const aim=context.__createBallisticAim({predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.4},()=>now);
   for(let i=-24;i<=0;i++){
    const t=i*.05,side=42*(Math.sin(4.8*t+.4)-Math.sin(.4)),forward=kind==='drifting-strafe'?138*t:0;now=1500+i*50;
    aim.track('self',0,0,true,{weapon:10});aim.track('target',480+forward*Math.cos(.73)-side*Math.sin(.73),110+forward*Math.sin(.73)+side*Math.cos(.73),true);
   }
   now=1575;let t=performance.now();const result=aim.resolve('self','target',{speed:1400,range:900});cold.push(performance.now()-t);
   if(!result.valid||result.motionModel!==kind)throw Error('Wrong model in cold-fit benchmark: '+result.motionModel);
   t=performance.now();aim.resolve('self','target',{speed:1400,range:900});warm.push(performance.now()-t);
  }
  cold.sort((a,b)=>a-b);warm.sort((a,b)=>a-b);motion.push({kind,cold_median:cold[4],cold_max:cold[7],warm_median:warm[4]});
 }
 console.log(JSON.stringify({rows,motion}));
}
