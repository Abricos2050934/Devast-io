// Compare both assembled representations with the actual original ILM handlers.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm');
const {analyze}=require('../tools/updater/static.cjs'),parser=require('../tools/parser.cjs');
test('raw and automatically decoded native direction hooks preserve ILM timing and angle bookkeeping',()=>{
 const raw=z.gunzipSync(fs.readFileSync('baselines/current.js.gz')).toString(),analysis=analyze(raw),values=new Map();
 for(const n of analysis.nodes)if(n.type==='Identifier'){const v=analysis.constant(n);if(v!==undefined){if(!values.has(n.name))values.set(n.name,new Map());values.get(n.name).set(JSON.stringify(v),v);}}
 const constants=Object.fromEntries([...values].filter(([,vs])=>vs.size===1).map(([k,vs])=>[k,[...vs.values()][0]]));
 const hooks=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz')));
 const patches=JSON.parse(fs.readFileSync('patches/recovered-current.json')).operations.filter(op=>op.id.startsWith('ilm-native-angle-bookkeeping-'));
 assert.equal(patches.length,2);
 for(const patch of patches)for(const representation of ['raw','decoded']){
  const fn=parser.parse(patch.decoded_before,{ecmaVersion:'latest'}).body[0],name=fn.id.name;
  const intervalName=fn.body.body[0].test.right.name,interval=100;assert.ok(intervalName,'Native configurable interval required');
  const native=vm.createContext({...constants,[intervalName]:interval,__responsiveMod:{settings:{AimBotEnabled:false},controlsAimDirection:false},'ᴉ̡̂':0,'ѕܓ́':0,'ⲅᚂߌ':0,'ﾠࠂ̶':0,'ㅤ๘މ':{angle:0},packets:[],codecCalls:0});
  let patched=patch.decoded_after;
  if(representation==='raw'){
   native.source=patch.decoded_before;native.index=patches.indexOf(patch);
   vm.runInContext(fs.readFileSync('mod/ilm-aim.js','utf8'),native);
   patched=vm.runInContext('__ilmPatchNativeDirection(source,index)',native);
   assert.equal(patched,patch.decoded_after);
  }
  vm.runInContext('function ιܕ︅(p){packets.push(p);}var еϲᄄ={ᴎ︅ހ:p=>{codecCalls++;return p;}};'+patched+';var call='+name+';',native);
  const original=vm.createContext({window:{Math,JSON},_0xb76161:()=>{throw Error('Decoder must not execute');},_0x2ea565:{AimBotEnabled:false},_0x565a20:0,_0xbec505:0,_0xe9c528:0,_0x3a4cec:0,_0x51a9fc:{angle:0},_0x30a095:interval,_0x5c95d6:interval,packets:[]});
  const source=hooks.find(h=>h.name===(name==='օ︃２'?'_0x307373':'_0x29d073')).source;
  vm.runInContext('var _0x5096af={send:p=>packets.push(JSON.parse(p))};'+source+';var call='+(name==='օ︃２'?'_0x307373':'_0x29d073')+';',original);
  for(const [time,angle,enabled]of [[interval+1,.7,true],[interval+2,.8,true],[interval*2+3,1.4,true],[interval*2+4,1.4,false],[interval*3+6,-2,false],[interval*4+8,Math.PI,true],[interval*5+10,Math.PI,false],[interval*6+12,0,false]]){
   native['ᴉ̡̂']=time;native['ㅤ๘މ'].angle=angle;native.__responsiveMod.settings.AimBotEnabled=enabled;native.__responsiveMod.controlsAimDirection=enabled;
   original._0x565a20=time;original._0x51a9fc.angle=angle;original._0x2ea565.AimBotEnabled=enabled;
   vm.runInContext('call();',native,{timeout:1000});vm.runInContext('call();',original,{timeout:1000});
   const actual=vm.runInContext('JSON.stringify({last:ѕܓ́,angle:ⲅᚂߌ,sent:ﾠࠂ̶,packets})',native);
   const expected=vm.runInContext('JSON.stringify({last:_0xbec505,angle:_0xe9c528,sent:_0x3a4cec,packets})',original);
   assert.equal(actual,expected,patch.id+' '+representation+' '+JSON.stringify({time,angle,enabled}));
   assert.equal(native.codecCalls,native.packets.length,'Suppressed directions must not advance the native codec');
  }
 }
});
test('brief target loss never lets a native mouse angle replace ILM between source ticks',()=>{
 const {fixture}=require('./mod-fixture.cjs'),f=fixture();
 try{
  for(const[id,x]of [[1,1000],[2,1500]])f.mod.trackPacket(1,id,1,x,1000,true);
  f.mod.setSetting('AimBotEnabled',true);f.mod.setSetting('lockId',2);f.mod.aim.refresh();
  const a=analyze(z.gunzipSync(fs.readFileSync('baselines/current.js.gz')).toString()),values=new Map();
  for(const n of a.nodes)if(n.type==='Identifier'){const v=a.constant(n);if(v!==undefined){if(!values.has(n.name))values.set(n.name,new Map());values.get(n.name).set(JSON.stringify(v),v);}}
  const constants=Object.fromEntries([...values].filter(([,v])=>v.size===1).map(([k,v])=>[k,[...v.values()][0]]));
  const patch=JSON.parse(fs.readFileSync('patches/recovered-current.json')).operations.find(o=>o.id==='ilm-native-angle-bookkeeping-secondary'),fn=parser.parse(patch.decoded_after,{ecmaVersion:'latest'}).body[0],interval=fn.body.body[0].test.right.name;
  const native=vm.createContext({...constants,[interval]:100,__responsiveMod:f.mod,'ᴉ̡̂':1000,'ѕܓ́':0,'ⲅᚂߌ':0,'ﾠࠂ̶':0,'ㅤ๘މ':{angle:Math.PI/2},packets:[]});
  vm.runInContext('function ιܕ︅(p){packets.push(p)}var еϲᄄ={ᴎ︅ހ:p=>p};'+patch.decoded_after+';var call='+fn.id.name+';',native);
  const hook=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz'))).find(h=>h.name==='_0x29d073');
  const original=vm.createContext({window:{Math,JSON},_0xb76161:()=>{},_0x2ea565:{AimBotEnabled:true},_0x565a20:1000,_0xbec505:0,_0xe9c528:0,_0x3a4cec:0,_0x51a9fc:{angle:Math.PI/2},_0x30a095:100,packets:[]});
  vm.runInContext('var _0x5096af={send:p=>packets.push(JSON.parse(p))};'+hook.source+';var call=_0x29d073;',original);
  f.mod.trackPacket(1,2,1,0,0,false);vm.runInContext('call()',native);vm.runInContext('call()',original);
  assert.equal(vm.runInContext('JSON.stringify(packets)',native),vm.runInContext('JSON.stringify(packets)',original));assert.equal(native.packets.length,0);
  f.mod.trackPacket(1,2,1,1500,1000,true);assert.equal(f.mod.controlsAimDirection,true);assert.deepEqual(f.packets,[[6,0]]);
  f.mod.setSetting('AimBotEnabled',false);native['ᴉ̡̂']=original._0x565a20=2000;native['ㅤ๘މ'].angle=original._0x51a9fc.angle=Math.PI;original._0x2ea565.AimBotEnabled=false;
  vm.runInContext('call()',native);vm.runInContext('call()',original);assert.equal(vm.runInContext('JSON.stringify(packets)',native),'[[6,180]]');assert.equal(vm.runInContext('JSON.stringify(packets)',original),'[[6,180]]');
 }finally{f.mod.dispose();}
});
