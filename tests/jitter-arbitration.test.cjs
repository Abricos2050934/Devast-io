const test=require('node:test'),assert=require('node:assert/strict'),{fixture,menu,control}=require('./mod-fixture.cjs');
test('our original rotation has configurable speed and protects manual and automatic shots',()=>{
 const f=fixture();f.B.input={angle:0};const s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘'].map(k=>[k,k]));
 try{assert.deepEqual([...f.timerPeriods.values()].sort((a,b)=>a-b),[50,50,200]);const r=require('../tools/verify_jitter.cjs').verifyJitter(f.mod,{...f.B,playerType:1,setClock:f.setClock,capturePackets:()=>({packets:f.packets,restore(){}})},s);assert.equal(r.status,'passed');}finally{f.mod.dispose();}
});
test('our Jitter menu, saved speed, and J binding replace the imported modes',()=>{
 const f=fixture({dom:true});try{const gui=menu(f);control(gui.__folders.Jitter,'JitterSpeed').setValue(720);assert.equal(f.mod.settings.JitterSpeed,720);for(const c of gui.__folders['Anti-Aim / Strafe'].__controllers)assert.ok(!['jitterActive','jitterOffset','stopJittersOnStop','antiAimMode'].includes(c.property));
  const dispatch=e=>{for(const fn of f.listeners.get('keydown'))fn(e);};dispatch({code:'KeyJ',target:{tagName:'INPUT'}});assert.equal(f.mod.settings.JitterEnabled,false);dispatch({code:'KeyJ',target:{tagName:'CANVAS'}});assert.equal(f.mod.settings.JitterEnabled,true);
  const g=fixture({saved:Object.fromEntries(f.storage)});try{assert.equal(g.mod.settings.JitterSpeed,720);assert.equal(g.mod.settings.JitterEnabled,true);}finally{g.mod.dispose();}for(const v of [0,-1,3601,NaN,Infinity])assert.throws(()=>f.mod.setSetting('JitterSpeed',v));
 }finally{f.mod.dispose();}
});
test('rotation leaves native movement and pointer untouched and sends at most 20Hz',()=>{
 const f=fixture();try{let writes=0;f.B.input={movement:5,state:3,get angle(){return .7;},set angle(v){writes++;}};f.setClock(0);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.setSetting('JitterEnabled',true);f.packets.length=0;for(let t=0;t<=1000;t+=10){f.setClock(t);f.mod.step(t);if(t%50===0)f.mod.jitterTick();}assert.ok(f.packets.length<=21);assert.ok(f.packets.every(p=>p[0]===6));assert.equal(writes,0);assert.equal(f.B.input.movement,5);assert.equal(f.B.input.state,3);}finally{f.mod.dispose();}
});
