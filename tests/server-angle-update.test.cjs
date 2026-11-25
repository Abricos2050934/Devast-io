const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs');
const {readonlyConstants}=require('../tools/updater/semantic.cjs');
const {serverAngle}=require('../tools/updater/server-angle.cjs');
const prefix='var sequence=0;var playerType=sequence++;';
const before='function previous(p){'+Array.from({length:10},()=> 'p.id;').join('')+'if(own===p.id)p.angle=input.angle;else p.id===0?p.angle=smooth(p.angle,p.server,.5):p.angle=smooth(p.angle,p.server,2);}';
const after='function current(p){'+Array.from({length:10},()=> 'p.id;').join('')+'if(own===p.id)p.angle=input.angle;else if(playerType===p.type)p.angle=smooth(p.angle,p.server,.5);else p.angle=smooth(p.angle,p.server,2);}';
function fixture(source){return readonlyConstants(analyze(prefix+source));}
test('new native type predicate is preserved while the self-angle assignment is mapped',()=>{
 const old=fixture(before),cur=fixture(after),match=serverAngle(old,cur,old.functions[0]);
 assert.equal(match.current,cur.functions[0]);
 assert.equal(cur.source.slice(match.current.start,match.current.end),after);
 const target=match.nc.entries.get('/body/body/10/expression/consequent');
 assert.equal(cur.source.slice(target.start,target.end),'p.angle=input.angle');
});
test('changed interpolation, unexpected category and duplicate candidates stop automatic mapping',()=>{
 const old=fixture(before);
 for(const source of [after.replace('p.server,2','p.server,3'),after.replace('p.type','p.other'),after+after.replace('current','duplicate')]){
  assert.throws(()=>serverAngle(old,fixture(source),old.functions[0]),/changed or ambiguous/);
 }
});
