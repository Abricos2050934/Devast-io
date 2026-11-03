const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,scene,player}=require('./mod-fixture.cjs');
const {predictor,scenes}=require('../tools/calibrate_aim.cjs');
const original=predictor(JSON.parse(fs.readFileSync('recovery/aim-prediction-before-tuning.json')).source);
const current=predictor(fs.readFileSync('mod/ilm-aim.js','utf8'));
const stable={ImprovedAimEnabled:true,distanceCoefficient:300,bulletSpeedCoefficient:4,offsetCoefficient:.1,resolverType:'smoothed',visualizeResolving:true};
const SAVE='DevastILM:settings:v3';
function run(factory,c,speed){
 let now=0,line;const predict=factory(()=>now),self={id:1,active:true},target={id:2,active:true};
 for(const p of c.samples){now=p.time;Object.assign(self,p.own);Object.assign(target,p.target);predict.observe(self);predict.observe(target);}
 now=c.now;const aim={targetPlayer:target,lastAngle:0};
 const angle=predict.resolve(aim,{players:[null,self],lines:[{reset(...args){line=args;}}]},1,stable,speed,17);
 return {angle,lastAngle:aim.lastAngle,line};
}
test('stable far prediction exactly restores pre-tuning angles and lines across 512 independent AK and laser scenes',()=>{
 let count=0;
 for(const speed of [1.4,1.45])for(const c of scenes(speed,'far',true)){
  assert.deepEqual(run(current,c,speed),run(original,c,speed),JSON.stringify({speed,kind:c.kind,distance:c.distance,interval:c.interval}));count++;
 }
 assert.equal(count,512);
});
test('both equipped guns use the stable far buttons and match the previous predictor through jitter, reversal and stopping',()=>{
 const f=fixture({dom:true}),self=player(1,1000,1000);self['Іࡈ５']=1;
 f.B.types=[];f.B.types[1]={ilmWeaponTable:[{}, {ilmBulletSpeed:1.4},{ilmBulletSpeed:1.45}]};
 scene(f,1,[self,player(2,1800,1000)]);f.mod.step(0);
 try{
  for(const [key,weapon,speed]of [['ak47_far',1,1.4],['laser_far',2,1.45]]){
   f.mod.trackPacket(1,2,0,0,0,false);f.mod.applyAimPreset(key);f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);self['Іࡈ５']=weapon;
   let now=0;const expected=original(()=>now),a={id:1,active:true},b={id:2,active:true};
   for(const [t,y]of [[0,1000],[106,1030],[198,1060],[304,1090],[402,1060],[504,1060]]){
    now=t;f.setClock(t);const sx=1000+t*.15;
    f.mod.trackPacket(1,1,0,sx,1000,true);f.mod.trackPacket(1,2,0,1800,y,true);
    Object.assign(a,{x:sx,y:1000});Object.assign(b,{x:1800,y});expected.observe(a);expected.observe(b);
    if(t<198)continue;
    now=t+31;f.setClock(now);const wanted=expected.resolve({targetPlayer:b,lastAngle:0},{players:[null,a],lines:[{reset(){}}]},1,stable,speed,0);
    const before=f.packets.length;f.mod.aim.refresh();assert.equal(f.packets.length,before+1);assert.equal(f.packets.at(-1)[1],(wanted+360)%360);
   }
  }
 }finally{f.mod.dispose();}
});
test('saved shipped far profiles and former default are repaired once, backed up, and keep unrelated settings',()=>{
 const profiles=[{distanceCoefficient:300,bulletSpeedCoefficient:4,offsetCoefficient:.8,resolverType:'linear'},{distanceCoefficient:330,bulletSpeedCoefficient:4,offsetCoefficient:1.6,resolverType:'smoothed'},{distanceCoefficient:300,bulletSpeedCoefficient:4,offsetCoefficient:.1,resolverType:'linear'}];
 for(const prior of profiles){
  const saved={...prior,ImprovedAimEnabled:true,mouseFovEnable:true,mouseFov:450,target:'players',lockId:-1,zoomFactor:.8,AimBotEnabled:true,RightClickDoors:true,JitterSpeed:500};
  const f=fixture({saved:{[SAVE]:JSON.stringify(saved),[SAVE+':ilm2']:'1',token:'unchanged',tokenId:'unchanged-id'}});
  try{
   for(const key of Object.keys(prior))assert.equal(f.mod.settings[key],stable[key]);
   for(const key of ['mouseFov','zoomFactor','AimBotEnabled','RightClickDoors','JitterSpeed'])assert.equal(f.mod.settings[key],saved[key]);
   assert.deepEqual(JSON.parse(f.storage.get(SAVE+':far-aim-before-v1')),prior);assert.equal(f.packets.length,0);assert.equal(f.storage.get('token'),'unchanged');assert.equal(f.storage.get('tokenId'),'unchanged-id');
   // A later deliberate change is not migrated again, even if it equals an old preset.
   f.mod.setSetting('distanceCoefficient',330);f.mod.setSetting('offsetCoefficient',1.6);
   const again=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(again.mod.settings.distanceCoefficient,330);assert.equal(again.mod.settings.offsetCoefficient,1.6);}finally{again.mod.dispose();}
  }finally{f.mod.dispose();}
 }
});
test('custom coefficients, close profiles, and disabled improved prediction are not reset by the far repair',()=>{
 for(const extra of [{distanceCoefficient:420,offsetCoefficient:.7,resolverType:'linear'},{distanceCoefficient:330,offsetCoefficient:.1,resolverType:'linear',mouseFov:250},{distanceCoefficient:300,offsetCoefficient:.8,resolverType:'linear',ImprovedAimEnabled:false}]){
  const saved={ImprovedAimEnabled:true,bulletSpeedCoefficient:4,mouseFovEnable:true,mouseFov:450,target:'players',lockId:-1,...extra};
  const f=fixture({saved:{[SAVE]:JSON.stringify(saved),[SAVE+':ilm2']:'1'}});try{
   for(const key of Object.keys(saved))assert.equal(f.mod.settings[key],saved[key]);assert.equal(f.storage.has(SAVE+':far-aim-before-v1'),false);
  }finally{f.mod.dispose();}
 }
});
