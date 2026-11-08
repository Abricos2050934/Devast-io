const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
function setup(){const f=fixture();for(const [k,v]of Object.entries({mouseFovEnable:false,lockId:2,AimBotEnabled:false,autoFire:false,hideAimbotAngle:false,jitterActive:false}))f.mod.setSetting(k,v);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1400,1100,true);f.mod.setSetting('AimBotEnabled',true);return f;}
test('stationary aim collapses simultaneous RAF, packet and backup callbacks into one wire direction',()=>{
 const f=setup();try{for(let at=0;at<10000;at++){f.setClock(2000+at);if(at%7===0)f.mod.aim.refresh();if(at%50===0){f.mod.trackPacket(1,2,1,1400,1100,true);for(const [id,fn]of f.timers)if(f.timerPeriods.get(id)===50)fn();}}
 assert.deepEqual(f.packets,[[6,14]]);assert.ok(f.mod.connectionInfo().aimTransport.deduplicatedDirections>100);
 }finally{f.mod.dispose();}
});
test('moving-target directions update immediately while automatic attack/release pairs stay bounded',()=>{
 const f=setup();try{f.mod.setSetting('autoFire',false);f.mod.setSetting('hideAimbotAngle',false);const attacks=[];let seen=0,directions=0;
 for(let at=0;at<10000;at+=10){f.setClock(2000+at);f.mod.trackPacket(1,2,1,1000+500*Math.cos(at/250),1000+500*Math.sin(at/250),true);for(let i=0;i<5;i++)f.mod.aim.refresh();
  const batch=f.packets.slice(seen);seen=f.packets.length;directions+=batch.filter(p=>p[0]===6).length;
  assert.equal(f.packets.filter(p=>p[0]===6).at(-1)?.[1],(Math.round(f.mod.aim.lastAngle)%360+360)%360,'Fresh direction was delayed');
  assert.ok(batch.every(p=>p[0]===6));
 }
 f.mod.setSetting('autoFire',true);seen=f.packets.length;
 for(let at=0;at<10000;at+=10){f.setClock(12000+at);f.mod.trackPacket(1,2,1,1400+(at%20?100:0),1100+at/10,true);for(let i=0;i<5;i++)f.mod.aim.refresh();const batch=f.packets.slice(seen);seen=f.packets.length;const ops=batch.filter(p=>p[0]!==6).map(p=>p[0]);if(ops.length){assert.deepEqual(ops,[4,5]);attacks.push(at);}}
 assert.equal(attacks.length,200);for(let i=1;i<attacks.length;i++)assert.ok(attacks[i]-attacks[i-1]>=50);
 assert.ok(directions>900);assert.equal(f.mod.connectionInfo().aimTransport.autoFireIntervalMs,50);assert.equal(f.mod.connectionInfo().aimTransport.changedDirectionsImmediate,true);
 }finally{f.mod.dispose();}
});
test('native manual shots align to the newest prediction even between background callbacks',()=>{
 const f=setup();try{f.setClock(2000);f.mod.aim.refresh();f.setClock(2010);f.mod.trackPacket(1,2,1,1000,1500,true);const expected=(Math.round(f.mod.aim.lastAngle)%360+360)%360;f.packets.length=0;f.mod.beforeFire();f.packets.push([4]);f.mod.afterFire();assert.deepEqual(f.packets,[[6,expected],[4]]);f.setClock(2020);f.mod.trackPacket(1,2,1,1500,1000,true);f.mod.beforeFire();f.packets.push([4]);const latest=f.packets.filter(p=>p[0]===6).at(-1)[1];assert.equal(latest,(Math.round(f.mod.aim.lastAngle)%360+360)%360);assert.notEqual(latest,expected,'Later shot reused an earlier target direction');
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
 for(const mode of ['At target','Round','Round2']){const f=setup();try{f.mod.setSetting('jitterActive',true);f.mod.setSetting('hideAimbotAngle',true);f.mod.setSetting('antiAimMode',mode);for(let at=0;at<10000;at+=10){f.setClock(2000+at);const before=f.packets.length;f.mod.aim.refresh();assert.ok(f.packets.length-before<=1,mode+' emitted two different directions in one cycle');}assert.ok(f.packets.length>0&&f.packets.length<=1000);}finally{f.mod.dispose();}}
});
