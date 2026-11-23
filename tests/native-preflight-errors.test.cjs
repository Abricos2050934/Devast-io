const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{fixture}=require('./mod-fixture.cjs'),{parse}=require('../tools/parser.cjs');
function setup(errorOnly=false){const f=fixture({saved:{token:'kept-token',tokenId:'17',userId:'2'}}),requests=[];let closes=0;f.setClock(0);f.network.state=0;f.B.loginKey='login';f.B.preflightKey='preflight';f.B.pendingKey='busy';f.network.preflight=(url,ok,fail)=>requests.push({ok,fail});f.network.login=function(){this.busy=true;this.preflight('/native-fixture',errorOnly?null:()=>{},()=>{closes++;f.network.state=64;});};f.mod.step(0);return {f,requests,get closes(){return closes;}};}
test('late failure of a timed-out login cannot close a newer active session',()=>{const x=setup(),{f}=x;try{f.network.login();const old=x.requests[0];f.setClock(12001);f.mod.step(12001);assert.equal(f.mod.beginPlay(),true);f.network.login();f.network.state=1;f.mod.step(12002);old.fail();assert.equal(x.closes,0);assert.equal(f.network.state,1);assert.ok(f.mod.connectionInfo().connectionCallbacks.rejectedWhileConnected>0);assert.equal(f.storage.get('token'),'kept-token');}finally{f.mod.dispose();}});
test('failure of the current attempt still reaches its native error handler',()=>{const x=setup(),{f}=x;try{f.network.login();x.requests[0].fail();assert.equal(x.closes,1);assert.equal(f.network.state,64);assert.equal(f.mod.connectionInfo().connectionCallbacks.accepted,1);}finally{f.mod.dispose();}});
test('a pending entry failure cannot close the socket between native entry and the next frame',()=>{
 const x=setup(),{f}=x;
 try{
  f.network.login();
  const generation=f.mod.reconnect.generation;
  f.network.state=1;
  x.requests[0].fail();
  assert.equal(f.mod.reconnect.generation,generation,'run the callback before the next frame can invalidate its generation');
  assert.equal(x.closes,0);
  assert.equal(f.network.state,1);
  assert.equal(f.mod.connectionInfo().connectionCallbacks.rejectedWhileConnected,1);
 }finally{f.mod.dispose();}
});
test('an error callback remains owned when it starts another asynchronous stage',()=>{const x=setup(),{f}=x;try{f.network.login=function(){this.preflight('/first',()=>{},()=>this.preflight('/second',()=>{},()=>{f.network.state=64;}));};f.mod.step(0);f.network.login();x.requests[0].fail();assert.equal(x.requests.length,2);f.network.state=1;f.mod.step(1);x.requests[1].fail();assert.equal(f.network.state,1);assert.ok(f.mod.connectionInfo().connectionCallbacks.rejectedWhileConnected>0);}finally{f.mod.dispose();}});
test('disposal rejects a pending error callback',()=>{const x=setup();x.f.network.login();x.f.mod.dispose();x.requests[0].fail();assert.equal(x.closes,0);});
test('a failure-only request is guarded even without a success callback',()=>{const x=setup(true),{f}=x;try{f.network.login();assert.equal(x.requests[0].ok,null);f.network.state=1;f.mod.step(1);x.requests[0].fail();assert.equal(x.closes,0);}finally{f.mod.dispose();}});
test('each ordering of repeated terminal HTTP callbacks accepts exactly one result',()=>{
 for(let sequence=0;sequence<64;sequence++){
  const x=setup(),{f}=x;
  try{
   f.network.login();
   for(let i=0;i<6;i++)x.requests[0][sequence&(1<<i)?'fail':'ok']();
   assert.equal(f.mod.connectionInfo().connectionCallbacks.accepted,1,'sequence '+sequence);
   assert.equal(x.closes,sequence&1?1:0,'the first result owns the request');
   assert.equal(f.mod.connectionInfo().connectionCallbacks.rejectedDuplicate,5);
  }finally{f.mod.dispose();}
 }
});
test('late failure cannot close a socket while a successful request is still connecting',()=>{
 const x=setup(),{f}=x;let starts=0,closes=0;
 try{
  f.network.login=()=>f.network.preflight('/same',()=>{starts++;f.network.state=2;},()=>{closes++;f.network.state=0;});
  f.mod.step(0);f.network.login();x.requests[0].ok();x.requests[0].ok();x.requests[0].fail();
  assert.equal(starts,1);assert.equal(closes,0);assert.equal(f.network.state,2);
 }finally{f.mod.dispose();}
});
test('nested requests with the same URL keep independent terminal ownership',()=>{
 const x=setup(),{f}=x;let completed=0;
 try{
  f.network.login=()=>f.network.preflight('/same',()=>f.network.preflight('/same',()=>completed++,()=>completed--),()=>completed--);
  f.mod.step(0);f.network.login();x.requests[0].ok();x.requests[0].ok();x.requests[0].fail();
  assert.equal(x.requests.length,2);
  x.requests[1].ok();x.requests[1].ok();x.requests[1].fail();assert.equal(completed,1);
 }finally{f.mod.dispose();}
});
test('throwing terminal callbacks stay settled and preserve the receiver and arguments',()=>{
 const x=setup(),{f}=x;let calls=0;const receiver={};
 try{
  f.network.login=()=>f.network.preflight('/same',function(value){calls++;assert.equal(this,receiver);assert.equal(value,7);throw Error('fixture callback');},()=>calls++);
  f.mod.step(0);f.network.login();assert.throws(()=>x.requests[0].ok.call(receiver,7),/fixture callback/);
  assert.doesNotThrow(()=>x.requests[0].ok.call(receiver,7));x.requests[0].fail();assert.equal(calls,1);
 }finally{f.mod.dispose();}
});
test('all reviewed native profiles guard both terminal callbacks before running the request body',()=>{for(const file of ['patches/recovered-current.json','patches/native-2026-11-05.json','patches/native-2026-11-06.json']){const p=JSON.parse(fs.readFileSync(file)),op=p.operations.find(x=>x.id==='native-guard-stale-preflight-response'),fn=parse(op.after,{ecmaVersion:'latest'}).body[0],stmt=fn.body.body[0],[url,ok,fail]=fn.params.map(p=>p.name),success=()=>{},failure=()=>{},seen=[],context={__responsiveMod:{guardHandshakeCallback:(url,callback)=>{seen.push([url,callback]);return callback;}},[url]:'/fixture',[ok]:success,[fail]:failure};vm.runInNewContext(op.after.slice(stmt.start,stmt.end),context);assert.deepEqual(seen,[['/fixture',success],['/fixture',failure]],file);}});

