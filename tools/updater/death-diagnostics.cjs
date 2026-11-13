// Bind diagnostics to the actual reviewed death branch, not a historical opcode.
const {parse}=require('../parser.cjs');
function deathDiagnosticOperations(a,operations,roles){
 const selected=operations.filter(op=>op.id==='native-observe-server-death');
 if(selected.length!==1)throw Error('Unique native death observation patch required');
 const op=selected[0],definitions=a.functions.filter(fn=>fn.type==='FunctionDeclaration'&&a.source.slice(fn.start,fn.end)===op.before);
 if(definitions.length!==1||definitions[0].params.length!==1||definitions[0].params[0].type!=='Identifier')throw Error('Native death handler contract changed');
 const definition=definitions[0],calls=a.nodes.filter(n=>n.type==='CallExpression'&&n.callee.type==='Identifier'&&a.binding(n.callee)?.node===definition);
 if(calls.length!==1)throw Error('Native death dispatch is missing or ambiguous');
 const call=calls[0];let branch=a.parent.get(call);
 while(branch&&branch.type!=='SwitchCase'&&!/Function/.test(branch.type))branch=a.parent.get(branch);
 const statement=a.parent.get(branch),packet=call.arguments[0],discriminant=statement?.discriminant,opcode=a.constant(branch?.test);
 if(branch?.type!=='SwitchCase'||statement?.type!=='SwitchStatement'||call.arguments.length!==1||packet?.type!=='Identifier'||
    discriminant?.type!=='MemberExpression'||!discriminant.computed||a.constant(discriminant.property)!==0||discriminant.object.type!=='Identifier'||
    a.binding(discriminant.object)!==a.binding(packet)||!Number.isInteger(opcode)||opcode<0||opcode>255)throw Error('Native death opcode contract changed');
 const tree=parse(op.after,{ecmaVersion:'latest'}),pending=[tree],hooks=[];
 while(pending.length){const n=pending.pop();if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='__responsiveMod'&&n.callee.property.name==='observeDeath')hooks.push(n);for(const value of Object.values(n))if(Array.isArray(value))pending.push(...value.filter(x=>x?.type));else if(value?.type)pending.push(value);}
 if(hooks.length!==1||hooks[0].arguments.length!==1||hooks[0].arguments[0].name!==definition.params[0].name)throw Error('Native death diagnostic hook changed');
 const at=hooks[0].end-1,after=op.after.slice(0,at)+','+opcode+op.after.slice(at);
 roles.nativeDeathOpcode=opcode;
 return operations.map(item=>item===op?{...op,after}:item);
}
module.exports={deathDiagnosticOperations};
