const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib');
const {fixture}=require('./mod-fixture.cjs'),{reference}=require('../tools/audit_ilm_port.cjs'),{verifyIlmMouse}=require('../tools/verify_ilm_native_pipeline.cjs');
test('native camera, client mouse coordinates and target/angle match the original ILM frame hook at every canvas ratio',()=>{
 const f=fixture({dom:true}),s=Object.fromEntries(['ᅠᏧ‍','ᴎ︃ᄉ','а༤̘','еߎ༢'].map(k=>[k,k]));let view={x:0,y:0,scale:1};
 f.B.synchronizedRender=true;f.B.view=()=>({...view,ctx:f.dom.canvas.getContext('2d')});
 const n={...f.B,playerType:1,ctx:f.dom.canvas.getContext('2d'),get view(){return view;},set view(v){view=v;},capturePackets:()=>({packets:f.packets,restore(){}})};
 try{const r=verifyIlmMouse(f.mod,n,s,reference(),JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz'))));assert.equal(r.cases,18);assert.equal(r.exact_target_and_sent_angle,true);}finally{f.mod.dispose();}
});
test('server-angle reference belongs to the recorded original ILM source',()=>{
 const r=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-native-angle-reference.json.gz'))),original=JSON.parse(fs.readFileSync('verification/ilm-original-source-2026-11-02.json'));
 assert.equal(r.upload_sha256,original.upload_sha256);assert.equal(r.decoded_sha256,original.decoded_script_sha256);
 assert.deepEqual(r.blocks.map(b=>b.name),['_0x4046e9','_0x48f251','_0x1f227b']);
 assert.equal(r.blocks[2].source,JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz'))).find(b=>b.name==='_0x1f227b').source);
});
test('zero position IDs stay inactive exactly as in the uploaded ILM receiver, while zero removals reset lines',()=>{
 const f=fixture(),old=require('./ilm-oracle.cjs').oracle(f.mod.settings);
 try{
  for(const[type,kind]of [[0,'players'],[13,'ghouls']]){
   f.mod.trackPacket(type===0?1:13,0,0,1100,1000,true);old.packet({type,id:0,uid:0,x:1100,y:1000});
   assert.equal(f.mod.targets[kind][0].active,false);assert.equal(old.snapshot()[kind].some(p=>p.id===0),false);
  }
  f.mod.targets.lines[0].reset(10,20,30,40);f.mod.trackPacket(1,0,0,0,0,false);
  assert.equal(f.mod.targets.lines[0].x1,undefined,'Do not suppress the source zero-slot removal reset');
 }finally{f.mod.dispose();}
});
