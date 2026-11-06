// Normalize representation changes without modifying either native AST/source.
const {canonical}=require('./static.cjs');
function readonlyConstants(a){
 const declarations=new Map(),writes=new Set(),references=new Map();
 for(const n of a.nodes){
  if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'){const b=a.binding(n.id);declarations.set(b,(declarations.get(b)||0)+1);}
  if(n.type==='AssignmentExpression'&&n.left.type==='Identifier')writes.add(a.binding(n.left));
  if(n.type==='UpdateExpression'&&n.argument.type==='Identifier')writes.add(a.binding(n.argument));
  if(n.type==='Identifier'){const b=a.binding(n);if(b){if(!references.has(b))references.set(b,[]);references.get(b).push(n);}}
 }
 const constant=a.constant,memo=new Map(),active=new Set();
 function value(n){
  const known=constant(n);if(known!==undefined)return known;
  if(n?.type==='Identifier'){
   const b=a.binding(n);if(!b?.init||active.has(b))return;
   const readonly=['var','let'].includes(b.kind)&&declarations.get(b)===1&&!writes.has(b)&&references.get(b).every(r=>r===b.node||r.start>b.init.end);
   if(b.kind!=='const'&&!readonly)return;
   if(memo.has(b))return memo.get(b);active.add(b);const result=value(b.init);active.delete(b);memo.set(b,result);return result;
  }
  if(n?.type==='UnaryExpression'){const v=value(n.argument);if(v===undefined)return;switch(n.operator){case '-':return -v;case '+':return +v;case '!':return !v;case '~':return ~v;}}
  if(n?.type==='BinaryExpression'){
   const l=value(n.left),r=value(n.right);if(l===undefined||r===undefined)return;
   switch(n.operator){case '+':return l+r;case '-':return l-r;case '*':return l*r;case '/':return l/r;case '%':return l%r;case '|':return l|r;case '&':return l&r;case '^':return l^r;case '<<':return l<<r;case '>>':return l>>r;case '>>>':return l>>>r;}
  }
 }
 function isUndefined(n){const seen=new Set();while(n?.type==='Identifier'&&!seen.has(n)){seen.add(n);if(n.name==='undefined'&&!a.binding(n))return true;const b=a.binding(n);if(b?.kind!=='const')break;n=b.init;}return false;}
 return {...a,constant:value,isUndefined};
}
const views=new WeakMap();
function semanticCanonical(a,node){
 let view=views.get(a);
 if(!view){
  const clones=new WeakMap(),originals=new WeakMap(),ranks=new WeakMap();
  function expression(n){
   if(n?.type==='ExpressionStatement')return clone(n.expression);
   if(n?.type==='IfStatement'){const result=clone(n);return result.type==='ExpressionStatement'?result.expression:null;}
   if(n?.type==='BlockStatement'&&n.body.length){const values=n.body.map(expression);if(values.every(Boolean))return values.length===1?values[0]:{type:'SequenceExpression',expressions:values};}
   return null;
  }
  function ranksFor(fn){
   if(ranks.has(fn))return ranks.get(fn);
   const names=new Map(),add=n=>{if(n?.type==='Identifier'&&!names.has(n.name))names.set(n.name,names.size);};
   for(const p of fn.params||[])add(p);
   function walk(n){
    if(n!==fn&&/Function/.test(n.type))return;
    if(n.type==='VariableDeclarator')add(n.id);
    if(n.type==='BinaryExpression'&&['>','>=','<','<=','===','!==','==','!=','*'].includes(n.operator))return;
    if(n.type==='Identifier')add(n);
    for(const value of Object.values(n))if(Array.isArray(value))value.forEach(v=>{if(v?.type)walk(v);});else if(value?.type)walk(value);
   }
   walk(fn);ranks.set(fn,names);return names;
  }
  function rank(n,names){
   if(a.isUndefined(n))return '9:undefined';
   const v=a.constant(n);if(v!==undefined)return '9:'+JSON.stringify(v);
   if(n.type==='Identifier'){
    const b=a.binding(n);let owner=b?.node,current=n,depth=0;
    if(owner?.type&&/Function/.test(owner.type))owner=a.parent.get(owner);
    while(owner&&!/Function/.test(owner.type))owner=a.parent.get(owner);
    while(current&&!/Function/.test(current.type))current=a.parent.get(current);
    while(current&&current!==owner){current=a.parent.get(current);while(current&&!/Function/.test(current.type))current=a.parent.get(current);depth++;}
    const scope=current?ranksFor(current):names;
    return '0:'+String(depth).padStart(3,'0')+':'+String(scope.get(n.name)??99999).padStart(6,'0');
   }
   if(n.type==='MemberExpression'){const p=n.computed?a.constant(n.property):n.property.name;return '1:'+rank(n.object,names)+':'+(typeof p==='string'?(/[^\x00-\x7f]/.test(p)?'?':p):rank(n.property,names));}
   if(n.type==='CallExpression')return '2:'+rank(n.callee,names)+':'+n.arguments.map(n=>rank(n,names)).join(',');
   if(n.type==='BinaryExpression')return '3:'+n.operator+':'+rank(n.left,names)+':'+rank(n.right,names);
   return '4:'+n.type;
  }
  function clone(n){
   if(clones.has(n))return clones.get(n);
   const out={...n};clones.set(n,out);originals.set(out,n);
   for(const [key,value]of Object.entries(n))if(value?.type)out[key]=clone(value);else if(Array.isArray(value))out[key]=value.map(v=>v?.type?clone(v):v);
   if(n.type==='Identifier'){
    const parent=a.parent.get(n),property=parent?.type==='MemberExpression'&&!parent.computed&&parent.property===n||parent?.type==='Property'&&!parent.computed&&parent.key===n;
    const seen=new Set();let value=n;
    while(value?.type==='Identifier'&&!seen.has(value)){seen.add(value);if(value.name==='undefined'&&!a.binding(value)){if(!property&&a.binding(n)?.node!==n)out.name='undefined';break;}const b=a.binding(value);if(b?.kind!=='const')break;value=b.init;}
   }
   if(n.type==='ForStatement'&&n.init?.type==='VariableDeclaration'&&n.init.declarations.every(d=>d.id.type==='Identifier'&&a.constant(d.init)!==undefined)){
    const updates=n.update?.type==='SequenceExpression'?n.update.expressions:[n.update],order=updates.map(u=>u?.type==='UpdateExpression'?u.argument:u?.type==='AssignmentExpression'?u.left:null).filter(n=>n?.type==='Identifier').map(n=>n.name);
    if(order.length===n.init.declarations.length&&new Set(order).size===order.length&&n.init.declarations.every(d=>order.includes(d.id.name)))out.init.declarations.sort((x,y)=>order.indexOf(x.id.name)-order.indexOf(y.id.name));
   }
   if(n.type==='IfStatement'){
    const yes=expression(n.consequent),no=n.alternate?expression(n.alternate):null;
    if(yes&&(!n.alternate||no)){
     const expr=n.alternate?{type:'ConditionalExpression',test:clone(n.test),consequent:yes,alternate:no}:{type:'LogicalExpression',left:clone(n.test),operator:'&&',right:yes};
     delete out.test;delete out.consequent;delete out.alternate;out.type='ExpressionStatement';out.expression=expr;
    }
   }
   if(n.type==='BinaryExpression'){
    const shift=a.constant(n.right);
    if(n.operator==='<<'&&n.left.type==='MemberExpression'&&Number.isInteger(shift)&&shift>=0&&shift<=8){out.operator='*';out.right={type:'Literal',value:2**shift};}
    if(['>','>='].includes(n.operator)){[out.left,out.right]=[out.right,out.left];out.operator=n.operator==='>'?'<':'<=';}
    if(['===','!==','==','!=','*'].includes(n.operator)){
     let fn=n;while(fn&&!/Function/.test(fn.type))fn=a.parent.get(fn);
     const names=ranksFor(fn||a.tree);
     if(rank(n.left,names)>rank(n.right,names))[out.left,out.right]=[out.right,out.left];
    }
   }
   return out;
  }
  view={clone,originals,analysis:{...a,constant:n=>a.constant(originals.get(n)||n)}};views.set(a,view);
 }
 const result=canonical(view.analysis,view.clone(node));
 result.entries=new Map([...result.entries].map(([path,n])=>[path,view.originals.get(n)||n]));return result;
}
module.exports={readonlyConstants,semanticCanonical};
