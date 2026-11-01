// Static analysis only. Downloaded game startup code is never executed in Node.
const acorn=require('../parser.cjs'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const children=n=>Object.entries(n).filter(([k])=>!['start','end','raw'].includes(k)).flatMap(([k,v])=>Array.isArray(v)?v.filter(x=>x?.type).map((x,i)=>[k,i,x]):v?.type?[[k,null,v]]:[]);
const isFunction=n=>/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
const obfuscated=name=>/[^\x00-\x7f]/.test(name)||/^_0x[\da-f]+$/i.test(name);
const globals=new Set('window document console Math Number String Array Object JSON RegExp Date Boolean NaN Infinity undefined parseInt parseFloat decodeURIComponent encodeURIComponent escape unescape atob btoa Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array Float32Array Float64Array ArrayBuffer DataView WebSocket Image Audio XMLHttpRequest Promise Map Set WeakMap WeakSet Error TypeError RangeError isNaN isFinite eval setTimeout setInterval clearTimeout clearInterval performance navigator localStorage location requestAnimationFrame'.split(' '));
function analyze(source){
 const tree=acorn.parse(source,{ecmaVersion:'latest'}),nodes=[],parent=new WeakMap(),scopeOf=new WeakMap();
 const root={parent:null,bindings:new Map(),function:true};
 function visit(n,scope,p){
  if(!n?.type)return;if(p)parent.set(n,p);nodes.push(n);
  if(n.type==='FunctionDeclaration'&&n.id)scope.bindings.set(n.id.name,{kind:'function',node:n});
  let current=scope;
  if(isFunction(n)||n.type==='BlockStatement'||n.type==='CatchClause'||n.type==='ForStatement'||n.type==='ForOfStatement'||n.type==='ForInStatement')current={parent:scope,bindings:new Map(),function:isFunction(n)};
  scopeOf.set(n,current);
  function bind(pattern,kind,init){if(!pattern)return;if(pattern.type==='Identifier'){
   let target=current;if(kind==='var')while(target.parent&&!target.function)target=target.parent;
   target.bindings.set(pattern.name,{kind,init,scope:current,node:pattern});
  }else for(const [,,x]of children(pattern))bind(x,kind,null);}
  if(isFunction(n)){if(n.id)bind(n.id,'function',null);for(const p of n.params)bind(p,'param',null);}
  if(n.type==='CatchClause')bind(n.param,'param',null);
  if(n.type==='VariableDeclaration')for(const d of n.declarations)bind(d.id,n.kind,d.init);
  for(const [,,x]of children(n))visit(x,current,n);
 }
 visit(tree,root,null);
 const tables=require('./string-table.cjs').decodeStringTable(tree,nodes);
 const binding=n=>{for(let s=scopeOf.get(n);s;s=s.parent)if(s.bindings.has(n.name))return s.bindings.get(n.name);};
 const memo=new Map(),pending=new Set();
 function constant(n){
  if(!n)return undefined;
  if(n.type==='Literal'&&['string','number','boolean'].includes(typeof n.value))return n.value;
  if(n.type==='Literal'&&n.value===null)return null;
  if(n.type==='MemberExpression'&&n.computed){const object=n.object.type==='Identifier'?tables.get(n.object.name):null;const key=constant(n.property);return object&&Number.isInteger(key)?object[key]:undefined;}
  if(n.type==='Identifier'){
   const b=binding(n);if(!b||b.kind!=='const'||!b.init)return undefined;
   if(memo.has(b))return memo.get(b);if(pending.has(b))return undefined;pending.add(b);const v=constant(b.init);pending.delete(b);memo.set(b,v);return v;
  }
  if(n.type==='UnaryExpression'){const v=constant(n.argument);if(v===undefined)return undefined;switch(n.operator){case '-':return -v;case '+':return +v;case '!':return !v;case '~':return ~v;}}
  if(n.type==='BinaryExpression'){
   const l=constant(n.left),r=constant(n.right);if(l===undefined||r===undefined)return undefined;
   switch(n.operator){case '+':return l+r;case '-':return l-r;case '*':return l*r;case '/':return l/r;case '%':return l%r;case '^':return l^r;case '|':return l|r;case '&':return l&r;case '<<':return l<<r;case '>>':return l>>r;case '>>>':return l>>>r;}
  }
 }
 return {source,tree,nodes,parent,scopeOf,binding,constant,functions:nodes.filter(isFunction)};
}
function canonical(analysis,node){
 const ids=new Map(),entries=new Map();let counter=0;
 const rename=(name,property=false)=>property&&!obfuscated(name)||!property&&globals.has(name)?name:(ids.has(name)?ids.get(name):(ids.set(name,'@'+counter++),ids.get(name)));
 function walk(n,path='',mode='value'){
  entries.set(path,n);
  if(n.type==='Identifier'){
   const value=mode==='value'?analysis.constant(n):undefined;
   if(value!==undefined)return ['Literal',value];return ['Identifier',rename(n.name,mode==='property')];
  }
  if(n.type==='Literal')return ['Literal',typeof n.value==='string'&&obfuscated(n.value)&&mode==='property'?rename(n.value,true):n.regex?['regexp',n.regex.pattern,n.regex.flags]:n.value];
  if(n.type==='MemberExpression'){
   const value=n.computed?analysis.constant(n.property):n.property.name;
   // Fold aliases for property names, including ['x'] versus .x.
   const prop=typeof value==='string'?['Identifier',rename(value,true)]:walk(n.property,path+'/property',n.computed?'value':'property');
   return ['MemberExpression',walk(n.object,path+'/object'),prop,!!n.optional];
  }
  if(n.type==='Property'){
   const value=n.computed?analysis.constant(n.key):n.key.type==='Identifier'?n.key.name:n.key.value;
   const key=typeof value==='string'?['Identifier',rename(value,true)]:walk(n.key,path+'/key','property');
   return ['Property',n.kind,!!n.method,key,walk(n.value,path+'/value')];
  }
  const out=[n.type];
  for(const [key,value] of Object.entries(n)){
   if(['type','start','end','raw','directive','shorthand'].includes(key))continue;
   if(value?.type)out.push([key,walk(value,path+'/'+key,['id','params'].includes(key)?'binding':'value')]);
   else if(Array.isArray(value))out.push([key,value.map((v,i)=>v?.type?walk(v,path+'/'+key+'/'+i,key==='params'?'binding':'value'):v)]);
   else out.push([key,value]);
  }
  return out;
 }
 const representation=walk(node);return {hash:hash(JSON.stringify(representation)),representation,entries};
}
module.exports={analyze,canonical,children,isFunction,hash,obfuscated,globals};
