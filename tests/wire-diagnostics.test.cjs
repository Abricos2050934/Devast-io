const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {analyze}=require('../tools/updater/static.cjs'),{wireDiagnosticOperation}=require('../tools/updater/wire-diagnostics.cjs'),{fixture}=require('./mod-fixture.cjs');
function plan(raw='function raw(frame){socket.send(frame);}',extra=''){
 const json='function json(value){activity=clock;raw(codec.encode(JSON.parse(value)));}';
 return wireDiagnosticOperation(analyze(raw+json+extra),[{id:'message15-native-aim-transport',before:json}],{'І̎ܘ':'socket'});
}
test('wire observer runs after a successful send and never changes bytes or propagates diagnostic errors',()=>{
 const op=plan(),frame=new Uint8Array([1,2,3]),order=[];
 const context=vm.createContext({socket:{send(data){assert.equal(data,frame);order.push('send');}},__responsiveMod:{observeWireSend(bytes){order.push(bytes);throw Error('diagnostic failure');}}});
 vm.runInContext(op.after+';raw(frame);',Object.assign(context,{frame}));assert.deepEqual(order,['send',3]);assert.deepEqual([...frame],[1,2,3]);
 order.length=0;context.socket.send=()=>{throw Error('native send failure');};assert.throws(()=>vm.runInContext('raw(frame)',context),/native send failure/);assert.deepEqual(order,[]);
});
test('ambiguous or structurally changed native wire send contracts stop generation',()=>{
 for(const raw of ['function raw(frame){return socket.send(frame);}','function raw(frame){other.send(frame);}','function raw(frame){socket.send(frame);socket.send(frame);}','function raw(frame,other){socket.send(frame);}','function raw(frame){socket?.send(frame);}','function raw(frame){socket.send?.(frame);}'])assert.throws(()=>plan(raw),/wire|socket/);
 assert.throws(()=>plan(undefined,'function extra(frame){socket.send(frame);}'),/ambiguous/);
});
test('wire reports include native traffic with automation off, split sockets, retain close snapshots and contain no payloads',()=>{
 const f=fixture();try{
  f.mod.observeSocket({readyState:1,bufferedAmount:0});f.setClock(1000);f.mod.observeWireSend(12);f.mod.observeWireSend(20);
  let r=f.mod.connectionInfo();assert.deepEqual(JSON.parse(JSON.stringify(r.nativeWireTraffic.totals)),{packets:2,bytes:32});assert.equal(r.transport.sentMessages,2);assert.equal(r.transport.sentBytes,32);assert.equal(f.packets.length,0);
  f.setClock(2000);f.mod.observeDeath(new Uint8Array([27,0,1]),27);assert.equal(f.mod.connectionInfo().events.at(-1).transport.sentBytes,32);
  f.mod.observeSocket({readyState:1,bufferedAmount:0});f.mod.observeWireSend(5);r=f.mod.connectionInfo();assert.equal(r.transport.sentMessages,1);assert.equal(r.nativeWireTraffic.totals.packets,3);assert.notEqual(r.nativeWireTraffic.recentSeconds[0].socket,r.transport.id);
  for(const value of ['secret-token',{},-1,NaN,Infinity,2147483648])f.mod.observeWireSend(value);
  r.nativeWireTraffic.recentSeconds[0].bytes=999;r.nativeWireTraffic.totals.bytes=999;assert.equal(f.mod.connectionInfo().nativeWireTraffic.totals.bytes,37);assert.ok(!JSON.stringify(f.mod.connectionInfo()).includes('secret-token'));
 }finally{f.mod.dispose();}
});
test('wire history remains bounded and expires while lifetime totals remain available',()=>{
 const f=fixture();try{for(let i=0;i<300;i++){f.setClock(i*1000);f.mod.observeWireSend(10);}let r=f.mod.connectionInfo();assert.equal(r.nativeWireTraffic.recentSeconds.length,120);assert.equal(r.nativeWireTraffic.totals.packets,300);f.setClock(500000);r=f.mod.connectionInfo();assert.equal(r.nativeWireTraffic.recentSeconds.length,0);assert.equal(r.nativeWireTraffic.totals.bytes,3000);}finally{f.mod.dispose();}
});
test('reports record independent spear and hidden angle settings that can affect native control with gun aim disabled',()=>{
 const f=fixture();try{for(const key of ['AimbotSpearEnabled','hidePlayerAngle','hideAimbotAngle'])f.mod.setSetting(key,true);const r=f.mod.connectionInfo();assert.equal(r.aimSettings.enabled,false);assert.equal(r.aimSettings.spear,true);assert.equal(r.aimSettings.hidePlayerAngle,true);assert.equal(r.aimSettings.hideAimbotAngle,true);assert.equal(r.modTraffic.settingsChanges.at(-1).settings.hidePlayerAngle,true);assert.equal(f.mod.nativePacketAngle(25),205);assert.equal(f.packets.length,0);}finally{f.mod.dispose();}
});
test('first server death survives repeated joins and returned reports cannot overwrite its metadata',()=>{
 const f=fixture();try{assert.equal(f.mod.connectionInfo().firstServerDeath,null);for(let i=1;i<=20;i++){f.setClock(i*1000);f.mod.observeSocket({readyState:1,bufferedAmount:0});f.mod.observeWireSend(i);f.mod.observeDeath(new Uint8Array([27,0,i]),27);}let r=f.mod.connectionInfo();assert.equal(r.events.length,12);assert.equal(r.firstServerDeath.at,1000);assert.equal(r.firstServerDeath.transport.sentBytes,1);assert.equal(r.firstServerDeath.deathPrefixHex,'1b 00 01');assert.ok(r.events.every(e=>e.at>1000));r.firstServerDeath.transport.sentBytes=999;r.firstServerDeath.commandsInLast2s.attack=999;r=f.mod.connectionInfo();assert.equal(r.firstServerDeath.transport.sentBytes,1);assert.equal(r.firstServerDeath.commandsInLast2s.attack,0);}finally{f.mod.dispose();}
});
