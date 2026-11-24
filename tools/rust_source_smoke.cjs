// Smoke test that needs Rust artifacts, browser doubles and no TypeScript sources.
process.env.DEVAST_RUST_MOD=require('node:path').resolve(__dirname,'../rust-mod');
const assert=require('node:assert/strict'),vm=require('node:vm'),{fixture,menu}=require('../tests/mod-fixture.cjs');
const f=fixture({adaptive:true,dom:true});
try{
 const gui=menu(f);assert.ok(gui.__folders['Adaptive Aim']);
 f.mod.setSetting('VideoAimEnabled',true);assert.equal(f.mod.settings.VideoAimEnabled,true);
 f.mod.setSetting('VideoAimEnabled',false);
 let now=1000;
 const aim=f.context.__createBallisticAim({predictionAutoSpeed:true,predictionLatencyMs:0,bulletSpeedCoefficient:1.4},()=>now);
 for(const t of [-200,-150,-100,-50,0]){now=1000+t;aim.track('self',0,0,true,{weapon:10});aim.track('target',500,200*t/1000,true);}
 const result=aim.resolve('self','target',{speed:1400,range:900});
 assert.equal(result.valid,true);assert.ok(Math.abs(result.flight-500/Math.sqrt(1400**2-200**2))<1e-7);
 assert.ok(Math.abs(Math.sin(result.angle*Math.PI/180)-200/1400)<1e-7);
 vm.runInContext('globalThis.__rustDispatches=0;const __savedDispatch=wasm_bindgen.dispatch;wasm_bindgen.dispatch=(...a)=>{__rustDispatches++;return __savedDispatch(...a)};',f.context);
 f.mod.setSetting('AimBotEnabled',true);assert.ok(f.context.__rustDispatches>0);
 f.mod.dispose();assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);
 console.log(JSON.stringify({status:'passed',backend:'Rust/WebAssembly',gui:true,settings:true,analytic_intercept:true,wasm_dispatch:true,cleanup:true}));
}finally{if(f.timers.size)f.mod.dispose();}
