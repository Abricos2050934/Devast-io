// Distinguish the otherwise identical native 150 ms / 60 ms direction handlers.
// Only accept a literal delay whose binding has one declaration and one read;
// a configurable, aliased or reassigned timer requires a separate review.
function directionDelay(analysis,fn){
 const first=fn?.body?.body?.[0],test=first?.test;
 if(first?.type!=='IfStatement'||test?.type!=='BinaryExpression'||test.operator!=='>'||test.right.type!=='Identifier')return null;
 const delay=analysis.binding(test.right);
 if(!delay||!['var','let','const'].includes(delay.kind)||delay.init?.type!=='Literal'||!Number.isFinite(delay.init.value))return null;
 const references=analysis.nodes.filter(n=>n.type==='Identifier'&&analysis.binding(n)===delay);
 if(references.length!==2||!references.includes(delay.node)||!references.includes(test.right))return null;
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
module.exports={directionDelay,exportNames,elapsedTimer};
