// Diagnostic build: retain the original eval callers and their lexical scopes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root='/workspace/Devast-io',candidate=fs.readFileSync('/tmp/devast-deferred-candidate.path','utf8').trim();
const {analyze}=require(root+'/tools/updater/static.cjs'),{translate}=require(root+'/tools/translate_payload.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const read=f=>fs.readFileSync(path.join(candidate,f),'utf8');
const raw=read('raw.js'),native=read('native.js'),profile=JSON.parse(read('profile.json')),symbols=JSON.parse(read('bindings.json')).symbols;
const originalSigners=process.env.DEVAST_ORIGINAL_SIGNERS==='1';
const operations=profile.operations.filter(op=>!originalSigners||!op.id.startsWith('native-integrity-signature-'));
const evidence=JSON.parse(read('port-report.json')).decoder_blocks;
const a=analyze(raw),b=analyze(native),rawBlocks=new Map(a.nodes.filter(n=>n.type==='BlockStatement').map(n=>[n.start,n])),decodedBlocks=new Map(b.nodes.filter(n=>n.type==='BlockStatement').map(n=>[n.start,n]));
const pieces=[],audit=[];let rp=0,cp=0;
for(const [index,e]of evidence.entries()){
 const unchanged=raw.slice(rp,e.input_start);assert.equal(native.slice(cp,cp+unchanged.length),unchanged);
 pieces.push({kind:'raw',source:unchanged});cp+=unchanged.length;
 const block=decodedBlocks.get(cp);assert.ok(block);const decoded=native.slice(cp+2,block.end-2);assert.equal(hash(decoded),e.decoded_sha256);
 const original=rawBlocks.get(e.input_start);assert.ok(original);
 const locals=new Set(original.body.flatMap(n=>n.type==='VariableDeclaration'?n.declarations.map(d=>d.id.name):n.type==='FunctionDeclaration'?[n.id.name]:[]));
 const parsed=analyze(decoded),captures=[...new Set(parsed.nodes.filter(n=>n.type==='Identifier'&&!parsed.binding(n)&&locals.has(n.name)).map(n=>n.name))];
 const externalWrites=a.nodes.filter(n=>n.type==='AssignmentExpression'&&n.start>original.start&&n.end<original.end&&n.left.type==='Identifier').filter(n=>{const binding=a.binding(n.left);return binding?.node&&(binding.node.start<original.start||binding.node.end>original.end);});
 audit.push({block:index,decoderLocals:locals.size,capturedLocals:captures,outerWrites:externalWrites.length});
 const call=original.body.at(-1).expression;assert.equal(call.callee.name,'eval');assert.equal(call.arguments.length,1);
 pieces.push({kind:'decoded',index,original:decoded,source:decoded,raw:raw.slice(e.input_start,e.input_end),argumentStart:call.arguments[0].start-e.input_start,argumentEnd:call.arguments[0].end-e.input_start,edits:[],operations:[]});
 rp=e.input_end;cp=block.end;
}
assert.equal(raw.slice(rp),native.slice(cp));pieces.push({kind:'raw',source:raw.slice(rp)});
function replace(before,after,id){
 const hits=pieces.flatMap((p,i)=>{const count=p.source.split(before).length-1;return count?Array.from({length:count},()=>i):[];});
 assert.equal(hits.length,1,'Native edit must belong to one program piece: '+id);
 const piece=pieces[hits[0]],at=piece.source.indexOf(before);
 if(piece.kind==='decoded'){
  let prefix=0,suffix=0;while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
  while(suffix<before.length-prefix&&suffix<after.length-prefix&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
  const old=before.slice(prefix,before.length-suffix),text=after.slice(prefix,after.length-suffix);
  piece.edits.push([at+prefix,old,text]);piece.operations.push(id);
 }
 piece.source=piece.source.slice(0,at)+after+piece.source.slice(at+before.length);
}
for(const op of operations){assert.equal(op.expected,1);replace(op.before,op.after,op.id);}
const gui=fs.readFileSync(root+'/vendor/dat.gui.recovered.js','utf8');
const host=translate(fs.readFileSync(root+'/mod/responsive.js','utf8'),symbols);
const bootstrap=translate(fs.readFileSync(root+'/mod/bootstrap.js','utf8'),symbols);
const own=read('ilm-aim.js')+'\n'+host;
replace(profile.bootstrap_anchor,gui+'\n'+bootstrap+'\nObject.defineProperty(__responsiveMod,"nativeRuntimeDiagnostics",{value:()=>({preservedEval:true,runs:__devastEvalRuns.slice()})});\n'+profile.bootstrap_anchor,'bootstrap');
const table=pieces.filter(p=>p.kind==='decoded').map(p=>({length:p.original.length,edits:p.edits}));
for(const p of pieces.filter(p=>p.kind==='decoded')){
 let value=p.original;for(const [at,old,text]of p.edits){assert.equal(value.slice(at,at+old.length),old);value=value.slice(0,at)+text+value.slice(at+old.length);}assert.equal(value,p.source);
}
const helper=`
var __responsiveMod,__responsiveView;
var __devastEvalEdits=${JSON.stringify(table)},__devastEvalRuns=new Array(${table.length}).fill(0);
function __patchDevastNativeEval(value,index){
 const patch=__devastEvalEdits[index];
 if(typeof value!=="string"||value.length!==patch.length)throw Error("Native program differs from reviewed block "+index);
 for(const edit of patch.edits){const at=edit[0],old=edit[1];if(value.slice(at,at+old.length)!==old)throw Error("Native edit differs in block "+index);value=value.slice(0,at)+edit[2]+value.slice(at+old.length);}
 __devastEvalRuns[index]++;return value;
}
${own}\n`;
let output=pieces.map(p=>{
 if(p.kind==='raw')return p.source;
 if(!p.edits.length)return p.raw;
 return p.raw.slice(0,p.argumentStart)+'__patchDevastNativeEval('+p.raw.slice(p.argumentStart,p.argumentEnd)+','+p.index+')'+p.raw.slice(p.argumentEnd);
}).join('');
assert.equal(output.split(profile.guard_anchor).length,2);
const metadata={fingerprint:hash(output+helper),nativeSha256:hash(native),rawNativeSha256:hash(raw),preservedNativeEval:true};
output=output.replace(profile.guard_anchor,()=>profile.guard_anchor+'if(window.__devastClientLoaded)return;window.__devastClientLoaded=true;var __devastIntegrityCompatibility='+(!originalSigners)+';var __devastClientBuild=Object.freeze('+JSON.stringify(metadata)+');'+helper);
require(root+'/tools/parser.cjs').parse(output,{ecmaVersion:'latest'});
const config=JSON.parse(fs.readFileSync(root+'/artifacts/typescript-2026-11-22/Devast-io-TypeScript.json'));
config.data[0].rules[0].file=output;
const stem=originalSigners?'Devast-io-Original-Signers':'Devast-io-Preserved-Runtime';
fs.writeFileSync(path.join(__dirname,stem+'.json'),JSON.stringify(config,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,originalSigners?'client-original-signers.js':'client.js'),output);
const report={status:'built_not_live_verified',originalNativeSigners:originalSigners,outputSha256:hash(output),rawSha256:hash(raw),bytes:Buffer.byteLength(output),nativePrograms:evidence.length,patchOperations:operations.length,decoderAudit:audit,editedPrograms:pieces.filter(p=>p.kind==='decoded'&&p.edits.length).map(p=>({index:p.index,operations:p.operations})),staticReplay:'Each runtime edit reproduces the canonical patched native program exactly; original eval callers and decoder statements retained'};
fs.writeFileSync(path.join(__dirname,originalSigners?'build-original-signers.json':'build-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,sha256:report.outputSha256,bytes:report.bytes,editedPrograms:report.editedPrograms.length,capturedDecoderLocals:audit.filter(x=>x.capturedLocals.length),decoderOuterWrites:audit.filter(x=>x.outerWrites)}));
