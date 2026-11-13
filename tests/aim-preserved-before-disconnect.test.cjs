const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{parse}=require('../tools/parser.cjs');
test('aim modules, calculations, settings, controls and transport match the pre-investigation version',()=>{
 const ref=JSON.parse(fs.readFileSync('recovery/aim-pre-disconnect-reference.json','utf8')),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 for(const[file,digest]of Object.entries(ref.files))assert.equal(hash(fs.readFileSync(file)),digest,file);
 const source=fs.readFileSync('mod/responsive.js','utf8'),root=parse(source,{ecmaVersion:'latest'}).body.find(n=>n.id?.name==='__installDevastMod');
 const functions=new Set(['connectionEvent','connectionInfo','failedServerRefresh','beginPlay','watchConnectionHandlers','updateReconnect']),variables=new Set(['reconnect','trafficKeys']);
 const rest=root.body.body.filter(n=>!(n.type==='FunctionDeclaration'&&functions.has(n.id.name))&&!(n.type==='VariableDeclaration'&&n.declarations.some(d=>variables.has(d.id.name)))).map(n=>source.slice(n.start,n.end)).join('\n');
 assert.equal(hash(rest),ref.non_connection_body_sha256,'Code outside connection recovery/diagnostics changed');
 for(const[key,digest]of Object.entries(ref.host_nodes)){let n;
  if(key.startsWith('function:'))n=root.body.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===key.slice(9));
  else if(key==='variable:aimModule')n=root.body.body.flatMap(n=>n.declarations||[]).find(n=>n.id.name==='aimModule').init;
  else if(key.startsWith('assignment:')){const name=key.split('.')[1];n=root.body.body.find(n=>n.type==='ExpressionStatement'&&n.expression.type==='AssignmentExpression'&&n.expression.left.object?.name==='Aimbot'&&n.expression.left.property?.name===name);}
  else n=root.body.body.filter(n=>n.type==='ReturnStatement').at(-1);
  assert.ok(n,key);assert.equal(hash(source.slice(n.start,n.end)),digest,key);
 }
});
