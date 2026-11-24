const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
const mod=args[0]||path.join(root,'rust-mod');
const files=[...require('../mod/contract.json').candidate_tests,'tests/resource-override.test.cjs','tests/rust-runtime.test.cjs'];
const r=spawnSync(process.execPath,['--test',...files],{cwd:root,stdio:'inherit',env:{...process.env,DEVAST_RUST_MOD:mod}});
if(r.error)throw r.error;process.exitCode=r.status??1;
