const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {analyze}=require('../tools/updater/static.cjs');
const {readonlyConstants,semanticCanonical}=require('../tools/updater/semantic.cjs');
const {preservedSpans}=require('../tools/updater/project-fragment.cjs');
function inspect(source){const a=readonlyConstants(analyze(source)),fn=a.functions.find(f=>f.id?.name==='f');return {a,fn,c:semanticCanonical(a,fn)};}
function same(left,right){assert.equal(inspect(left).c.hash,inspect(right).c.hash);}

test('native correspondence handles block/sequence conditionals and immutable aliases',()=>{
 same('const missing=undefined;var delay=150;function f(x){if(x!==missing){x=1;x+=delay}else{x=2;x+=delay}}',
 'const absent=undefined;const timer=150;function f(y){y!==absent?(y=1,y+=timer):(y=2,y+=timer)}');
 same('function f(x){if(x===1)first();else if(x===2)second();else third()}',
 'function f(y){y===1?first():y===2?second():third()}');
});
test('native loop initializers may rotate without losing stride or opcode checks',()=>{
 const a='function f(x){for(var i=0,byte=2,word=1;i<x;i++,byte+=20,word+=10)send([2,byte,word])}';
 const b='function f(x){for(var word=1,byte=2,i=0;x>i;i++,byte+=20,word+=10)send([2,byte,word])}';
 same(a,b);
 for(const changed of [b.replace('byte+=20','byte+=21'),b.replace('[2,byte','[5,byte'),b.replace('x>i','x>=i')])assert.notEqual(inspect(a).c.hash,inspect(changed).c.hash);
});
test('mutable aliases and reads preceding initialization are not constants',()=>{
 for(const source of ['var n=3;n=4;function f(){return n}','function f(){return n}var n=3']){
  const a=readonlyConstants(analyze(source)),n=a.nodes.find(n=>n.type==='ReturnStatement').argument;assert.equal(a.constant(n),undefined);
 }
 const a=readonlyConstants(analyze('const base=1;var alias=base;var chained=alias;function f(){return chained}'));
 assert.equal(a.constant(a.nodes.find(n=>n.type==='ReturnStatement').argument),1);
});
test('projection retains candidate getter order and leaves both native ASTs untouched',()=>{
 const old=inspect('function f(x){if(x.left>x.right)out=1;else out=0;}'),cur=inspect('function f(x){if(x.right<x.left)out=1;else out=0;}');
 assert.equal(old.c.hash,cur.c.hash);assert.equal(old.fn.body.body[0].type,'IfStatement');assert.equal(cur.fn.body.body[0].test.operator,'<');
 const projection=new Map([...old.c.entries].filter(([p])=>cur.c.entries.has(p)).map(([p,n])=>[n,cur.c.entries.get(p)]));
 let after=old.a.source.replace('{','{hook();');
 const edits=preservedSpans(old.a,cur.a,{old:old.fn,projection},after);
 for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.text+after.slice(e.end);
 const order=[],context={hook:()=>order.push('hook'),x:{get left(){order.push('left');return 2},get right(){order.push('right');return 1}}};
 vm.runInNewContext(after+';f(x)',context,{timeout:1000});assert.deepEqual(order,['hook','right','left']);assert.equal(context.out,1);
});

test('native server-list interface rejects changed lobby indices or JSON fields',()=>{
 const {serverListSchema}=require('../tools/updater/network-contracts.cjs');
 const source='function f(data){const record=data[0],list=record.l,row=list[0],lobby=row[0],region=record.n,capacity=row[3],ports=record.p,extra=row[4];out.push([lobby,name,number,1,region,capacity,short,ports,extra]);}';
 for(const [text,expected]of [[source,true],[source.replace('capacity=row[3]','capacity=row[4]'),false],[source.replace('list=record.l','list=record.z'),false],[source.replace('ports=record.p','ports=record.q'),false]]){
  const {a,fn}=inspect(text);assert.equal(serverListSchema(a,fn),expected);
 }
});
