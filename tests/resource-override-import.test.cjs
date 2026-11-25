const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createResourceOverride}=require('../tools/build_rust_client.cjs');
const importer=fs.readFileSync('tests/fixtures/resource-override/importExport.js','utf8');
function importConfig(config){
 const messages=[],toasts=[];
 const app={util:{showToast:message=>toasts.push(message)}};
 const scope={window:{app},$:{isArray:Array.isArray},chrome:{runtime:{sendMessage:message=>messages.push(message)}}};
 vm.runInNewContext(importer,scope);
 app.import(config.data,config.v);
 return{messages,toasts};
}
test('the actual Resource Override importer accepts our generated Rust JSON and retains Unicode payload',()=>{
 const code='/* Русский текст, ι̅᠍, Wasm */\nwindow.example = 1;';
 const config=JSON.parse(JSON.stringify(createResourceOverride(code)));
 const result=importConfig(config);
 assert.deepEqual(result.toasts,['Load Succeeded!']);assert.equal(result.messages.length,1);
 assert.equal(result.messages[0].action,'import');assert.equal(result.messages[0].data[0].rules[0].file,code);
});
test('the actual importer rejects the former domain and file IDs independently',()=>{
 for(const field of ['domain','file']){
  const config=createResourceOverride('client');
  if(field==='domain')config.data[0].id='rust-owned-mod';else config.data[0].rules[0].fileId='rust-client';
  const result=importConfig(config);assert.equal(result.messages.length,0);
  assert.deepEqual(result.toasts,['Load Failed: Invalid Resource Override JSON.']);
 }
});
test('the ready Rust JSON imports successfully and contains the exact verified client',()=>{
 const dir=['artifacts/rust-mod-fps3-2026-11-25/','artifacts/rust-mod-fps2-2026-11-25/','artifacts/rust-mod-fps-2026-11-24/','artifacts/rust-mod-2026-11-24-current/'].find(dir=>fs.existsSync(dir+'Devast-io-Rust-Resource-Override.json'));
 if(!dir)return;
 const config=JSON.parse(fs.readFileSync(dir+'Devast-io-Rust-Resource-Override.json','utf8'));
 const result=importConfig(config);assert.deepEqual(result.toasts,['Load Succeeded!']);
 assert.equal(result.messages[0].data[0].rules[0].file,fs.readFileSync(dir+'client.js','utf8'));
 assert.equal(fs.readFileSync(dir+'Devast-io-Rust-Resource-Override-Fixed.json','utf8'),fs.readFileSync(dir+'Devast-io-Rust-Resource-Override.json','utf8'));
});
