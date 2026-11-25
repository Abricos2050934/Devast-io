const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const parser=require('./parser.cjs'),{build}=require('./build_rust.cjs');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function ownedInterval(original){
 const manifest=JSON.parse(read('rust-mod/function-manifest.json'));
 const tree=parser.parse(original,{ecmaVersion:'latest'}),body=tree.body[0].expression.callee.body.body;
 const names=manifest.programs.slice(0,2).flatMap(p=>p.entries),set=new Set(names);
 const ownFunctions=body.filter(node=>node.type==='FunctionDeclaration'&&set.has(node.id?.name));
 assert.equal(ownFunctions.length,names.length,'All owned module entries must be replaced exactly once');
 const bootstrapVars=body.filter(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>['__responsiveMod','__responsiveView'].includes(d.id.name)));
 assert.equal(bootstrapVars.length,2);
 const assignments=body.filter(node=>node.type==='ExpressionStatement'&&node.expression.type==='AssignmentExpression'&&node.expression.left.object?.name==='window'&&node.expression.left.property?.name==='__devastMod'&&node.expression.right.name==='__responsiveMod');
 assert.equal(assignments.length,1);
 const start=Math.min(...ownFunctions.map(n=>n.start)),end=assignments[0].end;
 for(const node of body.filter(n=>n.start>=start&&n.end<=end))assert.ok(ownFunctions.includes(node)||bootstrapVars.includes(node)||assignments.includes(node),'Unexpected native statement in the replacement interval');
 return{start,end,names};
}
function replaceOwned(original,runtime){const {start,end}=ownedInterval(original);return original.slice(0,start)+runtime+original.slice(end);}
function createResourceOverride(client){
 // Resource Override's importer accepts domain IDs /^d[0-9]+$/ and file IDs /^f[0-9]+$/.
 return{v:1,data:[{id:'d1',matchUrl:'https://devast.io/*',on:true,rules:[{type:'fileOverride',match:'**://devast.io/js/*.js',on:true,fileId:'f1',file:client}]}]};
}
function pinNative(){
 const status=JSON.parse(read('dist/update-status.json')),symbols=status.bindings;
 assert.ok(symbols&&Object.keys(symbols).length>70,'Verified native bindings required');
 const original=read('dist/game.modded.js');assert.equal(hash(original),status.output_sha256,'Native input client checksum mismatch');
 const {start,end}=ownedInterval(original),prefix=original.slice(0,start),suffix=original.slice(end),dir=path.join(rustPath(),'native-base');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'prefix.js.gz'),zlib.gzipSync(prefix));fs.writeFileSync(path.join(dir,'suffix.js.gz'),zlib.gzipSync(suffix));
 fs.writeFileSync(path.join(dir,'snapshot.json'),JSON.stringify({status,prefix_sha256:hash(prefix),suffix_sha256:hash(suffix)},null,2)+'\n');
 return dir;
}
function packageClient({candidateDir=null,outputDir=null}={}){
 const base=path.join(rustPath(),'native-base');if(!candidateDir&&(!fs.existsSync(path.join(base,'snapshot.json'))||process.argv.includes('--pin-native')))pinNative();
 let status,symbols,prefix,suffix;
 if(candidateDir){
  const original=fs.readFileSync(path.join(candidateDir,'game.modded.js'),'utf8');
  const report=JSON.parse(fs.readFileSync(path.join(candidateDir,'port-report.json')));
  const source=JSON.parse(fs.readFileSync(path.join(candidateDir,'source.json')));
  assert.equal(hash(original),report.output_sha256,'Candidate client checksum mismatch');
  assert.equal(hash(fs.readFileSync(path.join(candidateDir,'raw.js'))),source.raw_sha256,'Candidate game checksum mismatch');
  symbols=JSON.parse(fs.readFileSync(path.join(candidateDir,'bindings.json'))).symbols;
  assert.ok(Object.keys(symbols).length>70,'Candidate native bindings required');
  const interval=ownedInterval(original);prefix=original.slice(0,interval.start);suffix=original.slice(interval.end);
  status={source_url:source.script_url,output_sha256:report.output_sha256};
 }else{
  const snapshot=JSON.parse(fs.readFileSync(path.join(base,'snapshot.json')));status=snapshot.status;symbols=status.bindings;
  prefix=zlib.gunzipSync(fs.readFileSync(path.join(base,'prefix.js.gz'))).toString();suffix=zlib.gunzipSync(fs.readFileSync(path.join(base,'suffix.js.gz'))).toString();
  assert.equal(hash(prefix),snapshot.prefix_sha256);assert.equal(hash(suffix),snapshot.suffix_sha256);
 }
 const manifest=JSON.parse(read('rust-mod/function-manifest.json')),names=manifest.programs.slice(0,2).flatMap(p=>p.entries);
 const pkg=build({nativeBindings:symbols});
 const wasm=fs.readFileSync(path.join(pkg,'mod_bg.wasm'));
 const glue=fs.readFileSync(path.join(pkg,'mod.js'),'utf8').replace('document.currentScript !== null','document.currentScript != null');
 const bridge=read('rust-mod/bridge.js');
 const bindingNames=[...new Set([...Object.values(symbols),'__devastClientBuild','__devastIntegrityCompatibility'])];
 const native='const __rustNativeBindings={'+bindingNames.map(name=>'get '+JSON.stringify(name)+'(){return '+name+';}').join(',')+'};\n'+
  'const __rustGlobals=new Proxy(globalThis,{has:(t,k)=>Object.hasOwn(__rustNativeBindings,k)||Reflect.has(t,k),get:(t,k)=>Object.hasOwn(__rustNativeBindings,k)?__rustNativeBindings[k]:Reflect.get(t,k,t),set:(t,k,v)=>Reflect.set(t,k,v,t)});';
 const init=bridge+'\n'+glue+'\n'+
  'const __rustBytes=Uint8Array.from(atob('+JSON.stringify(wasm.toString('base64'))+'),c=>c.charCodeAt(0));\n'+
  'wasm_bindgen.initSync({module:new WebAssembly.Module(__rustBytes)});__devastRustOps.attach(wasm_bindgen);\n'+native+'\n'+
  'const __rustRoot=__devastRustOps.op("root",[__rustGlobals]);wasm_bindgen.run_program(0,__rustRoot);wasm_bindgen.run_program(1,__rustRoot);\n'+
  names.map(name=>'function '+name+'(...args){return Reflect.apply(__devastRustOps.read(__rustRoot,'+JSON.stringify(name)+'),undefined,args);}\n').join('')+
  'var __responsiveView,__responsiveMod;\n'+
  '__devastRustOps.alias(__rustRoot,"__responsiveView",()=>__responsiveView,v=>{__responsiveView=v;});\n'+
  '__devastRustOps.alias(__rustRoot,"__responsiveMod",()=>__responsiveMod,v=>{__responsiveMod=v;});\n'+
  'wasm_bindgen.run_program(2,__rustRoot);\n'+
  'window.__devastRustInfo=Object.freeze({backend:"Rust/WebAssembly",functions:'+manifest.functions.length+',wasmSha256:'+JSON.stringify(hash(wasm))+',sourceSha256:'+JSON.stringify(hash(read('rust-mod/src/generated.rs')))+'});\n';
 fs.writeFileSync(path.join(rustPath(),'native/owned-runtime.js'),init);
 const client=prefix+init+suffix;
 parser.parse(client,{ecmaVersion:'latest'});
 const dir=outputDir?path.resolve(outputDir):path.join(root,'artifacts/rust-mod-fps3-2026-11-25');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'client.js'),client);
 const override=createResourceOverride(client);
 const overrideBytes=JSON.stringify(override,null,2)+'\n';
 for(const name of ['Devast-io-Rust-Resource-Override.json','Devast-io-Rust-Resource-Override-Fixed.json'])fs.writeFileSync(path.join(dir,name),overrideBytes);
 const report={status:'built-not-browser-verified',owned_functions:manifest.functions.length,native_language:'JavaScript',owned_backend:'Rust/WebAssembly',native_source:status.source_url,native_input_sha256:status.output_sha256,output_sha256:hash(client),wasm_sha256:hash(wasm),bytes:Buffer.byteLength(client),native_outside_owned_modules:'byte-identical',publication:'not_published',live_server:'not_tested'};
 fs.writeFileSync(path.join(dir,'build.json'),JSON.stringify(report,null,2)+'\n');
 return{...report,dir};
}
function rustPath(){return path.join(root,'rust-mod');}
module.exports={packageClient,replaceOwned,pinNative,createResourceOverride};
if(require.main===module)console.log(JSON.stringify(packageClient(),null,2));
