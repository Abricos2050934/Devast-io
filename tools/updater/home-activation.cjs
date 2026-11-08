// Bind the native home entry without copying or replacing its implementation.
const {isFunction}=require('./static.cjs'),{semanticCanonical:canonical}=require('./semantic.cjs');
function homeActivation(old,cur,scope,nextScope,object,nextObject,method,pairs){
 const prop=(a,p)=>p.computed?a.constant(p.key):p.key.name??p.key.value;
 function definition(a,scope,p){
  if(isFunction(p.value))return p.value;
  if(p.value.type!=='Identifier')return;
  const defs=a.functions.filter(f=>f.id?.name===p.value.name&&f.start>scope.start&&f.end<scope.end);
  return defs.length===1?defs[0]:undefined;
 }
 if(object?.type!=='ObjectExpression'||nextObject?.type!=='ObjectExpression')throw Error('Native home export interface changed');
 const entries=object.properties.filter(p=>prop(old,p)===method),fn=entries.length===1&&definition(old,scope,entries[0]);
 if(!fn||fn.params.length!==0)throw Error('Reviewed native home entry changed');
 const expected=canonical(old,fn).hash,target=pairs.get(fn),hits=[];
 for(const entry of nextObject.properties){
  const next=definition(cur,nextScope,entry);if(!next||next.params.length!==0)continue;
  let matches=next===target||canonical(cur,next).hash===expected;
  // The new client resets one binary state before entering home. Accept only
  // one binary-flag assignment plus an otherwise identical reviewed entry function.
  if(!matches)for(let i=0;i<next.body.body.length;i++){
   const stmt=next.body.body[i],e=stmt.type==='ExpressionStatement'&&stmt.expression;
   if(e?.type!=='AssignmentExpression'||e.operator!=='='||e.left.type!=='Identifier'||![0,1].includes(cur.constant(e.right))||!cur.binding(e.left))continue;
   const reduced={...next,body:{...next.body,body:next.body.body.filter((_,j)=>j!==i)}};
   if(canonical(cur,reduced).hash===expected){matches=true;break;}
  }
  if(matches)hits.push(prop(cur,entry));
 }
 if(hits.length!==1)throw Error('Native home activation method changed or ambiguous');
 return hits[0];
}
module.exports={homeActivation};
