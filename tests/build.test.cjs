const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib');
const {spawnSync}=require('node:child_process');
const {translate}=require('../tools/translate_payload.cjs');

test('translation changes own identifiers and binding strings, preserving comments and unrelated text',()=>{
  const result=translate('/* старое */ const поле = obj.поле; const key="поле"; const text="other";',{'поле':'currentField'});
  assert.equal(result,'/* старое */ const currentField = obj.currentField; const key="currentField"; const text="other";');
});

for(const scenario of ['unknown-baseline','ambiguous-anchor'])test('build preserves previous JS and status on '+scenario,()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'devast-build-'));
  try{
    for(const dir of ['tools','baselines','patches','mod','vendor'])fs.cpSync(dir,path.join(root,dir),{recursive:true});
    fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'));
    fs.mkdirSync(path.join(root,'dist'));
    fs.writeFileSync(path.join(root,'dist/game.modded.js'),'previous verified client');
    fs.writeFileSync(path.join(root,'dist/update-status.json'),'previous status');
    if(scenario==='unknown-baseline'){
      const file=path.join(root,'baselines/current.js.gz');const data=zlib.gunzipSync(fs.readFileSync(file));data[20]^=1;fs.writeFileSync(file,zlib.gzipSync(data));
    }else{
      const file=path.join(root,'patches/recovered-current.json');const data=JSON.parse(fs.readFileSync(file));data.operations[0].before='var ';fs.writeFileSync(file,JSON.stringify(data));
    }
    const result=spawnSync(process.execPath,['tools/build_client.cjs'],{cwd:root,encoding:'utf8'});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,scenario==='unknown-baseline'?/Unsupported baseline/:/exactly one anchor/);
    assert.equal(fs.readFileSync(path.join(root,'dist/game.modded.js'),'utf8'),'previous verified client');
    assert.equal(fs.readFileSync(path.join(root,'dist/update-status.json'),'utf8'),'previous status');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('native disconnect before a WebSocket exists does not throw, and closes an existing socket once',()=>{
 const vm=require('node:vm'),profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
 const patch=profile.operations.find(p=>p.id==='native-disconnect-without-socket');assert.ok(patch);
 const ctx=vm.createContext({console:{log(){}},'ϲܛ̈':'log','оᴌ︈':{state:0},'ɑρ̈':'state','іܐᄆ':'state','ᅟވ̝':{'ᅠ͠ᄈ':256,'ﾠ५︅':64},'І̎ܘ':undefined,'ﾠ३ᴇ':'close'});
 vm.runInContext(patch.after+'\nⲣ๔І();',ctx,{timeout:1000});assert.equal(ctx['оᴌ︈'].state,64);
 let closed=0;ctx['І̎ܘ']={close(){closed++;}};vm.runInContext('ⲣ๔І();',ctx,{timeout:1000});assert.equal(closed,1);
 const sources=[];ctx.__responsiveMod={observeCloseRequest:s=>sources.push(s)};
 ctx['І̎ܘ'].readyState=1;vm.runInContext('ⲣ๔І();',ctx,{timeout:1000});assert.deepEqual(sources,['native-network-close']);
 ctx['І̎ܘ'].readyState=3;vm.runInContext('ⲣ๔І();',ctx,{timeout:1000});assert.equal(sources.length,1);assert.equal(closed,3);
});

test('build fingerprints identify different assembled inputs reproducibly',()=>{
 const {assemble,hash}=require('../tools/build_client.cjs'),acorn=require('../tools/parser.cjs');
 const baseline="(function(){'use strict';window.boot=true;})();";
 const profile={baseline_sha256:hash(baseline),operations:[],bootstrap_anchor:'window.boot=true;',guard_anchor:"(function(){'use strict';"};
 const stamp=s=>acorn.parse(s,{ecmaVersion:'latest'}).body[0].expression.callee.body.body.flatMap(n=>n.declarations||[]).find(n=>n.id.name==='__devastClientBuild').init.arguments[0].properties.find(p=>p.key.name==='fingerprint'||p.key.value==='fingerprint').value.value;
 const a=assemble(baseline,profile,{},'function install(){return 1;}','','');
 assert.equal(a,assemble(baseline,profile,{},'function install(){return 1;}','',''));
 assert.match(stamp(a),/^[a-f0-9]{64}$/);assert.notEqual(stamp(a),stamp(assemble(baseline,profile,{},'function install(){return 2;}','','')));
});

