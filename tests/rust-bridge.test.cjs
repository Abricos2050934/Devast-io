const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function bridge(){const c=vm.createContext({});vm.runInContext(fs.readFileSync('rust-mod/bridge.js','utf8'),c);return c.__devastRustOps;}
test('fast scope bindings preserve TDZ, shadowing, const and outer var assignment',()=>{
 const b=bridge(),root=b.op('root',[{}]),fn=b.functionScope(root,{id:1},['argument']);
 b.decl(fn,'value','let');assert.throws(()=>b.read(fn,'value'),/before initialization/);b.init(fn,'value',4);
 const block=b.scope(fn);b.decl(block,'value','const');b.init(block,'value',9);
 assert.equal(b.read(block,'value'),9);assert.equal(b.read(fn,'value'),4);assert.throws(()=>b.write(block,'value',0),/constant/);
 b.decl(block,'shared','var');b.init(block,'shared',12);assert.equal(b.read(fn,'shared'),12);
 b.write(block,'shared',15);assert.equal(b.read(fn,'shared'),15);assert.equal(b.read(fn,'arguments')[0],'argument');
});
test('direct property operations and aliases preserve getters, setters and thrown errors',()=>{
 const b=bridge(),e=b.op('root',[{}]);let value=3;const object={get x(){return value;},set x(n){value=n;}};
 assert.equal(b.fastGet(object,'x'),3);assert.equal(b.fastSet(object,'x',7),7);assert.equal(value,7);
 b.alias(e,'client',()=>value,n=>{value=n;});assert.equal(b.read(e,'client'),7);b.write(e,'client',9);assert.equal(value,9);
 const failure=new Error('getter');assert.throws(()=>b.fastGet({get x(){throw failure;}},'x'),e=>e===failure);
});
test('fused calls preserve receivers, ordered arguments, callback reentry and exceptions',()=>{
 const b=bridge(),receiver={id:4};
 for(let n=0;n<=6;n++){
  const args=Array.from({length:n},(_,i)=>i+10);
  const fn=function(...received){assert.equal(this,receiver);assert.deepEqual(received,args);return 23;};
  assert.equal(b['call'+n](fn,receiver,...args),23);
 }
 const e=b.op('root',[{}]);b.decl(e,'result','let');b.init(e,'result',0);
 assert.equal(b.call1(function(value){b.write(e,'result',value);return b.read(e,'result');},null,12),12);
 const failure=new Error('callback');assert.throws(()=>b.call0(()=>{throw failure;},null),e=>e===failure);
});
test('fast unary operations preserve signed zero and native coercion errors',()=>{
 const b=bridge();assert.ok(Object.is(b.fastUnary('-',0),-0));assert.ok(Number.isNaN(b.fastUnary('+','bad')));
 assert.equal(b.fastUnary('typeof',undefined),'undefined');assert.throws(()=>b.fastUnary('+',Symbol('x')),/Symbol/);
});
