const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs');
const {integrityOperations}=require('../tools/updater/integrity.cjs');
const source='var ѕ०̊=0;const one=1;function а１๐(x){return [x+1,ѕ०̊===1]}function ⲅࡃ०(x){return [x+2,ѕ०̊===one]}function ܐ̄︁(x){return [x+3,ѕ०̊===1]}';
function plan(next=source){
 const old=analyze(source),cur=analyze(next),pairs=new Map();
 for(const fn of old.functions)if(fn.id)pairs.set(fn,cur.functions.find(n=>n.id?.name===fn.id.name));
 return integrityOperations(old,cur,pairs);
}
test('integrity mapping follows native identifier rotation and preserves the rest of each signer',()=>{
 const next=source.replaceAll('ѕ०̊','rotatedFlag').replaceAll('one','literalAlias');
 const result=plan(next);assert.equal(result.flag,'rotatedFlag');assert.equal(result.operations.length,3);
 let patched=next;for(const op of result.operations){assert.equal(patched.split(op.before).length,2);patched=patched.replace(op.before,op.after);}
 const vm=require('node:vm');
 for(const flag of [0,1]){
  const ctx={};vm.runInNewContext(patched+`;rotatedFlag=${flag};result=[а１๐(10),ⲅࡃ०(10),ܐ̄︁(10)];`,ctx);
  assert.equal(JSON.stringify(ctx.result),JSON.stringify([[11,false],[12,false],[13,false]]));
 }
});
test('a changed native signature contract or unknown flag reader blocks the port',()=>{
 assert.throws(()=>plan(source.replace('x+2','x+4')),/contract changed/);
 assert.throws(()=>plan(source+'function extra(){return ѕ०̊}'),/Unreviewed/);
 assert.throws(()=>plan(source.replace('var ѕ०̊=0','let ѕ०̊=0')),/binding changed/);
});
test('missing reviewed predicates do not silently produce an unpatched update',()=>{
 const a=analyze('var ѕ०̊=0;function а１๐(){return ѕ०̊===1}');
 assert.throws(()=>integrityOperations(a,a,new Map()),/three reviewed/);
});
test('a separate reviewed reference can name its native flag and three signers without relaxing contracts',()=>{
 const next=source.replaceAll('ѕ०̊','newFlag').replaceAll('а１๐','first').replaceAll('ⲅࡃ०','second').replaceAll('ܐ̄︁','third');
 const a=analyze(next),pairs=new Map(a.functions.map(fn=>[fn,fn]));
 const metadata={flag:'newFlag',signers:['first','second','third']};
 assert.equal(integrityOperations(a,a,pairs,metadata).operations.length,3);
 const changed=analyze(next.replace('x+2','x+7'));
 assert.throws(()=>integrityOperations(a,changed,new Map(a.functions.map(fn=>[fn,changed.functions.find(n=>n.id.name===fn.id.name)])),metadata),/contract changed/);
 assert.throws(()=>integrityOperations(a,a,pairs,{...metadata,signers:['first','second','second']}),/Invalid reviewed/);
});

test('opaque native signer rotation retains new formulas and rejects an extra flag reader',()=>{
 const pad='/*'+'.'.repeat(8100)+'*/';
 const native=source.replace('const one=1;','const one=1;function check(f){if(f.toString().indexOf("[native code]")<0){ѕ०̊=1;ѕ०̊=1;ѕ०̊=1}}').replaceAll('{return','{'+pad+'return');
 const next=native.replaceAll('ѕ०̊','rotated').replaceAll('а１๐','alpha').replaceAll('ⲅࡃ०','beta').replaceAll('ܐ̄︁','gamma').replace('x+2','x+7');
 const old=analyze(native),cur=analyze(next),result=integrityOperations(old,cur,new Map());
 assert.equal(result.flag,'rotated');assert.equal(result.operations.length,3);
 let patched=next;for(const op of result.operations)patched=patched.replace(op.before,op.after);
 for(const flag of [0,1]){const context={};require('node:vm').runInNewContext(patched+`;rotated=${flag};result=[alpha(10),beta(10),gamma(10)]`,context,{timeout:1000});assert.equal(JSON.stringify(context.result),'[[11,false],[17,false],[13,false]]');}
 assert.throws(()=>integrityOperations(old,analyze(next+'function extra(){return rotated}'),new Map()),/contract changed/);
});
