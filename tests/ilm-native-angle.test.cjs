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
   vm.runInContext(fs.readFileSync('mod/untitled-aim.js','utf8'),native);
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
