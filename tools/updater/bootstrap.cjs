// The entity allocator's method can be renamed even when its body and the
// startup arguments are unchanged. Use its actual export identity as the anchor.
function initializerBootstrap(old,cur,node,oldNamespace,namespace,pairs){
 const prop=(a,n)=>n.computed?a.constant(n.property):n.property.name;
 const body=a=>a.tree.body[0]?.expression?.callee?.body?.body||[];
 function table(a,name){const d=body(a).flatMap(n=>n.declarations||[]).find(d=>d.id.name===name),scope=d?.init?.callee,object=scope?.body?.body.filter(n=>n.type==='ReturnStatement').at(-1)?.argument;return object?.type==='ObjectExpression'?{scope,object}:null;}
 function definition(a,scope,p){if(p.value.type!=='Identifier')return p.value;const b=a.binding(p.value);if(b?.node?.type==='FunctionDeclaration')return b.node;const defs=a.functions.filter(f=>f.id?.name===p.value.name&&f.start>scope.start&&f.end<scope.end);return defs.length===1?defs[0]:undefined;}
 const call=node.type==='ExpressionStatement'&&node.expression;
 if(call?.type!=='CallExpression'||call.callee.type!=='MemberExpression'||call.callee.object.name!==oldNamespace||prop(old,call.callee)!=='init'||call.arguments.length!==3)throw Error('Unsupported reviewed initialization anchor');
 const args=call.arguments.map(n=>old.constant(n));if(!args.every(n=>Number.isInteger(n)&&n>0))throw Error('Native initialization arguments changed');
 const previous=table(old,oldNamespace),next=table(cur,namespace);
 if(!previous||!next)throw Error('Native initialization namespace changed');
 const entries=previous.object.properties.filter(p=>(p.computed?old.constant(p.key):p.key.name??p.key.value)==='init');
 const fn=entries.length===1&&definition(old,previous.scope,entries[0]),target=fn&&pairs.get(fn);
 if(!target||fn.params.length!==3||target.params.length!==3)throw Error('Native initializer was not independently matched');
 const exports=next.object.properties.filter(p=>definition(cur,next.scope,p)===target);
 if(exports.length!==1)throw Error('Native initializer export is ambiguous');
 const method=exports[0].computed?cur.constant(exports[0].key):exports[0].key.name??exports[0].key.value;
 const hits=body(cur).filter(n=>{const c=n.type==='ExpressionStatement'&&n.expression;return c?.type==='CallExpression'&&c.callee.type==='MemberExpression'&&c.callee.object.name===namespace&&prop(cur,c.callee)===method&&c.arguments.length===args.length&&c.arguments.every((n,i)=>cur.constant(n)===args[i]);});
 if(hits.length!==1)throw Error('Native initialization call changed or is ambiguous');
 return {old:node,current:hits[0],local:new Map()};
}
module.exports={initializerBootstrap};
