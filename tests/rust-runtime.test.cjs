const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {fixture}=require('./mod-fixture.cjs');
test('Rust migration includes every owned function and all four runtime modules',()=>{
 const manifest=JSON.parse(fs.readFileSync('rust-mod/function-manifest.json'));
 const rust=fs.readFileSync('rust-mod/src/generated.rs','utf8');
 assert.equal(manifest.programs.length,4);
 assert.equal(manifest.functions.length,406);
 assert.equal((rust.match(/(?:async )?fn f_\d+\(/g)||[]).length,manifest.functions.length);
 for(const item of manifest.functions)assert.ok(rust.includes('fn f_'+item.id+'('),'Missing function '+item.name);
 const bytes=fs.readFileSync('rust-mod/pkg/mod_bg.wasm');
 const names=WebAssembly.Module.exports(new WebAssembly.Module(bytes)).map(x=>x.name);
 assert.ok(names.includes('dispatch')&&names.includes('run_program'));
});
test('the Rust runtime handles settings, target tracking and cleanup through actual WebAssembly dispatch',{skip:!process.env.DEVAST_RUST_MOD},()=>{
 const f=fixture();try{
  assert.ok(process.env.DEVAST_RUST_MOD,'Run this suite with the Rust backend');
  vm.runInContext('globalThis.rustCalls=0;const actualDispatch=wasm_bindgen.dispatch;wasm_bindgen.dispatch=(...a)=>{rustCalls++;return actualDispatch(...a)};',f.context);
  f.mod.setSetting('AimBotEnabled',true);f.mod.trackPacket(1,1,1,1000,1000,true);f.mod.trackPacket(1,2,1,1200,1100,true);
  assert.ok(Number.isFinite(f.mod.aim.resolve()));assert.ok(f.context.rustCalls>5);
  f.mod.dispose();assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);
 }finally{if(f.timers.size)f.mod.dispose();}
});
