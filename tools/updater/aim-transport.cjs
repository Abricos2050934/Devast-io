// Keep automated combat on the same codec/socket path as native commands,
// without treating each background angle as fresh user activity.
function aimTransportOperation(a,symbols,roles,reviewedOwners){
 const property=n=>n.computed?a.constant(n.key):n.key.name??n.key.value;
 const entries=a.nodes.filter(n=>n.type==='Property'&&property(n)===symbols['ᴎᚂρ']);
 if(entries.length!==1||entries[0].value.type!=='Identifier')throw Error('Unique native JSON sender export required');
 const defs=a.functions.filter(n=>n.type==='FunctionDeclaration'&&n.id?.name===entries[0].value.name);
 if(defs.length!==1||reviewedOwners&&!reviewedOwners.has(defs[0]))throw Error('Native JSON sender was not independently reviewed');
 const fn=defs[0],first=fn.body.body[0]?.expression,call=fn.body.body[1]?.expression,encoded=call?.arguments?.[0],parsed=encoded?.arguments?.[0];
 const encodeKey=encoded?.callee?.computed?a.constant(encoded.callee.property):encoded?.callee?.property?.name;
 if(fn.params.length!==1||fn.body.body.length!==2||first?.type!=='AssignmentExpression'||first.operator!=='='||first.left.type!=='Identifier'||first.right.type!=='Identifier'||call?.type!=='CallExpression'||call.callee.type!=='Identifier'||call.arguments.length!==1||encoded?.type!=='CallExpression'||encoded.callee.type!=='MemberExpression'||encoded.callee.object.name!==roles['еϲᄄ']||encodeKey!==roles['ᴎ︅ހ']||encoded.arguments.length!==1||parsed?.type!=='CallExpression'||parsed.callee.object?.name!=='JSON'||(parsed.callee.computed?a.constant(parsed.callee.property):parsed.callee.property.name)!=='parse'||parsed.arguments.length!==1||parsed.arguments[0].name!==fn.params[0].name)throw Error('Native JSON sender/codec contract changed');
 const before=a.source.slice(fn.start,fn.end),send=a.source.slice(call.callee.start,call.callee.end),encode=a.source.slice(encoded.callee.start,encoded.callee.end);
 return {id:'message15-native-aim-transport',expected:1,before,after:before+'\n'+fn.id.name+'.__devastAimTransport=function(packet){'+send+'('+encode+'(packet));};'};
}
module.exports={aimTransportOperation};
