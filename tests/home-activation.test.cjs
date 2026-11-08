const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs'),{readonlyConstants}=require('../tools/updater/semantic.cjs'),{homeActivation}=require('../tools/updater/home-activation.cjs');
const parse=s=>readonlyConstants(analyze('(()=>{var state=0,zero=0,client={};var home=(function(){'+s+'})();})();'));
const before='function run(){client.open();client.refresh();}return {run};';
const after='function enter(){client.open();state=zero;client.refresh();}return {start:enter};';
function match(source=after){const a=parse(before),b=parse(source),scope=x=>x.tree.body[0].expression.callee.body.body.at(-1).declarations[0].init.callee,oldScope=scope(a),nextScope=scope(b);return homeActivation(a,b,oldScope,nextScope,oldScope.body.body.at(-1).argument,nextScope.body.body.at(-1).argument,'run',new Map());}
test('renamed native home entry retains the full implementation including one new binary-state reset',()=>{assert.equal(match(),'start');assert.equal(match(after.replace('state=zero;','state=1;')),'start');assert.equal(match(after.replace('state=zero;','')),'start');});
test('home entry refuses changed actions, non-binary resets and executable reset expressions',()=>{
 for(const source of [after.replace('refresh','close'),after.replace('state=zero;','state=2;'),after.replace('state=zero;','state=client.reset();'),after.replace('client.refresh();','')])assert.throws(()=>match(source),/changed or ambiguous/);
});
test('home entry requires a unique native export',()=>{assert.throws(()=>match(after.replace('return {start:enter};','return {start:enter,also:enter};')),/ambiguous/);});
