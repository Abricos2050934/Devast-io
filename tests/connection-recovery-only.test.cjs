const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./mod-fixture.cjs');
for(const code of [8,16,512,1024])test('server rejection '+code+' cannot turn into automatic restoration after native close',()=>{
 const f=fixture({saved:{token:'kept-token',tokenId:'kept-id',userId:'1'}});let refreshes=0,automaticJoins=0,manualJoins=0;
 try{
  const row=['official',0,0,0,'region',0,'mode'];f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>{refreshes++;cb();};f.B.reconnect=()=>{automaticJoins++;f.network.state=1;};
  f.B.errorKey='error';f.network.error=()=>{f.network.state=0;};f.B.loginKey='login';f.network.login=()=>{manualJoins++;f.network.state=2;};
  f.setClock(0);f.mod.step(0);f.network.error(code);f.network.state=64;
  for(let t=0;t<=30000;t+=1000){f.setClock(t);f.mod.step(t);}
  assert.equal(refreshes,0);assert.equal(automaticJoins,0);assert.equal(f.mod.reconnect.autoBlocked,true);assert.equal(f.mod.reconnect.armed,false);
  assert.equal(f.mod.beginPlay(),true);f.network.login();assert.equal(manualJoins,1);assert.equal(f.mod.reconnect.autoBlocked,false);assert.equal(f.storage.get('token'),'kept-token');assert.equal(f.storage.get('tokenId'),'kept-id');
 }finally{f.mod.dispose();}
});
test('an ordinary transport loss still permits the existing bounded restoration',()=>{
 const f=fixture();let joins=0;try{const row=['official',0,0,0,'region',0,'mode'];f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>cb();f.B.reconnect=()=>{joins++;f.network.state=1;};f.setClock(0);f.mod.step(0);f.network.state=64;f.mod.step(0);f.setClock(1000);f.mod.step(1000);assert.equal(joins,1);}finally{f.mod.dispose();}
});
test('an entry timeout retains its close event but a replaced socket cannot contaminate the report',()=>{
 const f=fixture(),handlers=new Map();try{
  f.setClock(0);const socket={readyState:0,addEventListener:(key,fn)=>handlers.set(key,fn),removeEventListener:(key)=>handlers.delete(key),close(){this.readyState=3;handlers.get('close')({code:1006,wasClean:false});}};
  f.mod.observeSocket(socket);f.network.state=2;f.mod.step(0);f.setClock(12001);f.mod.step(12001);
  const events=f.mod.connectionInfo().events;assert.ok(events.some(e=>e.type==='connection-timeout'));
  assert.equal(events.at(-1).type,'socket-close');assert.equal(events.at(-1).code,1006);assert.equal(events.at(-1).localCloseObserved,true);assert.equal(events.at(-1).transport.localCloseSource,'mod-entry-timeout');
  const oldClose=handlers.get('close');f.mod.observeSocket({...socket,readyState:1});const count=f.mod.connectionInfo().events.length;oldClose({code:1011});assert.equal(f.mod.connectionInfo().events.length,count);
 }finally{f.mod.dispose();}
});
function preflight(){const f=fixture({saved:{token:'kept-token'}}),replies=[];f.setClock(0);f.network.state=0;f.B.loginKey='login';f.B.preflightKey='preflight';f.network.preflight=(_,cb)=>replies.push(cb);f.mod.step(0);return {f,replies};}
test('disposed native preflight cannot start an old connection',()=>{const {f,replies}=preflight();let accepted=0;f.network.login=function(){this.preflight('/fixture',()=>accepted++);};f.mod.step(0);f.network.login();f.mod.dispose();replies[0]();assert.equal(accepted,0);assert.equal(f.storage.get('token'),'kept-token');});
test('nested native preflights keep ownership and reject a stale second stage',()=>{const {f,replies}=preflight();let completed=0;f.network.login=function(){this.preflight('/first',()=>this.preflight('/second',()=>completed++));};f.mod.step(0);f.network.login();replies[0]();f.setClock(12001);f.mod.step(12001);replies[1]();assert.equal(completed,0);f.network.login();replies[2]();replies[3]();assert.equal(completed,1);assert.equal(f.storage.get('token'),'kept-token');f.mod.dispose();});
for(const failure of ['missing-server','throw','timeout'])test('fresh recovery bounds server-list failure: '+failure,()=>{const f=fixture({saved:{token:'kept-token'}});let calls=0;try{f.network.state=256;f.network['ԁᴄࡃ']=['official',0,0,0,'region',0,'mode'];f.network['ոߒ४']=[];f.network['ⲅ︊ᄃ']=(_,cb)=>{calls++;if(failure==='throw')throw Error('fixture');if(failure==='missing-server')cb();};f.B.reconnect=()=>{};for(let t=0;t<=120000;t+=1000){f.setClock(t);f.mod.step(t);}assert.equal(calls,3);assert.equal(f.mod.reconnect.autoBlocked,true);assert.equal(f.storage.get('token'),'kept-token');assert.equal(f.mod.beginPlay(),true);assert.equal(f.mod.reconnect.refreshFailures,0);}finally{f.mod.dispose();}});
test('normal join remains possible after earlier restore attempts',()=>{const f=fixture({saved:{token:'kept-token'}}),row=['official',0,0,0,'region',0,'mode'],joins=[];try{f.network.state=256;f.mod.reconnect.attempts=3;f.network['ԁᴄࡃ']=row;f.network['ոߒ४']=[row];f.network['ⲅ︊ᄃ']=(_,cb)=>cb();f.B.reconnect=()=>joins.push(f.network.state);f.setClock(0);f.mod.step(0);f.setClock(1000);f.mod.step(1000);assert.deepEqual(joins,[0]);assert.equal(f.storage.get('token'),'kept-token');}finally{f.mod.dispose();}});
test('native network failure codes are recorded without account contents',()=>{const f=fixture({saved:{token:'kept-token'}});let calls=0;try{f.network.state=0;f.B.errorKey='error';f.network.error=code=>{calls++;f.network.state=code;};f.mod.step(0);f.network.error(512,'private-error-content');const r=f.mod.connectionInfo();assert.equal(calls,1);assert.equal(f.network.state,512);assert.equal(r.events.at(-1).type,'native-network-error');assert.equal(r.events.at(-1).failureCode,512);assert.ok(!JSON.stringify(r).includes('private-error-content'));assert.ok(!JSON.stringify(r).includes('kept-token'));}finally{f.mod.dispose();}});
