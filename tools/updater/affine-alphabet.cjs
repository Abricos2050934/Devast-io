// Read a bounded arithmetic alphabet expression as data, without running the
// surrounding decoder function or its control-flow dispatcher.
function affineAlphabets(nodes,{constant,binding,parent}){
 const result=[];
 for(const call of nodes){
  if(call.type!=='CallExpression'||call.arguments.length!==1||call.callee.type!=='MemberExpression'||call.callee.computed||call.callee.property.name!=='charCodeAt'||call.callee.object.type!=='Identifier')continue;
  const assignment=parent.get(call);
  const character=assignment?.type==='AssignmentExpression'&&assignment.operator==='='?assignment.left:assignment?.type==='VariableDeclarator'?assignment.id:null;
  if(character?.type!=='Identifier')continue;
  let fn=parent.get(call);while(fn&&!['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(fn.type))fn=parent.get(fn);
  if(!fn||fn.params.length!==1||fn.params[0].type!=='Identifier')continue;
  let input=binding(call.callee.object),seen=new Set();
  while(input&&input!==binding(fn.params[0])&&!seen.has(input)&&input.init?.type==='Identifier'){seen.add(input);input=binding(input.init);}
  if(input!==binding(fn.params[0]))continue;
  const characterBinding=binding(character);if(!characterBinding)continue;
  const isCharacter=n=>n?.type==='Identifier'&&binding(n)===characterBinding;
  function bound(n){
   if(n.type!=='BinaryExpression')return null;
   if(isCharacter(n.left)&&['>=','<='].includes(n.operator))return {kind:n.operator==='>='?'lo':'hi',value:constant(n.right)};
   if(isCharacter(n.right)&&['>=','<='].includes(n.operator))return {kind:n.operator==='<='?'lo':'hi',value:constant(n.left)};
   return null;
  }
  function value(n,code){
   if(isCharacter(n))return code;
   const known=constant(n);if(typeof known==='number')return known;
   if(n.type!=='BinaryExpression')return NaN;
   const left=value(n.left,code),right=value(n.right,code);
   if(!Number.isFinite(left)||!Number.isFinite(right))return NaN;
   switch(n.operator){case '+':return left+right;case '-':return left-right;case '*':return left*right;case '%':return left%right;case '&':return left&right;default:return NaN;}
  }
  for(const range of nodes){
   if(range.start<fn.start||range.end>fn.end||range.type!=='IfStatement'||range.test.type!=='LogicalExpression'||range.test.operator!=='&&')continue;
   const bounds=[bound(range.test.left),bound(range.test.right)];if(bounds.some(x=>!x))continue;
   const lo=bounds.find(x=>x.kind==='lo')?.value,hi=bounds.find(x=>x.kind==='hi')?.value,width=hi-lo+1;
   if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo<=127||hi>65535||lo<=0xdfff&&hi>=0xd800||![16,256].includes(width))continue;
   const pushes=nodes.filter(n=>n.start>=range.consequent.start&&n.end<=range.consequent.end&&n.type==='CallExpression'&&n.arguments.length===1&&n.callee.type==='MemberExpression'&&!n.callee.computed&&n.callee.property.name==='push');
   for(const push of pushes){
    const entries=Array.from({length:width},(_,i)=>({key:{type:'Literal',value:lo+i},value:{type:'Literal',value:value(push.arguments[0],lo+i)}}));
    const values=entries.map(e=>e.value.value);
    if(values.every(v=>Number.isInteger(v)&&v>=0&&v<width)&&new Set(values).size===width)result.push({end:fn.end,properties:entries});
   }
  }
 }
 return result;
}
module.exports={affineAlphabets};
