const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const {port}=require('../tools/auto_port.cjs'),{loadReference,selectReference}=require('../tools/updater/references.cjs');
const {hash}=require('../tools/updater/static.cjs');

for(const [fixture,sha]of [['rotation-2026-11-06.js.gz','74720aca77141a313015167051e60c2dfc566310202a5b41d4445258e4937f2e'],['rotation-2026-11-08.js.gz','96dc71ca2e8db9da8e2530e2f2c494f18e63fa5dcbb505cf118f1d9602affa72'],['rotation-2026-11-08b.js.gz','1a3807a85d8b36df3e97c51b4311c8a6c51a04b3ad65687d7e2366f1e1502c9b'],['rotation-2026-11-11.js.gz','35fe5bd5c60dbb0497c80d15af896c1f889911647131c75df03a9f6286a58362']])test(fixture+' ports without registering a new baseline',{timeout:180000},()=>{
 const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const input=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'fixtures',fixture))).toString();
 const referenceSource=zlib.gunzipSync(fs.readFileSync(path.join(root,'baselines/native-2026-11-06.js.gz'))).toString();
 const ref=loadReference(root,referenceSource),raw=hash(input);
 assert.equal(raw,sha);
 assert.notEqual(selectReference(raw).sha256,raw,'Rotation must remain an unregistered input');
 const result=port(ref.source,input,ref.profile,ref.bindings,read('mod/responsive.js'),read('mod/bootstrap.js'),read('mod/ilm-aim.js'),read('vendor/dat.gui.recovered.js'));
 assert.equal(result.report.reference_sha256,'f3d84ce3b601811fd834d8204d6334e5c50858824fedd1d567bbfa6ce75096d7');
 assert.equal(result.report.decoder_blocks.length,30);assert.equal(result.profile.operations.length,36);
 assert.equal(result.report.native_network_contracts.length,8);assert.equal(result.report.required_bindings,82);
 assert.equal(typeof result.bindings.symbols.curveWeapons,'string');assert.equal(typeof result.bindings.symbols.curveBulletSpeed,'string');
 assert.equal(typeof result.roles.ballisticProjectileSpeed,'string','Native projectile speed contract must survive rotation');
 assert.equal(result.bindings.symbols.get,'get','Native get method must not borrow a renamed HTTP parameter');
 if(fixture==='rotation-2026-11-08b.js.gz'){
  assert.equal(result.bindings.symbols.nativeHomeEnter,'ⲣܓ̗','Use the native home entry after its export was renamed');
  assert.equal(result.bindings.symbols['ᴀܛ٤'],'α︉р','Tile Y uses native member accesses, not an unrelated literal key');
  assert.match(result.profile.bootstrap_anchor,/ᴀ٨ࡀ/u,'Preserve the renamed native initializer call');
 }
 if(fixture==='rotation-2026-11-11.js.gz'){
  assert.ok(result.report.decoder_blocks.some(block=>block.steps>40000000),'Large protected blocks must remain decodable within a bounded budget');
  assert.ok(result.output.includes('Ꮷ༨᠌.ᴎеᄀ( Іᴀߏ[Іᚅ̉]);'),'Preserve the new native player rejoin animation reset');
 }
 const aimAudit=require('../tools/audit_ilm_port.cjs').audit(result.aim,read('mod/responsive.js'));
 assert.equal(aimAudit.uploaded_jitter_removed,true,'Auto update must not restore the uploaded Jitter');
 assert.equal(aimAudit.classes,4,'Gun classes survive, imported JitterCon does not');
 for(const op of result.profile.operations.filter(op=>op.id.startsWith('ilm-native-angle-bookkeeping-')))assert.ok(op.after.includes('controlsAimDirection'),'Both native cursor paths yield to automatic direction');
 assert.equal(result.roles.nativeIntegritySigners.length,3);
 const preparation=result.profile.operations.find(op=>op.id==='native-play-preparation-recovery');
 const fn=require('../tools/parser.cjs').parse(preparation.before,{ecmaVersion:'latest'}).body[0],callback=fn.body.body.at(-1).expression.arguments[0];
 assert.ok(preparation.after.includes(preparation.before.slice(callback.start,callback.end)),'Keep the complete candidate-native account/server callback');
 assert.equal(result.report.output_sha256,hash(result.output));
});
