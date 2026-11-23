// Build the corrected owned TypeScript modules against the published native JS.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const {assemble,hash}=require('./build_client.cjs'),parser=require('./parser.cjs');
const root=path.resolve(__dirname,'..');
function build({target='verified-mod'}={}){
 assert.ok(['verified-mod','video-aim-release'].includes(target),'Unsupported source snapshot');
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const reference=JSON.parse(read(target+'/reference.json'));
 for(const[file,expected]of Object.entries(reference.input_sha256))assert.equal(hash(fs.readFileSync(path.join(root,file))),expected,'Changed pinned input: '+file);
 const native=zlib.gunzipSync(fs.readFileSync(path.join(root,target+'/native.js.gz')));
 assert.equal(hash(native),reference.native_sha256,'Changed native JavaScript');
 const typescript=require('./compile_mod.cjs').compile();
 let aim=read('mod/ilm-aim.js');
 const helpers=JSON.parse(read(target+'/aim-helpers.json'));
 assert.deepEqual(Object.keys(helpers).sort(),['__ilmPatchNativeDirection','__ilmPatchPlayerMetadata','__jitterPatchNativeFire'].sort());
 for(const[name,replacement]of Object.entries(helpers)){
  const nodes=parser.parse(aim,{ecmaVersion:'latest'}).body.filter(node=>node.id?.name===name);
  const parsed=parser.parse(replacement,{ecmaVersion:'latest'}).body;
  assert.equal(nodes.length,1);assert.equal(parsed.length,1);assert.equal(parsed[0].id?.name,name);
  aim=aim.slice(0,nodes[0].start)+replacement+aim.slice(nodes[0].end);
 }
 const profile=JSON.parse(read(target+'/profile.json')),bindings=JSON.parse(read(target+'/bindings.json'));
 const client=assemble(native,profile,bindings.symbols,read('mod/responsive.js'),read('mod/bootstrap.js'),read('vendor/dat.gui.recovered.js'),aim);
 assert.equal(hash(client),reference.expected_output_sha256,'Output differs from the tested snapshot; rerun its functional and browser checks');
 const video=target==='video-aim-release';
 const hud=video&&reference.variant==='hud';
 const dir=path.join(root,hud?'artifacts/video-aim-hud-2026-11-23':video?'artifacts/video-aim-2026-11-23':'artifacts/verified-typescript-2026-11-22');fs.mkdirSync(dir,{recursive:true});
 const override={v:1,data:[{id:'d1',matchUrl:'https://devast.io/*',on:true,rules:[{type:'fileOverride',match:'**://devast.io/js/*.js',on:true,fileId:'f1',file:client}]}]};
 const report={status:'passed',typescript,native_language:'JavaScript, immutable baseline',native_sha256:hash(native),published_original_sha256:reference.published_sha256,output_sha256:hash(client),runtime:'compiled JavaScript; TypeScript is checked during build',publication:'not_published',live_server_session:'not_tested'};
 fs.writeFileSync(path.join(dir,'client.js'),client);
 fs.writeFileSync(path.join(dir,hud?'Devast-io-Video-Aim-HUD.json':video?'Devast-io-Video-Aim.json':'Devast-io-TypeScript-Verified.json'),JSON.stringify(override,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'build-verification.json'),JSON.stringify(report,null,2)+'\n');
 return report;
}
module.exports={build};
if(require.main===module)try{console.log(JSON.stringify(build(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
