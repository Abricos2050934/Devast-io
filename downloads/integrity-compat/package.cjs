// Package a pinned published client; do not alter the main update channel.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const {analyze} = require(path.join(root, 'tools/updater/static.cjs'));
const parser = require(path.join(root, 'tools/parser.cjs'));
const [input, manifestPath, output] = process.argv.slice(2);
assert.ok(input && manifestPath && output, 'Usage: node package.cjs original.js current.json output-directory');
const src = fs.readFileSync(input, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
assert.equal(hash(src), manifest.output_sha256, 'Published client hash mismatch');
const analysis = analyze(src);
const edits = [];
for (const node of analysis.nodes) {
  if (node.type !== 'BinaryExpression' || node.operator !== '===' || node.left.name !== 'ѕ०̊') continue;
  assert.equal(analysis.constant(node.right), 1, 'Unknown integrity predicate');
  edits.push({start:node.start, end:node.end, before:src.slice(node.start,node.end), after:'false'});
}
assert.equal(edits.length, 3, 'Expected three reviewed integrity predicates');
let parts = [], cursor = 0;
for (const edit of edits.sort((a,b)=>a.start-b.start)) {
  parts.push(src.slice(cursor,edit.start),edit.after);
  cursor=edit.end;
}
parts.push(src.slice(cursor));
let result=parts.join('');
function replaceOnce(before,after) {
  assert.equal(result.split(before).length,2,'Ambiguous report insertion');
  result=result.replace(before,after);
}
const event='function connectionEvent(type, details = {}) {';
replaceOnce(event,event+'\n    details = {...details, integrityFlag:typeof ѕ०̊ === "number" ? ѕ०̊ : null, jitter:!!MOD.JitterEnabled, autoBuild:!!MOD.AutoBuiledEnabled};');
// Locate the report object structurally, preserving the current recovery version.
const updated=analyze(result);
const info=updated.functions.filter(node=>node.id?.name==='connectionInfo');
assert.equal(info.length,1);
const returns=info[0].body.body.filter(node=>node.type==='ReturnStatement' && node.argument?.type==='ObjectExpression');
assert.equal(returns.length,1);
const at=returns[0].argument.start+1;
result=result.slice(0,at)+'auditBuild:"integrity-compat-v2",integrityFlag:typeof ѕ०̊ === "number" ? ѕ०̊ : null,'+result.slice(at);
parser.parse(result,{ecmaVersion:'latest'});
// Check every function declaration, including those inside decoded native blocks.
function declarations(code) {
  const nodes=[],parents=new WeakMap();
  function walk(node,parent) {
    if(!node || typeof node!=='object')return;
    if(parent)parents.set(node,parent);
    if(node.type==='FunctionDeclaration')nodes.push(node);
    for(const value of Object.values(node)) {
      if(Array.isArray(value))for(const child of value)walk(child,node);
      else if(value && typeof value==='object')walk(value,node);
    }
  }
  walk(parser.parse(code,{ecmaVersion:'latest'}));
  return {nodes,parents};
}
const old=declarations(src),next=declarations(result);
assert.equal(old.nodes.length,next.nodes.length);
const allowed=new Set(['а１๐','ⲅࡃ०','ܐ̄︁','__installDevastMod']);
const changed=[];
for(let i=0;i<old.nodes.length;i++) {
  const a=old.nodes[i],b=next.nodes[i];
  assert.equal(a.id.name,b.id.name);
  if(src.slice(a.start,a.end)===result.slice(b.start,b.end))continue;
  let ancestor=a,owner;
  while(ancestor) {
    if(allowed.has(ancestor.id?.name)){owner=ancestor.id.name;break;}
    ancestor=old.parents.get(ancestor);
  }
  assert.ok(owner,'Unexpected changed function: '+a.id.name);
  changed.push({name:a.id.name,owner});
}
assert.ok(!changed.some(row=>row.name==='__createIlmAim'),'ILM core changed');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'game.integrity-compat.js'),result);
const basename=new URL(manifest.source_url).pathname.split('/').pop();
assert.match(basename,/^[A-Za-z0-9_-]+\.js$/);
const config={v:1,data:[{id:'integrity-compat-v2',matchUrl:'https://devast.io/*',rules:[{
  type:'fileOverride',match:'**://devast.io/js/'+basename+'*',file:result,fileId:'integrity-compat-file',on:true
}],on:true}]};
fs.writeFileSync(path.join(output,'Devast-io-Integrity-Compat-Resource-Override.json'),JSON.stringify(config,null,2)+'\n');
fs.writeFileSync(path.join(output,'source-current.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(output,'patch-report.json'),JSON.stringify({
  audit_build:'integrity-compat-v2',source_release:manifest.release,source_sha256:hash(src),output_sha256:hash(result),
  edits,scope_verified:true,changed_functions:changed,ilm_core_unchanged:true,parse_verified:true,live_server_tested:false
},null,2)+'\n');
console.log('Packaged '+manifest.release+'; syntax and change scope verified.');
