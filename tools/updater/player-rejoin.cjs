// The Nov 11 client adds a native animation reset on player rejoin. Keep that
// statement intact; map the nickname edit only after proving the entire rest
// of the handler and the independently exported reset implementation.
const {analyze}=require('./static.cjs');
const {readonlyConstants,semanticCanonical:canonical}=require('./semantic.cjs');
const resetReference=readonlyConstants(analyze('function сброс(код){var игрок=мир.игроки[код];(игрок!==undefined&&игрок.движение!==0)&&(игрок.начало=движок.время-420,игрок.кадр=0);}'));
const resetHash=canonical(resetReference,resetReference.functions[0]).hash;
const prop=(a,n)=>n.computed?a.constant(n.property||n.key):(n.property||n.key)?.name;
function playerRejoin(old,cur,fn){
 const oc=canonical(old,fn),matches=[];
 for(const next of cur.functions){
  if(next.type!==fn.type||next.params.length!==1||next.body?.body?.length!==fn.body.body.length+1)continue;
  const declaration=next.body.body[0]?.declarations?.[0],player=declaration?.id;
  if(player?.type!=='Identifier'||declaration.init?.type!=='MemberExpression')continue;
  for(const [index,statement]of next.body.body.entries()){
   const call=statement.type==='ExpressionStatement'?statement.expression:null;
   if(call?.type!=='CallExpression'||call.callee.type!=='MemberExpression'||call.callee.object.type!=='Identifier'||call.arguments.length!==1)continue;
   const arg=call.arguments[0];
   if(arg.type!=='MemberExpression'||arg.object.type!=='Identifier'||cur.binding(arg.object)!==cur.binding(player)||prop(cur,arg)!=='id')continue;
   const definitions=cur.nodes.filter(n=>n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&cur.binding(n.id)===cur.binding(call.callee.object)&&n.init?.type==='CallExpression'&&n.init.callee.type==='FunctionExpression');
   const namespace=definitions.length===1?definitions[0].init.callee:null;
   if(namespace?.type!=='FunctionExpression')continue;
   const returned=namespace.body.body.filter(n=>n.type==='ReturnStatement');
   const entry=returned.length===1&&returned[0].argument.type==='ObjectExpression'&&returned[0].argument.properties.filter(p=>prop(cur,p)===prop(cur,call.callee));
   if(!entry||entry.length!==1||entry[0].value.type!=='Identifier')continue;
   const reset=cur.binding(entry[0].value)?.node;
   if(reset?.type!=='FunctionDeclaration'||canonical(cur,reset).hash!==resetHash)continue;
   // The reset must read the same player table and the invoking namespace's
   // clock, rather than an unrelated alpha-equivalent object.
   const lookup=reset.body.body[0].declarations[0].init;
   const table=declaration.init.object;
   if(lookup.object.type!=='MemberExpression'||table.type!=='MemberExpression'||lookup.object.object.type!=='Identifier'||table.object.type!=='Identifier'||cur.binding(lookup.object.object)!==cur.binding(table.object)||prop(cur,lookup.object)!==prop(cur,table))continue;
   const clockReads=cur.nodes.filter(n=>n.start>=reset.start&&n.end<=reset.end&&n.type==='MemberExpression'&&n.object.type==='Identifier'&&cur.binding(n.object)===cur.binding(call.callee.object));
   if(clockReads.length!==1)continue;
   const projected={...next,body:{...next.body,body:next.body.body.filter((_,i)=>i!==index)}};
   const nc=canonical(cur,projected);
   if(nc.hash!==oc.hash)continue;
   nc.entries.set('',next);nc.entries.set('/body',next.body);
   matches.push({old:fn,current:next,oc,nc});
  }
 }
 if(matches.length!==1)throw Error('Native player rejoin contract changed or ambiguous');
 return matches[0];
}
function playerConstructor(old,cur,fn){
 const oc=canonical(old,fn),matches=[];
 for(const next of cur.functions){
  if(next.type!==fn.type||next.params.length!==2||next.body?.body?.length!==fn.body.body.length+6)continue;
  for(let index=0;index<=next.body.body.length-6;index++){
   const added=next.body.body.slice(index,index+6),fields=[];
   if(!added.every((n,i)=>{
    const e=n.type==='ExpressionStatement'?n.expression:null;
    if(e?.type!=='AssignmentExpression'||e.operator!=='='||e.left.type!=='MemberExpression'||e.left.object.type!=='ThisExpression'||cur.constant(e.right)!==(i===5?-1:0))return false;
    const field=prop(cur,e.left);if(typeof field!=='string')return false;fields.push(field);return true;
   })||new Set(fields).size!==6)continue;
   const remaining=next.body.body.filter((_,i)=>i<index||i>=index+6);
   // These must be new own fields, not duplicated writes whose deletion could
   // hide a change to an existing constructor field.
   if(cur.nodes.some(n=>n.start>=next.start&&n.end<=next.end&&n.type==='MemberExpression'&&n.object.type==='ThisExpression'&&fields.includes(prop(cur,n))&&!added.some(a=>n.start>=a.start&&n.end<=a.end)))continue;
   const nc=canonical(cur,{...next,body:{...next.body,body:remaining}});
   if(nc.hash!==oc.hash)continue;
   nc.entries.set('',next);nc.entries.set('/body',next.body);
   matches.push({old:fn,current:next,oc,nc});
  }
 }
 if(matches.length!==1)throw Error('Native player constructor contract changed or ambiguous');
 return matches[0];
}
module.exports={playerRejoin,playerConstructor};
