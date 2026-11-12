// Adapt the independently reviewed native direction send sites to the uploaded
// packetAngle callback. Native clocks, caches, codec and socket remain intact.
const {parse}=require('../parser.cjs');
function untitledDirectionOperations(operations,analysis,{primaryOnly=false,jitterOwnership=false}={}){
 const selected=operations.filter(op=>op.id.startsWith('ilm-native-angle-bookkeeping-'));
 if(!selected.length)return operations;
 if(selected.length!==2)throw Error('Both reviewed native direction handlers are required');
 return operations.map(op=>{
  if(!selected.includes(op))return op;
  const tree=parse(op.after,{ecmaVersion:'latest'}),nodes=[],pending=[tree];while(pending.length){const n=pending.pop();nodes.push(n);for(const v of Object.values(n))if(Array.isArray(v))pending.push(...v.filter(x=>x?.type));else if(v?.type)pending.push(v);}
  const guards=nodes.filter(n=>n.type==='LogicalExpression'&&n.operator==='&&'&&n.right.type==='CallExpression'&&op.after.slice(n.left.start,n.left.end).includes('controlsAimDirection'));
  if(guards.length!==1)throw Error('Unsupported native direction guard');const guard=guards[0];
  const own=call=>jitterOwnership?'((!__responsiveMod||!__responsiveMod.controlsJitterDirection)&&'+call+')':call;
  if(primaryOnly&&op.id.endsWith('secondary'))return {...op,after:op.after.slice(0,guard.start)+own(op.after.slice(guard.right.start,guard.right.end))+op.after.slice(guard.end)};
  const owner=analysis?.functions.find(n=>n.id?.name===tree.body[0]?.id?.name);
  const opcode=node=>{if(node?.type==='Literal')return node.value;if(!owner||node?.type!=='Identifier')return undefined;const values=new Set(analysis.nodes.filter(n=>n.type==='Identifier'&&n.name===node.name&&n.start>=owner.start&&n.end<=owner.end).map(n=>analysis.constant(n)).filter(v=>v!==undefined));return values.size===1?[...values][0]:undefined;};
  const arrays=nodes.filter(n=>n.type==='ArrayExpression'&&n.start>guard.right.start&&n.end<guard.right.end&&n.elements.length===2&&opcode(n.elements[0])===6);
  if(arrays.length!==1)throw Error('Unique native numeric direction packet required: '+op.id);const angle=arrays[0].elements[1],before=op.after.slice(angle.start,angle.end);
  const call=op.after.slice(guard.right.start,angle.start)+'(__responsiveMod?__responsiveMod.nativePacketAngle('+before+'):'+before+')'+op.after.slice(angle.end,guard.right.end);
  return {...op,after:op.after.slice(0,guard.start)+own(call)+op.after.slice(guard.end)};
 });
}
module.exports={untitledDirectionOperations};
