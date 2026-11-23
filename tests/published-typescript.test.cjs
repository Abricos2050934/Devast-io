const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),ts=require('typescript');
const {build,erase,functions}=require('../tools/build_published_mod.cjs');
const options=ts.convertCompilerOptionsFromJson(JSON.parse(fs.readFileSync('tsconfig.published-mod.json')).compilerOptions,process.cwd()).options;

test('published mod preserves every function and every emitted byte, including native game and loader',()=>{
 const report=build({checkOnly:true});
 assert.equal(report.status,'passed');assert.equal(report.strict,true);
 assert.equal(report.functions_preserved,357);
 assert.equal(report.source_sha256,report.output_sha256);
 assert.equal(report.native_and_vendor_unchanged,true);
 assert.equal(report.loader.byte_identical_javascript,true);
 assert.deepEqual(report.fragments.map(item=>item.functions),[138,208,11]);
});

test('migration erases only types and added parentheses while preserving original arrow and class layout',()=>{
 const original='class Box {constructor(value){this.value=value;} get(){return this.value;}}\nconst identity=value=>value;\nfunction get(value,options){return value.key;}\n';
 const typed='class Box {[key:string]: PublishedDynamic;constructor(value: PublishedDynamic){this.value=value;} get(this: PublishedDynamic): PublishedDynamic{return this.value;}}\nconst identity: PublishedDynamic=(value: PublishedDynamic): PublishedDynamic=>value;\nfunction get(this: PublishedDynamic,value: PublishedDynamic,options?: PublishedDynamic): PublishedDynamic{return (value as PublishedDynamic).key;}\n';
 const tree=ts.createSourceFile('original.js',original,options.target,true,ts.ScriptKind.JS);
 const layout=functions(tree).map(node=>ts.isArrowFunction(node)&&!node.getChildren(tree).some(n=>n.kind===ts.SyntaxKind.OpenParenToken));
 assert.equal(erase(typed,'example.ts',options,layout),original);
});

test('type errors, suppressed checks, changed runtime and missing functions leave existing output untouched',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'published-mod-ts-'));
 try{
  fs.cpSync('published-mod',path.join(temporary,'published-mod'),{recursive:true});
  fs.mkdirSync(path.join(temporary,'tools'));fs.mkdirSync(path.join(temporary,'resource-override'));
  for(const file of ['build_published_mod.cjs','compile_mod.cjs','parser.cjs'])fs.copyFileSync('tools/'+file,path.join(temporary,'tools',file));
  for(const file of ['loader.ts','loader.js'])fs.copyFileSync('resource-override/'+file,path.join(temporary,'resource-override',file));
  fs.copyFileSync('tsconfig.published-mod.json',path.join(temporary,'tsconfig.published-mod.json'));
  fs.symlinkSync(path.resolve('node_modules'),path.join(temporary,'node_modules'));
  const output=path.join(temporary,'artifacts/published-typescript-2026-11-22/client.js');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,'previous checked client');
  const file=path.join(temporary,'published-mod/host.ts'),source=fs.readFileSync(file,'utf8');
  const cases=[
   ['\nconst invalid:number="text";\n',/TS2322/],
   ['\n// @ts-nocheck\n',/Suppressed checks/],
   ['\nfunction unexpected():void{}\n',/Function count changed/]
  ];
  for(const[addition,expected]of cases){
   fs.writeFileSync(file,source+addition);
   const result=spawnSync(process.execPath,['tools/build_published_mod.cjs'],{cwd:temporary,encoding:'utf8'});
   assert.notEqual(result.status,0);assert.match(result.stderr,expected);assert.equal(fs.readFileSync(output,'utf8'),'previous checked client');
  }
  assert.ok(source.includes('Missing native network handler: '));
  fs.writeFileSync(file,source.replace('Missing native network handler: ','Changed native network handler: '));
  const changed=spawnSync(process.execPath,['tools/build_published_mod.cjs'],{cwd:temporary,encoding:'utf8'});
  assert.notEqual(changed.status,0);assert.match(changed.stderr,/Runtime code or formatting changed/);assert.equal(fs.readFileSync(output,'utf8'),'previous checked client');
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