test('a preflight scheduled after the login stack returns cannot close an active socket',()=>{
 for(const phase of ['joining','connecting']){
  const x=setup(),{f}=x;let deferred;
  try{
   f.network.login=()=>{deferred=()=>f.network.preflight('/deferred',()=>{},()=>{f.network.state=64;});};
   f.mod.step(0);f.network.login();
   if(phase==='connecting'){f.network.state=2;f.mod.step(1);}
   deferred();
   f.network.state=1;
   x.requests[0].fail();
   assert.equal(f.network.state,1,phase);
   assert.ok(f.mod.connectionInfo().connectionCallbacks.rejectedWhileConnected>0);
  }finally{f.mod.dispose();}
 }
});
test('a deferred success from an old entry cannot overwrite the current connection state',()=>{
 const x=setup(),{f}=x;let deferred;const cryptoState={key:'current'};
 try{
  f.network.login=()=>{deferred=()=>f.network.preflight('/deferred',()=>{cryptoState.key='obsolete';},()=>{});};
  f.mod.step(0);f.network.login();deferred();const old=x.requests[0];
  f.setClock(12001);f.mod.step(12001);f.mod.beginPlay();f.network.login();
  f.network.state=1;f.mod.step(12002);old.ok();
  assert.equal(cryptoState.key,'current');
  assert.equal(f.storage.get('token'),'kept-token');
 }finally{f.mod.dispose();}
});
test('a current deferred error still reaches its native handler exactly once',()=>{
 const x=setup(),{f}=x;let deferred,calls=0;
 try{
  f.network.login=()=>{deferred=()=>f.network.preflight('/deferred',null,()=>{calls++;f.network.state=64;});};
  f.mod.step(0);f.network.login();deferred();
  x.requests[0].fail();x.requests[0].fail();
  assert.equal(calls,1);assert.equal(f.network.state,64);
 }finally{f.mod.dispose();}
});
test('ordinary native HTTP callbacks remain usable outside an entry attempt',()=>{
 const x=setup(),{f}=x;let updates=0;
 try{
  f.network.state=1;f.mod.step(1);
  f.network.preflight('/server-list',()=>updates++,()=>{});
  x.requests[0].ok();
  assert.equal(updates,1);assert.equal(f.network.state,1);
 }finally{f.mod.dispose();}
});
