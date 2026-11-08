// Recognize the native shared self-check flag independently of opaque cipher
// implementations. Retain every candidate formula; replace only its 3 reads.
const {isFunction}=require('./static.cjs');
function surfaces(a){
 const groups=new Map(),root=a.tree.body[0]?.expression?.callee;
 for(const n of a.nodes){
  if(n.type!=='BinaryExpression'||n.operator!=='===')continue;
  const id=n.left.type==='Identifier'&&a.constant(n.right)===1?n.left:n.right.type==='Identifier'&&a.constant(n.left)===1?n.right:null,b=id&&a.binding(id);
  if(b?.kind!=='var'||a.constant(b.init)!==0)continue;
  // Named immediately invoked cipher helpers are not the protocol entrypoint.
  // Keep the containing native function declaration as the signature owner.
  let owner=a.parent.get(n);while(owner&&owner.type!=='FunctionDeclaration')owner=a.parent.get(owner);
  if(!owner||owner.end-owner.start<8000)continue;
  if(!groups.has(b))groups.set(b,[]);groups.get(b).push({predicate:n,id,owner});
 }
 const markers=new Set();
 for(const n of a.nodes)if(n.type==='Literal'&&n.value==='[native code]'){
  for(let p=a.parent.get(n);p&&p!==root;p=a.parent.get(p))if(isFunction(p))markers.add(p);
 }
 const refs=new Map();for(const n of a.nodes)if(n.type==='Identifier'){const b=a.binding(n);if(groups.has(b)){if(!refs.has(b))refs.set(b,[]);refs.get(b).push(n);}}
 const result=[];
 for(const [b,reads]of groups){
  if(reads.length!==3||new Set(reads.map(r=>r.owner)).size!==3)continue;
  const allowed=new Set(reads.map(r=>r.id)),writers=[];let valid=true;
  for(const n of refs.get(b)||[]){const p=a.parent.get(n);
   if(p.type==='VariableDeclarator'&&p.id===n)continue;
   if(p.type==='AssignmentExpression'&&p.left===n&&p.operator==='='){
    const v=a.constant(p.right);if(v!==undefined&&v!==1){valid=false;break;}writers.push(p);continue;
   }
   if(!allowed.has(n)){valid=false;break;}
  }
  const intrinsic=writers.some(w=>{for(let p=a.parent.get(w);p&&p!==root;p=a.parent.get(p))if(markers.has(p))return true;return false;});
  if(valid&&writers.length>=3&&intrinsic)result.push({flag:b.node.name,reads});
 }
 return result;
}
function surfaceOperations(reference,candidate,reviewed){
 const left=surfaces(reference).filter(g=>g.flag===reviewed.flag&&g.reads.every(r=>reviewed.signers.includes(r.owner.id.name)));
 if(left.length!==1)throw Error('Native integrity signature contract changed');
 const arity=g=>g.reads.map(r=>r.owner.params.length).sort().join(',');
 const right=surfaces(candidate).filter(g=>arity(g)===arity(left[0]));
 if(right.length!==1)throw Error('Native integrity signature contract changed or ambiguous');
 const selected=right[0];
 return {flag:selected.flag,signers:selected.reads.map(r=>r.owner.id.name),operations:selected.reads.map(({predicate,owner},i)=>{
  const before=candidate.source.slice(owner.start,owner.end),start=predicate.start-owner.start,end=predicate.end-owner.start;
  return {id:'native-integrity-signature-'+i,expected:1,before,after:before.slice(0,start)+'false'+before.slice(end)};
 })};
}
module.exports={surfaceOperations};
