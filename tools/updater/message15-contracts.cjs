// Adapt the imported engine's lifecycle hooks to the reviewed native protocol.
const parser=require('../parser.cjs');
function message15Operations(a,operations,symbols,roles,protocol={moveOpcode:2},reviewedOwners){
 const ops=operations.map(op=>({...op}));
 const fire=ops.find(op=>op.id==='jitter-native-fire-priority');
 if(!fire||!fire.after.endsWith('}'))throw Error('Native fire hook missing');
 fire.after=fire.after.slice(0,-1)+'if(__responsiveMod)__responsiveMod.afterFire();}';
 // Skip the native attack when its controlled direction could not be sent.
 fire.after=fire.after.replace('__responsiveMod.beforeFire();','if(__responsiveMod.beforeFire()===false)return;');
 const angle=ops.find(op=>op.id==='ilm-native-self-server-angle');
 const tree=parser.parse(angle.after,{ecmaVersion:'latest'}),pending=[tree],edits=[];
 while(pending.length){const n=pending.pop();
  if(n.type==='ConditionalExpression'&&angle.after.slice(n.test.start,n.test.end).includes('__responsiveMod.aimRenderAngle'))edits.push({start:n.start,end:n.end,text:angle.after.slice(n.alternate.start,n.alternate.end)});
  for(const v of Object.values(n))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);
 }
 if(edits.length!==1)throw Error('Expected one retired aim rendering override');
 for(const e of edits.reverse())angle.after=angle.after.slice(0,e.start)+e.text+angle.after.slice(e.end);
 const calls=a.nodes.filter(n=>n.type==='CallExpression'&&n.arguments[0]?.type==='CallExpression'&&n.arguments[0].callee.object?.name===roles['еϲᄄ']);
 function sender(opcode,length){const hits=calls.filter(n=>{const arr=n.arguments[0].arguments[0];return arr?.type==='ArrayExpression'&&arr.elements.length===length&&a.constant(arr.elements[0])===opcode;});if(hits.length!==1)throw Error('Ambiguous Message15 native opcode '+opcode+': '+hits.length);return hits[0];}
 function owner(n,anchored=false){while(n&&n.type!=='FunctionDeclaration')n=a.parent.get(n);if(!n)throw Error('Missing native hook owner');if(!anchored&&reviewedOwners&&!reviewedOwners.has(n))throw Error('Native Message15 lifecycle contract changed: '+n.id.name);return n;}
 function add(id,node,after){const before=a.source.slice(node.start,node.end);ops.push({id,expected:1,before,after});}
 roles.messageMoveOpcode=protocol.moveOpcode;
 for(const [opcode,length,method]of [[5,1,'afterRelease'],[protocol.moveOpcode,2,'onMove']]){
  const node=sender(opcode,length),before=a.source.slice(node.start,node.end),args=node.arguments[0].arguments[0].elements;
  const argument=method==='onMove'?a.source.slice(args[1].start,args[1].end):'';
  add('message15-native-'+method,node,method==='onMove'?'((!__responsiveMod||__responsiveMod.onMove('+argument+')!==false)&&'+before+')':'('+before+',__responsiveMod&&__responsiveMod.'+method+'('+argument+'))');
  if(opcode===5)roles.messageRelease=owner(node).id.name;
  else {roles.messageMoveSender=owner(node).id.name;roles.messageMove??=roles.messageMoveSender;}
 }
 const world=symbols['еܞ︌'],self=symbols['ᅠᏧ‍'];
 const ids=a.nodes.filter(n=>n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.type==='MemberExpression'&&n.left.object.object.name===world&&(n.left.object.computed?a.constant(n.left.object.property):n.left.object.property.name)===self&&(n.left.computed?a.constant(n.left.property):n.left.property.name)==='id'&&n.right.type==='MemberExpression'&&a.constant(n.right.property)===1);
 if(ids.length!==1)throw Error('Unique Message15 handshake identity required');
 const id=ids[0],handshake=owner(id,true);let context=id;
 while(a.parent.get(context)?.type==='SequenceExpression')context=a.parent.get(context);
 if(id.operator!=='='||id.right.object.type!=='Identifier'||!handshake.params.some(p=>p.name===id.right.object.name)||a.parent.get(context)?.type!=='ExpressionStatement')throw Error('Native handshake assignment context changed');
 add('message15-handshake',id,'('+a.source.slice(id.start,id.end)+',__responsiveMod&&__responsiveMod.onHandshake())');roles.messageHandshake=handshake.id.name;
 const entries=a.nodes.filter(n=>n.type==='Property'&&(n.computed?a.constant(n.key):n.key.name??n.key.value)===symbols['ⲟࠀᄀ']);
 if(entries.length!==1)throw Error('Unique Message15 session export required');
 const defs=a.functions.filter(n=>n.type==='FunctionDeclaration'&&n.id.name===entries[0].value.name);
 if(defs.length!==1)throw Error('Native session start contract changed');
 const start=defs[0],statement=start.body.body[0],before=a.source.slice(start.start,start.end);
 let after;
 if(statement?.type==='IfStatement'&&statement.consequent.type==='BlockStatement'){
  const offset=statement.consequent.start+1-start.start;
  after=before.slice(0,offset)+'if(__responsiveMod)__responsiveMod.onSessionStart();'+before.slice(offset);
 }else if(start.body.body.length===1&&statement?.type==='ExpressionStatement'&&statement.expression.type==='LogicalExpression'&&statement.expression.operator==='&&'&&statement.expression.right.type==='SequenceExpression'){
  // A protected start body can also be emitted as guard && (save, save, connect).
  // Wrap only its guarded operand, preserving the native guard and return value.
  const body=statement.expression.right,from=body.start-start.start,to=body.end-start.start;
  after=before.slice(0,from)+'(__responsiveMod&&__responsiveMod.onSessionStart(),'+before.slice(from,to)+')'+before.slice(to);
 }else throw Error('Native session start contract changed');
 owner(start);
 add('message15-session-start',start,after);roles.messageSessionStart=start.id.name;
 return ops;
}
module.exports={message15Operations};
