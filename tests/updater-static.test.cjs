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
test('decoder rejects host capabilities and prototype access',()=>{
 for(const source of ['{process.exit(9)}','{const x=[];x.constructor("return process")()}']){
  const a=analyze(source);assert.throws(()=>interpret(a.tree.body[0],a),/Unsupported|Forbidden/);
 }
});

test('automatic port refuses a modified reference baseline before changing any file',()=>{
 const {port}=require('../tools/auto_port.cjs');
 assert.throws(()=>port('changed reference','candidate',{baseline_sha256:'0000'}),/Reference baseline checksum mismatch/);
});
