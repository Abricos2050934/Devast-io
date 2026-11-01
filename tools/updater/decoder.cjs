// Bounded interpreter for the native string-decoder blocks. It captures eval's
// string argument; it cannot execute that string or access network/files/process.
const {analyze,children}=require('./static.cjs');
const denied=new Set(['__proto__','prototype','constructor','caller','callee','arguments']);
class Env{
 constructor(parent){this.parent=parent;this.values=new Map();}
 get(k){if(this.values.has(k))return this.values.get(k);if(this.parent)return this.parent.get(k);throw Error('Unsupported decoder reference: '+k);}
 set(k,v){if(this.values.has(k)||!this.parent)this.values.set(k,v);else this.parent.set(k,v);return v;}
}
function interpret(block,analysis){
 let steps=0,depth=0,captured=[];const limit=40000000,env=new Env(),safe=new WeakSet();
 const allow=fn=>(safe.add(fn),fn);
 const string=Object.assign(Object.create(null),{fromCharCode:allow((...v)=>String.fromCharCode(...v))});
 const win=Object.assign(Object.create(null),{String:string,parseInt:allow((v,b)=>parseInt(v,b)),atob:allow(v=>Buffer.from(v,'base64').toString('latin1')),btoa:allow(v=>Buffer.from(v,'latin1').toString('base64')),escape:allow(escape),unescape:allow(unescape),decodeURIComponent:allow(decodeURIComponent),encodeURIComponent:allow(encodeURIComponent)});
 const tick=()=>{if(++steps>limit)throw Error('Decoder instruction limit');};
 const check=v=>{if(typeof v==='string'&&v.length>16*1024*1024||Array.isArray(v)&&v.length>16*1024*1024)throw Error('Decoder size limit');return v;};
 const prop=(obj,key)=>{
  key=String(key);if(denied.has(key))throw Error('Forbidden decoder property');
  if(Array.isArray(obj)&&['push','pop','reverse','join','slice'].includes(key)||typeof obj==='string'&&['charAt','charCodeAt','substr','substring','slice','split'].includes(key))return allow((...args)=>check(obj[key](...args)));
  if(obj==null)throw Error('Invalid decoder member');if(key==='length'&&(typeof obj==='string'||Array.isArray(obj)))return obj.length;
  return Object.hasOwn(obj,key)?obj[key]:undefined;
 };
 function ref(n,e){if(n.type==='Identifier')return {get:()=>get(n,e),set:v=>e.set(n.name,check(v))};
  if(n.type!=='MemberExpression')throw Error('Unsupported decoder assignment');const obj=expr(n.object,e),key=n.computed?expr(n.property,e):n.property.name;
  if(denied.has(String(key))||obj===win||obj===string)throw Error('Forbidden decoder write');
  return {get:()=>prop(obj,key),set:v=>{if(Array.isArray(obj)&&(!/^\d+$/.test(String(key))||Number(key)>16*1024*1024))throw Error('Invalid decoder index');obj[key]=check(v);return v;}};
 }
 const resolved=new WeakMap();
 function get(n,e){
  for(let scope=e;scope;scope=scope.parent)if(scope.values.has(n.name))return scope.values.get(n.name);
  if(resolved.has(n))return resolved.get(n);
  let v=analysis.constant(n);
  if(v===undefined){const b=analysis.binding(n);
   if(b?.kind==='const'&&b.init?.type==='Identifier'&&b.init.name==='window')v=win;
   else if(n.name==='undefined')v=undefined;
   else if(n.name==='window')v=win;
   else if(Object.hasOwn(win,n.name))v=win[n.name];
   else if(n.name==='eval')v=allow(v=>{if(typeof v!=='string')throw Error('Non-string decoded program');captured.push(check(v));});
   else throw Error('Unsupported decoder reference: '+n.name);
  }
  resolved.set(n,v);return v;
 }
 function binary(op,l,r){switch(op){case '+':return l+r;case '-':return l-r;case '*':return l*r;case '/':return l/r;case '%':return l%r;case '^':return l^r;case '&':return l&r;case '|':return l|r;case '<<':return l<<r;case '>>':return l>>r;case '>>>':return l>>>r;case '<':return l<r;case '<=':return l<=r;case '>':return l>r;case '>=':return l>=r;case '===':return l===r;case '!==':return l!==r;case '==':return l==r;case '!=':return l!=r;default:throw Error('Unsupported decoder operator '+op);}}
 function expr(n,e){tick();switch(n.type){
  case 'Literal':return n.value;
  case 'Identifier':return get(n,e);
  case 'ArrayExpression':return n.elements.map(x=>expr(x,e));
  case 'ObjectExpression':{const v=Object.create(null);for(const p of n.properties){if(p.type!=='Property'||p.kind!=='init')throw Error('Unsupported decoder object');const k=p.computed?expr(p.key,e):p.key.name??p.key.value;if(denied.has(String(k)))throw Error('Forbidden decoder key');v[k]=expr(p.value,e);}return v;}
  case 'FunctionExpression':case 'ArrowFunctionExpression':return {decoderFunction:true,node:n,env:e};
  case 'MemberExpression':return prop(expr(n.object,e),n.computed?expr(n.property,e):n.property.name);
  case 'BinaryExpression':return check(binary(n.operator,expr(n.left,e),expr(n.right,e)));
  case 'LogicalExpression':{const l=expr(n.left,e);return n.operator==='&&'?(l&&expr(n.right,e)):n.operator==='||'?(l||expr(n.right,e)):l??expr(n.right,e);}
  case 'UnaryExpression':{const v=expr(n.argument,e);switch(n.operator){case '!':return !v;case '-':return -v;case '+':return +v;case '~':return ~v;case 'void':return undefined;case 'typeof':return typeof v;}break;}
  case 'ConditionalExpression':return expr(expr(n.test,e)?n.consequent:n.alternate,e);
  case 'SequenceExpression':{let v;for(const x of n.expressions)v=expr(x,e);return v;}
  case 'AssignmentExpression':{const r=ref(n.left,e),v=expr(n.right,e);return r.set(n.operator==='='?v:binary(n.operator.slice(0,-1),r.get(),v));}
  case 'UpdateExpression':{const r=ref(n.argument,e),v=r.get();r.set(v+(n.operator==='++'?1:-1));return n.prefix?r.get():v;}
  case 'CallExpression':{
   const fn=expr(n.callee,e),args=n.arguments.map(x=>expr(x,e));if(typeof fn==='function'&&safe.has(fn))return check(fn(...args));
   if(!fn?.decoderFunction||++depth>40)throw Error('Unsupported decoder call');const scope=new Env(fn.env);fn.node.params.forEach((p,i)=>{if(p.type!=='Identifier')throw Error('Unsupported decoder parameter');scope.values.set(p.name,args[i]);});
   const out=fn.node.body.type==='BlockStatement'?stmt(fn.node.body,scope):{returnValue:expr(fn.node.body,scope)};depth--;return out?.returnValue;
  }
 }throw Error('Unsupported decoder expression '+n.type);}
 function stmt(n,e){tick();switch(n.type){
  case 'BlockStatement':{const scope=new Env(e);for(const x of n.body){const flow=stmt(x,scope);if(flow)return flow;}return;}
  case 'VariableDeclaration':for(const d of n.declarations){if(d.id.type!=='Identifier')throw Error('Unsupported decoder declaration');e.values.set(d.id.name,d.init?expr(d.init,e):undefined);}return;
  case 'ExpressionStatement':expr(n.expression,e);return;
  case 'EmptyStatement':return;
  case 'IfStatement':return expr(n.test,e)?stmt(n.consequent,e):n.alternate?stmt(n.alternate,e):undefined;
  case 'WhileStatement':while(expr(n.test,e)){const f=stmt(n.body,e);if(f?.break)return;if(f?.returned)return f;}return;
  case 'ForStatement':{const scope=new Env(e);if(n.init)n.init.type==='VariableDeclaration'?stmt(n.init,scope):expr(n.init,scope);while(!n.test||expr(n.test,scope)){const f=stmt(n.body,scope);if(f?.break)return;if(f?.returned)return f;if(n.update)expr(n.update,scope);}return;}
  case 'SwitchStatement':{const discriminant=expr(n.discriminant,e);let active=false;for(const branch of n.cases){if(!active&&(branch.test===null||expr(branch.test,e)===discriminant))active=true;if(active)for(const x of branch.consequent){const f=stmt(x,e);if(f?.break)return;if(f)return f;}}return;}
  case 'DoWhileStatement':do{const f=stmt(n.body,e);if(f?.break)return;if(f?.returned)return f;}while(expr(n.test,e));return;
  case 'BreakStatement':return {break:true};
  case 'ReturnStatement':return {returned:true,returnValue:n.argument?expr(n.argument,e):undefined};
  default:throw Error('Unsupported decoder statement '+n.type);
 }}
 stmt(block,env);if(captured.length!==1)throw Error('Expected one captured decoded program');return {source:captured[0],steps};
}
function deobfuscate(source){
 const a=analyze(source),blocks=[];
 for(const n of a.nodes)if(n.type==='BlockStatement'&&n.body.at(-1)?.type==='ExpressionStatement'){
  const end=n.body.at(-1).expression;
  if(end.type==='CallExpression'&&end.callee.name==='eval'&&n.body[0]?.type==='VariableDeclaration'&&n.body[0].kind==='const'&&n.body[0].declarations[0].init?.type==='Literal'&&typeof n.body[0].declarations[0].init.value==='string'&&n.body[0].declarations[0].init.value.length>128)blocks.push(n);
 }
 const edits=[],evidence=[];
 for(const [index,block] of blocks.entries()){process.stderr.write('Decoding native block '+(index+1)+'/'+blocks.length+'\n');let decoded;try{decoded=interpret(block,a);}catch(error){throw Error("Decoder block "+block.start+" ("+(block.end-block.start)+" chars): "+error.message);}require('../parser.cjs').parse(decoded.source,{ecmaVersion:'latest'});edits.push({start:block.start,end:block.end,text:'{\n'+decoded.source+'\n}'});evidence.push({input_start:block.start,input_end:block.end,decoded_sha256:require('./static.cjs').hash(decoded.source),steps:decoded.steps});}
 for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
 analyze(source);return {source,evidence};
}
module.exports={interpret,deobfuscate};
