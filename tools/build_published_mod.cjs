// Compile the exact published mod without rewriting the native game or vendor.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const ts=require('typescript'),parser=require('./parser.cjs');
const root=path.resolve(__dirname,'..');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function syntax(source){return JSON.stringify(parser.parse(source,{ecmaVersion:'latest'}),(key,value)=>['start','end','raw'].includes(key)?undefined:typeof value==='bigint'?String(value):value);}
function functions(tree){const found=[];function visit(node){if(ts.isFunctionLike(node)&&node.body)found.push(node);ts.forEachChild(node,visit);}visit(tree);return found;}
function erase(source,file,options,bareArrows){
 const tree=ts.createSourceFile(file,source,options.target,true),edits=[];
 const remove=(start,end)=>{assert.ok(start>=0&&end>=start);edits.push({start,end});};
 const fn=functions(tree);
 assert.equal(fn.length,bareArrows.length,'Function count changed: '+file);
 fn.forEach((node,index)=>{
  if(!bareArrows[index])return;
  assert.ok(ts.isArrowFunction(node)&&node.parameters.length===1&&ts.isIdentifier(node.parameters[0].name),'Changed bare arrow at '+index);
  const children=node.getChildren(tree),open=children.find(n=>n.kind===ts.SyntaxKind.OpenParenToken),close=children.find(n=>n.kind===ts.SyntaxKind.CloseParenToken);
  assert.ok(open&&close);remove(open.getStart(tree),open.end);remove(close.getStart(tree),close.end);
 });
 function typeParameters(list){if(list?.length){const start=source.lastIndexOf('<',list[0].getStart(tree)),end=source.indexOf('>',list.at(-1).end);assert.ok(start>=0&&end>=0);remove(start,end+1);}}
 function visit(node){
  if(ts.isIndexSignatureDeclaration(node)){remove(node.getStart(tree),node.end);return;}
  if(ts.isParenthesizedExpression(node)&&ts.isAsExpression(node.expression)){
   remove(node.getStart(tree),node.expression.getStart(tree));remove(node.expression.end,node.end);
   remove(node.expression.expression.end,node.expression.end);visit(node.expression.expression);return;
  }
  if(ts.isAsExpression(node)){remove(node.expression.end,node.end);visit(node.expression);return;}
  if(ts.isParameter(node)&&node.name.getText(tree)==='this'){
   assert.equal(node.parent.parameters[0],node);remove(node.getStart(tree),node.parent.parameters.length>1?node.parent.parameters[1].getStart(tree):node.end);return;
  }
  if(ts.isParameter(node)&&node.questionToken)remove(node.questionToken.pos,node.questionToken.end);
  if(node.type){assert.equal(source[node.type.pos-1],':');remove(node.type.pos-1,node.type.end);}
  typeParameters(node.typeParameters);typeParameters(node.typeArguments);
  ts.forEachChild(node,child=>{if(child!==node.type&&!ts.isTypeNode(child))visit(child);});
 }
 visit(tree);
 const merged=[];
 for(const edit of edits.sort((a,b)=>a.start-b.start||b.end-a.end)){const prior=merged.at(-1);if(prior&&edit.start<=prior.end)prior.end=Math.max(prior.end,edit.end);else merged.push({...edit});}
 let output=source;for(const edit of merged.reverse())output=output.slice(0,edit.start)+output.slice(edit.end);
 const official=ts.transpileModule(source,{fileName:file,compilerOptions:{...options,noEmitOnError:false}});
 assert.equal(syntax(output),syntax(official.outputText),'Emission differs from TypeScript: '+file);
 return output;
}
function build({checkOnly=false}={}){
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const manifest=JSON.parse(read('published-mod/source.json'));
 const config=ts.readConfigFile(path.join(root,'tsconfig.published-mod.json'),ts.sys.readFile);assert.ok(!config.error);
 const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);assert.equal(parsed.errors.length,0);
 assert.equal(parsed.options.strict,true);assert.notEqual(parsed.options.noCheck,true);assert.equal(parsed.options.alwaysStrict,false);assert.equal(parsed.options.erasableSyntaxOnly,true);
 for(const file of parsed.fileNames){const scanner=ts.createScanner(parsed.options.target,false,ts.LanguageVariant.Standard,fs.readFileSync(file,'utf8'));for(let token=scanner.scan();token!==ts.SyntaxKind.EndOfFileToken;token=scanner.scan())if([ts.SyntaxKind.SingleLineCommentTrivia,ts.SyntaxKind.MultiLineCommentTrivia].includes(token))assert.ok(!/@ts-(?:nocheck|ignore|expect-error)\b/.test(scanner.getTokenText()),'Suppressed checks: '+file);}
 const program=ts.createProgram(parsed.fileNames,{...parsed.options,noEmit:true}),diagnostics=ts.getPreEmitDiagnostics(program);
 if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=>"\n"}));
 const original=zlib.gunzipSync(fs.readFileSync(path.join(root,'published-mod/reference-client.js.gz'))).toString('utf8');
 assert.equal(hash(original),manifest.source_sha256,'Published reference checksum mismatch');
 const emitted=new Map(),inventory=[];
 for(const range of manifest.fragments){
  const file='published-mod/'+range.name+'.ts',typed=read(file),js=erase(typed,file,parsed.options,range.bare_arrows);
  const before=original.slice(range.start,range.end);
  assert.equal(hash(before),range.sha256,'Invalid extraction range: '+range.name);
  assert.equal(js,before,'Runtime code or formatting changed during migration: '+range.name);
  emitted.set(range.name,js);
  const oldFunctions=functions(ts.createSourceFile('before.js',before,parsed.options.target,true,ts.ScriptKind.JS));
  const newFunctions=functions(ts.createSourceFile(file,typed,parsed.options.target,true));
  assert.equal(oldFunctions.length,newFunctions.length);
  inventory.push({file,functions:oldFunctions.length,all_functions_preserved:true,byte_identical_javascript:true,source_sha256:hash(typed),javascript_sha256:hash(js)});
 }
 let client=original;for(const range of [...manifest.fragments].sort((a,b)=>b.start-a.start))client=client.slice(0,range.start)+emitted.get(range.name)+client.slice(range.end);
 assert.equal(hash(client),manifest.source_sha256,'Native game changed');
 const loader=read('resource-override/loader.js');
 assert.equal(hash(loader),manifest.loader_sha256,'Loader JS changed; review the source snapshot');
 const loaderOutput=require('./compile_mod.cjs').eraseTypes(read('resource-override/loader.ts'),'resource-override/loader.ts',parsed.options);
 assert.equal(loaderOutput,loader,'Loader migration changed runtime');
 const report={status:'passed',source_url:manifest.source_url,typescript:ts.version,strict:true,scope:'published owned mod and loader; native game and vendor remain JavaScript',typing:'Dynamic legacy internals use explicit PublishedDynamic (any); strict checking does not prove their runtime safety.',source_sha256:manifest.source_sha256,output_sha256:hash(client),functions_preserved:inventory.reduce((sum,item)=>sum+item.functions,0),fragments:inventory,loader:{file:'resource-override/loader.ts',byte_identical_javascript:true},native_and_vendor_unchanged:true,publication:'not_published',live_server_test:'not_run; this migration preserves published runtime bytes'};
 if(!checkOnly){
  const dir=path.join(root,'artifacts/published-typescript-2026-11-22');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'client.js'),client);
  const override={v:1,data:[{id:'d1',matchUrl:'https://devast.io/*',on:true,rules:[{type:'fileOverride',match:'**://devast.io/js/*.js',on:true,fileId:'f1',file:client}]}]};
  fs.writeFileSync(path.join(dir,'Devast-io-TypeScript.json'),JSON.stringify(override,null,2)+'\n');
  const readBack=JSON.parse(fs.readFileSync(path.join(dir,'Devast-io-TypeScript.json'),'utf8'));assert.equal(hash(readBack.data[0].rules[0].file),manifest.source_sha256);
  fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(report,null,2)+'\n');
 }
 return report;
}
module.exports={build,erase,functions};
if(require.main===module)try{console.log(JSON.stringify(build({checkOnly:process.argv.includes('--check')}),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
