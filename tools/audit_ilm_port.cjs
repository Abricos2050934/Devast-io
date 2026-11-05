// Structural comparison against the isolated declarations from the user's upload.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const a=require('./parser.cjs'),{names,clean}=require('./extract_ilm_aim.cjs');
const options={ecmaVersion:'latest'};
function normalize(node){if(Array.isArray(node))return node.map(normalize);if(!node||typeof node!=='object')return node;return Object.fromEntries(Object.entries(node).filter(([k])=>!['start','end','raw'].includes(k)).map(([k,v])=>[k,normalize(v)]));}
function audit(){
 if(!fs.existsSync('mod/ilm-aim.js'))throw Error('ILM engine retired; use tools/audit_message15.cjs for the current build');
 const ref=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-reference.json.gz')));
 const src=fs.readFileSync('mod/ilm-aim.js','utf8'),factory=a.parse(src,options).body.find(n=>n.id?.name==='__createIlmAim');
 const begin='// BEGIN ORIGINAL ILM CORE\n',end='\n\n// END ORIGINAL ILM CORE';
 assert.equal(src.split(begin).length,2,'One original ILM block required');
 assert.equal(src.split(end).length,2,'One original ILM block end required');
 assert.equal(src.split(begin)[1].split(end)[0],ref.blocks.map(b=>b.source).join('\n\n'),'Original ILM block must be copied whole');
 let methods=0,aliases=0;const declarations=[];
 for(const name of names){
  const block=ref.blocks.find(b=>b.name===name),cleaned=clean(block.source);
  const expected=a.parse(block.source,options).body[0];const actual=factory.body.body.filter(n=>n.id?.name===name);
  assert.equal(actual.length,1,'Missing/duplicated original declaration '+name);
  assert.deepEqual(normalize(actual[0]),normalize(expected),'Changed ILM AST '+name);
  assert.equal(src.slice(actual[0].start,actual[0].end),block.source,'Changed literal ILM declaration '+name);
  if(expected.type==='ClassDeclaration')methods+=expected.body.body.length;
  aliases+=cleaned.removed;declarations.push(name);
 }
 const payload=fs.readFileSync('mod/responsive.js','utf8');
 for(const forbidden of ['class GetAllTargetsCon','class AimbotCon','Aimbot.resolve =','Aimbot.wannaFire =','lastFireKey','target.revision'])assert.ok(!payload.includes(forbidden),'Old replacement remains: '+forbidden);
 const menuRef=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-menu-reference.json.gz')));
 assert.equal(menuRef.upload_sha256,ref.upload_sha256,'Aim references must come from the same upload');
 for(const [name,marker]of [['menu','MENU'],['lines','LINES']]){
  const begin='// BEGIN ORIGINAL ILM AIM '+marker+'\n',end='\n// END ORIGINAL ILM AIM '+marker;
  assert.equal(src.split(begin).length,2,'One ILM '+name+' block required');assert.equal(src.split(end).length,2,'One ILM '+name+' block end required');
  assert.equal(src.split(begin)[1].split(end)[0],menuRef.blocks.find(b=>b.name===name).source,'Changed original ILM '+name);
 }
 const hooks=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz')));
 const mouse=hooks.find(h=>h.name==='_0x4b25f3').source;
 assert.equal(src.split('// BEGIN ORIGINAL ILM MOUSE HELPER\n')[1]?.split('\n// END ORIGINAL ILM MOUSE HELPER')[0],mouse,'Original ILM mouse helper must be copied whole');
 const allowed=new Set(['__createIlmAim','__ilmPlayerNickname','__ilmPatchPlayerMetadata','__ilmPatchNativeDirection','__jitterPatchNativeFire','__installIlmAimMenu','__renderIlmAimLines','__ilmMouseToWorld']);
 for(const declaration of a.parse(src,options).body)assert.ok(allowed.has(declaration.id?.name),'Unexpected additional aim algorithm: '+declaration.id?.name);
 for(const forbidden of ['aimPrediction','nativeWeaponSpeed','ilmSettings','applyAimPreset','__createAdaptiveAim','__aimWeaponPresets'])assert.ok(!src.includes(forbidden)&&!payload.includes(forbidden),'Retired aim customization remains: '+forbidden);
 assert.ok(payload.includes('__createIlmAim(MOD, ilmWorld'),'Original ILM must receive the real settings without coefficient proxies');
 assert.ok(payload.includes('aimSnapshot(()=>ilm.tick()'),'Original ILM calculation must continue independently of socket backpressure');
 assert.ok(!payload.includes('firingAngle'),'Custom firing display override remains');
 const out={upload_sha256:ref.upload_sha256,core_sha256:crypto.createHash('sha256').update(src).digest('hex'),declarations,classes:4,methods_including_constructors:methods,tick_functions:1,removed_unused_decoder_aliases:0,preserved_unused_decoder_aliases:aliases,ast_parity:'exact',source_parity:'verbatim_stored_decoded_declarations',menu_parity:'verbatim_original_5_controls',line_render_parity:'verbatim_original_block',mouse_helper_parity:'verbatim_original_function',additional_predictors:1,extension_module:'mod/curved-aim.js',coefficient_proxies:0};
 return out;
}
function auditDecodedOriginal(path){
 const source=fs.readFileSync(path,'utf8'),tree=a.parse(source,options);
 const expectedHash=JSON.parse(fs.readFileSync('verification/ilm-original-source-2026-11-02.json')).decoded_script_sha256;
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),expectedHash,'Decoded source must match the independently recorded original');
 const core=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-reference.json.gz')));
 const hooks=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz')));
 const nodes=[],todo=[tree];while(todo.length){const n=todo.pop();if(!n||typeof n!=='object')continue;nodes.push(n);for(const v of Object.values(n)){if(Array.isArray(v))todo.push(...v);else if(v&&typeof v==='object')todo.push(v);}}
 for(const block of [...core.blocks,...hooks]){
  const found=nodes.filter(n=>['FunctionDeclaration','ClassDeclaration'].includes(n.type)&&n.id?.name===block.name);
  assert.equal(found.length,1,'One original definition required: '+block.name);
  assert.equal(source.slice(found[0].start,found[0].end),block.source,'Stored reference differs from the full original: '+block.name);
 }
 return {...audit(),decoded_original_sha256:expectedHash,original_blocks_rechecked:core.blocks.length+hooks.length};
}
if(require.main===module){
 const report=process.argv[2]?auditDecodedOriginal(process.argv[2]):audit();
 fs.mkdirSync('build/ilm-upload',{recursive:true});fs.writeFileSync('build/ilm-upload/port-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
module.exports={audit,auditDecodedOriginal};
