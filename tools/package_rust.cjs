const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const stage=fs.mkdtempSync(path.join(os.tmpdir(),'devast-rust-source-'));
function copy(file){const dest=path.join(stage,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);}
function tree(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())tree(p);else if(e.isFile()&&!p.endsWith('.d.ts'))copy(p);}}
for(const dir of ['rust-mod/src','rust-mod/pkg','rust-mod/native-base'])tree(dir);
for(const file of ['rust-mod/Cargo.toml','rust-mod/Cargo.lock','rust-mod/bridge.js','rust-mod/function-manifest.json','rust-mod/README.md','tools/build_rust.cjs','tools/build_rust_client.cjs','tools/parser.cjs','tools/rust_fixture.cjs','tools/rust_source_smoke.cjs','tests/mod-fixture.cjs','tests/dom-fixture.cjs'])copy(file);
fs.copyFileSync(path.join(root,'rust-mod/README.md'),path.join(stage,'README.md'));
const pkg={name:'devast-rust-mod-source',version:'0.1.0',private:true,scripts:{build:'node tools/build_rust_client.cjs','build:wasm':'node tools/build_rust.cjs',test:'node tools/rust_source_smoke.cjs'},devDependencies:{acorn:'8.15.0'}};
fs.writeFileSync(path.join(stage,'package.json'),JSON.stringify(pkg,null,2)+'\n');
const original=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));
const lock={name:pkg.name,version:pkg.version,lockfileVersion:3,requires:true,packages:{'':{name:pkg.name,version:pkg.version,devDependencies:pkg.devDependencies},'node_modules/acorn':original.packages['node_modules/acorn']}};
fs.writeFileSync(path.join(stage,'package-lock.json'),JSON.stringify(lock,null,2)+'\n');
const archive=path.join(root,'artifacts/rust-mod-2026-11-24/Devast-io-Rust-source.zip');
const r=spawnSync('zip',['-q','-r',archive,'.'],{cwd:stage,stdio:'inherit'});if(r.error)throw r.error;if(r.status)throw Error('Source archive failed');
console.log(JSON.stringify({archive,clean_source_directory:stage,contains_typescript:false}));
