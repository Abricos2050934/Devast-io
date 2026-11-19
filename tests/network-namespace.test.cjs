const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../tools/updater/static.cjs'),{namespaceByExports}=require('../tools/updater/network-contracts.cjs');
const {loginSkinArgument}=require('../tools/updater/network-contracts.cjs');
test('login skin compatibility accepts the native nickname and preflight shape only',()=>{
 for(const skin of ['0','account.selectedSkin()']){
  const a=analyze('function login(){network.prepare(url, function(){network.join(document.getElementById("nicknameInput").value,'+skin+');});}');
  const fn=a.functions.find(fn=>fn.id?.name==='login');
  assert.ok(loginSkinArgument(a,fn));
 }
 for(const source of [
  '()=>1',
  'function login(){network.prepare(url, function(){network.join(document.getElementById("passwordInput").value,account.selectedSkin());});}',
  'function login(){network.prepare(url, function(){network.join(document.getElementById("nicknameInput").value,account.selectedSkin(1));});}',
 ]){
  const a=analyze('('+source+');');
  assert.equal(loginSkinArgument(a,a.functions[0]),null);
 }
});
function fixture(source){const a=analyze('(()=>{'+source+'})();');return {a,body:a.tree.body[0].expression.callee.body.body};}
test('native namespace discovery uses lexical export identities despite repeated local names',()=>{
 const {a,body}=fixture('var first=(function(){function init(){return 1}function send(){return 2}function close(){return 3}return {init,send,close};})();var second=(function(){function init(){return 1}function send(){return 2}function close(){return 3}return {init,send,close};})();');
 const scope=body[1].declarations[0].init.callee,anchors=scope.body.body.filter(n=>n.type==='FunctionDeclaration');
 assert.equal(namespaceByExports(a,body,anchors).name,'second');
 assert.throws(()=>namespaceByExports(a,body,anchors.slice(0,2)),/Insufficient/);
 const elsewhere=body[0].declarations[0].init.callee.body.body.find(n=>n.type==='FunctionDeclaration');
 assert.throws(()=>namespaceByExports(a,body,[anchors[0],anchors[1],elsewhere]),/ambiguous or changed/);
});
test('shared export names or a changed export table cannot select an ambiguous native namespace',()=>{
 const {a,body}=fixture('function one(){}function two(){}function three(){}var first=(function(){return {one,two,three};})();var second=(function(){return {one,two,three};})();');
 assert.throws(()=>namespaceByExports(a,body,body.filter(n=>n.type==='FunctionDeclaration')),/ambiguous/);
});
test('decoded sloppy block functions retain their unique function-scope namespace exports',()=>{
 const {a,body}=fixture('var native=(function(){{function first(){return 1}function second(){return 2}function third(){return 3}}return {first,second,third};})();');
 const scope=body[0].declarations[0].init.callee,anchors=scope.body.body[0].body;
 assert.equal(namespaceByExports(a,body,anchors).name,'native');
});
