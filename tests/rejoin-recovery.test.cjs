const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./mod-fixture.cjs');
const account={token:'existing-guest-token',tokenId:'42',userId:'17',accountToken:'existing-account-token',nickname:'Existing name'};
function identity(f){return Object.fromEntries(Object.keys(account).map(k=>[k,f.storage.get(k)]));}
async function microtasks(){for(let i=0;i<6;i++)await Promise.resolve();}
test('the actual native Play gateway hangs on an SDK failure with saved data, and recovers with the fix',async()=>{
 const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
 const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/rejoin-gateway-reference.json.gz')));
 for(const method of ['preroll','createAdPlayer'])for(const recovery of [false,true]){
  const f=fixture({saved:account});f.network.state=0;let resumed=0;
  const menu={'ϲ१༧':0,'а５ߋ':ref.literals['ε̌᠌'],'ܐࡅ̙':()=>resumed++};
  f.B.adWaiting=()=>menu['ϲ१༧']===1;
  // A rejected thenable has the SDK's Promise contract without deliberately
  // raising an unhandled host rejection in the unfixed reference case.
  f.window.Widget={isBlocked:method==='preroll'?0:1,[method]:()=>({then:(_,reject)=>reject(false)})};
  f.document.getElementById=id=>['bebebaba','preroll'].includes(id)?{id}:null;
  Object.assign(f.context,ref.literals,{'ɑᚆᴏ':menu,'ᴄࡇ९':f.window,'ѕ︁︁':{'оᄃމ'(){}}});
  if(recovery)f.mod.step(0);
  vm.runInContext(ref.source+'\nܐࡅ̙();',f.context,{timeout:1000});await microtasks();
  assert.equal(resumed,recovery?1:0);assert.equal(menu['ϲ१༧'],recovery?0:1);
  assert.deepEqual(identity(f),account);f.mod.dispose();
 }
});
function gateway(preroll){
 const f=fixture({saved:account});let waiting=false,calls=0;
 f.network.state=0;f.B.adWaiting=()=>waiting;
 f.window.Widget={preroll};f.mod.step(0);
 function enter(){waiting=true;f.window.Widget.preroll();f.window.Widget.play=()=>{waiting=false;calls++;};}
 return {f,enter,get calls(){return calls;},get waiting(){return waiting;}};
}
test('rejected preroll cannot leave the native Play callback blocked with existing account data',async()=>{
 const g=gateway(()=>Promise.reject(false));g.enter();await microtasks();
 assert.equal(g.calls,1);assert.equal(g.waiting,false);assert.equal(g.f.mod.reconnect.gatewayRecoveries,1);
 assert.deepEqual(identity(g.f),account);g.f.window.Widget.play();assert.equal(g.calls,1);
 g.f.mod.dispose();
});
test('synchronous SDK failure completes the newly registered native callback once',async()=>{
 const g=gateway(()=>{throw Error('SDK failed');});assert.doesNotThrow(g.enter);await microtasks();
 assert.equal(g.calls,1);assert.equal(g.waiting,false);assert.deepEqual(identity(g.f),account);g.f.mod.dispose();
});
test('a successful preroll waits for the SDK and does not start a second login',async()=>{
 const g=gateway(()=>Promise.resolve());g.enter();await microtasks();assert.equal(g.calls,0);
 g.f.window.Widget.play();g.f.window.Widget.play();g.f.setClock(70000);g.f.mod.step(70000);
 assert.equal(g.calls,1);assert.equal(g.f.mod.reconnect.gatewayRecoveries,0);assert.deepEqual(identity(g.f),account);g.f.mod.dispose();
});
test('a missing ad completion callback recovers after a deadline, preserving storage',async()=>{
 const g=gateway(()=>undefined);g.enter();await microtasks();
 g.f.setClock(60000);g.f.mod.step(60000);assert.equal(g.calls,0);
 g.f.setClock(61001);g.f.mod.step(61001);assert.equal(g.calls,1);assert.deepEqual(identity(g.f),account);g.f.mod.dispose();
});
test('hidden tabs and disposal do not force a pending ad callback',async()=>{
 const g=gateway(()=>undefined);g.enter();await microtasks();g.f.document.hidden=true;
 g.f.setClock(70000);g.f.mod.step(70000);assert.equal(g.calls,0);
 g.f.mod.dispose();g.f.window.Widget.play();assert.equal(g.calls,0);
 assert.deepEqual(identity(g.f),account);
});
test('a stalled preflight releases the native busy flag and ignores its late result',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';f.B.preflightKey='preflight';f.B.pendingKey='busy';
 let attempts=0,started=0;const callbacks=[];
 f.network.preflight=(_,cb)=>callbacks.push(cb);
 f.network.login=function(){attempts++;this.busy=true;this.preflight('/native-token',()=>started++);};
 f.mod.step(0);f.setClock(0);f.network.login();assert.equal(f.network.busy,true);
 f.mod.step(12001);assert.equal(f.network.busy,false);
 // This is the same native guard that previously made Play appear unresponsive.
 if(!f.network.busy)f.network.login();
 assert.equal(attempts,2);callbacks[0]();assert.equal(started,0);callbacks[1]();assert.equal(started,1);
 assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('a timed out Webgames preflight returns to native Play once and keeps saved identity',()=>{
 for(const state of [0,64]){
  const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';f.B.pendingKey='busy';
  let menus=0,starts=0;const callbacks=[];
  f.B.returnToMenu=()=>menus++;
  f.network.login=()=>{f.network.busy=true;callbacks.push(f.mod.guardHandshakeCallback('/native-token',()=>starts++));};
  f.setClock(0);f.mod.step(0);f.network.login();f.network.state=state;
  f.mod.step(11999);assert.equal(menus,0);
  f.setClock(12001);f.mod.step(12001);
  assert.equal(menus,1);assert.equal(f.network.state,0);assert.equal(f.network.busy,false);
  assert.equal(f.mod.connectionInfo().events.at(-1).type,'entry-timeout');
  callbacks[0]();assert.equal(starts,0);
  f.mod.step(24000);assert.equal(menus,1);
  f.setClock(24000);assert.equal(f.mod.beginPlay(),true);f.network.login();callbacks[1]();assert.equal(starts,1);
  assert.deepEqual(identity(f),account);f.mod.dispose();
 }
});
test('hidden tabs keep their pending preflight instead of returning to the menu',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';f.B.pendingKey='busy';
 let menus=0;f.B.returnToMenu=()=>menus++;f.network.login=()=>{f.network.busy=true;};
 f.setClock(0);f.mod.step(0);f.network.login();f.document.hidden=true;
 f.mod.step(30000);assert.equal(menus,0);assert.equal(f.network.busy,true);
 f.document.hidden=false;f.mod.step(30001);assert.equal(menus,0);
 f.mod.step(42001);assert.equal(menus,1);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('a stalled initial service screen opens native Play once only after servers are available',()=>{
 const f=fixture({saved:account});f.network.state=0;let menus=0,serversReady=false;
 f.B.homeControlsVisible=()=>false;f.B.canShowHome=()=>serversReady;f.B.returnToMenu=()=>menus++;
 f.mod.step(0);f.mod.step(25000);assert.equal(menus,0);
 serversReady=true;f.mod.step(25001);assert.equal(menus,1);
 assert.equal(f.mod.reconnect.initialHomeRecoveries,1);assert.equal(f.mod.connectionInfo().events.at(-1).stage,'startup');
 f.mod.step(50000);assert.equal(menus,1);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('initial recovery leaves a visible menu and a hidden browser tab alone',()=>{
 for(const visible of [false,true]){
  const f=fixture({saved:account});f.network.state=0;let menus=0;
  f.B.homeControlsVisible=()=>visible;f.B.canShowHome=()=>true;f.B.returnToMenu=()=>menus++;
  f.document.hidden=true;f.mod.step(0);f.mod.step(30000);assert.equal(menus,0);
  f.document.hidden=false;f.mod.step(30001);assert.equal(menus,0);
  f.mod.step(50001);assert.equal(menus,visible?0:1);assert.deepEqual(identity(f),account);f.mod.dispose();
 }
});
test('an immediate native login exception does not leave Play locked',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';f.B.pendingKey='busy';let attempts=0;
 f.network.login=()=>{f.network.busy=true;attempts++;throw Error('Request could not start');};f.mod.step(0);
 assert.throws(()=>f.network.login(),/Request could not start/);assert.equal(f.network.busy,false);
 assert.throws(()=>f.network.login(),/Request could not start/);assert.equal(attempts,2);
 assert.equal(f.network.busy,false);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('an unacknowledged socket closes once and can retry without clearing identity',()=>{
 const f=fixture({saved:account});f.B.pendingKey='busy';f.network.busy=true;f.network.state=2;
 let closes=0;f.mod.observeSocket({readyState:1,close(){closes++;}});
 f.mod.step(0);f.mod.step(11999);assert.equal(closes,0);f.mod.step(12001);
 assert.equal(closes,1);assert.equal(f.network.state,64);assert.equal(f.network.busy,false);
 f.mod.step(12002);assert.equal(closes,1);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('the native error callback releases Play while retaining its original behavior',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.errorKey='onNativeError';f.B.pendingKey='busy';f.network.busy=true;
 const reasons=[];f.network.onNativeError=reason=>reasons.push(reason);f.mod.step(0);
 f.network.onNativeError(128);
 assert.equal(f.network.busy,false);assert.equal(f.mod.reconnect.lastFailureCode,128);
 assert.deepEqual(reasons,[128]);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('late preflight responses cannot overwrite the newer connection key before starting a socket',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';f.B.preflightKey='preflight';
 const replies=[];let key=null,starts=0;
 f.network.preflight=(url,done)=>replies.push(f.mod.guardHandshakeCallback(url,value=>{key=value;done();}));
 f.network.login=()=>f.network.preflight('/native-token',()=>starts++);
 f.mod.step(0);f.setClock(0);f.network.login();f.mod.step(12001);f.setClock(12001);f.network.login();
 replies[1]('new-key');replies[0]('old-key');
 assert.equal(key,'new-key');assert.equal(starts,1);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('preflight ownership follows a second HTTP round created asynchronously by the first response',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';
 const rounds=[],second=[];let key=null;
 f.network.login=()=>rounds.push(f.mod.guardHandshakeCallback('/round-one',()=>{
  second.push(f.mod.guardHandshakeCallback('/round-two',value=>{key=value;}));
 }));
 f.mod.step(0);f.setClock(0);f.network.login();rounds[0]();
 f.mod.step(12001);f.setClock(12001);f.network.login();rounds[1]();
 second[1]('current-key');second[0]('stale-key');assert.equal(key,'current-key');
 assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('the connection report contains presence flags, without exposing stored credentials',()=>{
 const f=fixture({saved:account}),r=f.mod.connectionInfo(),text=JSON.stringify(r);
 for(const key of ['token','tokenId','userId','accountToken'])assert.equal(r.stored[key],true);
 for(const value of Object.values(account))assert.ok(!text.includes(JSON.stringify(value)));
 f.mod.dispose();
});
test('server death captures combat and health before the native handler resets the player',()=>{
 const f=fixture({saved:account});f.B.health=()=>255;
 f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1200,1100,true);
 f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('mouseFovEnable',false);(f.mod.aimModule.refreshTargets(),f.mod.aim.refresh());
 f.mod.observeDeath();f.world['ᅠᏧ‍'].id=0;f.network.state=0;
 const event=f.mod.connectionInfo().events.at(-1);
 assert.equal(event.type,'server-death');assert.equal(event.state,1);assert.equal(event.health,255);
 assert.equal(event.aim,true);assert.equal(event.commandsInLast2s.angle,1);
 for(const value of Object.values(account))assert.ok(!JSON.stringify(event).includes(JSON.stringify(value)));
 assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('socket observers preserve native callbacks and exclude close reasons and credentials',()=>{
 const f=fixture({saved:account}),sockets=[];
 function socket(){const handlers=new Map();const s={readyState:1,onclose(){},addEventListener(k,fn){handlers.set(k,fn);},removeEventListener(k,fn){if(handlers.get(k)===fn)handlers.delete(k);},emit(k,event={}){handlers.get(k)?.(event);},handlers};sockets.push(s);return s;}
 const first=socket(),nativeClose=first.onclose;f.mod.observeSocket(first);first.emit('error');
 assert.equal(first.onclose,nativeClose);
 first.emit('close',{code:1006,wasClean:false,reason:account.token});
 const report=f.mod.connectionInfo();assert.equal(report.events.at(-1).code,1006);
 assert.ok(!JSON.stringify(report).includes(account.token));
 const second=socket();f.mod.observeSocket(second);assert.equal(first.handlers.size,0);
 first.emit('close',{code:1000});assert.equal(f.mod.connectionInfo().events.length,2);
 for(let i=0;i<20;i++)second.emit('error');assert.equal(f.mod.connectionInfo().events.length,12);
 f.mod.dispose();assert.equal(second.handlers.size,0);assert.deepEqual(identity(f),account);
});
test('receive timing distinguishes a quiet socket from a client close without retaining packet contents',()=>{
 const f=fixture({saved:account}),handlers=new Map();
 const socket={readyState:0,addEventListener:(k,fn)=>handlers.set(k,fn),removeEventListener:(k)=>handlers.delete(k)};
 const close=socket.close=()=>{};f.mod.observeSocket(socket);
 assert.equal(f.mod.connectionInfo().transport.openForMs,null);
 f.setClock(2000);socket.readyState=1;handlers.get('open')();
 f.setClock(2500);handlers.get('message')({data:account.token});
 f.setClock(18000);f.document.hidden=true;
 assert.equal(f.mod.observeCloseRequest('native-receive-timeout'),true);
 f.mod.observeCloseRequest('native-network-close');
 socket.readyState=3;handlers.get('close')({code:1005,wasClean:true,reason:account.token});
 const report=f.mod.connectionInfo(),event=report.events.at(-1);
 assert.equal(event.localCloseObserved,true);assert.equal(event.transport.localCloseSource,'native-receive-timeout');
 assert.equal(event.transport.receiveGapMs,15500);assert.equal(event.transport.openForMs,16000);assert.equal(event.transport.receivedMessages,1);assert.equal(event.pageHidden,true);
 assert.equal(socket.close,close);assert.equal(f.mod.observeCloseRequest(account.token),false);
 report.events.at(-1).transport.receivedMessages=99;
 assert.equal(f.mod.connectionInfo().events.at(-1).transport.receivedMessages,1);
 const other={...socket,readyState:1};f.mod.observeSocket(other);handlers.get('close')({code:1006});
 const next=f.mod.connectionInfo();assert.equal(next.events.at(-1).localCloseObserved,false);assert.equal(next.transport.id,2);assert.equal(next.transport.receiveGapMs,null);
 assert.ok(!JSON.stringify(next).includes(account.token));f.mod.dispose();assert.equal(handlers.size,0);
});
test('combat snapshots expire idle commands and cannot be changed by the report consumer',()=>{
 const f=fixture();f.mod.trackPacket(1,1,1,0,0,true);f.mod.trackPacket(1,2,1,100,100,true);f.mod.setSetting('AimBotEnabled',true);(f.mod.aimModule.refreshTargets(),f.mod.aim.refresh());
 f.mod.observeDeath();const report=f.mod.connectionInfo();report.events[0].commandsInLast2s.angle=999;
 assert.equal(f.mod.connectionInfo().events[0].commandsInLast2s.angle,1);
 f.setClock(4000);f.mod.observeDeath();assert.equal(f.mod.connectionInfo().events.at(-1).commandsInLast2s.angle,0);f.mod.dispose();
});
test('the native death prefix is captured without logging arbitrary packet bodies',()=>{
 const f=fixture({saved:account});const bytes=new Uint8Array([5,0x12,0x34,0x78,0x79]);
 f.mod.observeDeath(bytes);bytes[1]=255;const event=f.mod.connectionInfo().events.at(-1);
 assert.equal(event.deathOpcode,5);assert.equal(event.deathPacketLength,5);assert.equal(event.deathPrefixHex,'05 12 34');
 f.mod.observeDeath(new Uint8Array([35,1,2,3]));assert.equal(f.mod.connectionInfo().events.at(-1).deathPrefixHex,undefined);
 f.mod.observeDeath({length:1000000,0:5,1:1,2:2});assert.equal(f.mod.connectionInfo().events.at(-1).deathPrefixHex,undefined);
 assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('Play preparation timeout releases the pre-login busy flag and ignores stale resource callbacks',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.pendingKey='busy';f.network.busy=true;f.setClock(0);
 assert.equal(f.mod.beginPlay(),true);assert.equal(f.network.busy,false);
 f.network.busy=true;let starts=0;const stale=f.mod.guardPlayCallback(()=>starts++);
 assert.equal(f.mod.beginPlay(),false);f.mod.step(12001);assert.equal(f.network.busy,false);
 f.setClock(12001);assert.equal(f.mod.beginPlay(),true);
 const current=f.mod.guardPlayCallback(()=>starts++);stale();assert.equal(starts,0);current();current();assert.equal(starts,1);
 assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('native Play works without Widget and can retry a stalled resource load with the same saved identity',()=>{
 const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
 const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/rejoin-gateway-reference.json.gz'))),profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
 const patch=profile.operations.find(o=>o.id==='native-play-preparation-recovery');assert.equal(patch.before,ref.source);
 for(const fixed of [false,true]){
  const f=fixture({saved:account});f.network.state=0;f.B.pendingKey='ϲІ̗';f.setClock(0);const resources=[];let logins=0;
  const menu={'ϲ१༧':0,'а５ߋ':1,'а͠٣':5};f.B.adWaiting=()=>menu['ϲ१༧']===1;
  f.document.getElementById=id=>id==='servers'?{value:'saved-lobby'}:{id};
  Object.assign(f.context,ref.literals,{__responsiveMod:f.mod,'ɑᚆᴏ':menu,'ᴄࡇ९':f.window,'ѕ︁︁':{'оᄃމ'(){}},'і︅２':{'ᴀߊᄆ':()=>true},'ᴑ٢༩':{'ε᠌️':cb=>resources.push(cb)},'ᴘ̏٤':{'ϲ︂ᄇ':5},'оᴌ︈':Object.assign(f.network,{'ᅟވ̝':{'ᴄ̈ᚈ':2},'Ꮷіܖ':()=>logins++})});
  if(!fixed){assert.throws(()=>vm.runInContext(patch.before+';ܐࡅ̙();',f.context));assert.equal(resources.length,0);}
  else{
   vm.runInContext(patch.after+';ܐࡅ̙();',f.context);assert.equal(resources.length,1);
   assert.equal(f.network['ϲІ̗'],true);f.mod.step(12001);assert.equal(f.network['ϲІ̗'],false);
   f.setClock(12001);vm.runInContext('ܐࡅ̙();',f.context);assert.equal(resources.length,2);
   resources[0]();assert.equal(logins,0);resources[1]();assert.equal(logins,1);resources[1]();assert.equal(logins,1);
  }
  assert.deepEqual(identity(f),account);f.mod.dispose();
 }
});
test('partially loaded Widget cannot set an advertising wait with no usable completion method',()=>{
 const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
 const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/rejoin-gateway-reference.json.gz')));
 const patch=JSON.parse(fs.readFileSync('patches/recovered-current.json')).operations.find(o=>o.id==='native-play-preparation-recovery');
 for(const widget of [{},{isBlocked:0},{isBlocked:1}]){
  const f=fixture({saved:account});f.setClock(0);f.network.state=0;f.B.pendingKey='ϲІ̗';const menu={'ϲ१༧':0,'а５ߋ':1,'а͠٣':5};let prepares=0;
  f.window.Widget=widget;f.B.adWaiting=()=>menu['ϲ१༧']===1;f.document.getElementById=id=>id==='servers'?{value:'saved-lobby'}:{id};
  Object.assign(f.context,ref.literals,{__responsiveMod:f.mod,'ɑᚆᴏ':menu,'ᴄࡇ९':f.window,'ѕ︁︁':{'оᄃމ'(){}},'і︅２':{'ᴀߊᄆ':()=>true},'ᴑ٢༩':{'ε᠌️':()=>prepares++},'ᴘ̏٤':{'ϲ︂ᄇ':5},'оᴌ︈':Object.assign(f.network,{'ᅟވ̝':{'ᴄ̈ᚈ':2}})});
  vm.runInContext(patch.after+';ܐࡅ̙();',f.context);assert.equal(prepares,1);assert.equal(menu['ϲ१༧'],0);assert.deepEqual(identity(f),account);f.mod.dispose();
 }
});

test('disposing recovery leaves native Play usable while canceling old preparation callbacks',()=>{
 const f=fixture({saved:account});f.network.state=0;let calls=0;f.mod.beginPlay();const old=f.mod.guardPlayCallback(()=>calls++);
 f.mod.dispose();old();assert.equal(calls,0);assert.equal(f.mod.beginPlay(),true);f.mod.guardPlayCallback(()=>calls++)();assert.equal(calls,1);assert.deepEqual(identity(f),account);
});
test('reported 05 00 02 death stops restoration retries and Play keeps identity while starting a normal join',()=>{
 const f=fixture({saved:account});let refreshes=0;const joins=[];
 f.B.loginKey='login';f.B.errorKey='error';f.B.pendingKey='busy';f.network.login=function(){joins.push(this.state);};f.network.error=()=>{f.network.state=0;};
 const row=['lobby',0,0,0,'region',0,'mode'];f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>{refreshes++;cb();};f.B.reconnect=()=>f.network.login();
 let cookieWrites=0;Object.defineProperty(f.document,'cookie',{get:()=> 'kept=1',set:()=>cookieWrites++});
 f.mod.step(0);f.mod.observeDeath(new Uint8Array([5,0,2]));f.world['ᅠᏧ‍'].id=0;f.network.state=128;f.network.error();
 assert.equal(f.mod.connectionInfo().lastFailureCode,128);
 for(const now of [1,1000,9000,24000]){f.network.state=64;f.mod.step(now);assert.equal(f.network.state,0);}
 assert.equal(refreshes,0);assert.equal(joins.length,0);assert.equal(f.mod.connectionInfo().awaitingPlay,true);
 f.setClock(25000);assert.equal(f.mod.beginPlay(),true);f.network.login();assert.deepEqual(joins,[0]);
 assert.equal(f.mod.connectionInfo().sessionEnded,true);assert.deepEqual(identity(f),account);assert.equal(cookieWrites,0);
 f.network.state=1;f.world['ᅠᏧ‍'].id=3;f.mod.step(25001);assert.equal(f.mod.connectionInfo().sessionEnded,false);assert.equal(f.mod.connectionInfo().awaitingPlay,false);
 f.mod.dispose();
});
test('death invalidates a pending handshake callback without deleting stored login',()=>{
 const f=fixture({saved:account});f.network.state=0;f.B.loginKey='login';let reply,starts=0;
 f.network.login=()=>{reply=f.mod.guardHandshakeCallback('/native-preflight',()=>starts++);};f.mod.step(0);f.network.login();
 f.mod.observeDeath(new Uint8Array([5,0,2]));reply();assert.equal(starts,0);assert.deepEqual(identity(f),account);f.mod.dispose();
});
test('failed normal joins after death stay normal, are bounded and keep the same account',()=>{
 const f=fixture({saved:account});const joins=[];const row=['lobby',0,0,0,'region',0,'mode'];
 f.B.loginKey='login';f.network.login=function(){joins.push(this.state);};f.B.reconnect=()=>f.network.login();
 f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>cb();
 const step=now=>{f.setClock(now);f.mod.step(now);};step(0);f.mod.observeDeath(new Uint8Array([5,0,2]));f.network.state=0;
 assert.equal(f.mod.beginPlay(),true);f.network.login();assert.deepEqual(joins,[0]);
 let now=0;
 for(let retry=0;retry<3;retry++){
  f.network.state=64;step(now+12001);step(now+12002);step(now+13002);now+=13002;
 }
 assert.equal(joins.length,4);assert.ok(joins.every(state=>state===0));
 for(const time of [now+12001,now+12002,now+50000,now+100000]){f.network.state=64;step(time);}
 assert.equal(joins.length,4);assert.deepEqual(identity(f),account);f.mod.dispose();
});

test('handshake diagnostics distinguish discarded replies during play without logging request URLs',()=>{
 const f=fixture({saved:account});try{f.network.state=0;f.B.loginKey='login';const replies=[];let accepted=0;
  f.network.login=()=>replies.push(f.mod.guardHandshakeCallback('/private-path?token=do-not-record',()=>accepted++));
  f.mod.step(0);f.network.login();replies[0]();assert.equal(accepted,1);
  f.network.state=1;f.mod.step(16);replies[0]();assert.equal(accepted,1);
  const info=f.mod.connectionInfo();assert.deepEqual({...info.connectionCallbacks},{wrapped:1,accepted:1,rejectedStale:1,rejectedWhileConnected:1,rejectedAfterDispose:0});
  assert.ok(!JSON.stringify(info).includes('do-not-record'));info.connectionCallbacks.accepted=999;assert.equal(f.mod.connectionInfo().connectionCallbacks.accepted,1);
 }finally{f.mod.dispose();}
});
