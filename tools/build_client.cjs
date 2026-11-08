// Applies reviewed, uniquely matched patches to an immutable current-game baseline.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
const crypto = require('node:crypto'), acorn = require('./parser.cjs');
const {translate} = require('./translate_payload.cjs');
const root = path.resolve(__dirname, '..');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
function once(source, before, after, id) {
  if (!before || source.split(before).length !== 2) throw Error('Expected exactly one anchor: '+id);
  return source.replace(before, () => after);
}
function assemble(baseline, profile, symbols, payload, bootstrap, gui, aim = '') {
  if (hash(baseline) !== profile.baseline_sha256) throw Error('Unsupported baseline; remapping required');
  let source = baseline.toString('utf8');
  for (const op of profile.operations) {
    if (op.expected !== 1) throw Error('Invalid patch match count');
    source = once(source, op.before, op.after, op.id);
  }
  const additions = gui+'\n'+aim+'\n'+translate(payload,symbols)+'\n'+translate(bootstrap,symbols)+'\n';
  source = once(source,profile.bootstrap_anchor,additions+profile.bootstrap_anchor,'bootstrap');
  // Hash the complete assembled input before inserting the stamp itself.
  const buildStamp={fingerprint:hash(source),nativeSha256:profile.baseline_sha256};
  source = once(source,profile.guard_anchor,profile.guard_anchor+
    'if(window.__devastClientLoaded)return;window.__devastClientLoaded=true;var __devastIntegrityCompatibility='+
    (profile.operations.filter(op=>op.id.startsWith('native-integrity-signature-')).length===3)+
    ';var __devastClientBuild=Object.freeze('+JSON.stringify(buildStamp)+');', 'double-load guard');
  acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'});
  return source;
}
function build() {
  const read = file => fs.readFileSync(path.join(root,file),'utf8');
  const reference=require('./updater/references.cjs').loadReference(root,'');
  const result=require('./auto_port.cjs').port(reference.source,reference.source,reference.profile,reference.bindings,read('mod/responsive.js'),read('mod/bootstrap.js'),read('mod/untitled-aim.js'),read('vendor/dat.gui.recovered.js'));
  const source=result.output,profile=result.profile;
  const status = {status:'static_checks_passed',source_url:profile.source_url,
    baseline_sha256:profile.baseline_sha256,output_sha256:hash(source),output_bytes:Buffer.byteLength(source),
    bindings:result.bindings.symbols,
    applied_patches:profile.operations.map(p=>p.id),live_server_test:'see build/browser-report.json',publication:'not_published'};
  const dist = path.join(root,'dist');fs.mkdirSync(dist,{recursive:true});
  // All transformations and parsing finish before either existing artifact is replaced.
  fs.writeFileSync(path.join(dist,'game.modded.js.tmp'),source);
  fs.writeFileSync(path.join(dist,'update-status.json.tmp'),JSON.stringify(status,null,2)+'\n');
  fs.renameSync(path.join(dist,'game.modded.js.tmp'),path.join(dist,'game.modded.js'));
  fs.renameSync(path.join(dist,'update-status.json.tmp'),path.join(dist,'update-status.json'));
  console.log(JSON.stringify(status,null,2));
}
module.exports={assemble,once,hash};
if(require.main===module) build();
