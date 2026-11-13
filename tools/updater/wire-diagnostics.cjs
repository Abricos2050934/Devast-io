// Observe successful native sends without exposing or changing their contents.
function wireDiagnosticOperation(a,operations,roles){
 const selected=operations.filter(op=>op.id==='message15-native-aim-transport');
 if(selected.length!==1)throw Error('Reviewed native JSON sender required for wire diagnostics');
 const json=a.functions.filter(fn=>a.source.slice(fn.start,fn.end)===selected[0].before);
 if(json.length!==1)throw Error('Native wire sender entry is ambiguous');
 const entry=json[0].body.body[1]?.expression;
 const raw=entry?.callee?.type==='Identifier'?a.binding(entry.callee)?.node:null;
 if(raw?.type!=='FunctionDeclaration'||raw.params.length!==1)throw Error('Native wire sender definition changed');
 const statements=raw.body.body,last=statements.at(-1),call=last?.expression;
 const prop=call?.callee?.type==='MemberExpression'?(call.callee.computed?a.constant(call.callee.property):call.callee.property.name):null;
 if(last?.type!=='ExpressionStatement'||call?.type!=='CallExpression'||prop!=='send'||call.callee.object.name!==roles['І̎ܘ']||call.arguments.length!==1||call.arguments[0].type!=='Identifier')throw Error('Native wire send contract changed');
 const sends=a.nodes.filter(n=>n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.type==='Identifier'&&a.binding(n.callee.object)===a.binding(call.callee.object)&&(n.callee.computed?a.constant(n.callee.property):n.callee.property.name)==='send');
 if(sends.length!==1)throw Error('Native socket send is missing or ambiguous');
 const frame=call.arguments[0].name,before=a.source.slice(raw.start,raw.end),at=last.end-raw.start;
 const hook='try{if(typeof __responsiveMod!=="undefined"&&__responsiveMod)__responsiveMod.observeWireSend('+frame+'.byteLength);}catch(__wireDiagnosticError){}';
 roles.nativeWireSender=raw.id.name;
 return {id:'native-wire-send-diagnostics',expected:1,before,after:before.slice(0,at)+hook+before.slice(at)};
}
module.exports={wireDiagnosticOperation};
