// Distinguish the otherwise identical native 150 ms / 60 ms direction handlers.
// Only accept a literal delay whose binding has one declaration and one read;
// a configurable, aliased or reassigned timer requires a separate review.
function directionDelay(analysis,fn){
 const first=fn?.body?.body?.[0],test=first?.test;
 const operand=test?.operator==='>'?test.right:test?.operator==='<'?test.left:null;
 if(first?.type!=='IfStatement'||test?.type!=='BinaryExpression'||operand?.type!=='Identifier')return null;
 const delay=analysis.binding(operand);
 if(!delay||!['var','let','const'].includes(delay.kind)||delay.init?.type!=='Literal'||!Number.isFinite(delay.init.value))return null;
 const references=analysis.nodes.filter(n=>n.type==='Identifier'&&analysis.binding(n)===delay);
 if(references.length!==2||!references.includes(delay.node)||!references.includes(operand))return null;
 return delay.init.value;
}
// Native methods may be returned from the namespace constructor or attached
// afterward. Read both forms without relying on the names of their callers.
function elapsedTimer(test,now,activity){
 const elapsed=test?.operator==='>'?test.left:test?.operator==='<'?test.right:null;
 const limit=test?.operator==='>'?test.right:test?.operator==='<'?test.left:null;
 if(test?.type!=='BinaryExpression'||elapsed?.type!=='BinaryExpression'||elapsed.operator!=='-'||elapsed.left.name!==now||elapsed.right.name!==activity||limit?.type!=='Identifier')return null;
 return limit.name;
}
function exportNames(analysis,object,namespace){
 const names=new Set();
 for(const p of object.properties){
  if(p.type!=='Property')continue;
  const name=p.computed?analysis.constant(p.key):p.key.name??p.key.value;
  if(typeof name==='string')names.add(name);
 }
 for(const n of analysis.nodes){
  if(n.type!=='AssignmentExpression'||n.operator!=='='||n.left.type!=='MemberExpression'||n.left.object.name!==namespace)continue;
  const name=n.left.computed?analysis.constant(n.left.property):n.left.property.name;
  if(typeof name==='string')names.add(name);
 }
 return names;
}
// The reconnect adapter consumes this nine-field lobby tuple. Opaque helper
// changes may rotate, but the JSON field/index interface must remain intact.
function serverListSchema(a,fn){
 if(!fn)return false;
 const prop=n=>n.computed?a.constant(n.property):n.property.name;
 const calls=a.nodes.filter(n=>n.start>=fn.start&&n.end<=fn.end&&n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&prop(n.callee)==='push'&&n.arguments.length===1&&n.arguments[0].type==='ArrayExpression'&&n.arguments[0].elements.length===9);
 if(calls.length!==1)return false;
 const values=calls[0].arguments[0].elements,init=n=>n?.type==='Identifier'?a.binding(n)?.init:n;
 const member=(n,k)=>n?.type==='MemberExpression'&&prop(n)===k;
 const lobby=init(values[0]),region=init(values[4]),capacity=init(values[5]),ports=init(values[7]),extra=init(values[8]);
 const same=(x,y)=>x?.type==='Identifier'&&y?.type==='Identifier'&&a.binding(x)&&a.binding(x)===a.binding(y);
 if(a.constant(values[3])!==1||!member(lobby,0)||!member(capacity,3)||!member(extra,4)||!member(region,'n')||!member(ports,'p')||!same(lobby.object,capacity.object)||!same(lobby.object,extra.object)||!same(region.object,ports.object))return false;
 const row=init(lobby.object),list=row?.type==='MemberExpression'&&init(row.object);
 return member(list,'l')&&same(list.object,region.object);
}
module.exports={directionDelay,exportNames,elapsedTimer,serverListSchema};
