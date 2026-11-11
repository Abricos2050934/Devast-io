// Interpret only the isolated string-table construction loop and its immutable
// data dependencies. Downloaded code never receives host objects or functions.
const forbidden=new Set(['__proto__','prototype','constructor','caller','callee','arguments']);
function decodeDataTable(analysis,nodes,group){
 const {binding,parent,constant}=analysis,keys=new WeakMap(),key=n=>{if(!keys.has(n))keys.set(n,binding(n)||'global:'+n.name);return keys.get(n);};
 const target=key(group.declarations[0].init.object);
 if(!group.declarations.every(d=>key(d.init.object)===target))throw Error('Mixed string alias tables');
 const pushes=nodes.filter(n=>n.end<group.start&&n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.type==='Identifier'&&key(n.callee.object)===target&&(n.callee.computed?constant(n.callee.property):n.callee.property.name)==='push');
 const loops=new Set();
 for(let push of pushes){while(push&&push.type!=='ForStatement')push=parent.get(push);if(push)loops.add(push);}
 if(loops.size!==1)throw Error('Unique isolated string-table loop required');
 const loop=[...loops][0],globals=new Map([[target,[]]]),pending=new Set(),safe=new WeakSet(),functions=new WeakSet(),owned=new WeakSet(),limit=16*1024*1024;
 let scope=parent.get(loop);while(scope&&!/Function/.test(scope.type))scope=parent.get(scope);
 const owners=new WeakMap();function owner(n){if(!owners.has(n)){let p=parent.get(n);while(p&&!/Function/.test(p.type))p=parent.get(p);owners.set(n,p);}return owners.get(n);}
 let steps=0,depth=0;
 const tick=()=>{if(++steps>80000000)throw Error('String-table instruction limit');};
 const check=v=>{if((typeof v==='string'||Array.isArray(v))&&v.length>limit)throw Error('String-table size limit');return v;};
 const own=v=>(owned.add(v),v),allow=fn=>(safe.add(fn),fn);
 const string=Object.assign(Object.create(null),{fromCharCode:allow((...args)=>String.fromCharCode(...args))});
 const win=Object.assign(Object.create(null),{String:string,parseInt:allow((v,radix)=>parseInt(v,radix)),atob:allow(v=>{
  if(typeof v!=='string'||! /^[A-Za-z\d+/]*={0,2}$/.test(v))throw Error('Invalid string-table base64');return Buffer.from(v,'base64').toString('latin1');
 })});
 own(globals.get(target));
 function environment(outer){return {outer,values:new Map()};}
 const root=environment(null);
 function get(n,e){
  const k=key(n);for(let f=e;f;f=f.outer)if(f.values.has(k))return f.values.get(k);
  if(globals.has(k))return globals.get(k);
  const b=binding(n);
  if(!b){if(n.name==='undefined')return undefined;if(n.name==='window')return win;if(Object.hasOwn(win,n.name))return win[n.name];
   if(n.name==='Array')return allow((...args)=>{if(args.length>1||args.length===1&&(!Number.isInteger(args[0])||args[0]<0||args[0]>65536))throw Error('Unsupported data array');return own(args.length?Array(args[0]):[]);});
  }
  if(!b||b.kind!=='const'||!b.init||pending.has(k)||b.node.start>=loop.start||owner(b.node)!==scope)throw Error('Unsupported string-table dependency: '+n.name);
  pending.add(k);const value=expr(b.init,root);pending.delete(k);globals.set(k,value);return value;
 }
 function property(object,k){
  k=String(k);if(forbidden.has(k))throw Error('Forbidden string-table property');
  if(object===null||object===undefined)throw Error('Invalid string-table member');
  if(typeof object==='object'&&functions.has(object))throw Error('Opaque string-table function');
  if(k==='length'&&(typeof object==='string'||Array.isArray(object)))return object.length;
  if(Array.isArray(object)&&['push','pop','reverse','slice','join'].includes(k))return allow((...args)=>{
   if(!owned.has(object))throw Error('Foreign data array');
   if(k==='push'&&object.length+args.length>limit)throw Error('String-table size limit');
   if(k==='join'&&object.reduce((size,v)=>size+String(v??'').length,0)+Math.max(0,object.length-1)*String(args[0]??',').length>limit)throw Error('String-table size limit');
   const out=object[k](...args);return Array.isArray(out)?own(check(out)):check(out);
  });
  if(typeof object==='string'&&['charAt','charCodeAt','substr','substring','slice','split','padStart'].includes(k))return allow((...args)=>{
   if(k==='padStart'&&(!Number.isInteger(args[0])||args[0]>limit))throw Error('String-table size limit');
   const out=object[k](...args);return Array.isArray(out)?own(check(out)):check(out);
  });
  if(typeof object==='number'&&k==='toString')return allow(radix=>{if(!Number.isInteger(radix)||radix<2||radix>36)throw Error('Invalid data radix');return object.toString(radix);});
  return Object.hasOwn(Object(object),k)?object[k]:undefined;
 }
 function reference(n,e){
  if(n.type==='Identifier'){
   const k=key(n);for(let f=e;f;f=f.outer)if(f.values.has(k))return {get:()=>f.values.get(k),set:v=>(f.values.set(k,check(v)),v)};
   throw Error('Unbound string-table write');
  }
  if(n.type!=='MemberExpression')throw Error('Unsupported string-table assignment');
  const object=expr(n.object,e),k=String(n.computed?expr(n.property,e):n.property.name);
  if(!object||!owned.has(object)||forbidden.has(k))throw Error('Forbidden string-table write');
  if(Array.isArray(object)&&(!/^\d+$/.test(k)||Number(k)>limit))throw Error('Invalid data array index');
  return {get:()=>property(object,k),set:v=>(object[k]=check(v))};
 }
 function assign(n,value,e){
  if(n.type==='ArrayPattern'){if(!Array.isArray(value))throw Error('Invalid data destructuring');n.elements.forEach((p,i)=>{if(p)assign(p,value[i],e);});return value;}
  return reference(n,e).set(value);
 }
 function binary(op,l,r){switch(op){case '+':return l+r;case '-':return l-r;case '*':return l*r;case '/':return l/r;case '%':return l%r;case '^':return l^r;case '&':return l&r;case '|':return l|r;case '<<':return l<<r;case '>>':return l>>r;case '>>>':return l>>>r;case '<':return l<r;case '<=':return l<=r;case '>':return l>r;case '>=':return l>=r;case '===':return l===r;case '!==':return l!==r;case '==':return l==r;case '!=':return l!=r;default:throw Error('Unsupported string-table operator');}}
 function expr(n,e){tick();switch(n.type){
  case 'Literal':if(n.value!==null&&!['string','number','boolean'].includes(typeof n.value))throw Error('Unsupported data literal');return n.value;
  case 'Identifier':return get(n,e);
  case 'ArrayExpression':{const out=own([]);for(const item of n.elements){if(item?.type==='SpreadElement'){const value=expr(item.argument,e);if(!Array.isArray(value))throw Error('Invalid data spread');out.push(...value);}else out.push(item?expr(item,e):undefined);check(out);}return out;}
  case 'ObjectExpression':{const out=own(Object.create(null));for(const p of n.properties){if(p.type!=='Property'||p.kind!=='init')throw Error('Unsupported data object');const k=String(p.computed?expr(p.key,e):p.key.name??p.key.value);if(forbidden.has(k))throw Error('Forbidden string-table property');out[k]=expr(p.value,e);}return out;}
  case 'FunctionExpression':case 'ArrowFunctionExpression':{const value={node:n,closure:e};functions.add(value);return value;}
  case 'MemberExpression':return property(expr(n.object,e),n.computed?expr(n.property,e):n.property.name);
  case 'BinaryExpression':return check(binary(n.operator,expr(n.left,e),expr(n.right,e)));
  case 'LogicalExpression':{const l=expr(n.left,e);return n.operator==='&&'?l&&expr(n.right,e):n.operator==='||'?l||expr(n.right,e):l??expr(n.right,e);}
  case 'UnaryExpression':{const v=expr(n.argument,e);switch(n.operator){case '!':return !v;case '-':return -v;case '+':return +v;case '~':return ~v;case 'void':return undefined;case 'typeof':return typeof v;}break;}
  case 'ConditionalExpression':return expr(expr(n.test,e)?n.consequent:n.alternate,e);
  case 'SequenceExpression':{let v;for(const x of n.expressions)v=expr(x,e);return v;}
  case 'AssignmentExpression':{const value=expr(n.right,e);if(n.operator==='=')return assign(n.left,value,e);const ref=reference(n.left,e);return ref.set(check(binary(n.operator.slice(0,-1),ref.get(),value)));}
  case 'UpdateExpression':{const ref=reference(n.argument,e),old=ref.get(),next=old+(n.operator==='++'?1:-1);ref.set(next);return n.prefix?next:old;}
  case 'NewExpression':
   if(n.callee.type!=='Identifier'||n.callee.name!=='Array'||binding(n.callee))throw Error('Unsupported string-table constructor');
   // Only the bounded, locally implemented Array allocator above is allowed.
  case 'CallExpression':{const fn=expr(n.callee,e),args=n.arguments.map(n=>expr(n,e));
   if(typeof fn==='function'&&safe.has(fn))return check(fn(...args));
   if(!fn||!functions.has(fn)||++depth>40)throw Error('Unsupported string-table call');
   const local=environment(fn.closure);fn.node.params.forEach((p,i)=>{if(p.type!=='Identifier')throw Error('Unsupported data parameter');local.values.set(key(p),args[i]);});
   const flow=fn.node.body.type==='BlockStatement'?stmt(fn.node.body,local):{value:expr(fn.node.body,local)};depth--;return flow?.value;
  }
 }throw Error('Unsupported string-table expression '+n.type);}
 function stmt(n,e){tick();switch(n.type){
  case 'BlockStatement':{const local=environment(e);for(const item of n.body){const flow=stmt(item,local);if(flow)return flow;}return;}
  case 'VariableDeclaration':for(const d of n.declarations){if(d.id.type!=='Identifier')throw Error('Unsupported data declaration');e.values.set(key(d.id),d.init?expr(d.init,e):undefined);}return;
  case 'ExpressionStatement':expr(n.expression,e);return;
  case 'EmptyStatement':return;
  case 'IfStatement':return expr(n.test,e)?stmt(n.consequent,e):n.alternate?stmt(n.alternate,e):undefined;
  case 'ForStatement':{const local=environment(e);if(n.init)n.init.type==='VariableDeclaration'?stmt(n.init,local):expr(n.init,local);while(!n.test||expr(n.test,local)){const f=stmt(n.body,local);if(f?.break)return;if(f)return f;if(n.update)expr(n.update,local);}return;}
  case 'WhileStatement':while(expr(n.test,e)){const f=stmt(n.body,e);if(f?.break)return;if(f)return f;}return;
  case 'DoWhileStatement':do{const f=stmt(n.body,e);if(f?.break)return;if(f)return f;}while(expr(n.test,e));return;
  case 'SwitchStatement':{const value=expr(n.discriminant,e);let active=false;for(const branch of n.cases){if(!active&&(branch.test===null||expr(branch.test,e)===value))active=true;if(active)for(const item of branch.consequent){const f=stmt(item,e);if(f?.break)return;if(f)return f;}}return;}
  case 'BreakStatement':return {break:true};
  case 'ReturnStatement':return {value:n.argument?expr(n.argument,e):undefined};
 }throw Error('Unsupported string-table statement '+n.type);}
 stmt(loop,root);const decoded=globals.get(target);
 if(decoded.length<101||decoded.length>10000||decoded.some(v=>typeof v!=='string')||decoded.reduce((n,s)=>n+s.length,0)>limit)throw Error('Invalid decoded string table');
 return new Map([[target,decoded]]);
}
module.exports={decodeDataTable};
