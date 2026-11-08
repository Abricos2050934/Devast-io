const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs'),{readonlyConstants}=require('../tools/updater/semantic.cjs'),{initializerBootstrap}=require('../tools/updater/bootstrap.cjs');
const parse=source=>readonlyConstants(analyze('(()=>{'+source+'})();'));
const before='var units=(function(){function init(a,b,c){return [a,b,c]}return {init};})();units.init(600,30000,5000);';
const after='var entities=(function(){function renamed(a,b,c){return [a,b,c]}return {start:renamed};})();entities.start(600,30000,5000);';
function match(source=after,pair=true){const a=parse(before),b=parse(source),oldFn=a.functions.find(f=>f.id?.name==='init'),nextFn=b.functions.find(f=>f.id?.name==='renamed'),node=a.tree.body[0].expression.callee.body.body.at(-1);return initializerBootstrap(a,b,node,'units','entities',pair?new Map([[oldFn,nextFn]]):new Map());}
test('renamed initializer property retains the independently matched allocator and original startup arguments',()=>{const r=match();assert.equal(r.current.expression.callee.property.name,'start');});
test('changed allocation arguments, missing method proof or duplicate startup calls stop the bootstrap adaptation',()=>{
 assert.throws(()=>match(after.replace('600,30000','700,30000')),/changed/);
 assert.throws(()=>match(after,false),/independently matched/);
 assert.throws(()=>match(after+'entities.start(600,30000,5000);'),/ambiguous/);
});
