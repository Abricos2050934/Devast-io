const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const loader=fs.readFileSync('resource-override/loader.js','utf8');
const config=JSON.parse(fs.readFileSync('resource-override/Devast-io-GitHub-Resource-Override.json','utf8'));
function fixture(responses){
 const calls=[],errors=[];let index=0;
 class XHR {open(method,url,async){calls.push({method,url,async});}send(){const response=responses[index++];if(response instanceof Error)throw response;this.status=response.status;this.responseText=response.body;}}
 const scope={XMLHttpRequest:XHR,console:{error(...args){errors.push(args);}},Date:{now:()=>1234567}};scope.window=scope;
 const context=vm.createContext(scope);return {context,calls,errors,run:()=>vm.runInContext(loader,context,{timeout:1000})};
}
const client=version=>'function __installDevastMod(){} function __createIlmAim(){} window.__devastClientLoaded=true;window.__devastMod={version:'+version+'};';
test('Resource Override v1 schema and embedded loader match the supplied format',()=>{
 assert.equal(config.v,1);assert.equal(config.data.length,1);const group=config.data[0];assert.equal(group.matchUrl,'https://devast.io/*');assert.equal(group.on,true);assert.equal(group.rules.length,1);
 const rule=group.rules[0];assert.deepEqual(Object.keys(rule).sort(),['file','fileId','match','on','type']);assert.equal(rule.type,'fileOverride');assert.equal(rule.match,'**://devast.io/js/*.js');assert.equal(rule.on,true);assert.equal(rule.file.replace(/\r\n/g,'\n'),loader);
});
test('loader fetches our current stable JS synchronously with cache busting, and starts it once',()=>{
 const f=fixture([{status:200,body:client(1)}]);f.run();assert.deepEqual(f.calls,[{method:'GET',url:'https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/game.modded.js?t=1234567',async:false}]);assert.equal(f.context.__devastMod.version,1);assert.equal(f.context.__devastRemoteLoader.state,'loaded');f.run();assert.equal(f.calls.length,1);
});
test('same JSON loads a newly published client after a fresh page load',()=>{
 for(const version of [1,2]){const f=fixture([{status:200,body:client(version)}]);f.run();assert.equal(f.context.__devastMod.version,version);}
});
test('HTTP errors, network failures and HTML do not execute a game client',()=>{
 for(const response of [{status:403,body:client(1)},{status:503,body:''},{status:200,body:'<html>error</html>'},new Error('network')]){const f=fixture([response]);f.run();assert.equal(f.context.__devastRemoteLoader.state,'failed');assert.equal(f.context.__devastMod,undefined);assert.equal(f.errors.length,1);}
});
test('a failed request can retry, but an already running client is never loaded twice',()=>{
 const f=fixture([{status:503,body:''},{status:200,body:client(2)}]);f.run();f.run();assert.equal(f.context.__devastMod.version,2);assert.equal(f.calls.length,2);
 const g=fixture([]);g.context.__devastClientLoaded=true;g.run();assert.equal(g.calls.length,0);
});
