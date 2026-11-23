const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,menu,control}=require('./mod-fixture.cjs');
const labels=f=>f.dom.calls.filter(c=>c.name==='fillText'&&/avgPing:|currentPing:|deltaPing:|delay:|lead:|Video Aim:/.test(String(c.args[0])));
test('the left HUD shows configured ping honestly before any measurements exist',()=>{
 const f=fixture({dom:true,adaptive:true});try{
  f.mod.render();const rows=labels(f),text=rows.map(r=>r.args[0]).join('\n');
  assert.match(text,/avgPing: 90\.0 ms \(задано; режим выкл\.\)/);assert.match(text,/currentPing: —/);assert.match(text,/deltaPing: —/);assert.match(text,/delay: 111\.0 ms/);assert.match(text,/lead: 90\.0 ms/);
  assert.ok(rows.length>0&&rows.every(r=>r.args[1]===12&&Number.isFinite(r.args[2])));assert.equal(f.mod.aimTiming().samples,0);assert.equal(f.mod.diagnostics.errors.length,0);
 }finally{f.mod.dispose();}
});
test('measured values replace the configured label and update the displayed delta',()=>{
 const f=fixture({dom:true,adaptive:true});try{
  f.mod.setSetting('VideoAimEnabled',true);f.mod.sampleAimRtt(80);f.mod.sampleAimRtt(120);f.mod.render();
  const text=labels(f).map(r=>r.args[0]).join('\n');assert.match(text,/avgPing: 100\.0 ms \(2 зам\.\)/);assert.match(text,/currentPing: 120\.0 ms/);assert.match(text,/deltaPing: 20\.0 ms/);assert.match(text,/delay: 121\.0 ms/);assert.doesNotMatch(text,/задано/);
  assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});
test('HUD visibility is saved and no statistics are drawn after death, disconnect or disposal',()=>{
 const f=fixture({dom:true,adaptive:true});try{
  const folder=menu(f).__folders['Adaptive Aim'].__folders['Video Prediction — эксперимент'];control(folder,'VideoAimHudEnabled').setValue(false);f.mod.render();assert.equal(labels(f).length,0);assert.equal(JSON.parse(f.storage.get('DevastILM:settings:v3')).VideoAimHudEnabled,false);
  f.mod.setSetting('VideoAimHudEnabled',true);f.mod.reconnect.sessionEnded=true;f.mod.render();assert.equal(labels(f).length,0);
  f.mod.reconnect.sessionEnded=false;f.network.state=64;f.mod.render();assert.equal(labels(f).length,0);
 }finally{f.mod.dispose();}f.mod.render();assert.equal(labels(f).length,0);
});
test('the full-height HUD remains fixed in screen space and preserves the native canvas transform',()=>{
 const f=fixture({dom:true,adaptive:true});try{
  f.B.synchronizedRender=true;f.dom.canvas.width=2560;f.dom.canvas.height=1600;f.dom.canvas.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:800});
  const ctx=f.dom.canvas.getContext('2d');ctx.setTransform(3,0,0,3,9,11);ctx.globalAlpha=.37;
  f.mod.render();assert.equal(labels(f).length,6);assert.ok(labels(f).some(r=>r.args[0]==='Video Aim: выключен'));assert.deepEqual(ctx.getTransform(),[3,0,0,3,9,11]);assert.equal(ctx.globalAlpha,.37);
  f.dom.calls.length=0;f.mod.setSetting('zoomFactor',.5);f.mod.render();assert.ok(labels(f).every(r=>r.args[1]===12));
 }finally{f.mod.dispose();}
});