test('native receive watchdog observation retains its original close threshold and never suppresses a close',()=>{
 const vm=require('node:vm'),profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
 const patch=profile.operations.find(p=>p.id==='native-receive-timeout-diagnostics');assert.ok(patch);
 let closed=0;const sources=[];
 const ctx=vm.createContext({'ⲣ༩༢':0,'օܔߒ':10000,'ε̄０':0,'ᴉ̡̂':15000,'іᴀ︎':15000,'ⲣ๔І':()=>closed++,__responsiveMod:{observeCloseRequest:s=>sources.push(s)}});
 vm.runInContext(patch.after+';ܐܚᚊ();',ctx,{timeout:1000});assert.equal(closed,0);
 ctx['ᴉ̡̂']=15001;vm.runInContext('ܐܚᚊ();',ctx,{timeout:1000});assert.equal(closed,1);assert.deepEqual(sources,['native-receive-timeout']);
 vm.runInContext('ܐܚᚊ();',ctx,{timeout:1000});assert.equal(closed,1);
});

test('entry timeout is observed before its first native socket close, including the final attempt',()=>{
 const vm=require('node:vm'),profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
 const patch=profile.operations.find(p=>p.id==='native-entry-timeout-diagnostics');assert.ok(patch);
 for(const previousAttempts of [0,2]){
  const events=[];const ctx=vm.createContext({'аⲣᚇ':previousAttempts,'І༩̂':3,'І̎ܘ':{close(){events.push('socket-close');}},'ѕ︂︀':'close','ⲣ๔І':()=>events.push('network-close'),'оᴌ︈':{state:0,flags:0},'іܐᄆ':'state','ᴇ᠍ߎ':'flags','ᅟވ̝':{'ᴄε̋':0,'ﾠ५︅':64},'а̡̡':0,'а༥ᄂ':()=>{},__responsiveMod:{observeCloseRequest:s=>events.push(s)}});
  vm.runInContext(patch.after+';е５̗();',ctx,{timeout:1000});
  assert.equal(events[0],'native-entry-timeout');assert.equal(events[1],'socket-close');assert.equal(ctx['аⲣᚇ'],previousAttempts+1);
  assert.equal(events.includes('network-close'),previousAttempts===0);
 }
});

test('native malformed saved session ID reaches its intended finite fallback without changing stored identity',()=>{
 const vm=require('node:vm'),acorn=require('../tools/parser.cjs'),profile=JSON.parse(fs.readFileSync('patches/recovered-current.json'));
 const patch=profile.operations.find(p=>p.id==='native-invalid-session-id-guard');assert.ok(patch);
 const root=acorn.parse(patch.after,{ecmaVersion:'latest'}),todo=[root];let guard;
 while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;if(n.type==='IfStatement'&&n.test.type==='UnaryExpression'&&n.test.operator==='!'&&n.test.argument.callee?.property?.name==='isFinite')guard=n;for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}}
 assert.ok(guard);const id=guard.test.argument.arguments[0].name;
 const rhs=guard.consequent.expression.right;
 const fallbackAlias=rhs.argument.name;
 for(const initial of [NaN,Infinity,42]){
  const ctx=vm.createContext({[id]:initial,[fallbackAlias]:1});vm.runInContext(patch.after.slice(guard.start,guard.end),ctx,{timeout:1000});
  assert.equal(ctx[id],Number.isFinite(initial)?initial:-1);
 }
});
