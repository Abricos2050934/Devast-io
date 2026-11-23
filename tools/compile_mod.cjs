// Type-check only our code. Native game snapshots and vendor code are inputs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ts=require('typescript'),parser=require('./parser.cjs');
const root=path.resolve(__dirname,'..');
const entries=['mod/ballistic-model','mod/ilm-aim','mod/responsive','mod/bootstrap','resource-override/loader'];
const embed='/* @mod-embed ballistic-model */';
const digest=source=>crypto.createHash('sha256').update(source).digest('hex');
function syntax(source){return JSON.stringify(parser.parse(source,{ecmaVersion:'latest'}),(key,value)=>['start','end','raw'].includes(key)?undefined:typeof value==='bigint'?String(value):value);}
function eraseTypes(source,file,options){
 const tree=ts.createSourceFile(file,source,options.target,true,ts.ScriptKind.TS),edits=[];
 function remove(start,end){assert.ok(start>=0&&end>=start);edits.push({start,end});}
 function declaration(node){
  const start=source.lastIndexOf('\n',node.getStart(tree)-1)+1,end=source.indexOf('\n',node.end);
  assert.ok(/^\s*$/.test(source.slice(start,node.getStart(tree))),'Put erased declarations on their own line');
  assert.ok(/^\s*;?\s*$/.test(source.slice(node.end,end<0?source.length:end)),'Mixed erased/runtime declaration');
  remove(start,end<0?source.length:end+1);
 }
 function parameters(list){
  if(!list?.length)return;
  const start=source.lastIndexOf('<',list[0].getStart(tree)),end=source.indexOf('>',list.at(-1).end);
  assert.ok(start>=0&&end>=0);remove(start,end+1);
 }
 function visit(node){
  if(ts.isInterfaceDeclaration(node)||ts.isTypeAliasDeclaration(node)||node.modifiers?.some(m=>m.kind===ts.SyntaxKind.DeclareKeyword)){declaration(node);return;}
  if(ts.isAsExpression(node)||ts.isSatisfiesExpression(node)){remove(node.expression.end,node.end);visit(node.expression);return;}
  if(ts.isNonNullExpression(node)){remove(node.expression.end,node.end);visit(node.expression);return;}
  if(ts.isParameter(node)&&node.questionToken)remove(node.questionToken.pos,node.questionToken.end);
  if(ts.isParameter(node)&&node.name.getText(tree)==='this'){
   const parent=node.parent,index=parent.parameters.indexOf(node);assert.equal(index,0);
   remove(node.getStart(tree),parent.parameters.length>1?parent.parameters[1].getStart(tree):node.end);return;
  }
  if(node.type){const at=node.type.pos-1;assert.equal(source[at],':','Unsupported type annotation in '+file);remove(at,node.type.end);}
  parameters(node.typeParameters);parameters(node.typeArguments);
  for(const child of node.getChildren(tree)){
   if(child===node.type||child===node.typeParameters||child===node.typeArguments)continue;
   // SyntaxLists contain type parameters too; the erased spans are merged.
   if(ts.isTypeNode(child))continue;
   visit(child);
  }
 }
 visit(tree);
 const merged=[];
 for(const edit of edits.sort((a,b)=>a.start-b.start||b.end-a.end)){
  const prior=merged.at(-1);if(prior&&edit.start<=prior.end)prior.end=Math.max(prior.end,edit.end);else merged.push({...edit});
 }
 let output=source;for(const edit of merged.reverse())output=output.slice(0,edit.start)+output.slice(edit.end);
 const official=ts.transpileModule(source,{compilerOptions:{...options,noEmitOnError:false},fileName:file}).outputText;
 assert.equal(syntax(output),syntax(official),'Format-preserving emission differs from TypeScript: '+file);
 return output;
}
function compile({checkOnly=false,verifyOnly=false}={}){
 const config=ts.readConfigFile(path.join(root,'tsconfig.mod.json'),ts.sys.readFile);if(config.error)throw Error(ts.flattenDiagnosticMessageText(config.error.messageText,'\n'));
 const converted=ts.convertCompilerOptionsFromJson(config.config.compilerOptions,root);
 if(converted.errors.length)throw Error(converted.errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
 const options=converted.options;
 assert.equal(options.strict,true,'The mod requires strict TypeScript checks');
 assert.notEqual(options.noCheck,true,'TypeScript checking must stay enabled');
 assert.equal(options.alwaysStrict,false,'Do not change the native classic-script execution mode');
 assert.equal(options.erasableSyntaxOnly,true,'Runtime TypeScript constructs are outside the mod build contract');
 for(const file of [...entries.map(entry=>entry+'.ts'),'mod/contracts.d.ts']){
  const source=fs.readFileSync(path.join(root,file),'utf8'),scanner=ts.createScanner(options.target,false,ts.LanguageVariant.Standard,source);
  for(let token=scanner.scan();token!==ts.SyntaxKind.EndOfFileToken;token=scanner.scan())if([ts.SyntaxKind.SingleLineCommentTrivia,ts.SyntaxKind.MultiLineCommentTrivia].includes(token))assert.ok(!/@ts-(?:nocheck|ignore|expect-error)\b/.test(scanner.getTokenText()),'Suppressed checks are not allowed in '+file);
 }
 const diagnostics=[];
 // Each fragment is deliberately a classic script. Check it against shared
 // interfaces and its own declared host imports, then inline it during build.
 for(const entry of entries){
  const program=ts.createProgram([path.join(root,entry+'.ts'),path.join(root,'mod/contracts.d.ts')],{...options,noEmit:true});
  diagnostics.push(...ts.getPreEmitDiagnostics(program));
 }
 if(diagnostics.length){const host={getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=>"\n"};throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,host));}
 const outputs=new Map();for(const entry of entries)outputs.set(entry,eraseTypes(fs.readFileSync(path.join(root,entry+'.ts'),'utf8'),entry+'.ts',options));
 const core=outputs.get('mod/ilm-aim');assert.equal(core.split(embed).length,2,'One typed ballistic-model embedding required');outputs.set('mod/ilm-aim',core.replace(embed,()=>outputs.get('mod/ballistic-model').trim()));
 const overrideFile='resource-override/Devast-io-GitHub-Resource-Override.json',overrideOriginal=fs.readFileSync(path.join(root,overrideFile),'utf8'),override=JSON.parse(overrideOriginal);
 assert.equal(override.v,1);const rule=override.data?.[0]?.rules?.[0];assert.equal(rule?.type,'fileOverride');
 const loader=outputs.get('resource-override/loader'),embedded=rule.file.includes('\r\n')?loader.replace(/\r?\n/g,'\r\n'):loader;
 const artifacts=new Map([...outputs].map(([entry,source])=>[entry+'.js',source]));
 if(rule.file!==embedded){rule.file=embedded;artifacts.set(overrideFile,JSON.stringify(override,null,2)+'\n');}
 if(!checkOnly)for(const[file,source]of artifacts){const target=path.join(root,file);if(verifyOnly)assert.equal(fs.readFileSync(target,'utf8'),source,'Generated file is stale: '+file);else if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==source){fs.writeFileSync(target+'.tmp',source);fs.renameSync(target+'.tmp',target);}}
 const files=[...entries.map(entry=>entry+'.ts'),'mod/contracts.d.ts','tsconfig.mod.json'];
 return {status:'passed',typescript:ts.version,strict:true,files,
  source_sha256:Object.fromEntries(files.map(file=>[file,digest(fs.readFileSync(path.join(root,file)))])),
  generated_sha256:Object.fromEntries([...outputs].map(([entry,source])=>[entry+'.js',digest(source)])),
  emission:'type erasure, verified against the TypeScript compiler AST'};
}
module.exports={compile,eraseTypes};
if(require.main===module)try{console.log(JSON.stringify(compile({checkOnly:process.argv.includes('--check'),verifyOnly:process.argv.includes('--verify')})));}catch(error){console.error(error.message);process.exitCode=1;}
