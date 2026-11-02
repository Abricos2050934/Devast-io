const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene,player,menu,control}=require('./mod-fixture.cjs');
function setup(speed=1.4){
 const f=fixture({dom:true}),self=player(1,1000,1000);self['Іࡈ５']=1;scene(f,1,[self,player(2,1500,1000)]);
 f.B.types=[];f.B.types[1]={ilmWeaponTable:[{}, {ilmBulletSpeed:speed}]};f.B.synchronizedRender=true;
 f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('lockId',2);f.mod.setSetting('AimBotEnabled',true);f.mod.render(0);
 f.sample=(time,x,y,sx=1000,sy=1000)=>{f.setClock(time);f.mod.trackPacket(1,1,1,sx,sy,true);f.mod.trackPacket(1,2,1,x,y,true);};return f;
}
function miss(angle,speed,source,target,velocity){
 const rad=angle*Math.PI/180,dx=target.x-source.x,dy=target.y-source.y,wx=Math.cos(rad)*speed-velocity.x,wy=Math.sin(rad)*speed-velocity.y;
 const time=Math.max(0,Math.min(900/speed,(dx*wx+dy*wy)/(wx*wx+wy*wy)));return Math.hypot(dx-wx*time,dy-wy*time);
}
function compare(){
 const cases=[];
 for(const speed of [1.4,1.45])for(const interval of [50,100,150,200])for(const velocity of [{x:0,y:.35},{x:.2,y:.25},{x:-.25,y:.1}])for(const distance of [400,700]){
  const f=setup(speed);try{
   for(let i=0;i<3;i++)f.sample(i*interval,1000+distance+velocity.x*i*interval,1000+velocity.y*i*interval);
   const now=interval*2+30;f.setClock(now);f.mod.setSetting('ImprovedAimEnabled',false);const legacy=f.mod.aim.resolve();f.mod.setSetting('ImprovedAimEnabled',true);const enhanced=f.mod.aim.resolve();
   const target={x:1000+distance+velocity.x*now,y:1000+velocity.y*now},source={x:1000,y:1000};cases.push({speed,interval,velocity,distance,legacy:miss(legacy,speed,source,target,velocity),enhanced:miss(enhanced,speed,source,target,velocity)});
  }finally{f.mod.dispose();}
 }
 return {scenes:cases.length,legacyRms:Math.sqrt(cases.reduce((sum,c)=>sum+c.legacy*c.legacy,0)/cases.length),enhancedRms:Math.sqrt(cases.reduce((sum,c)=>sum+c.enhanced*c.enhanced,0)/cases.length),legacyHits:cases.filter(c=>c.legacy<=38).length,enhancedHits:cases.filter(c=>c.enhanced<=38).length,cases};
}
test('timestamped interception reduces independent moving-target miss distance for AK and laser speeds over varied update intervals',()=>{
 const report=compare();assert.equal(report.scenes,48);assert.ok(report.enhancedRms<report.legacyRms*.35,JSON.stringify({...report,cases:undefined}));assert.ok(report.enhancedHits>report.legacyHits);
});
test('native weapon changes alter lead immediately without extra packets or scans',()=>{
 const f=setup();try{f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);const count=f.packets.length,slow=f.mod.aim.resolve();
  f.B.types[1].ilmWeaponTable[1].ilmBulletSpeed=2.8;const fast=f.mod.aim.resolve();assert.ok(fast<slow);assert.equal(f.packets.length,count);
  f.B.types[1].ilmWeaponTable[1].ilmBulletSpeed=NaN;const fallback=f.mod.aim.resolve();f.mod.setSetting('ImprovedAimEnabled',false);assert.equal(f.mod.aim.resolve(),fallback);
 }finally{f.mod.dispose();}
});
test('stale movement, duplicate times, teleports and reused IDs never preserve an old lead or produce invalid angles',()=>{
 const f=setup();try{f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);f.setClock(600);assert.equal(f.mod.aim.resolve(),Math.round(Math.atan2(80,500)*180/Math.PI));
  f.sample(600,1500,1080);assert.ok(Number.isFinite(f.mod.aim.resolve()));f.sample(650,2500,1000);assert.equal(f.mod.aim.resolve(),0);
  f.mod.trackPacket(1,2,1,0,0,false);f.sample(700,1500,1000);assert.equal(f.mod.aim.resolve(),0);
 }finally{f.mod.dispose();}
});
test('an observed stop or reversal immediately replaces prior velocity',()=>{
 const f=setup();try{f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);const forward=f.mod.aim.resolve();f.sample(300,1500,1040);const reversed=f.mod.aim.resolve();assert.ok(reversed<0&&forward>0);
  f.sample(400,1500,1040);assert.equal(f.mod.aim.resolve(),Math.round(Math.atan2(40,500)*180/Math.PI));
 }finally{f.mod.dispose();}
});
test('improved prediction toggle persists and still sends only one direction per original 50 ms tick',()=>{
 const f=setup();try{f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);const c=control(menu(f).__folders['Aim Bot'],'ImprovedAimEnabled');
  c.setValue(false);f.mod.aim.refresh();const original=f.packets.at(-1)[1];c.setValue(true);f.mod.aim.refresh();assert.notEqual(f.packets.at(-1)[1],original);assert.equal(f.packets.length,2);assert.ok(f.packets.every(p=>p[0]===6));assert.equal(JSON.parse(f.storage.get('DevastILM:settings:v3')).ImprovedAimEnabled,true);
 }finally{f.mod.dispose();}
});
module.exports={compare};
test('consistent packet-arrival jitter is pooled while current shooter motion and elapsed sample age are included',()=>{
 const f=setup();try{
  for(const [arrival,t]of [[0,0],[104,100],[198,200],[304,300]])f.sample(arrival,1500,1000+t*.3,1000+t*.2,1000);
  f.setClock(335);const angle=f.mod.aim.resolve(),source={x:1000+331*.2,y:1000},target={x:1500,y:1000+331*.3};
  assert.ok(miss(angle,1.4,source,target,{x:0,y:.3})<10);assert.ok(f.mod.targets.lines[0].x1>1060);
 }finally{f.mod.dispose();}
});
test('bullet and distance coefficients tune native projectile speed in enhanced mode',()=>{
 const f=setup();try{
  f.sample(0,1500,1000);f.sample(100,1500,1040);f.sample(200,1500,1080);const angle=f.mod.aim.resolve();
  f.mod.setSetting('bulletSpeedCoefficient',8);assert.ok(f.mod.aim.resolve()<angle);f.mod.setSetting('bulletSpeedCoefficient',4);
  f.mod.setSetting('distanceCoefficient',600);assert.ok(f.mod.aim.resolve()<angle);
 }finally{f.mod.dispose();}
});
