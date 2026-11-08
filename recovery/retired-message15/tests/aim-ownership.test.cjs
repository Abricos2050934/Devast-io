const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
function setup(){const f=fixture();for(const [k,v]of Object.entries({AimBotEnabled:false,autoFire:false,jitterActive:false,JitterEnabled:false,mouseFovEnable:false,lockId:-1}))f.mod.setSetting(k,v);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1500,1000,true);f.mod.setSetting('AimBotEnabled',true);f.setClock(2000);f.mod.aim.refresh();f.mod.beforeFire();return f;}
test('returning from mouse control reasserts an equal aim angle before the next shot',()=>{
 const f=setup();try{f.setClock(2010);f.mod.setSetting('mouseFov',80);f.mod.setSetting('mouseFovEnable',true);f.mod.targets.mouseMapCords={x:50000,y:50000};f.mod.aim.refresh();assert.equal(f.mod.controlsAimDirection,false);const releases=f.mod.connectionInfo().aimTransport.nativeYields;
 for(let i=0;i<20;i++)assert.equal(f.mod.controlsAimDirection,false);assert.equal(f.mod.connectionInfo().aimTransport.nativeYields,releases);
 f.network['ᴎᚂρ']('[6,90]');f.packets.length=0;f.setClock(2020);f.mod.setSetting('mouseFovEnable',false);f.mod.aim.refresh();f.mod.beforeFire();f.packets.push([4]);assert.deepEqual(f.packets,[[6,0],[4]]);assert.equal(f.mod.controlsAimDirection,true);
 }finally{f.mod.dispose();}
});
test('imported Jitter keeps direction ownership without a target and releases it when switched off',()=>{
 const f=setup();try{f.mod.trackPacket(1,2,1,0,0,false);f.mod.setSetting('jitterActive',true);f.mod.setSetting('antiAimMode','Round');f.setClock(2100);f.mod.aim.refresh();assert.equal(f.mod.aim.targetPlayer,null);assert.equal(f.mod.controlsAimDirection,true);
 f.mod.setSetting('jitterActive',false);assert.equal(f.mod.controlsAimDirection,false);assert.ok(f.mod.connectionInfo().aimTransport.nativeYields>=1);
 }finally{f.mod.dispose();}
});
test('socket changes and disabled aim still discard cached ownership and stale targets',()=>{
 const f=setup();try{f.mod.observeSocket({readyState:1,bufferedAmount:0});f.setClock(2010);f.packets.length=0;f.mod.aim.refresh();assert.deepEqual(f.packets,[[6,0]]);f.mod.setSetting('AimBotEnabled',false);assert.equal(f.mod.controlsAimDirection,false);f.mod.observeDeath([5,0,2]);assert.equal(f.mod.controlsAimDirection,false);f.packets.length=0;f.mod.aim.refresh();assert.deepEqual(f.packets,[]);
 }finally{f.mod.dispose();}
});
