const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process'),ts=require('typescript');
const {compile,eraseTypes}=require('../tools/compile_mod.cjs');
const config=JSON.parse(fs.readFileSync('tsconfig.mod.json'));
const options=ts.convertCompilerOptionsFromJson(config.compilerOptions,process.cwd()).options;

test('all owned TypeScript fragments pass strict checking and reproduce the JS used by the game',()=>{
 const report=compile({verifyOnly:true});
 assert.equal(report.status,'passed');assert.equal(report.strict,true);
 assert.equal(Object.keys(report.generated_sha256).length,5);
 assert.ok(report.files.includes('mod/contracts.d.ts'));
});
test('type erasure preserves conditional operators, optional parameters and runtime token boundaries',()=>{
 const source='interface Value { n:number }\n'+
  'declare const imported:number;\n'+
  'function choose<T>(value:T, fallback?:T):T|undefined { return value ?? fallback; }\n'+
  'const identity:<T>(value:T)=>T=value=>value;\n'+
  'let state:{n?:number}={}; state.n! = 4;\n'+
  'const n:number=state.n!>2 ? 1 : 0;\n'+
  'const text="x?:number";\n';
 const expected='function choose(value, fallback) { return value ?? fallback; }\n'+
  'const identity=value=>value;\n'+
  'let state={}; state.n = 4;\n'+
  'const n=state.n>2 ? 1 : 0;\n'+
  'const text="x?:number";\n';
 assert.equal(eraseTypes(source,'example.ts',options),expected);
});
test('public mod types reject invalid settings, packets and failed prediction use',()=>{
 const program=ts.createProgram(['mod/contracts.d.ts','tests/types/mod-contracts.ts'],{...options,noEmit:true});
 const diagnostics=ts.getPreEmitDiagnostics(program);
 assert.deepEqual(diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
});
test('type errors and disabled checks preserve all previous generated JavaScript',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'devast-ts-'));
 try{
  fs.cpSync('mod',path.join(temporary,'mod'),{recursive:true});
  fs.mkdirSync(path.join(temporary,'resource-override'));
  for(const file of ['loader.ts','loader.js'])fs.copyFileSync('resource-override/'+file,path.join(temporary,'resource-override',file));
  fs.copyFileSync('resource-override/Devast-io-GitHub-Resource-Override.json',path.join(temporary,'resource-override/Devast-io-GitHub-Resource-Override.json'));
  fs.mkdirSync(path.join(temporary,'tools'));
  for(const file of ['compile_mod.cjs','parser.cjs'])fs.copyFileSync('tools/'+file,path.join(temporary,'tools',file));
  fs.symlinkSync(path.resolve('node_modules'),path.join(temporary,'node_modules'));
  const source=fs.readFileSync('mod/responsive.ts','utf8');
  const files=Object.keys(compile({verifyOnly:true}).generated_sha256);
  for(const file of files)fs.writeFileSync(path.join(temporary,file),'previous verified '+file);
  for(const mode of ['invalid-type','suppression','disabled-checking']){
   fs.writeFileSync(path.join(temporary,'mod/responsive.ts'),mode==='suppression'?'// @ts-nocheck\n'+source:source+(mode==='invalid-type'?'\nconst invalid:number="text";\n':''));
   const cfg=JSON.parse(JSON.stringify(config));if(mode==='disabled-checking')cfg.compilerOptions.strict=false;
   fs.writeFileSync(path.join(temporary,'tsconfig.mod.json'),JSON.stringify(cfg));
   const result=spawnSync(process.execPath,['tools/compile_mod.cjs'],{cwd:temporary,encoding:'utf8'});
   assert.notEqual(result.status,0,mode);
   assert.match(result.stderr,mode==='invalid-type'?/TS2322/:mode==='suppression'?/Suppressed checks/:/strict TypeScript/);
   for(const file of files)assert.equal(fs.readFileSync(path.join(temporary,file),'utf8'),'previous verified '+file);
  }
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
