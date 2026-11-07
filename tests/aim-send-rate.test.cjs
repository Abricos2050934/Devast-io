const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
function setup(){const f=fixture();for(const [k,v]of Object.entries({mouseFovEnable:false,lockId:2,AimBotEnabled:false,autoFire:false,hideAimbotAngle:false,jitterActive:false}))f.mod.setSetting(k,v);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1400,1100,true);f.mod.setSetting('AimBotEnabled',true);return f;}
test('stationary aim collapses simultaneous RAF, packet and backup callbacks into one wire direction',()=>{
 const f=setup();try{for(let at=0;at<10000;at++){f.setClock(2000+at);if(at%7===0)f.mod.aim.refresh();if(at%50===0){f.mod.trackPacket(1,2,1,1400,1100,true);for(const [id,fn]of f.timers)if(f.timerPeriods.get(id)===50)fn();}}
 assert.deepEqual(f.packets,[[6,14]]);assert.ok(f.mod.connectionInfo().aimTransport.rateLimitedCycles>1000);assert.ok(f.mod.connectionInfo().aimTransport.deduplicatedDirections>100);
 }finally{f.mod.dispose();}
});
test('busy moving-target updates send at most 20 current cycles per second and preserve attack/release pairs',()=>{
 const f=setup();try{f.mod.setSetting('autoFire',true);f.mod.setSetting('hideAimbotAngle',true);const sent=[];let seen=0;
 for(let at=0;at<10000;at+=10){f.setClock(2000+at);f.mod.trackPacket(1,2,1,1400+(at%20?100:0),1100+at/10,true);for(let i=0;i<5;i++)f.mod.aim.refresh();if(f.packets.length>seen){sent.push({at,packets:f.packets.slice(seen)});seen=f.packets.length;}}
 assert.equal(sent.length,200);for(let i=1;i<sent.length;i++)assert.ok(sent[i].at-sent[i-1].at>=50);
 assert.ok(f.packets.some(p=>p[0]===4));for(const batch of sent){const ops=batch.packets.map(p=>p[0]);assert.ok(ops.filter(op=>op===6).length<=1);assert.deepEqual(ops.filter(op=>op!==6),[4,5]);}
 assert.ok(f.mod.aim.lastAngle!==0);assert.equal(f.mod.connectionInfo().aimTransport.intervalMs,50);
 }finally{f.mod.dispose();}
});
test('native manual shots align to the newest prediction even inside a limited background interval',()=>{
 const f=setup();try{f.setClock(2000);f.mod.aim.refresh();f.setClock(2010);f.mod.trackPacket(1,2,1,1000,1500,true);const expected=(Math.round(f.mod.aim.lastAngle)%360+360)%360;f.packets.length=0;f.mod.beforeFire();f.packets.push([4]);f.mod.afterFire();assert.deepEqual(f.packets,[[6,expected],[4]]);f.setClock(2020);f.mod.trackPacket(1,2,1,1500,1000,true);f.packets.length=0;f.mod.beforeFire();assert.equal(f.packets[0][0],6);assert.notEqual(f.packets[0][1],expected,'Later shot reused an earlier target direction');
 }finally{f.mod.dispose();}
});
test('disabled aim, missing targets, self lock and closed sockets cannot forward stale direction timers',()=>{
 const f=setup();try{f.mod.trackPacket(1,2,1,0,0,false);f.packets.length=0;f.setClock(2000);f.mod.aim.refresh();assert.equal(f.packets.length,0);assert.equal(f.mod.controlsAimDirection,false);
 f.mod.setSetting('lockId',1);f.mod.aim.refresh();assert.equal(f.packets.length,0);
 f.mod.setSetting('lockId',2);f.mod.trackPacket(1,2,1,1400,1100,true);f.mod.setSetting('AimBotEnabled',false);f.packets.length=0;for(let at=0;at<2000;at+=50){f.setClock(3000+at);for(const fn of f.timers.values())fn();f.mod.aim.refresh();}assert.equal(f.packets.length,0);
 f.mod.setSetting('AimBotEnabled',true);f.mod.observeSocket({readyState:3,bufferedAmount:0});f.mod.aim.refresh();assert.equal(f.packets.length,0);
 }finally{f.mod.dispose();}
});

test('imported Jitter plus hidden-angle mode forwards only the final direction of each background cycle',()=>{
 for(const mode of ['At target','Round','Round2']){const f=setup();try{f.mod.setSetting('jitterActive',true);f.mod.setSetting('hideAimbotAngle',true);f.mod.setSetting('antiAimMode',mode);for(let at=0;at<10000;at+=10){f.setClock(2000+at);const before=f.packets.length;f.mod.aim.refresh();f.mod.aim.refresh();assert.ok(f.packets.length-before<=1,mode+' emitted two different directions in one cycle');}assert.ok(f.packets.length>0&&f.packets.length<=200);}finally{f.mod.dispose();}}
});
