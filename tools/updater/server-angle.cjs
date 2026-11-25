// The Nov 25 native interpolator selects the player branch by entity type
// instead of testing its ID against zero. Preserve that native predicate;
// prove the entire remaining function before mapping the self-angle hook.
const {semanticCanonical:canonical}=require('./semantic.cjs');
function serverAngle(old,cur,fn){
 const oc=canonical(old,fn),path='/body/body/10/expression/alternate/test';
 const previous=oc.entries.get(path);
 if(previous?.type!=='BinaryExpression'||previous.operator!=='==='||old.constant(previous.right)!==0||previous.left.type!=='MemberExpression')throw Error('Unsupported reference player-angle branch');
 const matches=[];
 for(const next of cur.functions){
  if(next.type!==fn.type||next.params.length!==1||next.body?.body?.length!==fn.body.body.length)continue;
  const nc=canonical(cur,next),test=nc.entries.get(path);
  if(test?.type!=='BinaryExpression'||test.operator!=='===')continue;
  const member=[test.left,test.right].find(n=>n.type==='MemberExpression'&&(n.computed?cur.constant(n.property):n.property.name)==='type');
  const category=member===test.left?test.right:test.left;
  if(!member||member.object.type!=='Identifier'||cur.binding(member.object)!==cur.binding(next.params[0])||category?.type!=='Identifier')continue;
  const init=cur.binding(category)?.init;
  if(init?.type!=='UpdateExpression'||init.operator!=='++'||init.prefix)continue;
  // Compare using the old predicate solely in the analysis view. The emitted
  // client retains the current native source, including the new type branch.
  const field=n=>n.computed?old.constant(n.property):n.property.name;
  const earlier=[...oc.entries].find(([p,n])=>!p.startsWith(path)&&n.type==='MemberExpression'&&n.object.name===fn.params[0].name&&field(n)===field(previous.left));
  const currentId=earlier&&nc.entries.get(earlier[0]);
  if(currentId?.type!=='MemberExpression')continue;
  const replacement={...previous,left:currentId,right:{type:'Literal',value:0}};
  function project(n){if(n===test)return replacement;let changed=false;const copy={...n};for(const[k,v]of Object.entries(n)){if(v?.type){copy[k]=project(v);changed ||=copy[k]!==v;}else if(Array.isArray(v)){copy[k]=v.map(x=>x?.type?project(x):x);changed ||=copy[k].some((x,i)=>x!==v[i]);}}return changed?copy:n;}
  const projected=canonical(cur,project(next));
  if(projected.hash!==oc.hash)continue;
  // The rewritten test is outside the patched assignment. Keep the original
  // node projection everywhere else so no synthetic node reaches the output.
  for(const[p,n]of nc.entries)if(!p.startsWith(path))projected.entries.set(p,n);
  matches.push({current:next,nc:projected});
 }
 if(matches.length!==1)throw Error('Native player-angle branch changed or ambiguous');
 return matches[0];
}
module.exports={serverAngle};
