const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {analyze}=require('../tools/updater/static.cjs');
const {message15Operations}=require('../tools/updater/message15-contracts.cjs');

function sessionPatch(body){
 const source=`function release(){send(codec.encode([5]))}
 function move(mask){send(codec.encode([2,mask]))}
 function handshake(packet){world.self.id=packet[1]}
 function start(name,skin){${body}}
 const network={start:start};`;
 const a=analyze(source),roles={'еϲᄄ':'codec'};
 const operations=[{id:'jitter-native-fire-priority',after:'function fire(){}'},
  {id:'ilm-native-self-server-angle',after:'angle=__responsiveMod.aimRenderAngle?custom:native;'}];
 const ops=message15Operations(a,operations,{'еܞ︌':'world','ᅠᏧ‍':'self','ⲟࠀᄀ':'start'},roles,{moveOpcode:2},new Set(a.functions));
 return ops.find(op=>op.id==='message15-session-start').after;
}

for(const body of [
 'if(ready){save(name);save(skin);connect();}',
 'ready&&(save(name),save(skin),connect());'
])test('session hook retains the native guard and action order: '+body,()=>{
 const patch=sessionPatch(body);
 for(const ready of [false,true])for(const installed of [false,true]){
  const events=[],context={ready,__responsiveMod:installed?{onSessionStart:()=>events.push('session')}:null,
   save:value=>events.push(value),connect:()=>events.push('connect')};
  vm.runInNewContext(patch+';start("name","skin")',context,{timeout:1000});
  assert.deepEqual(events,ready?[...(installed?['session']:[]),'name','skin','connect']:[]);
 }
});

test('session hook rejects an unguarded or unsupported native start body',()=>{
 for(const body of ['save(name);connect();','ready||(save(name),connect());','ready&&connect();'])
  assert.throws(()=>sessionPatch(body),/Native session start contract changed/);
});
