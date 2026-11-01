// Structural comparison against the isolated declarations from the user's upload.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const a=require('./parser.cjs'),{names,clean}=require('./extract_ilm_aim.cjs');
const options={ecmaVersion:'latest'};
function normalize(node){if(Array.isArray(node))return node.map(normalize);if(!node||typeof node!=='object')return node;return Object.fromEntries(Object.entries(node).filter(([k])=>!['start','end','raw'].includes(k)).map(([k,v])=>[k,normalize(v)]));}
function audit(){
 const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-reference.json.gz')));
 const src=fs.readFileSync('mod/ilm-aim.js','utf8'),factory=a.parse(src,options).body.find(n=>n.id?.name==='__createIlmAim');
 let methods=0,aliases=0;const declarations=[];
 for(const name of names){
  const block=ref.blocks.find(b=>b.name===name),cleaned=clean(block.source);
  const expected=a.parse(cleaned.source,options).body[0];const actual=factory.body.body.filter(n=>n.id?.name===name);
  assert.equal(actual.length,1,'Missing/duplicated original declaration '+name);
  assert.deepEqual(normalize(actual[0]),normalize(expected),'Changed ILM AST '+name);
  if(expected.type==='ClassDeclaration')methods+=expected.body.body.length;
  aliases+=cleaned.removed;declarations.push(name);
 }
 const payload=fs.readFileSync('mod/responsive.js','utf8');
 for(const forbidden of ['class GetAllTargetsCon','class AimbotCon','Aimbot.resolve =','Aimbot.wannaFire =','lastFireKey','target.revision'])assert.ok(!payload.includes(forbidden),'Old replacement remains: '+forbidden);
 const out={upload_sha256:ref.upload_sha256,core_sha256:crypto.createHash('sha256').update(src).digest('hex'),declarations,classes:4,methods_including_constructors:methods,tick_functions:1,removed_unused_decoder_aliases:aliases,ast_parity:'exact_after_dead_decoder_alias_removal'};
 return out;
}
if(require.main===module){const report=audit();fs.writeFileSync('build/ilm-upload/port-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
module.exports={audit};
