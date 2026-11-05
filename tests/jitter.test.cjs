const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
function setup(){
 const f=fixture({dom:true});f.B.input={angle:0};f.setClock(0);
 f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2,1,100,100,true);
 f.mod.setSetting('mouseFovEnable',false);
 return f;
}
test('Jitter GUI rotates standing and moving players at the chosen speed without movement commands',()=>{
 const f=setup();try{
  const gui=menu(f).__folders.Jitter;
  control(gui,'JitterEnabled').setValue(true);control(gui,'JitterSpeed').setValue(180);
  f.mod.step(0);f.mod.step(250);f.setClock(250);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],45);
  f.world['ᅠᏧ‍'].x=40;f.mod.step(500);f.setClock(500);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],90);
  f.mod.setSetting('JitterSpeed',360);f.mod.step(750);f.setClock(750);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],180);
  assert.ok(f.packets.every(p=>p[0]===6));assert.equal(f.mod.jitterAngle,Math.PI);
  f.mod.setSetting('JitterEnabled',false);assert.equal(f.mod.jitterAngle,null);assert.equal(f.B.input.angle,0);
 }finally{f.mod.dispose();}
});
test('Jitter preserves ILM core but aims immediately before fire and throughout held fire, then resumes',()=>{
 const f=setup();try{
  f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('JitterEnabled',true);
  f.mod.step(0);f.mod.step(200);f.setClock(200);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],72);
  f.setClock(200);f.mod.beforeFire();assert.equal(f.packets.at(-1)[1],45);assert.equal(f.mod.jitterAngle,null);
  f.mod.aim.mouseDown=true;f.mod.step(400);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],45);assert.equal(f.mod.jitterAngle,null);
  f.mod.aim.mouseDown=false;f.setClock(500);f.mod.step(500);f.mod.step(750);f.setClock(750);f.mod.aim.refresh();assert.equal(f.packets.at(-1)[1],90);
 }finally{f.mod.dispose();}
});
test('Jitter pauses during manual fire without aim, death, disconnect and disposal; rate is bounded',()=>{
 const f=setup();try{
  f.mod.setSetting('JitterEnabled',true);f.mod.step(0);f.mod.aim.refresh();f.packets.length=0;
  for(let t=1;t<=100;t++){f.mod.step(t);f.setClock(t);f.mod.aim.refresh();}assert.equal(f.packets.length,2);
  f.mod.aim.mouseDown=true;f.mod.step(200);assert.equal(f.mod.jitterAngle,null);
  f.mod.aim.mouseDown=false;f.mod.step(250);f.network.state=64;f.mod.step(300);assert.equal(f.mod.jitterAngle,null);
  const count=f.packets.length;f.mod.aim.refresh();assert.equal(f.packets.length,count);
  f.network.state=1;f.world['ᅠᏧ‍'].id=0;f.mod.step(350);assert.equal(f.mod.jitterAngle,null);
  f.mod.dispose();f.mod.step(1000);assert.equal(f.packets.length,count);
 }finally{f.mod.dispose();}
});
test('Jitter settings persist and reject nonfinite or out of range speeds',()=>{
 const f=setup();try{
  for(const n of [0,-1,3601,NaN,Infinity])assert.throws(()=>f.mod.setSetting('JitterSpeed',n));
  f.mod.setSetting('JitterSpeed',720);const saved=Object.fromEntries(f.storage);
  const restored=fixture({dom:true,saved});try{assert.equal(restored.mod.settings.JitterSpeed,720);}finally{restored.mod.dispose();}
 }finally{f.mod.dispose();}
});
test('raw native fire patch calls shot alignment before the native attack encoder',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const context=vm.createContext({events:[],__responsiveMod:{beforeFire(){context.events.push('aim');}}});
 vm.runInContext(fs.readFileSync('mod/ilm-aim.js','utf8'),context);
 const source='function ᴎ༩༣( ) {ﾠࠂ̶=ᴉ̡̂;ιܕ︅(еϲᄄ.ᴎ︅ހ([ⲣᄇ̴]));}';context.source=source;
 const patched=vm.runInContext('__jitterPatchNativeFire(source)',context);
 vm.runInContext('var ᴉ̡̂=1,ﾠࠂ̶=0,ⲣᄇ̴=4;function ιܕ︅(){};var еϲᄄ={ᴎ︅ހ(){events.push("attack");}};'+patched+';ᴎ༩༣();',context);
 assert.deepEqual(Array.from(context.events),['aim','attack']);
 context.source='unknown';assert.throws(()=>vm.runInContext('__jitterPatchNativeFire(source)',context),/Unsupported/);
});
test('Jitter autoFire gives a turning target the ILM angle, and a missing target never restores stale aim',()=>{
 const f=setup();try{
  f.mod.setSetting('JitterEnabled',true);f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('lockId',2);
  for(const x of [80,90,80])f.mod.trackPacket(1,2,1,x,100,true);
  f.mod.setSetting('autoFire',true);f.mod.aim.refresh();
  assert.deepEqual(f.packets.slice(-3).map(p=>p[0]),[6,4,5]);assert.equal(f.mod.jitterAngle,null);
  f.mod.setSetting('autoFire',false);f.mod.setSetting('lockId',-1);f.mod.trackPacket(1,2,1,0,0,false);
  f.mod.aim.mouseDown=true;f.packets.length=0;f.mod.aim.refresh();assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('J toggles Jitter, ignores typing/repeats, and its Keyboard binding can be reassigned and saved',()=>{
 const f=setup();try{
  assert.equal(f.mod.settings.JitterKey,'KeyJ');
  const press=[...f.listeners.get('keydown')][0];
  press({code:'KeyJ',target:{tagName:'INPUT'}});press({code:'KeyJ',target:{tagName:'CANVAS'},repeat:true});
  f.B.chatActive=()=>true;press({code:'KeyJ',target:{tagName:'CANVAS'}});f.B.chatActive=()=>false;
  assert.equal(f.mod.settings.JitterEnabled,false);
  press({code:'KeyJ',target:{tagName:'CANVAS'}});assert.equal(f.mod.settings.JitterEnabled,true);
  f.mod.step(0);f.mod.step(250);assert.notEqual(f.mod.jitterAngle,null);
  press({code:'KeyJ',target:{tagName:'CANVAS'}});assert.equal(f.mod.settings.JitterEnabled,false);assert.equal(f.mod.jitterAngle,null);
  const input=control(menu(f).__folders.Keyboard,'JitterKey').domElement.querySelector('input');
  for(const fn of input.listeners.get('click'))fn();
  press({code:'KeyZ',target:{tagName:'CANVAS'},preventDefault(){},stopImmediatePropagation(){}});
  assert.equal(f.mod.settings.JitterKey,'KeyZ');assert.equal(f.mod.settings.JitterEnabled,false);
  press({code:'KeyJ',target:{tagName:'CANVAS'}});assert.equal(f.mod.settings.JitterEnabled,false);
  press({code:'KeyZ',target:{tagName:'CANVAS'}});assert.equal(f.mod.settings.JitterEnabled,true);
  const restored=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(restored.mod.settings.JitterKey,'KeyZ');}finally{restored.mod.dispose();}
  f.mod.setSetting('JitterKey','Space');assert.equal(f.mod.settings.AimbotKey,'KeyZ');
 }finally{f.mod.dispose();}
});
test('continuous native fire aligns Jitter once and then uses only the original 50 ms ILM aim packets',()=>{
 const f=setup();try{
  f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('JitterEnabled',true);f.mod.step(0);f.mod.step(200);f.packets.length=0;
  f.mod.aim.mouseDown=true;f.setClock(200);f.mod.beforeFire();assert.equal(f.packets.length,1);assert.equal(f.packets[0][0],6);
  f.mod.trackPacket(1,2,1,120,150,true);const line=JSON.stringify(f.mod.targets.lines[0]);
  for(let i=1;i<=20;i++){f.setClock(200+i*5);f.mod.beforeFire();}
  assert.equal(f.packets.length,1,'Repeated native attacks added aim packets');assert.equal(JSON.stringify(f.mod.targets.lines[0]),line,'Repeated native attacks recalculated ILM');
  f.mod.aim.refresh();assert.equal(f.packets.length,2);assert.equal(f.packets.at(-1)[0],6);assert.notEqual(JSON.stringify(f.mod.targets.lines[0]),line);
  f.mod.aim.mouseDown=false;f.setClock(500);f.mod.step(500);f.mod.step(750);assert.notEqual(f.mod.jitterAngle,null);
 }finally{f.mod.dispose();}
});
test('non-Jitter fire synchronizes once with ILM, then holds the original timer cadence',()=>{
 const f=setup();try{
  f.mod.setSetting('AimBotEnabled',true);f.mod.aim.refresh();
  const count=f.packets.length,line=JSON.stringify(f.mod.targets.lines[0]);f.mod.aim.mouseDown=true;
  f.mod.trackPacket(1,2,1,120,150,true);f.setClock(0);f.mod.beforeFire();
  assert.equal(f.packets.length,count+1);assert.notEqual(JSON.stringify(f.mod.targets.lines[0]),line);
  const aligned=JSON.stringify(f.mod.targets.lines[0]);
  for(let i=1;i<=20;i++){f.setClock(i*5);f.mod.beforeFire();}
  assert.equal(f.packets.length,count+1);assert.equal(JSON.stringify(f.mod.targets.lines[0]),aligned);
  assert.equal(Object.hasOwn(f.mod,'firingAngle'),false);
 }finally{f.mod.dispose();}
});
test('Jitter leaves native pointer and movement state untouched, including when toggled off',()=>{
 const f=setup();try{
  let angle=.7,writes=0;f.B.input={x:25,y:70,state:3,movement:5,get angle(){return angle;},set angle(v){writes++;angle=v;}};
  f.mod.setSetting('JitterEnabled',true);
  for(let t=0;t<=1000;t+=10){f.setClock(t);f.mod.step(t);if(t%50===0)f.mod.aim.refresh();}
  assert.equal(writes,0);assert.equal(angle,.7);assert.equal(f.B.input.movement,5);assert.equal(f.B.input.state,3);assert.equal(f.B.input.x,25);assert.equal(f.B.input.y,70);
  f.B.input.angle=1.3;f.mod.setSetting('JitterEnabled',false);assert.equal(angle,1.3);assert.equal(writes,1,'Stopping Jitter overwrote fresh native input');
 }finally{f.mod.dispose();}
});
test('RAF only draws Jitter; one timer sends directions at no more than 20 Hz',()=>{
 const f=setup();try{
  f.mod.setSetting('JitterEnabled',true);f.mod.setSetting('JitterSpeed',180);
  for(let t=0;t<=1000;t+=10){
   f.setClock(t);const count=f.packets.length;f.mod.step(t);assert.equal(f.packets.length,count,'RAF sent an idle rotation packet');
   if(t%50===0)f.mod.aim.refresh();
  }
  assert.equal(f.packets.length,21);assert.ok(f.packets.every(p=>p[0]===6));assert.equal(f.packets.at(-1)[1],180);
 }finally{f.mod.dispose();}
});
test('Jitter defers cosmetic directions on socket backlog and sends only the latest one when drained',()=>{
 const f=setup();try{
  const socket={readyState:1,bufferedAmount:4096};f.mod.observeSocket(socket);f.mod.setSetting('JitterEnabled',true);f.mod.setSetting('JitterSpeed',180);
  for(let t=0;t<=1000;t+=50){f.setClock(t);f.mod.step(t);f.mod.aim.refresh();}
  assert.equal(f.packets.length,0);assert.equal(f.mod.jitterAngle,Math.PI);assert.ok(f.mod.connectionInfo().jitterTransport.deferredDirections>=20);
  // Native movement remains an immediate native send, independent of idle spin.
  f.network['ᴎᚂρ'](JSON.stringify([3,1]));assert.deepEqual(f.packets,[[3,1]]);f.packets.length=0;
  socket.bufferedAmount=0;f.setClock(1050);f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,189]]);
  socket.bufferedAmount=4096;f.mod.setSetting('AimBotEnabled',true);f.mod.beforeFire();assert.deepEqual(f.packets,[[6,189]],'Shot alignment added an angle to the blocked queue');
  socket.bufferedAmount=0;f.mod.beforeFire();assert.equal(f.packets.at(-1)[1],45,'First writable shot did not align after the queue drained');
 }finally{f.mod.dispose();}
});
