const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {loader,configuration,URL}=require('../tools/rust_auto_loader.cjs');
const client=version=>`window.__devastRustInfo=Object.freeze({backend:'Rust/WebAssembly'});window.version=${version};window.__devastMod={};window.__devastClientLoaded=true;`;
function fixture(){let status=200,body=client(1),calls=[];const context=vm.createContext({console:{error(){}},window:{},XMLHttpRequest:class{open(...a){calls.push(a);}send(){this.status=status;this.responseText=body;}}});return{context,calls,set(s,b){status=s;body=b;},run(){vm.runInContext(loader(),context);}};}
test('Rust loader uses the separate cache-busted synchronous URL and installs once',()=>{
 const f=fixture();f.run();f.run();assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'GET');assert.ok(f.calls[0][1].startsWith(URL+'?t='));assert.equal(f.calls[0][2],false);assert.equal(f.context.window.__devastRustRemoteLoader.state,'loaded');
 const c=configuration();assert.equal(c.v,1);assert.equal(c.data[0].id,'d1');assert.equal(c.data[0].rules[0].fileId,'f1');
});
test('Rust loader rejects HTTP errors, HTML and JS clients, then permits retry',()=>{
 for(const [status,body]of [[403,client(1)],[200,'<html>error</html>'],[200,'window.__devastMod={};']]){
  const f=fixture();f.set(status,body);f.run();assert.equal(f.context.window.__devastRustRemoteLoader.state,'failed');assert.equal(f.context.window.__devastMod,undefined);
  f.set(200,client(2));f.run();assert.equal(f.context.window.version,2);assert.equal(f.context.window.__devastRustRemoteLoader.state,'loaded');
 }
});
test('the same loader imports a new remote version on the next page load',()=>{const a=fixture();a.run();const b=fixture();b.set(200,client(3));b.run();assert.equal(a.context.window.version,1);assert.equal(b.context.window.version,3);});
