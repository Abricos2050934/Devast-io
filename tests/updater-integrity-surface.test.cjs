const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs');
const {surfaceOperations}=require('../tools/updater/integrity-surface.cjs');
const reviewed={flag:'flag',signers:['one','two','three']};
function fixture(update='',extra=''){
 const pad=' '.repeat(8100);
 return `(function(){var flag=0; function check(){if(String(Math.sin).includes('[native code]'))flag=1; flag=1; flag=1; ${update}} function one(x){${pad}return flag===1?0:x;} function two(x){${pad}return flag===1?0:x;} function three(x){${pad}return flag===1?0:x;} ${extra}})();`;
}
test('native subtract-assignment writers retain their original expression during signature port',()=>{
 const old=analyze(fixture()),source=fixture('flag-=nativeDelta();'),cur=analyze(source);
 const result=surfaceOperations(old,cur,reviewed);
 assert.equal(result.flag,'flag');assert.equal(result.operations.length,3);
 let output=source;
 for(const op of result.operations){assert.equal(output.split(op.before).length,2);output=output.replace(op.before,op.after);}
 assert.ok(output.includes('flag-=nativeDelta();'));
 assert.equal(output.split('flag=1;').length,4);
 assert.equal(output.split('return false?0:x;').length,4);
});
test('additional native flag reads still stop the signature port',()=>{
 const old=analyze(fixture());
 assert.throws(()=>surfaceOperations(old,analyze(fixture('flag-=nativeDelta();','consume(flag);')),reviewed),/changed|ambiguous/);
});
test('unreviewed compound assignment forms still stop the signature port',()=>{
 const old=analyze(fixture());
 assert.throws(()=>surfaceOperations(old,analyze(fixture('flag*=nativeDelta();')),reviewed),/changed|ambiguous/);
});
