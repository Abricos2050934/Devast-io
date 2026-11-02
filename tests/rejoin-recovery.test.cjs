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
