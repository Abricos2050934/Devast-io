const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,scene}=require('./mod-fixture.cjs');

test('ILM still computes every tick; only a non-open socket suppresses its sends',()=>{
 const f=fixture();try{
  f.mod.trackPacket(1,1,0,0,0,true);f.mod.trackPacket(1,2,0,100,100,true);
  f.mod.setSetting('mouseFovEnable',false);f.mod.setSetting('AimBotEnabled',true);
  const socket={readyState:1,bufferedAmount:8192};f.mod.observeSocket(socket);
  for(let t=0;t<500;t+=50){f.setClock(t);f.mod.aim.refresh();}
  assert.equal(f.packets.length,1);assert.equal(f.mod.diagnostics.deduplicatedAngles,9);
  socket.readyState=3;f.mod.trackPacket(1,2,0,100,200,true);f.mod.aim.refresh();
  assert.equal(f.packets.length,1);assert.notEqual(f.mod.aim.lastAngle,45,'Closed transport changed ILM computation');
  socket.readyState=1;f.mod.aim.refresh();assert.equal(f.packets.length,2);
 }finally{f.mod.dispose();}
});
test('fast loot and native auto-build pause together and resume one current frame',()=>{
 const f=fixture({dom:true});try{
  f.B.synchronizedRender=true;
  scene(f,2,[{id:10,x:10,y:0,'е̝ހ':0,'Іࡈ５':6},{id:11,x:20,y:0,'е̝ހ':0,'Іࡈ５':6}]);
  Object.assign(f.world['ᅠᏧ‍'],{'ε︁ᚂ':1,'օⲥᚁ':1,'α०ᚂ':3,'ρⲅ️':4,'ᴎ︆ࡉ':5});
  f.mod.setSetting('FAutoLootEnabled',true);f.mod.setSetting('AutoBuiledEnabled',true);
  const socket={readyState:1,bufferedAmount:4096};f.mod.observeSocket(socket);
  for(let t=0;t<1000;t+=10){f.setClock(t);f.mod.render(t);}
  assert.equal(f.packets.length,0,'High-FPS frames must not grow an existing queue');
  socket.bufferedAmount=0;f.mod.render(1000);
  assert.deepEqual(f.packets,[[14,3,4,5],[12,10],[12,11]]);
  const report=f.mod.connectionInfo();assert.equal(report.automationTransport.deferred.build,100);assert.equal(report.automationTransport.deferred.loot,100);
  report.automationTransport.deferred.loot=999;assert.equal(f.mod.connectionInfo().automationTransport.deferred.loot,100);
 }finally{f.mod.dispose();}
});
test('slow loot, container take, chat and keepalive wait for writable transport without retry bursts',()=>{
 const f=fixture(),messages=[];try{
  scene(f,2,[{id:10,x:10,y:0,'е̝ހ':0,'Іࡈ５':6}]);
  Object.assign(f.world['ᅠᏧ‍'],{'І๔︊':0,'ιᄁ८':10,'ᴉᄁ͏':1,'ᴘϲ๓':[[6,1]],'ᅠܓ̃':1});
  f.network['іߐ̸']=text=>{messages.push(text);return 0;};
  for(const key of ['SAutoLootEnabled','AutoTakeEnabled','AntiKickEnabled','SpamChatEnabled'])f.mod.setSetting(key,true);
  f.mod.setSetting('SpamChatText','test');f.mod.aim.mouseDown=true;
  const socket={readyState:1,bufferedAmount:4096};f.mod.observeSocket(socket);
  for(let t=0;t<=8000;t+=200){f.setClock(t);f.mod.step(t);}
  assert.equal(f.packets.length,0);assert.equal(messages.length,0);
  socket.bufferedAmount=0;f.setClock(9000);f.mod.step(9000);
  assert.deepEqual(f.packets,[[12,10],[27,0],[0]]);assert.deepEqual(messages,['test']);
 }finally{f.mod.dispose();}
});
