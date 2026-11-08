const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const {port}=require('../tools/auto_port.cjs'),{loadReference,selectReference}=require('../tools/updater/references.cjs');
const {hash}=require('../tools/updater/static.cjs');

for(const [fixture,sha]of [['rotation-2026-11-06.js.gz','74720aca77141a313015167051e60c2dfc566310202a5b41d4445258e4937f2e'],['rotation-2026-11-08.js.gz','96dc71ca2e8db9da8e2530e2f2c494f18e63fa5dcbb505cf118f1d9602affa72']])test(fixture+' ports without registering a new baseline',{timeout:180000},()=>{
 const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const input=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'fixtures',fixture))).toString();
 const referenceSource=zlib.gunzipSync(fs.readFileSync(path.join(root,'baselines/native-2026-11-06.js.gz'))).toString();
 const ref=loadReference(root,referenceSource),raw=hash(input);
 assert.equal(raw,sha);
 assert.notEqual(selectReference(raw).sha256,raw,'Rotation must remain an unregistered input');
 const result=port(ref.source,input,ref.profile,ref.bindings,read('mod/responsive.js'),read('mod/bootstrap.js'),read('mod/ilm-aim.js'),read('vendor/dat.gui.recovered.js'));
 assert.equal(result.report.reference_sha256,'f3d84ce3b601811fd834d8204d6334e5c50858824fedd1d567bbfa6ce75096d7');
 assert.equal(result.report.decoder_blocks.length,30);assert.equal(result.profile.operations.length,36);
 assert.equal(result.report.native_network_contracts.length,8);assert.equal(result.report.required_bindings,79);
 assert.equal(result.bindings.symbols.get,'get','Native get method must not borrow a renamed HTTP parameter');
 for(const block of require('../tools/audit_ilm_port.cjs').reference().blocks)assert.ok(result.output.includes(block.source),'ILM source block '+block.name);
 assert.equal(result.roles.nativeIntegritySigners.length,3);
 const preparation=result.profile.operations.find(op=>op.id==='native-play-preparation-recovery');
 const fn=require('../tools/parser.cjs').parse(preparation.before,{ecmaVersion:'latest'}).body[0],callback=fn.body.body.at(-1).expression.arguments[0];
 assert.ok(preparation.after.includes(preparation.before.slice(callback.start,callback.end)),'Keep the complete candidate-native account/server callback');
 assert.equal(result.report.output_sha256,hash(result.output));
});
