const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function reference(){return JSON.parse(z.gunzipSync(fs.readFileSync('recovery/untitled-aim-reference.json.gz')));}
function audit(source=fs.readFileSync('mod/untitled-aim.js','utf8'),installer=fs.readFileSync('mod/responsive.js','utf8')){
 const r=reference();assert.equal(r.source_sha256,'40ad33f240b76b8770c7390bd5fc9c9ad79534c7b1a6585013f513c601ad3155');
 assert.equal(r.module_sha256,'8ebf46a5fe7fc0130128f27f81eaedaeb8edd65f5dc9d6ad3ed4fb8236445612');assert.equal(sha(r.module_source),r.module_sha256);
 for(const i of r.exact_block_indices){assert.ok(r.module_source.includes(r.statements[i].source));const b=r.statements[i].source;assert.equal(source.split(b).length,2,'Exactly one original engine block '+i);}
 for(const retired of ['__createMessage15Aim','GetAllTargetsCon','AimbotCon','__createCurvedAim','__createIlmAim(','findNearestPlayerTo','distanceCoefficient + MOD.offsetCoefficient'])assert.ok(!(source+'\n'+installer).includes(retired),'Retired engine returned: '+retired);
 return {status:'passed',source_sha256:r.source_sha256,module_sha256:r.module_sha256,exact_blocks:r.exact_block_indices.length,settings:Object.keys(r.settings).length,aim_settings:Object.keys(r.settings).length-r.excluded_general_settings.length,menu_controls:r.menu_controls.length};
}
module.exports={audit,reference};if(require.main===module)console.log(JSON.stringify(audit()));
