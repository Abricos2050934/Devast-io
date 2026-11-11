const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs');
const {readonlyConstants}=require('../tools/updater/semantic.cjs');
const {playerRejoin,playerConstructor}=require('../tools/updater/player-rejoin.cjs');
const before='function старый(данные){var игрок=мир.список[данные[1]];игрок.имя=данные[3];игрок.история=[];}';
const handler='function новый(пакет){var цель=сцена.игроки[пакет[1]];цель.ник=пакет[3];движок.сброс(цель.id);цель.путь=[];}';
const after=`var движок=(function(){function сброс(код){var игрок=сцена.игроки[код];(игрок!==undefined&&игрок.движение!==0)&&(игрок.начало=движок.время-420,игрок.кадр=0);}return {сброс:сброс};})();var движок;${handler}`;
function match(source=after){const old=readonlyConstants(analyze(before)),cur=readonlyConstants(analyze(source));return playerRejoin(old,cur,old.functions[0]);}
test('rejoin nickname mapping preserves the new native animation reset and every old statement',()=>{
 const result=match();assert.equal(result.oc.hash,result.nc.hash);
 assert.equal(result.current.body.body.length,4);
 assert.equal(result.nc.entries.get('/body'),result.current.body);
 const nickname=[...result.oc.entries].find(([,n])=>n.type==='AssignmentExpression'&&n.right.type==='MemberExpression')[0];
 assert.equal(result.nc.entries.get(nickname),result.current.body.body[1].expression);
});
test('changed rejoin packets, animation behavior, table, owner and ambiguous handlers block the adaptation',()=>{
 for(const source of [after.replace('пакет[3]','пакет[4]'),after.replace('-420','-421'),after.replace('сцена.игроки[код]','сцена.другие[код]'),after.replace('цель.id','пакет.id'),after.replace('движок.время','другой.время'),after+'\n'+handler.replace('новый','дубликат')])assert.throws(()=>match(source),/rejoin contract changed or ambiguous/);
});
test('constructor mapping retains six new scalar initializers and rejects changed existing fields',()=>{
 const original='function игрок(код,имя){this.имя=имя;this.id=код;this.путь=[];this.прочее=0;}',extra='this.а=0;this.б=0;this.в=0;this.г=0;this.д=0;this.е=-1;',next=original.replace('this.прочее=0;',extra+'this.прочее=0;');
 const old=readonlyConstants(analyze(original));
 const run=source=>playerConstructor(old,readonlyConstants(analyze(source)),old.functions[0]);
 const result=run(next);assert.equal(result.oc.hash,result.nc.hash);assert.equal(result.current.body.body.length,10);
 for(const source of [next.replace('this.путь=[]','this.путь=[1]'),next.replace('this.а=0','this.а=1'),next.replace('this.е=-1','this.е=0'),next.replace('this.б=0','this.а=0'),next.replace('this.прочее=0','this.а=0'),next+'\n'+next.replace('игрок','второй')])assert.throws(()=>run(source),/constructor contract changed or ambiguous/);
});
