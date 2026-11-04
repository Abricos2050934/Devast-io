const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene,player,menu,control}=require('./mod-fixture.cjs');
function setup(speed=1.4){
 const f=fixture({dom:true}),self=player(1);self['Іࡈ５']=0;scene(f,1,[self,player(2)]);
 f.B.types=[];f.B.types[1]={curveWeapons:[{curveBulletSpeed:speed,path:900}]};
 f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('lockId',2);f.mod.step(0);
 f.sample=(t,a,b)=>{f.setClock(t);f.mod.trackPacket(1,1,1,a.x,a.y,true);f.mod.trackPacket(1,2,1,b.x,b.y,true);return f.mod.aim.resolve();};return f;
}
function trajectory({radius=120,speed=.35,phase=1,direction=1,polygon=false,ownRadius=radius}={}){
 const omega=direction*speed/radius;
 return (t,own=false)=>{
  const a=omega*t-(own?phase:0),r=own?ownRadius:radius;let x=Math.cos(a),y=Math.sin(a);
  if(polygon){const segment=Math.PI/4,base=Math.floor(a/segment)*segment,q=(a-base)/segment;x=Math.cos(base)*(1-q)+Math.cos(base+segment)*q;y=Math.sin(base)*(1-q)+Math.sin(base+segment)*q;}
  return {x:2000+r*x,y:2000+r*y};
 };
}
function miss(angle,projectile,origin,targetAt){
 const a=angle*Math.PI/180;let best=Infinity;
 for(let t=0;t<=900/projectile;t+=.5){const p=targetAt(t);best=Math.min(best,Math.hypot(p.x-origin.x-projectile*t*Math.cos(a),p.y-origin.y-projectile*t*Math.sin(a)));}
 return best;
}
function compare(){
 const cases=[];
 for(const projectile of [1.4,1.45])for(const radius of [90,160,300])for(const dt of [50,100])for(const phase of [.5,1.2,1.9])for(const direction of [-1,1])for(const polygon of [false,true]){
  const path=trajectory({radius,phase,direction,polygon,ownRadius:radius*1.15}),f=setup(projectile);try{
   let last=0;
   for(let i=0;i<24;i++){
    const t=i*dt+(i%3===1?7:0),round=p=>({x:Math.round(p.x),y:Math.round(p.y)});last=t;
    f.sample(t,round(path(t,true)),round(path(t)));
   }
   const now=last+40;f.setClock(now);f.mod.setSetting('CurvedAimEnabled',false);const legacy=f.mod.aim.resolve();f.mod.setSetting('CurvedAimEnabled',true);const enhanced=f.mod.aim.resolve();
   cases.push({projectile,radius,dt,phase,direction,polygon,mode:f.mod.curvedAimMode,legacy:miss(legacy,projectile,path(now,true),t=>path(now+t)),enhanced:miss(enhanced,projectile,path(now,true),t=>path(now+t))});
  }finally{f.mod.dispose();}
 }
 return {scenes:cases.length,used:cases.filter(c=>c.mode==='curve').length,legacyHits:cases.filter(c=>c.legacy<=38).length,enhancedHits:cases.filter(c=>c.enhanced<=38).length,legacyRms:Math.sqrt(cases.reduce((s,c)=>s+c.legacy**2,0)/cases.length),enhancedRms:Math.sqrt(cases.reduce((s,c)=>s+c.enhanced**2,0)/cases.length),cases};
}
function warm(f,path=trajectory()) {for(let i=0;i<24;i++)f.sample(i*50,path(i*50,true),path(i*50));}
test('circular chasing improves independent hit geometry for both native guns, turns, polygonal movement and packet jitter',()=>{
 const r=compare();assert.equal(r.scenes,144);assert.ok(r.used>=100,JSON.stringify({...r,cases:undefined}));assert.ok(r.enhancedRms<r.legacyRms*.6,JSON.stringify({...r,cases:undefined}));assert.ok(r.enhancedHits>r.legacyHits);assert.equal(r.cases.filter(c=>c.legacy<=38&&c.enhanced>38).length,0,'A previously intersecting path became a miss');
});
test('straight movement and missing native weapon data preserve the original ILM result',()=>{
 const f=setup();try{
  for(let i=0;i<24;i++)f.sample(i*50,{x:1000+i*10,y:1000},{x:1500+i*10,y:1200});
  const enhanced=f.mod.aim.resolve();assert.equal(f.mod.curvedAimMode,'ilm');f.mod.setSetting('CurvedAimEnabled',false);assert.equal(f.mod.aim.resolve(),enhanced);
  f.mod.setSetting('CurvedAimEnabled',true);warm(f);assert.equal(f.mod.curvedAimMode,'curve');
  f.B.types[1].curveWeapons[0].curveBulletSpeed=NaN;const fallback=f.mod.aim.resolve();assert.equal(f.mod.curvedAimMode,'ilm');
  f.mod.setSetting('CurvedAimEnabled',false);assert.equal(f.mod.aim.resolve(),fallback);
 }finally{f.mod.dispose();}
});
test('stopping, reversing, teleporting and reused IDs immediately discard an old orbit',()=>{
 for(const kind of ['stop','reverse','teleport','reuse']){
  const f=setup(),path=trajectory();try{
   warm(f,path);assert.equal(f.mod.curvedAimMode,'curve');const t=1150,last=path(t),prior=path(t-50);
   let next=kind==='stop'?last:kind==='reverse'?prior:{x:last.x+1000,y:last.y};
   if(kind==='reuse'){f.mod.trackPacket(1,2,1,0,0,false);next=path(t+50);}
   f.sample(t+50,path(t+50,true),next);const angle=f.mod.aim.resolve();assert.equal(f.mod.curvedAimMode,'ilm',kind);
   f.mod.setSetting('CurvedAimEnabled',false);assert.equal(f.mod.aim.resolve(),angle,kind);
  }finally{f.mod.dispose();}
 }
});
test('stale samples and insufficient projectile range never extrapolate an old circle',()=>{
 const f=setup();try{
  warm(f);f.setClock(2000);const stale=f.mod.aim.resolve();assert.equal(f.mod.curvedAimMode,'ilm');
  f.mod.setSetting('CurvedAimEnabled',false);assert.equal(f.mod.aim.resolve(),stale);f.mod.setSetting('CurvedAimEnabled',true);
  warm(f);f.B.types[1].curveWeapons[0].path=5;f.mod.aim.resolve();assert.equal(f.mod.curvedAimMode,'ilm');
 }finally{f.mod.dispose();}
});
test('curve option persists separately from the five original controls and preserves Jitter and settings',()=>{
 const f=setup();try{
  const gui=menu(f);assert.equal(gui.__folders['Aim Bot'].__controllers.length,5);const toggle=control(gui.__folders.Prediction,'CurvedAimEnabled');assert.equal(f.mod.settings.CurvedAimEnabled,true);
  f.mod.setSetting('JitterSpeed',720);toggle.setValue(false);assert.equal(f.mod.settings.CurvedAimEnabled,false);
  const restored=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(restored.mod.settings.CurvedAimEnabled,false);assert.equal(restored.mod.settings.JitterSpeed,720);}finally{restored.mod.dispose();}
 }finally{f.mod.dispose();}
});
test('circular prediction, first shot, displayed angle and 50 ms cadence share the same resolved direction',()=>{
 const f=setup();try{
  warm(f);assert.equal(f.packets.length,0,'History observation sent packets');f.mod.aim.refresh();const first=f.packets.at(-1)[1];
  assert.equal(f.mod.curvedAimMode,'curve');assert.equal(f.mod.aimRenderAngle,first*Math.PI/180);
  f.mod.beforeFire();f.network['ᴎᚂρ']('[4]');assert.deepEqual(f.packets.slice(-2),[[6,first],[4]]);
  const count=f.packets.length;for(let i=1;i<=20;i++){f.setClock(1150+i*5);f.mod.beforeFire();}assert.equal(f.packets.length,count);
  assert.equal(f.timerPeriods.values().next().value,50);assert.equal(f.B.input?.angle,undefined);
 }finally{f.mod.dispose();}
});
test('reconnecting with the same player ID refreshes the equipped-weapon entity cache',()=>{
 const f=setup();try{
  warm(f);assert.equal(f.mod.curvedAimMode,'curve');
  f.B.types[1].curveWeapons[0].path=5;f.B.types[1].curveWeapons.push({curveBulletSpeed:1.45,path:900});
  const replacement=player(1);replacement['Іࡈ５']=1;scene(f,1,[replacement,player(2)]);
  f.mod.observeSocket({readyState:1,bufferedAmount:0});f.mod.step(1150);f.mod.aim.resolve();
  assert.equal(f.mod.curvedAimMode,'curve');
 }finally{f.mod.dispose();}
});
module.exports={compare,setup,trajectory,warm};
