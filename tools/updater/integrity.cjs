// Reviewed native signature compatibility. Unknown contracts stop publication.
const {canonical,isFunction}=require('./static.cjs');
const owners=new Set(['а１๐','ⲅࡃ०','ܐ̄︁']);
function integrityOperations(reference,candidate,pairs){
 const predicates=reference.nodes.filter(n=>n.type==='BinaryExpression'&&n.operator==='==='&&n.left.name==='ѕ०̊'&&reference.constant(n.right)===1);
 if(predicates.length!==3)throw Error('Expected three reviewed integrity signature predicates');
 const operations=[],signers=[],seen=new Set(),bindings=new Set(),reads=new Set();let flag;
 for(const predicate of predicates){
  let owner=reference.parent.get(predicate);
  while(owner&&!(isFunction(owner)&&owners.has(owner.id?.name)))owner=reference.parent.get(owner);
  if(!owner||seen.has(owner.id.name))throw Error('Integrity predicate owner changed');
  seen.add(owner.id.name);
  const next=pairs.get(owner);
  if(!next)throw Error('Native integrity signature contract changed: '+owner.id.name);
  const left=canonical(reference,owner),right=canonical(candidate,next);
  if(left.hash!==right.hash)throw Error('Native integrity signature contract changed: '+owner.id.name);
  const path=[...left.entries].find(([,node])=>node===predicate)?.[0];
  const target=right.entries.get(path);
  if(target?.type!=='BinaryExpression'||target.operator!=='==='||target.left.type!=='Identifier'||candidate.constant(target.right)!==1)throw Error('Integrity predicate mapping is ambiguous');
  const binding=candidate.binding(target.left);
  if(!binding||binding.kind!=='var')throw Error('Integrity flag binding changed');
  bindings.add(binding);reads.add(target.left);flag=target.left.name;
  const before=candidate.source.slice(next.start,next.end);
  const after=before.slice(0,target.start-next.start)+'false'+before.slice(target.end-next.start);
  operations.push({id:'native-integrity-signature-'+operations.length,expected:1,before,after});
  signers.push(next.id.name);
 }
 if(bindings.size!==1)throw Error('Integrity predicates do not share the native flag');
 const binding=[...bindings][0];
 for(const node of candidate.nodes){
  if(node.type!=='Identifier'||candidate.binding(node)!==binding)continue;
  const parent=candidate.parent.get(node);
  if(parent?.type==='VariableDeclarator'&&parent.id===node||parent?.type==='AssignmentExpression'&&parent.left===node)continue;
  if(!reads.has(node))throw Error('Unreviewed native integrity flag read');
 }
 return {operations,flag,signers};
}
module.exports={integrityOperations};
