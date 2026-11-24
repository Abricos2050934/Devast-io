const fs=require('node:fs'),path=require('node:path');
const modules=new Map();
function runtime(dir){
 dir=path.resolve(dir);
 const wasmFile=path.join(dir,'pkg/mod_bg.wasm'),bytes=fs.readFileSync(wasmFile);
 const key=dir+':'+fs.statSync(wasmFile).mtimeMs;
 if(!modules.has(key))modules.set(key,new WebAssembly.Module(bytes));
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'function-manifest.json')));
 const entries=manifest.programs.slice(0,2).flatMap(p=>p.entries);
 const source=fs.readFileSync(path.join(dir,'bridge.js'),'utf8')+'\n'+fs.readFileSync(path.join(dir,'pkg/mod.js'),'utf8').replace('document.currentScript !== null','document.currentScript != null')+'\n'+
  'wasm_bindgen.initSync({module:__devastRustWasm});__devastRustOps.attach(wasm_bindgen);\n'+
  'var __devastRustEnv=__devastRustOps.op("root",[globalThis]);wasm_bindgen.run_program(0,__devastRustEnv);wasm_bindgen.run_program(1,__devastRustEnv);\n'+
  entries.map(name=>'var '+name+'=__devastRustOps.read(__devastRustEnv,'+JSON.stringify(name)+');').join('\n');
 return{source,module:modules.get(key)};
}
function install(context,dir){const r=runtime(dir);Object.assign(context,{__devastRustWasm:r.module,TextDecoder,TextEncoder,URL,queueMicrotask,WebAssembly});require('node:vm').runInContext(r.source,context,{timeout:10000});return r;}
module.exports={runtime,install};
