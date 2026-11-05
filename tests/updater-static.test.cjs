const test=require('node:test'),assert=require('node:assert/strict');
const {analyze,canonical}=require('../tools/updater/static.cjs'),{interpret}=require('../tools/updater/decoder.cjs');
function fn(source){const a=analyze(source);return canonical(a,a.functions.find(n=>n.type==='FunctionDeclaration'));}
test('native fingerprints survive identifier rotation, escape spelling and immutable aliases',()=>{
 const a=fn('const field="x",size=20;function старое(игрок){return игрок[field]+size}');
 const b=fn('const другой="x",число=0x14; function новое(цель) { return цель.x + число; }');
 assert.equal(a.hash,b.hash);
});
test('a changed packet stride, opcode or comparison changes the native contract',()=>{
 const a=fn('function old(p){return p.x/20}');
 assert.notEqual(a.hash,fn('function next(p){return p.x/24}').hash);
 assert.notEqual(fn('function a(p){return p.x<20}').hash,fn('function b(p){return p.x>20}').hash);
});
test('mutable and shadowed bindings are not folded as global constants',()=>{
 const a=analyze('const value=20;function f(value){return value}function g(){let value=5;value++;return value}');
 for(const n of a.nodes.filter(n=>n.type==='ReturnStatement'))assert.equal(a.constant(n.argument),undefined);
});
test('bounded decoder captures text rather than executing it',()=>{
 const a=analyze('{const data="process.exit(9)";eval(data)}');
 const out=interpret(a.tree.body[0],a);assert.equal(out.source,'process.exit(9)');
});
function encodedTableFixture(width){
 const key=[74,227,216,17],start=width===256?0xe000:0xfe00;
 const permutation=Array.from({length:width},(_,i)=>(i*(width===256?73:5)+3)%width);
 const inverse=new Map(permutation.map((value,i)=>[value,String.fromCharCode(start+i)]));
 const names=Array.from({length:101},(_,i)=>['length','charCodeAt','fromCharCode','window','process.exit(9)'][i%5]);
 function encode(text){
  const data=Buffer.from(text,'latin1').toString('base64'),plain=[data.length>>8,data.length&255,...Buffer.from(data)];
  const pad=2-plain.length%2;plain.push(...Array(pad).fill(pad));const cipher=[];
  for(let i=0;i<plain.length;i+=2){let l=plain[i],r=plain[i+1];for(const k of key)[l,r]=[r,l^((r*k+k)&255)];cipher.push(l,r);}
  return cipher.map(byte=>width===256?inverse.get(byte):inverse.get(byte>>4)+inverse.get(byte&15)).join('');
 }
 const map='{'+permutation.map((value,i)=>(start+i)+':'+value).join(',')+'}';
 const source='const alphabet='+map+';const key='+JSON.stringify(key)+';const encoded='+JSON.stringify(names.map(encode))+';const table=[];const '+names.map((_,i)=>'alias'+i+'=table['+i+']').join(',')+';function read(){return ['+names.map((_,i)=>'alias'+i).join(',')+']}';
 return {source,names};
}
test('both native symbol alphabets decode string aliases as data, including executable-looking text',()=>{
 for(const width of [16,256]){
  const {source,names}=encodedTableFixture(width),a=analyze(source);
  const returned=a.nodes.find(n=>n.type==='ReturnStatement').argument;
  assert.deepEqual(returned.elements.map(n=>a.constant(n)),names);
 }
});
test('native string tables reject duplicate and out-of-range byte substitutions',()=>{
 const {source}=encodedTableFixture(256);
 assert.throws(()=>analyze(source.replace('57345:76','57345:3')),/Invalid symbol table/);
 assert.throws(()=>analyze(source.replace('57344:3','57344:256')),/Invalid symbol table/);
});
test('identical direction handlers retain their distinct read-only native timers',()=>{
 const {directionDelay}=require('../tools/updater/network-contracts.cjs');
 const source='var slow=150,fast=60;function a(){if(now-last>slow)send(6)}function b(){if(now-last>fast)send(6)}';
 const a=analyze(source),functions=a.functions.filter(f=>f.type==='FunctionDeclaration');
 assert.equal(canonical(a,functions[0]).hash,canonical(a,functions[1]).hash);
 assert.deepEqual(functions.map(f=>directionDelay(a,f)),[150,60]);
 for(const source of ['var delay=150;delay=60;function f(){if(now-last>delay)send(6)}','var delay=150;var delay=60;function f(){if(now-last>delay)send(6)}','var delay=150;function configure(){return delay}function f(){if(now-last>delay)send(6)}']){
  const a=analyze(source);assert.equal(directionDelay(a,a.functions.find(f=>f.id?.name==='f')),null);
 }
});
test('network discovery includes appended exports and excludes other namespaces and unknown computed keys',()=>{
 const {exportNames}=require('../tools/updater/network-contracts.cjs');
 const a=analyze('const key="login";const net=(()=>{return {send:function(){}}})();net[key]=function(){};other.wrong=function(){};net[unknown]=function(){};');
 const object=a.nodes.find(n=>n.type==='ReturnStatement').argument;
 assert.deepEqual([...exportNames(a,object,'net')],['send','login']);
});
test('native idle timer discovery accepts reversed operands with the same strict inequality',()=>{
 const {elapsedTimer}=require('../tools/updater/network-contracts.cjs');
 for(const expression of ['now-last>limit','limit<now-last'])assert.equal(elapsedTimer(analyze(expression).tree.body[0].expression,'now','last'),'limit');
 for(const expression of ['now-last<limit','limit>now-last','now-last>=limit','limit<=now-last','other-last>limit','now-other>limit'])assert.equal(elapsedTimer(analyze(expression).tree.body[0].expression,'now','last'),null);
});
test('decoder rejects host capabilities and prototype access',()=>{
 for(const source of ['{process.exit(9)}','{const x=[];x.constructor("return process")()}']){
  const a=analyze(source);assert.throws(()=>interpret(a.tree.body[0],a),/Unsupported|Forbidden/);
 }
});

test('automatic port refuses a modified reference baseline before changing any file',()=>{
 const {port}=require('../tools/auto_port.cjs');
 assert.throws(()=>port('changed reference','candidate',{baseline_sha256:'0000'}),/Reference baseline checksum mismatch/);
});
test('reference selection preserves the historical client and uses the latest reviewed client for a new rotation',()=>{
 const {selectReference,loadReference}=require('../tools/updater/references.cjs');
 const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
 const root=path.resolve(__dirname,'..');
 for(const file of ['baselines/current.js.gz','baselines/native-2026-11-05.js.gz']){
  const candidate=zlib.gunzipSync(fs.readFileSync(path.join(root,file))).toString();
  const reference=loadReference(root,candidate);
  assert.equal(reference.source,candidate);
  assert.equal(selectReference(require('../tools/updater/static.cjs').hash(candidate)).baseline,file);
 }
 assert.equal(selectReference('unreviewed-hash').baseline,'baselines/native-2026-11-05.js.gz');
});
