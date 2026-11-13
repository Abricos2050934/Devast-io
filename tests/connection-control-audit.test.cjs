const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
test('target switches obey one adaptive budget and Strafe releases manual movement',()=>{
 const f=fixture();f.B.types={1:{curveWeapons:{}}};const s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘','curveWeapons','curveBulletSpeed'].map(k=>[k,k]));
 try{const r=require('../tools/verify_control_lifecycle.cjs').verifyControlLifecycle(f.mod,{...f.B,playerType:1,setClock:f.setClock,timers:f.timers,timerPeriods:f.timerPeriods,capturePackets:()=>({packets:f.packets,restore(){}})},s);assert.ok(r.target_switches>=100);assert.ok(r.background_directions<=40);}finally{f.mod.dispose();}
});
function preflight(){const f=fixture({saved:{token:'kept-token'}}),replies=[];f.setClock(0);f.network.state=0;f.B.loginKey='login';f.B.preflightKey='preflight';f.network.preflight=(_,cb)=>replies.push(cb);f.mod.step(0);return {f,replies};}
test('native preflight responses received after disposal cannot start another connection',()=>{
 const {f,replies}=preflight();let accepted=0;f.network.login=function(){this.preflight('/fixture',()=>accepted++);};f.mod.step(0);f.network.login();f.mod.dispose();replies[0]();assert.equal(accepted,0);assert.equal(f.mod.connectionInfo().connectionCallbacks.rejectedAfterDispose,1);assert.equal(f.storage.get('token'),'kept-token');
});
test('chained native preflights keep generation ownership and reject the late second stage',()=>{
 const {f,replies}=preflight();let completed=0;f.network.login=function(){this.preflight('/first',()=>this.preflight('/second',()=>completed++));};f.mod.step(0);f.network.login();replies[0]();assert.equal(replies.length,2);f.setClock(12001);f.mod.step(12001);replies[1]();assert.equal(completed,0);f.network.login();replies[2]();replies[3]();assert.equal(completed,1);assert.equal(f.storage.get('token'),'kept-token');f.mod.dispose();
});
test('disposing an active Strafe restores movement without changing native input',()=>{
 const f=fixture();try{f.B.input={movement:5,angle:.7};f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.onMove(5);f.mod.setSetting('AntiAimbot',true);f.mod.aimModule.antiTick();f.packets.length=0;f.mod.dispose();assert.deepEqual(f.packets,[[2,5]]);assert.equal(f.B.input.movement,5);assert.equal(f.B.input.angle,.7);}finally{f.mod.dispose();}
});
test('fresh native movement supersedes a deferred Strafe release',()=>{
 const f=fixture();try{f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.setSetting('AntiAimbot',true);f.mod.aimModule.antiTick();const socket={readyState:1,bufferedAmount:4096};f.mod.observeSocket(socket);f.mod.setSetting('AntiAimbot',false);f.mod.onMove(5);f.packets.length=0;socket.bufferedAmount=0;for(const[id,fn]of f.timers)if(f.timerPeriods.get(id)===50)fn();assert.deepEqual(f.packets,[]);}finally{f.mod.dispose();}
});
for(const failure of ['missing-server','throw','timeout'])test('fresh-session recovery bounds server-list failure: '+failure,()=>{
 const f=fixture({saved:{token:'kept-token'}});let calls=0;try{f.network.state=256;f.network['ԁᴄࡃ']=['official',0,0,0,'region',0,'mode'];f.network['ոߒ४']=[];f.network['ⲅ︊ᄃ']=(_,cb)=>{calls++;if(failure==='throw')throw Error('fixture');if(failure==='missing-server')cb();};f.B.reconnect=()=>{};
  for(let t=0;t<=120000;t+=1000){f.setClock(t);f.mod.step(t);}assert.equal(calls,3);assert.equal(f.mod.reconnect.refreshFailures,3);assert.equal(f.mod.reconnect.autoBlocked,true);assert.equal(f.storage.get('token'),'kept-token');assert.equal(f.mod.beginPlay(),true);assert.equal(f.mod.reconnect.refreshFailures,0);
 }finally{f.mod.dispose();}
});
test('refresh failure bound preserves one normal join after earlier restoration attempts',()=>{
 const f=fixture({saved:{token:'kept-token'}}),row=['official',0,0,0,'region',0,'mode'],joins=[];try{f.network.state=256;f.mod.reconnect.attempts=3;f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>cb();f.B.reconnect=()=>joins.push(f.network.state);f.setClock(0);f.mod.step(0);f.setClock(1000);f.mod.step(1000);assert.deepEqual(joins,[0]);assert.equal(f.mod.reconnect.refreshFailures,0);assert.equal(f.storage.get('token'),'kept-token');}finally{f.mod.dispose();}
});
test('disposed hooks yield native fire and movement without restarting mod timers',()=>{
 const f=fixture();f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.dispose();assert.equal(f.mod.beforeFire(),true);for(let i=0;i<20;i++){f.mod.afterFire();f.mod.afterRelease();f.mod.onHandshake();f.mod.onSessionStart();assert.equal(f.mod.onMove(5),true);f.mod.aimModule.afterFire();f.mod.aimModule.refreshTargets();f.mod.aim.scheduleRefresh();}
 assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);assert.equal(f.mod.aim.mouseDown,false);
});
test('cleanup restores the native pointer before the first unmodified shot',()=>{
 const f=fixture();try{f.B.input={angle:Math.PI/2};f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('lockId',2);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1400,1000,true);f.packets.length=0;f.mod.dispose();assert.deepEqual(f.packets,[[6,90]]);assert.equal(f.mod.beforeFire(),true);assert.equal(f.B.input.angle,Math.PI/2);}finally{f.mod.dispose();}
});
