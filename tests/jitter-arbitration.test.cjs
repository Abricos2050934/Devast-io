const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
test('one timer controls idle Jitter and target angles precede manual and automatic attacks',()=>{
 const f=fixture(),s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘'].map(k=>[k,k]));
 try{assert.equal([...f.timerPeriods.values()].filter(ms=>ms===100).length,1);const r=require('../tools/verify_jitter.cjs').verifyJitter(f.mod,{...f.B,playerType:1,setClock:f.setClock,capturePackets:()=>({packets:f.packets,restore(){}})},s);assert.equal(r.status,'passed');}finally{f.mod.dispose();}
});
test('manual fire without an aim target restores the real pointer before shooting',()=>{
 const f=fixture();try{f.B.input={angle:Math.PI/2};f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.setSetting('jitterActive',true);f.mod.aimModule.jitterTick();f.packets.length=0;f.mod.beforeFire();assert.deepEqual(f.packets,[[6,90]]);assert.equal(f.mod.controlsJitterDirection,false);}finally{f.mod.dispose();}
});
test('Jitter mode, offset and pause options keep the source calculations',()=>{
 for(const mode of ['At target','Round','Round2']){const f=fixture();try{f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1400,1000,true);f.mod.setSetting('jitterActive',true);f.mod.setSetting('antiAimMode',mode);f.mod.setSetting('jitterOffset',40);f.mod.aimModule.jitterTick();assert.equal(f.packets.at(-1)[0],6);assert.ok(f.mod.controlsJitterDirection);f.mod.setSetting('ShowRealAngles','never');assert.equal(f.mod.jitterAngle,null);f.mod.onSessionStart();f.mod.onHandshake();assert.equal(f.mod.controlsJitterDirection,false);}finally{f.mod.dispose();}}
});
