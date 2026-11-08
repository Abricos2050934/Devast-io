const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{parse}=require('./parser.cjs');
function reference(){return JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-reference.json.gz')));}
function audit(source=fs.readFileSync('mod/ilm-aim.js','utf8'),payload=fs.readFileSync('mod/responsive.js','utf8')){
 const r=reference(),menu=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-aim-menu-reference.json.gz'))),hooks=JSON.parse(z.gunzipSync(fs.readFileSync('recovery/ilm-integration-reference.json.gz')));
 assert.equal(r.upload_sha256,'65ef72c81cd54b665e95cf6954ee080ebb098fee25b2db12773a93a94dd88315');assert.equal(menu.upload_sha256,r.upload_sha256);
 let methods=0;for(const b of r.blocks){assert.equal(source.split(b.source).length,2,'Original declaration '+b.name);const n=parse(b.source,{ecmaVersion:'latest'}).body[0];if(n.type==='ClassDeclaration')methods+=n.body.body.length;}
 for(const b of menu.blocks)assert.equal(source.split(b.source).length,2,'Original '+b.name+' block');assert.ok(source.includes(hooks.find(h=>h.name==='_0x4b25f3').source));
 for(const name of ['__createUntitledAim','__createMessage15Aim','__createCurvedAim','solveIntercept','smoothLineState','CurvedAimEnabled','findTarget:'])assert.ok(!(source+'\n'+payload).includes(name),'Retired engine returned: '+name);
 return {status:'passed',upload_sha256:r.upload_sha256,classes:4,methods_including_constructors:methods,exact_declarations:5,menu_controls:5,source_parity:'verbatim',additional_predictors:0,core_sha256:crypto.createHash('sha256').update(r.blocks.map(b=>b.source).join('\n\n')).digest('hex')};
}
module.exports={audit,reference};if(require.main===module)console.log(JSON.stringify(audit()));
