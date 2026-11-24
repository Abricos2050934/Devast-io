const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),rust=path.join(root,'rust-mod');
function configuration(){
 const custom=fs.existsSync('/tmp/devast-rust/cargo/bin/cargo');
 const env=custom?{...process.env,CARGO_HOME:'/tmp/devast-rust/cargo',RUSTUP_HOME:'/tmp/devast-rust/rustup'}:{...process.env};
 return{env,cargo:process.env.CARGO||(custom?'/tmp/devast-rust/cargo/bin/cargo':'cargo'),bindgen:process.env.WASM_BINDGEN||(custom?'/tmp/devast-rust/cargo/bin/wasm-bindgen':'wasm-bindgen')};
}
function run(command,args,env){const r=spawnSync(command,args,{cwd:root,stdio:'inherit',env});if(r.error)throw r.error;if(r.status!==0)throw Error(command+' failed with '+r.status);}
function build({nativeBindings=null}={}){
 const write=(file,data)=>{const bytes=Buffer.isBuffer(data)?data:Buffer.from(data);if(!fs.existsSync(file)||!fs.readFileSync(file).equals(bytes))fs.writeFileSync(file,bytes);};
 const cfg=configuration();let manifest=path.join(rust,'Cargo.toml'),out=path.join(rust,'pkg');
 if(nativeBindings){
  const scratch=path.join(rust,'.native-build');fs.mkdirSync(path.join(scratch,'src'),{recursive:true});
  for(const file of ['Cargo.toml','Cargo.lock','src/lib.rs'])write(path.join(scratch,file),fs.readFileSync(path.join(rust,file)));
  let source=fs.readFileSync(path.join(rust,'src/generated.rs'),'utf8');
  source=source.split(/(?=\/\/ @program )/).map(section=>{
   if(!/^\/\/ @program [12]\n/.test(section))return section;
   for(const [canonical,native]of Object.entries(nativeBindings))section=section.split(JSON.stringify(canonical)).join(JSON.stringify(native));
   return section;
  }).join('');
  write(path.join(scratch,'src/generated.rs'),source);
  manifest=path.join(scratch,'Cargo.toml');out=path.join(rust,'native/pkg');fs.mkdirSync(out,{recursive:true});
  for(const file of ['bridge.js','function-manifest.json'])fs.copyFileSync(path.join(rust,file),path.join(rust,'native',file));
  fs.writeFileSync(path.join(rust,'native/bindings.json'),JSON.stringify({symbols:nativeBindings},null,2)+'\n');
 }
 run(cfg.cargo,['build','--manifest-path',manifest,'--target','wasm32-unknown-unknown','--release','--locked','--target-dir',path.join(rust,'target')],cfg.env);
 fs.mkdirSync(out,{recursive:true});
 run(cfg.bindgen,[path.join(rust,'target/wasm32-unknown-unknown/release/devast_owned_mod.wasm'),'--target','no-modules','--out-dir',out,'--out-name','mod'],cfg.env);
 return out;
}
module.exports={build,configuration,run};
if(require.main===module)console.log(JSON.stringify({status:'compiled',output:build()}));
